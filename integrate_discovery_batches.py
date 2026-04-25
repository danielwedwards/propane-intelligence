"""
Integrate discovery batch results from SE/TX/FL/GA/NC/AL/TN agents.
- Reads data/discovery_results_batch_*.json
- Dedupes against existing companies.json (normalized names, by state)
- Geocodes new locations via Nominatim
- Adds new companies with proper schema
- Saves updated companies.json
"""
import json
import os
import re
import time
import urllib.request
import urllib.parse
import glob

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'
CACHE_FILE = os.path.join(DATA_DIR, 'geocode_cache.json')

# State bounding boxes for validation
STATE_BOXES = {
    'TX': (25.84, 36.50, -106.65, -93.51),
    'FL': (24.52, 31.00, -87.63, -80.03),
    'GA': (30.36, 35.00, -85.61, -80.84),
    'NC': (33.84, 36.59, -84.32, -75.46),
    'AL': (30.22, 35.01, -88.47, -84.89),
    'TN': (34.98, 36.68, -90.31, -81.65),
    'VA': (36.54, 39.47, -83.68, -75.24),
    'KY': (36.50, 39.15, -89.57, -81.97),
    'SC': (32.03, 35.22, -83.35, -78.54),
    'MS': (30.17, 34.99, -91.66, -88.10),
    'LA': (28.93, 33.02, -94.04, -88.76),
    'AR': (33.00, 36.50, -94.62, -89.64),
    'WV': (37.20, 40.64, -82.64, -77.72),
    'OK': (33.62, 37.00, -103.00, -94.43),
    'MO': (35.99, 40.61, -95.77, -89.10),
    'IN': (37.77, 41.76, -88.10, -84.78),
    'OH': (38.40, 41.98, -84.82, -80.52),
    'MD': (37.89, 39.72, -79.49, -75.05),
    'DE': (38.45, 39.84, -75.79, -75.05),
}

# State centroid fallbacks
STATE_CENTROIDS = {
    'TX': (31.0, -99.0), 'FL': (27.6, -81.5), 'GA': (32.6, -83.4),
    'NC': (35.5, -79.5), 'AL': (32.8, -86.8), 'TN': (35.8, -86.4),
    'VA': (37.4, -78.6), 'KY': (37.5, -85.2), 'SC': (33.9, -80.9),
    'MS': (32.8, -89.6), 'LA': (31.2, -92.0), 'AR': (34.8, -92.4),
    'WV': (38.6, -80.5), 'OK': (35.5, -97.0), 'MO': (38.3, -92.5),
}

def in_state(lat, lng, st):
    if st not in STATE_BOXES:
        return True
    s, n, w, e = STATE_BOXES[st]
    return s <= lat <= n and w <= lng <= e

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

geocode_cache = {}
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE) as f:
        geocode_cache = json.load(f)


