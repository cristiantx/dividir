import type { ReactNode } from "react";
import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { CircleUserRound, FolderKanban, Plus } from "lucide-react";

import { useGroupSummaries } from "../hooks/use-group-data";
import { cn } from "../lib/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLogin = pathname.startsWith("/login");
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: groups } = useGroupSummaries(isAuthenticated && !isLogin);
  const primaryGroupId = groups[0]?.groupId;
  const navItems = [
    { to: "/groups", activePrefix: "/groups", label: "Grupos", icon: FolderKanban },
    primaryGroupId
      ? {
          to: "/groups/$groupId/add-expense" as const,
          activePrefix: "/groups/",
          params: { groupId: primaryGroupId },
          label: "Añadir",
          icon: Plus,
        }
      : null,
    { to: "/account", activePrefix: "/account", label: "Cuenta", icon: CircleUserRound },
  ].filter(Boolean);

  if (isLogin) {
    if (!isLoading && isAuthenticated) {
      return <Navigate to="/groups" />;
    }

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
        <div className="flex-1 pb-28">
          {children}
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-obsidian-300 bg-obsidian-0">
          <div className="mx-auto flex h-20 max-w-md items-center justify-around px-4">
            {navItems.map((item) => {
              if (!item) {
                return null;
              }

              const active =
                item.to === "/groups/$groupId/add-expense"
                  ? pathname.includes("/add-expense")
                  : item.to === "/groups"
                    ? pathname.startsWith("/groups") &&
                      !pathname.includes("/add-expense") &&
                      !pathname.includes("/settle")
                    : pathname.startsWith(item.activePrefix);
              const Icon = item.icon;
              const params = "params" in item ? item.params : undefined;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-2 py-3 text-[11px] transition-colors",
                    active ? "text-lime-500" : "text-ink-500 hover:text-ink-50",
                  )}
                  params={params}
                >
                  <Icon className={cn("size-5", active && "stroke-[2.5]")} />
                  <span className="min-w-0 truncate font-mono uppercase tracking-tighter">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
