"""
Sweep OpenStreetMap via Overpass API for propane businesses across the US.
Queries state-by-state to avoid timeouts.
"""
import json
import os
import time
import urllib.request
import urllib.parse

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'
OUTPUT = os.path.join(DATA_DIR, 'osm_propane.json')

STATES = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
    'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
    'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
    'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR',
    'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
    'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC',
}

all_elements = []
state_counts = {}

for state_name, abbrev in sorted(STATES.items()):
    query = f'''
[out:json][timeout:60];
area["name"="{state_name}"]["admin_level"="4"]["boundary"="administrative"]->.searchArea;
(
  node["fuel:lpg"="yes"](area.searchArea);
  node["name"~"[Pp]ropane"](area.searchArea);
  way["name"~"[Pp]ropane"]["building"](area.searchArea);
);
out body;
'''

    url = 'https://overpass-api.de/api/interpreter'
    data = urllib.parse.urlencode({'data': query}).encode()
    req = urllib.request.Request(url, data=data, headers={'User-Agent': 'PropaneMarketMap/1.0'})

    try:
        resp = urllib.request.urlopen(req, timeout=90)
        result = json.loads(resp.read().decode())
        elements = result.get('elements', [])
        all_elements.extend(elements)
        state_counts[abbrev] = len(elements)
        print(f"  {abbrev} ({state_name}): {len(elements)} propane elements")
    except Exception as e:
        print(f"  {abbrev} ({state_name}): ERROR - {e}")
        state_counts[abbrev] = -1

    time.sleep(2)  # Rate limit

# Extract unique company names with locations
businesses = []
seen = set()
for el in all_elements:
    tags = el.get('tags', {})
    name = tags.get('name', '')
    if not name:
        continue

    lat = el.get('lat')
    lon = el.get('lon')
    if not lat or not lon:
        # For ways, skip if no centroid
        continue

    # Skip generic gas station names
    skip_names = {'shell', 'bp', 'exxon', 'chevron', 'marathon', 'speedway',
                  'circle k', 'casey', "sam's club", 'costco', 'walmart',
                  'u-haul', 'ace hardware', 'tractor supply', 'home depot', 'lowes'}
    if name.lower() in skip_names:
        continue

    key = f"{name}|{round(lat,3)}|{round(lon,3)}"
    if key in seen:
        continue
    seen.add(key)

    city = tags.get('addr:city', '')
    state = tags.get('addr:state', '')
    street = tags.get('addr:street', '')
    housenumber = tags.get('addr:housenumber', '')
    postcode = tags.get('addr:postcode', '')

    address = ''
    if housenumber and street:
        address = f"{housenumber} {street}"
        if city:
            address += f", {city}"
        if state:
            address += f", {state}"
        if postcode:
            address += f" {postcode}"

    businesses.append({
        'name': name,
        'city': city,
        'state': state,
        'lat': round(lat, 4),
        'lng': round(lon, 4),
        'address': address,
        'tags': {k: v for k, v in tags.items() if k in ['name', 'amenity', 'shop', 'fuel:lpg',
                                                          'phone', 'website', 'opening_hours',
                                                          'operator', 'brand']}
    })

# Deduplicate by normalized name
from collections import defaultdict
import re

def norm_name(n):
    n = n.lower().strip()
    n = re.sub(r'[^a-z0-9 ]', '', n)
    return n

name_groups = defaultdict(list)
for b in businesses:
    name_groups[norm_name(b['name'])].append(b)

# Save results
with open(OUTPUT, 'w') as f:
    json.dump(businesses, f, indent=2)

print(f"\n=== RESULTS ===")
print(f"Total OSM elements: {len(all_elements)}")
print(f"Unique business locations: {len(businesses)}")
print(f"Unique company names: {len(name_groups)}")
print(f"\nBy state (top 20):")
for st, count in sorted(state_counts.items(), key=lambda x: x[1], reverse=True)[:20]:
    print(f"  {st}: {count}")

# Show company names
print(f"\n=== PROPANE COMPANY NAMES ({len(name_groups)} unique) ===")
for name in sorted(name_groups.keys()):
    locs = name_groups[name]
    if len(locs) > 1:
        print(f"  {locs[0]['name']} ({len(locs)} locations)")
    else:
        print(f"  {locs[0]['name']}")
