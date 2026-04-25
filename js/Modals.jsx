// Modals.jsx — Help (?) modal, Sources & methodology modal, Fit-score hover cell.
// Phase 14 of V3_PLAN.

// Single source of truth for the support contact. Override at runtime by
// setting `window.PI_SUPPORT_EMAIL` before bundle parse.
const PI_SUPPORT_EMAIL = (typeof window !== 'undefined' && window.PI_SUPPORT_EMAIL)
  || 'corpdev@ergon.com';

// ---- Bucket weights (mirrors scoring.js DEFAULT_WEIGHTS) ----
const _MOD_FIT_BUCKETS = [
  { key: 'geo',     label: 'Geography',   weight: 25 },
  { key: 'size',    label: 'Size',        weight: 20 },
  { key: 'ops',     label: 'Operations',  weight: 15 },
  { key: 'culture', label: 'Culture',     weight: 15 },
  { key: 'fin',     label: 'Financial',   weight: 15 },
  { key: 'integ',   label: 'Integration', weight: 10 },
];

// Compact 6-row breakdown bar — used inside the row hover popover.
function _MiniFitBreakdown({ breakdown, total }) {
  if (!breakdown) {
    return <div style={{ fontSize: 11, color: '#8B97A8' }}>Score breakdown unavailable.</div>;
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.3px' }}>{Math.round(total || 0)}</div>
        <div style={{ fontSize: 10, color: '#697386' }}>composite · 0–100</div>
      </div>
      {_MOD_FIT_BUCKETS.map(b => {
        const v = Math.max(0, Math.min(100, Math.round(breakdown[b.key] || 0)));
        const tone = v > 75 ? '#009966' : v > 55 ? '#635BFF' : v > 35 ? '#C4862D' : '#8B97A8';
        return (
          <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '78px 1fr 26px', alignItems: 'center', gap: 8, padding: '3px 0' }}>
            <div style={{ fontSize: 11, color: '#425466' }}>
              {b.label}<span style={{ color: '#8B97A8', marginLeft: 3, fontFamily: "'IBM Plex Mono'" }}>{b.weight}%</span>
            </div>
            <div style={{ height: 5, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: v + '%', height: '100%', background: tone, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0A2540', fontFamily: "'IBM Plex Mono'", textAlign: 'right' }}>{v}</div>
          </div>
        );
      })}
    </div>
  );
}

// FitScoreCell — drop-in replacement for the inline fit bar in CompaniesTable.
// Renders the same 50px progress bar + score, plus a hover popover that lifts
// the slideover's _FitBreakdown for at-a-glance attribution without a click.
function FitScoreCell({ company }) {
  const ref = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0, placement: 'below' });
  const f = company && company.fitScore != null ? Math.round(company.fitScore) : null;

  const compute = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const POP_W = 280, POP_H = 230;
    const margin = 8;
    let left = r.right - POP_W; // right-align with the cell so it doesn't drift off-screen
    if (left < margin) left = margin;
    if (left + POP_W > window.innerWidth - margin) left = window.innerWidth - POP_W - margin;
    let top = r.bottom + 6;
    let placement = 'below';
    if (top + POP_H > window.innerHeight - margin) {
      top = r.top - POP_H - 6;
      placement = 'above';
    }
    setPos({ top, left, placement });
  };

  const handleEnter = () => { compute(); setOpen(true); };
  const handleLeave = () => setOpen(false);

  if (f == null) return <span style={{ color: '#C1CCD6' }}>—</span>;

  return (
    <span
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', position: 'relative' }}
    >
      <span style={{ width: 50, height: 5, background: '#EDF1F6', borderRadius: 3, overflow: 'hidden', display: 'inline-block' }}>
        <span style={{ display: 'block', width: f + '%', height: '100%', background: f > 70 ? '#635BFF' : f > 40 ? '#AB87FF' : '#C1CCD6' }} />
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: '#0A2540', minWidth: 22, textAlign: 'right' }}>{f}</span>
      {open && ReactDOM.createPortal(
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: 280,
            background: '#fff', border: '1px solid #E3E8EE', borderRadius: 8,
            boxShadow: '0 12px 28px rgba(10,37,64,0.18)', padding: '12px 14px',
            zIndex: 200, fontFamily: 'inherit', textAlign: 'left',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>{company.name}</div>
            <div style={{ fontSize: 10, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.4 }}>Fit</div>
          </div>
          <_MiniFitBreakdown breakdown={company.fitBreakdown} total={company.fitScore} />
        </div>,
        document.body
      )}
    </span>
  );
}

