# Propane Intelligence v3 — Feature Restoration & Real-Data Plan

**Premise:** v2.0.0 shipped a clean Stripe-indigo design system on real 2,798-company data, but in the rewrite we lost a number of v1 features and several views still surface synthetic / placeholder data. This plan closes those gaps, then builds a real ingestion layer for News and Signals (which v1 never had either, but which the product needs).

Source v1 codebase: `C:\Users\Danie\Downloads\us-propane-market-map\index.html` (single-file, 2,834 lines).
v2 codebase: this repo. v2.0.0 = `f72613f`.

---

## Gap inventory (truthful baseline)

### A. Regressions vs v1 (v1 had it; v2 lost it)
1. **County choropleth** with 3 modes: Total consumption / Residential customers / Per-capita usage (v1: `updateCountyLayer`, `<select id="countyMode">`)
2. **State mask** layer that dims out-of-region states (v1: 1393-1432)
3. **Marker-cluster toggle** + zoom-based auto-disable (v1: `L.markerClusterGroup` chunked loading)
4. **Map color modes**: "By Company" vs "By Ownership" (v1: `setMapColorMode` 1663)
5. **State filter** chips that drive both pin layer and county overlay
6. **Region pills**: All US / SE / NE / MW / SC / W (v1 had dynamic state pills per region)
7. **Spotlight / isolate** company on map (eye-icon button)
8. **Pro-forma / portfolio builder** (v1: `pf-bar`, "save and share via email" modal — 1023-1043, 2120-2270)
9. **CSV export** of filtered company list (v1: `exportCSV` 2374-2391)
10. **Logout** button + auth menu (v1: `doLogout` 2393-2507; v2 only has login)
11. **Help modal** with scoring methodology & keyboard shortcuts
12. **Sources / methodology modal**
13. **ECharts dashboard** (Ownership pie, Business-Type, Top 25 by locations — v1: `renderCharts` 2651-2704). v2 has custom SVG donut but no biz-type chart and no Top-25.
14. **Score tooltips** on hover + row-preview tooltip
15. **Dark / light theme toggle** + print stylesheet
16. **Active filter chips** with × removal (v2 has chip row but unwired)
17. **CompanyDetail "Locations" sub-tab** with map-pan onLocate

### B. Data-quality / coverage gaps
1. **Missing locations for ~70 companies** (897 location records absent) — captured in `~/.claude/plans/zany-greeting-toast.md`. 7 large operators (Growmark, EDP, MFA Oil, Dead River, Lakes Gas, Scott Petroleum, ALCIVIA = 565 locations) all have websites with locator pages.
2. **County FIPS gaps** on some location records — `loc.fips` missing → those locations don't contribute to county overlap or county-level market share.
3. **Sparse `estAnnualGallons`** — only ~150 of 2,798 companies have a value; we currently fall back to `marketShare.nationalG`, but the underlying gallon estimate is itself derived rather than sourced.
4. **Sparse `acquisitions[]`** — ~0 companies have populated acquisition history → "Acquisition pace" chart in Analytics shows essentially nothing.
5. **Sparse `keyPersonnel[]`, `serviceTypes[]`** — CompanyDetail surfaces these but most companies render "—".
6. **Stale TopNav counts**: hardcoded "247 / 1247 / 18 / 25" badges in `Chrome.jsx`.
7. **"Updated 14m ago"** is a static string.

### C. Synthetic / placeholder data still in v2
1. **News.jsx**: 25 hand-written news articles. The schema is real, but the data is mock. Needs a real ingestion pipeline.
2. **SignalsView**: now derives signals deterministically from company attributes (better than mock strings) — but real signals would come from SEC filings, state biz registries, news classifiers, not from rules.
3. **Saved scenarios sidebar** in `Chrome.jsx` ("Southeast roll-up", "Cherry Energy thesis", "LPG co-op wave") — these are decorative; the real saved scenarios live in localStorage.
4. **CommandPalette** — items are hardcoded suggestions; should be live company/view search.
5. **Brief generation date** uses `new Date()` but **"Q2 2026 market intelligence summary"** is a static subhead.

