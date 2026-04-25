"""
Update index.html to:
1. Load DATA, CD, GEO from external JSON files instead of inline
2. Expand FIPS_TO_ST to all 50 states
3. Expand SE_STATES to support region-based filtering
4. Update CONFIG center/zoom for national view
5. Add region selector UI
"""
import re

INPUT = r'C:\Users\Danie\Downloads\se-propane-market-map\index.html'
OUTPUT = r'C:\Users\Danie\Downloads\se-propane-market-map\index.html'

with open(INPUT, 'r', encoding='utf-8') as f:
    html = f.read()

lines = html.split('\n')
print(f"Original: {len(lines)} lines, {len(html):,} chars")

# ─── Step 1: Replace inline DATA, CD, GEO with async fetch ───
# Find the line numbers for DATA, CD, GEO declarations
data_line = None
cd_line = None
geo_line = None
validation_line = None

for i, line in enumerate(lines):
    if line.startswith('const DATA=['):
        data_line = i
    elif line.startswith('const CD=['):
        cd_line = i
    elif line.startswith('const GEO={'):
        geo_line = i
    elif line.startswith('if(!DATA||'):
        validation_line = i

print(f"DATA at line {data_line+1}, CD at line {cd_line+1}, GEO at line {geo_line+1}")
print(f"Validation at line {validation_line+1}")

# Replace DATA line with placeholder
lines[data_line] = 'let DATA=[];  // Loaded from data/companies.json'
lines[cd_line] = 'let CD=[];  // Loaded from data/counties_national.json'
lines[geo_line] = 'let GEO={"type":"FeatureCollection","features":[]};  // Loaded from data/counties_southeast_simple.geojson'

# Remove the inline validation (we'll add it to the async loader)
lines[validation_line] = '// Data validation moved to async loader'

# ─── Step 2: Update FIPS_TO_ST to all 50 states ───
for i, line in enumerate(lines):
    if line.startswith("const FIPS_TO_ST="):
        lines[i] = (
            "const FIPS_TO_ST={'01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC',"
            "'12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',"
            "'24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ',"
            "'35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',"
            "'47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'};"
        )
        print(f"Updated FIPS_TO_ST at line {i+1}")
        break

# ─── Step 3: Update SE_STATES to ALL_STATES and add region definitions ───
for i, line in enumerate(lines):
    if line.startswith("const SE_STATES="):
        lines[i] = (
            "const SE_STATES=['MS','AL','LA','TN','AR','GA','SC','NC','VA','FL','KY'];\n"
            "const ALL_STATES=['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];\n"
            "const REGIONS={southeast:['AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA'],northeast:['CT','DE','DC','ME','MD','MA','NH','NJ','NY','PA','RI','VT','WV'],midwest:['IL','IN','IA','KS','MI','MN','MO','NE','ND','OH','SD','WI'],west:['AK','AZ','CA','CO','HI','ID','MT','NV','NM','OR','UT','WA','WY'],south_central:['OK','TX']};\n"
            "let activeRegion='southeast';  // Default region"
        )
        print(f"Updated SE_STATES + added regions at line {i+1}")
        break

# ─── Step 4: Add async data loader before DOMContentLoaded ───
# Find the DOMContentLoaded line
for i, line in enumerate(lines):
    if "document.addEventListener('DOMContentLoaded'" in line:
        dom_ready_line = i
        break

# Build the async loader
loader_code = """
// === ASYNC DATA LOADER ===
async function loadData() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'flex';

  try {
    const [companiesRes, countiesRes, geoRes] = await Promise.all([
      fetch('data/companies.json'),
      fetch('data/counties_national.json'),
      fetch('data/counties_southeast_simple.geojson')
    ]);

    if (!companiesRes.ok || !countiesRes.ok || !geoRes.ok) {
      throw new Error('Failed to load data files');
    }

    DATA = await companiesRes.json();
    CD = await countiesRes.json();
    GEO = await geoRes.json();

    console.log(`Loaded: ${DATA.length} companies, ${CD.length} counties, ${GEO.features.length} county polygons`);

    if (!DATA || !Array.isArray(DATA) || DATA.length === 0) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:DM Sans"><h2>Error: No company data loaded</h2></div>';
      return;
    }

    return true;
  } catch (err) {
    console.error('Data load error:', err);
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:DM Sans;flex-direction:column"><h2>Error Loading Data</h2><p>' + err.message + '</p><p>Make sure data/ directory contains companies.json, counties_national.json, and counties_southeast_simple.geojson</p></div>';
    return false;
  }
}

// Region GeoJSON loading
async function loadRegionGeo(region) {
  try {
    const res = await fetch('data/counties_' + region + '_simple.geojson');
    if (res.ok) {
      GEO = await res.json();
      console.log('Loaded ' + region + ' GeoJSON: ' + GEO.features.length + ' counties');
      return true;
    }
  } catch(e) {
    console.warn('Could not load region GeoJSON for', region, e);
  }
  return false;
}

"""

# Insert loader before DOMContentLoaded
lines.insert(dom_ready_line, loader_code)
# Update DOMContentLoaded line index (shifted by insertion)
dom_ready_line_new = dom_ready_line + loader_code.count('\n') + 1

# Now we need to wrap the DOMContentLoaded callback to call loadData() first
# Find the original callback and wrap it
for i in range(dom_ready_line_new, min(dom_ready_line_new + 5, len(lines))):
    if "document.addEventListener('DOMContentLoaded'" in lines[i]:
        # Replace with async version that loads data first
        lines[i] = lines[i].replace(
            "document.addEventListener('DOMContentLoaded',()=>{",
            "document.addEventListener('DOMContentLoaded',async()=>{\n  const dataLoaded = await loadData();\n  if (!dataLoaded) return;"
        )
        print(f"Wrapped DOMContentLoaded with async loader at line {i+1}")
        break

# ─── Step 5: Update CONFIG for better national defaults ───
for i, line in enumerate(lines):
    if line.startswith("const CONFIG="):
        # Keep existing config but update center/zoom
        lines[i] = "const CONFIG={PROX_BANDS:[{d:5,p:10},{d:15,p:7},{d:25,p:5},{d:50,p:3},{d:100,p:1}],COUNTY_R:25,DEBOUNCE:150,MAX_SAVES:20,CENTER:[38,-96],ZOOM:4.5};"
        print(f"Updated CONFIG at line {i+1}")
        break

# ─── Write output ───
new_html = '\n'.join(lines)
print(f"\nNew: {len(lines)} lines, {len(new_html):,} chars")
print(f"Size reduction: {len(html):,} -> {len(new_html):,} ({(1-len(new_html)/len(html))*100:.1f}% smaller)")

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(new_html)
print(f"Saved to {OUTPUT}")
