import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  // 🔥 Safe guard (prevents crash if AuthProvider not mounted)
  let login = () => console.warn("Auth not connected");
  try {
    const auth = useAuth();
    login = auth?.login || login;
  } catch (e) {
    console.warn("useAuth not available");
  }
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const CREDENTIALS = {
    admin: {
      email: "admin@aziro.com",
      password: "admin123",
      name: "Admin",
    },
    tenant: {
      email: "tenant@azio.com",
      password: "admin123",
      name: "Mark Obasi",
      tenantId: 3,
    },
    user: {
      email: "user@aziro.com",
      password: "admin123",
      name: "User",
      tenantId: 4,
    },
  };

  const getRoleFromEmail = (email) => {
    const e = email.trim().toLowerCase();
    if (e === "admin@aziro.com") return "admin";
    if (e === "tenant@azio.com") return "tenant";
    if (e === "user@aziro.com") return "user";
    return null;
  };

  const validate = () => {
    if (!email.trim()) {
      setError("Enter email");
      return null;
    }

    if (!password.trim()) {
      setError("Enter password");
      return null;
    }

    const role = getRoleFromEmail(email);
    if (!role) {
      setError("User not found");
      return null;
    }

    const cred = CREDENTIALS[role];
    if (password !== cred.password) {
      setError("Wrong password");
      return null;
    }

    return role;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const role = validate();
    if (!role) {
      setLoading(false);
      return;
    }

    const user = CREDENTIALS[role];

    setTimeout(() => {
      login(role, {
        name: user.name,
        email: user.email,
        tenantId: user.tenantId ?? null,
      });
      setLoading(false);
    }, 500);
  };

  // Neural Canvas Hook
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const PARTICLE_COUNT = 110;
    const CONNECT_DIST = 160;
    const MOUSE_RADIUS = 180;
    const MOUSE_FORCE = 0.035;
    const SPEED = 0.38;
    const FOG_START = 0.25;

    let W = 0, H = 0;
    let animId;
    const mouse = { x: -9999, y: -9999 };
    const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function randomBetween(a, b) {
      return a + Math.random() * (b - a);
    }

    class Particle {
      constructor() {
        this.reset(true);
      }
      reset(init = false) {
        this.x = randomBetween(0, W);
        this.y = randomBetween(0, H);
        this.z = randomBetween(0.15, 1.0);
        this.vx = (Math.random() - 0.5) * SPEED * this.z;
        this.vy = (Math.random() - 0.5) * SPEED * this.z;
        this.baseR = randomBetween(1.5, 4.0) * this.z;
        this.r = this.baseR;
        this.alpha = randomBetween(0.3, 0.9) * this.z;
        this.pulse = randomBetween(0, Math.PI * 2);
        this.pulseSpeed = randomBetween(0.008, 0.022);
        const hues = [210, 220, 230, 260, 280];
        this.hue = hues[Math.floor(Math.random() * hues.length)];
        this.sat = randomBetween(70, 100);
        this.lit = randomBetween(60, 85);
      }
      update() {
        this.pulse += this.pulseSpeed;
        const pf = Math.sin(this.pulse) * 0.4;

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          this.x += (dx / dist) * force * MOUSE_FORCE * 22 * this.z;
          this.y += (dy / dist) * force * MOUSE_FORCE * 22 * this.z;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -50) this.x = W + 50;
        if (this.x > W + 50) this.x = -50;
        if (this.y < -50) this.y = H + 50;
        if (this.y > H + 50) this.y = -50;

        this.r = this.baseR * (1 + pf * 0.35);
      }
      draw(ox, oy) {
        const px = this.x + ox * this.z;
        const py = this.y + oy * this.z;
        const fog = Math.min(1, this.z / FOG_START);
        const a = this.alpha * fog;

        ctx.beginPath();
        ctx.arc(px, py, this.r, 0, Math.PI * 2);

        const grd = ctx.createRadialGradient(px, py, 0, px, py, this.r * 3.5);
        grd.addColorStop(0, `hsla(${this.hue},${this.sat}%,${this.lit}%,${a})`);
        grd.addColorStop(0.4, `hsla(${this.hue},${this.sat}%,${this.lit}%,${a * 0.5})`);
        grd.addColorStop(1, `hsla(${this.hue},${this.sat}%,${this.lit}%,0)`);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, this.r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue},100%,92%,${a * 0.9})`;
        ctx.fill();
      }
    }

    const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

    function drawConnections(ox, oy) {
      if (!W || !H) return;
      
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x + ox * a.z;
        const ay = a.y + oy * a.z;

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const bx = b.x + ox * b.z;
          const by = b.y + oy * b.z;

          const dx = ax - bx,
            dy = ay - by;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > CONNECT_DIST) continue;

          const t = 1 - d / CONNECT_DIST;
          const depthA = Math.min(1, a.z / FOG_START);
          const depthB = Math.min(1, b.z / FOG_START);
          const alpha = t * 0.55 * Math.min(depthA, depthB);

          const midX = (ax + bx) / 2,
            midY = (ay + by) / 2;
          const md = Math.sqrt((midX - mouse.x) ** 2 + (midY - mouse.y) ** 2);
          const boost = md < MOUSE_RADIUS ? 1 + (1 - md / MOUSE_RADIUS) * 1.6 : 1;

          const avg = (a.hue + b.hue) / 2;
          const grd = ctx.createLinearGradient(ax, ay, bx, by);
          grd.addColorStop(0, `hsla(${a.hue},90%,70%,${alpha * boost})`);
          grd.addColorStop(0.5, `hsla(${avg},90%,72%,${alpha * boost * 1.2})`);
          grd.addColorStop(1, `hsla(${b.hue},90%,70%,${alpha * boost})`);

          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = grd;
          ctx.lineWidth = t * 1.4 * Math.min(a.z, b.z);
          ctx.stroke();
        }
      }
    }

    function drawBackground() {
      const bg = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.85);
      bg.addColorStop(0, "#0F1835");
      bg.addColorStop(0.5, "#0A0F1E");
      bg.addColorStop(1, "#060A14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const blobs = [
        { x: W * 0.15, y: H * 0.2, r: 300, h: 220, a: 0.07 },
        { x: W * 0.45, y: H * 0.7, r: 250, h: 260, a: 0.06 },
        { x: W * 0.1, y: H * 0.8, r: 180, h: 200, a: 0.04 },
      ];
      blobs.forEach((b) => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `hsla(${b.h},80%,55%,${b.a})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      const fog = ctx.createLinearGradient(W * 0.55, 0, W, 0);
      fog.addColorStop(0, "transparent");
      fog.addColorStop(1, "rgba(10,15,30,0.35)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);
    }

    function animate() {
      if (!W || !H) return;
      
      animId = requestAnimationFrame(animate);
      parallax.x += (parallax.tx - parallax.x) * 0.06;
      parallax.y += (parallax.ty - parallax.y) * 0.06;

      drawBackground();
      ctx.save();
      drawConnections(parallax.x, parallax.y);
      particles.forEach((p) => {
        p.update();
        p.draw(parallax.x, parallax.y);
      });
      ctx.restore();
    }

    const onResize = () => resize();
    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      parallax.tx = (e.clientX / W - 0.5) * 18;
      parallax.ty = (e.clientY / H - 0.5) * 12;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  const detectedRole = getRoleFromEmail(email);

  // Get tenant info based on detected role
  const getTenantInfo = () => {
    if (!detectedRole) return null;
    const cred = CREDENTIALS[detectedRole];
    if (detectedRole === 'admin') {
      return { name: 'System Administrator', color: '#DC2626', bgColor: '#FEE2E2' };
    }
    if (detectedRole === 'tenant' && cred.tenantId === 3) {
      return { name: 'Vanta Logistics', color: '#2563EB', bgColor: '#DBEAFE' };
    }
    if (detectedRole === 'user' && cred.tenantId === 4) {
      return { name: 'Acme Corp', color: '#059669', bgColor: '#D1FAE5' };
    }
    return null;
  };

  const tenantInfo = getTenantInfo();

  // Styles (converted to Tailwind classes)
  const S = {
    root: "fixed inset-0 w-full h-full overflow-hidden bg-slate-950",
    canvas: "fixed inset-0 w-full h-full z-0",
    page: "relative z-10 flex w-full h-screen",

    left: "flex-1 flex flex-col justify-end pb-18 pl-18 pointer-events-none",
    brandBadge: "inline-flex items-center gap-2 bg-blue-500/18 border border-blue-400/25 border-solid rounded-full px-4 py-1.5 w-fit mb-7",
    brandDot: "w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ADE80]",

    right: "w-120 min-w-105 flex items-center justify-center p-10 pr-12 bg-white/96 shadow-[-40px_0_80px_rgba(0,0,0,0.35)] relative overflow-hidden",
    box: "w-full max-w-96 flex flex-col items-center",

    input: "w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-sm text-slate-900 bg-slate-50 outline-none transition-all duration-200",
    inputFocus: "border-blue-500 bg-white shadow-[0_0_0_3px_rgba(37,99,235,0.12)]",
    btnPrimary: "w-full py-3.25 px-0 border-none rounded-2xl cursor-pointer text-sm font-semibold text-white leading-none bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-[0_4px_20px_rgba(37,99,235,0.35)] mt-1.5 relative overflow-hidden transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
    btnMs: "w-full py-2.5 px-0 border border-slate-300 rounded-2xl bg-white cursor-pointer text-sm font-medium text-slate-700 flex items-center justify-center gap-2.5 transition-all duration-200 hover:border-slate-400 hover:shadow-sm",
  };

  const AzironLogo = () => (
    <svg width="58" height="58" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="lg2" x1="0" y1="80" x2="80" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#C084FC" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d="M40 8 L68 68 H52 L40 42 L28 68 H12 Z" fill="url(#lg1)" />
      <path d="M30 52 H50 L47 45 H33 Z" fill="url(#lg2)" opacity="0.8" />
      <path d="M40 14 L63 64 H53 L40 36 L27 64 H17 Z" fill="url(#lg2)" opacity="0.25" />
    </svg>
  );

  const EyeOpen = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  const MsIcon = () => (
    <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
      <div className="bg-red-500 rounded-[1px]" />
      <div className="bg-green-500 rounded-[1px]" />
      <div className="bg-blue-500 rounded-[1px]" />
      <div className="bg-yellow-500 rounded-[1px]" />
    </div>
  );

  return (
    <div className={S.root}>
      <canvas ref={canvasRef} className={S.canvas} />

      <div className={S.page}>
        {/* LEFT PANEL */}
        <div className={S.left}>
          <div className={S.brandBadge}>
            <div className={`${S.brandDot} animate-pulse`} />
            <span className="text-xs leading-none uppercase text-blue-300 font-semibold tracking-[0.12em]">
              Live neural network
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.06] text-white mb-5 tracking-[-0.02em]">
            Build{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Intelligent
            </span>
            <br />
            Automation
          </h1>

          <p className="text-base font-light text-slate-400 leading-[1.7] max-w-60 mb-9">
            {detectedRole === 'admin' 
              ? "Manage the entire Aziron platform with full administrative access and system controls."
              : detectedRole === 'tenant'
              ? "Access your Vanta Logistics workspace with full tenant capabilities and automation tools."
              : detectedRole === 'user'
              ? "Manage your orders and workflows with personalized automation features."
              : "Design, deploy, and scale AI agents and workflows with enterprise-grade automation infrastructure."
            }
          </p>

          <div className="flex flex-col gap-2.5">
            {getFeatures().map(({ icon, label }) => (
              <div key={label} className="inline-flex items-center gap-2.5 w-fit">
                <div className="w-7 h-7 rounded-lg bg-blue-500/25 border border-blue-400/2 flex items-center justify-center font-normal">
                  {icon}
                </div>
                <span className="text-sm font-normal text-slate-400 leading-none tracking-[0.01em]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={S.right}>
          <div className="absolute -top-25 -right-25 w-75 h-75 bg-gradient-radial from-blue-500/6 to-transparent rounded-full pointer-events-none" />

          <div className={S.box}>
            <div className="mb-7">
              <AzironLogo />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 leading-none tracking-[-0.02em] mb-1.5 text-center">
              Login to your account
            </h2>
            <p className="text-sm text-slate-600 font-normal text-center mb-8 leading-5">
              Enter your email below to login to your account
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* Email */}
              <div className="w-full">
                <label className="block text-xs font-medium text-slate-700 mb-1.75 leading-none tracking-[0.01em]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="user@aziro.com"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className={`${S.input} ${emailFocused ? S.inputFocus : ""}`}
                />
              </div>

              {/* Tenant Detection Badge */}
              {tenantInfo && (
                <div className="w-full p-3.5 bg-slate-50 border border-slate-200 border-solid rounded-2xl flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-[0.05em] leading-none" style={{ color: tenantInfo.color }}>
                      {detectedRole === 'admin' ? 'Administrator' : 'Tenant Workspace'}
                    </div>
                    <div className="text-sm font-medium leading-4" style={{ color: tenantInfo.color }}>
                      {tenantInfo.name}
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="w-full">
                <div className="flex justify-between items-center mb-1.75">
                  <label className="text-xs font-medium text-slate-700 leading-none tracking-[0.01em]">Password</label>
                  <button
                    type="button"
                    className="text-xs text-blue-500 font-medium bg-none border-none cursor-pointer hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    className={`${S.input} pr-10 ${passFocused ? S.inputFocus : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-500 p-1 hover:text-slate-700 transition-colors duration-200"
                  >
                    {showPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="w-full p-3.5 bg-red-50 border border-red-200 border-solid rounded-2xl flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-xs text-red-700 font-normal">{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className={`${S.btnPrimary} ${loading ? "opacity-80 cursor-not-allowed" : ""}`}>
                {loading ? "Signing in…" : "Login to Account"}
              </button>
            </form>

            {/* Demo hint - show available test accounts */}
            <div className="w-full mt-3.5 p-3 bg-blue-50 border border-blue-200 border-solid rounded-2xl">
              <div className="text-xs text-blue-800 font-semibold mb-1.5">Demo Accounts:</div>
              <div className="text-xs text-blue-700 leading-5">
                <div>• <strong>admin@aziro.com</strong> - Administrator</div>
                <div>• <strong>tenant@azio.com</strong> - Vanta Logistics (Tenant)</div>
                <div>• <strong>user@aziro.com</strong> - Acme Corp (User)</div>
                <div className="mt-1 opacity-80">Password: <strong>admin123</strong></div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-slate-300" />
              <span className="text-xs text-slate-500 whitespace-nowrap">Or continue with</span>
              <div className="flex-1 h-px bg-slate-300" />
            </div>

            {/* Microsoft */}
            <button onClick={() => {}} disabled={loading} className={S.btnMs}>
              <MsIcon />
              Login with Microsoft
            </button>

            {/* Signup row */}
            <div className="mt-6 text-sm text-slate-600 text-center">
              Don't have an account?{" "}
              <a href="#" className="text-blue-500 font-medium hover:underline decoration-none">
                Sign up free
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for features (moved outside component for clarity)
function getFeatures() {
  return [
    { icon: "🔗", label: "Connect AI agents and APIs" },
    { icon: "⚡", label: "Build intelligent workflows" },
    { icon: "🏢", label: "Enterprise-grade automation" },
  ];
}
