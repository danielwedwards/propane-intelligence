"""
Automated data quality audit for propane company dataset.
Flags issues across multiple dimensions.
"""
import json
import os
import math
from collections import defaultdict

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

issues = defaultdict(list)

# --- 1. HQ City = State Abbreviation (e.g., Thompson Gas hqCity: "SC") ---
for c in companies:
    if c.get('hqCity', '') == c.get('hqState', '') and len(c.get('hqCity', '')) <= 2:
        issues['hq_city_equals_state'].append(
            f"{c['name']}: hqCity='{c['hqCity']}', hqState='{c['hqState']}'"
        )

# --- 2. Location city = state abbreviation ---
for c in companies:
    for loc in c.get('locations', []):
        if loc.get('city', '') == loc.get('state', '') and len(loc.get('city', '')) <= 2:
            issues['loc_city_equals_state'].append(
                f"{c['name']}: location city='{loc['city']}', state='{loc['state']}'"
            )
            break  # Only report once per company

# --- 3. Revenue/Gallon ratio outliers ---
for c in companies:
    rev = c.get('estRevenue', 0)
    gal = c.get('estAnnualGallons', 0)
    if rev and gal and gal > 0:
        # Revenue is in $M, gallons in millions
        price_per_gal = (rev * 1_000_000) / (gal * 1_000_000)
        if price_per_gal < 0.50 or price_per_gal > 6.00:
            issues['revenue_gallon_outlier'].append(
                f"{c['name']}: ${rev}M rev / {gal}M gal = ${price_per_gal:.2f}/gal"
            )

