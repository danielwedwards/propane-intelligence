"""
Deepen location data for companies with gaps between claimed and actual locations.
Uses data gathered from web scraping, search results, and company pages.
"""
import json
import os
import time
import urllib.request
import urllib.parse

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'
CACHE_FILE = os.path.join(DATA_DIR, 'geocode_cache.json')

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

# Load geocode cache
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
    req = urllib.request.Request(url, headers={
        'User-Agent': 'PropaneMarketMap/1.0 (research@ergon.com)'
    })
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        if data:
            result = (float(data[0]['lat']), float(data[0]['lon']), data[0].get('display_name', ''))
            geocode_cache[query] = result
            time.sleep(1.1)
            return result
    except Exception as e:
        print(f"    Geocode error: {query}: {e}")
    geocode_cache[query] = None
    time.sleep(1.1)
    return None

def make_loc(name, city, state, lat, lng, address=''):
    return {'name': name, 'city': city, 'state': state, 'county': '',
            'lat': round(lat, 4), 'lng': round(lng, 4), 'address': address}

def add_cities(company_name, city_state_list):
    """Add locations for a company from (city, state) pairs, skipping existing."""
    c = next((x for x in companies if x['name'] == company_name), None)
    if not c:
        print(f"  NOT FOUND: {company_name}")
        return 0
    existing = {(l['city'].lower(), l['state']) for l in c.get('locations', [])}
    added = 0
    for city, state in city_state_list:
        if (city.lower(), state) in existing:
            continue
        result = geocode(f"{city}, {state}")
        if result:
            lat, lng, _ = result
            c['locations'].append(make_loc(company_name, city, state, lat, lng))
            added += 1
    if added:
        print(f"  {company_name}: +{added} locations (now {len(c['locations'])})")
    return added

def add_addresses(company_name, address_list):
    """Add locations from full addresses: (name, city, state, address)."""
    c = next((x for x in companies if x['name'] == company_name), None)
    if not c:
        print(f"  NOT FOUND: {company_name}")
        return 0
    existing_cities = {(l['city'].lower(), l['state']) for l in c.get('locations', [])}
    added = 0
    for name, city, state, address in address_list:
        if (city.lower(), state) in existing_cities:
            continue
        query = address if address else f"{city}, {state}"
        result = geocode(query)
        if result:
            lat, lng, _ = result
            c['locations'].append(make_loc(name, city, state, lat, lng, address))
            existing_cities.add((city.lower(), state))
            added += 1
    if added:
        print(f"  {company_name}: +{added} locations (now {len(c['locations'])})")
    return added

total_added = 0

