import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, LogOut, Trash2, Users, Wallet } from "lucide-react";

import { mockGroups, mockMembers } from "../data/mock";

export function GroupSettingsScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/settings" });
  const group = mockGroups.find((item) => item.id === groupId) ?? mockGroups[0];
  const members = mockMembers[group.id] ?? [];

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
          <SettingsRow label="Nombre del grupo" value={group.name} />
          <SettingsRow label="Moneda" value="ARS · Peso argentino" />
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
            {members.map((member) => (
              <div
                key={member.id}
                className="surface-glow flex items-center justify-between rounded-[22px] border border-obsidian-300 bg-obsidian-100 p-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="size-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-display font-semibold text-ink-50">{member.name}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      Miembro {member.isOwner ? "· owner" : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-ink-500" />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 space-y-4">
          <button className="flex w-full items-center justify-center gap-3 rounded-full border border-rose-500/30 bg-rose-500/10 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-rose-500">
            <Trash2 className="size-4" />
            Eliminar grupo
          </button>
          <button className="flex w-full items-center justify-center gap-3 rounded-full border border-obsidian-300 bg-transparent py-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-ink-300">
            <LogOut className="size-4" />
            Abandonar grupo
          </button>
        </div>
      </section>
    </main>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-glow flex items-center justify-between rounded-[22px] border border-obsidian-300 bg-obsidian-100 p-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
        <p className="mt-2 font-display font-semibold text-ink-50">{value}</p>
      </div>
      <ChevronRight className="size-4 text-ink-500" />
    </div>
  );
}
