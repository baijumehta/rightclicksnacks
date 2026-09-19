# Right Click Website UI Kit

A modular, brand-styled recreation of the **Right Click marketing website** (`rclick.com`), the company's primary public surface. Built in React (inline Babel JSX) on the shared tokens in `../../colors_and_type.css`.

> **Recreation, not a copy.** There was no codebase or Figma to import, so this kit reconstructs Right Click's surface from the brand spec (logo, colors, type) and the site's real content/voice. Layouts are original, on-brand compositions. Treat them as a faithful brand toolkit, and adjust toward the live site if you gain source access.

## Run it
Open `index.html`. It loads React 18 + Babel + Lucide + the `image-slot` web component from CDN/local and mounts `App`. Everything scrolls inside `.rc-scroll`.

The hero is a **dark photographic** band: an empty `<image-slot>` shows a clean navy base, and you can drag a city-skyline photo onto it (it sits behind a navy gradient so headline text stays legible either way). Because this file lives in a subfolder, a dropped photo shows in-session but may not persist across reloads.

## Interactive flow
- **Sticky header** turns translucent + blurs on scroll; nav links smooth-scroll to sections and set the active underline.
- **Get IT Support / Book a consultation / Contact / any service card** → opens the **consultation modal** with a validating form; submit shows a success state.
- **Mobile** (< 900px): hamburger reveals a stacked nav.

## Components
| File | Exports | What it covers |
|------|---------|----------------|
| `Header.jsx` | `Header`, `Icon`, `useLucide` | Sticky nav, logo lockup, phone CTA, mobile menu. `Icon` is the shared Lucide wrapper. |
| `Hero.jsx` | `Hero` | **Dark photographic hero.** White headline + dual CTA over a fillable `<image-slot>` (drop a city-skyline photo) with a navy overlay; floating "all systems monitored" status card; industries trust bar. |
| `Sections.jsx` | `Services`, `Squad`, `Industries`, `Stats`, `Process`, `Testimonial` | Four-pillar grid, the Dedicated Squad model + org-depth chips, industry grid, real metric band, 5-step process, Concord client story. |
| `Footer.jsx` | `CTASection`, `Footer` | Blue CTA band + navy footer with contact, link columns, partner badges. |
| `App.jsx` | `App`, `ConsultModal` | Composes the page, manages nav state + the consultation modal. |

All components attach to `window` so they share scope across Babel script tags (each `<script type="text/babel">` is isolated).

## Reuse notes
- Icons: Lucide via CDN. `Icon` re-runs `lucide.createIcons()` on each render through `useLucide()`.
- Logo is referenced at `../../assets/right-click-mark.png`.
- Colors, type, spacing, radii, shadows all come from CSS vars. Never hard-code hex; use `var(--blue-500)`, `var(--navy-900)`, etc.
- Amber (`--rc-amber`) appears only as highlight (hero text underline, stat underlines, the final CTA button). Keep it scarce.
