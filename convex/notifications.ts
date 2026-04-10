import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
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

const pushSubscriptionValidator = v.object({
  auth: v.string(),
  endpoint: v.string(),
  p256dh: v.string(),
  userAgent: v.optional(v.string()),
});

const pushEnv = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

function getVapidPublicKey() {
  return pushEnv?.PUSH_VAPID_PUBLIC_KEY?.trim() || null;
}

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

export const pushPublicKey = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: () => {
    return getVapidPublicKey();
  },
});

export const upsertPushSubscription = mutation({
  args: pushSubscriptionValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (query) => query.eq("endpoint", args.endpoint))
      .unique();

    const now = Date.now();

    if (existing === null) {
      await ctx.db.insert("pushSubscriptions", {
        auth: args.auth,
        createdAt: now,
        endpoint: args.endpoint,
        p256dh: args.p256dh,
        recipientUserId: user._id,
        updatedAt: now,
        userAgent: args.userAgent,
      });
      return null;
    }

    await ctx.db.patch(existing._id, {
      auth: args.auth,
      p256dh: args.p256dh,
      recipientUserId: user._id,
      updatedAt: now,
      userAgent: args.userAgent,
    });
    return null;
  },
});

export const removePushSubscription = mutation({
  args: {
    endpoint: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (query) => query.eq("endpoint", args.endpoint))
      .unique();

    if (existing === null || existing.recipientUserId !== user._id) {
      return null;
    }

    await ctx.db.delete(existing._id);
    return null;
  },
});

export const removePushSubscriptionByEndpoint = internalMutation({
  args: {
    endpoint: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (query) => query.eq("endpoint", args.endpoint))
      .unique();

    if (existing !== null) {
      await ctx.db.delete(existing._id);
    }

    return null;
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

    await Promise.all(
      notifications.map((notification) => ctx.db.patch(notification._id, { isRead: true })),
    );
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
    .withIndex("by_group_and_status", (query) =>
      query.eq("groupId", args.groupId).eq("status", "active"),
    )
    .collect();

  const recipients = new Set<Id<"users">>();
  for (const member of members) {
    if (!memberIds.has(member._id) || member.linkedUserId === undefined) {
      continue;
    }

    if (member.linkedUserId === args.actorUserId) {
      continue;
    }

    recipients.add(member.linkedUserId);
  }

  const insertedNotifications = await Promise.all(
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
        recipientUserId,
        settlementId: undefined,
        title: `Nuevo gasto en ${args.groupName}`,
      }),
    ),
  );

  const messages = await collectPushMessages(ctx, insertedNotifications, "/notifications");
  if (messages.length > 0) {
    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPushNotifications, { messages });
  }
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
    .withIndex("by_group_and_status", (query) =>
      query.eq("groupId", args.groupId).eq("status", "active"),
    )
    .collect();

  const involvedMemberIds = new Set([args.fromMemberId, args.toMemberId]);
  const recipients = new Set<Id<"users">>();
  for (const member of members) {
    if (!involvedMemberIds.has(member._id) || member.linkedUserId === undefined) {
      continue;
    }

    if (member.linkedUserId === args.actorUserId) {
      continue;
    }

    recipients.add(member.linkedUserId);
  }

  const insertedNotifications = await Promise.all(
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
        recipientUserId,
        settlementId: args.settlementId,
        title: `Nueva liquidación en ${args.groupName}`,
      }),
    ),
  );

  const messages = await collectPushMessages(ctx, insertedNotifications, "/notifications");
  if (messages.length > 0) {
    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPushNotifications, { messages });
  }
}

async function collectPushMessages(
  ctx: MutationCtx,
  notificationIds: Array<Id<"notifications">>,
  url: string,
) {
  const messages: Array<{
    auth: string;
    body: string;
    endpoint: string;
    notificationId: Id<"notifications">;
    p256dh: string;
    title: string;
    url: string;
  }> = [];

  for (const notificationId of notificationIds) {
    const notification = await ctx.db.get(notificationId);
    if (notification === null) {
      continue;
    }

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_recipient", (query) =>
        query.eq("recipientUserId", notification.recipientUserId),
      )
      .collect();

    for (const subscription of subscriptions) {
      messages.push({
        auth: subscription.auth,
        body: notification.body,
        endpoint: subscription.endpoint,
        notificationId: notification._id,
        p256dh: subscription.p256dh,
        title: notification.title,
        url,
      });
    }
  }

  return messages;
}
