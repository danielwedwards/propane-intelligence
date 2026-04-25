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

// --- Local formatters (duplicated from Views1.jsx — Babel-standalone files don't share locals) ---
function _fmtMoneyM(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'B';
  if (v >= 100)  return '$' + Math.round(v) + 'M';
  return '$' + Number(v).toFixed(1) + 'M';
}
function _fmtInt(v) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toLocaleString();
}
function _fmtPct(v, digits) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toFixed(digits == null ? 2 : digits) + '%';
}
function _fmtDist(v) {
  if (v == null || isNaN(v) || !isFinite(v)) return '—';
  return Math.round(v).toLocaleString() + ' mi';
}
function _fmtGallons(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B gal';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M gal';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K gal';
  return Math.round(v) + ' gal';
}

// US state abbreviations (used to render "byStateG" entries)
const _STATE_ABBR = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut',
  DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa',
  KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan',
  MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire',
  NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio',
  OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota',
  TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia',
  WI:'Wisconsin', WY:'Wyoming', DC:'District of Columbia',
};

// Bucket → display label & weight (matches scoring.js DEFAULT_WEIGHTS)
const _FIT_BUCKETS = [
  { key: 'geo',     label: 'Geography',   weight: 25 },
  { key: 'size',    label: 'Size',        weight: 20 },
  { key: 'ops',     label: 'Operations',  weight: 15 },
  { key: 'culture', label: 'Culture',     weight: 15 },
  { key: 'fin',     label: 'Financial',   weight: 15 },
  { key: 'integ',   label: 'Integration', weight: 10 },
];

// Section header used inside the slideover
function _SectionHead({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>{children}</div>
      {right}
    </div>
  );
}

