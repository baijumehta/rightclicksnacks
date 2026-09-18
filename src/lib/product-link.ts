import "server-only";
import type { Store } from "@/db/schema.ts";

/**
 * Best-effort import of a product from a pasted Costco or Target URL.
 *
 * Read this before trusting it: neither retailer publishes an API for this,
 * and both actively discourage automated reads. Costco sits behind bot
 * protection and will usually refuse us outright; Target is friendlier but
 * changes its markup without notice. So this is a convenience that fills the
 * form in when it can, and every field it returns stays editable. When it
 * fails, the answer is "type the price in", not an error the user has to
 * work around -- which is why `lookupProduct` never throws.
 */

export interface ProductDraft {
  name?: string;
  brand?: string;
  priceCents?: number;
  imageUrl?: string;
  packSize?: string;
  store: Store;
  sourceUrl: string;
  /** What we could not work out, shown as a nudge next to the form. */
  missing: string[];
  /** Set when the fetch itself failed, so the UI can say why. */
  note?: string;
}

const TIMEOUT_MS = 8_000;

/** Which retailer a URL belongs to, by hostname. */
export function storeFromUrl(raw: string): Store {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host.endsWith("costco.com")) return "costco";
    if (host.endsWith("target.com")) return "target";
  } catch {
    /* not a URL; fall through */
  }
  return "other";
}

export function isSupportedProductUrl(raw: string): boolean {
  return storeFromUrl(raw) !== "other";
}

/**
 * Pull what we can from a product page. Always resolves: a failed or blocked
 * fetch comes back as a draft with `note` set and everything in `missing`.
 */
export async function lookupProduct(raw: string): Promise<ProductDraft> {
  const sourceUrl = raw.trim();
  const store = storeFromUrl(sourceUrl);
  const draft: ProductDraft = { store, sourceUrl, missing: [] };

  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return { ...draft, note: "That does not look like a link.", missing: ["name", "price"] };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ...draft, note: "Only http(s) links work here.", missing: ["name", "price"] };
  }

  let html: string;
  try {
    html = await fetchPage(url);
  } catch (error) {
    return {
      ...draft,
      note:
        error instanceof Error && error.name === "TimeoutError"
          ? "The retailer took too long to answer. Fill the price in by hand."
          : `${labelFor(store)} would not let us read that page. Fill the price in by hand.`,
      missing: ["name", "price"],
    };
  }

  const fromJsonLd = readJsonLd(html);
  const fromMeta = readMetaTags(html);

  draft.name = fromJsonLd.name ?? fromMeta.name;
  draft.brand = fromJsonLd.brand;
  draft.imageUrl = fromJsonLd.image ?? fromMeta.image;
  draft.priceCents = fromJsonLd.priceCents ?? fromMeta.priceCents;

  if (!draft.name) draft.missing.push("name");
  if (draft.priceCents == null) draft.missing.push("price");
  if (draft.missing.length > 0) {
    draft.note =
      store === "costco"
        ? "Costco hides prices from anyone who is not signed in, so check this against the site."
        : "Some details did not come through -- check them before saving.";
  }
  return draft;
}

async function fetchPage(url: URL): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
    headers: {
      // Identify as a normal browser; a bare fetch UA is refused immediately.
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  // Product pages are big and we only need the head; cap what we read.
  const text = await response.text();
  return text.slice(0, 1_500_000);
}

const labelFor = (store: Store) =>
  store === "costco" ? "Costco" : store === "target" ? "Target" : "That site";

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

interface Parsed {
  name?: string;
  brand?: string;
  image?: string;
  priceCents?: number;
}

/** Schema.org Product blocks -- the most reliable source when present. */
function readJsonLd(html: string): Parsed {
  const out: Parsed = {};
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      continue;
    }
    for (const node of flatten(parsed)) {
      if (!isProduct(node)) continue;
      const record = node as Record<string, unknown>;
      out.name ??= asString(record.name);
      out.brand ??= brandName(record.brand);
      out.image ??= firstImage(record.image);
      out.priceCents ??= offerPrice(record.offers);
      if (out.name && out.priceCents != null) return out;
    }
  }
  return out;
}

/** OpenGraph and the product meta tags, as a fallback. */
function readMetaTags(html: string): Parsed {
  const meta = (property: string): string | undefined => {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]*>`,
      "i",
    );
    const tag = pattern.exec(html)?.[0];
    if (!tag) return undefined;
    const content = /content=["']([^"']*)["']/i.exec(tag)?.[1];
    return content ? decodeEntities(content) : undefined;
  };

  const price =
    meta("product:price:amount") ??
    meta("og:price:amount") ??
    meta("twitter:data1");

  return {
    name: meta("og:title"),
    image: meta("og:image"),
    priceCents: price ? toCents(price) : undefined,
  };
}

function* flatten(value: unknown): Generator<unknown> {
  if (Array.isArray(value)) {
    for (const entry of value) yield* flatten(entry);
    return;
  }
  if (value && typeof value === "object") {
    yield value;
    const graph = (value as Record<string, unknown>)["@graph"];
    if (graph) yield* flatten(graph);
  }
}

function isProduct(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const type = (node as Record<string, unknown>)["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === "string" && t.toLowerCase() === "product");
}

function offerPrice(offers: unknown): number | undefined {
  for (const node of flatten(offers)) {
    if (!node || typeof node !== "object") continue;
    const record = node as Record<string, unknown>;
    const price = record.price ?? record.lowPrice ?? record.highPrice;
    const cents = toCents(price);
    if (cents != null) return cents;
  }
  return undefined;
}

function brandName(brand: unknown): string | undefined {
  if (typeof brand === "string") return brand;
  if (brand && typeof brand === "object") {
    return asString((brand as Record<string, unknown>).name);
  }
  return undefined;
}

function firstImage(image: unknown): string | undefined {
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return image.find((i) => typeof i === "string");
  if (image && typeof image === "object") {
    return asString((image as Record<string, unknown>).url);
  }
  return undefined;
}

const asString = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? decodeEntities(v.trim()) : undefined;

function toCents(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  if (typeof value !== "string") return undefined;
  const match = /(\d+(?:[.,]\d{1,2})?)/.exec(value.replace(/,(?=\d{3}\b)/g, ""));
  if (!match) return undefined;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
