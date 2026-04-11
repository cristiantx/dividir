import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { createExpenseNotifications } from "./notifications";
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
    const group = await ctx.db.get(args.groupId);

    if (group === null) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Grupo no encontrado.",
      });
    }

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
          message: "Uno de los miembros no pertenece al grupo.",
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

    await createExpenseNotifications(ctx, {
      actorName: user.name?.trim() || user.email || "Alguien",
      actorUserId: user._id,
      amountMinor: args.amountMinor,
      currencyCode: args.currencyCode,
      expenseId,
      groupId: args.groupId,
      groupName: group.name,
      paidByMemberId: args.paidByMemberId,
      shares: args.shares,
    });

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

export const get = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (expense === null) {
      return null;
    }

    await requireGroupMember(ctx, expense.groupId);

    const shares = await ctx.db
      .query("expenseShares")
      .withIndex("by_expense", (query) => query.eq("expenseId", expense._id))
      .collect();

    return {
      amountMinor: Number(expense.amountMinor),
      expenseId: expense._id,
      groupId: expense.groupId,
      paidByMemberId: expense.paidByMemberId,
      shares: shares.map((share) => ({
        amountMinor: Number(share.amountMinor),
        memberId: share.memberId,
        percentage: share.percentage,
      })),
      splitMethod: expense.splitMethod,
      spentAt: expense.spentAt,
      title: expense.title,
    };
  },
});

export const update = mutation({
  args: {
    amountMinor: v.int64(),
    currencyCode: v.string(),
    description: v.optional(v.string()),
    expenseId: v.id("expenses"),
    groupId: v.id("groups"),
    paidByMemberId: v.id("groupMembers"),
    shares: v.array(shareValidator),
    splitMethod: v.union(v.literal("equal"), v.literal("percentage")),
    spentAt: v.number(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (expense === null) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Gasto no encontrado.",
      });
    }

    await requireCurrentUser(ctx);
    await requireGroupMember(ctx, expense.groupId);

    if (expense.groupId !== args.groupId) {
      throw new ConvexError({
        code: "INVALID_GROUP",
        message: "No se puede mover el gasto a otro grupo.",
      });
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
          message: "Uno de los miembros no pertenece al grupo.",
        });
      }
    }

    await ctx.db.patch(args.expenseId, {
      amountMinor: args.amountMinor,
      currencyCode: args.currencyCode,
      description: args.description,
      paidByMemberId: args.paidByMemberId,
      splitMethod: args.splitMethod,
      spentAt: args.spentAt,
      title: args.title,
    });

    const existingShares = await ctx.db
      .query("expenseShares")
      .withIndex("by_expense", (query) => query.eq("expenseId", args.expenseId))
      .collect();

    await Promise.all(existingShares.map((share) => ctx.db.delete(share._id)));

    await Promise.all(
      args.shares.map((share) =>
        ctx.db.insert("expenseShares", {
          amountMinor: share.amountMinor,
          expenseId: args.expenseId,
          memberId: share.memberId,
          percentage: share.percentage,
        }),
      ),
    );

    return args.expenseId;
  },
});
