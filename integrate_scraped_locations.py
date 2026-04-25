"""
Integrate scraped branch locations into companies.json.
Reads location_results_batch_{0,1,2,3}.json files and adds new branches.
"""
import json
import re
import time
from urllib.parse import quote

STATE_BBOX = {
  'AL':(30.2,35.0,-88.5,-84.9),'AZ':(31.3,37.0,-114.8,-109.0),'AR':(33.0,36.5,-94.6,-89.6),
  'CA':(32.5,42.0,-124.5,-114.1),'CO':(37.0,41.0,-109.1,-102.0),'CT':(40.9,42.1,-73.8,-71.7),
  'DE':(38.4,39.9,-75.8,-74.9),'FL':(24.5,31.0,-87.7,-79.9),'GA':(30.3,35.0,-85.7,-80.7),
  'IA':(40.3,43.6,-96.7,-90.1),'ID':(42.0,49.0,-117.3,-111.0),'IL':(36.9,42.6,-91.6,-87.0),
  'IN':(37.7,41.8,-88.1,-84.7),'KS':(36.9,40.1,-102.1,-94.6),'KY':(36.4,39.2,-89.6,-81.9),
  'LA':(28.9,33.1,-94.1,-88.7),'MA':(41.2,42.9,-73.5,-69.9),'MD':(37.8,39.8,-79.5,-74.9),
  'ME':(43.0,47.5,-71.1,-66.9),'MI':(41.6,48.3,-90.5,-82.1),'MN':(43.4,49.4,-97.3,-89.4),
  'MO':(35.9,40.7,-95.8,-89.0),'MS':(30.1,35.0,-91.7,-88.0),'MT':(44.3,49.1,-116.1,-104.0),
  'NC':(33.8,36.6,-84.4,-75.4),'ND':(45.9,49.1,-104.1,-96.5),'NE':(39.9,43.1,-104.1,-95.3),
  'NH':(42.6,45.4,-72.7,-70.5),'NJ':(38.9,41.4,-75.6,-73.8),'NM':(31.3,37.0,-109.1,-103.0),
  'NV':(35.0,42.0,-120.1,-114.0),'NY':(40.4,45.1,-79.8,-71.7),'OH':(38.4,42.0,-84.9,-80.5),
  'OK':(33.6,37.1,-103.1,-94.4),'OR':(41.9,46.3,-124.6,-116.4),'PA':(39.7,42.3,-80.6,-74.6),
  'RI':(41.1,42.1,-71.9,-71.1),'SC':(32.0,35.3,-83.4,-78.5),'SD':(42.4,46.0,-104.1,-96.4),
  'TN':(34.9,36.7,-90.4,-81.6),'TX':(25.8,36.6,-106.7,-93.5),'UT':(36.9,42.1,-114.1,-109.0),
  'VA':(36.5,39.5,-83.7,-75.2),'VT':(42.7,45.1,-73.5,-71.4),'WA':(45.5,49.1,-124.9,-116.9),
  'WI':(42.4,47.1,-92.9,-86.2),'WV':(37.1,40.7,-82.7,-77.7),'WY':(40.9,45.1,-111.1,-104.0),
}
STATE_CENTROIDS = {k:((b[0]+b[1])/2, (b[2]+b[3])/2) for k,b in STATE_BBOX.items()}

def approx_coord(state, city=None):
    """Return rough coord for a city/state. Uses state centroid with small jitter."""
    import random
    if state not in STATE_CENTROIDS: return None, None
    lat, lng = STATE_CENTROIDS[state]
    # Small jitter to avoid overlap
    seed = hash((city or '', state)) % 1000
    random.seed(seed)
    lat += (random.random() - 0.5) * 0.8
    lng += (random.random() - 0.5) * 0.8
    return round(lat, 4), round(lng, 4)

def main():
    with open('data/companies.json','r',encoding='utf-8') as f:
        companies = json.load(f)
    
    id_map = {c['id']: c for c in companies}
    
    total_added = 0
    total_companies_updated = 0
    missing_batches = []
    
    for batch_num in range(4):
        path = f'data/location_results_batch_{batch_num}.json'
        try:
            with open(path,'r',encoding='utf-8') as f:
                results = json.load(f)
        except FileNotFoundError:
            missing_batches.append(batch_num)
            continue
        
        for result in results:
            cid = result['id']
            co = id_map.get(cid)
            if not co:
                print(f'  SKIP {cid}: not found in companies.json')
                continue
            
            locs_found = result.get('locations_found', [])
            if not locs_found: continue
            
            # Dedupe by (city, state) against existing locations
            existing_keys = set()
            for loc in co.get('locations', []):
                key = (loc.get('city','').lower().strip(), loc.get('state','').upper())
                if key[0] or key[1]: existing_keys.add(key)
            
            added_this_co = 0
            for new_loc in locs_found:
                city = (new_loc.get('city') or '').strip()
                state = (new_loc.get('state') or '').strip().upper()
                if not state: continue
                key = (city.lower(), state)
                if key in existing_keys: continue
                existing_keys.add(key)
                
                lat, lng = approx_coord(state, city)
                if lat is None: continue
                
                co.setdefault('locations', []).append({
                    'name': new_loc.get('name') or co['name'],
                    'city': city,
                    'state': state,
                    'county': '',
                    'lat': lat,
                    'lng': lng,
                    'address': new_loc.get('address','') or '',
                    'phone': new_loc.get('phone','') or '',
                    'source': 'website_scrape_state_approx'
                })
                added_this_co += 1
            
            if added_this_co > 0:
                total_added += added_this_co
                total_companies_updated += 1
                # Update states[] array
                all_states = sorted(set(loc.get('state') for loc in co['locations'] if loc.get('state')))
                co['states'] = all_states
                # Update seLocs to match
                co['seLocs'] = len(co['locations'])
                if 'totalLocs' in co:
                    co['totalLocs'] = len(co['locations'])
    
    # Save
    with open('data/companies.json','w',encoding='utf-8') as f:
        json.dump(companies, f, indent=2)
    
    print(f'\n=== Summary ===')
    print(f'Companies updated: {total_companies_updated}')
    print(f'New locations added: {total_added}')
    if missing_batches:
        print(f'Missing batch files: {missing_batches}')
    
    # Report new totals
    total_locs = sum(len(c.get('locations',[])) for c in companies)
    print(f'Total locations now: {total_locs}')

if __name__ == '__main__':
    main()
