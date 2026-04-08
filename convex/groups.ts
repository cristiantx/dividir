import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { computeBalances, computeSuggestedTransfers } from "./lib/balances";
import { requireCurrentUser, requireGroupMember } from "./lib/auth";

const groupIcon = v.union(
  v.literal("plane"),
  v.literal("house"),
  v.literal("utensils"),
  v.literal("ticket"),
);

function statusLabel(amountMinor: number) {
  if (amountMinor > 0) return "Te deben";
  if (amountMinor < 0) return "Debes";
  return "Saldado";
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
        currencyCode: loaded.group.currencyCode,
        groupId: loaded.group._id,
        icon: loaded.group.icon ?? "plane",
        memberCount: loaded.members.length,
        name: loaded.group.name,
        ownBalanceMinor: loaded.ownBalanceMinor,
        statusLabel: statusLabel(loaded.ownBalanceMinor),
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
        ctx.db.query("expenseShares").withIndex("by_expense", (query) => query.eq("expenseId", expense._id)).collect(),
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
          isCurrentUser: member.linkedUserId === loaded.membership.linkedUserId,
          memberId: member._id,
          role: member.role,
        };
      }),
      name: loaded.group.name,
      ownBalanceMinor: loaded.ownBalanceMinor,
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
    if (membership.role !== "owner") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Solo el owner puede editar el grupo.",
      });
    }

    await ctx.db.patch("groups", args.groupId, {
      currencyCode: args.currencyCode,
      name: args.name,
    });
    return null;
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

export const addLocalMember = mutation({
  args: {
    displayName: v.string(),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireGroupMember(ctx, args.groupId);
    if (membership.role !== "owner") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Solo el owner puede agregar miembros.",
      });
    }

    return await ctx.db.insert("groupMembers", {
      displayName: args.displayName,
      groupId: args.groupId,
      inviteUuid: crypto.randomUUID(),
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
    if (membership.role !== "owner") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Solo el owner puede quitar miembros.",
      });
    }

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
    if (membership.role !== "owner") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Solo el owner puede archivar el grupo.",
      });
    }

    const loaded = await loadGroupData(ctx, args.groupId);
    if (loaded.group.archivedAt) {
      return null;
    }

    const hasUnsettledBalances = loaded.transferSuggestions.length > 0;
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
    if (membership.role !== "owner") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Solo el owner puede restaurar el grupo.",
      });
    }

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
