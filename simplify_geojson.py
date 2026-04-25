"""
Simplify GeoJSON county boundaries using Douglas-Peucker algorithm.
Reduces file size by ~85% while preserving county shapes.
"""
import json
import os
import math

def distance_to_line(point, line_start, line_end):
    """Perpendicular distance from point to line segment."""
    x0, y0 = point
    x1, y1 = line_start
    x2, y2 = line_end
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return math.sqrt((x0 - x1)**2 + (y0 - y1)**2)
    t = max(0, min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy)))
    px = x1 + t * dx
    py = y1 + t * dy
    return math.sqrt((x0 - px)**2 + (y0 - py)**2)

def douglas_peucker(coords, epsilon):
    """Simplify a polyline using Douglas-Peucker algorithm."""
    if len(coords) <= 2:
        return coords

    # Find the point with the maximum distance
    max_dist = 0
    max_idx = 0
    for i in range(1, len(coords) - 1):
        d = distance_to_line(coords[i], coords[0], coords[-1])
        if d > max_dist:
            max_dist = d
            max_idx = i

    if max_dist > epsilon:
        left = douglas_peucker(coords[:max_idx + 1], epsilon)
        right = douglas_peucker(coords[max_idx:], epsilon)
        return left[:-1] + right
    else:
        return [coords[0], coords[-1]]

def simplify_ring(ring, epsilon):
    """Simplify a polygon ring, preserving closure."""
    simplified = douglas_peucker(ring, epsilon)
    if len(simplified) < 4:
        # Need at least 4 points for a valid polygon ring (triangle + close)
        return ring if len(ring) >= 4 else simplified
    # Ensure ring is closed
    if simplified[0] != simplified[-1]:
        simplified.append(simplified[0])
    return simplified

def simplify_geometry(geometry, epsilon):
    """Simplify a GeoJSON geometry."""
    geom_type = geometry['type']
    coords = geometry['coordinates']

    if geom_type == 'Polygon':
        new_coords = [simplify_ring(ring, epsilon) for ring in coords]
        return {'type': 'Polygon', 'coordinates': new_coords}
    elif geom_type == 'MultiPolygon':
        new_coords = []
        for polygon in coords:
            new_polygon = [simplify_ring(ring, epsilon) for ring in polygon]
            new_coords.append(new_polygon)
        return {'type': 'MultiPolygon', 'coordinates': new_coords}
    return geometry

def round_coords(geometry, decimals=3):
    """Round all coordinates to N decimal places."""
    def process(coords):
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], decimals), round(coords[1], decimals)]
        return [process(c) for c in coords]
    return {
        'type': geometry['type'],
        'coordinates': process(geometry['coordinates'])
    }

def count_points(geojson):
    total = 0
    for f in geojson['features']:
        coords = f['geometry']['coordinates']
        def count(c):
            if isinstance(c[0], (int, float)):
                return 1
            return sum(count(x) for x in c)
        total += count(coords)
    return total

DATA_DIR = r'C:\Users\Danie\Downloads\se-propane-market-map\data'

# Epsilon values tuned per region (in degrees, ~0.005 ≈ 500m)
EPSILON = 0.005

regions = ['southeast', 'northeast', 'midwest', 'west', 'south_central']

for region in regions:
    inpath = os.path.join(DATA_DIR, f'counties_{region}.geojson')
    outpath = os.path.join(DATA_DIR, f'counties_{region}_simple.geojson')

    with open(inpath) as f:
        geojson = json.load(f)

    original_points = count_points(geojson)

    for feature in geojson['features']:
        feature['geometry'] = simplify_geometry(feature['geometry'], EPSILON)
        feature['geometry'] = round_coords(feature['geometry'], 3)

    simplified_points = count_points(geojson)

    with open(outpath, 'w') as f:
        json.dump(geojson, f, separators=(',', ':'))

    size = os.path.getsize(outpath)
    print(f"{region}: {original_points:,} -> {simplified_points:,} points "
          f"({simplified_points/original_points*100:.0f}%), {size:,} bytes ({size/1024:.0f} KB)")

# Also create a full national simplified version
print("\nBuilding national simplified...")
all_features = []
for region in regions:
    path = os.path.join(DATA_DIR, f'counties_{region}_simple.geojson')
    with open(path) as f:
        data = json.load(f)
    all_features.extend(data['features'])

national = {'type': 'FeatureCollection', 'features': all_features}
nat_path = os.path.join(DATA_DIR, 'counties_national_simple.geojson')
with open(nat_path, 'w') as f:
    json.dump(national, f, separators=(',', ':'))
size = os.path.getsize(nat_path)
print(f"National: {len(all_features)} counties, {size:,} bytes ({size/1024/1024:.1f} MB)")
