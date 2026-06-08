export function formatCurrency(
  value: number | string | null | undefined,
  options: { fractionDigits?: number } = {}
) {
  const num = Number(value ?? 0);
  const fractionDigits = options.fractionDigits ?? 2;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
  return `${formatted} ج.م`;
}

/**
 * Returns the numeric part and the currency unit as separate strings, so callers
 * can render the number prominently and the unit (e.g. "ج.م") smaller beside it.
 * Avoids the brittle `formatCurrency(v).split(' ')` pattern that breaks if the
 * formatted number ever contains a space.
 */
export function splitCurrency(value: number | string | null | undefined, options: { fractionDigits?: number } = {}): { amount: string; unit: string } {
  const full = formatCurrency(value, options);
  const lastSpace = full.lastIndexOf(' ');
  if (lastSpace === -1) return { amount: full, unit: 'ج.م' };
  return { amount: full.slice(0, lastSpace), unit: full.slice(lastSpace + 1) };
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
