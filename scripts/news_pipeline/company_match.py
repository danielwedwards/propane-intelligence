"""Match article headlines + summaries to company IDs in companies.json."""
import json
import re
from functools import lru_cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPANIES_PATH = REPO_ROOT / "data" / "companies.json"


@lru_cache(maxsize=1)
def _load_companies():
    with open(COMPANIES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    cos = data.get("companies", data) if isinstance(data, dict) else data
    return cos


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


@lru_cache(maxsize=1)
def _match_table():
    """Build a lookup of (lowercased phrase) -> company_id.

    Phrases include: full name, parentGroup if distinct, common abbreviations.
    """
    table = []  # list of (regex, company_id) for ordered matching
    cos = _load_companies()
    for c in cos:
        cid = c.get("id")
        if not cid:
            continue
        names = set()
        if c.get("name"):
            names.add(c["name"])
        if c.get("parentGroup") and c["parentGroup"] != c.get("name"):
            names.add(c["parentGroup"])
        # Tickers in parens
        if c.get("ticker"):
            names.add(c["ticker"])
        for n in names:
            n_clean = n.strip()
            if len(n_clean) < 4:
                continue  # too short to safely match
            # Word-boundary regex, case-insensitive
            pattern = re.compile(r"\b" + re.escape(n_clean) + r"\b", re.IGNORECASE)
            table.append((pattern, cid))
    # Sort by pattern length descending so longer names match first ("Suburban Propane Partners" before "Suburban")
    table.sort(key=lambda x: len(x[0].pattern), reverse=True)
    return table


def match_companies(text: str) -> list:
    """Return a list of unique company_ids referenced in the text."""
    if not text:
        return []
    found = []
    seen = set()
    for pattern, cid in _match_table():
        if cid in seen:
            continue
        if pattern.search(text):
            found.append(cid)
            seen.add(cid)
    return found