# --- 4. Duplicate companies (fuzzy name matching) ---
import re
def normalize_company_name(name):
    name = name.lower().strip()
    # Remove common suffixes
    for suffix in [', inc.', ', llc', ', l.p.', ' inc', ' llc', ' lp', ' l.p.',
                   ' partners', ' corporation', ' corp', ', inc', ' co.', ' co']:
        name = name.replace(suffix, '')
    name = re.sub(r'[^a-z0-9 ]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

name_map = defaultdict(list)
for c in companies:
    norm = normalize_company_name(c['name'])
    name_map[norm].append(c['name'])

for norm, names in name_map.items():
    if len(names) > 1:
        issues['potential_duplicates'].append(f"{', '.join(names)}")

# --- 5. Location coordinates far from stated state ---
STATE_CENTERS = {
    'AL': (32.8, -86.8), 'AR': (34.8, -92.2), 'FL': (28.6, -82.5),
    'GA': (32.7, -83.5), 'KY': (37.8, -85.8), 'LA': (31.0, -92.0),
    'MS': (32.7, -89.7), 'NC': (35.6, -79.8), 'SC': (33.8, -81.0),
    'TN': (35.8, -86.4), 'VA': (37.5, -78.8), 'TX': (31.0, -99.7),
    'CA': (37.3, -119.7), 'NY': (42.9, -75.5), 'PA': (40.9, -77.7),
    'OH': (40.3, -82.7), 'MI': (44.3, -84.5), 'IL': (40.0, -89.4),
    'MN': (46.3, -94.3), 'WI': (44.6, -89.7), 'MO': (38.4, -92.5),
    'IN': (39.8, -86.1), 'WA': (47.4, -120.5), 'OR': (44.0, -120.5),
    'CO': (39.0, -105.5), 'WV': (38.6, -80.6), 'MD': (39.0, -76.8),
}

for c in companies:
    for loc in c.get('locations', []):
        lat, lng = loc.get('lat'), loc.get('lng')
        state = loc.get('state', '')
        if lat and lng and state in STATE_CENTERS:
            center = STATE_CENTERS[state]
            dist = math.sqrt((lat - center[0])**2 + (lng - center[1])**2)
            if dist > 8:  # Very rough ~500+ mile check
                issues['location_far_from_state'].append(
                    f"{c['name']}: loc at ({lat},{lng}) claimed state={state}, dist={dist:.1f} degrees from center"
                )

# --- 6. Companies with 0 locations ---
for c in companies:
    locs = c.get('locations', [])
    if len(locs) == 0:
        issues['no_locations'].append(f"{c['name']}")

# --- 7. Missing critical fields ---
for c in companies:
    missing = []
    if not c.get('website'):
        missing.append('website')
    if not c.get('estRevenue'):
        missing.append('estRevenue')
    if not c.get('employeeCount'):
        missing.append('employeeCount')
    if not c.get('description') or len(c.get('description', '')) < 20:
        missing.append('description')
    if missing and c.get('dataConfidence', 0) >= 3:
        issues['high_confidence_missing_fields'].append(
            f"{c['name']} (conf={c.get('dataConfidence')}): missing {', '.join(missing)}"
        )

# --- 8. Stale data ---
from datetime import datetime
for c in companies:
    lr = c.get('lastResearched', '')
    if lr:
        try:
            # Try parsing various date formats
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%Y-%m']:
                try:
                    dt = datetime.strptime(lr, fmt)
                    days_old = (datetime(2026, 4, 9) - dt).days
                    if days_old > 365:
                        issues['stale_data'].append(
                            f"{c['name']}: last researched {lr} ({days_old} days ago)"
                        )
                    break
                except ValueError:
                    continue
        except:
            pass

# --- 9. optBTier/optCTier malformed values ---
for c in companies:
    for field in ['optBTier', 'optCTier']:
        val = c.get(field)
        if val and ('\n' in str(val) or len(str(val)) > 30):
            issues['malformed_tier'].append(
                f"{c['name']}: {field}='{str(val)[:50]}'"
            )

# --- 10. Confidence 1 with high scores (priority upgrade candidates) ---
p1_candidates = []
for c in companies:
    conf = c.get('dataConfidence', 0)
    se_locs = c.get('seLocs', 0)
    rev = c.get('estRevenue', 0)
    if conf <= 1:
        score = 0
        if se_locs >= 5: score += 3
        elif se_locs >= 2: score += 1
        if rev and rev >= 10: score += 3
        elif rev and rev >= 5: score += 1
        if score >= 3:
            p1_candidates.append((c['name'], se_locs, rev, conf))

# --- Print Report ---
print("=" * 70)
print("DATA QUALITY AUDIT REPORT")
print("=" * 70)

for issue_type, items in sorted(issues.items()):
    print(f"\n{'-' * 50}")
    print(f"[{issue_type.upper()}] — {len(items)} issues")
    print(f"{'-' * 50}")
    for item in items[:15]:
        print(f"  • {item}")
    if len(items) > 15:
        print(f"  ... and {len(items) - 15} more")

# Priority upgrade candidates
print(f"\n{'-' * 50}")
print(f"[P1 UPGRADE CANDIDATES] — {len(p1_candidates)} companies")
print(f"Confidence 1, high-value targets needing data upgrade")
print(f"{'-' * 50}")
p1_candidates.sort(key=lambda x: (x[1], x[2] or 0), reverse=True)
for name, locs, rev, conf in p1_candidates[:25]:
    rev_str = f"${rev}M" if rev else "N/A"
    print(f"  • {name}: {locs} SE locs, {rev_str} rev, conf={conf}")

# Summary
print(f"\n{'=' * 70}")
print("SUMMARY")
print(f"{'=' * 70}")
total_issues = sum(len(items) for items in issues.values())
print(f"Total issues found: {total_issues}")
print(f"P1 upgrade candidates: {len(p1_candidates)}")
print(f"Companies by confidence: ", end="")
conf_counts = defaultdict(int)
for c in companies:
    conf_counts[c.get('dataConfidence', 0)] += 1
for k in sorted(conf_counts.keys()):
    print(f"[{k}]={conf_counts[k]}", end="  ")
print()

# Save report as JSON for programmatic use
report = {
    'issues': {k: v for k, v in issues.items()},
    'p1_candidates': [{'name': n, 'seLocs': l, 'estRevenue': r, 'confidence': c}
                       for n, l, r, c in p1_candidates],
    'summary': {
        'total_companies': len(companies),
        'total_issues': total_issues,
        'confidence_distribution': dict(conf_counts),
    }
}
report_path = os.path.join(DATA_DIR, 'quality_audit_report.json')
with open(report_path, 'w') as f:
    json.dump(report, f, indent=2)
print(f"\nFull report saved to: {report_path}")
