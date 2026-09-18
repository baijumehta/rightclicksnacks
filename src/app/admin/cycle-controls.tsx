"use client";

import { useActionState } from "react";
import type { Cycle } from "@/db/schema.ts";
import { closeNow, reopen, rollNow } from "../actions/admin.ts";
import type { ActionResult } from "../actions/snacks.ts";
import { formatCents } from "@/lib/money.ts";
import { Badge, Notice, buttonStyles } from "@/components/ui.tsx";

const EMPTY: ActionResult = { ok: true };

export function CycleControls({ cycle, cycles }: { cycle: Cycle; cycles: Cycle[] }) {
  const [closed, close, closing] = useActionState(closeNow, EMPTY);
  const [reopened, doReopen, reopening] = useActionState(reopen, EMPTY);
  const [rolled, roll, rolling] = useActionState(rollNow, EMPTY);

  const latest = [closed, reopened, rolled].find((r) => r.message);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      {latest?.message ? (
        <Notice tone={latest.ok ? "good" : "bad"}>{latest.message}</Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {cycle.label} · {formatCents(cycle.budgetCents)}
          </p>
          <p className="text-sm text-muted">
            Voting opens {cycle.votingOpensOn}, order goes in {cycle.closesOn}.
          </p>
        </div>
        {cycle.status !== "closed" ? (
          <form action={close}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <button type="submit" disabled={closing} className={buttonStyles.primary}>
              {closing ? "Closing…" : "Close and build the list"}
            </button>
          </form>
        ) : null}
      </div>

      <form action={roll}>
        <button type="submit" disabled={rolling} className={buttonStyles.secondary}>
          {rolling ? "Working…" : "Run the nightly advance now"}
        </button>
      </form>

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-sm font-medium">Recent cycles</p>
        <ul className="space-y-2">
          {cycles.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="min-w-0 flex-1">{c.label}</span>
              {c.status === "closed" ? (
                <Badge>Ordered</Badge>
              ) : c.status === "voting" ? (
                <Badge tone="accent">Voting</Badge>
              ) : (
                <Badge tone="good">Open</Badge>
              )}
              {c.status === "closed" ? (
                <form action={doReopen}>
                  <input type="hidden" name="cycleId" value={c.id} />
                  <button type="submit" disabled={reopening} className={buttonStyles.ghost}>
                    Reopen
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
