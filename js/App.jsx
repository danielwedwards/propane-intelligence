// App.jsx — live dashboard prototype (single interactive instance)

// URL state helpers — read/write `view`, `selected`, `compare` to URL search.
// Hash-style URLs would also work but ?view=... already lands the right entry view.
const _PI_VIEW_KEYS = new Set(['map','list','analytics','signals','news','fit','overlap','network','brief','compare']);
function _readUrlState() {
  try {
    const p = new URLSearchParams(location.search);
    const view = p.get('view');
    const sel = p.get('selected');
    const cmp = (p.get('compare') || '').split(',').filter(Boolean);
    return {
      view: view && _PI_VIEW_KEYS.has(view) ? view : null,
      selected: sel || null,
      compare: cmp.slice(0, 4),
    };
  } catch (e) { return {}; }
}
function _writeUrlState({ view, selected, compare }) {
  try {
    const p = new URLSearchParams(location.search);
    if (view) p.set('view', view); else p.delete('view');
    if (selected) p.set('selected', selected); else p.delete('selected');
    if (compare && compare.length) p.set('compare', compare.join(',')); else p.delete('compare');
    const q = p.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
  } catch (e) {}
}

// Saved scenarios — view + selected + compare combos stored in localStorage.
const _PI_SCENARIOS_KEY = 'pi_saved_scenarios_v1';
function loadScenarios() {
  try { return JSON.parse(localStorage.getItem(_PI_SCENARIOS_KEY) || '[]'); } catch (e) { return []; }
}
function saveScenarios(arr) {
  try { localStorage.setItem(_PI_SCENARIOS_KEY, JSON.stringify(arr)); } catch (e) {}
}
window._loadScenarios = loadScenarios;
window._saveScenarios = saveScenarios;

