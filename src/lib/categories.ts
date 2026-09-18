/**
 * The shelves an item can sit on. Kept deliberately short: the list is a
 * filter and a way to spot "there is nothing to drink on this order", not a
 * taxonomy anyone should have to think hard about.
 *
 * Lives outside the actions file because a "use server" module may only
 * export async functions.
 */
export const SNACK_CATEGORIES = [
  "chips & crisps",
  "sweets",
  "bars & protein",
  "nuts & trail mix",
  "fruit & fresh",
  "drinks",
  "coffee & tea",
  "dairy",
  "frozen",
  "breakfast",
  "savoury",
  "other",
] as const;

/**
 * Supplies are not food and are not voted on. They are paid for out of a
 * different pot but go on the same Costco run, so they live in the same
 * catalog with their own categories.
 */
export const SUPPLY_CATEGORIES = [
  "paper goods",
  "cups & utensils",
  "kitchen & cleaning",
  "other supplies",
] as const;

export const ALL_CATEGORIES = [...SNACK_CATEGORIES, ...SUPPLY_CATEGORIES] as const;

export type SnackCategory = (typeof SNACK_CATEGORIES)[number];
export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number];
export type Category = (typeof ALL_CATEGORIES)[number];

export type ItemKind = "snack" | "supply";

const SUPPLY_SET = new Set<string>(SUPPLY_CATEGORIES);

/** Which pot a category belongs to. */
export function kindForCategory(category: string): ItemKind {
  return SUPPLY_SET.has(category) ? "supply" : "snack";
}

export function categoriesFor(kind: ItemKind): readonly string[] {
  return kind === "supply" ? SUPPLY_CATEGORIES : SNACK_CATEGORIES;
}
