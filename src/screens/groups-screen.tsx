import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Plus, Search, Wallet, Users } from "lucide-react";

import { api } from "../../convex/_generated/api";
import { useGroupSummaries } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { cn } from "../lib/cn";
import { formatCompactMoney } from "../lib/formatters";
import { groupIconMap, type GroupIconName } from "../lib/group-icons";

export function GroupsScreen() {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCurrency, setNewGroupCurrency] = useState("ARS");
  const [newGroupIcon, setNewGroupIcon] = useState<GroupIconName>("plane");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const navigate = useNavigate();
  const createGroup = useMutation(api.groups.create);
  const isOnline = useOnlineStatus();
  const { data: groups, isLoading } = useGroupSummaries();

  const visibleGroups = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) {
      return groups;
    }
    return groups.filter((group) => group.name.toLowerCase().includes(normalized));
  }, [deferredQuery, groups]);

  const totalBalance = groups.reduce((total, group) => total + group.ownBalanceMinor, 0);
  const primaryGroup = groups[0] ?? null;

  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      setErrorMessage("El grupo necesita un nombre.");
      return;
    }

    if (!isOnline) {
      setErrorMessage("Crear grupos offline queda fuera de este primer corte.");
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

      setIsCreateOpen(false);
      setNewGroupName("");
      startTransition(() => {
        void navigate({ params: { groupId }, to: "/groups/$groupId" });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el grupo.");
    } finally {
      setIsCreating(false);
    }
  }

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
          {isLoading ? (
            <div className="surface-glow rounded-[24px] border border-obsidian-300 bg-obsidian-100 p-5 text-center">
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
                    {formatCompactMoney(group.ownBalanceMinor, group.currencyCode)}
                  </p>
                </div>
              </Link>
            );
          })}

          {visibleGroups.length === 0 && !isLoading ? (
            <div className="surface-glow rounded-[24px] border border-obsidian-300 bg-obsidian-100 p-6 text-center">
              <p className="font-display text-lg font-semibold text-ink-50">
                Aún no tienes grupos.
              </p>
              <p className="mt-2 text-sm text-ink-300">
                Crea el primero para empezar a dividir gastos reales.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setIsCreateOpen((current) => !current);
            }}
            className="flex w-full flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-obsidian-400 px-6 py-8 transition hover:border-lime-500"
          >
            <div className="flex size-10 items-center justify-center rounded-full border border-obsidian-400">
              <Plus className="size-4 text-ink-500" />
            </div>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-ink-500">
              Crear nuevo grupo
            </span>
          </button>

          {isCreateOpen ? (
            <div className="surface-glow rounded-[24px] border border-obsidian-300 bg-obsidian-100 p-5">
              <div className="grid gap-4">
                <div>
                  <label className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                    Nombre
                  </label>
                  <input
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                    placeholder="Ej. Escapada Mendoza"
                    className="mt-2 w-full rounded-[18px] border border-obsidian-300 bg-obsidian-50 px-4 py-3 text-sm text-ink-50 outline-none transition focus:border-lime-500"
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div>
                    <label className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                      Moneda
                    </label>
                    <input
                      value={newGroupCurrency}
                      onChange={(event) => setNewGroupCurrency(event.target.value.toUpperCase())}
                      maxLength={3}
                      className="mt-2 w-full rounded-[18px] border border-obsidian-300 bg-obsidian-50 px-4 py-3 text-sm text-ink-50 outline-none transition focus:border-lime-500"
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
                          onClick={() => setNewGroupIcon(iconKey as GroupIconName)}
                          className={cn(
                            "flex size-11 items-center justify-center rounded-full border transition",
                            newGroupIcon === iconKey
                              ? "border-lime-500 bg-lime-500 text-obsidian-0"
                              : "border-obsidian-300 bg-obsidian-50 text-ink-500",
                          )}
                        >
                          <Icon className="size-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {errorMessage ? (
                  <p className="rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={isCreating}
                  className="flex h-12 items-center justify-center rounded-full bg-lime-500 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creando grupo" : "Guardar grupo"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {primaryGroup ? (
        <Link
          to="/groups/$groupId/add-expense"
          params={{ groupId: primaryGroup.groupId }}
          className="fixed bottom-24 right-6 z-30 inline-flex size-14 items-center justify-center rounded-full bg-lime-500 text-obsidian-0 shadow-lg transition active:scale-[0.98]"
        >
          <Plus className="size-6 stroke-[2.5]" />
          <span className="sr-only">Añadir gasto</span>
        </Link>
      ) : null}
    </main>
  );
}
