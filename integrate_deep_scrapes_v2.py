"""
Integrate deep scrapes for Paraco, Lakes Gas, Tri Gas & Oil, Dead River.
- Merge into primary company records
- Dedupe by (street, city, state)
- Consolidate any duplicate company entries
- Replace city-only locations with precise ones when available
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

# Map: primary company id -> scrape file
INTEGRATIONS = [
    ('paraco_gas_corporation', ['paraco_gas'], 'deep_scrape_paraco.json', 'paraco_sitemap'),
    ('lakes_gas_company', ['lakes_gas_co'], 'deep_scrape_lakes_gas.json', 'lakes_gas_sitemap'),
    ('dead_river_company', [], 'deep_scrape_deadriver.json', 'deadriver_scrape'),
]

def loc_key(loc):
    return (
        (loc.get('address', '') or '').strip().lower(),
        (loc.get('city', '') or '').strip().lower(),
        (loc.get('state', '') or '').strip().upper(),
    )

def scrape_key(loc):
    return (
        (loc.get('street', '') or '').strip().lower(),
        (loc.get('city', '') or '').strip().lower(),
        (loc.get('state', '') or '').strip().upper(),
    )

removed_ids = []

for primary_id, dup_ids, scrape_file, source_tag in INTEGRATIONS:
    primary = None
    dup_records = []
    for c in companies:
        if c['id'] == primary_id:
            primary = c
        elif c['id'] in dup_ids:
            dup_records.append(c)
    if primary is None:
        print(f"SKIP: primary {primary_id} not found")
        continue

    print(f"\n=== {primary['name']} ===")
    print(f"  Existing locations: {len(primary.get('locations', []))}")

    # Merge dup records' locations into primary
    for dup in dup_records:
        for loc in dup.get('locations', []):
            primary['locations'].append(loc)
        print(f"  Merged {len(dup.get('locations',[]))} from dup '{dup['name']}'")
        removed_ids.append(dup['id'])

    existing_keys = {loc_key(l) for l in primary.get('locations', [])}

    # Load scrape file
    with open(os.path.join(DATA_DIR, scrape_file)) as f:
        scrape = json.load(f)

    added = 0
    skipped = 0
    for loc in scrape.get('locations', []):
        nk = scrape_key(loc)
        # Check dedup: if nk street empty but existing has street-less city match
        if nk in existing_keys:
            skipped += 1
            continue
        # Also check against city-only existing
        city_only_key = ('', nk[1], nk[2])
        if city_only_key in existing_keys and nk[0]:
            # Remove city-only, we'll add precise
            pass
        existing_keys.add(nk)
        new_loc = {
            'name': loc.get('name', primary['name']),
            'city': loc.get('city', ''),
            'state': loc.get('state', ''),
            'county': '',
            'address': loc.get('street', ''),
            'zip': loc.get('zip', ''),
            'phone': loc.get('phone', ''),
            'source': source_tag,
        }
        if loc.get('lat') is not None and loc.get('lng') is not None:
            new_loc['lat'] = round(float(loc['lat']), 6)
            new_loc['lng'] = round(float(loc['lng']), 6)
        primary['locations'].append(new_loc)
        added += 1

    # Remove city-only locations that have been replaced by precise
    precise_keys = {(l['city'].strip().lower(), l['state'].strip().upper())
                    for l in primary['locations'] if l.get('address')}
    before = len(primary['locations'])
    primary['locations'] = [
        l for l in primary['locations']
        if l.get('address') or (l.get('city','').strip().lower(), l.get('state','').strip().upper()) not in precise_keys
    ]
    removed_city_only = before - len(primary['locations'])

    print(f"  Added from scrape: {added}")
    print(f"  Skipped (dup): {skipped}")
    print(f"  Removed (city-only replaced): {removed_city_only}")
    print(f"  Final locations: {len(primary['locations'])}")

    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])

# Tri Gas & Oil — not in DB yet, add as new company
trigas_file = os.path.join(DATA_DIR, 'deep_scrape_trigas.json')
if os.path.exists(trigas_file):
    with open(trigas_file) as f:
        trigas_data = json.load(f)
    trigas_locs = trigas_data.get('locations', [])
    # Check if it's in the dataset already
    existing_trigas = None
    for c in companies:
        if 'tri gas' in c['name'].lower() or c['id'] == 'tri_gas_oil' or c['id'] == 'trigas':
            existing_trigas = c
            break
    if existing_trigas is None and trigas_locs:
        print(f"\n=== Adding new company: Tri Gas & Oil ===")
        locations = []
        for loc in trigas_locs:
            locations.append({
                'name': loc.get('name', 'Tri Gas & Oil'),
                'city': loc.get('city', ''),
                'state': loc.get('state', ''),
                'county': '',
                'address': loc.get('street', ''),
                'zip': loc.get('zip', ''),
                'phone': loc.get('phone', ''),
                'source': 'trigas_scrape',
            })
        states_list = sorted({l['state'] for l in locations if l.get('state')})
        new_rec = {
            "id": "tri_gas_and_oil",
            "name": "Tri Gas & Oil",
            "parentGroup": "Tri Gas & Oil",
            "hqCity": "Federalsburg",
            "hqState": "MD",
            "website": "https://pepupinc.com/",
            "ownership": "private",
            "ownerDetail": "Subsidiary of PepUp Inc",
            "states": states_list,
            "seLocs": sum(1 for l in locations if l['state'] in SE),
            "totalLocs": len(locations),
            "excluded": False,
            "optBScore": None, "optBTier": None,
            "optCScore": None, "optCTier": None,
            "locations": locations,
            "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
            "description": "Mid-Atlantic propane/fuel distributor based in Federalsburg, MD. Subsidiary of PepUp Inc.",
            "serviceTypes": ["residential", "commercial"],
            "keyPersonnel": [], "phone": "800-638-7802", "email": "",
            "dataConfidence": 3, "lastResearched": "2026-04-11",
            "yearFounded": None, "lastAcquisition": None,
        }
        companies.append(new_rec)
        print(f"  Added: {len(locations)} locations")

# Remove duplicate company records
if removed_ids:
    print(f"\nRemoving {len(removed_ids)} duplicate company records: {removed_ids}")
    companies = [c for c in companies if c['id'] not in removed_ids]

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
