import type { ReactNode } from "react";

import { cn } from "../lib/cn";

type ScreenFrameInset = "tabs" | "content" | "flow";

const insetClassMap: Record<ScreenFrameInset, string> = {
  content: "pb-[calc(7rem+var(--safe-area-bottom))] lg:pb-12",
  flow: "pb-[calc(11rem+var(--safe-area-bottom))] lg:pb-12",
  tabs: "pb-[calc(8rem+var(--safe-area-bottom))] lg:pb-12",
};

type ScreenFrameProps = {
  children: ReactNode;
  contentClassName?: string;
  headerCenter?: ReactNode;
  headerEnd?: ReactNode;
  headerStart?: ReactNode;
  inset?: ScreenFrameInset;
  mainClassName?: string;
};

export function ScreenFrame({
  children,
  contentClassName,
  headerCenter,
  headerEnd,
  headerStart,
  inset = "content",
  mainClassName,
}: ScreenFrameProps) {
  return (
    <main className={cn("min-h-dvh bg-obsidian-0", insetClassMap[inset], mainClassName)}>
      <header className="app-header-safe sticky top-0 z-20 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur md:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">{headerStart ?? <span className="w-5" />}</div>
        <div className="flex min-w-0 items-center justify-center">{headerCenter ?? null}</div>
        <div className="flex min-w-0 items-center justify-end gap-3">{headerEnd ?? <span className="w-5" />}</div>
      </header>

      <div className={contentClassName}>{children}</div>
    </main>
  );
}
