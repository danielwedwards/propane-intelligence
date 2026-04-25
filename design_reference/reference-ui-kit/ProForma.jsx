// ProForma.jsx — bottom-pinned pro-forma builder
function ProForma({ companies, platform, onRemove, expanded, onToggle }) {
  const items = companies.filter(c => platform.includes(c.id) || c.isPlatform);
  if (items.length === 0) return null;
  const totalLocs = items.reduce((a, c) => a + c.locs, 0);
  const totalRev = items.reduce((a, c) => a + c.rev, 0);
  const totalEmp = items.reduce((a, c) => a + c.emp, 0);
  const totalMkt = items.reduce((a, c) => a + c.mkt, 0);

  return (
    <div style={pfStyles.bar}>
      <div style={pfStyles.summary} onClick={onToggle}>
        <div style={pfStyles.title}>Pro Forma Platform</div>
        <div style={pfStyles.stats}>{items.length} cos. · {totalLocs} locs · ${totalRev.toFixed(1)}M rev · {totalMkt.toFixed(1)}% share</div>
        <div style={pfStyles.expand}>{expanded ? '▼' : '▲'}</div>
      </div>
      {expanded && (
        <div style={pfStyles.body}>
          <div style={pfStyles.grid}>
            <div style={pfStyles.metric}><div style={pfStyles.mL}>Locations</div><div style={pfStyles.mV}>{totalLocs}</div><div style={pfStyles.mN}>across {items.length} companies</div></div>
            <div style={pfStyles.metric}><div style={pfStyles.mL}>Revenue</div><div style={pfStyles.mV}>${totalRev.toFixed(1)}M</div><div style={pfStyles.mN}>combined estimate</div></div>
            <div style={pfStyles.metric}><div style={pfStyles.mL}>Employees</div><div style={pfStyles.mV}>{totalEmp}</div><div style={pfStyles.mN}>total headcount</div></div>
            <div style={pfStyles.metric}><div style={pfStyles.mL}>Market Share</div><div style={pfStyles.mV}>{totalMkt.toFixed(1)}%</div><div style={pfStyles.mN}>blended US</div></div>
          </div>
          <div style={pfStyles.chips}>
            {items.map(c => (
              <div key={c.id} style={pfStyles.chip}>
                {c.name}
                {!c.isPlatform && <button style={pfStyles.chipX} onClick={() => onRemove(c.id)}>✕</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const pfStyles = {
  bar: { position: 'absolute', bottom: 0, left: 240, right: 0, zIndex: 1500, background: '#fff', borderTop: '1px solid #E4E7EC', boxShadow: '0 -4px 20px rgba(16,24,40,0.08)' },
  summary: { padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: '#101828', color: '#fff', fontSize: 12 },
  title: { fontSize: 14, fontWeight: 600 },
  stats: { color: '#A78BFA', fontSize: 11, flex: 1, fontFamily: "'IBM Plex Mono'" },
  expand: { color: '#A78BFA', fontSize: 14 },
  body: { padding: '16px 20px', maxHeight: 280, overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 },
  metric: { background: '#F9FAFB', padding: 12, borderRadius: 8 },
  mL: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475467' },
  mV: { fontSize: 18, fontWeight: 700, color: '#101828', fontFamily: "'IBM Plex Mono'" },
  mN: { fontSize: 9, color: '#475467' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#EFF8FF', borderRadius: 6, fontSize: 11, color: '#175CD3', fontWeight: 500 },
  chipX: { width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'rgba(21,101,192,0.2)', color: '#175CD3', fontSize: 10, cursor: 'pointer' },
};

window.ProForma = ProForma;
