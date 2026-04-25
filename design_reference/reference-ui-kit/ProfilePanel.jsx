// ProfilePanel.jsx — slide-out company profile
function ProfilePanel({ company, onClose, onAdd, platform }) {
  if (!company) return null;
  const isPf = platform.includes(company.id) || company.isPlatform;
  return (
    <React.Fragment>
      <div style={{ ...ppStyles.overlay, ...(company ? ppStyles.overlayOpen : {}) }} onClick={onClose} />
      <div style={{ ...ppStyles.panel, ...(company ? ppStyles.panelOpen : {}) }}>
        <div style={ppStyles.head}>
          <button style={ppStyles.x} onClick={onClose}>✕</button>
          <h2 style={ppStyles.h2}>{company.name}</h2>
          <div style={ppStyles.sub}>{company.parent} · {company.typeLabel}</div>
        </div>
        <div style={ppStyles.body}>
          <button style={{ ...ppStyles.add, ...(isPf ? ppStyles.addOn : {}) }} onClick={() => onAdd(company.id)}>
            {isPf ? '− Remove from Pro Forma' : '+ Add to Pro Forma Platform'}
          </button>

          <div style={ppStyles.section}>
            <h3 style={ppStyles.h3}>Key Metrics</h3>
            <div style={ppStyles.grid}>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>Locations</div><div style={ppStyles.sV}>{company.locs}</div></div>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>Est. Revenue</div><div style={ppStyles.sV}>${company.rev.toFixed(1)}M</div></div>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>Employees</div><div style={ppStyles.sV}>{company.emp}</div></div>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>Market Share</div><div style={ppStyles.sV}>{company.mkt.toFixed(1)}%</div></div>
            </div>
          </div>

          <div style={ppStyles.section}>
            <h3 style={ppStyles.h3}>Scoring</h3>
            <div style={ppStyles.grid}>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>Proximity</div><div style={ppStyles.sV}>{company.prox ?? '—'}</div><div style={ppStyles.sN}>distance to platform</div></div>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>County</div><div style={ppStyles.sV}>{company.county ?? '—'}</div><div style={ppStyles.sN}>market quality</div></div>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>Total</div><div style={{ ...ppStyles.sV, color: '#027A48' }}>{company.total ?? '—'}</div><div style={ppStyles.sN}>sum</div></div>
              <div style={ppStyles.stat}><div style={ppStyles.sL}>Confidence</div><div style={{ ...ppStyles.sV, color: '#C8A951' }}>★★★★</div><div style={ppStyles.sN}>4 of 5</div></div>
            </div>
          </div>

          <div style={ppStyles.section}>
            <h3 style={ppStyles.h3}>Narrative</h3>
            <p style={ppStyles.narr}>
              {company.name} operates {company.locs} distribution locations across {company.states.length > 2 ? `${company.states.length} states` : company.states.join(' and ')}.
              Estimated annual revenue of ${company.rev.toFixed(1)}M implies roughly
              ${(company.rev / company.locs).toFixed(1)}M per-location — {company.rev / company.locs > 3.5 ? 'above' : 'at'} industry benchmarks.
            </p>
          </div>

          <div style={ppStyles.section}>
            <h3 style={ppStyles.h3}>States of Operation</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {company.states.map(s => (
                <span key={s} style={{ padding: '3px 10px', background: '#F0F2F5', borderRadius: 9999, fontSize: 11, fontWeight: 500, color: '#475467' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

const ppStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.18)', zIndex: 1999, opacity: 0, pointerEvents: 'none', transition: 'opacity 0.3s' },
  overlayOpen: { opacity: 1, pointerEvents: 'auto' },
  panel: { position: 'fixed', top: 0, right: -560, width: 560, height: '100vh', background: '#fff', zIndex: 2000, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column' },
  panelOpen: { right: 0 },
  head: { background: '#fff', padding: 24, borderBottom: '1px solid #E4E7EC', position: 'relative' },
  x: { position: 'absolute', top: 18, right: 18, width: 32, height: 32, border: '1px solid #E4E7EC', borderRadius: 8, background: 'transparent', color: '#98A2B3', fontSize: 18, cursor: 'pointer' },
  h2: { fontSize: 20, fontWeight: 600, color: '#101828', margin: 0, letterSpacing: -0.3 },
  sub: { fontSize: 12, color: '#475467', marginTop: 4 },
  body: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  add: { display: 'block', width: '100%', padding: 10, marginBottom: 16, border: '2px dashed #7C5CFC', borderRadius: 8, background: 'rgba(124,92,252,0.1)', color: '#7C5CFC', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' },
  addOn: { background: '#FEF3F2', borderColor: '#D92D20', color: '#D92D20' },
  section: { marginBottom: 24 },
  h3: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#98A2B3', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F0F2F5' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  stat: { background: '#F9FAFB', padding: '14px 16px', borderRadius: 12 },
  sL: { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#98A2B3', marginBottom: 2 },
  sV: { fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Mono'", color: '#101828' },
  sN: { fontSize: 10, color: '#98A2B3', marginTop: 2 },
  narr: { fontSize: 13, lineHeight: 1.7, color: '#475467', margin: 0 },
};

window.ProfilePanel = ProfilePanel;
