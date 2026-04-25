"""
Phase 17 — News ingestion.

Pulls articles from public propane-industry RSS feeds, links each item to
companies in `data/companies.json` via name/alias/ticker matching, classifies
the item into one of the eight categories the UI knows about, and writes
`data/news.json` in the schema News.jsx expects.

Designed to run as a GitHub Action cron (see .github/workflows/news_ingest.yml)
on a static-site deployment — no backend, no API keys required for the public
feeds. SEC EDGAR full-text search is used to surface 8-K and Form D filings
that mention tracked companies.

Sources monitored:
  - LP Gas Magazine          https://www.lpgasmagazine.com/feed/
  - Butane-Propane News      https://bpnews.com/?feed=rss2
  - Propane Education & Research Council (PERC)  https://propane.com/feed/
  - National Propane Gas Association (NPGA)      https://www.npga.org/feed/
  - SEC EDGAR full-text search (8-K and Form D)

Output schema (each article):
  { id, headline, source, sourceUrl, url, publishedAt (ISO),
    companyIds: string[], category, summary, impactScore (0-100),
    isBreaking: bool, readMinutes }

Run:
  python scripts/news_ingest.py
"""
import json, os, re, html, hashlib, time, socket, sys
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.parse import quote_plus
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
COMPANIES_FILE = os.path.join(DATA_DIR, 'companies.json')
NEWS_FILE = os.path.join(DATA_DIR, 'news.json')
META_FILE = os.path.join(DATA_DIR, 'meta.json')

USER_AGENT = 'PropaneIntelligence-NewsBot/1.0 (daniel.edwards@ergon.com)'
SOCKET_TIMEOUT = 12
WINDOW_DAYS = 60          # only keep items <= 60 days old
MAX_ITEMS = 80            # cap output size

socket.setdefaulttimeout(SOCKET_TIMEOUT)

# ----------------------------------------------------------------------------
# RSS feeds (public, no auth)
# ----------------------------------------------------------------------------
FEEDS = [
    ('LP Gas Magazine',        'lpgasmagazine.com',  'https://www.lpgasmagazine.com/feed/'),
    ('Butane-Propane News',    'bpnews.com',         'https://bpnews.com/rss.xml'),
    ('Propane.com',            'propane.com',        'https://propane.com/feed/'),
    ('NPGA',                   'npga.org',           'https://www.npga.org/feed/'),
]

# Tracked public-company tickers → company id in companies.json
TICKER_TO_ID = {
    'SPH': 'suburban_propane_partners__l_p_',
    'FGPR': 'ferrellgas',
    'UGI': 'amerigas_partners___ugi_corporation',
    'CHS': 'chs_propane',
    'SPB.TO': 'superior_plus_propane',
}

