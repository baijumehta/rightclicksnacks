import "server-only";
import { and, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import {
  cycles, items, mustHaves, orderLines, requests, users, votes,
  type Cycle, type CycleStatus,
} from "@/db/schema.ts";
import {
  budgetMonth, cycleBudgetCents, cycleWindowContaining, cycleWindowFor,
  daysBetween, statusOn, today, type IsoDate,
} from "./cycles.ts";
import { selectOrder, type Candidate, type SelectionResult } from "./selection.ts";
import { getSettings, OFFICE_TIMEZONE } from "./settings.ts";
import { formatCents } from "./money.ts";
import { notifyTeams, reminderMessage, teamsConfigured } from "./teams.ts";

/* ------------------------------------------------------------------ */
/* Finding and creating cycles                                         */
/* ------------------------------------------------------------------ */

/**
 * The cycle people should be looking at right now, created if it does not
 * exist yet. Called from the dashboard, so the app self-heals even if the
 * cron never fires.
 */
export async function getOrCreateCurrentCycle(day?: IsoDate): Promise<Cycle> {
  const config = await getSettings();
  const now = day ?? today(OFFICE_TIMEZONE);
  const window = cycleWindowContaining(now, config.votingOpensDaysBefore);

  const existing = await db.query.cycles.findFirst({
    where: eq(cycles.closesOn, window.closesOn),
  });
  if (existing) return existing;

  return createCycle(window.closesOn);
}

/** Create the cycle closing on `closesOn`, budget included. */
export async function createCycle(closesOn: IsoDate): Promise<Cycle> {
  const config = await getSettings();
  const window = cycleWindowFor(closesOn, config.votingOpensDaysBefore);
  const spent = await spentInMonthBefore(closesOn);
  const budgetCents = cycleBudgetCents(config.monthlyBudgetCents, closesOn, spent);

  const [created] = await db
    .insert(cycles)
    .values({
      label: window.label,
      startsOn: window.startsOn,
      votingOpensOn: window.votingOpensOn,
      closesOn: window.closesOn,
      budgetCents,
      status: statusOn(window, today(OFFICE_TIMEZONE)),
    })
    .onConflictDoNothing({ target: cycles.closesOn })
    .returning();
  if (created) return created;

  const row = await db.query.cycles.findFirst({ where: eq(cycles.closesOn, closesOn) });
  if (!row) throw new Error(`Could not create the cycle closing ${closesOn}`);
  return row;
}

/**
 * What earlier cycles in the same budget month already committed. Uses actual
 * spend where a receipt has been reconciled, and the planned figure otherwise.
 */
async function spentInMonthBefore(closesOn: IsoDate): Promise<number> {
  const month = budgetMonth(closesOn);
  const earlier = await db
    .select({ id: cycles.id, closesOn: cycles.closesOn })
    .from(cycles)
    .where(lt(cycles.closesOn, closesOn));
  const ids = earlier.filter((c) => budgetMonth(c.closesOn) === month).map((c) => c.id);
  if (ids.length === 0) return 0;

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(coalesce(${orderLines.actualCents}, ${orderLines.lineTotalCents})), 0)`,
    })
    .from(orderLines)
    .where(
      and(
        inArray(orderLines.cycleId, ids),
        eq(orderLines.isFunded, true),
        // Supplies come out of a different pot, so spending on napkins never
        // reduces what the next cycle has left for food.
        ne(orderLines.reason, "supply"),
      ),
    );
  return Number(row?.total ?? 0);
}

/* ------------------------------------------------------------------ */
/* Advancing                                                           */
/* ------------------------------------------------------------------ */

export interface RollResult {
  day: IsoDate;
  openedVoting: string[];
  closed: string[];
  created: string[];
  reminded: string[];
}

/**
 * Bring every cycle to the status its dates imply, close anything past its
 * order day, and make sure the next cycle exists.
 *
 * Idempotent: running it twice on the same day changes nothing the second
 * time, so a cron that fires twice or a manual nudge is harmless.
 */
export async function rollCycles(day?: IsoDate): Promise<RollResult> {
  const config = await getSettings();
  const now = day ?? today(OFFICE_TIMEZONE);
  const result: RollResult = { day: now, openedVoting: [], closed: [], created: [], reminded: [] };

  const open = await db
    .select()
    .from(cycles)
    .where(inArray(cycles.status, ["collecting", "voting"]));

  for (const cycle of open) {
    const window = {
      label: cycle.label,
      startsOn: cycle.startsOn,
      votingOpensOn: cycle.votingOpensOn,
      closesOn: cycle.closesOn,
    };
    const should: CycleStatus = statusOn(window, now);
    if (should === cycle.status) continue;

    if (should === "voting") {
      await db.update(cycles).set({ status: "voting" }).where(eq(cycles.id, cycle.id));
      result.openedVoting.push(cycle.label);
    } else if (should === "closed") {
      await closeCycle(cycle.id);
      result.closed.push(cycle.label);
    }
  }

  // Always have a live cycle to collect into.
  const current = cycleWindowContaining(now, config.votingOpensDaysBefore);
  const exists = await db.query.cycles.findFirst({
    where: eq(cycles.closesOn, current.closesOn),
  });
  if (!exists) {
    await createCycle(current.closesOn);
    result.created.push(current.label);
  }

  /*
   * Reminders last, re-reading the cycles so a status just changed above is
   * reflected, and wrapped so a Teams outage can never stop voting opening.
   * Advancing the cycle is the job; the nudge is a courtesy.
   */
  try {
    const live = await db
      .select()
      .from(cycles)
      .where(inArray(cycles.status, ["collecting", "voting"]));
    for (const cycle of live) {
      result.reminded.push(...(await sendDueReminders(cycle, now)));
    }
  } catch (error) {
    console.error("Teams reminder failed, cycle roll unaffected:", error);
  }

  return result;
}

/** The guaranteed-pick allowance for a cycle, in cents. */
export function poolCentsFor(budgetCents: number, percent: number): number {
  return Math.floor((budgetCents * Math.min(Math.max(percent, 0), 100)) / 100);
}

/* ------------------------------------------------------------------ */
/* Reminders                                                           */
/* ------------------------------------------------------------------ */

/** How many people have voted, and how many could. */
async function turnout(cycleId: string): Promise<{ voted: number; total: number }> {
  const [[votedRow], [totalRow]] = await Promise.all([
    db
      .select({ n: sql<number>`count(distinct ${votes.userId})` })
      .from(votes)
      .where(eq(votes.cycleId, cycleId)),
    db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true)),
  ]);
  return { voted: Number(votedRow?.n ?? 0), total: Number(totalRow?.n ?? 0) };
}

/**
 * Post today's reminder, if one is due.
 *
 * One per day of voting: with the window at three days that is "closes in 3
 * days", "in 2 days", "tomorrow". Which day it is decides the wording, so a
 * longer window just means more middle days rather than new code.
 *
 * The day is recorded only once the post has actually gone out, so a failed
 * send is retried tomorrow rather than silently marked done -- and a day
 * already recorded is a day already posted, which is what makes running the
 * roll twice harmless.
 */
async function sendDueReminders(cycle: Cycle, day: IsoDate): Promise<string[]> {
  if (!teamsConfigured()) return [];
  if (cycle.status !== "voting") return [];
  if (cycle.remindedOn.includes(day)) return [];

  const daysLeft = daysBetween(day, cycle.closesOn);
  // Nothing to count down to once the order day has arrived or passed.
  if (daysLeft < 1) return [];

  const config = await getSettings();
  const { voted, total } = await turnout(cycle.id);

  const result = await notifyTeams(
    reminderMessage({
      cycleLabel: cycle.label,
      daysLeft,
      votesEach: config.votesPerPerson,
      capText: formatCents(config.mustHaveCapCents),
      voted,
      total,
    }),
  );
  if (!result.sent) {
    console.error(`Teams reminder for ${cycle.label} not sent: ${result.reason}`);
    return [];
  }

  await db
    .update(cycles)
    .set({ remindedOn: [...cycle.remindedOn, day] })
    .where(eq(cycles.id, cycle.id));
  return [`${cycle.label}: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`];
}

/* ------------------------------------------------------------------ */
/* Closing                                                             */
/* ------------------------------------------------------------------ */

/**
 * Tally the ballot, write the shopping list, and mark the cycle closed.
 * Refuses to run twice -- a closed cycle's list is a historical record.
 */
export async function closeCycle(cycleId: string): Promise<SelectionResult> {
  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, cycleId) });
  if (!cycle) throw new Error("No such cycle");
  if (cycle.status === "closed") throw new Error("ALREADY_CLOSED");

  const config = await getSettings();
  const candidates = await ballotFor(cycleId);
  const result = selectOrder(candidates, {
    budgetCents: cycle.budgetCents,
    mustHaveCapCents: config.mustHaveCapCents,
    mustHavePoolCents: poolCentsFor(cycle.budgetCents, config.mustHavePoolPercent),
  });

  const rows = [...result.funded, ...result.waitlist].map((line) => ({
    cycleId,
    requestId: line.requestId,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents,
    voteCount: line.voteCount,
    reason: line.reason,
    rank: line.rank,
    isFunded: line.isFunded,
  }));

  if (rows.length > 0) {
    await db.insert(orderLines).values(rows).onConflictDoNothing();
  }
  await db
    .update(cycles)
    .set({ status: "closed", closedAt: new Date() })
    .where(eq(cycles.id, cycleId));

  return result;
}

/** Undo a close, so a mistake on the 1st is not permanent. */
export async function reopenCycle(cycleId: string): Promise<void> {
  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, cycleId) });
  if (!cycle) throw new Error("No such cycle");
  await db.delete(orderLines).where(eq(orderLines.cycleId, cycleId));
  await db
    .update(cycles)
    .set({ status: "voting", closedAt: null })
    .where(eq(cycles.id, cycleId));
}

/* ------------------------------------------------------------------ */
/* Reading the ballot                                                  */
/* ------------------------------------------------------------------ */

export interface BallotRow extends Candidate {
  itemId: string;
  kind: "snack" | "supply";
  brand: string | null;
  store: string;
  category: string;
  packSize: string | null;
  unitCount: number | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  note: string | null;
  requestedBy: string | null;
  priceCheckedAt: Date;
}

/** Every item on a cycle's ballot, with its vote and must-have counts. */
export async function ballotFor(cycleId: string): Promise<BallotRow[]> {
  const rows = await db
    .select({
      requestId: requests.id,
      itemId: items.id,
      name: items.name,
      brand: items.brand,
      store: items.store,
      kind: items.kind,
      category: items.category,
      packSize: items.packSize,
      unitCount: items.unitCount,
      imageUrl: items.imageUrl,
      sourceUrl: items.sourceUrl,
      priceCheckedAt: items.priceCheckedAt,
      quantity: requests.quantity,
      unitPriceCents: requests.unitPriceCents,
      note: requests.note,
      requestedBy: requests.requestedBy,
      voteCount: sql<number>`(select count(*) from ${votes} where ${votes.requestId} = ${requests.id})`,
      mustHaveCount: sql<number>`(select count(*) from ${mustHaves} where ${mustHaves.requestId} = ${requests.id})`,
    })
    .from(requests)
    .innerJoin(items, eq(items.id, requests.itemId))
    .where(eq(requests.cycleId, cycleId))
    .orderBy(desc(sql`(select count(*) from ${votes} where ${votes.requestId} = ${requests.id})`), items.name);

  return rows.map((r) => ({
    ...r,
    voteCount: Number(r.voteCount),
    mustHaveCount: Number(r.mustHaveCount),
  }));
}

/** How the list would look if voting closed right now. */
export async function previewFor(cycle: Cycle): Promise<SelectionResult> {
  const config = await getSettings();
  const ballot = await ballotFor(cycle.id);
  return selectOrder(ballot, {
    budgetCents: cycle.budgetCents,
    mustHaveCapCents: config.mustHaveCapCents,
    mustHavePoolCents: poolCentsFor(cycle.budgetCents, config.mustHavePoolPercent),
  });
}

/* ------------------------------------------------------------------ */
/* Per-person state                                                    */
/* ------------------------------------------------------------------ */

export interface MyBallotState {
  votedRequestIds: Set<string>;
  votesUsed: number;
  votesLeft: number;
  mustHaveRequestId: string | null;
}

export async function myBallotState(
  cycleId: string,
  userId: string,
): Promise<MyBallotState> {
  const config = await getSettings();
  const [mine, promise] = await Promise.all([
    db
      .select({ requestId: votes.requestId })
      .from(votes)
      .where(and(eq(votes.cycleId, cycleId), eq(votes.userId, userId))),
    db.query.mustHaves.findFirst({
      where: and(eq(mustHaves.cycleId, cycleId), eq(mustHaves.userId, userId)),
    }),
  ]);

  const votedRequestIds = new Set(mine.map((v) => v.requestId));
  return {
    votedRequestIds,
    votesUsed: votedRequestIds.size,
    votesLeft: Math.max(0, config.votesPerPerson - votedRequestIds.size),
    mustHaveRequestId: promise?.requestId ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

export async function recentCycles(limit = 12): Promise<Cycle[]> {
  return db.select().from(cycles).orderBy(desc(cycles.closesOn)).limit(limit);
}

/** Planned and actual spend for a closed cycle. */
export async function cycleTotals(cycleId: string): Promise<{
  plannedCents: number;
  actualCents: number | null;
  suppliesCents: number;
  lineCount: number;
}> {
  // `filter` keeps supplies out of the food figures without a second query.
  const supplyLine = sql`${orderLines.reason} = 'supply'`;
  const [row] = await db
    .select({
      planned: sql<number>`coalesce(sum(${orderLines.lineTotalCents}) filter (where not ${supplyLine}), 0)`,
      actual: sql<number>`sum(${orderLines.actualCents}) filter (where not ${supplyLine})`,
      supplies: sql<number>`coalesce(sum(coalesce(${orderLines.actualCents}, ${orderLines.lineTotalCents})) filter (where ${supplyLine}), 0)`,
      lines: sql<number>`count(*)`,
    })
    .from(orderLines)
    .where(and(eq(orderLines.cycleId, cycleId), eq(orderLines.isFunded, true)));

  return {
    plannedCents: Number(row?.planned ?? 0),
    actualCents: row?.actual == null ? null : Number(row.actual),
    suppliesCents: Number(row?.supplies ?? 0),
    lineCount: Number(row?.lines ?? 0),
  };
}

/** Spend across a calendar month, for the budget strip on the dashboard. */
export async function monthTotals(month: string): Promise<{
  plannedCents: number;
  budgetCents: number;
}> {
  const config = await getSettings();
  const all = await db.select({ id: cycles.id, closesOn: cycles.closesOn }).from(cycles);
  const ids = all.filter((c) => budgetMonth(c.closesOn) === month).map((c) => c.id);
  if (ids.length === 0) {
    return { plannedCents: 0, budgetCents: config.monthlyBudgetCents };
  }

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(coalesce(${orderLines.actualCents}, ${orderLines.lineTotalCents})), 0)`,
    })
    .from(orderLines)
    .where(
      and(
        inArray(orderLines.cycleId, ids),
        eq(orderLines.isFunded, true),
        ne(orderLines.reason, "supply"),
      ),
    );

  return {
    plannedCents: Number(row?.total ?? 0),
    budgetCents: config.monthlyBudgetCents,
  };
}
