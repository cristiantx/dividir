import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

import { ensureDemoData } from "./lib/demoData";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
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
