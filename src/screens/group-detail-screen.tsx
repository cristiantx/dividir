import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRightLeft,
  ChevronRight,
  CirclePlus,
  Settings2,
  Users2,
  Wallet,
} from "lucide-react";

import type { Id } from "../../convex/_generated/dataModel";
import { useGroupDetail } from "../hooks/use-group-data";
import { formatCompactMoney, formatExpenseTimestamp, formatMoney } from "../lib/formatters";
import { groupIconMap } from "../lib/group-icons";

export function GroupDetailScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId" });
  const { data: group, isLoading } = useGroupDetail(groupId as Id<"groups">);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando grupo
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

  const GroupIcon = groupIconMap[group.icon];
  const canOpenSettings =
    group.permissions.canEditGroup ||
    group.permissions.canManageInvite ||
    group.permissions.canManageMembers ||
    group.permissions.canArchiveGroup ||
    group.permissions.canDeleteGroup;

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
        {canOpenSettings ? (
          <Link
            to="/groups/$groupId/settings"
            params={{ groupId }}
            className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
          >
            <Settings2 className="size-4" />
          </Link>
        ) : (
          <span className="w-10" />
        )}
      </header>

      <section className="px-6 pt-8">
        <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
              <GroupIcon className="size-6 text-mint-500" />
            </div>
            <div className="min-w-0">
              <h1 className="break-words font-display text-2xl font-bold tracking-tight text-ink-50">
                {group.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                <span>{group.currencyCode}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Users2 className="size-3.5" />
                  <span>{group.members.length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-glow mt-4 rounded-xl border border-obsidian-300 bg-obsidian-100 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Tu saldo
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-lime-500">
            {formatCompactMoney(group.ownBalanceMinor, group.currencyCode)}
          </p>
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
          <div className="mb-4">
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Balances
            </h2>
          </div>
          {group.members.length > 0 ? (
            <div className="space-y-3">
              {group.members.map((member) => {
                const positive = member.balanceMinor > 0;
                const zero = member.balanceMinor === 0;
                const outgoingTransfers = group.suggestedTransfers.filter(
                  (transfer) => transfer.fromMemberId === member.memberId,
                );
                const incomingTransfers = group.suggestedTransfers.filter(
                  (transfer) => transfer.toMemberId === member.memberId,
                );
                const isExpanded = expandedMemberId === member.memberId;

                return (
                  <div
                    key={member.memberId}
                    className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-4"
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedMemberId((current) =>
                          current === member.memberId ? null : member.memberId,
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 text-left"
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
                            {member.isCurrentUser ? " · tú" : ""}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                            {zero ? "Saldado" : positive ? "Debe recibir" : "Debe pagar"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={[
                            "font-mono text-lg font-bold tracking-tight",
                            zero
                              ? "text-ink-50"
                              : positive
                                ? "text-mint-500"
                                : "text-rose-500",
                          ].join(" ")}
                        >
                          {formatCompactMoney(member.balanceMinor, group.currencyCode)}
                        </span>
                        <ChevronRight
                          className={[
                            "size-4 text-ink-500 transition",
                            isExpanded ? "rotate-90 text-lime-500" : "",
                          ].join(" ")}
                        />
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="mt-4 border-t border-obsidian-300 pt-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                          Liquidación simplificada
                        </p>

                        {outgoingTransfers.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {outgoingTransfers.map((transfer) => (
                              <div
                                key={`${transfer.fromMemberId}:${transfer.toMemberId}`}
                                className="flex items-center justify-between gap-3 rounded-lg border border-obsidian-300 bg-obsidian-200 px-3 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="break-words font-display text-sm font-semibold text-ink-50">
                                    Debe a {transfer.toName}
                                  </p>
                                </div>
                                <span className="shrink-0 font-mono text-sm font-bold text-rose-400">
                                  {formatMoney(transfer.amountMinor, group.currencyCode)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {incomingTransfers.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {incomingTransfers.map((transfer) => (
                              <div
                                key={`${transfer.fromMemberId}:${transfer.toMemberId}`}
                                className="flex items-center justify-between gap-3 rounded-lg border border-obsidian-300 bg-obsidian-200 px-3 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="break-words font-display text-sm font-semibold text-ink-50">
                                    Recibe de {transfer.fromName}
                                  </p>
                                </div>
                                <span className="shrink-0 font-mono text-sm font-bold text-mint-500">
                                  {formatMoney(transfer.amountMinor, group.currencyCode)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {outgoingTransfers.length === 0 && incomingTransfers.length === 0 ? (
                          <p className="mt-3 text-sm text-ink-300">
                            No tiene transferencias pendientes en la liquidación simplificada.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-obsidian-300 bg-obsidian-100 p-5 text-sm text-ink-300">
              Este grupo todavía no tiene miembros.
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Últimos gastos
            </h2>
            <span className="font-mono text-[11px] text-ink-500">Tiempo real</span>
          </div>
          {group.recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {group.recentExpenses.map((expense) => (
                <Link
                  key={expense.expenseId}
                  to="/groups/$groupId/expenses/$expenseId/edit"
                  params={{ expenseId: expense.expenseId, groupId }}
                  className="surface-glow block rounded-xl border border-obsidian-300 bg-obsidian-100 p-4 transition hover:border-lime-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="break-words font-display font-semibold text-ink-50">
                        {expense.title}
                      </p>
                      <p className="mt-2 break-words text-sm text-ink-300">
                        Pagó {expense.paidBy} · {formatExpenseTimestamp(expense.spentAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-ink-50">
                        {formatMoney(expense.amountMinor, group.currencyCode)}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-lime-500">
                        Editar
                        <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-obsidian-300 bg-obsidian-100 p-5 text-sm text-ink-300">
              Todavía no hay gastos registrados en este grupo.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
