// Views2.jsx — Analytics, Signals, Fit, Brief

function AnalyticsView() {
  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <Card padding={0}><Stat label="Total market" value="$18.2B" delta="+4.2%" sub="YoY" icon="trending"/></Card>
        <Card padding={0}><Stat label="Companies tracked" value="1,247" delta="+47" sub="Q/Q" icon="building"/></Card>
        <Card padding={0}><Stat label="Platform share" value="4.7%" delta="+0.8pts" sub="YoY" icon="target"/></Card>
        <Card padding={0}><Stat label="Addressable targets" value="247" delta="+12" sub="in play" icon="zap"/></Card>
      </div>

      {/* Row 1: market share + rollup pace */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 20 }}>
        <Card padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Market share trend</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2 }}>Top 6 operators · 8-quarter</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge tone="outline">By revenue</Badge>
              <Badge tone="outline">8 quarters</Badge>
            </div>
          </div>
          <AreaChart />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid #EDF1F6' }}>
            {[['#635BFF','AmeriGas','12.1%'],['#00D4FF','Ferrellgas','9.2%'],['#009966','Suburban','6.8%'],['#AB87FF','Lampton Love','4.2%'],['#F5A623','Crystal Flash','3.1%'],['#FF5996','Dead River','2.7%']].map(([c,n,v]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }}/>
                <span style={{ color: '#425466' }}>{n}</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Roll-up pace</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 18 }}>Deals per quarter</div>
          <BarChart />
        </Card>
      </div>

      {/* Row 2: ownership breakdown + geographic */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16 }}>
        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Ownership mix</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 18 }}>by count</div>
          <OwnershipDonut />
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Top states by concentration</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 18 }}>families-owned, revenue-weighted</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px' }}>
            {[['MS',42],['AL',38],['NC',34],['TN',31],['SC',27],['GA',24],['VA',22],['LA',19]].map(([s, v]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', minWidth: 24, fontFamily: "'IBM Plex Mono'" }}>{s}</span>
                <div style={{ flex: 1, height: 6, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${v * 2}%`, height: '100%', background: '#635BFF' }} />
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: '#697386', minWidth: 24, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AreaChart() {
  const series = [
    { color: '#635BFF', d: "M 0 40 L 60 35 L 120 32 L 180 30 L 240 27 L 300 25 L 360 22 L 420 18" },
    { color: '#00D4FF', d: "M 0 80 L 60 75 L 120 74 L 180 68 L 240 65 L 300 62 L 360 58 L 420 55" },
    { color: '#009966', d: "M 0 125 L 60 122 L 120 118 L 180 118 L 240 115 L 300 112 L 360 108 L 420 105" },
    { color: '#AB87FF', d: "M 0 155 L 60 152 L 120 148 L 180 145 L 240 142 L 300 140 L 360 136 L 420 132" },
  ];
  return (
    <svg viewBox="0 0 420 200" style={{ width: '100%', height: 240 }}>
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`ag${i}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.20"/>
            <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
          </linearGradient>
        ))}
      </defs>
      <g stroke="#EDF1F6" strokeWidth="1">
        {[0,40,80,120,160].map(y => <line key={y} x1="0" x2="420" y1={y} y2={y}/>)}
      </g>
      {series.map((s, i) => (
        <path key={i} d={`${s.d} L 420 200 L 0 200 Z`} fill={`url(#ag${i})`}/>
      ))}
      {series.map((s, i) => (
        <path key={`line${i}`} d={s.d} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round"/>
      ))}
      {/* x-axis labels */}
      <g fontSize="10" fill="#8B97A8" fontFamily="'IBM Plex Mono', monospace">
        {['Q3 24','Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26','Q2 26'].map((l, i) => (
          <text key={l} x={i * 60} y="195" textAnchor="middle">{l}</text>
        ))}
      </g>
    </svg>
  );
}

function BarChart() {
  const data = [4, 6, 3, 8, 5, 11, 9, 14];
  const max = 16;
  return (
    <svg viewBox="0 0 320 180" style={{ width: '100%', height: 240 }}>
      <g stroke="#EDF1F6">
        {[0,45,90,135].map(y => <line key={y} x1="20" x2="320" y1={y + 10} y2={y + 10}/>)}
      </g>
      {data.map((v, i) => {
        const h = (v / max) * 140;
        return (
          <g key={i}>
            <rect x={30 + i * 36} y={150 - h} width="24" height={h} fill="#635BFF" rx="3"/>
            <text x={42 + i * 36} y={150 - h - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0A2540" fontFamily="'IBM Plex Mono'">{v}</text>
            <text x={42 + i * 36} y="168" textAnchor="middle" fontSize="9" fill="#8B97A8" fontFamily="'IBM Plex Mono'">{['Q3','Q4','Q1','Q2','Q3','Q4','Q1','Q2'][i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function OwnershipDonut() {
  const data = [
    { label: 'Family', value: 624, color: '#009966' },
    { label: 'Private', value: 246, color: '#697386' },
    { label: 'PE-backed', value: 189, color: '#AB87FF' },
    { label: 'Public', value: 102, color: '#1890FF' },
    { label: 'Co-op', value: 86, color: '#C4862D' },
  ];
  const total = data.reduce((a, d) => a + d.value, 0);
  let offset = 0;
  const circ = 2 * Math.PI * 50;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <g transform="translate(70 70) rotate(-90)">
          {data.map((d, i) => {
            const len = (d.value / total) * circ;
            const el = (
              <circle key={i} r="50" fill="none" stroke={d.color} strokeWidth="22" strokeDasharray={`${len} ${circ}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="70" y="68" textAnchor="middle" fontSize="24" fontWeight="600" fill="#0A2540" fontFamily="Inter" fontVariantNumeric="tabular-nums" letterSpacing="-0.5">1,247</text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#8B97A8" textTransform="uppercase" letterSpacing="0.6">companies</text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }}/>
            <span style={{ flex: 1, color: '#425466' }}>{d.label}</span>
            <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{d.value}</span>
            <span style={{ fontFamily: "'IBM Plex Mono'", color: '#8B97A8', fontSize: 11, minWidth: 36, textAlign: 'right' }}>{((d.value/total)*100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Signals feed
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
                      <div style={{ width: `${s.strength}%`, height: '100%', background: s.strength > 70 ? '#D83E4A' : s.strength > 50 ? '#C4862D' : '#635BFF' }}/>
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
                <div style={{ width: `${v * 8}%`, height: '100%', background: c, borderRadius: 2 }}/>
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

// Executive Brief
function BriefView() {
  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Hero */}
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

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[['$18.2B','Market size','+4.2%'],['247','Targets in play','+12'],['4.7%','Platform share','+0.8pt'],['$1.24B','Pro forma rev','+8.1%']].map(([v,l,d]) => (
            <Card key={l} padding={16}>
              <div style={{ fontSize: 11, color: '#697386', fontWeight: 500, marginBottom: 6 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>{v}</div>
              <div style={{ fontSize: 11, color: '#009966', fontWeight: 500, marginTop: 2 }}>↑ {d} YoY</div>
            </Card>
          ))}
        </div>

        {/* 3 key findings */}
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

        {/* Recommended actions */}
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

Object.assign(window, { AnalyticsView, SignalsView, BriefView });
