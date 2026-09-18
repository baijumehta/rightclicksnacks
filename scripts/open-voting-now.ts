/**
 * Open voting on the current cycle today, for a trial run.
 *
 * Temporary: moves `voting_opens_on` to today and lets the normal nightly
 * advance flip the status, so the cycle goes through the same code path it
 * would on the real day. Pass an ISO date to put it back:
 *
 *   npx tsx --conditions=react-server scripts/open-voting-now.ts 2026-09-28
 */
import "./env.ts";
import { desc, eq } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import { cycles } from "../src/db/schema.ts";
import { rollCycles } from "../src/lib/cycle-service.ts";
import { today } from "../src/lib/cycles.ts";
import { OFFICE_TIMEZONE } from "../src/lib/settings.ts";

const target = process.argv[2] ?? today(OFFICE_TIMEZONE);
if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) {
  throw new Error(`Expected an ISO date, got ${target}`);
}

const [cycle] = await db.select().from(cycles).orderBy(desc(cycles.closesOn)).limit(1);
if (!cycle) throw new Error("No cycle to change");

console.log(`before  ${cycle.label}  [${cycle.status}]  voting opens ${cycle.votingOpensOn}`);

await db.update(cycles).set({ votingOpensOn: target }).where(eq(cycles.id, cycle.id));

// If voting is being pushed back into the future, the status has to come back
// down with it -- rollCycles only ever moves a cycle forward.
if (target > today(OFFICE_TIMEZONE) && cycle.status === "voting") {
  await db.update(cycles).set({ status: "collecting" }).where(eq(cycles.id, cycle.id));
}

const rolled = await rollCycles();

const [after] = await db.select().from(cycles).where(eq(cycles.id, cycle.id));
console.log(`after   ${after.label}  [${after.status}]  voting opens ${after.votingOpensOn}`);
console.log(`roll    ${JSON.stringify(rolled)}`);
process.exit(0);
