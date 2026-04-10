import { createRootRoute, createRoute, createRouter, Navigate } from "@tanstack/react-router";

import { RootRouteComponent } from "./components/root-route-component";
import { AccountScreen } from "./screens/account-screen";
import {
  EditExpenseScreen,
  GlobalAddExpenseScreen,
  GroupAddExpenseScreen,
} from "./screens/add-expense-screen";
import { GroupDetailScreen } from "./screens/group-detail-screen";
import { GroupSettingsScreen } from "./screens/group-settings-screen";
import { GroupsScreen } from "./screens/groups-screen";
import { JoinGroupScreen } from "./screens/join-group-screen";
import { LoginScreen } from "./screens/login-screen";
import { SettleScreen } from "./screens/settle-screen";

const rootRoute = createRootRoute({
  component: RootRouteComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/groups" />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginScreen,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join/$inviteToken",
  component: JoinGroupScreen,
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups",
  component: GroupsScreen,
});

const addExpenseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add-expense",
  component: GlobalAddExpenseScreen,
});

const groupDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId",
  component: GroupDetailScreen,
});

const newExpenseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId/add-expense",
  component: GroupAddExpenseScreen,
});

const editExpenseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId/expenses/$expenseId/edit",
  component: EditExpenseScreen,
});

const settleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId/settle",
  component: SettleScreen,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId/settings",
  component: GroupSettingsScreen,
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: AccountScreen,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  joinRoute,
  groupsRoute,
  addExpenseRoute,
  groupDetailRoute,
  newExpenseRoute,
  editExpenseRoute,
  settleRoute,
  settingsRoute,
  accountRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
