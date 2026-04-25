# Restoration Plan — Propane Intelligence v2

**Goal:** Restore every working feature from `us-propane-market-map` (v1) inside the new "Propane Intelligence" v2 design. The v2 visual design stays exactly as-is; the v1 *functionality* gets reconstructed underneath each of the 9 views.

## 0. Where the v1 functionality lives now (so we know what to mine)

| v1 feature | v1 file (line range) | v2 destination |
|---|---|---|
| Leaflet map + tiles + canvas renderer | `index.html` 1653–1668 | `js/Views1.jsx` → `MapCanvas` (replace SVG) |
| Marker cache + `updateMap()` | 1688–1748 | new `js/MapEngine.jsx` |
| County GeoJSON layer + state mask | 1393–1432, 1771–1789 | `js/MapEngine.jsx` |
| Cluster toggle (MarkerClusterGroup) | 1751–1768 | `js/MapEngine.jsx` |
| Filter pills (ownership/type/region/state) | 864–930 | `js/Views1.jsx` → `MarketMapView` filter sidebar |
| Search box (multi-field) | 866, 1494–1520 | `js/Views1.jsx` + `js/Views1.jsx` Companies header |
| URL hash persistence | 1477–1492 | `js/App.jsx` (new `useURLState` hook) |
| Company detail panel | 1951–2118 | `js/Views3.jsx` → `CompanyDetail` (replace mock) |
| `computeMarketShare()` (county-weighted) | 1287–1323 | new `js/scoring.js` |
| `proxScores` (distance to nearest LL) | 1245–1265 | `js/scoring.js` |
| ECharts ownership pie + location bars | 2651–2704 | `js/Views2.jsx` → `AnalyticsView` |
| Acquisition platform / pro-forma | 2205–2254 | `js/Views3.jsx` → `CompareView` + `FitView` |
| Login overlay | 389–450, 2400–2421 | already done — `js/Logins.jsx` |
| `companies.json` fetch | 2724 | already done — `index.html` adapter |
| `counties_national.json` + geojson fetch | 2725, 1417, 2756–2759 | `js/MapEngine.jsx` (lazy) |

## 1. What to build, in execution order

### Phase 1 — Data foundation (½ day)

**Why first:** every downstream view depends on richer adapted data than the current shim provides. Right now the adapter loses ownership detail, fakes revenue, and drops the `locations` array from rendering paths.

**Files:** `index.html` (adapter block), new `js/scoring.js`

1. **Rewrite the data adapter** (`index.html` lines ~75–120) so it preserves every field v1 used: `id`, `name`, `parentGroup`, `hqCity`, `hqState`, `ownership`, `ownerDetail`, `states`, `seLocs`, `totalLocs`, `excluded`, `locations[]` (with `lat/lng/city/state/address`), `description`, `phone`, `estRevenue`, `employeeCount`, `yearFounded`, `companyType`, `keyPersonnel`, `serviceTypes`. Stop synthesising fake `rev`/`emp`/`mkt`; expose `c.estRevenue` directly as `rev` (fall back to `null` not a fake number). Views must render "—" when null instead of "$0.0M".
2. **Anchor-merge logic:** the 13 demo IDs (`ll`, `blo`, `ami`, …) must alias to their real counterparts in `companies.json` (e.g. `ll` ↔ `lampton_love`, `blo` ↔ `blossman_gas`). Build a `DEMO_TO_REAL` map and *replace* the demo entry's stats with real `totalLocs`/`states`/`locations` while keeping the short `id` so `News.jsx` `CANONICAL_TO_DEMO` and `MarketMapView` hard-coded positions still match.
3. **Create `js/scoring.js`** (new file, ~150 lines) hosting:
   - `haversine(a, b)` — great-circle distance helper
   - `computeProxScores(companies, anchorId='ll')` — for each company, distance from each location to nearest anchor location → returns `{ [id]: { mean, min, locsWithin50mi, locsWithin100mi } }`
   - `computeCountyOverlap(companies, anchorId='ll')` — for each company, set of FIPS counties shared with anchor → returns `{ [id]: { sharedCounties:Set, count, pct } }`
   - `computeMarketShare(companies, countyMetrics)` — weights each company's locations by county gallon consumption from `counties_national.json` → returns `{ [id]: { national, byState:{}, byRegion:{} } }`
   - `computeFitScore(c, weights)` — composite of geo/size/ops/culture/financial/integration buckets; returns 0–100. Default weights from the v2 design spec (25/20/15/15/15/10).
   - All four memoised on a `(companyIds.join('|'))` cache key.
4. **Wire scoring into the data adapter** so `c.proxScore`, `c.countyShared`, `c.fitScore`, and `c.marketShare` are attached to every company before any view renders. This is the single biggest unlock: every other phase can read these fields directly.

