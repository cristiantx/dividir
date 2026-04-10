import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const groupIcon = v.union(
  v.literal("plane"),
  v.literal("house"),
  v.literal("utensils"),
  v.literal("ticket"),
);

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    defaultCurrencyCode: v.optional(v.string()),
  }).index("email", ["email"]),

  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    currencyCode: v.string(),
    createdByUserId: v.id("users"),
    icon: v.optional(groupIcon),
    inviteToken: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
  })
    .index("by_creator", ["createdByUserId"])
    .index("by_invite_token", ["inviteToken"])
    .index("by_archived_at", ["archivedAt"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    joinedAt: v.number(),
    linkedUserId: v.optional(v.id("users")),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("member")),
    status: v.union(v.literal("active"), v.literal("removed")),
    source: v.union(v.literal("owner"), v.literal("local"), v.literal("invite")),
  })
    .index("by_group", ["groupId"])
    .index("by_group_and_status", ["groupId", "status"])
    .index("by_linked_user", ["linkedUserId"])
    .index("by_linked_user_and_status", ["linkedUserId", "status"])
    .index("by_group_and_linked_user", ["groupId", "linkedUserId"]),

  expenses: defineTable({
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    amountMinor: v.int64(),
    currencyCode: v.string(),
    paidByMemberId: v.id("groupMembers"),
    splitMethod: v.union(v.literal("equal"), v.literal("percentage")),
    createdByUserId: v.id("users"),
    spentAt: v.number(),
    createdAt: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_group_and_spent_at", ["groupId", "spentAt"]),

  expenseShares: defineTable({
    expenseId: v.id("expenses"),
    memberId: v.id("groupMembers"),
    amountMinor: v.int64(),
    percentage: v.optional(v.number()),
  })
    .index("by_expense", ["expenseId"])
    .index("by_member", ["memberId"]),

  settlements: defineTable({
    groupId: v.id("groups"),
    fromMemberId: v.id("groupMembers"),
    toMemberId: v.id("groupMembers"),
    amountMinor: v.int64(),
    currencyCode: v.string(),
    paymentMethod: v.optional(
      v.union(v.literal("cash"), v.literal("bank"), v.literal("crypto"), v.literal("other")),
    ),
    createdByUserId: v.id("users"),
    settledAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_group_and_settled_at", ["groupId", "settledAt"]),

  offlineReceipts: defineTable({
    clientMutationId: v.string(),
    processedAt: v.number(),
    mutationName: v.string(),
  }).index("by_client_mutation_id", ["clientMutationId"]),
});
