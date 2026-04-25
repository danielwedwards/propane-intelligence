"""
Integrate batch 8 deep scrapes: EDP, Parker Gas, Berico, Foster Fuels, NGL.
- Consolidate duplicate company records
- Merge scraped locations
- Mark NGL as excluded (exited retail propane 2022)
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

# Map: primary id -> dup ids to merge -> scrape file -> source tag
INTEGRATIONS = [
    ('parker_gas', [], 'deep_scrape_parker.json', 'parker_scrape'),
    ('berico', ['berico_fuels_propane'], 'deep_scrape_berico.json', 'berico_scrape'),
    ('foster_fuels_inc', ['foster_fuels_hearth_home_showroom'], 'deep_scrape_foster.json', 'foster_scrape'),
    ('edp_energy_distribution_partners', [], 'deep_scrape_edp.json', 'edp_scrape'),
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
        print(f"SKIP: {primary_id} not found")
        continue

    print(f"\n=== {primary['name']} ===")
    print(f"  Starting locations: {len(primary.get('locations', []))}")

    for dup in dup_records:
        for loc in dup.get('locations', []):
            primary['locations'].append(loc)
        print(f"  Merged {len(dup.get('locations',[]))} from dup '{dup['name']}'")
        removed_ids.append(dup['id'])

    existing_keys = {loc_key(l) for l in primary.get('locations', [])}
    existing_city_state = {(l.get('city','').strip().lower(), l.get('state','').strip().upper())
                           for l in primary.get('locations', [])}

    scrape_path = os.path.join(DATA_DIR, scrape_file)
    if not os.path.exists(scrape_path):
        print(f"  SKIP: no scrape file")
        continue
    with open(scrape_path) as f:
        scrape = json.load(f)

    added = 0
    skipped = 0
    for loc in scrape.get('locations', []):
        nk = scrape_key(loc)
        if nk in existing_keys:
            skipped += 1
            continue
        # If street is empty and we have city+state match, skip (already have some record)
        if not nk[0] and (nk[1], nk[2]) in existing_city_state:
            skipped += 1
            continue
        existing_keys.add(nk)
        existing_city_state.add((nk[1], nk[2]))
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
            try:
                new_loc['lat'] = round(float(loc['lat']), 6)
                new_loc['lng'] = round(float(loc['lng']), 6)
            except:
                pass
        primary['locations'].append(new_loc)
        added += 1

    print(f"  Added: {added}, skipped: {skipped}")
    print(f"  Final: {len(primary['locations'])}")

    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])

# NGL consolidation and exclusion flag
ngl_primary = None
ngl_dups = []
for c in companies:
    if c['id'] == 'ngl_energy_partners':
        ngl_primary = c
    elif c['id'] == 'ngl_energy_partners_lp_mo':
        ngl_dups.append(c)

if ngl_primary:
    print(f"\n=== NGL Energy Partners (flagging as exited retail propane) ===")
    for dup in ngl_dups:
        for loc in dup.get('locations', []):
            ngl_primary['locations'].append(loc)
        removed_ids.append(dup['id'])
    ngl_primary['description'] = "NGL Energy Partners (NYSE:NGL) exited retail propane business in January 2022, selling 151 retail locations and 316,000 customers to Superior Plus Corp for $900M. Only wholesale/terminal operations remain."
    ngl_primary['ownerDetail'] = 'Publicly traded (NYSE:NGL) - exited retail propane 2022'
    ngl_primary['ownership'] = 'public'
    ngl_primary['excluded'] = True
    ngl_primary['lastAcquisition'] = '2022-01 sold retail to Superior Plus $900M'
    print(f"  Flagged excluded=True; merged {len(ngl_dups)} dups")

if removed_ids:
    print(f"\nRemoving duplicates: {removed_ids}")
    companies = [c for c in companies if c['id'] not in removed_ids]

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
