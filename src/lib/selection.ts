/**
 * Turning a ballot into a shopping list.
 *
 * The whiteboard failed in two directions at once: popular snacks crowded out
 * the one thing a particular person actually wanted, and nobody could see what
 * any of it cost. So the selection does three passes.
 *
 * Pass zero takes the supplies -- paper towels, napkins, cups. Nobody votes on
 * whether the office should have napkins, and they are not paid for out of the
 * food budget, so they are always bought and are counted separately. They go
 * on the same shopping list because it is the same trip.
 *
 * Pass one honours every person's single must-have pick, cheapest promise
 * first, capped so one person cannot eat the budget. That is the "my oat milk"
 * valve -- it does not need a single vote from anyone else.
 *
 * Pass two spends what is left on the items the room actually voted for, most
 * votes first. It keeps going past an item that does not fit rather than
 * stopping, so one $90 item near the top does not block five $12 items that
 * would all have fitted underneath it.
 *
 * Nothing with zero votes and no must-have is ever bought.
 */

export interface Candidate {
  requestId: string;
  /** Only used to break ties deterministically, so reruns match. */
  name: string;
  quantity: number;
  unitPriceCents: number;
  voteCount: number;
  /** How many people spent their one must-have pick on this. */
  mustHaveCount: number;
  /**
   * Supplies -- paper towels, napkins, cups -- are always bought and are paid
   * for out of a different pot, so they never compete for the food budget.
   */
  kind?: "snack" | "supply";
}

export type LineReason = "must_have" | "voted" | "supply";

export interface SelectionLine {
  requestId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  voteCount: number;
  mustHaveCount: number;
  reason: LineReason;
  rank: number;
  isFunded: boolean;
  /** Why it missed out, for the waitlist. */
  skippedBecause?: "no_votes" | "over_budget" | "pool_full";
}

export interface SelectionOptions {
  budgetCents: number;
  /** Ceiling on the unit price of ONE guaranteed pick. */
  mustHaveCapCents: number;
  /**
   * Ceiling on what ALL guaranteed picks may take together.
   *
   * The per-person cap alone does not bound the total: fifteen people each
   * picking at the cap would eat three quarters of a cycle before a single
   * vote was counted. This is a sub-limit of `budgetCents`, not extra money,
   * and anything that does not fit falls through to the vote rather than
   * being dropped. Omit it for no pool limit.
   */
  mustHavePoolCents?: number;
}

export interface SelectionResult {
  funded: SelectionLine[];
  waitlist: SelectionLine[];
  /** Food only. Supplies are not in here, and never push this over budget. */
  totalCents: number;
  remainingCents: number;
  mustHaveCents: number;
  votedCents: number;
  /** Supplies, tracked separately and paid for out of a different pot. */
  suppliesCents: number;
}

const byName = (a: Candidate, b: Candidate) => a.name.localeCompare(b.name);

/**
 * Value for money, used only to break a tie between two items with the same
 * number of votes: the cheaper one wins because it leaves room for more.
 */
function votesPerDollar(c: Candidate): number {
  const total = c.unitPriceCents * c.quantity;
  return total > 0 ? c.voteCount / total : Number.POSITIVE_INFINITY;
}

