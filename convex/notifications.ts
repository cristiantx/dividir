import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

const notificationValidator = v.object({
  actorName: v.string(),
  amountMinor: v.int64(),
  body: v.string(),
  createdAt: v.number(),
  currencyCode: v.string(),
  expenseId: v.optional(v.id("expenses")),
  groupId: v.id("groups"),
  groupName: v.string(),
  isRead: v.boolean(),
  kind: v.union(v.literal("expense_added"), v.literal("settlement_created")),
  notificationId: v.id("notifications"),
  settlementId: v.optional(v.id("settlements")),
  title: v.string(),
});

export const listUnread = query({
  args: {},
  returns: v.array(notificationValidator),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_is_read_and_created_at", (query) =>
        query.eq("recipientUserId", user._id).eq("isRead", false),
      )
      .order("desc")
      .take(20);

    return notifications.map((notification) => ({
      actorName: notification.actorName,
      amountMinor: notification.amountMinor,
      body: notification.body,
      createdAt: notification.createdAt,
      currencyCode: notification.currencyCode,
      expenseId: notification.expenseId,
      groupId: notification.groupId,
      groupName: notification.groupName,
      isRead: notification.isRead,
      kind: notification.kind,
      notificationId: notification._id,
      settlementId: notification.settlementId,
      title: notification.title,
    }));
  },
});

export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_is_read_and_created_at", (query) =>
        query.eq("recipientUserId", user._id).eq("isRead", false),
      )
      .collect();

    return notifications.length;
  },
});

export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (notification === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Notificación no encontrada." });
    }

    if (notification.recipientUserId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "No tienes acceso a esta notificación." });
    }

    if (notification.isRead) {
      return null;
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
    return null;
  },
});

export const markAllRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_is_read_and_created_at", (query) =>
        query.eq("recipientUserId", user._id).eq("isRead", false),
      )
      .collect();

    await Promise.all(notifications.map((notification) => ctx.db.patch(notification._id, { isRead: true })));
    return null;
  },
});

export async function createExpenseNotifications(
  ctx: MutationCtx,
  args: {
    actorName: string;
    actorUserId: Id<"users">;
    amountMinor: bigint;
    currencyCode: string;
    expenseId: Id<"expenses">;
    groupId: Id<"groups">;
    groupName: string;
    paidByMemberId: Id<"groupMembers">;
    shares: Array<{ memberId: Id<"groupMembers"> }>;
  },
) {
  const memberIds = new Set([args.paidByMemberId, ...args.shares.map((share) => share.memberId)]);
  const members = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_status", (query) => query.eq("groupId", args.groupId).eq("status", "active"))
    .collect();

  const recipients = new Set<string>();
  for (const member of members) {
    if (!memberIds.has(member._id) || member.linkedUserId === undefined) {
      continue;
    }

    if (member.linkedUserId === args.actorUserId) {
      continue;
    }

    recipients.add(member.linkedUserId);
  }

  await Promise.all(
    [...recipients].map((recipientUserId) =>
      ctx.db.insert("notifications", {
        actorName: args.actorName,
        amountMinor: args.amountMinor,
        body: `${args.actorName} agregó un gasto en ${args.groupName}.`,
        createdAt: Date.now(),
        currencyCode: args.currencyCode,
        expenseId: args.expenseId,
        groupId: args.groupId,
        groupName: args.groupName,
        isRead: false,
        kind: "expense_added",
        recipientUserId: recipientUserId as Id<"users">,
        settlementId: undefined,
        title: `Nuevo gasto en ${args.groupName}`,
      }),
    ),
  );
}

export async function createSettlementNotifications(
  ctx: MutationCtx,
  args: {
    actorName: string;
    actorUserId: Id<"users">;
    amountMinor: bigint;
    currencyCode: string;
    fromMemberId: Id<"groupMembers">;
    groupId: Id<"groups">;
    groupName: string;
    settlementId: Id<"settlements">;
    toMemberId: Id<"groupMembers">;
  },
) {
  const members = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_status", (query) => query.eq("groupId", args.groupId).eq("status", "active"))
    .collect();

  const involvedMemberIds = new Set([args.fromMemberId, args.toMemberId]);
  const recipients = new Set<string>();
  for (const member of members) {
    if (!involvedMemberIds.has(member._id) || member.linkedUserId === undefined) {
      continue;
    }

    if (member.linkedUserId === args.actorUserId) {
      continue;
    }

    recipients.add(member.linkedUserId);
  }

  await Promise.all(
    [...recipients].map((recipientUserId) =>
      ctx.db.insert("notifications", {
        actorName: args.actorName,
        amountMinor: args.amountMinor,
        body: `${args.actorName} registró una liquidación en ${args.groupName}.`,
        createdAt: Date.now(),
        currencyCode: args.currencyCode,
        expenseId: undefined,
        groupId: args.groupId,
        groupName: args.groupName,
        isRead: false,
        kind: "settlement_created",
        recipientUserId: recipientUserId as Id<"users">,
        settlementId: args.settlementId,
        title: `Nueva liquidación en ${args.groupName}`,
      }),
    ),
  );
}