function Dashboard({ initialView = 'map', onLogout, user }) {
  // Hydrate from URL on first mount; ?view= already initialView, also pick up ?selected= and ?compare=
  const _initial = React.useMemo(() => _readUrlState(), []);
  const [view, setView] = React.useState(_initial.view || initialView);
  const [selected, setSelected] = React.useState(_initial.selected);
  const [compare, setCompare] = React.useState(_initial.compare || []);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [scenariosOpen, setScenariosOpen] = React.useState(false);
  const [scenarios, setScenariosState] = React.useState(() => loadScenarios());
  // Phase 13 — pro-forma stack persisted to localStorage
  const [portfolio, setPortfolioState] = React.useState(() => (window._loadPortfolio ? window._loadPortfolio() : []));
  const [proFormaOpen, setProFormaOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  // Phase 14 — Help (?) + Sources & methodology modals
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [sourcesOpen, setSourcesOpen] = React.useState(false);
  const persistPortfolio = (next) => { setPortfolioState(next); if (window._savePortfolio) window._savePortfolio(next); };
  const handleAddPortfolio = (id) => {
    if (!id) return;
    persistPortfolio(portfolio.includes(id) ? portfolio : [...portfolio, id]);
  };
  const handleRemovePortfolio = (id) => persistPortfolio(portfolio.filter(x => x !== id));
  const handleClearPortfolio = () => persistPortfolio([]);

  // Persist view/selected/compare to the URL whenever they change.
  React.useEffect(() => {
    _writeUrlState({ view, selected, compare });
  }, [view, selected, compare]);

  // Allow back/forward to update state.
  React.useEffect(() => {
    const onPop = () => {
      const s = _readUrlState();
      if (s.view) setView(s.view);
      setSelected(s.selected || null);
      setCompare(s.compare || []);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Phase 14 — global key handling: ? opens Help, ⌘/Ctrl+K opens command palette,
  // ⌘/Ctrl+E exports the current view (delegates to whatever export button is in the page header).
  // We ignore key presses while typing in form fields so search inputs still receive '?'.
  React.useEffect(() => {
    const isTextField = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };
    const onKey = (e) => {
      if (isTextField(e.target)) return;
      // Help: ? (shift+/) — only when no other modifiers
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      // Cmd/Ctrl+K — command palette
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCmdOpen(true);
        return;
      }
      // Cmd/Ctrl+E — export current view (forward to whatever Export button exists)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('pi:export'));
        return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Phase 14 — listen for the avatar-menu "Sources & methodology" event.
  React.useEffect(() => {
    const open = () => setSourcesOpen(true);
    window.addEventListener('pi:open-sources', open);
    window.addEventListener('pi:open-help', () => setHelpOpen(true));
    return () => {
      window.removeEventListener('pi:open-sources', open);
    };
  }, []);

  const persistScenarios = (arr) => { setScenariosState(arr); saveScenarios(arr); };
  const saveCurrentScenario = (label) => {
    const name = (label && label.trim()) || ('Scenario ' + (scenarios.length + 1));
    const next = [...scenarios.filter(s => s.name !== name), { name, view, selected, compare, portfolio, savedAt: Date.now() }];
    persistScenarios(next);
  };
  const applyScenario = (s) => {
    setView(s.view || 'map');
    setSelected(s.selected || null);
    setCompare(s.compare || []);
    if (Array.isArray(s.portfolio)) persistPortfolio(s.portfolio);
  };
  const removeScenario = (name) => persistScenarios(scenarios.filter(s => s.name !== name));

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
      <TopNav active={view} onView={setView} onCmd={() => setCmdOpen(true)} onLogout={onLogout} user={user} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, paddingBottom: portfolio.length > 0 ? 64 : 0 }}>
        <SideNav active={view} onView={(v) => { setView(v); setSelected(null); }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          <PageHeader title={viewTitle[0]} sub={viewTitle[1]}>
            {compare.length > 0 && view !== 'compare' && (
              <Button variant="ink" size="sm" icon="users" onClick={() => setView('compare')}>Compare ({compare.length})</Button>
            )}
            <Button variant="secondary" size="sm" icon="bookmark" onClick={() => setScenariosOpen(true)}>Scenarios{scenarios.length ? ' (' + scenarios.length + ')' : ''}</Button>
            <Button variant="secondary" size="sm" icon="filter">Filter</Button>
            <Button variant="primary" size="sm" icon="plus">New analysis</Button>
          </PageHeader>

          {view === 'map' && <MarketMapView onSelect={setSelected} selected={selected} />}
          {view === 'list' && <CompanyListView onSelect={setSelected} selected={selected} compare={compare} onCompare={handleCompare} />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'signals' && <SignalsView onSelect={(idOrName) => {
            const cs = window.MOCK_COMPANIES || [];
            const c = cs.find(x => x.id === idOrName) || cs.find(x => x.canonicalId === idOrName) || cs.find(x => x.name === idOrName);
            if (c) setSelected(c.id);
          }}/>}
          {view === 'news' && <NewsView onSelect={setSelected} />}
          {view === 'fit' && <FitView onSelect={setSelected} />}
          {view === 'overlap' && <OverlapView />}
          {view === 'network' && <NetworkView />}
          {view === 'brief' && <BriefView />}
          {view === 'compare' && <CompareView ids={compare} onRemove={(id) => setCompare(compare.filter(x => x !== id))} />}

          {selected && <CompanyDetail companyId={selected} onClose={() => setSelected(null)} onCompare={handleCompare} onAddPortfolio={handleAddPortfolio} inPortfolio={portfolio.includes(selected)} />}
        </div>
      </div>

      {/* Phase 13 — persistent footer bar appears whenever the deal stack has any items */}
      {portfolio.length > 0 && window.PortfolioFooterBar && (
        <PortfolioFooterBar
          ids={portfolio}
          onRemove={handleRemovePortfolio}
          onClear={handleClearPortfolio}
          onOpen={() => setProFormaOpen(true)}
          onSave={() => setScenariosOpen(true)}
          onShare={() => setShareOpen(true)}
          onSelect={(id) => setSelected(id)}
        />
      )}
      {proFormaOpen && window.ProFormaModal && (
        <ProFormaModal
          ids={portfolio}
          onClose={() => setProFormaOpen(false)}
          onRemove={handleRemovePortfolio}
          onSelect={(id) => { setSelected(id); setProFormaOpen(false); }}
        />
      )}
      {shareOpen && window.ShareModal && (
        <ShareModal ids={portfolio} onClose={() => setShareOpen(false)} />
      )}

      {helpOpen && window.HelpModal && <HelpModal onClose={() => setHelpOpen(false)} />}
      {sourcesOpen && window.SourcesModal && <SourcesModal onClose={() => setSourcesOpen(false)} />}
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} onView={(v) => { setView(v); setCmdOpen(false); }} />}
      {scenariosOpen && (
        <ScenariosPanel
          scenarios={scenarios}
          current={{ view, selected, compare, portfolio }}
          onClose={() => setScenariosOpen(false)}
          onSave={(name) => { saveCurrentScenario(name); }}
          onApply={(s) => { applyScenario(s); setScenariosOpen(false); }}
          onRemove={removeScenario}
        />
      )}
    </div>
  );
}

function ScenariosPanel({ scenarios, current, onClose, onSave, onApply, onRemove }) {
  const [name, setName] = React.useState('');
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,0.35)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 110 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, background: '#fff', borderRadius: 10, boxShadow: '0 25px 50px rgba(10,37,64,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="bookmark" size={16} color="#635BFF"/>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Saved scenarios</div>
          <span style={{ fontSize: 11, color: '#8B97A8' }}>view + selection persist via URL</span>
        </div>

        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDF1F6' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Save current</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={'e.g. Southeast roll-up · ' + (current.view || 'map')}
              style={{ flex: 1, padding: '8px 10px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', color: '#0A2540' }}
            />
            <Button variant="primary" size="sm" onClick={() => { onSave(name); setName(''); }}>Save</Button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#8B97A8' }}>
            View: <b style={{ color: '#425466' }}>{current.view}</b>
            {current.selected ? (<>· Selected: <b style={{ color: '#425466' }}>{current.selected}</b></>) : null}
            {current.compare && current.compare.length ? (<> · Comparing {current.compare.length}</>) : null}
            {current.portfolio && current.portfolio.length ? (<> · Pro-forma stack {current.portfolio.length}</>) : null}
          </div>
        </div>

        <div style={{ maxHeight: 320, overflow: 'auto' }}>
          {scenarios.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: '#8B97A8', textAlign: 'center' }}>No saved scenarios yet.</div>
          ) : scenarios.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid #EDF1F6' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F7FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bookmark" size={13} color="#635BFF"/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#8B97A8' }}>
                  {s.view}
                  {s.selected ? ' · ' + s.selected : ''}
                  {s.compare && s.compare.length ? ' · compare ' + s.compare.length : ''}
                  {s.portfolio && s.portfolio.length ? ' · stack ' + s.portfolio.length : ''}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onApply(s)}>Open</Button>
              <Button variant="ghost" size="sm" onClick={() => onRemove(s.name)}>×</Button>
            </div>
          ))}
        </div>
      </div>
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

Object.assign(window, { Dashboard, CommandPalette, ScenariosPanel });
