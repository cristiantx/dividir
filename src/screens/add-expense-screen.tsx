import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  CheckCircle2,
  CirclePlus,
  Percent,
  Wallet,
} from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useGroupDetail } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { enqueueExpenseMutation } from "../lib/offline-queue";
import { formatMoney, parseMoneyInput } from "../lib/formatters";

export function AddExpenseScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/add-expense" });
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const createExpense = useMutation(api.expenses.create);
  const { data: group, isLoading } = useGroupDetail(groupId as Id<"groups">);
  const [amountInput, setAmountInput] = useState("");
  const [title, setTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [splitMethod, setSplitMethod] = useState<"equal" | "percentage">("equal");
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedGroupIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!group || initializedGroupIdRef.current === group.groupId) {
      return;
    }

    initializedGroupIdRef.current = group.groupId;
    const nextSelected = new Set(group.members.map((member) => member.memberId));
    setSelectedMembers(nextSelected);
    setPaidByMemberId(
      group.members.find((member) => member.isCurrentUser)?.memberId ??
        group.members[0]?.memberId ??
        null,
    );
    setPercentages(
      Object.fromEntries(buildDefaultPercentages(group.members.map((member) => member.memberId))),
    );
    setAmountInput("");
    setTitle("");
    setSplitMethod("equal");
    setErrorMessage(null);
  }, [group]);

  const amountMinor = parseMoneyInput(amountInput);
  const selectedMemberIds = useMemo(() => Array.from(selectedMembers), [selectedMembers]);
  const percentageTotal = selectedMemberIds.reduce(
    (total, memberId) => total + Number(percentages[memberId] ?? 0),
    0,
  );
  const perPersonAmount = useMemo(() => {
    if (selectedMemberIds.length === 0 || amountMinor <= 0) {
      return 0;
    }
    return Math.round(amountMinor / selectedMemberIds.length);
  }, [amountMinor, selectedMemberIds.length]);

  function toggleMember(memberId: string) {
    setSelectedMembers((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      const entries = buildDefaultPercentages(Array.from(next));
      setPercentages(Object.fromEntries(entries));

      return next;
    });
  }

  async function handleSubmit() {
    if (!group || !paidByMemberId) {
      return;
    }

    if (!title.trim() || amountMinor <= 0 || selectedMemberIds.length === 0) {
      setErrorMessage("Completa el concepto, el monto y al menos un participante.");
      return;
    }

    if (splitMethod === "percentage" && Math.abs(percentageTotal - 100) > 0.01) {
      setErrorMessage("Los porcentajes deben sumar 100%.");
      return;
    }

    const clientMutationId = crypto.randomUUID();
    const shares =
      splitMethod === "equal"
        ? buildEqualShares(amountMinor, selectedMemberIds)
        : buildPercentageShares(amountMinor, selectedMemberIds, percentages);

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!isOnline) {
        await enqueueExpenseMutation({
          amountMinor: String(amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          groupId: group.groupId as Id<"groups">,
          paidByMemberId: paidByMemberId as Id<"groupMembers">,
          shares: shares.map((share) => ({
            amountMinor: String(share.amountMinor),
            memberId: share.memberId as Id<"groupMembers">,
            percentage: share.percentage,
          })),
          splitMethod,
          spentAt: Date.now(),
          title: title.trim(),
        });
      } else {
        await createExpense({
          amountMinor: BigInt(amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          groupId: group.groupId as Id<"groups">,
          paidByMemberId: paidByMemberId as Id<"groupMembers">,
          shares: shares.map((share) => ({
            amountMinor: BigInt(share.amountMinor),
            memberId: share.memberId as Id<"groupMembers">,
            percentage: share.percentage,
          })),
          splitMethod,
          spentAt: Date.now(),
          title: title.trim(),
        });
      }

      startTransition(() => {
        void navigate({ params: { groupId }, to: "/groups/$groupId" });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el gasto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !group) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando gasto
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-44">
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

      <section className="px-6 pt-8">
        <div className="mb-8 text-center">
          <p className="text-kicker mb-4 font-mono text-[11px] text-ink-500">Monto total</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-4xl font-bold text-lime-500">$</span>
            <input
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="0,00"
              autoComplete="off"
              spellCheck={false}
              className="w-full max-w-60 bg-transparent text-center font-mono text-6xl font-bold tracking-tight text-ink-50 outline-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Concepto
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Cena Sushi"
              autoComplete="off"
              spellCheck={false}
              className="surface-glow w-full rounded-[20px] border border-obsidian-300 bg-obsidian-100 p-4 text-ink-50 outline-none transition focus:border-lime-500"
            />
          </div>

          <div className="space-y-2">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Grupo
            </label>
            <div className="surface-glow flex w-full items-center justify-between rounded-[20px] border border-obsidian-300 bg-obsidian-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-mint-500/10">
                  <Wallet className="size-5 text-mint-500" />
                </div>
                <span className="min-w-0 break-words font-display font-medium text-ink-50">
                  {group.name}
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                {group.currencyCode}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                Pagó
              </label>
              <span className="font-mono text-[11px] text-lime-500">Selector activo</span>
            </div>

            {group.members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {group.members.map((member) => {
                  const active = paidByMemberId === member.memberId;
                  return (
                    <button
                      key={member.memberId}
                      type="button"
                      onClick={() => setPaidByMemberId(member.memberId)}
                      className={[
                        "rounded-full border px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                        active
                          ? "border-lime-500 bg-lime-500 text-obsidian-0"
                          : "border-obsidian-300 bg-obsidian-100 text-ink-300",
                      ].join(" ")}
                    >
                      {member.displayName}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-obsidian-300 bg-obsidian-100 px-4 py-3 text-sm text-ink-300">
                No hay miembros en este grupo todavía.
              </div>
            )}
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

            <div className="grid grid-cols-2 gap-2">
              {group.members.map((member) => {
                const active = selectedMembers.has(member.memberId);
                return (
                  <button
                    key={member.memberId}
                    type="button"
                    onClick={() => toggleMember(member.memberId)}
                    className={[
                      "flex min-w-0 items-center gap-2 rounded-[18px] border px-3 py-2.5 text-left transition",
                      active
                        ? "border-lime-500/30 bg-lime-500 text-obsidian-0"
                        : "border-obsidian-300 bg-obsidian-100 text-ink-300 hover:bg-obsidian-200",
                    ].join(" ")}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className={["size-6 rounded-full object-cover", !active && "grayscale opacity-60"]
                          .filter(Boolean)
                          .join(" ")}
                      />
                    ) : (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-obsidian-200 text-[10px] font-bold text-lime-500">
                        {member.displayName.slice(0, 1)}
                      </div>
                    )}
                    <span className="min-w-0 flex-1 break-words font-display text-[12px] font-semibold">
                      {member.displayName}
                    </span>
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

          {splitMethod === "percentage" ? (
            <div className="surface-glow rounded-[24px] border border-obsidian-300 bg-obsidian-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-[13px] font-medium uppercase tracking-[0.22em] text-ink-500">
                  Porcentajes
                </span>
                <span
                  className={[
                    "font-mono text-[11px] uppercase tracking-[0.18em]",
                    Math.abs(percentageTotal - 100) < 0.01 ? "text-mint-500" : "text-rose-500",
                  ].join(" ")}
                >
                  {percentageTotal.toFixed(2)}%
                </span>
              </div>

              <div className="space-y-3">
                {group.members
                  .filter((member) => selectedMembers.has(member.memberId))
                  .map((member) => (
                    <div key={member.memberId} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 break-words font-display font-semibold text-ink-50">
                        {member.displayName}
                      </span>
                      <div className="relative w-28 shrink-0">
                        <input
                          value={percentages[member.memberId] ?? ""}
                          onChange={(event) =>
                            setPercentages((current) => ({
                              ...current,
                              [member.memberId]: event.target.value,
                            }))
                          }
                          inputMode="decimal"
                          className="w-full rounded-[16px] border border-obsidian-300 bg-obsidian-50 px-4 py-3 pr-9 text-right font-mono text-sm text-ink-50 outline-none transition focus:border-lime-500"
                        />
                        <Percent className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="surface-glow rounded-[24px] border border-obsidian-300/80 bg-obsidian-100 p-5">
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
                  {selectedMembers.size > 0 ? formatMoney(perPersonAmount, group.currencyCode) : "—"}
                </span>
              </div>
              <div className="h-px bg-obsidian-300/70" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">Participantes</span>
                <span className="font-display text-xs font-medium uppercase tracking-[0.18em] text-ink-50">
                  {selectedMembers.size > 0 ? `${selectedMembers.size} personas` : "Sin participantes"}
                </span>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-md px-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex h-15 w-full items-center justify-center gap-3 rounded-full bg-lime-500 text-obsidian-0 shadow-[0_0_30px_rgba(212,255,0,0.3)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CirclePlus className="size-5" />
          <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.22em]">
            {isSubmitting
              ? isOnline
                ? "Guardando gasto"
                : "Encolando gasto"
              : "Añadir gasto"}
          </span>
        </button>
      </div>
    </main>
  );
}

function buildDefaultPercentages(memberIds: string[]) {
  if (memberIds.length === 0) {
    return [] as Array<[string, string]>;
  }

  const baseValue = Math.floor((10000 / memberIds.length)) / 100;
  let remaining = 100;

  return memberIds.map((memberId, index) => {
    const value =
      index === memberIds.length - 1 ? remaining : Number(baseValue.toFixed(2));
    remaining = Number((remaining - value).toFixed(2));
    return [memberId, value.toFixed(2)];
  });
}

function buildEqualShares(amountMinor: number, memberIds: string[]) {
  const baseShare = Math.floor(amountMinor / memberIds.length);
  let remainder = amountMinor - baseShare * memberIds.length;

  return memberIds.map<{
    amountMinor: number;
    memberId: string;
    percentage?: number;
  }>((memberId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return {
      amountMinor: baseShare + extra,
      memberId,
    };
  });
}

function buildPercentageShares(
  amountMinor: number,
  memberIds: string[],
  percentages: Record<string, string>,
) {
  let assigned = 0;

  return memberIds.map<{
    amountMinor: number;
    memberId: string;
    percentage?: number;
  }>((memberId, index) => {
    const percentage = Number(percentages[memberId] ?? 0);
    const amountForMember =
      index === memberIds.length - 1
        ? amountMinor - assigned
        : Math.round((amountMinor * percentage) / 100);
    assigned += amountForMember;

    return {
      amountMinor: amountForMember,
      memberId,
      percentage,
    };
  });
}
