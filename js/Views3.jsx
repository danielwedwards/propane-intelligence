// Views3.jsx — Strategic Fit, Competitor Overlap, Network graph

const _DEFAULT_FIT_WEIGHTS = (window.PI && window.PI.DEFAULT_WEIGHTS)
  ? Object.assign({}, window.PI.DEFAULT_WEIGHTS)
  : { geo: 25, size: 20, ops: 15, culture: 15, fin: 15, integ: 10 };

function FitView({ onSelect }) {
  const all = window.MOCK_COMPANIES || [];
  const [weights, setWeights] = React.useState(_DEFAULT_FIT_WEIGHTS);
  const [tunerOpen, setTunerOpen] = React.useState(false);
  const [region, setRegion] = React.useState('all');     // all | se
  const [minFit, setMinFit] = React.useState(0);

  // Re-rank whenever weights change. We mutate c.fitScore in place via the
  // scoring engine — every other view that reads fitScore picks up the change.
  React.useEffect(() => {
    if (window.PI && typeof window.PI.rescoreFit === 'function') {
      window.PI.rescoreFit(all, weights);
    }
  }, [weights, all]);

  const SE_STATES = (window.PI && window.PI.REGIONS && window.PI.REGIONS.se) || ['MS','AL','GA','TN','SC','NC','VA','FL','LA','AR','KY'];

  const rows = React.useMemo(() => {
    const filtered = all.filter(c => c.id !== 'll' && c.fitScore != null && c.fitScore >= minFit);
    const inRegion = region === 'se'
      ? filtered.filter(c => (c.states || []).some(s => SE_STATES.indexOf(s) >= 0))
      : filtered;
    return inRegion.sort((a, b) => b.fitScore - a.fitScore).slice(0, 12);
  }, [all, region, minFit, weights]);

  const top = rows[0];

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Scoring explanation + weight chips */}
        <Card padding={20} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#635BFF', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Strategic Fit Score</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.3px' }}>Weighted fit against Lampton Love platform</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#697386', lineHeight: 1.6 }}>
                A composite 0–100 score across six dimensions. Adjust weights below — every row, the slideover, and the table re-rank live.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {_FIT_BUCKETS.map(b => (
                  <Badge key={b.key} tone="outline">{b.label} {weights[b.key]}%</Badge>
                ))}
              </div>
            </div>
            <Button variant={tunerOpen ? 'primary' : 'secondary'} size="sm" onClick={() => setTunerOpen(o => !o)}>{tunerOpen ? 'Hide weights' : 'Adjust weights'}</Button>
          </div>

          {tunerOpen && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #EDF1F6' }}>
              <_WeightTuner weights={weights} onChange={setWeights} onReset={() => setWeights(_DEFAULT_FIT_WEIGHTS)}/>
            </div>
          )}
        </Card>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginRight: 6 }}>Filter</span>
          {[['all','All regions'],['se','Southeast only']].map(([k, l]) => (
            <button key={k} onClick={() => setRegion(k)} style={{
              padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 999,
              border: '1px solid ' + (region === k ? '#635BFF' : '#E3E8EE'),
              background: region === k ? '#EEF0FF' : '#fff', color: region === k ? '#4B45B8' : '#425466', cursor: 'pointer',
            }}>{l}</button>
          ))}
          <span style={{ marginLeft: 12, fontSize: 12, color: '#697386' }}>≥ fit</span>
          <input type="range" min="0" max="80" step="5" value={minFit} onChange={e => setMinFit(Number(e.target.value))} style={{ accentColor: '#635BFF', width: 140 }}/>
          <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600, minWidth: 24 }}>{minFit}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#697386' }}>{rows.length} target{rows.length === 1 ? '' : 's'}</span>
        </div>

        <Card padding={0}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Top {rows.length} ranked targets</div>
            <Badge tone="outline">Live re-rank</Badge>
          </div>

          {rows.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8B97A8', fontSize: 13 }}>No companies meet the current filters.</div>
          ) : (
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
                  const bd = c.fitBreakdown || { geo:0, size:0, ops:0, culture:0, fin:0, integ:0 };
                  const total = Math.round(c.fitScore || 0);
                  const initials = (c.name || '··').replace(/[^A-Za-z]/g, '').slice(0,2).toUpperCase() || '··';
                  return (
                    <tr key={c.id} onClick={() => onSelect && onSelect(c.id)} style={{ borderBottom: '1px solid #EDF1F6', cursor: 'pointer' }}>
                      <td style={{ padding: '12px 14px', color: '#8B97A8', fontFamily: "'IBM Plex Mono'", fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 5, background: '#F7FAFC', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#425466' }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 500, color: '#0A2540' }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: '#8B97A8' }}>
                              {c.typeLabel || c.type || '—'}
                              {(c.states && c.states[0]) ? ' · ' + c.states[0] + (c.states.length > 1 ? ' +' + (c.states.length - 1) : '') : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 6px', textAlign: 'center' }}><DriverPill value={Math.round(bd.geo)}/></td>
                      <td style={{ padding: '12px 6px', textAlign: 'center' }}><DriverPill value={Math.round(bd.size)}/></td>
                      <td style={{ padding: '12px 6px', textAlign: 'center' }}><DriverPill value={Math.round(bd.ops)}/></td>
                      <td style={{ padding: '12px 6px', textAlign: 'center' }}><DriverPill value={Math.round(bd.culture)}/></td>
                      <td style={{ padding: '12px 6px', textAlign: 'center' }}><DriverPill value={Math.round(bd.fin)}/></td>
                      <td style={{ padding: '12px 6px', textAlign: 'center' }}><DriverPill value={Math.round(bd.integ)}/></td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', background: '#FAFAFF' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20, fontWeight: 600, color: '#0A2540', fontFamily: 'Inter', letterSpacing: '-0.3px' }}>{total}</span>
                          <div style={{ width: 50, height: 6, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: total + '%', height: '100%', background: '#635BFF' }}/>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Right rail: radar chart for top pick */}
      <div style={{ width: 320, background: '#fff', borderLeft: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Top ranked</div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0A2540' }}>{top ? top.name : '—'}</h3>
        <div style={{ fontSize: 12, color: '#697386', marginBottom: 16 }}>
          {top ? (top.typeLabel || top.type || '—') : ''}
          {top && top.locations ? ' · ' + top.locations.length + ' locations' : ''}
        </div>

        {top && (
          <RadarChart data={[
            { label: 'Geography',   value: top.fitBreakdown ? top.fitBreakdown.geo : 0 },
            { label: 'Size',        value: top.fitBreakdown ? top.fitBreakdown.size : 0 },
            { label: 'Operations',  value: top.fitBreakdown ? top.fitBreakdown.ops : 0 },
            { label: 'Culture',     value: top.fitBreakdown ? top.fitBreakdown.culture : 0 },
            { label: 'Financial',   value: top.fitBreakdown ? top.fitBreakdown.fin : 0 },
            { label: 'Integration', value: top.fitBreakdown ? top.fitBreakdown.integ : 0 },
          ]}/>
        )}

        <div style={{ marginTop: 16, padding: 14, background: '#F7FAFC', borderRadius: 8, border: '1px solid #EDF1F6' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Score derivation</div>
          {top && top.fitBreakdown ? (
            <p style={{ margin: 0, fontSize: 12, color: '#425466', lineHeight: 1.6 }}>
              Composite of {Math.round(top.fitScore)} reflects {top.fitBreakdown.geo > 70 ? 'strong' : 'moderate'} geographic complement
              {top.proxScore && top.proxScore.mean != null ? ' (avg ' + Math.round(top.proxScore.mean) + ' mi to nearest LL location)' : ''}
              {top.countyShared && top.countyShared.count ? ', ' + top.countyShared.count + '-county overlap with the platform' : ''},
              and a {top.fitBreakdown.culture > 60 ? 'culturally compatible' : 'culturally distant'} ownership profile.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: '#8B97A8' }}>Adjust filters to surface a target.</p>
          )}
        </div>

        {top && (
          <Button variant="primary" size="md" icon="briefcase" style={{ width: '100%', marginTop: 16 }} onClick={() => onSelect && onSelect(top.id)}>Open full profile</Button>
        )}
      </div>
    </div>
  );
}

// Six-bucket weight tuner. Sliders are independent — weights aren't normalised
// to 100 because computeFitScore divides by total, so any positive set works.
function _WeightTuner({ weights, onChange, onReset }) {
  const total = _FIT_BUCKETS.reduce((s, b) => s + (weights[b.key] || 0), 0);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {_FIT_BUCKETS.map(b => {
          const v = weights[b.key] || 0;
          return (
            <div key={b.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#425466' }}>{b.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: '#0A2540', fontWeight: 600 }}>{v}%</span>
              </div>
              <input type="range" min="0" max="50" step="1" value={v} onChange={e => onChange(Object.assign({}, weights, { [b.key]: Number(e.target.value) }))} style={{ accentColor: '#635BFF', width: '100%' }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontSize: 11, color: '#697386' }}>Sum: <b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>{total}</b><span style={{ color: '#8B97A8' }}> · scaled to 100 internally</span></span>
        <Button variant="secondary" size="sm" onClick={onReset}>Reset to default</Button>
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

// Competitor Overlap — real pairwise county-overlap heatmap.
// For each pair (i, j) we compute |Ci ∩ Cj| / |Ci ∪ Cj| (Jaccard) where Ci is
// the set of FIPS counties touched by company i. attachLocationCounties() ran
// during boot, so every loc has a `fips` tag.
function OverlapView({ onSelect }) {
  const all = window.MOCK_COMPANIES || [];
  const [metric, setMetric] = React.useState('jaccard');   // jaccard | rowPct  (rowPct = shared / |row| → directional)
  const [size, setSize] = React.useState(10);              // top-N

  const data = React.useMemo(() => {
    // Build FIPS set per company; rank by national gallons (fall back to revenue, then locations).
    const ranked = all
      .map(c => {
        const fipsSet = new Set();
        for (const loc of (c.locations || [])) if (loc.fips) fipsSet.add(loc.fips);
        const score = (c.marketShare && c.marketShare.nationalG) || (c.estRevenue || 0) * 1e6 || (c.locations || []).length;
        return { id: c.id, name: c.name, fipsSet, score, isLL: c.id === 'll', _c: c };
      })
      .filter(x => x.fipsSet.size > 0)
      .sort((a, b) => b.score - a.score);

    // Always keep LL anchor in the matrix even if it's not in the top-N.
    const top = ranked.slice(0, size);
    if (!top.some(x => x.isLL)) {
      const ll = ranked.find(x => x.isLL);
      if (ll) top[top.length - 1] = ll;
    }

    // Pairwise matrix: m[i][j] = overlap value 0..100 (null on diagonal)
    const m = top.map((row, i) => top.map((col, j) => {
      if (i === j) return null;
      let inter = 0;
      row.fipsSet.forEach(f => { if (col.fipsSet.has(f)) inter++; });
      const denom = metric === 'jaccard'
        ? new Set([...Array.from(row.fipsSet), ...Array.from(col.fipsSet)]).size
        : row.fipsSet.size;
      return denom > 0 ? Math.round((inter / denom) * 100) : 0;
    }));

    // Pull a couple of insights:
    let highest = { v: -1 }, llHigh = { v: -1 }, lowest = { v: 101 };
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const v = m[i][j];
        if (v == null) continue;
        if (v > highest.v) highest = { v, a: top[i], b: top[j] };
        if (v < lowest.v && (top[i].isLL || top[j].isLL)) lowest = { v, a: top[i], b: top[j] };
        if ((top[i].isLL || top[j].isLL) && v > llHigh.v) llHigh = { v, a: top[i], b: top[j] };
      }
    }
    return { top, m, highest, llHigh, lowest };
  }, [all, metric, size]);

  const cellColor = v => v == null ? '#F7FAFC' : 'rgba(99,91,255,' + (v / 100 * 0.85 + 0.05).toFixed(2) + ')';

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#635BFF', textTransform: 'uppercase', letterSpacing: 0.6 }}>Competitor overlap</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 600, color: '#0A2540' }}>County-level service overlap</h2>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#697386' }}>Metric</span>
            <button onClick={() => setMetric('jaccard')} style={{
              padding: '5px 10px', fontSize: 11, borderRadius: 999, cursor: 'pointer',
              border: '1px solid ' + (metric === 'jaccard' ? '#635BFF' : '#E3E8EE'),
              background: metric === 'jaccard' ? '#EEF0FF' : '#fff',
              color: metric === 'jaccard' ? '#4B45B8' : '#425466',
            }}>Jaccard</button>
            <button onClick={() => setMetric('rowPct')} style={{
              padding: '5px 10px', fontSize: 11, borderRadius: 999, cursor: 'pointer',
              border: '1px solid ' + (metric === 'rowPct' ? '#635BFF' : '#E3E8EE'),
              background: metric === 'rowPct' ? '#EEF0FF' : '#fff',
              color: metric === 'rowPct' ? '#4B45B8' : '#425466',
            }}>Row %</button>
            <span style={{ fontSize: 11, color: '#697386', marginLeft: 8 }}>Top</span>
            {[8, 10, 14].map(n => (
              <button key={n} onClick={() => setSize(n)} style={{
                padding: '5px 10px', fontSize: 11, borderRadius: 999, cursor: 'pointer',
                border: '1px solid ' + (size === n ? '#635BFF' : '#E3E8EE'),
                background: size === n ? '#EEF0FF' : '#fff',
                color: size === n ? '#4B45B8' : '#425466',
              }}>{n}</button>
            ))}
          </div>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#697386' }}>
          Darker = higher overlap. {metric === 'jaccard' ? 'Jaccard = shared / union — symmetric.' : 'Row % = shared / row total — directional.'} Click a label to open the company.
        </p>
      </Card>

      <Card padding={24}>
        {data.top.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#8B97A8', fontSize: 13 }}>No companies have geocoded counties yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(' + data.top.length + ', 1fr)', gap: 2 }}>
            <div/>
            {data.top.map(c => (
              <div key={c.id} style={{ fontSize: 10, fontWeight: c.isLL ? 700 : 500, color: c.isLL ? '#4B45B8' : '#697386', textAlign: 'center', padding: '6px 4px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', cursor: 'pointer' }} onClick={() => onSelect && onSelect(c.id)} title={c.name}>{c.name}</div>
            ))}
            {data.top.map((rowCo, i) => (
              <React.Fragment key={rowCo.id}>
                <div onClick={() => onSelect && onSelect(rowCo.id)} style={{ fontSize: 12, color: rowCo.isLL ? '#4B45B8' : '#425466', padding: '10px 12px', display: 'flex', alignItems: 'center', fontWeight: rowCo.isLL ? 600 : 400, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rowCo.name}>{rowCo.name}</div>
                {data.m[i].map((v, j) => (
                  <div key={j} title={v == null ? '' : (rowCo.name + ' ↔ ' + data.top[j].name + ': ' + v + '%')} style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: cellColor(v),
                    borderRadius: 4, fontSize: 11, fontWeight: 500,
                    color: v == null ? '#C1CCD6' : v > 50 ? '#fff' : '#0A2540',
                    fontFamily: "'IBM Plex Mono'", cursor: v == null ? 'default' : 'help',
                  }}>
                    {v == null ? '—' : v + '%'}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Color scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#697386' }}>0%</span>
          <div style={{ width: 240, height: 8, background: 'linear-gradient(90deg, rgba(99,91,255,0.05), rgba(99,91,255,0.90))', borderRadius: 4 }}/>
          <span style={{ fontSize: 11, color: '#697386' }}>100%</span>
        </div>
      </Card>

      {/* Real insights derived from the matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
        {[
          { title: 'Highest overlap',     pair: data.highest, tone: 'red',   verdict: 'Direct conflict' },
          { title: 'Platform exposure',   pair: data.llHigh,  tone: 'amber', verdict: 'Watch closely'  },
          { title: 'LL whitespace',       pair: data.lowest,  tone: 'green', verdict: 'Complementary'  },
        ].map(card => (
          <Card key={card.title} padding={18}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>{card.title}</div>
            {card.pair && card.pair.a ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', marginBottom: 6 }}>{card.pair.a.name} ↔ {card.pair.b.name}</div>
                <div style={{ fontSize: 12, color: '#425466', lineHeight: 1.5, marginBottom: 10 }}>{card.pair.v}% county overlap.</div>
                <Badge tone={card.tone} dot>{card.verdict}</Badge>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#8B97A8' }}>Insufficient data.</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Network — Palantir-style relationship graph, real edges only.
//
// Node selection: LL at the centre. Inner ring = top-N candidates by fit
// score (target edges). Outer ring = top-M competitors by county overlap with
// LL (competitor edges). Plus parent-group nodes for any company in the graph
// whose parentGroup is non-trivial.
function NetworkView({ onSelect }) {
  const all = window.MOCK_COMPANIES || [];
  const [hoverId, setHoverId] = React.useState(null);
  const [innerN, setInnerN] = React.useState(6);   // # target nodes in inner ring
  const [outerN, setOuterN] = React.useState(6);   // # competitor nodes in outer ring

  const graph = React.useMemo(() => {
    const ll = all.find(c => c.id === 'll');
    if (!ll) return { nodes: [], edges: [] };

    // Inner ring: highest fit (excluding LL, must have fitScore)
    const candidates = all.filter(c => c.id !== 'll' && c.fitScore != null);
    const targets = candidates.slice().sort((a, b) => b.fitScore - a.fitScore).slice(0, innerN);

    // Outer ring: highest county overlap with LL — pull from countyShared.count
    const overlapPool = all.filter(c => c.id !== 'll' && c.countyShared && c.countyShared.count > 0)
      .slice().sort((a, b) => b.countyShared.count - a.countyShared.count);
    const competitors = [];
    const seen = new Set(targets.map(t => t.id));
    for (const c of overlapPool) {
      if (seen.has(c.id)) continue;
      competitors.push(c);
      seen.add(c.id);
      if (competitors.length >= outerN) break;
    }

    // Parent-group nodes: dedupe by parentGroup string. The anchor LL gets
    // "Ergon, Inc." pinned above it.
    const parentMap = {};
    const ringMembers = [ll, ...targets, ...competitors];
    for (const c of ringMembers) {
      const pg = c.parentGroup || c.ownerDetail;
      if (pg && pg !== c.name && pg.toLowerCase() !== 'independent' && pg.toLowerCase() !== 'public') {
        if (!parentMap[pg]) parentMap[pg] = { id: 'parent::' + pg, label: pg, children: [] };
        parentMap[pg].children.push(c.id);
      }
    }
    const parents = Object.values(parentMap);

    // Layout: LL at (500, 320). Targets at r=170, competitors at r=275.
    const nodes = [];
    nodes.push({
      id: 'll', cid: 'll', label: ll.name, x: 500, y: 320, r: 32, color: '#635BFF', tier: 0,
      sub: 'Subsidiary of Ergon · platform', isLL: true,
    });

    // Place targets in upper hemisphere, competitors in lower; spread evenly
    const placeRing = (arr, radius, startAngle, endAngle, color, tier) => {
      const n = arr.length;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const ang = startAngle + (endAngle - startAngle) * t;
        const x = 500 + Math.cos(ang) * radius;
        const y = 320 + Math.sin(ang) * radius;
        const c = arr[i];
        const sz = Math.max(14, Math.min(26, 12 + Math.sqrt((c.locations || []).length || 1) * 1.6));
        const colourByOwn = OC_NETWORK[c.ownership] || color;
        nodes.push({
          id: c.id, cid: c.id, label: c.name, x, y, r: sz,
          color: colourByOwn, tier,
          sub: (c.typeLabel || c.type || '—') + (c.fitScore != null ? ' · fit ' + Math.round(c.fitScore) : ''),
          fit: c.fitScore, overlap: c.countyShared && c.countyShared.count,
        });
      }
    };
    // Targets above (left + top + right of LL): -π .. 0
    placeRing(targets, 170, -Math.PI, 0, '#635BFF', 1);
    // Competitors below: 0 .. π
    placeRing(competitors, 275, Math.PI * 0.05, Math.PI * 0.95, '#D83E4A', 2);

    // Parent nodes: stack in a column to the right of LL.
    parents.forEach((p, i) => {
      nodes.push({
        id: p.id, cid: null, label: p.label, x: 920, y: 90 + i * 60, r: 18,
        color: '#0A2540', tier: 3, sub: 'Parent group', isParent: true,
      });
    });

    // Edges
    const edges = [];
    for (const t of targets) {
      edges.push({ a: 'll', b: t.id, type: 'target', label: t.fitScore != null ? 'fit ' + Math.round(t.fitScore) : null });
    }
    for (const c of competitors) {
      edges.push({ a: 'll', b: c.id, type: 'competitor', label: c.countyShared ? c.countyShared.count + ' shared' : null });
    }
    for (const p of parents) {
      for (const childId of p.children) edges.push({ a: childId, b: p.id, type: 'parent' });
    }

    return { nodes, edges };
  }, [all, innerN, outerN]);

  const nmap = React.useMemo(() => Object.fromEntries(graph.nodes.map(n => [n.id, n])), [graph]);
  const edgeColor = (t) => t === 'parent' ? '#0A2540' : t === 'competitor' ? '#D83E4A' : '#635BFF';
  const inspect = nmap[hoverId] || nmap['ll'];
  const llCompany = all.find(c => c.id === 'll');

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      {/* Left: legend + controls */}
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Relationship types</div>
        {[['parent','Parent / subsidiary','#0A2540'],['competitor','Direct competitor','#D83E4A'],['target','Acquisition target','#635BFF']].map(([k,l,c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12 }}>
            <div style={{ width: 20, height: 2, background: c }}/>
            <span style={{ color: '#425466' }}>{l}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #EDF1F6', marginTop: 16, paddingTop: 16, fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Graph controls</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: '#425466' }}>Top targets</span>
          <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{innerN}</span>
        </div>
        <input type="range" min="3" max="10" value={innerN} onChange={e => setInnerN(Number(e.target.value))} style={{ accentColor: '#635BFF', width: '100%', marginBottom: 10 }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: '#425466' }}>Top competitors</span>
          <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{outerN}</span>
        </div>
        <input type="range" min="3" max="10" value={outerN} onChange={e => setOuterN(Number(e.target.value))} style={{ accentColor: '#635BFF', width: '100%' }}/>

        <div style={{ borderTop: '1px solid #EDF1F6', marginTop: 16, paddingTop: 16, fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Edge sources</div>
        <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: '#697386', lineHeight: 1.7 }}>
          <li><b style={{ color: '#0A2540' }}>Target</b> — top fit score</li>
          <li><b style={{ color: '#0A2540' }}>Competitor</b> — county overlap with LL</li>
          <li><b style={{ color: '#0A2540' }}>Parent</b> — companies.json parentGroup</li>
        </ul>
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
          {graph.edges.map((e, i) => {
            const a = nmap[e.a], b = nmap[e.b];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const isHot = hoverId && (hoverId === e.a || hoverId === e.b);
            return (
              <g key={i}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={edgeColor(e.type)}
                  strokeWidth={e.type === 'parent' ? 2 : 1.25}
                  strokeDasharray={e.type === 'target' ? '4 3' : ''}
                  opacity={isHot ? 0.95 : (hoverId ? 0.18 : 0.55)}
                />
                {e.label && (!hoverId || isHot) && (
                  <g>
                    <rect x={mx - 36} y={my - 8} width="72" height="16" rx="8" fill="#fff" stroke="#E3E8EE"/>
                    <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="10" fontWeight="500" fill="#425466" fontFamily="Inter">{e.label}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {graph.nodes.map(n => {
            const initials = (n.label || '··').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '··';
            const labelW = Math.min(160, n.label.length * 6 + 16);
            const dim = hoverId && hoverId !== n.id;
            return (
              <g key={n.id}
                 transform={'translate(' + n.x + ' ' + n.y + ')'}
                 style={{ cursor: n.cid ? 'pointer' : 'default', opacity: dim ? 0.35 : 1, transition: 'opacity 120ms' }}
                 onMouseEnter={() => setHoverId(n.id)}
                 onMouseLeave={() => setHoverId(null)}
                 onClick={() => n.cid && onSelect && onSelect(n.cid)}>
                {n.isLL && <circle r={n.r + 8} fill="none" stroke={n.color} strokeWidth="1.5" opacity="0.3"/>}
                <circle r={n.r} fill={n.color} stroke="#fff" strokeWidth="3"/>
                <text y="5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Inter">{initials}</text>
                <rect x={-labelW / 2} y={n.r + 6} width={labelW} height="18" rx="9" fill="#fff" stroke="#E3E8EE"/>
                <text y={n.r + 18} textAnchor="middle" fontSize="10" fontWeight="500" fill="#0A2540" fontFamily="Inter">
                  {n.label.length > 24 ? n.label.slice(0, 22) + '…' : n.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Inspector card — reflects whatever is hovered (defaults to LL) */}
        <Card style={{ position: 'absolute', bottom: 16, left: 16, width: 320, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: inspect && inspect.color || '#635BFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {inspect ? ((inspect.label || '··').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()) : 'LL'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inspect ? inspect.label : '—'}</div>
              <div style={{ fontSize: 11, color: '#697386' }}>{inspect ? inspect.sub : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#697386', marginBottom: 10 }}>
            <span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>{innerN}</b> targets</span>
            <span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>{outerN}</b> competitors</span>
            <span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>{llCompany && llCompany.countyShared ? llCompany.countyShared.count : '—'}</b> LL counties</span>
          </div>
          {inspect && inspect.cid ? (
            <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() => onSelect && onSelect(inspect.cid)}>Open profile</Button>
          ) : (
            <Button variant="secondary" size="sm" style={{ width: '100%' }} disabled>Hover a node</Button>
          )}
        </Card>
      </div>
    </div>
  );
}

// Ownership → node colour for the network graph
const OC_NETWORK = { ll:'#635BFF', public:'#1890FF', pe:'#AB87FF', family:'#009966', coop:'#C4862D', private:'#697386', unknown:'#8B97A8' };

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

// Six-bucket fit-score bar chart (driven by c.fitBreakdown).
// Optionally renders a "score inputs" attribution panel showing the underlying
// measured values that drove the abstract bucket scores — proximity, county
// overlap, market share, gallons, and revenue density.
function _FitBreakdown({ breakdown, total, company }) {
  if (!breakdown) {
    return <div style={{ fontSize: 12, color: '#8B97A8' }}>Score breakdown unavailable.</div>;
  }
  const c = company || {};
  // Compute weighted contribution of each bucket toward the composite, so the
  // analyst can see "where the points came from" beyond the raw 0–100 bars.
  const contribs = _FIT_BUCKETS.map(b => {
    const raw = Math.max(0, Math.min(100, +(breakdown[b.key] || 0)));
    return { ...b, raw, contrib: (raw * b.weight) / 100 };
  });
  const compositeFromBreakdown = contribs.reduce((s, x) => s + x.contrib, 0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.4px' }}>{Math.round(total || 0)}</div>
        <div style={{ fontSize: 11, color: '#697386' }}>composite fit · 0–100</div>
      </div>
      {contribs.map(b => {
        const v = Math.round(b.raw);
        const tone = v > 75 ? '#009966' : v > 55 ? '#635BFF' : v > 35 ? '#C4862D' : '#8B97A8';
        return (
          <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 38px 56px', alignItems: 'center', gap: 10, padding: '5px 0' }}>
            <div style={{ fontSize: 12, color: '#425466' }}>{b.label}<span style={{ color: '#8B97A8', marginLeft: 4 }}>{b.weight}%</span></div>
            <div style={{ height: 6, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: v + '%', height: '100%', background: tone, borderRadius: 3 }}/>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono'", textAlign: 'right' }}>{v}</div>
            <div style={{ fontSize: 10, color: '#697386', fontFamily: "'IBM Plex Mono'", textAlign: 'right' }} title="Weighted contribution toward composite (raw × weight)">
              +{b.contrib.toFixed(1)}
            </div>
          </div>
        );
      })}

      <div style={{
        marginTop: 8, paddingTop: 8, borderTop: '1px dashed #EDF1F6',
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 8,
        fontSize: 11, color: '#697386',
      }}>
        <span>Σ weighted contributions</span>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: '#0A2540' }}>
          {compositeFromBreakdown.toFixed(1)}
        </span>
      </div>

      {/* Score inputs — the underlying measurements that drove the bucket scores. */}
      {(c.proxScore || c.countyShared || c.marketShare) && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#FBFCFE', border: '1px solid #EDF1F6', borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Score inputs</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
            {c.proxScore && c.proxScore.mean != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#697386' }}>Proximity · avg dist</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{Math.round(c.proxScore.mean)} mi</span>
              </div>
            )}
            {c.proxScore && c.proxScore.locsWithin100 != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#697386' }}>Locs ≤100 mi LL</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{c.proxScore.locsWithin100}</span>
              </div>
            )}
            {c.countyShared && c.countyShared.count != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#697386' }}>Shared counties</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{c.countyShared.count}</span>
              </div>
            )}
            {c.countyShared && c.countyShared.pct != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#697386' }}>% of LL counties</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{(+c.countyShared.pct).toFixed(0)}%</span>
              </div>
            )}
            {c.marketShare && c.marketShare.nationalPct != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#697386' }}>National share</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>{(+c.marketShare.nationalPct).toFixed(2)}%</span>
              </div>
            )}
            {c.estRevenue != null && c.employeeCount != null && c.employeeCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#697386' }}>Rev / employee</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540', fontWeight: 600 }}>${(c.estRevenue * 1e6 / c.employeeCount / 1000).toFixed(0)}k</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Company Detail (slideover) — used in multiple views
function CompanyDetail({ companyId, onClose, onCompare, onAddPortfolio, inPortfolio }) {
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
          {c.id !== 'll' && (
            <Button
              variant={inPortfolio ? 'secondary' : 'primary'}
              size="sm"
              icon={inPortfolio ? 'check' : 'plus'}
              onClick={() => onAddPortfolio && onAddPortfolio(c.id)}
              disabled={!!inPortfolio}
            >{inPortfolio ? 'In pro forma' : 'Add to pro forma'}</Button>
          )}
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
          <_Kpi label="Annual gallons" value={_fmtGallons((c.marketShare && c.marketShare.nationalG) || c.estAnnualGallons)}/>
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
          <_FitBreakdown breakdown={c.fitBreakdown} total={c.fitScore} company={c}/>
        </div>

        {/* Locations table (real, paginated) */}
        {locs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <_SectionHead right={<span style={{ fontSize: 10, color: '#8B97A8' }}>{_fmtInt(locs.length)} total</span>}>Locations</_SectionHead>
            <div style={{ border: '1px solid #EDF1F6', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.5fr 1fr 0.8fr', padding: '8px 12px', background: '#F7FAFC', borderBottom: '1px solid #EDF1F6', fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                <div>City</div><div>State</div><div>County</div><div style={{ textAlign: 'right' }}>Lat / Lng</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.5fr 1fr 0.8fr 56px', padding: '8px 12px', background: '#F7FAFC', borderBottom: '1px solid #EDF1F6', fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: -33 }}>
                <div/><div/><div/><div/><div style={{ textAlign: 'right' }}/>
              </div>
              {visibleLocs.map((loc, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.5fr 1fr 0.8fr 56px', padding: '7px 12px', borderBottom: i === visibleLocs.length - 1 ? 'none' : '1px solid #F2F4F7', fontSize: 12, color: '#425466', alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loc.address || loc.name || loc.city || ''}>{loc.city || loc.name || '—'}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", color: '#0A2540' }}>{loc.state || '—'}</div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.county || '—'}</div>
                  <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono'", color: '#8B97A8', fontSize: 11 }}>
                    {loc.lat != null && loc.lng != null ? Number(loc.lat).toFixed(2) + ', ' + Number(loc.lng).toFixed(2) : '—'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {loc.lat != null && loc.lng != null ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('pi:focus-location', { detail: { lat: +loc.lat, lng: +loc.lng, zoom: 11, companyId: c.id } }));
                          if (typeof onClose === 'function') onClose();
                        }}
                        title="Show on map"
                        style={{
                          padding: '3px 8px', border: '1px solid #E3E8EE', background: '#fff',
                          color: '#4B45B8', fontSize: 10, fontWeight: 600, borderRadius: 4,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >On map</button>
                    ) : null}
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
    ['Annual gallons', (c) => _fmtGallons((c.marketShare && c.marketShare.nationalG) || c.estAnnualGallons), (c) => (c.marketShare && c.marketShare.nationalG) || c.estAnnualGallons],
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
          <Button
            variant="secondary"
            size="sm"
            icon="download"
            onClick={() => {
              // Build a CSV out of the same row definitions used in the table.
              const header = ['Metric', ...companies.map(c => c.name)];
              const lines = [header.join(',')];
              rows.forEach(([label, fmt]) => {
                const cells = [label, ...companies.map(c => {
                  const v = fmt(c);
                  if (v == null) return '';
                  const s = String(v).replace(/"/g, '""');
                  return /[,"\n]/.test(s) ? '"' + s + '"' : s;
                })];
                lines.push(cells.join(','));
              });
              const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              const stamp = new Date().toISOString().slice(0, 10);
              a.href = url;
              a.download = 'pi_compare_' + stamp + '.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >Export</Button>
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
