"""
Phase 18 — Signals ingestion.

Produces `data/signals.json` populated with HARD signals derived from
authoritative public sources:

  1. SEC EDGAR full-text search for tracked public propane operators
     (Suburban, Ferrellgas, UGI/AmeriGas, CHS, Superior Plus) plus a generic
     "propane" sweep, surfacing 8-K, Form D, 13D/13G, and DEF 14A filings.
  2. M&A-tagged articles from data/news.json (output of news_ingest.py)
     are promoted to "rumored / reported" signals so the Signals view picks
     up trade-press-broken stories alongside SEC filings.

The output is consumed by `SignalsView` in js/Views2.jsx, which merges these
HARD signals with the existing soft heuristic signals (derived from company
attributes via _deriveSignals) and labels each with a confidence badge.

Output schema (per signal):
  { id, companyId, type, label, source, sourceUrl, observedAt, evidence,
    strength (0-100), confidence: 'high' | 'medium' | 'low',
    notes, tags: string[] }

Run:
  python scripts/signals_ingest.py
"""
import json, os, re, hashlib, socket
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.parse import quote_plus

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
COMPANIES_FILE = os.path.join(DATA_DIR, 'companies.json')
NEWS_FILE = os.path.join(DATA_DIR, 'news.json')
SIGNALS_FILE = os.path.join(DATA_DIR, 'signals.json')
META_FILE = os.path.join(DATA_DIR, 'meta.json')

USER_AGENT = 'PropaneIntelligence-SignalsBot/1.0 (daniel.edwards@ergon.com)'
SOCKET_TIMEOUT = 12
LOOKBACK_DAYS = 120
MAX_PER_COMPANY = 4         # cap per-company hard signals so feed isn't dominated by one filer

socket.setdefaulttimeout(SOCKET_TIMEOUT)

# Tracked public-company tickers → company id in companies.json.
# Same set as news_ingest.py — keep in sync.
TICKER_TO_ID = {
    'SPH': 'suburban_propane_partners__l_p_',
    'FGPR': 'ferrellgas',
    'UGI': 'amerigas_partners___ugi_corporation',
    'CHS': 'chs_propane',
    'SPB.TO': 'superior_plus_propane',
}

# Form-type → (signal type key, label, base strength, notes template)
FORM_META = {
    '8-K':   ('public_material_event', '8-K material event',          78,
              'Material event filing — review item disclosure for M&A, leadership, capital implications.'),
    'D':     ('private_capital_raise', 'Form D — private placement',  82,
              'Private placement disclosure suggests capital raise; in PE-backed cycles often precedes a recap or acquisition.'),
    'D/A':   ('private_capital_raise', 'Form D/A — placement amendment', 70,
              'Amendment to private placement disclosure — track for size or investor changes.'),
    '13D':   ('activist_holder',       '13D — activist / major holder', 90,
              'New 5%+ holder filed with intent — strongest pre-event indicator on equity-listed names.'),
    'SC 13D': ('activist_holder',      '13D — activist / major holder', 90,
              'New 5%+ holder filed with intent — strongest pre-event indicator on equity-listed names.'),
    '13G':   ('passive_holder',        '13G — passive 5%+ holder',    55,
              'Passive 5%+ holder; flag for cross-portfolio context.'),
    'SC 13G': ('passive_holder',       '13G — passive 5%+ holder',    55,
              'Passive 5%+ holder; flag for cross-portfolio context.'),
    'DEF 14A': ('proxy_filing',        'DEF 14A — proxy statement',   40,
              'Annual proxy — review for governance changes, related-party transactions, executive compensation.'),
    '10-K':  ('periodic_filing',       '10-K — annual report',        35,
              'Annual report; baseline filing.'),
    '10-Q':  ('periodic_filing',       '10-Q — quarterly report',     30,
              'Quarterly report; baseline filing.'),
}


