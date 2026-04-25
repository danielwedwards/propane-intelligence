# Ergon Propane Market Map — Design System

A design system extracted from the **U.S. Propane Market Map**, an internal intelligence tool built for Ergon Corporate Development. The product is a single-page SaaS app that lets M&A professionals browse, filter, and model acquisitions across ~1,000 propane retailers in the United States.

---

## Sources

- **Repo (single-file product):** `https://github.com/danielwedwards/us-propane-market-map`
- **Companion repo (Southeast):** `https://github.com/danielwedwards/se-propane-market-map`
- **Live site:** `https://danielwedwards.github.io/se-propane-market-map/`
- **Key files pulled from source (in `reference/`):**
  - `reference/index.html` — the full production app (2,700+ lines, single file)
  - `reference/login-mockups.html` — three login-background explorations (mesh orbs, geometric grid, aurora)
  - `reference/login-palette.png`, `reference/login-wave.webp` — visual mood references
  - `reference/CLAUDE.md` — sprint workflow / engineering & design standards doc

---

## What the product is

A **Bloomberg-Terminal-for-propane-M&A**. The target user is a corporate development executive, investment banker, or PE associate — sophisticated, data-hungry, and allergic to toy-looking software. The app is a single HTML file that combines:

- An interactive Leaflet map of every known propane retailer location
- A sortable league table with proximity, county-quality, and total scoring
- A slide-out **company profile panel** with financials, key personnel, and locations
- A **pro forma builder** — pick acquisition targets, see combined footprint and market share
- Saved scenarios, CSV export, dark mode, print styles

**Tone:** "Goldman Sachs or KKR would ship this." Precise, dense, professional — not playful.

---

## Index / manifest

| File | Purpose |
|------|---------|
| `README.md` | This file — brand + system overview |
| `SKILL.md` | Claude-Skills-compatible entrypoint for agents |
| `colors_and_type.css` | All design tokens (colors, type, spacing, shadows, radii) + semantic type classes |
| `fonts/` | (Web-fonts pulled from Google Fonts at runtime — see note below) |
| `assets/` | Logos, icons, imagery, backgrounds |
| `preview/` | Per-concept cards that populate the Design System tab |
| `ui_kits/app/` | High-fidelity JSX recreation of the market-map app |
| `reference/` | Source material — the original repo files, unchanged |

### Fonts

The product uses three Google Fonts: **Inter**, **Instrument Serif**, **IBM Plex Mono**. All are loaded via `@import` in `colors_and_type.css`. No self-hosted `.ttf`/`.woff2` files are shipped — if you need offline/print, download from Google Fonts and rewrite the `@import` to `@font-face` rules pointing at `fonts/`. **Flagged:** none of these are substitutions — they're the real fonts.

---

## CONTENT FUNDAMENTALS

### Voice
Crisp, unembellished, finance-literate. The app talks like a deal memo: short nouny phrases, tabular labels, no cheerleading. Sentences are either full and formal ("Sum of Proximity + County scores. Higher scores indicate targets that are both geographically close to the platform and located in attractive propane markets.") or reduced to a label ("Locations", "Proximity", "Total").

### POV
Third-person / impersonal. The user is never addressed as "you" in UI copy — labels and tooltips describe the data, not the reader. CTAs use verb-first imperatives ("Sign in", "Export CSV", "Reset", "Sign Out").

### Casing
- **UI labels:** Title Case for primary nouns ("League Table", "Saved Scenarios", "Pro Forma Builder").
- **Table headers:** UPPERCASE, `letter-spacing: 0.04em`, 10px, `color: var(--text-secondary)` — classic financial-table convention.
- **Buttons:** Sentence case for full-word actions ("Sign in"), Title Case for multi-word primary actions ("Export CSV").
- **Eyebrows / section headers in profile panel:** UPPERCASE, tracked.
- **Body copy in modals / help:** Sentence case.

### Numbers
- Revenue in `$M` with one decimal where relevant (`$42.3M`).
- Employee counts and location counts are integer, comma-separated.
- All numeric cells use `font-variant-numeric: tabular-nums` and `font-family: var(--font-mono)` — columns align perfectly.
- Percentages as `Market %` with no decimal unless < 1%.
- Scores are integers; color-coded (green ≥30, amber 10–29, gray <10).

