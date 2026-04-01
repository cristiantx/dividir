const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
const devLoginEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_LOGIN_ENABLED === "true";

export const env = {
  convexUrl,
  devLoginEnabled,
};

export const hasConvexEnv = Boolean(convexUrl);
