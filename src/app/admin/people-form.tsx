"use client";

import { useActionState } from "react";
import { inviteUser } from "../actions/admin.ts";
import type { ActionResult } from "../actions/snacks.ts";
import { Notice, buttonStyles, inputStyles } from "@/components/ui.tsx";

const EMPTY: ActionResult = { ok: true };

/** Pre-create someone so they can sign in even from outside the allowed domains. */
export function PeopleForm() {
  const [result, invite, inviting] = useActionState(inviteUser, EMPTY);

  return (
    <div className="space-y-3 border-b border-line px-4 py-4 sm:px-5">
      <form action={invite} className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input name="name" required placeholder="Sam Rivera" className={inputStyles} />
        </div>
        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-sm font-medium">Work email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="sam@rclick.com"
            className={inputStyles}
          />
        </div>
        <button type="submit" disabled={inviting} className={buttonStyles.secondary}>
          {inviting ? "Adding…" : "Add"}
        </button>
      </form>
      {result.message ? (
        <Notice tone={result.ok ? "good" : "bad"}>{result.message}</Notice>
      ) : null}
    </div>
  );
}
