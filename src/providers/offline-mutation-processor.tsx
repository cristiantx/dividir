import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useMutation, useConvexAuth } from "convex/react";

import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useOnlineStatus } from "../hooks/use-online-status";
import {
  type QueuedExpensePayload,
  type QueuedSettlementPayload,
  isRetryableMutationError,
} from "../lib/offline-queue";
import { localDb } from "../lib/local-db";

export function OfflineMutationProcessor() {
  const isOnline = useOnlineStatus();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const createExpense = useMutation(api.expenses.create);
  const createSettlement = useMutation(api.settlements.create);
  const queue = useLiveQuery(
    () =>
      localDb.queuedMutations
        .where("status")
        .equals("pending")
        .sortBy("createdAt"),
    [],
    [],
  );

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isOnline || processingId || queue.length === 0) {
      return;
    }

    const next = queue[0];
    let cancelled = false;

    void (async () => {
      setProcessingId(next.id);
      await localDb.queuedMutations.update(next.id, {
        attempts: next.attempts + 1,
        status: "processing",
        updatedAt: Date.now(),
      });

      try {
        if (next.mutationName === "expenses.create") {
          const payload = JSON.parse(next.payload) as QueuedExpensePayload;
          await createExpense({
            amountMinor: BigInt(payload.amountMinor),
            clientMutationId: payload.clientMutationId,
            currencyCode: payload.currencyCode,
            description: payload.description,
            groupId: payload.groupId as Id<"groups">,
            paidByMemberId: payload.paidByMemberId as Id<"groupMembers">,
            shares: payload.shares.map((share) => ({
              amountMinor: BigInt(share.amountMinor),
              memberId: share.memberId as Id<"groupMembers">,
              percentage: share.percentage,
            })),
            splitMethod: payload.splitMethod,
            spentAt: payload.spentAt,
            title: payload.title,
          });
        }

        if (next.mutationName === "settlements.create") {
          const payload = JSON.parse(next.payload) as QueuedSettlementPayload;
          await createSettlement({
            amountMinor: BigInt(payload.amountMinor),
            clientMutationId: payload.clientMutationId,
            currencyCode: payload.currencyCode,
            fromMemberId: payload.fromMemberId as Id<"groupMembers">,
            groupId: payload.groupId as Id<"groups">,
            paymentMethod: payload.paymentMethod,
            settledAt: payload.settledAt,
            toMemberId: payload.toMemberId as Id<"groupMembers">,
          });
        }

        await localDb.queuedMutations.delete(next.id);
      } catch (error) {
        await localDb.queuedMutations.update(next.id, {
          status: isRetryableMutationError(error) ? "pending" : "failed",
          updatedAt: Date.now(),
        });
      } finally {
        if (!cancelled) {
          setProcessingId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    createExpense,
    createSettlement,
    isAuthenticated,
    isLoading,
    isOnline,
    processingId,
    queue,
  ]);

  return null;
}
