import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRightLeft,
  ChevronRight,
  CirclePlus,
  Plane,
  Settings2,
  Wallet,
} from "lucide-react";

import { mockExpenses, mockGroups, mockMembers } from "../data/mock";
import { formatCompactMoney, formatMoney } from "../lib/formatters";

export function GroupDetailScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId" });
  const group = mockGroups.find((item) => item.id === groupId) ?? mockGroups[0];
  const members = mockMembers[group.id] ?? [];
  const expenses = mockExpenses[group.id] ?? [];

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-28">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur">
        <Link
          to="/groups"
          className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-lime-500" />
          <span className="font-display text-xl font-black tracking-tight text-lime-500">
            DIVIDIR
          </span>
        </div>
        <Link
          to="/groups/$groupId/settings"
          params={{ groupId }}
          className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
        >
          <Settings2 className="size-4" />
        </Link>
      </header>

      <section className="px-6 pt-8">
        <div className="surface-glow rounded-[28px] border border-obsidian-300 bg-obsidian-100 p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
                <Plane className="size-6 text-mint-500" />
              </div>
              <div>
                <p className="text-kicker font-mono text-[10px] text-ink-500">Grupo activo</p>
                <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-50">
                  {group.name}
                </h1>
              </div>
            </div>
            <span className="rounded-full border border-mint-500/20 bg-mint-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-mint-500">
              {group.memberCount} personas
            </span>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-kicker mb-3 font-mono text-[10px] text-ink-500">Tu saldo</p>
              <p className="font-mono text-4xl font-bold tracking-tight text-lime-500">
                {formatCompactMoney(group.netAmountMinor)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-kicker mb-3 font-mono text-[10px] text-ink-500">Moneda</p>
              <p className="font-mono text-sm text-ink-300">ARS</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            to="/groups/$groupId/add-expense"
            params={{ groupId }}
            className="flex items-center justify-center gap-2 rounded-full bg-lime-500 px-4 py-4 font-display text-[12px] font-bold uppercase tracking-[0.2em] text-obsidian-0 shadow-[0_0_30px_rgba(212,255,0,0.2)]"
          >
            <CirclePlus className="size-4" />
            Agregar
          </Link>
          <Link
            to="/groups/$groupId/settle"
            params={{ groupId }}
            className="flex items-center justify-center gap-2 rounded-full border border-obsidian-300 bg-obsidian-100 px-4 py-4 font-display text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-50"
          >
            <ArrowRightLeft className="size-4" />
            Liquidar
          </Link>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Miembros
            </h2>
            <span className="font-mono text-[11px] text-lime-500">Balances vivos</span>
          </div>
          <div className="space-y-3">
            {members.map((member) => {
              const positive = member.balanceMinor >= 0;
              return (
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
                      <p className="font-display font-semibold text-ink-50">
                        {member.name}
                        {member.isOwner ? " · tú" : ""}
                      </p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                        {positive ? "Debe recibir" : "Debe pagar"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      "font-mono text-lg font-bold tracking-tight",
                      positive ? "text-mint-500" : "text-rose-500",
                    ].join(" ")}
                  >
                    {formatCompactMoney(member.balanceMinor)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Últimos gastos
            </h2>
            <span className="font-mono text-[11px] text-ink-500">Tiempo real</span>
          </div>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="surface-glow rounded-[22px] border border-obsidian-300 bg-obsidian-100 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-ink-50">{expense.title}</p>
                    <p className="mt-2 text-sm text-ink-300">
                      Pagó {expense.paidBy} · {expense.when}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-ink-50">
                      {formatMoney(expense.amountMinor)}
                    </p>
                    <button className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime-500">
                      Ver más
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
