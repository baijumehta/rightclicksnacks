import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth.ts";
import { cycleTotals, recentCycles } from "@/lib/cycle-service.ts";
import { budgetMonth } from "@/lib/cycles.ts";
import { formatCents } from "@/lib/money.ts";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui.tsx";
import { SetupNeeded } from "@/components/setup-needed.tsx";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  try {
    return await History();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("DATABASE_URL") || /does not exist/i.test(message)) {
      return <SetupNeeded error={error} />;
    }
    throw error;
  }
}

async function History() {
  const cycles = await recentCycles(24);
  const totals = await Promise.all(cycles.map((c) => cycleTotals(c.id)));

  const months = new Map<string, { planned: number; actual: number; cycles: number }>();
  cycles.forEach((cycle, index) => {
    const key = budgetMonth(cycle.closesOn);
    const entry = months.get(key) ?? { planned: 0, actual: 0, cycles: 0 };
    entry.planned += totals[index].plannedCents;
    entry.actual += totals[index].actualCents ?? totals[index].plannedCents;
    entry.cycles += 1;
    months.set(key, entry);
  });

  if (cycles.length === 0) {
    return (
      <Card>
        <EmptyState title="No cycles yet">
          The first one starts as soon as somebody adds a snack.
        </EmptyState>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted">
          Every order, what it was meant to cost, and what it came to.
        </p>
      </div>

      <Card>
        <CardHeader title="By month" subtitle="Two orders per month, drawn from one budget." />
        <ul className="divide-y divide-line">
          {[...months.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([month, entry]) => (
              <li key={month} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                <span className="min-w-0 flex-1 font-medium">{monthLabel(month)}</span>
                <span className="text-sm text-muted">
                  {entry.cycles} order{entry.cycles === 1 ? "" : "s"}
                </span>
                <span className="tnum w-24 text-right font-medium">
                  {formatCents(entry.actual)}
                </span>
              </li>
            ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Every cycle" />
        <ul className="divide-y divide-line">
          {cycles.map((cycle, index) => {
            const total = totals[index];
            const spent = total.actualCents ?? total.plannedCents;
            const over = spent > cycle.budgetCents;
            return (
              <li
                key={cycle.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/order?cycle=${cycle.id}`} className="font-medium hover:underline">
                      {cycle.label}
                    </Link>
                    {cycle.status === "closed" ? (
                      <Badge>Ordered</Badge>
                    ) : cycle.status === "voting" ? (
                      <Badge tone="accent">Voting</Badge>
                    ) : (
                      <Badge tone="good">Open</Badge>
                    )}
                    {total.actualCents != null ? <Badge tone="good">Reconciled</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {cycle.startsOn} to {cycle.closesOn} · {total.lineCount} item
                    {total.lineCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`tnum font-medium ${over ? "text-bad" : ""}`}>
                    {formatCents(spent)}
                  </p>
                  <p className="tnum text-xs text-muted">
                    of {formatCents(cycle.budgetCents)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
