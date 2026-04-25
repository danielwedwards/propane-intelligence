"""
Consolidate duplicate company records — V2, state-aware.
Only merge records that share the same hqState AND normalize to the same name.
This prevents false-positive merges (e.g., Valley Propane in GA vs MT vs TX).
"""
import json
import os
from collections import defaultdict

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

def normalize(name):
    n = name.lower()
    for s in ['inc', 'llc', 'lp', 'corporation', 'company', 'propane', 'gas', 'energy', 'fuel', 'oil', 'service', 'services', 'lpg', ' corp', ' ltd']:
        n = n.replace(s, '')
    return ''.join(c for c in n if c.isalnum())

def loc_key(l):
    return (
        (l.get('address') or '').strip().lower(),
        (l.get('city') or '').strip().lower(),
        (l.get('state') or '').strip().upper(),
    )

# Group by (normalized_name, hqState)
groups = defaultdict(list)
for c in companies:
    nm = normalize(c['name'])
    if len(nm) < 5:  # avoid trivial matches
        continue
    st = (c.get('hqState') or '').upper()
    groups[(nm, st)].append(c)

# Also consider groups where normalized names match AND the smaller record has
# all its locations in the same state as the larger record's hqState
groups_by_name = defaultdict(list)
for c in companies:
    nm = normalize(c['name'])
    if len(nm) < 5:
        continue
    groups_by_name[nm].append(c)

# Primary merges: same normalized name, same hqState
to_remove = set()
total_merged = 0
total_locs_merged = 0

for (nm, st), group in groups.items():
    if len(group) < 2:
        continue
    # Pick primary = most locations, tie-break by shortest id (likely original)
    group.sort(key=lambda c: (-len(c.get('locations', [])), len(c['id'])))
    primary = group[0]
    existing_keys = {loc_key(l) for l in primary.get('locations', [])}
    merged = 0
    for dup in group[1:]:
        if dup['id'] in to_remove:
            continue
        for l in dup.get('locations', []):
            k = loc_key(l)
            if k in existing_keys:
                continue
            existing_keys.add(k)
            primary['locations'].append(l)
            merged += 1
        to_remove.add(dup['id'])
    if merged > 0 or len(group) > 1:
        print(f"  [{st}] {primary['name']}: +{merged} ({len(group)-1} dups merged)")
        total_merged += 1
        total_locs_merged += merged
    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])

# Secondary pass: cross-state duplicates where secondary is single-location
# and its one location's state matches primary's state
print("\n--- Cross-state single-location dups ---")
for nm, group in groups_by_name.items():
    if len(group) < 2:
        continue
    # Find biggest primary not already processed
    group = [c for c in group if c['id'] not in to_remove]
    if len(group) < 2:
        continue
    group.sort(key=lambda c: -len(c.get('locations', [])))
    primary = group[0]
    primary_states = set(primary.get('states', []))
    for dup in group[1:]:
        if dup['id'] in to_remove:
            continue
        # Only merge if dup is single-location and that location is in primary's state coverage
        dup_locs = dup.get('locations', [])
        if len(dup_locs) != 1:
            continue
        dup_state = (dup_locs[0].get('state') or '').upper()
        if dup_state and dup_state in primary_states:
            # Check dup location not already in primary
            existing_keys = {loc_key(l) for l in primary.get('locations', [])}
            k = loc_key(dup_locs[0])
            if k not in existing_keys:
                primary['locations'].append(dup_locs[0])
                total_locs_merged += 1
            to_remove.add(dup['id'])
            print(f"  [{dup_state}] merged '{dup['name']}' -> '{primary['name']}'")
            total_merged += 1
    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])

# Remove merged
companies = [c for c in companies if c['id'] not in to_remove]

print(f"\n=== SUMMARY ===")
print(f"Groups merged: {total_merged}")
print(f"Locations merged: {total_locs_merged}")
print(f"Records removed: {len(to_remove)}")

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