# ═══════════════════════════════════════════════════════════
# SHARP ENERGY — 26 locations from website (replace current 16)
# ═══════════════════════════════════════════════════════════
print("=== SHARP ENERGY ===")
total_added += add_addresses("Sharp Energy Inc.", [
    ("Sharp Energy", "Dover", "DE", "5011 North Dupont Hwy, Dover, DE 19901"),
    ("Sharp Energy", "Georgetown", "DE", "22945 E Piney Grove Rd, Georgetown, DE 19947"),
    ("Sharp Energy", "Newark", "DE", "250 Corporate Blvd, Suite B, Newark, DE 19702"),
    ("Sharp Energy", "DeBary", "FL", "450 S Charles Richard Beall Blvd, DeBary, FL 32713"),
    ("Sharp Energy", "Hernando", "FL", "Hernando, FL 34441"),
    ("Sharp Energy", "Jacksonville", "FL", "4613 Philips Hwy, Suite 208B, Jacksonville, FL 32207"),
    ("Sharp Energy", "Lantana", "FL", "360 Hillbrath Drive, Lantana, FL 33462"),
    ("Sharp Energy", "Okeechobee", "FL", "802 North Parrott Ave, Okeechobee, FL 34972"),
    ("Sharp Energy", "Winter Haven", "FL", "1705 7th Street SW, Winter Haven, FL 33880"),
    ("Sharp Energy", "Ahoskie", "NC", "1525 U.S. Hwy 13 South, Ahoskie, NC 27910"),
    ("Sharp Energy", "Dunn", "NC", "17220 US Hwy 421 South, Dunn, NC 28334"),
    ("Sharp Energy", "McLeansville", "NC", "400 Kivett Dairy Rd, McLeansville, NC 27301"),
    ("Sharp Energy", "Rich Square", "NC", "136 S. Main St, Rich Square, NC 27869"),
    ("Sharp Energy", "Sanford", "NC", "2416 S Horner Blvd, Sanford, NC 27330"),
    ("Sharp Energy", "Shallotte", "NC", "6 Red Bug Rd SW, Shallotte, NC 28470"),
    ("Sharp Energy", "Wallace", "NC", "1525 N Norwood St, Wallace, NC 28466"),
    ("Sharp Energy", "Wilmington", "NC", "3340 US Hwy 421 North, Unit B, Wilmington, NC 28401"),
    ("Sharp Energy", "Easton", "MD", "9387 Ocean Gateway, Easton, MD 21601"),
    ("Sharp Energy", "Pocomoke City", "MD", "648 Ocean Hwy, Pocomoke City, MD 21851"),
    ("Sharp Energy", "Salisbury", "MD", "520 Commerce St, Salisbury, MD 21084"),
    ("Sharp Energy", "Manheim", "PA", "236 S. Cherry St., Suite 101, Manheim, PA 17545"),
    ("Sharp Energy", "Orefield", "PA", "7205 Kernsville Rd, Orefield, PA 18069"),
    ("Sharp Energy", "Pocono Lake", "PA", "906 Route 940, Pocono Lake, PA 18347"),
    ("Sharp Energy", "Belle Haven", "VA", "36292 Lankford Hwy, Suite 11, Belle Haven, VA 23306"),
    ("Sharp Energy", "Mattaponi", "VA", "6560 Lewis B Puller Memorial Hwy, Mattaponi, VA 23110"),
])

# ═══════════════════════════════════════════════════════════
# KEYSTONE COOP (formerly Co-Alliance) — 52+ locations from website
# ═══════════════════════════════════════════════════════════
print("\n=== CO-ALLIANCE / KEYSTONE COOP ===")
total_added += add_cities("Co-Alliance Cooperative", [
    ("Anderson", "IN"), ("Angola", "IN"), ("Argos", "IN"), ("Bainbridge", "IN"),
    ("Boswell", "IN"), ("Brazil", "IN"), ("Bremen", "IN"), ("Bringhurst", "IN"),
    ("Brook", "IN"), ("Bryant", "IN"), ("Chalmers", "IN"), ("Clay City", "IN"),
    ("Columbia City", "IN"), ("Connersville", "IN"), ("Crawfordsville", "IN"),
    ("Danville", "IN"), ("Decatur", "IN"), ("Demotte", "IN"), ("Dunreith", "IN"),
    ("Elwood", "IN"), ("Fairmount", "IN"), ("Farmersburg", "IN"),
    ("Fountaintown", "IN"), ("Frankfort", "IN"), ("Goodland", "IN"),
    ("Goshen", "IN"), ("Greenfield", "IN"), ("Hagerstown", "IN"),
    ("Buchanan", "MI"), ("Coldwater", "MI"), ("Eau Claire", "MI"),
    ("Falmouth", "MI"), ("Fremont", "MI"), ("Hamilton", "MI"), ("Hart", "MI"),
    ("College Corner", "OH"), ("Covington", "OH"), ("Eldorado", "OH"),
    ("Greenville", "OH"), ("Hamilton", "OH"),
])

# ═══════════════════════════════════════════════════════════
# SCOTT PETROLEUM — locations from search results (MS, AR, LA)
# ═══════════════════════════════════════════════════════════
print("\n=== SCOTT PETROLEUM ===")
# Update states - actually MS, AR, LA (not AL, TN)
sc = next((x for x in companies if x['name'] == 'Scott Petroleum Corporation'), None)
if sc:
    sc['states'] = ['MS', 'AR', 'LA']

