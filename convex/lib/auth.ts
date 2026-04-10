import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;
export type GroupRole = Doc<"groupMembers">["role"];

export type GroupPermissions = {
  canArchiveGroup: boolean;
  canDeleteGroup: boolean;
  canEditGroup: boolean;
  canManageInvite: boolean;
  canManageMembers: boolean;
  canUnarchiveGroup: boolean;
};

export function getGroupPermissions(role: GroupRole): GroupPermissions {
  const isOwner = role === "owner";
  const canEditGroup = role === "owner" || role === "editor";

  return {
    canArchiveGroup: isOwner,
    canDeleteGroup: isOwner,
    canEditGroup,
    canManageInvite: isOwner,
    canManageMembers: isOwner,
    canUnarchiveGroup: isOwner,
  };
}

export async function getCurrentUserOrNull(ctx: AuthCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }

  return await ctx.db.get("users", userId);
}

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
  const memberships = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_linked_user", (query) =>
      query.eq("groupId", groupId).eq("linkedUserId", user._id),
    )
    .collect();
  const membership = memberships.find((candidate) => candidate.status === "active") ?? null;

  if (membership === null || membership.status !== "active") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "No tienes acceso a este grupo.",
    });
  }

  return { membership, user };
}

export function requireGroupPermission(
  membership: Pick<Doc<"groupMembers">, "role">,
  permission: keyof GroupPermissions,
  message: string,
) {
  const permissions = getGroupPermissions(membership.role);
  if (!permissions[permission]) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message,
    });
  }

  return permissions;
}
