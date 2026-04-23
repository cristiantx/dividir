import type { ReactNode } from "react";
import { Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { CircleUserRound, FolderKanban, Plus } from "lucide-react";

import { useGroupSummaries } from "../hooks/use-group-data";
import { cn } from "../lib/cn";
import { AppLaunchScreen } from "./app-launch-screen";
import { GlobalSyncStatus } from "./global-sync-status";
import { PwaUpdatePrompt } from "./pwa-update-prompt";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isLogin = pathname.startsWith("/login");
  const isJoin = pathname.startsWith("/join/");
  const isAddExpense = pathname.includes("/add-expense");
  const isEditExpense = pathname.includes("/expenses/") && pathname.endsWith("/edit");
  const isSettle = pathname.includes("/settle");
  const isNotifications = pathname === "/notifications";
  const isFullScreenFlow = isAddExpense || isEditExpense || isSettle || isJoin || isNotifications;
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: groups, isLoading: isGroupsLoading } = useGroupSummaries(
    isAuthenticated && !isLoading,
  );
  const isGroupsActive =
    pathname.startsWith("/groups") &&
    !pathname.includes("/add-expense") &&
    !pathname.includes("/settle") &&
    !isEditExpense;
  const isAccountActive = pathname.startsWith("/account");
  const shouldOpenCreateGroupOverlay = !isGroupsLoading && groups.length === 0;
  const currentGroupId = pathname.match(/^\/groups\/([^/]+)(?:\/|$)/)?.[1] ?? null;

  if (isLogin) {
    if (!isLoading && isAuthenticated) {
      return <Navigate replace to="/groups" />;
    }

    return (
      <>
        {children}
        <PwaUpdatePrompt />
      </>
    );
  }

  if (isJoin) {
    return (
      <>
        {children}
        <PwaUpdatePrompt />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <AppLaunchScreen />
        <PwaUpdatePrompt />
      </>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  function handleAddClick() {
    if (shouldOpenCreateGroupOverlay) {
      void navigate({
        search: {
          create: 1,
        } as never,
        to: "/groups",
      });
      return;
    }

    if (currentGroupId) {
      void navigate({
        params: { groupId: currentGroupId },
        to: "/groups/$groupId/add-expense",
      });
      return;
    }

    void navigate({ to: "/add-expense" });
  }

  return (
    <div className="app-grid relative min-h-dvh overflow-x-hidden">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-obsidian-300 bg-obsidian-0">
        <GlobalSyncStatus />
        <div className={cn("flex-1", !isFullScreenFlow && "app-shell-safe")}>{children}</div>
        {!isFullScreenFlow ? (
          <nav className="app-nav-safe fixed inset-x-0 bottom-0 z-40 border-t border-obsidian-300 bg-obsidian-0/96 shadow-[0_-16px_36px_rgba(0,0,0,0.34)] backdrop-blur">
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

              <button
                type="button"
                onClick={handleAddClick}
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
              </button>

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
      <PwaUpdatePrompt />
    </div>
  );
}
