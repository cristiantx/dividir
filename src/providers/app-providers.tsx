import { useEffect, type PropsWithChildren } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { Toaster } from "sonner";

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
      <Toaster position="bottom-center" richColors theme="dark" />
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