**Acceptance:** `window.MOCK_COMPANIES[i].fitScore` is a real number 0–100 for all ~1,400 companies. `window.MOCK_COMPANIES.find(c => c.id === 'll').locations.length === <real LL location count>`.

### Phase 2 — Market Map (Leaflet) — the big swap (1–1½ days)

**Files:** new `js/MapEngine.jsx`, edit `js/Views1.jsx` (`MarketMapView`, replace `MapCanvas`), `index.html` (already loads Leaflet CSS/JS).

1. **Create `js/MapEngine.jsx`** as the bridge between React and Leaflet. Single component `<LeafletMap />` that takes props: `companies`, `filters`, `selectedId`, `colorMode`, `clusterOn`, `countyOn`, `onSelect`. Inside:
   - One `useEffect([])` that runs *once* to instantiate `L.map()` with `preferCanvas:true`, CartoDB Light tile layer, default center/zoom from old CONFIG.
   - One `useEffect([companies])` that builds `_markerCache` keyed by `company.id` (port v1 lines 1688–1715).
   - One `useEffect([filters, colorMode, clusterOn])` that runs `updateMap()` — toggles marker visibility, swaps colors, switches between `L.layerGroup` and `L.markerClusterGroup` (port v1 1717–1768). Use `MarkerClusterGroup` from `leaflet.markercluster` (add CDN link in `index.html`).
   - One `useEffect([countyOn])` that lazy-fetches `data/counties_national_simple.geojson` on first toggle, builds the choropleth layer with the state mask logic (port v1 1393–1432).
   - On unmount: `map.remove()`.
   - LL marker = 6 px purple ring (`#7C5CFC`), competitors = 3.5 px circle, color from `OC[ownership]`. Tooltip on hover, `onSelect(id)` on click with `L.DomEvent.stopPropagation`.
2. **Replace `MapCanvas` in `js/Views1.jsx`** with `<LeafletMap />`. Drop the SVG `viewBox`/path mock entirely.
3. **Wire the existing v2 filter sidebar** (the `FilterBlock` rows) to real state, then pass that state down. Each FilterBlock currently has a hard-coded `value` prop — replace with controlled state in `MarketMapView`:
   - Geography: pill row (All US / SE / NE / MW / SC / W) — drives `filters.region`.
   - Ownership: keep checkboxes, drive `filters.ownership` Set.
   - Revenue / Locations / Fit-score sliders: real dual-thumb range, drive `filters.revRange` / `filters.locRange` / `filters.fitRange`.
   - Replace the placeholder M&A Signals chips with a multi-select Set.
   - Add the "Platform Only" + "Hide Excluded" + "Hide Lampton Love" v1 checkboxes at the bottom.
4. **Filter function** lives in `js/scoring.js` as `applyFilters(companies, filters, search)`; matches v1 `fil()` (1494–1520). Returns the filtered array; `<LeafletMap />` consumes it directly.
5. **Map controls (top-right of map):** add the v1 controls inside the existing v2 toolbar slot:
   - Color-mode toggle (By company / By ownership) — port `setMapColorMode()` (1663–1671).
   - Cluster toggle (port `toggleCluster()` 1751–1768).
   - County overlay toggle (port `toggleCounty()` 1771–1789).
   - Keep the existing v2 "Map / List / Grid" segmented control — wires to `setView`.
6. **Legend (bottom-left card):** wire the counts to the live filtered company list, not the hard-coded `[1, 8, 24, 142, 18, 54]`.

**Acceptance:** zooming to MS shows real LL locations; filtering ownership = Family hides everything else; clicking a marker fires `onSelect(id)` → `<CompanyDetail/>` slideover opens with that company.

### Phase 3 — Companies view (½ day)

**Files:** `js/Views1.jsx` `CompanyListView` + `CompaniesTable`.

1. **Real columns:** swap mock `fitScore = total*2 + 30 - rank` for `c.fitScore` from Phase 1. Swap mock `signal` for `c.signals?.[0]?.label || '—'` (signals data lands in Phase 7; until then read from a `data/signals.json` stub).
2. **Sortable headers:** click a column header → toggles `sort` + `dir` state, drives a `sortedRows` memo. Port v1 sort logic.
3. **Real search:** the header search input drives a `q` state filtered through `applyFilters` (Phase 1). Match v1 fields (name, hqCity, hqState, ownerDetail, parentGroup, description, phone, states, keyPersonnel, serviceTypes).
4. **Real filter chips:** the row of `<Badge tone="outline">Family ×</Badge>` chips reads from a shared `filters` store (lift to `Dashboard` so Map filters carry over). Removing a chip clears that facet.
5. **Pagination or virtualisation:** ~1,400 rows is too many for one DOM dump. Use a simple windowed list — render only the first 60 rows, "Load more" button, or react-window if we want it nicer. v1 had no virtualisation; we need it now because the row count grew 5×.
6. **"X of 1,247" counter** in the header reads `filteredRows.length`/`totalCount`.