# Category keyword rules — first match wins, evaluated in order.
# Each rule = (category, [(weight, regex), ...]).
CATEGORY_RULES = [
    ('ma', [
        (3.0, r'\b(acquir|acquisition|merg(?:er|es|ed)|sale of|divest|strategic alternatives|engages?\s+(?:houlihan|jefferies|piper|lazard|moelis|stifel)|retains?\s+(?:houlihan|jefferies|piper|lazard|moelis|stifel)|deal close|to acquire|completes? acquisition|tuck-?in|bolt-?on|roll-?up)\b'),
        (1.5, r'\b(buy|buyer|target|definitive agreement|process)\b'),
    ]),
    ('leadership', [
        (3.0, r'\b(appoint(?:s|ed|ment)?|promot(?:es|ed|ion)|name(?:s|d)?\s+(?:new|chief|president|ceo|cfo|coo)|hires|retire(?:s|d|ment)|step down|succession|new ceo|new president|chairman)\b'),
        (1.5, r'\b(interview\s+with|executive|leadership|board\s+member)\b'),
    ]),
    ('capital', [
        (3.0, r'\b(form\s+d|8-k|10-k|10-q|files? form|earnings|q[1-4]\s+(?:results|earnings)|raises?\s+\$|secur(?:es|ed)\s+\$|term loan|credit facility|bond offering|recap(?:italization)?|dividend|buyback|secondary offering|ipo)\b'),
    ]),
    ('expansion', [
        (3.0, r'\b(opens?\s+(?:new\s+)?(?:facility|location|terminal|plant|office)|broke ground|groundbreak|grand opening|expand(?:s|ed|ing)?\s+(?:into|to)|launch(?:es|ed)?\s+(?:new\s+)?(?:facility|terminal)|new\s+headquarters)\b'),
    ]),
    ('regulatory', [
        (3.0, r'\b(epa|carb|department of energy|department of transportation|\bdot\b|\bdoe\b|nfpa|osha|phmsa|federal rule|proposed rule|final rule|comment period|seeks comments|exemption|methane rule|tax credit|incentive program|safety standard|budget plan|state propane|perc\b|moperc|mandate)\b'),
        (1.0, r'\b(regulatory|legislation|congress|bill\b|comments)\b'),
    ]),
    ('pricing', [
        (3.0, r'\b(spot price|mont belvieu|opis|wholesale price|propane price|inventory build|stockpile|storage report|eia|market metrics|propane (?:price|market))\b'),
    ]),
    ('litigation', [
        (3.0, r'\b(lawsuit|files? suit|sued|court ruling|settlement|class action|jury|injunction|judge ruled)\b'),
    ]),
    ('partnership', [
        (3.0, r'\b(joint venture|partners with|alliance|teams up|signs? agreement|distribution agreement|supply agreement|partnership)\b'),
    ]),
]

BREAKING_PATTERNS = re.compile(
    r'\b(breaking|imminent|just|today|exclusively|first reported|to be announced)\b', re.I,
)


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def http_get(url, timeout=SOCKET_TIMEOUT):
    req = Request(url, headers={'User-Agent': USER_AGENT, 'Accept': '*/*'})
    with urlopen(req, timeout=timeout) as r:
        return r.read().decode(r.headers.get_content_charset() or 'utf-8', 'replace')