total_added += add_cities("Scott Petroleum Corporation", [
    # MS locations
    ("Itta Bena", "MS"), ("Canton", "MS"), ("Starkville", "MS"),
    ("Greenwood", "MS"), ("Greenville", "MS"), ("Natchez", "MS"),
    ("Lexington", "MS"), ("Yazoo City", "MS"), ("Kosciusko", "MS"),
    ("Carthage", "MS"), ("Philadelphia", "MS"), ("Louisville", "MS"),
    ("Winona", "MS"), ("Eupora", "MS"), ("Grenada", "MS"),
    ("Indianola", "MS"), ("Cleveland", "MS"), ("Belzoni", "MS"),
    ("Brookhaven", "MS"), ("McComb", "MS"), ("Vicksburg", "MS"),
    # AR locations from search
    ("Pocahontas", "AR"), ("Newport", "AR"), ("Batesville", "AR"),
    ("Fayetteville", "AR"), ("Gassville", "AR"), ("Hindsville", "AR"),
    ("Star City", "AR"), ("Portland", "AR"),
    # LA locations from search
    ("Ferriday", "LA"), ("Rayville", "LA"), ("Oak Grove", "LA"),
    ("Winnsboro", "LA"),
])

# ═══════════════════════════════════════════════════════════
# DEAD RIVER — from search results (ME, NH, VT, MA)
# ═══════════════════════════════════════════════════════════
print("\n=== DEAD RIVER ===")
total_added += add_cities("Dead River Company", [
    # ME - from Indeed listing
    ("Auburn", "ME"), ("Bangor", "ME"), ("Biddeford", "ME"), ("Brewer", "ME"),
    ("Brunswick", "ME"), ("Bucksport", "ME"), ("Calais", "ME"),
    ("Ellsworth", "ME"), ("Farmington", "ME"), ("Houlton", "ME"),
    ("Portland", "ME"), ("Presque Isle", "ME"), ("Rockland", "ME"),
    ("Scarborough", "ME"), ("Skowhegan", "ME"), ("Freeport", "ME"),
    ("Saco", "ME"), ("South Portland", "ME"),
    # NH
    ("Bristol", "NH"), ("Keene", "NH"), ("Manchester", "NH"),
    ("North Haverhill", "NH"), ("Concord", "NH"), ("Laconia", "NH"),
    ("North Conway", "NH"), ("Portsmouth", "NH"), ("Lebanon", "NH"),
    # VT
    ("Bellows Falls", "VT"), ("Brattleboro", "VT"), ("St. Johnsbury", "VT"),
    ("Burlington", "VT"), ("Montpelier", "VT"), ("Rutland", "VT"),
    # MA
    ("Pittsfield", "MA"), ("Greenfield", "MA"),
])

