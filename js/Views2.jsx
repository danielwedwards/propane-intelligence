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

// ECharts host: mounts a chart on a div, applies setOption({ ... }) on every change
// to `option`, and disposes on unmount. Keeps Analytics free of mount/dispose boilerplate.
function _EChart({ option, height = 260, style }) {
  const ref = React.useRef(null);
  const chartRef = React.useRef(null);
  React.useEffect(() => {
    if (!window.echarts || !ref.current) return;
    chartRef.current = window.echarts.init(ref.current, null, { renderer: 'canvas' });
    const onResize = () => { try { chartRef.current && chartRef.current.resize(); } catch (e) {} };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      try { chartRef.current && chartRef.current.dispose(); } catch (e) {}
      chartRef.current = null;
    };
  }, []);
  React.useEffect(() => {
    if (!chartRef.current || !option) return;
    try { chartRef.current.setOption(option, true); } catch (e) {}
  }, [option]);
  if (!window.echarts) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#8B97A8', background: '#F7FAFC', borderRadius: 6, ...(style || {}) }}>
        Loading chart library…
      </div>
    );
  }
  return <div ref={ref} style={{ width: '100%', height, ...(style || {}) }} />;
}

// Lift Phase 10 filter state into a window-shared object so Analytics can mirror it.
// CompanyListView writes here whenever its filter inputs change; AnalyticsView reads
// here so the same filter set drives both views without prop-drilling through Dashboard.
window._PI_SHARED_FILTERS = window._PI_SHARED_FILTERS || { filters: null, search: '' };