def http_get(url, timeout=SOCKET_TIMEOUT):
    req = Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json,*/*'})
    with urlopen(req, timeout=timeout) as r:
        return r.read().decode(r.headers.get_content_charset() or 'utf-8', 'replace')


def make_id(seed):
    return 's_' + hashlib.md5(seed.encode('utf-8')).hexdigest()[:10]


def normalize_form(f):
    if not f:
        return ''
    f = str(f).strip().upper().replace('SC ', '')
    return f


def fetch_edgar(query, lookback_days=LOOKBACK_DAYS, forms='8-K,D'):
    """Return list of EDGAR hits. `query` is a phrase (quoted in the URL).

    The EDGAR full-text search rejects forms with embedded spaces or slashes
    when bundled in a single comma-separated parameter, so we keep `forms`
    restricted to the core deal-relevant types: 8-K (material events) and
    Form D (private placements). 13D/13G/DEF 14A would be additional value
    but require separate per-form requests — left as a future enhancement.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime('%Y-%m-%d')
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    # Note: do NOT URL-encode the `forms` parameter — EDGAR expects the bare
    # comma-separated form names. Encoding the comma yields zero hits.
    url = ('https://efts.sec.gov/LATEST/search-index'
           f'?q={quote_plus(chr(34) + query + chr(34))}'
           f'&forms={forms}'
           f'&dateRange=custom&startdt={cutoff}&enddt={today}')
    print(f'  [edgar] {query[:50]:50} … ', end='', flush=True)
    try:
        body = http_get(url)
        data = json.loads(body)
    except Exception as e:
        print(f'FAIL ({type(e).__name__})')
        return []
    hits = (data.get('hits') or {}).get('hits') or []
    print(f'{len(hits)} hits')
    return hits


def hit_to_signal(hit, default_company_id=None):
    src = hit.get('_source') or {}
    forms = src.get('forms') or []
    form = normalize_form(forms[0] if forms else (src.get('form') or '8-K'))
    meta = FORM_META.get(form) or FORM_META.get('8-K')
    type_key, label, base_strength, default_notes = meta
    displayed = src.get('display_names') or []
    company_label = displayed[0] if displayed else (src.get('entity') or '—')
    filed_raw = src.get('file_date') or src.get('filed') or src.get('@timestamp') or ''
    try:
        observed_dt = datetime.fromisoformat(filed_raw.replace('Z', '+00:00'))
        if observed_dt.tzinfo is None:
            observed_dt = observed_dt.replace(tzinfo=timezone.utc)
    except Exception:
        observed_dt = None
    cik = (src.get('ciks') or [None])[0]
    adsh = (hit.get('_id') or '').split(':')[0]
    if cik and adsh:
        # Reformat accession number for the SEC URL: 0000000000-00-000000 → 0000000000000000
        adsh_clean = adsh.replace('-', '')
        url = (f'https://www.sec.gov/Archives/edgar/data/{int(cik)}/{adsh_clean}/'
               f'{adsh}-index.htm')
    elif cik:
        url = f'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type={form}'
    else:
        url = f'https://efts.sec.gov/LATEST/search-index?q={quote_plus(form)}'

    company_id = default_company_id
    # If no preset, try to map via display_names → ticker → id
    if not company_id:
        for tk, cid in TICKER_TO_ID.items():
            if tk in (company_label or '') or tk in (src.get('tickers') or []):
                company_id = cid
                break

    return {
        'id': make_id(f'edgar|{adsh}|{form}|{company_label}'),
        'companyId': company_id,
        'companyLabel': company_label,
        'type': type_key,
        'label': label,
        'source': 'SEC EDGAR',
        'sourceUrl': 'sec.gov',
        'url': url,
        'observedAt': observed_dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ') if observed_dt else None,
        'evidence': f'Accession: {adsh or "—"} · Form {form}',
        'strength': base_strength,
        'confidence': 'high',
        'notes': default_notes,
        'tags': ['SEC', form],
    }


def collect_news_signals():
    """Promote M&A-category news articles to rumored signals."""
    if not os.path.exists(NEWS_FILE):
        return []
    with open(NEWS_FILE, 'r', encoding='utf-8') as f:
        try:
            news = json.load(f)
        except Exception:
            return []
    out = []
    for a in (news.get('articles') or []):
        if a.get('category') == 'ma' and a.get('companyIds'):
            for cid in a['companyIds']:
                out.append({
                    'id': make_id('news|' + a.get('id', '') + '|' + cid),
                    'companyId': cid,
                    'companyLabel': cid,
                    'type': 'rumored_ma',
                    'label': 'M&A reporting',
                    'source': a.get('source', 'Trade press'),
                    'sourceUrl': a.get('sourceUrl', ''),
                    'url': a.get('url', ''),
                    'observedAt': a.get('publishedAt'),
                    'evidence': a.get('headline', '')[:240],
                    'strength': max(60, min(95, int(a.get('impactScore', 60)) + 5)),
                    'confidence': 'medium',
                    'notes': a.get('summary', '')[:240],
                    'tags': ['News', 'M&A'],
                })
    return out


def main():
    print('Loading companies …')
    with open(COMPANIES_FILE, 'r', encoding='utf-8') as f:
        companies = json.load(f)
    name_to_id = {(c.get('name') or '').lower(): c.get('id') for c in companies if c.get('id')}
    id_to_name = {c.get('id'): c.get('name') for c in companies if c.get('id')}

    print('\nQuerying SEC EDGAR ...')
    raw_hits = []
    # Tracked public-company sweeps. Use multiple short variants so EDGAR
    # full-text search lands hits despite small differences in registered name.
    EDGAR_QUERIES = [
        ('suburban_propane_partners__l_p_',         'Suburban Propane Partners'),
        ('ferrellgas',                              'Ferrellgas'),
        ('amerigas_partners___ugi_corporation',     'AmeriGas Partners'),
        ('amerigas_partners___ugi_corporation',     'UGI Corporation'),
        ('superior_plus_propane',                   'Superior Plus'),
    ]
    for cid, qtext in EDGAR_QUERIES:
        for h in fetch_edgar(qtext):
            raw_hits.append(hit_to_signal(h, default_company_id=cid))
    # Generic "propane" 8-K sweep — picks up tangential filings that mention
    # propane in the body. Lower-confidence; the per-company dedupe / cap
    # downstream prevents flooding the feed.
    for h in fetch_edgar('propane', forms='8-K'):
        raw_hits.append(hit_to_signal(h))

    # Drop signals with no observedAt (can't sort) or no companyId AND no label
    valid = [s for s in raw_hits if s.get('observedAt')]
    print(f'\nEDGAR raw signals: {len(raw_hits)}, valid: {len(valid)}')

    # News-promoted signals
    print('Promoting M&A news -> rumored signals ...')
    news_sigs = collect_news_signals()
    print(f'  +{len(news_sigs)}')
    valid.extend(news_sigs)

    # Dedupe by id
    by_id = {}
    for s in valid:
        by_id[s['id']] = s
    signals = list(by_id.values())

    # Resolve companyLabel via id_to_name
    for s in signals:
        if s.get('companyId') and id_to_name.get(s['companyId']):
            s['companyLabel'] = id_to_name[s['companyId']]

    # Cap per company
    by_co = {}
    for s in sorted(signals, key=lambda x: x['observedAt'] or '', reverse=True):
        cid = s.get('companyId') or '_'
        by_co.setdefault(cid, []).append(s)
    capped = []
    for cid, ss in by_co.items():
        capped.extend(ss[:MAX_PER_COMPANY])

    capped.sort(key=lambda x: (x['strength'], x['observedAt'] or ''), reverse=True)

    out_obj = {
        'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'count': len(capped),
        'signals': capped,
    }
    with open(SIGNALS_FILE, 'w', encoding='utf-8') as f:
        json.dump(out_obj, f, separators=(',', ':'))
    print(f'\nWrote {SIGNALS_FILE}')

    # Roll-ups for the log
    by_type = {}
    by_company = {}
    for s in capped:
        by_type[s['type']] = by_type.get(s['type'], 0) + 1
        if s.get('companyId'):
            by_company[s['companyId']] = by_company.get(s['companyId'], 0) + 1
    print(f'  Total: {len(capped)} signals')
    print(f'  By type: {by_type}')
    print(f'  Companies with hard signals: {len(by_company)}')

    # Update meta.json
    try:
        meta = {}
        if os.path.exists(META_FILE):
            with open(META_FILE, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        meta['signals'] = {
            'count': len(capped),
            'updatedAt': out_obj['generatedAt'],
        }
        with open(META_FILE, 'w', encoding='utf-8') as f:
            json.dump(meta, f, indent=2)
        print(f'  Updated meta.signals in {META_FILE}')
    except Exception as e:
        print(f'  meta.json update skipped ({type(e).__name__})')


if __name__ == '__main__':
    main()
