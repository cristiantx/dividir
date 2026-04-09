import { useEffect, useRef, useState } from "react";
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
  const isMountedRef = useRef(true);
  const isDrainingRef = useRef(false);
  const createExpense = useMutation(api.expenses.create);
  const createSettlement = useMutation(api.settlements.create);
  const queuedMutations = useLiveQuery(() => localDb.queuedMutations.toArray(), [], []);
  const queue = queuedMutations
    .filter((mutation) => mutation.status === "pending")
    .sort((left, right) => left.createdAt - right.createdAt);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void localDb.queuedMutations
      .where("status")
      .equals("processing")
      .modify({
        status: "pending",
        updatedAt: Date.now(),
      });
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isOnline || processingId || queue.length === 0) {
      return;
    }

    if (isDrainingRef.current) {
      return;
    }

    isDrainingRef.current = true;
    void (async () => {
      try {
        while (isMountedRef.current) {
          const next = await localDb.queuedMutations
            .where("status")
            .equals("pending")
            .sortBy("createdAt")
            .then((items) => items[0]);

          if (!next) {
            return;
          }

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
            } else if (next.mutationName === "settlements.create") {
              const payload = JSON.parse(next.payload) as QueuedSettlementPayload;
              await createSettlement({
                amountMinor: BigInt(payload.amountMinor),
                clientMutationId: payload.clientMutationId,
                currencyCode: payload.currencyCode,
                fromMemberId: payload.fromMemberId as Id<"groupMembers">,
                groupId: payload.groupId as Id<"groups">,
                settledAt: payload.settledAt,
                toMemberId: payload.toMemberId as Id<"groupMembers">,
              });
            } else {
              throw new Error(`Unsupported queued mutation: ${next.mutationName}`);
            }

            await localDb.queuedMutations.delete(next.id);
          } catch (error) {
            const nextStatus = isRetryableMutationError(error) ? "pending" : "failed";

            await localDb.queuedMutations.update(next.id, {
              status: nextStatus,
              updatedAt: Date.now(),
            });

            if (nextStatus === "pending") {
              return;
            }
          } finally {
            if (isMountedRef.current) {
              setProcessingId(null);
            }
          }
        }
      } finally {
        isDrainingRef.current = false;
      }
    })();
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
