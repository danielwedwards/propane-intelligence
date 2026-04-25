"""
Batch 12 integration:
- 10 FS Cooperatives: merge scrape data into existing records or create new
- Discovery batch pa_oh_mi_ny: 45 new companies
"""
import json
import os
import time
import urllib.request
import urllib.parse

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

with open(os.path.join(DATA_DIR, 'geocode_cache.json')) as f:
    geocode_cache = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}


def geocode(query):
    if query in geocode_cache:
        v = geocode_cache[query]
        if v is None:
            return None
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


def loc_key(l):
    return ((l.get('address') or '').strip().lower(),
            (l.get('city') or '').strip().lower(),
            (l.get('state') or '').strip().upper())


def scrape_to_loc(s, source_tag, default_name):
    out = {
        'name': s.get('name') or default_name,
        'city': s.get('city', ''),
        'state': (s.get('state') or '').upper(),
        'county': '',
        'address': s.get('street', ''),
        'zip': s.get('zip', ''),
        'phone': s.get('phone', ''),
        'source': source_tag,
    }
    # Geocode if needed
    if s.get('lat') and s.get('lng'):
        try:
            out['lat'] = round(float(s['lat']), 6)
            out['lng'] = round(float(s['lng']), 6)
        except:
            pass
    return out


by_id = {c['id']: c for c in companies}
removed = set()

FS_COOPS = [
    ('evergreen_fs', 'deep_scrape_evergreen_fs.json', 'Evergreen FS', 'IL', 'Woodford County, IL', 'FS System ag coop with grain/feed/propane/energy ops across Central Illinois.'),
    ('heritage_fs', 'deep_scrape_heritage_fs.json', 'Heritage FS', 'IL', 'Bourbonnais', 'FS System ag coop, Kankakee/Iroquois/Will counties Illinois.'),
    ('prairieland_fs', 'deep_scrape_prairieland_fs.json', 'Prairieland FS', 'IL', 'Jacksonville', 'FS System ag coop, West Central Illinois.'),
    ('wabash_valley_fs', 'deep_scrape_wabash_valley_fs.json', 'Wabash Valley FS', 'IN', 'Terre Haute', 'FS System ag coop, Indiana/Illinois Wabash Valley.'),
    ('mm_service_company', 'deep_scrape_mm_service.json', 'M&M Service Company', 'IL', 'Carlinville', 'FS System ag coop, Macoupin/Montgomery counties Illinois.'),
    ('southern_fs', 'deep_scrape_southern_fs.json', 'Southern FS', 'IL', 'Marion', 'FS System ag coop, Southern Illinois.'),
    ('grainco_fs', 'deep_scrape_grainco_fs.json', 'GRAINCO FS', 'IL', 'Ottawa', 'FS System ag coop, North Central Illinois.'),
    ('south_central_fs', 'deep_scrape_south_central_fs.json', 'South Central FS', 'IL', 'Effingham', 'FS System ag coop, South Central Illinois.'),
    ('conserv_fs', 'deep_scrape_conserv_fs.json', 'Conserv FS', 'IL', 'Woodstock', 'FS System ag coop, Northern Illinois (McHenry/Boone/DeKalb).'),
    ('sunrise_fs', 'deep_scrape_illini_fs.json', 'Sunrise FS (formerly Illini FS)', 'IL', 'Gibson City', 'FS System ag coop, East Central Illinois. Illini FS rebranded as Sunrise FS.'),
]

# Existing FS Coop records to merge/replace
EXISTING_FS_MAP = {
    'evergreen_fs': 'evergreen_fs',
    'heritage_fs': None,
    'prairieland_fs': ['prairieland_fs', 'prairieland_fs_inc_taylor'],
    'wabash_valley_fs': None,
    'mm_service_company': None,
    'southern_fs': ['southern_fs_inc'],
    'grainco_fs': ['grainco_fs_inc'],
    'south_central_fs': None,
    'conserv_fs': ['conserv_fs'],
    'sunrise_fs': ['illini_fs'],
}

