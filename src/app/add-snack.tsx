"use client";

import { useActionState, useRef, useState } from "react";
import {
  addItem, importPhoto, lookupLink,
  type ActionResult, type ImportDraft, type LookupResult,
} from "./actions/snacks.ts";
import { SNACK_CATEGORIES, SUPPLY_CATEGORIES } from "@/lib/categories.ts";
import { Field, Notice, buttonStyles, inputStyles } from "@/components/ui.tsx";

const EMPTY: ActionResult = { ok: true };
const NO_IMPORT: LookupResult = { ok: false };

const BLANK: ImportDraft = {
  name: "",
  brand: "",
  priceText: "",
  imageUrl: "",
  store: "costco",
  sourceUrl: "",
  packSize: "",
  unitCount: "",
  category: "",
  needsPrice: true,
};

/**
 * Add an item, three ways: photograph it, paste a link, or type it.
 *
 * The first two are conveniences that fill the form in; neither saves
 * anything on its own, and every field they touch stays editable. That
 * matters because both can be wrong -- a retailer blocks the fetch, or a
 * shelf tag in a photo belongs to the item next to it.
 *
 * The fields are uncontrolled and the form is remounted by `key` whenever an
 * import or a save completes. That is what resets it: no effect syncing
 * server results into state, and no half-updated form if one lands while
 * somebody is typing.
 */
export function AddSnack({
  canAddToCycle,
  photoEnabled,
}: {
  canAddToCycle: boolean;
  photoEnabled: boolean;
}) {
  const [saved, save, saving] = useActionState(addItem, EMPTY);
  const [looked, look, looking] = useActionState(lookupLink, NO_IMPORT);
  const [shot, readPhoto, reading] = useActionState(importPhoto, NO_IMPORT);
  const [open, setOpen] = useState(false);
  const photoForm = useRef<HTMLFormElement>(null);

  // Whichever importer ran most recently owns the draft.
  const latest = (shot.token ?? "") > (looked.token ?? "") ? shot : looked;
  const draft = latest.draft ?? BLANK;
  const showForm = open || Boolean(latest.draft);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      {photoEnabled ? (
        <form ref={photoForm} action={readPhoto}>
          <Field
            label="Photograph it"
            hint="A shelf tag, the packet, or a screenshot of the product page. Claude reads off the name and price so you do not have to type them."
          >
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp,image/gif"
              capture="environment"
              disabled={reading}
              onChange={(e) => {
                if (e.target.files?.length) photoForm.current?.requestSubmit();
              }}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-[1.5px] file:border-line file:bg-surface file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-canvas"
            />
          </Field>
          {reading ? (
            <p className="mt-2 text-sm text-muted">Reading the photo…</p>
          ) : null}
        </form>
      ) : null}

      <form action={look} className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <Field
            label="Or paste a Costco or Target link"
            hint="Fills in what it can — Costco often refuses, so check the price."
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

      {latest.message ? (
        <Notice tone={latest.ok ? "good" : "warn"}>{latest.message}</Notice>
      ) : null}

      {!showForm ? (
        <button type="button" onClick={() => setOpen(true)} className={buttonStyles.secondary}>
          Or add it by hand
        </button>
      ) : (
        <ItemForm
          key={`${latest.token ?? "none"}:${saved.token ?? "none"}`}
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

function ItemForm({
  draft,
  save,
  saving,
  saved,
  canAddToCycle,
  onCancel,
}: {
  draft: ImportDraft;
  save: (formData: FormData) => void;
  saving: boolean;
  saved: ActionResult;
  canAddToCycle: boolean;
  onCancel: () => void;
}) {
  return (
    <form action={save} className="space-y-4 border-t border-line pt-4">
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
        <Field
          label="Price"
          hint={draft.needsPrice ? "Nothing legible was found — put one in." : "What one of them costs."}
        >
          <input
            name="price"
            required
            autoFocus={draft.needsPrice && Boolean(draft.name)}
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
          <select
            name="category"
            defaultValue={draft.category || "other"}
            className={inputStyles}
          >
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
          <input
            name="packSize"
            defaultValue={draft.packSize}
            placeholder="40 ct"
            className={inputStyles}
          />
        </Field>
        <Field label="Servings per pack" hint="Optional. Shows the price per snack.">
          <input
            name="unitCount"
            inputMode="numeric"
            defaultValue={draft.unitCount}
            placeholder="40"
            className={inputStyles}
          />
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
          are ready for next time. Supplies can still be added.
        </Notice>
      )}

      {saved.message ? <Notice tone={saved.ok ? "good" : "bad"}>{saved.message}</Notice> : null}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={buttonStyles.primary}>
          {saving ? "Saving…" : "Add it"}
        </button>
        <button type="button" onClick={onCancel} className={buttonStyles.ghost}>
          Cancel
        </button>
      </div>
    </form>
  );
}
