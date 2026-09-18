"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/index.ts";
import { cycles, items, mustHaves, requests, votes } from "@/db/schema.ts";
import { requireUser } from "@/lib/auth.ts";
import { getOrCreateCurrentCycle } from "@/lib/cycle-service.ts";
import { getSettings } from "@/lib/settings.ts";
import { parseMoneyToCents } from "@/lib/money.ts";
import { lookupProduct, storeFromUrl } from "@/lib/product-link.ts";
import { SNACK_CATEGORIES } from "@/lib/categories.ts";

/**
 * Every action re-checks who is calling and what state the cycle is in.
 * Server actions are reachable by direct POST, so the UI hiding a button is
 * not a control -- these checks are.
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
  /**
   * Changes on every completed run. Forms use it as a remount key, which is
   * how they reset themselves without an effect that re-syncs state.
   */
  token?: string;
}

const ok = (message?: string): ActionResult => ({
  ok: true,
  message,
  token: crypto.randomUUID(),
});
const fail = (message: string): ActionResult => ({
  ok: false,
  message,
  token: crypto.randomUUID(),
});

function refresh() {
  revalidatePath("/");
  revalidatePath("/catalog");
}

/* ------------------------------------------------------------------ */
/* Adding to the catalog                                               */
/* ------------------------------------------------------------------ */

const itemSchema = z.object({
  name: z.string().trim().min(2, "Give it a name.").max(120),
  brand: z.string().trim().max(80).optional(),
  store: z.enum(["costco", "target", "other"]),
  category: z.enum(SNACK_CATEGORIES),
  packSize: z.string().trim().max(60).optional(),
  unitCount: z.number().int().positive().max(10_000).nullable(),
  priceCents: z.number().int().positive("A price above zero, please.").max(5_000_00),
  sourceUrl: z.string().trim().url().max(2_000).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().max(2_000).optional().or(z.literal("")),
  notes: z.string().trim().max(400).optional(),
});

function readItemForm(formData: FormData) {
  const priceCents = parseMoneyToCents(String(formData.get("price") ?? ""));
  const unitRaw = String(formData.get("unitCount") ?? "").trim();
  return itemSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    brand: String(formData.get("brand") ?? "").trim() || undefined,
    store: String(formData.get("store") ?? "costco"),
    category: String(formData.get("category") ?? "other"),
    packSize: String(formData.get("packSize") ?? "").trim() || undefined,
    unitCount: unitRaw ? Number(unitRaw) : null,
    priceCents: priceCents ?? 0,
    sourceUrl: String(formData.get("sourceUrl") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
}

/** Add a snack to the catalog, and optionally onto this cycle's ballot. */
export async function addItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = readItemForm(formData);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  }
  const data = parsed.data;

  const [created] = await db
    .insert(items)
    .values({
      name: data.name,
      brand: data.brand ?? null,
      store: data.store,
      category: data.category,
      packSize: data.packSize ?? null,
      unitCount: data.unitCount,
      priceCents: data.priceCents,
      sourceUrl: data.sourceUrl || null,
      imageUrl: data.imageUrl || null,
      notes: data.notes ?? null,
      createdBy: user.id,
    })
    .returning();

  if (formData.get("addToCycle") === "on") {
    const result = await nominate(created.id);
    if (!result.ok) return result;
    return ok(`Added ${created.name} and put it on this cycle's list.`);
  }
  refresh();
  return ok(`Added ${created.name} to the catalog.`);
}

/** Correct a price and reset its freshness clock. */
export async function updatePrice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const priceCents = parseMoneyToCents(String(formData.get("price") ?? ""));
  if (!itemId || priceCents == null || priceCents <= 0) {
    return fail("That price did not look right.");
  }

  await db
    .update(items)
    .set({ priceCents, priceCheckedAt: new Date() })
    .where(eq(items.id, itemId));

  // Requests in cycles that are still open should follow the corrected price;
  // closed cycles keep whatever they were ordered at.
  const open = await db
    .select({ id: cycles.id })
    .from(cycles)
    .where(eq(cycles.status, "collecting"));
  for (const cycle of open) {
    await db
      .update(requests)
      .set({ unitPriceCents: priceCents })
      .where(and(eq(requests.cycleId, cycle.id), eq(requests.itemId, itemId)));
  }

  refresh();
  return ok("Price updated.");
}

/** Confirm a price is still right, without changing it. */
export async function confirmPrice(formData: FormData): Promise<void> {
  await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;
  await db.update(items).set({ priceCheckedAt: new Date() }).where(eq(items.id, itemId));
  refresh();
}

export async function archiveItem(formData: FormData): Promise<void> {
  await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;
  await db.update(items).set({ isActive: false }).where(eq(items.id, itemId));
  refresh();
}

/* ------------------------------------------------------------------ */
/* The ballot                                                          */
/* ------------------------------------------------------------------ */

