// Portfolio.jsx — Phase 13: pro-forma / portfolio builder.
//
// Lets a user assemble a "deal stack" of acquisition targets, see live
// aggregate metrics in a persistent footer bar, expand a fullscreen
// pro-forma comparison vs. Lampton Love standalone, save the basket as a
// scenario, and ship a summary via mailto:.
//
// Public API (attached to window for the in-browser-Babel build):
//   PortfolioFooterBar({ ids, onRemove, onClear, onOpen, onSave, onShare, onSelect })
//   ProFormaModal({ ids, onClose, onRemove, onSelect })
//   ShareModal({ ids, onClose })
//
// Storage: localStorage key 'pi_portfolio_v1' (managed by Dashboard).

const PI_LL_ID_FOR_PORTFOLIO = 'll';

// ---------- formatters --------------------------------------------------------
function _pfMoneyM(v) {
  if (v == null || !isFinite(v)) return '—';
  if (v >= 1000) return '$' + (v / 1000).toFixed(2) + 'B';
  return '$' + Math.round(v) + 'M';
}
function _pfInt(v) { return v == null || !isFinite(v) ? '—' : Math.round(v).toLocaleString(); }
function _pfGallons(v) {
  if (v == null || !isFinite(v) || v <= 0) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B gal';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M gal';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k gal';
  return v.toLocaleString() + ' gal';
}
function _pfPct(v, dp = 1) { return v == null || !isFinite(v) ? '—' : (+v).toFixed(dp) + '%'; }

// ---------- aggregation -------------------------------------------------------
// Compute an aggregate object for an array of company objects. Sums where
// totals are meaningful, dedupes counties + states, averages fit.
function computeAggregate(companies) {
  const out = {
    n: companies.length,
    totalRevM: 0,
    totalLocs: 0,
    seLocs: 0,
    employees: 0,
    gallons: 0,
    statesSet: new Set(),
    countySet: new Set(),
    fitSum: 0, fitCount: 0,
    nationalSharePct: 0,
  };
  for (const c of companies) {
    if (c.estRevenue != null && isFinite(+c.estRevenue)) out.totalRevM += +c.estRevenue;
    if (c.totalLocs != null) out.totalLocs += +c.totalLocs || 0;
    else if (Array.isArray(c.locations)) out.totalLocs += c.locations.length;
    if (c.seLocs != null) out.seLocs += +c.seLocs || 0;
    if (c.employeeCount != null) out.employees += +c.employeeCount || 0;
    const g = (c.marketShare && c.marketShare.nationalG) || c.estAnnualGallons;
    if (g != null && isFinite(+g)) out.gallons += +g;
    (c.states || []).forEach(s => out.statesSet.add(s));
    if (c.countyShared && Array.isArray(c.countyShared.sharedCounties)) {
      c.countyShared.sharedCounties.forEach(f => out.countySet.add(f));
    }
    if (c.fitScore != null && isFinite(+c.fitScore)) {
      out.fitSum += +c.fitScore; out.fitCount++;
    }
    if (c.marketShare && c.marketShare.nationalPct != null) out.nationalSharePct += +c.marketShare.nationalPct;
  }
  out.statesCount = out.statesSet.size;
  out.countiesCount = out.countySet.size;
  out.avgFit = out.fitCount ? Math.round(out.fitSum / out.fitCount) : null;
  return out;
}

// Resolve company ids → objects, preserving order. Skips ids that don't resolve.
function _resolvePortfolio(ids) {
  const cs = window.MOCK_COMPANIES || [];
  const byId = new Map(cs.map(c => [c.id, c]));
  const out = [];
  for (const id of ids || []) {
    const c = byId.get(id);
    if (c) out.push(c);
  }
  return out;
}

function _findLL() {
  return (window.MOCK_COMPANIES || []).find(c => c.id === PI_LL_ID_FOR_PORTFOLIO) || null;
}

