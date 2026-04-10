import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { computeBalances, computeSuggestedTransfers } from "./lib/balances";
import {
  getCurrentUserOrNull,
  getGroupPermissions,
  requireCurrentUser,
  requireGroupMember,
  requireGroupPermission,
} from "./lib/auth";

const groupIcon = v.union(
  v.literal("plane"),
  v.literal("house"),
  v.literal("utensils"),
  v.literal("ticket"),
);

const ownerOnlyMessages = {
  archive: "Solo el owner puede archivar el grupo.",
  editInvite: "Solo el owner puede gestionar invitaciones.",
  deleteGroup: "Solo el owner puede eliminar el grupo.",
  manageMembers: "Solo el owner puede gestionar miembros.",
  unarchive: "Solo el owner puede restaurar el grupo.",
} as const;

function statusLabel(amountMinor: number) {
  if (amountMinor > 0) return "Te deben";
  if (amountMinor < 0) return "Debes";
  return "Saldado";
}

function createInviteToken() {
  return crypto.randomUUID();
}

function buildInviteUrl(origin: string, inviteToken: string) {
  return `${origin.trim().replace(/\/+$/, "")}/join/${inviteToken}`;
}

async function loadMembershipsByLinkedUser(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">,
) {
  return await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_linked_user", (query) =>
      query.eq("groupId", groupId).eq("linkedUserId", userId),
    )
    .collect();
}

function getMembershipByStatus(
  memberships: Doc<"groupMembers">[],
  status: Doc<"groupMembers">["status"],
) {
  return memberships.find((membership) => membership.status === status) ?? null;
}

async function ensureGroupInviteToken(ctx: MutationCtx, groupId: Id<"groups">) {
  const group = await ctx.db.get("groups", groupId);
  if (group === null) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Grupo no encontrado." });
  }

  if (group.inviteToken) {
    return { group, inviteToken: group.inviteToken };
  }

  const inviteToken = createInviteToken();
  await ctx.db.patch("groups", groupId, { inviteToken });
  return { group: { ...group, inviteToken }, inviteToken };
}

async function deleteGroupCascade(ctx: MutationCtx, groupId: Id<"groups">) {
  const members = await ctx.db
    .query("groupMembers")
    .withIndex("by_group", (query) => query.eq("groupId", groupId))
    .collect();
  const expenses = await ctx.db
    .query("expenses")
    .withIndex("by_group", (query) => query.eq("groupId", groupId))
    .collect();
  const settlements = await ctx.db
    .query("settlements")
    .withIndex("by_group", (query) => query.eq("groupId", groupId))
    .collect();
  const expenseShares = (
    await Promise.all(
      expenses.map((expense) =>
        ctx.db
          .query("expenseShares")
          .withIndex("by_expense", (query) => query.eq("expenseId", expense._id))
          .collect(),
      ),
    )
  ).flat();

  await Promise.all(expenseShares.map((share) => ctx.db.delete(share._id)));
  await Promise.all(expenses.map((expense) => ctx.db.delete(expense._id)));
  await Promise.all(settlements.map((settlement) => ctx.db.delete(settlement._id)));
  await Promise.all(members.map((member) => ctx.db.delete(member._id)));
  await ctx.db.delete(groupId);
}

