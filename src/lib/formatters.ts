export function formatMoney(amountMinor: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
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
