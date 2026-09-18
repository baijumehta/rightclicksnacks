"use client";

import { useActionState, useState } from "react";
import { addItem, lookupLink, type ActionResult, type LookupResult } from "./actions/snacks.ts";
import { SNACK_CATEGORIES, SUPPLY_CATEGORIES } from "@/lib/categories.ts";
import { Field, Notice, buttonStyles, inputStyles } from "@/components/ui.tsx";

const EMPTY: ActionResult = { ok: true };
const NO_LOOKUP: LookupResult = { ok: false };

type Draft = NonNullable<LookupResult["draft"]>;

const BLANK: Draft = {
  name: "",
  brand: "",
  priceText: "",
  imageUrl: "",
  store: "costco",
  sourceUrl: "",
};

/**
 * Add a snack. The link box is a convenience: it fills the form in when the
 * retailer lets us read the page, and otherwise says so and gets out of the
 * way. Everything stays editable either way, so a blocked lookup costs a few
 * seconds rather than blocking the request.
 *
 * The fields are uncontrolled and the form is remounted by `key` whenever a
 * lookup or a save completes. That is what resets it -- no effect syncing
 * server results into local state, and no half-updated form if one arrives
 * while somebody is typing.
 */
export function AddSnack({ canAddToCycle }: { canAddToCycle: boolean }) {
  const [saved, save, saving] = useActionState(addItem, EMPTY);
  const [looked, look, looking] = useActionState(lookupLink, NO_LOOKUP);
  const [open, setOpen] = useState(false);

  const draft = looked.draft ?? BLANK;
  const showForm = open || Boolean(looked.draft);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <form action={look} className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <Field
            label="Paste a Costco or Target link"
            hint="Optional. Fills in what it can — Costco often refuses, so check the price."
          >
            <input
              name="url"
              type="url"
              placeholder="https://www.target.com/p/..."
              className={inputStyles}
            />
          </Field>
        </div>
        <button type="submit" disabled={looking} className={buttonStyles.secondary}>
          {looking ? "Looking…" : "Fetch"}
        </button>
      </form>

      {looked.message ? (
        <Notice tone={looked.ok ? "good" : "warn"}>{looked.message}</Notice>
      ) : null}

      {!showForm ? (
        <button type="button" onClick={() => setOpen(true)} className={buttonStyles.secondary}>
          Add a snack by hand
        </button>
      ) : (
        <SnackForm
          key={`${looked.token ?? "none"}:${saved.token ?? "none"}`}
          draft={draft}
          save={save}
          saving={saving}
          saved={saved}
          canAddToCycle={canAddToCycle}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function SnackForm({
  draft,
  save,
  saving,
  saved,
  canAddToCycle,
  onCancel,
}: {
  draft: Draft;
  save: (formData: FormData) => void;
  saving: boolean;
  saved: ActionResult;
  canAddToCycle: boolean;
  onCancel: () => void;
}) {
  return (
    <form action={save} className="space-y-4">
      <input type="hidden" name="sourceUrl" value={draft.sourceUrl} />
      <input type="hidden" name="imageUrl" value={draft.imageUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What is it">
          <input
            name="name"
            required
            defaultValue={draft.name}
            placeholder="Kirkland Mixed Nuts"
            className={inputStyles}
          />
        </Field>
        <Field label="Brand">
          <input
            name="brand"
            defaultValue={draft.brand}
            placeholder="Kirkland"
            className={inputStyles}
          />
        </Field>
        <Field label="Price" hint="What one of them costs.">
          <input
            name="price"
            required
            inputMode="decimal"
            defaultValue={draft.priceText}
            placeholder="$18.99"
            className={inputStyles}
          />
        </Field>
        <Field label="Store">
          <select name="store" defaultValue={draft.store} className={inputStyles}>
            <option value="costco">Costco</option>
            <option value="target">Target</option>
            <option value="other">Somewhere else</option>
          </select>
        </Field>
        <Field
          label="Category"
          hint="Pick a supply category for paper goods and the like: those are always bought and do not come out of the food budget."
        >
          <select name="category" defaultValue="other" className={inputStyles}>
            <optgroup label="Food">
              {SNACK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </optgroup>
            <optgroup label="Supplies (separate budget)">
              {SUPPLY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Pack size" hint="Optional: 40 ct, 2 × 32 oz.">
          <input name="packSize" placeholder="40 ct" className={inputStyles} />
        </Field>
        <Field label="Servings per pack" hint="Optional. Shows the price per snack.">
          <input name="unitCount" inputMode="numeric" placeholder="40" className={inputStyles} />
        </Field>
        <Field label="Note" hint="Optional: gluten free, for the Friday thing.">
          <input name="notes" className={inputStyles} />
        </Field>
      </div>

      {canAddToCycle ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="addToCycle" defaultChecked className="size-4" />
          Put it on this cycle&apos;s list too
        </label>
      ) : (
        <Notice tone="warn">
          Voting is open, so this cycle&apos;s list is frozen. New snacks go to the catalog and
          are ready for next time.
        </Notice>
      )}

      {saved.message ? <Notice tone={saved.ok ? "good" : "bad"}>{saved.message}</Notice> : null}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={buttonStyles.primary}>
          {saving ? "Saving…" : "Add snack"}
        </button>
        <button type="button" onClick={onCancel} className={buttonStyles.ghost}>
          Cancel
        </button>
      </div>
    </form>
  );
}
