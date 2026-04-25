// MapEngine.jsx — Leaflet bridge for the Market Map view
// Renders ~1,400 companies × ~9k locations as canvas circle markers,
// with optional clustering and a national county-overlap choropleth.
//
// Props:
//   companies   – array from window.MOCK_COMPANIES (already scored)
//   filters     – { ownerships:Set, states:Set, revRange:[lo,hi], locsRange:[lo,hi], fitRange:[lo,hi], search:string }
//   selectedId  – currently-selected company id (highlights its markers)
//   colorMode   – 'ownership' | 'company'
//   clusterOn   – boolean, switches between L.layerGroup and L.markerClusterGroup
//   countyOn    – boolean, lazy-loads counties_national_simple.geojson and shades counties
//   onSelect(id)– called when a marker is clicked

const LL_ID = 'll';
const LL_COLOR = '#635BFF';

// v2 design palette (matches the existing legend in Views1.jsx)
const OC = {
  ll:      '#635BFF',
  public:  '#1890FF',
  pe:      '#AB87FF',
  family:  '#009966',
  coop:    '#C4862D',
  private: '#697386',
  unknown: '#8B97A8',
};

// Stable colour for a given company id (used by colorMode === 'company')
const _companyColorCache = {};
function companyColor(id) {
  if (_companyColorCache[id]) return _companyColorCache[id];
  // Deterministic hash → HSL ring around the indigo wheel
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  const c = `hsl(${hue} 65% 50%)`;
  _companyColorCache[id] = c;
  return c;
}

function colorFor(c, mode) {
  if (c.id === LL_ID) return LL_COLOR;
  if (mode === 'company') return companyColor(c.id);
  return OC[c.ownership] || OC.unknown;
}

// Apply filters using the scoring engine helper if available, otherwise pass-through.
function filterCompanies(companies, filters, search) {
  if (!filters && !search) return companies;
  if (window.PI && typeof window.PI.applyFilters === 'function') {
    return window.PI.applyFilters(companies, filters || {}, search || '');
  }
  return companies;
}

// ------------------------------------------------------------------ component