// KPI tile
function _Kpi({ label, value, sub }) {
  return (
    <div style={{ padding: 12, background: '#F7FAFC', borderRadius: 8, border: '1px solid #EDF1F6' }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: '#0A2540', fontFamily: 'Inter', marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#8B97A8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// Six-bucket fit-score bar chart (driven by c.fitBreakdown)
function _FitBreakdown({ breakdown, total }) {
  if (!breakdown) {
    return <div style={{ fontSize: 12, color: '#8B97A8' }}>Score breakdown unavailable.</div>;
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.4px' }}>{Math.round(total || 0)}</div>
        <div style={{ fontSize: 11, color: '#697386' }}>composite fit · 0–100</div>
      </div>
      {_FIT_BUCKETS.map(b => {
        const v = Math.max(0, Math.min(100, Math.round(breakdown[b.key] || 0)));
        const tone = v > 75 ? '#009966' : v > 55 ? '#635BFF' : v > 35 ? '#C4862D' : '#8B97A8';
        return (
          <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 38px', alignItems: 'center', gap: 10, padding: '5px 0' }}>
            <div style={{ fontSize: 12, color: '#425466' }}>{b.label}<span style={{ color: '#8B97A8', marginLeft: 4 }}>{b.weight}%</span></div>
            <div style={{ height: 6, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: v + '%', height: '100%', background: tone, borderRadius: 3 }}/>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono'", textAlign: 'right' }}>{v}</div>
          </div>
        );
      })}
    </div>
  );
}

// Company Detail (slideover) — used in multiple views
function CompanyDetail({ companyId, onClose, onCompare }) {
  const c = (window.MOCK_COMPANIES || []).find(x => x.id === companyId);
  const [showAllLocs, setShowAllLocs] = React.useState(false);
  if (!c) return null;

  const fit = (c.fitScore == null) ? null : Math.round(c.fitScore);
  const locs = c.locations || [];
  const visibleLocs = showAllLocs ? locs : locs.slice(0, 10);
  const states = (c.states && c.states.length ? c.states : (c.hqState ? [c.hqState] : []));
  const acq = c.acquisitions || [];
  const personnel = c.keyPersonnel || [];
  const services = c.serviceTypes || [];
  const byStateG = (c.marketShare && c.marketShare.byStateG) || {};
  const byStateRows = Object.entries(byStateG)
    .filter(([, v]) => v && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const totalG = c.marketShare ? c.marketShare.nationalG : null;

  const header = c.parentGroup
    ? c.parentGroup
    : (c.parent && c.parent !== c.name ? c.parent : (c.ownerDetail || 'Independent'));
  const initials = (c.name || '??').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '··';

  return (
    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 520, background: '#fff', borderLeft: '1px solid #E3E8EE', boxShadow: '-8px 0 24px rgba(10,37,64,0.12)', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid #EDF1F6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <Badge tone="indigo" dot>{c.id === 'll' ? 'Platform anchor' : 'Tracked target'}{fit != null ? ' · Fit ' + fit : ''}</Badge>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#8B97A8', cursor: 'pointer' }} aria-label="Close"><Icon name="x" size={16}/></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F7FAFC', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#425466' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h2>
            <div style={{ fontSize: 13, color: '#697386', marginTop: 2 }}>
              {header} · {c.typeLabel || c.type || '—'}
              {c.hqCity && c.hqState ? ' · ' + c.hqCity + ', ' + c.hqState : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" icon="plus">Add to pro forma</Button>
          <Button variant="secondary" size="sm" onClick={() => onCompare && onCompare(c.id)}>Add to compare</Button>
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" icon="external-link">Website</Button>
            </a>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* KPI grid — real fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <_Kpi label="Locations"      value={_fmtInt(locs.length || c.totalLocs)} sub={c.seLocs ? c.seLocs + ' in SE' : null}/>
          <_Kpi label="Est. revenue"   value={_fmtMoneyM(c.estRevenue)}/>
          <_Kpi label="Employees"      value={_fmtInt(c.employeeCount)}/>
          <_Kpi label="Year founded"   value={c.yearFounded || '—'}/>
          <_Kpi label="Annual gallons" value={_fmtGallons(c.estAnnualGallons)}/>
          <_Kpi label="Avg dist to LL" value={c.proxScore ? _fmtDist(c.proxScore.mean) : '—'} sub={c.proxScore && c.proxScore.locsWithin100 ? c.proxScore.locsWithin100 + ' locs ≤100mi' : null}/>
          <_Kpi label="Shared counties" value={c.countyShared ? _fmtInt(c.countyShared.count) : '—'} sub={c.countyShared && c.countyShared.pct ? _fmtPct(c.countyShared.pct, 0) + ' of LL' : null}/>
          <_Kpi label="Market share"    value={c.marketShare ? _fmtPct(c.marketShare.nationalPct, 2) : '—'} sub={totalG ? _fmtGallons(totalG) : null}/>
        </div>

        {/* Description (real) */}
        {c.description && (
          <div style={{ marginBottom: 20 }}>
            <_SectionHead>Description</_SectionHead>
            <p style={{ margin: 0, fontSize: 13, color: '#425466', lineHeight: 1.65 }}>{c.description}</p>
          </div>
        )}

        {/* Strategic fit breakdown */}
        <div style={{ marginBottom: 20 }}>
          <_SectionHead right={<span style={{ fontSize: 10, color: '#8B97A8' }}>vs. Lampton Love</span>}>Strategic fit</_SectionHead>
          <_FitBreakdown breakdown={c.fitBreakdown} total={c.fitScore}/>
        </div>

        {/* Locations table (real, paginated) */}
        {locs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <_SectionHead right={<span style={{ fontSize: 10, color: '#8B97A8' }}>{_fmtInt(locs.length)} total</span>}>Locations</_SectionHead>
            <div style={{ border: '1px solid #EDF1F6', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.5fr 1fr 0.8fr', padding: '8px 12px', background: '#F7FAFC', borderBottom: '1px solid #EDF1F6', fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                <div>City</div><div>State</div><div>County</div><div style={{ textAlign: 'right' }}>Lat / Lng</div>
              </div>
              {visibleLocs.map((loc, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.5fr 1fr 0.8fr', padding: '7px 12px', borderBottom: i === visibleLocs.length - 1 ? 'none' : '1px solid #F2F4F7', fontSize: 12, color: '#425466', alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loc.address || loc.name || loc.city || ''}>{loc.city || loc.name || '—'}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540' }}>{loc.state || '—'}</div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.county || '—'}</div>
                  <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: '#8B97A8', fontSize: 11 }}>
                    {loc.lat != null && loc.lng != null ? Number(loc.lat).toFixed(2) + ', ' + Number(loc.lng).toFixed(2) : '—'}
                  </div>
                </div>
              ))}
            </div>
            {locs.length > 10 && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => setShowAllLocs(s => !s)}>
                  {showAllLocs ? 'Show fewer' : 'Show all ' + locs.length + ' locations'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Market share by state (real) */}
        {byStateRows.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <_SectionHead right={<span style={{ fontSize: 10, color: '#8B97A8' }}>{totalG ? _fmtGallons(totalG) + ' total' : ''}</span>}>Volume by state</_SectionHead>
            {(() => {
              const max = Math.max.apply(null, byStateRows.map(r => r[1]));
              return byStateRows.map(([st, g]) => {
                const w = max > 0 ? (g / max) * 100 : 0;
                return (
                  <div key={st} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <div style={{ fontSize: 12, color: '#425466' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600, marginRight: 6 }}>{st}</span>
                      <span style={{ color: '#8B97A8' }}>{_STATE_ABBR[st] || ''}</span>
                    </div>
                    <div style={{ height: 5, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: w + '%', height: '100%', background: '#635BFF' }}/>
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono'", color: '#0A2540', textAlign: 'right' }}>{_fmtGallons(g)}</div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <_SectionHead>Services</_SectionHead>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {services.map((s, i) => <Badge key={i} tone="outline">{s}</Badge>)}
            </div>
          </div>
        )}

        {/* Key personnel */}
        {personnel.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <_SectionHead>Key personnel</_SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {personnel.slice(0, 6).map((p, i) => {
                const name = typeof p === 'string' ? p : (p && (p.name || p.fullName)) || '—';
                const title = typeof p === 'string' ? '' : (p && (p.title || p.role)) || '';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#F7FAFC', borderRadius: 6, fontSize: 12 }}>
                    <span style={{ color: '#0A2540', fontWeight: 500 }}>{name}</span>
                    <span style={{ color: '#697386' }}>{title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acquisitions timeline (real, falls back to "no signals") */}
        <div style={{ marginBottom: 20 }}>
          <_SectionHead>Acquisition activity</_SectionHead>
          {acq.length === 0 ? (
            <div style={{ fontSize: 12, color: '#8B97A8', padding: '10px 12px', background: '#F7FAFC', borderRadius: 6 }}>No acquisitions recorded.</div>
          ) : (
            acq.slice(0, 8).map((a, i) => {
              const when = (a && (a.year || a.date)) || '';
              const target = (a && (a.target || a.name)) || 'Unnamed target';
              const note = (a && (a.note || a.description || a.detail)) || '';
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i === Math.min(acq.length, 8) - 1 ? 'none' : '1px solid #EDF1F6', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, color: '#8B97A8', fontFamily: "'IBM Plex Mono'", width: 56, flexShrink: 0, paddingTop: 1 }}>{when || '—'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#0A2540', fontWeight: 500 }}>{target}</div>
                    {note && <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>{note}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent news */}
        <div style={{ marginBottom: 20 }}>
          <_SectionHead>Recent news</_SectionHead>
          {window.CompanyNewsStrip ? <window.CompanyNewsStrip companyId={c.id} /> : (
            <div style={{ fontSize: 12, color: '#8B97A8' }}>News engine not loaded.</div>
          )}
        </div>

        {/* Footprint */}
        {states.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <_SectionHead>State footprint</_SectionHead>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {states.map(s => <Badge key={s} tone="outline">{s}</Badge>)}
            </div>
          </div>
        )}

        {/* Contact line */}
        {(c.phone || c.email) && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #EDF1F6', display: 'flex', gap: 14, fontSize: 12, color: '#697386', flexWrap: 'wrap' }}>
            {c.phone && <span>{c.phone}</span>}
            {c.email && <a href={'mailto:' + c.email} style={{ color: '#635BFF', textDecoration: 'none' }}>{c.email}</a>}
          </div>
        )}
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

  // [label, displayFn, rawFn?, dir?]   dir: 'max' (default) or 'min' for best highlight
  const rows = [
    ['Headquarters', (c) => (c.hqCity && c.hqState) ? (c.hqCity + ', ' + c.hqState) : (c.hqState || (c.states && c.states[0]) || '—')],
    ['Ownership',    (c) => c.typeLabel || c.type || '—'],
    ['Year founded', (c) => c.yearFounded || '—',                                     (c) => c.yearFounded || null,                          'min'],
    ['Locations',    (c) => _fmtInt((c.locations || []).length || c.totalLocs),       (c) => (c.locations || []).length || c.totalLocs || 0],
    ['States',       (c) => (c.states || []).length,                                  (c) => (c.states || []).length],
    ['Revenue (est.)', (c) => _fmtMoneyM(c.estRevenue),                                (c) => c.estRevenue],
    ['Employees',    (c) => _fmtInt(c.employeeCount),                                  (c) => c.employeeCount],
    ['Annual gallons', (c) => _fmtGallons(c.estAnnualGallons),                         (c) => c.estAnnualGallons],
    ['Market share', (c) => c.marketShare ? _fmtPct(c.marketShare.nationalPct, 2) : '—', (c) => c.marketShare ? c.marketShare.nationalPct : null],
    ['Avg dist to LL', (c) => c.proxScore ? _fmtDist(c.proxScore.mean) : '—',          (c) => c.proxScore ? c.proxScore.mean : null,          'min'],
    ['Shared counties', (c) => c.countyShared ? _fmtInt(c.countyShared.count) : '—',   (c) => c.countyShared ? c.countyShared.count : null],
    ['Fit score',    (c) => c.fitScore != null ? Math.round(c.fitScore) : '—',         (c) => c.fitScore],
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
              <div style={{ width: 32, height: 32, borderRadius: 7, background: '#fff', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#425466', marginBottom: 10 }}>{((c.name || '··').replace(/[^A-Za-z]/g, '').slice(0,2).toUpperCase()) || '··'}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0A2540' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#697386', marginTop: 1 }}>{c.parentGroup || c.parent || '—'}</div>
            </div>
          ))}

          {/* Data rows */}
          {rows.map((row, ri) => {
            const label = row[0];
            const dispFn = row[1];
            const rawFn = row[2];
            const dir = row[3] || 'max';
            const isNum = !!rawFn;
            const values = companies.map(c => dispFn(c));
            const raw = isNum ? companies.map(c => {
              const r = rawFn(c);
              return (r == null || isNaN(r)) ? null : Number(r);
            }) : null;
            const valid = raw ? raw.filter(v => v != null) : [];
            const best = valid.length === 0 ? null : (dir === 'min' ? Math.min.apply(null, valid) : Math.max.apply(null, valid));
            return (
              <React.Fragment key={label}>
                <div style={{ padding: '12px 16px', color: '#697386', fontSize: 12, fontWeight: 500, borderBottom: '1px solid #EDF1F6', background: '#FAFBFC' }}>{label}</div>
                {companies.map((c, ci) => {
                  const v = values[ci];
                  const isMax = isNum && raw[ci] != null && raw[ci] === best && valid.length > 1;
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
