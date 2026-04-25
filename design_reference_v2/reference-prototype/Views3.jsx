// Views3.jsx — Strategic Fit, Competitor Overlap, Network graph

function FitView({ onSelect }) {
  const rows = (window.MOCK_COMPANIES || []).filter(c => c.id !== 'll').slice(0, 10);
  const driver = (c, k) => {
    const seeds = { geo: 82, size: 65, ops: 72, culture: 78, financial: 70, integration: 68 };
    return Math.max(15, Math.min(95, seeds[k] - (c.rank * 3) + (c.total || 0) * 1.5));
  };

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Scoring explanation */}
        <Card padding={20} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#635BFF', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Strategic Fit Score</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.3px' }}>Weighted fit against Lampton Love platform</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#697386', lineHeight: 1.6 }}>
                A composite 0–100 score across six dimensions. Weights: Geography 25% · Size 20% · Operations 15% · Culture 15% · Financial 15% · Integration 10%.
              </p>
            </div>
            <Button variant="secondary" size="sm">Adjust weights</Button>
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Top 10 ranked targets</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge tone="outline">Southeast only</Badge>
              <Badge tone="outline">≥ 50 fit score</Badge>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7FAFC' }}>
                <th style={hStyle}>#</th>
                <th style={{ ...hStyle, textAlign: 'left' }}>Company</th>
                <th style={hStyle}>Geo</th>
                <th style={hStyle}>Size</th>
                <th style={hStyle}>Ops</th>
                <th style={hStyle}>Culture</th>
                <th style={hStyle}>Fin.</th>
                <th style={hStyle}>Integ.</th>
                <th style={{ ...hStyle, background: '#EEF0FF', color: '#4B45B8' }}>Fit score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => {
                const drivers = ['geo','size','ops','culture','financial','integration'].map(k => driver(c, k));
                const total = Math.round(drivers.reduce((a,b) => a+b, 0) / drivers.length);
                return (
                  <tr key={c.id} onClick={() => onSelect && onSelect(c.id)} style={{ borderBottom: '1px solid #EDF1F6', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 14px', color: '#8B97A8', fontFamily: "'IBM Plex Mono'", fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: '#F7FAFC', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#425466' }}>{c.name.slice(0,2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#0A2540' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#8B97A8' }}>{c.typeLabel} · {c.states[0]}{c.states.length > 1 && ` +${c.states.length-1}`}</div>
                        </div>
                      </div>
                    </td>
                    {drivers.map((d, j) => (
                      <td key={j} style={{ padding: '12px 6px', textAlign: 'center' }}>
                        <DriverPill value={Math.round(d)} />
                      </td>
                    ))}
                    <td style={{ padding: '12px 14px', textAlign: 'center', background: '#FAFAFF' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20, fontWeight: 600, color: '#0A2540', fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>{total}</span>
                        <div style={{ width: 50, height: 6, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${total}%`, height: '100%', background: '#635BFF' }}/>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Right: radar chart for top pick */}
      <div style={{ width: 320, background: '#fff', borderLeft: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Top ranked</div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0A2540' }}>{rows[0]?.name}</h3>
        <div style={{ fontSize: 12, color: '#697386', marginBottom: 16 }}>{rows[0]?.typeLabel} · {rows[0]?.locs} locations</div>

        <RadarChart data={[
          { label: 'Geography', value: driver(rows[0], 'geo') },
          { label: 'Size', value: driver(rows[0], 'size') },
          { label: 'Operations', value: driver(rows[0], 'ops') },
          { label: 'Culture', value: driver(rows[0], 'culture') },
          { label: 'Financial', value: driver(rows[0], 'financial') },
          { label: 'Integration', value: driver(rows[0], 'integration') },
        ]}/>

        <div style={{ marginTop: 16, padding: 14, background: '#F7FAFC', borderRadius: 8, border: '1px solid #EDF1F6' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>AI summary</div>
          <p style={{ margin: 0, fontSize: 12, color: '#425466', lineHeight: 1.6 }}>
            Strong geographic complement with 7-state overlap. Comparable operating margin profile suggests low integration friction. Primary risk: principal not indicated openness to exploring.
          </p>
        </div>

        <Button variant="primary" size="md" icon="briefcase" style={{ width: '100%', marginTop: 16 }}>Open full profile</Button>
      </div>
    </div>
  );
}

const hStyle = { padding: '10px 6px', fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center', borderBottom: '1px solid #E3E8EE' };

function DriverPill({ value }) {
  const color = value > 75 ? '#009966' : value > 55 ? '#635BFF' : value > 35 ? '#C4862D' : '#C1CCD6';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono'", fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ width: 32, height: 3, background: '#EDF1F6', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color }}/>
      </div>
    </div>
  );
}

function RadarChart({ data }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, v) => [cx + Math.cos(angle(i)) * (r * v / 100), cy + Math.sin(angle(i)) * (r * v / 100)];

  const polygon = data.map((d, i) => pt(i, d.value).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 260 }}>
      {/* Grid */}
      {[20,40,60,80,100].map(v => (
        <polygon key={v} points={data.map((_, i) => pt(i, v).join(',')).join(' ')} fill="none" stroke="#EDF1F6" strokeWidth="1"/>
      ))}
      {/* Axes */}
      {data.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#EDF1F6" strokeWidth="1"/>;
      })}
      {/* Data */}
      <polygon points={polygon} fill="#635BFF" fillOpacity="0.15" stroke="#635BFF" strokeWidth="1.5"/>
      {data.map((d, i) => {
        const [x, y] = pt(i, d.value);
        return <circle key={i} cx={x} cy={y} r="3" fill="#635BFF" stroke="#fff" strokeWidth="1.5"/>;
      })}
      {/* Labels */}
      {data.map((d, i) => {
        const [x, y] = pt(i, 118);
        return <text key={i} x={x} y={y} textAnchor="middle" fontSize="10" fontWeight="500" fill="#425466" fontFamily="Inter">{d.label}</text>;
      })}
    </svg>
  );
}

// Competitor Overlap — heatmap
function OverlapView() {
  const companies = ['AmeriGas','Ferrellgas','Blossman','Suburban','Crystal Flash','Dead River','Lampton Love','Cherry Energy'];
  const data = companies.map((_, i) => companies.map((__, j) => {
    if (i === j) return null;
    const seed = (i * 7 + j * 13 + i + j) % 100;
    return Math.round(seed * 0.9);
  }));

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#635BFF', textTransform: 'uppercase', letterSpacing: 0.6 }}>Competitor overlap</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 600, color: '#0A2540' }}>County-level service overlap</h2>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge tone="outline">Top 8 · Revenue</Badge>
            <Badge tone="outline">County overlap %</Badge>
          </div>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#697386' }}>Darker = higher overlap. Hover a cell for shared counties.</p>
      </Card>

      <Card padding={24}>
        <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${companies.length}, 1fr)`, gap: 2 }}>
          <div/>
          {companies.map(c => (
            <div key={c} style={{ fontSize: 10, fontWeight: 500, color: '#697386', textAlign: 'center', padding: '6px 4px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{c}</div>
          ))}
          {companies.map((rowLabel, i) => (
            <React.Fragment key={i}>
              <div style={{ fontSize: 12, color: '#425466', padding: '10px 12px', display: 'flex', alignItems: 'center', fontWeight: rowLabel === 'Lampton Love' ? 600 : 400 }}>{rowLabel}</div>
              {data[i].map((v, j) => (
                <div key={j} style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: v === null ? '#F7FAFC' : `rgba(99,91,255,${v / 100 * 0.8 + 0.04})`,
                  borderRadius: 4, fontSize: 11, fontWeight: 500,
                  color: v === null ? '#C1CCD6' : v > 50 ? '#fff' : '#0A2540',
                  fontFamily: "'IBM Plex Mono'", cursor: v === null ? 'default' : 'pointer',
                }}>
                  {v === null ? '—' : `${v}%`}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Color scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#697386' }}>0%</span>
          <div style={{ width: 240, height: 8, background: 'linear-gradient(90deg, rgba(99,91,255,0.05), rgba(99,91,255,0.85))', borderRadius: 4 }}/>
          <span style={{ fontSize: 11, color: '#697386' }}>100%</span>
        </div>
      </Card>

      {/* Legend + insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
        {[
          { title: 'Highest overlap', v: 'AmeriGas ↔ Ferrellgas', s: '68% county overlap · national footprints collide in 31 states', tone: 'red' },
          { title: 'Platform exposure', v: 'Lampton Love ↔ Blossman', s: '47% overlap — strongest competitive pressure in MS and AL', tone: 'amber' },
          { title: 'Whitespace', v: 'Dead River ↔ Lampton Love', s: '2% overlap — geographically disjoint, no direct conflict', tone: 'green' },
        ].map(i => (
          <Card key={i.title} padding={18}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>{i.title}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', marginBottom: 6 }}>{i.v}</div>
            <div style={{ fontSize: 12, color: '#425466', lineHeight: 1.5, marginBottom: 10 }}>{i.s}</div>
            <Badge tone={i.tone} dot>{i.tone === 'red' ? 'Direct conflict' : i.tone === 'amber' ? 'Watch closely' : 'Complementary'}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Network — Palantir-style relationship graph
function NetworkView() {
  // Hand-positioned nodes on a 1000×600 canvas
  const nodes = [
    { id: 'll',  label: 'Lampton Love', x: 500, y: 320, r: 32, color: '#635BFF', tier: 0 },
    { id: 'ergon', label: 'Ergon, Inc.', x: 500, y: 140, r: 26, color: '#0A2540', tier: 0 },
    { id: 'blo', label: 'Blossman Gas', x: 320, y: 240, r: 22, color: '#009966', tier: 1 },
    { id: 'che', label: 'Cherry Energy', x: 260, y: 380, r: 16, color: '#009966', tier: 1 },
    { id: 'bar', label: 'Barrett', x: 340, y: 460, r: 17, color: '#009966', tier: 1 },
    { id: 'ami', label: 'AmeriGas', x: 760, y: 180, r: 30, color: '#1890FF', tier: 2 },
    { id: 'ugi', label: 'UGI Corp.', x: 860, y: 80, r: 20, color: '#0A2540', tier: 2 },
    { id: 'fer', label: 'Ferrellgas', x: 720, y: 420, r: 26, color: '#1890FF', tier: 2 },
    { id: 'chs', label: 'CHS Co-op', x: 180, y: 130, r: 19, color: '#C4862D', tier: 1 },
    { id: 'crystal', label: 'Crystal Flash', x: 610, y: 90, r: 18, color: '#AB87FF', tier: 1 },
    { id: 'ares', label: 'Ares Mgmt.', x: 860, y: 500, r: 18, color: '#0A2540', tier: 2 },
    { id: 'edp', label: 'Eastern Propane', x: 770, y: 540, r: 15, color: '#AB87FF', tier: 2 },
    { id: 'dea', label: 'Dead River', x: 480, y: 540, r: 17, color: '#009966', tier: 1 },
  ];
  const edges = [
    { a: 'll', b: 'ergon', type: 'parent', label: 'parent' },
    { a: 'ami', b: 'ugi', type: 'parent', label: 'parent' },
    { a: 'edp', b: 'ares', type: 'parent', label: 'PE owner' },
    { a: 'll', b: 'blo', type: 'competitor', label: '47% overlap' },
    { a: 'll', b: 'che', type: 'competitor' },
    { a: 'll', b: 'bar', type: 'competitor' },
    { a: 'blo', b: 'che', type: 'competitor' },
    { a: 'ami', b: 'fer', type: 'competitor', label: '68% overlap' },
    { a: 'll', b: 'ami', type: 'competitor' },
    { a: 'che', b: 'crystal', type: 'target', label: 'succession signal' },
    { a: 'chs', b: 'crystal', type: 'target' },
    { a: 'dea', b: 'edp', type: 'target' },
  ];

  const nmap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edgeColor = (t) => t === 'parent' ? '#0A2540' : t === 'competitor' ? '#D83E4A' : '#635BFF';

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      {/* Left: legend + details */}
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Relationship types</div>
        {[['parent','Parent / subsidiary','#0A2540'],['competitor','Direct competitor','#D83E4A'],['target','Acquisition target','#635BFF']].map(([k,l,c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12 }}>
            <div style={{ width: 20, height: 2, background: c }}/>
            <span style={{ color: '#425466' }}>{l}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #EDF1F6', marginTop: 16, paddingTop: 16, fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Graph controls</div>
        <Button variant="secondary" size="sm" style={{ width: '100%', marginBottom: 6, justifyContent: 'flex-start' }}>Focus: Lampton Love</Button>
        <Button variant="secondary" size="sm" style={{ width: '100%', marginBottom: 6, justifyContent: 'flex-start' }}>Depth: 2 hops</Button>
        <Button variant="secondary" size="sm" style={{ width: '100%', marginBottom: 6, justifyContent: 'flex-start' }}>Layout: Force-directed</Button>
        <div style={{ borderTop: '1px solid #EDF1F6', marginTop: 16, paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Expand connections</div>
          {['Shared board members','Former executives','Financial advisors','Bolt-on history'].map(l => (
            <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: '#425466' }}>
              <input type="checkbox" style={{ accentColor: '#635BFF' }}/> {l}
            </label>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <pattern id="ngrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#EDF1F6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="1000" height="600" fill="url(#ngrid)"/>

          {/* Edges */}
          {edges.map((e, i) => {
            const a = nmap[e.a], b = nmap[e.b];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <g key={i}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={edgeColor(e.type)} strokeWidth={e.type === 'parent' ? 2 : 1.25} strokeDasharray={e.type === 'target' ? '4 3' : ''} opacity="0.55"/>
                {e.label && (
                  <g>
                    <rect x={mx - 32} y={my - 8} width="64" height="16" rx="8" fill="#fff" stroke="#E3E8EE"/>
                    <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="10" fontWeight="500" fill="#425466" fontFamily="Inter">{e.label}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`} style={{ cursor: 'pointer' }}>
              {n.id === 'll' && <circle r={n.r + 8} fill="none" stroke={n.color} strokeWidth="1.5" opacity="0.3"/>}
              <circle r={n.r} fill={n.color} stroke="#fff" strokeWidth="3"/>
              <text y="5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Inter">{n.label.slice(0, 2).toUpperCase()}</text>
              <rect x={-n.label.length * 3.5 - 6} y={n.r + 6} width={n.label.length * 7 + 12} height="18" rx="9" fill="#fff" stroke="#E3E8EE"/>
              <text y={n.r + 18} textAnchor="middle" fontSize="11" fontWeight="500" fill="#0A2540" fontFamily="Inter">{n.label}</text>
            </g>
          ))}
        </svg>

        {/* Toolbar */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, padding: 2, boxShadow: '0 2px 4px rgba(10,37,64,0.06)' }}>
          {['+','−','⤢'].map(s => (
            <button key={s} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#425466', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>{s}</button>
          ))}
        </div>

        {/* Inspector card */}
        <Card style={{ position: 'absolute', bottom: 16, left: 16, width: 280, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#635BFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>LL</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Lampton Love</div>
              <div style={{ fontSize: 11, color: '#697386' }}>Subsidiary of Ergon</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#697386', marginBottom: 10 }}>
            <span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>8</b> connections</span>
            <span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>3</b> targets</span>
            <span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>4</b> competitors</span>
          </div>
          <Button variant="primary" size="sm" style={{ width: '100%' }}>Expand neighborhood</Button>
        </Card>
      </div>
    </div>
  );
}

// Company Detail (slideover) — used in multiple views
function CompanyDetail({ companyId, onClose, onCompare }) {
  const c = (window.MOCK_COMPANIES || []).find(x => x.id === companyId);
  if (!c) return null;

  return (
    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 520, background: '#fff', borderLeft: '1px solid #E3E8EE', boxShadow: '-8px 0 24px rgba(10,37,64,0.12)', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid #EDF1F6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <Badge tone="indigo" dot>Tracked target · Fit {Math.max(20, Math.min(95, (c.total || 0) * 2 + 30 - c.rank))}</Badge>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#8B97A8', cursor: 'pointer' }}><Icon name="x" size={16}/></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F7FAFC', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#425466' }}>{c.name.slice(0,2).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.4px' }}>{c.name}</h2>
            <div style={{ fontSize: 13, color: '#697386', marginTop: 2 }}>{c.parent} · {c.typeLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button variant="primary" size="sm" icon="plus">Add to pro forma</Button>
          <Button variant="secondary" size="sm" onClick={() => onCompare(c.id)}>Add to compare</Button>
          <Button variant="secondary" size="sm" icon="bell">Watch</Button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[['Locations', c.locs, ''],['Revenue (est.)', `$${c.rev.toFixed(1)}M`, ''],['Employees', c.emp, ''],['Market share', `${c.mkt.toFixed(1)}%`, ''],['EBITDA (est.)', `$${(c.rev * 0.12).toFixed(1)}M`, ''],['Per-loc rev', `$${(c.rev / c.locs).toFixed(1)}M`, '']].map(([l, v]) => (
            <div key={l} style={{ padding: 14, background: '#F7FAFC', borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A2540', fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Narrative */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Thesis</div>
          <p style={{ margin: 0, fontSize: 13, color: '#425466', lineHeight: 1.7 }}>
            {c.name} operates {c.locs} distribution locations across {c.states.join(', ')}. Per-location revenue of ${(c.rev / c.locs).toFixed(1)}M suggests {c.rev / c.locs > 3.5 ? 'premium operating metrics above industry benchmark' : 'operations at or near industry benchmarks'}. Ownership profile creates {c.type === 'family' ? 'a potential succession-driven transaction window within 12-24 months' : 'a standard auction dynamic'}.
          </p>
        </div>

        {/* Signals timeline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Signal activity · 12 months</div>
          {[
            ['Feb 2026', 'Leadership', 'CEO retirement announced'],
            ['Oct 2025', 'Bolt-on', 'Acquired Palmer Gas & Oil (5 loc)'],
            ['May 2025', 'Capital', '$15M growth financing'],
          ].map(([d, t, n]) => (
            <div key={d} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #EDF1F6' }}>
              <span style={{ fontSize: 11, color: '#8B97A8', fontFamily: "'IBM Plex Mono'", width: 70 }}>{d}</span>
              <Badge tone="indigo">{t}</Badge>
              <span style={{ fontSize: 12, color: '#425466', flex: 1 }}>{n}</span>
            </div>
          ))}
        </div>

        {/* Recent news */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Recent news</div>
          {window.CompanyNewsStrip ? <window.CompanyNewsStrip companyId={c.id} /> : null}
        </div>

        {/* Geo footprint */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Footprint</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.states.map(s => <Badge key={s} tone="outline">{s}</Badge>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compare — full view for side-by-side
function CompareView({ ids, onRemove }) {
  const all = window.MOCK_COMPANIES || [];
  const companies = ids.map(id => all.find(c => c.id === id)).filter(Boolean);
  if (companies.length === 0) return (
    <div style={{ flex: 1, background: '#F6F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#697386' }}>
        <Icon name="users" size={40} color="#C1CCD6"/>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#0A2540', marginTop: 12 }}>Select 2–4 companies to compare</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Check companies from the Companies view to add them here.</div>
      </div>
    </div>
  );

  const rows = [
    ['Headquarters', (c) => c.states[0]],
    ['Ownership', (c) => c.typeLabel],
    ['Locations', (c) => c.locs, true],
    ['States', (c) => c.states.length, true],
    ['Revenue', (c) => `$${c.rev.toFixed(1)}M`, true],
    ['EBITDA (est.)', (c) => `$${(c.rev * 0.12).toFixed(1)}M`, true],
    ['Employees', (c) => c.emp, true],
    ['Market share', (c) => `${c.mkt.toFixed(1)}%`, true],
    ['Per-location rev', (c) => `$${(c.rev / c.locs).toFixed(1)}M`, true],
    ['Fit score', (c) => Math.max(20, Math.min(95, (c.total || 0) * 2 + 30 - c.rank)), true],
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      <Card padding={0}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Side-by-side comparison · {companies.length} companies</div>
          <Button variant="secondary" size="sm" icon="download">Export</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${companies.length}, 1fr)`, fontSize: 13 }}>
          {/* Header row */}
          <div style={{ padding: '20px 16px', background: '#F7FAFC', borderBottom: '1px solid #E3E8EE' }}/>
          {companies.map(c => (
            <div key={c.id} style={{ padding: '20px 16px', background: '#F7FAFC', borderLeft: '1px solid #E3E8EE', borderBottom: '1px solid #E3E8EE', position: 'relative' }}>
              <button onClick={() => onRemove(c.id)} style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, border: 'none', background: 'rgba(10,37,64,0.05)', borderRadius: '50%', color: '#8B97A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={10}/></button>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: '#fff', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#425466', marginBottom: 10 }}>{c.name.slice(0,2).toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0A2540' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#697386', marginTop: 1 }}>{c.parent}</div>
            </div>
          ))}

          {/* Data rows */}
          {rows.map(([label, fn, isNum], ri) => {
            const values = companies.map(c => fn(c));
            const numeric = isNum ? values.map(v => typeof v === 'string' ? parseFloat(String(v).replace(/[^\d.]/g,'')) : v) : null;
            const max = numeric ? Math.max(...numeric) : null;
            return (
              <React.Fragment key={label}>
                <div style={{ padding: '12px 16px', color: '#697386', fontSize: 12, fontWeight: 500, borderBottom: '1px solid #EDF1F6', background: '#FAFBFC' }}>{label}</div>
                {companies.map((c, ci) => {
                  const v = values[ci];
                  const isMax = numeric && numeric[ci] === max;
                  return (
                    <div key={c.id} style={{ padding: '12px 16px', borderBottom: '1px solid #EDF1F6', borderLeft: '1px solid #E3E8EE', fontFamily: isNum ? "'IBM Plex Mono'" : 'inherit', color: '#0A2540', fontWeight: isMax ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {v}
                      {isMax && <Badge tone="indigo">best</Badge>}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { FitView, OverlapView, NetworkView, CompanyDetail, CompareView });
