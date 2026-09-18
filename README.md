# Snacks

The office snack order, run as a budget instead of a whiteboard.

People put snacks forward with what they cost, the room votes a few days before
each order goes in, and the app turns the result into a shopping list that fits
the budget. Orders go in twice a month, on the **1st** and the **15th**.

## The problem it solves

The whiteboard had two failure modes, and this fixes both:

- **The thing only one person eats never gets bought.** Everyone gets one
  **guaranteed pick** per cycle, up to $15. It is ordered whether or not anyone
  else votes for it. Your oat milk is safe.
- **Nobody could see what any of it cost.** Every item carries a price, and the
  ballot shows a line where the budget runs out. Voting moves that line while
  you watch.

## How a cycle works

```
Sep 15 ──────────────── Sep 28 ──── Oct 1
  cycle opens          voting       order
  (add anything)        opens       goes in
```

| Phase | What happens |
| --- | --- |
| `collecting` | Anyone adds snacks to the catalog and onto the list. |
| `voting` | The list freezes. Everyone gets 10 votes, one per item, plus one guaranteed pick. |
| `closed` | Votes are tallied, the shopping list is written, the next cycle starts. |

A cycle is named for the day it closes and draws from the budget of the month it
closes in — so the cycle running Sep 15 → Oct 1 spends October's money.

**Budget.** $600 a month, split across the two orders. The first gets $300; the
second gets whatever the first did not spend, so an underspent first half is not
lost.

## How the list gets chosen

Two passes, in [`src/lib/selection.ts`](src/lib/selection.ts):

1. **Guaranteed picks first.** Each person's one pick, cheapest promise first,
   capped at $15 a unit. A pick over the cap is not thrown away — it drops into
   the vote and competes normally.
2. **Then the vote**, most votes first. Ties go to the item that delivers more
   votes per dollar. When an item does not fit, the pass keeps going rather than
   stopping, so one $180 item near the top does not block five $12 items
   underneath it.

Nothing with zero votes and no guaranteed pick is ever bought. Everything that
misses out lands on a waitlist, ready for the next cycle.

## About prices

**Prices are entered by hand, and that is deliberate.** Neither Costco nor
Target publishes an API for this. Costco sits behind bot protection and will
usually refuse an automated read outright; Target changes its markup without
notice. Scraping either at any scale is also against their terms.

So the app does the honest version:

- Every item stores a price, a pack size and a link to the product page.
- Pasting a product URL runs a **best-effort** read of the page's structured
  data and fills in what it can. When it fails — which it will, especially for
  Costco — it says so and you type the price in. See
  [`src/lib/product-link.ts`](src/lib/product-link.ts).
- Prices carry a "last checked" date and get flagged stale after 45 days. One
  click confirms a price is still right; one click corrects it.
- After shopping, type in what each line actually rang up as. The next cycle's
  budget then uses real numbers rather than estimates.

The starter catalog from `npm run db:seed` is **plausible placeholder pricing,
not live data**. Correct it the first time somebody actually shops.

## Suggestions

The "worth considering" list comes from this office's own history, not from
anything a retailer recommends — what got bought and scored well, what keeps
being asked for and keeps missing out, and which category has nothing on the
current list. See [`src/lib/suggest.ts`](src/lib/suggest.ts).

## Running it

### 1. A database

Any Postgres. [Neon](https://neon.tech) and Vercel Postgres both have a free
tier that is far more than this needs.

```bash
cp .env.example .env.local
```

Fill in `DATABASE_URL`, then:

```bash
npm install
npm run db:push
npm run db:seed
```

### 2. Microsoft sign-in

In the [Azure portal](https://portal.azure.com) → **Entra ID** → **App
registrations** → **New registration**:

- **Supported account types**: accounts in this organizational directory only
- **Redirect URI**: Web → `http://localhost:3000/api/auth/callback`
  (add your production URL the same way once deployed)

Then, in the registration:

- **Overview** gives you `ENTRA_TENANT_ID` (Directory ID) and `ENTRA_CLIENT_ID`
  (Application ID).
- **Certificates & secrets** → **New client secret** gives you
  `ENTRA_CLIENT_SECRET`. Copy it immediately; it is only shown once.
- **API permissions** needs nothing beyond the default `User.Read`.

Set `ALLOWED_EMAIL_DOMAINS=rclick.com` so anyone on that domain can sign in by
themselves. Anyone else has to be added on the admin page first. **The first
person to sign in becomes the admin.**

### 3. Go

```bash
npm run dev
```

## Deploying

Built for Vercel. Set every variable from `.env.example` in the project
settings, including a long random `CRON_SECRET`.

`vercel.json` registers a daily cron at 13:00 UTC (06:00 Pacific) that hits
`/api/cron/roll`, which opens voting, closes cycles on the 1st and 15th, and
starts the next one. It is idempotent, so a double fire is harmless — and the
dashboard creates the current cycle on demand anyway, so a missed cron never
leaves the app stuck.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests for the cycle dates and the selection algorithm |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply the schema |
| `npm run db:generate` | Write a migration from a schema change |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Starter catalog and the first cycle |
| `npm run cycle:roll` | Run the nightly advance by hand |

## Layout

```
src/
  db/schema.ts            every table, commented
  lib/
    cycles.ts             cycle dates -- pure, no clock except today()
    selection.ts          ballot -> shopping list -- pure, fully tested
    cycle-service.ts      the database-backed cycle operations
    suggest.ts            "worth considering", from our own history
    product-link.ts       best-effort read of a pasted product URL
    auth.ts               Entra sign-in and sessions
  app/
    page.tsx              this cycle: the list, the ballot, the budget
    catalog/              everything we know about, with prices
    order/                the shopping list, grouped by store, printable
    history/              past cycles and what they cost
    admin/                settings, cycle controls, people
```

`cycles.ts` and `selection.ts` are pure functions with no database access,
which is why they carry the tests — the rules about money and fairness are the
part worth pinning down.

## Settings

All on the admin page: monthly budget, guaranteed-pick cap, votes per person,
how many days before an order voting opens, and how long before a price is
flagged stale. Changes apply to cycles created from then on.