### D. Things neither v1 nor v2 has, but the product needs
1. Real news ingestion (RSS, NewsAPI/Bing, entity linker, classifier)
2. Real signals: SEC EDGAR Form D / 8-K watcher, state biz registries, news-derived signals
3. Any backend / cron — both versions are static GitHub Pages sites

---

## Phased plan (12 phases, each ends in a commit + push)

### Phase 9 — Logout + auth menu (small, do first)
**Files:** `js/Chrome.jsx` (TopNav), `js/App.jsx`
**Work:**
- Add a user-avatar menu in TopNav (top-right, replaces the static `DE` chip).
- Items: "Daniel Edwards" header, divider, "Settings" (placeholder), "Sources & methodology" (opens a modal we add in Phase 13), "Logout".
- Logout: `localStorage.removeItem('pi_auth_v1')`, then `location.reload()`.
- Wire from `App.jsx` → `Dashboard` → `TopNav` via `onLogout` prop.
**DoD:** clicking avatar → Logout returns to LoginV1.

### Phase 10 — Real map filters: state, region, ownership, search
**Files:** `js/MapEngine.jsx`, `js/Views1.jsx` (MarketMapView), `js/Chrome.jsx` (filter sidebar), `js/App.jsx` (URL state)
**Work:**
1. Lift filter state into `MarketMapView` (or a `useFilters` hook).
2. Replace the decorative sidebar `<input value=... readOnly>` controls with real state-bound:
   - Search across name/hqState/ownerDetail/parentGroup/services
   - Ownership pill row (All / Public / PE / Family / Co-op / Private / Ergon)
   - Region pill row (All US / SE / NE / MW / SC / W)
   - Dynamic state pill grid (changes when region pill changes)
   - Toggles: "Platform only" / "Hide excluded" / "Hide LL"
   - Fit-score min slider
3. Use `window.PI.applyFilters(companies, filters)` (already in `scoring.js`).
4. Pass filtered companies to MapEngine, CompaniesTable, FitView, OverlapView.
5. URL persistence: serialise filters into `?f=...` (base64 JSON).
**DoD:** clicking "SE" + "Family" + state "MS" reduces map markers and table count, persists across reload.

