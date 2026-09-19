import {
  pgTable, uuid, text, integer, boolean, timestamp, date,
  uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

/**
 * Everyone who can request and vote. Rows are created on first successful
 * Entra sign-in, but only for addresses already seeded here or on a tenant
 * whose domain is allow-listed -- see `lib/auth.ts`.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** Entra's immutable object id. Email can change; this does not. */
    entraOid: text("entra_oid"),
    isAdmin: boolean("is_admin").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    uniqueIndex("users_entra_oid_key").on(t.entraOid),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_hash_key").on(t.tokenHash)],
);

/** Short-lived OIDC state, so the callback can verify what the start set. */
export const authFlows = pgTable("auth_flows", {
  state: text("state").primaryKey(),
  codeVerifier: text("code_verifier").notNull(),
  nonce: text("nonce").notNull(),
  redirectTo: text("redirect_to"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

/**
 * Single row (id = 1). Everything the office manager can tune without a
 * deploy: the budget, how many votes people get, the must-have cap.
 */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  /** The whole snack budget for a calendar month, in cents. */
  monthlyBudgetCents: integer("monthly_budget_cents").notNull().default(60_000),
  /** Votes each person may spend per cycle, one vote maximum per item. */
  votesPerPerson: integer("votes_per_person").notNull().default(10),
  /**
   * Ceiling on one person's guaranteed pick. This is the release valve for
   * "I want this specific thing nobody else eats" -- it skips the vote
   * entirely, so long as it is cheap.
   */
  mustHaveCapCents: integer("must_have_cap_cents").notNull().default(1_500),
  /**
   * What every guaranteed pick may take TOGETHER, as a percent of the cycle.
   *
   * The per-person cap does not bound this on its own: fifteen people each
   * picking at a $15 cap would reach $225 of a $300 cycle, leaving almost
   * nothing for the vote. Stored as a percent rather than an amount so it
   * keeps up with the budget instead of quietly drifting out of step.
   */
  mustHavePoolPercent: integer("must_have_pool_percent").notNull().default(40),
  /** Voting opens this many days before the cycle closes. */
  votingOpensDaysBefore: integer("voting_opens_days_before").notNull().default(3),
  /** Warn that a price needs re-checking after this many days. */
  priceStaleDays: integer("price_stale_days").notNull().default(45),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Cycles                                                              */
/* ------------------------------------------------------------------ */

/**
 * `collecting` -> anyone can add items. `voting` -> ballot is open, the item
 * list is frozen. `closed` -> the shopping list exists and is final.
 */
export type CycleStatus = "collecting" | "voting" | "closed";

/**
 * One ordering round. Two per month: the 1st and the 15th are the days the
 * order gets placed, and a cycle is named for the day it closes.
 *
 * A cycle belongs to the month it CLOSES in, because that is the month the
 * money leaves. So the cycle running Sep 15 -> Oct 1 spends October's budget.
 */
export const cycles = pgTable(
  "cycles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** e.g. "Oct 1, 2026". Derived, stored so past cycles read the same forever. */
    label: text("label").notNull(),
    startsOn: date("starts_on").notNull(),
    votingOpensOn: date("voting_opens_on").notNull(),
    /** Order day. Voting closes at the start of this day. */
    closesOn: date("closes_on").notNull(),
    status: text("status").$type<CycleStatus>().notNull().default("collecting"),
    /**
     * This cycle's slice of the monthly budget, including anything the
     * earlier cycle in the same month left unspent.
     */
    budgetCents: integer("budget_cents").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cycles_closes_on_key").on(t.closesOn),
    index("cycles_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export type Store = "costco" | "target" | "other";

/**
 * Snacks are voted on and paid for out of the food budget. Supplies -- paper
 * towels, napkins, cups -- are not: the office needs them whether or not
 * anyone votes, and they come out of a different pot. They still land on the
 * same shopping list, because it is the same trip to Costco.
 */
export type ItemKind = "snack" | "supply";

/**
 * A snack that exists, independent of any one cycle. Added once, then
 * re-nominated cycle after cycle -- which is what makes the "we bought this
 * four times and it always scores well" suggestions possible.
 */
export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    brand: text("brand"),
    store: text("store").$type<Store>().notNull().default("costco"),
    kind: text("kind").$type<ItemKind>().notNull().default("snack"),
    category: text("category").notNull().default("other"),
    /** Human-readable pack size: "40 ct", "2 x 32 oz". */
    packSize: text("pack_size"),
    /** How many individual servings one purchase yields, when known. */
    unitCount: integer("unit_count"),
    priceCents: integer("price_cents").notNull(),
    /** The Costco/Target product page the price came from. */
    sourceUrl: text("source_url"),
    imageUrl: text("image_url"),
    /** Last time a human confirmed the price. Drives the stale-price badge. */
    priceCheckedAt: timestamp("price_checked_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    /** Dietary flags people actually ask about, kept as free-text tags. */
    tags: text("tags").array().notNull().default([]),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("items_active_idx").on(t.isActive),
    index("items_category_idx").on(t.category),
  ],
);

/* ------------------------------------------------------------------ */
/* Requests, votes, must-haves                                         */
/* ------------------------------------------------------------------ */

/** An item put on the ballot for one cycle. One row per item per cycle. */
export const requests = pgTable(
  "requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id").notNull().references(() => cycles.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    /**
     * Price copied from the catalog when the request is made, so a later
     * price edit never rewrites what a past order cost.
     */
    unitPriceCents: integer("unit_price_cents").notNull(),
    note: text("note"),
    requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("requests_cycle_item_key").on(t.cycleId, t.itemId),
    index("requests_cycle_idx").on(t.cycleId),
  ],
);

/** One vote by one person for one request. Approval-style: no weighting. */
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id").notNull().references(() => cycles.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("votes_request_user_key").on(t.requestId, t.userId),
    index("votes_cycle_user_idx").on(t.cycleId, t.userId),
  ],
);

/**
 * Each person's one guaranteed pick per cycle. This is the whiteboard problem
 * solved directly: your oat milk gets bought even though nobody else votes
 * for it, as long as it is under the cap.
 */
export const mustHaves = pgTable(
  "must_haves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id").notNull().references(() => cycles.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("must_haves_cycle_user_key").on(t.cycleId, t.userId)],
);

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

