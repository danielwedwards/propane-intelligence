// shared-ui.jsx — shared primitives for redesign
const Icon = ({ name, size = 16, color = 'currentColor', stroke = 1.75 }) => {
  const paths = {
    search: <React.Fragment><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></React.Fragment>,
    plus: <React.Fragment><path d="M12 5v14M5 12h14"/></React.Fragment>,
    check: <React.Fragment><path d="M20 6 9 17l-5-5"/></React.Fragment>,
    x: <React.Fragment><path d="M18 6 6 18M6 6l12 12"/></React.Fragment>,
    arrowRight: <React.Fragment><path d="M5 12h14M13 6l6 6-6 6"/></React.Fragment>,
    arrowUp: <React.Fragment><path d="m6 15 6-6 6 6"/></React.Fragment>,
    arrowDown: <React.Fragment><path d="m6 9 6 6 6-6"/></React.Fragment>,
    trending: <React.Fragment><path d="M3 17 9 11 13 15 21 7M14 7h7v7"/></React.Fragment>,
    map: <React.Fragment><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></React.Fragment>,
    grid: <React.Fragment><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></React.Fragment>,
    list: <React.Fragment><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></React.Fragment>,
    chart: <React.Fragment><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></React.Fragment>,
    signal: <React.Fragment><path d="M2 12h3l3-9 4 18 3-9h7"/></React.Fragment>,
    target: <React.Fragment><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></React.Fragment>,
    network: <React.Fragment><circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7 7l4 9M17 7l-4 9M7 6h10"/></React.Fragment>,
    users: <React.Fragment><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M21 18a4 4 0 0 0-7-2.7"/></React.Fragment>,
    briefcase: <React.Fragment><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></React.Fragment>,
    bell: <React.Fragment><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></React.Fragment>,
    settings: <React.Fragment><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-2 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></React.Fragment>,
    filter: <React.Fragment><path d="M3 5h18l-7 8v7l-4-2v-5z"/></React.Fragment>,
    download: <React.Fragment><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></React.Fragment>,
    zap: <React.Fragment><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></React.Fragment>,
    building: <React.Fragment><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2M10 22v-4h4v4"/></React.Fragment>,
    chevronRight: <React.Fragment><path d="m9 6 6 6-6 6"/></React.Fragment>,
    sparkle: <React.Fragment><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8"/></React.Fragment>,
    newspaper: <React.Fragment><path d="M4 4h14v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4z"/><path d="M18 8h3v11a2 2 0 0 1-2 2"/><path d="M8 8h6M8 12h6M8 16h4"/></React.Fragment>,
    google: <React.Fragment><path d="M22 12.2c0-.7-.1-1.3-.2-1.9H12v3.8h5.6c-.2 1.2-1 2.3-2 3v2.5h3.3c1.9-1.8 3.1-4.4 3.1-7.4z" fill="#4285F4" stroke="none"/><path d="M12 22c2.7 0 5-1 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22z" fill="#34A853" stroke="none"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3a10 10 0 0 0 0 9.2z" fill="#FBBC05" stroke="none"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335" stroke="none"/></React.Fragment>,
    info: <React.Fragment><circle cx="12" cy="12" r="9"/><path d="M12 8.5h.01M11 12h1v5h1"/></React.Fragment>,
    'log-out': <React.Fragment><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></React.Fragment>,
    bookmark: <React.Fragment><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></React.Fragment>,
    layers: <React.Fragment><path d="m12 2-10 5 10 5 10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></React.Fragment>,
    'trending-up': <React.Fragment><path d="M3 17 9 11 13 15 21 7M14 7h7v7"/></React.Fragment>,
    'external-link': <React.Fragment><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></React.Fragment>,
    sun: <React.Fragment><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></React.Fragment>,
    moon: <React.Fragment><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></React.Fragment>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
};

// Typed Button
const Button = ({ variant = 'primary', size = 'md', children, icon, iconRight, onClick, style, disabled }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    border: 'none', borderRadius: 6, fontFamily: 'inherit', fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
    fontSize: size === 'sm' ? 12 : size === 'lg' ? 15 : 13,
    padding: size === 'sm' ? '6px 10px' : size === 'lg' ? '10px 18px' : '7px 14px',
  };
  const variants = {
    primary: { background: '#635BFF', color: '#fff', boxShadow: '0 1px 2px rgba(10,37,64,0.1), inset 0 1px 0 rgba(255,255,255,0.12)' },
    secondary: { background: '#fff', color: '#0A2540', border: '1px solid #E3E8EE', boxShadow: '0 1px 2px rgba(10,37,64,0.04)' },
    ghost: { background: 'transparent', color: '#425466' },
    ink: { background: '#0A2540', color: '#fff' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 14} />}
    </button>
  );
};

// Badge — semantic pill
const Badge = ({ tone = 'neutral', children, dot, style }) => {
  const tones = {
    neutral:  { bg: '#F7FAFC',   fg: '#425466',   dot: '#8B97A8' },
    indigo:   { bg: '#EEF0FF',   fg: '#4B45B8',   dot: '#635BFF' },
    green:    { bg: '#E6F6F0',   fg: '#006847',   dot: '#009966' },
    amber:    { bg: '#FDF6E3',   fg: '#8B5A0E',   dot: '#C4862D' },
    red:      { bg: '#FCEBEC',   fg: '#8B1A26',   dot: '#D83E4A' },
    blue:     { bg: '#E6F4FF',   fg: '#0050B3',   dot: '#1890FF' },
    outline:  { bg: '#fff',      fg: '#425466',   dot: '#8B97A8', border: '1px solid #E3E8EE' },
  };
  const t = tones[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 500, background: t.bg, color: t.fg, border: t.border || 'none', ...style }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot }} />}
      {children}
    </span>
  );
};

// Card
const Card = ({ children, style, padding = 20, hover }) => (
  <div style={{
    background: '#fff', borderRadius: 8, border: '1px solid #E3E8EE',
    boxShadow: '0 1px 2px rgba(10,37,64,0.04)',
    padding, transition: 'all 0.15s',
    ...(hover ? { cursor: 'pointer' } : {}),
    ...style,
  }}>{children}</div>
);

// KPI Stat
const Stat = ({ label, value, delta, sub, icon, style }) => (
  <div style={{ padding: 20, ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: '#697386', fontWeight: 500 }}>{label}</div>
      {icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF0FF', color: '#635BFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} /></div>}
    </div>
    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', color: '#0A2540', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {delta && (
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: delta.startsWith('+') || delta.startsWith('↑') ? '#009966' : '#D83E4A' }}>
        <Icon name={delta.startsWith('+') || delta.startsWith('↑') ? 'arrowUp' : 'arrowDown'} size={12} stroke={2.5} />
        {delta}{sub && <span style={{ color: '#8B97A8', fontWeight: 400, marginLeft: 2 }}>{sub}</span>}
      </div>
    )}
  </div>
);

Object.assign(window, { Icon, Button, Badge, Card, Stat });
