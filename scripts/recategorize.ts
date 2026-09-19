/**
 * Put catalog items that landed in "other" onto the right shelf.
 *
 *   npx tsx --conditions=react-server scripts/recategorize.ts        # preview
 *   npx tsx --conditions=react-server scripts/recategorize.ts --write
 *
 * Only touches rows whose category is "other", so a category somebody chose
 * on purpose is never overwritten. Prints the kind alongside, because that is
 * the part that decides which budget an item is paid from.
 */
import "./env.ts";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import { items } from "../src/db/schema.ts";
import { classifyItem } from "../src/lib/categorize-ai.ts";
import { kindForCategory } from "../src/lib/categories.ts";

const write = process.argv.includes("--write");

const stranded = await db.select().from(items).where(eq(items.category, "other"));
if (stranded.length === 0) {
  console.log('Nothing sitting in "other".');
  process.exit(0);
}

console.log(`${stranded.length} item${stranded.length === 1 ? "" : "s"} in "other"\n`);
let moved = 0;

for (const item of stranded) {
  const category = await classifyItem(item.name, item.brand, item.packSize);
  const kind = kindForCategory(category);
  const changed = category !== "other";
  const shifts = changed && kind !== item.kind;

  console.log(
    `  ${item.name.slice(0, 44).padEnd(46)}` +
      `${changed ? category : "(still other)"}`.padEnd(20) +
      (shifts ? `  ${item.kind} -> ${kind}  <- changes which budget pays` : ""),
  );

  if (changed && write) {
    await db.update(items).set({ category, kind }).where(eq(items.id, item.id));
    moved += 1;
  } else if (changed) {
    moved += 1;
  }
}

console.log(
  `\n${moved} would move.` + (write ? " Written." : " Re-run with --write to apply."),
);
process.exit(0);
