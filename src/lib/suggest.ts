import "server-only";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { cycles, items, orderLines, requests, votes, type Item } from "@/db/schema.ts";

/**
 * What to put in front of people when the ballot is thin.
 *
 * All of it comes from this office's own history rather than from anything a
 * retailer recommends: what got bought and scored well, what keeps being asked
 * for and keeps missing out, and which shelf is empty this time round. A snack
 * that five people voted for in August is a better suggestion than whatever is
 * trending nationally.
 */

export type SuggestionKind =
  | "repeat_winner"
  | "crowd_favourite"
  | "never_funded"
  | "untried"
  | "category_gap";

export interface Suggestion {
  item: Item;
  kind: SuggestionKind;
  /** One line explaining why this is being suggested, shown on the card. */
  reason: string;
  /** Sorts the combined list; higher is stronger. */
  score: number;
}

const LABELS: Record<SuggestionKind, string> = {
  repeat_winner: "Bought before",
  crowd_favourite: "Popular",
  never_funded: "Keeps missing out",
  untried: "Not tried yet",
  category_gap: "Fills a gap",
};

export const suggestionLabel = (kind: SuggestionKind) => LABELS[kind];

/**
 * Up to `limit` things worth adding to this cycle, strongest first and never
 * repeating an item already on the ballot.
 */
