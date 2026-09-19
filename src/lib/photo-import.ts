import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { claudeClient, claudeConfigured } from "./anthropic-client.ts";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ALL_CATEGORIES, kindForCategory } from "./categories.ts";

/**
 * Read a snack off a photo.
 *
 * Point a phone at the shelf, or paste a screenshot of a product page, and
 * Claude reads back what it is and what it costs. This exists because typing
 * a name, a brand, a pack size and a price into four boxes is the reason the
 * whiteboard stayed a whiteboard.
 *
 * What comes back is a DRAFT. The model is reading a photo that may be blurry,
 * angled, or showing a shelf tag for a different size -- so every field lands
 * in the form for a human to correct, and the price in particular is flagged
 * when it was not clearly legible.
 */

/** Anthropic's per-image ceiling; we refuse earlier with a clear message. */
const MAX_BYTES = 5 * 1024 * 1024;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AcceptedType = (typeof ACCEPTED)[number];

const DraftSchema = z.object({
  isProduct: z
    .boolean()
    .describe("False if the image does not show a food, drink or supply item."),
  name: z.string().describe("The product name as written, without the brand."),
  brand: z.string().describe("Brand name, or an empty string if not visible."),
  priceText: z
    .string()
    .describe("Price as digits only, e.g. 18.99. Empty string if not visible."),
  priceIsLegible: z
    .boolean()
    .describe("True only if a price was actually readable in the image."),
  packSize: z
    .string()
    .describe("Pack size as written, e.g. '40 ct' or '2 x 32 oz'. May be empty."),
  unitCount: z
    .number()
    .describe("Individual servings per pack, or 0 when it cannot be told."),
  category: z.enum(ALL_CATEGORIES).describe("Best-fitting category."),
  store: z
    .enum(["costco", "target", "other"])
    .describe("Retailer, if identifiable from the image. Otherwise 'other'."),
  note: z
    .string()
    .describe("One short sentence on anything uncertain, or an empty string."),
});

export interface PhotoDraft {
  name: string;
  brand: string;
  priceText: string;
  packSize: string;
  unitCount: string;
  category: string;
  store: string;
  /** Shown above the form so people know what to double-check. */
  note?: string;
  /** True when the model could not read a price and one must be typed. */
  needsPrice: boolean;
}

export type PhotoResult =
  | { ok: true; draft: PhotoDraft }
  | { ok: false; message: string };

/** True when a credential of either kind is available. */
export const photoImportConfigured = claudeConfigured;

const SYSTEM = `You read a photo or screenshot of a single grocery item and return what it is.

The photo may be a shelf, a product page, a receipt line, or an item held up to a camera.

Rules:
- Report only what you can actually see. Never guess a price. If no price is legible, leave priceText empty and set priceIsLegible false.
- priceText is digits only, no currency symbol: 18.99, not $18.99.
- When a shelf tag shows both a unit price and a total, take the total for the pack.
- Paper towels, napkins, cups, plates, cutlery and cleaning products are supplies, not food; pick the matching supply category.
- If the image shows several different products, describe the most prominent one and say so in note.
- If it is not a grocery item at all, set isProduct false and leave the rest empty.`;

export async function readSnackFromPhoto(file: File): Promise<PhotoResult> {
  const client = claudeClient();
  if (!client) {
    return {
      ok: false,
      message:
        "Photo import is not switched on: no Anthropic credential is configured.",
    };
  }
  if (file.size === 0) return { ok: false, message: "That file was empty." };
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Keep it under 5MB.`,
    };
  }
  if (!ACCEPTED.includes(file.type as AcceptedType)) {
    return {
      ok: false,
      message: "Use a JPEG, PNG, WebP or GIF.",
    };
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  let parsed: z.infer<typeof DraftSchema> | null;
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2_000,
      // A photo of a price tag is not a reasoning problem, and people are
      // waiting on an upload, so keep the thinking short.
      output_config: { effort: "low", format: zodOutputFormat(DraftSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: file.type as AcceptedType, data },
            },
            { type: "text", text: "What is this, and what does it cost?" },
          ],
        },
      ],
    });
    parsed = response.parsed_output;
  } catch (error) {
    return { ok: false, message: describe(error) };
  }

  if (!parsed) {
    return { ok: false, message: "Could not make sense of that image. Try another photo." };
  }
  if (!parsed.isProduct) {
    return {
      ok: false,
      message: "That does not look like a snack or a supply. Try a photo of the item or its label.",
    };
  }

  const needsPrice = !parsed.priceIsLegible || !parsed.priceText.trim();
  const modelNote = parsed.note.trim();
  /*
   * The model usually says "no price shown" itself when there is not one, so
   * only add our own nudge when it has not already made the point -- two
   * sentences saying the same thing reads like a bug.
   */
  const saysNoPrice = /\bprice\b/i.test(modelNote);
  const notes = [
    modelNote,
    needsPrice && !saysNoPrice ? "No price was readable, so put one in before saving." : "",
  ].filter(Boolean);

  return {
    ok: true,
    draft: {
      name: parsed.name.trim(),
      brand: parsed.brand.trim(),
      priceText: needsPrice ? "" : parsed.priceText.replace(/[^\d.]/g, ""),
      packSize: parsed.packSize.trim(),
      unitCount: parsed.unitCount > 0 ? String(parsed.unitCount) : "",
      category: parsed.category,
      store: parsed.store,
      note: notes.join(" ") || undefined,
      needsPrice,
    },
  };
}

/** Which pot a photographed item lands in, from the category the model chose. */
export const kindForDraft = (draft: PhotoDraft) => kindForCategory(draft.category);

function describe(error: unknown): string {
  if (error instanceof Anthropic.RateLimitError) {
    return "Too many photos at once. Wait a moment and try again.";
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return "The Anthropic credential was rejected, so photo import is off.";
  }
  if (error instanceof Anthropic.APIError) {
    /*
     * An unfunded account answers 400, not 402, with the reason only in the
     * message body -- so it reads as a bad request unless you look. Worth
     * naming: it is the one failure here that nobody can fix by retrying or
     * by taking a better photo.
     */
    if (/credit balance is too low/i.test(error.message)) {
      return "The Anthropic account is out of credit, so photo import is paused. Add credit in the Claude Console under Plans & Billing.";
    }
    return `Reading the photo failed (${error.status}). Fill the form in by hand.`;
  }
  return "Reading the photo failed. Fill the form in by hand.";
}
