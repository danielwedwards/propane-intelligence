"""
Geocode locations that are missing lat/lng using Nominatim.
Uses street+city+state when available, falls back to city+state.
"""
import json
import os
import time
import urllib.request
import urllib.parse

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

STATE_BOXES = {
    'AL': (30.22, 35.01, -88.47, -84.89), 'AR': (33.00, 36.50, -94.62, -89.64),
    'AZ': (31.33, 37.01, -114.82, -109.05), 'CA': (32.53, 42.01, -124.41, -114.13),
    'CO': (36.99, 41.00, -109.06, -102.04), 'CT': (40.95, 42.05, -73.73, -71.79),
    'DE': (38.45, 39.84, -75.79, -75.05), 'FL': (24.52, 31.00, -87.63, -80.03),
    'GA': (30.36, 35.00, -85.61, -80.84), 'IA': (40.38, 43.50, -96.64, -90.14),
    'ID': (41.99, 49.00, -117.24, -111.04), 'IL': (36.97, 42.51, -91.51, -87.02),
    'IN': (37.77, 41.76, -88.10, -84.78), 'KS': (36.99, 40.00, -102.05, -94.59),
    'KY': (36.50, 39.15, -89.57, -81.97), 'LA': (28.93, 33.02, -94.04, -88.76),
    'MA': (41.24, 42.89, -73.51, -69.93), 'MD': (37.89, 39.72, -79.49, -75.05),
    'ME': (43.06, 47.46, -71.08, -66.95), 'MI': (41.70, 48.30, -90.42, -82.12),
    'MN': (43.50, 49.38, -97.24, -89.49), 'MO': (35.99, 40.61, -95.77, -89.10),
    'MS': (30.17, 34.99, -91.66, -88.10), 'MT': (44.36, 49.00, -116.05, -104.03),
    'NC': (33.84, 36.59, -84.32, -75.46), 'ND': (45.94, 49.00, -104.05, -96.55),
    'NE': (39.99, 43.00, -104.05, -95.31), 'NH': (42.70, 45.31, -72.56, -70.61),
    'NJ': (38.93, 41.36, -75.56, -73.89), 'NM': (31.33, 37.00, -109.05, -103.00),
    'NV': (35.00, 42.00, -120.01, -114.04), 'NY': (40.48, 45.02, -79.76, -71.85),
    'OH': (38.40, 41.98, -84.82, -80.52), 'OK': (33.62, 37.00, -103.00, -94.43),
    'OR': (41.99, 46.30, -124.57, -116.46), 'PA': (39.72, 42.27, -80.52, -74.69),
    'RI': (41.15, 42.02, -71.87, -71.12), 'SC': (32.03, 35.22, -83.35, -78.54),
    'SD': (42.48, 45.94, -104.06, -96.44), 'TN': (34.98, 36.68, -90.31, -81.65),
    'TX': (25.84, 36.50, -106.65, -93.51), 'UT': (36.99, 42.00, -114.05, -109.04),
    'VA': (36.54, 39.47, -83.68, -75.24), 'VT': (42.73, 45.02, -73.44, -71.46),
    'WA': (45.54, 49.00, -124.73, -116.92), 'WI': (42.49, 47.08, -92.89, -86.80),
    'WV': (37.20, 40.64, -82.64, -77.72), 'WY': (40.99, 45.01, -111.05, -104.05),
}

def in_state(lat, lng, st):
    if st not in STATE_BOXES:
        return True
    s, n, w, e = STATE_BOXES[st]
    return s <= lat <= n and w <= lng <= e

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

with open(os.path.join(DATA_DIR, 'geocode_cache.json')) as f:
    cache = json.load(f)

def geocode(query):
    if query in cache:
        v = cache[query]
        if v is None:
            return None
        if len(v) >= 2:
            return (float(v[0]), float(v[1]))
        return None
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({
        'q': query, 'format': 'json', 'limit': 1, 'countrycodes': 'us'
    })
    req = urllib.request.Request(url, headers={'User-Agent': 'PropaneMarketMap/1.0'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
        if data:
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            cache[query] = [lat, lon, data[0].get('display_name', '')]
            time.sleep(1.2)
            return (lat, lon)
    except Exception:
        pass
    cache[query] = None
    time.sleep(1.2)
    return None

to_fix = []
for c in companies:
    for l in c.get('locations', []):
        lat = l.get('lat')
        lng = l.get('lng')
        if lat is None or lng is None or (lat == 0 and lng == 0):
            to_fix.append(l)

print(f"Locations to geocode: {len(to_fix)}")

fixed_street = 0
fixed_city = 0
failed = 0
processed = 0

for l in to_fix:
    processed += 1
    st = (l.get('state') or '').upper()
    city = (l.get('city') or '').strip()
    street = (l.get('address') or '').strip()
    if not st:
        failed += 1
        continue
    lat = None
    lng = None
    # Try street first
    if street and city:
        q = f"{street}, {city}, {st}"
        r = geocode(q)
        if r and in_state(r[0], r[1], st):
            lat, lng = r
            fixed_street += 1
    # Fall back to city
    if lat is None and city:
        q = f"{city}, {st}"
        r = geocode(q)
        if r and in_state(r[0], r[1], st):
            lat, lng = r
            fixed_city += 1
    if lat is not None:
        l['lat'] = round(lat, 6)
        l['lng'] = round(lng, 6)
    else:
        failed += 1
    if processed % 20 == 0:
        print(f"  Progress: {processed}/{len(to_fix)} - street:{fixed_street} city:{fixed_city} failed:{failed}")

print(f"\nResults: street={fixed_street}, city={fixed_city}, failed={failed}")

with open(os.path.join(DATA_DIR, 'geocode_cache.json'), 'w') as f:
    json.dump(cache, f, separators=(',', ':'))

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

# Final check
missing = sum(1 for c in companies for l in c.get('locations', [])
              if l.get('lat') is None or l.get('lng') is None or (l.get('lat') == 0 and l.get('lng') == 0))
total = sum(len(c.get('locations', [])) for c in companies)
print(f"\nFinal: {total - missing}/{total} locations have lat/lng ({100*(total-missing)/total:.1f}%)")
