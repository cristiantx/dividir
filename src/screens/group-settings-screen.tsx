import { startTransition, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  Archive,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useGroupDetail } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";

export function GroupSettingsScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/settings" });
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const updateSettings = useMutation(api.groups.updateSettings);
  const addLocalMember = useMutation(api.groups.addLocalMember);
  const removeMember = useMutation(api.groups.removeMember);
  const archiveGroup = useMutation(api.groups.archive);
  const { data: group, isLoading } = useGroupDetail(groupId as Id<"groups">);
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("ARS");
  const [newMemberName, setNewMemberName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [renderedArchiveModal, setRenderedArchiveModal] = useState(false);
  const [isArchiveModalVisible, setIsArchiveModalVisible] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const archiveModalAnimationMs = 220;

  useEffect(() => {
    if (!group) {
      return;
    }

    setName(group.name);
    setCurrencyCode(group.currencyCode);
  }, [group]);

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

  async function handleSave() {
    if (!group) {
      return;
    }

    if (!isOnline) {
      setErrorMessage("La configuración del grupo requiere conexión.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateSettings({
        currencyCode: currencyCode.trim().toUpperCase() || group.currencyCode,
        groupId: group.groupId as Id<"groups">,
        name: name.trim() || group.name,
      });
      startTransition(() => {
        void navigate({ params: { groupId }, to: "/groups/$groupId" });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddMember() {
    if (!group || !newMemberName.trim()) {
      return;
    }

    try {
      await addLocalMember({
        displayName: newMemberName.trim(),
        groupId: group.groupId as Id<"groups">,
      });
      setNewMemberName("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo agregar.");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!group) {
      return;
    }

    try {
      await removeMember({
        groupId: group.groupId as Id<"groups">,
        memberId: memberId as Id<"groupMembers">,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo quitar.");
    }
  }

  function openArchiveModal() {
    setErrorMessage(null);
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
      setErrorMessage("Archivar el grupo requiere conexión.");
      setIsArchiveModalOpen(false);
      return;
    }

    setIsArchiving(true);
    setErrorMessage(null);

    try {
      await archiveGroup({
        confirmUnsettled: hasUnsettledBalances,
        groupId: group.groupId as Id<"groups">,
      });
      startTransition(() => {
        void navigate({ to: "/groups" });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo archivar.");
    } finally {
      setIsArchiving(false);
      setIsArchiveModalOpen(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando configuración
        </p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-display text-xl font-semibold text-ink-50">Grupo no encontrado</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-28">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
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
        </div>
        <Wallet className="size-5 text-lime-500" />
      </header>

      <section className="px-6 pt-8">
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime-500">
            Ajustes de viaje
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-50">
            {group.name}
          </h1>
        </div>

        <div className="space-y-4">
          <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Nombre del grupo
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-ink-50 outline-none"
            />
          </div>

          <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Moneda
            </label>
            <input
              value={currencyCode}
              onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())}
              maxLength={3}
              className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-ink-50 outline-none"
            />
          </div>

          <SettingsRow label="Invitaciones" value="Pendiente para v1.1" />
        </div>

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
                      {member.role} {member.isCurrentUser ? "· tú" : ""}
                    </p>
                  </div>
                </div>
                {member.isCurrentUser ? (
                  <ChevronRight className="size-4 text-ink-500" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.memberId)}
                    className="rounded-full border border-rose-500/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-500"
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 rounded-xl border border-obsidian-300 bg-obsidian-100 p-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Agregar miembro local
          </label>
          <div className="mt-3 flex gap-3">
            <input
              value={newMemberName}
              onChange={(event) => setNewMemberName(event.target.value)}
              placeholder="Nombre del participante"
              className="flex-1 rounded-lg border border-obsidian-300 bg-obsidian-50 px-4 py-3 text-sm text-ink-50 outline-none transition focus:border-lime-500"
            />
            <button
              type="button"
              onClick={handleAddMember}
              className="inline-flex size-12 items-center justify-center rounded-full bg-lime-500 text-obsidian-0"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-10 space-y-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-lime-500 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wallet className="size-4" />
            {isSaving ? "Guardando ajustes" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={openArchiveModal}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-amber-300"
          >
            <Archive className="size-4" />
            Archivar grupo
          </button>
          <button className="flex w-full items-center justify-center gap-3 rounded-full border border-rose-500/30 bg-rose-500/10 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-rose-500">
            <Trash2 className="size-4" />
            Eliminar grupo
          </button>
        </div>
      </section>

      {renderedArchiveModal ? (
        <ArchiveGroupModal
          hasUnsettledBalances={hasUnsettledBalances}
          isArchiving={isArchiving}
          isVisible={isArchiveModalVisible}
          onArchive={handleArchive}
          onClose={closeArchiveModal}
        />
      ) : null}
    </main>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-glow flex items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
        <p className="mt-2 font-display font-semibold text-ink-50">{value}</p>
      </div>
      <ChevronRight className="size-4 text-ink-500" />
    </div>
  );
}

function ArchiveGroupModal({
  hasUnsettledBalances,
  isArchiving,
  isVisible,
  onArchive,
  onClose,
}: {
  hasUnsettledBalances: boolean;
  isArchiving: boolean;
  isVisible: boolean;
  onArchive: () => void;
  onClose: () => void;
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
        aria-label="Cerrar confirmación de archivo"
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
          "relative w-full max-w-[680px] rounded-t-[2rem] border-t border-obsidian-300 bg-obsidian-0 px-6 pb-6 pt-5",
          "pointer-events-auto transform-gpu will-change-transform",
          "transition-[transform,opacity] motion-reduce:transition-none",
          isVisible
            ? "translate-y-0 opacity-100 duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_-8px_24px_rgba(0,0,0,0.14)]"
            : "translate-y-8 opacity-0 duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_-8px_24px_rgba(0,0,0,0.10)]",
        ].join(" ")}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              {hasUnsettledBalances ? "Advertencia" : "Archivar grupo"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-50">
              {hasUnsettledBalances ? "Todavía hay saldos pendientes" : "Confirma el archivo"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-obsidian-300 text-ink-300 transition hover:border-lime-500 hover:text-lime-500"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
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
                  hasUnsettledBalances ? "bg-amber-500/15 text-amber-300" : "bg-obsidian-200 text-lime-500",
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isArchiving}
              className="flex h-12 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-100 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onArchive}
              disabled={isArchiving}
              className={[
                "flex h-12 items-center justify-center rounded-full font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60",
                hasUnsettledBalances ? "bg-amber-400 text-obsidian-0" : "bg-lime-500",
              ].join(" ")}
            >
              {isArchiving ? "Archivando grupo" : "Confirmar archivo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
