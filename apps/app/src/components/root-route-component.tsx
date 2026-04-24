import { Outlet } from "@tanstack/react-router";

import { AppShell } from "./app-shell";

export function RootRouteComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
