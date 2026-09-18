import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { items, orderLines, requests } from "@/db/schema.ts";
import { getCurrentUser } from "@/lib/auth.ts";
import { getOrCreateCurrentCycle } from "@/lib/cycle-service.ts";
import { getSettings } from "@/lib/settings.ts";
import { perUnitLabel } from "@/lib/money.ts";
import { isStale } from "@/lib/suggest.ts";
import { Badge, Card, CardHeader, EmptyState, StoreBadge, buttonStyles } from "@/components/ui.tsx";
import { SetupNeeded } from "@/components/setup-needed.tsx";
import { PriceCell } from "./price-cell.tsx";
import { AddToList } from "./add-to-list.tsx";
import { archiveItem } from "../actions/snacks.ts";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  try {
    return await Catalog();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("DATABASE_URL") || /does not exist/i.test(message)) {
      return <SetupNeeded error={error} />;
    }
    throw error;
  }
}

async function Catalog() {
  const config = await getSettings();
  const cycle = await getOrCreateCurrentCycle();

  const rows = await db
    .select({
      item: items,
      timesOrdered: sql<number>`(
        select count(*) from ${orderLines}
        where ${orderLines.isFunded} = true and ${orderLines.requestId} in (
          select ${requests.id} from ${requests} where ${requests.itemId} = ${items.id}
        )
      )`,
      onThisBallot: sql<number>`(
        select count(*) from ${requests}
        where ${requests.itemId} = ${items.id} and ${requests.cycleId} = ${cycle.id}
      )`,
    })
    .from(items)
    .where(eq(items.isActive, true))
    .orderBy(items.category, items.name);

  const stale = rows.filter((r) => isStale(r.item.priceCheckedAt, config.priceStaleDays));
  const byCategory = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byCategory.get(row.item.category) ?? [];
    list.push(row);
    byCategory.set(row.item.category, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Catalog</h1>
        <p className="mt-1 text-sm text-muted">
          Everything we know about, with what it costs. Prices are kept by hand — correct one and
          it updates the current list too.
        </p>
      </div>

      {stale.length > 0 ? (
        <Card className="border-warn/30 bg-warn-soft p-4">
          <p className="text-sm text-warn">
            <span className="font-medium">
              {stale.length} price{stale.length === 1 ? "" : "s"} not checked in{" "}
              {config.priceStaleDays} days.
            </span>{" "}
            Confirm or correct them so the budget means something.
          </p>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <EmptyState title="The catalog is empty">
            Add snacks from the current cycle page, or run <code>npm run db:seed</code> for a
            starter set of common Costco and Target items.
          </EmptyState>
        </Card>
      ) : (
        [...byCategory.entries()].map(([category, list]) => (
          <Card key={category}>
            <CardHeader
              title={category}
              subtitle={`${list.length} item${list.length === 1 ? "" : "s"}`}
            />
            <ul className="divide-y divide-line">
              {list.map(({ item, timesOrdered, onThisBallot }) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <StoreBadge store={item.store} />
                      {Number(timesOrdered) > 0 ? (
                        <Badge tone="good">
                          Ordered {Number(timesOrdered)}×
                        </Badge>
                      ) : null}
                      {isStale(item.priceCheckedAt, config.priceStaleDays) ? (
                        <Badge tone="warn">Price may be old</Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {[
                        item.brand,
                        item.packSize,
                        perUnitLabel(item.priceCents, item.unitCount),
                        `checked ${item.priceCheckedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`,
                      ]
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
                            product page
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <PriceCell itemId={item.id} priceCents={item.priceCents} />

                  <div className="no-print flex items-center gap-2">
                    <AddToList
                      itemId={item.id}
                      alreadyOn={Number(onThisBallot) > 0}
                      disabledReason={
                        cycle.status === "closed"
                          ? "Cycle ordered"
                          : cycle.status === "voting" && item.kind !== "supply"
                            ? "List frozen for voting"
                            : undefined
                      }
                    />
                    <form action={archiveItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className={buttonStyles.ghost}
                        title="Retire this from the catalog"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}
