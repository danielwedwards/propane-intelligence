# News pipeline

Daily refresh of `data/news.json` and `data/signals.json` from public propane-industry sources.

## Sources

| Key | Source | Method |
|-----|--------|--------|
| `npga` | National Propane Gas Association — news/resources page | HTML scrape |
| `lpgas` | LP Gas Magazine | RSS (`/feed/`) |
| `bpnews` | Butane-Propane News | RSS (`/rss.xml`) |
| `sec_edgar` | SEC EDGAR — recent 8-K filings for tracked public propane companies | EDGAR HTML browser |

## How to run

### Locally (dry test)
```bash
pip install -r scripts/news_pipeline/requirements.txt
python scripts/news_pipeline/refresh_news.py
```

The script writes `data/news.json` and `data/signals.json` directly. Inspect with:
```bash
python -c "import json; d=json.load(open('data/news.json')); print(d['count'], 'articles')"
```

### Subset
```bash
NEWS_SOURCES=lpgas,sec_edgar python scripts/news_pipeline/refresh_news.py
```

### GitHub Actions
- Scheduled: every day at 11:00 UTC (`.github/workflows/refresh-news.yml`)
- Manual: Actions tab → "Refresh news + signals feeds" → "Run workflow"

The Action commits any change to `news.json` / `signals.json` directly to `main` as user `propane-intelligence-bot`.

## Categories

The categorizer assigns each article a category for color-coding in the UI. Order matters — first match wins.

- `ma` — acquisitions / mergers / divestitures
- `capital` — 8-K, earnings, financings, IPO
- `leadership` — CEO / CFO / president changes
- `litigation` — lawsuits, settlements
- `regulatory` — OSHA, EPA, DOT, NPGA, PERC announcements
- `expansion` — new locations, terminals, facilities
- `pricing` — Mont Belvieu / Conway price moves, supply/demand updates
- `partnership` — JV / alliance / agreement

Default fallback: `regulatory` (most propane association content).

## Company matching

Headlines and summaries are scanned for company names from `data/companies.json` to populate `companyIds`. Watchlist alerts in the app fire when a watched company's id appears in this list.

The matcher uses word-boundary regex (case-insensitive), prefers longer names first ("Suburban Propane Partners" before "Suburban"), and de-dupes per article.

## Schema

Output matches the validator in `index.html`:
```json
{
  "schema": 1,
  "generatedAt": "2026-04-26T11:00:00Z",
  "count": 32,
  "sources": [["LP Gas Magazine", 12], ["NPGA", 8], ...],
  "articles": [
    {
      "id": "lpg_a1b2c3d4e5",
      "headline": "...",
      "source": "LP Gas Magazine",
      "sourceUrl": "lpgasmagazine.com",
      "url": "https://...",
      "publishedAt": "2026-04-25T13:00:00Z",
      "companyIds": ["ferrellgas"],
      "category": "regulatory",
      "summary": "...",
      "impactScore": 65,
      "isBreaking": false,
      "readMinutes": 3
    }
  ]
}
```

## Caps

- `MAX_ARTICLES = 60` — keep payload light for the GitHub Pages CDN
- `MAX_DAYS_OLD = 60` — drop stale entries on each refresh
- Sorted by `impactScore` desc, then `publishedAt` desc

## Tuning

If a source starts returning empty results (RSS feed moved, HTML structure changed), update its function in `sources.py`. The categorizer rules are in `categorize.py` — first match wins, so add specific patterns (like ticker codes) before generic ones.
