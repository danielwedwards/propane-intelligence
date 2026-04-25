"""
Batch 14 integration - regional deep-scrapes with duplicate consolidation.
- Herring Gas: merge v2 scrape into herring_gas_company
- Cherry Energy: 1 -> scrape ~14
- Woodford Oil: consolidate 3 dup records + merge v2 scrape
- Holtzman Corp: consolidate dup records + merge scrape
- Eagle Propane and Fuel: merge scrape
- Rhoads Energy: merge scrape
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

def to_loc(s, source_tag, primary_name):
    try:
        lat = float(s.get('lat')) if s.get('lat') not in (None, '') else None
    except:
        lat = None
    try:
        lng = float(s.get('lng')) if s.get('lng') not in (None, '') else None
    except:
        lng = None
    out = {
        'name': s.get('name') or primary_name,
        'city': s.get('city', ''),
        'state': (s.get('state') or '').upper(),
        'county': '',
        'address': s.get('street', ''),
        'zip': s.get('zip', ''),
        'phone': s.get('phone', ''),
        'source': source_tag,
    }
    if lat is not None:
        out['lat'] = round(lat, 6)
    if lng is not None:
        out['lng'] = round(lng, 6)
    return out

def loc_key(l):
    return ((l.get('address') or '').strip().lower(),
            (l.get('city') or '').strip().lower(),
            (l.get('state') or '').strip().upper())

by_id = {c['id']: c for c in companies}
removed = set()

CONFIGS = [
    {
        'primary_id': 'herring_gas_company__inc_',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_herring_gas.json',
        'source_tag': 'herring_squarespace',
        'name': 'Herring Gas Company',
    },
    {
        'primary_id': 'cherry_energy',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_cherry_energy.json',
        'source_tag': 'cherry_energy_scrape',
        'name': 'Cherry Energy',
    },
    {
        'primary_id': 'woodford_oil_company',  # larger record (7 locs)
        'dup_ids': ['woodford_oil_co', 'woodford_propane_pa'],
        'scrape_file': 'deep_scrape_woodford_oil.json',
        'source_tag': 'woodford_scrape',
        'name': 'Woodford Oil Company',
    },
    {
        'primary_id': 'holtzman_corp_propane',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_holtzman.json',
        'source_tag': 'holtzman_scrape',
        'name': 'Holtzman Corporation',
    },
    {
        'primary_id': 'eagle_propane_and_fuel_lp',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_eagle_propane.json',
        'source_tag': 'eagle_scrape',
        'name': 'Eagle Propane and Fuel LP',
    },
    {
        'primary_id': 'rhoads_energy_corporation',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_rhoads.json',
        'source_tag': 'rhoads_scrape',
        'name': 'Rhoads Energy Corporation',
    },
]

for cfg in CONFIGS:
    primary = by_id.get(cfg['primary_id'])
    if not primary:
        print(f"SKIP: {cfg['primary_id']}")
        continue
    print(f"\n=== {primary['name']} ===")
    print(f"  Starting: {len(primary.get('locations', []))}")

    existing_keys = {loc_key(l) for l in primary.get('locations', [])}

    # Merge dup records
    for dup_id in cfg['dup_ids']:
        if dup_id in by_id:
            dup = by_id[dup_id]
            for l in dup.get('locations', []):
                k = loc_key(l)
                if k in existing_keys:
                    continue
                existing_keys.add(k)
                primary['locations'].append(l)
            removed.add(dup_id)
            print(f"  Merged dup: {dup_id}")

    # Merge scrape
    scrape_path = os.path.join(DATA_DIR, cfg['scrape_file'])
    if os.path.exists(scrape_path):
        with open(scrape_path) as f:
            scrape = json.load(f)
        added = 0
        for s in scrape.get('locations', []):
            k = ((s.get('street') or '').strip().lower(),
                 (s.get('city') or '').strip().lower(),
                 (s.get('state') or '').strip().upper())
            if k in existing_keys:
                continue
            existing_keys.add(k)
            primary['locations'].append(to_loc(s, cfg['source_tag'], cfg['name']))
            added += 1
        print(f"  Scrape +{added}")

    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])
    print(f"  Final: {len(primary['locations'])}")

# Remove merged dups
companies = [c for c in companies if c['id'] not in removed]

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
