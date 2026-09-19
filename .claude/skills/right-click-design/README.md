# Right Click — Design System

A brand & UI design system for **Right Click, Inc.** — a Managed IT and AI consulting firm.

> **Status:** Built from the provided brand assets (logo, color spec, type spec) plus the official **"Getting Started with Right Click"** discovery deck, which is the most authoritative source for current positioning, voice, and service vocabulary. There is **no codebase or Figma** behind this system, so the UI kit is a faithful *brand-styled recreation* of Right Click's marketing surface. See **Caveats** at the bottom.

---

## 1. Company & product context

**Right Click** is a full-service **Managed IT and AI consulting firm** founded in **1997** by **Baiju Mehta** and **Jim Harrington**, who still lead it today as **Co-Founders & Co-CEOs**. Headquartered in **Irvine, CA**, the firm is **100% independent — never private-equity owned** (a deliberate, load-bearing differentiator: when competitors get acquired, their responsive support evaporates; Right Click's continuity is the pitch). 25+ years, same leadership. **250+ clients** supported, serving Southern California since 1997.

**Positioning:** Right Click is built for companies where *generic* IT support is a liability, not a solution. The frame they lead with: *"Most companies your size don't have a technology problem. They have a technology **management** problem."* They're a **technology partner, not just an IT vendor**.

### The four pillars
Publicly the deck headlines **two** pillars (Managed IT + AI), but the full offering is **four**:
1. **Managed IT** — the day-to-day foundation. Offered in two engagement models: **Fully Managed** and **Co-Managed IT** (augmenting an in-house team).
2. **Cybersecurity** — EDR/XDR with SOC-backed response, email & identity security, dark-web monitoring, backup & DR. "Built into everything," not an add-on.
3. **Managed Compliance** — audit-ready programs with a **special focus on CMMC Level 2** (for Aerospace & Defense), plus HIPAA/BAA (Healthcare).
4. **AI Consulting & Transformation** — custom AI solutions, workflow automation, AI-agent deployment with governance guardrails, and a **12-Month AI Transformation Program**. Right Click is an **Anthropic Certified Partner**.

**Target customer:** **10–600 employee** companies, **preferably within a 50-mile radius of the Irvine HQ** (so they can show up onsite — "we show up…literally"). **Exception:** **CMMC compliance** engagements are offered **nationwide**.

**Industries:** The three where most clients cluster are **Architecture, Engineering & Construction (AEC)**, **Healthcare**, and **Aerospace & Defense** — the most compliance- and workflow-demanding verticals. These are a focus, **not a fence**: Commercial Real Estate and other industries are welcome.

**Key credentials:** Microsoft Solutions Partner · Anthropic Certified Partner · Microsoft partner since 1997.

**Contact (current):** (714) 790-9412 · sales@rclick.com · rclick.com · 20 Corporate Park, Suite 400, Irvine, CA 92606.

**Primary surface (the "product"):** the **marketing website** at `rclick.com` plus sales collateral like the discovery deck. There is no end-user application. The UI kit recreates the marketing surface.

### Sources referenced
- `uploads/Right Click Logo for Polos.png` → `assets/right-click-mark.png`; official lockups + badges in `assets/`
- Brand color spec (provided): primary `#0098D5` / `#FFFFFF`; secondary `#0D273C` / `#F7F7F7` / `#EBF5FB`; tertiary `#FFCE83` / `#FFBD59` (highlight only)
- Type spec (provided): **Mulish** or **Arial** (Mulish variable fonts self-hosted in `fonts/`)
- **"Getting Started with Right Click" discovery deck** (project `f742dfb5-…`) — the authoritative source for positioning, pillars, the Squad model, voice, metrics, and proof points reflected throughout this README.

---

## 2. Content fundamentals (voice & tone)

Right Click's copy is **plain-spoken, reassuring, and outcome-focused**. It sells *peace of mind*, not jargon. The enemy is downtime, risk, compliance anxiety, and being "stuck on hold" with a vendor who doesn't know your environment.

- **Person & address:** Second person "you / your business," first person plural "we / our team." Warm and direct. Reads like a trusted advisor, not a vendor.
- **Tone:** Confident, calm, human. Empathizes with the pain first (in the prospect's own voice), then states the contrast plainly. Reframes IT complaints as **business** problems.
- **Sentence style:** Short, punchy declaratives. Often a two-beat structure: a blunt claim, then the payoff. Concrete verbs (resolve, monitor, deploy, protect, align, scope). Benefit-led.
- **Casing:** Sentence case for headlines and body. Title Case for named offerings, roles, and programs ("Managed IT," "AI Consulting & Transformation," "Dedicated Squad," "Quarterly Business Review," "12-Month AI Transformation Program"). Acronyms uppercase (IT, MSP, CMMC, HIPAA, BAA, CUI, DFARS, EDR/XDR, SOC, RMM, vCTO, QBR, TAC, PSG).
- **Numbers & proof:** Credibility markers — "Founded in 1997," "25+ years, same leadership," "100% independent," "250+ clients," ">95% patch rate," ">98% EDR coverage," "4.8/5 CSAT." Always tied to a business outcome, never vanity.
- **Emoji:** Not used. Keep emoji out of product/marketing UI.
- **Vibe:** Local, relationship-driven, dependable, security- and compliance-serious, quietly confident about AI. Avoid hype and breathless startup tone.

### STRICT: no AI language markers (mandatory for all output)
Every piece of Right Click copy, in this system or generated from it, must read like a person wrote it. These are hard rules, not preferences:
- **No em dashes.** Use a period, comma, colon, or parentheses instead. (Hyphens in compound words and en dashes in number ranges like 1-2 hrs are fine.)
- **No "it's not X, it's Y" phrasing** or any negative-parallelism reframe: "not just X, but Y", "less X, more Y", "stop doing X, start doing Y", "the real question isn't X, it's Y", "it was never about X, it was about Y". Delete the rejected half and state the point directly with a specific.
- **No other common AI tells:** dead openers ("In today's...", "It's important to note", "Let's dive in"), filler transitions (Furthermore, Moreover, That said), significance inflation (pivotal, transformative, game-changer on ordinary facts), the forced rule-of-three, elegant variation, and hype verbs (unlock, leverage, supercharge, elevate, revolutionize, seamless, robust).
- **Test before shipping:** read it aloud. If a sentence sounds like a brochure or a LinkedIn post, rewrite it as something you'd say to one client across a desk. Prefer a plain true sentence over a clever vague one.

**Signature lines (emulate this exact register):**
- "Most companies your size don't have a technology problem. They have a technology **management** problem."
- "We don't do generic IT."
- "Your IT company should know what Revit is. Ours does."
- "If your IT vendor doesn't have a BAA with you, ask why."
- "CMMC Level 2 is a continuous program, and we run it for you."
- "We measure results, not activity."
- "You'll never wonder what your IT company is doing. We tell you before you have to ask."
- "The best time to get your IT right was five years ago. The second best time is now."

**Do / Don't**
- ✅ "You meet your Squad by name before anything gets deployed."
- ❌ "Synergistic next-gen cyber solutions to 10x your security posture!"
- ❌ "It's not just IT support. It's a partnership." (banned negative parallelism)

### The four differentiators (with the exact subtext)
Every brand artifact should ladder back to these:
1. **Straight Talk** — Real conversations. No jargon, no tech overwhelm, no overselling.
2. **Local & Accountable** — Based in Irvine, CA. We show up...literally. You can always reach a real person.
3. **Security-First** — Compliance and cybersecurity are built into everything we do, from day one.
4. **Industry-Fluent** — We learn the software, regulations, and workflows your business runs on. (Deepest in AEC, Healthcare, and A&D, and we adapt to any industry.)

### The "Dedicated Squad" service model (use these exact names)
The central proof of the relationship promise: most MSPs route your call to whoever's free; Right Click assigns a **Dedicated Squad** that knows your environment.
- **Squad Leader** — relationship owner & point of escalation; owns roadmapping, QBRs, and budget planning.
- **Helpdesk Engineers** — dedicated remote support; tickets and day-to-day requests.
- **Onsite Engineers** — hands-on physical presence; deskside visits, installs, network work.

Behind every Squad stands the full org:
- **Escalation Squad** — senior Right Click executives; hard problems get senior judgment.
- **24/7 TAC** (Technical Assistance Center) — around-the-clock after-hours support, real humans.
- **PSG** (Professional Services Group) — complex projects, migrations, high-value deployments.
- **Logistics Team** — hardware procurement, device staging, vendor coordination.

Also part of the lexicon: **vCTO** (virtual CTO advisory), **QBR** (Quarterly Business Review), **RMM**, **EDR/XDR**, **SSP/POA&M**, **C3PAO**, **NIST 800-171**.

### Proof points & metrics to reach for
- **Commitments:** >95% patch rate · >98% EDR coverage · 4.8/5 CSAT · audit/evidence-ready.
- **Scale:** 250+ clients · serving SoCal since 1997 · 25+ years same leadership · 100% independent.
- **Engagement shape:** discovery → onboarded in **2–4 weeks**; structured 30/60/90-day onboarding (Foundation → Stabilization → Optimization).
- **Featured client story:** **The Concord Group** — a custom AI-built mapping tool cut a report workflow from 1–2 hrs to 5–15 min (`assets/concord-group.png`).

---

## 3. Visual foundations

The Right Click look is **clean, corporate-friendly, and trustworthy** — a bright sky-blue primary on lots of white, anchored by a deep navy, with a small amber highlight reserved for emphasis. It should feel professional and reassuring, never flashy.

### Color
- **Primary:** Right Click blue `#0098D5` on **white** `#FFFFFF`. Blue is the action/brand color (buttons, links, icons, accents).
- **Secondary:** deep navy `#0D273C` (headings, dark sections, footer), off-white `#F7F7F7` (page/section neutral), pale blue tint `#EBF5FB` (soft panels behind features/stats).
- **Tertiary:** amber `#FFBD59` / `#FFCE83` — **highlight only.** Use for the single most important word or a stat underline — never as a large fill or a second brand color.
- **Two emphasis treatments (don't confuse them):** inline **blue bold** (`.rc-hl`) is the everyday "emphasize a word" treatment; the **amber underline** (`.rc-highlight` / `.rc-amber`) is reserved for the one punchline word or hero stat per view.
- **Deep navy `#071A2B` (`--navy-950`)** is the full-bleed dark canvas for divider/CTA slides and dark sections — deeper than `#0D273C`, and always paired with the **navy glow** recipe (`--grad-navy-glow`): two soft blue radial glows (top-right + bottom-left) over the deep navy. Use `--navy-900 #0D273C` for smaller dark surfaces (footer); `--navy-950` + glow for big dark moments.
- **Mark orange `#F36B22`:** appears inside the logo's right-click button. Treat as part of the mark; do **not** introduce it as a UI color.
- **Vibe of imagery:** cool, bright, professional — real photography of people/offices/tech, slightly cool white balance. Blue duotone or blue-tinted overlays acceptable on hero photography. No heavy grain, no moody darks.

### Typography
- **Mulish** everywhere (Arial fallback). Headings are heavy: ExtraBold (800) for display/H1/card titles, Bold (700) for H2–H3. Body is Regular (400). Tight negative tracking on large headings.

**Sections are signposted by the H2 itself.** There is no eyebrow, kicker, or overline label above a heading. The H2 must describe what the section actually contains, so it stands on its own with nothing above it. Do not write a punchy or abstract heading that only makes sense because a smaller label above it explains the section. If the heading needs a label to be understood, the heading is wrong. Put the extra detail in the supporting sentence underneath.

- ❌ Don't: a small "Upcoming workshops" label, with **"Two a month, alternating online and in-office"** as the heading.
- ✅ Do: **"Upcoming workshops, two a month"** as the heading, then "They alternate between online and in-office…" in the supporting sentence below.

**Small labels inside cards and panels.** Where a card, panel, or form genuinely needs to name itself, use `.rc-label`: sentence case, 15px, weight 700, navy or blue. No uppercase, no letter-spacing, no leading dash. This is for naming a component from the inside, never for signposting a page section. The same spec governs footer column headings, group labels, badges, and status chips: there is no uppercase, letter-spaced label anywhere in the system.

### Spacing & layout
- 4px base unit; generous section padding (64–96px vertical). Max content width ~1200px, centered. Comfortable, airy — corporate breathing room, not dense.
- Grid-based feature/service cards (3-up typical). Fixed sticky header.

### Backgrounds
- Predominantly **white** with alternating **off-white** (`#F7F7F7`) and **pale-blue** (`#EBF5FB`) section bands for rhythm. For dark moments — dividers, CTA bands, the website hero, the footer — use **deep navy `#071A2B` with the blue radial-glow recipe** (`--grad-navy-glow`); the glow keeps large dark areas from going flat. On dark surfaces, cards become translucent white (`rgba(255,255,255,0.07)` fill, `rgba(255,255,255,0.16)` border, no shadow) and icon tiles use `rgba(0,152,213,0.16)` with blue-300 icons. Optional, understated only: a low-contrast dotted/grid texture. No loud multi-hue gradients.

### Corners, borders, cards
- **Radii:** medium-soft. Buttons/inputs ~8–12px; cards ~16px; pills 999px for tags/badges.
- **Cards:** white surface, hairline border (`#E2E4E8`) and/or a soft shadow (`0 8px 24px rgba(13,39,60,0.10)`), 24–32px padding. Hover lifts the card slightly with a deeper shadow.
- **Borders:** 1px hairlines in `#E2E4E8`/`#CBD0D7`. Section dividers very light (`rgba(13,39,60,0.08)`).

### Shadows / elevation
- Soft, navy-tinted, never black. xs→lg scale in `colors_and_type.css`. Primary buttons may carry a blue-tinted shadow (`--shadow-blue`) for lift.

### Motion
- Subtle and professional. 120–360ms, `ease-out` for entrances. Fades + small (4–8px) upward translate on scroll-in. Buttons/cards lift on hover. **No** bounces, no playful overshoot.

### Interaction states
- **Hover:** primary button darkens (`#0098D5` → `#0086BD`); links underline; cards raise. 
- **Press:** darken further (`#006F9E`) and a tiny scale-down (~0.98).
- **Focus:** 3px blue focus ring `rgba(0,152,213,0.35)` (accessibility for a security-minded brand).
- **Transparency/blur:** sticky header may use a translucent white with backdrop-blur once scrolled. Otherwise solid surfaces.

---

## 4. Iconography

- **Approach:** clean **line (stroke) icons**, ~1.75–2px stroke, rounded joins — matching the rounded, friendly geometry of the mouse mark. Icons render in Right Click blue `#0098D5` or navy `#0D273C`, often inside a pale-blue (`#EBF5FB`) rounded tile.
- **No proprietary icon font exists** in the provided assets. This system uses **[Lucide](https://lucide.dev)** (via CDN) as the icon set — its rounded, even-weight stroke style is the closest match to the brand mark, and it's what the official discovery deck uses. Common picks by domain: **Managed IT** `server-cog`, `headset`, `wrench`, `user-round-cog`; **Cybersecurity** `shield-check`, `lock`, `database-backup`; **Compliance** `clipboard-check`, `badge-check`, `folder-check`, `scale`, `file-check-2`; **AI** `sparkles`; **industry** `building-2`/`hard-drive`/`network` (AEC), `heart-pulse`/`monitor-check`/`activity` (Healthcare), `git-branch`/`shield-off` (A&D); **general** `clock`, `map-pin`, `messages-square`, `layers`, `compass`, `truck`, `arrow-up-right`, `quote`, `calendar-check`. Lucide ~1.75–2px stroke, in blue (`#0098D5`) or navy, usually inside a pale-blue (`#EBF5FB`) rounded tile. **(Substitution — flagged. Swap for Right Click's own icons if/when provided.)**
- **Partner badges:** the Microsoft four-square and the Anthropic mark appear as proof badges (see the deck's client-story slide). Render Microsoft as its 2×2 colored squares + "Microsoft Solutions Partner"; Anthropic as its mark in brand orange `#D97757` + "Anthropic Certified Partner."
- **Emoji / unicode:** not used as UI icons. Keep emoji out of product/marketing UI.
- **Logo / mark:** the circular mouse badge ("RIGHT CLICK · MANAGE · SECURE · INNOVATE") is the primary brand asset. It ships in **two text colorways** — use the right one for contrast: `assets/right-click-badge-black.png` (**black text**, for white/light backgrounds) and `assets/right-click-mark.png` (**white text**, for dark/navy backgrounds). The horizontal lockups (`right-click-lockup.png` / `-white.png`) follow the same light/dark rule. Keep clear space around the badge equal to the mouse's "click" gap; don't recolor the mark itself.
- **Right Click Plus service marks (restricted use):** two dedicated badges for the Right Click Plus program only. Use `assets/rc-plus-computer-service.png` (mouse mark with a monitor + plus) when referring to **Right Click Plus Business Computers**, and `assets/rc-plus-network-service.png` (mouse mark with a switch/network device + plus) for **Right Click Plus Critical Network Equipment / Infrastructure Service**. Never use these as a general company logo; reach for the primary mark/lockup for anything that is not a Plus service.

---

## 5. Index / manifest

Root files:
- **`README.md`** — this file (context, voice, visual foundations, iconography, manifest).
- **`colors_and_type.css`** — all design tokens: color palette + scales, semantic color vars, typography scale, spacing, radii, shadows, motion. Import this into any artifact.
- **`SKILL.md`** — Agent Skill front-matter so this system works inside Claude Code.
- **`assets/`** — logo mark + badges (`right-click-mark.png` white-text, `right-click-badge-black.png` black-text), horizontal lockups (`right-click-lockup.png` / `-white.png`), and the `concord-group.png` client-proof logo.
- **`preview/`** — HTML cards that populate the Design System tab: colors (incl. the navy-glow dark canvas), type (incl. the small-label convention), spacing, components, and brand (logo, lockup, differentiators, Squad model, partner badges).
- **`ui_kits/website/`** — UI kit recreating the Right Click marketing website (`README.md`, `index.html`, JSX components).

How to use: import `colors_and_type.css`, pull the logo from `assets/`, follow the voice + visual rules above (lead with the four pillars, name the Squad model, keep amber scarce), and assemble screens from the `ui_kits/website` components.

---

## 6. Caveats & substitutions

- **No source files.** This system was built from the brand spec (logo, colors, type) plus public content from rclick.com — there was **no codebase or Figma**. The UI kit is a faithful *brand-styled recreation*, not a pixel copy of the live site. Layouts are original, on-brand compositions.
- **Fonts self-hosted.** Mulish is bundled locally as variable fonts in `fonts/` (`Mulish-VariableFont_wght.ttf` + italic) and wired via `@font-face` in `colors_and_type.css` — no CDN dependency, works offline. Arial is the documented fallback.
- **Icons = Lucide (substitution, flagged).** No proprietary Right Click icon set was provided; Lucide's rounded line style is the closest match. Replace with official icons if available.
- **Official lockup in place.** The horizontal lockup (mark + "RIGHT CLICK") now uses the official artwork — `assets/right-click-lockup.png` (blue, for light backgrounds) and `assets/right-click-lockup-white.png` (reversed, for dark). The standalone mark remains at `assets/right-click-mark.png`.
- **Mark orange ≠ tertiary amber.** The logo's right-button is a punchy orange (`#F36B22`); the documented tertiary is amber (`#FFBD59`/`#FFCE83`). They're kept separate: orange stays inside the mark, amber is the UI highlight.

