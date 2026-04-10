import type { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../lib/cn";

type OverlayShellVariant = "panel" | "sheet";

type OverlayShellProps = {
  children: ReactNode;
  className?: string;
  description: string;
  footer?: ReactNode;
  header?: ReactNode;
  isVisible: boolean;
  onClose: () => void;
  title: string;
  variant?: OverlayShellVariant;
};

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

export function OverlayShell({
  children,
  className,
  description,
  footer,
  header,
  isVisible,
  onClose,
  title,
  variant = "sheet",
}: OverlayShellProps) {
  const isPanel = variant === "panel";
  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 40;
  const surfaceTransition = {
    duration: 0.26,
    ease: [0.16, 1, 0.3, 1],
  } as const;
  const surfaceExitTransition = {
    duration: 0.18,
    ease: [0.4, 0, 1, 1],
  } as const;
  const surfaceVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: surfaceTransition,
    },
    closed: {
      opacity: 0,
      y: yOffset,
      transition: surfaceExitTransition,
    },
  } as const;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center",
        "pointer-events-none",
        "motion-reduce:transition-none",
      )}
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
        className={cn(
          "relative w-full pointer-events-auto will-change-transform",
          "transition-[transform,opacity] motion-reduce:transition-none",
          isPanel
            ? "max-w-[780px] rounded-t-[2rem] border-t border-obsidian-300 bg-obsidian-0 px-6 pb-6 pt-5 shadow-[0_-8px_24px_rgba(0,0,0,0.14)]"
            : "max-w-md rounded-t-[32px] border border-obsidian-300 border-b-0 bg-obsidian-0 px-5 pb-5 pt-3 shadow-[0_-28px_60px_rgba(0,0,0,0.42)]",
          className,
        )}
        initial="closed"
        variants={surfaceVariants}
      >
        {header ? (
          header
        ) : isPanel ? (
          <div className="mb-5 flex items-start justify-between gap-4">
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

        <div className="space-y-4">{children}</div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </motion.div>
    </div>
  );
}
