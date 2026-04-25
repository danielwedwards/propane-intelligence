"""Extract company names from research agent output - parse markdown tables."""
import json
import re

AGENT_OUTPUT = r'C:\Users\Danie\AppData\Local\Temp\claude\C--Users-Danie-OneDrive-Desktop-Ergon-Corporate-Development-ISL-lampton-ib\785f657a-493d-47d8-8656-32cd1239dc23\tasks\a54ebf543238a5650.output'
OUTPUT = r'C:\Users\Danie\Downloads\se-propane-market-map\data\pending_research_agent.json'

with open(AGENT_OUTPUT, 'r', encoding='utf-8') as f:
    raw = f.read()

# Get all assistant text
texts = []
for line in raw.split('\n'):
    line = line.strip()
    if not line:
        continue
    try:
        obj = json.loads(line)
        if obj.get('type') == 'assistant':
            for block in obj.get('message', {}).get('content', []):
                if isinstance(block, dict) and block.get('type') == 'text':
                    texts.append(block['text'])
    except:
        pass

full_text = '\n'.join(texts)

# Parse state headers and table rows
companies = []
current_state = None
state_map = {
    'TEXAS': 'TX', 'COLORADO': 'CO', 'OHIO': 'OH', 'NEW YORK': 'NY',
    'PENNSYLVANIA': 'PA', 'MICHIGAN': 'MI', 'CALIFORNIA': 'CA',
    'MAINE': 'ME', 'NEW HAMPSHIRE': 'NH', 'VERMONT': 'VT',
    'MASSACHUSETTS': 'MA', 'CONNECTICUT': 'CT', 'NEW JERSEY': 'NJ',
    'MARYLAND': 'MD', 'WEST VIRGINIA': 'WV', 'NEW MEXICO': 'NM',
    'ARIZONA': 'AZ', 'MONTANA': 'MT', 'IDAHO': 'ID', 'OREGON': 'OR',
    'WASHINGTON': 'WA', 'NEBRASKA': 'NE', 'KANSAS': 'KS',
    'SOUTH DAKOTA': 'SD', 'NORTH DAKOTA': 'ND', 'WYOMING': 'WY',
    'UTAH': 'UT', 'NEVADA': 'NV',
}

for line in full_text.split('\n'):
    line = line.strip()

    # Check for state header: "## TEXAS (TX)" or "## OHIO (OH)"
    m = re.match(r'^##\s+([A-Z\s]+)\s*\(([A-Z]{2})\)', line)
    if m:
        state_name = m.group(1).strip()
        current_state = m.group(2)
        continue

    # Also check: "## STATE_NAME"
    for sn, sa in state_map.items():
        if line == f'## {sn}' or line == f'## {sn} ({sa})':
            current_state = sa
            break

    if not current_state:
        continue

    # Parse table row: "| Company Name | City |"
    m = re.match(r'^\|\s*(.+?)\s*\|\s*(.+?)\s*\|?\s*$', line)
    if m:
        name = m.group(1).strip()
        city_info = m.group(2).strip()

        # Skip header rows
        if name in ('Company', '---', 'company', 'Company Name', '------'):
            continue
        if '---' in name:
            continue

        # Clean city - take first city if multiple
        city = city_info.split('/')[0].split('(')[0].split(',')[0].strip()
        # Remove "Multiple locations", "Statewide", etc.
        if city.lower() in ('multiple locations', 'statewide', 'various', ''):
            city = ''

        if name and len(name) > 2:
            companies.append({
                'name': name,
                'city': city if city else '',
                'state': current_state,
                'source': 'web_research'
            })

# Deduplicate
seen = set()
unique = []
for c in companies:
    key = c['name'].lower().strip()
    if key not in seen:
        seen.add(key)
        unique.append(c)

print(f'Extracted {len(unique)} unique companies')

from collections import Counter
state_counts = Counter(c['state'] for c in unique)
print(f'\nBy state:')
for st, count in state_counts.most_common():
    print(f'  {st}: {count}')

with open(OUTPUT, 'w') as f:
    json.dump(unique, f, indent=2)
print(f'\nSaved to {OUTPUT}')

print(f'\nAll companies:')
for c in unique:
    print(f"  [{c['state']}] {c['name']} - {c['city']}")
