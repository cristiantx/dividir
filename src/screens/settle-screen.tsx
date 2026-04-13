import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
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
import { PickerOverlay, type PickerOverlayItem } from "../components/picker-overlay";
import { RouteState } from "../components/route-state";
import { ScreenFrame } from "../components/screen-frame";
import { useGroupDetail } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import {
  showOfflineBlockedToast,
  showQueuedMutationToast,
  showSavedMutationToast,
} from "../lib/offline-feedback";
import { enqueueSettlementMutation } from "../lib/offline-queue";
import { formatMoney, formatMoneyInput, parseMoneyInput } from "../lib/formatters";

type PickerOverlayMode = "payer" | "receiver" | null;

type SettlementMode = "create" | "edit";

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

type SuggestedTransfer = {
  amountMinor: number;
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
};

type SettlementFormProps = {
  groupId: Id<"groups">;
  mode: SettlementMode;
  settlementId: Id<"settlements"> | null;
};

function getSuggestionKey(fromMemberId: string, toMemberId: string) {
  return `${fromMemberId}:${toMemberId}`;
}

export function SettleScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/settle" });
  return <SettlementFormScreen groupId={groupId as Id<"groups">} mode="create" settlementId={null} />;
}

export function EditSettlementScreen() {
  const { groupId, settlementId } = useParams({
    from: "/groups/$groupId/settlements/$settlementId/edit",
  });
  return (
    <SettlementFormScreen
      groupId={groupId as Id<"groups">}
      mode="edit"
      settlementId={settlementId as Id<"settlements">}
    />
  );
}

