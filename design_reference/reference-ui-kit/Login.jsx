// Login.jsx — Stripe-style sign in with floating color orbs.
// Soft colored blobs drift around on a light wash — feels premium and
// animated without requiring a WebGL dependency that may be blocked.
const ORBS = [
  { c: '#A78BFA', x: 15, y: 25, size: 520, dx: 0.07, dy: 0.05, phase: 0 },
  { c: '#60A5FA', x: 78, y: 20, size: 460, dx: -0.06, dy: 0.08, phase: 1.3 },
  { c: '#22D3EE', x: 82, y: 80, size: 540, dx: -0.08, dy: -0.05, phase: 2.1 },
  { c: '#F472B6', x: 12, y: 78, size: 420, dx: 0.05, dy: -0.07, phase: 3.4 },
  { c: '#818CF8', x: 50, y: 50, size: 600, dx: 0.04, dy: 0.04, phase: 4.2 },
];

function FloatingOrbs() {
  const refs = React.useRef([]);
  React.useEffect(() => {
    let raf; const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const o = ORBS[i];
        // Drift with slow sine motion on both axes, phase-shifted per orb
        const tx = Math.sin(t * 0.15 + o.phase) * 120 + Math.cos(t * 0.08 + o.phase) * 60;
        const ty = Math.cos(t * 0.12 + o.phase * 1.3) * 100 + Math.sin(t * 0.09 + o.phase) * 50;
        const scale = 1 + Math.sin(t * 0.1 + o.phase) * 0.08;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={stripeLoginStyles.orbsWrap} aria-hidden="true">
      {ORBS.map((o, i) => (
        <div
          key={i}
          ref={el => (refs.current[i] = el)}
          style={{
            position: 'absolute',
            left: `${o.x}%`, top: `${o.y}%`,
            width: o.size, height: o.size,
            marginLeft: -o.size / 2, marginTop: -o.size / 2,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${o.c}, transparent 65%)`,
            filter: 'blur(60px)',
            opacity: 0.6,
            willChange: 'transform',
            transition: 'transform 0.05s linear',
          }}
        />
      ))}
    </div>
  );
}

function Login({ onSignIn }) {
  const [email, setEmail] = React.useState('dan@ergon.com');
  const [pass, setPass] = React.useState('••••••••••');
  return (
    <div style={stripeLoginStyles.page}>
      {/* Floating color orbs */}
      <FloatingOrbs/>
      {/* Soft white wash to lift the card */}
      <div style={stripeLoginStyles.wash}/>
      {/* Noise overlay for premium feel */}
      <div style={stripeLoginStyles.noise}/>

      {/* Top nav bar */}
      <div style={stripeLoginStyles.topbar}>
        <div style={stripeLoginStyles.brand}>
          <div style={stripeLoginStyles.mark}>E</div>
          <span style={stripeLoginStyles.brandName}>Ergon <span style={{ color: '#697386', fontWeight: 400 }}>Market Intelligence</span></span>
        </div>
        <div style={stripeLoginStyles.topright}>
          <a style={stripeLoginStyles.topLink}>Support</a>
          <a style={stripeLoginStyles.topLink}>Contact</a>
          <span style={{ color: '#8B97A8', fontSize: 13 }}>Don't have an account? <a style={stripeLoginStyles.signupLink}>Request access →</a></span>
        </div>
      </div>

      {/* Centered card */}
      <div style={stripeLoginStyles.cardWrap}>
        <div style={stripeLoginStyles.card}>
          <h1 style={stripeLoginStyles.title}>Sign in to Ergon</h1>
          <p style={stripeLoginStyles.sub}>Access the U.S. Propane Market Map</p>

          <button style={stripeLoginStyles.sso}>
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M22 12.2c0-.7-.1-1.3-.2-1.9H12v3.8h5.6c-.2 1.2-1 2.3-2 3v2.5h3.3c1.9-1.8 3.1-4.4 3.1-7.4z" fill="#4285F4"/>
              <path d="M12 22c2.7 0 5-1 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22z" fill="#34A853"/>
              <path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3a10 10 0 0 0 0 9.2z" fill="#FBBC05"/>
              <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button style={stripeLoginStyles.sso}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, width: 14, height: 14, flexShrink: 0 }}>
              <div style={{ background: '#F25022' }}/><div style={{ background: '#7FBA00' }}/>
              <div style={{ background: '#00A4EF' }}/><div style={{ background: '#FFB900' }}/>
            </div>
            Continue with Microsoft
          </button>

          <div style={stripeLoginStyles.divider}>
            <div style={stripeLoginStyles.dividerLine}/>
            <span style={stripeLoginStyles.dividerText}>OR WITH EMAIL</span>
            <div style={stripeLoginStyles.dividerLine}/>
          </div>

          <div style={stripeLoginStyles.field}>
            <label style={stripeLoginStyles.label}>Email</label>
            <input style={stripeLoginStyles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@ergon.com"/>
          </div>

          <div style={stripeLoginStyles.field}>
            <div style={stripeLoginStyles.labelRow}>
              <label style={stripeLoginStyles.label}>Password</label>
              <a style={stripeLoginStyles.forgot}>Forgot?</a>
            </div>
            <input type="password" style={stripeLoginStyles.input} value={pass} onChange={e => setPass(e.target.value)}/>
          </div>

          <label style={stripeLoginStyles.remember}>
            <input type="checkbox" defaultChecked style={{ accentColor: '#635BFF' }}/>
            Keep me signed in
          </label>

          <button style={stripeLoginStyles.btn} onClick={onSignIn}>Continue</button>

          <div style={stripeLoginStyles.footer}>
            Single sign-on (SSO) · <a style={stripeLoginStyles.ssoLink}>Use security key</a>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div style={stripeLoginStyles.pageFooter}>
        <span>© 2026 Ergon, Inc.</span>
        <a style={stripeLoginStyles.footLink}>Privacy</a>
        <a style={stripeLoginStyles.footLink}>Terms</a>
        <span style={{ color: '#C1CCD6' }}>·</span>
        <span>SOC 2 Type II · HIPAA-ready</span>
      </div>
    </div>
  );
}

const stripeLoginStyles = {
  page: {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: '#F6F9FC',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: 'hidden',
    color: '#0A2540',
    WebkitFontSmoothing: 'antialiased',
    letterSpacing: '-0.01em',
  },
  wash: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,255,255,0.45), transparent 70%)',
    pointerEvents: 'none',
  },
  orbsWrap: {
    position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
  },
  ribbon: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
    mixBlendMode: 'normal',
  },
  noise: {
    position: 'absolute', inset: 0,
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.42 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.4'/></svg>\")",
    opacity: 0.35,
    mixBlendMode: 'overlay',
    pointerEvents: 'none',
  },
  topbar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    padding: '24px 48px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 2,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  mark: {
    width: 28, height: 28, borderRadius: 7,
    background: 'linear-gradient(135deg, #635BFF, #4B45B8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '-0.5px',
  },
  brandName: { fontSize: 15, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.2px' },
  topright: { display: 'flex', alignItems: 'center', gap: 24, fontSize: 13, color: '#425466' },
  topLink: { color: '#425466', textDecoration: 'none', cursor: 'pointer' },
  signupLink: { color: '#635BFF', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' },

  cardWrap: {
    position: 'relative', zIndex: 1,
    height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '80px 20px',
  },
  card: {
    width: 420, background: '#fff', borderRadius: 12, padding: 40,
    boxShadow: '0 15px 35px rgba(10,37,64,0.08), 0 5px 15px rgba(10,37,64,0.05)',
    border: '1px solid #E3E8EE',
  },
  title: { margin: 0, fontSize: 26, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.5px' },
  sub: { margin: '6px 0 28px', fontSize: 14, color: '#697386' },

  sso: {
    width: '100%', padding: '10px 14px',
    border: '1px solid #E3E8EE', borderRadius: 6, background: '#fff',
    fontSize: 13, fontWeight: 500, color: '#0A2540', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontFamily: 'inherit', marginBottom: 8,
    boxShadow: '0 1px 2px rgba(10,37,64,0.04)',
  },

  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: '#E3E8EE' },
  dividerText: { fontSize: 11, color: '#8B97A8', letterSpacing: 0.6, fontWeight: 500 },

  field: { marginBottom: 14 },
  labelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#425466', marginBottom: 6 },
  forgot: { fontSize: 12, color: '#635BFF', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' },
  input: {
    width: '100%', padding: '9px 12px',
    border: '1px solid #E3E8EE', borderRadius: 6,
    fontSize: 14, fontFamily: 'inherit', color: '#0A2540',
    boxSizing: 'border-box', outline: 'none', background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  remember: { display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 20px', fontSize: 13, color: '#425466' },

  btn: {
    width: '100%', padding: '10px 14px', border: 'none', borderRadius: 6,
    background: '#635BFF', color: '#fff', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 1px 2px rgba(10,37,64,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
    transition: 'background 0.15s',
  },

  footer: { textAlign: 'center', marginTop: 20, fontSize: 12, color: '#8B97A8' },
  ssoLink: { color: '#635BFF', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' },

  pageFooter: {
    position: 'absolute', bottom: 24, left: 0, right: 0,
    display: 'flex', justifyContent: 'center', gap: 16,
    fontSize: 12, color: '#8B97A8', zIndex: 1,
  },
  footLink: { color: '#8B97A8', textDecoration: 'none', cursor: 'pointer' },
};

window.Login = Login;