export function selectOrder(
  candidates: readonly Candidate[],
  { budgetCents, mustHaveCapCents, mustHavePoolCents }: SelectionOptions,
): SelectionResult {
  // The pool can never exceed the budget it is carved out of.
  let promisePool = Math.min(mustHavePoolCents ?? budgetCents, budgetCents);
  const funded: SelectionLine[] = [];
  const waitlist: SelectionLine[] = [];
  let remaining = budgetCents;
  let mustHaveCents = 0;
  let votedCents = 0;
  let suppliesCents = 0;

  /*
   * Supplies first, and unconditionally. Nobody votes on whether the office
   * should have napkins, and their cost does not touch `remaining`, so a big
   * paper order can never crowd a snack off the list.
   */
  const supplies = candidates
    .filter((c) => c.kind === "supply")
    .sort((a, b) => byName(a, b));

  for (const c of supplies) {
    const lineTotal = c.unitPriceCents * c.quantity;
    suppliesCents += lineTotal;
    funded.push(line(c, c.quantity, lineTotal, "supply", funded.length + 1, true));
  }

  const food = candidates.filter((c) => c.kind !== "supply");

  /*
   * A must-have is always a single unit -- the point is "make sure I get one",
   * not "buy me six". Anything whose unit price is over the cap drops through
   * to the voted pass, where it has to earn its place like everything else,
   * rather than being thrown away.
   */
  const promised = food
    .filter((c) => c.mustHaveCount > 0 && c.unitPriceCents <= mustHaveCapCents)
    .sort(
      (a, b) =>
        b.mustHaveCount - a.mustHaveCount ||
        a.unitPriceCents - b.unitPriceCents ||
        /*
         * Fewer votes first, which looks backwards and is not. A promise is
         * only worth anything to an item that cannot win the vote; a popular
         * pick spilled out of the pool still gets bought on votes, while an
         * unpopular one spilled out of the pool gets nothing. So when the
         * pool is tight, spend it where it is actually load-bearing.
         */
        a.voteCount - b.voteCount ||
        byName(a, b),
    );
  const promisedIds = new Set(promised.map((c) => c.requestId));
  /** Why a promise lost its guarantee, for the waitlist to explain. */
  const spilledBecause = new Map<string, "pool_full" | "over_budget">();

  /*
   * Picks that do not fit the pool are NOT waitlisted here -- they drop into
   * the voted pass below and compete normally, exactly as an over-cap pick
   * does. Losing the guarantee should not mean losing the request.
   */
  for (const c of promised) {
    const lineTotal = c.unitPriceCents;
    if (lineTotal > promisePool || lineTotal > remaining) {
      // Dropping it from the promised set is what sends it to the vote.
      promisedIds.delete(c.requestId);
      /*
       * Budget first: with no pool configured the two limits are the same
       * number, and blaming a "full pool" for what is really an empty
       * budget would send people looking for a setting that is not the
       * problem.
       */
      spilledBecause.set(
        c.requestId,
        lineTotal > remaining ? "over_budget" : "pool_full",
      );
      continue;
    }
    promisePool -= lineTotal;
    remaining -= lineTotal;
    mustHaveCents += lineTotal;
    funded.push(line(c, 1, lineTotal, "must_have", funded.length + 1, true));
  }

  /*
   * Everything else, most votes first. Ties go to the item that delivers more
   * votes per dollar, then alphabetically so two identical rows never swap
   * places between runs.
   */
  const contested = food
    .filter((c) => !promisedIds.has(c.requestId))
    .sort(
      (a, b) =>
        b.voteCount - a.voteCount ||
        votesPerDollar(b) - votesPerDollar(a) ||
        byName(a, b),
    );

  for (const c of contested) {
    const lineTotal = c.unitPriceCents * c.quantity;
    if (c.voteCount === 0) {
      /*
       * "No votes" would be a lie for somebody's guaranteed pick: they did
       * say they wanted it, the allowance just ran out before reaching them.
       */
      const why = spilledBecause.get(c.requestId) ?? "no_votes";
      waitlist.push(line(c, c.quantity, lineTotal, "voted", 0, false, why));
      continue;
    }
    if (lineTotal > remaining) {
      // Keep going: a cheaper item further down may still fit.
      waitlist.push(line(c, c.quantity, lineTotal, "voted", 0, false, "over_budget"));
      continue;
    }
    remaining -= lineTotal;
    votedCents += lineTotal;
    funded.push(line(c, c.quantity, lineTotal, "voted", funded.length + 1, true));
  }

  waitlist.forEach((l, i) => {
    l.rank = i + 1;
  });

  return {
    funded,
    waitlist,
    totalCents: budgetCents - remaining,
    remainingCents: remaining,
    mustHaveCents,
    votedCents,
    suppliesCents,
  };
}

function line(
  c: Candidate,
  quantity: number,
  lineTotalCents: number,
  reason: LineReason,
  rank: number,
  isFunded: boolean,
  skippedBecause?: SelectionLine["skippedBecause"],
): SelectionLine {
  return {
    requestId: c.requestId,
    name: c.name,
    quantity,
    unitPriceCents: c.unitPriceCents,
    lineTotalCents,
    voteCount: c.voteCount,
    mustHaveCount: c.mustHaveCount,
    reason,
    rank,
    isFunded,
    ...(skippedBecause ? { skippedBecause } : {}),
  };
}

/**
 * What the list would look like if the vote closed right now. The ballot page
 * runs this live so people can see their vote move the line, which is the
 * whole point of showing prices at all.
 */
export function previewOrder(
  candidates: readonly Candidate[],
  options: SelectionOptions,
): SelectionResult {
  return selectOrder(candidates, options);
}
