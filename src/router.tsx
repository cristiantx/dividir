import { createRootRoute, createRoute, createRouter, Navigate } from "@tanstack/react-router";

import { PlaceholderScreen } from "./components/placeholder-screen";
import { RootRouteComponent } from "./components/root-route-component";

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
  component: () => (
    <PlaceholderScreen
      eyebrow="Inicio de sesión"
      title="Autenticación brutalista"
      subtitle="Magic link, acceso Google y la primera impresión visual del producto van aquí."
      action="Pantalla de login"
    />
  ),
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups",
  component: () => (
    <PlaceholderScreen
      eyebrow="Mis grupos"
      title="Balances y grupos"
      subtitle="Resumen total, listado de grupos, CTA flotante y navegación principal."
      metric="+2.450,50"
      action="Pantalla de grupos"
    />
  ),
});

const groupDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId",
  component: () => (
    <PlaceholderScreen
      eyebrow="Detalle del grupo"
      title="Actividad y balances"
      subtitle="Pantalla sintetizada para miembros, historial de gastos y acceso a liquidación."
      metric="ARS 184.200"
      action="Pantalla de detalle"
    />
  ),
});

const newExpenseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/new-expense",
  component: () => (
    <PlaceholderScreen
      eyebrow="Nuevo gasto"
      title="División en segundos"
      subtitle="Monto, concepto, participantes y método de reparto quedan en este flujo."
      metric="$ 0,00"
      action="Pantalla de agregar gasto"
    />
  ),
});

const settleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId/settle",
  component: () => (
    <PlaceholderScreen
      eyebrow="Liquidar"
      title="Transferencias simplificadas"
      subtitle="Sugerencias de pago, método de pago y confirmación de liquidación."
      metric="$ 1.240,50"
      action="Pantalla de liquidación"
    />
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId/settings",
  component: () => (
    <PlaceholderScreen
      eyebrow="Configuración"
      title="Ajustes de grupo"
      subtitle="Nombre, moneda, miembros y acciones destructivas viven en esta pantalla."
      action="Pantalla de configuración"
    />
  ),
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: () => (
    <PlaceholderScreen
      eyebrow="Cuenta"
      title="Perfil y estado local"
      subtitle="Resumen de sesión, sincronización offline y acciones de cuenta mínimas."
      action="Pantalla de cuenta"
    />
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  groupsRoute,
  groupDetailRoute,
  newExpenseRoute,
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
