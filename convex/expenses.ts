import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import { requireCurrentUser, requireGroupMember } from "./lib/auth";

const shareValidator = v.object({
  amountMinor: v.int64(),
  memberId: v.id("groupMembers"),
  percentage: v.optional(v.number()),
});

export const create = mutation({
  args: {
    amountMinor: v.int64(),
    clientMutationId: v.optional(v.string()),
    currencyCode: v.string(),
    description: v.optional(v.string()),
    groupId: v.id("groups"),
    paidByMemberId: v.id("groupMembers"),
    shares: v.array(shareValidator),
    splitMethod: v.union(v.literal("equal"), v.literal("percentage")),
    spentAt: v.number(),
    title: v.string(),
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

    const totalSharesMinor = args.shares.reduce(
      (sum, share) => sum + Number(share.amountMinor),
      0,
    );

    if (totalSharesMinor !== Number(args.amountMinor)) {
      throw new ConvexError({
        code: "INVALID_SPLIT",
        message: "La suma de partes no coincide con el monto total.",
      });
    }

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_status", (query) =>
        query.eq("groupId", args.groupId).eq("status", "active"),
      )
      .collect();
    const memberIds = new Set(members.map((member) => member._id));

    if (!memberIds.has(args.paidByMemberId)) {
      throw new ConvexError({
        code: "INVALID_PAYER",
        message: "El pagador no pertenece al grupo.",
      });
    }

    for (const share of args.shares) {
      if (!memberIds.has(share.memberId)) {
        throw new ConvexError({
          code: "INVALID_MEMBER",
          message: "Uno de los participantes no pertenece al grupo.",
        });
      }
    }

    const expenseId = await ctx.db.insert("expenses", {
      amountMinor: args.amountMinor,
      createdAt: Date.now(),
      createdByUserId: user._id,
      currencyCode: args.currencyCode,
      description: args.description,
      groupId: args.groupId,
      note: undefined,
      paidByMemberId: args.paidByMemberId,
      splitMethod: args.splitMethod,
      spentAt: args.spentAt,
      title: args.title,
    });

    await Promise.all(
      args.shares.map((share) =>
        ctx.db.insert("expenseShares", {
          amountMinor: share.amountMinor,
          expenseId,
          memberId: share.memberId,
          percentage: share.percentage,
        }),
      ),
    );

    if (args.clientMutationId) {
      await ctx.db.insert("offlineReceipts", {
        clientMutationId: args.clientMutationId,
        mutationName: "expenses.create",
        processedAt: Date.now(),
      });
    }

    return expenseId;
  },
});
