"""Main entry: scrape every source, dedupe, build news.json + signals.json.

Usage:
    python scripts/news_pipeline/refresh_news.py
    NEWS_SOURCES=npga,lpgas python scripts/news_pipeline/refresh_news.py
"""
from __future__ import annotations

import datetime as dt
import json
import logging
import os
import sys
from collections import Counter
from pathlib import Path

# Allow imports relative to this script
THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))

from sources import SOURCE_REGISTRY  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("refresh_news")

REPO_ROOT = THIS_DIR.parents[1]
DATA_DIR = REPO_ROOT / "data"
NEWS_PATH = DATA_DIR / "news.json"
SIGNALS_PATH = DATA_DIR / "signals.json"

# Cap to keep payload light
MAX_ARTICLES = 60
MAX_DAYS_OLD = 60  # drop anything older than this


def select_sources():
    raw = os.environ.get("NEWS_SOURCES", "").strip()
    if not raw:
        return list(SOURCE_REGISTRY.keys())
    keys = [k.strip().lower() for k in raw.split(",") if k.strip()]
    valid = [k for k in keys if k in SOURCE_REGISTRY]
    if not valid:
        log.warning("No valid sources in NEWS_SOURCES=%r — using all.", raw)
        return list(SOURCE_REGISTRY.keys())
    return valid


def gather_articles():
    sources = select_sources()
    log.info("Fetching from sources: %s", sources)
    all_articles = []
    for key in sources:
        fn = SOURCE_REGISTRY[key]
        try:
            items = fn()
            log.info("  %s: %d items", key, len(items))
            all_articles.extend(items)
        except Exception as e:  # noqa: BLE001
            log.exception("Source %s failed: %s", key, e)
    return all_articles


def dedupe(articles):
    """De-dupe by URL (preferred) and fall back to (source, headline) hash."""
    seen = set()
    out = []
    for a in articles:
        key = a.get("url") or f"{a.get('source')}|{a.get('headline')}"
        if key in seen:
            continue
        seen.add(key)
        out.append(a)
    return out


def filter_age(articles, max_days):
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=max_days)
    out = []
    for a in articles:
        pub = a.get("publishedAt")
        if not pub:
            out.append(a)
            continue
        try:
            d = dt.datetime.strptime(pub, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)
            if d >= cutoff:
                out.append(a)
        except ValueError:
            out.append(a)  # keep if we can't parse
    return out


def sort_articles(articles):
    """Sort by impactScore desc, then publishedAt desc."""
    return sorted(
        articles,
        key=lambda a: (a.get("impactScore", 0), a.get("publishedAt", "")),
        reverse=True,
    )


def build_signals(articles):
    """A 'signal' is a structured event view. Mostly we surface 8-K filings + leadership / capital events.

    Schema mirrors signals.json: {schema, generatedAt, signals:[{id,type,company,companyId,observedAt,...}]}
    """
    sigs = []
    for a in articles:
        kind = None
        cat = a.get("category")
        cids = a.get("companyIds") or []
        if a.get("source") == "SEC EDGAR":
            kind = "public_material_event"
        elif cat == "leadership":
            kind = "leadership_change"
        elif cat == "capital":
            kind = "capital_raise"
        elif cat == "expansion":
            kind = "expansion"
        elif cat == "ma":
            kind = "ownership_change"
        if not kind:
            continue
        # Need at least one matched company for a signal to be useful
        primary_cid = cids[0] if cids else None
        sigs.append({
            "id": "s_" + (a.get("id") or "")[2:],
            "type": kind,
            "company": "",  # left blank; UI looks up via companyId
            "companyId": primary_cid,
            "observedAt": a.get("publishedAt"),
            "headline": a.get("headline"),
            "summary": a.get("summary"),
            "url": a.get("url"),
            "source": a.get("source"),
            "strength": a.get("impactScore", 50),
        })
    return sigs


def build_news_payload(articles):
    counts = Counter(a.get("source", "unknown") for a in articles)
    sources_arr = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return {
        "schema": 1,
        "generatedAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(articles),
        "sources": sources_arr,
        "articles": articles,
    }


def build_signals_payload(signals):
    return {
        "schema": 1,
        "generatedAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(signals),
        "signals": signals,
    }


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    raw = gather_articles()
    log.info("Total raw articles: %d", len(raw))
    articles = dedupe(raw)
    log.info("After dedupe: %d", len(articles))
    articles = filter_age(articles, MAX_DAYS_OLD)
    log.info("After age filter (<=%dd): %d", MAX_DAYS_OLD, len(articles))
    articles = sort_articles(articles)[:MAX_ARTICLES]
    log.info("Final article count: %d", len(articles))

    news_payload = build_news_payload(articles)
    signals_payload = build_signals_payload(build_signals(articles))

    with open(NEWS_PATH, "w", encoding="utf-8") as f:
        json.dump(news_payload, f, ensure_ascii=False)
    log.info("Wrote %s (%d articles)", NEWS_PATH, len(articles))

    with open(SIGNALS_PATH, "w", encoding="utf-8") as f:
        json.dump(signals_payload, f, ensure_ascii=False)
    log.info("Wrote %s (%d signals)", SIGNALS_PATH, len(signals_payload["signals"]))


if __name__ == "__main__":
    main()
