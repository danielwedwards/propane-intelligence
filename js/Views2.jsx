// Views2.jsx — Analytics, Signals, Brief

// --- Local formatters (kept in-file; Babel-standalone scripts don't share locals) ---
function _v2_fmtMoneyM(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'B';
  if (v >= 100)  return '$' + Math.round(v) + 'M';
  return '$' + Number(v).toFixed(1) + 'M';
}
function _v2_fmtInt(v) {
  if (v == null || isNaN(v)) return '—';
  return Math.round(Number(v)).toLocaleString();
}
function _v2_fmtGallons(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return Math.round(v).toString();
}

// Aggregate the company list once per render; memoise on companies length.
function useAnalyticsAggregates() {
  const list = window.MOCK_COMPANIES || [];
  return React.useMemo(() => {
    let totalLocs = 0, totalGallons = 0, totalRev = 0, totalEmp = 0;
    const ownership = { family: 0, private: 0, pe: 0, public: 0, coop: 0, ll: 0, other: 0 };
    const byState = {};                     // gallons by state — sum of marketShare.byStateG
    const acqByYear = {};                   // acquisitions per calendar year
    const operators = [];                   // [{name, gallons, rev, locs}]
    const yearsSet = new Set();
    for (const c of list) {
      const locs = (c.locations || []).length || c.totalLocs || 0;
      totalLocs += locs;
      // Use county-allocated nationalG (already operator-split) so the sum
      // across all operators equals total addressable gallons. Mixing this
      // with raw estAnnualGallons breaks the percentage maths.
      const galls = c.marketShare ? (c.marketShare.nationalG || 0) : 0;
      totalGallons += galls;
      totalRev += c.estRevenue || 0;
      totalEmp += c.employeeCount || 0;
      const own = (c.ownership || 'other').toLowerCase();
      if (ownership[own] != null) ownership[own]++; else ownership.other++;
      const ms = c.marketShare && c.marketShare.byStateG;
      if (ms) {
        for (const k of Object.keys(ms)) byState[k] = (byState[k] || 0) + (ms[k] || 0);
      }
      operators.push({
        id: c.id, name: c.name,
        gallons: galls,
        rev: c.estRevenue || 0,
        locs,
      });
      for (const a of (c.acquisitions || [])) {
        const yr = Number(a && (a.year || (a.date && String(a.date).match(/\d{4}/) && String(a.date).match(/\d{4}/)[0]))) || null;
        if (yr && yr >= 2000 && yr <= 2030) {
          acqByYear[yr] = (acqByYear[yr] || 0) + 1;
          yearsSet.add(yr);
        }
      }
    }
    operators.sort((a, b) => b.gallons - a.gallons);
    const stateRows = Object.entries(byState).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const years = Array.from(yearsSet).sort();
    return {
      total: list.length,
      totalLocs, totalGallons, totalRev, totalEmp,
      ownership,
      stateRows,
      topOperators: operators.slice(0, 6),
      acqByYear, years,
    };
  }, [list, list.length]);
}

