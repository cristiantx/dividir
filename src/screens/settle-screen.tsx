import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Users2,
  Wallet,
} from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AutosizingAmountInput } from "../components/autosizing-amount-input";
import { useGroupDetail } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { enqueueSettlementMutation } from "../lib/offline-queue";
import { formatMoney, formatMoneyInput, parseMoneyInput } from "../lib/formatters";

type PickerOverlayMode = "payer" | "receiver" | null;

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
  description: string;
  items: PickerOverlayItem[];
  title: string;
};

export function SettleScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/settle" });
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const createSettlement = useMutation(api.settlements.create);
  const { data: group, isLoading } = useGroupDetail(groupId as Id<"groups">);
  const [amountInput, setAmountInput] = useState("");
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [receivedByMemberId, setReceivedByMemberId] = useState<string | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<PickerOverlayMode>(null);
  const [renderedOverlay, setRenderedOverlay] = useState<PickerOverlayMode>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedGroupIdRef = useRef<string | null>(null);
  const overlayAnimationMs = 260;

  useEffect(() => {
    if (!group || initializedGroupIdRef.current === group.groupId) {
      return;
    }

    initializedGroupIdRef.current = group.groupId;

    const firstTransfer = group.suggestedTransfers[0];
    if (firstTransfer) {
      setPaidByMemberId(firstTransfer.fromMemberId);
      setReceivedByMemberId(firstTransfer.toMemberId);
      setAmountInput(minorToMoneyInput(firstTransfer.amountMinor));
    } else {
      const defaultPayer =
        group.members.find((member) => member.isCurrentUser) ??
        group.members[0] ??
        null;
      const defaultReceiver =
        group.members.find((member) => member.memberId !== defaultPayer?.memberId) ?? null;

      setPaidByMemberId(defaultPayer?.memberId ?? null);
      setReceivedByMemberId(defaultReceiver?.memberId ?? null);
      setAmountInput("");
    }

    setActiveOverlay(null);
    setErrorMessage(null);
  }, [group]);

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

  const amountMinor = parseMoneyInput(amountInput);
  const payerMember = group?.members.find((member) => member.memberId === paidByMemberId) ?? null;
  const receiverMember =
    group?.members.find((member) => member.memberId === receivedByMemberId) ?? null;
  const selectedSuggestion = useMemo(() => {
    if (!group || !paidByMemberId || !receivedByMemberId) {
      return null;
    }

    return (
      group.suggestedTransfers.find(
        (item) =>
          item.fromMemberId === paidByMemberId && item.toMemberId === receivedByMemberId,
      ) ?? null
    );
  }, [group, paidByMemberId, receivedByMemberId]);

  const payerPickerItems = useMemo<PickerOverlayItem[]>(
    () =>
      group?.members
        ? buildMemberPickerItems({
            members: group.members,
            onSelect: (memberId) => {
              setPaidByMemberId(memberId);
              setErrorMessage(null);
              setActiveOverlay(null);
            },
            selectedIds: paidByMemberId ? new Set([paidByMemberId]) : new Set(),
          })
        : [],
    [group?.members, paidByMemberId],
  );

  const receiverPickerItems = useMemo<PickerOverlayItem[]>(
    () =>
      group?.members
        ? buildMemberPickerItems({
            members: group.members,
            onSelect: (memberId) => {
              setReceivedByMemberId(memberId);
              setErrorMessage(null);
              setActiveOverlay(null);
            },
            selectedIds: receivedByMemberId ? new Set([receivedByMemberId]) : new Set(),
          })
        : [],
    [group?.members, receivedByMemberId],
  );

  const overlayConfig = useMemo<PickerOverlayConfig | null>(() => {
    if (renderedOverlay === "payer") {
      return {
        description: "Selecciona una sola persona.",
        items: payerPickerItems,
        title: "Quién paga",
      };
    }

    if (renderedOverlay === "receiver") {
      return {
        description: "Selecciona una sola persona.",
        items: receiverPickerItems,
        title: "Quién recibe",
      };
    }

    return null;
  }, [payerPickerItems, receiverPickerItems, renderedOverlay]);

  function handleBack() {
    void navigate({ params: { groupId }, to: "/groups/$groupId" });
  }

  function handleAmountChange(rawValue: string) {
    const nextValue = formatMoneyInput(rawValue);
    setAmountInput(nextValue);

    if (errorMessage && parseMoneyInput(nextValue) > 0) {
      setErrorMessage(null);
    }
  }

  function applySuggestion(transfer: NonNullable<typeof selectedSuggestion>) {
    setPaidByMemberId(transfer.fromMemberId);
    setReceivedByMemberId(transfer.toMemberId);
    setAmountInput(minorToMoneyInput(transfer.amountMinor));
    setErrorMessage(null);
  }

  async function handleSubmit() {
    if (!group) {
      return;
    }

    if (!paidByMemberId || !receivedByMemberId) {
      setErrorMessage("Selecciona quién paga y quién recibe.");
      return;
    }

    if (paidByMemberId === receivedByMemberId) {
      setErrorMessage("Quien paga y quien recibe deben ser personas distintas.");
      return;
    }

    if (!group.members.some((member) => member.memberId === paidByMemberId)) {
      setErrorMessage("La persona que paga ya no está disponible.");
      return;
    }

    if (!group.members.some((member) => member.memberId === receivedByMemberId)) {
      setErrorMessage("La persona que recibe ya no está disponible.");
      return;
    }

    if (!amountInput.trim() || amountMinor <= 0) {
      setErrorMessage("Ingresa un monto válido.");
      return;
    }

    const clientMutationId = crypto.randomUUID();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!isOnline) {
        await enqueueSettlementMutation({
          amountMinor: String(amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          fromMemberId: paidByMemberId as Id<"groupMembers">,
          groupId: group.groupId as Id<"groups">,
          settledAt: Date.now(),
          toMemberId: receivedByMemberId as Id<"groupMembers">,
        });
      } else {
        await createSettlement({
          amountMinor: BigInt(amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          fromMemberId: paidByMemberId as Id<"groupMembers">,
          groupId: group.groupId as Id<"groups">,
          settledAt: Date.now(),
          toMemberId: receivedByMemberId as Id<"groupMembers">,
        });
      }

      void navigate({ params: { groupId }, to: "/groups/$groupId" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !group) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando pago
        </p>
      </main>
    );
  }

  const payerLabel = payerMember?.displayName ?? "Selecciona quién paga";
  const receiverLabel = receiverMember?.displayName ?? "Selecciona quién recibe";
  const canSubmit =
    !isSubmitting &&
    Boolean(paidByMemberId) &&
    Boolean(receivedByMemberId) &&
    paidByMemberId !== receivedByMemberId &&
    amountMinor > 0;

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-44">
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
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
              Registrar pago
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
          <p className="text-kicker mb-4 font-mono text-[11px] text-ink-500">
            Monto a registrar
          </p>
          <div className="flex h-[5.5rem] items-center justify-center gap-3">
            <span className="text-metric text-[clamp(3rem,10vw,4.25rem)] font-bold leading-none text-lime-500">
              $
            </span>
            <AutosizingAmountInput
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => handleAmountChange(event.target.value)}
              placeholder="0,00"
              autoComplete="off"
              spellCheck={false}
              className="w-full max-w-[18rem]"
            />
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Puedes registrar un pago parcial o completo.
          </p>
          {errorMessage ? (
            <p className="mt-3 text-sm text-rose-500">{errorMessage}</p>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Quién paga
            </label>
            <button
              type="button"
              onClick={() => setActiveOverlay("payer")}
              className="surface-glow flex w-full items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-4 text-left transition hover:border-lime-500"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
                  {payerMember?.avatarUrl ? (
                    <img
                      src={payerMember.avatarUrl}
                      alt={payerMember.displayName}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-sm font-bold text-lime-500">
                      {payerMember?.displayName.slice(0, 1) ?? <Users2 className="size-5" />}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block truncate font-display font-medium text-ink-50">
                    {payerLabel}
                  </span>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    Selecciona una persona
                  </span>
                </div>
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
              Quién recibe
            </label>
            <button
              type="button"
              onClick={() => setActiveOverlay("receiver")}
              className="surface-glow flex w-full items-center justify-between rounded-xl border border-obsidian-300 bg-obsidian-100 p-4 text-left transition hover:border-lime-500"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
                  {receiverMember?.avatarUrl ? (
                    <img
                      src={receiverMember.avatarUrl}
                      alt={receiverMember.displayName}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-sm font-bold text-lime-500">
                      {receiverMember?.displayName.slice(0, 1) ?? <Users2 className="size-5" />}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block truncate font-display font-medium text-ink-50">
                    {receiverLabel}
                  </span>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    Selecciona una persona
                  </span>
                </div>
              </div>
              <ChevronDown
                className={[
                  "size-4 shrink-0 text-ink-500 transition",
                  activeOverlay === "receiver" && "rotate-180 text-lime-500",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </button>
          </div>

          {selectedSuggestion ? (
            <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-[13px] font-medium uppercase tracking-[0.22em] text-ink-500">
                  Transferencia sugerida
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mint-500">
                  Activa
                </span>
              </div>
              <p className="break-words font-display text-sm font-semibold text-ink-50">
                {selectedSuggestion.fromName} a {selectedSuggestion.toName}
              </p>
              <p className="mt-2 break-words font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                {formatMoney(selectedSuggestion.amountMinor, group.currencyCode)} sugeridos
              </p>
            </div>
          ) : null}

          {group.suggestedTransfers.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-ink-50">
                  Sugerencias
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime-500">
                  Opcional
                </span>
              </div>
              <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
                {group.suggestedTransfers.map((item) => {
                  const active =
                    item.fromMemberId === paidByMemberId &&
                    item.toMemberId === receivedByMemberId;

                  return (
                    <button
                      key={`${item.fromMemberId}:${item.toMemberId}`}
                      type="button"
                      onClick={() => applySuggestion(item)}
                      className={[
                        "surface-glow min-w-[240px] snap-start rounded-xl border p-4 text-left transition",
                        active
                          ? "border-lime-500 bg-obsidian-200"
                          : "border-obsidian-300 bg-obsidian-100",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="break-words font-display font-semibold text-ink-50">
                            {item.fromName} to {item.toName}
                          </p>
                          <p className="mt-1 break-words font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                            Transferencia sugerida
                          </p>
                        </div>
                        <span className="font-mono text-lg font-bold text-mint-500">
                          {formatMoney(item.amountMinor, group.currencyCode)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {group.members.length < 2 ? (
            <div className="rounded-xl border border-dashed border-obsidian-300 bg-obsidian-100 p-5 text-sm text-ink-300">
              Necesitas al menos dos miembros para registrar un pago.
            </div>
          ) : null}
        </div>
      </section>

        <div className="fixed inset-x-0 bottom-6 z-20 mx-auto max-w-md px-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-15 w-full items-center justify-center gap-3 rounded-full bg-lime-500 text-obsidian-0 shadow-[0_0_30px_rgba(212,255,0,0.3)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="size-5" />
            <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.22em]">
              {isSubmitting
                ? isOnline
                  ? "Registrando pago"
                  : "Encolando pago"
                : "Registrar pago"}
            </span>
          </button>
        </div>
      </form>

      {renderedOverlay && overlayConfig ? (
        <PickerOverlay
          description={overlayConfig.description}
          isVisible={isOverlayVisible}
          items={overlayConfig.items}
          onClose={() => setActiveOverlay(null)}
          title={overlayConfig.title}
        />
      ) : null}
    </main>
  );
}

function PickerOverlay({
  description,
  isVisible,
  items,
  onClose,
  title,
}: {
  description: string;
  isVisible: boolean;
  items: PickerOverlayItem[];
  onClose: () => void;
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
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      <div
        className={[
          "relative z-10 w-full max-w-md rounded-t-[32px] border border-obsidian-300 border-b-0 bg-obsidian-0 px-5 pb-5 pt-3 shadow-[0_-28px_60px_rgba(0,0,0,0.42)]",
          "pointer-events-auto transition-transform motion-reduce:transition-none",
          isVisible ? "translate-y-0 duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]" : "translate-y-full duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        ].join(" ")}
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-obsidian-300" />
        <div className="mb-4">
          <h3 className="font-display text-[18px] font-bold text-ink-50">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-300">{description}</p>
        </div>
        <div className="max-h-[50dvh] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onSelect}
              className={[
                "surface-glow flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition",
                item.selected
                  ? "border-lime-500 bg-obsidian-200"
                  : "border-obsidian-300 bg-obsidian-100 hover:bg-obsidian-200",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                {item.leading}
                <div className="min-w-0">
                  <p className="break-words font-display text-[14px] font-bold text-ink-50">
                    {item.title}
                  </p>
                  <p className="break-words font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <div
                className={[
                  "flex size-5 items-center justify-center rounded-full border-2",
                  item.selected ? "border-lime-500" : "border-obsidian-400",
                ].join(" ")}
              >
                {item.selected ? <div className="size-2.5 rounded-full bg-lime-500" /> : null}
              </div>
            </button>
          ))}
        </div>
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
          className="size-11 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200 font-display text-sm font-bold text-lime-500">
          {member.displayName.slice(0, 1)}
        </div>
      ),
      onSelect: () => onSelect(member.memberId),
      selected,
      subtitle: member.isCurrentUser ? "Tú" : "Miembro del grupo",
      title: member.displayName,
    };
  });
}

function minorToMoneyInput(amountMinor: number) {
  return formatMoneyInput((amountMinor / 100).toFixed(2).replace(".", ","));
}
