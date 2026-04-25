"""
Batch 15 integration:
- Holston Gases: 1 -> ~25 (merge 3 sub-records + scrape)
- Crystal Flash: 29 -> 30 (v2 scrape)
- Centergas Fuels: 3 -> ~19 (v2 scrape)
- Blarney Castle Oil: 11 -> ~23 (scrape)
- Modern Gas: consolidate 3 variants
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
        'primary_id': 'holston_gases',
        'dup_ids': ['holston_gases_glasgow', 'holston_gases_lexington', 'holston_gases_greenwood'],
        'scrape_file': 'deep_scrape_holston.json',
        'source_tag': 'holston_wp_scrape',
        'name': 'Holston Gases',
    },
    {
        'primary_id': 'crystal_flash_inc',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_crystal_flash_v2.json',
        'source_tag': 'crystal_flash_v2',
        'name': 'Crystal Flash',
    },
    {
        'primary_id': 'centergas_fuels__inc',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_centergas_v2.json',
        'source_tag': 'centergas_v2',
        'name': 'Centergas Fuels',
    },
    {
        'primary_id': 'blarney_castle_oil_propane',
        'dup_ids': [],
        'scrape_file': 'deep_scrape_blarney_castle.json',
        'source_tag': 'blarney_castle_scrape',
        'name': 'Blarney Castle Oil & Propane',
    },
    {
        'primary_id': 'modern_gas_propane_company',
        'dup_ids': ['modern_gas_sales', 'modern_gas_co'],
        'scrape_file': None,  # no scrape; just consolidate
        'source_tag': 'legacy_consolidation',
        'name': 'Modern Gas Propane Company',
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

    if cfg['scrape_file']:
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

companies = [c for c in companies if c['id'] not in removed]

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
