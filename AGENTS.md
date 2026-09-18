<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Snacks

Office snack ordering: requests, voting, and a budget. See README.md for how a
cycle works and why prices are entered by hand.

## Rules of the road

- **Money is integer cents, everywhere.** Never floats. Format with
  `lib/money.ts`.
- **Dates are `YYYY-MM-DD` strings.** `lib/cycles.ts` does all the calendar
  arithmetic and never reads the clock except in `today()`, which takes a
  timezone. Do not reach for `new Date()` in cycle logic.
- **`lib/cycles.ts` and `lib/selection.ts` stay pure.** No database, no I/O.
  They hold the rules about money and fairness, so they carry the tests — add
  a case there before changing behaviour.
- **Server actions re-check auth.** They are reachable by direct POST, so a
  hidden button is not a control. Every action calls `requireUser()` or
  `requireAdmin()` and re-checks the cycle's status.
- **A `"use server"` file may only export async functions.** Constants live
  elsewhere — see `lib/categories.ts`.
- **Node scripts that import server modules need `--conditions=react-server`,**
  otherwise `server-only` throws. The `db:seed` and `cycle:roll` scripts
  already pass it.
- **Prices in the seed are placeholders.** Do not present them as real
  retailer data, here or in the UI.

## Checks

```bash
npm run check
```

That runs typecheck, lint, tests and a production build. It is one script on
purpose: the shell here is Windows PowerShell 5.1, which has no `&&`, so
chaining the four by hand is a parser error. npm runs scripts through cmd.exe,
where the chaining inside the script is fine.
