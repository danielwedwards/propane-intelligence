# Handoff: Propane Intelligence — Full Redesign (v2)

**For the developer using Claude Code:** This package contains everything you need to rebuild Ergon's internal propane market intelligence tool at production quality. Start by opening `reference-prototype/index.html` in a browser — that's the spec. Then read this README end-to-end before writing code.

---

## 1. Overview

**Product:** Propane Intelligence — Ergon's internal tool for U.S. propane-industry corporate development (M&A sourcing, competitive intelligence, market sizing, pro-forma modeling against the Lampton Love platform).

**Users:** ~8–15 corp-dev analysts, VPs, and leadership at Ergon, Inc. Used daily during active deal flow, weekly for market monitoring.

**Scope of this redesign:**
- Full visual refresh — Stripe-indigo direction (deep ink + indigo primary + airy slate).
- Two login variants (centered card, split-screen).
- Nine primary dashboard views, all accessible from a persistent left rail.
- Cross-cutting: top nav, command palette (⌘K), company detail slideover, compare mode.
- New **News** feature — a dedicated deal-trigger news feed wired into the sidebar, the command palette, and the company-detail slideover.

**What this is not:** a new backend, a new data model, or a new mapping engine. The Leaflet integration in production stays; you're restyling the chrome around it.

---

## 2. About the Design Files

The files in `reference-prototype/` are **design references built in HTML + React (via Babel-standalone)** — working prototypes that demonstrate the intended look, layout, and interaction for every screen. They are **not production code to copy verbatim.**

Your task is to **recreate these designs inside Ergon's existing codebase** (or the best framework choice if Ergon is rebuilding this tool from scratch), using the team's established patterns. The reference JSX is the visual + interaction spec; the tokens in `design-tokens/tokens.css` are the authoritative values.

**To view the prototype:** serve `reference-prototype/index.html` over any static server (`python -m http.server`, `npx serve`, VS Code Live Server). Opening via `file://` will not work — Babel-standalone needs same-origin script loading.

The prototype uses:
- React 18 via UMD + Babel-standalone (in-browser transpilation; dev-only).
- No build step. No bundler. No package.json.
- Mock data in `reference-prototype/mockData.js` (13 propane companies, realistic but fictional).
- News articles in `reference-prototype/News.jsx` (25 articles, also fictional).

