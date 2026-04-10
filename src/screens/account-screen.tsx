import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { HardDriveDownload, LogOut, Mail, UserRound, Wallet } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import { InstallAppCard } from "../components/install-app-card";
import { RouteState } from "../components/route-state";
import { useAppInstall } from "../hooks/use-app-install";
import { useCurrentUser } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { localDb } from "../lib/local-db";

export function AccountScreen() {
  const isOnline = useOnlineStatus();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const updateProfile = useMutation(api.users.updateProfile);
  const { data: user, isCached: isUserCached, isLoading: isUserLoading } = useCurrentUser(
    isAuthenticated,
  );
  const queuedMutations = useLiveQuery(() => localDb.queuedMutations.toArray(), [], []);
  const { canInstall, isInstalled, isInstalling, isIos, promptInstall } = useAppInstall();
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setDisplayName(user.name ?? "");
  }, [user]);

  const trimmedDisplayName = displayName.trim();
  const currentDisplayName = user?.name ?? "";
  const hasChanges = user !== undefined && trimmedDisplayName !== currentDisplayName;

  async function handleInstallApp() {
    const choice = await promptInstall();

    if (!choice) {
      toast.info(isIos ? "Añádela desde Safari a tu pantalla de inicio." : "Instalación no disponible todavía.");
      return;
    }

    if (choice.outcome === "accepted") {
      toast.success("Instalación iniciada.");
      return;
    }

    toast.info("Puedes instalar Dividir más tarde desde esta misma pantalla.");
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    if (!trimmedDisplayName) {
      setErrorMessage("Escribe el nombre que quieres usar.");
      setSuccessMessage(null);
      return;
    }

    if (!isOnline) {
      setErrorMessage("Necesitas conexión para actualizar tu nombre.");
      setSuccessMessage(null);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateProfile({ name: trimmedDisplayName });
      setSuccessMessage("Nombre actualizado.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isUserLoading && user === null) {
    return (
      <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="surface-glow flex size-12 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-100">
            <Wallet className="size-5 text-lime-500" />
          </div>
          <div>
            <p className="text-kicker font-mono text-[10px] text-ink-500">Cuenta</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink-50">
              Tu perfil
            </h1>
          </div>
        </div>

        <section className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-6">
          <p className="font-display text-lg font-semibold text-ink-50">Cargando perfil</p>
          <p className="mt-2 text-sm text-ink-300">
            Estamos recuperando tu información.
          </p>
        </section>
      </main>
    );
  }

  if (!user && !isUserLoading) {
    return (
      <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6">
        <RouteState
          actionLabel="Reintentar"
          description={
            isOnline
              ? "No pudimos cargar tu perfil en este momento."
              : "No hay una copia guardada de tu perfil en este dispositivo."
          }
          onAction={() => window.location.reload()}
          title={isOnline ? "Perfil no disponible" : "Sin datos guardados"}
          variant="empty"
        />
      </main>
    );
  }

  return (
    <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6">
      <div className="mb-10 flex items-center gap-3">
        <div className="surface-glow flex size-12 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-100">
          <Wallet className="size-5 text-lime-500" />
        </div>
        <div>
          <p className="text-kicker font-mono text-[10px] text-ink-500">Cuenta</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-50">
            Tu perfil
          </h1>
        </div>
      </div>

      {isUserCached ? (
        <RouteState
          description={
            isOnline
              ? "Estás viendo una copia guardada mientras llega la versión más reciente."
              : "Estás viendo una copia guardada. Los cambios se sincronizarán cuando vuelvas a estar en línea."
          }
          title="Datos guardados"
        />
      ) : null}

      <section className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-6">
        <div className="mb-6">
          <p className="text-kicker mb-3 font-mono text-[10px] text-ink-500">Perfil</p>
          <h2 className="font-display text-xl font-semibold text-ink-50">
            {user?.name ?? user?.email ?? "Tu cuenta"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-300">
            Actualiza cómo apareces en tus grupos. Tu email se muestra solo como referencia.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Nombre visible
            </span>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-obsidian-300 bg-obsidian-50 px-4 py-4 transition focus-within:border-lime-500">
              <UserRound className="size-4 text-lime-500" />
              <input
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                placeholder="Cómo te verá el grupo"
                maxLength={48}
                className="w-full bg-transparent font-display text-base font-semibold text-ink-50 outline-none placeholder:text-ink-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Email
            </span>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-obsidian-300/80 bg-transparent px-4 py-4">
              <Mail className="size-4 text-ink-500" />
              <p className="min-w-0 truncate text-sm text-ink-300">{user?.email ?? "Sin email"}</p>
            </div>
          </label>
        </div>
      </section>

      <InstallAppCard
        canInstall={canInstall}
        isInstalled={isInstalled}
        isInstalling={isInstalling}
        isIos={isIos}
        onInstall={handleInstallApp}
      />

      <div className="mt-6 rounded-xl border border-obsidian-300/70 bg-transparent p-5">
        <div className="flex items-center gap-3">
          <HardDriveDownload className="size-5 text-ink-500" />
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-ink-300">
              Transacciones pendientes
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {queuedMutations.length === 0
                ? "No hay cambios pendientes por sincronizar."
                : `${queuedMutations.length} cambio${queuedMutations.length === 1 ? "" : "s"} pendiente${queuedMutations.length === 1 ? "" : "s"} por sincronizar.`}
            </p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-6 rounded-lg border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-sm text-lime-400">
          {successMessage}
        </p>
      ) : null}

      <div className="mt-10 space-y-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!hasChanges || isSaving || !isOnline || isLoading || isUserLoading}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-lime-500 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserRound className="size-4" />
          {isSaving ? "Guardando nombre" : "Guardar cambios"}
        </button>

        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-obsidian-300 bg-transparent py-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-ink-300 transition hover:border-rose-500 hover:text-rose-500"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