def normalize_name(s):
    """Drop incorporation suffixes & punctuation for fuzzy matching."""
    s = re.sub(r'[.,&\-/()\']+', ' ', (s or '').lower())
    s = re.sub(r'\b(inc|llc|llp|lp|l\s*p|corp|corporation|company|co|ltd|holdings|partners|cooperative|coop|propane|gas|energy|fuels|fuel|oil)\b', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def build_company_index(companies):
    """Build a name→id and ticker→id index for entity linking.

    The normalized index only accepts names that survive suffix-stripping with
    BOTH ≥ 2 tokens AND ≥ 10 chars total — single-token short names like
    "first" or "country" generate false positives in headlines, so we restrict
    the fuzzy bucket to genuinely distinctive multi-word names. Distinctive
    short names still match via the full-name index.
    """
    name_to_id = {}
    full_to_id = {}
    for c in companies:
        cid = c.get('id')
        if not cid:
            continue
        full = (c.get('name') or '').lower().strip()
        if full and len(full) >= 8:
            full_to_id[full] = cid
        n = normalize_name(c.get('name'))
        if n and ' ' in n and len(n) >= 10 and n not in name_to_id:
            name_to_id[n] = cid
    return name_to_id, full_to_id


# Generic words that, by themselves, must NOT match a normalized company name.
# Without this filter, names like "First Fuel Propane Inc." normalize to "first"
# and match every headline containing the word "first".
_GENERIC_TOKENS = {
    'first', 'second', 'third', 'national', 'general', 'modern', 'family',
    'consumer', 'consumers', 'best', 'choice', 'central', 'eastern',
    'western', 'northern', 'southern', 'home', 'metro', 'global', 'pacific',
    'atlantic', 'mountain', 'valley', 'river', 'country', 'america',
    'american', 'standard', 'premier', 'preferred', 'unity', 'heritage',
    'liberty', 'independent', 'tri', 'four', 'five', 'six',
}


def link_entities(text, name_idx, full_idx):
    """Return list of company ids mentioned in text, deduped, with confidence.

    Requires either:
      - An exact full-name match (case-insensitive), OR
      - A normalized name match where the name is distinctive (≥2 tokens,
        ≥10 chars after suffix-stripping) and not entirely generic words.
    """
    if not text:
        return []
    low = text.lower()
    found = set()
    # 1. Exact full-name match (highest confidence)
    for full, cid in full_idx.items():
        # Require word boundary so "Cherry" inside "cherry pick" doesn't count
        if re.search(r'\b' + re.escape(full) + r'\b', low):
            found.add(cid)
    # 2. Normalized name match — distinctive multi-token names only
    norm = ' ' + normalize_name(text) + ' '
    for n, cid in name_idx.items():
        if cid in found:
            continue
        toks = n.split()
        if len(toks) < 2:
            continue
        if all(t in _GENERIC_TOKENS for t in toks):
            continue
        if (' ' + n + ' ') in norm:
            found.add(cid)
    # 3. Ticker match (NYSE: SPH style) — must appear with $ or ticker context
    for tk, cid in TICKER_TO_ID.items():
        if re.search(r'(?:\bNYSE:|\bNASDAQ:|\bTSX:|\$)\s*' + re.escape(tk) + r'\b', text):
            found.add(cid)
    return sorted(found)


def classify(text):
    """Score each category; return (category, weight, matched_anything).

    `matched_anything` is False when the text matched none of the keyword
    rules, in which case the caller should generally drop the item rather
    than dump it into the catch-all "expansion" bucket.
    """
    if not text:
        return 'expansion', 0, False
    low = text.lower()
    scores = {}
    for cat, rules in CATEGORY_RULES:
        s = 0.0
        for w, pat in rules:
            if re.search(pat, low):
                s += w
        if s > 0:
            scores[cat] = s
    if not scores:
        return 'expansion', 0, False
    best = max(scores, key=scores.get)
    return best, scores[best], True


def parse_pubdate(s):
    if not s:
        return None
    s = s.strip()
    fmts = [
        '%a, %d %b %Y %H:%M:%S %z',
        '%a, %d %b %Y %H:%M:%S %Z',
        '%Y-%m-%dT%H:%M:%S%z',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%d %H:%M:%S',
    ]
    for f in fmts:
        try:
            d = datetime.strptime(s, f)
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d
        except ValueError:
            pass
    # last-ditch: strip TZ name like "EST"
    s2 = re.sub(r'\s+[A-Z]{3,4}$', ' +0000', s)
    try:
        d = datetime.strptime(s2, '%a, %d %b %Y %H:%M:%S %z')
        return d
    except ValueError:
        return None


def strip_html(s):
    if not s:
        return ''
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def make_id(seed):
    return 'n_' + hashlib.md5(seed.encode('utf-8')).hexdigest()[:10]


# ----------------------------------------------------------------------------
# RSS
# ----------------------------------------------------------------------------
def fetch_rss(source, src_url, feed_url):
    print(f'  [feed] {source} … ', end='', flush=True)
    try:
        body = http_get(feed_url)
    except Exception as e:
        print(f'FAIL ({type(e).__name__})')
        return []
    # Some publisher CMSes inject BOMs, NULL bytes, or whitespace before the
    # XML declaration. Strip leading garbage so ET can parse the body.
    body = body.lstrip('\ufeff \t\r\n')
    if body and body[0] != '<':
        idx = body.find('<')
        if idx > 0:
            body = body[idx:]
    # Strip control chars that XML 1.0 forbids (most often \x0c form feed,
    # which appears in malformed WordPress feeds).
    body = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', body)
    try:
        root = ET.fromstring(body)
    except ET.ParseError as e:
        print(f'FAIL parse ({e})')
        return []
    items = []
    # Standard RSS 2.0
    for it in root.iter('item'):
        title = strip_html((it.findtext('title') or '').strip())
        link = (it.findtext('link') or '').strip()
        desc = strip_html((it.findtext('description') or '').strip())
        pub = parse_pubdate(it.findtext('pubDate'))
        if not title:
            continue
        items.append({
            'title': title, 'link': link, 'desc': desc, 'pub': pub,
            'source': source, 'sourceUrl': src_url,
        })
    # Atom
    if not items:
        ns = {'a': 'http://www.w3.org/2005/Atom'}
        for entry in root.findall('a:entry', ns):
            title = strip_html((entry.findtext('a:title', default='', namespaces=ns) or '').strip())
            link_el = entry.find('a:link', ns)
            link = link_el.get('href') if link_el is not None else ''
            desc = strip_html((entry.findtext('a:summary', default='', namespaces=ns) or '').strip())
            pub = parse_pubdate(entry.findtext('a:published', namespaces=ns) or entry.findtext('a:updated', namespaces=ns))
            if not title:
                continue
            items.append({
                'title': title, 'link': link, 'desc': desc, 'pub': pub,
                'source': source, 'sourceUrl': src_url,
            })
    print(f'{len(items)} items')
    return items


# ----------------------------------------------------------------------------
# SEC EDGAR full-text search → 8-K / Form D for tracked tickers
# ----------------------------------------------------------------------------
def fetch_sec_filings(public_companies, lookback_days=60):
    """Hit EDGAR full-text search for each tracked CIK/name; pull recent filings."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    items = []
    queries = []
    # Major public propane operators — query by company name
    for cid in TICKER_TO_ID.values():
        c = next((c for c in public_companies if c.get('id') == cid), None)
        if c and c.get('name'):
            queries.append((cid, c['name']))
    # Also a generic "propane" 8-K sweep so privately-tracked targets show up
    queries.append((None, 'propane'))

    for cid, query in queries:
        url = ('https://efts.sec.gov/LATEST/search-index'
               f'?q={quote_plus(chr(34) + query + chr(34))}&forms=8-K,D&dateRange=custom'
               f'&startdt={cutoff.strftime("%Y-%m-%d")}'
               f'&enddt={datetime.now(timezone.utc).strftime("%Y-%m-%d")}')
        print(f'  [edgar] {query[:40]:40} … ', end='', flush=True)
        try:
            body = http_get(url)
            data = json.loads(body)
        except Exception as e:
            print(f'FAIL ({type(e).__name__})')
            continue
        hits = (data.get('hits') or {}).get('hits') or []
        print(f'{len(hits)} hits')
        for h in hits[:6]:
            src = h.get('_source') or {}
            forms = src.get('forms') or []
            form_type = forms[0] if forms else (src.get('form') or '8-K')
            displayed = src.get('display_names') or []
            company_label = displayed[0] if displayed else (src.get('entity') or query)
            filed = src.get('file_date') or src.get('filed') or src.get('@timestamp')
            try:
                pub_dt = datetime.fromisoformat((filed or '').replace('Z', '+00:00'))
                if pub_dt.tzinfo is None:
                    pub_dt = pub_dt.replace(tzinfo=timezone.utc)
            except Exception:
                pub_dt = None
            adsh = (h.get('_id') or '').split(':')[0]
            cik = (src.get('ciks') or [None])[0]
            url_link = ''
            if adsh and cik:
                url_link = f'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type={form_type}'
            items.append({
                'title': f'{company_label} files Form {form_type}',
                'link': url_link or f'https://efts.sec.gov/LATEST/search-index?q={quote_plus(query)}',
                'desc': f'SEC EDGAR filing: Form {form_type} filed by {company_label} on {(filed or "")[:10]}.',
                'pub': pub_dt,
                'source': 'SEC EDGAR',
                'sourceUrl': 'sec.gov',
                'preset_companyId': cid,  # override entity linker for this hit
            })
    return items


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    print('Loading companies …')
    with open(COMPANIES_FILE, 'r', encoding='utf-8') as f:
        companies = json.load(f)
    name_idx, full_idx = build_company_index(companies)
    print(f'  Indexed {len(companies)} companies, {len(name_idx)} normalized name keys.')

    raw = []
    print('\nFetching RSS feeds …')
    for source, src_url, url in FEEDS:
        raw.extend(fetch_rss(source, src_url, url))
    print('\nFetching SEC EDGAR full-text search …')
    raw.extend(fetch_sec_filings(companies))

    print(f'\nTotal raw items: {len(raw)}')

    # Dedupe by (source, title) lowercase
    seen = set()
    deduped = []
    for it in raw:
        key = (it['source'], it['title'].lower()[:120])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(it)
    print(f'After dedupe: {len(deduped)}')

    # Filter window
    cutoff = datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)
    in_window = [it for it in deduped if it['pub'] and it['pub'] >= cutoff]
    print(f'In {WINDOW_DAYS}d window: {len(in_window)}')

    # Build articles
    articles = []
    for it in in_window:
        text = (it['title'] + ' ' + it['desc'])[:4000]
        if 'preset_companyId' in it and it['preset_companyId']:
            company_ids = [it['preset_companyId']]
        else:
            company_ids = link_entities(text, name_idx, full_idx)
        # Restrict to articles we can attach to a company OR that hit a
        # genuine industry keyword (regulatory / pricing / capital).
        category, weight, matched = classify(text)
        if not matched and not company_ids:
            # No keyword AND no company link — drop as noise.
            continue
        if not matched:
            # Tagged company but no category keywords — skip rather than
            # mis-bucket as "expansion". The same company will surface again
            # via real news in future runs.
            continue
        if not company_ids and category not in ('regulatory', 'pricing', 'capital', 'ma'):
            continue
        # Compute impact score
        impact = 30 + min(40, int(weight * 8))
        if category == 'ma':
            impact += 15
        if BREAKING_PATTERNS.search(text):
            impact += 8
        impact += min(20, len(company_ids) * 6)
        impact = max(10, min(98, impact))

        # Read minutes ≈ desc length / 200 wpm
        rm = max(2, min(8, len(it['desc']) // 800 + 2))
        is_breaking = (category == 'ma' and impact >= 80) or (BREAKING_PATTERNS.search(it['title']) is not None)

        summary = it['desc'][:340]
        if len(it['desc']) > 340:
            summary = summary.rsplit(' ', 1)[0] + '…'
        if not summary:
            summary = it['title']

        articles.append({
            'id': make_id(it['source'] + '|' + it['title'][:120]),
            'headline': it['title'][:240],
            'source': it['source'],
            'sourceUrl': it['sourceUrl'],
            'url': it['link'],
            'publishedAt': it['pub'].astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'companyIds': company_ids,
            'category': category,
            'summary': summary,
            'impactScore': impact,
            'isBreaking': bool(is_breaking),
            'readMinutes': rm,
        })

    # Sort by date desc, cap
    articles.sort(key=lambda a: a['publishedAt'], reverse=True)
    articles = articles[:MAX_ITEMS]

    # Cat / source rollup for log
    by_cat = {}
    by_src = {}
    for a in articles:
        by_cat[a['category']] = by_cat.get(a['category'], 0) + 1
        by_src[a['source']] = by_src.get(a['source'], 0) + 1

    # Emit
    out_obj = {
        'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'count': len(articles),
        'sources': sorted(by_src.items(), key=lambda x: -x[1]),
        'articles': articles,
    }
    with open(NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(out_obj, f, separators=(',', ':'))
    print(f'\nWrote {NEWS_FILE}')
    print(f'  Articles: {len(articles)}')
    print(f'  By category: {by_cat}')
    print(f'  By source: {by_src}')

    # Update meta.json freshness
    try:
        meta = {}
        if os.path.exists(META_FILE):
            with open(META_FILE, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        meta['news'] = {
            'count': len(articles),
            'updatedAt': out_obj['generatedAt'],
        }
        with open(META_FILE, 'w', encoding='utf-8') as f:
            json.dump(meta, f, indent=2)
        print(f'  Updated meta.news in {META_FILE}')
    except Exception as e:
        print(f'  meta.json update skipped ({type(e).__name__})')


if __name__ == '__main__':
    main()
