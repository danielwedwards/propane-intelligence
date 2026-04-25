// Views1.jsx — Market Map, Companies, Analytics, Executive Brief
const STATE_COUNT = { CA:38,TX:42,FL:34,NY:22,GA:28,NC:31,SC:19,AL:24,MS:26,TN:27,AR:18,LA:21,VA:25,OH:29,MI:26,IN:22,IL:26,WI:21,MN:20,IA:19,MO:22,KY:21,WV:12,PA:28,MD:14,DE:8,NJ:16,ME:14,NH:12,VT:9,MA:15,CT:12,RI:7,AZ:14,NM:11,CO:16,UT:11,NV:8,OR:12,WA:14,ID:9,MT:8,WY:6,ND:9,SD:8,NE:12,KS:13,OK:16 };

// Live-from-data labels — match the order of the legend chips.
const OWNERSHIP_TYPES = [
  { k: 'family',  label: 'Family-owned', color: '#009966' },
  { k: 'pe',      label: 'PE-backed',    color: '#AB87FF' },
  { k: 'public',  label: 'Public',       color: '#1890FF' },
  { k: 'coop',    label: 'Cooperative',  color: '#C4862D' },
  { k: 'private', label: 'Private',      color: '#697386' },
];

function MarketMapView({ onSelect, selected }) {
  const [filterOpen, setFilterOpen] = React.useState(true);
  const companies = window.MOCK_COMPANIES || [];

  // ----- controlled filter state -------------------------------------------
  const [ownership, setOwnership] = React.useState(() => new Set()); // empty = all
  const [states, setStates]       = React.useState(() => new Set()); // empty = all
  const [search, setSearch]       = React.useState('');
  const [revRange, setRevRange]   = React.useState([0, 5000]);   // $M
  const [locRange, setLocRange]   = React.useState([0, 5000]);
  const [fitRange, setFitRange]   = React.useState([0, 100]);
  const [region, setRegion]       = React.useState('all');

  const [colorMode, setColorMode] = React.useState('ownership'); // 'ownership' | 'company'
  const [clusterOn, setClusterOn] = React.useState(false);
  const [countyMode, setCountyMode] = React.useState('off'); // off | overlap | gallons | customers | percapita

  // ----- live counts for legend / filter chips ----------------------------
  const ownershipCounts = React.useMemo(() => {
    const counts = {};
    for (const c of companies) counts[c.ownership] = (counts[c.ownership] || 0) + 1;
    return counts;
  }, [companies]);

  // Per-state company counts (counts each state a company operates in).
  const stateCounts = React.useMemo(() => {
    const counts = {};
    for (const c of companies) {
      const sts = (c.states && c.states.length) ? c.states : (c.hqState ? [c.hqState] : []);
      const seen = new Set();
      for (const s of sts) {
        if (!s || seen.has(s)) continue;
        seen.add(s);
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return counts;
  }, [companies]);

  const filters = React.useMemo(() => ({
    ownership: ownership.size ? ownership : null,
    states: states.size ? states : null,
    region,
    revRange: revRange[0] === 0 && revRange[1] === 5000 ? null : revRange,
    locRange: locRange[0] === 0 && locRange[1] === 5000 ? null : locRange,
    fitRange: fitRange[0] === 0 && fitRange[1] === 100 ? null : fitRange,
    hideExcluded: true,
  }), [ownership, states, region, revRange, locRange, fitRange]);

  const toggleOwnership = (k) => {
    setOwnership(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  const toggleState = (s) => {
    setStates(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const visibleCount = React.useMemo(() => {
    if (window.PI && typeof window.PI.applyFilters === 'function') {
      return window.PI.applyFilters(companies, filters, search).length;
    }
    return companies.length;
  }, [companies, filters, search]);

  const clearAll = () => {
    setOwnership(new Set());
    setStates(new Set());
    setSearch('');
    setRevRange([0, 5000]);
    setLocRange([0, 5000]);
    setFitRange([0, 100]);
    setRegion('all');
  };

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      {/* Filters */}
      {filterOpen && (
        <div style={{ width: 260, background: '#fff', borderRight: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>Filters</div>
            <button onClick={() => setFilterOpen(false)} style={{ border: 'none', background: 'transparent', color: '#8B97A8', cursor: 'pointer', padding: 2 }}><Icon name="x" size={14}/></button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies, cities, people…"
              style={{ width: '100%', padding: '7px 12px 7px 30px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Icon name="search" size={13} color="#8B97A8"/>
            </div>
          </div>

          <FilterBlock title="Region" value={region === 'all' ? 'All US' : region}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[['all','All'],['southeast','Southeast'],['midwest','Midwest'],['northeast','Northeast'],['south_central','S. Central'],['west','West']].map(([k,l]) => (
                <button key={k} onClick={() => setRegion(k)} style={{
                  padding: '3px 9px', border: '1px solid ' + (region === k ? '#635BFF' : '#E3E8EE'),
                  background: region === k ? '#EEF0FF' : '#fff',
                  color: region === k ? '#4B45B8' : '#425466',
                  borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>{l}</button>
              ))}
            </div>
          </FilterBlock>

          <FilterBlock title="State" value={states.size ? `${states.size} selected` : 'All states'}>
            <StatePicker stateCounts={stateCounts} selected={states} onToggle={toggleState} onClear={() => setStates(new Set())} />
          </FilterBlock>

          <FilterBlock title="Ownership" value={ownership.size ? `${ownership.size} selected` : 'All types'} count={companies.length}>
            {OWNERSHIP_TYPES.map(t => {
              const checked = ownership.size === 0 || ownership.has(t.k);
              const n = ownershipCounts[t.k] || 0;
              return (
                <label key={t.k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: '#425466', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleOwnership(t.k)} style={{ accentColor: '#635BFF' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                  <span style={{ flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: '#8B97A8', fontFamily: "'IBM Plex Mono'" }}>{n}</span>
                </label>
              );
            })}
          </FilterBlock>

          <FilterBlock title="Revenue ($M)" value={`$${revRange[0]}M–$${revRange[1] >= 5000 ? '5B+' : revRange[1]+'M'}`}>
            <DualRange min={0} max={5000} step={5} value={revRange} onChange={setRevRange} />
          </FilterBlock>

          <FilterBlock title="Locations" value={`${locRange[0]}–${locRange[1] >= 5000 ? '∞' : locRange[1]}`}>
            <DualRange min={0} max={500} step={1} value={locRange} onChange={setLocRange} />
          </FilterBlock>

          <FilterBlock title="Strategic fit score" value={`${fitRange[0]}–${fitRange[1]}`}>
            <DualRange min={0} max={100} step={1} value={fitRange} onChange={setFitRange} tone="indigo" />
          </FilterBlock>

          <button onClick={clearAll} style={{ width: '100%', padding: 8, border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', fontSize: 12, color: '#425466', cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>Clear all filters</button>

          <div style={{ marginTop: 14, fontSize: 11, color: '#8B97A8', fontFamily: "'IBM Plex Mono'" }}>
            Showing <span style={{ color: '#0A2540', fontWeight: 600 }}>{visibleCount.toLocaleString()}</span> of {companies.length.toLocaleString()}
          </div>
        </div>
      )}

      {/* Map canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {window.LeafletMap
          ? <window.LeafletMap
              companies={companies}
              filters={filters}
              search={search}
              selectedId={selected}
              colorMode={colorMode}
              clusterOn={clusterOn}
              countyMode={countyMode}
              onSelect={onSelect}
            />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8B97A8', fontSize: 12 }}>Map engine loading…</div>
        }

        {/* Floating filter toggle when closed */}
        {!filterOpen && (
          <button onClick={() => setFilterOpen(true)} style={{ position: 'absolute', top: 16, left: 16, zIndex: 500, padding: '7px 12px', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#0A2540', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 2px 4px rgba(10,37,64,0.06)' }}><Icon name="filter" size={13}/> Filters</button>
        )}

        {/* Map controls */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, padding: 2, boxShadow: '0 2px 4px rgba(10,37,64,0.06)' }}>
            {[['ownership','By owner'],['company','By company']].map(([k,l]) => (
              <button key={k} onClick={() => setColorMode(k)} style={{ padding: '5px 10px', border: 'none', background: colorMode === k ? '#EEF0FF' : 'transparent', color: colorMode === k ? '#4B45B8' : '#697386', fontSize: 12, fontWeight: 500, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, padding: 2, boxShadow: '0 2px 4px rgba(10,37,64,0.06)' }}>
            <button onClick={() => setClusterOn(v => !v)} style={{ padding: '5px 10px', border: 'none', background: clusterOn ? '#EEF0FF' : 'transparent', color: clusterOn ? '#4B45B8' : '#697386', fontSize: 12, fontWeight: 500, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>Cluster</button>
          </div>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, padding: 2, boxShadow: '0 2px 4px rgba(10,37,64,0.06)', flexWrap: 'wrap' }}>
            <span style={{ padding: '5px 8px 5px 10px', fontSize: 11, fontWeight: 500, color: '#8B97A8', alignSelf: 'center', textTransform: 'uppercase', letterSpacing: 0.4 }}>Counties</span>
            {[
              ['off',       'Off'],
              ['overlap',   'Overlap'],
              ['gallons',   'Gallons'],
              ['customers', 'Customers'],
              ['percapita', '% Use'],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setCountyMode(k)}
                title={window.PI_COUNTY_MODE_LABELS && window.PI_COUNTY_MODE_LABELS[k]}
                style={{
                  padding: '5px 10px', border: 'none',
                  background: countyMode === k ? '#EEF0FF' : 'transparent',
                  color: countyMode === k ? '#4B45B8' : '#697386',
                  fontSize: 12, fontWeight: 500, borderRadius: 4,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Map legend */}
        <Card style={{ position: 'absolute', bottom: 16, left: 16, padding: 14, width: 220, zIndex: 500 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            {colorMode === 'company' ? 'Top companies' : 'Ownership type'}
          </div>
          {colorMode === 'ownership'
            ? [
                ['#635BFF', 'Lampton Love / Ergon', 1],
                ['#1890FF', 'Public',     ownershipCounts.public  || 0],
                ['#AB87FF', 'PE-backed',  ownershipCounts.pe      || 0],
                ['#009966', 'Family',     ownershipCounts.family  || 0],
                ['#C4862D', 'Cooperative',ownershipCounts.coop    || 0],
                ['#697386', 'Private',    ownershipCounts.private || 0],
              ].map(([c, l, n]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  <span style={{ flex: 1, color: '#425466' }}>{l}</span>
                  <span style={{ color: '#8B97A8', fontFamily: "'IBM Plex Mono'" }}>{n}</span>
                </div>
              ))
            : <div style={{ fontSize: 11, color: '#697386' }}>Each company gets its own colour. Hover a marker for details.</div>
          }

          {countyMode !== 'off' && (
            <CountyLegend mode={countyMode} />
          )}
        </Card>
      </div>
    </div>
  );
}

// Two-thumb range slider with controlled state.
function DualRange({ min = 0, max = 100, step = 1, value, onChange, tone = 'neutral' }) {
  const [lo, hi] = value;
  const color = tone === 'indigo' ? '#635BFF' : '#0A2540';
  const pctLo = ((lo - min) / (max - min)) * 100;
  const pctHi = ((hi - min) / (max - min)) * 100;
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ position: 'relative', height: 18 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 4, background: '#EDF1F6', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: pctLo + '%', right: (100 - pctHi) + '%', top: 8, height: 4, background: color, borderRadius: 2 }} />
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={e => { const n = +e.target.value; if (n <= hi) onChange([n, hi]); }}
          style={dualThumbStyle} />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={e => { const n = +e.target.value; if (n >= lo) onChange([lo, n]); }}
          style={dualThumbStyle} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: "'IBM Plex Mono'", color: '#8B97A8', marginTop: 4 }}>
        <span>{lo}</span><span>{hi >= max ? `${hi}+` : hi}</span>
      </div>
    </div>
  );
}
const dualThumbStyle = {
  position: 'absolute', inset: 0, width: '100%', WebkitAppearance: 'none',
  background: 'transparent', pointerEvents: 'none', height: 18, margin: 0,
};

// One-time injection of thumb-only pointer-events so both stacked range inputs
// can be dragged independently. Inline styles cannot reach ::-webkit-slider-thumb,
// so we ship a single <style> tag and rely on it being inserted before first paint.
(function injectDualRangeCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('pi-dualrange-css')) return;
  const css = document.createElement('style');
  css.id = 'pi-dualrange-css';
  css.textContent = [
    'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #635BFF;box-shadow:0 1px 2px rgba(10,37,64,.1);cursor:pointer;margin-top:0}',
    'input[type=range]::-moz-range-thumb{pointer-events:auto;width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #635BFF;box-shadow:0 1px 2px rgba(10,37,64,.1);cursor:pointer}',
    'input[type=range]::-webkit-slider-runnable-track{background:transparent;height:18px}',
    'input[type=range]::-moz-range-track{background:transparent;height:18px}',
    /* Leaflet tooltip styling to match the v2 design */
    '.pi-tip{background:#fff !important;border:1px solid #E3E8EE !important;border-radius:6px !important;box-shadow:0 4px 12px rgba(10,37,64,.08) !important;padding:8px 10px !important;color:#0A2540 !important}',
    '.pi-tip:before{border-top-color:#fff !important}',
  ].join('\n');
  document.head.appendChild(css);
})();

function FilterBlock({ title, value, count, children }) {
  const [open, setOpen] = React.useState(!!children);
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #EDF1F6' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', marginBottom: open ? 10 : 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', flex: 1, textAlign: 'left' }}>{title}</span>
        <span style={{ fontSize: 11, color: '#8B97A8' }}>{value}{count && ` · ${count}`}</span>
      </button>
      {open && children}
    </div>
  );
}

// All 50 states + DC, alphabetical; count comes from companies that operate there.
const _US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM',
  'NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA',
  'WV','WI','WY',
];

function StatePicker({ stateCounts = {}, selected, onToggle, onClear }) {
  const [q, setQ] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);
  const ql = q.trim().toUpperCase();

  // Visible set: states that exist in data, optionally filtered by typed prefix.
  const all = _US_STATES.filter(s => (stateCounts[s] || 0) > 0);
  const filtered = ql ? all.filter(s => s.startsWith(ql)) : all;
  const shown = showAll ? filtered : filtered.slice(0, 18);
  const hiddenCount = filtered.length - shown.length;

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Type a state code (e.g. TX)…"
          style={{ width: '100%', padding: '6px 10px 6px 26px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }}
        />
        <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="search" size={11} color="#8B97A8"/>
        </div>
      </div>

      {selected && selected.size > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {[...selected].sort().map(s => (
            <button key={s} onClick={() => onToggle(s)} style={{
              padding: '2px 7px', border: '1px solid #635BFF', background: '#EEF0FF',
              color: '#4B45B8', borderRadius: 9999, fontSize: 10, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'IBM Plex Mono'", display: 'inline-flex',
              alignItems: 'center', gap: 4,
            }}>
              {s}
              <Icon name="x" size={9} color="#4B45B8"/>
            </button>
          ))}
          {selected.size > 1 && (
            <button onClick={onClear} style={{ padding: '2px 7px', border: 'none', background: 'transparent', color: '#8B97A8', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
        {shown.map(s => {
          const on = selected.has(s);
          const n = stateCounts[s] || 0;
          return (
            <button key={s} onClick={() => onToggle(s)} title={`${s} · ${n} companies`} style={{
              padding: '4px 0', border: '1px solid ' + (on ? '#635BFF' : '#E3E8EE'),
              background: on ? '#EEF0FF' : '#fff',
              color: on ? '#4B45B8' : '#425466',
              borderRadius: 4, fontSize: 10, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'IBM Plex Mono'",
              display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1,
            }}>
              <span>{s}</span>
              <span style={{ fontSize: 8, color: on ? '#635BFF' : '#8B97A8', fontWeight: 500, marginTop: 1 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <button onClick={() => setShowAll(true)} style={{ marginTop: 8, padding: '4px 8px', border: 'none', background: 'transparent', color: '#635BFF', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Show {hiddenCount} more
        </button>
      )}
      {showAll && filtered.length > 18 && (
        <button onClick={() => setShowAll(false)} style={{ marginTop: 8, padding: '4px 8px', border: 'none', background: 'transparent', color: '#8B97A8', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Show fewer
        </button>
      )}
      {filtered.length === 0 && (
        <div style={{ padding: '8px 4px', fontSize: 11, color: '#8B97A8' }}>No states match "{q}".</div>
      )}
    </div>
  );
}

// Renders the gradient swatch + labels for the active county-mode.
function CountyLegend({ mode }) {
  if (mode === 'off') return null;
  const isOverlap = mode === 'overlap';
  const ramp = isOverlap
    ? ['rgba(99,91,255,0.18)', 'rgba(99,91,255,0.35)', 'rgba(99,91,255,0.50)', 'rgba(99,91,255,0.63)']
    : ['#EEF0FF', '#A1A6FF', '#635BFF', '#4B45B8'];
  const label = (window.PI_COUNTY_MODE_LABELS && window.PI_COUNTY_MODE_LABELS[mode]) || mode;
  const lowLbl = mode === 'gallons' ? 'low' : mode === 'customers' ? 'few' : mode === 'percapita' ? '0%' : '1';
  const highLbl = mode === 'gallons' ? '12M+ gal' : mode === 'customers' ? '500k+' : mode === 'percapita' ? '90%+' : '20+';
  const llSwatchColor = isOverlap ? '#7C5CFC' : '#FFD100';
  const llLabel = isOverlap ? 'LL counties' : 'LL counties (overlay)';
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #EDF1F6' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
        Counties · {label}
      </div>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
        {ramp.map((c, i) => (
          <div key={i} style={{ flex: 1, background: c }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: "'IBM Plex Mono'", color: '#8B97A8' }}>
        <span>{lowLbl}</span>
        <span>{highLbl}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
        <div style={{ width: 10, height: 10, background: llSwatchColor, borderRadius: 2, border: '1px solid rgba(10,37,64,0.15)' }}/>
        <span style={{ color: '#425466' }}>{llLabel}</span>
      </div>
    </div>
  );
}

function RangeSlider({ low = 20, high = 80, tone = 'neutral' }) {
  const color = tone === 'indigo' ? '#635BFF' : '#0A2540';
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ height: 4, background: '#EDF1F6', borderRadius: 2, position: 'relative' }}>
        <div style={{ position: 'absolute', left: `${low}%`, right: `${100-high}%`, top: 0, bottom: 0, background: color, borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: `${low}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: `2px solid ${color}`, boxShadow: '0 1px 2px rgba(10,37,64,0.1)' }}/>
        <div style={{ position: 'absolute', left: `${high}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: `2px solid ${color}`, boxShadow: '0 1px 2px rgba(10,37,64,0.1)' }}/>
      </div>
    </div>
  );
}

function MapCanvas({ positions, selected, onSelect }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <pattern id="rmapgrid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#E3E8EE" strokeWidth="0.15"/>
        </pattern>
        <radialGradient id="rmapbg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F7FAFC"/>
          <stop offset="100%" stopColor="#EDF1F6"/>
        </radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="1"/></filter>
      </defs>
      <rect width="100" height="100" fill="url(#rmapbg)"/>
      <rect width="100" height="100" fill="url(#rmapgrid)"/>

      {/* US outline — stylized */}
      <path d="M 12 28 Q 18 22 30 24 Q 45 23 60 26 Q 75 28 88 32 Q 94 38 92 48 Q 90 58 82 66 Q 75 72 65 72 L 55 74 Q 40 76 28 72 Q 16 66 10 56 Q 6 42 12 28 Z" fill="#fff" stroke="#C1CCD6" strokeWidth="0.25"/>

      {/* State lines hint */}
      <g stroke="#E3E8EE" strokeWidth="0.12" fill="none">
        <path d="M 20 28 L 22 60"/><path d="M 35 24 L 36 72"/>
        <path d="M 50 24 L 51 74"/><path d="M 65 28 L 66 72"/>
        <path d="M 80 30 L 82 68"/>
        <path d="M 12 40 L 92 42"/><path d="M 14 55 L 88 56"/>
      </g>

      {/* Markers */}
      {positions.map((p, i) => (
        <g key={p.id} transform={`translate(${p.x} ${p.y})`} onClick={() => onSelect && onSelect(p.id)} style={{ cursor: 'pointer' }}>
          {selected === p.id && <circle r={p.r / 10 + 2} fill="none" stroke={p.color} strokeWidth="0.25" opacity="0.4"/>}
          {p.label && <circle r={p.r / 10 + 0.8} fill={p.color} opacity="0.15" filter="url(#glow)"/>}
          <circle r={p.r / 10} fill={p.color} stroke="#fff" strokeWidth="0.3"/>
          {p.label && <text y={-p.r/10 - 1.2} textAnchor="middle" fontSize="1.5" fontWeight="600" fill="#0A2540">{p.label}</text>}
        </g>
      ))}

      {/* Cluster bubbles */}
      <g transform="translate(70 38)">
        <circle r="3" fill="#635BFF" fillOpacity="0.12" stroke="#635BFF" strokeWidth="0.2"/>
        <text textAnchor="middle" dy="0.6" fontSize="1.8" fontWeight="600" fill="#4B45B8">24</text>
      </g>
      <g transform="translate(26 50)">
        <circle r="3.5" fill="#635BFF" fillOpacity="0.12" stroke="#635BFF" strokeWidth="0.2"/>
        <text textAnchor="middle" dy="0.6" fontSize="1.8" fontWeight="600" fill="#4B45B8">38</text>
      </g>
    </svg>
  );
}

// ---------------------------- Companies List View -----------------------

function fmtMoney(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'B';
  if (v >= 100)  return '$' + Math.round(v) + 'M';
  return '$' + v.toFixed(1) + 'M';
}
function fmtInt(v) {
  if (v == null || isNaN(v)) return '—';
  return v.toLocaleString();
}

const TYPE_TONE = {
  ll: 'indigo', public: 'blue', family: 'green', coop: 'amber', pe: 'indigo', private: 'neutral',
};

function CompanyListView({ onSelect, selected, compare = [], onCompare }) {
  const rows = window.MOCK_COMPANIES || [];
  const [statePickerOpen, setStatePickerOpen] = React.useState(false);
  const statePickerRef = React.useRef(null);
  React.useEffect(() => {
    if (!statePickerOpen) return;
    const onDoc = (e) => { if (statePickerRef.current && !statePickerRef.current.contains(e.target)) setStatePickerOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [statePickerOpen]);

  // ----- filter state -----
  const [search, setSearch]       = React.useState('');
  const [ownership, setOwnership] = React.useState(() => new Set());
  const [statesSel, setStatesSel] = React.useState(() => new Set());
  const [region, setRegion]       = React.useState('all');
  const [sortCol, setSortCol]     = React.useState('fitScore');
  const [sortDir, setSortDir]     = React.useState('desc');
  const [pageSize, setPageSize]   = React.useState(200);

  const filters = React.useMemo(() => ({
    ownership: ownership.size ? ownership : null,
    states: statesSel.size ? statesSel : null,
    region,
    hideExcluded: true,
  }), [ownership, statesSel, region]);

  // Filter via the shared engine (same filter as the map for parity).
  const filtered = React.useMemo(() => {
    if (window.PI && typeof window.PI.applyFilters === 'function') {
      return window.PI.applyFilters(rows, filters, search);
    }
    return rows;
  }, [rows, filters, search]);

  // Sort the filtered list.
  const sorted = React.useMemo(() => {
    const out = filtered.slice();
    const dir = sortDir === 'desc' ? -1 : 1;
    const get = (c) => {
      switch (sortCol) {
        case 'name': return (c.name || '').toLowerCase();
        case 'type': return c.ownership || '';
        case 'hq':   return (c.hqState || '') + ' ' + (c.hqCity || '');
        case 'locs': return (c.locations || []).length || c.totalLocs || 0;
        case 'rev':  return c.estRevenue == null ? -Infinity : c.estRevenue;
        case 'emp':  return c.employeeCount == null ? -Infinity : c.employeeCount;
        case 'states': return (c.states || []).length;
        case 'mkt':  return (c.marketShare && c.marketShare.nationalPct) || 0;
        case 'prox': return (c.proxScore && c.proxScore.mean != null) ? -c.proxScore.mean : -Infinity;
        case 'county': return (c.countyShared && c.countyShared.count) || 0;
        case 'fitScore':
        default:     return c.fitScore != null ? c.fitScore : -1;
      }
    };
    out.sort((a, b) => {
      const va = get(a), vb = get(b);
      if (typeof va === 'string') return va < vb ? -dir : va > vb ? dir : 0;
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    return out;
  }, [filtered, sortCol, sortDir]);

  const visible = React.useMemo(() => sorted.slice(0, pageSize), [sorted, pageSize]);

  const setSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir((col === 'name' || col === 'type' || col === 'hq') ? 'asc' : 'desc'); }
  };

  const toggleOwnership = (k) => setOwnership(prev => {
    const next = new Set(prev); if (next.has(k)) next.delete(k); else next.add(k); return next;
  });
  const toggleStateSel = (s) => setStatesSel(prev => {
    const next = new Set(prev); if (next.has(s)) next.delete(s); else next.add(s); return next;
  });

  // Per-state company counts for the dropdown picker.
  const stateCountsList = React.useMemo(() => {
    const counts = {};
    for (const c of rows) {
      const sts = (c.states && c.states.length) ? c.states : (c.hqState ? [c.hqState] : []);
      const seen = new Set();
      for (const s of sts) {
        if (!s || seen.has(s)) continue;
        seen.add(s);
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return counts;
  }, [rows]);

  // Active-filter chips
  const chips = [];
  ownership.forEach(o => chips.push({ label: o[0].toUpperCase() + o.slice(1), clear: () => toggleOwnership(o) }));
  [...statesSel].sort().forEach(s => chips.push({ label: s, clear: () => toggleStateSel(s) }));
  if (region !== 'all') chips.push({ label: region.replace('_',' '), clear: () => setRegion('all') });
  if (search) chips.push({ label: '"' + search + '"', clear: () => setSearch('') });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F6F9FC', minHeight: 0 }}>
      <div style={{ padding: '16px 28px', background: '#fff', borderBottom: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 420 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={'Search ' + rows.length.toLocaleString() + ' companies…'}
            style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon name="search" size={14} color="#8B97A8"/>
          </div>
        </div>

        {/* Region pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all','All'],['southeast','SE'],['midwest','MW'],['northeast','NE'],['south_central','S.C'],['west','West']].map(([k,l]) => (
            <button key={k} onClick={() => setRegion(k)} style={{
              padding: '4px 9px', border: '1px solid ' + (region === k ? '#635BFF' : '#E3E8EE'),
              background: region === k ? '#EEF0FF' : '#fff',
              color: region === k ? '#4B45B8' : '#425466',
              borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>

        {/* Ownership pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {OWNERSHIP_TYPES.map(t => {
            const on = ownership.has(t.k);
            return (
              <button key={t.k} onClick={() => toggleOwnership(t.k)} style={{
                padding: '4px 9px', border: '1px solid ' + (on ? t.color : '#E3E8EE'),
                background: on ? t.color + '22' : '#fff',
                color: on ? '#0A2540' : '#425466',
                borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }}/>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* State picker dropdown */}
        <div ref={statePickerRef} style={{ position: 'relative' }}>
          <button onClick={() => setStatePickerOpen(o => !o)} style={{
            padding: '4px 9px',
            border: '1px solid ' + (statesSel.size ? '#635BFF' : '#E3E8EE'),
            background: statesSel.size ? '#EEF0FF' : '#fff',
            color: statesSel.size ? '#4B45B8' : '#425466',
            borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="map" size={11}/>
            {statesSel.size ? `${statesSel.size} state${statesSel.size > 1 ? 's' : ''}` : 'States'}
            <span style={{ fontSize: 9, marginLeft: 2 }}>▾</span>
          </button>
          {statePickerOpen && (
            <div style={{ position: 'absolute', top: 30, left: 0, zIndex: 50, width: 280, background: '#fff', border: '1px solid #E3E8EE', borderRadius: 8, boxShadow: '0 8px 20px rgba(10,37,64,0.15)', padding: 12 }}>
              <StatePicker
                stateCounts={stateCountsList}
                selected={statesSel}
                onToggle={toggleStateSel}
                onClear={() => setStatesSel(new Set())}
              />
            </div>
          )}
        </div>

        {chips.length > 0 && chips.map((ch, i) => (
          <Badge key={i} tone="outline" style={{ cursor: 'pointer' }}>
            {ch.label}
            <button onClick={ch.clear} style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 4, padding: 0, color: '#8B97A8' }}>
              <Icon name="x" size={10}/>
            </button>
          </Badge>
        ))}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#697386' }}>
          <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{visible.length.toLocaleString()}</span>
          {' of '}
          <span style={{ fontFamily: "'IBM Plex Mono'" }}>{sorted.length.toLocaleString()}</span>
          {sorted.length < rows.length && <span style={{ color: '#8B97A8' }}> · {rows.length.toLocaleString()} total</span>}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <CompaniesTable
            rows={visible}
            sortCol={sortCol} sortDir={sortDir} onSort={setSort}
            onSelect={onSelect} selected={selected}
            compare={compare} onCompare={onCompare}
          />
          {sorted.length > visible.length && (
            <div style={{ padding: '14px 18px', borderTop: '1px solid #EDF1F6', textAlign: 'center', background: '#F7FAFC' }}>
              <button
                onClick={() => setPageSize(s => s + 500)}
                style={{ padding: '7px 16px', border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', fontSize: 12, color: '#425466', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Show next 500 ({(sorted.length - visible.length).toLocaleString()} hidden)
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SortableTH({ id, label, align, sortCol, sortDir, onSort }) {
  const active = sortCol === id;
  return (
    <th
      onClick={() => onSort(id)}
      style={{
        padding: '11px 14px',
        textAlign: align || 'left',
        fontSize: 11, fontWeight: 600,
        color: active ? '#0A2540' : '#697386',
        textTransform: 'uppercase', letterSpacing: 0.3,
        background: '#F7FAFC', borderBottom: '1px solid #E3E8EE',
        position: 'sticky', top: 0, cursor: 'pointer', userSelect: 'none',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active && <Icon name={sortDir === 'desc' ? 'arrowDown' : 'arrowUp'} size={11} color="#635BFF" stroke={2.5} />}
      </span>
    </th>
  );
}

function CompaniesTable({ rows, sortCol, sortDir, onSort, onSelect, selected, compare = [], onCompare }) {
  const _onSort = onSort || (() => {});
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ padding: '11px 14px', background: '#F7FAFC', borderBottom: '1px solid #E3E8EE', position: 'sticky', top: 0, width: 32 }}/>
          <SortableTH id="name"     label="Company"   sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="type"     label="Type"      sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="hq"       label="HQ"        sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="locs"     label="Locations" align="right" sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="rev"      label="Revenue"   align="right" sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="emp"      label="Employees" align="right" sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="county"   label="Shared cnty" align="right" sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="prox"     label="Avg dist (mi)" align="right" sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="mkt"      label="Mkt share %" align="right" sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <SortableTH id="fitScore" label="Fit"        align="right" sortCol={sortCol} sortDir={sortDir} onSort={_onSort}/>
          <th style={{ padding: '11px 14px', background: '#F7FAFC', borderBottom: '1px solid #E3E8EE', position: 'sticky', top: 0, width: 32 }}/>
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => {
          const f      = c.fitScore != null ? c.fitScore : null;
          const locs   = (c.locations || []).length || c.totalLocs || 0;
          const sharedC= (c.countyShared && c.countyShared.count) || 0;
          const dist   = (c.proxScore && c.proxScore.mean != null) ? c.proxScore.mean : null;
          const mkt    = (c.marketShare && c.marketShare.nationalPct) || 0;
          const isSel  = selected === c.id;
          const isCmp  = compare.includes(c.id);
          const tone   = TYPE_TONE[c.ownership] || 'neutral';
          return (
            <tr key={c.id} onClick={() => onSelect && onSelect(c.id)} style={{ borderBottom: '1px solid #EDF1F6', cursor: 'pointer', background: isSel ? '#EEF0FF' : '#fff' }}>
              <td style={{ padding: '10px 14px' }}>
                <input type="checkbox" checked={isCmp}
                  onChange={e => { e.stopPropagation(); onCompare && onCompare(c.id); }}
                  onClick={e => e.stopPropagation()}
                  style={{ accentColor: '#635BFF' }}/>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F7FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#425466', fontSize: 11, fontWeight: 600, border: '1px solid #E3E8EE' }}>
                    {(c.name || '').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: '#0A2540' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#8B97A8' }}>{c.parent || c.parentGroup || '—'}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <Badge dot tone={tone}>{c.typeLabel || c.ownership}</Badge>
              </td>
              <td style={{ padding: '10px 14px', color: '#425466', fontSize: 12 }}>
                {c.hqCity ? c.hqCity + ', ' : ''}{c.hqState || (c.states || [])[0] || '—'}
                {(c.states || []).length > 1 && (
                  <span style={{ color: '#8B97A8' }}> · +{c.states.length - 1}</span>
                )}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: '#0A2540' }}>{fmtInt(locs)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: c.estRevenue == null ? '#C1CCD6' : '#0A2540' }}>{fmtMoney(c.estRevenue)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: c.employeeCount == null ? '#C1CCD6' : '#697386' }}>{fmtInt(c.employeeCount)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: sharedC > 0 ? '#0A2540' : '#C1CCD6' }}>{sharedC || '—'}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: dist == null ? '#C1CCD6' : '#697386' }}>{dist == null ? '—' : Math.round(dist)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: mkt > 0.01 ? '#1890FF' : '#C1CCD6' }}>{mkt > 0.001 ? mkt.toFixed(2) : '—'}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                {f == null ? <span style={{ color: '#C1CCD6' }}>—</span> : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <div style={{ width: 50, height: 5, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: f + '%', height: '100%', background: f > 70 ? '#635BFF' : f > 40 ? '#AB87FF' : '#C1CCD6' }} />
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: '#0A2540', minWidth: 22, textAlign: 'right' }}>{f}</span>
                  </div>
                )}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                <Icon name="chevronRight" size={14} color="#C1CCD6"/>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

Object.assign(window, { MarketMapView, CompanyListView, CompaniesTable, MapCanvas });
