// Sidebar.jsx
function Sidebar({ filters, onFilter, search, onSearch }) {
  const owners = [['ALL','All'],['public','Public'],['pe','PE'],['family','Family'],['coop','Co-op'],['private','Private'],['ll','Ergon']];
  const types = [['ALL','All'],['retail','Retail'],['cylinder','Cylinder'],['multi','Multi-Fuel'],['industrial','Ind. Gas'],['coop','Co-op/Util'],['wholesale','Wholesale']];
  const regions = [['ALL','All US'],['southeast','Southeast'],['northeast','Northeast'],['midwest','Midwest'],['south_central','S. Central'],['west','West']];

  const Pills = ({ list, group, active }) => (
    <div style={sbStyles.pills}>
      {list.map(([k, label]) => (
        <span key={k} onClick={() => onFilter(group, k)}
          style={{ ...sbStyles.pill, ...(active === k ? (group === 'region' ? sbStyles.pillOnBrand : sbStyles.pillOn) : {}) }}>
          {label}
        </span>
      ))}
    </div>
  );

  return (
    <div style={sbStyles.sb}>
      <div style={sbStyles.section}>
        <input style={sbStyles.search} placeholder="Search companies..." value={search} onChange={e => onSearch(e.target.value)} />
      </div>
      <div style={sbStyles.section}>
        <div style={sbStyles.title}>Ownership</div>
        <Pills list={owners} group="owner" active={filters.owner} />
      </div>
      <div style={sbStyles.section}>
        <div style={sbStyles.title}>Business Type</div>
        <Pills list={types} group="type" active={filters.type} />
      </div>
      <div style={sbStyles.section}>
        <div style={sbStyles.title}>Region</div>
        <Pills list={regions} group="region" active={filters.region} />
      </div>
      <div style={sbStyles.section}>
        <div style={sbStyles.title}>Map Layers</div>
        <button style={sbStyles.fbtn}>Cluster Pins</button>
        <button style={{ ...sbStyles.fbtn, marginTop: 6 }}>County Data</button>
      </div>
      <div style={sbStyles.section}>
        <div style={sbStyles.title}>Options</div>
        <label style={sbStyles.check}><input type="checkbox" style={sbStyles.cbox} /> Platform only</label>
        <label style={sbStyles.check}><input type="checkbox" style={sbStyles.cbox} /> Hide excluded</label>
        <label style={sbStyles.check}><input type="checkbox" style={sbStyles.cbox} /> Hide Lampton Love</label>
      </div>
      <div style={{ ...sbStyles.section, borderBottom: 'none', marginTop: 'auto', padding: '12px 16px' }}>
        <div style={{ fontSize: 9, color: '#98A2B3' }}>Updated April 2026</div>
      </div>
    </div>
  );
}

const sbStyles = {
  sb: { width: 240, minWidth: 240, background: '#fff', borderRight: '1px solid #E4E7EC', overflowY: 'auto', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  section: { padding: '14px 16px', borderBottom: '1px solid #F0F2F5' },
  title: { fontSize: 11, fontWeight: 600, color: '#475467', marginBottom: 10 },
  search: { width: '100%', padding: '9px 12px', background: '#F5F6F8', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', color: '#101828', outline: 'none', boxSizing: 'border-box' },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  pill: { padding: '4px 10px', border: '1px solid #E4E7EC', borderRadius: 9999, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#475467' },
  pillOn: { background: '#101828', color: '#fff', borderColor: '#101828' },
  pillOnBrand: { background: '#7C5CFC', color: '#fff', borderColor: '#7C5CFC' },
  fbtn: { width: '100%', padding: '6px 14px', border: '1px solid #E4E7EC', borderRadius: 8, background: '#fff', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', color: '#475467', textAlign: 'left' },
  check: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, color: '#101828', cursor: 'pointer' },
  cbox: { width: 16, height: 16, borderRadius: 4, accentColor: '#7C5CFC', cursor: 'pointer' },
};

window.Sidebar = Sidebar;
