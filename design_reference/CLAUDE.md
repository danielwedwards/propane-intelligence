# CLAUDE.md — Ergon Redesign Implementation

You are helping a developer implement a UI redesign into Ergon's existing **Flask + Jinja + vanilla JS** codebase. The design is delivered as HTML/JSX reference prototypes in this handoff package.

## Ground rules

1. **The HTML/JSX files in `reference-ui-kit/` are the visual spec, not code to ship.** Port the designs into the actual Flask/Jinja templates.
2. **Use the design tokens.** Every color, font size, radius, and shadow must come from `design-tokens/colors_and_type.css`. Never introduce new literals.
3. **Prefer Path A (CSS refactor) unless the team has explicitly chosen Path B (React).** See `README.md` for the comparison.
4. **Ship incrementally.** One screen per PR. Tokens first, then login, then chrome, then each screen.
5. **Keep Leaflet.** The map-panel mock is chrome-only; the real map integration stays.

## Where to find things

- `README.md` — full spec including tokens, screen-by-screen layouts, interaction rules
- `design-tokens/colors_and_type.css` — drop this straight into `static/css/`
- `reference-ui-kit/index.html` — open in a browser to see every screen live
- `reference-ui-kit/Login.jsx` — the `FloatingOrbs` component here is ~40 LOC of vanilla JS; port as-is (no React needed)
- `assets/` — logo/wordmark placeholders; ask if a real logo exists before shipping

## When in doubt

The rendered HTML prototypes are authoritative. If the README disagrees with what the prototype does, trust the prototype.
