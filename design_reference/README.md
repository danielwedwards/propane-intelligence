# Handoff: Ergon Market Intelligence Redesign

## Overview

This package is the design handoff for the visual redesign of Ergon's internal **U.S. Propane Market Map / Market Intelligence** tool. It covers the full authenticated application (login, main app chrome, league table, map panel, profile panel, pro-forma modal) plus the underlying design system (color tokens, typography, spacing, radii, iconography).

The goal: bring the tool's visual design up to the level of modern B2B SaaS (Stripe, Linear, Notion) while staying appropriate for a serious internal corporate-development tool.

---

## About the Design Files

**The files in this bundle are design references created in HTML** — working prototypes that demonstrate the intended look, layout, and interaction of each screen. They are **not production code to copy directly.**

Your task is to **recreate these designs inside Ergon's existing codebase** (Flask + Jinja + vanilla JS, per the repo), using the team's established patterns. The HTML/JSX prototypes are the visual spec; the tokens and measurements in this README are authoritative.

Two reasonable implementation paths:

- **Path A (recommended) — Incremental CSS refactor.** Keep Flask/Jinja templates. Drop `design-tokens/colors_and_type.css` into `static/css/` as the new token layer. Replace color literals in existing stylesheets with CSS variables. Restyle one screen at a time.
- **Path B — Component rewrite.** Mount React (or Preact) into Jinja pages, port the JSX components from `reference-ui-kit/` one by one, keep Flask as the API layer only.

Path A gets 80% of the visual upgrade for 20% of the engineering effort.

---

## Fidelity

**High-fidelity.** All colors, typography, spacing, radii, shadows, and component treatments are final. Recreate pixel-perfectly where practical.

Exceptions (called out inline below):
- The wordmark in `assets/` is a **type-only placeholder**. If Ergon has an official logo mark, substitute it.
- The login background's floating-orbs animation is intentional — not a placeholder.
- The map panel in the reference kit is a **static SVG mock**; the real app's Leaflet integration stays as-is — you just restyle the chrome around it.

---

## Design Tokens

All tokens live in `design-tokens/colors_and_type.css` as CSS custom properties. Use these everywhere — do not introduce new color literals.

### Colors

**Brand / primary (indigo)**
- `--indigo-50`  `#EEF2FF`
- `--indigo-100` `#E0E7FF`
- `--indigo-500` `#6366F1`
- `--indigo-600` `#4F46E5`  ← primary CTA
- `--indigo-700` `#4338CA`
- `--indigo-900` `#312E81`

**Neutrals (slate)**
- `--slate-50`  `#F8FAFC`  — page background
- `--slate-100` `#F1F5F9`  — surfaces
- `--slate-200` `#E2E8F0`  — borders
- `--slate-400` `#94A3B8`  — muted text
- `--slate-600` `#475569`  — secondary text
- `--slate-700` `#334155`
- `--slate-900` `#0F172A`  — primary text
- `--slate-950` `#020617`  — deep chrome (nav, pro-forma header)

**Semantic**
- Success `--emerald-500` `#10B981`
- Warning `--amber-500` `#F59E0B`
- Danger `--red-500` `#EF4444`
- Info `--sky-500` `#0EA5E9`

**Login-screen orb palette** (floating colored blobs behind the login card)
- Violet `#A78BFA`, Blue `#60A5FA`, Cyan `#22D3EE`, Pink `#F472B6`, Indigo `#818CF8`

### Typography

- **Sans (UI):** Inter — weights 400 / 500 / 600 / 700. Load via Google Fonts.
- **Mono (tabular data, coordinates, tickers):** IBM Plex Mono — 400 / 500.
- **Display (optional, for marketing surfaces):** Instrument Serif — regular only.

**Scale** (use these, not arbitrary sizes):
- `--text-xs`   12px / 16 line-height
- `--text-sm`   13px / 18
- `--text-base` 14px / 20  ← default body
- `--text-md`   15px / 22
- `--text-lg`   17px / 24
- `--text-xl`   20px / 28  — panel titles
- `--text-2xl`  24px / 32  — screen titles
- `--text-3xl`  30px / 38  — login, major headings
- Letter-spacing `-0.01em` on all UI text; `-0.02em` on 24px+; `0.06em` uppercase on small-caps labels.

### Spacing

4px base unit. Use these steps: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80**. Do not improvise in-between values.

### Radii

- `--r-sm` 4px   — inputs, small chips
- `--r-md` 6px   — buttons, cards
- `--r-lg` 8px   — panels
- `--r-xl` 12px  — modals, login card
- `--r-full` 9999px — pills, avatars

### Shadows

- `--shadow-xs` `0 1px 2px rgba(15,23,42,0.04)`
- `--shadow-sm` `0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)`
- `--shadow-md` `0 4px 12px rgba(15,23,42,0.08)`
- `--shadow-lg` `0 15px 35px rgba(15,23,42,0.10), 0 5px 15px rgba(15,23,42,0.05)`  ← login card

---

## Screens

### 1. Login (`reference-ui-kit/Login.jsx`)

