import { startTransition, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  Bitcoin,
  Check,
  CreditCard,
  HandCoins,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useGroupDetail } from "../hooks/use-group-data";
import { useOnlineStatus } from "../hooks/use-online-status";
import { enqueueSettlementMutation } from "../lib/offline-queue";
import { formatMoney } from "../lib/formatters";

export function SettleScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/settle" });
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const createSettlement = useMutation(api.settlements.create);
  const { data: group, isLoading } = useGroupDetail(groupId as Id<"groups">);
  const [selectedTransferKey, setSelectedTransferKey] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash" | "crypto" | "other">(
    "bank",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!group || selectedTransferKey) {
      return;
    }

    const firstTransfer = group.suggestedTransfers[0];
    if (firstTransfer) {
      setSelectedTransferKey(`${firstTransfer.fromMemberId}:${firstTransfer.toMemberId}`);
    }
  }, [group, selectedTransferKey]);

  const transfer = useMemo(() => {
    if (!group || !selectedTransferKey) {
      return null;
    }

    return (
      group.suggestedTransfers.find(
        (item) => `${item.fromMemberId}:${item.toMemberId}` === selectedTransferKey,
      ) ?? null
    );
  }, [group, selectedTransferKey]);

  const recipient = transfer
    ? group?.members.find((member) => member.memberId === transfer.toMemberId) ?? null
    : null;

  async function handleSettle() {
    if (!group || !transfer) {
      return;
    }

    const clientMutationId = crypto.randomUUID();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!isOnline) {
        await enqueueSettlementMutation({
          amountMinor: String(transfer.amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          fromMemberId: transfer.fromMemberId as Id<"groupMembers">,
          groupId: group.groupId as Id<"groups">,
          paymentMethod,
          settledAt: Date.now(),
          toMemberId: transfer.toMemberId as Id<"groupMembers">,
        });
      } else {
        await createSettlement({
          amountMinor: BigInt(transfer.amountMinor),
          clientMutationId,
          currencyCode: group.currencyCode,
          fromMemberId: transfer.fromMemberId as Id<"groupMembers">,
          groupId: group.groupId as Id<"groups">,
          paymentMethod,
          settledAt: Date.now(),
          toMemberId: transfer.toMemberId as Id<"groupMembers">,
        });
      }

      startTransition(() => {
        void navigate({ params: { groupId }, to: "/groups/$groupId" });
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo registrar la liquidación.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !group) {
    return (
      <main className="min-h-dvh bg-obsidian-0 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
          Cargando liquidación
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-44">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur">
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="font-display text-[13px] font-bold uppercase tracking-[0.24em] text-lime-500">
          Liquidar
        </span>
        <Wallet className="size-5 text-lime-500" />
      </header>

      <section className="px-6 pt-6">
        {recipient ? (
          <div className="mb-6 text-center">
            {recipient.avatarUrl ? (
              <div className="mx-auto mb-3 flex size-[78px] items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-200 p-1">
                <img
                  src={recipient.avatarUrl}
                  alt={recipient.displayName}
                  className="size-full rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="mx-auto mb-3 flex size-[78px] items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-200 font-display text-3xl font-bold text-lime-500">
                {recipient.displayName.slice(0, 1)}
              </div>
            )}
            <p className="font-display text-[13px] uppercase tracking-[0.24em] text-ink-500">
              Pagarás a
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink-50">
              {recipient.displayName}
            </h1>
            <div className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase text-mint-500">
              <ShieldCheck className="size-4" />
              Destinatario verificado
            </div>
          </div>
        ) : null}

        <div className="surface-glow mb-6 rounded-[28px] border border-obsidian-300 bg-obsidian-100 p-6 text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-ink-500">
            Monto total
          </p>
          <div className="mt-3 flex items-baseline justify-center gap-2 font-mono">
            <span className="text-2xl font-bold text-lime-500">$</span>
            <span className="text-[52px] font-bold leading-none tracking-tight text-ink-50">
              {formatMoney(transfer?.amountMinor ?? 0, group.currencyCode).replace("$", "").trim()}
            </span>
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
            vía {group.name}
          </p>
        </div>

        {group.suggestedTransfers.length > 1 ? (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-ink-50">
                Selecciona la transferencia
              </h2>
            </div>
            <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
              {group.suggestedTransfers.map((item) => {
                const key = `${item.fromMemberId}:${item.toMemberId}`;
                const active = key === selectedTransferKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTransferKey(key)}
                    className={[
                      "surface-glow min-w-[240px] snap-start rounded-[20px] border p-4 text-left transition",
                      active
                        ? "border-lime-500 bg-obsidian-200"
                        : "border-obsidian-300 bg-obsidian-100",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                      <p className="font-display font-semibold text-ink-50">
                        {item.fromName} → {item.toName}
                      </p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
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

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-ink-50">
              Método de pago
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime-500">
              Cambiar
            </span>
          </div>

          <div className="space-y-2.5">
            <PaymentOption
              active={paymentMethod === "bank"}
              icon={<CreditCard className="size-5 text-white" />}
              subtitle="Transferencia bancaria"
              title="Transferencia"
              onSelect={() => setPaymentMethod("bank")}
              iconClassName="bg-[#008CFF]"
            />
            <PaymentOption
              active={paymentMethod === "cash"}
              icon={<HandCoins className="size-5 text-obsidian-0" />}
              subtitle="Registro manual"
              title="Efectivo"
              onSelect={() => setPaymentMethod("cash")}
              iconClassName="bg-mint-500"
            />
            <PaymentOption
              active={paymentMethod === "crypto"}
              icon={<Bitcoin className="size-5 text-obsidian-0" />}
              subtitle="USDC / SOLANA"
              title="Cripto"
              onSelect={() => setPaymentMethod("crypto")}
              iconClassName="bg-lime-500"
            />
            <PaymentOption
              active={paymentMethod === "other"}
              icon={<Wallet className="size-5 text-obsidian-0" />}
              subtitle="Otro registro manual"
              title="Otro método"
              onSelect={() => setPaymentMethod("other")}
              iconClassName="bg-obsidian-400"
            />
          </div>
        </section>

        {errorMessage ? (
          <p className="mt-6 rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-20 mx-auto max-w-md px-6">
        <button
          type="button"
          onClick={handleSettle}
          disabled={!transfer || isSubmitting}
          className="relative h-[60px] w-full overflow-hidden rounded-full border border-obsidian-300 bg-obsidian-300 p-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-[12px] font-bold uppercase tracking-[0.3em] text-ink-500">
              {transfer
                ? isSubmitting
                  ? isOnline
                    ? "Registrando pago"
                    : "Encolando pago"
                  : "Registrar liquidación"
                : "Nada por liquidar"}
            </span>
          </div>
          <div className="flex h-full w-[58px] items-center justify-center rounded-full bg-lime-500 text-obsidian-0 shadow-lg">
            <Check className="size-5" />
          </div>
        </button>
      </div>
    </main>
  );
}

function PaymentOption({
  active,
  icon,
  iconClassName,
  onSelect,
  subtitle,
  title,
}: {
  active: boolean;
  icon: React.ReactNode;
  iconClassName: string;
  onSelect: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "surface-glow flex w-full items-center justify-between rounded-[20px] border p-3.5 text-left transition",
        active
          ? "border-lime-500 bg-obsidian-200"
          : "border-obsidian-300 bg-obsidian-100 hover:bg-obsidian-200",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <div className={["flex size-10 items-center justify-center rounded", iconClassName].join(" ")}>
          {icon}
        </div>
        <div>
          <p className="font-display text-[14px] font-bold text-ink-50">{title}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
            {subtitle}
          </p>
        </div>
      </div>
      <div
        className={[
          "flex size-5 items-center justify-center rounded-full border-2",
          active ? "border-lime-500" : "border-obsidian-400",
        ].join(" ")}
      >
        {active ? <div className="size-2.5 rounded-full bg-lime-500" /> : null}
      </div>
    </button>
  );
}