**Acceptance:** typing "Blossman" in the search filters to one row in <100 ms. Clicking the **Locations** header toggles ascending/descending. Filter chip "Family ×" actually toggles the `family` ownership filter.

### Phase 4 — Company Detail slideover (½ day)

**Files:** `js/Views3.jsx` `CompanyDetail`.

1. **Read real data** from `MOCK_COMPANIES.find(c => c.id === companyId)`, no more mock numbers. The current implementation has placeholder revenue/employees — pull them from `c.estRevenue`, `c.employeeCount`, `c.yearFounded`, `c.phone`.
2. **Locations sub-tab** (the v1 main feature this view lost): table of `c.locations[]` with name / city / state / address columns; clicking a row pans the underlying map to that lat/lng (passes `onLocate(lat, lng)` up to Dashboard → MapEngine).
3. **Score breakdown:** show the six fit-score buckets (Geography / Size / Ops / Culture / Financial / Integration) computed in Phase 1 — read `c.fitBreakdown` and render the existing v2 progress bars per bucket.
4. **Market share:** show `c.marketShare.national` (%) and a per-state list (`c.marketShare.byState`). Port v1 hover tooltip behaviour for score cells (1640–1650).
5. **Recent news:** find articles in `News.jsx` `MOCK_ARTICLES` whose `companies` array contains `c.id` (or its canonical alias). Render up to 3 with the existing `<NewsTeaserCard>`.
6. **Footprint chip row:** real `c.states.join(' · ')`, no truncation.

**Acceptance:** clicking Blossman Gas opens the slideover with 42 real Blossman locations listed, fit score bar reflects the computed score, and at least one Blossman article surfaces under "Recent News".

### Phase 5 — Analytics, Strategic Fit, Competitor Overlap (1 day)

**Files:** `js/Views2.jsx` `AnalyticsView`, `js/Views3.jsx` `FitView` + `OverlapView`.

1. **Analytics view:**
   - **Total market** = sum of `c.estRevenue`. Real number, not `$18.2B`.
   - **Companies tracked** = `MOCK_COMPANIES.length`.
   - **Platform share** = LL revenue / total revenue × 100.
   - **Addressable targets** = count where `c.fitScore > 50 && !c.excluded && c.id !== 'll'`.
   - **Top 6 operators stacked area** — drive from real `marketShare` per quarter; if quarterly history isn't in our data yet, use current snapshot replicated across quarters with a v1-style ±2 % jitter; mark as "synthetic trend (data Q3 2024+)".
   - **Roll-up pace bars** — wire to `data/signals.json` deal events grouped by quarter (signals data is built in Phase 7; until then leave the existing mock with a `data: 'preview'` badge).
   - **Ownership donut** — real counts from `MOCK_COMPANIES`. Already structured correctly; just feed it the real distribution.
   - **Top states by concentration** — group `MOCK_COMPANIES` by primary state, sum locations, render top 10.
2. **Strategic Fit:**
   - **Adjust weights drawer:** controls the `weights` argument to `computeFitScore` (Phase 1). Recomputes scores on slider release.
   - **Top 10 ranked targets table:** sort `MOCK_COMPANIES` by `fitScore` descending, exclude `ll` and `excluded`. Render with the existing six-bucket score row.
   - **Radar chart:** read the selected target's `c.fitBreakdown` six values directly.
3. **Competitor Overlap:**
   - Build the **county overlap matrix** server-side once (in `scoring.js`): for each pair of top-N companies, % of counties shared. Cache to `window.OVERLAP_MATRIX`.
   - Render the existing v2 heat-grid with real percentages. Hover a cell → show shared county list.

**Acceptance:** the "Total market" KPI matches `Σ c.estRevenue` to the dollar. Sliding the "Geography" weight up reorders the Strategic Fit table. Hovering a cell in Overlap shows the actual list of shared counties between those two companies.

### Phase 6 — Relationship Graph, Executive Brief (½ day)

**Files:** `js/Views3.jsx` `NetworkView`, `js/Views2.jsx` `BriefView`.

1. **Relationship Graph:** v1 had no analog, so this is greenfield using v1's data. For each company, derive edges:
   - **Parent / subsidiary** — companies sharing `parentGroup`.
   - **Direct competitor** — top-N companies by `c.countyShared.pct` against the focused node.
   - **Acquisition target** — top-5 by `fitScore` for the focused node when it's the platform.
   - Render with a force-directed layout (use `d3-force` via CDN — no build step). Keep the existing v2 styling (circle nodes with two-letter monogram, ink edges).
2. **Executive Brief:** templated narrative reading live data:
   - "X tracked signals this quarter — a Y% QoQ increase" — reads `data/signals.json` (Phase 7).
   - The four KPI cards mirror Analytics top row.
   - Three "stories that need attention" — top three signals by `signalStrength` from `data/signals.json`.

