import { v } from "convex/values";

import { internalMutation, query } from "./_generated/server";
import { ensureDemoData } from "./lib/demoData";
import { requireCurrentUser } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await requireCurrentUser(ctx);
  },
});

export const ensureDevUser = internalMutation({
  args: {
    defaultCurrencyCode: v.optional(v.string()),
    email: v.string(),
    image: v.optional(v.string()),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (query) => query.eq("email", args.email))
      .unique();

    if (existingUser !== null) {
      const patch: {
        defaultCurrencyCode?: string;
        image?: string;
        name?: string;
      } = {};

      if (existingUser.name !== args.name) {
        patch.name = args.name;
      }
      if (args.image !== undefined && existingUser.image !== args.image) {
        patch.image = args.image;
      }
      if (
        args.defaultCurrencyCode !== undefined &&
        existingUser.defaultCurrencyCode !== args.defaultCurrencyCode
      ) {
        patch.defaultCurrencyCode = args.defaultCurrencyCode;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existingUser._id, patch);
      }

      const existingGroup = await ctx.db
        .query("groups")
        .withIndex("by_creator", (query) => query.eq("createdByUserId", existingUser._id))
        .first();

      if (existingGroup === null) {
        await ensureDemoData(ctx, existingUser._id);
      }

      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      ...(args.defaultCurrencyCode !== undefined
        ? { defaultCurrencyCode: args.defaultCurrencyCode }
        : {}),
      ...(args.image !== undefined ? { image: args.image } : {}),
    });

    await ensureDemoData(ctx, userId);
    return userId;
  },
});