/** Why a line made the cut -- shown on the list so the outcome is explainable. */
export type LineReason = "must_have" | "voted" | "supply";

/**
 * The frozen result of closing a cycle: what to actually buy. Written once by
 * the close job; `actualCents` is filled in afterwards by whoever shopped.
 */
export const orderLines = pgTable(
  "order_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id").notNull().references(() => cycles.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    voteCount: integer("vote_count").notNull().default(0),
    reason: text("reason").$type<LineReason>().notNull(),
    /** Rank on the funded list, or on the waitlist when `isFunded` is false. */
    rank: integer("rank").notNull(),
    isFunded: boolean("is_funded").notNull().default(true),
    /** What it actually rang up as, once someone reconciles the receipt. */
    actualCents: integer("actual_cents"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("order_lines_cycle_request_key").on(t.cycleId, t.requestId),
    index("order_lines_cycle_idx").on(t.cycleId),
  ],
);

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ many }) => ({
  votes: many(votes),
  requests: many(requests),
  mustHaves: many(mustHaves),
}));

export const cyclesRelations = relations(cycles, ({ many }) => ({
  requests: many(requests),
  votes: many(votes),
  mustHaves: many(mustHaves),
  orderLines: many(orderLines),
}));

export const itemsRelations = relations(items, ({ many, one }) => ({
  requests: many(requests),
  createdByUser: one(users, { fields: [items.createdBy], references: [users.id] }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  cycle: one(cycles, { fields: [requests.cycleId], references: [cycles.id] }),
  item: one(items, { fields: [requests.itemId], references: [items.id] }),
  requester: one(users, { fields: [requests.requestedBy], references: [users.id] }),
  votes: many(votes),
  mustHaves: many(mustHaves),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  request: one(requests, { fields: [votes.requestId], references: [requests.id] }),
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));

export const mustHavesRelations = relations(mustHaves, ({ one }) => ({
  request: one(requests, { fields: [mustHaves.requestId], references: [requests.id] }),
  user: one(users, { fields: [mustHaves.userId], references: [users.id] }),
}));

export const orderLinesRelations = relations(orderLines, ({ one }) => ({
  cycle: one(cycles, { fields: [orderLines.cycleId], references: [cycles.id] }),
  request: one(requests, { fields: [orderLines.requestId], references: [requests.id] }),
}));

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Cycle = typeof cycles.$inferSelect;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type OrderLine = typeof orderLines.$inferSelect;
