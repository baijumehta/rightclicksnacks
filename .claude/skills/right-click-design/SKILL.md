---
name: right-click-design
description: Use this skill to generate well-branded interfaces and assets for Right Click (Right Click, Inc. — Managed IT & AI consulting firm), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- **Brand:** Right Click, Inc. — **Managed IT + AI consulting** firm, Irvine CA, founded 1997 by Baiju Mehta & Jim Harrington (still Co-CEOs). **100% independent**, 250+ clients, Microsoft Solutions Partner + Anthropic Certified Partner.
- **Four pillars:** Managed IT (Fully Managed + Co-Managed models) · Cybersecurity · Managed Compliance (CMMC L2 focus) · AI Consulting & Transformation. Publicly headlined as 2 (Managed IT + AI).
- **Target:** 10–600 employees, within ~50mi of Irvine; CMMC compliance offered nationwide.
- **Industries (focus, not fence):** AEC, Healthcare, Aerospace & Defense; CRE/others welcome.
- **Differentiators:** Straight Talk · Local & Accountable · Security-First · Industry-Fluent.
- **Service model:** "Dedicated Squad" (Squad Leader + Helpdesk + Onsite Engineers), backed by Escalation Squad, 24/7 TAC, PSG, Logistics. Lexicon: vCTO, QBR, RMM, EDR/XDR, CMMC, BAA.
- **Tokens:** `colors_and_type.css` — import it; never hard-code hex. Primary `--blue-500 #0098D5`, secondary `--navy-900 #0D273C`, deep `--navy-950 #071A2B` (+ `--grad-navy-glow` for dark canvases), neutrals `--gray-50` / `--rc-tint #EBF5FB`, tertiary `--rc-amber #FFBD59` (highlight ONLY). Inline emphasis = blue bold `.rc-hl`; amber underline `.rc-highlight` reserved for one word/stat.
- **Type:** Mulish (self-hosted, Arial fallback). ExtraBold headings. No overlines/eyebrows: the H2 signposts its own section and must describe what the section contains. Inside cards/panels use `.rc-label` (sentence case, 15px, 700, navy or blue).
- **Logo:** badges `assets/right-click-badge-black.png` (light bg) / `right-click-mark.png` (dark bg); lockups `right-click-lockup.png` / `-white.png`.
- **Icons:** Lucide (CDN) — rounded line icons. No emoji.
- **Contact:** (714) 790-9412 · sales@rclick.com · 20 Corporate Park, Suite 400, Irvine, CA 92606.
- **UI kit:** `ui_kits/website/` — modular React components recreating the marketing site.
- **Preview cards:** `preview/` — every token/component rendered.