// ---------- Footer bar --------------------------------------------------------
// Always visible when there are 1+ items in the portfolio. Shows count +
// aggregate KPIs, with Open / Save / Share / Clear actions.
function PortfolioFooterBar({ ids = [], onRemove, onClear, onOpen, onSave, onShare, onSelect }) {
  if (!ids.length) return null;
  const companies = _resolvePortfolio(ids);
  const agg = computeAggregate(companies);
  return (
    <div style={{
      position: 'fixed',
      left: 0, right: 0, bottom: 0,
      zIndex: 90,
      background: '#0A2540',
      color: '#fff',
      borderTop: '1px solid #1c3a5e',
      boxShadow: '0 -8px 24px rgba(10,37,64,0.18)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 14, borderRight: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#635BFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="layers" size={15} color="#fff"/>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#A1A6FF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pro forma stack</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{agg.n} target{agg.n === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* Aggregate KPIs */}
      <_PfKpi label="Combined revenue" value={_pfMoneyM(agg.totalRevM)} />
      <_PfKpi label="Locations" value={_pfInt(agg.totalLocs)} sub={agg.seLocs ? _pfInt(agg.seLocs) + ' SE' : null} />
      <_PfKpi label="Annual gallons" value={_pfGallons(agg.gallons)} />
      <_PfKpi label="States" value={_pfInt(agg.statesCount)} />
      <_PfKpi label="Counties" value={_pfInt(agg.countiesCount)} sub="LL-overlap"/>
      <_PfKpi label="Avg fit" value={agg.avgFit != null ? agg.avgFit : '—'} />

      {/* Chips */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden', maxHeight: 38, paddingRight: 4 }}>
        {companies.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect && onSelect(c.id)}
            title={c.name}
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 8px 5px 10px',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onRemove && onRemove(c.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onRemove && onRemove(c.id); } }}
              style={{ display: 'inline-flex', alignItems: 'center', color: '#A1A6FF', cursor: 'pointer' }}
              aria-label={'Remove ' + c.name}
            >
              <Icon name="x" size={11}/>
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onOpen} style={_pfBtnPrimary}>
          <Icon name="trending-up" size={13}/> Open pro forma
        </button>
        <button onClick={onSave} style={_pfBtnSecondary}>
          <Icon name="bookmark" size={13}/> Save
        </button>
        <button onClick={onShare} style={_pfBtnSecondary}>
          <Icon name="external-link" size={13}/> Share
        </button>
        <button onClick={onClear} style={_pfBtnGhost} title="Clear stack" aria-label="Clear stack">
          <Icon name="x" size={13}/>
        </button>
      </div>
    </div>
  );
}

const _pfBtnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 6, border: 'none',
  background: '#635BFF', color: '#fff',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const _pfBtnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 10px', borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.22)', background: 'transparent', color: '#fff',
  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
};
const _pfBtnGhost = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '7px 8px', borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.10)', background: 'transparent', color: '#A1A6FF',
  cursor: 'pointer', fontFamily: 'inherit',
};

