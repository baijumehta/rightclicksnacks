import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth.ts";
import {
  ballotFor, getOrCreateCurrentCycle, monthTotals, myBallotState, previewFor,
} from "@/lib/cycle-service.ts";
import { budgetMonth, cycleWindowFor, daysUntilClose, today } from "@/lib/cycles.ts";
import { getSettings, OFFICE_TIMEZONE } from "@/lib/settings.ts";
import { formatCents } from "@/lib/money.ts";
import { suggestionLabel, suggestionsFor } from "@/lib/suggest.ts";
import {
  Badge, BudgetBar, Card, CardHeader, buttonStyles,
} from "@/components/ui.tsx";
import { SetupNeeded } from "@/components/setup-needed.tsx";
import { Ballot } from "./ballot.tsx";
import { AddSnack } from "./add-snack.tsx";
import { nominateAction } from "./actions/snacks.ts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  try {
    return await Dashboard(user.id);
  } catch (error) {
    if (isSetupError(error)) return <SetupNeeded error={error} />;
    throw error;
  }
}

function isSetupError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("DATABASE_URL") ||
    /does not exist|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(message)
  );
}

async function Dashboard(userId: string) {
  const user = (await getCurrentUser())!;
  const config = await getSettings();
  const cycle = await getOrCreateCurrentCycle();
  const now = today(OFFICE_TIMEZONE);

  const [rows, preview, mine, month, suggestions] = await Promise.all([
    ballotFor(cycle.id),
    previewFor(cycle),
    myBallotState(cycle.id, userId),
    monthTotals(budgetMonth(cycle.closesOn)),
    suggestionsFor(cycle.id),
  ]);

  const window = cycleWindowFor(cycle.closesOn, config.votingOpensDaysBefore);
  const daysLeft = daysUntilClose(window, now);
  // Food and supplies are separate pots, so they are never added together.
  const listedCents = rows
    .filter((r) => r.kind !== "supply")
    .reduce((sum, r) => sum + r.unitPriceCents * r.quantity, 0);
  const supplyCount = rows.filter((r) => r.kind === "supply").length;

  return (
    <div className="space-y-6">
      <CycleHeader
        cycle={cycle}
        daysLeft={daysLeft}
        votingOpensOn={window.votingOpensOn}
        mine={mine}
        config={config}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={cycle.status === "voting" ? "The ballot" : "On the list"}
              subtitle={
                cycle.status === "voting"
                  ? `Everything above the line fits the ${formatCents(cycle.budgetCents)} budget as things stand. Your votes move it.`
                  : `${rows.length} item${rows.length === 1 ? "" : "s"} · ${formatCents(listedCents)} of food if we bought all of it`
              }
              action={
                cycle.status === "closed" ? (
                  <Link href="/order" className={buttonStyles.primary}>
                    Shopping list
                  </Link>
                ) : null
              }
            />
            <Ballot
              cycle={cycle}
              rows={rows}
              preview={preview}
              mine={mine}
              user={user}
              config={config}
            />
          </Card>

          {cycle.status !== "closed" ? (
            <Card>
              <CardHeader
                title="Add a snack"
                subtitle="Anything you want. Put in what it costs so the budget stays honest."
              />
              <AddSnack canAddToCycle={cycle.status === "collecting"} />
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card className="p-4 sm:p-5">
            <h2 className="text-base font-semibold tracking-tight">Money</h2>
            <div className="mt-4 space-y-5">
              {/*
               * Before voting opens nothing has been chosen yet, so the honest
               * number is what the whole list would cost -- showing the
               * selection total here would read as $0 until the first vote.
               */}
              <BudgetBar
                spentCents={cycle.status === "collecting" ? listedCents : preview.totalCents}
                budgetCents={cycle.budgetCents}
                label={cycle.status === "collecting" ? "Everything asked for" : "This order"}
              />
              <BudgetBar
                spentCents={month.plannedCents}
                budgetCents={month.budgetCents}
                label={`${monthName(cycle.closesOn)} food in total`}
              />
            </div>

            {preview.suppliesCents > 0 ? (
              <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-line pt-4 text-sm">
                <span className="text-muted">
                  Supplies
                  <span className="block text-xs">
                    {supplyCount} item{supplyCount === 1 ? "" : "s"}, not from the food budget
                  </span>
                </span>
                <span className="tnum font-medium">{formatCents(preview.suppliesCents)}</span>
              </div>
            ) : null}
            {cycle.status === "collecting" && listedCents > cycle.budgetCents ? (
              <p className="mt-4 text-xs text-muted">
                More than the budget, which is fine — the vote decides what
                {" "}{formatCents(cycle.budgetCents)} buys.
              </p>
            ) : preview.mustHaveCents > 0 && cycle.status !== "collecting" ? (
              <p className="mt-4 text-xs text-muted">
                {formatCents(preview.mustHaveCents)} of that is guaranteed picks;{" "}
                {formatCents(preview.votedCents)} is what the vote chose.
              </p>
            ) : null}
          </Card>

          {suggestions.length > 0 && cycle.status === "collecting" ? (
            <Card>
              <CardHeader
                title="Worth considering"
                subtitle="From what this office has actually voted for before."
              />
              <ul className="divide-y divide-line">
                {suggestions.map((s) => (
                  <li key={s.item.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{s.item.name}</p>
                        <p className="mt-0.5 text-xs text-muted">{s.reason}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge tone="accent">{suggestionLabel(s.kind)}</Badge>
                          <span className="tnum text-xs text-muted">
                            {formatCents(s.item.priceCents)}
                          </span>
                        </p>
                      </div>
                      <form action={addSuggestion} className="shrink-0">
                        <input type="hidden" name="itemId" value={s.item.id} />
                        <button type="submit" className={buttonStyles.secondary}>
                          Add
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/** Thin wrapper so a suggestion card can post straight to the nominate action. */
async function addSuggestion(formData: FormData): Promise<void> {
  "use server";
  await nominateAction({ ok: true }, formData);
}

function monthName(closesOn: string): string {
  const [year, month] = closesOn.split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
}

function CycleHeader({
  cycle,
  daysLeft,
  votingOpensOn,
  mine,
  config,
}: {
  cycle: { label: string; status: string; budgetCents: number };
  daysLeft: number;
  votingOpensOn: string;
  mine: { votesLeft: number; votesUsed: number; mustHaveRequestId: string | null };
  config: { votesPerPerson: number; mustHaveCapCents: number };
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{cycle.label} order</h1>
            {cycle.status === "collecting" ? (
              <Badge tone="good">Taking requests</Badge>
            ) : cycle.status === "voting" ? (
              <Badge tone="accent">Voting open</Badge>
            ) : (
              <Badge>Ordered</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {cycle.status === "collecting" ? (
              <>
                Add what you want. Voting opens {friendly(votingOpensOn)} and the order goes in{" "}
                {daysLeft === 0 ? "today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} from now`}
                .
              </>
            ) : cycle.status === "voting" ? (
              <>
                Voting closes{" "}
                {daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}, when
                the order goes in.
              </>
            ) : (
              <>This one is done. The shopping list is final.</>
            )}
          </p>
        </div>

        {cycle.status !== "closed" ? (
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-muted">Your votes</p>
              <p className="tnum mt-0.5 text-lg font-semibold">
                {mine.votesLeft}
                <span className="text-sm font-normal text-muted"> of {config.votesPerPerson}</span>
              </p>
            </div>
            <div>
              <p className="text-muted">Your pick</p>
              <p className="mt-0.5 text-lg font-semibold">
                {mine.mustHaveRequestId ? (
                  <span className="text-good">Claimed</span>
                ) : (
                  <span className="text-muted">Unused</span>
                )}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* The brand's tertiary amber is for highlighting, and this nudge is
          the one thing on the page we actually want people to notice. */}
      {cycle.status !== "closed" && !mine.mustHaveRequestId ? (
        <p className="mt-4 rounded-lg border-l-4 border-highlight bg-warn-soft px-3 py-2 text-sm text-warn">
          You have not used your guaranteed pick. Choose one thing under{" "}
          {formatCents(config.mustHaveCapCents)} and it gets bought whether or not anyone else
          votes for it.
        </p>
      ) : null}
    </Card>
  );
}

function friendly(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
