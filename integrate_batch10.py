"""
Batch 10 integration:
- MFA Oil v2: 56 propane-service locations into existing MFA Oil
- Sharp Energy: 23 locations into Chesapeake Utilities / Sharp Energy
- CHS Northwest: 15 locations — add as new subsidiary or into CHS Inc
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

def to_loc(s, source_tag, primary_name):
    name = s.get('name') or primary_name
    try:
        lat = float(s.get('lat')) if s.get('lat') not in (None, '') else None
    except:
        lat = None
    try:
        lng = float(s.get('lng')) if s.get('lng') not in (None, '') else None
    except:
        lng = None
    out = {
        'name': name,
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

def find_company(id_or_names):
    for c in companies:
        if c['id'] in id_or_names:
            return c
        for name_frag in id_or_names:
            if name_frag in c['name'].lower():
                return c
    return None

# --- MFA Oil v2 ---
print("=== MFA Oil v2 ===")
with open(os.path.join(DATA_DIR, 'deep_scrape_mfaoil_v2.json')) as f:
    mfa_data = json.load(f)
mfa_locs_raw = [l for l in mfa_data.get('locations_found', []) if l.get('has_propane_service')]
print(f"  Propane-service locations in scrape: {len(mfa_locs_raw)}")

mfa = None
for c in companies:
    if c['id'] == 'mfa_oil':
        mfa = c
        break
    if 'mfa oil' in c['name'].lower():
        mfa = c
        break

if mfa:
    existing_keys = set()
    for l in mfa.get('locations', []):
        addr = (l.get('address', '') or '').strip().lower()
        city = (l.get('city', '') or '').strip().lower()
        state = (l.get('state', '') or '').strip().upper()
        existing_keys.add((addr, city, state))
    added = 0
    for l in mfa_locs_raw:
        k = ((l.get('street') or '').strip().lower(),
             (l.get('city') or '').strip().lower(),
             (l.get('state') or '').strip().upper())
        if k in existing_keys:
            continue
        existing_keys.add(k)
        mfa['locations'].append(to_loc(l, 'mfaoil_store_sitemap', 'MFA Oil'))
        added += 1
    mfa['states'] = sorted({l['state'] for l in mfa['locations'] if l.get('state')})
    mfa['seLocs'] = sum(1 for l in mfa['locations'] if l.get('state') in SE)
    mfa['totalLocs'] = len(mfa['locations'])
    print(f"  MFA Oil: +{added}, now {len(mfa['locations'])}")

# --- Sharp Energy ---
print("\n=== Sharp Energy ===")
with open(os.path.join(DATA_DIR, 'deep_scrape_sharp_energy.json')) as f:
    sharp_data = json.load(f)
sharp_locs = sharp_data.get('locations', [])
print(f"  Scraped: {len(sharp_locs)}")

sharp = None
for c in companies:
    nm = c['name'].lower()
    if 'sharp energy' in nm or 'sharp_energy' in c['id']:
        sharp = c
        break
    if 'chesapeake' in nm:
        sharp = c
        break

if sharp:
    existing_keys = set()
    for l in sharp.get('locations', []):
        addr = (l.get('address', '') or '').strip().lower()
        city = (l.get('city', '') or '').strip().lower()
        state = (l.get('state', '') or '').strip().upper()
        existing_keys.add((addr, city, state))
    added = 0
    for l in sharp_locs:
        k = ((l.get('street') or '').strip().lower(),
             (l.get('city') or '').strip().lower(),
             (l.get('state') or '').strip().upper())
        if k in existing_keys:
            continue
        existing_keys.add(k)
        sharp['locations'].append(to_loc(l, 'sharp_energy_scrape', 'Sharp Energy'))
        added += 1
    sharp['states'] = sorted({l['state'] for l in sharp['locations'] if l.get('state')})
    sharp['seLocs'] = sum(1 for l in sharp['locations'] if l.get('state') in SE)
    sharp['totalLocs'] = len(sharp['locations'])
    print(f"  Sharp: +{added}, now {len(sharp['locations'])}")
else:
    # Create new record for Sharp Energy
    print("  Creating new Sharp Energy record")
    locations = [to_loc(l, 'sharp_energy_scrape', 'Sharp Energy') for l in sharp_locs]
    states_list = sorted({l['state'] for l in locations if l.get('state')})
    rec = {
        "id": "sharp_energy",
        "name": "Sharp Energy (Chesapeake Utilities)",
        "parentGroup": "Chesapeake Utilities",
        "hqCity": "Georgetown",
        "hqState": "DE",
        "website": "https://www.sharpenergy.com/",
        "ownership": "public",
        "ownerDetail": "Subsidiary of Chesapeake Utilities (NYSE:CPK)",
        "states": states_list,
        "seLocs": sum(1 for l in locations if l['state'] in SE),
        "totalLocs": len(locations),
        "excluded": False,
        "optBScore": None, "optBTier": None, "optCScore": None, "optCTier": None,
        "locations": locations,
        "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
        "description": "Propane distributor subsidiary of Chesapeake Utilities (NYSE:CPK). 90K+ customers across DE/MD/VA/NC/FL/PA from 26 service centers.",
        "serviceTypes": ["residential", "commercial"],
        "keyPersonnel": [], "phone": "", "email": "",
        "dataConfidence": 3, "lastResearched": "2026-04-11",
        "yearFounded": None, "lastAcquisition": None,
    }
    companies.append(rec)
    print(f"  Added: {len(locations)} locations")

# --- CHS Northwest ---
print("\n=== CHS Northwest ===")
with open(os.path.join(DATA_DIR, 'deep_scrape_chs.json')) as f:
    chs_data = json.load(f)
chs_locs = chs_data.get('locations', [])
print(f"  Scraped: {len(chs_locs)}")

chs_nw = None
for c in companies:
    nm = c['name'].lower()
    if 'chs northwest' in nm or c['id'] == 'chs_northwest':
        chs_nw = c
        break

if chs_nw is None and chs_locs:
    print("  Creating new CHS Northwest record")
    locations = [to_loc(l, 'chs_nw_scrape', 'CHS Northwest') for l in chs_locs]
    states_list = sorted({l['state'] for l in locations if l.get('state')})
    rec = {
        "id": "chs_northwest",
        "name": "CHS Northwest",
        "parentGroup": "CHS Inc",
        "hqCity": "Warden",
        "hqState": "WA",
        "website": "https://www.chsnw.com/",
        "ownership": "coop",
        "ownerDetail": "Subsidiary of CHS Inc (Fortune 100 farmer coop)",
        "states": states_list,
        "seLocs": 0,
        "totalLocs": len(locations),
        "excluded": False,
        "optBScore": None, "optBTier": None, "optCScore": None, "optCTier": None,
        "locations": locations,
        "estRevenue": None, "estAnnualGallons": None, "employeeCount": None,
        "description": "Regional energy cooperative serving WA/OR/ID, subsidiary of CHS Inc (Fortune 100 farmer-owned coop). Propane delivery from 15+ locations.",
        "serviceTypes": ["residential", "commercial", "agricultural"],
        "keyPersonnel": [], "phone": "", "email": "",
        "dataConfidence": 3, "lastResearched": "2026-04-11",
        "yearFounded": None, "lastAcquisition": None,
    }
    companies.append(rec)
    print(f"  Added: {len(locations)} locations")
elif chs_nw:
    print(f"  CHS Northwest already exists with {len(chs_nw.get('locations',[]))} locations")

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