**Purpose:** Unauthenticated entry point. SSO-first (Google + Microsoft), email/password fallback.

**Layout:**
- Full-viewport fixed container on `#F6F9FC`.
- Top nav bar: brand wordmark left, `Support` / `Contact` / `Request access →` links right. 24px vertical padding, 48px horizontal.
- Centered login card: 420px wide, white, `--r-xl`, `--shadow-lg`, 40px internal padding.
- Footer strip: copyright, privacy/terms, compliance notes, centered 24px from bottom.

**Background — animated floating orbs:**
- 5 blurred colored circles (palette above) sized 420–600px, positioned at 15/25%, 78/20%, 82/80%, 12/78%, 50/50%.
- Each orb has a 60px blur filter, 0.6 opacity, and drifts via `requestAnimationFrame` using sine/cosine motion (see `FloatingOrbs` component in `Login.jsx` — ~40 LOC, copy verbatim).
- Soft white radial wash at 50/50 lifts the card above the orbs.
- A subtle SVG turbulence noise layer (`mix-blend-mode: overlay`, 0.35 opacity) adds premium grain.

**Card contents, top to bottom:**
1. `<h1>` "Sign in to Ergon" — 26/600/#0A2540/-0.5px tracking.
2. Subtitle "Access the U.S. Propane Market Map" — 14/400/#697386.
3. Google SSO button — full width, white, 1px `#E3E8EE` border, `--r-md`, 10×14 padding, 13/500, with 16×16 Google "G" SVG.
4. Microsoft SSO button — same chrome, with the 4-square Microsoft mark.
5. Divider "OR WITH EMAIL" — 11/500/uppercase/tracking 0.6, 1px hairlines either side.
6. Email field + Password field — 14px input, 1px `#E3E8EE` border, `--r-md`, 9×12 padding. Label 12/500/#425466 above.
7. "Forgot?" link on the password label row — 12/500/`--indigo-600`.
8. "Keep me signed in" checkbox — 13px row, indigo accent.
9. Primary **Continue** button — full width, `--indigo-600`, white text, 14/500, `--r-md`, 10×14 padding, subtle inset highlight shadow.
10. Footer line — "Single sign-on (SSO) · Use security key" — 12/400/#8B97A8.

**States:** hover dims SSO buttons to `#F8FAFC`; Continue hover → `--indigo-700`; input focus → 1px `--indigo-500` border + 3px `rgba(99,102,241,0.15)` ring.

---

### 2. App Chrome (`reference-ui-kit/Header.jsx` + `Sidebar.jsx`)

**Purpose:** Persistent shell around every authenticated screen.

**Top header** (56px tall, white, 1px bottom border `--slate-200`):
- Left: 28×28 indigo logo mark + "Ergon" wordmark, plus muted "Market Intelligence" subtitle.
- Center: global search bar — 420px wide, `--slate-50` background, `--r-md`, `⌘K` hint pill right-aligned inside.
- Right: notifications bell with red dot, 32×32 avatar circle, user name + role stacked.

**Left sidebar** (240px wide, `--slate-50` background, 1px right border):
- Logo section at top reuses the header mark + wordmark.
- Section label "WORKSPACE" in uppercase small-caps — 11/600/0.06em tracking/#94A3B8.
- Nav items: Dashboard, Market Map (active), League Table, Deal Pipeline, Reports.
- Active item: `--indigo-50` background, `--indigo-700` text, 4px left `--indigo-600` accent stripe.
- Inactive hover: `--slate-100` background.
- Section divider + "RECENT" label + 3 recent-item rows (mono-styled deal IDs).
- Bottom: collapsible footer with help, settings, version pill.

---

### 3. League Table (`reference-ui-kit/LeagueTable.jsx`)

**Purpose:** Sortable ranking of market participants by any metric (gallons, locations, deals).

**Layout:** Full-width card, white, `--r-lg`, `--shadow-sm`. Table header 48px tall. Rows 56px, 1px bottom border `--slate-200`, hover `--slate-50`.