**Acceptance:** focusing on Lampton Love in Network shows Ergon as parent, Blossman as top competitor (by overlap), and 3–5 family-owned SE targets pulled by fit-score.

### Phase 7 — Signals + News data, URL state, polish (½ day)

**Files:** new `data/signals.json`, `js/Views2.jsx` `SignalsView`, `js/News.jsx`, `js/App.jsx`.

1. **Build `data/signals.json`** by hand-curating ~20 real signals from existing research (`research/sprint_*_summary.md` already has many). Schema: `{ id, companyId, type, label, signalStrength (0–100), source, sourceUrl, date, headline, body }`. Hook into `SignalsView` and `BriefView`.
2. **News bridge data:** `News.jsx` already has 25 mock articles. Re-tag each `companies` field with the real canonical IDs from `companies.json` (e.g. `lampton_love` not `ll`) so `companyName()` resolves through the v2 alias map.
3. **URL hash persistence** (`js/App.jsx`):
   - Encode `view`, `selected`, `compare`, plus a JSON-encoded `filters` blob into `location.hash` on every state change.
   - Restore on mount.
   - Port v1 `pushURLState` + restore logic (1477–1492). This makes deep-links and the "share view" Export button work.
4. **localStorage saved scenarios:** wire the v2 sidebar's "SAVED" section ("Southeast roll-up", "Cherry Energy thesis", …) to a `propane_saves` localStorage list with create/rename/delete.
5. **Performance pass:**
   - Lazy-load `data/counties_national_simple.geojson` only on county-toggle (already in plan, just verify).
   - Memoise filter results with `useMemo` keyed on `(filters, q, sortKey)`.
   - Virtualise the Companies table (Phase 3).
   - Debounce the search box at 80 ms.

**Acceptance:** copying the URL after applying SE + Family + search "Cherry" and pasting in a new tab reproduces the exact same view. Saved-scenarios buttons round-trip filter state.

### Phase 8 — QA + ship (½ day)

1. Walk through all 9 views with the local Python server, screenshot each, diff against the v2 design canvas.
2. Run a 1,400-row stress test: open Companies → sort → filter → open Detail → switch to Map → toggle counties — must stay <16 ms per interaction (60 fps target).
3. Verify GitHub Pages deploy still works (it auto-deploys on `main` push).
4. Update `CLAUDE.md` to point at the new repo URL (currently still says `se-propane-market-map`).
5. Tag `v2.0.0` once green.

## 2. File-by-file change summary

| File | Phase | Action |
|---|---|---|
| `index.html` | 1, 2 | Rewrite data adapter; add `leaflet.markercluster` CDN |
| `js/scoring.js` (new) | 1 | All scoring + filter helpers |
| `js/MapEngine.jsx` (new) | 2 | Leaflet React wrapper |
| `js/Views1.jsx` | 2, 3 | Replace `MapCanvas` with `<LeafletMap/>`, wire `MarketMapView` filters, wire `CompaniesTable` to real data + sort + virtualise |
| `js/Views2.jsx` | 5, 6, 7 | Wire `AnalyticsView` to real KPIs; wire `BriefView` + `SignalsView` to `data/signals.json` |
| `js/Views3.jsx` | 4, 5, 6 | Wire `CompanyDetail`, `FitView`, `OverlapView`, `NetworkView` to real data |
| `js/App.jsx` | 7 | URL hash persistence, lifted `filters` store |
| `js/News.jsx` | 7 | Re-tag mock articles with canonical IDs |
| `data/signals.json` (new) | 7 | Curated M&A signals |

## 3. Risk register

- **Leaflet inside React babel-standalone:** instantiating `L.map()` twice if `useEffect` cleanup isn't tight will leak. Mitigation: call `map.remove()` in cleanup, guard with a ref.
- **County GeoJSON size (~3 MB):** must stay lazy. If first-paint regresses, gzip the file at the server level (GH Pages does this automatically).
- **Score recomputation on weight slider:** doing it 60×/sec while dragging will jank. Mitigation: recompute on `mouseup` only, or throttle to 200 ms.
- **Anchor merging:** if a demo ID's real counterpart isn't in `companies.json` (e.g. "D&D Gas"), keep the demo entry as fallback so views don't crash on missing IDs.
- **Babel-standalone build size:** we're already at ~2,400 lines of JSX. Once we add MapEngine + scoring, expect first-paint to take ~1–2 s on cold cache. If it gets noticeably slower, switch to a real Vite build for production (kept as out-of-scope follow-up).

## 4. Total estimate

~5 working days, single developer. Phases 1–4 unblock the demo (map + companies + detail with real data); Phases 5–7 close the gap to v1 parity; Phase 8 is the ship gate.
