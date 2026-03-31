import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CircleUserRound, FolderKanban, Plus } from "lucide-react";

import { cn } from "../lib/cn";

const navItems = [
  { to: "/groups", activePrefix: "/groups", label: "Grupos", icon: FolderKanban },
  {
    to: "/groups/$groupId/add-expense",
    activePrefix: "/groups/",
    params: { groupId: "ibiza-2024" },
    label: "Añadir",
    icon: Plus,
  },
  { to: "/account", activePrefix: "/account", label: "Cuenta", icon: CircleUserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="app-grid relative min-h-dvh overflow-x-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-obsidian-300/80 bg-obsidian-0/96">
        <div className="flex-1 pb-24">
          {children}
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-obsidian-300 bg-obsidian-0/98 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-md items-center justify-around px-6">
            {navItems.map((item) => {
              const active =
                item.to === "/groups/$groupId/add-expense"
                  ? pathname.includes("/add-expense")
                  : pathname.startsWith(item.activePrefix);
              const Icon = item.icon;
              const params = "params" in item ? item.params : undefined;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-w-20 flex-col items-center justify-center gap-1 text-[11px] font-medium uppercase tracking-tight transition-colors",
                    active ? "text-lime-500" : "text-ink-500 hover:text-ink-50",
                  )}
                  params={params}
                >
                  <Icon className={cn("size-5", active && "stroke-[2.5]")} />
                  <span className="font-mono">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