### Terminology (house glossary)
- **Platform** — the user's current acquisition base (Lampton-Love + any added targets).
- **Pro forma** — the modeled-combined entity; verb: "add to pro forma".
- **Spotlight** — the 👁 action that isolates a single company's locations on the map.
- **League table** — the sortable company list.
- **Proximity / County / Total** — the three scoring axes.
- **Lampton Love** — Ergon's existing propane platform; canonical anchor on the map.

### Emoji usage
**Extremely sparingly and only as utility icons in the league table header row** — 👁 for spotlight, ⭐ for confidence ratings in data-source modal, 📈 in the empty-state pro-forma CTA. Never as decoration in body copy or marketing. Emoji are never the primary icon system.

### Example strings (real, from the product)
- Login: "U.S. Propane Market Map" / "Sign in to your account" / "Remember me on this device"
- Empty state: "Build Your Pro Forma — Click + on any company to add it to your acquisition platform. Compare footprints, estimate market share, and model scenarios."
- Help: "Measures how close a target company's locations are to the current platform…"
- Toast: short, declarative — "Saved", "Copied link", "Exported".

---

## VISUAL FOUNDATIONS

### Palette

Two co-existing palettes the product blends deliberately:

1. **Ergon legacy** — `--navy #0D1B2A` + `--gold #C8A951`. Used on the **print header**, **dark-mode accents**, **focus outlines**, and scoring badges. Signals "this is Ergon, this is a deal tool."
2. **Modern SaaS violet** — `--brand #7C5CFC` (+ `--brand-dark #5B3FD1`, `--brand-light #EDE9FE`). Used for all primary actions, selections, link accents, sort indicators, hover states in modern surfaces.

Semantic colors (green/amber/red/blue/purple) each have a **tinted surface pair** (`--green` + `--green-light`) — used as pill fills for badges and scores. Never as full-bleed blocks.

Neutral scale is an Untitled-UI-style slate: `#101828 → #475467 → #98A2B3 → #E4E7EC → #FAFBFC → #FFFFFF`.

### Typography

Three families, each with a clear job:
- **Inter** — UI, body, labels, buttons, table cells. 90% of text.
- **Instrument Serif** — sparingly, for display / section titles in marketing surfaces. Never in dense UI.
- **IBM Plex Mono** — all numerics, scores, metrics, code. `font-variant-numeric: tabular-nums` is applied everywhere it appears.

Scale is intentionally dense: `10/11/12/13/14/16/20/28`. 13px is the body-copy default — this is a data app, not marketing.

### Spacing
4px base grid: `4, 8, 12, 16, 24, 32, 48`. Component internal padding is almost always `12px × 16px` or `10px × 8px`. Generous whitespace is reserved for the login card and modals.

### Backgrounds
- **App chrome:** `#FFFFFF` headers, `#FAFBFC` (`--light-bg`) body. No gradients, no textures.
- **Login screen:** The only place with atmospheric color — a light `#f8f9fc` canvas with 4–5 **floating mesh orbs** (blurred, animated, translucent). Orb palette: brand violet, blue, pink, amber, indigo — high saturation at low opacity. This is the product's only "moment of delight."
- **Print / PDF:** navy header strip on pure white — deal-memo aesthetic.
- **Dark mode:** pure `#0e1620` with `#16202e` surfaces; gold accents instead of violet on actionable elements.

### Borders
- `1px solid var(--border)` (`#E4E7EC`) everywhere — panel separators, card outlines, table rows.
- `1px solid var(--border-subtle)` (`#F0F2F5`) for table-row separators — barely visible.
- No `2px` borders except **active tabs** and **keyboard-selected rows** (`outline: 2px solid var(--gold)`).

### Shadows
A 3-stop system and nothing else:
- `--shadow-xs` — sits under the app header, subtle lift
- `--shadow` — cards, popovers, tooltips
- `--shadow-lg` — slide-out profile panel, modals, dropdowns

No inner shadows anywhere. No colored shadows except brand-colored focus rings (`0 0 0 3px rgba(124, 92, 252, 0.10)`).

### Corner radii
Only four: `6px / 8px / 12px / 9999px`.
- `6px` — small buttons, table-cell pills
- `8px` — inputs, medium buttons, cards
- `12px` — modals, chart cards, login card
- `9999px` — badges, state-pills, the signature "fully rounded pill" for categorical chips

### Card anatomy
Cards are **white background + 1px border + 8px radius + `--shadow-xs`**. No left-border color accents, no gradient fills. The only "fancy" card treatment is the **KPI card** in the charts dashboard, which uses the same chrome plus a monospace 28px metric.

