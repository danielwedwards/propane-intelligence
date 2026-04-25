"""
Add 48 new companies found from MS, LA, AR state propane association directories.
These are confirmed operating dealers listed by their state associations.
"""
import json
import os
import re

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

print(f"Starting companies: {len(companies)}")

existing_ids = {c['id'] for c in companies}

def make_id(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9 ]', '', s)
    s = re.sub(r'\s+', '_', s).strip('_')
    return s

def add_company(name, city, state, states=None, locs=1, ownership='private',
                description='', service_types=None):
    cid = make_id(name)
    if cid in existing_ids:
        cid = cid + '_2'
    existing_ids.add(cid)

    if states is None:
        states = [state]
    if service_types is None:
        service_types = ['residential', 'commercial']

    record = {
        "id": cid,
        "name": name,
        "parentGroup": name,
        "hqCity": city,
        "hqState": state,
        "website": "",
        "ownership": ownership,
        "ownerDetail": "Private" if ownership == 'private' else ownership.title(),
        "states": states,
        "seLocs": locs,
        "totalLocs": locs,
        "excluded": False,
        "optBScore": None,
        "optBTier": None,
        "optCScore": None,
        "optCTier": None,
        "locations": [],
        "estRevenue": None,
        "estAnnualGallons": None,
        "employeeCount": None,
        "description": description,
        "serviceTypes": service_types,
        "keyPersonnel": [],
        "phone": "",
        "email": "",
        "dataConfidence": 1,
        "lastResearched": "2026-04-09",
        "yearFounded": None,
        "lastAcquisition": None,
    }
    companies.append(record)
    return record

# ═══════════════════════════════════════════════════════════
# MISSISSIPPI — 17 new companies from mspropane.com/dealers/
# ═══════════════════════════════════════════════════════════
print("\n--- MISSISSIPPI (17 new) ---")

ms_companies = [
    ("Bell Liquefied Gas Co.", "Corinth", "MS", 1,
     "Propane dealer in Corinth, Mississippi. Member of MS Propane Gas Association."),
    ("C.P. House Gas Co.", "Cleveland", "MS", 1,
     "Propane dealer based in Cleveland, Mississippi serving the Delta region."),
    ("Clark Gas Co.", "Florence", "AL", 2,  # AL-based but MS association member
     "Propane dealer based in Florence, Alabama serving northern MS and AL."),
    ("Fair Propane Gas LLC", "Ackerman", "MS", 4,
     "Mississippi propane dealer with locations in Ackerman, Columbus, Kosciusko, and Louisville."),
    ("Farmers Inc.", "Greenville", "MS", 1,
     "Propane and agricultural services in Greenville, Mississippi serving the Delta."),
    ("Gresham Petroleum Co.", "Belzoni", "MS", 5,
     "Mississippi petroleum and propane distributor with locations in Belzoni, Clarksdale, Greenwood, Indianola, and Tunica."),
    ("H&M Gas Co.", "Edwards", "MS", 2,
     "Propane dealer with locations in Edwards and Flora, Mississippi."),
    ("Local L.P. Gas Co.", "Buckatunna", "MS", 1,
     "Small propane dealer in Buckatunna, Mississippi."),
    ("Magnolia Gas Inc.", "Pass Christian", "MS", 2,
     "Mississippi Gulf Coast propane dealer with locations in Pass Christian and Poplarville."),
    ("McDonald-Hill Inc.", "Meridian", "MS", 3,
     "Propane dealer in eastern Mississippi with locations in Meridian, Newton, and Quitman."),
    ("Partridge Propane", "Magee", "MS", 5,
     "Mississippi propane dealer with locations in Magee, Canton, Florence, Forest, and Philadelphia."),
    ("Rogers Propane Gas LLC", "Iuka", "MS", 2,
     "Northeast Mississippi propane dealer with locations in Iuka and New Albany."),
    ("Sayle Propane LLC", "Charleston", "MS", 6,
     "North Mississippi propane dealer with locations in Charleston, Clarksdale, Coldwater, Holly Springs, Pope, and Water Valley."),
    ("Slate Spring LP Gas Co.", "Calhoun City", "MS", 1,
     "Propane dealer in Calhoun City, Mississippi."),
    ("Tallahatchie Farmers Supply", "Charleston", "MS", 1,
     "Agricultural cooperative providing propane in Charleston, Mississippi."),
    ("Thomas LP Gas", "Holly Springs", "MS", 1,
     "Propane dealer in Holly Springs, Mississippi."),
    ("TNT Lewis Inc.", "Carriere", "MS", 1,
     "Propane dealer in Carriere, Mississippi near the Louisiana border."),
]

# Trace Propane was already similar-matched
for name, city, state, locs, desc in ms_companies:
    states = ["MS"] if state == "MS" else ["AL", "MS"]
    add_company(name, city, state, states, locs, description=desc,
                service_types=['residential', 'commercial'])
    print(f"  + {name} ({city}, {state}) - {locs} loc(s)")

# ═══════════════════════════════════════════════════════════
# LOUISIANA — 16 new companies from lapropane.org
# ═══════════════════════════════════════════════════════════
print("\n--- LOUISIANA (16 new) ---")