Your production build should use a real toolchain (Vite + React, Next.js, or whatever Ergon's existing stack is).

---

## 3. Fidelity

**High-fidelity.** Colors, typography, spacing, radii, shadows, motion curves, and component treatments are final. Match pixel-for-pixel where practical.

**Explicit placeholders called out for replacement:**
- The map view is an SVG mock with a stylized U.S. outline. Production uses **Leaflet** — restyle Leaflet's controls/tiles to match; don't try to reproduce the SVG.
- Analytics charts are hand-drawn SVG. Production should use **Recharts** or **Visx** with the data-viz tokens from `tokens.css` (`--r-viz-1` through `--r-viz-6`).
- The "AI weekly digest" card on the News view contains placeholder summary text. In production, back it with a call to your summarization pipeline (Anthropic API or equivalent).
- Avatars on the company table show initials on a colored tile — keep this; do not add photo uploads.
- News articles are fictional. See §8 for real ingestion guidance.

---

## 4. Implementation Paths

Pick one based on Ergon's current codebase state:

### Path A — Incremental refactor (recommended if existing Flask/Jinja app)
1. Drop `design-tokens/tokens.css` into `static/css/` and import globally.
2. Add Inter + IBM Plex Mono to `<head>` via Google Fonts (see §5).
3. Restyle screen-by-screen. Each JSX file in `reference-prototype/` maps to one screen.
4. Keep Leaflet. Restyle its controls using the token values.
5. Ship phases independently — no big-bang cutover.

### Path B — Full rewrite to React + Vite
1. `npm create vite@latest propane-intelligence -- --template react-ts`
2. Copy `design-tokens/tokens.css` into `src/styles/`.
3. Port each JSX file from `reference-prototype/` into proper `.tsx` components under `src/components/`. Split large files (Views1/2/3) by the component boundaries indicated in the files' headers.
4. Replace mock data fetches with real API calls.
5. Replace inline styles with either CSS modules, Tailwind, or styled-components — pick one and be consistent.

Path A gets 80% of the visual upgrade for 20% of the engineering effort and is what I recommend unless there's another reason to rewrite.

---

## 5. Design System

All authoritative values live in `design-tokens/tokens.css` as CSS custom properties. **Use variables everywhere** — do not introduce color or size literals in component code.

### 5.1 Colors

**Brand — Stripe indigo** (primary CTAs, active nav, focus rings, selected state)
| Token | Hex |
|---|---|
| `--r-indigo` | `#635BFF` |
| `--r-indigo-600` | `#5851E5` |
| `--r-indigo-700` | `#4B45B8` |
| `--r-indigo-100` | `#E0E3FF` |
| `--r-indigo-50` | `#EEF0FF` |

**Ink — deep slate** (primary text, dark chrome)
| Token | Hex |
|---|---|
| `--r-ink` / `--r-text` | `#0A2540` |
| `--r-ink-80` | `#1A365D` |
| `--r-ink-60` / `--r-text-2` | `#425466` |
| `--r-text-3` | `#697386` |
| `--r-text-4` | `#8B97A8` |

**Surfaces**
| Token | Hex | Use |
|---|---|---|
| `--r-bg` | `#FFFFFF` | cards, panels |
| `--r-bg-app` | `#F6F9FC` | page background |
| `--r-bg-subtle` | `#F7FAFC` | hover states, inner surfaces |
| `--r-border` | `#E3E8EE` | default 1px borders |
| `--r-border-strong` | `#C1CCD6` | emphasized borders |
| `--r-divider` | `#EDF1F6` | table/list row dividers |

**Semantic**
| Token | Hex | Use |
|---|---|---|
| `--r-green` | `#009966` | positive deltas, success |
| `--r-amber` | `#C4862D` | warnings, "signal" badges |
| `--r-red` | `#D83E4A` | negative deltas, alerts |
| `--r-cyan` | `#00D4FF` | info, secondary highlights |

Each semantic color has a `-50` variant (`--r-green-50` = `#E6F6F0`, etc.) for tinted backgrounds.

**Data-viz sequence** (for charts — use in this order)
`--r-viz-1` `#635BFF` · `--r-viz-2` `#00D4FF` · `--r-viz-3` `#FF5996` · `--r-viz-4` `#F5A623` · `--r-viz-5` `#4ECDC4` · `--r-viz-6` `#AB87FF`

### 5.2 Typography

**Fonts** (load via Google Fonts in `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Inter** — all UI text. Weights 400 (body), 500 (labels, buttons), 600 (headings), 700 (emphasis).
- **IBM Plex Mono** — all numeric/tabular data, identifiers, coordinates, deal IDs, keyboard shortcuts. Weights 400/500.

**Scale** (fluid-ish, but use these steps):
| Role | Size / line-height | Weight | Tracking |
|---|---|---|---|
| Hero display (login, section intros) | 32 / 40 | 600 | -0.5px |
| Page title | 24 / 32 | 600 | -0.3px |
| Panel title | 20 / 28 | 600 | -0.2px |
| Card/metric number | 20–28 / — | 600 | -0.2px |
| Default body | 14 / 20 | 400 | -0.01em |
| Button / label | 13 / 18 | 500 | -0.01em |
| Small caption | 12 / 16 | 400 | 0 |
| Uppercase section label | 11 / — | 600 | 0.6px, `text-transform: uppercase` |
| Mono data | 12–14 / — | 400–500 | tabular-nums |

### 5.3 Spacing

4px base unit. Use these steps: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80**. Do not improvise in-between values. Most component internal padding: 16–24px. Most page gutters: 24–32px.

### 5.4 Radii

| Token | Value | Use |
|---|---|---|
| `--r-radius-sm` | 4px | inputs, small chips |
| `--r-radius` | 6px | buttons, cards |
| `--r-radius-lg` | 8px | panels |
| `--r-radius-xl` | 12px | modals |
| `--r-radius-full` | 9999px | pills, avatars |

### 5.5 Shadows

| Token | Value | Use |
|---|---|---|
| `--r-shadow-xs` | `0 1px 2px rgba(10,37,64,0.04)` | inputs |
| `--r-shadow-sm` | `0 2px 4px rgba(10,37,64,0.04), 0 1px 2px rgba(10,37,64,0.03)` | cards |
| `--r-shadow` | `0 4px 8px rgba(10,37,64,0.06), 0 2px 4px rgba(10,37,64,0.04)` | popovers |
| `--r-shadow-lg` | `0 15px 35px rgba(10,37,64,0.08), 0 5px 15px rgba(10,37,64,0.05)` | slideovers |
| `--r-shadow-xl` | `0 25px 50px rgba(10,37,64,0.12), 0 10px 20px rgba(10,37,64,0.06)` | modals |

### 5.6 Focus ring
Always: `--r-ring` = `0 0 0 3px rgba(99,91,255,0.20)`. Never remove outlines without replacing with this.

---

## 6. Screens

The prototype is structured as a single-page app with 9 dashboard views, a login surface, and cross-cutting chrome. File-to-component mapping:

| Reference file | Contains |
|---|---|
| `shared-ui.jsx` | Icon, Badge, Button, Input, Tabs, ProgressBar, StatCard, Tooltip — atoms used everywhere |
| `Chrome.jsx` | TopNav, SideNav, PageHeader — persistent app shell |
| `Logins.jsx` | LoginV1 (centered), LoginV2 (split) |
| `Views1.jsx` | MarketMapView, CompanyListView |
| `Views2.jsx` | AnalyticsView, SignalsView, FitView |
| `Views3.jsx` | OverlapView, NetworkView, BriefView, CompanyDetail, CompareView |
| `News.jsx` | NewsView, CompanyNewsStrip, NEWS_ARTICLES mock data |
| `App.jsx` | Dashboard (top-level route), CommandPalette |

Below, per-screen specs.

### Chrome (persistent on every authenticated screen)

**TopNav** — 56px tall, white, 1px bottom border `--r-border`.
- Left: 28×28 indigo logo square with white lightning/flame mark + "Propane Intelligence" wordmark.
- Center: global search — 420px, `--r-bg-subtle` background, `--r-radius` corners, `⌘K` hint pill right-aligned. Clicking opens the command palette (not a live-typing input — the palette takes focus).
- Right: notifications bell with red dot (unread count), 32×32 avatar circle with initials, user name + "Corp-dev lead" stacked.

**SideNav** — 240px wide, `--r-bg-subtle` background, 1px right border.
- "PROPANE INTELLIGENCE · Corp-dev workspace" label at top.
- Nine nav items (icon + label + optional count badge):
  1. Market Map (`map` icon)
  2. Companies (`list`, count "247")
  3. Analytics (`chart`)
  4. M&A Signals (`signal`, count "18", accent indigo)
  5. News (`newspaper`, count "25")
  6. Strategic Fit (`target`)
  7. Competitor Overlap (`overlap`)
  8. Relationship Graph (`network`)
  9. Executive Brief (`brief`)
- Active state: `--r-indigo-50` bg, `--r-indigo` text, 3px left `--r-indigo` accent stripe.
- Hover: `--r-bg-subtle` bg shift.
- Bottom: "Saved views" section with 3 user-saved filter combinations.

**PageHeader** — inside each view, 72px tall, white, 1px bottom border.
- Left: title (24/600) + subtitle (13/400 muted).
- Right: context actions (filter, new analysis, compare if compare-mode has items).

### 1. Market Map (`MarketMapView`)

**Purpose:** geographic overview of all 1,247 tracked retailers.

**Layout:**
- Full-bleed map canvas (SVG mock; production = Leaflet).
- Top-left floating controls: layer toggles (Retailers / Terminals / Pipelines / Delivery zones / Ergon assets) as a card with checkbox rows.
- Top-right: search-within-map input.
- Bottom-left: legend card with colored dot swatches (Family, Private, PE-Backed, Public, Co-op, Ergon).
- Bottom-right: zoom + fullscreen stacked 40×40 white buttons.
- Clicking a map pin opens `CompanyDetail` slideover.

**Color coding** (company type, match the sidenav legend):
- Family `--r-indigo`, Private `#94A3B8`, PE-Backed `--r-amber`, Public `--r-cyan`, Co-op `--r-green`, Ergon (Lampton Love) `--r-ink`.

### 2. Companies (`CompanyListView`)

**Purpose:** sortable, filterable league table of all tracked companies.

**Layout:** full-width card, white, `--r-radius-lg`, `--r-shadow-sm`.
- Sticky table header (48px, `--r-bg-subtle` bg).
- Columns: Rank · Company (avatar + name + parent) · Type pill · Locations (mono, right-aligned) · States · Revenue ($M, mono) · Market share % · Signals (icon + count) · Compare checkbox.
- Rows 56px, 1px bottom `--r-divider`, hover `--r-bg-subtle`.
- Click row → opens `CompanyDetail` slideover.
- Checkbox → adds to compare tray (max 4).

### 3. Analytics (`AnalyticsView`)

**Purpose:** market-level trends — ownership mix, roll-up pace, pricing, regional splits.

**Layout:** 2-column responsive grid of chart cards.
- Top row: big hero KPIs — "4 of top 10 families have succession signals", "$2.8B trailing 12mo transaction volume", "17.4× median multiple".
- Below: line chart (roll-up pace over 10 years), stacked area (ownership mix evolution), horizontal bar (regional fragmentation index), small multiples (signal frequency by category).
- Data-viz tokens (`--r-viz-*`) for series colors.

### 4. M&A Signals (`SignalsView`)

**Purpose:** tracked trigger events — succession, recap rumors, leadership changes, bolt-on activity.

**Layout:**
- Header strip: "18 tracked signals this quarter · 4 high-urgency" summary.
- Filter chips: category (Leadership / Capital / Bolt-on / Regulatory / Pricing) × severity (High/Mid/Low).
- Signal cards in a 2-column grid: date stamp, category badge, severity pill, headline, affected company (clickable), short narrative, "View company →" link.
- Each card also shows a trendline spark of recent activity for that signal category.

### 5. News (`NewsView`) — NEW

**Purpose:** deal-trigger news feed. Industry news re-framed through an M&A-sourcing lens — every article is tagged with affected companies and an impact score.

**Layout (3 regions stacked vertically in the main column, right rail beside):**

**Region 1 — "Deal triggers this week"** (top strip):
- Horizontal row of 3 highest-impact cards (impactScore ≥ 70 from the last 7 days).
- Each card: source + timestamp, 2-line headline (15/600), summary (12/400, 3 lines max), company tags (pill-shaped, clickable → CompanyDetail), impact bar at bottom (fills left-to-right, indigo, shows numeric score).

**Region 2 — Search + filter bar:**
- Search input (~320px) left-aligned.
- Impact filter: 3 segmented pills (All / High / Mid / Low).
- Category chips: 8 options (All, M&A, Leadership, Capital, Regulatory, Expansion, Pricing, Litigation, Partnership). Active = `--r-indigo` bg + white text.

**Region 3 — Article feed:**
- Vertical list of full-width rows (each row is one article, ~96px tall).
- Row layout, left-to-right:
  - Left edge: 4px colored stripe keyed to category (see table below).
  - Impact score block (40px wide): numeric score stacked over a tiny horizontal bar.
  - Main: source + "·" + relative timestamp + category pill; headline (14/600); 1-line summary (12/400); company tags below; source link right-aligned.
- Hover row → `--r-bg-subtle` bg; actions (watch, save, open) appear.

**Right rail** (320px, appears on screens ≥ 1440px):
- **AI weekly digest** card — `--r-indigo-50` bg, `--r-indigo-100` border. Title "This week in propane M&A", 4-line summary, "Read full digest →" link. **Placeholder copy** — wire to your summarization pipeline in production.
- **Top sources** — list of 6 sources with article counts this week.
- **My alerts** — 4 named saved-search rows with unread counts ("Southeast family deals: 3 new").
- **Feed coverage** — small stat block: "43 sources · checked 14 min ago · 25 articles past 7 days".

**Category color key** (stripe + pill):
| Category | Color token |
|---|---|
| M&A | `--r-indigo` |
| Leadership | `--r-amber` |
| Capital | `--r-green` |
| Regulatory | `--r-ink-60` |
| Expansion | `--r-cyan` |
| Pricing | `#FF5996` (viz-3) |
| Litigation | `--r-red` |
| Partnership | `--r-viz-6` (`#AB87FF`) |

**`CompanyNewsStrip`** — a sub-component used inside `CompanyDetail`. Given a `companyId`, it filters `NEWS_ARTICLES` for articles tagged to that company, sorts by recency, and shows the 3 most recent as compact rows. Empty state: "No news matched in the trailing 90 days."

**Demo-time id bridge:** `News.jsx` defines `CANONICAL_TO_DEMO`, a map from production-style ids (`blossman_gas`) to the short ids used in the UI-kit mock roster (`blo`). **Delete this map in production** — real API responses will use consistent canonical ids.

### 6. Strategic Fit (`FitView`)

**Purpose:** rank all targets against the Lampton Love platform on strategic fit dimensions.

**Layout:**
- Header row: "Ranked against Lampton Love · adjust weights →" with a collapsible weights panel (sliders for geographic adjacency / customer mix / fleet synergy / systems compatibility / cultural fit).
- Ranked list: each row shows company name + composite score (0–100, mono, large) + horizontal stacked bar breaking the score into its 5 sub-components (data-viz colors) + "Why?" button that expands to show the reasoning.
- Top 3 rows get a gold/silver/bronze accent strip on the left edge.

### 7. Competitor Overlap (`OverlapView`)

**Purpose:** county-level service-area overlap between Ergon and any target.

**Layout:**
- Target picker (searchable combobox) at top.
- Left column: U.S. county choropleth, counties shaded by overlap intensity (no overlap = `--r-bg-subtle`, partial = `--r-indigo-100`, full = `--r-indigo`).
- Right column: overlap stats — "14 counties contested · 8 Ergon-dominant · 6 target-dominant · 23 whitespace", plus a county-by-county table.

### 8. Relationship Graph (`NetworkView`)

**Purpose:** visualize ownership, competition, and past-acquisition relationships across the industry.

**Layout:**
- Full-canvas force-directed graph (SVG in the mock; production = `d3-force` or `react-flow`).
- Node types: companies (sized by revenue), PE sponsors (`--r-amber`), public parents (`--r-cyan`).
- Edge types: owns (solid), competes with (dashed), acquired (arrowed, indigo).
- Sidebar: legend + filter controls (show/hide edge types, filter by region, year range for acquisitions).

### 9. Executive Brief (`BriefView`)

**Purpose:** quarterly printable summary for Ergon leadership.

**Layout:**
- Print-width column (880px centered, white, shadowed).
- Masthead: "Q2 2026 Propane Market Brief · Prepared for Ergon leadership".
- Sections: Executive summary (3 bullets) · Top 5 actionable signals (cards) · Market structure update · Notable transactions · Pipeline status · Appendix.
- Each section ends with a thin `--r-divider` line.
- Print CSS: `@media print { ... }` — hide chrome, force `break-inside: avoid` on section cards.

### Company Detail slideover (`CompanyDetail`)

Triggered by clicking any company row, map pin, or tag. 480px wide, slides in from right, `--r-shadow-lg`.
- Header: logo avatar + name + type badge + close (×).
- Tab bar: Overview / Financials / Locations / Signals / News / Notes.
- Overview body stacks:
  1. Key metrics (2×2 grid): Locations, Revenue, Employees, Market share.
  2. Profile paragraph.
  3. Signal activity (3 most recent entries with date + type pill).
  4. **Recent news** — uses `CompanyNewsStrip`. 3 most recent articles tagged to this company.
  5. Geo footprint map mini.
  6. Actions: "Add to compare" / "Start pro-forma" / "Save to watchlist".

### Compare mode (`CompareView`)

Triggered when ≥2 companies are checked in the list. Full-screen side-by-side:
- Columns: one per company (up to 4).
- Rows: each comparable metric, plus a "Signals" row and a "Recent news" row.
- Highlight the best value in each row.

### Command Palette (`CommandPalette`)

⌘K from anywhere. Modal, centered, 580px wide, dark backdrop (rgba(10,37,64,0.35) + 3px blur).
- Input at top with "esc" hint.
- Items: each view (with `View` badge), known companies (with `Company` badge), AI actions (with gradient `AI` badge).
- First item pre-highlighted. ↑↓ navigate, ↵ open.
- Footer: shortcut hints + "prefix `>` for actions, `@` for AI".

### Login — 2 variants

**V1 — Centered minimal** (`LoginV1`): 420px card on `#F6F9FC`, floating animated orbs background, SSO buttons above email form. See `Logins.jsx`. This is the preferred default.

**V2 — Split screen** (`LoginV2`): 50/50 split, left = login card (same contents as V1 but no orbs), right = dark indigo marketing panel with product value props + screenshot. Use if marketing wants to lean into "premium platform" positioning.

---

## 7. Interactions & Motion

- **Transitions:** 150ms `ease-out` for hover/focus. 200ms `cubic-bezier(0.16, 1, 0.3, 1)` for panel slides. 300ms fade+scale for modals.
- **Focus rings:** `--r-ring` on every interactive element. Never remove.
- **Keyboard:** ⌘K opens palette. Esc closes modals/slideover. Tab order follows visual order. Arrow keys navigate palette and compare cells.
- **Loading:** skeleton rows (animated `--r-bg-subtle` → `--r-border` shimmer) matching final row height. No spinners inside tables.
- **Empty states:** centered muted illustration + 1-line explanation + single CTA.
- **Hover on tables:** row bg shifts to `--r-bg-subtle`; action buttons fade in at right edge.
- **Clickable company tags:** any pill-shaped company reference anywhere in the app opens the `CompanyDetail` slideover. This is a product-wide invariant.

---

## 8. News — Engineering Integration Notes

The News feature needs a real data pipeline. The mock in `News.jsx` is structured to match what the API should return.

**Article schema** (each row in the feed):
```ts
interface NewsArticle {
  id: string;              // 'n_001' format fine
  headline: string;
  source: string;          // display name e.g. "LP Gas Magazine"
  sourceUrl: string;       // domain only e.g. "lpgasmagazine.com"
  url?: string;            // deep link to full article
  publishedAt: string;     // ISO 8601
  companyIds: string[];    // canonical company ids
  category: 'ma' | 'leadership' | 'capital' | 'regulatory'
          | 'expansion' | 'pricing' | 'litigation' | 'partnership';
  summary: string;         // 1–3 sentences
  impactScore: number;     // 0–100, classifier output
  isBreaking: boolean;     // surfaces the breaking badge + push notification
  readMinutes: number;
  thumbnail?: string;      // optional image url
}
```

**Suggested pipeline:**
1. **Ingestion worker** (runs hourly): pulls from ~40 trade RSS feeds (LP Gas Magazine, Butane-Propane News, Propane Canada, NPGA updates, OPIS), NewsAPI general feed filtered by industry keywords, SEC EDGAR Form D/8-K filings, and PE Hub announcements.
2. **Entity linker:** for each raw article, run name + alias + domain matching against the `companies` table to populate `companyIds[]`. Use simple fuzzy matching (Levenshtein ≤ 2) on canonical name + a hand-curated alias list per company.
3. **Classifier:** short-text classifier (fine-tuned small LM or rules + keyword scoring) to assign `category` and compute `impactScore`. Impact-score features that work: `category_weight × source_credibility × company_tier × recency × keyword_match_count`. Train on ~500 manually-scored articles; retrain quarterly.
4. **Breaking path:** for category='ma' + impactScore ≥ 85 + source in trusted-tier list, push to webhook → in-app notification + email alert.
5. **Storage:** Postgres table, indexed on `(published_at DESC)` and `GIN(company_ids)` for company-strip queries.

**API endpoints the UI calls:**
- `GET /api/news?limit=25&since=...&category=...&impact=...&q=...` → paginated feed
- `GET /api/news/by-company/:companyId?limit=3` → company-detail strip
- `GET /api/news/digest/weekly` → summarized text for the AI digest card (back with a single Claude/Anthropic call once weekly, cache result).

**Refresh cadence:**
- UI polls feed every 5 min while News view is mounted (websocket preferred if you have one).
- Digest regenerates every Monday 6am.
- Saved-search alerts: count unread deltas server-side, poll every minute.

**Removing the demo bridge:** `News.jsx` contains a `CANONICAL_TO_DEMO` object that maps `blossman_gas` → `blo` etc. This only exists because the UI-kit's mock roster uses short ids. **Delete this map and the `resolveId()` function entirely** once your API returns canonical ids consistently on both sides.

---

## 9. State Management

The prototype uses plain `useState` hooks. For production, most state fits in URL params + React Query:

- **URL-owned state:** `view` (which of the 9 views is active), `selected` (company id in slideover), `q` (search query), active filter chips. Use `?view=news&company=blossman_gas&category=ma`.
- **Server state (React Query or SWR):** company list, signals, news articles, fit scores. Stale-while-revalidate 60s.
- **Local state:** compare tray (max 4 company ids — localStorage so it persists across reloads), recent searches, saved views.
- **User settings (server):** saved filter combinations, alert subscriptions, digest preferences.

---

## 10. Assets

- `assets/` — placeholder folder. The prototype uses CSS-drawn logo marks (a 28×28 indigo square with a white glyph). If Ergon has a real logomark file, drop it into `static/images/` in the target app and swap the CSS div for an `<img>`.
- Icon system: **Lucide** (https://lucide.dev). The prototype hand-rolls a minimal subset in `shared-ui.jsx` → `Icon` component. For production install `lucide-react` and replace. Icon sizes: 16px dense, 20px nav, 24px headers. Stroke width: 1.75.
- Fonts: Google Fonts (Inter + IBM Plex Mono). No self-hosted font files shipped.

---

## 11. Files in this Package

```
design_handoff_propane_intelligence_v2/
├── README.md                           ← you are here
├── design-tokens/
│   ├── tokens.css                      ← authoritative design tokens (USE THIS)
│   └── colors_and_type.css             ← broader typography + color scale from the design system
└── reference-prototype/                ← working HTML/JSX prototype
    ├── index.html                      ← open this in a static server to see everything
    ├── design-canvas.jsx               ← pan/zoom canvas host (not production)
    ├── shared-ui.jsx                   ← atoms (Icon, Badge, Button, Input, etc.)
    ├── Chrome.jsx                      ← TopNav + SideNav + PageHeader
    ├── Logins.jsx                      ← LoginV1, LoginV2
    ├── Views1.jsx                      ← MarketMap + CompanyList
    ├── Views2.jsx                      ← Analytics + Signals + Fit
    ├── Views3.jsx                      ← Overlap + Network + Brief + CompanyDetail + Compare
    ├── News.jsx                        ← NewsView + CompanyNewsStrip + 25 mock articles
    ├── App.jsx                         ← Dashboard shell + CommandPalette
    └── mockData.js                     ← 13 propane companies (realistic but fictional)
```

---

## 12. Implementation Checklist

**Phase 1 — Foundation (1–2 days)**
- [ ] Drop `design-tokens/tokens.css` into app. Import globally.
- [ ] Add Inter + IBM Plex Mono via Google Fonts.
- [ ] Rebuild the Icon component using `lucide-react` with stroke-width 1.75.
- [ ] Restyle buttons, inputs, badges to match `shared-ui.jsx`.

**Phase 2 — Chrome (1–2 days)**
- [ ] TopNav (56px, brand + search trigger + notifications + avatar).
- [ ] SideNav with all 9 nav items + correct counts.
- [ ] Command Palette (⌘K, with view + company + AI sections).

**Phase 3 — Views (1–2 days per view)**
- [ ] Market Map — restyle Leaflet controls with tokens.
- [ ] Companies — sortable table + compare checkboxes.
- [ ] Analytics — Recharts with `--r-viz-*` palette.
- [ ] M&A Signals — filter chips + signal cards.
- [ ] **News** — see §8 for pipeline, then UI per §6.
- [ ] Strategic Fit — weights sidebar + ranked list with stacked bars.
- [ ] Competitor Overlap — county choropleth.
- [ ] Relationship Graph — `react-flow` or `d3-force`.
- [ ] Executive Brief — print-optimized layout.

**Phase 4 — Cross-cutting (2–3 days)**
- [ ] Company Detail slideover (6 tabs, including News).
- [ ] Compare mode.
- [ ] Saved views, alerts, digest.

**Phase 5 — Polish**
- [ ] Loading skeletons everywhere.
- [ ] Empty states for every list.
- [ ] Keyboard shortcut coverage.
- [ ] Print styles on Executive Brief.

Each phase ships independently. Prioritize Chrome → Companies → News → Market Map for the first user-visible release; the rest follows.

---

## 13. Questions?

When something is ambiguous, **the prototype is authoritative** — what `index.html` renders is the intended behavior. For anything not covered in this README, ask the design owner (Claude, via the same thread that produced this handoff) or file a question on the design's source project.

Good luck.
