"""Per-source scrapers. Each returns a list of normalized article dicts.

Article shape (matches news.json schema):
    {
        "id": str,                 # short unique id derived from URL hash
        "headline": str,
        "source": str,
        "sourceUrl": str,          # short domain
        "url": str,                # full article URL
        "publishedAt": str,        # ISO8601
        "companyIds": list[str],
        "category": str,
        "summary": str,
        "impactScore": int,
        "isBreaking": bool,
        "readMinutes": int,
    }
"""
from __future__ import annotations

import datetime as dt
import hashlib
import logging
import re
import time
from email.utils import parsedate_to_datetime

import feedparser
import requests
from bs4 import BeautifulSoup

from categorize import categorize, impact_score
from company_match import match_companies

log = logging.getLogger("news_pipeline.sources")

UA = "PropaneIntelligenceBot/1.0 (https://danielwedwards.github.io/propane-intelligence; news-aggregator)"
HEADERS = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml,application/rss+xml"}
TIMEOUT = 25


def _hash_id(prefix: str, key: str) -> str:
    return f"{prefix}_" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]


def _iso(d: dt.datetime) -> str:
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _strip_html(html: str, max_len: int = 320) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(" ", strip=True)
    if len(text) > max_len:
        text = text[: max_len - 1].rstrip() + "…"
    return text


def _read_minutes(text: str) -> int:
    words = len((text or "").split())
    return max(1, round(words / 200))


def _parsed_dt(entry) -> dt.datetime:
    for key in ("published_parsed", "updated_parsed"):
        v = getattr(entry, key, None)
        if v:
            try:
                return dt.datetime.fromtimestamp(time.mktime(v), tz=dt.timezone.utc)
            except (TypeError, ValueError, OSError):
                pass
    for key in ("published", "updated"):
        v = entry.get(key)
        if v:
            try:
                return parsedate_to_datetime(v)
            except (TypeError, ValueError):
                pass
    return dt.datetime.now(dt.timezone.utc)


def _from_rss(feed_url: str, source_label: str, source_domain: str, prefix: str, max_items: int = 25):
    """Generic RSS reader."""
    out = []
    try:
        # feedparser handles its own HTTP, but pass UA via etag-like
        feed = feedparser.parse(feed_url, agent=UA)
    except Exception as e:
        log.warning("RSS parse failed for %s: %s", feed_url, e)
        return out
    if not feed.entries:
        log.info("No entries in feed: %s", feed_url)
        return out
    for entry in feed.entries[:max_items]:
        url = entry.get("link") or ""
        if not url:
            continue
        title = (entry.get("title") or "").strip()
        if not title:
            continue
        summary_html = entry.get("summary") or entry.get("description") or ""
        summary = _strip_html(summary_html)
        published = _parsed_dt(entry)
        text = f"{title} {summary}"
        cids = match_companies(text)
        category = categorize(title, summary)
        is_breaking = "BREAKING" in title.upper() or "URGENT" in title.upper()
        score = impact_score(category, source_label, is_breaking, bool(cids))
        out.append({
            "id": _hash_id(prefix, url),
            "headline": title,
            "source": source_label,
            "sourceUrl": source_domain,
            "url": url,
            "publishedAt": _iso(published),
            "companyIds": cids,
            "category": category,
            "summary": summary,
            "impactScore": score,
            "isBreaking": is_breaking,
            "readMinutes": _read_minutes(summary),
        })
    return out


def fetch_npga(max_items: int = 25):
    """National Propane Gas Association — news/resources page (no public RSS, scrape HTML)."""
    out = []
    url = "https://www.npga.org/news-resources/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()
    except Exception as e:
        log.warning("NPGA fetch failed: %s", e)
        return out
    soup = BeautifulSoup(r.text, "lxml")
    # NPGA uses card components; look for any <article> / .post / a[href*="/news-resources/"] with title
    cards = soup.select("article a[href]") or soup.select("a.post-link") or soup.select("h3 a[href*='/news-resources/']")
    seen = set()
    for a in cards[:max_items]:
        href = a.get("href")
        if not href or href in seen:
            continue
        if href.startswith("/"):
            href = "https://www.npga.org" + href
        if "/news-resources/" not in href:
            continue
        seen.add(href)
        title = (a.get_text(" ", strip=True) or "").strip()
        if not title or len(title) < 6:
            continue
        # Default to "now" since NPGA pages don't always expose dates inline
        published = dt.datetime.now(dt.timezone.utc)
        cids = match_companies(title)
        category = categorize(title, "")
        score = impact_score(category, "NPGA", False, bool(cids))
        out.append({
            "id": _hash_id("npga", href),
            "headline": title,
            "source": "NPGA",
            "sourceUrl": "npga.org",
            "url": href,
            "publishedAt": _iso(published),
            "companyIds": cids,
            "category": category,
            "summary": "",
            "impactScore": score,
            "isBreaking": False,
            "readMinutes": 2,
        })
    return out[:max_items]


