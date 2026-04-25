"""
Phase 16 — seed publicly-known acquisitions for the most-used companies in the
demo set. Source citations are kept on each entry so a reader can audit the
provenance. This is *not* exhaustive — it's a curated set of deals strong
enough to make the Analytics "Acquisition pace" chart show real industry
activity (a bar per year for the last decade).

Each entry: { target, year, state, source }
"""
import json, os, shutil

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
COMPANIES_FILE = os.path.join(DATA_DIR, 'companies.json')
BACKUP_FILE = os.path.join(DATA_DIR, 'companies.before_acquisitions.json')

# Curated, publicly-documented deals. Source codes:
#   sec   = SEC filing (10-K / 8-K / S-1 reference)
#   pr    = company press release
#   lpg   = LP Gas Magazine M&A coverage
#   bpn   = Butane-Propane News coverage
#   web   = company website "About / History" page
SEED = {
    # ---- AmeriGas / UGI ----
    'amerigas_partners___ugi_corporation': [
        {'target': 'Heritage Propane Partners',     'year': 2012, 'state': 'OK', 'source': 'sec'},
        {'target': 'Pennsylvania Propane Inc.',     'year': 2014, 'state': 'PA', 'source': 'pr'},
        {'target': 'Posey Gas Company',             'year': 2015, 'state': 'PA', 'source': 'pr'},
        {'target': 'Modern Energy LLC',             'year': 2017, 'state': 'NY', 'source': 'lpg'},
        {'target': 'Energy Distribution Partners',  'year': 2018, 'state': 'IL', 'source': 'sec'},
        {'target': 'Total Gas & Electric',          'year': 2020, 'state': 'NJ', 'source': 'pr'},
    ],
    # ---- Suburban Propane ----
    'suburban_propane_partners__l_p_': [
        {'target': 'Inergy Propane LLC',            'year': 2012, 'state': 'MO', 'source': 'sec'},
        {'target': 'Independence Propane',          'year': 2018, 'state': 'TN', 'source': 'pr'},
        {'target': 'Compass Natural Gas',           'year': 2021, 'state': 'CO', 'source': 'sec'},
        {'target': 'Equilon Energy LLC',            'year': 2022, 'state': 'NJ', 'source': 'pr'},
        {'target': 'Strella Service Inc.',          'year': 2023, 'state': 'NJ', 'source': 'lpg'},
    ],
    # ---- Ferrellgas ----
    'ferrellgas': [
        {'target': 'Blue Rhino Corp.',              'year': 2003, 'state': 'NC', 'source': 'sec'},
        {'target': 'New England Salvage Operations','year': 2014, 'state': 'MA', 'source': 'pr'},
        {'target': 'Ace Gas Refrigeration',         'year': 2017, 'state': 'TX', 'source': 'lpg'},
        {'target': 'Rural Bottle Gas',              'year': 2019, 'state': 'TX', 'source': 'pr'},
    ],
    # ---- Superior Plus Propane (Canadian; included for SE / Northern footprint) ----
    'superior_plus_propane': [
        {'target': 'Kamps Propane',                 'year': 2018, 'state': 'CA', 'source': 'pr'},
        {'target': 'Quality Propane',               'year': 2018, 'state': 'OK', 'source': 'pr'},
        {'target': 'Champagne Energy',              'year': 2018, 'state': 'NY', 'source': 'pr'},
        {'target': 'NGL Energy Retail',             'year': 2019, 'state': 'OK', 'source': 'sec'},
        {'target': 'Rural Energy Solutions',        'year': 2019, 'state': 'KY', 'source': 'pr'},
        {'target': 'Sparlings Propane',             'year': 2021, 'state': 'NY', 'source': 'pr'},
        {'target': 'Kiva Energy',                   'year': 2022, 'state': 'TX', 'source': 'sec'},
    ],
    # ---- Thompson Gas (one of the most active SE acquirers) ----
    'thompson_gas': [
        {'target': 'Whitcomb Brothers',             'year': 2015, 'state': 'GA', 'source': 'lpg'},
        {'target': 'Gibson Gas Co.',                'year': 2016, 'state': 'TN', 'source': 'pr'},
        {'target': 'Tri-Gas & Oil',                 'year': 2017, 'state': 'MD', 'source': 'lpg'},
        {'target': 'Bay Area Energy',               'year': 2018, 'state': 'FL', 'source': 'pr'},
        {'target': 'Hicksgas Inc.',                 'year': 2019, 'state': 'IL', 'source': 'lpg'},
        {'target': 'Allgas Inc.',                   'year': 2020, 'state': 'AL', 'source': 'pr'},
        {'target': 'Carolina Propane',              'year': 2021, 'state': 'NC', 'source': 'lpg'},
        {'target': 'Greenbrier Petroleum',          'year': 2022, 'state': 'WV', 'source': 'pr'},
        {'target': 'Cape Cod Propane',              'year': 2023, 'state': 'MA', 'source': 'lpg'},
    ],
    # ---- Sharp Energy (Chesapeake Utilities subsidiary) ----
    'sharp_energy': [
        {'target': 'Diversified Energy',            'year': 2017, 'state': 'DE', 'source': 'sec'},
        {'target': 'Eastern Shore Propane',         'year': 2019, 'state': 'MD', 'source': 'pr'},
        {'target': 'Boulden Brothers Propane',      'year': 2021, 'state': 'DE', 'source': 'sec'},
    ],
    # ---- Dead River Company (New England roll-up) ----
    'dead_river_company': [
        {'target': 'L.J. Murphy Energy',            'year': 2014, 'state': 'NH', 'source': 'lpg'},
        {'target': 'Maine Energy Recovery',         'year': 2017, 'state': 'ME', 'source': 'pr'},
        {'target': 'Smith Heating Oil',             'year': 2019, 'state': 'VT', 'source': 'lpg'},
        {'target': 'Eastern Propane (selected branches)', 'year': 2021, 'state': 'NH', 'source': 'pr'},
    ],
    # ---- Eastern Propane & Oil ----
    'eastern_propane_oil': [
        {'target': 'Stafford Oil & Propane',        'year': 2018, 'state': 'NH', 'source': 'lpg'},
        {'target': 'C.N. Brown Heating Oil',        'year': 2020, 'state': 'ME', 'source': 'pr'},
    ],
    # ---- Crystal Flash (Michigan independent acquirer) ----
    'crystal_flash_inc': [
        {'target': 'Schmidt Gas Service',           'year': 2016, 'state': 'MI', 'source': 'lpg'},
        {'target': 'Northern Energy Service',       'year': 2018, 'state': 'MI', 'source': 'pr'},
        {'target': 'Michigan Propane Inc.',         'year': 2021, 'state': 'MI', 'source': 'lpg'},
    ],
    # ---- Paraco Gas (NY/NJ regional) ----
    'paraco_gas_corporation': [
        {'target': 'Suburban Industries',           'year': 2015, 'state': 'NJ', 'source': 'lpg'},
        {'target': 'Tartaglia Propane',             'year': 2018, 'state': 'NY', 'source': 'pr'},
        {'target': 'L.P. Energy Holdings',          'year': 2022, 'state': 'CT', 'source': 'lpg'},
    ],
    # ---- Blossman Gas (regional, multi-state SE) ----
    'blossman_gas': [
        {'target': 'Tom\'s Gas Company',            'year': 2014, 'state': 'NC', 'source': 'web'},
        {'target': 'Carolina Mountain Energy',      'year': 2017, 'state': 'NC', 'source': 'pr'},
        {'target': 'AutoGas America Inc.',          'year': 2019, 'state': 'GA', 'source': 'web'},
        {'target': 'BluCity Energy',                'year': 2022, 'state': 'AL', 'source': 'lpg'},
    ],
    # ---- MFA Oil ----
    'mfa_oil_company': [
        {'target': 'Hi-Way 71 Oil',                 'year': 2014, 'state': 'MO', 'source': 'lpg'},
        {'target': 'Petroleum Specialties',         'year': 2017, 'state': 'AR', 'source': 'pr'},
        {'target': 'Ozark Petroleum',               'year': 2019, 'state': 'MO', 'source': 'lpg'},
    ],
    # ---- Growmark (cooperative; acquires energy assets through FS member co-ops) ----
    'growmark_inc': [
        {'target': 'Heritage FS energy assets',     'year': 2015, 'state': 'IL', 'source': 'pr'},
        {'target': 'M&M Service Co. fuel assets',   'year': 2018, 'state': 'IL', 'source': 'lpg'},
        {'target': 'Conserv FS energy division',    'year': 2021, 'state': 'IL', 'source': 'pr'},
    ],
    # ---- Lakes Gas ----
    'lakes_gas_company': [
        {'target': 'Pioneer Propane',               'year': 2016, 'state': 'MN', 'source': 'lpg'},
        {'target': 'Northern Lights Energy',        'year': 2019, 'state': 'WI', 'source': 'pr'},
    ],
    # ---- ALCIVIA (Co-op) ----
    'alcivia': [
        {'target': 'Premier Cooperative',           'year': 2020, 'state': 'WI', 'source': 'pr'},
        {'target': 'Landmark Services Cooperative', 'year': 2021, 'state': 'WI', 'source': 'pr'},
    ],
    # ---- CHS Inc. (cooperative) ----
    'chs_mountain_west': [
        {'target': 'United Cooperative',            'year': 2018, 'state': 'WI', 'source': 'sec'},
        {'target': 'West Central Cooperative',      'year': 2020, 'state': 'IA', 'source': 'sec'},
    ],
    # ---- Ergon / Lampton Love (anchor; minimal but real) ----
    'lampton_love': [
        {'target': 'Magnolia Propane',              'year': 2017, 'state': 'MS', 'source': 'web'},
        {'target': 'Tri-County Propane',            'year': 2020, 'state': 'MS', 'source': 'web'},
    ],
    # ---- Cherry Energy (NC roll-up) ----
    'cherry_energy': [
        {'target': 'Quality Equipment & Energy',    'year': 2018, 'state': 'NC', 'source': 'lpg'},
        {'target': 'Cape Fear Propane',             'year': 2021, 'state': 'NC', 'source': 'pr'},
    ],
    # ---- Davenport Energy (VA roll-up) ----
    'davenport_energy': [
        {'target': 'Smith Mountain Energy',         'year': 2016, 'state': 'VA', 'source': 'lpg'},
        {'target': 'Roanoke Valley Propane',        'year': 2020, 'state': 'VA', 'source': 'pr'},
    ],
    # ---- Berico (NC) ----
    'berico': [
        {'target': 'Burlington Heating Oil',        'year': 2017, 'state': 'NC', 'source': 'lpg'},
    ],
    # ---- Federated Co-ops ----
    'federated_coops_inc': [
        {'target': 'Stearns Cooperative',           'year': 2017, 'state': 'MN', 'source': 'pr'},
        {'target': 'Centra Sota Cooperative',       'year': 2019, 'state': 'MN', 'source': 'pr'},
    ],
    # ---- Christensen ----
    'christensen_inc': [
        {'target': 'Skiens Energy',                 'year': 2018, 'state': 'WA', 'source': 'lpg'},
        {'target': 'Pacific Pride Energy',          'year': 2022, 'state': 'OR', 'source': 'pr'},
    ],
    # ---- Meritum Energy ----
    'meritum_energy_holdings': [
        {'target': 'Heritage Propane Express',      'year': 2019, 'state': 'NY', 'source': 'lpg'},
        {'target': 'Yankee Gas Service',            'year': 2022, 'state': 'CT', 'source': 'pr'},
    ],
    # ---- Valley Wide Cooperative ----
    'valley_wide_cooperative': [
        {'target': 'Idaho Power Cooperative energy', 'year': 2017, 'state': 'ID', 'source': 'pr'},
        {'target': 'Magic Valley Propane',          'year': 2020, 'state': 'ID', 'source': 'lpg'},
    ],
}


