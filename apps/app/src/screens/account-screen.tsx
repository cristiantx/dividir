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
import { useNotificationPreference } from "../hooks/use-notification-preference";
import { useOnlineStatus } from "../hooks/use-online-status";
import { clearCurrentPushSubscription } from "../lib/push-subscription";
import { localDb } from "../lib/local-db";

export function AccountScreen() {
  const isOnline = useOnlineStatus();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const updateProfile = useMutation(api.users.updateProfile);
  const removePushSubscription = useMutation(api.notifications.removePushSubscription);
  const { data: user, isCached: isUserCached, isLoading: isUserLoading } = useCurrentUser(
    isAuthenticated,
  );
  const queuedMutations = useLiveQuery(() => localDb.queuedMutations.toArray(), [], []);
  const { canInstall, isInstalled, isInstalling, isIos, promptInstall } = useAppInstall();
  const { notificationsEnabled, setNotificationsEnabled } = useNotificationPreference();
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingNotificationPermission, setIsRequestingNotificationPermission] =
    useState(false);

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

  async function handleToggleNotifications(nextEnabled: boolean) {
    if (!nextEnabled) {
      setNotificationsEnabled(false);
      toast.info("Notificaciones desactivadas.");
      return;
    }

    if (typeof Notification === "undefined") {
      toast.error("Tu navegador no soporta notificaciones.");
      return;
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      toast.success("Notificaciones activadas.");
      return;
    }

    setIsRequestingNotificationPermission(true);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        setNotificationsEnabled(true);
        toast.success("Notificaciones activadas.");
        return;
      }

      setNotificationsEnabled(false);

      if (result === "denied") {
        toast.info("Las notificaciones quedaron bloqueadas en el navegador.");
        return;
      }

      toast.info("Puedes activarlas más tarde desde el navegador.");
    } finally {
      setIsRequestingNotificationPermission(false);
    }
  }

  const hasNotificationPermission =
    typeof Notification !== "undefined" && Notification.permission === "granted";
  const isNotificationsOn = notificationsEnabled && hasNotificationPermission;

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

  async function handleSignOut() {
    const endpoint = await clearCurrentPushSubscription();
    if (endpoint !== null) {
      try {
        await removePushSubscription({ endpoint });
      } catch {
        // Ignore cleanup errors and continue signing out.
      }
    }

    await signOut();
  }

  if (isUserLoading && user === null) {
    return (
      <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6 md:px-8 lg:mx-auto lg:w-full lg:max-w-5xl lg:px-10 lg:pt-10">
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
      <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6 md:px-8 lg:mx-auto lg:w-full lg:max-w-5xl lg:px-10 lg:pt-10">
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
    <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6 md:px-8 lg:mx-auto lg:w-full lg:max-w-5xl lg:px-10 lg:pt-10">
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

      {!isOnline && isUserCached ? (
        <RouteState
          description="Estás viendo una copia guardada. Los cambios se sincronizarán cuando vuelvas a estar en línea."
          title="Datos guardados"
        />
      ) : null}

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      <div className="min-w-0 space-y-6">
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

      {user?.isAnonymous ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber-300">
            Sesión anónima
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-300">
            Si borras los datos del navegador, esta cuenta anónima no se puede recuperar todavía.
            Más adelante vamos a agregar un enlace de recuperación.
          </p>
        </div>
      ) : null}

      </div>

      <aside className="mt-6 space-y-6 lg:sticky lg:top-28 lg:mt-0">
      <section className="rounded-xl border border-obsidian-300 bg-obsidian-100 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <span className="font-display text-sm font-semibold text-ink-50">Notificaciones</span>

          <button
            type="button"
            role="switch"
            aria-checked={isNotificationsOn}
            aria-label="Notificaciones"
            onClick={() => void handleToggleNotifications(!isNotificationsOn)}
            disabled={isRequestingNotificationPermission}
            className={`relative inline-flex h-7 w-12 items-center rounded-full p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-100 disabled:cursor-not-allowed disabled:opacity-60 ${
              isNotificationsOn ? "bg-lime-500" : "bg-obsidian-300"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-6 rounded-full bg-obsidian-0 shadow-sm transition ${
                isNotificationsOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      <InstallAppCard
        canInstall={canInstall}
        isInstalled={isInstalled}
        isInstalling={isInstalling}
        isIos={isIos}
        onInstall={handleInstallApp}
      />

      <div className="rounded-xl border border-obsidian-300/70 bg-transparent p-5">
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
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-sm text-lime-400">
          {successMessage}
        </p>
      ) : null}

      <div className="space-y-4">
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
          onClick={() => void handleSignOut()}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-obsidian-300 bg-transparent py-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-ink-300 transition hover:border-rose-500 hover:text-rose-500"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
      </aside>
      </div>
    </main>
  );
}
