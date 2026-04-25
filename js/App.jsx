// App.jsx — live dashboard prototype (single interactive instance)
function Dashboard({ initialView = 'map' }) {
  const [view, setView] = React.useState(initialView);
  const [selected, setSelected] = React.useState(null);
  const [compare, setCompare] = React.useState([]);
  const [cmdOpen, setCmdOpen] = React.useState(false);

  const handleCompare = (id) => {
    setCompare(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const viewTitle = {
    map: ['U.S. Propane Market Map', 'Interactive geography of 1,247 retailers'],
    list: ['Companies', '247 matching current filters · 1,247 total'],
    analytics: ['Analytics', 'Market trends, ownership mix, roll-up pace'],
    signals: ['M&A Signals', '18 tracked signals this quarter'],
    news: ['News', 'Industry news — surfaced by deal-trigger impact'],
    fit: ['Strategic Fit', 'Targets ranked against Lampton Love platform'],
    overlap: ['Competitor Overlap', 'County-level service area overlap'],
    network: ['Relationship Graph', 'Ownership, competition, and acquisition paths'],
    brief: ['Executive Brief', 'Q2 2026 market intelligence summary'],
    compare: ['Compare', `${compare.length} companies side-by-side`],
  }[view];

  return (
    <div className="redesign" style={{ width: '100vw', height: '100vh', background: '#F6F9FC', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
      <TopNav active={view} onView={setView} onCmd={() => setCmdOpen(true)} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <SideNav active={view} onView={(v) => { setView(v); setSelected(null); }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          <PageHeader title={viewTitle[0]} sub={viewTitle[1]}>
            {compare.length > 0 && view !== 'compare' && (
              <Button variant="ink" size="sm" icon="users" onClick={() => setView('compare')}>Compare ({compare.length})</Button>
            )}
            <Button variant="secondary" size="sm" icon="filter">Filter</Button>
            <Button variant="primary" size="sm" icon="plus">New analysis</Button>
          </PageHeader>

          {view === 'map' && <MarketMapView onSelect={setSelected} selected={selected} />}
          {view === 'list' && <CompanyListView onSelect={setSelected} selected={selected} compare={compare} onCompare={handleCompare} />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'signals' && <SignalsView onSelect={(name) => { const c = (window.MOCK_COMPANIES||[]).find(x => x.name === name); if (c) setSelected(c.id); }}/>}
          {view === 'news' && <NewsView onSelect={setSelected} />}
          {view === 'fit' && <FitView onSelect={setSelected} />}
          {view === 'overlap' && <OverlapView />}
          {view === 'network' && <NetworkView />}
          {view === 'brief' && <BriefView />}
          {view === 'compare' && <CompareView ids={compare} onRemove={(id) => setCompare(compare.filter(x => x !== id))} />}

          {selected && <CompanyDetail companyId={selected} onClose={() => setSelected(null)} onCompare={handleCompare} />}
        </div>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} onView={(v) => { setView(v); setCmdOpen(false); }} />}
    </div>
  );
}

function CommandPalette({ onClose, onView }) {
  const items = [
    { icon: 'map',      label: 'Market Map',           kind: 'View',    action: () => onView('map') },
    { icon: 'list',     label: 'Companies',            kind: 'View',    action: () => onView('list') },
    { icon: 'signal',   label: 'M&A Signals',          kind: 'View',    action: () => onView('signals') },
    { icon: 'newspaper',label: 'News',                 kind: 'View',    action: () => onView('news') },
    { icon: 'target',   label: 'Strategic Fit',        kind: 'View',    action: () => onView('fit') },
    { icon: 'network',  label: 'Relationship Graph',   kind: 'View',    action: () => onView('network') },
    { icon: 'building', label: 'Blossman Gas',         kind: 'Company', sub: 'Family · 42 locations · NC' },
    { icon: 'building', label: 'Cherry Energy',        kind: 'Company', sub: 'Family · 18 locations · NC' },
    { icon: 'sparkle',  label: 'Ask: Who in the Southeast has succession signals?', kind: 'AI' },
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,0.35)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 580, background: '#fff', borderRadius: 10, boxShadow: '0 25px 50px rgba(10,37,64,0.25)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #EDF1F6' }}>
          <Icon name="search" size={16} color="#8B97A8"/>
          <input autoFocus placeholder="Search views, companies, signals — or ask anything" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#0A2540' }}/>
          <span style={{ fontSize: 10, padding: '2px 6px', background: '#F7FAFC', border: '1px solid #E3E8EE', borderRadius: 4, color: '#697386', fontFamily: "'IBM Plex Mono'" }}>esc</span>
        </div>
        <div style={{ maxHeight: 400, overflow: 'auto', padding: '6px 0' }}>
          {items.map((it, i) => (
            <div key={i} onClick={it.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', background: i === 0 ? '#F7FAFC' : 'transparent' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: it.kind === 'AI' ? 'linear-gradient(135deg,#EEF0FF,#D4E1FF)' : '#F7FAFC', color: it.kind === 'AI' ? '#635BFF' : '#425466', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={it.icon} size={14}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A2540' }}>{it.label}</div>
                {it.sub && <div style={{ fontSize: 11, color: '#8B97A8' }}>{it.sub}</div>}
              </div>
              <Badge tone={it.kind === 'AI' ? 'indigo' : 'neutral'}>{it.kind}</Badge>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 18px', borderTop: '1px solid #EDF1F6', display: 'flex', gap: 16, fontSize: 11, color: '#8B97A8' }}>
          <span><b style={{ color: '#425466', fontFamily: "'IBM Plex Mono'" }}>↵</b> open</span>
          <span><b style={{ color: '#425466', fontFamily: "'IBM Plex Mono'" }}>↑↓</b> navigate</span>
          <span style={{ marginLeft: 'auto' }}>Tip: prefix <b style={{ color: '#425466' }}>&gt;</b> for actions, <b style={{ color: '#425466' }}>@</b> for AI</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, CommandPalette });
