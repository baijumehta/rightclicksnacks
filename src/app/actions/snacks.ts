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
import { readSnackFromPhoto } from "@/lib/photo-import.ts";
import { ALL_CATEGORIES, kindForCategory } from "@/lib/categories.ts";
import { classifyItem } from "@/lib/categorize-ai.ts";

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
  category: z.enum(ALL_CATEGORIES),
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

  /*
   * "other" is what the form sits on when nobody touches the menu, and it
   * counts as food -- so a hand-added pack of paper towels used to be billed
   * to the snack budget. Treat it as "not chosen" and work it out from the
   * name instead.
   */
  const category =
    data.category === "other"
      ? await classifyItem(data.name, data.brand, data.packSize)
      : data.category;

  const [created] = await db
    .insert(items)
    .values({
      name: data.name,
      brand: data.brand ?? null,
      store: data.store,
      // The category decides which pot it comes out of, so there is no
      // separate switch to get wrong.
      kind: kindForCategory(category),
      category,
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

  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!item || !item.isActive) return fail("That item is not in the catalog.");

  /*
   * Freezing the list during voting protects the ballot -- people should not
   * find new things to vote on halfway through. Supplies are not on the
   * ballot and nobody votes for them, so adding napkins mid-vote changes
   * nothing anyone has already decided.
   */
  if (cycle.status === "voting" && item.kind !== "supply") {
    return fail("Voting is open, so the list is frozen. This one will have to wait for next time.");
  }

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

/**
 * What an importer hands the add form. A pasted link and an uploaded photo
 * fill in different subsets of it, so the form only has to understand one
 * shape and every field stays editable either way.
 */
export interface ImportDraft {
  name: string;
  brand: string;
  priceText: string;
  imageUrl: string;
  store: string;
  sourceUrl: string;
  packSize: string;
  unitCount: string;
  /** Empty when the importer had no opinion; the form keeps its default. */
  category: string;
  /** True when nothing legible was found and somebody has to type one. */
  needsPrice: boolean;
}

export interface LookupResult {
  ok: boolean;
  message?: string;
  /** See `ActionResult.token`. */
  token?: string;
  draft?: ImportDraft;
}

const EMPTY_DRAFT: ImportDraft = {
  name: "",
  brand: "",
  priceText: "",
  imageUrl: "",
  store: "costco",
  sourceUrl: "",
  packSize: "",
  unitCount: "",
  category: "",
  needsPrice: true,
};

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

  const found = await lookupProduct(url);
  return {
    ok: found.missing.length === 0,
    message: found.note,
    token: crypto.randomUUID(),
    draft: {
      ...EMPTY_DRAFT,
      name: found.name ?? "",
      brand: found.brand ?? "",
      priceText: found.priceCents != null ? (found.priceCents / 100).toFixed(2) : "",
      imageUrl: found.imageUrl ?? "",
      store: storeFromUrl(url),
      sourceUrl: url,
      needsPrice: found.priceCents == null,
    },
  };
}

/**
 * Read an item off an uploaded photo or screenshot. Same contract as the link
 * lookup: a draft to correct, never a saved row.
 */
export async function importPhoto(
  _prev: LookupResult,
  formData: FormData,
): Promise<LookupResult> {
  await requireUser();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a photo first.", token: crypto.randomUUID() };
  }

  const result = await readSnackFromPhoto(file);
  if (!result.ok) {
    return { ok: false, message: result.message, token: crypto.randomUUID() };
  }

  const { draft } = result;
  return {
    ok: !draft.needsPrice,
    message:
      draft.note ??
      `Read that as ${draft.name || "an item"}. Check it over before saving.`,
    token: crypto.randomUUID(),
    draft: {
      ...EMPTY_DRAFT,
      name: draft.name,
      brand: draft.brand,
      priceText: draft.priceText,
      store: draft.store,
      packSize: draft.packSize,
      unitCount: draft.unitCount,
      category: draft.category,
      needsPrice: draft.needsPrice,
    },
  };
}
