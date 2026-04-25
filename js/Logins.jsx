// Login variations
const LOGIN_ORBS = `
@keyframes rOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.1)} }
@keyframes rOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(0.95)} }
@keyframes rOrb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,30px) scale(1.05)} }
`;

// V1 — Stripe-style centered card on airy bg
function LoginV1({ onLogin, fullscreen = false }) {
  const handleSubmit = (e) => { if (e) e.preventDefault(); if (onLogin) onLogin(); };
  return (
    <div className="redesign" style={{ width: fullscreen ? '100vw' : 1280, height: fullscreen ? '100vh' : 820, background: '#F6F9FC', position: 'relative', overflow: 'hidden' }}>
      <style>{LOGIN_ORBS}</style>
      {/* Top nav */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#635BFF,#4B45B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '-0.5px' }}>PI</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.2px' }}>Propane Intelligence</span>
            <span style={{ fontSize: 11, color: '#8B97A8', fontWeight: 400 }}>built by Ergon Corporate Development</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13, color: '#425466' }}>
          <a style={{ color: '#425466', textDecoration: 'none' }}>Support</a>
          <a style={{ color: '#425466', textDecoration: 'none' }}>Contact</a>
          <span style={{ color: '#8B97A8' }}>Don't have an account? <a style={{ color: '#635BFF', fontWeight: 500, textDecoration: 'none' }}>Request access →</a></span>
        </div>
      </div>

      {/* Card */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 420, background: '#fff', borderRadius: 12, padding: 40, boxShadow: '0 15px 35px rgba(10,37,64,0.08), 0 5px 15px rgba(10,37,64,0.05)', border: '1px solid #E3E8EE' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.5px' }}>Sign in</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#697386' }}>Access the U.S. Propane Market Map</p>
          </div>

          {/* SSO */}
          <button onClick={handleSubmit} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', fontSize: 13, fontWeight: 500, color: '#0A2540', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', marginBottom: 8 }}>
            <Icon name="google" size={16} stroke={0} /> Continue with Google
          </button>
          <button onClick={handleSubmit} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', fontSize: 13, fontWeight: 500, color: '#0A2540', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, width: 14, height: 14 }}>
              <div style={{ background: '#F25022' }}/><div style={{ background: '#7FBA00' }}/><div style={{ background: '#00A4EF' }}/><div style={{ background: '#FFB900' }}/>
            </div>
            Continue with Microsoft
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: '#E3E8EE' }} />
            <span style={{ fontSize: 11, color: '#8B97A8', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 500 }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: '#E3E8EE' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#425466', marginBottom: 6 }}>Email</label>
            <input defaultValue="dan@ergon.com" style={{ width: '100%', padding: '9px 12px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', color: '#0A2540', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#425466' }}>Password</label>
              <a style={{ fontSize: 12, color: '#635BFF', fontWeight: 500, textDecoration: 'none' }}>Forgot?</a>
            </div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', padding: '9px 12px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', color: '#0A2540', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
          </div>

          <button onClick={handleSubmit} style={{ width: '100%', padding: '10px 14px', border: 'none', borderRadius: 6, background: '#635BFF', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(10,37,64,0.1), inset 0 1px 0 rgba(255,255,255,0.15)' }}>Continue</button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#8B97A8' }}>
            Single sign-on (SSO) · <a style={{ color: '#635BFF', textDecoration: 'none', fontWeight: 500 }}>Use security key</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 24, fontSize: 12, color: '#8B97A8' }}>
        <span>© 2026 Ergon, Inc.</span>
        <a style={{ color: '#8B97A8', textDecoration: 'none' }}>Privacy</a>
        <a style={{ color: '#8B97A8', textDecoration: 'none' }}>Terms</a>
      </div>
    </div>
  );
}

