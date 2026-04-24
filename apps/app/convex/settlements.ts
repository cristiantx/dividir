import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { createSettlementNotifications } from "./notifications";
import { requireCurrentUser, requireGroupMember } from "./lib/auth";

export const create = mutation({
  args: {
    amountMinor: v.int64(),
    clientMutationId: v.optional(v.string()),
    currencyCode: v.string(),
    fromMemberId: v.id("groupMembers"),
    groupId: v.id("groups"),
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
      settledAt: args.settledAt,
      toMemberId: args.toMemberId,
    });

    const group = await ctx.db.get(args.groupId);
    if (group === null) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Grupo no encontrado.",
      });
    }

    await createSettlementNotifications(ctx, {
      actorName: user.name?.trim() || user.email || "Alguien",
      actorUserId: user._id,
      amountMinor: args.amountMinor,
      currencyCode: args.currencyCode,
      fromMemberId: args.fromMemberId,
      groupId: args.groupId,
      groupName: group.name,
      settlementId,
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

export const get = query({
  args: {
    settlementId: v.id("settlements"),
  },
  handler: async (ctx, args) => {
    const settlement = await ctx.db.get(args.settlementId);
    if (settlement === null) {
      return null;
    }

    await requireGroupMember(ctx, settlement.groupId);

    return {
      amountMinor: Number(settlement.amountMinor),
      currencyCode: settlement.currencyCode,
      fromMemberId: settlement.fromMemberId,
      groupId: settlement.groupId,
      settledAt: settlement.settledAt,
      settlementId: settlement._id,
      toMemberId: settlement.toMemberId,
    };
  },
});

export const update = mutation({
  args: {
    amountMinor: v.int64(),
    currencyCode: v.string(),
    fromMemberId: v.id("groupMembers"),
    groupId: v.id("groups"),
    settledAt: v.number(),
    settlementId: v.id("settlements"),
    toMemberId: v.id("groupMembers"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const settlement = await ctx.db.get(args.settlementId);
    if (settlement === null) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pago no encontrado.",
      });
    }

    await requireGroupMember(ctx, settlement.groupId);

    if (settlement.groupId !== args.groupId) {
      throw new ConvexError({
        code: "INVALID_GROUP",
        message: "No se puede mover el pago a otro grupo.",
      });
    }

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_status", (query) =>
        query.eq("groupId", args.groupId).eq("status", "active"),
      )
      .collect();
    const memberIds = new Set(members.map((member) => member._id));

    if (!memberIds.has(args.fromMemberId)) {
      throw new ConvexError({
        code: "INVALID_PAYER",
        message: "La persona que paga no pertenece al grupo.",
      });
    }

    if (!memberIds.has(args.toMemberId)) {
      throw new ConvexError({
        code: "INVALID_RECEIVER",
        message: "La persona que recibe no pertenece al grupo.",
      });
    }

    if (args.fromMemberId === args.toMemberId) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La persona que paga y la que recibe deben ser distintas.",
      });
    }

    await ctx.db.patch(args.settlementId, {
      amountMinor: args.amountMinor,
      currencyCode: args.currencyCode,
      fromMemberId: args.fromMemberId,
      settledAt: args.settledAt,
      toMemberId: args.toMemberId,
    });

    return {
      amountMinor: Number(args.amountMinor),
      currencyCode: args.currencyCode,
      fromMemberId: args.fromMemberId,
      groupId: args.groupId,
      settledAt: args.settledAt,
      settlementId: args.settlementId,
      toMemberId: args.toMemberId,
      updatedByUserId: user._id as Id<"users">,
    };
  },
});
