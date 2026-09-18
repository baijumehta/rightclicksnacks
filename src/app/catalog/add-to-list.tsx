"use client";

import { useActionState } from "react";
import { nominateAction, type ActionResult } from "../actions/snacks.ts";
import { Badge, buttonStyles } from "@/components/ui.tsx";

const EMPTY: ActionResult = { ok: true };

/**
 * Add a catalog item to the current cycle, and say what happened.
 *
 * This used to be a bare form whose result was thrown away, so a click that
 * failed -- because the list was frozen, or the item was already on it --
 * looked exactly like a click that did nothing at all.
 */
export function AddToList({
  itemId,
  alreadyOn,
  disabledReason,
}: {
  itemId: string;
  alreadyOn: boolean;
  disabledReason?: string;
}) {
  const [result, add, adding] = useActionState(nominateAction, EMPTY);

  // The page revalidates after a successful add, so `alreadyOn` flips on its
  // own; until it does, the action's own result carries the news.
  if (alreadyOn || (result.ok && result.message)) {
    return (
      <Badge tone="good">
        <span aria-hidden>✓</span> On this list
      </Badge>
    );
  }

  if (disabledReason) {
    return (
      <span className="text-xs text-muted" title={disabledReason}>
        {disabledReason}
      </span>
    );
  }

  return (
    <form action={add} className="flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <button type="submit" disabled={adding} className={buttonStyles.secondary}>
        {adding ? "Adding…" : "Add to list"}
      </button>
      {result.message && !result.ok ? (
        <span className="max-w-48 text-xs text-bad">{result.message}</span>
      ) : null}
    </form>
  );
}
