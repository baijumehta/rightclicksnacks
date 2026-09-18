import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { users } from "@/db/schema.ts";
import { getCurrentUser } from "@/lib/auth.ts";
import { getOrCreateCurrentCycle, recentCycles } from "@/lib/cycle-service.ts";
import { getSettings, OFFICE_TIMEZONE } from "@/lib/settings.ts";
import { today } from "@/lib/cycles.ts";
import { formatCents } from "@/lib/money.ts";
import { stalePrices } from "@/lib/suggest.ts";
import { Badge, Card, CardHeader, buttonStyles } from "@/components/ui.tsx";
import { SetupNeeded } from "@/components/setup-needed.tsx";
import { SettingsForm } from "./settings-form.tsx";
import { CycleControls } from "./cycle-controls.tsx";
import { PeopleForm } from "./people-form.tsx";
import { setActive, setAdmin } from "../actions/admin.ts";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  try {
    return await Admin(user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("DATABASE_URL") || /does not exist/i.test(message)) {
      return <SetupNeeded error={error} />;
    }
    throw error;
  }
}

async function Admin(myId: string) {
  const config = await getSettings();
  const cycle = await getOrCreateCurrentCycle();
  const [people, cycles, stale] = await Promise.all([
    db.select().from(users).orderBy(desc(users.isActive), users.name),
    recentCycles(6),
    stalePrices(config.priceStaleDays),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Today is {today(OFFICE_TIMEZONE)} in {OFFICE_TIMEZONE.replace("_", " ")}.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Cycle controls"
          subtitle="Cycles advance on their own each night. These are for when they should not wait."
        />
        <CycleControls cycle={cycle} cycles={cycles} />
      </Card>

      <Card>
        <CardHeader
          title="Settings"
          subtitle="Budget and voting rules. Changes apply to cycles created from here on."
        />
        <SettingsForm settings={config} />
      </Card>

      {stale.length > 0 ? (
        <Card>
          <CardHeader
            title="Prices worth checking"
            subtitle={`Not confirmed in ${config.priceStaleDays} days. Fix them on the catalog page.`}
          />
          <ul className="divide-y divide-line">
            {stale.slice(0, 12).map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-4 py-2.5 text-sm sm:px-5">
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="tnum text-muted">{formatCents(item.priceCents)}</span>
                <span className="text-xs text-muted">
                  {item.priceCheckedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="People"
          subtitle="Anyone on an allowed domain can sign in on their own. Add others here first."
        />
        <PeopleForm />
        <ul className="divide-y divide-line">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{person.name}</span>
                  {person.isAdmin ? <Badge tone="accent">Admin</Badge> : null}
                  {!person.isActive ? <Badge tone="bad">Switched off</Badge> : null}
                  {!person.entraOid ? <Badge tone="warn">Never signed in</Badge> : null}
                </div>
                <p className="mt-0.5 text-sm text-muted">{person.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <form action={setAdmin}>
                  <input type="hidden" name="userId" value={person.id} />
                  <input type="hidden" name="isAdmin" value={String(!person.isAdmin)} />
                  <button
                    type="submit"
                    disabled={person.id === myId && person.isAdmin}
                    className={buttonStyles.ghost}
                  >
                    {person.isAdmin ? "Remove admin" : "Make admin"}
                  </button>
                </form>
                {person.id !== myId ? (
                  <form action={setActive}>
                    <input type="hidden" name="userId" value={person.id} />
                    <input type="hidden" name="isActive" value={String(!person.isActive)} />
                    <button type="submit" className={buttonStyles.ghost}>
                      {person.isActive ? "Switch off" : "Switch on"}
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
