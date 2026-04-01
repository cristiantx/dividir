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

export function formatMoneyInput(rawValue: string) {
  const cleaned = rawValue.replace(/[^\d,.-]/g, "").replace(/-/g, "");

  if (!cleaned) {
    return "";
  }

  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");
  const hasCommaDecimal = commaIndex >= 0;
  const hasDotDecimal =
    !hasCommaDecimal &&
    dotIndex >= 0 &&
    cleaned
      .slice(dotIndex + 1)
      .replace(/\D/g, "").length > 0 &&
    cleaned
      .slice(dotIndex + 1)
      .replace(/\D/g, "").length <= 2;
  const decimalIndex = hasCommaDecimal ? commaIndex : hasDotDecimal ? dotIndex : -1;
  const hasDecimal = decimalIndex >= 0;
  const integerDigits = normalizeIntegerDigits(
    (hasDecimal ? cleaned.slice(0, decimalIndex) : cleaned).replace(/\D/g, ""),
    hasDecimal,
  );
  const decimalDigits = hasDecimal
    ? cleaned
        .slice(decimalIndex + 1)
        .replace(/\D/g, "")
        .slice(0, 2)
    : "";

  const formattedInteger = formatIntegerInput(integerDigits);

  if (!hasDecimal) {
    return formattedInteger;
  }

  return `${formattedInteger},${decimalDigits}`;
}

export function parseMoneyInput(rawValue: string) {
  const cleaned = rawValue.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) {
    return 0;
  }

  const negative = cleaned.startsWith("-");
  const unsigned = cleaned.replace(/-/g, "");
  const commaIndex = unsigned.lastIndexOf(",");
  const dotIndex = unsigned.lastIndexOf(".");
  const hasCommaDecimal = commaIndex >= 0;
  const hasDotDecimal =
    !hasCommaDecimal &&
    dotIndex >= 0 &&
    unsigned
      .slice(dotIndex + 1)
      .replace(/\D/g, "").length > 0 &&
    unsigned
      .slice(dotIndex + 1)
      .replace(/\D/g, "").length <= 2;
  const decimalIndex = hasCommaDecimal ? commaIndex : hasDotDecimal ? dotIndex : -1;
  const integerDigits = (
    decimalIndex >= 0 ? unsigned.slice(0, decimalIndex) : unsigned
  ).replace(/[.,]/g, "");
  const decimalDigits =
    decimalIndex >= 0 ? unsigned.slice(decimalIndex + 1).replace(/[.,]/g, "").slice(0, 2) : "";
  const wholeUnits = Number(integerDigits || "0");
  const cents = Number((decimalDigits || "").padEnd(2, "0") || "0");

  if (!Number.isFinite(wholeUnits) || !Number.isFinite(cents)) {
    return 0;
  }

  return (wholeUnits * 100 + cents) * (negative ? -1 : 1);
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

function formatIntegerInput(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function normalizeIntegerDigits(digits: string, hasDecimal: boolean) {
  if (!digits) {
    return hasDecimal ? "0" : "";
  }

  return digits.replace(/^0+(?=\d)/, "");
}