// Compute live login-screen stats from MOCK_COMPANIES.
// Falls back to "—" if the data hasn't loaded yet (rare — login renders after
// data hydration in App.jsx). Numbers tick when data finishes loading.
function _loginLiveStats() {
  const cs = (window.MOCK_COMPANIES || []);
  if (!cs.length) return { count: '—', market: '—', coverage: '—', countLong: '...' };
  const total = cs.length;
  const totalRev = cs.reduce((a, c) => a + (c.estRevenue || c.rev || 0), 0);
  const states = new Set();
  cs.forEach(c => (c.statesOperating || []).forEach(s => states.add(s)));
  const coveragePct = Math.round((states.size / 50) * 100);
  const fmtMoney = (n) => {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M';
    return '$' + n.toLocaleString();
  };
  return {
    count: total.toLocaleString(),
    countLong: total.toLocaleString(),
    market: fmtMoney(totalRev),
    coverage: coveragePct + '%',
  };
}

// V2 — Split screen with rich marketing panel
function LoginV2({ onLogin, fullscreen = false }) {
  const handleSubmit = (e) => { if (e) e.preventDefault(); if (onLogin) onLogin(); };
  const [, _setStatsTick] = React.useState(0);
  React.useEffect(() => {
    if ((window.MOCK_COMPANIES || []).length) return;
    // Data may still be hydrating — listen for the global ready event.
    const onReady = () => _setStatsTick(t => t + 1);
    window.addEventListener('pi:data-ready', onReady);
    return () => window.removeEventListener('pi:data-ready', onReady);
  }, []);
  const _stats = _loginLiveStats();
  return (
    <div className="redesign" style={{ width: fullscreen ? '100vw' : 1280, height: fullscreen ? '100vh' : 820, background: '#fff', display: 'flex' }}>
      {/* Left: brand panel */}
      <div style={{ width: 560, background: 'linear-gradient(165deg, #0A2540 0%, #1A365D 60%, #2D4A7A 100%)', padding: '48px 56px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative grid */}
        <svg width="560" height="820" style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
          <defs><pattern id="lgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5"/></pattern></defs>
          <rect width="560" height="820" fill="url(#lgrid)"/>
        </svg>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#635BFF,#8B7FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, letterSpacing: '-0.5px' }}>PI</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px' }}>Propane Intelligence</span>
            <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 400 }}>built by Ergon Corporate Development</span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#A0AEC0', marginBottom: 16 }}>U.S. PROPANE MARKET MAP</div>
          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 600, letterSpacing: '-1px', lineHeight: 1.1, color: '#fff' }}>
            The operating system for propane M&A.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#C0CCD9', margin: '20px 0 32px', maxWidth: 420 }}>
            Real-time coverage of {_stats.countLong} retailers. Strategic-fit scoring, M&A signals, and competitor mapping for corporate development teams.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, maxWidth: 420 }}>
            {[[_stats.count,'Companies'],[_stats.market,'Market'],[_stats.coverage,'Coverage']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.5px', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                <div style={{ fontSize: 11, color: '#8B97A8', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 12, color: '#8B97A8', display: 'flex', gap: 20 }}>
          <span>© 2026 Ergon, Inc.</span>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 380 }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.5px' }}>Welcome back</h2>
          <p style={{ margin: '6px 0 28px', fontSize: 14, color: '#697386' }}>Sign in to access your market intelligence.</p>

          <button onClick={handleSubmit} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff', fontSize: 13, fontWeight: 500, color: '#0A2540', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', marginBottom: 20 }}>
            <Icon name="google" size={16} stroke={0} /> Continue with single sign-on (SSO)
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: '#E3E8EE' }} />
            <span style={{ fontSize: 11, color: '#8B97A8' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#E3E8EE' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#425466', marginBottom: 6 }}>Work email</label>
            <input defaultValue="dan@ergon.com" style={{ width: '100%', padding: '9px 12px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', color: '#0A2540', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#425466' }}>Password</label>
              <a style={{ fontSize: 12, color: '#635BFF', fontWeight: 500, textDecoration: 'none' }}>Forgot?</a>
            </div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', padding: '9px 12px', border: '1px solid #E3E8EE', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', color: '#0A2540', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#425466', marginBottom: 20 }}>
            <input type="checkbox" defaultChecked style={{ accentColor: '#635BFF' }} /> Keep me signed in
          </label>
          <button onClick={handleSubmit} style={{ width: '100%', padding: '10px 14px', border: 'none', borderRadius: 6, background: '#635BFF', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginV1, LoginV2 });