// Aggregate the company list once per render; memoise on companies length.
function useAnalyticsAggregates(filteredList) {
  const list = filteredList || window.MOCK_COMPANIES || [];
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

// Phase 15 — ownership pill set + companyType pill set used inside AnalyticsView.
const _ANALYTICS_OWN_OPTS = [
  { k: 'family',  label: 'Family',    color: '#009966' },
  { k: 'private', label: 'Private',   color: '#697386' },
  { k: 'pe',      label: 'PE-backed', color: '#AB87FF' },
  { k: 'public',  label: 'Public',    color: '#1890FF' },
  { k: 'coop',    label: 'Co-op',     color: '#C4862D' },
];
const _ANALYTICS_TYPE_OPTS = [
  { k: 'retail_dealer',       label: 'Retail dealer'    },
  { k: 'multi_fuel',          label: 'Multi-fuel'       },
  { k: 'coop_utility',        label: 'Co-op / utility'  },
  { k: 'industrial_gas',      label: 'Industrial gas'   },
  { k: 'cylinder_exchange',   label: 'Cylinder'         },
  { k: 'wholesale_transport', label: 'Wholesale'        },
];

function AnalyticsView() {
  // In-view filter state: subset of the global filter spec (ownership, companyType,
  // freeform search). Mirrors any filters the user set inside CompanyListView.
  const all = window.MOCK_COMPANIES || [];
  const shared = window._PI_SHARED_FILTERS || {};
  const seedOwn = shared.filters && shared.filters.ownership ? new Set(shared.filters.ownership) : new Set();
  const seedSearch = shared.search || '';
  const [ownership, setOwnership] = React.useState(seedOwn);
  const [companyType, setCompanyType] = React.useState(new Set());
  const [search, setSearch] = React.useState(seedSearch);

  const filtered = React.useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return all.filter(c => {
      if (ownership.size && !ownership.has((c.ownership || '').toLowerCase())) return false;
      if (companyType.size && !companyType.has(c.companyType || '')) return false;
      if (q) {
        const hay = [c.name, c.parent, c.parentGroup, c.hqCity, c.hqState, (c.states || []).join(' ')]
          .filter(Boolean).join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }, [all, ownership, companyType, search]);

  const agg = useAnalyticsAggregates(filtered);
  const llRow = all.find(c => c.id === 'll');
  const llShare = (llRow && llRow.marketShare) ? llRow.marketShare.nationalPct : null;
  const top6Pct = agg.topOperators.reduce((a, o) => a + (o.gallons || 0), 0);
  const totalG = agg.totalGallons;

  // ---- ECharts options ----
  // Ownership pie — derives data from agg.ownership (already filtered).
  const ownershipPieOption = React.useMemo(() => {
    const c = agg.ownership || {};
    const data = [
      { name: 'Family',    value: c.family  || 0, itemStyle: { color: '#009966' } },
      { name: 'Private',   value: c.private || 0, itemStyle: { color: '#697386' } },
      { name: 'PE-backed', value: c.pe      || 0, itemStyle: { color: '#AB87FF' } },
      { name: 'Public',    value: c.public  || 0, itemStyle: { color: '#1890FF' } },
      { name: 'Co-op',     value: c.coop    || 0, itemStyle: { color: '#C4862D' } },
      { name: 'Other',     value: (c.other || 0) + (c.ll || 0), itemStyle: { color: '#C1CCD6' } },
    ].filter(d => d.value > 0);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'middle', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12, color: '#425466' } },
      series: [{
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 600, color: '#0A2540' } },
        data,
      }],
    };
  }, [agg.ownership]);

  // Business-Type bar — counts per c.companyType in the *unfiltered-by-type* set
  // so the user sees every bucket even when one is excluded by their filter.
  const businessTypeOption = React.useMemo(() => {
    // Apply ownership/search filters but ignore companyType filter to keep bars visible.
    const q = (search || '').trim().toLowerCase();
    const counts = { retail_dealer: 0, multi_fuel: 0, coop_utility: 0, industrial_gas: 0, cylinder_exchange: 0, wholesale_transport: 0 };
    for (const c of all) {
      if (ownership.size && !ownership.has((c.ownership || '').toLowerCase())) continue;
      if (q) {
        const hay = [c.name, c.parent, c.hqCity, c.hqState].filter(Boolean).join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) continue;
      }
      const t = c.companyType || '';
      if (counts[t] != null) counts[t]++;
    }
    const labels = _ANALYTICS_TYPE_OPTS.map(o => o.label);
    const values = _ANALYTICS_TYPE_OPTS.map(o => counts[o.k] || 0);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 16, top: 12, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { color: '#697386', fontSize: 11, interval: 0, rotate: 0 }, axisLine: { lineStyle: { color: '#E3E8EE' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { color: '#8B97A8', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF1F6' } } },
      series: [{
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: companyType.size === 0 || companyType.has(_ANALYTICS_TYPE_OPTS[i].k) ? '#635BFF' : '#C1CCD6', borderRadius: [4, 4, 0, 0] },
        })),
        barMaxWidth: 56,
        label: { show: true, position: 'top', fontSize: 11, color: '#0A2540', fontFamily: "'IBM Plex Mono'", fontWeight: 600 },
      }],
    };
  }, [all, ownership, search, companyType]);

  // Top 25 by Locations — horizontal bar chart over the filtered set.
  const topLocationsOption = React.useMemo(() => {
    const ranked = filtered
      .map(c => ({ name: c.name, locs: (c.locations || []).length || c.totalLocs || 0, isLL: c.id === 'll' }))
      .filter(r => r.locs > 0)
      .sort((a, b) => b.locs - a.locs)
      .slice(0, 25);
    // ECharts renders horizontal bars top→bottom in y-axis order, so reverse for descending top→bottom.
    const reversed = ranked.slice().reverse();
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => p[0].name + ': <b>' + p[0].value.toLocaleString() + '</b> locations' },
      grid: { left: 8, right: 60, top: 8, bottom: 24, containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: '#8B97A8', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF1F6' } } },
      yAxis: {
        type: 'category',
        data: reversed.map(r => r.name),
        axisLabel: { color: '#425466', fontSize: 11, fontFamily: 'Inter' },
        axisLine: { lineStyle: { color: '#E3E8EE' } },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        data: reversed.map(r => ({ value: r.locs, itemStyle: { color: r.isLL ? '#FFD100' : '#635BFF', borderRadius: [0, 3, 3, 0] } })),
        barMaxWidth: 14,
        label: { show: true, position: 'right', fontSize: 11, color: '#0A2540', fontFamily: "'IBM Plex Mono'", fontWeight: 600, formatter: (p) => Number(p.value).toLocaleString() },
      }],
    };
  }, [filtered]);

  const togglePill = (setter, k) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const filterSummary = (() => {
    const parts = [];
    if (ownership.size) parts.push(ownership.size + ' ownership');
    if (companyType.size) parts.push(companyType.size + ' type');
    if (search) parts.push('“' + search + '”');
    return parts.length ? parts.join(' · ') : 'No filters · all ' + all.length.toLocaleString() + ' companies';
  })();

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      {/* Filter strip */}
      <div style={{ background: '#fff', border: '1px solid #E3E8EE', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="filter" size={13} color="#635BFF" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>Analytics filter</span>
            <span style={{ fontSize: 11, color: '#8B97A8' }}>{filterSummary}</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={12} color="#8B97A8" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, city, state…"
              style={{ marginLeft: -16, padding: '6px 10px 6px 22px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 220 }}
            />
          </div>
          {(ownership.size > 0 || companyType.size > 0 || search) && (
            <button
              onClick={() => { setOwnership(new Set()); setCompanyType(new Set()); setSearch(''); }}
              style={{ padding: '6px 10px', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 12, color: '#425466', cursor: 'pointer', fontFamily: 'inherit' }}
            >Clear</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.4, marginRight: 4 }}>Ownership</span>
            {_ANALYTICS_OWN_OPTS.map(o => {
              const on = ownership.has(o.k);
              return (
                <button key={o.k} onClick={() => togglePill(setOwnership, o.k)} style={{
                  padding: '3px 9px', border: '1px solid ' + (on ? o.color : '#E3E8EE'),
                  background: on ? o.color : '#fff', color: on ? '#fff' : '#425466',
                  borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>{o.label}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.4, marginRight: 4 }}>Business type</span>
            {_ANALYTICS_TYPE_OPTS.map(o => {
              const on = companyType.has(o.k);
              return (
                <button key={o.k} onClick={() => togglePill(setCompanyType, o.k)} style={{
                  padding: '3px 9px', border: '1px solid ' + (on ? '#635BFF' : '#E3E8EE'),
                  background: on ? '#EEF0FF' : '#fff', color: on ? '#4B45B8' : '#425466',
                  borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>{o.label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <Card padding={0}><Stat label="Companies tracked" value={_v2_fmtInt(agg.total)}    delta={null} sub={`${_v2_fmtInt(agg.totalLocs)} locations`} icon="building"/></Card>
        <Card padding={0}><Stat label="Annual gallons"    value={_v2_fmtGallons(agg.totalGallons)} delta={null} sub="filtered set" icon="trending"/></Card>
        <Card padding={0}><Stat label="Aggregate revenue" value={_v2_fmtMoneyM(agg.totalRev)}     delta={null} sub="estimated" icon="zap"/></Card>
        <Card padding={0}><Stat label="Lampton Love share" value={llShare != null ? llShare.toFixed(2) + '%' : '—'} delta={null} sub="of national gallons" icon="target"/></Card>
      </div>

      {/* Row 1: Top operators (gallons) + Acquisition pace */}
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

      {/* Row 2: ECharts ownership pie + business-type bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16, marginBottom: 20 }}>
        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Ownership mix</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 12 }}>by company count · {_v2_fmtInt(agg.total)} in view</div>
          <_EChart option={ownershipPieOption} height={240} />
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Business type</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 12 }}>company count by retail-channel</div>
          <_EChart option={businessTypeOption} height={240} />
        </Card>
      </div>

      {/* Row 3: Top 25 by locations + top states by gallons (existing) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Top 25 operators</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 12 }}>by branch-location count · LL highlighted</div>
          <_EChart option={topLocationsOption} height={520} />
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4 }}>Top states by gallons</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A2540', marginTop: 2, marginBottom: 18 }}>filtered operators</div>
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
            {agg.stateRows.length === 0 && (
              <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#8B97A8', padding: 16, textAlign: 'center' }}>No state-level gallons in current filter.</div>
            )}
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
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="600" fill="#0A2540" fontFamily="Inter" letterSpacing="-0.5">{_v2_fmtInt(t)}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#8B97A8" letterSpacing="0.6">COMPANIES</text>
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

// Real-data signals: derive deal-relevant signals from companies + scoring engine.
// Signal types are deterministic patterns over real attributes:
//   - Family succession: family-owned + fitScore >= 45 (anchored to LL fit)
//   - Geographic overlap: countyShared.count >= 3 with LL
//   - PE exit window: ownership == pe and fitScore >= 40
//   - Public divestiture watch: ownership == public
//   - Co-op governance shift: ownership == coop
//   - Roll-up momentum: any acquisitions in record
// Each signal carries a "strength" (0–100) so the feed sorts the loudest first.
function _deriveSignals(companies) {
  const ll = companies.find(c => c.id === 'll' || c.canonicalId === 'lampton_love');
  const out = [];
  companies.forEach(c => {
    if (c === ll) return;
    const own = (c.ownership || '').toLowerCase();
    const fit = c.fitScore || 0;
    const overlap = c.countyShared ? (c.countyShared.count || 0) : 0;
    const stateLabel = c.hqState || (c.states && c.states[0]) || '—';
    const locs = c.totalLocs || c.locs || 0;

    if (own === 'family' && fit >= 45) {
      const strength = Math.min(98, 50 + Math.round(fit * 0.5) + Math.min(20, overlap * 2));
      out.push({
        cid: c.id, co: c.name, tone: 'green', type: 'Family succession candidate',
        text: 'Family-owned operator (' + locs + ' locations · ' + stateLabel + '). Fit score ' + Math.round(fit) + ' / 100 · ' + overlap + ' shared counties with LL. Watch for principal-age and generational-transition cues.',
        strength, tags: ['Succession', overlap >= 3 ? 'Adjacent geography' : 'New geography'],
      });
    }
    if (overlap >= 3 && own !== 'public') {
      const strength = Math.min(95, 40 + overlap * 4 + Math.round(fit * 0.3));
      out.push({
        cid: c.id, co: c.name, tone: 'amber', type: 'Geographic overlap',
        text: overlap + ' counties shared with LL footprint · ' + stateLabel + ' · ' + locs + ' locations. Acquisition would consolidate density rather than extend reach.',
        strength, tags: ['Density play', 'Overlap ≥ ' + overlap],
      });
    }
    if ((own === 'pe' || own === 'private equity') && fit >= 40) {
      const strength = Math.min(92, 55 + Math.round(fit * 0.4));
      out.push({
        cid: c.id, co: c.name, tone: 'amber', type: 'PE platform — exit window',
        text: 'PE-backed operator with fit ' + Math.round(fit) + ' / 100. Hold-period dynamics suggest secondary sale within 12–24 months — monitor for banker engagement.',
        strength, tags: ['Exit watch'],
      });
    }
    if (own === 'public' && fit >= 30) {
      out.push({
        cid: c.id, co: c.name, tone: 'blue', type: 'Public divestiture watch',
        text: 'Public operator (' + (c.ticker ? c.ticker + ' · ' : '') + locs + ' locations). Watch for non-core asset divestitures consistent with capital-allocation guidance.',
        strength: Math.min(78, 35 + Math.round(fit * 0.5)),
        tags: ['Carve-out potential'],
      });
    }
    if (own === 'cooperative' || own === 'coop' || own === 'co-op') {
      if (fit >= 35) {
        out.push({
          cid: c.id, co: c.name, tone: 'neutral', type: 'Co-op governance',
          text: 'Cooperative ownership · ' + locs + ' locations. Strategic moves require board approval but historical precedent for asset rationalisation exists.',
          strength: Math.min(68, 30 + Math.round(fit * 0.4)),
          tags: ['Co-op'],
        });
      }
    }
    if (Array.isArray(c.acquisitions) && c.acquisitions.length > 0) {
      out.push({
        cid: c.id, co: c.name, tone: 'neutral', type: 'Roll-up momentum',
        text: 'Active acquirer · ' + c.acquisitions.length + ' tracked deals. Pace and target profile inform competitive bidding dynamics.',
        strength: Math.min(80, 45 + c.acquisitions.length * 4),
        tags: ['Acquirer'],
      });
    }
  });
  out.sort((a, b) => b.strength - a.strength);
  return out;
}

// Hard-signal loader: pull data/signals.json (output of signals_ingest.py)
// once per page lifetime. Cached on window so re-mounting the view is cheap.
window.__SIGNALS_READY__ = window.__SIGNALS_READY__ || (async () => {
  try {
    const r = await fetch('data/signals.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('signals.json ' + r.status);
    const j = await r.json();
    window.HARD_SIGNALS = Array.isArray(j.signals) ? j.signals : [];
    window.SIGNALS_META = {
      generatedAt: j.generatedAt || null,
      count: window.HARD_SIGNALS.length,
      live: window.HARD_SIGNALS.length > 0,
    };
    window.dispatchEvent(new CustomEvent('pi:signals-loaded', { detail: window.SIGNALS_META }));
    console.info('[PI] signals.json loaded —', window.HARD_SIGNALS.length, 'hard signals');
  } catch (err) {
    window.HARD_SIGNALS = [];
    window.SIGNALS_META = { generatedAt: null, count: 0, live: false };
    console.warn('[PI] signals.json unavailable:', err.message);
  }
})();

// Adapt a hard signal (SEC filing / promoted news) into the same shape the
// SignalsView row renders. Adds confidence + url so the badge/link are
// surfaced consistently with soft signals.
function _adaptHardSignal(s) {
  const tone = s.confidence === 'high' ? 'red' : 'amber';
  return {
    cid: s.companyId || null,
    co: s.companyLabel || s.companyId || '—',
    tone,
    type: s.label || 'SEC filing',
    text: (s.notes || s.evidence || '') +
          (s.observedAt ? ' · Filed ' + (s.observedAt || '').slice(0, 10) : ''),
    strength: Math.max(50, Math.min(99, s.strength || 70)),
    tags: ['Hard signal', ...(s.tags || []).slice(0, 2)],
    url: s.url || '',
    confidence: s.confidence || 'high',
    isHard: true,
  };
}

function SignalsView({ onSelect }) {
  const all = (typeof window !== 'undefined' && window.MOCK_COMPANIES) || [];
  // Bump on `pi:signals-loaded` so we pick up live signals when ingest finishes.
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const h = () => setTick(t => t + 1);
    window.addEventListener('pi:signals-loaded', h);
    return () => window.removeEventListener('pi:signals-loaded', h);
  }, []);

  const softSignals = React.useMemo(() => _deriveSignals(all), [all]);
  const hardSignals = React.useMemo(
    () => (window.HARD_SIGNALS || []).map(_adaptHardSignal),
    [tick]
  );
  const meta = window.SIGNALS_META || { live: false, generatedAt: null };
  // Hard signals first (they're the highest-confidence), then soft.
  const allSignals = React.useMemo(
    () => [...hardSignals.sort((a, b) => b.strength - a.strength), ...softSignals],
    [hardSignals, softSignals]
  );
  const [filter, setFilter] = React.useState('all');
  const [limit, setLimit] = React.useState(40);

  const types = React.useMemo(() => {
    const m = new Map();
    allSignals.forEach(s => { m.set(s.type, (m.get(s.type) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [allSignals]);

  const filtered = filter === 'all' ? allSignals : allSignals.filter(s => s.type === filter);
  const visible = filtered.slice(0, limit);
  const signals = visible;

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <Card padding={0}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0A2540' }}>
              Signals
              <span style={{ color: '#8B97A8', fontWeight: 400, marginLeft: 6 }}>
                · {hardSignals.length} hard · {softSignals.length} soft · {filtered.length} after filter
              </span>
              {meta.live && (
                <span style={{ marginLeft: 10, fontSize: 11, color: '#009966', fontWeight: 500 }}>
                  ● live (ingested {meta.generatedAt ? meta.generatedAt.slice(0, 10) : 'just now'})
                </span>
              )}
            </div>
            <select value={filter} onChange={e => { setFilter(e.target.value); setLimit(40); }} style={{ padding: '6px 10px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 12, color: '#0A2540', background: '#fff', fontFamily: 'inherit' }}>
              <option value="all">All types</option>
              {types.map(([t, n]) => <option key={t} value={t}>{t} ({n})</option>)}
            </select>
            <Button variant="secondary" size="sm">Sort: Strength</Button>
          </div>

          {signals.map((s, i) => (
            <div key={(s.cid || '') + '-' + i} onClick={() => onSelect && onSelect(s.cid || s.co)} style={{
              padding: '16px 20px',
              borderBottom: '1px solid #EDF1F6',
              borderLeft: s.isHard ? '3px solid #D83E4A' : '3px solid transparent',
              display: 'flex', gap: 14, cursor: 'pointer',
              background: s.isHard ? 'linear-gradient(90deg,rgba(216,62,74,0.04),transparent 30%)' : 'transparent',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.isHard ? '#FEF2F3' : '#F7FAFC', border: '1px solid ' + (s.isHard ? '#FCD2D6' : '#E3E8EE'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.isHard ? 'briefcase' : s.type.includes('succession') || s.type.includes('Succession') ? 'users' : s.type.includes('exit') || s.type.includes('Exit') ? 'arrowUp' : s.type.includes('overlap') || s.type.includes('Geographic') ? 'map' : s.type.includes('Public') ? 'building' : s.type.includes('Roll') ? 'zap' : 'sparkle'} size={15} color={s.isHard ? '#D83E4A' : '#635BFF'}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>{s.co}</span>
                  <Badge tone={s.tone} dot>{s.type}</Badge>
                  {s.isHard
                    ? <Badge tone="red">Hard · {(s.confidence || 'high').toUpperCase()}</Badge>
                    : <Badge tone="outline">Heuristic</Badge>}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#425466', lineHeight: 1.5 }}>{s.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3 }}>Signal strength</span>
                    <div style={{ width: 80, height: 4, background: '#EDF1F6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: s.strength + '%', height: '100%', background: s.strength > 70 ? '#D83E4A' : s.strength > 50 ? '#C4862D' : '#635BFF' }}/>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#0A2540', fontWeight: 600 }}>{s.strength}</span>
                  </div>
                  {(s.tags || []).map(t => <Badge key={t} tone="outline">{t}</Badge>)}
                </div>
              </div>
              <Icon name="chevronRight" size={16} color="#C1CCD6"/>
            </div>
          ))}
          {filtered.length > limit && (
            <div style={{ padding: '14px 20px', textAlign: 'center', borderTop: '1px solid #EDF1F6' }}>
              <Button variant="ghost" size="sm" onClick={() => setLimit(limit + 40)}>Show {Math.min(40, filtered.length - limit)} more</Button>
              <span style={{ fontSize: 11, color: '#8B97A8', marginLeft: 8 }}>{visible.length} of {filtered.length}</span>
            </div>
          )}
        </Card>
      </div>

      {/* Signal types sidebar — counts come from real derivation */}
      <div style={{ width: 280, background: '#fff', borderLeft: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Signal volume (active)</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {types.map(([l, v], i) => {
            const palette = ['#009966','#C4862D','#1890FF','#635BFF','#AB87FF','#D83E4A','#697386'];
            const color = palette[i % palette.length];
            const max = types[0] ? types[0][1] : 1;
            return (
              <div key={l} onClick={() => { setFilter(filter === l ? 'all' : l); setLimit(40); }} style={{ padding: '8px 10px', border: '1px solid ' + (filter === l ? '#635BFF' : '#EDF1F6'), borderRadius: 6, cursor: 'pointer', background: filter === l ? '#F2F1FF' : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#425466' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>{v}</span>
                </div>
                <div style={{ height: 3, background: '#EDF1F6', borderRadius: 2 }}>
                  <div style={{ width: ((v / max) * 100) + '%', height: '100%', background: color, borderRadius: 2 }}/>
                </div>
              </div>
            );
          })}
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

// Executive Brief — derives real KPIs and findings from companies + scoring engine.
function _v2_briefAggregates(companies) {
  const ll = companies.find(c => c.id === 'll' || c.canonicalId === 'lampton_love');
  const llG = ll && ll.marketShare ? (ll.marketShare.nationalG || 0) : 0;
  const llRev = ll ? (ll.estRevenue || ll.rev || 0) : 0;
  const llLocs = ll ? (ll.totalLocs || ll.locs || 0) : 0;
  // LL's own county count: prefer countyShared.count for self (=100% pct), else derive from location fips set.
  const llCounties = (() => {
    if (!ll) return 0;
    if (ll.countyShared && ll.countyShared.count) return ll.countyShared.count;
    const s = new Set();
    (ll.locations || []).forEach(l => { if (l && l.fips) s.add(l.fips); });
    return s.size;
  })();

  let totalG = 0, totalRev = 0, totalLocs = 0;
  let famN = 0, peN = 0;
  const SE_SET = (window.PI && window.PI.REGIONS && window.PI.REGIONS.se) || new Set(['MS','AL','GA','FL','SC','NC','TN','LA','AR']);
  let seCompanies = 0;

  companies.forEach(c => {
    totalG += (c.marketShare && c.marketShare.nationalG) || c.estAnnualGallons || 0;
    totalRev += c.estRevenue || c.rev || 0;
    totalLocs += c.totalLocs || c.locs || 0;
    const own = (c.ownership || '').toLowerCase();
    if (own === 'family') famN++;
    if (own === 'pe' || own === 'private equity') peN++;
    const states = c.states || (c.hqState ? [c.hqState] : []);
    if (states.some(s => SE_SET.has(s))) seCompanies++;
  });

  // Targets in play = fit score >= 50, excluding LL itself.
  const targets = companies
    .filter(c => c !== ll && (c.fitScore || 0) >= 50)
    .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

  // Pro forma = LL + top 5 targets revenue (where revenue is known).
  const proRev = llRev + targets.slice(0, 5).reduce((a, c) => a + (c.estRevenue || c.rev || 0), 0);
  const proLocs = llLocs + targets.slice(0, 5).reduce((a, c) => a + (c.totalLocs || c.locs || 0), 0);

  // Top family-owned succession candidates by fit.
  const famTargets = companies
    .filter(c => c !== ll && (c.ownership || '').toLowerCase() === 'family' && (c.fitScore || 0) >= 45)
    .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
    .slice(0, 6);

  // Highest county overlap = strongest geographic fit.
  const geoTop = companies
    .filter(c => c !== ll && c.countyShared && c.countyShared.count > 0)
    .sort((a, b) => (b.countyShared.count || 0) - (a.countyShared.count || 0))
    .slice(0, 5);

  // Largest competitor by gallons (national).
  const bigOps = companies
    .filter(c => c !== ll && c.marketShare && c.marketShare.nationalG > 0)
    .sort((a, b) => b.marketShare.nationalG - a.marketShare.nationalG);
  const top1 = bigOps[0];
  const top3G = bigOps.slice(0, 3).reduce((a, c) => a + c.marketShare.nationalG, 0);

  return {
    totalG, totalRev, totalLocs, famN, peN, seCompanies,
    ll, llG, llRev, llLocs, llCounties,
    targets, famTargets, geoTop, top1, top3G,
    nTotal: companies.length,
    proRev, proLocs,
  };
}

function BriefView() {
  const all = (typeof window !== 'undefined' && window.MOCK_COMPANIES) || [];
  const A = React.useMemo(() => _v2_briefAggregates(all), [all]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const platformShare = A.totalG > 0 ? (A.llG / A.totalG) * 100 : 0;
  const top3Pct = A.totalG > 0 ? (A.top3G / A.totalG) * 100 : 0;
  const proShare = A.totalG > 0 ? ((A.llG + A.targets.slice(0, 5).reduce((a, c) => a + ((c.marketShare && c.marketShare.nationalG) || 0), 0)) / A.totalG) * 100 : 0;

  const kpis = [
    [_v2_fmtMoneyM(A.totalRev), 'Tracked market size', A.nTotal + ' operators · revenue est.'],
    [_v2_fmtInt(A.targets.length), 'Targets in play', 'Fit score ≥ 50'],
    [platformShare.toFixed(2) + '%', 'LL platform share', _v2_fmtGallons(A.llG) + ' of ' + _v2_fmtGallons(A.totalG)],
    [_v2_fmtMoneyM(A.proRev), 'Pro-forma revenue', 'LL + top 5 fit targets'],
  ];

  // Findings derived from data.
  const f1Top = A.famTargets.slice(0, 2).map(c => (c.name || '') + ' (' + (c.hqState || '—') + ')').join(', ') || '—';
  const f2Top = A.geoTop.slice(0, 2).map(c => (c.name || '') + ' — ' + (c.countyShared.count || 0) + ' counties').join(', ') || '—';
  const f3Op = A.top1 ? (A.top1.name + ' (' + ((A.top1.marketShare.nationalPct || 0).toFixed(1)) + '% national share)') : '—';

  const findings = [
    {
      n: '01', tag: 'SUCCESSION', chip: 'High priority',
      title: 'Family-owned operators dominate the targetable universe',
      body: A.famN + ' of ' + A.nTotal + ' tracked operators (' + ((A.famN / A.nTotal) * 100).toFixed(0)
        + '%) are family-owned, vs ' + A.peN + ' PE-backed. Top succession-fit candidates: ' + f1Top
        + '. These are strategic sellers, not auctioned processes — fit scores reflect geographic and operational alignment with LL.',
    },
    {
      n: '02', tag: 'GEOGRAPHY', chip: 'Thesis validated',
      title: 'Southeast county overlap concentrates the rollup economics',
      body: 'LL operates in ' + A.llCounties + ' counties from ' + A.llLocs + ' locations. ' + A.seCompanies
        + ' tracked operators have any Southeast presence. Highest pairwise county overlap with LL: ' + f2Top
        + '. Acquisition synergies are highest where county footprints already overlap.',
    },
    {
      n: '03', tag: 'COMPETITION', chip: 'Monitor',
      title: 'Top-3 operators command ' + top3Pct.toFixed(0) + '% of tracked gallons',
      body: 'Largest tracked operator: ' + f3Op + '. Top-3 share: ' + top3Pct.toFixed(1)
        + '% of national volume. The remaining ' + (100 - top3Pct).toFixed(0)
        + '% is fragmented across ' + (A.nTotal - 3) + ' operators — a structurally consolidatable market.',
    },
  ];

  const actions = A.famTargets.slice(0, 3).map(c => [
    'Initiate dialogue with ' + (c.name || 'target'),
    (c.hqState || '—') + ' · fit ' + Math.round(c.fitScore || 0)
      + ' · ' + (c.countyShared ? c.countyShared.count : 0) + ' shared counties · '
      + (c.totalLocs || c.locs || 0) + ' locations',
    (c.fitScore || 0) >= 60 ? 'High' : 'Medium',
    c.id,
  ]);

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F6F9FC', padding: 28 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#635BFF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Executive brief · {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.8px', lineHeight: 1.15 }}>
            Family-owned consolidation is the dominant pattern. The Southeast is where LL has the structural edge.
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 16, color: '#425466', lineHeight: 1.6 }}>
            {A.targets.length} operators score above the 50-point fit threshold across {A.nTotal} tracked companies. Below: what the data says about where to focus before next quarter.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#697386' }}>
            <span>Generated <b style={{ color: '#0A2540', fontWeight: 600 }}>{dateStr}</b></span>
            <span>·</span>
            <span>For <b style={{ color: '#0A2540', fontWeight: 600 }}>Daniel Edwards</b>, Corporate Development</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" icon="download">PDF</Button>
              <Button variant="secondary" size="sm">Share</Button>
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {kpis.map(([v, l, sub]) => (
            <Card key={l} padding={16}>
              <div style={{ fontSize: 11, color: '#697386', fontWeight: 500, marginBottom: 6 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', fontFamily: 'Inter', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              <div style={{ fontSize: 11, color: '#697386', fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>
            </Card>
          ))}
        </div>

        {findings.map(f => (
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
          {actions.length === 0 ? (
            <div style={{ fontSize: 13, color: '#697386', padding: '12px 0' }}>No family-owned candidates above fit threshold.</div>
          ) : actions.map(([t, s, p, id]) => (
            <div key={id || t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #EDF1F6' }}>
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

        <div style={{ fontSize: 11, color: '#8B97A8', textAlign: 'center', marginTop: 20 }}>
          Pro-forma share with top 5 fit targets: {proShare.toFixed(2)}% of tracked national gallons.
          Source: Propane Intelligence · {A.nTotal} operators · scoring engine v2.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AnalyticsView, SignalsView, BriefView, OwnershipDonut, _EChart });