### Motion
- Entrances: `200–300ms`, `cubic-bezier(0.16, 1, 0.3, 1)` (the product's signature ease-out-back-ish).
- Exits: `150–200ms`, `ease-in`.
- Hover transitions: `120ms`.
- Press feedback: `transform: scale(0.96)` on pills and buttons — tactile but tiny.
- Panel slides: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
- `prefers-reduced-motion` is respected — all durations forced to `0.01ms`.

### Hover / press / focus states
- **Hover:** `border-color: var(--gold)` (legacy) or `border-color: var(--brand)` + `color: var(--brand)` (modern). No background change on hover for pills.
- **Press:** `transform: scale(0.96); opacity: 0.85` for a 100ms beat.
- **Focus:** `2px solid var(--gold)` outline on keyboard focus; a `0 0 0 3px var(--brand-muted)` ring on form inputs.

### Transparency / blur
Used only in three places: (1) login-card on dark backgrounds (`background: rgba(255,255,255,0.95); backdrop-filter: blur(20px)`), (2) the dim overlay behind the slide-out profile panel (`rgba(13,27,42,0.18)` — decorative, click-through), (3) map-marker clustering glow.

### Layout rules
- Fixed **app header** (52px min-height), **sidebar filters** (240px fixed), and **pro-forma bar** (pinned bottom, collapses into a 40px strip).
- Main content fills the remaining viewport. The league table and map are a horizontal 50/50 split on desktop, resizable via a 4px gold-on-hover grip.
- Mobile: table and map become tab-switched, sidebar hides entirely.

### Imagery
**The product has almost no imagery** — this is a data tool. The only images anywhere are the **login mood references** (abstract gradient swirls in `reference/login-*`) which were never shipped — the production login uses generated animated orbs instead. No photos of people, no propane tanks, no trucks.

---

## ICONOGRAPHY

The product has a **deliberately minimal icon system**:

- **No icon library imported.** No Lucide, no Heroicons, no Font Awesome. Every icon in the app is either a **unicode glyph** (★, ▲, ▼, ⟳, ↓, ☰, ✕, ?, ●, 👁, 📈, ⭐) or an **inline SVG** embedded once in the CSS (search magnifier as a data-URI background on the search input).
- **Leaflet map markers** are `<div>` elements with CSS borders and `box-shadow` glow — no icon font, no SVG sprite. Each marker is a 7–14px colored dot, styled via `.cm`, `.cm-ll`, `.cm-ll-star`, `.cm-platform` classes.
- **Logos:** no raster logo file exists in the source repo. "ERGON CORPORATE DEVELOPMENT" is rendered as **tracked uppercase Inter** in the app header. We've preserved this type-only approach in `assets/logo.svg` and `assets/wordmark.svg`.
- **Emoji as utility glyphs:** 👁 (spotlight), ⭐ (confidence rating), 📈 (empty-state). Always at 12–14px, never larger.

### Recommendation for new surfaces

If you need icons beyond the glyphs the product already uses, pull from **[Lucide](https://lucide.dev)** via CDN — its stroke weight (`1.5px`) and geometric simplicity match the product's aesthetic. This is a **substitution** — the product itself has no formal icon system. Flag this to the design lead before shipping.

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

### Full glyph inventory (verified in-source)

| Glyph | Usage |
|-------|-------|
| `▲` / `▼` | Table sort indicators |
| `?` | Help button (circled) |
| `☰` | Sidebar toggle |
| `✕` | Modal close, panel close |
| `↓` | Export |
| `⟳` | Reset |
| `●` | Legend dot |
| `★` | Confidence rating |
| `👁` | Spotlight on map |
| `📈` | Empty-state illustration |
| `+` / `-` | Add-to-platform, remove |

---

## File Index

Root of this design system:

- `README.md` — this file (context, content, visual foundations, iconography)
- `SKILL.md` — skill manifest (for reuse as an Agent Skill in Claude Code)
- `colors_and_type.css` — all color + type tokens and semantic CSS (fg/bg vars, h1–h3, body, mono, etc)
- `fonts/` — Inter Variable + IBM Plex Mono + Instrument Serif (Google Fonts copies)
- `assets/` — logos, backdrops, any imagery copied from source
- `reference/` — original source files from the repo (read-only snapshots)
- `preview/` — small cards populating the Design System tab
- `ui_kits/app/` — hi-fi clickable recreation of the app (Header, Sidebar, LeagueTable, MapPanel, ProfilePanel, ProForma, Login)

No slide template was provided, so there is no `slides/` folder. Ask if you'd like one derived from the visual foundations.
