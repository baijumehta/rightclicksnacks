/**
 * The shelves a snack can sit on. Kept deliberately short: the list is a
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

export type SnackCategory = (typeof SNACK_CATEGORIES)[number];
