import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";

import { cn } from "../lib/cn";

type RouteStateVariant = "banner" | "empty";
type RouteStateTone = "info" | "warning";

type RouteStateProps = {
  actionLabel?: string;
  className?: string;
  description: string;
  onAction?: () => void;
  title: string;
  tone?: RouteStateTone;
  variant?: RouteStateVariant;
};

const toneClassMap: Record<RouteStateTone, string> = {
  info: "border-lime-500/20 bg-lime-500/10 text-lime-400",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
};

function getIcon(variant: RouteStateVariant, tone: RouteStateTone) {
  if (variant === "empty") {
    return CloudOff;
  }

  return tone === "warning" ? AlertCircle : RefreshCw;
}

export function RouteState({
  actionLabel,
  className,
  description,
  onAction,
  title,
  tone = "info",
  variant = "banner",
}: RouteStateProps) {
  const Icon = getIcon(variant, tone);

  if (variant === "empty") {
    return (
      <section
        className={cn(
          "surface-glow rounded-[28px] border px-6 py-8 text-center",
          toneClassMap[tone],
          className,
        )}
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-current/20 bg-current/10">
          <Icon className="size-6" />
        </div>
        <h2 className="mt-5 font-display text-xl font-semibold text-ink-50">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-300">{description}</p>
        {onAction && actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 rounded-full border border-obsidian-300 bg-transparent px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink-300 transition hover:border-lime-500 hover:text-lime-400"
          >
            {actionLabel}
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "surface-glow mb-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3",
        toneClassMap[tone],
        className,
      )}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-current/20 bg-current/10">
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-50">
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-ink-300">{description}</p>
      </div>
      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-full border border-obsidian-300 bg-transparent px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300 transition hover:border-lime-500 hover:text-lime-400"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
