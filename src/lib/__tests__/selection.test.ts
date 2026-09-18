import { test } from "node:test";
import assert from "node:assert/strict";
import { selectOrder, type Candidate } from "../selection.ts";

function candidate(p: Partial<Candidate> & { requestId: string }): Candidate {
  return {
    name: p.requestId,
    quantity: 1,
    unitPriceCents: 1_000,
    voteCount: 0,
    mustHaveCount: 0,
    ...p,
  };
}

const OPTS = { budgetCents: 30_000, mustHaveCapCents: 1_500 };

test("most votes wins", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "chips", voteCount: 2 }),
      candidate({ requestId: "nuts", voteCount: 9 }),
      candidate({ requestId: "bars", voteCount: 5 }),
    ],
    OPTS,
  );
  assert.deepEqual(r.funded.map((l) => l.requestId), ["nuts", "bars", "chips"]);
  assert.deepEqual(r.funded.map((l) => l.rank), [1, 2, 3]);
  assert.equal(r.totalCents, 3_000);
  assert.equal(r.remainingCents, 27_000);
});

test("nothing with zero votes is ever bought", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "kale-chips", voteCount: 0 }),
      candidate({ requestId: "pretzels", voteCount: 4 }),
    ],
    OPTS,
  );
  assert.deepEqual(r.funded.map((l) => l.requestId), ["pretzels"]);
  assert.equal(r.waitlist[0].requestId, "kale-chips");
  assert.equal(r.waitlist[0].skippedBecause, "no_votes");
});

test("a must-have is bought without a single vote", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "oat-milk", unitPriceCents: 1_200, mustHaveCount: 1 }),
      candidate({ requestId: "popcorn", voteCount: 8 }),
    ],
    OPTS,
  );
  const oat = r.funded.find((l) => l.requestId === "oat-milk");
  assert.ok(oat, "the must-have should be funded");
  assert.equal(oat.reason, "must_have");
  assert.equal(oat.rank, 1, "must-haves are reserved before the vote is spent");
  assert.equal(r.mustHaveCents, 1_200);
  assert.equal(r.votedCents, 1_000);
});

test("a must-have is one unit, whatever quantity was requested", () => {
  const r = selectOrder(
    [candidate({ requestId: "kombucha", quantity: 6, unitPriceCents: 1_400, mustHaveCount: 1 })],
    OPTS,
  );
  assert.equal(r.funded[0].quantity, 1);
  assert.equal(r.funded[0].lineTotalCents, 1_400);
});

test("a must-have over the cap falls back to the vote instead of vanishing", () => {
  const r = selectOrder(
    [
      // $40 is well over the $15 cap.
      candidate({ requestId: "wagyu-jerky", unitPriceCents: 4_000, mustHaveCount: 1, voteCount: 3 }),
      candidate({ requestId: "almonds", voteCount: 7 }),
    ],
    OPTS,
  );
  const jerky = r.funded.find((l) => l.requestId === "wagyu-jerky");
  assert.ok(jerky, "it should still be buyable on votes");
  assert.equal(jerky.reason, "voted", "but not as a guaranteed pick");
  assert.equal(r.mustHaveCents, 0);
});

test("must-haves many people picked come first", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "seltzer", unitPriceCents: 900, mustHaveCount: 3 }),
      candidate({ requestId: "gf-crackers", unitPriceCents: 800, mustHaveCount: 1 }),
    ],
    { budgetCents: 1_000, mustHaveCapCents: 1_500 },
  );
  assert.deepEqual(r.funded.map((l) => l.requestId), ["seltzer"]);
  assert.equal(r.waitlist[0].requestId, "gf-crackers");
  assert.equal(r.waitlist[0].skippedBecause, "over_budget");
});

test("one expensive item does not block the cheaper ones under it", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "espresso-machine", voteCount: 10, unitPriceCents: 25_000 }),
      candidate({ requestId: "cookies", voteCount: 9, unitPriceCents: 1_200 }),
      candidate({ requestId: "chips", voteCount: 8, unitPriceCents: 900 }),
    ],
    { budgetCents: 5_000, mustHaveCapCents: 1_500 },
  );
  assert.deepEqual(r.funded.map((l) => l.requestId), ["cookies", "chips"]);
  assert.equal(r.waitlist[0].requestId, "espresso-machine");
  assert.equal(r.waitlist[0].skippedBecause, "over_budget");
  assert.equal(r.totalCents, 2_100);
});

test("ties break toward the cheaper item, so more fits", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "expensive", voteCount: 5, unitPriceCents: 3_000 }),
      candidate({ requestId: "cheap", voteCount: 5, unitPriceCents: 500 }),
    ],
    OPTS,
  );
  assert.deepEqual(r.funded.map((l) => l.requestId), ["cheap", "expensive"]);
});

test("quantity multiplies into the line total", () => {
  const r = selectOrder(
    [candidate({ requestId: "sparkling-water", voteCount: 6, quantity: 3, unitPriceCents: 1_150 })],
    OPTS,
  );
  assert.equal(r.funded[0].lineTotalCents, 3_450);
  assert.equal(r.totalCents, 3_450);
});

test("the list never exceeds the budget", () => {
  const many = Array.from({ length: 40 }, (_, i) =>
    candidate({ requestId: `item-${i}`, voteCount: 40 - i, unitPriceCents: 2_500 }),
  );
  const r = selectOrder(many, OPTS);
  assert.ok(r.totalCents <= OPTS.budgetCents, `spent ${r.totalCents}`);
  assert.equal(r.totalCents + r.remainingCents, OPTS.budgetCents);
  assert.equal(r.funded.length, 12);
});

