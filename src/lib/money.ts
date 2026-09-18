/** Money is stored and calculated in integer cents, everywhere. */

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

/** Drops the cents when they are zero: "$600" rather than "$600.00". */
export function formatCentsShort(cents: number): string {
  const abs = Math.abs(Math.round(cents));
  if (abs % 100 === 0) return `${cents < 0 ? "-" : ""}$${abs / 100}`;
  return formatCents(cents);
}

/**
 * Parse whatever someone types into a price box: "$12.99", "12.99", "1,299.00",
 * "13". Returns null when it is not a number we would trust.
 */
export function parseMoneyToCents(input: string): number | null {
  const cleaned = input.trim().replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isFinite(cents) ? cents : null;
}

/** "$0.62 each" -- the number that settles most "is this worth it" arguments. */
export function perUnitLabel(priceCents: number, unitCount: number | null): string | null {
  if (!unitCount || unitCount <= 0) return null;
  const each = priceCents / unitCount;
  return `${each < 100 ? `${Math.round(each)}¢` : formatCents(Math.round(each))} each`;
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, (part / whole) * 100));
}
