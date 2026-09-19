"use client";

import { useActionState } from "react";
import type { Settings } from "@/db/schema.ts";
import { saveSettings } from "../actions/admin.ts";
import type { ActionResult } from "../actions/snacks.ts";
import { Field, Notice, buttonStyles, inputStyles } from "@/components/ui.tsx";

const EMPTY: ActionResult = { ok: true };

export function SettingsForm({ settings }: { settings: Settings }) {
  const [result, save, saving] = useActionState(saveSettings, EMPTY);

  return (
    <form action={save} className="space-y-4 px-4 py-4 sm:px-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monthly budget" hint="Split across the two orders each month. Applies to the next cycle.">
          <input
            name="monthlyBudget"
            inputMode="decimal"
            defaultValue={(settings.monthlyBudgetCents / 100).toFixed(2)}
            className={inputStyles}
          />
        </Field>
        <Field
          label="Guaranteed pick cap"
          hint="The most one person's guaranteed pick may cost. Takes effect right away."
        >
          <input
            name="mustHaveCap"
            inputMode="decimal"
            defaultValue={(settings.mustHaveCapCents / 100).toFixed(2)}
            className={inputStyles}
          />
        </Field>
        <Field
          label="All guaranteed picks together (% of the order)"
          hint="Stops the picks swallowing the order. At 40% of a $300 cycle that is $120, so roughly eight picks. Anything past it competes on votes instead. Takes effect right away."
        >
          <input
            name="mustHavePoolPercent"
            inputMode="numeric"
            defaultValue={settings.mustHavePoolPercent}
            className={inputStyles}
          />
        </Field>
        <Field label="Votes per person" hint="Per cycle, one vote maximum per item. Takes effect right away, including on a vote already open.">
          <input
            name="votesPerPerson"
            inputMode="numeric"
            defaultValue={settings.votesPerPerson}
            className={inputStyles}
          />
        </Field>
        <Field label="Voting opens (days before)" hint="Three gives people a working day or two. Applies to the next cycle.">
          <input
            name="votingOpensDaysBefore"
            inputMode="numeric"
            defaultValue={settings.votingOpensDaysBefore}
            className={inputStyles}
          />
        </Field>
        <Field label="Flag prices older than (days)" hint="How long before a price looks stale. Takes effect right away.">
          <input
            name="priceStaleDays"
            inputMode="numeric"
            defaultValue={settings.priceStaleDays}
            className={inputStyles}
          />
        </Field>
      </div>

      {result.message ? (
        <Notice tone={result.ok ? "good" : "bad"}>{result.message}</Notice>
      ) : null}

      <button type="submit" disabled={saving} className={buttonStyles.primary}>
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
