"""
Integrate batch 9 deep-scrapes: AmeriGas v2, Suburban v2, Superior Plus US.

Strategy:
- Merge Superior Plus duplicate records (3 records -> 1)
- For each primary record: use scrape as canonical location list
  - Keep scraped records (precise lat/lng + street)
  - Also keep any existing records NOT covered by scrape (preserves historical data)
  - Dedupe by (street, city, state) and (city, state) where street matches
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

def to_loc(scraped, source_tag, primary_name):
    """Convert scraped record to our location schema."""
    name = scraped.get('name') or primary_name
    # Clean up AmerGas typos
    name = name.replace('AmerGas', 'AmeriGas')
    try:
        lat = float(scraped.get('lat')) if scraped.get('lat') not in (None, '') else None
    except:
        lat = None
    try:
        lng = float(scraped.get('lng')) if scraped.get('lng') not in (None, '') else None
    except:
        lng = None
    return {
        'name': name,
        'city': scraped.get('city', ''),
        'state': (scraped.get('state') or '').upper(),
        'county': '',
        'address': scraped.get('street', ''),
        'zip': scraped.get('zip', ''),
        'phone': scraped.get('phone', ''),
        'lat': round(lat, 6) if lat is not None else None,
        'lng': round(lng, 6) if lng is not None else None,
        'source': source_tag,
    }

# --- Superior Plus consolidation ---
primary_sp = None
dup_sp_ids = []
for c in companies:
    if c['id'] == 'superior_plus_propane':
        primary_sp = c
    elif c['id'] in ('superior_plus_corp', 'superior_plus_energy_services'):
        dup_sp_ids.append(c['id'])

# Move Superior Plus consolidation. Make superior_plus_propane primary (largest)
sp_merged_locs = []
if primary_sp:
    print("=== Superior Plus Propane (primary) ===")
    sp_merged_locs.extend(primary_sp.get('locations', []))
    print(f"  Existing: {len(primary_sp.get('locations', []))}")
    for c in companies:
        if c['id'] in dup_sp_ids:
            sp_merged_locs.extend(c.get('locations', []))
            print(f"  Merged '{c['name']}': +{len(c.get('locations',[]))}")

    # Load scrape
    with open(os.path.join(DATA_DIR, 'deep_scrape_superior_plus_us.json')) as f:
        sp_scrape = json.load(f)
    print(f"  Scraped v2: {len(sp_scrape.get('locations', []))}")

    # Build key-based dedup: prefer scraped (has precise lat/lng)
    scraped_locs = [to_loc(l, 'superiorpluspropane_sitemap', 'Superior Plus Propane')
                    for l in sp_scrape.get('locations', [])]
    # Keys for scraped
    scraped_street_keys = {(l['address'].strip().lower(), l['city'].strip().lower(), l['state'])
                           for l in scraped_locs if l['address']}
    scraped_city_keys = {(l['city'].strip().lower(), l['state']) for l in scraped_locs}

    # Keep existing locations that aren't in scraped (likely older branches)
    kept_existing = []
    for l in sp_merged_locs:
        addr = (l.get('address', '') or '').strip().lower()
        city = (l.get('city', '') or '').strip().lower()
        state = (l.get('state', '') or '').strip().upper()
        if addr and (addr, city, state) in scraped_street_keys:
            continue  # duplicate — scraped version is better
        if not addr and (city, state) in scraped_city_keys:
            continue  # city-only — scraped has precise
        kept_existing.append(l)

    print(f"  Kept existing (not in scrape): {len(kept_existing)}")
    primary_sp['locations'] = scraped_locs + kept_existing
    primary_sp['states'] = sorted({l['state'] for l in primary_sp['locations'] if l.get('state')})
    primary_sp['seLocs'] = sum(1 for l in primary_sp['locations'] if l.get('state') in SE)
    primary_sp['totalLocs'] = len(primary_sp['locations'])
    print(f"  Final: {len(primary_sp['locations'])}")

# Remove SP dups
companies = [c for c in companies if c['id'] not in dup_sp_ids]

# --- AmeriGas v2 ---
ag_primary = None
for c in companies:
    if c['id'] == 'amerigas_partners___ugi_corporation':
        ag_primary = c
        break
if ag_primary:
    print("\n=== AmeriGas v2 ===")
    with open(os.path.join(DATA_DIR, 'deep_scrape_amerigas_v2.json')) as f:
        ag_scrape = json.load(f)
    scraped_locs = [to_loc(l, 'amerigas_sitemap_v2', 'AmeriGas Propane')
                    for l in ag_scrape.get('locations', [])]
    print(f"  Existing: {len(ag_primary.get('locations', []))}, Scraped: {len(scraped_locs)}")

    scraped_street_keys = {(l['address'].strip().lower(), l['city'].strip().lower(), l['state'])
                           for l in scraped_locs if l['address']}
    scraped_city_keys = {(l['city'].strip().lower(), l['state']) for l in scraped_locs}

    kept_existing = []
    for l in ag_primary.get('locations', []):
        addr = (l.get('address', '') or '').strip().lower()
        city = (l.get('city', '') or '').strip().lower()
        state = (l.get('state', '') or '').strip().upper()
        if addr and (addr, city, state) in scraped_street_keys:
            continue
        if not addr and (city, state) in scraped_city_keys:
            continue
        kept_existing.append(l)

    print(f"  Kept existing: {len(kept_existing)}")
    ag_primary['locations'] = scraped_locs + kept_existing
    ag_primary['states'] = sorted({l['state'] for l in ag_primary['locations'] if l.get('state')})
    ag_primary['seLocs'] = sum(1 for l in ag_primary['locations'] if l.get('state') in SE)
    ag_primary['totalLocs'] = len(ag_primary['locations'])
    print(f"  Final: {len(ag_primary['locations'])}")

# --- Suburban v2 ---
sub_primary = None
for c in companies:
    if c['id'] == 'suburban_propane_partners__l_p_':
        sub_primary = c
        break
if sub_primary:
    print("\n=== Suburban Propane v2 ===")
    with open(os.path.join(DATA_DIR, 'deep_scrape_suburban_v2.json')) as f:
        sub_scrape = json.load(f)
    scraped_locs = [to_loc(l, 'suburban_sitemap_v2', 'Suburban Propane')
                    for l in sub_scrape.get('locations', [])]
    print(f"  Existing: {len(sub_primary.get('locations', []))}, Scraped: {len(scraped_locs)}")

    scraped_street_keys = {(l['address'].strip().lower(), l['city'].strip().lower(), l['state'])
                           for l in scraped_locs if l['address']}
    scraped_city_keys = {(l['city'].strip().lower(), l['state']) for l in scraped_locs}

    kept_existing = []
    for l in sub_primary.get('locations', []):
        addr = (l.get('address', '') or '').strip().lower()
        city = (l.get('city', '') or '').strip().lower()
        state = (l.get('state', '') or '').strip().upper()
        if addr and (addr, city, state) in scraped_street_keys:
            continue
        if not addr and (city, state) in scraped_city_keys:
            continue
        kept_existing.append(l)

    print(f"  Kept existing: {len(kept_existing)}")
    sub_primary['locations'] = scraped_locs + kept_existing
    sub_primary['states'] = sorted({l['state'] for l in sub_primary['locations'] if l.get('state')})
    sub_primary['seLocs'] = sum(1 for l in sub_primary['locations'] if l.get('state') in SE)
    sub_primary['totalLocs'] = len(sub_primary['locations'])
    print(f"  Final: {len(sub_primary['locations'])}")

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