function AnalyticsView() {
  const agg = useAnalyticsAggregates();
  const llRow = (window.MOCK_COMPANIES || []).find(c => c.id === 'll');
  const llShare = (llRow && llRow.marketShare) ? llRow.marketShare.nationalPct : null;
  const top6Pct = agg.topOperators.reduce((a, o) => a + (o.gallons || 0), 0);
  const totalG = agg.totalGallons;

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <Card padding={0}><Stat label="Companies tracked" value={_v2_fmtInt(agg.total)}    delta={null} sub={`${_v2_fmtInt(agg.totalLocs)} locations`} icon="building"/></Card>
        <Card padding={0}><Stat label="Annual gallons"    value={_v2_fmtGallons(agg.totalGallons)} delta={null} sub="industry total" icon="trending"/></Card>
        <Card padding={0}><Stat label="Aggregate revenue" value={_v2_fmtMoneyM(agg.totalRev)}     delta={null} sub="estimated" icon="zap"/></Card>
        <Card padding={0}><Stat label="Lampton Love share" value={llShare != null ? llShare.toFixed(2) + '%' : '—'} delta={null} sub="of national gallons" icon="target"/></Card>
      </div>

      {/* Row 1: top operators + acquisition pace */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 20 }}>
        <Card padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Top operators</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2 }}>By estimated annual gallons</div>
            </div>
            <Badge tone="outline">{((top6Pct / Math.max(1, totalG)) * 100).toFixed(1)}% of market</Badge>
          </div>
          <OperatorBars operators={agg.topOperators} max={Math.max(1, agg.topOperators[0] ? agg.topOperators[0].gallons : 0)}/>
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Acquisition pace</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 18 }}>Recorded deals by year</div>
          <AcquisitionBars acqByYear={agg.acqByYear} years={agg.years}/>
        </Card>
      </div>

      {/* Row 2: ownership breakdown + geographic */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16 }}>
        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Ownership mix</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 18 }}>by company count</div>
          <OwnershipDonut counts={agg.ownership} total={agg.total}/>
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Top states by gallons</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 18 }}>tracked operators only</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px' }}>
            {agg.stateRows.map(([s, v]) => {
              const max = agg.stateRows[0][1];
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', minWidth: 24, fontFamily: "'IBM Plex Mono'" }}>{s}</span>
                  <div style={{ flex: 1, height: 6, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: ((v / max) * 100) + '%', height: '100%', background: '#635BFF' }} />
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#697386', minWidth: 56, textAlign: 'right' }}>{_v2_fmtGallons(v)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Top-operators horizontal bars
function OperatorBars({ operators, max }) {
  if (!operators.length) return <div style={{ fontSize: 12, color: '#8B97A8' }}>No operator data.</div>;
  return (
    <div>
      {operators.map((o, i) => {
        const pct = max > 0 ? (o.gallons / max) * 100 : 0;
        return (
          <div key={o.id || i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px', alignItems: 'center', gap: 12, padding: '6px 0' }}>
            <div style={{ fontSize: 13, color: '#0A2540', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.name}>{o.name}</div>
            <div style={{ height: 12, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: pct + '%', height: '100%', background: '#635BFF', borderRadius: 3 }}/>
            </div>
            <div style={{ fontSize: 12, fontFamily: "'IBM Plex Mono'", color: '#0A2540', textAlign: 'right' }}>
              {_v2_fmtGallons(o.gallons)} <span style={{ color: '#8B97A8' }}>gal</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Bar chart for acquisitions by year (real, from c.acquisitions)
function AcquisitionBars({ acqByYear, years }) {
  if (!years.length) {
    return <div style={{ fontSize: 12, color: '#8B97A8', padding: 16, background: '#F7FAFC', borderRadius: 6, textAlign: 'center' }}>No acquisitions recorded yet.</div>;
  }
  const max = Math.max.apply(null, years.map(y => acqByYear[y]));
  const w = 320, h = 180;
  const barW = Math.max(8, (w - 40) / years.length - 4);
  return (
    <svg viewBox={'0 0 ' + w + ' ' + h} style={{ width: '100%', height: 240 }}>
      <g stroke="#EDF1F6">
        {[0, 0.33, 0.66, 1].map(t => <line key={t} x1="20" x2={w} y1={h - 30 - t * 130} y2={h - 30 - t * 130}/>)}
      </g>
      {years.map((y, i) => {
        const v = acqByYear[y];
        const bh = (v / max) * 130;
        const x = 30 + i * ((w - 40) / years.length);
        return (
          <g key={y}>
            <rect x={x} y={h - 30 - bh} width={barW} height={bh} fill="#635BFF" rx="2"/>
            <text x={x + barW / 2} y={h - 30 - bh - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0A2540" fontFamily="'IBM Plex Mono'">{v}</text>
            <text x={x + barW / 2} y={h - 12} textAnchor="middle" fontSize="9" fill="#8B97A8" fontFamily="'IBM Plex Mono'">{String(y).slice(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Real ownership donut — accepts {counts, total}.
// NOTE: the v1 component used JSX attributes `fontVariantNumeric` and
// `textTransform` on <text> elements, which React passes through as DOM
// attributes (lowercase) and warns about. Here we move them into `style`
// so they apply as CSS (where they belong) and React stays quiet.
function OwnershipDonut({ counts, total }) {
  // Fallback to v1 demo numbers if real counts missing.
  const c = counts || { family: 624, private: 246, pe: 189, public: 102, coop: 86, other: 0, ll: 0 };
  const t = total != null ? total : Object.values(c).reduce((a, b) => a + b, 0);
  const data = [
    { label: 'Family',    value: c.family || 0,  color: '#009966' },
    { label: 'Private',   value: c.private || 0, color: '#697386' },
    { label: 'PE-backed', value: c.pe || 0,      color: '#AB87FF' },
    { label: 'Public',    value: c.public || 0,  color: '#1890FF' },
    { label: 'Co-op',     value: c.coop || 0,    color: '#C4862D' },
    { label: 'Other',     value: (c.other || 0) + (c.ll || 0), color: '#C1CCD6' },
  ].filter(d => d.value > 0);
  const sum = data.reduce((a, d) => a + d.value, 0) || 1;
  let offset = 0;
  const circ = 2 * Math.PI * 50;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <g transform="translate(70 70) rotate(-90)">
          {data.map((d, i) => {
            const len = (d.value / sum) * circ;
            const el = (
              <circle key={i} r="50" fill="none" stroke={d.color} strokeWidth="22" strokeDasharray={len + ' ' + circ} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="600" fill="#0A2540" fontFamily="Inter" letterSpacing="-0.5"
              style={{ fontVariantNumeric: 'tabular-nums' }}>{_v2_fmtInt(t)}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#8B97A8" letterSpacing="0.6"
              style={{ textTransform: 'uppercase' }}>companies</text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }}/>
            <span style={{ flex: 1, color: '#425466' }}>{d.label}</span>
            <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{_v2_fmtInt(d.value)}</span>
            <span style={{ fontFamily: "'IBM Plex Mono'", color: '#8B97A8', fontSize: 11, minWidth: 36, textAlign: 'right' }}>{((d.value/sum)*100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Signals feed (kept on demo strings until Phase 7 builds data/signals.json)
function SignalsView({ onSelect }) {
  const signals = [
    { co: 'Blossman Gas', tone: 'amber', type: 'Rumored sale', ago: '2 days ago', text: 'Industry sources report family principals retained Houlihan Lokey. Estimated process Q3.', strength: 82, tags: ['High signal','Rumored'] },
    { co: 'Cherry Energy', tone: 'green', type: 'Leadership change', ago: '1 week ago', text: 'CEO Marcus Cherry announced retirement effective Sept 2026. Succession plan not disclosed.', strength: 64, tags: ['Family succession','Confirmed'] },
    { co: 'Dead River Company', tone: 'blue', type: 'Capital raise', ago: '2 weeks ago', text: 'Filed Form D reporting $85M minority recap with Brookfield. May signal grow-then-sell strategy.', strength: 58, tags: ['PE entry'] },
    { co: 'Crystal Flash', tone: 'neutral', type: 'Bolt-on acquired', ago: '3 weeks ago', text: 'Acquired Palmer Gas & Oil (5 loc, NH). 31st add-on since 2019 recap. Pace accelerating.', strength: 45, tags: ['Roll-up signal'] },
    { co: 'Eastern Propane & Oil', tone: 'amber', type: 'PE exit window', ago: '1 month ago', text: 'Ares-backed platform passing 5-year mark. Secondary sale expected within 12 months.', strength: 71, tags: ['Exit expected'] },
    { co: 'Barrett Propane', tone: 'green', type: 'Family succession', ago: '6 weeks ago', text: '3rd gen principal considering transition per industry conference remarks. Open to exploring strategics.', strength: 52, tags: ['Warm'] },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <Card padding={0}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Recent signals <span style={{ color: '#8B97A8', fontWeight: 400, marginLeft: 6 }}>· 18 this quarter</span></div>
            <Button variant="secondary" size="sm" icon="filter">Filter</Button>
            <Button variant="secondary" size="sm">Sort: Recency</Button>
          </div>

          {signals.map((s, i) => (
            <div key={i} onClick={() => onSelect && onSelect(s.co)} style={{ padding: '16px 20px', borderBottom: '1px solid #EDF1F6', display: 'flex', gap: 14, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F7FAFC', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.type.includes('Leadership') ? 'users' : s.type.includes('Capital') ? 'trending' : s.type.includes('bolt') || s.type.includes('Bolt') ? 'zap' : s.type.includes('exit') || s.type.includes('Exit') ? 'arrowUp' : 'sparkle'} size={15} color="#635BFF"/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>{s.co}</span>
                  <Badge tone={s.tone} dot>{s.type}</Badge>
                  <span style={{ fontSize: 11, color: '#8B97A8', marginLeft: 'auto' }}>{s.ago}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#425466', lineHeight: 1.5 }}>{s.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3 }}>Signal strength</span>
                    <div style={{ width: 80, height: 4, background: '#EDF1F6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: s.strength + '%', height: '100%', background: s.strength > 70 ? '#D83E4A' : s.strength > 50 ? '#C4862D' : '#635BFF' }}/>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#0A2540', fontWeight: 600 }}>{s.strength}</span>
                  </div>
                  {s.tags.map(t => <Badge key={t} tone="outline">{t}</Badge>)}
                </div>
              </div>
              <Icon name="chevronRight" size={16} color="#C1CCD6"/>
            </div>
          ))}
        </Card>
      </div>

      {/* Signal types sidebar */}
      <div style={{ width: 280, background: '#fff', borderLeft: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Signal volume (trailing)</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[['Rumored sale', 8, '#D83E4A'],['Leadership change', 5, '#C4862D'],['Capital raise', 3, '#1890FF'],['Family succession', 7, '#009966'],['Bolt-on acquired', 12, '#635BFF'],['PE exit window', 4, '#AB87FF']].map(([l, v, c]) => (
            <div key={l} style={{ padding: '8px 10px', border: '1px solid #EDF1F6', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: '#425466' }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>{v}</span>
              </div>
              <div style={{ height: 3, background: '#EDF1F6', borderRadius: 2 }}>
                <div style={{ width: (v * 8) + '%', height: '100%', background: c, borderRadius: 2 }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: 14, background: '#F7FAFC', borderRadius: 8, border: '1px solid #EDF1F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Icon name="bell" size={13} color="#635BFF"/>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>Get alerts</span>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#697386', lineHeight: 1.5 }}>Watch list alerts when any tracked signal type surfaces.</p>
          <Button variant="primary" size="sm" style={{ width: '100%' }}>Create alert</Button>
        </div>
      </div>
    </div>
  );
}

// Executive Brief — kept as-is until Phase 6/7 wires real numbers.
function BriefView() {
  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#635BFF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Executive brief · Q2 2026</div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.8px', lineHeight: 1.15 }}>
            Family-owned consolidation is accelerating. The Southeast is where it matters.
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 16, color: '#425466', lineHeight: 1.6 }}>
            18 tracked signals this quarter — a 38% QoQ increase. Succession-driven transactions now outpace PE exits for the first time in six quarters. Below: what to pay attention to before Q3.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#697386' }}>
            <span>Generated <b style={{ color: '#0A2540', fontWeight: 600 }}>Apr 24, 2026</b></span>
            <span>·</span>
            <span>For <b style={{ color: '#0A2540', fontWeight: 600 }}>Daniel Edwards</b>, Corporate Development</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" icon="download">PDF</Button>
              <Button variant="secondary" size="sm">Share</Button>
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[['$18.2B','Market size','+4.2%'],['247','Targets in play','+12'],['4.7%','Platform share','+0.8pt'],['$1.24B','Pro forma rev','+8.1%']].map(([v,l,d]) => (
            <Card key={l} padding={16}>
              <div style={{ fontSize: 11, color: '#697386', fontWeight: 500, marginBottom: 6 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', fontFamily: 'Inter', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              <div style={{ fontSize: 11, color: '#009966', fontWeight: 500, marginTop: 2 }}>↑ {d} YoY</div>
            </Card>
          ))}
        </div>

        {[
          { n: '01', tag: 'SUCCESSION', title: 'Family-owned succession is a 12-month opportunity', body: 'Seven confirmed succession signals in Q2 — led by Barrett Propane (MS) and Cherry Energy (NC). Average principal age at event = 67. These are strategic sellers, not auctioned processes.', chip: 'High priority' },
          { n: '02', tag: 'GEOGRAPHY', title: 'Southeast density makes the rollup economics work', body: 'Lampton Love anchors a 58-location footprint across 5 SE states. Acquisition of Blossman + Cherry + Barrett adds 82 locations with 74% geographic overlap at the county level.', chip: 'Thesis validated' },
          { n: '03', tag: 'COMPETITION', title: 'AmeriGas is pulling back, not leaning in', body: 'UGI guided to $300M of divestitures this quarter. Early signals suggest Northeast and Mountain West assets first. Short-term favorable dynamic for regional consolidators.', chip: 'Monitor' },
        ].map(f => (
          <Card key={f.n} style={{ marginBottom: 12 }} padding={24}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#E0E3FF', fontFamily: 'Inter', letterSpacing: '-1px', width: 60, flexShrink: 0 }}>{f.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Badge tone="indigo" dot>{f.tag}</Badge>
                  <Badge tone="outline">{f.chip}</Badge>
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.3px' }}>{f.title}</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#425466', lineHeight: 1.6 }}>{f.body}</p>
              </div>
              <Button variant="ghost" size="sm" iconRight="arrowRight">See supporting data</Button>
            </div>
          </Card>
        ))}

        <Card padding={24} style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Icon name="zap" size={16} color="#635BFF"/>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0A2540' }}>Recommended actions</h3>
          </div>
          {[
            ['Initiate contact with Barrett Propane principals', 'High confidence match with current succession thesis', 'High'],
            ['Revisit valuation framework for Cherry Energy', 'Family context changed; last IOI was 18 months ago', 'Medium'],
            ['Monitor AmeriGas divestiture signals weekly', 'Geographic fit depends on which assets come to market', 'Medium'],
          ].map(([t,s,p]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #EDF1F6' }}>
              <input type="checkbox" style={{ accentColor: '#635BFF' }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A2540' }}>{t}</div>
                <div style={{ fontSize: 12, color: '#697386', marginTop: 2 }}>{s}</div>
              </div>
              <Badge tone={p === 'High' ? 'red' : 'amber'}>{p} priority</Badge>
              <Button variant="ghost" size="sm" iconRight="arrowRight">Open</Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { AnalyticsView, SignalsView, BriefView, OwnershipDonut });
