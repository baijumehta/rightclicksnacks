import { ALL_CATEGORIES, type Category } from "./categories.ts";

/**
 * Work out what an item is from its name.
 *
 * The add form used to default to "other", and "other" counts as food -- so a
 * hand-added pack of paper towels was quietly charged to the snack budget.
 * Guessing from the name fixes that, and saves people picking from a
 * twelve-item menu for something the name already makes obvious.
 *
 * Rules are ordered and the first match wins, most specific first. That is
 * deliberate: "Puff Protein Bars" contains both "puff" and "protein", and
 * only one order of those tests gets it right. Supplies are tested before
 * everything else because miscategorising those costs real money.
 *
 * Pure and offline. `classify` in `categorize-ai.ts` falls back to Claude for
 * names these do not cover.
 */

const RULES: ReadonlyArray<readonly [Category, RegExp]> = [
  // --- Supplies first: these decide which budget an item comes out of. ---
  // `(?<!k-)` keeps "K-Cups" out: those are coffee, and matching them here
  // would bill the coffee to the supplies budget instead of the food one.
  ["cups & utensils", /\b((?<!k-)cups?|tumblers?|utensils?|cutlery|forks?|spoons?|knives|straws?|stirrers?|lids?)\b/i],
  ["paper goods", /\b(paper towels?|napkins?|tissues?|kleenex|toilet paper|bath tissue|paper plates?|plates?|paper)\b/i],
  ["kitchen & cleaning", /\b(dish ?soap|detergent|dishwasher|sponges?|wipes?|cleaners?|cleaning|trash bags?|garbage bags?|bleach|sanitiz\w*|disinfect\w*|degreaser)\b/i],

  // --- Food, most specific first. ---
  ["coffee & tea", /\b(coffee|espresso|k-?cups?|nespresso|pods?|latte|cold brew|tea|chai|matcha)\b/i],
  ["bars & protein", /\b(protein|bars?|rxbar|clif|quest|kind bar|jerky bar)\b/i],
  ["drinks", /\b(drinks?|water|soda|cola|pop|juice|seltzer|sparkling|energy|gatorade|powerade|kombucha|lemonade|beverages?|celsius|red bull)\b/i],
  ["nuts & trail mix", /\b(nuts?|almonds?|cashews?|pistachios?|peanuts?|walnuts?|pecans?|trail mix|mixed nuts)\b/i],
  ["dairy", /\b(milk|yogh?urt|cheese|creamer|half and half|butter|string cheese)\b/i],
  ["frozen", /\b(frozen|ice cream|popsicles?|gelato|sorbet)\b/i],
  ["fruit & fresh", /\b(fruits?|apples?|bananas?|oranges?|clementines?|grapes?|berries|strawberr\w*|blueberr\w*|carrots?|celery|melon|fresh)\b/i],
  ["breakfast", /\b(cereal|oatmeal|oats|bagels?|granola|muffins?|waffles?|pancakes?|breakfast|toast)\b/i],
  ["chips & crisps", /\b(chips?|crisps?|popcorn|pretzels?|doritos?|cheetos?|tortilla|puffs?|popcorners)\b/i],
  ["sweets", /\b(candy|chocolates?|cookies?|oreos?|gumm(y|i|ies)|haribo|brownies?|m&ms?|snickers|sweets?|donuts?|doughnuts?|ghirardelli|biscuits?)\b/i],
  ["savoury", /\b(jerky|crackers?|hummus|seaweed|salsa|dips?|meat sticks?|olives?|pickles?|triscuit)\b/i],
];

/**
 * The best guess for a name, or null when nothing matches confidently.
 * Null means "ask someone smarter", not "other".
 */
export function guessCategory(...parts: ReadonlyArray<string | null | undefined>): Category | null {
  const text = parts.filter(Boolean).join(" ").trim();
  if (!text) return null;
  for (const [category, pattern] of RULES) {
    if (pattern.test(text)) return category;
  }
  return null;
}

/** Narrow an arbitrary string to a known category, or null. */
export function asCategory(value: string | null | undefined): Category | null {
  if (!value) return null;
  return (ALL_CATEGORIES as readonly string[]).includes(value)
    ? (value as Category)
    : null;
}
