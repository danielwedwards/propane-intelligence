"""
Integrate 245 companies from research agent + check OSM results if available.
Cross-reference against existing dataset, geocode, and add new ones.
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
            result = (float(data[0]['lat']), float(data[0]['lon']), data[0].get('display_name', ''))
            geocode_cache[query] = result
            time.sleep(1.1)
            return result
    except:
        pass
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
    for s in [', inc.', ', llc', ', l.p.', ' inc.', ' inc', ' llc', ' lp', ' co.', ' corp', ' ltd']:
        n = n.replace(s, '')
    n = re.sub(r'[^a-z0-9 ]', '', n)
    return n.strip()

existing_norms = {norm(c['name']) for c in companies}
existing_ids = {c['id'] for c in companies}

def is_existing(name):
    n = norm(name)
    for en in existing_norms:
        if n == en or (len(n) > 5 and len(en) > 5 and (n in en or en in n)):
            return True
    return False

# Load research agent results
with open(os.path.join(DATA_DIR, 'pending_research_agent.json')) as f:
    research = json.load(f)

# State name to clean city mapping
def clean_city(city, state):
    """Clean up city names from research data."""
    if not city or city.lower() in ('', 'statewide', 'various', 'multiple locations',
                                     'regional', 'unknown'):
        return ''
    # Remove state references, directions
    city = re.sub(r'\s*(area|region|county|counties|statewide).*', '', city, flags=re.I)
    city = city.strip()
    return city

print(f"Starting: {len(companies)} companies")

added = 0
skipped = 0
no_city = 0

for rc in research:
    name = rc['name']
    state = rc['state']
    city = clean_city(rc.get('city', ''), state)

    if is_existing(name):
        skipped += 1
        continue

    # Skip entries that are clearly not company names
    if len(name) < 3 or name.startswith('---'):
        continue

    cid = make_id(name)
    if cid in existing_ids:
        cid = cid + f'_{state.lower()}'
    existing_ids.add(cid)
    existing_norms.add(norm(name))

    # Geocode
    locations = []
    if city:
        result = geocode(f"{city}, {state}")
        if result:
            lat, lng, _ = result
            locations.append({
                'name': name, 'city': city, 'state': state,
                'county': '', 'lat': round(lat, 4), 'lng': round(lng, 4), 'address': ''
            })
    else:
        no_city += 1

    SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}
    se_locs = sum(1 for l in locations if l.get('state') in SE)

    record = {
        "id": cid, "name": name, "parentGroup": name,
        "hqCity": city if city else "", "hqState": state, "website": "",
        "ownership": "private", "ownerDetail": "Private",
        "states": [state], "seLocs": se_locs, "totalLocs": max(1, len(locations)),
        "excluded": False, "optBScore": None, "optBTier": None,
        "optCScore": None, "optCTier": None, "locations": locations,
        "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
        "description": f"Propane distributor in {state}. Source: web research.",
        "serviceTypes": ["residential", "commercial"],
        "keyPersonnel": [], "phone": "", "email": "",
        "dataConfidence": 1, "lastResearched": "2026-04-09",
        "yearFounded": None, "lastAcquisition": None,
    }
    companies.append(record)
    added += 1

print(f"\nResearch agent: Added {added}, Skipped {skipped}, No city {no_city}")

# Also check if OSM results are available
osm_path = os.path.join(DATA_DIR, 'osm_propane.json')
osm_added = 0
if os.path.exists(osm_path):
    with open(osm_path) as f:
        osm_data = json.load(f)
    print(f"\nOSM data available: {len(osm_data)} elements")

    for el in osm_data:
        name = el.get('name', '')
        if not name or len(name) < 3:
            continue
        if is_existing(name):
            continue

        lat = el.get('lat')
        lng = el.get('lng')
        state = el.get('state', '')
        city = el.get('city', '')

        if not lat or not lng:
            continue

        cid = make_id(name)
        if cid in existing_ids:
            cid = cid + '_osm'
        if cid in existing_ids:
            continue
        existing_ids.add(cid)
        existing_norms.add(norm(name))

        SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

        locations = [{
            'name': name, 'city': city, 'state': state,
            'county': '', 'lat': round(lat, 4), 'lng': round(lng, 4),
            'address': el.get('address', '')
        }]

        record = {
            "id": cid, "name": name, "parentGroup": name,
            "hqCity": city, "hqState": state, "website": "",
            "ownership": "private", "ownerDetail": "Private",
            "states": [state] if state else [], "seLocs": 0,
            "totalLocs": 1, "excluded": False,
            "optBScore": None, "optBTier": None,
            "optCScore": None, "optCTier": None,
            "locations": locations,
            "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
            "description": f"Propane business. Source: OpenStreetMap.",
            "serviceTypes": ["residential", "commercial"],
            "keyPersonnel": [], "phone": "", "email": "",
            "dataConfidence": 1, "lastResearched": "2026-04-09",
            "yearFounded": None, "lastAcquisition": None,
        }
        companies.append(record)
        osm_added += 1

    print(f"OSM: Added {osm_added}")
else:
    print("\nOSM data not yet available")

# Save
with open(CACHE_FILE, 'w') as f:
    json.dump(geocode_cache, f, separators=(',', ':'))

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}
for c in companies:
    c['seLocs'] = sum(1 for l in c.get('locations', []) if l.get('state') in SE)

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== FINAL ===")
print(f"Total companies: {len(companies)}")
print(f"Total locations: {total_locs}")

# State coverage
state_cos = {}
for c in companies:
    for s in c.get('states', []):
        state_cos[s] = state_cos.get(s, 0) + 1
print(f"\nAll states ({len(state_cos)}):")
for st in sorted(state_cos.keys()):
    print(f"  {st}: {state_cos[st]}")