async function listGroupSummariesByArchiveState(
  ctx: QueryCtx,
  userId: Id<"users">,
  archived: boolean,
) {
  const memberships = await ctx.db
    .query("groupMembers")
    .withIndex("by_linked_user_and_status", (query) =>
      query.eq("linkedUserId", userId).eq("status", "active"),
    )
    .collect();

  const groups = await Promise.all(
    memberships.map(async (membership) => {
      const group = await ctx.db.get("groups", membership.groupId);
      if (group === null || Boolean(group.archivedAt) !== archived) {
        return null;
      }

      const loaded = await loadGroupData(ctx, membership.groupId);
      return {
        archivedAt: loaded.group.archivedAt ?? null,
        canUnarchive: getGroupPermissions(membership.role).canUnarchiveGroup,
        currencyCode: loaded.group.currencyCode,
        groupId: loaded.group._id,
        icon: loaded.group.icon ?? "plane",
        memberCount: loaded.members.length,
        name: loaded.group.name,
        ownBalanceMinor: loaded.ownBalanceMinor,
        statusLabel: statusLabel(loaded.ownBalanceMinor),
        viewerRole: membership.role,
      };
    }),
  );

  return groups
    .filter((group) => group !== null)
    .sort((left, right) =>
      archived
        ? (right.archivedAt ?? 0) - (left.archivedAt ?? 0)
        : right.ownBalanceMinor - left.ownBalanceMinor,
    );
}

async function loadGroupData(ctx: QueryCtx, groupId: Id<"groups">) {
  const { membership } = await requireGroupMember(ctx, groupId);
  const group = await ctx.db.get("groups", groupId);
  if (group === null) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Grupo no encontrado." });
  }

  const members = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_status", (query) =>
      query.eq("groupId", groupId).eq("status", "active"),
    )
    .collect();

  const expenses = await ctx.db
    .query("expenses")
    .withIndex("by_group_and_spent_at", (query) => query.eq("groupId", groupId))
    .order("desc")
    .collect();

  const settlements = await ctx.db
    .query("settlements")
    .withIndex("by_group_and_settled_at", (query) => query.eq("groupId", groupId))
    .order("desc")
    .collect();

  const expenseShares = (
    await Promise.all(
      expenses.map((expense) =>
        ctx.db
          .query("expenseShares")
          .withIndex("by_expense", (query) => query.eq("expenseId", expense._id))
          .collect(),
      ),
    )
  ).flat();

  const balances = computeBalances({ expenses, expenseShares, members, settlements });
  const transferSuggestions = computeSuggestedTransfers(balances);
  const memberById = new Map(members.map((member) => [member._id, member]));
  const ownBalanceMinor =
    balances.find((balance) => balance.memberId === membership._id)?.amountMinor ?? 0;

  return {
    balances,
    expenseShares,
    expenses,
    group,
    membership,
    memberById,
    members,
    ownBalanceMinor,
    settlements,
    transferSuggestions,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await listGroupSummariesByArchiveState(ctx, user._id, false);
  },
});

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await listGroupSummariesByArchiveState(ctx, user._id, true);
  },
});

export const detail = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const loaded = await loadGroupData(ctx, args.groupId);
    if (loaded.group.archivedAt) {
      return null;
    }

    const permissions = getGroupPermissions(loaded.membership.role);

    return {
      currencyCode: loaded.group.currencyCode,
      groupId: loaded.group._id,
      icon: loaded.group.icon ?? "plane",
      members: loaded.members.map((member) => {
        const amountMinor =
          loaded.balances.find((balance) => balance.memberId === member._id)?.amountMinor ?? 0;
        return {
          avatarUrl: member.avatarUrl ?? null,
          balanceMinor: amountMinor,
          displayName: member.displayName,
          isCurrentUser: member._id === loaded.membership._id,
          memberId: member._id,
          role: member.role,
        };
      }),
      name: loaded.group.name,
      ownBalanceMinor: loaded.ownBalanceMinor,
      permissions,
      recentExpenses: loaded.expenses.slice(0, 6).map((expense) => ({
        amountMinor: Number(expense.amountMinor),
        expenseId: expense._id,
        paidBy:
          loaded.memberById.get(expense.paidByMemberId)?.displayName ?? "Miembro eliminado",
        spentAt: expense.spentAt,
        title: expense.title,
      })),
      suggestedTransfers: loaded.transferSuggestions.map((transfer) => ({
        amountMinor: transfer.amountMinor,
        fromMemberId: transfer.fromMemberId,
        fromName: loaded.memberById.get(transfer.fromMemberId)?.displayName ?? "Miembro",
        toMemberId: transfer.toMemberId,
        toName: loaded.memberById.get(transfer.toMemberId)?.displayName ?? "Miembro",
      })),
      viewerRole: loaded.membership.role,
    };
  },
});

