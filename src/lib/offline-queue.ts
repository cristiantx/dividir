import type { Id } from "../../convex/_generated/dataModel";
import { localDb } from "./local-db";

export type QueuedExpensePayload = {
  amountMinor: string;
  clientMutationId: string;
  currencyCode: string;
  description?: string;
  groupId: Id<"groups">;
  paidByMemberId: Id<"groupMembers">;
  shares: Array<{
    amountMinor: string;
    memberId: Id<"groupMembers">;
    percentage?: number;
  }>;
  splitMethod: "equal" | "percentage";
  spentAt: number;
  title: string;
};

export type QueuedSettlementPayload = {
  amountMinor: string;
  clientMutationId: string;
  currencyCode: string;
  fromMemberId: Id<"groupMembers">;
  groupId: Id<"groups">;
  paymentMethod: "cash" | "bank" | "crypto" | "other";
  settledAt: number;
  toMemberId: Id<"groupMembers">;
};

function baseQueuedMutation(mutationName: string, payload: string) {
  const now = Date.now();

  return {
    attempts: 0,
    createdAt: now,
    id: crypto.randomUUID(),
    mutationName,
    payload,
    status: "pending" as const,
    updatedAt: now,
  };
}

export async function enqueueExpenseMutation(payload: QueuedExpensePayload) {
  await localDb.queuedMutations.put(
    baseQueuedMutation("expenses.create", JSON.stringify(payload)),
  );
}

export async function enqueueSettlementMutation(payload: QueuedSettlementPayload) {
  await localDb.queuedMutations.put(
    baseQueuedMutation("settlements.create", JSON.stringify(payload)),
  );
}

export function isRetryableMutationError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("offline") ||
    message.includes("connection")
  );
}
