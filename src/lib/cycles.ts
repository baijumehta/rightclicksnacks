/**
 * Cycle scheduling.
 *
 * Orders go in twice a month, on the 1st and the 15th. A cycle is named for
 * the day it closes, runs from the previous order day, and opens for voting a
 * few days before it closes.
 *
 * Everything here works on plain `YYYY-MM-DD` strings and never touches the
 * local clock, so a server in UTC and an office in Pacific agree on which day
 * the 15th is. Only `today()` looks at a clock, and it takes the zone.
 */

export type IsoDate = string;

export interface CycleWindow {
  label: string;
  startsOn: IsoDate;
  votingOpensOn: IsoDate;
  closesOn: IsoDate;
}

export type CycleStatus = "collecting" | "voting" | "closed";

/* ------------------------------------------------------------------ */
/* Date arithmetic                                                     */
/* ------------------------------------------------------------------ */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIso(iso: IsoDate): { y: number; m: number; d: number } {
  const match = ISO.exec(iso);
  if (!match) throw new Error(`Not an ISO date: ${iso}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function toIso(y: number, m: number, d: number): IsoDate {
  // Round-trip through UTC so an out-of-range day (Feb 30) normalises the way
  // the calendar does rather than producing a nonsense string.
  const ms = Date.UTC(y, m - 1, d);
  const date = new Date(ms);
  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const { y, m, d } = parseIso(iso);
  return toIso(y, m, d + days);
}

/** Negative when `a` is earlier. Safe to use as a sort comparator. */
export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const a = parseIso(from);
  const b = parseIso(to);
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000,
  );
}

/** Today in the office's timezone, as a calendar date. */
export function today(timeZone = "America/Los_Angeles", now = new Date()): IsoDate {
  // en-CA formats as YYYY-MM-DD, which is exactly the shape we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/* ------------------------------------------------------------------ */
/* Order days                                                          */
/* ------------------------------------------------------------------ */

/** The next 1st or 15th strictly after `from`. */
export function nextOrderDay(from: IsoDate): IsoDate {
  const { y, m, d } = parseIso(from);
  if (d < 15) return toIso(y, m, 15);
  return toIso(y, m + 1, 1);
}

/** The most recent 1st or 15th strictly before `from`. */
export function previousOrderDay(from: IsoDate): IsoDate {
  const { y, m, d } = parseIso(from);
  if (d > 15) return toIso(y, m, 15);
  if (d > 1) return toIso(y, m, 1);
  return toIso(y, m - 1, 15);
}

export function isOrderDay(iso: IsoDate): boolean {
  const { d } = parseIso(iso);
  return d === 1 || d === 15;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Oct 1, 2026" -- the day the order goes in, which is what people remember. */
export function cycleLabel(closesOn: IsoDate): string {
  const { y, m, d } = parseIso(closesOn);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/* ------------------------------------------------------------------ */
/* Windows                                                             */
/* ------------------------------------------------------------------ */

/**
 * Build the full window for the cycle closing on `closesOn`.
 *
 * Voting opens `votingOpensDaysBefore` days before close, but never before
 * the cycle has started -- otherwise a short cycle plus a generous setting
 * would open the ballot in the previous cycle.
 */
export function cycleWindowFor(
  closesOn: IsoDate,
  votingOpensDaysBefore: number,
): CycleWindow {
  if (!isOrderDay(closesOn)) {
    throw new Error(`Cycles close on the 1st or the 15th, not ${closesOn}`);
  }
  const startsOn = previousOrderDay(closesOn);
  const wanted = addDays(closesOn, -Math.max(0, votingOpensDaysBefore));
  const votingOpensOn = compareIso(wanted, startsOn) < 0 ? startsOn : wanted;
  return { label: cycleLabel(closesOn), startsOn, votingOpensOn, closesOn };
}

/** The cycle that `day` falls inside: the one closing on the next order day. */
export function cycleWindowContaining(
  day: IsoDate,
  votingOpensDaysBefore: number,
): CycleWindow {
  return cycleWindowFor(nextOrderDay(day), votingOpensDaysBefore);
}

/** What a cycle's status should be on `day`, ignoring what the database says. */
export function statusOn(window: CycleWindow, day: IsoDate): CycleStatus {
  if (compareIso(day, window.closesOn) >= 0) return "closed";
  if (compareIso(day, window.votingOpensOn) >= 0) return "voting";
  return "collecting";
}

/** Whole days until the ballot closes. 0 on the order day itself. */
export function daysUntilClose(window: CycleWindow, day: IsoDate): number {
  return Math.max(0, daysBetween(day, window.closesOn));
}

/* ------------------------------------------------------------------ */
/* Budget                                                              */
/* ------------------------------------------------------------------ */

/**
 * A cycle spends the budget of the month it closes in, because that is when
 * the money leaves. Each month has exactly two: the 1st and the 15th.
 *
 * The first cycle gets half. The second gets everything the first did not
 * spend, so an underspent first half of the month is not lost -- which is the
 * behaviour people expect from "we have $600 a month".
 */
export function cycleBudgetCents(
  monthlyBudgetCents: number,
  closesOn: IsoDate,
  spentEarlierInMonthCents = 0,
): number {
  const { d } = parseIso(closesOn);
  if (d === 1) return Math.floor(monthlyBudgetCents / 2);
  return Math.max(0, monthlyBudgetCents - spentEarlierInMonthCents);
}

/** `2026-10` -- the budget month a cycle draws from. */
export function budgetMonth(closesOn: IsoDate): string {
  const { y, m } = parseIso(closesOn);
  return `${y}-${String(m).padStart(2, "0")}`;
}