function LeafletMap({
  companies = [],
  filters = {},
  search = '',
  selectedId = null,
  colorMode = 'ownership',
  clusterOn = false,
  countyOn = false,
  onSelect,
}) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const layerRef = React.useRef(null);          // currently mounted L.layerGroup or markerClusterGroup
  const cacheRef = React.useRef({});            // { [companyId]: [marker, …] }
  const allMarkersRef = React.useRef([]);       // flat list, one per geocoded location
  const countyLayerRef = React.useRef(null);    // L.geoJSON when countyOn is enabled
  const countyGeoRef = React.useRef(null);      // cached geojson payload
  const onSelectRef = React.useRef(onSelect);
  const colorModeRef = React.useRef(colorMode);
  const stateLabelsRef = React.useRef(null);    // small two-letter state labels layer

  // Keep the latest onSelect / colorMode in refs so cached marker handlers see them
  React.useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  React.useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);

  // ---------- 1) instantiate the map exactly once -----------------------------
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (typeof L === 'undefined') {
      console.error('[MapEngine] Leaflet (L) not loaded');
      return;
    }
    const map = L.map(containerRef.current, {
      center: [38, -96],
      zoom: 4.5,
      preferCanvas: true,
      renderer: L.canvas({ tolerance: 15 }),
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; OSM &copy; CARTO').addTo(map);

    // Faint state labels (purely cosmetic, non-interactive)
    const labels = L.layerGroup();
    [
      { n:'WA', la:47.5, lo:-120.5 }, { n:'OR', la:44.0, lo:-120.5 }, { n:'CA', la:36.7, lo:-119.5 },
      { n:'NV', la:39.0, lo:-117.0 }, { n:'ID', la:44.5, lo:-114.5 }, { n:'MT', la:47.0, lo:-110.0 },
      { n:'WY', la:43.0, lo:-107.5 }, { n:'UT', la:39.3, lo:-111.7 }, { n:'AZ', la:34.3, lo:-111.7 },
      { n:'NM', la:34.5, lo:-106.0 }, { n:'CO', la:39.0, lo:-105.5 }, { n:'ND', la:47.5, lo:-100.5 },
      { n:'SD', la:44.5, lo:-100.0 }, { n:'NE', la:41.5, lo:-99.5 }, { n:'KS', la:38.5, lo:-98.5 },
      { n:'OK', la:35.5, lo:-97.5 },  { n:'TX', la:31.5, lo:-99.5 }, { n:'MN', la:46.0, lo:-94.5 },
      { n:'IA', la:42.0, lo:-93.5 },  { n:'MO', la:38.5, lo:-92.5 }, { n:'AR', la:34.8, lo:-92.4 },
      { n:'LA', la:31.0, lo:-92.0 },  { n:'WI', la:44.5, lo:-90.0 }, { n:'IL', la:40.0, lo:-89.0 },
      { n:'MS', la:32.7, lo:-89.7 },  { n:'AL', la:32.8, lo:-86.8 }, { n:'TN', la:35.8, lo:-86.4 },
      { n:'KY', la:37.8, lo:-85.7 },  { n:'IN', la:39.9, lo:-86.3 }, { n:'MI', la:44.5, lo:-85.5 },
      { n:'OH', la:40.3, lo:-82.8 },  { n:'GA', la:32.7, lo:-83.5 }, { n:'FL', la:28.5, lo:-82.5 },
      { n:'SC', la:33.9, lo:-80.9 },  { n:'NC', la:35.5, lo:-79.8 }, { n:'VA', la:37.5, lo:-79.0 },
      { n:'WV', la:38.6, lo:-80.5 },  { n:'PA', la:40.9, lo:-77.5 }, { n:'NY', la:42.8, lo:-75.5 },
      { n:'ME', la:45.3, lo:-69.0 },  { n:'VT', la:44.0, lo:-72.7 }, { n:'NH', la:43.7, lo:-71.5 },
      { n:'MA', la:42.3, lo:-71.8 },  { n:'CT', la:41.6, lo:-72.7 }, { n:'NJ', la:40.2, lo:-74.5 },
      { n:'MD', la:39.0, lo:-76.7 },  { n:'DE', la:39.0, lo:-75.5 },
    ].forEach(s => {
      const m = L.marker([s.la, s.lo], {
        icon: L.divIcon({
          className: 'pi-state-label',
          html: '<span style="font:600 10px/1 \'IBM Plex Mono\',monospace;color:#8B97A8;letter-spacing:0.04em">' + s.n + '</span>',
          iconSize: [22, 12],
        }),
        interactive: false,
        keyboard: false,
      });
      labels.addLayer(m);
    });
    labels.addTo(map);
    stateLabelsRef.current = labels;

    map.on('click', () => {
      // Clicking empty map clears selection
      if (onSelectRef.current) onSelectRef.current(null);
    });

    mapRef.current = map;

    return () => {
      try { map.remove(); } catch (e) {}
      mapRef.current = null;
      layerRef.current = null;
      countyLayerRef.current = null;
      cacheRef.current = {};
      allMarkersRef.current = [];
    };
  }, []);

  // ---------- 2) build (or rebuild) the marker cache --------------------------
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const cache = {};
    const all = [];
    for (const c of companies) {
      const isLL = c.id === LL_ID;
      const col = colorFor(c, colorModeRef.current);
      const list = [];
      const locs = c.locations || [];
      for (const l of locs) {
        if (l == null || l.lat == null || l.lng == null) continue;
        if (!isFinite(l.lat) || !isFinite(l.lng)) continue;
        const mk = L.circleMarker([l.lat, l.lng], {
          radius: isLL ? 6 : 3.5,
          fillColor: isLL ? LL_COLOR : col,
          color: isLL ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
          weight: isLL ? 2 : 0.5,
          fillOpacity: isLL ? 1 : 0.82,
          opacity: 0.9,
          interactive: true,
          bubblingMouseEvents: false,
        });
        const tipHtml =
          '<div style="font:600 12px/1.3 Inter,system-ui,sans-serif;color:#0A2540">' +
            (c.name || '') +
          '</div>' +
          '<div style="font:400 11px/1.3 Inter;color:#425466;margin-top:2px">' +
            (l.city ? (l.city + ', ') : '') + (l.state || '') +
          '</div>' +
          '<div style="font:500 10px/1 \'IBM Plex Mono\',monospace;color:#8B97A8;margin-top:4px">' +
            'Click to view profile' +
          '</div>';
        mk.bindTooltip(tipHtml, { direction: 'top', className: 'pi-tip', opacity: 0.97, offset: [0, -4] });
        mk._cid = c.id;
        mk._st  = l.state || '';
        mk._isLL = isLL;
        mk._baseColor = isLL ? LL_COLOR : col;
        mk.on('click', (e) => {
          if (e && e.originalEvent) {
            L.DomEvent.stopPropagation(e.originalEvent);
            L.DomEvent.preventDefault(e.originalEvent);
          }
          if (onSelectRef.current) onSelectRef.current(c.id);
        });
        list.push(mk);
        all.push(mk);
      }
      cache[c.id] = list;
    }
    cacheRef.current = cache;
    allMarkersRef.current = all;

    // Re-mount the visible layer with the freshly-built markers
    mountLayer();

    // No cleanup — layer cleanup happens at unmount via map.remove() above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, colorMode]);

  // ---------- 3) recompute the visible set when filters change ---------------
  React.useEffect(() => {
    mountLayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, search, clusterOn, selectedId]);

  function mountLayer() {
    const map = mapRef.current;
    if (!map) return;

    // Decide which markers should be visible based on filters
    const visibleCompanies = filterCompanies(companies, filters, search);
    const visIds = new Set(visibleCompanies.map(c => c.id));
    // Always keep the LL anchor visible so users can see the geography
    visIds.add(LL_ID);

    const stateSet = (filters && filters.states && filters.states.size) ? filters.states : null;
    const all = allMarkersRef.current;
    const visible = [];
    for (let i = 0, n = all.length; i < n; i++) {
      const mk = all[i];
      if (!visIds.has(mk._cid)) continue;
      if (stateSet && !stateSet.has(mk._st)) continue;
      // Highlight: dim non-selected markers when something is selected
      if (selectedId && !mk._isLL && mk._cid !== selectedId) {
        mk.setStyle({ fillOpacity: 0.35, opacity: 0.35 });
      } else {
        mk.setStyle({
          fillOpacity: mk._isLL ? 1 : 0.82,
          opacity: 0.9,
          radius: (mk._cid === selectedId) ? (mk._isLL ? 6 : 5.5) : (mk._isLL ? 6 : 3.5),
        });
      }
      visible.push(mk);
    }

    // Tear down old layer
    if (layerRef.current) {
      try { map.removeLayer(layerRef.current); } catch (e) {}
      layerRef.current = null;
    }

    // Build new layer
    let layer;
    if (clusterOn && typeof L.markerClusterGroup === 'function') {
      layer = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        chunkedLoading: true,
        chunkInterval: 50,
        disableClusteringAtZoom: 10,
      });
      layer.addLayers(visible);
    } else {
      layer = L.layerGroup(visible);
    }
    layer.addTo(map);
    layerRef.current = layer;

    // Keep state labels above markers
    if (stateLabelsRef.current) {
      try {
        map.removeLayer(stateLabelsRef.current);
        stateLabelsRef.current.addTo(map);
      } catch (e) {}
    }
  }

  // ---------- 4) county overlap choropleth (lazy) -----------------------------
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Tear down on toggle-off
    if (!countyOn) {
      if (countyLayerRef.current) {
        try { map.removeLayer(countyLayerRef.current); } catch (e) {}
        countyLayerRef.current = null;
      }
      return;
    }

    // Build (or rebuild) the layer
    let cancelled = false;
    (async () => {
      let geo = countyGeoRef.current;
      if (!geo) {
        try {
          const res = await fetch('data/counties_national_simple.geojson', { cache: 'force-cache' });
          if (!res.ok) throw new Error('counties_national_simple.geojson ' + res.status);
          geo = await res.json();
          countyGeoRef.current = geo;
        } catch (err) {
          console.warn('[MapEngine] county overlay fetch failed', err);
          return;
        }
      }
      if (cancelled) return;

      // Build a per-FIPS overlap count: how many non-anchor operators share each LL county.
      const counts = new Map();
      let maxCount = 0;
      for (const c of companies) {
        if (c.id === LL_ID) continue;
        const overlap = c.countyShared;
        if (!overlap || !overlap.sharedCounties) continue;
        for (const f of overlap.sharedCounties) {
          const next = (counts.get(f) || 0) + 1;
          counts.set(f, next);
          if (next > maxCount) maxCount = next;
        }
      }

      // Anchor (LL) county set — its sharedCounties row from computeCountyOverlap
      // is populated with all LL-owned FIPS (see scoring.js line 149).
      const ll = companies.find(c => c.id === LL_ID);
      const llFips = new Set((ll && ll.countyShared && ll.countyShared.sharedCounties) || []);

      // Indigo ramp tied to overlap intensity
      function shade(n) {
        if (!n) return null;
        const t = Math.min(1, n / Math.max(4, maxCount));
        const a = 0.18 + t * 0.45;          // 0.18 → 0.63
        return { fillColor: '#635BFF', fillOpacity: a, weight: 0.4, color: '#635BFF', opacity: 0.6 };
      }

      const layer = L.geoJSON(geo, {
        style: (f) => {
          const fips = f.id || (f.properties && (f.properties.GEOID || f.properties.fips));
          if (!fips) return { fillOpacity: 0, weight: 0 };
          const isLLOwn = llFips.has(fips);
          if (isLLOwn) {
            return { fillColor: '#7C5CFC', fillOpacity: 0.55, weight: 0.6, color: '#4B45B8', opacity: 0.9 };
          }
          const s = shade(counts.get(fips));
          if (s) return s;
          return { fillColor: 'transparent', fillOpacity: 0, weight: 0.25, color: '#E3E8EE', opacity: 0.4 };
        },
        interactive: false,
      });

      if (cancelled) return;
      // Insert beneath markers
      if (countyLayerRef.current) {
        try { map.removeLayer(countyLayerRef.current); } catch (e) {}
      }
      layer.addTo(map);
      countyLayerRef.current = layer;
      // Push markers back on top
      if (layerRef.current) {
        try { map.removeLayer(layerRef.current); layerRef.current.addTo(map); } catch (e) {}
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countyOn, companies]);

  // ---------- 5) selection: pan to selected --------------------------------
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const list = cacheRef.current[selectedId];
    if (!list || !list.length) return;
    if (list.length === 1) {
      map.panTo(list[0].getLatLng(), { animate: true });
    } else {
      const bounds = L.latLngBounds(list.map(m => m.getLatLng()));
      try { map.fitBounds(bounds, { padding: [60, 60], maxZoom: 9 }); } catch (e) {}
    }
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 0, background: '#F7FAFC' }}
    />
  );
}

window.LeafletMap = LeafletMap;
window.PI_OC = OC;
window.PI_LL_COLOR = LL_COLOR;
window.PI_LL_ID = LL_ID;