print("=== FS Cooperatives Integration ===")
for new_id, scrape_file, name, hq_state, hq_city, desc in FS_COOPS:
    scrape_path = os.path.join(DATA_DIR, scrape_file)
    if not os.path.exists(scrape_path):
        print(f"  SKIP: {scrape_file}")
        continue
    with open(scrape_path) as f:
        scrape = json.load(f)
    scraped = scrape.get('locations', [])
    if not scraped:
        continue

    existing_keys_to_merge = EXISTING_FS_MAP.get(new_id)
    if existing_keys_to_merge is None:
        existing_keys_to_merge = []
    elif isinstance(existing_keys_to_merge, str):
        existing_keys_to_merge = [existing_keys_to_merge]

    # Find primary (prefer first existing record)
    primary = None
    for eid in existing_keys_to_merge:
        if eid in by_id:
            primary = by_id[eid]
            break

    if primary:
        # Merge into existing
        existing_keys = {loc_key(l) for l in primary.get('locations', [])}
        added = 0
        for s in scraped:
            k = ((s.get('street') or '').strip().lower(),
                 (s.get('city') or '').strip().lower(),
                 (s.get('state') or '').strip().upper())
            if k in existing_keys:
                continue
            existing_keys.add(k)
            new_loc = scrape_to_loc(s, f'{new_id}_scrape', name)
            # Geocode if no lat/lng
            if 'lat' not in new_loc and s.get('city') and s.get('state'):
                q = f"{s.get('street','')}, {s.get('city','')}, {s.get('state','')}" if s.get('street') else f"{s.get('city','')}, {s.get('state','')}"
                r = geocode(q)
                if r:
                    new_loc['lat'] = round(r[0], 6)
                    new_loc['lng'] = round(r[1], 6)
            primary['locations'].append(new_loc)
            added += 1
        # Merge additional dups
        for eid in existing_keys_to_merge[1:]:
            if eid in by_id:
                dup = by_id[eid]
                for l in dup.get('locations', []):
                    k = loc_key(l)
                    if k in existing_keys:
                        continue
                    existing_keys.add(k)
                    primary['locations'].append(l)
                removed.add(eid)
        primary['name'] = name
        primary['parentGroup'] = 'GROWMARK Inc.'
        primary['hqState'] = hq_state
        primary['hqCity'] = hq_city.split(',')[0]
        primary['ownership'] = 'coop'
        primary['ownerDetail'] = 'GROWMARK FS System cooperative'
        primary['description'] = desc
        primary['website'] = 'https://fscooperatives.com/' + new_id.replace('_', '')
        primary['dataConfidence'] = 4
        primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
        primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
        primary['totalLocs'] = len(primary['locations'])
        print(f"  {name} (merged into {primary['id']}): {len(primary['locations'])} locations (+{added})")
    else:
        # Create new record
        locations = []
        for s in scraped:
            new_loc = scrape_to_loc(s, f'{new_id}_scrape', name)
            if 'lat' not in new_loc and s.get('city') and s.get('state'):
                q = f"{s.get('street','')}, {s.get('city','')}, {s.get('state','')}" if s.get('street') else f"{s.get('city','')}, {s.get('state','')}"
                r = geocode(q)
                if r:
                    new_loc['lat'] = round(r[0], 6)
                    new_loc['lng'] = round(r[1], 6)
            locations.append(new_loc)
        states_list = sorted({l['state'] for l in locations if l.get('state')})
        rec = {
            "id": new_id,
            "name": name,
            "parentGroup": "GROWMARK Inc.",
            "hqCity": hq_city.split(',')[0],
            "hqState": hq_state,
            "website": 'https://fscooperatives.com/' + new_id.replace('_', ''),
            "ownership": "coop",
            "ownerDetail": "GROWMARK FS System cooperative",
            "states": states_list,
            "seLocs": sum(1 for l in locations if l.get('state') in SE),
            "totalLocs": len(locations),
            "excluded": False,
            "optBScore": None, "optBTier": None, "optCScore": None, "optCTier": None,
            "locations": locations,
            "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
            "description": desc,
            "serviceTypes": ["residential", "commercial", "agricultural"],
            "keyPersonnel": [], "phone": "", "email": "",
            "dataConfidence": 4, "lastResearched": "2026-04-11",
            "yearFounded": None, "lastAcquisition": None,
        }
        companies.append(rec)
        by_id[new_id] = rec
        print(f"  {name} (NEW): {len(locations)} locations")

# Save cache
with open(os.path.join(DATA_DIR, 'geocode_cache.json'), 'w') as f:
    json.dump(geocode_cache, f, separators=(',', ':'))

# Remove merged dups
companies = [c for c in companies if c['id'] not in removed]

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
print(f"Removed: {len(removed)}")
