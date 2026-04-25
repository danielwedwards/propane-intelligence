// News.jsx — deal-trigger news feed for the Propane Intelligence platform.
//
// PRODUCTION INTEGRATION NOTES (for engineering):
//   This component consumes a flat `NEWS_ARTICLES` array from window.
//   In production, replace the mock below with an async fetch from
//   /api/news?companyIds=...&category=...&since=... backed by:
//     - A news ingestion worker that polls trade RSS + NewsAPI/Bing News
//     - An entity-linker that tags each article with companyIds[] using
//       name + alias + domain matching against the company table
//     - A classifier that assigns one of: ma, leadership, capital, regulatory,
//       expansion, pricing, litigation, partnership
//   Schema per article:
//     { id, headline, source, sourceUrl, url, publishedAt (ISO),
//       companyIds: string[], category, summary, impactScore (0-100),
//       isBreaking: bool, readMinutes, thumbnail? }
//   Freshness: hourly for general, webhook-push for breaking M&A.

window.NEWS_ARTICLES = [
  {
    id: 'n_001',
    headline: 'Blossman Gas engages Houlihan Lokey to explore strategic alternatives',
    source: 'LP Gas Magazine',
    sourceUrl: 'lpgasmagazine.com',
    publishedAt: '2026-04-23T14:12:00Z',
    companyIds: ['blossman_gas'],
    category: 'ma',
    summary: 'Family principals at the 42-location Southeast dealer have retained Houlihan Lokey to evaluate sale options. Industry sources expect a formal process to launch in Q3 with both strategic and PE interest anticipated.',
    impactScore: 92,
    isBreaking: true,
    readMinutes: 3,
  },
  {
    id: 'n_002',
    headline: 'Cherry Energy CEO Marcus Cherry announces retirement effective September',
    source: 'Butane-Propane News',
    sourceUrl: 'bpnews.com',
    publishedAt: '2026-04-22T09:40:00Z',
    companyIds: ['cherry_energy'],
    category: 'leadership',
    summary: 'Third-generation principal Marcus Cherry confirmed retirement plans at the Southern Gas Association conference. Succession plan not yet disclosed; family indicated openness to exploring strategic alternatives.',
    impactScore: 84,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_003',
    headline: 'Dead River Company files Form D reporting $85M minority recap with Brookfield',
    source: 'SEC EDGAR',
    sourceUrl: 'sec.gov',
    publishedAt: '2026-04-18T16:22:00Z',
    companyIds: ['dead_river'],
    category: 'capital',
    summary: 'The Maine-based heating fuels distributor disclosed an $85M minority equity investment from Brookfield Asset Management. Terms suggest a grow-then-sell strategy over a 3–5 year horizon.',
    impactScore: 78,
    isBreaking: false,
    readMinutes: 4,
  },
  {
    id: 'n_004',
    headline: 'Crystal Flash completes 31st bolt-on with Palmer Gas & Oil acquisition',
    source: 'Propane Canada',
    sourceUrl: 'propanecanada.com',
    publishedAt: '2026-04-15T11:05:00Z',
    companyIds: ['crystal_flash'],
    category: 'ma',
    summary: 'The Kinderhook-backed platform closed its acquisition of Palmer Gas & Oil (5 locations, New Hampshire). Pace of add-ons has accelerated materially since the 2019 recap, with 12 tuck-ins in the trailing 18 months.',
    impactScore: 71,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_005',
    headline: 'PERC files comments on proposed EPA methane rule amendments',
    source: 'Propane Education & Research Council',
    sourceUrl: 'propane.com',
    publishedAt: '2026-04-14T13:30:00Z',
    companyIds: [],
    category: 'regulatory',
    summary: 'PERC submitted comments opposing the application of methane leak detection requirements to propane autogas infrastructure, arguing the rule targets natural gas systems and is technically inapplicable to LPG.',
    impactScore: 54,
    isBreaking: false,
    readMinutes: 5,
  },
  {
    id: 'n_006',
    headline: 'Eastern Propane & Oil passes 5-year mark under Ares; secondary expected within 12 months',
    source: 'PE Hub',
    sourceUrl: 'pehub.com',
    publishedAt: '2026-04-10T08:15:00Z',
    companyIds: ['eastern_propane'],
    category: 'ma',
    summary: 'Sources familiar with the platform indicate Ares is preparing a secondary sale process. Likely buyer universe includes infrastructure funds and strategics seeking Northeast platform scale.',
    impactScore: 81,
    isBreaking: false,
    readMinutes: 3,
  },
  {
    id: 'n_007',
    headline: 'Suburban Propane reports Q1 earnings; retail volumes +3.2% YoY',
    source: 'NYSE: SPH Investor Relations',
    sourceUrl: 'suburbanpropane.com',
    publishedAt: '2026-04-09T07:00:00Z',
    companyIds: ['suburban_propane'],
    category: 'capital',
    summary: 'Suburban reported Q1 retail volumes up 3.2% against a colder winter. Management signaled continued bolt-on activity in the Northeast and Mid-Atlantic, with $45M earmarked for tuck-in M&A.',
    impactScore: 58,
    isBreaking: false,
    readMinutes: 4,
  },
  {
    id: 'n_008',
    headline: 'Barrett Propane third-generation principal weighing strategic alternatives',
    source: 'LP Gas Magazine',
    sourceUrl: 'lpgasmagazine.com',
    publishedAt: '2026-04-07T15:45:00Z',
    companyIds: ['barrett_propane'],
    category: 'leadership',
    summary: 'At a regional conference, 3rd-gen principal indicated the family is considering transition options and is open to conversations with strategic buyers. Warm signal — no banker engaged yet.',
    impactScore: 67,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_009',
    headline: 'AmeriGas names new President of Commercial Solutions',
    source: 'UGI Corporation',
    sourceUrl: 'ugicorp.com',
    publishedAt: '2026-04-05T10:20:00Z',
    companyIds: ['amerigas'],
    category: 'leadership',
    summary: 'UGI subsidiary AmeriGas promoted Sarah Chen to President of Commercial Solutions, a newly created role focused on autogas and industrial verticals. Signals continued de-emphasis on residential tank exchange.',
    impactScore: 42,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_010',
    headline: 'Thompson Gas expands into Tennessee with 3-location acquisition',
    source: 'Butane-Propane News',
    sourceUrl: 'bpnews.com',
    publishedAt: '2026-04-03T14:00:00Z',
    companyIds: ['thompson_gas'],
    category: 'expansion',
    summary: 'Thompson Gas closed on three locations from a retiring family operator in Eastern Tennessee. Extends footprint south of the company\'s Maryland/Virginia core.',
    impactScore: 48,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_011',
    headline: 'Mt. Belvieu propane spot prices hit 18-month low on mild winter tail',
    source: 'OPIS',
    sourceUrl: 'opisnet.com',
    publishedAt: '2026-04-02T16:30:00Z',
    companyIds: [],
    category: 'pricing',
    summary: 'Mt. Belvieu propane closed at 68¢/gal, the lowest mark since October 2024. Inventory builds of 2.1M barrels week-over-week compound the downward pressure heading into shoulder season.',
    impactScore: 36,
    isBreaking: false,
    readMinutes: 3,
  },
  {
    id: 'n_012',
    headline: 'Ferrellgas reports weaker Blue Rhino volumes; management signals strategic review',
    source: 'NYSE: FGPR 8-K',
    sourceUrl: 'sec.gov',
    publishedAt: '2026-03-30T08:30:00Z',
    companyIds: ['ferrellgas'],
    category: 'capital',
    summary: 'Q1 Blue Rhino cylinder volumes declined 4.8% YoY. Management disclosed in the 8-K that the Board has authorized a strategic review of the tank-exchange segment.',
    impactScore: 76,
    isBreaking: false,
    readMinutes: 4,
  },
  {
    id: 'n_013',
    headline: 'Heritage Energy Partners acquires Parker Gas from founding family',
    source: 'PE Hub',
    sourceUrl: 'pehub.com',
    publishedAt: '2026-03-27T11:10:00Z',
    companyIds: ['heritage_energy', 'parker_gas'],
    category: 'ma',
    summary: 'Apollo-backed Heritage Energy Partners closed on Parker Gas, adding 14 locations across Georgia and South Carolina. Founding Parker family had been in conversations with multiple buyers since 2024.',
    impactScore: 72,
    isBreaking: false,
    readMinutes: 3,
  },
  {
    id: 'n_014',
    headline: 'CHS Energy cooperative members approve capital return program',
    source: 'CHS Inc. Annual Report',
    sourceUrl: 'chsinc.com',
    publishedAt: '2026-03-25T09:00:00Z',
    companyIds: ['chs_propane'],
    category: 'capital',
    summary: 'Member-owners of CHS approved a $180M patronage return tied to strong 2025 earnings. Signals cooperative-favorable cycle; reduces near-term consolidation pressure on member farms.',
    impactScore: 31,
    isBreaking: false,
    readMinutes: 3,
  },
  {
    id: 'n_015',
    headline: 'DOT finalizes HOS exemption renewal for propane delivery vehicles',
    source: 'NPGA',
    sourceUrl: 'npga.org',
    publishedAt: '2026-03-22T12:45:00Z',
    companyIds: [],
    category: 'regulatory',
    summary: 'The U.S. DOT renewed the Hours-of-Service exemption for propane delivery during winter heating months through March 2029. NPGA-led coalition effort; material operational tailwind for Northeast retailers.',
    impactScore: 45,
    isBreaking: false,
    readMinutes: 3,
  },
  {
    id: 'n_016',
    headline: 'Blarney Castle Oil & Propane completes Michigan roll-up of 4 independent dealers',
    source: 'LP Gas Magazine',
    sourceUrl: 'lpgasmagazine.com',
    publishedAt: '2026-03-20T13:15:00Z',
    companyIds: ['blarney_castle'],
    category: 'ma',
    summary: 'Blarney Castle announced closing on four independent dealers (combined ~22 locations) across Lower Michigan. Family-owned consolidator continuing aggressive in-market roll-up strategy.',
    impactScore: 58,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_017',
    headline: 'Propane Plus Energy files $400M term loan amendment; sources say dividend recap',
    source: 'LCD',
    sourceUrl: 'leveragedloan.com',
    publishedAt: '2026-03-18T14:30:00Z',
    companyIds: ['propane_plus'],
    category: 'capital',
    summary: 'Kinderhook-portfolio Propane Plus filed term loan amendment docs suggesting an incremental $150M raise, which market participants interpret as a dividend recap. Could extend Kinderhook hold period by 12–18 months.',
    impactScore: 64,
    isBreaking: false,
    replyIds: [],
    readMinutes: 3,
  },
  {
    id: 'n_018',
    headline: 'California Air Resources Board proposes propane autogas incentive expansion',
    source: 'CARB',
    sourceUrl: 'arb.ca.gov',
    publishedAt: '2026-03-15T16:00:00Z',
    companyIds: [],
    category: 'regulatory',
    summary: 'CARB released draft rule expanding propane autogas tax credit from $0.50/gal to $0.75/gal for commercial fleets. Comment period open through May 30. Bullish for West Coast autogas operators.',
    impactScore: 48,
    isBreaking: false,
    readMinutes: 4,
  },
  {
    id: 'n_019',
    headline: 'Paraco Gas launches $25M Westchester training and dispatch center',
    source: 'Paraco Gas press release',
    sourceUrl: 'paracogas.com',
    publishedAt: '2026-03-12T10:00:00Z',
    companyIds: ['paraco_gas'],
    category: 'expansion',
    summary: 'The largest independent propane retailer in the Northeast broke ground on a $25M facility consolidating training, dispatch, and fleet maintenance. Continued investment signals no near-term sale intent.',
    impactScore: 28,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_020',
    headline: 'GulfStream Propane and Cornerstone Fuels terminate merger talks',
    source: 'Reuters',
    sourceUrl: 'reuters.com',
    publishedAt: '2026-03-10T07:45:00Z',
    companyIds: ['gulfstream_gas', 'cornerstone_fuels'],
    category: 'ma',
    summary: 'Two PE-backed platforms ended exclusive merger discussions per sources familiar. Valuation gap cited — GulfStream sponsor reportedly sought a 9.5x EBITDA floor.',
    impactScore: 69,
    isBreaking: false,
    readMinutes: 3,
  },
  {
    id: 'n_021',
    headline: 'Davenport Energy names Susan Davenport as COO, signals 4th-generation transition',
    source: 'Virginia Business Journal',
    sourceUrl: 'virginiabusiness.com',
    publishedAt: '2026-03-07T11:20:00Z',
    companyIds: ['davenport_energy'],
    category: 'leadership',
    summary: '4th-generation family member Susan Davenport promoted to COO. Owner family signals continued independent operation; reduces near-term exit probability.',
    impactScore: 34,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_022',
    headline: 'Berico Fuels files lawsuit over non-compete breach by former sales leader',
    source: 'Greensboro News & Record',
    sourceUrl: 'greensboro.com',
    publishedAt: '2026-03-05T15:10:00Z',
    companyIds: ['berico'],
    category: 'litigation',
    summary: 'Berico filed suit in Guilford County Superior Court alleging a former regional sales director violated a two-year non-compete by joining a competitor. Ongoing.',
    impactScore: 22,
    isBreaking: false,
    readMinutes: 2,
  },
  {
    id: 'n_023',
    headline: 'Targa NGL Pipeline announces Permian-to-Mt. Belvieu capacity expansion',
    source: 'Targa Resources',
    sourceUrl: 'targaresources.com',
    publishedAt: '2026-03-03T09:30:00Z',
    companyIds: ['targa_ngl'],
    category: 'expansion',
    summary: 'Targa disclosed $850M expansion adding 150 Mbbl/d of NGL takeaway from the Permian to Mt. Belvieu. Longer-term softness to propane supply, neutral for retailers.',
    impactScore: 30,
    isBreaking: false,
    readMinutes: 4,
  },
  {
    id: 'n_024',
    headline: 'Centra Sota Cooperative announces merger with neighboring Ag Valley',
    source: 'Agri-View',
    sourceUrl: 'agupdate.com',
    publishedAt: '2026-02-28T14:00:00Z',
    companyIds: ['centra_sota', 'ag_valley'],
    category: 'ma',
    summary: 'Two Upper Midwest farm cooperatives announced merger of equals, creating a combined entity with 180+ locations and ~$1.1B in revenue. Closing expected Q3 pending member votes.',
    impactScore: 53,
    isBreaking: false,
    readMinutes: 3,
  },
  {
    id: 'n_025',
    headline: 'Eagle Propane & Fuels partners with DoorDash for propane tank delivery pilot',
    source: 'Propane.com',
    sourceUrl: 'propane.com',
    publishedAt: '2026-02-25T10:45:00Z',
    companyIds: ['eagle_propane'],
    category: 'partnership',
    summary: 'Eagle Propane launched a pilot with DoorDash in three Texas metros to deliver 20lb exchange cylinders in under 2 hours. Novel channel experiment in cylinder segment.',
    impactScore: 26,
    isBreaking: false,
    readMinutes: 2,
  },
];

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------
const CATEGORY_META = {
  ma:          { label: 'M&A',           icon: 'trending',   tone: 'indigo', color: '#635BFF' },
  leadership:  { label: 'Leadership',    icon: 'users',      tone: 'amber',  color: '#C4862D' },
  capital:     { label: 'Capital',       icon: 'chart',      tone: 'blue',   color: '#1890FF' },
  regulatory:  { label: 'Regulatory',    icon: 'briefcase',  tone: 'neutral', color: '#697386' },
  expansion:   { label: 'Expansion',     icon: 'arrowUp',    tone: 'green',  color: '#009966' },
  pricing:     { label: 'Pricing',       icon: 'signal',     tone: 'neutral', color: '#697386' },
  litigation:  { label: 'Litigation',    icon: 'x',          tone: 'red',    color: '#D83E4A' },
  partnership: { label: 'Partnership',   icon: 'network',    tone: 'indigo', color: '#635BFF' },
};

