import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

export async function requireCurrentUser(ctx: AuthCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Debes iniciar sesión." });
  }

  const user = await ctx.db.get("users", userId);
  if (user === null) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Usuario no encontrado." });
  }

  return user;
}

export async function requireGroupMember(ctx: AuthCtx, groupId: Id<"groups">) {
  const user = await requireCurrentUser(ctx);
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_linked_user", (query) =>
      query.eq("groupId", groupId).eq("linkedUserId", user._id),
    )
    .unique();

  if (membership === null || membership.status !== "active") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "No tienes acceso a este grupo.",
    });
  }

  return { membership, user };
}
