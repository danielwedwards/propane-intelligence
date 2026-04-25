"""
Add missing companies from LP Gas Magazine 2025-2026 rankings.
Cross-references against existing dataset to find gaps.
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
    req = urllib.request.Request(url, headers={'User-Agent': 'PropaneMarketMap/1.0 (research@ergon.com)'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        if data:
            result = (float(data[0]['lat']), float(data[0]['lon']))
            geocode_cache[query] = result
            time.sleep(1.1)
            return result
    except Exception as e:
        print(f"    Geocode error: {query}")
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

existing_norms = {norm(c['name']): c for c in companies}
existing_ids = {c['id'] for c in companies}

def is_existing(name):
    n = norm(name)
    for en in existing_norms:
        if n == en or n in en or en in n:
            return True
        if len(n) > 6 and len(en) > 6 and n[:7] == en[:7]:
            return True
    return False

# All companies from 2025 multi-state + 2026 single-state rankings
RANKED_COMPANIES = [
    # 2025 Multi-state (not already in dataset)
    {"name": "Superior Plus Propane", "city": "Wayne", "state": "PA", "gallons": 308.6,
     "ownership": "public", "ownerDetail": "Public (TSX: SPB)", "states": ["PA","NY","OH","MI","MN","WI","IL","IN","NC","VA","ME","NH","VT","MA","CT","NJ","MD"],
     "description": "Superior Plus is a publicly traded Canadian company and the 4th largest US propane distributor. Operates through SGL, Kamps, and other acquired brands across 17+ states."},

    {"name": "DCC Propane LLC", "city": "Lisle", "state": "IL", "gallons": 150,
     "ownership": "private", "ownerDetail": "Private (DCC plc subsidiary)", "states": ["IL","IN","OH","MI","WI","MN","MO","KS","NE","OK","TX","PA","NY","VA","NC","GA","FL"],
     "description": "DCC Propane (formerly DCC Energy) is a subsidiary of Dublin-based DCC plc. 5th largest US propane distributor, built through acquisitions of Heritage Propane, Blue Flame, and others."},

    {"name": "CHS Inc.", "city": "Inver Grove Heights", "state": "MN", "gallons": 79.2,
     "ownership": "coop", "ownerDetail": "Cooperative", "states": ["MN","WI","IA","ND","SD","MT","WY","NE","KS","MO","IL","IN","OH"],
     "description": "CHS is a Fortune 100 farmer-owned cooperative providing propane, refined fuels, and agricultural services across the upper Midwest and Plains states."},

    {"name": "Pinnacle Propane", "city": "Irving", "state": "TX", "gallons": 52,
     "ownership": "pe", "ownerDetail": "Private Equity (SHV Energy subsidiary)", "states": ["TX","OK","NM","AZ","CA","CO","KS","AR","LA","MS","AL","GA","FL","SC","NC","VA","TN"],
     "description": "Pinnacle Propane, a subsidiary of SHV Energy, operates propane distribution across 17 states with a focus on the Southern US."},

    {"name": "Eastern Propane & Oil", "city": "Rochester", "state": "NH", "gallons": 51,
     "ownership": "private", "ownerDetail": "Private", "states": ["NH","ME","VT","MA"],
     "description": "Eastern Propane & Oil is one of the largest propane and oil delivery companies in northern New England, serving 4 states."},

    {"name": "Pico Propane and Fuels", "city": "San Antonio", "state": "TX", "gallons": 28.6,
     "ownership": "pe", "ownerDetail": "Private Equity", "states": ["TX","OK","NM","AZ","CO","KS"],
     "description": "Pico Propane and Fuels (formerly Meritum Energy) is a PE-backed propane distribution platform focused on the South Central US."},

    {"name": "Superior Fuel Co.", "city": "Superior", "state": "WI", "gallons": 7.5,
     "ownership": "private", "ownerDetail": "Private", "states": ["WI","MN"],
     "description": "Superior Fuel Co. provides propane and heating fuel in the Superior, WI and Duluth, MN area."},

    {"name": "Proulx Oil and Propane", "city": "Newmarket", "state": "NH", "gallons": 3.4,
     "ownership": "private", "ownerDetail": "Private", "states": ["NH","ME"],
     "description": "Proulx Oil and Propane is a family-owned propane and oil delivery company in southern New Hampshire and southern Maine."},

    # 2026 Single-state independents (not already in dataset)
    {"name": "Dooley's Petroleum Inc.", "city": "Willmar", "state": "MN", "gallons": 30.5,
     "ownership": "private", "ownerDetail": "Private", "states": ["MN"],
     "description": "Dooley's Petroleum is one of the largest independent propane distributors in Minnesota."},

    {"name": "Wessels Oil Co.", "city": "Palmer", "state": "IA", "gallons": 15.5,
     "ownership": "private", "ownerDetail": "Private", "states": ["IA"],
     "description": "Wessels Oil is a major propane distributor in Iowa."},

    {"name": "Premier Cooperative", "city": "Mount Horeb", "state": "WI", "gallons": 15,
     "ownership": "coop", "ownerDetail": "Cooperative", "states": ["WI"],
     "description": "Premier Cooperative provides propane and agricultural services in southern Wisconsin."},

    {"name": "Foster Fuels Inc.", "city": "Brookneal", "state": "VA", "gallons": 13.7,
     "ownership": "private", "ownerDetail": "Private", "states": ["VA"],
     "description": "Foster Fuels is a major Virginia propane and fuel distributor based in Brookneal, serving central and southern Virginia."},

    {"name": "Cole Oil & Propane", "city": "Lomira", "state": "WI", "gallons": 10.4,
     "ownership": "private", "ownerDetail": "Private", "states": ["WI"],
     "description": "Cole Oil & Propane is a Wisconsin propane company serving the eastern WI market."},

    {"name": "River Country Coop", "city": "Chippewa Falls", "state": "WI", "gallons": 9.1,
     "ownership": "coop", "ownerDetail": "Cooperative", "states": ["WI"],
     "description": "River Country Coop provides propane and agricultural services in western Wisconsin."},

    {"name": "Quality Propane Inc.", "city": "Clinton", "state": "CT", "gallons": 8.4,
     "ownership": "private", "ownerDetail": "Private", "states": ["CT"],
     "description": "Quality Propane is one of the largest independent propane distributors in Connecticut."},

    {"name": "Northern Star Cooperative Services", "city": "Deer River", "state": "MN", "gallons": 8.2,
     "ownership": "coop", "ownerDetail": "Cooperative", "states": ["MN"],
     "description": "Northern Star Cooperative provides propane and agricultural services in northern Minnesota."},

    {"name": "Northwest Propane Gas Company", "city": "Carrollton", "state": "TX", "gallons": 7.6,
     "ownership": "private", "ownerDetail": "Private", "states": ["TX"],
     "description": "Northwest Propane is a major independent propane distributor in the Dallas-Fort Worth area."},

    {"name": "G.A. Bove Fuels", "city": "Mechanicville", "state": "NY", "gallons": 7.3,
     "ownership": "private", "ownerDetail": "Private", "states": ["NY"],
     "description": "G.A. Bove Fuels is a major propane and heating fuel company in upstate New York."},

    {"name": "Lock's Mill Propane", "city": "Loose Creek", "state": "MO", "gallons": 6.6,
     "ownership": "private", "ownerDetail": "Private", "states": ["MO"],
     "description": "Lock's Mill Propane is a central Missouri propane distributor."},

    {"name": "Midwest Propane LLC", "city": "Cassopolis", "state": "MI", "gallons": 6,
     "ownership": "private", "ownerDetail": "Private", "states": ["MI"],
     "description": "Midwest Propane is a major independent propane distributor in Michigan."},

    {"name": "Moore Propane LLC", "city": "Falls Creek", "state": "PA", "gallons": 4.5,
     "ownership": "private", "ownerDetail": "Private", "states": ["PA"],
     "description": "Moore Propane is a propane distributor in western Pennsylvania."},

    {"name": "Heart of Texas Propane", "city": "Brady", "state": "TX", "gallons": 4,
     "ownership": "private", "ownerDetail": "Private", "states": ["TX"],
     "description": "Heart of Texas Propane serves the central Texas region from Brady."},

    {"name": "Palisades Propane Inc.", "city": "Garretson", "state": "SD", "gallons": 3.5,
     "ownership": "private", "ownerDetail": "Private", "states": ["SD"],
     "description": "Palisades Propane is a South Dakota propane distributor serving the eastern SD market."},

    {"name": "LP Service Inc.", "city": "Clarkesville", "state": "GA", "gallons": 3.2,
     "ownership": "private", "ownerDetail": "Private", "states": ["GA"],
     "description": "LP Service is a propane distributor in northeast Georgia."},

    {"name": "Valley Propane", "city": "Worden", "state": "MT", "gallons": 2.4,
     "ownership": "private", "ownerDetail": "Private", "states": ["MT"],
     "description": "Valley Propane serves the Yellowstone Valley region of Montana."},

    {"name": "Propane Plus LLC", "city": "Leander", "state": "TX", "gallons": 2.2,
     "ownership": "private", "ownerDetail": "Private", "states": ["TX"],
     "description": "Propane Plus is an Austin-area propane distributor in Texas."},

    {"name": "Blue Flame Propane Inc.", "city": "Middletown", "state": "NY", "gallons": 2,
     "ownership": "private", "ownerDetail": "Private", "states": ["NY"],
     "description": "Blue Flame Propane serves the Hudson Valley region of New York."},

    {"name": "Deiter Bros. Heating Cooling Energy", "city": "Bethlehem", "state": "PA", "gallons": 1.9,
     "ownership": "private", "ownerDetail": "Private", "states": ["PA"],
     "description": "Deiter Bros. provides propane, heating, and cooling services in the Lehigh Valley, Pennsylvania."},

    {"name": "Clifford Farmers Cooperative", "city": "Hunter", "state": "ND", "gallons": 1.9,
     "ownership": "coop", "ownerDetail": "Cooperative", "states": ["ND"],
     "description": "Clifford Farmers Cooperative provides propane and agricultural services in North Dakota."},

    {"name": "Shasta Gas", "city": "Anderson", "state": "CA", "gallons": 1.8,
     "ownership": "private", "ownerDetail": "Private", "states": ["CA"],
     "description": "Shasta Gas is a northern California propane distributor."},

    {"name": "iDeal Gas", "city": "St. Augustine", "state": "FL", "gallons": 1.7,
     "ownership": "private", "ownerDetail": "Private", "states": ["FL"],
     "description": "iDeal Gas is a propane distributor in northeast Florida."},

    {"name": "Premier Propane Inc.", "city": "Donald", "state": "OR", "gallons": 1.5,
     "ownership": "private", "ownerDetail": "Private", "states": ["OR"],
     "description": "Premier Propane is an Oregon propane distributor."},

    {"name": "Chili Gas", "city": "Rock Tavern", "state": "NY", "gallons": 1.4,
     "ownership": "private", "ownerDetail": "Private", "states": ["NY"],
     "description": "Chili Gas is a propane distributor in the Hudson Valley, New York."},

    {"name": "Farmers Union Oil Co.", "city": "Lake Bronson", "state": "MN", "gallons": 1.3,
     "ownership": "coop", "ownerDetail": "Cooperative", "states": ["MN"],
     "description": "Farmers Union Oil provides propane and fuel in northwestern Minnesota."},

    {"name": "State Line Gas Service Inc.", "city": "McKnightstown", "state": "PA", "gallons": 1.2,
     "ownership": "private", "ownerDetail": "Private", "states": ["PA"],
     "description": "State Line Gas Service is a propane distributor in south-central Pennsylvania."},

    {"name": "Buster's Propane LLC", "city": "Corpus Christi", "state": "TX", "gallons": 1.1,
     "ownership": "private", "ownerDetail": "Private", "states": ["TX"],
     "description": "Buster's Propane serves the Corpus Christi area of South Texas."},

    {"name": "Snow's Fuel Co.", "city": "Orleans", "state": "MA", "gallons": 1,
     "ownership": "private", "ownerDetail": "Private", "states": ["MA"],
     "description": "Snow's Fuel provides propane and heating fuel on Cape Cod, Massachusetts."},

    {"name": "Henley Propane", "city": "Manchester", "state": "TN", "gallons": 0.7,
     "ownership": "private", "ownerDetail": "Private", "states": ["TN"],
     "description": "Henley Propane serves the Manchester, Tennessee area."},

    {"name": "Lambda Propane", "city": "Kalkaska", "state": "MI", "gallons": 0.65,
     "ownership": "private", "ownerDetail": "Private", "states": ["MI"],
     "description": "Lambda Propane is a northern Michigan propane distributor."},

    {"name": "Patrons Cooperative", "city": "Rapid City", "state": "SD", "gallons": 0.34,
     "ownership": "coop", "ownerDetail": "Cooperative", "states": ["SD"],
     "description": "Patrons Cooperative provides propane and agricultural services in western South Dakota."},
]

# Filter to only companies not already in dataset
added = 0
skipped = 0
for rc in RANKED_COMPANIES:
    if is_existing(rc['name']):
        skipped += 1
        continue

    cid = make_id(rc['name'])
    if cid in existing_ids:
        cid = cid + '_2'
    existing_ids.add(cid)

    # Geocode HQ
    result = geocode(f"{rc['city']}, {rc['state']}")
    locations = []
    if result:
        lat, lng = result[0], result[1]
        locations.append({
            'name': rc['name'], 'city': rc['city'], 'state': rc['state'],
            'county': '', 'lat': round(lat, 4), 'lng': round(lng, 4), 'address': ''
        })

    SE = {'AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA'}
    se_locs = sum(1 for l in locations if l['state'] in SE)

    record = {
        "id": cid, "name": rc['name'], "parentGroup": rc['name'],
        "hqCity": rc['city'], "hqState": rc['state'], "website": "",
        "ownership": rc['ownership'], "ownerDetail": rc['ownerDetail'],
        "states": rc['states'], "seLocs": se_locs, "totalLocs": 1,
        "excluded": False, "optBScore": None, "optBTier": None,
        "optCScore": None, "optCTier": None, "locations": locations,
        "estRevenue": round(rc['gallons'] * 2, 1) if rc['gallons'] else None,
        "estAnnualGallons": rc['gallons'], "employeeCount": None,
        "description": rc['description'], "serviceTypes": ["residential", "commercial"],
        "keyPersonnel": [], "phone": "", "email": "",
        "dataConfidence": 2, "lastResearched": "2026-04-09",
        "yearFounded": None, "lastAcquisition": None,
    }
    companies.append(record)
    added += 1
    print(f"  + {rc['name']} ({rc['city']}, {rc['state']}) - {rc['gallons']}M gal")

print(f"\nAdded: {added}, Skipped (already exists): {skipped}")
print(f"Total companies: {len(companies)}")

# Also check: Pico Propane might be Meritum Energy (rebranded)
meritum = next((c for c in companies if 'meritum' in c['name'].lower()), None)
pico = next((c for c in companies if 'pico' in c['name'].lower()), None)
if meritum and pico:
    print(f"\nNOTE: Pico Propane ({pico['estAnnualGallons']}M gal) may be rebrand of Meritum Energy ({meritum['estAnnualGallons']}M gal)")
    print("  Consider merging if confirmed.")

# Save
with open(CACHE_FILE, 'w') as f:
    json.dump(geocode_cache, f, separators=(',', ':'))

SE_STATES = {'AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA'}
for c in companies:
    c['seLocs'] = sum(1 for l in c.get('locations', []) if l.get('state') in SE_STATES)

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"Total locations: {total_locs}")
print(f"Saved companies.json")