test("must-haves and votes together stay inside the budget", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "a", unitPriceCents: 1_500, mustHaveCount: 1 }),
      candidate({ requestId: "b", unitPriceCents: 1_500, mustHaveCount: 1 }),
      candidate({ requestId: "c", voteCount: 9, unitPriceCents: 2_000 }),
      candidate({ requestId: "d", voteCount: 8, unitPriceCents: 2_000 }),
    ],
    { budgetCents: 5_000, mustHaveCapCents: 1_500 },
  );
  assert.equal(r.mustHaveCents, 3_000);
  assert.equal(r.votedCents, 2_000);
  assert.equal(r.totalCents, 5_000);
  assert.equal(r.remainingCents, 0);
  assert.equal(r.waitlist.length, 1);
});

test("an empty ballot spends nothing", () => {
  const r = selectOrder([], OPTS);
  assert.deepEqual(r.funded, []);
  assert.equal(r.totalCents, 0);
  assert.equal(r.remainingCents, 30_000);
});

test("the same ballot always produces the same list", () => {
  const ballot = [
    candidate({ requestId: "b", name: "b", voteCount: 4, unitPriceCents: 1_000 }),
    candidate({ requestId: "a", name: "a", voteCount: 4, unitPriceCents: 1_000 }),
    candidate({ requestId: "c", name: "c", voteCount: 4, unitPriceCents: 1_000 }),
  ];
  const first = selectOrder(ballot, OPTS).funded.map((l) => l.requestId);
  const shuffled = [ballot[2], ballot[0], ballot[1]];
  const second = selectOrder(shuffled, OPTS).funded.map((l) => l.requestId);
  assert.deepEqual(first, ["a", "b", "c"]);
  assert.deepEqual(second, first);
});

/* ------------------------------------------------------------------ */
/* Supplies                                                            */
/* ------------------------------------------------------------------ */

const supply = (p: Partial<Candidate> & { requestId: string }): Candidate =>
  candidate({ kind: "supply", ...p });

test("supplies are bought without any votes", () => {
  const r = selectOrder(
    [supply({ requestId: "napkins", unitPriceCents: 1_800, voteCount: 0 })],
    OPTS,
  );
  assert.deepEqual(r.funded.map((l) => l.requestId), ["napkins"]);
  assert.equal(r.funded[0].reason, "supply");
  assert.deepEqual(r.waitlist, []);
});

test("supplies do not come out of the food budget", () => {
  const r = selectOrder(
    [
      supply({ requestId: "paper-towels", unitPriceCents: 2_400 }),
      candidate({ requestId: "almonds", voteCount: 5, unitPriceCents: 1_000 }),
    ],
    OPTS,
  );
  assert.equal(r.suppliesCents, 2_400, "supplies tracked on their own");
  assert.equal(r.totalCents, 1_000, "food total excludes the supplies");
  assert.equal(r.remainingCents, 29_000, "the full budget was available to food");
});

test("a big supply order cannot crowd a snack off the list", () => {
  const r = selectOrder(
    [
      supply({ requestId: "bulk-paper", unitPriceCents: 40_000 }),
      candidate({ requestId: "cookies", voteCount: 3, unitPriceCents: 1_200 }),
    ],
    { budgetCents: 5_000, mustHaveCapCents: 1_500 },
  );
  assert.ok(
    r.funded.some((l) => l.requestId === "cookies"),
    "the snack should still be funded",
  );
  assert.equal(r.totalCents, 1_200);
  assert.equal(r.suppliesCents, 40_000);
});

test("supplies honour the quantity asked for", () => {
  const r = selectOrder(
    [supply({ requestId: "cups", quantity: 4, unitPriceCents: 900 })],
    OPTS,
  );
  assert.equal(r.funded[0].quantity, 4);
  assert.equal(r.funded[0].lineTotalCents, 3_600);
  assert.equal(r.suppliesCents, 3_600);
});

test("supplies never become a guaranteed pick", () => {
  // Even if somebody spends their pick on it, it stays a supply and stays
  // outside the budget rather than eating someone's one promise.
  const r = selectOrder(
    [supply({ requestId: "napkins", unitPriceCents: 1_000, mustHaveCount: 1 })],
    OPTS,
  );
  assert.equal(r.funded[0].reason, "supply");
  assert.equal(r.mustHaveCents, 0);
  assert.equal(r.totalCents, 0);
});

test("supplies sort to the top of the list, then food by votes", () => {
  const r = selectOrder(
    [
      candidate({ requestId: "nuts", name: "nuts", voteCount: 9 }),
      supply({ requestId: "cups", name: "cups" }),
      candidate({ requestId: "bars", name: "bars", voteCount: 4 }),
    ],
    OPTS,
  );
  assert.deepEqual(r.funded.map((l) => l.requestId), ["cups", "nuts", "bars"]);
});

test("a ballot of nothing but supplies spends no food budget", () => {
  const r = selectOrder(
    [supply({ requestId: "a", unitPriceCents: 500 }), supply({ requestId: "b", unitPriceCents: 700 })],
    OPTS,
  );
  assert.equal(r.totalCents, 0);
  assert.equal(r.remainingCents, 30_000);
  assert.equal(r.suppliesCents, 1_200);
  assert.equal(r.funded.length, 2);
});