// Time ago — deterministic given our reference date
function timeAgo(iso) {
  const now = new Date('2026-04-24T18:00:00Z').getTime();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// Demo-time bridge: the News feed uses production-style canonical ids
// (matching data/companies.json). The UI kit's mock roster uses short ids.
// Map long→short so filtering/clicking works in the prototype.
// When wired to the real API, delete this map — ids will match natively.
const CANONICAL_TO_DEMO = {
  lampton_love: 'll',
  blossman_gas: 'blo',
  amerigas: 'ami',
  ferrellgas: 'fer',
  cherry_energy: 'che',
  barrett_propane: 'bar',
  dead_river: 'dea',
  chs_propane: 'chs',
  crystal_flash: 'cry',
  eastern_propane: 'edp',
  berico: 'ber',
  davenport_energy: 'dav',
  dnd_gas: 'dnd',
};
function resolveId(id) { return CANONICAL_TO_DEMO[id] || id; }

function companyName(id) {
  const sid = CANONICAL_TO_DEMO[id] || id;
  const c = (window.MOCK_COMPANIES || []).find(x => x.id === sid || x.id === id);
  return c ? c.name : id;
}
// ---------------------------------------------------------------------------
// Full News view
// ---------------------------------------------------------------------------
function NewsView({ onSelect }) {
  const [cat, setCat] = React.useState('all');
  const [impact, setImpact] = React.useState('all'); // all | high | mid | low
  const [query, setQuery] = React.useState('');

  const articles = window.NEWS_ARTICLES || [];

  const filtered = articles.filter(a => {
    if (cat !== 'all' && a.category !== cat) return false;
    if (impact === 'high' && a.impactScore < 70) return false;
    if (impact === 'mid' && (a.impactScore < 40 || a.impactScore >= 70)) return false;
    if (impact === 'low' && a.impactScore >= 40) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = (a.headline + ' ' + a.summary + ' ' + a.companyIds.map(companyName).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Top 3 "action items" — high impact + breaking/recent
  const actionItems = [...articles]
    .filter(a => a.impactScore >= 70)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);

  // Category counts
  const catCounts = Object.keys(CATEGORY_META).reduce((acc, k) => {
    acc[k] = articles.filter(a => a.category === k).length;
    return acc;
  }, {});

  const handleCompanyClick = (id) => {
    if (onSelect) onSelect(resolveId(id));
  };

  return (
    <div style={{ flex: 1, display: 'flex', background: '#F6F9FC', minHeight: 0 }}>
      {/* Main feed column */}
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Action items strip — "What deserves a call this week" */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#635BFF,#4B45B8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="zap" size={12} color="#fff"/>
            </div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Deal triggers this week</h3>
            <Badge tone="indigo">{actionItems.length} require attention</Badge>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8B97A8' }}>Auto-surfaced by impact score + recency</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {actionItems.map(a => {
              const meta = CATEGORY_META[a.category];
              return (
                <div key={a.id} style={{
                  padding: 16, background: '#fff', borderRadius: 10,
                  border: '1px solid #E3E8EE',
                  boxShadow: '0 1px 2px rgba(10,37,64,0.04)',
                  display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: meta.color }}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    {a.isBreaking && <Badge tone="red" dot>Breaking</Badge>}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8B97A8' }}>{timeAgo(a.publishedAt)}</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0A2540', lineHeight: 1.35, letterSpacing: '-0.1px' }}>{a.headline}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#425466', lineHeight: 1.5, flex: 1 }}>{a.summary.slice(0, 140)}{a.summary.length > 140 ? '…' : ''}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid #EDF1F6' }}>
                    {a.companyIds.slice(0, 2).map(id => (
                      <button key={id} onClick={(e) => { e.stopPropagation(); handleCompanyClick(id); }} style={{
                        padding: '3px 8px', background: '#F7FAFC', border: '1px solid #E3E8EE',
                        borderRadius: 9999, fontSize: 11, fontWeight: 500, color: '#0A2540',
                        fontFamily: 'inherit', cursor: 'pointer',
                      }}>{companyName(id)}</button>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 10, color: '#697386', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.3 }}>Impact</span>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, color: meta.color }}>{a.impactScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search + filter bar */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6 }}>
            <Icon name="search" size={14} color="#8B97A8"/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search headlines, summaries, companies…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#0A2540', background: 'transparent' }}
            />
            {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', color: '#8B97A8', cursor: 'pointer' }}><Icon name="x" size={13}/></button>}
          </div>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #E3E8EE', borderRadius: 6, padding: 2 }}>
            {[['all','Any impact'],['high','High'],['mid','Mid'],['low','Low']].map(([k, l]) => (
              <button key={k} onClick={() => setImpact(k)} style={{
                padding: '5px 10px', border: 'none', borderRadius: 4,
                background: impact === k ? '#EEF0FF' : 'transparent',
                color: impact === k ? '#4B45B8' : '#697386',
                fontWeight: impact === k ? 600 : 400,
                fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon="bell">Alerts</Button>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setCat('all')} style={chipStyle(cat === 'all')}>
            All <span style={chipCountStyle(cat === 'all')}>{articles.length}</span>
          </button>
          {Object.entries(CATEGORY_META).map(([k, m]) => (
            <button key={k} onClick={() => setCat(k)} style={chipStyle(cat === k)}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, marginRight: 6 }}/>
              {m.label} <span style={chipCountStyle(cat === k)}>{catCounts[k]}</span>
            </button>
          ))}
        </div>

        {/* Feed */}
        <Card padding={0}>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#8B97A8' }}>
              <div style={{ fontSize: 13 }}>No articles match these filters.</div>
            </div>
          )}
          {filtered.map((a, i) => {
            const meta = CATEGORY_META[a.category];
            return (
              <div key={a.id} style={{
                padding: '18px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid #EDF1F6' : 'none',
                display: 'flex', gap: 16,
              }}>
                {/* Impact rail */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, paddingTop: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#F7FAFC', border: '1px solid #E3E8EE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: meta.color,
                  }}>
                    <Icon name={meta.icon} size={14}/>
                  </div>
                  <div style={{ flex: 1, width: 2, background: '#EDF1F6', marginTop: 6 }}/>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {a.isBreaking && <Badge tone="red" dot>Breaking</Badge>}
                    <span style={{ fontSize: 11, color: '#697386', fontWeight: 500 }}>{a.source}</span>
                    <span style={{ fontSize: 11, color: '#C1CCD6' }}>·</span>
                    <span style={{ fontSize: 11, color: '#8B97A8' }}>{timeAgo(a.publishedAt)}</span>
                    <span style={{ fontSize: 11, color: '#C1CCD6' }}>·</span>
                    <span style={{ fontSize: 11, color: '#8B97A8' }}>{a.readMinutes} min read</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#697386', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Impact</span>
                      <div style={{ width: 48, height: 4, background: '#EDF1F6', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${a.impactScore}%`, height: '100%', background: a.impactScore >= 70 ? '#D83E4A' : a.impactScore >= 40 ? '#C4862D' : '#635BFF' }}/>
                      </div>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 600, color: '#0A2540', width: 22, textAlign: 'right' }}>{a.impactScore}</span>
                    </div>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#0A2540', lineHeight: 1.35, letterSpacing: '-0.2px' }}>{a.headline}</h4>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#425466', lineHeight: 1.55 }}>{a.summary}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {a.companyIds.length === 0 ? (
                      <Badge tone="outline">Industry-wide</Badge>
                    ) : (
                      a.companyIds.map(id => (
                        <button key={id} onClick={() => handleCompanyClick(id)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 9px', background: '#F7FAFC',
                          border: '1px solid #E3E8EE', borderRadius: 9999,
                          fontSize: 11, fontWeight: 500, color: '#0A2540',
                          fontFamily: 'inherit', cursor: 'pointer',
                        }}>
                          <Icon name="building" size={11} color="#697386"/>
                          {companyName(id)}
                        </button>
                      ))
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                      <button style={iconBtnStyle}><Icon name="bell" size={13} color="#697386"/></button>
                      <button style={iconBtnStyle}><Icon name="plus" size={13} color="#697386"/></button>
                      <a href={`https://${a.sourceUrl}`} target="_blank" rel="noopener" onClick={(e) => e.preventDefault()} style={iconBtnStyle}>
                        <Icon name="arrowRight" size={13} color="#635BFF"/>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8B97A8' }}>
          Showing {filtered.length} of {articles.length} articles · Feed refreshes hourly · Last updated 14m ago
        </div>
      </div>

      {/* Right rail — sources, saved searches, digest */}
      <div style={{ width: 300, background: '#fff', borderLeft: '1px solid #E3E8EE', padding: 20, overflow: 'auto' }}>
        {/* Weekly digest */}
        <div style={{ padding: 14, background: 'linear-gradient(135deg,#0A2540,#1A3C5E)', borderRadius: 10, color: '#fff', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Icon name="sparkle" size={13} color="#AB87FF"/>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: '#AB87FF' }}>AI weekly digest</span>
          </div>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>3 stories require a call this week</h4>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#B7C0CC', lineHeight: 1.55 }}>
            Succession and sale-process signals clustered in the Southeast. Blossman's banker hire is the highest-priority event.
          </p>
          <Button variant="primary" size="sm" style={{ width: '100%' }}>Read full digest</Button>
        </div>

        {/* Top sources */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Top sources this month</div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 20 }}>
          {[
            ['LP Gas Magazine', 8, 'Trade'],
            ['Butane-Propane News', 6, 'Trade'],
            ['SEC EDGAR', 4, 'Filings'],
            ['PE Hub', 3, 'M&A'],
            ['Propane.com (PERC)', 3, 'Industry'],
            ['Reuters', 2, 'General'],
          ].map(([n, c, kind]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid #EDF1F6', borderRadius: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: '#F7FAFC', border: '1px solid #E3E8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#425466', fontFamily: "'IBM Plex Mono'" }}>
                {n.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0A2540', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</div>
                <div style={{ fontSize: 10, color: '#8B97A8' }}>{kind}</div>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#0A2540', fontWeight: 600 }}>{c}</span>
            </div>
          ))}
        </div>

        {/* Saved news searches */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>My alerts</div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 20 }}>
          {[
            ['Southeast family successions', 12, '#635BFF'],
            ['Ares portfolio activity', 4, '#C4862D'],
            ['Cherry Energy — any mention', 3, '#009966'],
          ].map(([n, c, col]) => (
            <div key={n} style={{ padding: '8px 10px', border: '1px solid #EDF1F6', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: col }}/>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#0A2540' }}>{n}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 9999, background: '#F7FAFC', color: '#425466', fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>{c}</span>
              </div>
              <div style={{ fontSize: 10, color: '#8B97A8' }}>Matches trailing 90d</div>
            </div>
          ))}
          <button style={{ padding: '6px 10px', background: 'transparent', color: '#635BFF', border: 'none', fontSize: 12, fontWeight: 500, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={12}/> New alert
          </button>
        </div>

        {/* Feed health */}
        <div style={{ padding: 12, background: '#F7FAFC', borderRadius: 8, border: '1px solid #EDF1F6' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Feed coverage</div>
          <div style={{ display: 'grid', gap: 4, fontSize: 11, color: '#425466' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sources monitored</span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>42</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Companies matched</span><b style={{ color: '#0A2540', fontFamily: "'IBM Plex Mono'" }}>1,247</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Last ingestion</span><b style={{ color: '#009966', fontFamily: "'IBM Plex Mono'" }}>14m ago</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const chipStyle = (active) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '6px 12px', borderRadius: 9999,
  background: active ? '#0A2540' : '#fff',
  color: active ? '#fff' : '#425466',
  border: active ? '1px solid #0A2540' : '1px solid #E3E8EE',
  fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
  cursor: 'pointer',
});
const chipCountStyle = (active) => ({
  marginLeft: 6,
  fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 500,
  color: active ? '#AB87FF' : '#8B97A8',
});
const iconBtnStyle = {
  width: 26, height: 26, border: '1px solid #E3E8EE', borderRadius: 5,
  background: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

// ---------------------------------------------------------------------------
// Compact strip for use inside CompanyDetail — shows last 3 articles
// ---------------------------------------------------------------------------
function CompanyNewsStrip({ companyId, onOpenNews }) {
  const articles = (window.NEWS_ARTICLES || [])
    .filter(a => a.companyIds.some(cid => resolveId(cid) === companyId || cid === companyId))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);

  if (articles.length === 0) {
    return (
      <div style={{ padding: 12, background: '#F7FAFC', borderRadius: 8, fontSize: 12, color: '#8B97A8', textAlign: 'center' }}>
        No news matched in the trailing 90 days.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {articles.map(a => {
        const meta = CATEGORY_META[a.category];
        return (
          <div key={a.id} style={{ padding: 10, border: '1px solid #EDF1F6', borderRadius: 8, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Badge tone={meta.tone}>{meta.label}</Badge>
              {a.isBreaking && <Badge tone="red" dot>Breaking</Badge>}
              <span style={{ fontSize: 10, color: '#8B97A8', marginLeft: 'auto' }}>{timeAgo(a.publishedAt)}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', lineHeight: 1.4, marginBottom: 3 }}>{a.headline}</div>
            <div style={{ fontSize: 11, color: '#697386' }}>{a.source}</div>
          </div>
        );
      })}
      {onOpenNews && (
        <button onClick={onOpenNews} style={{
          padding: '6px 10px', background: 'transparent', color: '#635BFF',
          border: 'none', fontSize: 12, fontWeight: 500, textAlign: 'left',
          fontFamily: 'inherit', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          All news for this company <Icon name="arrowRight" size={12}/>
        </button>
      )}
    </div>
  );
}

Object.assign(window, { NewsView, CompanyNewsStrip });
