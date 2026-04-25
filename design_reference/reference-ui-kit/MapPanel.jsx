// MapPanel.jsx — static map surface with mock markers
function MapPanel() {
  // Mock markers placed as % positions over a static US backdrop
  const markers = [
    { x: 22, y: 54, c: '#7C5CFC', big: true },  // LL anchor
    { x: 26, y: 56, c: '#7C5CFC' }, { x: 24, y: 52, c: '#7C5CFC' }, { x: 21, y: 58, c: '#7C5CFC' },
    { x: 30, y: 60, c: '#027A48' }, { x: 33, y: 58, c: '#027A48' }, { x: 36, y: 56, c: '#027A48' },
    { x: 40, y: 45, c: '#175CD3' }, { x: 44, y: 48, c: '#175CD3' }, { x: 50, y: 40, c: '#175CD3' },
    { x: 55, y: 35, c: '#6941C6' }, { x: 60, y: 30, c: '#6941C6' },
    { x: 70, y: 25, c: '#B54708' }, { x: 75, y: 28, c: '#B54708' },
    { x: 15, y: 40, c: '#475467' }, { x: 82, y: 45, c: '#475467' }, { x: 85, y: 50, c: '#475467' },
    { x: 45, y: 65, c: '#027A48' }, { x: 48, y: 62, c: '#027A48' },
  ];
  return (
    <div style={mpStyles.wrap}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={mpStyles.bg}>
        {/* Rough US shape suggestion */}
        <rect x="0" y="0" width="100" height="60" fill="#E8ECF0" />
        <path d="M 10 20 Q 15 15 25 18 Q 40 16 55 18 Q 70 18 85 22 Q 92 28 90 38 Q 85 48 70 52 Q 55 54 40 52 Q 25 52 15 45 Q 8 35 10 20 Z" fill="#D5DBE3" opacity="0.6"/>
      </svg>
      {markers.map((m, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${m.x}%`, top: `${m.y}%`,
          width: m.big ? 14 : 8, height: m.big ? 14 : 8,
          borderRadius: '50%', background: m.c, border: '2px solid #fff',
          boxShadow: m.big ? '0 0 10px rgba(124,92,252,0.8), 0 0 0 3px rgba(124,92,252,0.4)' : '0 1px 3px rgba(0,0,0,0.3)',
          transform: 'translate(-50%,-50%)', cursor: 'pointer',
        }} />
      ))}
      <div style={mpStyles.legend}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.7, color: '#475467', marginBottom: 8, fontWeight: 600 }}>By Ownership</div>
        {[['#7C5CFC','Lampton Love'],['#175CD3','Public'],['#6941C6','PE-Backed'],['#027A48','Family'],['#B54708','Cooperative'],['#475467','Private']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 11, color: '#475467' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}

const mpStyles = {
  wrap: { flex: 1, position: 'relative', background: '#E8ECF0', overflow: 'hidden' },
  bg: { width: '100%', height: '100%', display: 'block' },
  legend: { position: 'absolute', bottom: 16, right: 16, background: '#fff', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.04)' },
};

window.MapPanel = MapPanel;
