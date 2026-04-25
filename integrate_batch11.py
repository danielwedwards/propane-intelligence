"""
Batch 11 integration:
- UPG: consolidate many duplicate UPG records + merge scrape
- Crystal Flash, Fick & Sons, Hocon, ProGas, Mount Perry, D&D, NOCO,
  Davenport, Barrett: merge scrapes into existing records
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

def merge_scrape(primary_id_candidates, scrape_file, source_tag, dup_ids=None):
    """Merge scrape file into primary record, deduping by (addr, city, state)."""
    global companies
    primary = None
    for c in companies:
        if c['id'] in primary_id_candidates:
            primary = c
            break
    if primary is None:
        print(f"  SKIP: none of {primary_id_candidates} found")
        return
    scrape_path = os.path.join(DATA_DIR, scrape_file)
    if not os.path.exists(scrape_path):
        print(f"  SKIP: {scrape_file} not found")
        return
    with open(scrape_path) as f:
        scrape = json.load(f)
    scraped = scrape.get('locations', [])
    print(f"=== {primary['name']} ===")
    print(f"  Existing: {len(primary.get('locations', []))}")

    # Merge dup record locations
    if dup_ids:
        for c in companies:
            if c['id'] in dup_ids and c['id'] != primary['id']:
                for l in c.get('locations', []):
                    primary.setdefault('locations', []).append(l)

    existing_keys = set()
    for l in primary.get('locations', []):
        addr = (l.get('address') or '').strip().lower()
        city = (l.get('city') or '').strip().lower()
        state = (l.get('state') or '').strip().upper()
        existing_keys.add((addr, city, state))

    added = 0
    for s in scraped:
        addr = (s.get('street') or '').strip().lower()
        city = (s.get('city') or '').strip().lower()
        state = (s.get('state') or '').strip().upper()
        if (addr, city, state) in existing_keys:
            continue
        if not addr and ('', city, state) not in existing_keys:
            # city-only addition; still skip if same city+state exists with address
            has_precise = any(k[0] and k[1] == city and k[2] == state for k in existing_keys)
            if has_precise:
                continue
        existing_keys.add((addr, city, state))
        primary['locations'].append(to_loc(s, source_tag, primary['name']))
        added += 1

    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])
    print(f"  Added: {added}, final: {len(primary['locations'])}")
    return primary

# --- UPG: massive consolidation ---
# Find primary UPG record
upg_primary = None
upg_dup_ids = []
for c in companies:
    if c['id'] == 'united_propane_gas':
        upg_primary = c
    elif c['id'].startswith('united_propane_gas_') or c['id'].endswith('_upg'):
        upg_dup_ids.append(c['id'])

if upg_primary:
    print("=== UPG Consolidation ===")
    print(f"  Primary (id=united_propane_gas): {len(upg_primary.get('locations', []))} locations")
    print(f"  Duplicates to merge: {len(upg_dup_ids)}")
    for c in companies:
        if c['id'] in upg_dup_ids:
            for l in c.get('locations', []):
                upg_primary['locations'].append(l)

    # Merge UPG scrape
    upg_path = os.path.join(DATA_DIR, 'deep_scrape_upg.json')
    if os.path.exists(upg_path):
        with open(upg_path) as f:
            upg_scrape = json.load(f)
        existing_keys = set()
        for l in upg_primary['locations']:
            addr = (l.get('address') or '').strip().lower()
            city = (l.get('city') or '').strip().lower()
            state = (l.get('state') or '').strip().upper()
            existing_keys.add((addr, city, state))
        added = 0
        for s in upg_scrape.get('locations', []):
            addr = (s.get('street') or '').strip().lower()
            city = (s.get('city') or '').strip().lower()
            state = (s.get('state') or '').strip().upper()
            if (addr, city, state) in existing_keys:
                continue
            existing_keys.add((addr, city, state))
            upg_primary['locations'].append(to_loc(s, 'upg_scrape', 'United Propane Gas'))
            added += 1
        print(f"  UPG scrape: +{added}")

    upg_primary['states'] = sorted({l['state'] for l in upg_primary['locations'] if l.get('state')})
    upg_primary['seLocs'] = sum(1 for l in upg_primary['locations'] if l.get('state') in SE)
    upg_primary['totalLocs'] = len(upg_primary['locations'])
    print(f"  UPG final: {len(upg_primary['locations'])} locations, {len(upg_primary['states'])} states")

# Remove UPG duplicates
companies = [c for c in companies if c['id'] not in upg_dup_ids]

# --- Other deep scrapes ---
print()
merge_scrape(['crystal_flash_inc'], 'deep_scrape_crystal_flash.json', 'crystal_flash_scrape')
merge_scrape(['fick_sons_inc'], 'deep_scrape_fick_sons.json', 'fick_sons_scrape')
merge_scrape(['hocon_gas'], 'deep_scrape_hocon.json', 'hocon_scrape')
merge_scrape(['progas_pa', 'progas_inc', 'pro_gas_propane'], 'deep_scrape_progas.json', 'progas_scrape')
merge_scrape(['mount_perry_propane'], 'deep_scrape_mount_perry.json', 'mount_perry_scrape')
merge_scrape(['davenport_energy'], 'deep_scrape_davenport.json', 'davenport_scrape')
merge_scrape(['noco', 'noco_hvac_fuels_and_energy'], 'deep_scrape_noco.json', 'noco_scrape')
merge_scrape(['barrett_propane'], 'deep_scrape_barrett.json', 'barrett_scrape')

# D&D Gas - may not exist yet
dnd_path = os.path.join(DATA_DIR, 'deep_scrape_dnd_gas.json')
if os.path.exists(dnd_path):
    dnd = None
    for c in companies:
        if 'd&d' in c['name'].lower() or c['id'] == 'd_and_d_gas':
            dnd = c
            break
    if dnd is None:
        with open(dnd_path) as f:
            dnd_data = json.load(f)
        locs = dnd_data.get('locations', [])
        if locs:
            locations = [to_loc(l, 'dnd_scrape', 'D&D Gas') for l in locs]
            rec = {
                "id": "d_and_d_gas_fl",
                "name": "D&D Gas",
                "parentGroup": "Energy Distribution Partners",
                "hqCity": locations[0].get('city', 'Jacksonville'),
                "hqState": locations[0].get('state', 'FL'),
                "website": "",
                "ownership": "pe",
                "ownerDetail": "EDP subsidiary",
                "states": sorted({l['state'] for l in locations if l.get('state')}),
                "seLocs": sum(1 for l in locations if l.get('state') in SE),
                "totalLocs": len(locations),
                "excluded": False,
                "optBScore": None, "optBTier": None, "optCScore": None, "optCTier": None,
                "locations": locations,
                "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
                "description": "Propane distributor, subsidiary of Energy Distribution Partners (PE-backed).",
                "serviceTypes": ["residential", "commercial"],
                "keyPersonnel": [], "phone": "", "email": "",
                "dataConfidence": 2, "lastResearched": "2026-04-11",
                "yearFounded": None, "lastAcquisition": None,
            }
            companies.append(rec)
            print(f"\n=== D&D Gas (new) === +{len(locations)}")

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
