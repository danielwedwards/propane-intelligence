"""
Convert Census TIGER county shapefile to GeoJSON, split by region.
Outputs simplified GeoJSON for web use.
"""
import shapefile
import json
import os
import zipfile

ZIP_PATH = r'C:\Users\Danie\Downloads\se-propane-market-map\data\cb_2023_us_county_500k.zip'
OUT_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

# State FIPS to abbreviation
FIPS_TO_ST = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
    '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
    '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
    '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
    '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
    '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
    '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
    '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
    '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
    '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
    '56': 'WY'
}

# Region definitions
REGIONS = {
    'southeast': {'AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA'},
    'northeast': {'CT', 'DE', 'DC', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT', 'WV'},
    'midwest': {'IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'},
    'west': {'AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY'},
    'south_central': {'OK', 'TX'},
}

# Extract shapefile from zip
zf = zipfile.ZipFile(ZIP_PATH)
# pyshp can read from a zip via shp/shx/dbf file objects
shp_data = zf.read('cb_2023_us_county_500k.shp')
shx_data = zf.read('cb_2023_us_county_500k.shx')
dbf_data = zf.read('cb_2023_us_county_500k.dbf')

import io
sf = shapefile.Reader(shp=io.BytesIO(shp_data), shx=io.BytesIO(shx_data), dbf=io.BytesIO(dbf_data))

print(f"Fields: {[f[0] for f in sf.fields[1:]]}")
print(f"Records: {len(sf)}")

# Show first record
rec = sf.record(0)
print(f"First record: {rec}")

# Convert to GeoJSON features
all_features = []
region_features = {r: [] for r in REGIONS}
skipped_territories = 0

for sr in sf.iterShapeRecords():
    rec = sr.record
    geom = sr.shape

    state_fips = rec['STATEFP']
    county_fips = rec['COUNTYFP']
    geoid = rec['GEOID']
    name = rec['NAME']
    lsad = rec['LSAD']
    area = rec['ALAND']

    state_abbrev = FIPS_TO_ST.get(state_fips)
    if not state_abbrev:
        skipped_territories += 1
        continue  # Skip territories (PR, GU, VI, AS, MP)

    # Simplify coordinates (round to 4 decimal places ~11m precision)
    def simplify_coords(coords):
        if isinstance(coords[0], (list, tuple)):
            return [simplify_coords(c) for c in coords]
        return [round(coords[0], 4), round(coords[1], 4)]

    geom_type = 'Polygon' if geom.shapeType == 5 else 'MultiPolygon'

    # Convert shapefile parts to GeoJSON coordinates
    points = geom.points
    parts = list(geom.parts) + [len(points)]

    rings = []
    for i in range(len(parts) - 1):
        ring = [simplify_coords(p) for p in points[parts[i]:parts[i+1]]]
        rings.append(ring)

    # Determine if MultiPolygon (multiple outer rings)
    # Simple heuristic: if only 1 part, it's a Polygon
    if len(rings) == 1:
        coordinates = rings
        geom_type = 'Polygon'
    else:
        # Multiple parts - could be holes or separate polygons
        # For simplicity, treat each part as a separate polygon
        coordinates = [[ring] for ring in rings]
        geom_type = 'MultiPolygon'

    feature = {
        'type': 'Feature',
        'id': geoid,
        'properties': {
            'GEO_ID': f'0500000US{geoid}',
            'STATE': state_fips,
            'COUNTY': county_fips,
            'NAME': name,
            'LSAD': lsad,
            'CENSUSAREA': round(area / 2589988.11, 3) if area else 0  # sq meters to sq miles
        },
        'geometry': {
            'type': geom_type,
            'coordinates': coordinates
        }
    }

    all_features.append(feature)

    # Assign to region
    for region, states in REGIONS.items():
        if state_abbrev in states:
            region_features[region].append(feature)
            break

print(f"\nTotal features: {len(all_features)}")
print(f"Skipped territories: {skipped_territories}")

# Save per-region GeoJSON files
for region, features in region_features.items():
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }
    path = os.path.join(OUT_DIR, f'counties_{region}.geojson')
    with open(path, 'w') as f:
        json.dump(geojson, f, separators=(',', ':'))
    size = os.path.getsize(path)
    print(f"  {region}: {len(features)} counties, {size:,} bytes ({size/1024:.0f} KB)")

# Save full national GeoJSON
full_geojson = {
    'type': 'FeatureCollection',
    'features': all_features
}
full_path = os.path.join(OUT_DIR, 'counties_national.geojson')
with open(full_path, 'w') as f:
    json.dump(full_geojson, f, separators=(',', ':'))
size = os.path.getsize(full_path)
print(f"\n  NATIONAL: {len(all_features)} counties, {size:,} bytes ({size/1024/1024:.1f} MB)")

# Region stats
for region, features in region_features.items():
    states_in = set()
    for f in features:
        states_in.add(FIPS_TO_ST.get(f['properties']['STATE'], '??'))
    print(f"  {region}: {sorted(states_in)}")
