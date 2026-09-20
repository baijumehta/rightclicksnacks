"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { orderLines, users } from "@/db/schema.ts";
import { requireAdmin, requireUser } from "@/lib/auth.ts";
import { closeCycle, reopenCycle, rollCycles } from "@/lib/cycle-service.ts";
import { updateSettings } from "@/lib/settings.ts";
import { parseMoneyToCents } from "@/lib/money.ts";
import type { ActionResult } from "./snacks.ts";

const ok = (message?: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });

function refreshAll() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/order");
  revalidatePath("/history");
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export async function saveSettings(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const monthly = parseMoneyToCents(String(formData.get("monthlyBudget") ?? ""));
  const cap = parseMoneyToCents(String(formData.get("mustHaveCap") ?? ""));
  const votes = Number(formData.get("votesPerPerson") ?? 0);
  const leadDays = Number(formData.get("votingOpensDaysBefore") ?? 0);
  const staleDays = Number(formData.get("priceStaleDays") ?? 0);
  const poolPercent = Number(formData.get("mustHavePoolPercent") ?? 0);

  if (monthly == null || monthly <= 0) return fail("The monthly budget needs to be a number.");
  if (cap == null || cap <= 0) return fail("The must-have cap needs to be a number.");
  if (!Number.isInteger(votes) || votes < 1 || votes > 50) {
    return fail("Votes per person should be between 1 and 50.");
  }
  if (!Number.isInteger(leadDays) || leadDays < 1 || leadDays > 13) {
    return fail("Voting should open between 1 and 13 days before the order.");
  }
  if (!Number.isInteger(staleDays) || staleDays < 7 || staleDays > 365) {
    return fail("Price staleness should be between 7 and 365 days.");
  }
  if (!Number.isInteger(poolPercent) || poolPercent < 0 || poolPercent > 100) {
    return fail("The guaranteed-pick allowance should be between 0 and 100 percent.");
  }

  await updateSettings({
    monthlyBudgetCents: monthly,
    mustHaveCapCents: cap,
    votesPerPerson: votes,
    votingOpensDaysBefore: leadDays,
    priceStaleDays: staleDays,
    mustHavePoolPercent: poolPercent,
  });
  refreshAll();
  return ok(
    "Saved. Votes, the pick cap and price staleness are live now; the budget " +
      "and voting date apply to the next cycle.",
  );
}

/* ------------------------------------------------------------------ */
/* Cycle controls                                                      */
/* ------------------------------------------------------------------ */

/** Close early -- for when the order is going in a day ahead of schedule. */
export async function closeNow(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const cycleId = String(formData.get("cycleId") ?? "");
  if (!cycleId) return fail("No cycle given.");

  try {
    const result = await closeCycle(cycleId);
    refreshAll();
    return ok(
      `Closed. ${result.funded.length} item${result.funded.length === 1 ? "" : "s"} to buy, ` +
        `${result.waitlist.length} on the waitlist.`,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_CLOSED") {
      return fail("That cycle is already closed.");
    }
    throw error;
  }
}

export async function reopen(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const cycleId = String(formData.get("cycleId") ?? "");
  if (!cycleId) return fail("No cycle given.");
  await reopenCycle(cycleId);
  refreshAll();
  return ok("Reopened for voting. The shopping list has been discarded.");
}

/** Run the daily advance by hand. */
export async function rollNow(_prev: ActionResult): Promise<ActionResult> {
  await requireAdmin();
  const result = await rollCycles();
  refreshAll();

  const parts = [
    result.openedVoting.length ? `opened voting on ${result.openedVoting.join(", ")}` : "",
    result.closed.length ? `closed ${result.closed.join(", ")}` : "",
    result.created.length ? `started ${result.created.join(", ")}` : "",
    result.reminded.length ? `posted ${result.reminded.length} Teams reminder${result.reminded.length === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return ok(parts.length ? `Done: ${parts.join("; ")}.` : "Everything was already up to date.");
}

/* ------------------------------------------------------------------ */
/* Reconciling the receipt                                             */
/* ------------------------------------------------------------------ */

/**
 * Record what a line actually cost. Estimates drift, and the next cycle's
 * budget is calculated from real spend when it is available.
 */
export async function recordActual(formData: FormData): Promise<void> {
  await requireUser();
  const lineId = String(formData.get("lineId") ?? "");
  const raw = String(formData.get("actual") ?? "").trim();
  if (!lineId) return;

  const actualCents = raw ? parseMoneyToCents(raw) : null;
  if (raw && actualCents == null) return;

  await db.update(orderLines).set({ actualCents }).where(eq(orderLines.id, lineId));
  refreshAll();
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export async function inviteUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!email.includes("@")) return fail("That is not an email address.");
  if (name.length < 2) return fail("Give them a name.");

  const [created] = await db
    .insert(users)
    .values({ email, name })
    .onConflictDoNothing({ target: users.email })
    .returning();

  refreshAll();
  return created
    ? ok(`${name} can now sign in with Microsoft.`)
    : fail("Somebody is already using that address.");
}

export async function setAdmin(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const makeAdmin = formData.get("isAdmin") === "true";
  // Do not let the last admin demote themselves out of the admin screen.
  if (userId === me.id && !makeAdmin) return;
  if (!userId) return;

  await db.update(users).set({ isAdmin: makeAdmin }).where(eq(users.id, userId));
  refreshAll();
}

export async function setActive(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const makeActive = formData.get("isActive") === "true";
  if (!userId || userId === me.id) return;

  await db.update(users).set({ isActive: makeActive }).where(eq(users.id, userId));
  refreshAll();
}