export const invitePreview = query({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite_token", (query) => query.eq("inviteToken", args.inviteToken))
      .unique();

    if (group === null) {
      return { status: "invalid" as const };
    }

    const activeMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_status", (query) =>
        query.eq("groupId", group._id).eq("status", "active"),
      )
      .collect();

    const preview = {
      currencyCode: group.currencyCode,
      groupId: group._id,
      icon: group.icon ?? "plane",
      memberCount: activeMembers.length,
      name: group.name,
    };

    if (group.archivedAt) {
      return {
        ...preview,
        alreadyMember: false,
        status: "archived" as const,
      };
    }

    const user = await getCurrentUserOrNull(ctx);
    if (user === null) {
      return {
        ...preview,
        alreadyMember: false,
        status: "ready" as const,
      };
    }

    const memberships = await loadMembershipsByLinkedUser(ctx, group._id, user._id);
    const activeMembership = getMembershipByStatus(memberships, "active");
    if (activeMembership !== null) {
      return {
        ...preview,
        alreadyMember: true,
        status: "joined" as const,
      };
    }

    if (getMembershipByStatus(memberships, "removed") !== null) {
      return {
        ...preview,
        alreadyMember: false,
        status: "removed" as const,
      };
    }

    return {
      ...preview,
      alreadyMember: false,
      status: "ready" as const,
    };
  },
});

export const updateSettings = mutation({
  args: {
    currencyCode: v.string(),
    groupId: v.id("groups"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canEditGroup", "No tienes permisos para editar el grupo.");

    await ctx.db.patch("groups", args.groupId, {
      currencyCode: args.currencyCode,
      name: args.name,
    });
    return null;
  },
});

export const getInviteLink = mutation({
  args: {
    groupId: v.id("groups"),
    origin: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canManageInvite", ownerOnlyMessages.editInvite);

    const { inviteToken } = await ensureGroupInviteToken(ctx, args.groupId);
    return {
      inviteToken,
      inviteUrl: buildInviteUrl(args.origin, inviteToken),
    };
  },
});

export const regenerateInviteLink = mutation({
  args: {
    groupId: v.id("groups"),
    origin: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canManageInvite", ownerOnlyMessages.editInvite);

    const group = await ctx.db.get("groups", args.groupId);
    if (group === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Grupo no encontrado." });
    }

    const inviteToken = createInviteToken();
    await ctx.db.patch("groups", args.groupId, { inviteToken });
    return {
      inviteToken,
      inviteUrl: buildInviteUrl(args.origin, inviteToken),
    };
  },
});

export const create = mutation({
  args: {
    currencyCode: v.string(),
    icon: v.optional(groupIcon),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const groupId = await ctx.db.insert("groups", {
      createdByUserId: user._id,
      currencyCode: args.currencyCode,
      icon: args.icon ?? "plane",
      inviteToken: createInviteToken(),
      name: args.name,
    });

    await ctx.db.insert("groupMembers", {
      avatarUrl: user.image,
      displayName: user.name ?? user.email ?? "Yo",
      groupId,
      joinedAt: Date.now(),
      linkedUserId: user._id,
      role: "owner",
      source: "owner",
      status: "active",
    });

    return groupId;
  },
});

export const joinViaInvite = mutation({
  args: {
    displayName: v.string(),
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const displayName = args.displayName.trim();
    if (!displayName) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Ingresa un nombre para unirte al grupo.",
      });
    }

    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite_token", (query) => query.eq("inviteToken", args.inviteToken))
      .unique();

    if (group === null) {
      throw new ConvexError({
        code: "INVALID_INVITE",
        message: "La invitación ya no es válida.",
      });
    }

    if (group.archivedAt) {
      throw new ConvexError({
        code: "ARCHIVED_GROUP",
        message: "Este grupo está archivado y ya no acepta invitaciones.",
      });
    }

    const memberships = await loadMembershipsByLinkedUser(ctx, group._id, user._id);
    const activeMembership = getMembershipByStatus(memberships, "active");
    if (activeMembership !== null) {
      return {
        alreadyMember: true,
        groupId: group._id,
      };
    }

    if (getMembershipByStatus(memberships, "removed") !== null) {
      throw new ConvexError({
        code: "REMOVED_MEMBER",
        message: "Ya no tienes acceso a este grupo.",
      });
    }

    await ctx.db.insert("groupMembers", {
      avatarUrl: user.image,
      displayName,
      groupId: group._id,
      joinedAt: Date.now(),
      linkedUserId: user._id,
      role: "editor",
      source: "invite",
      status: "active",
    });

    if (!user.name?.trim()) {
      await ctx.db.patch("users", user._id, { name: displayName });
    }

    return {
      alreadyMember: false,
      groupId: group._id,
    };
  },
});