// Reusable modal shell — matches ScenariosPanel pattern (z=100, backdrop blur).
function _ModalShell({ icon, title, subtitle, onClose, width = 600, children }) {
  React.useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(10,37,64,0.35)', backdropFilter: 'blur(3px)',
      zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 90,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width, maxHeight: 'calc(100vh - 140px)', background: '#fff', borderRadius: 10,
        boxShadow: '0 25px 50px rgba(10,37,64,0.25)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDF1F6', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {icon && <Icon name={icon} size={16} color="#635BFF" />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: '#8B97A8', marginTop: 1 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 28, height: 28, border: '1px solid #E3E8EE', borderRadius: 6,
            background: '#fff', color: '#697386', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="x" size={13} />
          </button>
        </div>
        <div style={{ overflow: 'auto', padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

// ---- Help modal ----
function HelpModal({ onClose }) {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
  const mod = isMac ? '⌘' : 'Ctrl';
  const shortcuts = [
    { keys: [mod + 'K'], label: 'Open command palette / search' },
    { keys: ['/'],       label: 'Open command palette / search' },
    { keys: [mod + 'E'], label: 'Export current view to CSV' },
    { keys: ['?'],       label: 'Open this help dialog' },
    { keys: ['Esc'],     label: 'Close any open modal or slideover' },
    { keys: ['S'],       label: 'Open Scenarios drawer' },
    { keys: ['C'],       label: 'Open Compare view' },
    { keys: ['G', 'M'],  label: 'Go to Map view' },
    { keys: ['G', 'L'],  label: 'Go to Companies list' },
    { keys: ['G', 'A'],  label: 'Go to Analytics' },
    { keys: ['G', 'S'],  label: 'Go to M&A Signals' },
    { keys: ['G', 'N'],  label: 'Go to News' },
    { keys: ['G', 'F'],  label: 'Go to Strategic Fit' },
    { keys: ['G', 'O'],  label: 'Go to Competitor Overlap' },
    { keys: ['G', 'R'],  label: 'Go to Relationship Graph' },
    { keys: ['G', 'B'],  label: 'Go to Executive Brief' },
  ];

  return (
    <_ModalShell icon="info" title="Help & keyboard shortcuts" subtitle="Press ? anywhere to open this dialog" onClose={onClose} width={600}>
      <div style={{ marginBottom: 18 }}>
        <_SectionLabel>Keyboard shortcuts</_SectionLabel>
        <div style={{ border: '1px solid #EDF1F6', borderRadius: 8, overflow: 'hidden' }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '9px 12px',
              borderTop: i === 0 ? 'none' : '1px solid #EDF1F6',
              background: i % 2 === 0 ? '#fff' : '#FBFCFE',
            }}>
              <div style={{ flex: 1, fontSize: 13, color: '#425466' }}>{s.label}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {s.keys.map((k, j) => (
                  <span key={j} style={{
                    fontSize: 11, padding: '2px 7px', background: '#F7FAFC',
                    border: '1px solid #E3E8EE', borderRadius: 4, color: '#0A2540',
                    fontFamily: "'IBM Plex Mono'", fontWeight: 500, minWidth: 22, textAlign: 'center',
                  }}>{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <_SectionLabel>Strategic-fit scoring</_SectionLabel>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#425466', lineHeight: 1.55 }}>
          Each target is scored 0–100 against Lampton Love's strategic profile. The composite is a weighted blend of six dimensions:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {_MOD_FIT_BUCKETS.map(b => (
            <div key={b.key} style={{ padding: 10, border: '1px solid #EDF1F6', borderRadius: 6, background: '#FBFCFE' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>{b.label}</span>
                <span style={{ fontSize: 10, color: '#635BFF', fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>{b.weight}%</span>
              </div>
              <div style={{ fontSize: 11, color: '#697386', lineHeight: 1.45 }}>{_BUCKET_DESCRIPTIONS[b.key]}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <_SectionLabel>Need more?</_SectionLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => { onClose && onClose(); window.dispatchEvent(new CustomEvent('pi:open-sources')); }}
            style={_HelpLinkBtn}
          >
            <Icon name="info" size={13} /> Sources & methodology
          </button>
          <a href={'mailto:' + PI_SUPPORT_EMAIL + '?subject=Propane%20Intelligence%20support'} style={_HelpLinkBtn}>
            <Icon name="external-link" size={13} /> Email support
          </a>
        </div>
      </div>
    </_ModalShell>
  );
}

const _BUCKET_DESCRIPTIONS = {
  geo:     'County overlap with LL footprint plus mean distance from LL locations.',
  size:    'Locations and revenue scaled to a digestible bite for an LL roll-up.',
  ops:     'Service mix, operational maturity, and station-level density signals.',
  culture: 'Family/independent ownership and regional propane focus vs. diversified.',
  fin:     'Revenue per employee and gallon density vs. SE peer benchmarks.',
  integ:   'Ease of integration — single-state simple footprints score higher.',
};

const _HelpLinkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', border: '1px solid #E3E8EE', borderRadius: 6,
  background: '#fff', color: '#0A2540', fontSize: 12, fontFamily: 'inherit',
  textDecoration: 'none', cursor: 'pointer',
};

function _SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
      {children}
    </div>
  );
}

// ---- Sources & methodology modal ----
function SourcesModal({ onClose }) {
  const companyCount = (window.MOCK_COMPANIES || []).length;
  const countyCount  = (window.COUNTY_METRICS || []).length;
  let locationCount = 0;
  (window.MOCK_COMPANIES || []).forEach(c => { locationCount += (c.locations || []).length; });

  const sections = [
    {
      icon: 'building',
      title: 'Company directory',
      lines: [
        ['Records', companyCount.toLocaleString() + ' companies'],
        ['Geocoded locations', locationCount.toLocaleString()],
        ['Source', 'companies.json — compiled from public state directories, NPGA and propanegasmagazine member lists, SEC filings (Public/PE-backed), and Ergon corp-dev research.'],
        ['Identity', 'Each record has a stable canonical id, parent group, ownership class (Public/PE/Family/Private/Co-op), HQ city/state, year founded, and a list of branch locations with lat/lng.'],
        ['Refresh cadence', 'Manual quarterly re-pull. New acquisitions flagged via signals & news pipelines.'],
      ],
    },
    {
      icon: 'map',
      title: 'Geography & county metrics',
      lines: [
        ['Counties tracked', countyCount.toLocaleString()],
        ['Source', 'counties_national.json — U.S. Census TIGER/Line FIPS centroids combined with EIA RECS heating-fuel shares and ACS housing-unit counts.'],
        ['Per county', 'n = housing units, h = propane-heated households, u = propane heat share, g = est. gallons/yr, plus centroid lat/lng for proximity math.'],
        ['Reverse geocode', 'Locations resolved to FIPS county via point-in-polygon against TIGER county shapes; cached per lat/lng.'],
      ],
    },
    {
      icon: 'target',
      title: 'Scoring engine',
      lines: [
        ['Module', 'js/scoring.js — runs in-browser, no server. Output is attached to every company on load.'],
        ['Proximity', 'For each target, mean great-circle distance from its locations to the nearest LL location (haversine).'],
        ['County overlap', 'Set intersection of FIPS lists between LL and target. Shared county count surfaces in tables.'],
        ['Market share', 'Target gallons (HH × propane share × 450 gal HH-yr proxy) ÷ national propane gallons in counties served.'],
        ['Composite fit', '6-bucket weighted blend (Geo 25 / Size 20 / Ops 15 / Culture 15 / Financial 15 / Integration 10). Each bucket clamped 0–100; missing inputs degrade gracefully.'],
      ],
    },
    {
      icon: 'newspaper',
      title: 'Signals & news',
      lines: [
        ['M&A signals', 'Manually curated for the demo seed companies. Production pipeline (Phase 17/18) ingests SEC EDGAR Form D / 8-K and propane-trade RSS, classifies via heuristic + LLM, surfaces deal-trigger impact.'],
        ['News articles', 'Demo set today; production fetcher pulls from Propane Gas Magazine, LP Gas, Butane-Propane News, and Google News company queries on a daily cron.'],
      ],
    },
    {
      icon: 'zap',
      title: 'Build & freshness',
      lines: [
        ['Stack', 'React 18 (UMD) + Babel-standalone, Leaflet 1.9 for maps. Zero build step — `index.html` boots the data adapter, then renders.'],
        ['Storage', 'Saved scenarios, pro-forma stack, and auth flag persisted in localStorage. URL carries view/selected/compare for shareable deep links.'],
        ['Freshness badge', 'Reads the timestamp of the most recent companies.json refresh; today\'s status is displayed in the sidebar.'],
      ],
    },
  ];

  return (
    <_ModalShell icon="info" title="Sources & methodology" subtitle="Where the data comes from and how the scores are computed" onClose={onClose} width={680}>
      {sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 18, paddingBottom: 16, borderBottom: i === sections.length - 1 ? 'none' : '1px solid #EDF1F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={s.icon} size={14} color="#635BFF" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>{s.title}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 14px' }}>
            {s.lines.map((row, j) => (
              <React.Fragment key={j}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.3, paddingTop: 2 }}>{row[0]}</div>
                <div style={{ fontSize: 12, color: '#425466', lineHeight: 1.55 }}>{row[1]}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 4, padding: 12, background: '#FBFCFE', border: '1px solid #EDF1F6', borderRadius: 6, fontSize: 11, color: '#697386', lineHeight: 1.55 }}>
        Confidential — for Ergon Corporate Development internal use. Estimates of revenue, employees, and gallons are model outputs derived from public information and should be cross-checked before use in negotiations.
      </div>
    </_ModalShell>
  );
}

Object.assign(window, { HelpModal, SourcesModal, FitScoreCell });
