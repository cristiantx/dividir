import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bitcoin,
  Check,
  CreditCard,
  HandCoins,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { mockGroups, mockMembers, mockSuggestedTransfers } from "../data/mock";
import { formatMoney } from "../lib/formatters";

export function SettleScreen() {
  const { groupId } = useParams({ from: "/groups/$groupId/settle" });
  const transfer = mockSuggestedTransfers[groupId as keyof typeof mockSuggestedTransfers];
  const group = mockGroups.find((item) => item.id === groupId) ?? mockGroups[0];
  const recipient =
    mockMembers[group.id]?.find((member) => member.id === transfer?.toMemberId) ??
    mockMembers[group.id]?.[1];
  const [paymentMethod, setPaymentMethod] = useState<"venmo" | "cash" | "crypto">("venmo");

  return (
    <main className="min-h-dvh bg-obsidian-0 pb-32">
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

      <section className="px-6 pt-8">
        {recipient ? (
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex size-[90px] items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-200 p-1">
              <img
                src={recipient.avatarUrl}
                alt={recipient.name}
                className="size-full rounded-full object-cover"
              />
            </div>
            <p className="font-display text-[13px] uppercase tracking-[0.24em] text-ink-500">
              Pagarás a
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink-50">{recipient.name}</h1>
            <div className="mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase text-mint-500">
              <ShieldCheck className="size-4" />
              Destinatario verificado
            </div>
          </div>
        ) : null}

        <div className="surface-glow mb-10 rounded-[28px] border border-obsidian-300 bg-obsidian-100 p-8 text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-ink-500">
            Monto total
          </p>
          <div className="mt-4 flex items-baseline justify-center gap-2 font-mono">
            <span className="text-2xl font-bold text-lime-500">$</span>
            <span className="text-5xl font-bold tracking-tight text-ink-50">
              {formatMoney(transfer?.amountMinor ?? 124050).replace("$", "").trim()}
            </span>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
            vía {group.name}
          </p>
        </div>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-ink-50">
              Método de pago
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime-500">
              Cambiar
            </span>
          </div>

          <div className="space-y-3">
            <PaymentOption
              active={paymentMethod === "venmo"}
              icon={<CreditCard className="size-5 text-white" />}
              subtitle={transfer?.methodHandle ?? "@marcos-ruiz-99"}
              title="Transferencia"
              onSelect={() => setPaymentMethod("venmo")}
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
          </div>
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-20 mx-auto max-w-md px-6">
        <button className="relative h-16 w-full overflow-hidden rounded-full border border-obsidian-300 bg-obsidian-300 p-1">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-[12px] font-bold uppercase tracking-[0.3em] text-ink-500">
              Desliza para pagar
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
        "surface-glow flex w-full items-center justify-between rounded-[20px] border p-4 text-left transition",
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