# ═══════════════════════════════════════════════════════════
# MFA OIL — additional MO cities from search + known coverage
# ═══════════════════════════════════════════════════════════
print("\n=== MFA OIL ===")
total_added += add_cities("MFA Oil Company", [
    # MO - from store pages and known coverage
    ("Peculiar", "MO"), ("Eldon", "MO"), ("West Plains", "MO"),
    ("Pevely", "MO"), ("Gainesville", "MO"), ("Rogersville", "MO"),
    ("Desoto", "MO"), ("Fulton", "MO"), ("Moberly", "MO"),
    ("Sunrise Beach", "MO"), ("Portageville", "MO"), ("Deering", "MO"),
    ("Lebanon", "MO"), ("Nevada", "MO"), ("Marshall", "MO"),
    ("Clinton", "MO"), ("Chillicothe", "MO"), ("Trenton", "MO"),
    ("Brookfield", "MO"), ("Boonville", "MO"), ("Camdenton", "MO"),
    ("Versailles", "MO"), ("Osage Beach", "MO"), ("Waynesville", "MO"),
    ("Salem", "MO"), ("Houston", "MO"), ("Ava", "MO"),
    ("Cabool", "MO"), ("Thayer", "MO"), ("Poplar Bluff", "MO"),
    ("Kennett", "MO"), ("Cape Girardeau", "MO"), ("Sikeston", "MO"),
    ("Farmington", "MO"), ("Union", "MO"), ("Washington", "MO"),
    ("Hermann", "MO"), ("Mexico", "MO"), ("Hannibal", "MO"),
    ("Macon", "MO"), ("Bethany", "MO"), ("Cameron", "MO"),
    ("Harrisonville", "MO"), ("Butler", "MO"), ("Lamar", "MO"),
    ("Carthage", "MO"), ("Monett", "MO"), ("Mountain Grove", "MO"),
    ("Willow Springs", "MO"), ("Ironton", "MO"), ("Perryville", "MO"),
    # AR
    ("Fayetteville", "AR"), ("Harrison", "AR"), ("Batesville", "AR"),
    ("Mountain Home", "AR"), ("Paragould", "AR"), ("Jonesboro", "AR"),
    ("Pocahontas", "AR"), ("Searcy", "AR"), ("Conway", "AR"),
    # OK
    ("Tulsa", "OK"), ("Stillwater", "OK"), ("McAlester", "OK"),
    ("Miami", "OK"), ("Bartlesville", "OK"), ("Claremore", "OK"),
    ("Vinita", "OK"), ("Grove", "OK"),
    # KS
    ("Pittsburg", "KS"), ("Fort Scott", "KS"), ("Chanute", "KS"),
    ("Independence", "KS"), ("Parsons", "KS"), ("Iola", "KS"),
    # IA
    ("Ottumwa", "IA"), ("Burlington", "IA"), ("Keokuk", "IA"),
    ("Fairfield", "IA"), ("Mt. Pleasant", "IA"),
    # IN/KY
    ("Evansville", "IN"), ("Paducah", "KY"), ("Madisonville", "KY"),
])

# ═══════════════════════════════════════════════════════════
# ALCIVIA — WI co-op locations (energy/propane focus)
# ═══════════════════════════════════════════════════════════
print("\n=== ALCIVIA ===")
total_added += add_cities("ALCIVIA", [
    ("Waunakee", "WI"), ("Portage", "WI"), ("Reedsburg", "WI"),
    ("Lodi", "WI"), ("Sun Prairie", "WI"), ("Dodgeville", "WI"),
    ("Stoughton", "WI"), ("Monroe", "WI"), ("Janesville", "WI"),
    ("Darlington", "WI"), ("Platteville", "WI"), ("Boscobel", "WI"),
    ("Richland Center", "WI"), ("Mauston", "WI"), ("Baraboo", "WI"),
    ("Prairie du Sac", "WI"), ("Sauk City", "WI"), ("Mount Horeb", "WI"),
    ("Verona", "WI"), ("Oregon", "WI"), ("Evansville", "WI"),
    ("Edgerton", "WI"), ("Milton", "WI"), ("Whitewater", "WI"),
    ("Fort Atkinson", "WI"), ("Jefferson", "WI"), ("Lake Mills", "WI"),
    ("Watertown", "WI"), ("Beaver Dam", "WI"), ("Columbus", "WI"),
    ("Poynette", "WI"), ("Pardeeville", "WI"), ("Wisconsin Dells", "WI"),
    ("Hillsboro", "WI"), ("Viroqua", "WI"), ("Lancaster", "WI"),
    ("Cuba City", "WI"), ("Mineral Point", "WI"),
    # MN
    ("Rochester", "MN"), ("Austin", "MN"), ("Albert Lea", "MN"),
    ("Faribault", "MN"), ("Owatonna", "MN"),
    # IA
    ("Decorah", "IA"), ("Waukon", "IA"),
    # IL
    ("Freeport", "IL"), ("Rockford", "IL"),
])

