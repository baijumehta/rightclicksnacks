import type { Cycle, Settings, User } from "@/db/schema.ts";
import type { BallotRow } from "@/lib/cycle-service.ts";
import type { MyBallotState } from "@/lib/cycle-service.ts";
import type { SelectionResult } from "@/lib/selection.ts";
import { formatCents, perUnitLabel } from "@/lib/money.ts";
import { isStale } from "@/lib/suggest.ts";
import { Badge, EmptyState, StoreBadge, SupplyBadge, buttonStyles } from "@/components/ui.tsx";
import { setMustHave, toggleVote, withdrawRequest } from "./actions/snacks.ts";

/**
 * This cycle's list. During collecting it is a list you can add to and take
 * from; once voting opens it becomes the ballot, and the line showing what
 * currently fits the budget moves as people vote.
 */
export function Ballot({
  cycle,
  rows,
  preview,
  mine,
  user,
  config,
}: {
  cycle: Cycle;
  rows: BallotRow[];
  preview: SelectionResult;
  mine: MyBallotState;
  user: User;
  config: Settings;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState title="Nothing on the list yet">
        Add the snacks you want below. Everything shows its price, so the whole office can see
        what fits in the budget.
      </EmptyState>
    );
  }

  const voting = cycle.status === "voting";
  // Supplies are not voted on and do not compete for the budget, so they are
  // listed on their own below rather than ranked among the snacks.
  const supplies = rows.filter((r) => r.kind === "supply");
  const food = rows.filter((r) => r.kind !== "supply");
  /*
   * While the list is still being collected nothing has been decided, so the
   * cut line and the dimming stay off -- with no votes cast yet they would
   * grey out the entire list and imply the budget had already run out.
   */
  const ranked = cycle.status !== "collecting";

  const fundedIds = new Set(preview.funded.map((l) => l.requestId));
  const rankOf = new Map(preview.funded.map((l) => [l.requestId, l.rank]));

  // Order the list the way the shopping list would come out, so the cut line
  // is a line you can actually see rather than a badge scattered about.
  const ordered = ranked
    ? [...food].sort((a, b) => {
        const aFunded = fundedIds.has(a.requestId);
        const bFunded = fundedIds.has(b.requestId);
        if (aFunded !== bFunded) return aFunded ? -1 : 1;
        if (aFunded) return (rankOf.get(a.requestId) ?? 0) - (rankOf.get(b.requestId) ?? 0);
        return b.voteCount - a.voteCount || a.name.localeCompare(b.name);
      })
    : food;

  const cutAfter = preview.funded.length;

  return (
    <ul className="divide-y divide-line">
      {ordered.map((row, index) => (
        <li key={row.requestId}>
          {ranked && index === cutAfter && cutAfter > 0 ? <CutLine /> : null}
          <Row
            row={row}
            cycle={cycle}
            config={config}
            user={user}
            mine={mine}
            isFunded={!ranked || fundedIds.has(row.requestId)}
            voting={voting}
          />
        </li>
      ))}

      {supplies.length > 0 ? (
        <li>
          <SectionHeading
            title="Supplies"
            detail="Always bought, no vote needed, and not out of the food budget."
          />
        </li>
      ) : null}
      {supplies.map((row) => (
        <li key={row.requestId}>
          <Row
            row={row}
            cycle={cycle}
            config={config}
            user={user}
            mine={mine}
            isFunded
            voting={false}
          />
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-y border-line bg-surface-2/60 px-4 py-2 sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{detail}</p>
    </div>
  );
}

function CutLine() {
  return (
    <div className="flex items-center gap-3 bg-surface-2/60 px-4 py-2 sm:px-5">
      <div className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        Budget runs out here
      </span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

function Row({
  row,
  cycle,
  config,
  user,
  mine,
  isFunded,
  voting,
}: {
  row: BallotRow;
  cycle: Cycle;
  config: Settings;
  user: User;
  mine: MyBallotState;
  isFunded: boolean;
  voting: boolean;
}) {
  const each = perUnitLabel(row.unitPriceCents, row.unitCount);
  const iVoted = mine.votedRequestIds.has(row.requestId);
  const isMyMustHave = mine.mustHaveRequestId === row.requestId;
  const isSupply = row.kind === "supply";
  // Supplies are never voted on and never anyone's guaranteed pick.
  const canMustHave = !isSupply && row.unitPriceCents <= config.mustHaveCapCents;

  /*
   * A guaranteed pick always buys exactly one, so show that price rather than
   * the requested quantity's -- otherwise the row and the budget disagree.
   */
  const guaranteed = row.mustHaveCount > 0 && canMustHave;
  const lineTotal = guaranteed ? row.unitPriceCents : row.unitPriceCents * row.quantity;
  const stale = isStale(row.priceCheckedAt, config.priceStaleDays);
  const outOfVotes = mine.votesLeft === 0 && !iVoted;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5 ${
        isFunded ? "" : "opacity-60"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.name}</span>
          {row.quantity > 1 && !guaranteed ? (
            <span className="text-sm text-muted">×{row.quantity}</span>
          ) : null}
          <StoreBadge store={row.store} />
          {isSupply ? <SupplyBadge /> : null}
          {!isSupply && row.mustHaveCount > 0 ? (
            <Badge tone="accent" title="Somebody's guaranteed pick this cycle">
              Must-have{row.mustHaveCount > 1 ? ` ×${row.mustHaveCount}` : ""}
            </Badge>
          ) : null}
          {stale ? (
            <Badge tone="warn" title="Nobody has checked this price in a while">
              Price may be old
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-muted">
          <span className="tnum">{formatCents(row.unitPriceCents)}</span>
          {row.packSize ? ` · ${row.packSize}` : ""}
          {each ? ` · ${each}` : ""}
          {guaranteed && row.quantity > 1 ? ` · a guaranteed pick buys one, not ${row.quantity}` : ""}
          {row.note ? ` · "${row.note}"` : ""}
        </p>
      </div>

      <div className="tnum w-20 text-right text-sm font-medium">{formatCents(lineTotal)}</div>

      <div className="no-print flex items-center gap-2">
        {isSupply ? null : voting ? (
          <form action={toggleVote}>
            <input type="hidden" name="requestId" value={row.requestId} />
            <button
              type="submit"
              disabled={outOfVotes}
              title={outOfVotes ? "You have used all your votes" : undefined}
              className={iVoted ? buttonStyles.primary : buttonStyles.secondary}
            >
              <span aria-hidden>{iVoted ? "★" : "☆"}</span>
              <span className="tnum">{row.voteCount}</span>
            </button>
          </form>
        ) : (
          <span className="tnum w-10 text-right text-sm text-muted" title="Votes so far">
            {row.voteCount > 0 ? `${row.voteCount} ★` : "—"}
          </span>
        )}


        {cycle.status !== "closed" && canMustHave ? (
          <form action={setMustHave}>
            <input type="hidden" name="requestId" value={row.requestId} />
            <button
              type="submit"
              className={isMyMustHave ? buttonStyles.primary : buttonStyles.ghost}
              title={
                isMyMustHave
                  ? "This is your guaranteed pick. Click to release it."
                  : `Claim this as your one guaranteed pick (up to ${formatCents(config.mustHaveCapCents)})`
              }
            >
              {isMyMustHave ? "My pick" : "Pick"}
            </button>
          </form>
        ) : null}

        {(cycle.status === "collecting" || isSupply) && cycle.status !== "closed" &&
        (row.requestedBy === user.id || user.isAdmin) ? (
          <form action={withdrawRequest}>
            <input type="hidden" name="requestId" value={row.requestId} />
            <button type="submit" className={buttonStyles.ghost} title="Take this off the list">
              ✕
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
