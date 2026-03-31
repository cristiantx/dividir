const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();

export const env = {
  convexUrl,
};

export const hasConvexEnv = Boolean(convexUrl);
