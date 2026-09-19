import { test } from "node:test";
import assert from "node:assert/strict";
import { asCategory, guessCategory } from "../categorize.ts";
import { kindForCategory } from "../categories.ts";

test("the two items that prompted this land correctly", () => {
  assert.equal(
    guessCategory("Kirkland Signature Sparkling Energy Drink, Variety"),
    "drinks",
  );
  assert.equal(
    guessCategory("Built Bar Cookie Dough Chunk Puff Protein Bars"),
    "bars & protein",
  );
});

test("supplies are recognised, because they decide which budget pays", () => {
  const supplies = [
    "Kirkland Paper Towels, 12 rolls",
    "Dinner napkins, 600 ct",
    "Bath tissue, 30 rolls",
    "Hot cups with lids, 12 oz",
    "Plastic cutlery, assorted",
    "Dish soap",
    "Disinfecting wipes",
    "Kitchen trash bags, 13 gal",
  ];
  for (const name of supplies) {
    const category = guessCategory(name);
    assert.ok(category, `no guess for ${name}`);
    assert.equal(kindForCategory(category), "supply", `${name} -> ${category}`);
  }
});

test("food is never mistaken for a supply", () => {
  const food = [
    "Kirkland Mixed Nuts, salted",
    "LaCroix Sparkling Water, variety",
    "Ghirardelli Chocolate Squares",
    "Starbucks Pike Place K-Cups",
    "Chobani Greek yogurt",
    "Clementines, 5 lb bag",
    "Nature Valley Granola Bars",
    "Kettle Brand Sea Salt Chips",
    "Kirkland Beef Jerky",
    "Instant oatmeal, variety",
  ];
  for (const name of food) {
    const category = guessCategory(name);
    assert.ok(category, `no guess for ${name}`);
    assert.equal(kindForCategory(category), "snack", `${name} -> ${category}`);
  }
});

test("order matters where words overlap", () => {
  // "Puff" would say chips and "Cookie" would say sweets; protein wins.
  assert.equal(guessCategory("Puff Protein Bars"), "bars & protein");
  // "Paper plates" is paper goods, not the bare "plates" rule firing late.
  assert.equal(guessCategory("Paper plates, 10 inch"), "paper goods");
  // Coffee is a drink, but the more specific shelf wins.
  assert.equal(guessCategory("Cold brew concentrate"), "coffee & tea");
  // A granola BAR is a bar; granola on its own is breakfast.
  assert.equal(guessCategory("Nature Valley Granola Bars"), "bars & protein");
  assert.equal(guessCategory("Granola, 2 lb"), "breakfast");
});

test("brand and pack size are considered too", () => {
  assert.equal(guessCategory("Vita Coco", "", "12 ct"), null);
  assert.equal(guessCategory("Sea Salt", "Popcorners", "30 ct"), "chips & crisps");
});

test("an unrecognisable name gives null, not a wrong guess", () => {
  assert.equal(guessCategory("Zbrx 400"), null);
  assert.equal(guessCategory(""), null);
  assert.equal(guessCategory(null, undefined), null);
});

test("asCategory only admits known categories", () => {
  assert.equal(asCategory("drinks"), "drinks");
  assert.equal(asCategory("paper goods"), "paper goods");
  assert.equal(asCategory("nonsense"), null);
  assert.equal(asCategory(""), null);
  assert.equal(asCategory(undefined), null);
});

test("K-Cups are coffee, not crockery", () => {
  // "Cups" inside "K-Cups" used to match the supplies rule, which would have
  // billed the coffee to the wrong budget entirely.
  assert.equal(guessCategory("Starbucks Pike Place K-Cups"), "coffee & tea");
  assert.equal(guessCategory("Nespresso Vertuo pods, bulk"), "coffee & tea");
  // ...while actual cups stay supplies.
  assert.equal(guessCategory("Hot cups with lids, 12 oz"), "cups & utensils");
  assert.equal(guessCategory("Cold cups, 16 oz"), "cups & utensils");
});
