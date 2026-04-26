import type { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../lib/cn";

type OverlayShellProps = {
  children: ReactNode;
  className?: string;
  description: string;
  footer?: ReactNode;
  isVisible: boolean;
  onClose: () => void;
  title: string;
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
  isVisible,
  onClose,
  title,
}: OverlayShellProps) {
  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : 40;
  const surfaceTransition = {
    opacity: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1],
    },
    y: {
      duration: 0.26,
      ease: [0.16, 1, 0.3, 1],
    },
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
      transition: surfaceTransition,
    },
  } as const;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:px-6 lg:py-8",
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
          "relative w-full max-w-[780px] pointer-events-auto will-change-[transform,opacity]",
          "rounded-t-[2rem] border-t border-obsidian-300 bg-obsidian-0 px-6 pb-6 pt-5 shadow-[0_-8px_24px_rgba(0,0,0,0.14)]",
          "lg:max-w-2xl lg:rounded-2xl lg:border lg:px-7 lg:py-6 lg:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
          className,
        )}
        initial="closed"
        variants={surfaceVariants}
      >
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

        <div className="space-y-4">{children}</div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </motion.div>
    </div>
  );
}
