import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  Plane,
  Plus,
  Search,
  Ticket,
  UtensilsCrossed,
  Wallet,
  Users,
} from "lucide-react";

import { mockGroups } from "../data/mock";
import { formatCompactMoney } from "../lib/formatters";

const iconMap = {
  house: Home,
  plane: Plane,
  ticket: Ticket,
  utensils: UtensilsCrossed,
} as const;

export function GroupsScreen() {
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return mockGroups;
    }
    return mockGroups.filter((group) => group.name.toLowerCase().includes(normalized));
  }, [query]);

  const totalBalance = mockGroups.reduce((total, group) => total + group.netAmountMinor, 0);
  const primaryGroup = mockGroups[0];

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-32">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-lime-500" />
        </div>
        <h1 className="font-display text-xl font-black tracking-tight text-lime-500">DIVIDIR</h1>
        <span className="w-5" />
      </header>

      <section className="px-6 pt-8">
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
            className="w-full rounded-[18px] border border-obsidian-300 bg-obsidian-100 py-3 pl-11 pr-4 text-sm text-ink-50 outline-none transition focus:border-lime-500"
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
          {visibleGroups.map((group) => {
            const Icon = iconMap[group.icon];
            const positive = group.netAmountMinor > 0;
            const zero = group.netAmountMinor === 0;
            return (
              <Link
                key={group.id}
                to="/groups/$groupId"
                params={{ groupId: group.id }}
                className="surface-glow flex items-center justify-between rounded-[24px] border border-obsidian-300 bg-obsidian-100 p-5 transition hover:border-lime-500"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
                    <Icon
                      className={[
                        "size-5",
                        positive ? "text-mint-500" : zero ? "text-ink-500" : "text-rose-500",
                      ].join(" ")}
                    />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink-50">{group.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-500">
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
                    {formatCompactMoney(group.netAmountMinor)}
                  </p>
                </div>
              </Link>
            );
          })}

          <button className="flex w-full flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-obsidian-400 px-6 py-8 transition hover:border-lime-500">
            <div className="flex size-10 items-center justify-center rounded-full border border-obsidian-400">
              <Plus className="size-4 text-ink-500" />
            </div>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-ink-500">
              Crear nuevo grupo
            </span>
          </button>
        </div>
      </section>

      <Link
        to="/groups/$groupId/add-expense"
        params={{ groupId: primaryGroup.id }}
        className="fixed bottom-24 right-6 z-30 inline-flex size-14 items-center justify-center rounded-full bg-lime-500 text-obsidian-0 shadow-lg transition active:scale-[0.98]"
      >
        <Plus className="size-6 stroke-[2.5]" />
        <span className="sr-only">Añadir gasto</span>
      </Link>
    </main>
  );
}