export async function suggestionsFor(cycleId: string, limit = 8): Promise<Suggestion[]> {
  const onBallot = await db
    .select({ itemId: requests.itemId })
    .from(requests)
    .where(eq(requests.cycleId, cycleId));
  const exclude = new Set(onBallot.map((r) => r.itemId));

  const history = await itemHistory(cycleId);
  const suggestions = new Map<string, Suggestion>();

  const consider = (s: Suggestion) => {
    if (exclude.has(s.item.id)) return;
    const existing = suggestions.get(s.item.id);
    if (!existing || s.score > existing.score) suggestions.set(s.item.id, s);
  };

  for (const row of history) {
    if (!row.item.isActive) continue;

    if (row.timesFunded >= 2) {
      consider({
        item: row.item,
        kind: "repeat_winner",
        reason: `Ordered ${row.timesFunded} times, ${row.avgVotes.toFixed(0)} votes on average.`,
        score: 100 + row.timesFunded * 10 + row.avgVotes,
      });
    } else if (row.timesFunded === 1) {
      consider({
        item: row.item,
        kind: "repeat_winner",
        reason: `Ordered once before and picked up ${row.totalVotes} votes.`,
        score: 70 + row.totalVotes,
      });
    } else if (row.timesRequested >= 2 && row.totalVotes > 0) {
      consider({
        item: row.item,
        kind: "never_funded",
        reason: `Asked for ${row.timesRequested} times and never made the cut.`,
        score: 60 + row.totalVotes,
      });
    }

    if (row.avgVotes >= 3 && row.timesFunded === 0) {
      consider({
        item: row.item,
        kind: "crowd_favourite",
        reason: `Averages ${row.avgVotes.toFixed(0)} votes whenever it is on the ballot.`,
        score: 65 + row.avgVotes * 2,
      });
    }
  }

  // Shelves that have nothing on this ballot at all.
  for (const item of await gapFillers(cycleId, exclude)) {
    consider({
      item,
      kind: "category_gap",
      reason: `Nothing in ${item.category} on this list yet.`,
      score: 40,
    });
  }

  // Catalog entries nobody has ever put forward.
  for (const item of await untried(exclude)) {
    consider({
      item,
      kind: "untried",
      reason: "In the catalog but never voted on.",
      score: 20,
    });
  }

  return [...suggestions.values()]
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */

interface HistoryRow {
  item: Item;
  timesRequested: number;
  timesFunded: number;
  totalVotes: number;
  avgVotes: number;
}

/** Per-item performance across every cycle except the one in progress. */
async function itemHistory(excludeCycleId: string): Promise<HistoryRow[]> {
  const rows = await db
    .select({
      item: items,
      timesRequested: sql<number>`count(distinct ${requests.id})`,
      totalVotes: sql<number>`(
        select count(*) from ${votes}
        where ${votes.requestId} in (
          select ${requests.id} from ${requests}
          where ${requests.itemId} = ${items.id} and ${requests.cycleId} <> ${excludeCycleId}
        )
      )`,
      timesFunded: sql<number>`(
        select count(*) from ${orderLines}
        where ${orderLines.isFunded} = true and ${orderLines.requestId} in (
          select ${requests.id} from ${requests}
          where ${requests.itemId} = ${items.id} and ${requests.cycleId} <> ${excludeCycleId}
        )
      )`,
    })
    .from(items)
    .innerJoin(requests, eq(requests.itemId, items.id))
    .where(ne(requests.cycleId, excludeCycleId))
    .groupBy(items.id);

  return rows.map((r) => {
    const timesRequested = Number(r.timesRequested);
    const totalVotes = Number(r.totalVotes);
    return {
      item: r.item,
      timesRequested,
      timesFunded: Number(r.timesFunded),
      totalVotes,
      avgVotes: timesRequested > 0 ? totalVotes / timesRequested : 0,
    };
  });
}

/** One well-priced item from each category missing from this ballot. */
async function gapFillers(cycleId: string, exclude: Set<string>): Promise<Item[]> {
  const present = await db
    .select({ category: items.category })
    .from(requests)
    .innerJoin(items, eq(items.id, requests.itemId))
    .where(eq(requests.cycleId, cycleId));
  const covered = new Set(present.map((p) => p.category));

  const all = await db.select().from(items).where(eq(items.isActive, true));
  const picked: Item[] = [];
  const seen = new Set<string>();

  for (const item of all.sort((a, b) => a.priceCents - b.priceCents)) {
    if (covered.has(item.category) || seen.has(item.category) || exclude.has(item.id)) continue;
    seen.add(item.category);
    picked.push(item);
  }
  return picked;
}

/** Catalog items that have never appeared on any ballot. */
async function untried(exclude: Set<string>): Promise<Item[]> {
  const requested = await db.selectDistinct({ itemId: requests.itemId }).from(requests);
  const known = new Set(requested.map((r) => r.itemId));

  const all = await db.select().from(items).where(eq(items.isActive, true));
  return all.filter((i) => !known.has(i.id) && !exclude.has(i.id)).slice(0, 12);
}

/* ------------------------------------------------------------------ */
/* Price freshness                                                     */
/* ------------------------------------------------------------------ */

/** Catalog rows whose price has not been confirmed recently. */
export async function stalePrices(staleDays: number): Promise<Item[]> {
  const cutoff = new Date(Date.now() - staleDays * 864e5);
  const all = await db.select().from(items).where(eq(items.isActive, true));
  return all
    .filter((i) => i.priceCheckedAt < cutoff)
    .sort((a, b) => a.priceCheckedAt.getTime() - b.priceCheckedAt.getTime());
}

export function isStale(checkedAt: Date, staleDays: number): boolean {
  return checkedAt.getTime() < Date.now() - staleDays * 864e5;
}

/** Items funded in a closed cycle, used for the "order again" shortcut. */
export async function lastOrderedItems(limit = 20): Promise<Item[]> {
  const closed = await db
    .select({ id: cycles.id })
    .from(cycles)
    .where(eq(cycles.status, "closed"))
    .orderBy(sql`${cycles.closesOn} desc`)
    .limit(1);
  if (closed.length === 0) return [];

  const rows = await db
    .select({ item: items })
    .from(orderLines)
    .innerJoin(requests, eq(requests.id, orderLines.requestId))
    .innerJoin(items, eq(items.id, requests.itemId))
    .where(and(inArray(orderLines.cycleId, closed.map((c) => c.id)), eq(orderLines.isFunded, true)))
    .limit(limit);
  return rows.map((r) => r.item);
}
