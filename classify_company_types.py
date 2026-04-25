"""
Classify all companies in data/companies.json by business type.

Adds two fields:
  companyType:           retail_dealer | cylinder_exchange | multi_fuel | industrial_gas | coop_utility | wholesale_transport
  companyTypeConfidence: high | medium | low

Cascading rule engine — first match wins. Produces a review file for low/medium confidence items.
"""
import json
import re
import os

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(DATA_DIR, 'data', 'companies.json')
REVIEW_PATH = os.path.join(DATA_DIR, 'data', 'classification_review.json')

# ─────────────────────────────────────────────────────────────
# Pattern lists (all lowercase for matching)
# ─────────────────────────────────────────────────────────────

CYLINDER_NAME = [
    'blue rhino', 'rapidxchange', 'rapidx change', 'cynch', 'flame king',
    'cylinder exchange', 'tank exchange', 'grill gas express',
    'armadillo cylinder', 'propane exchange llc', 'propane exchange inc',
]
CYLINDER_DESC = [
    'cylinder exchange', 'tank swap', 'cylinder swap', 'tank exchange',
    'refill location only', 'propane exchange station',
    'cylinder refill station', 'exchange-only',
]

INDUSTRIAL_NAME = [
    'airgas', 'linde gas', 'linde inc', 'air liquide', 'praxair',
    'matheson', 'nexair', 'roberts oxygen', 'american welding & gas',
    'american welding and gas', 'awg inc', 'national welding supply',
    'red ball oxygen', 'victor welding', 'n i welding supply',
    'welding supply', 'welding gas', 'industrial gas', 'medical gas',
    'specialty gas', 'compressed gas', 'gas and supply carolina',
]
INDUSTRIAL_DESC = [
    'industrial gas', 'welding gas', 'medical gas', 'specialty gas',
    'welding supply', 'industrial gases', 'compressed gases',
    'oxygen and acetylene', 'dry ice',
]

COOP_NAME = [
    'cooperative', 'co-op', ' coop ', 'coop,', 'farm bureau',
    'farmers union', 'farm supply', 'farmers supply', 'cenex ',
    'mfa oil', 'growmark', ' chs ', 'chs inc',
    'landmark services', 'heritage cooperative', 'country visions',
    'centra-sota', 'sunrise cooperative', 'united cooperative',
    'southern states coop', 'shelby county coop',
    'farmers energy', 'farmers oil', 'farmers inc',
    'co-alliance', 'prairie farms', 'ag valley',
    'farm service', 'agri-', 'agsouth',
]
# Pattern: name ends with " FS" (Farm Service cooperative pattern)
COOP_FS_PATTERN = re.compile(r'\bfs\b|\bfs$', re.IGNORECASE)

WHOLESALE_NAME = [
    'wholesale fuel', 'bulk transport', 'wholesale propane',
    'distribution terminal', 'pipeline co', 'dixie pipeline',
    'martin operating', 'martin product sales',
    'targa transport', 'enlink midstream', 'sem stream',
    'ngl energy', 'sun coast resources', 'pilot thomas logistics',
    'offen petroleum',
]
WHOLESALE_DESC = [
    'wholesale only', 'bulk transport only', 'no retail',
    'distribution terminal', 'rail terminal', 'midstream',
    'wholesale distributor', 'transport company',
    'pipeline distribution', 'bulk petroleum transport',
]

MULTI_FUEL_NAME = [
    'petroleum', 'oil company', 'oil co.', 'oil co,',
    'fuel oil', 'heating oil', 'fuel service',
    'fuel inc', 'fuels inc', 'fuels llc', 'fuels,',
    'diesel ', 'kerosene', 'petro inc', 'petro llc',
    ' oil inc', ' oil llc',
    'energy solutions', 'energy service',
]
# Pattern: name ends with " oil" (but not foil/soil/coil)
MULTI_FUEL_OIL_SUFFIX = re.compile(r'(?<![fsc])\boil\s*$', re.IGNORECASE)
MULTI_FUEL_OIL_NAME = re.compile(r'\boil\b', re.IGNORECASE)

MULTI_FUEL_DESC = [
    'petroleum distributor', 'petroleum dealer', 'petroleum marketer',
    'fuel oil and propane', 'heating oil and propane',
    'diesel and propane', 'multi-fuel', 'oil and propane',
    'fuel distributor', 'petroleum products', 'gasoline and propane',
    'convenience store', 'gas station', 'fuel dealer',
    'heating oil, propane', 'propane, heating oil',
    'fuel delivery', 'petroleum company',
]

# Description signals that override multi_fuel → retail_dealer
PROPANE_PRIMARY_DESC = [
    'propane distributor', 'propane dealer', 'propane delivery',
    'propane company', 'propane service', 'lp gas dealer',
    'lp gas distributor', 'lpg dealer', 'propane retailer',
    'propane gas company', 'propane gas dealer',
]
OTHER_FUEL_DESC = [
    'oil', 'petroleum', 'diesel', 'heating oil', 'kerosene',
    'gasoline', 'fuel oil', 'lubricant',
]

