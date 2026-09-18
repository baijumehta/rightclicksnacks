import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays, budgetMonth, cycleBudgetCents, cycleLabel, cycleWindowContaining,
  cycleWindowFor, daysBetween, daysUntilClose, nextOrderDay, previousOrderDay,
  statusOn, today,
} from "../cycles.ts";

test("next order day is the following 1st or 15th", () => {
  assert.equal(nextOrderDay("2026-10-01"), "2026-10-15");
  assert.equal(nextOrderDay("2026-10-02"), "2026-10-15");
  assert.equal(nextOrderDay("2026-10-14"), "2026-10-15");
  assert.equal(nextOrderDay("2026-10-15"), "2026-11-01");
  assert.equal(nextOrderDay("2026-10-31"), "2026-11-01");
  assert.equal(nextOrderDay("2026-12-20"), "2027-01-01");
});

test("previous order day is the preceding 1st or 15th", () => {
  assert.equal(previousOrderDay("2026-10-15"), "2026-10-01");
  assert.equal(previousOrderDay("2026-10-16"), "2026-10-15");
  assert.equal(previousOrderDay("2026-10-02"), "2026-10-01");
  assert.equal(previousOrderDay("2026-10-01"), "2026-09-15");
  assert.equal(previousOrderDay("2027-01-01"), "2026-12-15");
});

test("a cycle runs from the previous order day to its own", () => {
  const w = cycleWindowFor("2026-10-01", 3);
  assert.deepEqual(w, {
    label: "Oct 1, 2026",
    startsOn: "2026-09-15",
    votingOpensOn: "2026-09-28",
    closesOn: "2026-10-01",
  });

  const mid = cycleWindowFor("2026-10-15", 3);
  assert.equal(mid.startsOn, "2026-10-01");
  assert.equal(mid.votingOpensOn, "2026-10-12");
});

test("voting never opens before the cycle has started", () => {
  // 30 days of lead time on a 14-day cycle would otherwise reach backwards.
  const w = cycleWindowFor("2026-10-15", 30);
  assert.equal(w.votingOpensOn, w.startsOn);
  assert.equal(w.votingOpensOn, "2026-10-01");
});

test("cycles close on order days only", () => {
  assert.throws(() => cycleWindowFor("2026-10-07", 3), /1st or the 15th/);
});

test("the cycle containing a day is the one closing next", () => {
  assert.equal(cycleWindowContaining("2026-09-20", 3).closesOn, "2026-10-01");
  assert.equal(cycleWindowContaining("2026-10-01", 3).closesOn, "2026-10-15");
});

test("status walks collecting to voting to closed", () => {
  const w = cycleWindowFor("2026-10-01", 3);
  assert.equal(statusOn(w, "2026-09-15"), "collecting");
  assert.equal(statusOn(w, "2026-09-27"), "collecting");
  assert.equal(statusOn(w, "2026-09-28"), "voting");
  assert.equal(statusOn(w, "2026-09-30"), "voting");
  assert.equal(statusOn(w, "2026-10-01"), "closed");
  assert.equal(statusOn(w, "2026-10-05"), "closed");
});

test("days until close counts down to the order day", () => {
  const w = cycleWindowFor("2026-10-01", 3);
  assert.equal(daysUntilClose(w, "2026-09-28"), 3);
  assert.equal(daysUntilClose(w, "2026-10-01"), 0);
  assert.equal(daysUntilClose(w, "2026-10-04"), 0);
});

test("date arithmetic crosses months and leap days", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(daysBetween("2026-09-15", "2026-10-01"), 16);
  assert.equal(daysBetween("2026-10-01", "2026-09-15"), -16);
});

test("the first cycle of a month gets half, the second gets the rest", () => {
  assert.equal(cycleBudgetCents(60_000, "2026-10-01"), 30_000);
  // First cycle underspent by $50, so the second has $350 rather than $300.
  assert.equal(cycleBudgetCents(60_000, "2026-10-15", 25_000), 35_000);
  // And an overspend cannot push the next cycle negative.
  assert.equal(cycleBudgetCents(60_000, "2026-10-15", 70_000), 0);
});

test("a cycle draws from the month it closes in", () => {
  // Runs 15 Sep to 1 Oct, so it is October's money.
  assert.equal(budgetMonth("2026-10-01"), "2026-10");
  assert.equal(budgetMonth("2026-10-15"), "2026-10");
});

test("labels read as the order day", () => {
  assert.equal(cycleLabel("2026-10-01"), "Oct 1, 2026");
  assert.equal(cycleLabel("2027-01-15"), "Jan 15, 2027");
});

test("today is the office's calendar day, not the server's", () => {
  // 03:30 UTC on the 2nd is still the 1st in Los Angeles.
  const at = new Date("2026-10-02T03:30:00Z");
  assert.equal(today("America/Los_Angeles", at), "2026-10-01");
  assert.equal(today("UTC", at), "2026-10-02");
});