export const addLocalMember = mutation({
  args: {
    displayName: v.string(),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canManageMembers", ownerOnlyMessages.manageMembers);

    return await ctx.db.insert("groupMembers", {
      displayName: args.displayName,
      groupId: args.groupId,
      joinedAt: Date.now(),
      role: "member",
      source: "local",
      status: "active",
    });
  },
});

export const removeMember = mutation({
  args: {
    groupId: v.id("groups"),
    memberId: v.id("groupMembers"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canManageMembers", ownerOnlyMessages.manageMembers);

    const member = await ctx.db.get("groupMembers", args.memberId);
    if (member === null || member.groupId !== args.groupId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Miembro no encontrado." });
    }

    await ctx.db.patch("groupMembers", args.memberId, { status: "removed" });
    return null;
  },
});

export const archive = mutation({
  args: {
    confirmUnsettled: v.optional(v.boolean()),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canArchiveGroup", ownerOnlyMessages.archive);

    const group = await ctx.db.get("groups", args.groupId);
    if (group === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Grupo no encontrado." });
    }
    if (group.archivedAt) {
      return null;
    }

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_status", (query) =>
        query.eq("groupId", args.groupId).eq("status", "active"),
      )
      .collect();
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group_and_spent_at", (query) => query.eq("groupId", args.groupId))
      .collect();
    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group_and_settled_at", (query) => query.eq("groupId", args.groupId))
      .collect();
    const expenseShares = (
      await Promise.all(
        expenses.map((expense) =>
          ctx.db
            .query("expenseShares")
            .withIndex("by_expense", (query) => query.eq("expenseId", expense._id))
            .collect(),
        ),
      )
    ).flat();

    const balances = computeBalances({ expenses, expenseShares, members, settlements });
    const transferSuggestions = computeSuggestedTransfers(balances);
    const hasUnsettledBalances = transferSuggestions.length > 0;
    if (hasUnsettledBalances && !args.confirmUnsettled) {
      throw new ConvexError({
        code: "UNSETTLED_GROUP",
        message: "El grupo todavía tiene saldos pendientes.",
      });
    }

    await ctx.db.patch("groups", args.groupId, {
      archivedAt: Date.now(),
    });

    return null;
  },
});

export const unarchive = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canUnarchiveGroup", ownerOnlyMessages.unarchive);

    const group = await ctx.db.get("groups", args.groupId);
    if (group === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Grupo no encontrado." });
    }

    if (!group.archivedAt) {
      return null;
    }

    await ctx.db.patch("groups", args.groupId, {
      archivedAt: undefined,
    });

    return null;
  },
});

export const deleteGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    requireGroupPermission(membership, "canDeleteGroup", ownerOnlyMessages.deleteGroup);

    const group = await ctx.db.get("groups", args.groupId);
    if (group === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Grupo no encontrado." });
    }

    await deleteGroupCascade(ctx, args.groupId);
    return null;
  },
});