function _PfKpi({ label, value, sub }) {
  return (
    <div style={{ minWidth: 86 }}>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8AA6CC' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", color: '#fff', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#7388A8', fontFamily: "'IBM Plex Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

// ---------- Pro-forma modal ---------------------------------------------------
// Side-by-side pro-forma: Lampton Love standalone vs. each target vs.
// combined entity. Builds a tidy table from the resolved company objects.
function ProFormaModal({ ids = [], onClose, onRemove, onSelect }) {
  const companies = _resolvePortfolio(ids);
  const ll = _findLL();
  const agg = computeAggregate(companies);
  const llAgg = ll ? computeAggregate([ll]) : null;
  const combined = ll ? computeAggregate([ll, ...companies]) : agg;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,0.45)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 60 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(1100px, 92vw)', maxHeight: '88vh', background: '#fff', borderRadius: 12, boxShadow: '0 30px 80px rgba(10,37,64,0.35)', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trending-up" size={16} color="#635BFF"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540' }}>Pro forma — combined entity</div>
            <div style={{ fontSize: 12, color: '#697386', marginTop: 2 }}>
              Lampton Love + {agg.n} target{agg.n === 1 ? '' : 's'} · {agg.statesCount} state{agg.statesCount === 1 ? '' : 's'} · {agg.countiesCount} overlap counties
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#8B97A8', cursor: 'pointer', padding: 4 }} aria-label="Close">
            <Icon name="x" size={18}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 22 }}>
          {/* Headline KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
            <_PfHeadline label="Combined revenue" value={_pfMoneyM(combined.totalRevM)}
              delta={ll ? `+ ${_pfMoneyM(agg.totalRevM)} from targets` : null}/>
            <_PfHeadline label="Combined locations" value={_pfInt(combined.totalLocs)}
              delta={ll ? `+ ${_pfInt(agg.totalLocs)} from targets` : null}/>
            <_PfHeadline label="Combined gallons" value={_pfGallons(combined.gallons)}
              delta={ll && agg.gallons ? `+ ${_pfGallons(agg.gallons)} from targets` : null}/>
            <_PfHeadline label="Combined footprint" value={_pfInt(combined.statesCount) + ' states'}
              delta={`${_pfInt(combined.countiesCount)} counties`}/>
          </div>

          {/* Breakdown table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F7FAFC', color: '#697386', textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10 }}>
                <th style={_pfTh}>Entity</th>
                <th style={_pfTh}>Ownership</th>
                <th style={_pfTh}>HQ</th>
                <th style={_pfThNum}>Revenue</th>
                <th style={_pfThNum}>Locations</th>
                <th style={_pfThNum}>Gallons</th>
                <th style={_pfThNum}>States</th>
                <th style={_pfThNum}>Fit</th>
                <th style={_pfTh}></th>
              </tr>
            </thead>
            <tbody>
              {ll && (
                <tr style={{ borderBottom: '1px solid #EDF1F6', background: '#FFFBF0' }}>
                  <td style={_pfTd}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD100' }}/>
                      <span style={{ fontWeight: 600, color: '#0A2540' }}>Lampton Love</span>
                      <Badge tone="amber" dot>Anchor</Badge>
                    </div>
                  </td>
                  <td style={_pfTd}>{ll.typeLabel || ll.type || '—'}</td>
                  <td style={_pfTd}>{(ll.hqCity ? ll.hqCity + ', ' : '') + (ll.hqState || '—')}</td>
                  <td style={_pfTdNum}>{_pfMoneyM(ll.estRevenue)}</td>
                  <td style={_pfTdNum}>{_pfInt(ll.totalLocs || (ll.locations || []).length)}</td>
                  <td style={_pfTdNum}>{_pfGallons((ll.marketShare && ll.marketShare.nationalG) || ll.estAnnualGallons)}</td>
                  <td style={_pfTdNum}>{_pfInt((ll.states || []).length)}</td>
                  <td style={_pfTdNum}>—</td>
                  <td style={_pfTd}></td>
                </tr>
              )}
              {companies.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #EDF1F6' }}>
                  <td style={_pfTd}>
                    <button onClick={() => onSelect && onSelect(c.id)} style={{ background: 'transparent', border: 'none', padding: 0, fontWeight: 600, color: '#0A2540', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      {c.name}
                    </button>
                  </td>
                  <td style={_pfTd}>{c.typeLabel || c.type || '—'}</td>
                  <td style={_pfTd}>{(c.hqCity ? c.hqCity + ', ' : '') + (c.hqState || '—')}</td>
                  <td style={_pfTdNum}>{_pfMoneyM(c.estRevenue)}</td>
                  <td style={_pfTdNum}>{_pfInt(c.totalLocs || (c.locations || []).length)}</td>
                  <td style={_pfTdNum}>{_pfGallons((c.marketShare && c.marketShare.nationalG) || c.estAnnualGallons)}</td>
                  <td style={_pfTdNum}>{_pfInt((c.states || []).length)}</td>
                  <td style={_pfTdNum}>{c.fitScore != null ? c.fitScore : '—'}</td>
                  <td style={_pfTd}>
                    <button onClick={() => onRemove && onRemove(c.id)} title="Remove" style={{ border: '1px solid #E3E8EE', background: '#fff', color: '#8B97A8', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>
                      <Icon name="x" size={11}/>
                    </button>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ background: '#EEF0FF' }}>
                <td style={_pfTd}>
                  <span style={{ fontWeight: 700, color: '#0A2540' }}>Combined</span>
                </td>
                <td style={_pfTd}>—</td>
                <td style={_pfTd}>—</td>
                <td style={_pfTdNum}><b>{_pfMoneyM(combined.totalRevM)}</b></td>
                <td style={_pfTdNum}><b>{_pfInt(combined.totalLocs)}</b></td>
                <td style={_pfTdNum}><b>{_pfGallons(combined.gallons)}</b></td>
                <td style={_pfTdNum}><b>{_pfInt(combined.statesCount)}</b></td>
                <td style={_pfTdNum}><b>{agg.avgFit != null ? agg.avgFit : '—'}</b></td>
                <td style={_pfTd}></td>
              </tr>
            </tbody>
          </table>

          {/* Side-by-side standalone vs combined */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <_PfPanel
              title="Lampton Love — standalone"
              accent="#FFD100"
              rows={ll ? [
                ['Revenue', _pfMoneyM(ll.estRevenue)],
                ['Locations', _pfInt(ll.totalLocs || (ll.locations || []).length)],
                ['Annual gallons', _pfGallons((ll.marketShare && ll.marketShare.nationalG) || ll.estAnnualGallons)],
                ['States served', _pfInt((ll.states || []).length)],
                ['National share', ll.marketShare ? _pfPct(ll.marketShare.nationalPct, 2) : '—'],
              ] : [['—','—']]}
            />
            <_PfPanel
              title={'Combined — LL + ' + agg.n + ' target' + (agg.n === 1 ? '' : 's')}
              accent="#635BFF"
              rows={[
                ['Revenue', _pfMoneyM(combined.totalRevM),
                  ll && llAgg ? _pfDelta(combined.totalRevM, llAgg.totalRevM) : null],
                ['Locations', _pfInt(combined.totalLocs),
                  ll && llAgg ? _pfDelta(combined.totalLocs, llAgg.totalLocs) : null],
                ['Annual gallons', _pfGallons(combined.gallons),
                  ll && llAgg && llAgg.gallons ? _pfDelta(combined.gallons, llAgg.gallons) : null],
                ['States served', _pfInt(combined.statesCount),
                  ll && llAgg ? _pfDeltaInt(combined.statesCount, llAgg.statesCount) : null],
                ['Overlap counties', _pfInt(agg.countiesCount), 'targets vs LL'],
              ]}
            />
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid #EDF1F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8B97A8' }}>
          <span>Aggregates use scoring-engine outputs (gallons, county overlap) where available.</span>
          <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid #E3E8EE', background: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#425466' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

const _pfTh = { padding: '8px 10px', borderBottom: '1px solid #E3E8EE', fontWeight: 600, fontSize: 10 };
const _pfThNum = { ..._pfTh, textAlign: 'right' };
const _pfTd = { padding: '8px 10px', verticalAlign: 'middle', color: '#425466' };
const _pfTdNum = { ..._pfTd, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: '#0A2540' };

function _pfDelta(combined, base) {
  if (!base) return null;
  const pct = ((combined - base) / base) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '% vs LL';
}
function _pfDeltaInt(combined, base) {
  const d = combined - base;
  return (d >= 0 ? '+' : '') + d + ' vs LL';
}
function _PfPanel({ title, accent, rows }) {
  return (
    <div style={{ border: '1px solid #E3E8EE', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent }}/>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>{title}</div>
      </div>
      <div style={{ padding: '6px 0' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'baseline', gap: 10, padding: '6px 14px' }}>
            <div style={{ fontSize: 11, color: '#697386' }}>{r[0]}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono', monospace" }}>{r[1]}</div>
            <div style={{ fontSize: 10, color: '#8B97A8', fontFamily: "'IBM Plex Mono', monospace" }}>{r[2] || ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function _PfHeadline({ label, value, delta }) {
  return (
    <div style={{ background: '#F7FAFC', border: '1px solid #E3E8EE', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: '#635BFF', marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>{delta}</div>}
    </div>
  );
}

// ---------- Share modal -------------------------------------------------------
// Builds a serialised summary the user can ship via email. No backend.
function ShareModal({ ids = [], onClose }) {
  const companies = _resolvePortfolio(ids);
  const ll = _findLL();
  const agg = computeAggregate(companies);
  const combined = ll ? computeAggregate([ll, ...companies]) : agg;
  const subject = `Pro forma stack — ${agg.n} target${agg.n === 1 ? '' : 's'}`;
  const lines = [
    'Propane Intelligence — Pro Forma Summary',
    '',
    `Targets: ${agg.n}`,
    `Combined revenue: ${_pfMoneyM(combined.totalRevM)}`,
    `Combined locations: ${_pfInt(combined.totalLocs)}`,
    `Combined annual gallons: ${_pfGallons(combined.gallons)}`,
    `Footprint: ${_pfInt(combined.statesCount)} states · ${_pfInt(combined.countiesCount)} overlap counties`,
    '',
    'Targets:',
    ...companies.map(c =>
      `  · ${c.name} — ${c.typeLabel || c.type || '—'} · ${c.hqCity ? c.hqCity + ', ' : ''}${c.hqState || '—'} · rev ${_pfMoneyM(c.estRevenue)} · locs ${_pfInt(c.totalLocs || (c.locations || []).length)}`
    ),
    '',
    'Generated by Propane Intelligence (' + (location && location.origin ? location.origin : 'pi') + ')',
  ];
  const body = lines.join('\r\n');
  const mailto = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      // fallback: select textarea
      const ta = document.getElementById('pi-share-textarea');
      if (ta) { ta.select(); document.execCommand && document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,0.45)', backdropFilter: 'blur(3px)', zIndex: 120, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 90 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '92vw', background: '#fff', borderRadius: 10, boxShadow: '0 25px 60px rgba(10,37,64,0.30)', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="external-link" size={16} color="#635BFF"/>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Share pro forma summary</div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#8B97A8', cursor: 'pointer' }} aria-label="Close"><Icon name="x" size={16}/></button>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, marginBottom: 8 }}>Subject</div>
          <input readOnly value={subject} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 13, color: '#0A2540', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }}/>
          <div style={{ fontSize: 11, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, marginBottom: 8 }}>Body</div>
          <textarea
            id="pi-share-textarea"
            readOnly
            value={body}
            rows={10}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#425466', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={copy} style={{ padding: '8px 12px', border: '1px solid #E3E8EE', background: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#425466' }}>
              {copied ? 'Copied ✓' : 'Copy summary'}
            </button>
            <a href={mailto} style={{ textDecoration: 'none' }}>
              <button style={{ padding: '8px 14px', border: 'none', background: '#635BFF', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Open in mail</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- exports -----------------------------------------------------------
window.PortfolioFooterBar = PortfolioFooterBar;
window.ProFormaModal = ProFormaModal;
window.ShareModal = ShareModal;
window._PI_PORTFOLIO_KEY = 'pi_portfolio_v1';
window._loadPortfolio = function() {
  try { return JSON.parse(localStorage.getItem('pi_portfolio_v1') || '[]'); } catch (e) { return []; }
};
window._savePortfolio = function(arr) {
  try { localStorage.setItem('pi_portfolio_v1', JSON.stringify(arr || [])); } catch (e) {}
};
window._computePortfolioAggregate = computeAggregate;
