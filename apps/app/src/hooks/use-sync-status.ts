import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { localDb } from "../lib/local-db";
import { useOnlineStatus } from "./use-online-status";

export type SyncStatus =
  | {
      count?: number;
      tone: "muted";
      kind: "idle";
      label: string;
    }
  | {
      count?: number;
      tone: "warning" | "danger" | "success";
      kind: "offline" | "syncing" | "failed";
      label: string;
    };

export function useSyncStatus() {
  const isOnline = useOnlineStatus();
  const queuedMutations = useLiveQuery(() => localDb.queuedMutations.toArray(), [], []);

  return useMemo(() => {
    const failedCount = queuedMutations.filter((mutation) => mutation.status === "failed").length;
    const processingCount = queuedMutations.filter(
      (mutation) => mutation.status === "processing",
    ).length;
    const pendingCount = queuedMutations.filter((mutation) => mutation.status === "pending").length;
    const totalQueued = failedCount + processingCount + pendingCount;

    let status: SyncStatus = {
      kind: "idle",
      label: "Al día",
      tone: "muted",
    };

    if (failedCount > 0) {
      status = {
        count: failedCount,
        kind: "failed",
        label: failedCount === 1 ? "1 error de sync" : `${failedCount} errores de sync`,
        tone: "danger",
      };
    } else if (!isOnline) {
      status = {
        count: totalQueued > 0 ? totalQueued : undefined,
        kind: "offline",
        label: totalQueued > 0 ? `Offline · ${totalQueued}` : "Offline",
        tone: "warning",
      };
    } else if (processingCount > 0) {
      status = {
        count: processingCount,
        kind: "syncing",
        label:
          processingCount === 1
            ? "Sincronizando 1 cambio"
            : `Sincronizando ${processingCount}`,
        tone: "success",
      };
    } else if (pendingCount > 0) {
      status = {
        count: pendingCount,
        kind: "syncing",
        label: pendingCount === 1 ? "1 cambio en cola" : `${pendingCount} en cola`,
        tone: "warning",
      };
    }

    return {
      failedCount,
      isOnline,
      pendingCount,
      processingCount,
      shouldShow: status.kind !== "idle",
      status,
      totalQueued,
    };
  }, [isOnline, queuedMutations]);
}
