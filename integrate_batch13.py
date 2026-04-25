"""
Batch 13 deep-scrape integration:
- Griffith Energy: 17 locations merged into primary
- Pico Propane v2: 17 locations, consolidate with dups
- Tiger Fuel: 6 locations merged into existing
- Skip Propane Resources (wholesale broker) and Cetane (M&A advisor)
- Merge EDP subsidiary singletons
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

# --- Griffith Energy (merge scrape, no dups to consolidate) ---
print("=== Griffith Energy ===")
griffith = by_id.get('griffith_energy')
if griffith:
    with open(os.path.join(DATA_DIR, 'deep_scrape_griffith_energy.json')) as f:
        g_scrape = json.load(f)
    existing_keys = {loc_key(l) for l in griffith.get('locations', [])}
    added = 0
    for s in g_scrape.get('locations', []):
        k = ((s.get('street') or '').strip().lower(),
             (s.get('city') or '').strip().lower(),
             (s.get('state') or '').strip().upper())
        if k in existing_keys:
            continue
        existing_keys.add(k)
        griffith['locations'].append(to_loc(s, 'griffith_scrape', 'Griffith Energy'))
        added += 1
    griffith['states'] = sorted({l['state'] for l in griffith['locations'] if l.get('state')})
    griffith['seLocs'] = sum(1 for l in griffith['locations'] if l.get('state') in SE)
    griffith['totalLocs'] = len(griffith['locations'])
    print(f"  +{added}, final: {len(griffith['locations'])}")
    # Better metadata
    if griffith['totalLocs'] >= 10:
        griffith['description'] = "Griffith Energy Services is a mid-Atlantic propane/fuel oil distributor with branches across MD, DE, VA, WV, NJ. Operates under Allied Oil (NJ) and Carl King (DE) brands. Part of Calgary-based parent."
        griffith['ownerDetail'] = 'Private (mid-Atlantic regional)'
        griffith['parentGroup'] = 'Griffith Energy Services'

# --- Pico Propane (merge scrape + dup records) ---
print("\n=== Pico Propane ===")
pico = by_id.get('pico_propane')
pico_dups = ['pico_propane_and_fuels', 'pico_propane_yanceyville']
if pico:
    existing_keys = {loc_key(l) for l in pico.get('locations', [])}
    # Merge dups first
    for dup_id in pico_dups:
        if dup_id in by_id:
            for l in by_id[dup_id].get('locations', []):
                k = loc_key(l)
                if k in existing_keys:
                    continue
                existing_keys.add(k)
                pico['locations'].append(l)
            removed.add(dup_id)

    # Merge scrape
    with open(os.path.join(DATA_DIR, 'deep_scrape_pico_propane_v2.json')) as f:
        p_scrape = json.load(f)
    added = 0
    for s in p_scrape.get('locations', []):
        k = ((s.get('street') or '').strip().lower(),
             (s.get('city') or '').strip().lower(),
             (s.get('state') or '').strip().upper())
        if k in existing_keys:
            continue
        existing_keys.add(k)
        pico['locations'].append(to_loc(s, 'pico_scrape_v2', 'Pico Propane'))
        added += 1
    pico['states'] = sorted({l['state'] for l in pico['locations'] if l.get('state')})
    pico['seLocs'] = sum(1 for l in pico['locations'] if l.get('state') in SE)
    pico['totalLocs'] = len(pico['locations'])
    print(f"  +{added} scrape, {len(pico_dups)} dups merged, final: {len(pico['locations'])}")

# --- Tiger Fuel Company (already has 8, merge scrape) ---
print("\n=== Tiger Fuel Company ===")
tiger = by_id.get('tiger_fuel_company')
if tiger:
    with open(os.path.join(DATA_DIR, 'deep_scrape_tiger_fuel.json')) as f:
        t_scrape = json.load(f)
    existing_keys = {loc_key(l) for l in tiger.get('locations', [])}
    added = 0
    for s in t_scrape.get('locations', []):
        k = ((s.get('street') or '').strip().lower(),
             (s.get('city') or '').strip().lower(),
             (s.get('state') or '').strip().upper())
        if k in existing_keys:
            continue
        existing_keys.add(k)
        tiger['locations'].append(to_loc(s, 'tiger_fuel_scrape', 'Tiger Fuel Company'))
        added += 1
    tiger['states'] = sorted({l['state'] for l in tiger['locations'] if l.get('state')})
    tiger['seLocs'] = sum(1 for l in tiger['locations'] if l.get('state') in SE)
    tiger['totalLocs'] = len(tiger['locations'])
    print(f"  +{added}, final: {len(tiger['locations'])}")

# --- EDP subsidiaries (just a few singleton scrapes, informational) ---
# Skip — already have these covered in batch 8/11

# Skip Propane Resources (wholesale, not retail) and Cetane (M&A advisor)

# Remove dups
companies = [c for c in companies if c['id'] not in removed]

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
print(f"Removed: {len(removed)}")
