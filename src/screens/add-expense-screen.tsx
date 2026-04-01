import type { ReactNode } from "react";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CirclePlus,
  Percent,
  Users2,
  Wallet,
  X,
} from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useGroupDetail, useGroupSummaries } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { enqueueExpenseMutation } from "../lib/offline-queue";
import { formatMoney, formatMoneyInput, parseMoneyInput } from "../lib/formatters";
import { groupIconMap } from "../lib/group-icons";

type FieldErrors = {
  amount?: string;
  group?: string;
  participants?: string;
  title?: string;
};

type AddExpenseScreenProps = {
  initialGroupId: Id<"groups"> | null;
};

type PickerOverlayMode = "group" | "payer" | "participants" | null;

type PickerOverlayItem = {
  id: string;
  leading: ReactNode;
  onSelect: () => void;
  selected: boolean;
  subtitle: string;
  title: string;
};

type MemberPickerSource = {
  avatarUrl: string | null;
  displayName: string;
  isCurrentUser: boolean;
  memberId: string;
};

type PickerOverlayConfig = {
  confirmLabel?: string;
  description: string;
  items: PickerOverlayItem[];
  onConfirm?: () => void;
  title: string;
};

export function GlobalAddExpenseScreen() {
  return <AddExpenseScreen initialGroupId={null} />;
}

export function GroupAddExpenseScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/add-expense" });
  return <AddExpenseScreen initialGroupId={groupId as Id<"groups">} />;
}

