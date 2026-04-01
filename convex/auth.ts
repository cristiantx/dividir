import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth } from "@convex-dev/auth/server";

import { internal } from "./_generated/api";
import { ensureDemoData } from "./lib/demoData";

const devLoginEnabled =
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env?.NODE_ENV !== "production";
const devLoginEmail = "llm-agent@dividir.local";
const devLoginName = "LLM Agent";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials({
      authorize: async (_credentials, ctx) => {
        if (!devLoginEnabled) {
          return null;
        }

        const userId = await ctx.runMutation(internal.users.ensureDevUser, {
          defaultCurrencyCode: "ARS",
          email: devLoginEmail,
          name: devLoginName,
        });

        return { userId };
      },
    }),
    Resend({
      from: "Dividir <noreply@updates.imago.pics>",
    }),
    Google,
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      if (args.existingUserId === null) {
        await ensureDemoData(ctx, args.userId);
      }
    },
  },
});