function SettlementFormScreen({ groupId, mode, settlementId }: SettlementFormProps) {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const createSettlement = useMutation(api.settlements.create);
  const updateSettlement = useMutation(api.settlements.update);
  const { data: group, isCached, isLoading } = useGroupDetail(groupId as Id<"groups">);
  const settlement = useQuery(
    api.settlements.get,
    mode === "edit" && settlementId ? { settlementId } : "skip",
  );
  const [amountInput, setAmountInput] = useState("");
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [receivedByMemberId, setReceivedByMemberId] = useState<string | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<PickerOverlayMode>(null);
  const [renderedOverlay, setRenderedOverlay] = useState<PickerOverlayMode>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSuggestionKey, setSelectedSuggestionKey] = useState<string | null>(null);
  const initializedGroupIdRef = useRef<string | null>(null);
  const initializedSettlementIdRef = useRef<string | null>(null);
  const overlayAnimationMs = 260;
  const pageTitle = mode === "edit" ? "Editar pago" : "Registrar pago";
  const amountLabel = mode === "edit" ? "Monto a editar" : "Monto a registrar";
  const submitLabel = isSubmitting
    ? mode === "edit"
      ? "Guardando cambios"
      : isOnline
        ? "Registrando pago"
        : "Encolando pago"
    : mode === "edit"
      ? "Guardar cambios"
      : "Registrar pago";
  const showSuggestions = mode === "create" && (group?.suggestedTransfers?.length ?? 0) > 0;
  const isSettlementLoading = mode === "edit" && settlement === undefined;

  useEffect(() => {
    if (!group || initializedGroupIdRef.current === group.groupId) {
      return;
    }

    initializedGroupIdRef.current = group.groupId;
    setPaidByMemberId(null);
    setReceivedByMemberId(null);
    setAmountInput("");
    setSelectedSuggestionKey(null);
    setActiveOverlay(null);
    setErrorMessage(null);
  }, [group]);

  useEffect(() => {
    if (mode !== "edit" || !settlement || initializedSettlementIdRef.current === settlement.settlementId) {
      return;
    }

    initializedSettlementIdRef.current = settlement.settlementId;
    setAmountInput(minorToMoneyInput(settlement.amountMinor));
    setPaidByMemberId(settlement.fromMemberId);
    setReceivedByMemberId(settlement.toMemberId);
    setSelectedSuggestionKey(null);
    setActiveOverlay(null);
    setErrorMessage(null);
  }, [mode, settlement]);

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

  const payerPickerItems = useMemo<PickerOverlayItem[]>(
    () =>
      group?.members
        ? buildMemberPickerItems({
            members: group.members,
            onSelect: (memberId) => {
              setPaidByMemberId(memberId);
              setSelectedSuggestionKey(null);
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
              setSelectedSuggestionKey(null);
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
    setSelectedSuggestionKey(null);

    if (errorMessage && parseMoneyInput(nextValue) > 0) {
      setErrorMessage(null);
    }
  }

  function applySuggestion(transfer: SuggestedTransfer) {
    setPaidByMemberId(transfer.fromMemberId);
    setReceivedByMemberId(transfer.toMemberId);
    setAmountInput(minorToMoneyInput(transfer.amountMinor));
    setSelectedSuggestionKey(getSuggestionKey(transfer.fromMemberId, transfer.toMemberId));
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

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "edit") {
        if (!settlement) {
          setErrorMessage("No se pudo cargar el pago a editar.");
          return;
        }

        if (!isOnline) {
          showOfflineBlockedToast("Editar un pago requiere conexión.");
          return;
        }

        await updateSettlement({
          amountMinor: BigInt(amountMinor),
          currencyCode: group.currencyCode,
          fromMemberId: paidByMemberId as Id<"groupMembers">,
          groupId: group.groupId as Id<"groups">,
          settledAt: settlement.settledAt,
          settlementId: settlement.settlementId as Id<"settlements">,
          toMemberId: receivedByMemberId as Id<"groupMembers">,
        });
        showSavedMutationToast("Pago actualizado.");
      } else if (!isOnline) {
        const clientMutationId = crypto.randomUUID();
        await enqueueSettlementMutation({
          amountMinor: String(amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          fromMemberId: paidByMemberId as Id<"groupMembers">,
          groupId: group.groupId as Id<"groups">,
          settledAt: Date.now(),
          toMemberId: receivedByMemberId as Id<"groupMembers">,
        });
        showQueuedMutationToast("El pago se guardó sin conexión y se sincronizará al reconectar.");
      } else {
        const clientMutationId = crypto.randomUUID();
        await createSettlement({
          amountMinor: BigInt(amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          fromMemberId: paidByMemberId as Id<"groupMembers">,
          groupId: group.groupId as Id<"groups">,
          settledAt: Date.now(),
          toMemberId: receivedByMemberId as Id<"groupMembers">,
        });
        showSavedMutationToast("Pago registrado.");
      }

      void navigate({ params: { groupId }, to: "/groups/$groupId" });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : mode === "edit"
            ? "No se pudo actualizar el pago."
            : "No se pudo registrar el pago.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isSettlementLoading) {
    return (
      <main className="app-stack-safe min-h-dvh bg-obsidian-0 px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando pago
        </p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6">
        <RouteState
          actionLabel="Reintentar"
          description={
            isOnline
              ? "Este pago ya no está disponible para tu cuenta."
              : "No pudimos cargar este pago sin conexión y no hay una copia guardada en este dispositivo."
          }
          onAction={() => window.location.reload()}
          title={isOnline ? "Pago no disponible" : "Sin datos guardados"}
          variant="empty"
        />
      </main>
    );
  }

  if (mode === "edit" && settlement === null) {
    return (
      <main className="app-page-safe min-h-dvh bg-obsidian-0 px-6">
        <RouteState
          actionLabel="Volver"
          description="Ese pago ya no está disponible para editar."
          onAction={handleBack}
          title="Pago no encontrado"
          variant="empty"
        />
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
    amountMinor > 0 &&
    (mode === "create" || isOnline);

  return (
    <ScreenFrame
      inset="flow"
      headerStart={
        <>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.24em] text-ink-50">
            {pageTitle}
          </span>
        </>
      }
      headerEnd={
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-lime-500" />
          <span className="font-display text-xl font-black tracking-tight text-lime-500">
            DIVIDIR
          </span>
        </div>
      }
      contentClassName="px-6 pt-8"
    >
      {!isOnline && isCached ? (
        <RouteState
          description="Estás viendo una copia guardada. Los cambios se sincronizarán cuando vuelvas a estar en línea."
          title="Datos guardados"
        />
      ) : null}

      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="mb-8 text-center">
          <p className="text-kicker mb-4 font-mono text-[11px] text-ink-500">{amountLabel}</p>
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

          {showSuggestions ? (
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-ink-50">
                  Sugerencias
                </h2>
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-lime-500">
                  Opcional
                </span>
              </div>
              <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
                {group.suggestedTransfers.map((item) => {
                  const active =
                    selectedSuggestionKey ===
                    getSuggestionKey(item.fromMemberId, item.toMemberId);

                  return (
                    <button
                      key={`${item.fromMemberId}:${item.toMemberId}`}
                      type="button"
                      onClick={() => applySuggestion(item)}
                      className={[
                        "surface-glow min-h-[168px] min-w-[calc(100%-1.5rem)] snap-start rounded-2xl border p-5 text-left transition sm:min-w-[320px]",
                        active
                          ? "border-lime-500 bg-obsidian-200 shadow-[0_0_0_1px_rgba(212,255,0,0.18)]"
                          : "border-obsidian-300 bg-obsidian-100 hover:border-obsidian-200 hover:bg-obsidian-200",
                      ].join(" ")}
                    >
                      <div className="flex h-full flex-col justify-between gap-8">
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0">
                            <p className="break-words font-display text-lg font-semibold leading-tight text-ink-50">
                              {item.fromName} a {item.toName}
                            </p>
                            <p className="mt-3 break-words font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                              Transferencia sugerida
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-xl font-bold tracking-tight text-mint-500">
                            {formatMoney(item.amountMinor, group.currencyCode)}
                          </span>
                        </div>
                        <div className="h-px bg-obsidian-300" />
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
        <div className="fixed inset-x-0 bottom-6 z-20 mx-auto max-w-md px-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-15 w-full items-center justify-center gap-3 rounded-full bg-lime-500 text-obsidian-0 shadow-[0_0_30px_rgba(212,255,0,0.3)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="size-5" />
            <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.22em]">
              {submitLabel}
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
          variant="sheet"
        />
      ) : null}
    </ScreenFrame>
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