**Columns:**
1. Rank — 48px wide, center, mono 14/500, `--slate-400` for positions 4+.
2. Company — avatar (32×32 rounded square, brand color) + company name (14/600) + subtitle (12/400/#64748B).
3. Region — text pill, `--slate-100` bg, `--r-full`, 11/500.
4. Gallons (mono, right-aligned, tabular-nums).
5. Locations (mono, right-aligned).
6. Δ YoY — colored pill: green `--emerald-500` + up-arrow for positive, red for negative.
7. Actions — three-dot menu trigger (28×28 ghost button).

Sortable column headers show chevron on active sort; clicking toggles asc/desc. Sticky header on scroll.

---

### 4. Map Panel (`reference-ui-kit/MapPanel.jsx`)

**Purpose:** Geographic view of assets (terminals, plants, delivery routes).

**Layout:** Full-bleed map canvas with floating chrome:
- Top-left: search-locations input (same style as global search but map-scoped).
- Top-right: layer toggle menu — card with checkbox rows (Terminals / Plants / Pipelines / Delivery zones / Competitors), icons in brand colors.
- Bottom-left: legend card with colored dot swatches.
- Bottom-right: zoom controls (+/−, reset, fullscreen) — vertical stack of 40×40 white buttons, `--shadow-md`.

**Note:** the reference SVG mock is visual-only. Restyle the chrome around the existing Leaflet integration; don't replace Leaflet.

---

### 5. Profile Panel (`reference-ui-kit/ProfilePanel.jsx`)

**Purpose:** Right-slide-over drawer for a single company/asset detail.

**Layout:** 420px wide, slides in from right, white, 1px left border, `--shadow-md`.
- Header: 32×32 avatar + company name + region pill + close (×) button. 24px padding.
- Tab bar: Overview / Financials / Assets / History / Notes — 12/500, active has 2px bottom `--indigo-600` underline.
- Body sections (stacked, 24px gap):
  - **Key metrics** — 2×2 grid of stat cards (value 24/600, label 12/400/#64748B).
  - **Locations** — list rows with mono coordinates.
  - **Recent activity** — timeline entries with dot + date + event copy.
  - **Attachments** — file-row list.

---

### 6. Pro-Forma Modal (`reference-ui-kit/ProForma.jsx`)

**Purpose:** Deal modeling interface — editable financial projections on a candidate acquisition.

**Layout:** Full-screen modal, `--slate-950` header bar, white body.
- **Header bar** (64px, `--slate-950` bg, white text): deal name + close button.
- **Hero stats strip** (80px, white bg): 4 large KPIs — Deal value, Multiple, IRR, Payback — each 32/600 number, violet accent (`--indigo-500`) on the active one.
- **Tabs:** Assumptions / Projections / Sensitivity / Sources.
- **Assumptions body:** 2-column form — left column inputs (mono-styled numeric fields), right column live preview chart.
- Primary action: "Save scenario" — `--indigo-600` button bottom-right. Secondary "Cancel" ghost.

---

## Iconography

The design uses **Lucide icons** (`https://lucide.dev`) as the default system — install `lucide-react` if on Path B, or ship the SVGs statically for Path A. Icons sized 16px in dense UI, 20px in nav, 24px in headers. Stroke width 1.75 consistently. Color inherits from text.

Unicode glyphs (⌘, →, ·) are fine for small chrome accents but use real SVG icons for anything semantic.

---

## Interactions & Behavior

- **Transitions:** 150ms `ease-out` for hover/focus; 200ms `cubic-bezier(0.16, 1, 0.3, 1)` for panel slides; 300ms for modal fade+scale.
- **Focus rings:** 3px `rgba(99,102,241,0.2)` outside the element border. Never remove.
- **Keyboard:** ⌘K opens global search. Esc closes modals/panels. Tab order follows visual order.
- **Loading:** use skeleton rows (animated `--slate-100` → `--slate-200` shimmer) matching the final row height. No spinners in-table.
- **Empty states:** centered illustration placeholder + single-line explanation + one CTA.

---

## Files in this Package

```
design_handoff_ergon_redesign/
├── README.md                          ← you are here
├── design-system-spec.md              ← full design-system documentation
├── design-tokens/
│   └── colors_and_type.css            ← drop into static/css/
├── reference-ui-kit/                  ← working HTML/JSX prototypes
│   ├── index.html                     ← open this to see all screens live
│   ├── Login.jsx
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── LeagueTable.jsx
│   ├── MapPanel.jsx
│   ├── ProfilePanel.jsx
│   ├── ProForma.jsx
│   ├── mockData.js
│   └── README.md
└── assets/
    ├── logo.svg                       ← placeholder mark — replace if real logo exists
    └── wordmark.svg
```

**Open `reference-ui-kit/index.html` in a browser** to see every screen rendered with mock data. Use the left sidebar in that prototype to switch between Login, App, League Table, Map, Profile, and Pro-Forma views.

---

## Implementation Checklist

### Phase 1 — Tokens (1–2 days)
- [ ] Drop `colors_and_type.css` into `static/css/` and import it globally
- [ ] Add Inter + IBM Plex Mono to `<head>` via Google Fonts
- [ ] Audit existing `styles.css`; replace color literals with `var(--…)` references
- [ ] Ship. Existing layouts will already look closer to the target.

### Phase 2 — Login (1 day)
- [ ] Restyle `/login` template using new tokens
- [ ] Port the `FloatingOrbs` animation from `Login.jsx` (~40 LOC of vanilla JS — no React needed)
- [ ] Wire SSO buttons to existing auth endpoints

### Phase 3 — App chrome (2–3 days)
- [ ] Restyle sidebar + top header per spec
- [ ] Update nav-item active/hover states
- [ ] Global ⌘K search

### Phase 4 — Screen-by-screen (ongoing)
- [ ] League table
- [ ] Map panel (keep Leaflet core; restyle chrome only)
- [ ] Profile slide-over
- [ ] Pro-forma modal

Each phase ships independently. No big-bang cutover required.

---

## Contact / Questions

If the developer hits something ambiguous, the `reference-ui-kit/` prototypes are authoritative — what the HTML renders is the intended behavior. For anything not covered here, ask the design owner.
