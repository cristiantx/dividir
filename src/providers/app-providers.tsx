import type { PropsWithChildren } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

import { env } from "../lib/env";

const convexClient = env.convexUrl ? new ConvexReactClient(env.convexUrl) : null;

export function AppProviders({ children }: PropsWithChildren) {
  if (!convexClient) {
    return children;
  }

  return <ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>;
}
