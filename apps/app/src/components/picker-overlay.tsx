import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { OverlayShell } from "./overlay-shell";

export type PickerOverlayItem = {
  id: string;
  leading: ReactNode;
  onSelect: () => void;
  selected: boolean;
  subtitle: string;
  title: string;
};

type PickerOverlayProps = {
  confirmLabel?: string;
  description: string;
  isVisible: boolean;
  items: PickerOverlayItem[];
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  variant?: "panel" | "sheet";
};

export function PickerOverlay({
  confirmLabel,
  description,
  isVisible,
  items,
  onClose,
  onConfirm,
  title,
  variant = "sheet",
}: PickerOverlayProps) {
  const isPanel = variant === "panel";

  return (
    <OverlayShell
      description={description}
      footer={
        isPanel && onConfirm ? (
          <button
            type="button"
            onClick={onConfirm}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-lime-500 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 shadow-[0_12px_28px_rgba(212,255,0,0.22)] transition hover:bg-lime-500 motion-reduce:transition-none"
          >
            {confirmLabel ?? "Listo"}
          </button>
        ) : null
      }
      isVisible={isVisible}
      onClose={onClose}
      title={title}
    >
      <div className={variant === "panel" ? "max-h-[56dvh] space-y-3 overflow-y-auto pr-1 lg:max-h-[52dvh]" : "max-h-[50dvh] space-y-2 overflow-y-auto pr-1 lg:max-h-[48dvh]"}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onSelect}
            className={[
              variant === "panel"
                ? [
                    "surface-glow flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition",
                    item.selected
                      ? "border-lime-500/40 bg-lime-500/10"
                      : "border-obsidian-300 bg-obsidian-100 hover:border-lime-500",
                  ].join(" ")
                : [
                    "surface-glow flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition",
                    item.selected
                      ? "border-lime-500 bg-obsidian-200"
                      : "border-obsidian-300 bg-obsidian-100 hover:bg-obsidian-200",
                  ].join(" "),
            ].join(" ")}
          >
            <div className="flex min-w-0 items-center gap-3">
              {item.leading}
              <div className="min-w-0">
                <p
                  className={
                    variant === "panel"
                      ? "truncate font-display font-semibold text-ink-50"
                      : "break-words font-display text-[14px] font-bold text-ink-50"
                  }
                >
                  {item.title}
                </p>
                <p
                  className={
                    variant === "panel"
                      ? "font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500"
                      : "break-words font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500"
                  }
                >
                  {item.subtitle}
                </p>
              </div>
            </div>

            {variant === "panel" ? (
                item.selected ? (
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-lime-500 text-obsidian-0">
                    <Check className="size-4" />
                  </span>
                ) : null
              ) : (
                <div
                  className={[
                    "flex size-5 items-center justify-center rounded-full border-2",
                    item.selected ? "border-lime-500" : "border-obsidian-400",
                  ].join(" ")}
                >
                  {item.selected ? <div className="size-2.5 rounded-full bg-lime-500" /> : null}
                </div>
              )}
            </button>
          ))}
      </div>
    </OverlayShell>
  );
}