def geocode(query):
    if query in geocode_cache:
        v = geocode_cache[query]
        if v is None:
            return None
        # Handle both 2-tuple and 3-tuple formats
        if len(v) >= 2:
            return (float(v[0]), float(v[1]))
        return None
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({
        'q': query, 'format': 'json', 'limit': 1, 'countrycodes': 'us'
    })
    req = urllib.request.Request(url, headers={'User-Agent': 'PropaneMarketMap/1.0'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
        if data:
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            geocode_cache[query] = [lat, lon, data[0].get('display_name', '')]
            time.sleep(1.2)
            return (lat, lon)
    except Exception:
        pass
    geocode_cache[query] = None
    time.sleep(1.2)
    return None


def make_id(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9 ]', '', s)
    s = re.sub(r'\s+', '_', s).strip('_')
    return s


def normalize(name):
    n = name.lower()
    for suffix in ['inc', 'llc', 'lp', 'corporation', 'company', ' co ',
                   'propane', 'gas', 'energy', 'fuel', 'oil', 'service', 'services', 'lpg',
                   ' corp', ' ltd']:
        n = n.replace(suffix, '')
    return ''.join(c for c in n if c.isalnum())


existing_norms = {normalize(c['name']) for c in companies}
existing_ids = {c['id'] for c in companies}

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

# Find all discovery batch files
batch_files = sorted(glob.glob(os.path.join(DATA_DIR, 'discovery_results_batch_*.json')))
print(f"Found {len(batch_files)} batch files")
for bf in batch_files:
    print(f"  {os.path.basename(bf)}")

all_records = []
for bf in batch_files:
    with open(bf) as f:
        data = json.load(f)
    batch_name = data.get('batch', os.path.basename(bf))
    records = data.get('companies', [])
    print(f"\n{batch_name}: {len(records)} companies in batch")
    all_records.extend(records)

print(f"\nTotal batch records: {len(all_records)}")
print(f"Starting dataset: {len(companies)} companies")

added = 0
skipped_dup = 0
skipped_invalid = 0
locations_added = 0
precise_geocoded = 0

for rc in all_records:
    name = (rc.get('name') or '').strip()
    state = (rc.get('hqState') or '').strip().upper()
    city = (rc.get('hqCity') or '').strip()

    if not name or len(name) < 3 or not state:
        skipped_invalid += 1
        continue

    n = normalize(name)
    if n in existing_norms:
        skipped_dup += 1
        continue
    # Also check substring match for long names
    is_dup = False
    if len(n) > 6:
        for en in existing_norms:
            if len(en) > 6 and (n == en or (n in en and len(n) / len(en) > 0.7) or (en in n and len(en) / len(n) > 0.7)):
                is_dup = True
                break
    if is_dup:
        skipped_dup += 1
        continue

    cid = make_id(name)
    if cid in existing_ids:
        cid = cid + '_' + state.lower()
    if cid in existing_ids:
        cid = cid + '_disc'
    existing_ids.add(cid)
    existing_norms.add(n)

    # Build locations list
    locations = []
    known = rc.get('knownLocations', []) or []
    for loc in known:
        lc = (loc.get('city') or '').strip()
        ls = (loc.get('state') or state).strip().upper()
        lstreet = (loc.get('street') or '').strip()
        if not lc and not lstreet:
            continue
        # Geocode
        query = None
        if lstreet and lc:
            query = f"{lstreet}, {lc}, {ls}"
        elif lc:
            query = f"{lc}, {ls}"
        lat = lng = None
        src = 'state_approx'
        if query:
            result = geocode(query)
            if result:
                rlat, rlng = result
                if in_state(rlat, rlng, ls):
                    lat, lng = rlat, rlng
                    src = 'nominatim_street' if lstreet else 'nominatim_city'
                    precise_geocoded += 1
        if lat is None:
            # fallback city-only
            if lc and lstreet:
                result = geocode(f"{lc}, {ls}")
                if result:
                    rlat, rlng = result
                    if in_state(rlat, rlng, ls):
                        lat, lng = rlat, rlng
                        src = 'nominatim_city'
        if lat is None:
            # state centroid jitter
            sc = STATE_CENTROIDS.get(ls)
            if sc:
                lat = sc[0] + ((hash(name + lc) % 1000) / 10000.0 - 0.05)
                lng = sc[1] + ((hash(name + lc + 'x') % 1000) / 10000.0 - 0.05)
                src = 'state_approx'
            else:
                continue
        locations.append({
            'name': name, 'city': lc, 'state': ls,
            'county': '', 'lat': round(lat, 4), 'lng': round(lng, 4),
            'address': lstreet, 'source': src
        })
        locations_added += 1

    # If no knownLocations provided, create one from hq
    if not locations and city:
        result = geocode(f"{city}, {state}")
        lat = lng = None
        src = 'state_approx'
        if result:
            rlat, rlng = result
            if in_state(rlat, rlng, state):
                lat, lng = rlat, rlng
                src = 'nominatim_city'
                precise_geocoded += 1
        if lat is None:
            sc = STATE_CENTROIDS.get(state)
            if sc:
                lat = sc[0] + ((hash(name) % 1000) / 10000.0 - 0.05)
                lng = sc[1] + ((hash(name + 'y') % 1000) / 10000.0 - 0.05)
        if lat is not None:
            locations.append({
                'name': name, 'city': city, 'state': state,
                'county': '', 'lat': round(lat, 4), 'lng': round(lng, 4),
                'address': '', 'source': src
            })
            locations_added += 1
    elif not locations:
        # no city and no known locations -- state centroid
        sc = STATE_CENTROIDS.get(state)
        if sc:
            lat = sc[0] + ((hash(name) % 1000) / 10000.0 - 0.05)
            lng = sc[1] + ((hash(name + 'z') % 1000) / 10000.0 - 0.05)
            locations.append({
                'name': name, 'city': '', 'state': state,
                'county': '', 'lat': round(lat, 4), 'lng': round(lng, 4),
                'address': '', 'source': 'state_approx'
            })
            locations_added += 1

    states_list = sorted({loc['state'] for loc in locations if loc.get('state')})
    if not states_list:
        states_list = [state]
    se_locs = sum(1 for loc in locations if loc.get('state') in SE)

    ownership = rc.get('ownership') or 'private'
    if ownership not in ('family', 'private', 'coop', 'municipal', 'pe', 'public'):
        ownership = 'private'

    owner_detail_map = {
        'family': 'Family-owned',
        'private': 'Private',
        'coop': 'Cooperative',
        'municipal': 'Municipal',
        'pe': 'Private Equity',
        'public': 'Publicly traded',
    }

    notes = rc.get('notes') or f"Propane distributor in {state}. Source: discovery agent."

    # Auto-classify company type
    try:
        from classify_company_types import classify as classify_ct
        _ct_rec = {"name": name, "description": notes, "ownership": ownership, "serviceTypes": ["residential", "commercial"]}
        ct, ct_conf, _ = classify_ct(_ct_rec)
    except Exception:
        ct, ct_conf = "retail_dealer", "low"

    record = {
        "id": cid,
        "name": name,
        "parentGroup": name,
        "hqCity": city,
        "hqState": state,
        "website": rc.get('website') or '',
        "ownership": ownership,
        "ownerDetail": owner_detail_map[ownership],
        "states": states_list,
        "seLocs": se_locs,
        "totalLocs": max(1, len(locations)),
        "excluded": False,
        "optBScore": None, "optBTier": None,
        "optCScore": None, "optCTier": None,
        "locations": locations,
        "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
        "description": notes,
        "serviceTypes": ["residential", "commercial"],
        "companyType": ct,
        "companyTypeConfidence": ct_conf,
        "keyPersonnel": [], "phone": "", "email": "",
        "dataConfidence": 2, "lastResearched": "2026-04-12",
        "yearFounded": None, "lastAcquisition": None,
    }
    companies.append(record)
    added += 1

# Save cache
with open(CACHE_FILE, 'w') as f:
    json.dump(geocode_cache, f, separators=(',', ':'))

# Resync seLocs and states
for c in companies:
    c['seLocs'] = sum(1 for loc in c.get('locations', []) if loc.get('state') in SE)
    c_states = sorted({loc['state'] for loc in c.get('locations', []) if loc.get('state')})
    if c_states:
        c['states'] = c_states
    c['totalLocs'] = max(len(c.get('locations', [])), c.get('totalLocs', 1) or 1)

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
all_states = set()
for c in companies:
    all_states.update(c.get('states', []))

print(f"\n=== INTEGRATION RESULTS ===")
print(f"Added:           {added} new companies")
print(f"Skipped dup:     {skipped_dup}")
print(f"Skipped invalid: {skipped_invalid}")
print(f"Locations added: {locations_added}")
print(f"Precise geocode: {precise_geocoded}")
print(f"\n=== DATASET ===")
print(f"Total companies: {len(companies)}")
print(f"Total locations: {total_locs}")
print(f"Total states:    {len(all_states)}")
