import { query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await requireCurrentUser(ctx);
  },
});