la_companies = [
    ("O'Neal Gas Inc.", "Many", "LA", 8,
     "Major Louisiana propane dealer with locations in Many, Choudrant, Columbia, Farmerville, Monroe, Tallulah, Winnsboro, and Haughton."),
    ("Sabine Butane Gas Co.", "Alexandria", "LA", 1,
     "Propane dealer in Alexandria, Louisiana."),
    ("Harrell Gas Inc.", "Kentwood", "LA", 1,
     "Propane dealer in Kentwood, Louisiana."),
    ("Lacox Propane Gas Co.", "Franklinton", "LA", 3,
     "Southeast Louisiana propane dealer with locations in Franklinton, Hammond, and Covington."),
    ("Delta Fuel", "Port Allen", "LA", 3,
     "Louisiana fuel and propane distributor with locations in Port Allen, Shreveport, and Lake Charles."),
    ("Marcello Distributors", "Donaldsonville", "LA", 1,
     "Propane distributor in Donaldsonville, Louisiana."),
    ("Buddy's Home Gas", "Mamou", "LA", 1,
     "Propane dealer in Mamou, Louisiana serving Evangeline Parish."),
    ("Farmer's Gas Co.", "Mamou", "LA", 1,
     "Propane and agricultural gas dealer in Mamou, Louisiana."),
    ("Hercules Transport Inc.", "Arnaudville", "LA", 2,
     "Propane transport and distribution with locations in Arnaudville and Choudrant, Louisiana."),
    ("Gulf South LP-Gas Co.", "Choudrant", "LA", 1,
     "Propane dealer in Choudrant, Louisiana serving northeast LA."),
    ("Tait Service", "Choudrant", "LA", 1,
     "Propane service company in Choudrant, Louisiana."),
    ("Metro Lift Propane", "Reserve", "LA", 1,
     "Propane dealer in Reserve, Louisiana serving the greater New Orleans area."),
    ("Universal Services & Associates", "Belle Chasse", "LA", 1,
     "Propane services in Belle Chasse, Louisiana."),
    ("Aeropres Corporation", "Shreveport", "LA", 1,
     "Industrial gas and propane distributor in Shreveport, Louisiana."),
    ("Red Ball Oxygen", "Shreveport", "LA", 1,
     "Gas and propane supplier in Shreveport, Louisiana."),
    ("SPS Propane LLC", "Louisiana", "LA", 1,
     "Louisiana-based propane dealer."),
]

for name, city, state, locs, desc in la_companies:
    add_company(name, city, state, ["LA"], locs, description=desc,
                service_types=['residential', 'commercial'])
    print(f"  + {name} ({city}, {state}) - {locs} loc(s)")

# ═══════════════════════════════════════════════════════════
# ARKANSAS — 15 new companies from APGA directory
# ═══════════════════════════════════════════════════════════
print("\n--- ARKANSAS (15 new) ---")

ar_companies = [
    ("Tri-County Propane", "Brinkley", "AR", 2,
     "Arkansas propane dealer with locations in Brinkley and Des Arc."),
    ("Littlefield Propane LLC", "Charleston", "AR", 1,
     "Propane dealer in Charleston, Arkansas."),
    ("EZE Cook Gas Company", "Corning", "AR", 1,
     "Propane dealer in Corning, Arkansas serving northeast AR."),
    ("Sun Gas Inc.", "Damascus", "AR", 1,
     "Propane dealer in Damascus, Arkansas."),
    ("Simmons Energy Solutions Inc.", "Decatur", "AR", 1,
     "Energy and propane services in Decatur, Arkansas."),
    ("Alice Sidney Dryer & Seed Co.", "Dermott", "AR", 1,
     "Agricultural services and propane in Dermott, Arkansas."),
    ("Blue Seal Petroleum Co.", "Dewitt", "AR", 2,
     "Petroleum and propane dealer with locations in Dewitt and Stuttgart, Arkansas."),
    ("Graves Propane Inc.", "Mena", "AR", 1,
     "Propane dealer in Mena, Arkansas serving Polk County."),
    ("Farmers Oil Corporation", "Newport", "AR", 1,
     "Agricultural fuel and propane in Newport, Arkansas."),
    ("Farmers Supply Association", "Harrisburg", "AR", 2,
     "Agricultural cooperative providing propane in Harrisburg and Wynne, Arkansas."),
    ("Tyson Gas Company", "Russellville", "AR", 2,
     "Propane dealer with locations in Russellville and Springdale, Arkansas."),
    ("Victor Welding Supply Co.", "Fort Smith", "AR", 1,
     "Industrial gas and propane supplier in Fort Smith, Arkansas."),
    ("Winston Inc.", "Sheridan", "AR", 1,
     "Propane dealer in Sheridan, Arkansas."),
    ("Fricks Butane Gas Inc.", "Texarkana", "AR", 1,
     "Propane dealer in Texarkana, Arkansas serving the AR-TX border region."),
    ("Stephens Propane Company LLC", "Stephens", "AR", 1,
     "Propane dealer in Stephens, Arkansas."),
]

for name, city, state, locs, desc in ar_companies:
    add_company(name, city, state, ["AR"], locs, description=desc,
                service_types=['residential', 'commercial'])
    print(f"  + {name} ({city}, {state}) - {locs} loc(s)")

# ═══════════════════════════════════════════════════════════
# Save
# ═══════════════════════════════════════════════════════════

print(f"\nFinal company count: {len(companies)}")

# Stats
conf_dist = {}
for c in companies:
    d = c.get('dataConfidence', 0)
    conf_dist[d] = conf_dist.get(d, 0) + 1

states_covered = set()
for c in companies:
    states_covered.update(c.get('states', []))

total_se_locs = sum(c.get('seLocs', 0) for c in companies)

print(f"States covered: {len(states_covered)}")
print(f"Total SE locations: {total_se_locs}")
print(f"Confidence distribution: {dict(sorted(conf_dist.items()))}")

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))
size = os.path.getsize(os.path.join(DATA_DIR, 'companies.json'))
print(f"Saved companies.json ({size:,} bytes)")
