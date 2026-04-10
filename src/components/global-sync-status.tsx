import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";

import { useSyncStatus } from "../hooks/use-sync-status";
import { cn } from "../lib/cn";

export function GlobalSyncStatus() {
  const { shouldShow, status } = useSyncStatus();

  if (!shouldShow) {
    return null;
  }

  const Icon =
    status.kind === "failed"
      ? AlertCircle
      : status.kind === "offline"
        ? CloudOff
        : RefreshCw;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex app-header-safe items-center justify-end px-4">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur",
          "font-mono text-[10px] font-medium uppercase tracking-[0.18em]",
          status.tone === "danger" &&
            "border-rose-500/25 bg-rose-500/10 text-rose-500",
          status.tone === "warning" &&
            "border-amber-400/25 bg-amber-400/10 text-amber-300",
          status.tone === "success" &&
            "border-mint-500/25 bg-mint-500/10 text-mint-500",
        )}
        aria-live="polite"
      >
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            status.kind === "syncing" && "animate-spin",
          )}
        />
        <span>{status.label}</span>
      </div>
    </div>
  );
}