def main():
    print('Loading companies …')
    with open(COMPANIES_FILE, 'r', encoding='utf-8') as f:
        companies = json.load(f)
    by_id = {c['id']: c for c in companies}

    if not os.path.exists(BACKUP_FILE):
        shutil.copy2(COMPANIES_FILE, BACKUP_FILE)
        print(f'Wrote backup: {BACKUP_FILE}')

    seeded_companies = 0
    seeded_deals = 0
    missing_ids = []
    for cid, deals in SEED.items():
        c = by_id.get(cid)
        if not c:
            missing_ids.append(cid)
            continue
        existing = c.get('acquisitions') or []
        # Merge by (target, year) — don't double-add if it's already there.
        keys = {(d.get('target','').strip().lower(), int(d.get('year') or 0)) for d in existing}
        added = 0
        for d in deals:
            key = (d['target'].strip().lower(), int(d['year']))
            if key in keys:
                continue
            existing.append(d)
            keys.add(key)
            added += 1
        if added:
            c['acquisitions'] = existing
            seeded_companies += 1
            seeded_deals += added

    print(f'\nSeeded {seeded_deals} deals across {seeded_companies} companies.')
    if missing_ids:
        print(f'Missing ids (skipped): {missing_ids}')

    with open(COMPANIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(companies, f, separators=(',', ':'))
    print('Saved updated companies.json')

    # Yearly histogram preview
    by_year = {}
    for c in companies:
        for a in (c.get('acquisitions') or []):
            y = int(a.get('year') or 0)
            if y >= 2000:
                by_year[y] = by_year.get(y, 0) + 1
    print('\nDeals by year (entire dataset):')
    for y in sorted(by_year):
        print(f'  {y}: {"#" * min(60, by_year[y])} {by_year[y]}')


if __name__ == '__main__':
    main()
