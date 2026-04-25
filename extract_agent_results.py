"""Extract company names from the research agent output."""
import json
import re

AGENT_OUTPUT = r'C:\Users\Danie\AppData\Local\Temp\claude\C--Users-Danie-OneDrive-Desktop-Ergon-Corporate-Development-ISL-lampton-ib\785f657a-493d-47d8-8656-32cd1239dc23\tasks\a54ebf543238a5650.output'
OUTPUT = r'C:\Users\Danie\Downloads\se-propane-market-map\data\pending_research_agent.json'

with open(AGENT_OUTPUT, 'r', encoding='utf-8') as f:
    raw = f.read()

# Extract all text content from JSONL messages
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
print(f'Total text: {len(full_text):,} chars')

# Extract company entries using multiple patterns
companies = []
seen = set()

for line in full_text.split('\n'):
    line = line.strip()
    if not line:
        continue

    # Skip headers, notes, etc
    if line.startswith('#') or line.startswith('Source') or line.startswith('Note'):
        continue

    # Pattern 1: "- **Company Name** - City, ST"
    m = re.match(r'^[-*\d.)\s]+\*{0,2}([^*]+?)\*{0,2}\s*[-\u2013\u2014]+\s*(.+?),\s*([A-Z]{2})\s*$', line)
    if m:
        name = m.group(1).strip()
        city = m.group(2).strip()
        state = m.group(3).strip()
        key = name.lower()
        if key not in seen and len(name) > 2:
            seen.add(key)
            companies.append({'name': name, 'city': city, 'state': state, 'source': 'web_research'})
        continue

    # Pattern 2: "Company Name (City, ST)"
    m = re.match(r'^[-*\d.)\s]+\*{0,2}([^(]+?)\*{0,2}\s*\(([^,]+),\s*([A-Z]{2})\)', line)
    if m:
        name = m.group(1).strip()
        city = m.group(2).strip()
        state = m.group(3).strip()
        key = name.lower()
        if key not in seen and len(name) > 2:
            seen.add(key)
            companies.append({'name': name, 'city': city, 'state': state, 'source': 'web_research'})
        continue

    # Pattern 3: "- Company Name, City, ST"
    m = re.match(r'^[-*\d.)\s]+\*{0,2}([A-Z][^,]+?)\*{0,2},\s*([^,]+),\s*([A-Z]{2})\s*$', line)
    if m:
        name = m.group(1).strip()
        city = m.group(2).strip()
        state = m.group(3).strip()
        key = name.lower()
        if key not in seen and len(name) > 2 and len(state) == 2:
            seen.add(key)
            companies.append({'name': name, 'city': city, 'state': state, 'source': 'web_research'})

print(f'Extracted {len(companies)} unique companies')

# Count by state
from collections import Counter
state_counts = Counter(c['state'] for c in companies)
print(f'\nBy state:')
for st, count in state_counts.most_common():
    print(f'  {st}: {count}')

# Save
with open(OUTPUT, 'w') as f:
    json.dump(companies, f, indent=2)
print(f'\nSaved to {OUTPUT}')

# Show sample
print(f'\nSample entries:')
for c in companies[:20]:
    print(f"  {c['name']} ({c['city']}, {c['state']})")