RETAIL_NAME = [
    'propane', 'lp gas', 'l.p. gas', 'lpg', 'lp-gas',
    'gas co', 'gas service', 'gas company', 'gas inc',
    'gas llc', 'butane',
]
RETAIL_DESC = [
    'propane distributor', 'propane delivery', 'bobtail',
    'propane dealer', 'propane company', 'propane service',
    'propane retailer', 'lp gas', 'residential propane',
]
LICENSE_DESC = [
    'category e', 'class a dealer', 'class a lp gas',
    'code 01', 'retail dealer license',
]


def _has_any(text, patterns):
    """Check if text contains any of the patterns."""
    for p in patterns:
        if p in text:
            return True
    return False


def classify(company):
    """
    Classify a company by business type.
    Returns: (companyType, confidence, signals)
    """
    name = (company.get('name') or '').lower().strip()
    desc = (company.get('description') or '').lower().strip()
    notes = (company.get('notes') or '').lower().strip()
    combined_desc = desc + ' ' + notes
    ownership = (company.get('ownership') or '').lower().strip()
    service_types = company.get('serviceTypes') or []
    signals = []

    # ── Rule 1: Cylinder Exchange ──────────────────────────────
    if _has_any(name, CYLINDER_NAME):
        signals.append(f'name_match:cylinder({[p for p in CYLINDER_NAME if p in name][0]})')
        return ('cylinder_exchange', 'high', signals)
    if _has_any(combined_desc, CYLINDER_DESC):
        signals.append(f'desc_match:cylinder({[p for p in CYLINDER_DESC if p in combined_desc][0]})')
        return ('cylinder_exchange', 'high', signals)

    # ── Rule 2: Industrial Gas ─────────────────────────────────
    if _has_any(name, INDUSTRIAL_NAME):
        signals.append(f'name_match:industrial({[p for p in INDUSTRIAL_NAME if p in name][0]})')
        conf = 'high'
        if _has_any(combined_desc, INDUSTRIAL_DESC):
            signals.append('desc_confirms:industrial')
        return ('industrial_gas', conf, signals)
    if _has_any(combined_desc, INDUSTRIAL_DESC) and not _has_any(name, RETAIL_NAME):
        signals.append(f'desc_match:industrial({[p for p in INDUSTRIAL_DESC if p in combined_desc][0]})')
        return ('industrial_gas', 'medium', signals)

    # ── Rule 3: Cooperative / Utility ──────────────────────────
    if ownership in ('coop', 'municipal'):
        signals.append(f'ownership:{ownership}')
        conf = 'high'
        if _has_any(name, COOP_NAME) or COOP_FS_PATTERN.search(name):
            signals.append('name_confirms:coop')
        return ('coop_utility', conf, signals)
    if _has_any(name, COOP_NAME):
        signals.append(f'name_match:coop({[p for p in COOP_NAME if p in name][0]})')
        return ('coop_utility', 'high', signals)
    if COOP_FS_PATTERN.search(name) and ('farm' in combined_desc or 'agri' in combined_desc or 'cooperative' in combined_desc):
        signals.append('name_pattern:fs_suffix+desc_farm')
        return ('coop_utility', 'medium', signals)

    # ── Rule 4: Wholesale / Transport ──────────────────────────
    if _has_any(name, WHOLESALE_NAME):
        signals.append(f'name_match:wholesale({[p for p in WHOLESALE_NAME if p in name][0]})')
        conf = 'high' if _has_any(combined_desc, WHOLESALE_DESC) else 'medium'
        return ('wholesale_transport', conf, signals)
    if _has_any(combined_desc, WHOLESALE_DESC):
        signals.append(f'desc_match:wholesale({[p for p in WHOLESALE_DESC if p in combined_desc][0]})')
        return ('wholesale_transport', 'medium', signals)

    # ── Rule 5: Multi-Fuel Distributor ─────────────────────────
    name_is_multi = _has_any(name, MULTI_FUEL_NAME) or MULTI_FUEL_OIL_SUFFIX.search(name)
    desc_is_multi = _has_any(combined_desc, MULTI_FUEL_DESC)

    # Pre-compute oil/fuel description checks for use in multi_fuel and fallback
    desc_without_name = combined_desc.replace(name, '')
    desc_mentions_oil = 'oil' in desc_without_name and any(
        f in desc_without_name for f in ['fuel oil', 'heating oil', 'oil and propane', 'oil company',
                                          'petroleum', 'oil dealer', 'oil distributor']
    )

    if name_is_multi or desc_is_multi:
        # Exception: if description clearly says "propane distributor/dealer" and
        # does NOT mention other fuels, this is likely a retail_dealer with a legacy name
        desc_says_propane_primary = _has_any(combined_desc, PROPANE_PRIMARY_DESC)
        desc_mentions_other_fuel = any(f in combined_desc for f in OTHER_FUEL_DESC
                                       if f not in ('oil',))  # "oil" too broad in company names

        if desc_says_propane_primary and not desc_mentions_other_fuel and not desc_mentions_oil:
            # Override: company name suggests multi-fuel but description says propane-focused
            signals.append('name_suggests:multi_fuel')
            signals.append('desc_override:propane_primary')
            return ('retail_dealer', 'medium', signals)

        if name_is_multi:
            match = [p for p in MULTI_FUEL_NAME if p in name]
            if not match and MULTI_FUEL_OIL_SUFFIX.search(name):
                match = ['oil_suffix']
            signals.append(f'name_match:multi_fuel({match[0] if match else "pattern"})')
        if desc_is_multi:
            signals.append(f'desc_match:multi_fuel')

        conf = 'high' if (name_is_multi and desc_is_multi) else 'medium'
        return ('multi_fuel', conf, signals)

    # Also catch "XXX Oil" pattern in name even if not in MULTI_FUEL_NAME list
    if MULTI_FUEL_OIL_NAME.search(name) and not _has_any(name, RETAIL_NAME):
        # Name has "oil" but no propane/gas keywords — likely multi-fuel
        signals.append('name_pattern:contains_oil')
        if desc_is_multi or desc_mentions_oil:
            signals.append('desc_confirms:multi_fuel')
            return ('multi_fuel', 'medium', signals)
        # Oil in name but no confirming description — low confidence
        signals.append('no_desc_confirmation')
        return ('multi_fuel', 'low', signals)

    # ── Rule 6: Retail Dealer (default) ────────────────────────
    if _has_any(name, RETAIL_NAME):
        signals.append(f'name_match:retail({[p for p in RETAIL_NAME if p in name][0]})')
        if _has_any(combined_desc, RETAIL_DESC):
            signals.append('desc_confirms:retail')
            return ('retail_dealer', 'high', signals)
        return ('retail_dealer', 'high', signals)

    if _has_any(combined_desc, RETAIL_DESC):
        signals.append(f'desc_match:retail({[p for p in RETAIL_DESC if p in combined_desc][0]})')
        return ('retail_dealer', 'medium', signals)

    if _has_any(combined_desc, LICENSE_DESC):
        signals.append(f'license_match:retail({[p for p in LICENSE_DESC if p in combined_desc][0]})')
        return ('retail_dealer', 'medium', signals)

    # ── Fallback ───────────────────────────────────────────────
    signals.append('no_signals:default_retail')
    return ('retail_dealer', 'low', signals)


