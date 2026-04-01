import { useLiveQuery } from "dexie-react-hooks";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { HardDriveDownload, LogOut, ShieldCheck, Wallet } from "lucide-react";

import { useCurrentUser } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { localDb } from "../lib/local-db";

export function AccountScreen() {
  const isOnline = useOnlineStatus();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useCurrentUser(isAuthenticated);
  const queuedMutations = useLiveQuery(() => localDb.queuedMutations.toArray(), [], []);

  return (
    <main className="min-h-dvh bg-obsidian-0 px-6 pb-28 pt-10">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-100 surface-glow">
          <Wallet className="size-5 text-lime-500" />
        </div>
        <div>
          <p className="text-kicker font-mono text-[10px] text-ink-500">Cuenta</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-50">
            Estado local
          </h1>
        </div>
      </div>

      <section className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-6">
        <p className="text-kicker mb-3 font-mono text-[10px] text-ink-500">Perfil</p>
        <h2 className="font-display text-xl font-semibold text-ink-50">
          {user?.name ?? user?.email ?? "Cuenta activa"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-300">
          {user?.email ?? "Sesión en curso"} · esta pantalla se mantiene mínima en v1:
          sesión, capacidad offline y salida.
        </p>
      </section>

      <div className="mt-6 space-y-4">
        <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-mint-500" />
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-ink-50">
                {isLoading ? "Sincronizando" : isAuthenticated ? "Sesión activa" : "Sin sesión"}
              </p>
              <p className="mt-1 text-sm text-ink-300">
                {isOnline ? "Conectado al deployment actual." : "Sin conexión. Modo local activo."}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-5">
          <div className="flex items-center gap-3">
            <HardDriveDownload className="size-5 text-lime-500" />
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-ink-50">
                Offline queue
              </p>
              <p className="mt-1 text-sm text-ink-300">
                {queuedMutations.length} mutaciones pendientes o registradas en Dexie.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-obsidian-300 bg-transparent py-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-ink-300 transition hover:border-rose-500 hover:text-rose-500"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
