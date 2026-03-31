import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ChevronDown, CirclePlus, Wallet } from "lucide-react";

import { mockGroups, mockMembers } from "../data/mock";
import { formatMoney } from "../lib/formatters";

export function AddExpenseScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/add-expense" });
  const group = mockGroups.find((item) => item.id === groupId) ?? mockGroups[0];
  const members = mockMembers[group.id] ?? [];
  const [selectedMembers, setSelectedMembers] = useState(() => new Set(["yo", "ana", "elena"]));
  const [splitMethod, setSplitMethod] = useState<"equal" | "percentage">("equal");

  const perPersonAmount = useMemo(() => {
    if (selectedMembers.size === 0) {
      return 0;
    }
    return Math.round(24890 / selectedMembers.size);
  }, [selectedMembers]);

  function toggleMember(memberId: string) {
    setSelectedMembers((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-32">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to="/groups/$groupId"
            params={{ groupId }}
            className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.24em] text-ink-50">
            Nuevo gasto
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-lime-500" />
          <span className="font-display text-xl font-black tracking-tight text-lime-500">
            DIVIDIR
          </span>
        </div>
      </header>

      <section className="px-6 pt-10">
        <div className="mb-10 text-center">
          <p className="text-kicker mb-4 font-mono text-[11px] text-ink-500">Monto total</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-4xl font-bold text-lime-500">$</span>
            <input
              defaultValue="248,90"
              className="w-full max-w-60 bg-transparent text-center font-mono text-6xl font-bold tracking-tight text-ink-50 outline-none"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Concepto
            </label>
            <input
              defaultValue="Cena Sushi"
              className="surface-glow w-full rounded-[20px] border border-obsidian-300 bg-obsidian-100 p-4 text-ink-50 outline-none transition focus:border-lime-500"
            />
          </div>

          <div className="space-y-2">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Grupo
            </label>
            <button className="surface-glow flex w-full items-center justify-between rounded-[20px] border border-obsidian-300 bg-obsidian-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-mint-500/10">
                  <Wallet className="size-5 text-mint-500" />
                </div>
                <span className="font-display font-medium text-ink-50">{group.name}</span>
              </div>
              <ChevronDown className="size-4 text-ink-500" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                Participantes
              </label>
              <span className="font-mono text-[11px] text-lime-500">
                {selectedMembers.size} seleccionados
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const active = selectedMembers.has(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={[
                      "flex items-center gap-2 rounded-full border px-3 py-2 transition",
                      active
                        ? "border-lime-500/30 bg-lime-500 text-obsidian-0"
                        : "border-obsidian-300 bg-obsidian-100 text-ink-300 hover:bg-obsidian-200",
                    ].join(" ")}
                  >
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className={["size-6 rounded-full object-cover", !active && "grayscale opacity-60"]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    <span className="font-display text-[12px] font-semibold">{member.name}</span>
                    {active ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <CirclePlus className="size-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              División
            </label>
            <div className="rounded-[20px] border border-obsidian-300 bg-obsidian-50 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setSplitMethod("equal")}
                  className={[
                    "rounded-2xl px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.18em] transition",
                    splitMethod === "equal"
                      ? "bg-obsidian-200 text-lime-500 shadow-lg"
                      : "text-ink-500 hover:text-ink-50",
                  ].join(" ")}
                >
                  Partes iguales
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod("percentage")}
                  className={[
                    "rounded-2xl px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.18em] transition",
                    splitMethod === "percentage"
                      ? "bg-obsidian-200 text-lime-500 shadow-lg"
                      : "text-ink-500 hover:text-ink-50",
                  ].join(" ")}
                >
                  Porcentajes
                </button>
              </div>
            </div>
          </div>

          <div className="surface-glow rounded-[24px] border border-obsidian-300/80 bg-obsidian-100 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[13px] font-medium uppercase tracking-[0.22em] text-ink-500">
                Resumen
              </span>
              <span className="font-mono text-[11px] text-ink-500">Auto-calculado</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-50">Cada uno paga</span>
                <span className="font-mono text-xl font-bold text-mint-500">
                  {formatMoney(perPersonAmount)}
                </span>
              </div>
              <div className="h-px bg-obsidian-300/70" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">Participantes</span>
                <span className="font-display text-xs font-medium uppercase tracking-[0.18em] text-ink-50">
                  {selectedMembers.size} personas
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-md px-6">
        <button className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-lime-500 text-obsidian-0 shadow-[0_0_30px_rgba(212,255,0,0.3)] transition active:scale-[0.98]">
          <CirclePlus className="size-5" />
          <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.22em]">
            Añadir gasto
          </span>
        </button>
      </div>
    </main>
  );
}
