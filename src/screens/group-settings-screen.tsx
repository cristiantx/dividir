import { startTransition, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ChevronRight,
  Copy,
  LoaderCircle,
  RefreshCcw,
  Share2,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { OverlaySheet } from "../components/overlay-sheet";
import { RouteState } from "../components/route-state";
import { ScreenFrame } from "../components/screen-frame";
import { useGroupDetail } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import {
  showOfflineBlockedToast,
  showQueuedMutationToast,
} from "../lib/offline-feedback";

function formatRoleLabel(role: "owner" | "editor" | "member") {
  if (role === "owner") {
    return "Creador";
  }
  if (role === "editor") {
    return "Editor";
  }
  return "Miembro";
}

export function GroupSettingsScreen() {
  const autosaveDelayMs = 700;
  const { groupId } = useParams({ from: "/groups/$groupId/settings" });
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const updateSettings = useMutation(api.groups.updateSettings);
  const getInviteLink = useMutation(api.groups.getInviteLink);
  const regenerateInviteLink = useMutation(api.groups.regenerateInviteLink);
  const removeMember = useMutation(api.groups.removeMember);
  const archiveGroup = useMutation(api.groups.archive);
  const {
    data: group,
    isCached,
    isLoading,
  } = useGroupDetail(groupId as Id<"groups">);
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("ARS");
  const [lastSyncedName, setLastSyncedName] = useState("");
  const [lastSyncedCurrencyCode, setLastSyncedCurrencyCode] = useState("ARS");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [isInviteRegenerating, setIsInviteRegenerating] = useState(false);
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [renderedInviteSheet, setRenderedInviteSheet] = useState(false);
  const [isInviteSheetVisible, setIsInviteSheetVisible] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [renderedArchiveModal, setRenderedArchiveModal] = useState(false);
  const [isArchiveModalVisible, setIsArchiveModalVisible] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const offlineSettingsNoticeRef = useRef(false);
  const initializedGroupIdRef = useRef<string | null>(null);
  const archiveModalAnimationMs = 220;

  useEffect(() => {
    if (!group || initializedGroupIdRef.current === group.groupId) {
      return;
    }

    initializedGroupIdRef.current = group.groupId;
    setName(group.name);
    setCurrencyCode(group.currencyCode);
    setLastSyncedName(group.name);
    setLastSyncedCurrencyCode(group.currencyCode);
  }, [group]);

  useEffect(() => {
    if (!group) {
      return;
    }

    const hasUnsavedLocalChanges =
      name !== lastSyncedName || currencyCode !== lastSyncedCurrencyCode;
    if (hasUnsavedLocalChanges) {
      return;
    }

    if (
      group.name === lastSyncedName &&
      group.currencyCode === lastSyncedCurrencyCode
    ) {
      return;
    }

    setName(group.name);
    setCurrencyCode(group.currencyCode);
    setLastSyncedName(group.name);
    setLastSyncedCurrencyCode(group.currencyCode);
  }, [currencyCode, group, lastSyncedCurrencyCode, lastSyncedName, name]);

  useEffect(() => {
    setInviteUrl(null);
  }, [group?.groupId]);

  useEffect(() => {
    if (!group?.permissions.canManageInvite || inviteUrl) {
      return;
    }

    if (!isOnline) {
      showOfflineBlockedToast("La invitación requiere conexión.");
      return;
    }

    const origin = window.location.origin;
    setIsInviteLoading(true);

    void getInviteLink({
      groupId: group.groupId as Id<"groups">,
      origin,
    })
      .then((result) => {
        setInviteUrl(result.inviteUrl);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudo preparar la invitación.",
        );
      })
      .finally(() => {
        setIsInviteLoading(false);
      });
  }, [getInviteLink, group, inviteUrl, isOnline]);

  useEffect(() => {
    if (isInviteSheetOpen) {
      setRenderedInviteSheet(true);
      setIsInviteSheetVisible(false);

      let frame1 = 0;
      let frame2 = 0;

      frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => {
          setIsInviteSheetVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frame1);
        window.cancelAnimationFrame(frame2);
      };
    }

    setIsInviteSheetVisible(false);

    if (!renderedInviteSheet) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRenderedInviteSheet(false);
    }, archiveModalAnimationMs);

    return () => window.clearTimeout(timeout);
  }, [archiveModalAnimationMs, isInviteSheetOpen, renderedInviteSheet]);

  useEffect(() => {
    if (isArchiveModalOpen) {
      setRenderedArchiveModal(true);
      setIsArchiveModalVisible(false);

      let frame1 = 0;
      let frame2 = 0;

      frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => {
          setIsArchiveModalVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frame1);
        window.cancelAnimationFrame(frame2);
      };
    }

    setIsArchiveModalVisible(false);

    if (!renderedArchiveModal) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRenderedArchiveModal(false);
    }, archiveModalAnimationMs);

    return () => window.clearTimeout(timeout);
  }, [archiveModalAnimationMs, isArchiveModalOpen, renderedArchiveModal]);

  const hasUnsettledBalances =
    group?.members.some((member) => member.balanceMinor !== 0) ?? false;
  const shareSupported =
    typeof navigator !== "undefined" && typeof navigator.share === "function";
  const normalizedName = name.trim();
  const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
  const nextName = normalizedName || group?.name || "";
  const nextCurrencyCode =
    normalizedCurrencyCode || group?.currencyCode || "ARS";
  const hasPendingSettingsChanges =
    group !== undefined &&
    group !== null &&
    group.permissions.canEditGroup &&
    (nextName !== lastSyncedName ||
      nextCurrencyCode !== lastSyncedCurrencyCode);

  useEffect(() => {
    if (
      !group?.permissions.canEditGroup ||
      !hasPendingSettingsChanges ||
      isSaving
    ) {
      return;
    }

    if (!isOnline) {
      if (!offlineSettingsNoticeRef.current) {
        showQueuedMutationToast(
          "Tus cambios se guardarán cuando vuelvas a estar en línea.",
        );
        offlineSettingsNoticeRef.current = true;
      }
      return;
    }

    offlineSettingsNoticeRef.current = false;

    const timeout = window.setTimeout(() => {
      setIsSaving(true);

      void updateSettings({
        currencyCode: nextCurrencyCode,
        groupId: group.groupId as Id<"groups">,
        name: nextName,
      })
        .then(() => {
          setLastSyncedName(nextName);
          setLastSyncedCurrencyCode(nextCurrencyCode);
        })
        .catch((error) => {
          toast.error(
            error instanceof Error ? error.message : "No se pudo guardar.",
          );
        })
        .finally(() => {
          setIsSaving(false);
        });
    }, autosaveDelayMs);

    return () => window.clearTimeout(timeout);
  }, [
    autosaveDelayMs,
    group,
    hasPendingSettingsChanges,
    isSaving,
    isOnline,
    nextCurrencyCode,
    nextName,
    updateSettings,
  ]);

  async function loadInviteLink(regenerate: boolean) {
    if (!group) {
      return null;
    }

    if (!isOnline) {
      showOfflineBlockedToast("La invitación requiere conexión.");
      return null;
    }

    const origin = window.location.origin;

    if (regenerate) {
      setIsInviteRegenerating(true);
    } else {
      setIsInviteLoading(true);
    }

    try {
      const result = regenerate
        ? await regenerateInviteLink({
            groupId: group.groupId as Id<"groups">,
            origin,
          })
        : await getInviteLink({
            groupId: group.groupId as Id<"groups">,
            origin,
          });

      setInviteUrl(result.inviteUrl);
      return result.inviteUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo preparar la invitación.",
      );
      return null;
    } finally {
      setIsInviteLoading(false);
      setIsInviteRegenerating(false);
    }
  }

  async function handleShareInvite() {
    if (!group) {
      return;
    }

    const url = inviteUrl ?? (await loadInviteLink(false));
    if (!url) {
      return;
    }

    if (shareSupported) {
      try {
        await navigator.share({
          text: "Únete a este grupo de Dividir y dividamos gastos juntos",
          title: group.name,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await copyInviteUrl(url);
  }

  async function copyInviteUrl(url = inviteUrl) {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo copiar el enlace.",
      );
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!group) {
      return;
    }

    if (!isOnline) {
      showOfflineBlockedToast("Quitar miembros requiere conexión.");
      return;
    }

    try {
      await removeMember({
        groupId: group.groupId as Id<"groups">,
        memberId: memberId as Id<"groupMembers">,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo quitar.",
      );
    }
  }

  function openInviteSheet() {
    if (!inviteUrl && !isOnline) {
      showOfflineBlockedToast("La invitación requiere conexión.");
      return;
    }

    setIsInviteSheetOpen(true);
  }

  function closeInviteSheet() {
    if (isInviteLoading || isInviteRegenerating) {
      return;
    }

    setIsInviteSheetOpen(false);
  }

  function openArchiveModal() {
    setIsArchiveModalOpen(true);
  }

  function closeArchiveModal() {
    if (isArchiving) {
      return;
    }

    setIsArchiveModalOpen(false);
  }

  async function handleArchive() {
    if (!group) {
      return;
    }

    if (!isOnline) {
      showOfflineBlockedToast("Archivar el grupo requiere conexión.");
      setIsArchiveModalOpen(false);
      return;
    }

    setIsArchiving(true);

    try {
      await archiveGroup({
        confirmUnsettled: hasUnsettledBalances,
        groupId: group.groupId as Id<"groups">,
      });
      startTransition(() => {
        void navigate({ to: "/groups" });
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo archivar.",
      );
    } finally {
      setIsArchiving(false);
      setIsArchiveModalOpen(false);
    }
  }

  if (isLoading) {
    return (
      <main className="app-stack-safe min-h-dvh bg-obsidian-0 px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando configuración
        </p>
      </main>
    );
  }

  if (!group) {
    return (
      <ScreenFrame
        headerStart={
          <>
            <Link
              to="/groups/$groupId"
              params={{ groupId }}
              className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.24em] text-lime-500">
              Configuración
            </span>
          </>
        }
        headerEnd={<Wallet className="size-5 text-lime-500" />}
        contentClassName="px-6 pt-8"
      >
        <RouteState
          actionLabel="Reintentar"
          description={
            isOnline
              ? "Este grupo ya no está disponible para tu cuenta."
              : "No pudimos cargar la configuración sin conexión y no hay una copia guardada en este dispositivo."
          }
          onAction={() => window.location.reload()}
          title={isOnline ? "Grupo no encontrado" : "Sin datos guardados"}
          variant="empty"
        />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      headerStart={
        <>
          <Link
            to="/groups/$groupId"
            params={{ groupId }}
            className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.24em] text-lime-500">
            Configuración
          </span>
        </>
      }
      headerEnd={<Wallet className="size-5 text-lime-500" />}
      contentClassName="px-6 pt-8"
    >
      {!isOnline && isCached ? (
        <RouteState
          description="Estás viendo una copia guardada. Los cambios se sincronizarán cuando vuelvas a estar en línea."
          title="Datos guardados"
        />
      ) : null}

      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime-500">
          Ajustes de viaje
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-50">
          {group.name}
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
          Tu acceso: {formatRoleLabel(group.viewerRole)}
        </p>
      </div>

      <div className="space-y-4">
        <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Nombre del grupo
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!group.permissions.canEditGroup}
            className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-ink-50 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Moneda
          </label>
          <input
            value={currencyCode}
            onChange={(event) =>
              setCurrencyCode(event.target.value.toUpperCase())
            }
            disabled={!group.permissions.canEditGroup}
            maxLength={3}
            className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-ink-50 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {group.permissions.canManageInvite ? (
          <button
            type="button"
            onClick={openInviteSheet}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-lime-500 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-obsidian-0 transition hover:opacity-95"
          >
            <Share2 className="size-4" />
            <span>Agregar miembros</span>
            {isInviteLoading || isInviteRegenerating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
          </button>
        ) : null}
      </div>

      {group.permissions.canManageMembers ? (
        <>
          <section className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-ink-500" />
              <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                Miembros
              </h2>
            </div>

            <div className="space-y-3">
              {group.members.map((member) => (
                <div
                  key={member.memberId}
                  className="surface-glow flex items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="size-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-11 items-center justify-center rounded-full bg-obsidian-200 font-display text-sm font-bold text-lime-500">
                        {member.displayName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="break-words font-display font-semibold text-ink-50">
                        {member.displayName}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                        {formatRoleLabel(member.role)}{" "}
                        {member.isCurrentUser ? "· tú" : ""}
                      </p>
                    </div>
                  </div>
                  {member.isCurrentUser ? (
                    <ChevronRight className="size-4 text-ink-500" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRemoveMember(member.memberId)}
                      className="rounded-full border border-rose-500/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-500"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <div className="mt-10 space-y-4">
        {group.permissions.canArchiveGroup ? (
          <button
            type="button"
            onClick={openArchiveModal}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-amber-300"
          >
            <Archive className="size-4" />
            Archivar grupo
          </button>
        ) : null}

        {group.permissions.canDeleteGroup ? (
          <button className="flex w-full items-center justify-center gap-3 rounded-full border border-rose-500/30 bg-rose-500/10 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-rose-500">
            <Trash2 className="size-4" />
            Eliminar grupo
          </button>
        ) : null}
      </div>
      {renderedArchiveModal ? (
        <OverlaySheet
          description={
            hasUnsettledBalances
              ? "Archivar ahora ocultará el grupo aunque todavía queden cuentas por cerrar."
              : "El grupo se quitará de tu lista activa y quedará fuera del flujo principal."
          }
          footer={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeArchiveModal}
                disabled={isArchiving}
                className="flex h-12 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-100 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleArchive()}
                disabled={isArchiving}
                className={[
                  "flex h-12 items-center justify-center rounded-full font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60",
                  hasUnsettledBalances ? "bg-amber-400 text-obsidian-0" : "bg-lime-500",
                ].join(" ")}
              >
                {isArchiving ? "Archivando grupo" : "Confirmar archivo"}
              </button>
            </div>
          }
          isVisible={isArchiveModalVisible}
          onClose={closeArchiveModal}
          title={hasUnsettledBalances ? "Todavía hay saldos pendientes" : "Confirma el archivo"}
        >
          <div
            className={[
              "rounded-2xl border px-4 py-4",
              hasUnsettledBalances
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-obsidian-300 bg-obsidian-100",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full",
                  hasUnsettledBalances
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-obsidian-200 text-lime-500",
                ].join(" ")}
              >
                {hasUnsettledBalances ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <Archive className="size-4" />
                )}
              </div>
              <div className="space-y-2">
                <p className="font-display text-base font-semibold text-ink-50">
                  {hasUnsettledBalances
                    ? "Archivar ahora ocultará el grupo aunque todavía queden cuentas por cerrar."
                    : "El grupo se quitará de tu lista activa y quedará fuera del flujo principal."}
                </p>
                <p className="text-sm leading-6 text-ink-300">
                  {hasUnsettledBalances
                    ? "Úsalo solo si decidiste cerrarlo igual. Podrás mantener el historial, pero dejarás de verlo entre tus grupos activos."
                    : "El historial queda intacto, pero el grupo dejará de aparecer en el dashboard."}
                </p>
              </div>
            </div>
          </div>
        </OverlaySheet>
      ) : null}

      {renderedInviteSheet ? (
        <OverlaySheet
          description="Los invitados entran como editores del grupo."
          footer={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleShareInvite()}
                disabled={isInviteLoading || isInviteRegenerating}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-lime-500 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Share2 className="size-4" />
                {shareSupported ? "Compartir" : "Copiar enlace"}
              </button>
              <button
                type="button"
                onClick={() => void copyInviteUrl()}
                disabled={!inviteUrl || isInviteLoading || isInviteRegenerating}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-obsidian-300 bg-obsidian-100 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-ink-50 transition hover:border-lime-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                <Copy className="size-4" />
                Copiar
              </button>
            </div>
          }
          isVisible={isInviteSheetVisible}
          onClose={closeInviteSheet}
          title="Comparte el grupo con un enlace"
        >
          <div className="rounded-2xl border border-obsidian-300 bg-obsidian-100 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-500/10 text-lime-500">
                <Share2 className="size-4" />
              </div>
              <div className="space-y-2">
                <p className="font-display text-base font-semibold text-ink-50">
                  Los invitados entran como editores del grupo.
                </p>
                <p className="text-sm leading-6 text-ink-300">
                  Podrán editar el grupo y registrar gastos o liquidaciones,
                  pero no invitar, quitar miembros ni archivar.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-obsidian-300 bg-obsidian-100 p-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 rounded-xl bg-obsidian-50 px-4 py-3">
                <p className="truncate whitespace-nowrap font-mono text-xs text-ink-300">
                  {inviteUrl ?? "Preparando enlace de invitación…"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadInviteLink(true)}
                disabled={isInviteLoading || isInviteRegenerating}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-50 text-ink-50 transition hover:border-lime-500 hover:text-lime-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isInviteRegenerating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RefreshCcw className="size-4" />
                )}
              </button>
            </div>
          </div>
        </OverlaySheet>
      ) : null}
    </ScreenFrame>
  );
}
