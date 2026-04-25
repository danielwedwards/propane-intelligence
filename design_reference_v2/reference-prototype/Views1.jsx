// Views1.jsx — Market Map, Companies, Analytics, Executive Brief
const STATE_COUNT = { CA:38,TX:42,FL:34,NY:22,GA:28,NC:31,SC:19,AL:24,MS:26,TN:27,AR:18,LA:21,VA:25,OH:29,MI:26,IN:22,IL:26,WI:21,MN:20,IA:19,MO:22,KY:21,WV:12,PA:28,MD:14,DE:8,NJ:16,ME:14,NH:12,VT:9,MA:15,CT:12,RI:7,AZ:14,NM:11,CO:16,UT:11,NV:8,OR:12,WA:14,ID:9,MT:8,WY:6,ND:9,SD:8,NE:12,KS:13,OK:16 };

function MarketMapView({ onSelect, selected }) {
  const [filterOpen, setFilterOpen] = React.useState(true);
  const companies = window.MOCK_COMPANIES || [];

  // Rough US shape — positions clamped to a pleasing arrangement
  const positions = [
    { id: 'll',  x: 32, y: 64, r: 14, color: '#635BFF', label: 'Lampton Love' },
    { id: 'blo', x: 42, y: 60, r: 11, color: '#009966' },
    { id: 'ami', x: 50, y: 50, r: 18, color: '#1890FF' },
    { id: 'fer', x: 55, y: 44, r: 16, color: '#1890FF' },
    { id: 'che', x: 48, y: 55, r: 8, color: '#009966' },
    { id: 'bar', x: 36, y: 62, r: 8, color: '#009966' },
    { id: 'dea', x: 82, y: 28, r: 10, color: '#009966' },
    { id: 'chs', x: 42, y: 30, r: 10, color: '#C4862D' },
    { id: 'cry', x: 58, y: 36, r: 9, color: '#009966' },
    { id: 'edp', x: 80, y: 30, r: 7, color: '#AB87FF' },
    { id: 'ber', x: 48, y: 52, r: 7, color: '#009966' },
    { id: 'dav', x: 50, y: 54, r: 6, color: '#697386' },
    { id: 'dnd', x: 36, y: 64, r: 5, color: '#697386' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      {/* Filters */}
      {filterOpen && (
        <div style={{ width: 260, background: '#fff', borderRight: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>Filters</div>
            <button onClick={() => setFilterOpen(false)} style={{ border: 'none', background: 'transparent', color: '#8B97A8', cursor: 'pointer', padding: 2 }}><Icon name="x" size={14}/></button>
          </div>

          <FilterBlock title="Geography" value="Southeast" count={312} />
          <FilterBlock title="Ownership" value="All types" count={1247}>
            {[['Family','Family-owned','#009966',624],['PE','PE-backed','#AB87FF',189],['Public','Public','#1890FF',102],['Co-op','Cooperative','#C4862D',86],['Private','Private','#697386',246]].map(([k,l,c,n]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: '#425466' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#635BFF' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                <span style={{ flex: 1 }}>{l}</span>
                <span style={{ fontSize: 11, color: '#8B97A8', fontFamily: "'IBM Plex Mono'" }}>{n}</span>
              </label>
            ))}
          </FilterBlock>

          <FilterBlock title="Revenue ($M)" value="$5M–$500M">
            <RangeSlider />
          </FilterBlock>

          <FilterBlock title="Locations" value="5–200">
            <RangeSlider low={10} high={70} />
          </FilterBlock>

          <FilterBlock title="Strategic fit score" value="> 50">
            <RangeSlider low={50} high={95} tone="indigo" />
          </FilterBlock>

          <FilterBlock title="M&A signals" value="Any">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Recent signal','Leadership change','Rumored sale','Family succession'].map(t => (
                <span key={t} style={{ padding: '3px 8px', border: '1px solid #E3E8EE', borderRadius: 9999, fontSize: 11, color: '#425466', cursor: 'pointer' }}>{t}</span>
              ))}
            </div>
          </FilterBlock>

          <button style={{ width: '100%', padding: 8, border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', fontSize: 12, color: '#425466', cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>Clear all filters</button>
        </div>
      )}

      {/* Map canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapCanvas positions={positions} selected={selected} onSelect={onSelect} />

        {/* Floating filter toggle when closed */}
        {!filterOpen && (
          <button onClick={() => setFilterOpen(true)} style={{ position: 'absolute', top: 16, left: 16, padding: '7px 12px', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#0A2540', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 2px 4px rgba(10,37,64,0.06)' }}><Icon name="filter" size={13}/> Filters</button>
        )}

        {/* View toggle */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, padding: 2, boxShadow: '0 2px 4px rgba(10,37,64,0.06)' }}>
          {[['map','Map'],['list','List'],['grid','Grid']].map(([k,l]) => (
            <button key={k} style={{ padding: '5px 10px', border: 'none', background: k === 'map' ? '#EEF0FF' : 'transparent', color: k === 'map' ? '#4B45B8' : '#697386', fontSize: 12, fontWeight: 500, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>

        {/* Map legend */}
        <Card style={{ position: 'absolute', bottom: 16, left: 16, padding: 14, width: 220 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Ownership type</div>
          {[['#635BFF','Lampton Love / Ergon','1'],['#1890FF','Public','8'],['#AB87FF','PE-backed','24'],['#009966','Family','142'],['#C4862D','Cooperative','18'],['#697386','Private','54']].map(([c,l,n]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              <span style={{ flex: 1, color: '#425466' }}>{l}</span>
              <span style={{ color: '#8B97A8', fontFamily: "'IBM Plex Mono'" }}>{n}</span>
            </div>
          ))}
        </Card>

        {/* Scale bar */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, padding: '6px 10px', fontSize: 10, color: '#697386', fontFamily: "'IBM Plex Mono'", boxShadow: '0 2px 4px rgba(10,37,64,0.06)' }}>
          <div style={{ width: 60, height: 2, background: '#0A2540', marginBottom: 3 }} />
          250 mi
        </div>
      </div>
    </div>
  );
}

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

function CompanyListView({ onSelect, selected, compare, onCompare }) {
  const rows = window.MOCK_COMPANIES || [];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F6F9FC', minHeight: 0 }}>
      <div style={{ padding: '16px 28px', background: '#fff', borderBottom: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Icon name="search" size={14} color="#8B97A8" />
          <input placeholder="Search 1,247 companies…" style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Icon name="search" size={14} color="#8B97A8"/></div>
        </div>
        <Badge tone="outline">Family <Icon name="x" size={10} style={{ marginLeft: 4 }}/></Badge>
        <Badge tone="outline">Southeast <Icon name="x" size={10} style={{ marginLeft: 4 }}/></Badge>
        <Badge tone="outline">Revenue: $10M-$500M <Icon name="x" size={10} style={{ marginLeft: 4 }}/></Badge>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#697386' }}><span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{rows.length}</span> of 1,247 · Sorted by <b style={{ color: '#0A2540', fontWeight: 600 }}>Strategic fit</b></div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <CompaniesTable rows={rows} onSelect={onSelect} selected={selected} compare={compare} onCompare={onCompare} />
        </Card>
      </div>
    </div>
  );
}

function CompaniesTable({ rows, onSelect, selected, compare = [], onCompare }) {
  const fitScore = (c) => Math.max(20, Math.min(95, (c.total || 0) * 2 + 30 - (c.rank || 0)));
  const signal = (c) => ['Recent','Leadership change','Rumored','Succession','—','—'][c.rank % 6];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          {['', 'Company', 'Type', 'HQ', 'Locations', 'Revenue', 'EBITDA', 'Fit score', 'M&A signal', ''].map((h, i) => (
            <th key={i} style={{ padding: '11px 14px', textAlign: i > 3 && i < 9 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3, background: '#F7FAFC', borderBottom: '1px solid #E3E8EE', position: 'sticky', top: 0 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => {
          const f = fitScore(c);
          const s = signal(c);
          const isSel = selected === c.id;
          const isCmp = compare.includes(c.id);
          return (
            <tr key={c.id} onClick={() => onSelect(c.id)} style={{ borderBottom: '1px solid #EDF1F6', cursor: 'pointer', background: isSel ? '#EEF0FF' : '#fff' }}>
              <td style={{ padding: '10px 14px' }}>
                <input type="checkbox" checked={isCmp} onChange={e => { e.stopPropagation(); onCompare && onCompare(c.id); }} onClick={e => e.stopPropagation()} style={{ accentColor: '#635BFF' }} />
              </td>
              <td style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F7FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#425466', fontSize: 11, fontWeight: 600, border: '1px solid #E3E8EE' }}>{c.name.slice(0,2).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 500, color: '#0A2540' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#8B97A8' }}>{c.parent}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <Badge dot tone={c.type === 'll' ? 'indigo' : c.type === 'public' ? 'blue' : c.type === 'family' ? 'green' : c.type === 'coop' ? 'amber' : c.type === 'pe' ? 'indigo' : 'neutral'}>{c.typeLabel}</Badge>
              </td>
              <td style={{ padding: '10px 14px', color: '#425466', fontSize: 12 }}>{c.states[0]}{c.states.length > 1 && <span style={{ color: '#8B97A8' }}> +{c.states.length - 1}</span>}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontVariantNumeric: 'tabular-nums' }}>{c.locs}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontVariantNumeric: 'tabular-nums' }}>${c.rev >= 1000 ? (c.rev / 1000).toFixed(1) + 'B' : c.rev.toFixed(1) + 'M'}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: '#697386', fontVariantNumeric: 'tabular-nums' }}>${(c.rev * 0.12).toFixed(1)}M</td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <div style={{ width: 60, height: 5, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${f}%`, height: '100%', background: f > 70 ? '#635BFF' : f > 40 ? '#AB87FF' : '#C1CCD6' }} />
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: '#0A2540', minWidth: 24, textAlign: 'right' }}>{f}</span>
                </div>
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                {s === '—' ? <span style={{ color: '#C1CCD6' }}>—</span> : <Badge tone={s === 'Recent' || s === 'Rumored' ? 'amber' : 'neutral'} dot>{s}</Badge>}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                <Icon name="chevronRight" size={14} color="#C1CCD6" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

Object.assign(window, { MarketMapView, CompanyListView, CompaniesTable, MapCanvas });
