// LeagueTable.jsx
function LeagueTable({ rows, onRow, onAdd, onSpot, platform, selected }) {
  const badge = (t) => {
    const m = { public: ['#EFF8FF','#175CD3'], pe: ['#EDE9FE','#6941C6'], family: ['#ECFDF3','#027A48'], coop: ['#FFFAEB','#B54708'], private: ['#F5F6F8','#475467'], ll: ['#EDE9FE','#5B3FD1'] };
    return m[t] || m.private;
  };
  const scoreStyle = (s) => s == null ? ltStyles.scoreN : s >= 30 ? ltStyles.scoreH : s >= 10 ? ltStyles.scoreM : ltStyles.scoreL;

  return (
    <div style={ltStyles.wrap}>
      <div style={ltStyles.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={ltStyles.h2}>League Table</h2>
          <button style={ltStyles.help}>?</button>
          <button style={{ ...ltStyles.help, width: 'auto', padding: '0 8px', borderRadius: 6, fontSize: 9 }}>Sources</button>
        </div>
        <span style={ltStyles.cnt}>{rows.length} companies</span>
      </div>
      <div style={ltStyles.scroll}>
        <table style={ltStyles.tbl}>
          <thead><tr>
            <th style={ltStyles.th}>👁</th>
            <th style={ltStyles.th}>+</th>
            <th style={ltStyles.th}>#</th>
            <th style={{...ltStyles.th, textAlign: 'left'}}>Company <span style={ltStyles.arrow}>▲</span></th>
            <th style={ltStyles.th}>Type</th>
            <th style={ltStyles.th}>Locs</th>
            <th style={ltStyles.th}>Prox</th>
            <th style={ltStyles.th}>Cnty</th>
            <th style={ltStyles.thSort}>Total <span style={ltStyles.arrowOn}>▼</span></th>
            <th style={ltStyles.th}>Mkt%</th>
            <th style={ltStyles.th}>Rev</th>
            <th style={ltStyles.th}>Emp</th>
            <th style={ltStyles.th}>States</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const [bg, fg] = badge(r.type);
              const isSel = selected === r.id;
              const isPf = platform.includes(r.id) || r.isPlatform;
              return (
                <tr key={r.id} style={{ ...ltStyles.tr, ...(isSel ? ltStyles.trSel : {}), ...(isPf && !isSel ? ltStyles.trPf : {}) }} onClick={() => onRow(r.id)}>
                  <td style={ltStyles.td}><button style={ltStyles.spot} onClick={(e) => {e.stopPropagation(); onSpot(r.id);}}>👁</button></td>
                  <td style={ltStyles.td}><button style={{ ...ltStyles.addBtn, ...(isPf ? ltStyles.addOn : {}) }} onClick={(e) => {e.stopPropagation(); onAdd(r.id);}}>{isPf ? '✓' : '+'}</button></td>
                  <td style={{...ltStyles.td, fontFamily: "'IBM Plex Mono'", color: '#98A2B3'}}>{r.rank}</td>
                  <td style={{...ltStyles.td, textAlign: 'left'}}>
                    <div style={ltStyles.cn}>{r.name}</div>
                    <div style={ltStyles.cnSub}>{r.parent}</div>
                  </td>
                  <td style={ltStyles.td}><span style={{ ...ltStyles.badge, background: bg, color: fg }}>{r.typeLabel}</span></td>
                  <td style={ltStyles.tdNum}>{r.locs}</td>
                  <td style={ltStyles.tdNum}>{r.prox ?? '—'}</td>
                  <td style={ltStyles.tdNum}>{r.county ?? '—'}</td>
                  <td style={ltStyles.td}><span style={scoreStyle(r.total)}>{r.total ?? '—'}</span></td>
                  <td style={ltStyles.tdNum}>{r.mkt.toFixed(1)}%</td>
                  <td style={ltStyles.tdNum}>${r.rev >= 1000 ? (r.rev/1000).toFixed(1)+'B' : r.rev.toFixed(1)+'M'}</td>
                  <td style={ltStyles.tdNum}>{r.emp}</td>
                  <td style={{...ltStyles.td, fontSize: 10, color: '#475467'}}>{r.states.length > 2 ? `${r.states[0]} +${r.states.length-1}` : r.states.join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ltStyles = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #E4E7EC', minWidth: 0 },
  head: { padding: '12px 16px', background: '#fff', borderBottom: '1px solid #E4E7EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  h2: { fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 },
  help: { width: 22, height: 22, borderRadius: '50%', border: '1px solid #E4E7EC', background: '#fff', color: '#475467', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  cnt: { fontSize: 11, color: '#475467', fontWeight: 500, background: 'rgba(0,0,0,0.04)', padding: '2px 10px', borderRadius: 9999 },
  scroll: { flex: 1, overflow: 'auto' },
  tbl: { width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'auto' },
  th: { background: '#F9FAFB', color: '#475467', padding: '10px 6px', fontWeight: 600, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #E4E7EC', whiteSpace: 'nowrap' },
  thSort: { background: '#F9FAFB', color: '#7C5CFC', padding: '10px 6px', fontWeight: 600, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #E4E7EC', whiteSpace: 'nowrap' },
  arrow: { fontSize: 8, marginLeft: 2, opacity: 0.3 },
  arrowOn: { fontSize: 8, marginLeft: 2, color: '#7C5CFC' },
  tr: { cursor: 'pointer', borderBottom: '1px solid #F0F2F5' },
  trSel: { background: '#EDE9FE', boxShadow: 'inset 3px 0 0 #7C5CFC' },
  trPf: { background: 'rgba(124,92,252,0.04)', boxShadow: 'inset 3px 0 0 #7C5CFC' },
  td: { padding: '10px 6px', verticalAlign: 'middle', textAlign: 'center', fontSize: 12 },
  tdNum: { padding: '10px 6px', verticalAlign: 'middle', textAlign: 'center', fontSize: 11, fontFamily: "'IBM Plex Mono'", fontVariantNumeric: 'tabular-nums', color: '#101828' },
  cn: { fontWeight: 500, color: '#101828', fontSize: 13 },
  cnSub: { fontSize: 10, color: '#98A2B3', marginTop: 1 },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 500 },
  addBtn: { width: 22, height: 22, borderRadius: '50%', border: '1px solid #E4E7EC', background: '#fff', color: '#101828', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  addOn: { background: '#7C5CFC', color: '#fff', borderColor: '#7C5CFC' },
  spot: { width: 18, height: 18, borderRadius: 6, border: '1px solid #E4E7EC', background: '#fff', color: '#475467', fontSize: 11, cursor: 'pointer' },
  scoreH: { color: '#027A48', fontWeight: 600, background: '#ECFDF3', padding: '2px 8px', borderRadius: 9999, fontFamily: "'IBM Plex Mono'", fontSize: 11 },
  scoreM: { color: '#B54708', fontWeight: 600, background: '#FFFAEB', padding: '2px 8px', borderRadius: 9999, fontFamily: "'IBM Plex Mono'", fontSize: 11 },
  scoreL: { color: '#98A2B3', fontFamily: "'IBM Plex Mono'", fontSize: 11 },
  scoreN: { color: '#98A2B3', fontFamily: "'IBM Plex Mono'", fontSize: 11 },
};

window.LeagueTable = LeagueTable;
