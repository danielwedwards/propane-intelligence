"""
Batch-add new companies from multiple sources:
1. Florida PGA dealer list (35 companies)
2. Any other pending sources

Uses geocoding for HQ locations.
"""
import json
import os
import re
import time
import urllib.request
import urllib.parse

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'
CACHE_FILE = os.path.join(DATA_DIR, 'geocode_cache.json')

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

geocode_cache = {}
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE) as f:
        geocode_cache = json.load(f)

def geocode(query):
    if query in geocode_cache:
        return geocode_cache[query]
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({
        'q': query, 'format': 'json', 'limit': 1, 'countrycodes': 'us'
    })
    req = urllib.request.Request(url, headers={'User-Agent': 'PropaneMarketMap/1.0'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
        if data:
            result = (float(data[0]['lat']), float(data[0]['lon']), data[0].get('display_name',''))
            geocode_cache[query] = result
            time.sleep(1.1)
            return result
    except Exception as e:
        print(f"    Geocode error: {query}")
    geocode_cache[query] = None
    time.sleep(1.1)
    return None

def make_id(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9 ]', '', s)
    s = re.sub(r'\s+', '_', s).strip('_')
    return s

def norm(name):
    n = name.lower().strip()
    for s in [', inc.', ', llc', ', l.p.', ' inc.', ' inc', ' llc', ' lp', ' co.', ' corp']:
        n = n.replace(s, '')
    n = re.sub(r'[^a-z0-9 ]', '', n)
    return n.strip()

existing_norms = {norm(c['name']) for c in companies}
existing_ids = {c['id'] for c in companies}

def is_existing(name):
    n = norm(name)
    for en in existing_norms:
        if n == en or (len(n) > 6 and len(en) > 6 and (n in en or en in n)):
            return True
    return False

# Load pending Florida companies
with open(os.path.join(DATA_DIR, 'pending_florida.json')) as f:
    florida = json.load(f)

print(f"Starting: {len(companies)} companies")
added = 0
skipped = 0

for fc in florida:
    name = fc['name']
    if is_existing(name):
        skipped += 1
        continue

    cid = make_id(name)
    if cid in existing_ids:
        cid = cid + '_fl'
    existing_ids.add(cid)
    existing_norms.add(norm(name))

    # Geocode
    result = geocode(f"{fc['city']}, {fc['state']}")
    locations = []
    if result:
        lat, lng, _ = result
        locations.append({
            'name': name, 'city': fc['city'], 'state': fc['state'],
            'county': '', 'lat': round(lat, 4), 'lng': round(lng, 4), 'address': ''
        })

    record = {
        "id": cid, "name": name, "parentGroup": name,
        "hqCity": fc['city'], "hqState": fc['state'], "website": "",
        "ownership": "private", "ownerDetail": "Private",
        "states": [fc['state']], "seLocs": 1, "totalLocs": 1,
        "excluded": False, "optBScore": None, "optBTier": None,
        "optCScore": None, "optCTier": None, "locations": locations,
        "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
        "description": f"Propane dealer in {fc['city']}, Florida. Source: FPGA 2020 dealer members list.",
        "serviceTypes": ["residential", "commercial"],
        "keyPersonnel": [], "phone": "", "email": "",
        "dataConfidence": 2, "lastResearched": "2026-04-09",
        "yearFounded": None, "lastAcquisition": None,
    }
    companies.append(record)
    added += 1
    print(f"  + {name} ({fc['city']}, {fc['state']})")

print(f"\nAdded: {added}, Skipped: {skipped}")
print(f"Total companies: {len(companies)}")

# Save cache and companies
with open(CACHE_FILE, 'w') as f:
    json.dump(geocode_cache, f, separators=(',', ':'))

SE = {'AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA'}
for c in companies:
    c['seLocs'] = sum(1 for l in c.get('locations', []) if l.get('state') in SE)

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"Total locations: {total_locs}")

# State coverage update
state_cos = {}
for c in companies:
    for s in c.get('states', []):
        state_cos[s] = state_cos.get(s, 0) + 1
print(f"\nTop 15 states by company count:")
for st, count in sorted(state_cos.items(), key=lambda x: x[1], reverse=True)[:15]:
    print(f"  {st}: {count}")
