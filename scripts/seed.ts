import "./env.ts";
import { db } from "../src/db/index.ts";
import { items, settings } from "../src/db/schema.ts";
import { getOrCreateCurrentCycle } from "../src/lib/cycle-service.ts";

/**
 * A starter catalog so the first cycle is not an empty page.
 *
 * These are ordinary warehouse and big-box snack packs at plausible prices,
 * NOT live retailer data -- there is no feed to pull from. Treat every number
 * here as a placeholder to correct on the catalog page the first time somebody
 * actually shops. The staleness badge will start nagging after 45 days, which
 * is the point.
 */
const CATALOG = [
  // chips & crisps
  { name: "Kettle Brand Sea Salt Chips, variety", store: "costco", category: "chips & crisps", packSize: "30 ct", unitCount: 30, priceCents: 1699 },
  { name: "Doritos Nacho Cheese, snack size", store: "costco", category: "chips & crisps", packSize: "50 ct", unitCount: 50, priceCents: 1899 },
  { name: "Popcorners Sea Salt", store: "costco", category: "chips & crisps", packSize: "30 ct", unitCount: 30, priceCents: 1549 },
  { name: "Pretzel Crisps, Original", store: "target", category: "chips & crisps", packSize: "14 oz", priceCents: 549 },

  // sweets
  { name: "Kirkland Chocolate Chip Cookies", store: "costco", category: "sweets", packSize: "24 ct", unitCount: 24, priceCents: 999 },
  { name: "Ghirardelli Chocolate Squares, assorted", store: "costco", category: "sweets", packSize: "90 ct", unitCount: 90, priceCents: 2249 },
  { name: "Oreo Mini, snack packs", store: "target", category: "sweets", packSize: "20 ct", unitCount: 20, priceCents: 899 },
  { name: "Haribo Goldbears, snack size", store: "costco", category: "sweets", packSize: "54 ct", unitCount: 54, priceCents: 1399 },

  // bars & protein
  { name: "Kirkland Nut Bars", store: "costco", category: "bars & protein", packSize: "30 ct", unitCount: 30, priceCents: 1599 },
  { name: "RXBAR, variety", store: "costco", category: "bars & protein", packSize: "18 ct", unitCount: 18, priceCents: 2399 },
  { name: "Clif Bar, variety", store: "target", category: "bars & protein", packSize: "18 ct", unitCount: 18, priceCents: 2199 },
  { name: "Quest Protein Bars, variety", store: "costco", category: "bars & protein", packSize: "20 ct", unitCount: 20, priceCents: 3199 },

  // nuts & trail mix
  { name: "Kirkland Mixed Nuts, salted", store: "costco", category: "nuts & trail mix", packSize: "40 oz", priceCents: 1899 },
  { name: "Kirkland Trail Mix, snack packs", store: "costco", category: "nuts & trail mix", packSize: "28 ct", unitCount: 28, priceCents: 1699 },
  { name: "Wonderful Pistachios, snack packs", store: "costco", category: "nuts & trail mix", packSize: "24 ct", unitCount: 24, priceCents: 1799 },
  { name: "Blue Diamond Almonds, snack packs", store: "target", category: "nuts & trail mix", packSize: "18 ct", unitCount: 18, priceCents: 1349 },

  // fruit & fresh
  { name: "Clementines", store: "costco", category: "fruit & fresh", packSize: "5 lb bag", priceCents: 899 },
  { name: "Bananas", store: "target", category: "fruit & fresh", packSize: "3 lb", priceCents: 199 },
  { name: "Apples, Honeycrisp", store: "costco", category: "fruit & fresh", packSize: "4 lb", priceCents: 1099 },
  { name: "Baby carrots", store: "costco", category: "fruit & fresh", packSize: "5 lb", priceCents: 649 },

  // drinks
  { name: "LaCroix Sparkling Water, variety", store: "costco", category: "drinks", packSize: "24 ct", unitCount: 24, priceCents: 1299 },
  { name: "Kirkland Sparkling Water, variety", store: "costco", category: "drinks", packSize: "35 ct", unitCount: 35, priceCents: 999 },
  { name: "Celsius Energy, variety", store: "costco", category: "drinks", packSize: "18 ct", unitCount: 18, priceCents: 2699 },
  { name: "Gatorade Zero, variety", store: "target", category: "drinks", packSize: "12 ct", unitCount: 12, priceCents: 1199 },
  { name: "Honest Kids juice pouches", store: "target", category: "drinks", packSize: "40 ct", unitCount: 40, priceCents: 1449 },

  // coffee & tea
  { name: "Starbucks Pike Place K-Cups", store: "costco", category: "coffee & tea", packSize: "72 ct", unitCount: 72, priceCents: 3999 },
  { name: "Kirkland Colombian coffee, ground", store: "costco", category: "coffee & tea", packSize: "3 lb", priceCents: 1799 },
  { name: "Tazo tea, assorted", store: "target", category: "coffee & tea", packSize: "24 ct", unitCount: 24, priceCents: 799 },

  // dairy
  { name: "Oat milk, barista", store: "target", category: "dairy", packSize: "32 oz", priceCents: 499 },
  { name: "Half and half", store: "costco", category: "dairy", packSize: "2 x 32 oz", priceCents: 649 },
  { name: "Chobani Greek yogurt, variety", store: "costco", category: "dairy", packSize: "20 ct", unitCount: 20, priceCents: 1699 },
  { name: "String cheese", store: "costco", category: "dairy", packSize: "48 ct", unitCount: 48, priceCents: 1399 },

  // savoury
  { name: "Kirkland Beef Jerky", store: "costco", category: "savoury", packSize: "14 oz", priceCents: 1999 },
  { name: "Hummus snack cups", store: "costco", category: "savoury", packSize: "20 ct", unitCount: 20, priceCents: 1399 },
  { name: "Seaweed snacks", store: "costco", category: "savoury", packSize: "10 ct", unitCount: 10, priceCents: 999 },
  { name: "Triscuit crackers", store: "target", category: "savoury", packSize: "2 x 9 oz", priceCents: 749 },

  // breakfast
  { name: "Nature Valley Granola Bars", store: "costco", category: "breakfast", packSize: "49 ct", unitCount: 49, priceCents: 1499 },
  { name: "Bagels, assorted", store: "costco", category: "breakfast", packSize: "12 ct", unitCount: 12, priceCents: 799 },
  { name: "Instant oatmeal, variety", store: "target", category: "breakfast", packSize: "32 ct", unitCount: 32, priceCents: 899 },
] as const;

async function main() {
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();

  const existing = await db.select({ id: items.id }).from(items).limit(1);
  if (existing.length > 0) {
    console.log("Catalog already has items; leaving it alone.");
  } else {
    await db.insert(items).values(
      CATALOG.map((entry) => ({
        name: entry.name,
        store: entry.store as "costco" | "target",
        category: entry.category,
        packSize: entry.packSize,
        unitCount: "unitCount" in entry ? entry.unitCount : null,
        priceCents: entry.priceCents,
        notes: "Seeded estimate -- confirm the price before the first order.",
      })),
    );
    console.log(`Seeded ${CATALOG.length} catalog items.`);
  }

  const cycle = await getOrCreateCurrentCycle();
  console.log(
    `Current cycle: ${cycle.label} (${cycle.status}), budget ${(cycle.budgetCents / 100).toFixed(2)}.`,
  );
  console.log("\nPrices above are placeholders. Correct them on the catalog page.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
