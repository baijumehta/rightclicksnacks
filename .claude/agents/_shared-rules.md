# Universal rules — every sub-agent must read this first

**Mode: EXHAUSTIVE.** Default scope is the entire repository. No sampling, no
"representative files", no skipping. A narrower scope applies only when the
invocation states one explicitly.

## 1. Exhaustive coverage protocol

- Scope is everything: source, config, scripts, migrations, CI/CD workflows,
  Dockerfiles, env templates, docs that make claims about behaviour, package
  manifests, lockfiles (metadata only).
- **Enumerate first**, preferring `git ls-files` so `.gitignore` and vendored
  output are respected. Exclude only `node_modules`, `.git` internals, build
  output (`dist`, `.next`, `build`), lockfile *contents*, binary assets, and
  `.claude/skills/**` (vendored design-system reference, not this project's
  code). Everything else gets opened and read.
- **Read whole files**, not just the line a grep hit. Open direct callers and
  callees when needed to confirm a suspected issue is reachable.
- **No early exit.** Ten findings in the first directory does not end the
  sweep. The report is not done until the checklist is done.

## 2. Durable state & resume

- On any non-trivial run create `.agent-audit/` (gitignored):
  - `manifest.md` — the enumerated checklist, `- [ ] path` per line. Tick a
    file ONLY after fully reading it. This is the single source of truth for
    coverage.
  - `findings.md` — every finding appended the moment it is found, in the
    agent's output format. Never batch findings in memory.
  - `notes.md` — stack map, data flow, conventions, deferred questions.
- Emit interim findings directory-by-directory so an interruption loses
  nothing.
- **Resume:** re-read all three files first, then continue from the first
  unticked item. Never re-audit ticked files, never restart.
- Low on budget: finish the current file, sync `.agent-audit/`, and state
  exactly where you stopped.

## 3. Evidence standard — no hallucinated findings

- Every finding quotes **code read this session**, with `file:line`. No
  findings from memory of "typical" codebases, no invented line numbers. If
  you cannot quote it, you did not find it.
- A finding not traced to a **reachable** path is a guess — label it low
  confidence or drop it.
- **Anti-false-positive:** before flagging injection / XSS / CSRF / a missing
  null check, confirm the framework or ORM does not already neutralise it
  (parameterised queries, auto-escaping, built-in CSRF) and that the value can
  actually be bad on a reachable path. "Could be unsafe in some framework" is
  not a finding.
- Every finding carries confidence: HIGH (verified reachable) / MEDIUM
  (likely, partial trace) / LOW (suspicious, needs human confirmation).

## 4. Report everything, including tiny things

- Nothing is too small: typos in user-facing strings, inconsistent naming, a
  stray `console.log`, an unused import, a comment that lies, a magic number.
- Severity **organises**, it does not filter: Critical / High / Medium / Low /
  **Nit**. Nits get their own section so signal is not buried and nothing is
  dropped.
- Never write "various minor issues throughout". Every instance gets its own
  line with `file:line`. Forty occurrences means forty locations listed,
  grouping under one finding is fine.
- Distinguish bugs from preferences: a style opinion that changes no behaviour
  is at most a Nit with explicit justification, never a Critical.

## 5. Gating & disposition

Two orthogonal tags per finding.

**Who may act:**
- **[AGENT-SAFE]** — style, dead code, missing null checks, obvious logic
  bugs, test scaffolding, non-destructive refactors. May be proposed and, if
  asked, applied.
- **[HUMAN-GATE]** — credential rotation, git-history rewrites, schema and
  migration changes, financial/billing logic, auth/RBAC/RLS changes,
  production data, irreversible deletes. Stop, flag, wait for explicit
  sign-off. Never apply silently, never bundle with agent-safe fixes.

**Disposition:** FIXED (applied this session) / STAGED (needs human, exact
steps written out) / ACCEPTED-RISK (flagged, deliberately not actioned, with
reason) / OPEN (report-only default, carries a proposed fix).

## 6. Report ending

Every report ends with:

```
## Coverage Manifest
Files enumerated: N
Reviewed clean: N | Reviewed with findings: N | Skipped: N
Skipped files and reasons:
- path — reason
```

A report without a complete manifest is an incomplete report.

## 7. This project

House rules live in `AGENTS.md` and bind you too: money is integer cents,
dates are `YYYY-MM-DD` strings, `lib/cycles.ts` and `lib/selection.ts` stay
pure, server actions re-check auth, a `"use server"` file exports only async
functions. Checks run with `npm run check` — the shell is Windows PowerShell
5.1, which has no `&&`.
