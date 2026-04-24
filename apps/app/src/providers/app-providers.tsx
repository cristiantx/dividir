import { useEffect, type PropsWithChildren } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { Toaster } from "sonner";

import { NotificationSync } from "../components/notification-sync";
import { PushSubscriptionSync } from "../components/push-subscription-sync";
import { env } from "../lib/env";
import { localDb } from "../lib/local-db";
import { OfflineMutationProcessor } from "./offline-mutation-processor";

const convexClient = env.convexUrl ? new ConvexReactClient(env.convexUrl) : null;

export function AppProviders({ children }: PropsWithChildren) {
  if (!convexClient) {
    return children;
  }

  return (
    <ConvexAuthProvider client={convexClient}>
      <SessionCacheManager />
      <OfflineMutationProcessor />
      <NotificationSync />
      <PushSubscriptionSync />
      <Toaster
        position="bottom-center"
        richColors
        theme="dark"
        visibleToasts={1}
        offset="calc(6.5rem + var(--safe-area-bottom))"
        mobileOffset="calc(6.5rem + var(--safe-area-bottom))"
      />
      {children}
    </ConvexAuthProvider>
  );
}

function SessionCacheManager() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    void localDb.cachedCurrentUser.delete("current");
  }, [isAuthenticated, isLoading]);

  return null;
}
