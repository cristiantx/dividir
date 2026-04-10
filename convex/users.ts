import { ConvexError, v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
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

      if ((!existingUser.name || !existingUser.name.trim()) && existingUser.name !== args.name) {
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

export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const name = args.name.trim();

    if (!name) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "El nombre no puede estar vacío.",
      });
    }

    if (name === user.name) {
      return user._id;
    }

    await ctx.db.patch(user._id, { name });

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_linked_user_and_status", (query) =>
        query.eq("linkedUserId", user._id).eq("status", "active"),
      )
      .collect();

    await Promise.all(
      memberships.map((membership) => ctx.db.patch(membership._id, { displayName: name })),
    );

    return user._id;
  },
});
