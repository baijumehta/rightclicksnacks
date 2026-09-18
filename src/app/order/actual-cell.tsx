"use client";

import { useState } from "react";
import { recordActual } from "../actions/admin.ts";
import { formatCents } from "@/lib/money.ts";
import { inputStyles } from "@/components/ui.tsx";

/** What the line actually rang up as. Blank until somebody reconciles it. */
export function ActualCell({
  lineId,
  actualCents,
}: {
  lineId: string;
  actualCents: number | null;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="no-print tnum w-24 rounded-lg px-2 py-1 text-right text-sm hover:bg-surface-2"
        title="What it actually cost"
      >
        {actualCents == null ? (
          <span className="text-muted">add actual</span>
        ) : (
          <span className="font-medium text-good">{formatCents(actualCents)}</span>
        )}
      </button>
    );
  }

  return (
    <form action={recordActual} className="no-print flex w-24 items-center">
      <input type="hidden" name="lineId" value={lineId} />
      <input
        name="actual"
        autoFocus
        inputMode="decimal"
        placeholder="0.00"
        defaultValue={actualCents == null ? "" : (actualCents / 100).toFixed(2)}
        className={`${inputStyles} text-right`}
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
      />
    </form>
  );
}
