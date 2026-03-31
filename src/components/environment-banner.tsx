import { TriangleAlert } from "lucide-react";

import { hasConvexEnv } from "../lib/env";

export function EnvironmentBanner() {
  if (hasConvexEnv) {
    return null;
  }

  return (
    <div className="border-b border-obsidian-300 bg-rose-500/10 px-4 py-3 text-sm text-ink-50">
      <div className="mx-auto flex max-w-md items-start gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-500" />
        <p className="leading-6 text-ink-300">
          Convex todavía no está configurado en este entorno. La app corre en modo maqueta
          hasta que agregues <code className="rounded bg-obsidian-100 px-1.5 py-0.5">.env.local</code>.
        </p>
      </div>
    </div>
  );
}
