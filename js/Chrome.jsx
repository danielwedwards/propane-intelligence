// Chrome.jsx — shared top nav, sidebar, command bar, footer.
// Counts on the sidebar nav items are derived live from the loaded data
// (companies, news, signals) inside <SideNav>; the structural list below
// is the authoritative ordering.
const NAV_ITEMS = [
  { id: 'map',     icon: 'map',      label: 'Market Map',    countKey: 'companies' },
  { id: 'list',    icon: 'list',     label: 'Companies',     countKey: 'companies' },
  { id: 'analytics', icon: 'chart',  label: 'Analytics' },
  { id: 'signals', icon: 'signal',   label: 'M&A Signals',   countKey: 'signals',   accent: true },
  { id: 'news',    icon: 'newspaper', label: 'News',         countKey: 'news' },
  { id: 'fit',     icon: 'target',   label: 'Strategic Fit' },
  { id: 'overlap', icon: 'users',    label: 'Competitor Overlap' },
  { id: 'network', icon: 'network',  label: 'Relationship Graph' },
  { id: 'brief',   icon: 'briefcase', label: 'Executive Brief' },
];

// Format an ISO timestamp as "Xm ago" / "Xh ago" / "Xd ago".
function _freshnessAgo(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d + 'd ago';
}

// Read a localStorage key safely, with JSON parse + default.
function _safeLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  } catch (e) {
    return fallback;
  }
}