/** Put a catalog item on this cycle's list. */
export async function nominate(itemId: string, quantity = 1, note?: string): Promise<ActionResult> {
  const user = await requireUser();
  const cycle = await getOrCreateCurrentCycle();
  if (cycle.status === "closed") return fail("This cycle has already been ordered.");
  if (cycle.status === "voting") {
    return fail("Voting is open, so the list is frozen. This one will have to wait for next time.");
  }

  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!item || !item.isActive) return fail("That snack is not in the catalog.");

  const inserted = await db
    .insert(requests)
    .values({
      cycleId: cycle.id,
      itemId,
      quantity: Math.min(Math.max(1, quantity), 20),
      unitPriceCents: item.priceCents,
      note: note?.trim() || null,
      requestedBy: user.id,
    })
    .onConflictDoNothing({ target: [requests.cycleId, requests.itemId] })
    .returning();

  refresh();
  if (inserted.length === 0) return ok(`${item.name} is already on the list.`);
  return ok(`${item.name} is on the list.`);
}

export async function nominateAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const note = String(formData.get("note") ?? "");
  if (!itemId) return fail("Nothing selected.");
  return nominate(itemId, quantity, note);
}

/** Take something back off the list. Only while the list is still open. */
export async function withdrawRequest(formData: FormData): Promise<void> {
  const user = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return;

  const request = await db.query.requests.findFirst({ where: eq(requests.id, requestId) });
  if (!request) return;

  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, request.cycleId) });
  if (!cycle || cycle.status !== "collecting") return;
  // Whoever put it up can take it down; so can an admin.
  if (request.requestedBy !== user.id && !user.isAdmin) return;

  await db.delete(requests).where(eq(requests.id, requestId));
  refresh();
}

export async function setQuantity(formData: FormData): Promise<void> {
  const user = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  const quantity = Math.min(Math.max(1, Number(formData.get("quantity") ?? 1) || 1), 20);
  if (!requestId) return;

  const request = await db.query.requests.findFirst({ where: eq(requests.id, requestId) });
  if (!request) return;
  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, request.cycleId) });
  if (!cycle || cycle.status !== "collecting") return;
  if (request.requestedBy !== user.id && !user.isAdmin) return;

  await db.update(requests).set({ quantity }).where(eq(requests.id, requestId));
  refresh();
}

/* ------------------------------------------------------------------ */
/* Voting                                                              */
/* ------------------------------------------------------------------ */

/** Cast or take back one vote. */
export async function toggleVote(formData: FormData): Promise<void> {
  const user = await requireUser();
  const config = await getSettings();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return;

  const request = await db.query.requests.findFirst({ where: eq(requests.id, requestId) });
  if (!request) return;

  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, request.cycleId) });
  if (!cycle || cycle.status !== "voting") return;

  const existing = await db.query.votes.findFirst({
    where: and(eq(votes.requestId, requestId), eq(votes.userId, user.id)),
  });

  if (existing) {
    await db.delete(votes).where(eq(votes.id, existing.id));
  } else {
    const mine = await db
      .select({ id: votes.id })
      .from(votes)
      .where(and(eq(votes.cycleId, cycle.id), eq(votes.userId, user.id)));
    if (mine.length >= config.votesPerPerson) return; // Out of votes.

    await db
      .insert(votes)
      .values({ cycleId: cycle.id, requestId, userId: user.id })
      .onConflictDoNothing();
  }
  refresh();
}

/**
 * Claim this as your one guaranteed pick, or drop the claim. Moving it to a
 * different item just replaces the old one -- everyone gets exactly one.
 */
export async function setMustHave(formData: FormData): Promise<void> {
  const user = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return;

  const request = await db.query.requests.findFirst({ where: eq(requests.id, requestId) });
  if (!request) return;

  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, request.cycleId) });
  if (!cycle || cycle.status === "closed") return;

  const existing = await db.query.mustHaves.findFirst({
    where: and(eq(mustHaves.cycleId, cycle.id), eq(mustHaves.userId, user.id)),
  });

  if (existing?.requestId === requestId) {
    await db.delete(mustHaves).where(eq(mustHaves.id, existing.id));
  } else if (existing) {
    await db.update(mustHaves).set({ requestId }).where(eq(mustHaves.id, existing.id));
  } else {
    await db
      .insert(mustHaves)
      .values({ cycleId: cycle.id, userId: user.id, requestId })
      .onConflictDoNothing();
  }
  refresh();
}

/* ------------------------------------------------------------------ */
/* Paste a link                                                        */
/* ------------------------------------------------------------------ */

export interface LookupResult {
  ok: boolean;
  message?: string;
  /** See `ActionResult.token`. */
  token?: string;
  draft?: {
    name: string;
    brand: string;
    priceText: string;
    imageUrl: string;
    store: string;
    sourceUrl: string;
  };
}

/**
 * Try to fill the add form in from a product URL. Whatever comes back is a
 * starting point the person then corrects -- see `lib/product-link.ts` for why
 * this cannot be trusted on its own.
 */
export async function lookupLink(_prev: LookupResult, formData: FormData): Promise<LookupResult> {
  await requireUser();
  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    return {
      ok: false,
      message: "Paste a Costco or Target link first.",
      token: crypto.randomUUID(),
    };
  }

  const draft = await lookupProduct(url);
  return {
    ok: draft.missing.length === 0,
    message: draft.note,
    token: crypto.randomUUID(),
    draft: {
      name: draft.name ?? "",
      brand: draft.brand ?? "",
      priceText: draft.priceCents != null ? (draft.priceCents / 100).toFixed(2) : "",
      imageUrl: draft.imageUrl ?? "",
      store: storeFromUrl(url),
      sourceUrl: url,
    },
  };
}