function AddExpenseScreen({ initialGroupId }: AddExpenseScreenProps) {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const createExpense = useMutation(api.expenses.create);
  const { data: groups, isLoading: isGroupsLoading } = useGroupSummaries();
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(initialGroupId);
  const { data: group, isLoading: isGroupLoading } = useGroupDetail(
    selectedGroupId,
    selectedGroupId !== null,
  );
  const [amountInput, setAmountInput] = useState("");
  const [title, setTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [splitMethod, setSplitMethod] = useState<"equal" | "percentage">("equal");
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<PickerOverlayMode>(null);
  const [renderedOverlay, setRenderedOverlay] = useState<PickerOverlayMode>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const initializedGroupIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedGroupId(null);
      return;
    }

    setSelectedGroupId((current) => {
      if (current && groups.some((item) => item.groupId === current)) {
        return current;
      }

      if (initialGroupId && groups.some((item) => item.groupId === initialGroupId)) {
        return initialGroupId;
      }

      return groups[0]?.groupId ?? null;
    });
  }, [groups, initialGroupId]);

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
    setActiveOverlay(null);
    setFieldErrors((current) => ({
      amount: current.amount,
      title: current.title,
    }));
    setErrorMessage(null);
  }, [group]);

  const selectedGroupSummary = useMemo(
    () => groups.find((item) => item.groupId === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );
  const amountMinor = parseMoneyInput(amountInput);
  const selectedMemberIds = useMemo(() => {
    if (!group) {
      return [] as string[];
    }

    return group.members
      .filter((member) => selectedMembers.has(member.memberId))
      .map((member) => member.memberId);
  }, [group, selectedMembers]);
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
  const payerLabel =
    group?.members.find((member) => member.memberId === paidByMemberId)?.displayName ??
    "Selecciona quién pagó";
  const selectedMembersLabel = useMemo(() => {
    if (!group || group.members.length === 0) {
      return "Sin participantes";
    }

    if (selectedMemberIds.length === group.members.length) {
      return "Todos";
    }

    if (selectedMemberIds.length === 0) {
      return "Nadie";
    }

    return group.members
      .filter((member) => selectedMembers.has(member.memberId))
      .map((member) => member.displayName)
      .join(", ");
  }, [group, selectedMemberIds.length, selectedMembers]);
  const headerGroupId = selectedGroupId ?? initialGroupId;
  const currencyCode = group?.currencyCode ?? selectedGroupSummary?.currencyCode ?? "ARS";
  const isLoadingGroupState = selectedGroupId !== null && isGroupLoading && !group;
  const overlayAnimationMs = 260;

  const handleSelectGroup = useCallback((groupId: Id<"groups">) => {
    setSelectedGroupId(groupId);
    setFieldErrors((current) => ({
      ...current,
      group: undefined,
      participants: undefined,
    }));
  }, []);

  const handleSelectPayer = useCallback((memberId: string) => {
    setPaidByMemberId(memberId);
    setActiveOverlay(null);
  }, []);

  const toggleMember = useCallback((memberId: string) => {
    setSelectedMembers((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }

      setPercentages(Object.fromEntries(buildDefaultPercentages(Array.from(next))));
      return next;
    });

    if (fieldErrors.participants) {
      setFieldErrors((current) => ({ ...current, participants: undefined }));
    }
  }, [fieldErrors.participants]);

  const groupPickerItems = useMemo<PickerOverlayItem[]>(
    () =>
      groups.map((item) => {
        const Icon = groupIconMap[item.icon];
        return {
          id: item.groupId,
          leading: (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
              <Icon className="size-5 text-mint-500" />
            </div>
          ),
          onSelect: () => {
            handleSelectGroup(item.groupId);
            setActiveOverlay(null);
          },
          selected: item.groupId === selectedGroupId,
          subtitle: `${item.memberCount} participantes · ${item.currencyCode}`,
          title: item.name,
        };
      }),
    [groups, handleSelectGroup, selectedGroupId],
  );

  const payerPickerItems = useMemo<PickerOverlayItem[]>(
    () =>
      group?.members
        ? buildMemberPickerItems({
            members: group.members,
            onSelect: handleSelectPayer,
            selectedIds: paidByMemberId ? new Set([paidByMemberId]) : new Set(),
          })
        : [],
    [group?.members, handleSelectPayer, paidByMemberId],
  );

  const participantPickerItems = useMemo<PickerOverlayItem[]>(
    () =>
      group?.members
        ? buildMemberPickerItems({
            members: group.members,
            onSelect: toggleMember,
            selectedIds: selectedMembers,
          })
        : [],
    [group?.members, selectedMembers, toggleMember],
  );

  useEffect(() => {
    if (activeOverlay) {
      setRenderedOverlay(activeOverlay);
      setIsOverlayVisible(false);

      let frame1 = 0;
      let frame2 = 0;

      frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => {
          setIsOverlayVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frame1);
        window.cancelAnimationFrame(frame2);
      };
    }

    setIsOverlayVisible(false);

    if (!renderedOverlay) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRenderedOverlay(null);
    }, overlayAnimationMs);

    return () => window.clearTimeout(timeout);
  }, [activeOverlay, overlayAnimationMs, renderedOverlay]);

  const overlayConfig = useMemo<PickerOverlayConfig | null>(() => {
    if (renderedOverlay === "group") {
      return {
        description: "Elige dónde quieres registrar el gasto.",
        items: groupPickerItems,
        title: "Seleccionar grupo",
      };
    }

    if (renderedOverlay === "payer") {
      return {
        description: "Selecciona una sola persona.",
        items: payerPickerItems,
        title: "Quién pagó",
      };
    }

    if (renderedOverlay === "participants") {
      return {
        confirmLabel: "Listo",
        description: "Selecciona una o varias personas.",
        items: participantPickerItems,
        title: "Dividir entre",
      };
    }

    return null;
  }, [groupPickerItems, participantPickerItems, payerPickerItems, renderedOverlay]);

  function handleBack() {
    if (headerGroupId) {
      void navigate({ params: { groupId: headerGroupId }, to: "/groups/$groupId" });
      return;
    }

    void navigate({ to: "/groups" });
  }

  function handleAmountChange(rawValue: string) {
    const nextValue = formatMoneyInput(rawValue);
    setAmountInput(nextValue);

    if (fieldErrors.amount && parseMoneyInput(nextValue) > 0) {
      setFieldErrors((current) => ({ ...current, amount: undefined }));
    }
  }

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);

    if (fieldErrors.title && nextTitle.trim()) {
      setFieldErrors((current) => ({ ...current, title: undefined }));
    }
  }

  async function handleSubmit() {
    const nextFieldErrors: FieldErrors = {};

    if (!title.trim()) {
      nextFieldErrors.title = "Ingresa un concepto.";
    }

    if (!selectedGroupId || !group) {
      nextFieldErrors.group = "Selecciona un grupo.";
    }

    if (!amountInput.trim()) {
      nextFieldErrors.amount = "Ingresa un monto.";
    } else if (amountMinor <= 0) {
      nextFieldErrors.amount = "Ingresa un monto válido.";
    }

    if (selectedMemberIds.length === 0) {
      nextFieldErrors.participants = "Selecciona al menos una persona.";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    if (splitMethod === "percentage" && Math.abs(percentageTotal - 100) > 0.01) {
      setErrorMessage("Los porcentajes deben sumar 100%.");
      return;
    }

    if (!group || !paidByMemberId) {
      setErrorMessage("Selecciona quién pagó el gasto.");
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
        void navigate({
          params: { groupId: group.groupId },
          to: "/groups/$groupId",
        });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el gasto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isGroupsLoading && groups.length === 0) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando grupos
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-44">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
          >
            <ArrowLeft className="size-4" />
          </button>
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
          <div className="flex items-center justify-center gap-3">
            <span className="text-metric text-[clamp(3rem,10vw,4.25rem)] font-bold leading-none text-lime-500">
              $
            </span>
            <input
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => handleAmountChange(event.target.value)}
              placeholder="0,00"
              autoComplete="off"
              spellCheck={false}
              className="w-full max-w-[14ch] bg-transparent text-center text-metric text-[clamp(3.5rem,11vw,4.75rem)] font-bold leading-none tracking-tight text-ink-50 outline-none placeholder:text-ink-500/70"
            />
          </div>
          {fieldErrors.amount ? (
            <p className="mt-3 text-sm text-rose-500">{fieldErrors.amount}</p>
          ) : (
            <p className="mt-3 text-xs text-ink-500">Solo números. Se formatea automáticamente.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Concepto
            </label>
            <input
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Ej. Cena Sushi"
              autoComplete="off"
              spellCheck={false}
              className="surface-glow w-full rounded-xl border border-obsidian-300 bg-obsidian-100 p-4 text-ink-50 outline-none transition focus:border-lime-500"
            />
            {fieldErrors.title ? (
              <p className="text-sm text-rose-500">{fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Grupo
            </label>
            <button
              type="button"
              onClick={() => setActiveOverlay("group")}
              className="surface-glow flex w-full items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-4 text-left transition hover:border-lime-500"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint-500/10">
                  {selectedGroupSummary ? (
                    (() => {
                      const Icon = groupIconMap[selectedGroupSummary.icon];
                      return <Icon className="size-5 text-mint-500" />;
                    })()
                  ) : (
                    <Users2 className="size-5 text-mint-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block truncate font-display font-medium text-ink-50">
                    {selectedGroupSummary?.name ?? "Selecciona un grupo"}
                  </span>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    {selectedGroupSummary ? selectedGroupSummary.currencyCode : "Sin grupo"}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={[
                  "size-4 shrink-0 text-ink-500 transition",
                  activeOverlay === "group" && "rotate-180 text-lime-500",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </button>
            {fieldErrors.group ? <p className="text-sm text-rose-500">{fieldErrors.group}</p> : null}
          </div>

          <div className="space-y-3">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Pagó
            </label>
            <button
              type="button"
              onClick={() => group && setActiveOverlay("payer")}
              disabled={!group}
              className="surface-glow flex w-full items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-4 text-left transition hover:border-lime-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="min-w-0">
                <span className="block font-display font-medium text-ink-50">{payerLabel}</span>
                <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                  Selector único
                </span>
              </div>
              <ChevronDown
                className={[
                  "size-4 shrink-0 text-ink-500 transition",
                  activeOverlay === "payer" && "rotate-180 text-lime-500",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </button>
          </div>

          <div className="space-y-3">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Dividir entre
            </label>
            <button
              type="button"
              onClick={() => group && setActiveOverlay("participants")}
              disabled={!group}
              className="surface-glow flex w-full items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-4 text-left transition hover:border-lime-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="min-w-0">
                <span className="block truncate font-display font-medium text-ink-50">
                  {selectedMembersLabel}
                </span>
                <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                  {selectedMemberIds.length > 0 ? `${selectedMemberIds.length} seleccionados` : "Sin selección"}
                </span>
              </div>
              <ChevronDown
                className={[
                  "size-4 shrink-0 text-ink-500 transition",
                  activeOverlay === "participants" && "rotate-180 text-lime-500",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </button>

            {fieldErrors.participants ? (
              <p className="text-sm text-rose-500">{fieldErrors.participants}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              División
            </label>
            <div className="rounded-xl border border-obsidian-300 bg-obsidian-50 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setSplitMethod("equal")}
                  className={[
                    "flex-1 rounded-lg px-4 py-3 font-display text-[12px] font-bold uppercase tracking-tighter shadow-lg transition",
                    splitMethod === "equal"
                      ? "bg-obsidian-200 text-lime-500"
                      : "text-ink-500 hover:text-ink-50",
                  ].join(" ")}
                >
                  Partes iguales
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod("percentage")}
                  className={[
                    "flex-1 rounded-lg px-4 py-3 font-display text-[12px] font-bold uppercase tracking-tighter shadow-lg transition",
                    splitMethod === "percentage"
                      ? "bg-obsidian-200 text-lime-500"
                      : "text-ink-500 hover:text-ink-50",
                  ].join(" ")}
                >
                  Porcentajes
                </button>
              </div>
            </div>
          </div>

          {splitMethod === "percentage" && group ? (
            <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-5">
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
                              [member.memberId]: event.target.value.replace(/[^\d.,]/g, ""),
                            }))
                          }
                          inputMode="decimal"
                          className="w-full rounded-lg border border-obsidian-300 bg-obsidian-50 px-4 py-3 pr-9 text-right font-mono text-sm text-ink-50 outline-none transition focus:border-lime-500"
                        />
                        <Percent className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {!selectedGroupId && !isGroupsLoading ? (
            <div className="rounded-xl border border-dashed border-obsidian-300 bg-obsidian-100 p-5 text-sm text-ink-300">
              No tienes grupos activos para registrar gastos.
            </div>
          ) : null}

          {isLoadingGroupState ? (
            <div className="rounded-xl border border-dashed border-obsidian-300 bg-obsidian-100 p-5 text-sm text-ink-300">
              Cargando miembros del grupo seleccionado.
            </div>
          ) : null}

          <div className="surface-glow rounded-xl border border-obsidian-300/80 bg-obsidian-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[13px] font-medium uppercase tracking-[0.22em] text-ink-500">
                Resumen
              </span>
              <span className="font-mono text-[11px] text-ink-500">Auto-calculado</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink-50">Cada uno paga</span>
                <span className="font-mono text-right text-xl font-bold text-mint-500">
                  {selectedMemberIds.length > 0 ? formatMoney(perPersonAmount, currencyCode) : "—"}
                </span>
              </div>
              <div className="h-px bg-obsidian-300/70" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-ink-500">Dividir entre</span>
                <span className="truncate text-right font-display text-xs font-medium uppercase tracking-[0.18em] text-ink-50">
                  {selectedMembersLabel}
                </span>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-6 z-20 mx-auto max-w-md px-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !group}
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

      {renderedOverlay && overlayConfig ? (
        <PickerOverlay
          confirmLabel={overlayConfig.confirmLabel}
          isVisible={isOverlayVisible}
          items={overlayConfig.items}
          onClose={() => setActiveOverlay(null)}
          onConfirm={overlayConfig.onConfirm}
          title={overlayConfig.title}
          description={overlayConfig.description}
        />
      ) : null}
    </main>
  );
}

function PickerOverlay({
  confirmLabel,
  description,
  isVisible,
  items,
  onClose,
  onConfirm,
  title,
}: {
  confirmLabel?: string;
  description: string;
  isVisible: boolean;
  items: PickerOverlayItem[];
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
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
        aria-label={`Cerrar ${title.toLowerCase()}`}
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
          "relative w-full max-w-[780px] rounded-t-[2rem] border-t border-obsidian-300 bg-obsidian-0 px-6 pb-6 pt-5",
          "pointer-events-auto transform-gpu will-change-transform",
          "transition-[transform,opacity] motion-reduce:transition-none",
          isVisible
            ? "translate-y-0 opacity-100 duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_-8px_24px_rgba(0,0,0,0.14)]"
            : "translate-y-8 opacity-0 duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_-8px_24px_rgba(0,0,0,0.10)]",
        ].join(" ")}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              {title}
            </p>
            <p className="mt-1 text-sm text-ink-300">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-obsidian-300 text-ink-300 transition hover:border-lime-500 hover:text-lime-500"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onSelect}
              className={[
                "surface-glow flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition",
                item.selected
                  ? "border-lime-500/40 bg-lime-500/10"
                  : "border-obsidian-300 bg-obsidian-100 hover:border-lime-500",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                {item.leading}
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold text-ink-50">{item.title}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              {item.selected ? (
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-lime-500 text-obsidian-0">
                  <Check className="size-4" />
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {onConfirm ? (
          <button
            type="button"
            onClick={onConfirm}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-lime-500 font-display text-[12px] font-bold uppercase tracking-[0.22em] text-obsidian-0 shadow-[0_12px_28px_rgba(212,255,0,0.22)] transition hover:bg-lime-500 motion-reduce:transition-none"
          >
            {confirmLabel ?? "Listo"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function buildMemberPickerItems({
  members,
  onSelect,
  selectedIds,
}: {
  members: MemberPickerSource[];
  onSelect: (memberId: string) => void;
  selectedIds: Set<string>;
}): PickerOverlayItem[] {
  return members.map((member) => {
    const selected = selectedIds.has(member.memberId);

    return {
      id: member.memberId,
      leading: member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.displayName}
          className={["size-11 rounded-full object-cover", !selected && "grayscale opacity-60"]
            .filter(Boolean)
            .join(" ")}
        />
      ) : (
        <div
          className={[
            "flex size-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
            selected ? "bg-lime-500 text-obsidian-0" : "bg-obsidian-200 text-lime-500",
          ].join(" ")}
        >
          {member.displayName.slice(0, 1)}
        </div>
      ),
      onSelect: () => onSelect(member.memberId),
      selected,
      subtitle: member.isCurrentUser ? "Tú" : "Miembro",
      title: member.displayName,
    };
  });
}

function buildDefaultPercentages(memberIds: string[]) {
  if (memberIds.length === 0) {
    return [] as Array<[string, string]>;
  }

  const baseValue = Math.floor(10000 / memberIds.length) / 100;
  let remaining = 100;

  return memberIds.map((memberId, index) => {
    const value = index === memberIds.length - 1 ? remaining : Number(baseValue.toFixed(2));
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
    const percentage = Number((percentages[memberId] ?? "0").replace(",", "."));
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
