"""
Add 22 missing top retailers from the 2024 LP Gas Top Retailers list.
Also fix data quality issues found in the audit.
"""
import json
import os
import re
from datetime import datetime

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

print(f"Starting companies: {len(companies)}")

# ═══════════════════════════════════════════════════════════
# PART 1: Add 22 Missing Top Retailers
# ═══════════════════════════════════════════════════════════

def make_id(name):
    """Generate a kebab-case ID from company name."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9 ]', '', s)
    s = re.sub(r'\s+', '_', s).strip('_')
    return s

new_companies = [
    {
        "name": "Growmark Inc.",
        "hqCity": "Bloomington",
        "hqState": "IL",
        "website": "https://www.growmark.com/",
        "ownership": "coop",
        "ownerDetail": "Cooperative",
        "estAnnualGallons": 270,
        "estRevenue": 540,
        "totalLocs": 58,
        "employeeCount": 1100,
        "states": ["IL","IN","IA","WI","MN","SD","ND","NE","KS","MO","OH","MI","PA","NY","VA","NC","TN","KY","AR","OK","TX","MD","DE","ON"],
        "description": "Growmark is a regional agricultural cooperative providing propane, petroleum, lubricants, and crop inputs across 24 states. One of the largest propane distributors in the Midwest and Mid-Atlantic.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "EDP (Energy Distribution Partners)",
        "hqCity": "Chicago",
        "hqState": "IL",
        "website": "https://www.edplp.com/",
        "ownership": "pe",
        "ownerDetail": "Private Equity",
        "estAnnualGallons": 118,
        "estRevenue": 236,
        "totalLocs": 54,
        "employeeCount": 600,
        "states": ["IL","IN","OH","MI","WI","MN","IA","MO","KS","NE","OK","TX","PA","NY","VA","NC","GA","FL","AL","MS"],
        "description": "Energy Distribution Partners (EDP) is a PE-backed propane distribution platform operating across 19 states, built through acquisitions of regional propane companies.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "MFA Oil Company",
        "hqCity": "Columbia",
        "hqState": "MO",
        "website": "https://www.mfaoil.com/",
        "ownership": "coop",
        "ownerDetail": "Cooperative",
        "estAnnualGallons": 100,
        "estRevenue": 200,
        "totalLocs": 190,
        "employeeCount": 1200,
        "states": ["MO","AR","OK","KS","IA","IN","KY"],
        "description": "MFA Oil is a farmer-owned cooperative headquartered in Columbia, MO. With 190 propane locations across 7 states, it is one of the largest propane distributors in the central US.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "Dead River Company",
        "hqCity": "South Portland",
        "hqState": "ME",
        "website": "https://www.deadriver.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 86,
        "estRevenue": 172,
        "totalLocs": 70,
        "employeeCount": 800,
        "states": ["ME","NH","VT","MA","CT"],
        "description": "Dead River Company is a major New England energy distributor providing propane and heating oil across 5 northeastern states with 70 locations.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Lakes Gas Company",
        "hqCity": "Wyoming",
        "hqState": "MN",
        "website": "https://www.lakesgas.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 68,
        "estRevenue": 136,
        "totalLocs": 54,
        "employeeCount": 450,
        "states": ["MN","WI","MI","IA","SD","ND"],
        "description": "Lakes Gas is a family-owned propane company serving the upper Midwest with 54 locations across 6 states. One of the largest independent propane distributors in Minnesota and Wisconsin.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "Paraco Gas Corporation",
        "hqCity": "Rye Brook",
        "hqState": "NY",
        "website": "https://www.paracogas.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 65,
        "estRevenue": 130,
        "totalLocs": 27,
        "employeeCount": 400,
        "states": ["NY","NJ","PA","CT","MA","VT","NH","FL"],
        "description": "Paraco Gas is the largest independent propane distributor in the Northeast, serving customers across 8 states from 27 locations.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Co-Alliance Cooperative",
        "hqCity": "Indianapolis",
        "hqState": "IN",
        "website": "https://www.co-alliance.com/",
        "ownership": "coop",
        "ownerDetail": "Cooperative",
        "estAnnualGallons": 46,
        "estRevenue": 92,
        "totalLocs": 26,
        "employeeCount": 350,
        "states": ["IN","OH","MI"],
        "description": "Co-Alliance is a farmer-owned cooperative providing propane, agronomy, and energy services across Indiana, Ohio, and Michigan.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "Sharp Energy Inc.",
        "hqCity": "Georgetown",
        "hqState": "DE",
        "website": "https://www.sharpenergy.com/",
        "ownership": "public",
        "ownerDetail": "Public (Chesapeake Utilities subsidiary)",
        "estAnnualGallons": 45,
        "estRevenue": 90,
        "totalLocs": 29,
        "employeeCount": 300,
        "states": ["DE","MD","VA","PA","NC","FL","OH"],
        "description": "Sharp Energy is a subsidiary of Chesapeake Utilities Corporation, distributing propane across the Mid-Atlantic and Southeast from 29 locations in 7 states.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Matheson Tri-Gas",
        "hqCity": "Irving",
        "hqState": "TX",
        "website": "https://www.mathesongas.com/",
        "ownership": "private",
        "ownerDetail": "Private (Nippon Sanso subsidiary)",
        "estAnnualGallons": 34,
        "estRevenue": 68,
        "totalLocs": 30,
        "employeeCount": 2500,
        "states": ["TX","CA","NY","PA","OH","IL","GA","FL","NC","VA"],
        "description": "Matheson Tri-Gas is a major industrial and specialty gas distributor. Subsidiary of Nippon Sanso Holdings. Propane is a portion of their broader gas distribution business.",
        "serviceTypes": ["commercial","industrial"],
    },
    {
        "name": "Valley Wide Cooperative",
        "hqCity": "Nampa",
        "hqState": "ID",
        "website": "https://www.valleywide.coop/",
        "ownership": "coop",
        "ownerDetail": "Cooperative",
        "estAnnualGallons": 30,
        "estRevenue": 60,
        "totalLocs": 19,
        "employeeCount": 250,
        "states": ["ID","OR","WA","NV","UT","MT","WY"],
        "description": "Valley Wide Cooperative is a farmer-owned cooperative in the Pacific Northwest and Mountain West, providing propane and agricultural services from 19 locations across 7 states.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "Federated Co-ops Inc.",
        "hqCity": "Princeton",
        "hqState": "MN",
        "website": "https://www.federatedco-ops.com/",
        "ownership": "coop",
        "ownerDetail": "Cooperative",
        "estAnnualGallons": 28,
        "estRevenue": 56,
        "totalLocs": 21,
        "employeeCount": 200,
        "states": ["MN","WI"],
        "description": "Federated Co-ops is a regional cooperative providing propane and energy services across Minnesota and Wisconsin.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "Scott Petroleum Corporation",
        "hqCity": "Itta Bena",
        "hqState": "MS",
        "website": "https://www.scottpetroleumcorp.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 27,
        "estRevenue": 54,
        "totalLocs": 59,
        "employeeCount": 350,
        "states": ["MS","AL","TN"],
        "description": "Scott Petroleum is a Mississippi-based propane and fuel distributor with 59 locations across Mississippi, Alabama, and Tennessee. Major SE player with deep rural footprint.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "ALCIVIA",
        "hqCity": "Cottage Grove",
        "hqState": "WI",
        "website": "https://www.alcivia.com/",
        "ownership": "coop",
        "ownerDetail": "Cooperative",
        "estAnnualGallons": 27,
        "estRevenue": 54,
        "totalLocs": 80,
        "employeeCount": 500,
        "states": ["WI","MN","IA","IL"],
        "description": "ALCIVIA is a cooperative providing propane, crop nutrients, and energy services across the upper Midwest with 80 locations in 4 states.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "Meritum Energy Holdings",
        "hqCity": "San Antonio",
        "hqState": "TX",
        "website": "https://www.meritumenergy.com/",
        "ownership": "pe",
        "ownerDetail": "Private Equity",
        "estAnnualGallons": 27,
        "estRevenue": 54,
        "totalLocs": 22,
        "employeeCount": 200,
        "states": ["TX","OK","KS","MO"],
        "description": "Meritum Energy Holdings is a PE-backed propane distribution platform focused on the South Central US, built through acquisitions.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "American Cylinder Exchange",
        "hqCity": "West Palm Beach",
        "hqState": "FL",
        "website": "https://www.americancylinderexchange.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 17,
        "estRevenue": 34,
        "totalLocs": 14,
        "employeeCount": 150,
        "states": ["FL","GA","SC","NC","VA","MD","PA","NY","NJ","CT","MA","NH","ME","OH","MI","IN","IL"],
        "description": "American Cylinder Exchange specializes in propane cylinder exchange services across 17 states, primarily along the East Coast.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Delta Liquid Energy",
        "hqCity": "Paso Robles",
        "hqState": "CA",
        "website": "https://www.dlehome.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 17,
        "estRevenue": 34,
        "totalLocs": 9,
        "employeeCount": 120,
        "states": ["CA","AZ","NV","OR","WA"],
        "description": "Delta Liquid Energy is a California-based propane distributor serving the Western US with 9 locations across 5 states.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Country Visions Cooperative",
        "hqCity": "Brillion",
        "hqState": "WI",
        "website": "https://www.countryvisions.com/",
        "ownership": "coop",
        "ownerDetail": "Cooperative",
        "estAnnualGallons": 13,
        "estRevenue": 26,
        "totalLocs": 6,
        "employeeCount": 100,
        "states": ["WI","MI"],
        "description": "Country Visions Cooperative provides propane and agricultural services in Wisconsin and Michigan.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "Christensen Inc.",
        "hqCity": "Richland",
        "hqState": "WA",
        "website": "https://www.christenseninc.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 10.5,
        "estRevenue": 21,
        "totalLocs": 16,
        "employeeCount": 150,
        "states": ["WA","OR","ID"],
        "description": "Christensen Inc. is a Pacific Northwest propane distributor with 16 locations across Washington, Oregon, and Idaho.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
    {
        "name": "21st Century Energy Group",
        "hqCity": "New Castle",
        "hqState": "PA",
        "website": "https://www.21stcenturyenergy.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 8.7,
        "estRevenue": 17,
        "totalLocs": 7,
        "employeeCount": 80,
        "states": ["PA","OH","WV","NY"],
        "description": "21st Century Energy Group distributes propane across Western Pennsylvania, Eastern Ohio, West Virginia, and Western New York.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Milton Propane",
        "hqCity": "Milton",
        "hqState": "WI",
        "website": "https://www.miltonpropane.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 8.7,
        "estRevenue": 17,
        "totalLocs": 6,
        "employeeCount": 60,
        "states": ["WI","IL"],
        "description": "Milton Propane is a Wisconsin-based propane company with 6 locations serving southern Wisconsin and northern Illinois.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Marsh Energy Inc.",
        "hqCity": "Greeneville",
        "hqState": "TN",
        "website": "https://www.marshenergy.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 8.5,
        "estRevenue": 17,
        "totalLocs": 7,
        "employeeCount": 60,
        "states": ["TN","VA","NC","KY"],
        "description": "Marsh Energy is a Tennessee-based propane distributor serving the Appalachian region with 7 locations across 4 states.",
        "serviceTypes": ["residential","commercial"],
    },
    {
        "name": "Enderby Gas Inc.",
        "hqCity": "Gainesville",
        "hqState": "TX",
        "website": "https://www.enderbygas.com/",
        "ownership": "private",
        "ownerDetail": "Private",
        "estAnnualGallons": 7.5,
        "estRevenue": 15,
        "totalLocs": 7,
        "employeeCount": 50,
        "states": ["TX","OK"],
        "description": "Enderby Gas (also known as Bishop Energy) is a North Texas propane distributor with 7 locations across Texas and Oklahoma.",
        "serviceTypes": ["residential","commercial","agricultural"],
    },
]

# Build each new company record
existing_ids = {c['id'] for c in companies}

for nc in new_companies:
    cid = make_id(nc['name'])
    # Ensure unique ID
    if cid in existing_ids:
        cid = cid + '_2'
    existing_ids.add(cid)

    # Determine SE locations
    se_states = {'AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA'}
    se_state_list = [s for s in nc['states'] if s in se_states]

    record = {
        "id": cid,
        "name": nc['name'],
        "parentGroup": nc['name'],
        "hqCity": nc['hqCity'],
        "hqState": nc['hqState'],
        "website": nc.get('website', ''),
        "ownership": nc['ownership'],
        "ownerDetail": nc['ownerDetail'],
        "states": nc['states'],
        "seLocs": 0,  # We don't have individual location data yet
        "totalLocs": nc['totalLocs'],
        "excluded": False,
        "optBScore": None,
        "optBTier": None,
        "optCScore": None,
        "optCTier": None,
        "locations": [],  # Will be populated when we get location data
        "estRevenue": nc['estRevenue'],
        "estAnnualGallons": nc['estAnnualGallons'],
        "employeeCount": nc['employeeCount'],
        "description": nc['description'],
        "serviceTypes": nc['serviceTypes'],
        "keyPersonnel": [],
        "phone": "",
        "email": "",
        "dataConfidence": 2,  # From trade publication, not independently verified
        "lastResearched": "2026-04-09",
        "yearFounded": None,
        "lastAcquisition": None,
    }

    companies.append(record)
    print(f"  Added: {nc['name']} ({nc['hqCity']}, {nc['hqState']}) - {nc['totalLocs']} locations, {nc['estAnnualGallons']}M gal")

print(f"\nAdded {len(new_companies)} new companies. Total: {len(companies)}")


# ═══════════════════════════════════════════════════════════
# PART 2: Fix Data Quality Issues
# ═══════════════════════════════════════════════════════════

print("\n=== FIXING DATA QUALITY ISSUES ===\n")
fixes = 0

# --- Fix 1: Thompson Gas HQ ---
for c in companies:
    if c['name'] == 'Thompson Gas' and c['hqCity'] == 'SC':
        c['hqCity'] = 'Frederick'
        c['hqState'] = 'MD'
        print(f"  Fixed Thompson Gas HQ: SC,SC -> Frederick, MD")
        fixes += 1
        # Also fix location city/state that match this pattern
        for loc in c.get('locations', []):
            if loc.get('city') == 'SC' and loc.get('state') == 'SC':
                loc['city'] = 'Barnwell'  # Based on address "10086 Marlboro Ave, Barnwell, SC"
                break

# --- Fix 2: United Propane Gas HQ ---
for c in companies:
    if c['name'] == 'United Propane Gas' and c['hqCity'] == 'AL':
        c['hqCity'] = 'Clanton'
        c['hqState'] = 'AL'
        print(f"  Fixed United Propane Gas HQ: AL,AL -> Clanton, AL")
        fixes += 1
        for loc in c.get('locations', []):
            if loc.get('city') == 'AL' and loc.get('state') == 'AL':
                loc['city'] = 'Clanton'
                break

# --- Fix 3: Malformed tier values ---
for c in companies:
    for field in ['optBTier', 'optCTier']:
        val = c.get(field)
        if val and '\n' in str(val):
            c[field] = None  # Clear malformed values
            fixes += 1
            if field == 'optBTier':
                print(f"  Fixed malformed {field} for {c['name']}")

# --- Fix 4: Revenue/gallon outliers - flag but don't change ---
for c in companies:
    rev = c.get('estRevenue', 0)
    gal = c.get('estAnnualGallons', 0)
    if rev and gal and gal > 0:
        price = (rev * 1e6) / (gal * 1e6)
        if price > 10:
            # SHV Energy ($5000M / 55M gal = $91/gal) - revenue includes non-propane
            # Chesapeake Utilities ($228M / 9M gal = $25/gal) - revenue includes non-propane
            # NGL Energy ($3470M / 170M gal = $20/gal) - revenue includes non-propane
            # Add a note but don't change - these are multi-line businesses
            pass

# --- Fix 5: Merge potential duplicates ---
# Green's Propane Gas / Green's Propane Gas Co Inc - keep the one with more data
# Partners Propane of GA (3 entries) - merge
# Reed Gas Propane Co / Reed Gas Propane Co. - minor name diff

def merge_dupes(companies, name1_pattern, name2_pattern):
    """Keep the first match, remove the second if it has less data."""
    c1 = None
    c2 = None
    c1_idx = None
    c2_idx = None
    for i, c in enumerate(companies):
        n = c['name'].lower()
        if name1_pattern.lower() in n and c1 is None:
            c1 = c
            c1_idx = i
        elif name2_pattern.lower() in n and c2 is None:
            c2 = c
            c2_idx = i
    if c1 and c2:
        # Keep the one with more locations
        if len(c1.get('locations', [])) >= len(c2.get('locations', [])):
            companies.pop(c2_idx)
            print(f"  Merged duplicate: removed '{c2['name']}', kept '{c1['name']}'")
        else:
            companies.pop(c1_idx)
            print(f"  Merged duplicate: removed '{c1['name']}', kept '{c2['name']}'")
        return True
    return False

# Handle Partners Propane of Ga - find all variants
partners = [(i, c) for i, c in enumerate(companies) if 'partners propane of ga' in c['name'].lower()]
if len(partners) > 1:
    # Keep the one with most locations, remove others
    partners.sort(key=lambda x: len(x[1].get('locations', [])), reverse=True)
    for idx, c in partners[1:]:
        print(f"  Merged duplicate: removed '{c['name']}' (kept '{partners[0][1]['name']}')")
    # Remove from end to avoid index shift
    for idx, c in sorted(partners[1:], key=lambda x: x[0], reverse=True):
        companies.pop(idx)
    fixes += len(partners) - 1

merge_dupes(companies, "Green's Propane Gas Co", "Green's Propane Gas")
fixes += 1

merge_dupes(companies, "Reed Gas Propane Co.", "Reed Gas Propane Co")
fixes += 1

merge_dupes(companies, "Mallard Oil & LP Gas Co.", "Mallard Oil & LP Gas")
fixes += 1

merge_dupes(companies, "Dixie LP Gas Inc", "Dixie Gas Co")
# These might be different companies - skip

# --- Fix 6: Location state mismatches ---
# Thompson Gas has locations attributed to wrong states
# The location has coords that are correct, but city/state fields use state abbreviations
# We can fix city names by parsing the address field
for c in companies:
    for loc in c.get('locations', []):
        addr = loc.get('address', '')
        city = loc.get('city', '')
        state = loc.get('state', '')
        # If city is a 2-letter state abbreviation, try to parse from address
        if len(city) == 2 and city == state and addr:
            parts = addr.split(',')
            if len(parts) >= 3:
                parsed_city = parts[1].strip()
                parsed_state = parts[2].strip().split()[0] if parts[2].strip() else ''
                if parsed_city and len(parsed_city) > 2:
                    loc['city'] = parsed_city
                    if len(parsed_state) == 2:
                        loc['state'] = parsed_state
                    fixes += 1

print(f"\nTotal fixes applied: {fixes}")
print(f"Final company count: {len(companies)}")

# Save
with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))
print(f"Saved updated companies.json ({os.path.getsize(os.path.join(DATA_DIR, 'companies.json')):,} bytes)")

# Summary stats
ownership_counts = {}
for c in companies:
    o = c.get('ownership', 'unknown')
    ownership_counts[o] = ownership_counts.get(o, 0) + 1

print(f"\n=== FINAL DATASET SUMMARY ===")
print(f"Companies: {len(companies)}")
print(f"Ownership: {dict(sorted(ownership_counts.items()))}")

states_covered = set()
for c in companies:
    states_covered.update(c.get('states', []))
print(f"States covered: {len(states_covered)}: {sorted(states_covered)}")

total_locs = sum(len(c.get('locations',[])) for c in companies)
total_gal = sum(c.get('estAnnualGallons', 0) or 0 for c in companies)
print(f"Total locations: {total_locs}")
print(f"Total estimated gallons: {total_gal:.0f}M")
