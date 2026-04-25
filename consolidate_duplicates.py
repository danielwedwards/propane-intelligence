"""
Consolidate duplicate company records.
Strategy: merge smaller/sub-records into the larger primary record.
Dedupe locations by (address, city, state).
"""
import json
import os
import re

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

SE = {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'}

def loc_key(l):
    return (
        (l.get('address') or '').strip().lower(),
        (l.get('city') or '').strip().lower(),
        (l.get('state') or '').strip().upper(),
    )

# Map: primary_id -> list of dup_ids to merge
MERGES = {
    # Big ones
    'thompson_gas': ['thompsongas'],  # Both are ThompsonGas - merge thompsongas -> thompson_gas
    'blossman_gas': ['blossman_propane'],
    "oneal_gas_inc": ['o_neal_gas', 'o_nealgas_inc', 'o_nealgas_inc_ar'],
    'sayle_oil': ['sayle_propane_llc'],
    'palmetto': ['palmetto_gas'],
    'superior_gas': ['superior_propane_gas_company_inc', 'superior_propane_inc', 'superior_propane', 'superior_fuel_company'],
    'lettermen_s_energy': ['lettermens_propane'],
    'battle_lp_gas_company': ['battle_oil_company'],
    'appalachian_propane': ['appalachian_energy', 'appalachian_propane_gas'],
    'blue_flame_gas_company': ['blue_flame', 'blue_flame_gas', 'blue_flame_inc', 'blue_flame_propane', 'blue_flame_gas_company_inc'],
    'bumgarner_oil_company': ['bumgarner_propane'],
    'coombs_gas_co_': ['coombs_gas_co'],
    'h___m_gas_co': ['hm_gas_co'],
    'island_energy': ['island_energy_inc', 'island_energy_propane_gas_mo'],
    'marsh_propane': ['marsh_energy_inc'],
    'mc_donald___hill_inc': ['mcdonaldhill_inc'],
    'parker_gas': ['parker_oil_company'],
    'reed_oil': ['reed_propane', 'reed_inc'],
    'town___country_gas': ['town_country_fuel'],
    'acree_propane_inc': ['acree_propane_inc_tn'],
    'alliance_propane___petro__llc': ['alliance_propane_petro'],
    'blue_ridge_energy': ['blue_ridge_propane_inc'],
    'carolina_propane_gas_co': ['carolina_gas_co'],
    'centergas_fuels__inc': ['centergas_fuels'],
    'coastal_energy': ['coastal_energy_nc'],
    'consolidated_energy': ['consolidated_energy_company', 'consolidated_oil___propane_llc'],
    'craft_propane_inc': ['craft_propane_inc_mo'],
    'ferguson_gas': ['ferguson_lp_gas'],
    'freedom_propane': ['freedom_lp'],
    'georgia_energy': ['georgia_energy_propane', 'georgia_energy_propane_gas'],
    'industrial_propane_gas_inc': ['industrial_propane'],
    'liberty_oil___propane_company': ['liberty_propane', 'liberty_propane_company'],
    'mallard_lp_gas_co': ['mallard_oil___lp_gas_co_'],
    'modern_gas_propane_company': ['modern_propane'],
    'quality_oil_company': ['quality_propane'],
    'reliable_propane_llc': ['reliable_propane_corporation'],
    'river_valley_oil___propane': ['river_valley_energy'],
    'shawson_gas__llc': ['shawson_gas_llc'],
    'spring_river_lp_gas': ['spring_river_lp_gas_mo'],
}

# Build company lookup
by_id = {c['id']: c for c in companies}
to_remove = set()

total_merged = 0
total_locs_added = 0

for primary_id, dup_ids in MERGES.items():
    if primary_id not in by_id:
        print(f"SKIP: primary {primary_id} not found")
        continue
    primary = by_id[primary_id]
    existing_keys = {loc_key(l) for l in primary.get('locations', [])}
    merged_locs = 0
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
            merged_locs += 1
        to_remove.add(dup_id)
    if merged_locs > 0:
        print(f"  {primary['name']}: +{merged_locs} merged")
        total_merged += 1
        total_locs_added += merged_locs
    primary['states'] = sorted({l['state'] for l in primary['locations'] if l.get('state')})
    primary['seLocs'] = sum(1 for l in primary['locations'] if l.get('state') in SE)
    primary['totalLocs'] = len(primary['locations'])

# Remove merged duplicates
companies = [c for c in companies if c['id'] not in to_remove]

print(f"\nTotal groups merged: {total_merged}")
print(f"Total locations deduplicated: {total_locs_added}")
print(f"Total records removed: {len(to_remove)}")

with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))

total_locs = sum(len(c.get('locations', [])) for c in companies)
print(f"\n=== DATASET ===")
print(f"Companies: {len(companies)}")
print(f"Locations: {total_locs}")
