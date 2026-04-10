import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Archive,
  Check,
  ChevronRight,
  Bell,
  Plus,
  RotateCcw,
  Search,
  Wallet,
  Users,
  X,
} from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useArchivedGroupSummaries, useGroupSummaries } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { showOfflineBlockedToast } from "../lib/offline-feedback";
import { cn } from "../lib/cn";
import { formatCompactMoney } from "../lib/formatters";
import { groupIconMap, type GroupIconName } from "../lib/group-icons";
import { RouteState } from "../components/route-state";
import { ScreenFrame } from "../components/screen-frame";

export function GroupsScreen() {
  const [query, setQuery] = useState("");
  const [isCreateOverlayOpen, setIsCreateOverlayOpen] = useState(false);
  const [renderedCreateOverlay, setRenderedCreateOverlay] = useState(false);
  const [isCreateOverlayVisible, setIsCreateOverlayVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCurrency, setNewGroupCurrency] = useState("ARS");
  const [newGroupIcon, setNewGroupIcon] = useState<GroupIconName>("plane");
  const [isArchivedSectionOpen, setIsArchivedSectionOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [archivedActionError, setArchivedActionError] = useState<string | null>(null);
  const [restoringGroupId, setRestoringGroupId] = useState<string | null>(null);
  const openedCreateOverlayFromRouteRef = useRef(false);
  const suppressCreateOverlayRouteRef = useRef(false);
  const deferredQuery = useDeferredValue(query);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const createGroup = useMutation(api.groups.create);
  const unarchiveGroup = useMutation(api.groups.unarchive);
  const unreadNotificationCount = useQuery(
    api.notifications.unreadCount,
    isAuthenticated ? {} : "skip",
  );
  const isOnline = useOnlineStatus();
  const {
    data: groups,
    isCached: isGroupsCached,
    isLoading,
  } = useGroupSummaries();
  const {
    data: archivedGroups,
    isCached: isArchivedGroupsCached,
    isLoading: isArchivedLoading,
  } = useArchivedGroupSummaries();
  const overlayAnimationMs = 260;
  const isStaleData = !isOnline && (isGroupsCached || isArchivedGroupsCached);
  const isOfflineEmpty = !isOnline && !isStaleData && isLoading && isArchivedLoading;
  const isCreateOverlayRequested = new URLSearchParams(location.search).get("create") === "1";

  const visibleGroups = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) {
      return groups;
    }
    return groups.filter((group) => group.name.toLowerCase().includes(normalized));
  }, [deferredQuery, groups]);

  const totalBalance = groups.reduce((total, group) => total + group.ownBalanceMinor, 0);
  const visibleArchivedGroups = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) {
      return archivedGroups;
    }
    return archivedGroups.filter((group) => group.name.toLowerCase().includes(normalized));
  }, [archivedGroups, deferredQuery]);

  useEffect(() => {
    if (isCreateOverlayOpen) {
      setRenderedCreateOverlay(true);
      setIsCreateOverlayVisible(false);

      let frame1 = 0;
      let frame2 = 0;

      frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => {
          setIsCreateOverlayVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frame1);
        window.cancelAnimationFrame(frame2);
      };
    }

    setIsCreateOverlayVisible(false);

    if (!renderedCreateOverlay) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRenderedCreateOverlay(false);
    }, overlayAnimationMs);

    return () => window.clearTimeout(timeout);
  }, [isCreateOverlayOpen, overlayAnimationMs, renderedCreateOverlay]);

  useEffect(() => {
    if (!isCreateOverlayRequested || isCreateOverlayOpen) {
      return;
    }

    if (suppressCreateOverlayRouteRef.current) {
      return;
    }

    openedCreateOverlayFromRouteRef.current = true;
    setErrorMessage(null);
    setIsCreateOverlayOpen(true);
  }, [isCreateOverlayOpen, isCreateOverlayRequested]);

  useEffect(() => {
    if (!isCreateOverlayRequested) {
      suppressCreateOverlayRouteRef.current = false;
    }
  }, [isCreateOverlayRequested]);

  const openCreateOverlay = useCallback(() => {
    openedCreateOverlayFromRouteRef.current = false;
    setErrorMessage(null);
    setIsCreateOverlayOpen(true);
  }, []);

  const closeCreateOverlay = useCallback(() => {
    setErrorMessage(null);
    setIsCreateOverlayOpen(false);
    if (openedCreateOverlayFromRouteRef.current) {
      openedCreateOverlayFromRouteRef.current = false;
      suppressCreateOverlayRouteRef.current = true;
      void navigate({ replace: true, to: "/groups" });
    }
  }, [navigate]);

  function toggleArchivedSection() {
    setArchivedActionError(null);
    setIsArchivedSectionOpen((current) => !current);
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      setErrorMessage("El grupo necesita un nombre.");
      return;
    }

    if (!isOnline) {
      showOfflineBlockedToast("Crear grupos requiere conexión.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      const groupId = await createGroup({
        currencyCode: newGroupCurrency.trim().toUpperCase() || "ARS",
        icon: newGroupIcon,
        name: newGroupName.trim(),
      });

      const replaceHistory = openedCreateOverlayFromRouteRef.current;
      openedCreateOverlayFromRouteRef.current = false;
      setIsCreateOverlayOpen(false);
      setNewGroupName("");
      setNewGroupCurrency("ARS");
      setNewGroupIcon("plane");
      startTransition(() => {
        void navigate({ params: { groupId }, replace: replaceHistory, to: "/groups/$groupId" });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el grupo.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUnarchive(groupId: string) {
    if (!isOnline) {
      showOfflineBlockedToast("Restaurar grupos requiere conexión.");
      return;
    }

    setRestoringGroupId(groupId);
    setArchivedActionError(null);

    try {
      await unarchiveGroup({ groupId: groupId as Id<"groups"> });
    } catch (error) {
      setArchivedActionError(
        error instanceof Error ? error.message : "No se pudo restaurar el grupo.",
      );
    } finally {
      setRestoringGroupId(null);
    }
  }

  return (
    <ScreenFrame
      inset="tabs"
      headerStart={<Wallet className="size-5 text-lime-500" />}
      headerCenter={
        <h1 className="font-display text-xl font-black tracking-tight text-lime-500">DIVIDIR</h1>
      }
      headerEnd={
        <Link
          to="/notifications"
          viewTransition={{ types: ["notifications-open"] }}
          aria-label="Abrir notificaciones"
          className="relative inline-flex size-10 items-center justify-center rounded-full border border-obsidian-300 text-ink-300 transition hover:border-lime-500 hover:text-lime-500"
        >
          <Bell className="size-4" />
          {unreadNotificationCount && unreadNotificationCount > 0 ? (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-lime-500 shadow-[0_0_0_2px_var(--color-obsidian-0)]" />
          ) : null}
        </Link>
      }
      contentClassName="px-6 pt-8"
    >
      {isOfflineEmpty ? (
        <RouteState
          actionLabel="Reintentar"
          description="No hay grupos guardados en este dispositivo. Vuelve a conectarte para cargar tu lista o reintenta si ya recuperaste la conexión."
          onAction={() => window.location.reload()}
          title="Sin datos guardados"
          variant="empty"
        />
      ) : (
        <>
          {isStaleData ? (
            <RouteState
              description="Estás viendo una copia guardada. Los cambios se sincronizarán cuando vuelvas a estar en línea."
              title="Datos guardados"
            />
          ) : null}

        <div className="mb-8">
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.22em] text-ink-500">
            Resumen total
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-mono text-4xl font-bold tracking-tight text-lime-500">
              {formatCompactMoney(totalBalance)}
            </span>
            <span className="pb-1 font-mono text-xs uppercase tracking-[0.16em] text-ink-500">
              ARS
            </span>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar grupos..."
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-obsidian-300 bg-obsidian-100 py-3 pl-11 pr-4 text-sm text-ink-50 outline-none transition focus:border-lime-500"
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.22em] text-ink-500">
            Mis grupos
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime-500">
            {visibleGroups.length} activos
          </span>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-5 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                Cargando grupos
              </p>
            </div>
          ) : null}

          {visibleGroups.map((group) => {
            const Icon = groupIconMap[group.icon];
            const positive = group.ownBalanceMinor > 0;
            const zero = group.ownBalanceMinor === 0;
            return (
              <Link
                key={group.groupId}
                to="/groups/$groupId"
                params={{ groupId: group.groupId }}
                className="surface-glow flex items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-5 transition hover:border-lime-500"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
                    <Icon
                      className={[
                        "size-5",
                        positive ? "text-mint-500" : zero ? "text-ink-500" : "text-rose-500",
                      ].join(" ")}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-display text-lg font-semibold text-ink-50">
                      {group.name}
                    </p>
                    <p className="mt-1 flex items-center gap-2 break-words text-xs uppercase tracking-[0.18em] text-ink-500">
                      <Users className="size-3" />
                      {group.memberCount} participantes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    {group.statusLabel}
                  </p>
                  <p
                    className={[
                      "mt-2 font-mono text-xl font-bold tracking-tight",
                      positive ? "text-mint-500" : zero ? "text-ink-500" : "text-rose-500",
                    ].join(" ")}
                  >
                    {formatCompactMoney(group.ownBalanceMinor, group.currencyCode)}
                  </p>
                </div>
              </Link>
            );
          })}

          {visibleGroups.length === 0 && !isLoading ? (
            <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-6 text-center">
              <p className="font-display text-lg font-semibold text-ink-50">
                {query.trim() ? "No hay resultados." : "Aún no tienes grupos."}
              </p>
              <p className="mt-2 text-sm text-ink-300">
                {query.trim()
                  ? "Prueba con otro término o limpia la búsqueda."
                  : "Crea el primero para empezar a dividir gastos reales."}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={openCreateOverlay}
            className="flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-obsidian-400 px-6 py-8 transition hover:border-lime-500"
          >
            <div className="flex size-10 items-center justify-center rounded-full border border-obsidian-400">
              <Plus className="size-4 text-ink-500" />
            </div>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-ink-500">
              Crear nuevo grupo
            </span>
          </button>

          {archivedGroups.length > 0 ? (
            <>
              <button
                type="button"
                onClick={toggleArchivedSection}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-obsidian-300/70 bg-obsidian-100/50 px-5 py-4 text-left transition hover:border-obsidian-300 hover:bg-obsidian-100"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-50 text-ink-500">
                    <Archive className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      {isArchivedSectionOpen ? "Ocultar archivados" : "Ver archivados"}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      {archivedGroups.length} grupos fuera del flujo activo
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 text-ink-500 transition",
                    isArchivedSectionOpen && "rotate-90 text-ink-300",
                  )}
                />
              </button>

              {isArchivedSectionOpen ? (
                <div className="space-y-3">
                  {archivedActionError ? (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                      {archivedActionError}
                    </div>
                  ) : null}

                  {isArchivedLoading ? (
                    <div className="rounded-xl border border-obsidian-300/70 bg-obsidian-100/40 p-5 text-center">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                        Cargando archivados
                      </p>
                    </div>
                  ) : null}

                  {visibleArchivedGroups.map((group) => (
                    <ArchivedGroupCard
                      key={group.groupId}
                      group={group}
                      isRestoring={restoringGroupId === group.groupId}
                      onUnarchive={handleUnarchive}
                    />
                  ))}

                  {!isArchivedLoading && visibleArchivedGroups.length === 0 ? (
                    <div className="rounded-xl border border-obsidian-300/70 bg-obsidian-100/40 p-5 text-center">
                      <p className="font-display text-base font-semibold text-ink-300">
                        No hay archivados para esa búsqueda.
                      </p>
                      <p className="mt-2 text-sm text-ink-500">
                        Prueba con otro término o limpia la búsqueda para verlos.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        </>
      )}

      {renderedCreateOverlay ? (
        <CreateGroupOverlay
          errorMessage={errorMessage}
          groupCurrency={newGroupCurrency}
          groupIcon={newGroupIcon}
          groupName={newGroupName}
          isCreating={isCreating}
          isVisible={isCreateOverlayVisible}
          onClose={closeCreateOverlay}
          onCreate={handleCreateGroup}
          onCurrencyChange={setNewGroupCurrency}
          onGroupNameChange={setNewGroupName}
          onIconChange={setNewGroupIcon}
        />
      ) : null}

    </ScreenFrame>
  );
}

function ArchivedGroupCard({
  group,
  isRestoring,
  onUnarchive,
}: {
  group: {
    archivedAt: number | null;
    canUnarchive: boolean;
    currencyCode: string;
    groupId: string;
    icon: GroupIconName;
    memberCount: number;
    name: string;
    ownBalanceMinor: number;
    statusLabel: string;
  };
  isRestoring: boolean;
  onUnarchive: (groupId: string) => void;
}) {
  const Icon = groupIconMap[group.icon];
  const balanceColor =
    group.ownBalanceMinor === 0
      ? "text-ink-400"
      : group.ownBalanceMinor > 0
        ? "text-mint-500/70"
        : "text-rose-500/70";

  return (
    <div className="rounded-xl border border-obsidian-300/70 bg-obsidian-100/40 p-5 opacity-80">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-50">
            <Icon className="size-5 text-ink-500" />
          </div>
          <div className="min-w-0">
            <p className="break-words font-display text-lg font-semibold text-ink-200">
              {group.name}
            </p>
            <p className="mt-1 flex items-center gap-2 break-words text-xs uppercase tracking-[0.18em] text-ink-500">
              <Users className="size-3" />
              {group.memberCount} participantes
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Archivado
          </p>
          <p className={cn("mt-2 font-mono text-lg font-bold tracking-tight", balanceColor)}>
            {formatCompactMoney(group.ownBalanceMinor, group.currencyCode)}
          </p>
        </div>
      </div>

      {group.canUnarchive ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onUnarchive(group.groupId)}
            disabled={isRestoring}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-lime-500/30 bg-lime-500/10 px-4 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-lime-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="size-3.5" />
            {isRestoring ? "Restaurando" : "Restaurar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CreateGroupOverlay({
  errorMessage,
  groupCurrency,
  groupIcon,
  groupName,
  isCreating,
  isVisible,
  onClose,
  onCreate,
  onCurrencyChange,
  onGroupNameChange,
  onIconChange,
}: {
  errorMessage: string | null;
  groupCurrency: string;
  groupIcon: GroupIconName;
  groupName: string;
  isCreating: boolean;
  isVisible: boolean;
  onClose: () => void;
  onCreate: () => void;
  onCurrencyChange: (value: string) => void;
  onGroupNameChange: (value: string) => void;
  onIconChange: (value: GroupIconName) => void;
}) {
  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-end justify-center",
        "pointer-events-none",
        "motion-reduce:transition-none",
      ].join(" ")}
      aria-hidden={!isVisible}
    >
      <div
        className={[
          "absolute inset-0 bg-obsidian-0/75 transition-opacity motion-reduce:transition-none",
          isVisible
            ? "opacity-100 duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            : "opacity-0 duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        ].join(" ")}
      />
      <button
        type="button"
        aria-label="Cerrar creación de grupo"
        onClick={onClose}
        className={[
          "absolute inset-0 pointer-events-auto",
          "transition-opacity motion-reduce:transition-none",
          isVisible
            ? "opacity-100 duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            : "opacity-0 duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        ].join(" ")}
      />
      <div
        className={[
          "relative w-full max-w-[780px] rounded-t-[2rem] border-t border-obsidian-300 bg-obsidian-0 px-6 pb-6 pt-5",
          "pointer-events-auto transform-gpu will-change-transform",
          "transition-[transform,opacity] motion-reduce:transition-none",
          isVisible
            ? "translate-y-0 opacity-100 duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_-8px_24px_rgba(0,0,0,0.14)]"
            : "translate-y-8 opacity-0 duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_-8px_24px_rgba(0,0,0,0.10)]",
        ].join(" ")}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Crear nuevo grupo
            </p>
            <p className="mt-1 text-sm text-ink-300">
              Define nombre, moneda e icono antes de guardarlo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-obsidian-300 text-ink-300 transition hover:border-lime-500 hover:text-lime-500"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-500">
              Nombre
            </label>
            <input
              value={groupName}
              onChange={(event) => onGroupNameChange(event.target.value)}
              placeholder="Ej. Escapada Mendoza"
              className="mt-2 w-full rounded-lg border border-obsidian-300 bg-obsidian-50 px-4 py-3 text-sm text-ink-50 outline-none transition focus:border-lime-500"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                Moneda
              </label>
              <input
                value={groupCurrency}
                onChange={(event) => onCurrencyChange(event.target.value.toUpperCase())}
                maxLength={3}
                className="mt-2 w-full rounded-lg border border-obsidian-300 bg-obsidian-50 px-4 py-3 text-sm text-ink-50 outline-none transition focus:border-lime-500"
              />
            </div>

            <div>
              <label className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                Icono
              </label>
              <div className="mt-2 flex gap-2">
                {Object.entries(groupIconMap).map(([iconKey, Icon]) => (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => onIconChange(iconKey as GroupIconName)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border transition",
                      groupIcon === iconKey
                        ? "border-lime-500 bg-lime-500 text-obsidian-0"
                        : "border-obsidian-300 bg-obsidian-50 text-ink-500",
                    )}
                    aria-label={`Seleccionar icono ${iconKey}`}
                  >
                    {groupIcon === iconKey ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="flex h-12 items-center justify-center rounded-full bg-lime-500 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Creando grupo" : "Guardar grupo"}
          </button>
        </div>
      </div>
    </div>
  );
}
