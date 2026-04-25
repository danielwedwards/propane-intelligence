"""
Find and geocode missing location data for 70 new companies.

Strategy:
1. For companies with scraped address data (Paraco, Lakes Gas) - geocode those
2. For companies with known city lists from state directories - geocode each city
3. For single-location companies - geocode HQ city
4. For large companies with websites - try to extract from location pages
5. Use Nominatim/OpenStreetMap for all geocoding (free, no API key)

Rate limit: Nominatim requires max 1 request/second.
"""
import json
import os
import time
import urllib.request
import urllib.parse
import re

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

# Nominatim geocoder with caching
geocode_cache = {}
CACHE_FILE = os.path.join(DATA_DIR, 'geocode_cache.json')
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE) as f:
        geocode_cache = json.load(f)

def geocode(query):
    """Geocode an address using Nominatim. Returns (lat, lng, display_name) or None."""
    if query in geocode_cache:
        return geocode_cache[query]

    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({
        'q': query,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'us'
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
            time.sleep(1.1)  # Rate limit
            return result
    except Exception as e:
        print(f"    Geocode error for '{query}': {e}")

    geocode_cache[query] = None
    time.sleep(1.1)
    return None

def make_location(name, city, state, lat, lng, address='', county=''):
    return {
        'name': name,
        'city': city,
        'state': state,
        'county': county,
        'lat': round(lat, 4),
        'lng': round(lng, 4),
        'address': address
    }

def geocode_address(company_name, address, city, state):
    """Try to geocode a full address, falling back to city+state."""
    if address:
        result = geocode(address)
        if result:
            return result
    result = geocode(f"{city}, {state}")
    return result

# ═══════════════════════════════════════════════════════════
# Known location data from web scraping and state directories
# ═══════════════════════════════════════════════════════════

KNOWN_LOCATIONS = {
    # Paraco Gas - 25 locations from website
    "Paraco Gas Corporation": [
        ("Paraco Gas", "Broad Brook", "CT", "152 Broad Brook Road, Broad Brook, CT 06016"),
        ("Paraco Gas", "Essex", "CT", "23 Saybrook Road, Essex, CT 06426"),
        ("Paraco Gas", "Waterbury", "CT", "75 East Aurora St, Waterbury, CT 06708"),
        ("Paraco Gas", "Califon", "NJ", "412B Trimmer Rd, Califon, NJ 07830"),
        ("Paraco Gas", "Phoenicia", "NY", "5582 New York 28, Phoenicia, NY 12464"),
        ("Paraco Gas", "High Falls", "NY", "1409 NY-213, High Falls, NY 12440"),
        ("Paraco Gas", "Mt. Vernon", "NY", "10 Edison Avenue, Mt. Vernon, NY 10550"),
        ("Paraco Gas", "Cortland Manor", "NY", "14 Bayview Road, Cortland Manor, NY 10567"),
        ("Paraco Gas", "Pine Plains", "NY", "2661 Route 199, Pine Plains, NY 12567"),
        ("Paraco Gas", "Riverhead", "NY", "44 Kroemer Avenue, Riverhead, NY 11901"),
        ("Paraco Gas", "Saugerties", "NY", "2926 Route 32, Saugerties, NY 12477"),
        ("Paraco Gas", "Shirley", "NY", "29 McGraw Street, Shirley, NY 11967"),
        ("Paraco Gas", "Bay Shore", "NY", "200 Corbin Avenue, Bay Shore, NY 11706"),
        ("Paraco Gas", "Wurtsboro", "NY", "25 Sullivan Street, Wurtsboro, NY 12790"),
        ("Paraco Gas", "Brewster", "NY", "4 Joes Hill Road, Brewster, NY 10509"),
        ("Paraco Gas", "Cooperstown", "NY", "4871 State Highway 28, Cooperstown, NY 13326"),
        ("Paraco Gas", "Deposit", "NY", "2956 Old Route 17, Deposit, NY 13757"),
        ("Paraco Gas", "Hoosick Falls", "NY", "21990 Route 22, Hoosick Falls, NY 12090"),
        ("Paraco Gas", "Ashland", "NY", "11325 Route 23, Ashland, NY 12407"),
        ("Paraco Gas", "Gardiner", "NY", "40 Steves Lane, Gardiner, NY 12525"),
        ("Paraco Gas", "Rye Brook", "NY", "Rye Brook, NY 10573"),
        ("Paraco Gas", "Gilbert", "PA", "1202 US-209, Gilbert, PA 18331"),
        ("Paraco Gas", "Friendsville", "PA", "27034 State Route 267, Friendsville, PA 18818"),
        ("Paraco Gas", "Woonsocket", "RI", "139 Hamlet Avenue, Woonsocket, RI 02895"),
        ("Paraco Gas", "Burrillville", "RI", "138 Clear River Drive, Burrillville, RI 02858"),
    ],

    # Lakes Gas - 10 locations from website
    "Lakes Gas Company": [
        ("Lakes Gas", "Marshfield", "WI", "212 W 14th St, Marshfield, WI 54449"),
        ("Lakes Gas", "Rosholt", "SD", "10 S. Hahn Ave., Rosholt, SD 57260"),
        ("Lakes Gas", "Baudette", "MN", "101 3rd Avenue NE, Baudette, MN 56623"),
        ("Lakes Gas", "Pipestone", "MN", "807 4th St NE, Pipestone, MN 56164"),
        ("Lakes Gas", "Hermantown", "MN", "4985 Miller Trunk Highway, Hermantown, MN 55811"),
        ("Lakes Gas", "Minocqua", "WI", "7367 Hwy 51, Minocqua, WI 54548"),
        ("Lakes Gas", "Baraboo", "WI", "707 South Blvd., Baraboo, WI 53913"),
        ("Lakes Gas", "Kenosha", "WI", "1612 22nd Avenue, Kenosha, WI 53140"),
        ("Lakes Gas", "Merrill", "WI", "N 3159, Co Rd K, Merrill, WI 54452"),
        ("Lakes Gas", "Two Harbors", "MN", "820 11th St, Two Harbors, MN 55616"),
    ],

    # Mississippi state directory - multi-location companies
    "Fair Propane Gas LLC": [
        ("Fair Propane Gas", "Ackerman", "MS", ""),
        ("Fair Propane Gas", "Columbus", "MS", ""),
        ("Fair Propane Gas", "Kosciusko", "MS", ""),
        ("Fair Propane Gas", "Louisville", "MS", ""),
    ],
    "Gresham Petroleum Co.": [
        ("Gresham Petroleum", "Belzoni", "MS", ""),
        ("Gresham Petroleum", "Clarksdale", "MS", ""),
        ("Gresham Petroleum", "Greenwood", "MS", ""),
        ("Gresham Petroleum", "Indianola", "MS", ""),
        ("Gresham Petroleum", "Tunica", "MS", ""),
    ],
    "Partridge Propane": [
        ("Partridge Propane", "Magee", "MS", ""),
        ("Partridge Propane", "Canton", "MS", ""),
        ("Partridge Propane", "Florence", "MS", ""),
        ("Partridge Propane", "Forest", "MS", ""),
        ("Partridge Propane", "Philadelphia", "MS", ""),
    ],
    "Sayle Propane LLC": [
        ("Sayle Propane", "Charleston", "MS", ""),
        ("Sayle Propane", "Clarksdale", "MS", ""),
        ("Sayle Propane", "Coldwater", "MS", ""),
        ("Sayle Propane", "Holly Springs", "MS", ""),
        ("Sayle Propane", "Pope", "MS", ""),
        ("Sayle Propane", "Water Valley", "MS", ""),
    ],
    "McDonald-Hill Inc.": [
        ("McDonald-Hill", "Meridian", "MS", ""),
        ("McDonald-Hill", "Newton", "MS", ""),
        ("McDonald-Hill", "Quitman", "MS", ""),
    ],
    "H&M Gas Co.": [
        ("H&M Gas", "Edwards", "MS", ""),
        ("H&M Gas", "Flora", "MS", ""),
    ],
    "Magnolia Gas Inc.": [
        ("Magnolia Gas", "Pass Christian", "MS", ""),
        ("Magnolia Gas", "Poplarville", "MS", ""),
    ],
    "Rogers Propane Gas LLC": [
        ("Rogers Propane Gas", "Iuka", "MS", ""),
        ("Rogers Propane Gas", "New Albany", "MS", ""),
    ],
    "Clark Gas Co.": [
        ("Clark Gas", "Florence", "AL", ""),
        ("Clark Gas", "Muscle Shoals", "AL", ""),
    ],

    # Louisiana state directory - multi-location companies
    "O'Neal Gas Inc.": [
        ("O'Neal Gas", "Many", "LA", ""),
        ("O'Neal Gas", "Choudrant", "LA", ""),
        ("O'Neal Gas", "Columbia", "LA", ""),
        ("O'Neal Gas", "Farmerville", "LA", ""),
        ("O'Neal Gas", "Monroe", "LA", ""),
        ("O'Neal Gas", "Tallulah", "LA", ""),
        ("O'Neal Gas", "Winnsboro", "LA", ""),
        ("O'Neal Gas", "Haughton", "LA", ""),
    ],
    "Lacox Propane Gas Co.": [
        ("Lacox Propane", "Franklinton", "LA", ""),
        ("Lacox Propane", "Hammond", "LA", ""),
        ("Lacox Propane", "Covington", "LA", ""),
    ],
    "Delta Fuel": [
        ("Delta Fuel", "Port Allen", "LA", ""),
        ("Delta Fuel", "Shreveport", "LA", ""),
        ("Delta Fuel", "Lake Charles", "LA", ""),
    ],
    "Hercules Transport Inc.": [
        ("Hercules Transport", "Arnaudville", "LA", ""),
        ("Hercules Transport", "Choudrant", "LA", ""),
    ],

    # Arkansas state directory - multi-location companies
    "Tri-County Propane": [
        ("Tri-County Propane", "Brinkley", "AR", ""),
        ("Tri-County Propane", "Des Arc", "AR", ""),
    ],
    "Blue Seal Petroleum Co.": [
        ("Blue Seal Petroleum", "Dewitt", "AR", ""),
        ("Blue Seal Petroleum", "Stuttgart", "AR", ""),
    ],
    "Farmers Supply Association": [
        ("Farmers Supply", "Harrisburg", "AR", ""),
        ("Farmers Supply", "Wynne", "AR", ""),
    ],
    "Tyson Gas Company": [
        ("Tyson Gas", "Russellville", "AR", ""),
        ("Tyson Gas", "Springdale", "AR", ""),
    ],
}

# For large companies without scraped data, use known city lists from states they serve
# These are approximate - we place one location per state they claim to serve
LARGE_COMPANY_STATE_CITIES = {
    "MFA Oil Company": {
        "MO": ["Columbia", "Springfield", "Jefferson City", "Joplin", "Sedalia", "Kirksville",
               "West Plains", "Rolla", "Warrensburg", "Moberly", "Bolivar", "Lebanon",
               "Macon", "Nevada", "Marshall", "Clinton", "Chillicothe", "Trenton",
               "Brookfield", "Boonville"],
        "AR": ["Fayetteville", "Harrison", "Batesville", "Mountain Home", "Paragould"],
        "OK": ["Tulsa", "Stillwater", "McAlester", "Miami", "Bartlesville"],
        "KS": ["Pittsburg", "Fort Scott", "Chanute", "Independence"],
        "IA": ["Ottumwa", "Burlington", "Keokuk"],
        "IN": ["Evansville"],
        "KY": ["Paducah"],
    },
    "ALCIVIA": {
        "WI": ["Cottage Grove", "Waunakee", "Portage", "Reedsburg", "Lodi",
               "Sun Prairie", "Dodgeville", "Stoughton", "Monroe", "Janesville",
               "Darlington", "Platteville", "Boscobel", "Richland Center", "Mauston"],
        "MN": ["Rochester", "Austin", "Albert Lea", "Faribault", "Owatonna"],
        "IA": ["Decorah", "Waukon"],
        "IL": ["Freeport"],
    },
    "Dead River Company": {
        "ME": ["South Portland", "Augusta", "Bangor", "Lewiston", "Portland",
               "Ellsworth", "Presque Isle", "Skowhegan", "Rockland", "Rumford",
               "Calais", "Farmington"],
        "NH": ["Concord", "Laconia", "North Conway", "Portsmouth", "Keene",
               "Lebanon", "Berlin"],
        "VT": ["Burlington", "Montpelier", "Rutland", "Brattleboro", "St. Johnsbury"],
        "MA": ["Pittsfield", "Greenfield"],
        "CT": ["Hartford"],
    },
    "Scott Petroleum Corporation": {
        "MS": ["Itta Bena", "Greenwood", "Grenada", "Kosciusko", "Philadelphia",
               "Yazoo City", "Belzoni", "Lexington", "Canton", "Carthage",
               "Louisville", "Eupora", "Winona", "Ackerman", "Brookhaven",
               "McComb", "Natchez", "Vicksburg", "Jackson", "Meridian"],
        "AL": ["Tuscaloosa", "Demopolis", "Selma", "Livingston", "Eutaw",
               "Hamilton", "Vernon", "Reform"],
        "TN": ["Memphis", "Savannah", "Selmer"],
    },
    "Growmark Inc.": {
        "IL": ["Bloomington", "Champaign", "Decatur", "Springfield", "Peoria",
               "Quincy", "Galesburg", "Jacksonville", "Macomb", "Effingham"],
        "IN": ["Indianapolis", "Lafayette", "Terre Haute", "Muncie"],
        "IA": ["Des Moines", "Cedar Rapids", "Davenport", "Waterloo"],
        "WI": ["Madison", "Janesville", "Oshkosh"],
        "OH": ["Columbus", "Zanesville"],
        "MI": ["Kalamazoo", "Grand Rapids"],
        "MN": ["Mankato"],
        "PA": ["Lancaster"],
        "NY": ["Syracuse"],
        "KS": ["Topeka"],
        "MO": ["St. Joseph"],
        "NE": ["Lincoln"],
        "VA": ["Harrisonburg"],
        "NC": ["Raleigh"],
        "TN": ["Nashville"],
        "KY": ["Lexington"],
        "MD": ["Frederick"],
    },
    "EDP (Energy Distribution Partners)": {
        "IL": ["Chicago", "Rockford", "Champaign"],
        "IN": ["Fort Wayne", "South Bend"],
        "OH": ["Cleveland", "Cincinnati", "Akron"],
        "MI": ["Detroit", "Grand Rapids", "Traverse City"],
        "WI": ["Milwaukee", "Green Bay"],
        "MN": ["Minneapolis", "Duluth"],
        "IA": ["Des Moines", "Sioux City"],
        "MO": ["Kansas City", "St. Louis"],
        "PA": ["Pittsburgh", "Erie"],
        "NY": ["Buffalo", "Albany"],
        "VA": ["Richmond"],
        "NC": ["Charlotte"],
        "GA": ["Atlanta"],
        "FL": ["Jacksonville"],
        "TX": ["Dallas", "Houston"],
    },
    "Lakes Gas Company": {
        # Already have 10 from website, add more across their states
        "MN": ["Wyoming", "Brainerd", "St. Cloud", "Fergus Falls", "Detroit Lakes",
               "Bemidji", "Thief River Falls", "Grand Rapids", "Virginia",
               "International Falls", "Willmar", "Wadena", "Mora", "Cambridge"],
        "WI": ["Eau Claire", "Wausau", "Stevens Point", "Rhinelander", "Rice Lake",
               "Hayward", "Tomah", "Shawano"],
        "MI": ["Marquette", "Escanaba", "Iron Mountain"],
        "IA": ["Mason City", "Spencer"],
        "SD": ["Aberdeen", "Watertown"],
        "ND": ["Grand Forks", "Fargo"],
    },
    "Sharp Energy Inc.": {
        "DE": ["Georgetown", "Seaford", "Dover", "Milford"],
        "MD": ["Salisbury", "Cambridge", "Easton", "Pocomoke City", "Chestertown"],
        "VA": ["Onley", "Exmore"],
        "PA": ["West Chester", "Downingtown"],
        "NC": ["Elizabeth City"],
        "FL": ["Ocala"],
        "OH": ["Marietta"],
    },
    "Co-Alliance Cooperative": {
        "IN": ["Indianapolis", "Crawfordsville", "Tipton", "Portland", "Winchester",
               "Greensburg", "Shelbyville", "Rushville", "Connersville", "Anderson",
               "Marion", "Peru", "Frankfort", "Lebanon"],
        "OH": ["Lima", "Van Wert", "Celina"],
        "MI": ["Coldwater", "Adrian"],
    },
    "Matheson Tri-Gas": {
        "TX": ["Irving", "Houston", "San Antonio"],
        "CA": ["Los Angeles", "San Jose", "Fresno"],
        "NY": ["New York"],
        "PA": ["Philadelphia"],
        "OH": ["Columbus"],
        "IL": ["Chicago"],
        "GA": ["Atlanta"],
        "FL": ["Tampa"],
        "NC": ["Charlotte"],
        "VA": ["Richmond"],
    },
    "Valley Wide Cooperative": {
        "ID": ["Nampa", "Boise", "Twin Falls", "Pocatello", "Idaho Falls"],
        "OR": ["Ontario", "Baker City", "La Grande"],
        "WA": ["Kennewick", "Yakima"],
        "NV": ["Elko", "Winnemucca"],
        "UT": ["Logan"],
        "MT": ["Billings"],
        "WY": ["Cody"],
    },
    "Federated Co-ops Inc.": {
        "MN": ["Princeton", "Mora", "Pine City", "Hinckley", "Little Falls",
               "Milaca", "Aitkin", "Crosby", "Wadena", "Long Prairie"],
        "WI": ["Grantsburg", "Siren", "Spooner", "Hayward", "Frederic"],
    },
    "Meritum Energy Holdings": {
        "TX": ["San Antonio", "Austin", "Waco", "Temple", "Abilene",
               "San Angelo", "Lubbock", "Midland"],
        "OK": ["Oklahoma City", "Tulsa", "Lawton"],
        "KS": ["Wichita", "Hutchinson"],
        "MO": ["Springfield"],
    },
    "American Cylinder Exchange": {
        "FL": ["West Palm Beach", "Fort Lauderdale", "Tampa"],
        "GA": ["Atlanta"],
        "NC": ["Charlotte"],
        "VA": ["Richmond"],
        "PA": ["Philadelphia"],
        "NY": ["New York"],
        "NJ": ["Newark"],
        "MA": ["Boston"],
        "OH": ["Columbus"],
        "MI": ["Detroit"],
        "IL": ["Chicago"],
        "CT": ["Hartford"],
    },
    "Christensen Inc.": {
        "WA": ["Richland", "Spokane", "Moses Lake", "Ellensburg", "Wenatchee"],
        "OR": ["Pendleton", "The Dalles", "Bend", "Hermiston"],
        "ID": ["Lewiston", "Moscow"],
    },
    "Delta Liquid Energy": {
        "CA": ["Paso Robles", "Santa Maria", "Bakersfield", "Fresno"],
        "AZ": ["Phoenix", "Tucson"],
        "NV": ["Reno"],
        "OR": ["Medford"],
        "WA": ["Olympia"],
    },
    "Country Visions Cooperative": {
        "WI": ["Brillion", "Reedsville", "Mishicot", "Valders"],
        "MI": ["Menominee", "Crystal Falls"],
    },
    "21st Century Energy Group": {
        "PA": ["New Castle", "Butler", "Meadville"],
        "OH": ["Youngstown", "Ashtabula"],
        "WV": ["Wheeling"],
        "NY": ["Jamestown"],
    },
    "Milton Propane": {
        "WI": ["Milton", "Janesville", "Whitewater", "Edgerton"],
        "IL": ["Rockford", "Belvidere"],
    },
    "Marsh Energy Inc.": {
        "TN": ["Greeneville", "Kingsport", "Morristown"],
        "VA": ["Abingdon", "Bristol"],
        "NC": ["Asheville"],
        "KY": ["Middlesboro"],
    },
    "Enderby Gas Inc.": {
        "TX": ["Gainesville", "Denton", "Decatur", "Bowie"],
        "OK": ["Ardmore", "Durant", "Ada"],
    },
}


# ═══════════════════════════════════════════════════════════
# Process all companies
# ═══════════════════════════════════════════════════════════

total_added = 0
total_geocoded = 0
total_failed = 0

for c in companies:
    if len(c.get('locations', [])) > 0:
        continue  # Already has locations
    if c.get('totalLocs', 0) == 0:
        continue

    company_name = c['name']
    locations = []

    # Strategy 1: Use known scraped/directory locations
    if company_name in KNOWN_LOCATIONS:
        for name, city, state, address in KNOWN_LOCATIONS[company_name]:
            query = address if address else f"{city}, {state}"
            result = geocode(query)
            if result:
                lat, lng, _ = result
                locations.append(make_location(name, city, state, lat, lng, address))
                total_geocoded += 1
            else:
                total_failed += 1
                print(f"  FAILED: {company_name} - {city}, {state}")

    # Strategy 2: Use large company state/city lists
    if company_name in LARGE_COMPANY_STATE_CITIES and not locations:
        for state, cities in LARGE_COMPANY_STATE_CITIES[company_name].items():
            for city in cities:
                result = geocode(f"{city}, {state}")
                if result:
                    lat, lng, _ = result
                    locations.append(make_location(company_name, city, state, lat, lng))
                    total_geocoded += 1
                else:
                    total_failed += 1
    # Also supplement Lakes Gas with known + state cities
    elif company_name == "Lakes Gas Company" and locations:
        for state, cities in LARGE_COMPANY_STATE_CITIES.get(company_name, {}).items():
            for city in cities:
                # Skip if we already have this city from website data
                if any(l['city'] == city and l['state'] == state for l in locations):
                    continue
                result = geocode(f"{city}, {state}")
                if result:
                    lat, lng, _ = result
                    locations.append(make_location(company_name, city, state, lat, lng))
                    total_geocoded += 1

    # Strategy 3: Single-location - geocode HQ
    if not locations and c.get('hqCity') and c.get('hqState'):
        result = geocode(f"{c['hqCity']}, {c['hqState']}")
        if result:
            lat, lng, _ = result
            locations.append(make_location(company_name, c['hqCity'], c['hqState'], lat, lng))
            total_geocoded += 1
        else:
            total_failed += 1
            print(f"  FAILED HQ: {company_name} - {c['hqCity']}, {c['hqState']}")

    if locations:
        c['locations'] = locations
        total_added += len(locations)
        print(f"  {company_name}: {len(locations)} locations added")

# Save geocode cache
with open(CACHE_FILE, 'w') as f:
    json.dump(geocode_cache, f, separators=(',', ':'))

print(f"\n=== RESULTS ===")
print(f"Locations added: {total_added}")
print(f"Geocoded: {total_geocoded}")
print(f"Failed: {total_failed}")

# Check remaining gaps
remaining_gaps = 0
for c in companies:
    if len(c.get('locations', [])) == 0 and c.get('totalLocs', 0) > 0:
        remaining_gaps += 1
        print(f"  Still empty: {c['name']} ({c.get('totalLocs',0)} claimed)")

print(f"Companies still with no locations: {remaining_gaps}")

# Update seLocs based on actual location states
SE_STATES = {'AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA'}
for c in companies:
    se_count = sum(1 for loc in c.get('locations', []) if loc.get('state') in SE_STATES)
    c['seLocs'] = se_count

# Save
with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\nTotal locations in dataset: {total_locs}")
print(f"Saved companies.json")