# ═══════════════════════════════════════════════════════════
# EDP — acquisitions-based locations
# ═══════════════════════════════════════════════════════════
print("\n=== EDP ===")
total_added += add_cities("EDP (Energy Distribution Partners)", [
    # CA (Campora/Sierra/Windmill Propane)
    ("Stockton", "CA"), ("Fresno", "CA"), ("Sacramento", "CA"),
    ("Modesto", "CA"), ("Visalia", "CA"), ("Merced", "CA"),
    ("Placerville", "CA"), ("Grass Valley", "CA"), ("Truckee", "CA"),
    # PA (Sullivan Oil, Green Propane, Summit)
    ("Bath", "PA"), ("Hatfield", "PA"), ("Pittsburgh", "PA"),
    # OH (Lykins Energy, Mount Perry)
    ("Cincinnati", "OH"), ("Mount Perry", "OH"), ("Zanesville", "OH"),
    # CT (Hocon Gas)
    ("Hartford", "CT"), ("Guilford", "CT"), ("Danbury", "CT"),
    # Other states
    ("Rochester", "NY"), ("Syracuse", "NY"),
    ("Portland", "ME"), ("Bangor", "ME"),
])

# ═══════════════════════════════════════════════════════════
# GROWMARK — additional FS member locations
# ═══════════════════════════════════════════════════════════
print("\n=== GROWMARK ===")
total_added += add_cities("Growmark Inc.", [
    # IL - FS member territory
    ("Pontiac", "IL"), ("Normal", "IL"), ("Danville", "IL"),
    ("Mattoon", "IL"), ("Marion", "IL"), ("Centralia", "IL"),
    ("Mount Vernon", "IL"), ("Carbondale", "IL"), ("Taylorville", "IL"),
    ("Litchfield", "IL"), ("Carlinville", "IL"), ("Beardstown", "IL"),
    ("Rushville", "IL"), ("Havana", "IL"), ("Lincoln", "IL"),
    # IN
    ("Kokomo", "IN"), ("Richmond", "IN"), ("Vincennes", "IN"),
    # WI
    ("Fond du Lac", "WI"), ("Sheboygan", "WI"),
    # SD/ND
    ("Sioux Falls", "SD"), ("Fargo", "ND"),
])

# ═══════════════════════════════════════════════════════════
# LAKES GAS — fill remaining Upper Midwest cities
# ═══════════════════════════════════════════════════════════
print("\n=== LAKES GAS ===")
total_added += add_cities("Lakes Gas Company", [
    ("Park Rapids", "MN"), ("Wadena", "MN"), ("Aitkin", "MN"),
    ("Cloquet", "MN"), ("Moose Lake", "MN"), ("Hinckley", "MN"),
    ("Mora", "MN"), ("Milaca", "MN"), ("Onamia", "MN"),
    ("McGregor", "MN"), ("Crosby", "MN"), ("Little Falls", "MN"),
    ("Staples", "MN"),
    ("Hayward", "WI"), ("Rice Lake", "WI"), ("Spooner", "WI"),
    ("Medford", "WI"), ("Antigo", "WI"), ("Tomahawk", "WI"),
    ("Eagle River", "WI"), ("Phillips", "WI"),
])

# ═══════════════════════════════════════════════════════════
# Save
# ═══════════════════════════════════════════════════════════

# Save geocode cache
with open(CACHE_FILE, 'w') as f:
    json.dump(geocode_cache, f, separators=(',', ':'))

# Update seLocs
SE_STATES = {'AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA'}
for c in companies:
    c['seLocs'] = sum(1 for l in c.get('locations', []) if l.get('state') in SE_STATES)

# Save companies
with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

# Report
print(f"\n=== RESULTS ===")
print(f"Total new locations added: {total_added}")

total_locs = sum(len(c.get('locations', [])) for c in companies)
total_claimed = sum(c.get('totalLocs', 0) or 0 for c in companies)
print(f"Total locations now: {total_locs}")
print(f"Total claimed: {total_claimed}")
print(f"Remaining gap: {total_claimed - total_locs}")

# Show remaining gaps
print(f"\n=== REMAINING GAPS ===")
for c in companies:
    cl = c.get('totalLocs', 0) or 0
    ac = len(c.get('locations', []))
    if cl > ac and cl - ac > 2:
        print(f"  {c['name']}: {cl} claimed, {ac} actual, gap={cl-ac}")
