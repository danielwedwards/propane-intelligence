// Chrome.jsx — shared top nav, sidebar, command bar, footer
const NAV_ITEMS = [
  { id: 'map',     icon: 'map',      label: 'Market Map',    count: 247 },
  { id: 'list',    icon: 'list',     label: 'Companies',     count: 1247 },
  { id: 'analytics', icon: 'chart',  label: 'Analytics' },
  { id: 'signals', icon: 'signal',   label: 'M&A Signals',   count: 18, accent: true },
  { id: 'news',    icon: 'newspaper', label: 'News',         count: 25 },
  { id: 'fit',     icon: 'target',   label: 'Strategic Fit' },
  { id: 'overlap', icon: 'users',    label: 'Competitor Overlap' },
  { id: 'network', icon: 'network',  label: 'Relationship Graph' },
  { id: 'brief',   icon: 'briefcase', label: 'Executive Brief' },
];

function TopNav({ active, onView, onCmd }) {
  return (
    <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 24, flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#635BFF,#4B45B8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, letterSpacing: '-0.5px' }}>PI</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.2px' }}>Propane Intelligence</span>
      </div>

      {/* Command bar */}
      <button onClick={onCmd} style={{ flex: 1, maxWidth: 440, display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', border: '1px solid #E3E8EE', borderRadius: 6, background: '#F7FAFC', color: '#8B97A8', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
        <Icon name="search" size={15} />
        <span style={{ flex: 1 }}>Search companies, signals, analyses…</span>
        <span style={{ fontSize: 10, padding: '2px 6px', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 4, color: '#697386', fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>⌘K</span>
      </button>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button variant="secondary" size="sm" icon="download">Export</Button>
        <button style={{ position: 'relative', width: 32, height: 32, border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', color: '#425466', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={15} />
          <span style={{ position: 'absolute', top: -3, right: -3, background: '#635BFF', color: '#fff', fontSize: 9, fontWeight: 600, borderRadius: 9999, padding: '1px 4px', minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', fontFamily: "'IBM Plex Mono'" }}>3</span>
        </button>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#635BFF,#AB87FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>DE</div>
      </div>
    </div>
  );
}

function SideNav({ active, onView }) {
  return (
    <div style={{ width: 220, background: '#fff', borderRight: '1px solid #E3E8EE', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '16px 0' }}>
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 10px 8px' }}>Explore</div>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => onView(n.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '7px 10px', marginBottom: 1,
            background: active === n.id ? '#EEF0FF' : 'transparent',
            color: active === n.id ? '#4B45B8' : '#425466',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: active === n.id ? 500 : 400,
            fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
          }}>
            <Icon name={n.icon} size={15} stroke={active === n.id ? 2 : 1.75} />
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.count != null && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 9999, background: n.accent ? '#FDF6E3' : '#F7FAFC', color: n.accent ? '#8B5A0E' : '#697386', fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>{n.count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 12px 0', borderTop: '1px solid #EDF1F6', marginTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 10px 8px' }}>Saved</div>
        {['Southeast roll-up','Cherry Energy thesis','LPG co-op wave'].map(s => (
          <button key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '6px 10px', background: 'transparent', color: '#425466', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: '#635BFF' }} />{s}
          </button>
        ))}
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'transparent', color: '#635BFF', border: 'none', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', marginTop: 4 }}>
          <Icon name="plus" size={13} /> New view
        </button>
      </div>

      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #EDF1F6' }}>
        <div style={{ fontSize: 11, color: '#8B97A8', marginBottom: 2 }}>Data freshness</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0A2540', fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#009966' }} /> Updated 14m ago
        </div>
      </div>
    </div>
  );
}

// Page header (the strip just below the top nav, inside each view)
function PageHeader({ title, sub, children, tabs, activeTab, onTab }) {
  return (
    <div style={{ padding: '20px 28px 0', background: '#fff', borderBottom: '1px solid #EDF1F6' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.4px' }}>{title}</h1>
          {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#697386' }}>{sub}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>{children}</div>
      </div>
      {tabs && (
        <div style={{ display: 'flex', gap: 2, marginBottom: -1 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => onTab && onTab(t)} style={{
              padding: '10px 14px', background: 'transparent', border: 'none', fontSize: 13,
              color: activeTab === t ? '#635BFF' : '#697386', fontWeight: activeTab === t ? 600 : 400,
              borderBottom: activeTab === t ? '2px solid #635BFF' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TopNav, SideNav, PageHeader, NAV_ITEMS });
