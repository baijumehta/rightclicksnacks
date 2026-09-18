import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { cycles, items, orderLines, requests, type Cycle } from "@/db/schema.ts";
import { getCurrentUser } from "@/lib/auth.ts";
import { formatCents } from "@/lib/money.ts";
import { Badge, BudgetBar, Card, CardHeader, EmptyState, StoreBadge } from "@/components/ui.tsx";
import { SetupNeeded } from "@/components/setup-needed.tsx";
import { ActualCell } from "./actual-cell.tsx";
import { CopyList } from "./copy-list.tsx";

export const dynamic = "force-dynamic";

/**
 * What to actually buy. Grouped by store because the trip is to one shop at a
 * time, and printable because that is how it gets carried round a warehouse.
 */
export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  try {
    const { cycle: cycleId } = await searchParams;
    return await ShoppingList(cycleId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("DATABASE_URL") || /does not exist/i.test(message)) {
      return <SetupNeeded error={error} />;
    }
    throw error;
  }
}

async function ShoppingList(cycleId?: string) {
  const cycle: Cycle | undefined = cycleId
    ? await db.query.cycles.findFirst({ where: eq(cycles.id, cycleId) })
    : (
        await db
          .select()
          .from(cycles)
          .where(eq(cycles.status, "closed"))
          .orderBy(desc(cycles.closesOn))
          .limit(1)
      )[0];

  if (!cycle) {
    return (
      <Card>
        <EmptyState title="No order has been placed yet">
          The list appears here once a cycle closes. <Link href="/" className="underline">
            See what is on the current list
          </Link>
          .
        </EmptyState>
      </Card>
    );
  }

  const lines = await db
    .select({ line: orderLines, item: items, request: requests })
    .from(orderLines)
    .innerJoin(requests, eq(requests.id, orderLines.requestId))
    .innerJoin(items, eq(items.id, requests.itemId))
    .where(eq(orderLines.cycleId, cycle.id))
    .orderBy(orderLines.rank);

  const funded = lines.filter((l) => l.line.isFunded);
  const waitlist = lines.filter((l) => !l.line.isFunded);

  const plannedCents = funded.reduce((sum, l) => sum + l.line.lineTotalCents, 0);
  const actualCents = funded.reduce(
    (sum, l) => sum + (l.line.actualCents ?? l.line.lineTotalCents),
    0,
  );
  const anyActuals = funded.some((l) => l.line.actualCents != null);

  const byStore = new Map<string, typeof funded>();
  for (const line of funded) {
    const list = byStore.get(line.item.store) ?? [];
    list.push(line);
    byStore.set(line.item.store, list);
  }

  const plainText = [...byStore.entries()]
    .map(([store, list]) => {
      const header = `${storeName(store)} — ${formatCents(
        list.reduce((s, l) => s + l.line.lineTotalCents, 0),
      )}`;
      const body = list
        .map(
          (l) =>
            `  ${l.line.quantity} × ${l.item.name}${
              l.item.packSize ? ` (${l.item.packSize})` : ""
            } — ${formatCents(l.line.lineTotalCents)}`,
        )
        .join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n")
    .concat(`\n\nTotal: ${formatCents(plannedCents)} of ${formatCents(cycle.budgetCents)}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{cycle.label} shopping list</h1>
          <p className="mt-1 text-sm text-muted">
            {funded.length} item{funded.length === 1 ? "" : "s"} ·{" "}
            <span className="tnum">{formatCents(plannedCents)}</span> of{" "}
            <span className="tnum">{formatCents(cycle.budgetCents)}</span>
            {cycle.status !== "closed" ? " · not final until the cycle closes" : ""}
          </p>
        </div>
        <CopyList text={plainText} />
      </div>

      {funded.length === 0 ? (
        <Card>
          <EmptyState title="Nothing was funded this cycle">
            Either nobody voted, or everything on the list was over budget.
          </EmptyState>
        </Card>
      ) : (
        [...byStore.entries()].map(([store, list]) => (
          <Card key={store}>
            <CardHeader
              title={storeName(store)}
              subtitle={`${list.length} item${list.length === 1 ? "" : "s"} · ${formatCents(
                list.reduce((s, l) => s + l.line.lineTotalCents, 0),
              )}`}
              action={<StoreBadge store={store} />}
            />
            <ul className="divide-y divide-line">
              {list.map(({ line, item }) => (
                <li
                  key={line.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
                >
                  <span className="tnum w-8 text-sm text-muted">{line.quantity}×</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {line.reason === "must_have" ? (
                        <Badge tone="accent" title="Somebody's guaranteed pick">
                          Guaranteed pick
                        </Badge>
                      ) : (
                        <Badge tone="good">
                          {line.voteCount} vote{line.voteCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {[item.brand, item.packSize, formatCents(line.unitPriceCents) + " each"]
                        .filter(Boolean)
                        .join(" · ")}
                      {item.sourceUrl ? (
                        <>
                          {" · "}
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="underline hover:text-ink"
                          >
                            link
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="tnum w-20 text-right font-medium">
                    {formatCents(line.lineTotalCents)}
                  </span>
                  <ActualCell lineId={line.id} actualCents={line.actualCents} />
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}

      <Card className="p-4 sm:p-5">
        <BudgetBar
          spentCents={anyActuals ? actualCents : plannedCents}
          budgetCents={cycle.budgetCents}
          label={anyActuals ? "Actually spent" : "Planned spend"}
        />
        {anyActuals && actualCents !== plannedCents ? (
          <p className="mt-3 text-sm text-muted">
            Estimated {formatCents(plannedCents)}, came to {formatCents(actualCents)} —{" "}
            {actualCents > plannedCents ? "over" : "under"} by{" "}
            {formatCents(Math.abs(actualCents - plannedCents))}.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Type what each line actually rang up as and the next cycle&apos;s budget uses the real
            numbers.
          </p>
        )}
      </Card>

      {waitlist.length > 0 ? (
        <Card className="no-print">
          <CardHeader
            title="Did not make it"
            subtitle="Nothing is lost — put these back on the next list."
          />
          <ul className="divide-y divide-line">
            {waitlist.map(({ line, item }) => (
              <li key={line.id} className="flex items-center gap-4 px-4 py-2.5 text-sm sm:px-5">
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="text-muted">
                  {line.voteCount} vote{line.voteCount === 1 ? "" : "s"}
                </span>
                <span className="tnum w-20 text-right text-muted">
                  {formatCents(line.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function storeName(store: string): string {
  if (store === "costco") return "Costco";
  if (store === "target") return "Target";
  return "Somewhere else";
}
