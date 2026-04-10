import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Navigate,
} from "@tanstack/react-router";

import { RootRouteComponent } from "./components/root-route-component";

const LoginScreen = lazyRouteComponent(() => import("./screens/login-screen"), "LoginScreen");
const JoinGroupScreen = lazyRouteComponent(
  () => import("./screens/join-group-screen"),
  "JoinGroupScreen",
);
const GroupsScreen = lazyRouteComponent(() => import("./screens/groups-screen"), "GroupsScreen");
const GlobalAddExpenseScreen = lazyRouteComponent(
  () => import("./screens/add-expense-screen"),
  "GlobalAddExpenseScreen",
);
const GroupDetailScreen = lazyRouteComponent(
  () => import("./screens/group-detail-screen"),
  "GroupDetailScreen",
);
const GroupAddExpenseScreen = lazyRouteComponent(
  () => import("./screens/add-expense-screen"),
  "GroupAddExpenseScreen",
);
const EditExpenseScreen = lazyRouteComponent(
  () => import("./screens/add-expense-screen"),
  "EditExpenseScreen",
);
const SettleScreen = lazyRouteComponent(() => import("./screens/settle-screen"), "SettleScreen");
const GroupSettingsScreen = lazyRouteComponent(
  () => import("./screens/group-settings-screen"),
  "GroupSettingsScreen",
);
const AccountScreen = lazyRouteComponent(() => import("./screens/account-screen"), "AccountScreen");

const rootRoute = createRootRoute({
  component: RootRouteComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate replace to="/groups" />,
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
  defaultViewTransition: true,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
