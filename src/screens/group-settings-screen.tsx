import { startTransition, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Wallet,
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
  const { data: group, isLoading } = useGroupDetail(groupId as Id<"groups">);
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("ARS");
  const [newMemberName, setNewMemberName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!group) {
      return;
    }

    setName(group.name);
    setCurrencyCode(group.currencyCode);
  }, [group]);

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

  if (isLoading || !group) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando configuración
        </p>
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
          <button className="flex w-full items-center justify-center gap-3 rounded-full border border-rose-500/30 bg-rose-500/10 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-rose-500">
            <Trash2 className="size-4" />
            Eliminar grupo
          </button>
        </div>
      </section>
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
