"use client";

import { useActionState, useState } from "react";
import { confirmPrice, updatePrice, type ActionResult } from "../actions/snacks.ts";
import { formatCents } from "@/lib/money.ts";
import { buttonStyles, inputStyles } from "@/components/ui.tsx";

const EMPTY: ActionResult = { ok: true };

/**
 * A price that turns into an input when you click it. Correcting prices is the
 * chore that keeps the budget meaningful, so it is one click rather than a
 * trip to an edit page.
 */
export function PriceCell({
  itemId,
  priceCents,
  itemName,
}: {
  itemId: string;
  priceCents: number;
  itemName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [result, save, saving] = useActionState(updatePrice, EMPTY);

  if (!editing) {
    return (
      <div className="no-print flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="tnum rounded-lg px-2 py-1 text-sm font-medium hover:bg-surface-2"
          aria-label={`Correct the price of ${itemName}, currently ${formatCents(priceCents)}`}
        >
          {formatCents(priceCents)}
        </button>
        <form action={confirmPrice}>
          <input type="hidden" name="itemId" value={itemId} />
          <button
            type="submit"
            className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-good"
            aria-label={`Confirm ${itemName} is still ${formatCents(priceCents)}`}
          >
            <span aria-hidden>✓</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={save}
      className="no-print flex items-center gap-1"
      onSubmit={() => setEditing(false)}
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input
        name="price"
        autoFocus
        inputMode="decimal"
        aria-label={`Price for ${itemName}`}
        aria-invalid={result.message && !result.ok ? true : undefined}
        aria-describedby={result.message && !result.ok ? `price-error-${itemId}` : undefined}
        defaultValue={(priceCents / 100).toFixed(2)}
        className={`${inputStyles} w-24`}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button type="submit" disabled={saving} className={buttonStyles.primary}>
        {saving ? "…" : "Save"}
      </button>
      {result.message && !result.ok ? (
        <span id={`price-error-${itemId}`} role="alert" className="text-xs text-bad">
          {result.message}
        </span>
      ) : null}
    </form>
  );
}
