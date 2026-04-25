import re, json, os

with open(r'C:\Users\Danie\Downloads\se-propane-market-map\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

def extract_js_value(html, prefix):
    match = re.search(re.escape(prefix), html)
    if not match:
        return None
    start = match.start() + len(prefix)
    opener = html[start - 1]
    closer = ']' if opener == '[' else '}'
    depth = 1
    i = start
    in_string = False
    escape_next = False
    while i < len(html) and depth > 0:
        c = html[i]
        if escape_next:
            escape_next = False
            i += 1
            continue
        if c == '\\' and in_string:
            escape_next = True
            i += 1
            continue
        if c == '"':
            in_string = not in_string
        elif not in_string:
            if c == opener:
                depth += 1
            elif c == closer:
                depth -= 1
        i += 1
    return html[start - 1:i]

# Extract all three data structures
data_str = extract_js_value(html, 'const DATA=[')
cd_str = extract_js_value(html, 'const CD=[')
geo_str = extract_js_value(html, 'const GEO={')

data = json.loads(data_str)
cd = json.loads(cd_str)
geo = json.loads(geo_str)

print(f"DATA: {len(data)} companies")
print(f"CD: {len(cd)} county records")
print(f"GEO: {len(geo['features'])} county polygons")

# Create data directory
outdir = r'C:\Users\Danie\Downloads\se-propane-market-map\data'
os.makedirs(outdir, exist_ok=True)

with open(os.path.join(outdir, 'companies.json'), 'w') as f:
    json.dump(data, f, separators=(',', ':'))
print(f"Saved companies.json")

with open(os.path.join(outdir, 'counties.json'), 'w') as f:
    json.dump(cd, f, separators=(',', ':'))
print(f"Saved counties.json")

with open(os.path.join(outdir, 'counties.geojson'), 'w') as f:
    json.dump(geo, f, separators=(',', ':'))
print(f"Saved counties.geojson")

# Field coverage analysis
print("\n=== Company Field Coverage ===")
fields = {}
for c in data:
    for k, v in c.items():
        if k not in fields:
            fields[k] = 0
        if v is not None and v != '' and v != []:
            fields[k] += 1

for k in sorted(fields.keys()):
    pct = fields[k] / len(data) * 100
    print(f"  {k}: {fields[k]}/{len(data)} ({pct:.0f}%)")

# Confidence distribution
print("\n=== Data Confidence Distribution ===")
conf_dist = {}
for c in data:
    dc = c.get('dataConfidence', 0)
    conf_dist[dc] = conf_dist.get(dc, 0) + 1
for k in sorted(conf_dist.keys()):
    print(f"  Rating {k}: {conf_dist[k]} companies")

# Location county field coverage
total_locs = 0
locs_with_county = 0
for c in data:
    for loc in c.get('locations', []):
        total_locs += 1
        if loc.get('county', '').strip():
            locs_with_county += 1
print(f"\n=== Location County Coverage ===")
print(f"  Locations with county: {locs_with_county}/{total_locs} ({locs_with_county/total_locs*100:.1f}%)")

# File sizes
for fname in ['companies.json', 'counties.json', 'counties.geojson']:
    fpath = os.path.join(outdir, fname)
    size = os.path.getsize(fpath)
    print(f"  {fname}: {size:,} bytes ({size/1024:.0f} KB)")