// NotificationBell — count derived from real data:
//   * breaking news articles (isBreaking flag + within last 72h)
//   * hard SEC signals filed in the last 7 days
// Hides the badge entirely when the count is zero.
function NotificationBell() {
  const [, setTick] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const popRef = React.useRef(null);
  React.useEffect(() => {
    const bump = () => setTick(t => t + 1);
    window.addEventListener('pi:news-loaded', bump);
    window.addEventListener('pi:signals-loaded', bump);
    const id = setInterval(bump, 60_000);
    return () => {
      window.removeEventListener('pi:news-loaded', bump);
      window.removeEventListener('pi:signals-loaded', bump);
      clearInterval(id);
    };
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const now = Date.now();
  const articles = (window.NEWS_ARTICLES || []).filter(a => {
    const t = a && a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    return a && a.isBreaking && t && (now - t) < (72 * 3600 * 1000);
  });
  const hardSignals = (window.HARD_SIGNALS || []).filter(s => {
    const t = s && (s.filingDate || s.signalDate || s.publishedAt) ? new Date(s.filingDate || s.signalDate || s.publishedAt).getTime() : 0;
    return t && (now - t) < (7 * 24 * 3600 * 1000);
  });
  const items = [
    ...articles.slice(0, 5).map(a => ({ kind: 'news', label: a.headline, sub: a.source, t: a.publishedAt })),
    ...hardSignals.slice(0, 5).map(s => ({ kind: 'signal', label: (s.label || s.formType || 'SEC filing') + ' — ' + (s.companyName || s.companyId), sub: 'SEC EDGAR', t: s.filingDate || s.signalDate || s.publishedAt })),
  ].sort((a, b) => new Date(b.t || 0) - new Date(a.t || 0)).slice(0, 8);
  const count = items.length;

  return (
    <div style={{ position: 'relative' }} ref={popRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={count ? (count + ' new notification' + (count === 1 ? '' : 's')) : 'No new notifications'}
        title={count ? 'Recent breaking signals' : 'No recent activity'}
        style={{ position: 'relative', width: 32, height: 32, border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', color: '#425466', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="bell" size={15} />
        {count > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -3, background: '#D83E4A', color: '#fff', fontSize: 9, fontWeight: 600, borderRadius: 9999, padding: '1px 4px', minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', fontFamily: "'IBM Plex Mono'" }}>{count > 9 ? '9+' : count}</span>
        )}
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', top: 38, right: 0, width: 320, maxHeight: 380, overflowY: 'auto', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 10, boxShadow: '0 12px 28px rgba(10,37,64,0.18)', padding: 6, zIndex: 60 }}>
          <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #EDF1F6' }}>
            {count ? count + ' recent · last 72h' : 'No recent activity'}
          </div>
          {count === 0 && (
            <div style={{ padding: 24, fontSize: 12, color: '#8B97A8', textAlign: 'center' }}>
              You're all caught up — no breaking signals this week.
            </div>
          )}
          {items.map((it, i) => (
            <div key={i} style={{ padding: '10px 12px', borderBottom: i < items.length - 1 ? '1px solid #EDF1F6' : 'none', fontSize: 12, color: '#0A2540' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <Icon name={it.kind === 'signal' ? 'signal' : 'newspaper'} size={11} color={it.kind === 'signal' ? '#D83E4A' : '#635BFF'} />
                <span style={{ fontSize: 10, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: 600 }}>{it.kind === 'signal' ? 'SEC filing' : 'Breaking'}</span>
                <span style={{ fontSize: 10, color: '#8B97A8', marginLeft: 'auto' }}>{it.sub}</span>
              </div>
              <div style={{ fontSize: 12, color: '#0A2540', lineHeight: 1.4 }}>{it.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact live-stats strip rendered in the top nav between the search and the
// action buttons. Shows companies / locations / states / signals counts that
// re-tick when MOCK_COMPANIES, hard-signals, or news data hydrate.
function _HeaderStatsStrip() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setTick(t => t + 1);
    window.addEventListener('pi:data-ready', bump);
    window.addEventListener('pi:news-loaded', bump);
    window.addEventListener('pi:signals-loaded', bump);
    return () => {
      window.removeEventListener('pi:data-ready', bump);
      window.removeEventListener('pi:news-loaded', bump);
      window.removeEventListener('pi:signals-loaded', bump);
    };
  }, []);
  const cs = window.MOCK_COMPANIES || [];
  if (!cs.length) return null;
  let totalLocs = 0;
  const stateSet = new Set();
  for (const c of cs) {
    totalLocs += (c.locations && c.locations.length) || c.totalLocs || 0;
    (c.states || (c.hqState ? [c.hqState] : [])).forEach(s => s && stateSet.add(s));
  }
  const hard = (window.HARD_SIGNALS || []).length;
  const soft = window.SOFT_SIGNAL_COUNT || 0;
  const totalSignals = hard + soft;
  const fmt = (n) => n.toLocaleString();
  const cell = (label, value) => (
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.05 } },
      React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono'", letterSpacing: '-0.2px' } }, value),
      React.createElement('span', { style: { fontSize: 9, fontWeight: 600, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.5 } }, label)
    )
  );
  return (
    <div className="pi-header-stats" style={{
      display: 'flex', alignItems: 'center', gap: 18,
      padding: '0 12px', borderLeft: '1px solid #EDF1F6', borderRight: '1px solid #EDF1F6',
      height: 36, alignSelf: 'center',
    }}>
      {cell('Companies', fmt(cs.length))}
      {cell('Locations', fmt(totalLocs))}
      {cell('States',    fmt(stateSet.size))}
      {cell('Signals',   fmt(totalSignals))}
    </div>
  );
}

// Dark-mode preference key. Read once on mount; toggling persists + flips the
// body class so the CSS rules in index.html take effect immediately.
const PI_DARK_KEY = 'pi_dark_mode_v1';
function _readDarkPref() {
  try { return localStorage.getItem(PI_DARK_KEY) === '1'; } catch (_) { return false; }
}
function _writeDarkPref(on) {
  try { localStorage.setItem(PI_DARK_KEY, on ? '1' : '0'); } catch (_) {}
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('pi-dark', !!on);
  }
}
// Apply on first load, before React renders, so the dashboard never flashes
// in light mode for users who saved a dark preference.
if (typeof document !== 'undefined') {
  try { document.body.classList.toggle('pi-dark', _readDarkPref()); } catch (_) {}
}

function TopNav({ active, onView, onCmd, onLogout, user }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [darkOn, setDarkOn] = React.useState(_readDarkPref);
  const menuRef = React.useRef(null);
  const toggleDark = () => {
    const next = !darkOn;
    setDarkOn(next);
    _writeDarkPref(next);
  };
  React.useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  // Resolve the signed-in user. We honor an explicit `user` prop, then fall
  // back to anything stashed at window.PI_USER (legacy auth path), and only
  // then to a generic placeholder so the avatar still has something to show.
  // Initials are derived from the resolved name — never hardcoded.
  const _resolvedUser = user || (typeof window !== 'undefined' ? window.PI_USER : null) || {};
  const userName = _resolvedUser.name || 'Signed in';
  const userEmail = _resolvedUser.email || '';
  const userInitials = _resolvedUser.initials || (
    userName && userName !== 'Signed in'
      ? userName.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
      : '··'
  );

  const handleLogout = () => {
    setMenuOpen(false);
    if (typeof onLogout === 'function') onLogout();
  };

  return (
    <div className="pi-top-nav pi-print-hide" style={{ height: 56, background: '#fff', borderBottom: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 24, flexShrink: 0 }}>
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

      <_HeaderStatsStrip />

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button variant="secondary" size="sm" icon="download" onClick={() => window.dispatchEvent(new CustomEvent('pi:export'))}>Export</Button>
        <NotificationBell />
        <button aria-label="Help and keyboard shortcuts" title="Help (?)" onClick={() => window.dispatchEvent(new CustomEvent('pi:open-help'))} style={{ width: 32, height: 32, border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', color: '#425466', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="info" size={14} />
        </button>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={userName}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#635BFF,#AB87FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: menuOpen ? '2px solid #635BFF' : '2px solid transparent',
              padding: 0, fontFamily: 'inherit',
              boxShadow: menuOpen ? '0 0 0 3px rgba(99,91,255,0.18)' : 'none',
              transition: 'box-shadow 120ms ease',
            }}
          >{userInitials}</button>
          {menuOpen && (
            <div role="menu" style={{
              position: 'absolute', top: 38, right: 0, width: 240,
              background: '#fff', border: '1px solid #E3E8EE', borderRadius: 10,
              boxShadow: '0 12px 28px rgba(10,37,64,0.18)',
              padding: 6, zIndex: 60, fontFamily: 'inherit',
            }}>
              <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #EDF1F6', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.2px' }}>{userName}</div>
                <div style={{ fontSize: 11, color: '#697386', marginTop: 2, wordBreak: 'break-all' }}>{userEmail}</div>
              </div>
              <button role="menuitem" onClick={() => setMenuOpen(false)} style={_navMenuItemStyle}>
                <Icon name="settings" size={14} /> <span style={{ flex: 1 }}>Settings</span>
              </button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('pi:open-help')); }} style={_navMenuItemStyle}>
                <Icon name="info" size={14} /> <span style={{ flex: 1 }}>Help & shortcuts</span>
                <span style={{ fontSize: 10, padding: '1px 5px', background: '#F7FAFC', border: '1px solid #E3E8EE', borderRadius: 3, color: '#697386', fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>?</span>
              </button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('pi:open-sources')); }} style={_navMenuItemStyle}>
                <Icon name="info" size={14} /> <span style={{ flex: 1 }}>Sources & methodology</span>
              </button>
              <button role="menuitem" onClick={toggleDark} aria-pressed={darkOn} style={_navMenuItemStyle}>
                <Icon name={darkOn ? 'sun' : 'moon'} size={14} />
                <span style={{ flex: 1 }}>{darkOn ? 'Light mode' : 'Dark mode'}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', background: darkOn ? '#1F1E45' : '#F7FAFC', border: '1px solid ' + (darkOn ? '#635BFF' : '#E3E8EE'), borderRadius: 3, color: darkOn ? '#A1A6FF' : '#697386', fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>{darkOn ? 'ON' : 'OFF'}</span>
              </button>
              <div style={{ height: 1, background: '#EDF1F6', margin: '4px 6px' }} />
              <button role="menuitem" onClick={handleLogout} style={{ ..._navMenuItemStyle, color: '#B43F3F' }}>
                <Icon name="log-out" size={14} /> <span style={{ flex: 1 }}>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const _navMenuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', padding: '8px 12px',
  background: 'transparent', border: 'none', borderRadius: 6,
  fontSize: 13, color: '#0A2540', fontFamily: 'inherit',
  cursor: 'pointer', textAlign: 'left',
};

function SideNav({ active, onView, onLoadScenario }) {
  // Re-render when news / signals load asynchronously, when scenarios are
  // saved/deleted in another component, and once a minute so the freshness
  // label ticks (12m → 13m → ...) without a full reload.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setTick(t => t + 1);
    window.addEventListener('pi:news-loaded', bump);
    window.addEventListener('pi:signals-loaded', bump);
    window.addEventListener('pi:scenarios-changed', bump);
    window.addEventListener('storage', bump);
    const id = setInterval(bump, 60_000);
    return () => {
      window.removeEventListener('pi:news-loaded', bump);
      window.removeEventListener('pi:signals-loaded', bump);
      window.removeEventListener('pi:scenarios-changed', bump);
      window.removeEventListener('storage', bump);
      clearInterval(id);
    };
  }, []);

  const meta = (typeof window !== 'undefined' && window.PI_META) || {};
  const counts = {
    companies: (window.MOCK_COMPANIES || []).length,
    news:      (window.NEWS_ARTICLES || []).length,
    signals:   ((window.HARD_SIGNALS || []).length) +
               // include heuristic count if signals view has been visited
               (window.SOFT_SIGNAL_COUNT || 0),
  };

  // Pull saved scenarios out of localStorage (Phase 13 wrote here).
  const scenarios = _safeLS('pi_saved_scenarios_v1', []);
  const renderedScenarios = Array.isArray(scenarios) ? scenarios : [];

  // Pick the most recent of the three ingestion stamps for the bottom widget.
  const latestStamp = ['news', 'signals', 'companies']
    .map(k => meta && meta[k] && meta[k].updatedAt)
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <div className="pi-side-nav pi-print-hide" style={{ width: 220, background: '#fff', borderRight: '1px solid #E3E8EE', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '16px 0' }}>
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 10px 8px' }}>Explore</div>
        {NAV_ITEMS.map(n => {
          const c = n.countKey ? counts[n.countKey] : null;
          return (
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
              {c != null && c > 0 && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 9999, background: n.accent ? '#FDF6E3' : '#F7FAFC', color: n.accent ? '#8B5A0E' : '#697386', fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>{c.toLocaleString()}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '16px 12px 0', borderTop: '1px solid #EDF1F6', marginTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 10px 8px' }}>Saved scenarios</div>
        {renderedScenarios.length === 0 && (
          <div style={{ padding: '4px 10px 8px', fontSize: 11, color: '#8B97A8', fontStyle: 'italic' }}>
            No scenarios saved yet
          </div>
        )}
        {renderedScenarios.slice(0, 6).map((s, i) => {
          const name = s && (s.name || s.title) || 'Scenario ' + (i + 1);
          const id = s && (s.id || s.scenarioId) || name;
          return (
            <button
              key={id}
              onClick={() => onLoadScenario && onLoadScenario(s)}
              title={name}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '6px 10px', background: 'transparent', color: '#425466', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 2, background: '#635BFF', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              {s && s.targets && (
                <span style={{ fontSize: 10, color: '#8B97A8', fontFamily: "'IBM Plex Mono'" }}>{(s.targets || []).length}</span>
              )}
            </button>
          );
        })}
        <button onClick={() => onView && onView('list')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'transparent', color: '#635BFF', border: 'none', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', marginTop: 4 }}>
          <Icon name="plus" size={13} /> New scenario
        </button>
      </div>

      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #EDF1F6' }}>
        <div style={{ fontSize: 11, color: '#8B97A8', marginBottom: 2 }}>Data freshness</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0A2540', fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: latestStamp ? '#009966' : '#C1CCD6' }} />
          {latestStamp ? <>Updated {_freshnessAgo(latestStamp)}</> : 'No live ingest'}
        </div>
        {meta && meta.news && (
          <div style={{ marginTop: 6, fontSize: 10, color: '#8B97A8', lineHeight: 1.5 }}>
            <div>News: {_freshnessAgo(meta.news.updatedAt)}</div>
            {meta.signals && <div>Signals: {_freshnessAgo(meta.signals.updatedAt)}</div>}
          </div>
        )}
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
        <div className="pi-print-hide" style={{ display: 'flex', gap: 8 }}>{children}</div>
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
