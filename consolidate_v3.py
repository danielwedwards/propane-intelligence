"""
V3 consolidation: major M&A target consolidation.
- MFA Oil: 3 records -> 1
- Pinnacle Propane: 22 records -> 1
- Co-Alliance + Ceres Solutions -> Keystone Cooperative (they merged March 2024)
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

def loc_key(l):
    return ((l.get('address') or '').strip().lower(),
            (l.get('city') or '').strip().lower(),
            (l.get('state') or '').strip().upper())

by_id = {c['id']: c for c in companies}

CONSOLIDATIONS = [
    # (primary_id, dup_ids, new_parent_group, new_name)
    ('mfa_oil_company', ['mfa_oil', 'mfa_oil_propane'], 'MFA Oil Company', 'MFA Oil Company'),
    ('pinnacle_propane', [
        'pinnacle_propane_express', 'alliant_gas_powered_by_pinnacle_propane',
        'pinnacle_bulk_propane', 'pinnacle_propane_alamogordo', 'pinnacle_propane_clovis',
        'pinnacle_propane_carlsbad', 'pinnacle_propane_ruidoso_downs',
        'pinnacle_propane_silver_city', 'pinnacle_propane_tucumcari',
        'pinnacle_propane_truth_or_consequences', 'pinnacle_propane_socorro',
        'pinnacle_propane_santa_rosa', 'pinnacle_propane_moriarty',
        'pinnacle_propane_clayton', 'pinnacle_propane_reserve', 'pinnacle_propane_quemado',
        'pinnacle_propane_page', 'pinnacle_propane_payson', 'pinnacle_rental_centers',
        'heetco_pinnacle_propane_affiliate',
    ], 'Pinnacle Propane', 'Pinnacle Propane'),
]

to_remove = set()
for primary_id, dup_ids, parent_group, new_name in CONSOLIDATIONS:
    if primary_id not in by_id:
        print(f"SKIP: {primary_id}")
        continue
    primary = by_id[primary_id]
    print(f"\n=== {primary['name']} ===")
    print(f"  Starting: {len(primary.get('locations', []))}")
    existing_keys = {loc_key(l) for l in primary.get('locations', [])}
    added = 0
    for dup_id in dup_ids:
        if dup_id not in by_id:
            continue
        dup = by_id[dup_id]
        for l in dup.get('locations', []):
            k = loc_key(l)
            if k in existing_keys:
                continue
            existing_keys.add(k)
            primary['locations'].append(l)
            added += 1
        to_remove.add(dup_id)
    primary['parentGroup'] = parent_group
    primary['name'] = new_name
    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])
    print(f"  Added: {added}, dups removed: {len(dup_ids)}, final: {len(primary['locations'])}")

# Co-Alliance + Ceres Solutions merger (March 2024 -> Keystone Cooperative)
# First, check if Keystone Cooperative exists
keystone = None
for c in companies:
    if 'keystone cooperative' in c['name'].lower() or c['id'] == 'keystone_cooperative':
        keystone = c
        break

coalliance = by_id.get('coalliance_cooperative')
coallianceprop = by_id.get('co_alliance_propane')
ceres = by_id.get('ceres_solutions')

if keystone and (coalliance or coallianceprop or ceres):
    print(f"\n=== Keystone Cooperative (Co-Alliance + Ceres merger) ===")
    print(f"  Existing: {len(keystone.get('locations', []))}")
    existing_keys = {loc_key(l) for l in keystone.get('locations', [])}
    added = 0
    for dup in [coalliance, coallianceprop, ceres]:
        if dup is None or dup['id'] == keystone['id']:
            continue
        for l in dup.get('locations', []):
            k = loc_key(l)
            if k in existing_keys:
                continue
            existing_keys.add(k)
            keystone['locations'].append(l)
            added += 1
        to_remove.add(dup['id'])
    keystone['description'] = "Keystone Cooperative is a Fortune 100 ag cooperative formed by the March 2024 merger of Co-Alliance LLP and Ceres Solutions LLP. ~$3.1B revenue, 195 locations, 20,000 member-owners across IN/OH/MI."
    keystone['states'] = sorted({l['state'] for l in keystone['locations'] if l.get('state')})
    keystone['seLocs'] = sum(1 for l in keystone['locations'] if l.get('state') in SE)
    keystone['totalLocs'] = len(keystone['locations'])
    keystone['estRevenue'] = 3100
    keystone['lastAcquisition'] = '2024-03 Co-Alliance + Ceres Solutions merger'
    print(f"  Added: {added}, final: {len(keystone['locations'])}")
elif not keystone and (coalliance or coallianceprop or ceres):
    # Create Keystone Cooperative as new record from the two sub-records
    print(f"\n=== Creating Keystone Cooperative (Co-Alliance + Ceres merger) ===")
    primary = coalliance or coallianceprop or ceres
    primary['id'] = 'keystone_cooperative'
    primary['name'] = 'Keystone Cooperative'
    primary['parentGroup'] = 'Keystone Cooperative'
    existing_keys = {loc_key(l) for l in primary.get('locations', [])}
    added = 0
    for dup in [coalliance, coallianceprop, ceres]:
        if dup is None or dup['id'] == primary['id']:
            continue
        for l in dup.get('locations', []):
            k = loc_key(l)
            if k in existing_keys:
                continue
            existing_keys.add(k)
            primary['locations'].append(l)
            added += 1
        to_remove.add(dup['id'])
    primary['description'] = "Keystone Cooperative is a Fortune 100 ag cooperative formed by the March 2024 merger of Co-Alliance LLP and Ceres Solutions LLP. ~$3.1B revenue, 195 locations, 20,000 member-owners across IN/OH/MI."
    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])
    primary['estRevenue'] = 3100
    primary['ownership'] = 'coop'
    primary['lastAcquisition'] = '2024-03 Co-Alliance + Ceres Solutions merger'
    print(f"  Kept primary: {primary['name']}, final: {len(primary['locations'])}")

# Growmark Inc - check if we need to scope this down
growmark = by_id.get('growmark_inc')
if growmark:
    # Note: Growmark is a parent co-op; actual member coops are tracked separately
    # Keep as-is but update description
    growmark['description'] = "Growmark Inc. is a Fortune 100 regional agricultural cooperative (parent of the FS System) with ~$8.9B revenue and 100+ member cooperatives operating thousands of locations across the Midwest and Canada. Member FS coops sell propane alongside grain/feed/crop input services."
    growmark['estRevenue'] = 8900

companies = [c for c in companies if c['id'] not in to_remove]

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
print(f"Records removed: {len(to_remove)}")
