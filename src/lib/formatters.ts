export function formatMoney(amountMinor: number, currency = "ARS") {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch {
    return `${currency} ${formatDecimal(amountMinor)}`;
  }
}

export function formatCompactMoney(amountMinor: number, currency = "ARS") {
  const formatted = formatMoney(Math.abs(amountMinor), currency);
  if (amountMinor > 0) {
    return `+${formatted}`;
  }
  if (amountMinor < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function parseMoneyInput(rawValue: string) {
  const cleaned = rawValue.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) {
    return 0;
  }

  const negative = cleaned.startsWith("-");
  const unsigned = cleaned.replace(/-/g, "");
  const decimalIndex = Math.max(unsigned.lastIndexOf("."), unsigned.lastIndexOf(","));
  const normalized =
    decimalIndex >= 0
      ? `${unsigned.slice(0, decimalIndex).replace(/[.,]/g, "")}.${unsigned
          .slice(decimalIndex + 1)
          .replace(/[.,]/g, "")}`
      : unsigned.replace(/[.,]/g, "");

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount * 100) * (negative ? -1 : 1);
}

export function formatExpenseTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const dayDiff = Math.round((today - targetDay) / 86_400_000);
  const timeLabel = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (dayDiff === 0) {
    return `Hoy · ${timeLabel}`;
  }

  if (dayDiff === 1) {
    return `Ayer · ${timeLabel}`;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDecimal(amountMinor: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}
