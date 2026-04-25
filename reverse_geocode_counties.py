"""
Assign county names to all company locations using the GeoJSON county polygons.
Uses point-in-polygon test against county boundaries.
"""
import json
import os

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

# Load companies
with open(os.path.join(DATA_DIR, 'companies.json')) as f:
    companies = json.load(f)

# Load national county GeoJSON (simplified is fine for point-in-polygon)
with open(os.path.join(DATA_DIR, 'counties_national_simple.geojson')) as f:
    geojson = json.load(f)

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

def point_in_polygon(x, y, polygon):
    """Ray casting algorithm for point-in-polygon test."""
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside

def point_in_feature(lng, lat, feature):
    """Test if a point is inside a GeoJSON feature."""
    geom = feature['geometry']
    coords = geom['coordinates']

    if geom['type'] == 'Polygon':
        # First ring is outer boundary
        return point_in_polygon(lng, lat, coords[0])
    elif geom['type'] == 'MultiPolygon':
        for polygon in coords:
            if point_in_polygon(lng, lat, polygon[0]):
                return True
    return False

# Build spatial index: bucket features by approximate lat/lng grid
print("Building spatial index...")
GRID_SIZE = 1.0  # 1 degree grid cells
grid = {}
for feature in geojson['features']:
    # Get bounding box
    coords = feature['geometry']['coordinates']
    def get_all_points(c):
        if isinstance(c[0], (int, float)):
            return [c]
        result = []
        for item in c:
            result.extend(get_all_points(item))
        return result

    points = get_all_points(coords)
    lngs = [p[0] for p in points]
    lats = [p[1] for p in points]
    min_lng, max_lng = min(lngs), max(lngs)
    min_lat, max_lat = min(lats), max(lats)

    # Add to all grid cells the bbox overlaps
    for grid_lng in range(int(min_lng // GRID_SIZE), int(max_lng // GRID_SIZE) + 1):
        for grid_lat in range(int(min_lat // GRID_SIZE), int(max_lat // GRID_SIZE) + 1):
            key = (grid_lng, grid_lat)
            if key not in grid:
                grid[key] = []
            grid[key].append(feature)

print(f"Grid cells: {len(grid)}")

def find_county(lat, lng):
    """Find county for a lat/lng point."""
    key = (int(lng // GRID_SIZE), int(lat // GRID_SIZE))
    candidates = grid.get(key, [])
    for feature in candidates:
        if point_in_feature(lng, lat, feature):
            name = feature['properties']['NAME']
            lsad = feature['properties'].get('LSAD', 'County')
            state = FIPS_TO_ST.get(feature['properties']['STATE'], '??')
            # Format as "Name County, ST"
            lsad_name = {
                '00': '', '03': 'city and borough', '04': 'Borough',
                '05': 'Census Area', '06': 'County', '07': 'District',
                '10': 'Island', '12': 'Municipality', '13': 'Municipio',
                '15': 'Parish', '25': 'city'
            }.get(lsad, 'County')
            return f"{name} {lsad_name}, {state}".strip()
    return None

# Process all company locations
total_locs = 0
already_had = 0
newly_assigned = 0
not_found = 0

for company in companies:
    for loc in company.get('locations', []):
        total_locs += 1
        if loc.get('county', '').strip():
            already_had += 1
            continue

        lat = loc.get('lat')
        lng = loc.get('lng')
        if lat and lng:
            county = find_county(lat, lng)
            if county:
                loc['county'] = county
                newly_assigned += 1
            else:
                not_found += 1
        else:
            not_found += 1

print(f"\n=== Results ===")
print(f"Total locations: {total_locs}")
print(f"Already had county: {already_had}")
print(f"Newly assigned: {newly_assigned}")
print(f"Not found: {not_found}")

# Save updated companies
with open(os.path.join(DATA_DIR, 'companies.json'), 'w') as f:
    json.dump(companies, f, separators=(',', ':'))
print(f"\nSaved updated companies.json")

# Show some examples
print("\n=== Sample Assignments ===")
count = 0
for company in companies[:10]:
    for loc in company.get('locations', [])[:3]:
        if loc.get('county'):
            print(f"  {company['name']} - {loc['city']}, {loc['state']}: {loc['county']}")
            count += 1
            if count >= 15:
                break
    if count >= 15:
        break
