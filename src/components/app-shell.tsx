import type { ReactNode } from "react";
import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { CircleUserRound, FolderKanban, Plus } from "lucide-react";

import { cn } from "../lib/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isLogin = pathname.startsWith("/login");
  const isJoin = pathname.startsWith("/join/");
  const isAddExpense = pathname.includes("/add-expense");
  const isEditExpense = pathname.includes("/expenses/") && pathname.endsWith("/edit");
  const isSettle = pathname.includes("/settle");
  const isFullScreenFlow = isAddExpense || isEditExpense || isSettle || isJoin;
  const { isAuthenticated, isLoading } = useConvexAuth();
  const isGroupsActive =
    pathname.startsWith("/groups") &&
    !pathname.includes("/add-expense") &&
    !pathname.includes("/settle") &&
    !isEditExpense;
  const isAccountActive = pathname.startsWith("/account");

  if (isLogin) {
    if (!isLoading && isAuthenticated) {
      return <Navigate to="/groups" />;
    }

    return <>{children}</>;
  }

  if (isJoin) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="app-grid relative min-h-dvh overflow-x-hidden">
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center border-x border-obsidian-300 bg-obsidian-0 px-8">
          <div className="space-y-4 text-center">
            <p className="font-display text-2xl font-bold tracking-tight text-lime-500">
              DIVIDIR
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-500">
              Sincronizando sesión
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="app-grid relative min-h-dvh overflow-x-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-obsidian-300 bg-obsidian-0">
        <div className={cn("flex-1", !isFullScreenFlow && "pb-28")}>{children}</div>
        {!isFullScreenFlow ? (
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-obsidian-300 bg-obsidian-0/96 shadow-[0_-16px_36px_rgba(0,0,0,0.34)] backdrop-blur">
            <div className="mx-auto grid h-18 max-w-md grid-cols-[1fr_auto_1fr] items-end px-4 pb-3">
              <Link
                to="/groups"
                className={cn(
                  "flex min-w-0 flex-col items-center justify-end gap-1.5 pb-0.5 text-[11px] transition-colors",
                  isGroupsActive
                    ? "text-lime-500"
                    : "text-ink-500 hover:text-ink-50",
                )}
              >
                <FolderKanban
                  className={cn("size-5", isGroupsActive && "stroke-[2.5]")}
                />
                <span className="min-w-0 truncate font-mono uppercase tracking-tighter">
                  Grupos
                </span>
              </Link>

              <Link
                to="/add-expense"
                className={cn("flex flex-col items-center gap-1.5")}
              >
                <span
                  className={cn(
                    "relative z-10 -mt-6 flex size-16 items-center justify-center rounded-[1.15rem] border border-black/10 bg-lime-500 text-obsidian-0 shadow-[0_10px_24px_rgba(212,255,0,0.2),0_2px_0_rgba(0,0,0,0.18)] transition",
                    "hover:bg-lime-500 hover:shadow-[0_14px_28px_rgba(212,255,0,0.24),0_2px_0_rgba(0,0,0,0.18)]",
                  )}
                >
                  <Plus className="size-[1.15rem] stroke-[2.8] text-obsidian-0" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-lime-500">
                  Añadir
                </span>
              </Link>

              <Link
                to="/account"
                className={cn(
                  "flex min-w-0 flex-col items-center justify-end gap-1.5 pb-0.5 text-[11px] transition-colors",
                  isAccountActive
                    ? "text-lime-500"
                    : "text-ink-500 hover:text-ink-50",
                )}
              >
                <CircleUserRound
                  className={cn("size-5", isAccountActive && "stroke-[2.5]")}
                />
                <span className="min-w-0 truncate font-mono uppercase tracking-tighter">
                  Cuenta
                </span>
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