def main():
    with open(DATA_PATH, encoding='utf-8') as f:
        companies = json.load(f)

    review = []
    stats = {}
    conf_stats = {'high': 0, 'medium': 0, 'low': 0}

    for c in companies:
        ct, conf, sigs = classify(c)
        c['companyType'] = ct
        c['companyTypeConfidence'] = conf
        stats[ct] = stats.get(ct, 0) + 1
        conf_stats[conf] = conf_stats.get(conf, 0) + 1

        if conf in ('low', 'medium'):
            review.append({
                'id': c.get('id', ''),
                'name': c.get('name', ''),
                'assignedType': ct,
                'confidence': conf,
                'signals': sigs,
                'ownership': c.get('ownership', ''),
                'hqState': c.get('hqState', ''),
                'description': (c.get('description') or '')[:300]
            })

    # Save updated dataset
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(companies, f, separators=(',', ':'))

    # Save review file
    with open(REVIEW_PATH, 'w', encoding='utf-8') as f:
        json.dump(review, f, indent=2, ensure_ascii=False)

    # Print summary
    print("=" * 50)
    print("COMPANY TYPE CLASSIFICATION RESULTS")
    print("=" * 50)
    print(f"\nTotal companies: {len(companies)}")
    print(f"\nBy type:")
    for ct in ['retail_dealer', 'multi_fuel', 'coop_utility', 'industrial_gas',
               'cylinder_exchange', 'wholesale_transport']:
        count = stats.get(ct, 0)
        pct = 100 * count / len(companies)
        print(f"  {ct:<22} {count:>5}  ({pct:>5.1f}%)")

    print(f"\nBy confidence:")
    for conf in ['high', 'medium', 'low']:
        count = conf_stats[conf]
        pct = 100 * count / len(companies)
        print(f"  {conf:<10} {count:>5}  ({pct:>5.1f}%)")

    print(f"\nReview items (medium+low): {len(review)}")
    print(f"  -> Saved to {REVIEW_PATH}")

    # Show breakdown of review items by type
    review_by_type = {}
    for r in review:
        k = f"{r['assignedType']}:{r['confidence']}"
        review_by_type[k] = review_by_type.get(k, 0) + 1
    print(f"\nReview breakdown:")
    for k, v in sorted(review_by_type.items()):
        print(f"  {k}: {v}")


if __name__ == '__main__':
    main()