def fetch_lpgas(max_items: int = 25):
    """LP Gas Magazine — has a WordPress RSS feed."""
    return _from_rss(
        "https://www.lpgasmagazine.com/feed/",
        "LP Gas Magazine",
        "lpgasmagazine.com",
        "lpg",
        max_items=max_items,
    )


def fetch_bpnews(max_items: int = 25):
    """Butane-Propane News — has an RSS at /rss.xml."""
    items = _from_rss(
        "https://bpnews.com/rss.xml",
        "Butane-Propane News",
        "bpnews.com",
        "bpn",
        max_items=max_items,
    )
    if items:
        return items
    # Fallback: try news index
    items = _from_rss(
        "https://bpnews.com/news/feed",
        "Butane-Propane News",
        "bpnews.com",
        "bpn",
        max_items=max_items,
    )
    return items


# SEC EDGAR — pull recent 8-K filings for our publicly-traded companies
EDGAR_COMPANIES = [
    # (CIK, ticker, display_name, internal_id_in_companies_json)
    ("0001005210", "SPH",  "SUBURBAN PROPANE PARTNERS LP",   "suburban_propane_partners__l_p_"),
    ("0000922358", "FGPR", "FERRELLGAS PARTNERS L P",        "ferrellgas"),
    ("0000019745", "CPK",  "CHESAPEAKE UTILITIES CORP",      None),  # not in our list, but propane-adjacent
    ("0001168054", "APU",  "AMERIGAS PARTNERS LP",           "amerigas_partners__l_p_"),
    ("0001022380", "UGI",  "UGI CORP",                       None),
    ("0001394057", "SXC",  "SUNCOKE ENERGY",                 None),
    ("0001631569", "SPLP", "SUPERIOR PLUS CORP",             "superior_plus_propane"),
]


def fetch_sec_edgar(max_per_company: int = 4):
    """Fetch recent 8-K filings from SEC EDGAR for known propane public companies."""
    out = []
    base = "https://www.sec.gov/cgi-bin/browse-edgar"
    for cik, ticker, name, internal_id in EDGAR_COMPANIES:
        url = f"{base}?action=getcompany&CIK={cik}&type=8-K&dateb=&owner=include&count={max_per_company}&action=getcompany"
        try:
            # SEC requires a clear UA with email
            sec_headers = {"User-Agent": "PropaneIntelligenceBot news-aggregator@propane-intelligence.local"}
            r = requests.get(url, headers=sec_headers, timeout=TIMEOUT)
            r.raise_for_status()
        except Exception as e:
            log.warning("EDGAR fetch failed for %s (CIK %s): %s", name, cik, e)
            continue
        soup = BeautifulSoup(r.text, "lxml")
        # Find filing rows in the EDGAR table
        rows = soup.select("table.tableFile2 tr")
        seen_dates = set()
        cnt = 0
        for row in rows[1:]:  # skip header
            cells = row.find_all("td")
            if len(cells) < 5:
                continue
            form = cells[0].get_text(strip=True)
            if not form.startswith("8-K"):
                continue
            date_str = cells[3].get_text(strip=True)  # filing date
            if not date_str or date_str in seen_dates:
                continue
            seen_dates.add(date_str)
            try:
                published = dt.datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=dt.timezone.utc)
            except ValueError:
                continue
            headline = f"{name}  ({ticker})  (CIK {cik}) files Form 8-K"
            summary = f"SEC EDGAR filing: Form 8-K filed by {name}  ({ticker})  (CIK {cik}) on {date_str}."
            company_url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=8-K"
            cids = [internal_id] if internal_id else []
            out.append({
                "id": _hash_id("sec", f"{cik}-{date_str}"),
                "headline": headline,
                "source": "SEC EDGAR",
                "sourceUrl": "sec.gov",
                "url": company_url,
                "publishedAt": _iso(published),
                "companyIds": cids,
                "category": "capital",
                "summary": summary,
                "impactScore": impact_score("capital", "SEC EDGAR", False, bool(cids)),
                "isBreaking": False,
                "readMinutes": 2,
            })
            cnt += 1
            if cnt >= max_per_company:
                break
        # Be polite to SEC
        time.sleep(0.5)
    return out


SOURCE_REGISTRY = {
    "npga":      fetch_npga,
    "lpgas":     fetch_lpgas,
    "bpnews":    fetch_bpnews,
    "sec_edgar": fetch_sec_edgar,
}
