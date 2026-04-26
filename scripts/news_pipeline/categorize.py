"""Map a headline + summary to one of the canonical categories used by the app."""
import re

CATEGORIES = [
    "ma", "leadership", "capital", "regulatory",
    "expansion", "pricing", "litigation", "partnership",
]

# Order matters: first match wins. Patterns are case-insensitive.
RULES = [
    ("ma",          [r"acqui(re|red|sition|res)", r"merger", r"buyout", r"divest", r"sells?\b", r"deal complet", r"acquir(?:es|ed)", r"closed transaction"]),
    ("capital",     [r"\b8-?K\b", r"\b10-?K\b", r"\b10-?Q\b", r"form 8", r"earnings", r"raise[d]?\s+\$", r"financing", r"refinanc", r"capital\b", r"\bIPO\b", r"bond offering", r"credit facility"]),
    ("leadership",  [r"\bCEO\b", r"\bCFO\b", r"\bCOO\b", r"\bpresident\b", r"named\s+chief", r"appointed", r"steps?\s+down", r"hired\s+as", r"named\s+to", r"new\s+chief"]),
    ("litigation",  [r"lawsuit", r"sue[ds]?\b", r"settle(d|ment)?", r"plead(s|ed)\s+guilty", r"\bDOJ\b", r"federal court", r"injunction", r"class action"]),
    ("regulatory",  [r"\bOSHA\b", r"\bEPA\b", r"\bDOT\b", r"\bPHMSA\b", r"\bNFPA\b", r"\bFMCSA\b", r"regulat", r"compliance", r"safety code", r"emphasis program", r"NEP", r"PERC\b", r"MOPERC", r"NPGA", r"propane.*council", r"council\b"]),
    ("expansion",   [r"opens?\s+new", r"expand(s|ed|ing)?", r"new (terminal|location|branch|facility)", r"adds?\s+\d+\s+(loc|customer|truck)", r"break(s|ing) ground", r"groundbreaking"]),
    ("pricing",     [r"price[ds]?\b", r"pricing", r"per\s+gallon", r"propane index", r"\bMont Belvieu\b", r"\bConway\b", r"spot price", r"posted price", r"inventory(?:\s|$)", r"supply.*demand", r"\bAPI\s+inventory", r"market\s+(metrics|update|outlook)"]),
    ("partnership", [r"partner(s|ed|ship)", r"joint venture", r"\bJV\b", r"alliance", r"agreement to\b", r"team(s|ed) (up )?with", r"signed agreement"]),
]


def categorize(headline: str, summary: str = "") -> str:
    """Return a category key. Falls back to 'regulatory' for industry/association text and 'pricing' for nothing else.

    The Intelligence section in the app falls back to a default styling for unknown categories,
    so any string is acceptable — but we prefer a recognized one for color coding.
    """
    text = f"{headline} {summary}".lower()
    for cat, patterns in RULES:
        for p in patterns:
            if re.search(p, text, flags=re.IGNORECASE):
                return cat
    # Default fallback — most propane news is industry-association talk
    return "regulatory"


def impact_score(category: str, source: str, is_breaking: bool, has_company_match: bool) -> int:
    """Compute a 0-100 impact score for ranking. Mirrors the scoring used in the existing news.json."""
    base = {
        "ma": 80,
        "capital": 65,
        "leadership": 60,
        "litigation": 70,
        "regulatory": 55,
        "expansion": 60,
        "pricing": 50,
        "partnership": 55,
    }.get(category, 50)
    # Source authority boost
    src_boost = {
        "SEC EDGAR": 10,
        "Reuters": 8,
        "Bloomberg": 8,
        "Wall Street Journal": 7,
        "LP Gas Magazine": 5,
        "Butane-Propane News": 5,
        "NPGA": 4,
    }.get(source, 0)
    score = base + src_boost
    if is_breaking:
        score += 10
    if has_company_match:
        score += 5
    return max(0, min(100, score))
