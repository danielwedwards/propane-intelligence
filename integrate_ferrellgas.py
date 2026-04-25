"""
Integrate Ferrellgas deep scrape (664 locations) into the existing
Ferrellgas company record, deduping by (street, city, state).
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

with open(os.path.join(DATA_DIR, 'deep_scrape_ferrellgas.json')) as f:
    scrape = json.load(f)

ferrell = None
for c in companies:
    if c['id'] == 'ferrellgas':
        ferrell = c
        break

if ferrell is None:
    print("ERROR: Ferrellgas company not found")
    exit(1)

print(f"Ferrellgas existing locations: {len(ferrell.get('locations', []))}")

# Build dedup keys for existing locations
def key(loc):
    return (
        (loc.get('address', '') or '').strip().lower(),
        (loc.get('city', '') or '').strip().lower(),
        (loc.get('state', '') or '').strip().upper(),
    )

existing_keys = {key(l) for l in ferrell.get('locations', [])}

added = 0
skipped = 0
new_locations = []

for loc in scrape.get('locations', []):
    nk = (
        (loc.get('street', '') or '').strip().lower(),
        (loc.get('city', '') or '').strip().lower(),
        (loc.get('state', '') or '').strip().upper(),
    )
    if nk in existing_keys:
        skipped += 1
        continue
    # Also check by (city, state) for city-only existing entries
    city_key = ('', nk[1], nk[2])
    if city_key in existing_keys:
        # We have a city-only entry; replace with precise
        # but keep both for now
        pass
    existing_keys.add(nk)
    new_locations.append({
        'name': loc.get('name', 'Ferrellgas'),
        'city': loc.get('city', ''),
        'state': loc.get('state', ''),
        'county': '',
        'lat': round(float(loc.get('lat', 0)), 6),
        'lng': round(float(loc.get('lng', 0)), 6),
        'address': loc.get('street', ''),
        'zip': loc.get('zip', ''),
        'phone': loc.get('phone', ''),
        'source': 'ferrellgas_sitemap',
        'store_id': loc.get('store_id', ''),
    })
    added += 1

# Remove city-only duplicates where we now have a precise entry
precise_cities = {(l['city'].strip().lower(), l['state'].strip().upper()) for l in new_locations if l.get('address')}
kept_existing = []
removed = 0
for l in ferrell.get('locations', []):
    if not l.get('address') and (l.get('city','').strip().lower(), l.get('state','').strip().upper()) in precise_cities:
        removed += 1
        continue
    kept_existing.append(l)

ferrell['locations'] = kept_existing + new_locations

# Update states, seLocs, totalLocs
SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}
ferrell['states'] = sorted({l['state'] for l in ferrell['locations'] if l.get('state')})
ferrell['seLocs'] = sum(1 for l in ferrell['locations'] if l.get('state') in SE)
ferrell['totalLocs'] = len(ferrell['locations'])

print(f"Added: {added}")
print(f"Skipped (existing precise): {skipped}")
print(f"Removed (city-only replaced by precise): {removed}")
print(f"Ferrellgas final locations: {len(ferrell['locations'])}")
print(f"States covered: {len(ferrell['states'])}")

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
