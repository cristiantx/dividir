import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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
  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : isPanel ? 18 : 44;
  const backdropVariants = {
    open: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.14,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  } as const;
  const surfaceVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isPanel ? 0.24 : 0.28,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    closed: {
      opacity: 0,
      y: yOffset,
      transition: {
        duration: isPanel ? 0.16 : 0.18,
        ease: [0.4, 0, 1, 1],
      },
    },
  } as const;

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-end justify-center",
        "pointer-events-none",
        "motion-reduce:transition-none",
      ].join(" ")}
      aria-hidden={!isVisible}
    >
      <motion.div
        animate={isVisible ? "open" : "closed"}
        className="absolute inset-0 bg-obsidian-0/75"
        initial="closed"
        variants={backdropVariants}
      />
      <motion.button
        animate={isVisible ? "open" : "closed"}
        type="button"
        aria-label={`Cerrar ${title.toLowerCase()}`}
        initial="closed"
        onClick={onClose}
        className="absolute inset-0 pointer-events-auto"
        variants={backdropVariants}
      />
      <motion.div
        animate={isVisible ? "open" : "closed"}
        className={[
          isPanel
            ? [
                "relative w-full max-w-[780px] rounded-t-[2rem] border-t border-obsidian-300 bg-obsidian-0 px-6 pb-6 pt-5",
                "pointer-events-auto will-change-transform",
                "shadow-[0_-8px_24px_rgba(0,0,0,0.14)]",
              ].join(" ")
            : [
                "relative z-10 w-full max-w-md rounded-t-[32px] border border-obsidian-300 border-b-0 bg-obsidian-0 px-5 pb-5 pt-3 shadow-[0_-28px_60px_rgba(0,0,0,0.42)]",
                "pointer-events-auto will-change-transform",
              ].join(" "),
        ].join(" ")}
        initial="closed"
        variants={surfaceVariants}
      >
        {isPanel ? (
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                {title}
              </p>
              <p className="mt-1 text-sm text-ink-300">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-10 items-center justify-center rounded-full border border-obsidian-300 text-ink-300 transition hover:border-lime-500 hover:text-lime-500"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-obsidian-300" />
            <div className="mb-4">
              <h3 className="font-display text-[18px] font-bold text-ink-50">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-300">{description}</p>
            </div>
          </>
        )}

        <div className={isPanel ? "space-y-3" : "max-h-[50dvh] space-y-2 overflow-y-auto pr-1"}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onSelect}
              className={[
                isPanel
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
                      isPanel
                        ? "truncate font-display font-semibold text-ink-50"
                        : "break-words font-display text-[14px] font-bold text-ink-50"
                    }
                  >
                    {item.title}
                  </p>
                  <p
                    className={
                      isPanel
                        ? "font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500"
                        : "break-words font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500"
                    }
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {isPanel ? (
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

        {isPanel && onConfirm ? (
          <button
            type="button"
            onClick={onConfirm}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-lime-500 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 shadow-[0_12px_28px_rgba(212,255,0,0.22)] transition hover:bg-lime-500 motion-reduce:transition-none"
          >
            {confirmLabel ?? "Listo"}
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}
