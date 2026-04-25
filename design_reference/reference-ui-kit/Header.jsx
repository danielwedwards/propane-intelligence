// Header.jsx — app top bar
const { useState } = React;

function Header({ view, onView, onLogout }) {
  const views = [
    { id: 'table', label: 'Table' },
    { id: 'both', label: 'Both' },
    { id: 'map', label: 'Map' },
    { id: 'charts', label: 'Charts' },
  ];
  return (
    <div style={headerStyles.bar}>
      <div style={headerStyles.left}>
        <h1 style={headerStyles.mark}>ERGON CORPORATE DEVELOPMENT</h1>
        <div style={headerStyles.sep}></div>
        <span style={headerStyles.sub}>U.S. Propane Market Map</span>
      </div>
      <div style={headerStyles.stats}>
        <span style={headerStyles.stat}><b style={headerStyles.statNum}>13</b> Companies</span>
        <span style={headerStyles.stat}><b style={headerStyles.statNum}>622</b> Locations</span>
        <span style={headerStyles.stat}><b style={headerStyles.statNum}>28</b> States</span>
      </div>
      <div style={headerStyles.right}>
        <div style={headerStyles.vtog}>
          {views.map(v => (
            <button key={v.id} onClick={() => onView(v.id)}
              style={{ ...headerStyles.vbtn, ...(view === v.id ? headerStyles.vbtnOn : {}) }}>
              {v.label}
            </button>
          ))}
        </div>
        <button style={headerStyles.util}>↓ Export</button>
        <button style={headerStyles.util}>⟳ Reset</button>
        <button style={headerStyles.util} onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

const headerStyles = {
  bar: { background: '#fff', padding: '0 20px', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E4E7EC', boxShadow: '0 1px 2px rgba(16,24,40,0.04)', gap: 16, flexShrink: 0 },
  left: { display: 'flex', alignItems: 'center' },
  mark: { fontSize: 12, fontWeight: 700, letterSpacing: 1.2, margin: 0, color: '#101828' },
  sep: { width: 1, height: 24, background: '#E4E7EC', margin: '0 12px' },
  sub: { fontSize: 12, color: '#475467', fontWeight: 500 },
  stats: { display: 'flex', gap: 8, fontSize: 12, color: '#475467', alignItems: 'center' },
  stat: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#FAFBFC', borderRadius: 9999, border: '1px solid #E4E7EC', fontSize: 11 },
  statNum: { color: '#7C5CFC', fontSize: 13, marginRight: 2, fontVariantNumeric: 'tabular-nums', fontFamily: "'IBM Plex Mono', monospace" },
  right: { display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' },
  vtog: { display: 'flex', gap: 2, background: '#F0F2F5', borderRadius: 8, padding: 3 },
  vbtn: { padding: '5px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', background: 'transparent', color: '#98A2B3' },
  vbtnOn: { background: '#fff', color: '#101828', boxShadow: '0 1px 2px rgba(16,24,40,0.04)' },
  util: { padding: '8px 14px', border: '1px solid #E4E7EC', borderRadius: 8, background: 'transparent', color: '#475467', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' },
};

window.Header = Header;
