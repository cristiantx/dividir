import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { requireCurrentUser, requireGroupMember } from "./lib/auth";

const paymentMethod = v.union(
  v.literal("cash"),
  v.literal("bank"),
  v.literal("crypto"),
  v.literal("other"),
);

export const create = mutation({
  args: {
    amountMinor: v.int64(),
    clientMutationId: v.optional(v.string()),
    currencyCode: v.string(),
    fromMemberId: v.id("groupMembers"),
    groupId: v.id("groups"),
    paymentMethod,
    settledAt: v.number(),
    toMemberId: v.id("groupMembers"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    await requireGroupMember(ctx, args.groupId);

    if (args.clientMutationId) {
      const existingReceipt = await ctx.db
        .query("offlineReceipts")
        .withIndex("by_client_mutation_id", (query) =>
          query.eq("clientMutationId", args.clientMutationId!),
        )
        .unique();
      if (existingReceipt !== null) {
        return null;
      }
    }

    const settlementId = await ctx.db.insert("settlements", {
      amountMinor: args.amountMinor,
      createdByUserId: user._id,
      currencyCode: args.currencyCode,
      fromMemberId: args.fromMemberId,
      groupId: args.groupId,
      paymentMethod: args.paymentMethod,
      settledAt: args.settledAt,
      toMemberId: args.toMemberId,
    });

    if (args.clientMutationId) {
      await ctx.db.insert("offlineReceipts", {
        clientMutationId: args.clientMutationId,
        mutationName: "settlements.create",
        processedAt: Date.now(),
      });
    }

    return settlementId;
  },
});