### Phase 11 — County choropleth restoration
**Files:** `js/MapEngine.jsx`, `data/counties_national.json` (already loaded), need GeoJSON
**Work:**
1. Add `data/counties_national_simple.geojson` to repo (carry over from v1's `data/`).
2. Add a `<select>` for County mode: Total consumption / Residential customers / Per-capita / Off — top-right of map.
3. Add `<select>` for Map color mode: By Company / By Ownership.
4. Lazy-load the GeoJSON on first toggle, build a Leaflet `geoJSON` layer with a sequential color scale on the chosen metric.
5. Add the legend (low/high gradient bar + label).
6. State mask: dim out-of-filter states by overlaying a polygon group with low opacity.
7. Marker-cluster toggle (button) + auto-disable when zoom ≥ 10.
**DoD:** all four map controls (county mode / color mode / cluster / state-mask) work; legend updates live.

### Phase 12 — Companies-list parity with v1
**Files:** `js/Views1.jsx`
**Work:**
1. Confirm virtualisation handles 2,798 rows smoothly (RAF profile).
2. Add CSV export: download a subset of columns for the *currently filtered* set.
3. Sortable columns with multi-key sort indicator.
4. Row-hover preview tooltip showing logo / score breakdown.
5. CompanyDetail: add a **"Locations" tab** with the locations table + an "On map" button that closes the detail panel and recenters the Leaflet map on that location.
**DoD:** CSV downloads, location-tab "On map" pans Leaflet to the right pin.

### Phase 13 — Pro-forma / portfolio builder
**Files:** new `js/Portfolio.jsx`, `js/App.jsx`, `js/Views3.jsx` (CompanyDetail "Add to portfolio")
**Work:**
1. Persistent footer bar (`#pf-bar` analog) listing companies in the current "deal stack".
2. Click a company → "Add to portfolio". Footer shows count, total revenue, total locations, total gallons, projected combined fit.
3. Expand-fullscreen view: pro-forma combined entity vs Lampton Love standalone (revenue / locations / gallons / county footprint).
4. "Save scenario" button → name + persist via existing `saveScenarios()`.
5. "Share via email" modal (mailto: with a serialised summary) — keep simple; no backend.
**DoD:** pick 3 targets → footer shows aggregate; expand view shows pro-forma table; save scenario round-trips.

### Phase 14 — Help modal + Sources/methodology modal + score tooltips
**Files:** new `js/Modals.jsx`
**Work:**
1. Help modal: keyboard shortcuts (⌘K palette, ⌘E export, esc, etc.), scoring methodology summary, support link.
2. Sources modal: data lineage — companies.json sources, county metrics provenance, geocoding cache, scoring formula.
3. Score tooltip: hovering a row's fit-score → small popover with the 6-bucket breakdown (already on slideover, just lift).
**DoD:** ? key opens help; sidebar Help link opens modal; hovering a fit cell shows breakdown.

### Phase 15 — ECharts dashboard parity in Analytics
**Files:** `js/Views2.jsx`
**Work:**
1. Replace custom SVG donut with ECharts ownership pie (more legible labels).
2. Add Business-Type chart (counts of Retail / Cylinder / Multi-fuel / Industrial / Co-op-Util / Wholesale).
3. Add **Top 25 by locations** horizontal bar chart.
4. Wire all to live filtered company set.
**DoD:** Analytics shows three real ECharts visualisations; respects filters from Phase 10.

### Phase 16 — Data-quality push: locations, FIPS, acquisitions
**Files:** Python scripts under `scripts/`, `data/companies.json`, `data/counties_national.json`
**Work:**
1. Resume the work in `~/.claude/plans/zany-greeting-toast.md`:
   - Tier 1 (Large, 565 locs): scrape MFA Oil / ALCIVIA / Dead River / Scott Petroleum / Growmark / EDP / Lakes Gas locator pages.
   - Tier 2 (Medium, 204 locs): Paraco / Co-Alliance / Sharp Energy / Matheson / Valley Wide / Federated / Meritum / ACE / Christensen.
   - Tier 3 (Small, 128 locs): Nominatim search + manual vetting.
2. Reverse-geocode every new location → `loc.fips`.
3. Backfill acquisitions: scrape SEC press-release archives + LP Gas Magazine M&A archive for last 10 years; populate `c.acquisitions[]`.
4. Backfill `keyPersonnel[]` from LinkedIn-style sources (manually, or via existing `deep_scrape_*.json` files).
5. Re-run the scoring engine after each backfill batch.
**DoD:** location count `≥ totalLocs` for every company; >95% of locations have `fips`; >50 companies have at least one acquisition record.

### Phase 17 — Real news ingestion
**Files:** new `scripts/news_ingest.py`, `data/news.json`, `js/News.jsx` (point at JSON)
**Architecture:** static-site friendly — runs as a GitHub Action cron, commits an updated JSON file.
**Work:**
1. **Sources** (RSS + scrape):
   - LP Gas Magazine RSS
   - Butane-Propane News RSS
   - Propane Canada
   - Reuters/Bloomberg energy via NewsAPI (free tier)
   - SEC EDGAR full-text search for company names
2. **Entity linker:** for each article, match against `companies.json` via:
   - exact name match, alias list, ticker match, domain match against a curated `aliases.json`
   - confidence scoring; reject low-confidence matches
3. **Classifier:** rule-based + small LLM call (Claude Haiku) to assign category from { ma, leadership, capital, regulatory, expansion, pricing, litigation, partnership } and impactScore 0-100.
4. **Output schema** (already defined in `News.jsx` header comment):
   ```json
   { id, headline, source, sourceUrl, url, publishedAt, companyIds, category, summary, impactScore, isBreaking, readMinutes }
   ```
5. **Scheduling:** GitHub Action `news_ingest.yml` runs hourly; commits `data/news.json` if changed.
6. **Frontend:** `News.jsx` `fetch('/data/news.json')` instead of inline `NEWS_ARTICLES`.
**DoD:** real articles appear in News, dated within last 24h, linked to real companies; refresh button re-fetches.

### Phase 18 — Real signals ingestion
**Files:** new `scripts/signals_ingest.py`, `data/signals.json`, `js/Views2.jsx`
**Sources:**
1. **SEC EDGAR**: Form D (private capital raises), 8-K (material events), 13D/13G (ownership changes), DEF 14A (proxies). Filter to propane-relevant CIKs.
2. **State business registries**: scrape registered-agent / officer changes for tracked companies (state-by-state, opportunistic).
3. **News classifier hand-off**: M&A-tagged articles from Phase 17 produce signals automatically (rumored sale, capital raise, leadership change).
4. **Heuristic layer (current behavior)** stays as a fallback / "soft" signal type.
**Output:**
   ```json
   { id, companyId, type, source, sourceUrl, observedAt, evidence, strength, confidence, notes }
   ```
**Work:**
1. Build `signals_ingest.py` that runs daily.
2. Commit `data/signals.json`.
3. Update `SignalsView` to *merge* hard signals (from JSON) with soft signals (current heuristic) and label them differently.
**DoD:** at least 5 hard signals appear in feed sourced from SEC EDGAR within last 30 days.

### Phase 19 — Live counts + freshness
**Files:** `js/Chrome.jsx`, `js/App.jsx`
**Work:**
1. TopNav counts (Companies, M&A Signals, News) → wire to `window.MOCK_COMPANIES.length`, `signals.length`, `news.length`.
2. "Updated 14m ago" → derive from `data/companies.json` `Last-Modified` header (HEAD request) or a `meta.updatedAt` field.
3. Saved-scenarios sidebar list → reflect actual `loadScenarios()` content; make it click-to-open and × to delete.
**DoD:** counts match reality; freshness shows real diff; saved scenarios sidebar reflects what the user has saved.

### Phase 20 — Final QA + tag v3.0.0
- Cross-browser smoke (Chrome, Edge, Safari)
- Performance pass: 2,798 markers, 3,117 county polygons, 200-row table virtualisation under 60fps
- Accessibility: keyboard nav, focus rings, screen-reader labels on icons
- Screenshot baseline: every view + every modal
- Tag `v3.0.0`, push to GitHub Pages

---

## Sequencing & risk

**Independent / parallelisable:** Phase 9 (logout), Phase 14 (modals), Phase 15 (ECharts), Phase 19 (live counts). Each is < 1 hour.

**Strictly sequential:** Phase 10 (filters) must land before Phase 11 (county choropleth) and Phase 12 (Companies parity), because both consume the filter state.

**Long-running infra:** Phase 17 (News) and Phase 18 (Signals) require GitHub Actions setup + secret management for API keys. Each is a 2-3 day effort; they should run in parallel from a feature branch and merge once stable.

**Heaviest:** Phase 16 (data quality) is the largest in raw hours. Tier 1 alone (565 missing locations across 7 companies) is a few hundred location records to scrape and reverse-geocode.

---

## Definition of done for v3.0.0

- All v1 regressions closed (Phases 9-15)
- Data-quality work completed for Tier 1 large operators (Phase 16 partial OK)
- News + Signals running on a real cron, surfacing real items (Phases 17-18)
- Live counts + freshness (Phase 19)
- Tag `v3.0.0`, GitHub Pages deploys cleanly, screenshot baselines captured
