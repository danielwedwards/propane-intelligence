# App UI Kit — U.S. Propane Market Map

A hi-fi, click-through recreation of the production app. Drop this in any design or prototype to get pixel-matching components.

## Files
- `index.html` — loads React + Babel + components and renders the full app shell
- `tokens.jsx` — re-exports design tokens from `colors_and_type.css` for JSX
- `Header.jsx` — app top bar (wordmark, stats, view toggle, utility buttons)
- `Sidebar.jsx` — filter sidebar (search, ownership, business type, region, layers, options)
- `LeagueTable.jsx` — the sortable company table
- `MapPanel.jsx` — static/mocked Leaflet-style map surface with legend
- `ProfilePanel.jsx` — slide-out company profile
- `ProForma.jsx` — bottom-pinned pro-forma builder
- `Login.jsx` — mesh-orb login screen
- `mockData.js` — realistic company fixtures

## Click-through
On `index.html`:
1. Login card is dismissible — any credentials work
2. Click any row to open the profile panel
3. Click `+` to add to the pro-forma (bottom bar expands)
4. Click `👁` to "spotlight" a company
5. Filter pills update the table count

Not a real map — the `MapPanel` uses a static SVG backdrop with mock markers so the kit has no CDN dependency beyond fonts.
