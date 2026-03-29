/**
 * VoiceOrb — Fluid glass-sphere orb matching the reference image.
 *
 * Visual technique:
 *   A large conic-gradient (purple→blue→pink→white) is placed inside
 *   a circular clip, then heavily blurred so the colors bleed softly
 *   into each other — exactly like the reference soft-glass sphere.
 *   The gradient continuously rotates, creating a living fluid motion.
 *
 * States:  idle | connecting | listening | speaking | error
 * Props:   state, size (px)
 */
import React, { useEffect, useState } from "react";

/* ─── Keyframes ────────────────────────────────────────────────── */
const KF = `
  /* shared spin */
  @keyframes vO-spin     { from{transform:rotate(0deg)}  to{transform:rotate(360deg)}  }
  @keyframes vO-spin-rev { from{transform:rotate(0deg)}  to{transform:rotate(-360deg)} }
  @keyframes vO-breathe  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.045)} }

  /* idle breathe */
  @keyframes vO-idle { 0%,100%{transform:scale(1);opacity:.88} 50%{transform:scale(1.05);opacity:1} }

  /* listening punch */
  @keyframes vO-listen { 0%,100%{transform:scale(1)} 40%{transform:scale(1.10)} 70%{transform:scale(.97)} }

  /* speaking bounce */
  @keyframes vO-speak { 0%,100%{transform:scale(1)} 25%{transform:scale(1.08)} 50%{transform:scale(.97)} 75%{transform:scale(1.04)} }

  /* error shake */
  @keyframes vO-err { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-4px) rotate(-1deg)} 30%{transform:translateX(4px) rotate(1deg)} 50%{transform:translateX(-3px)} 70%{transform:translateX(3px)} 90%{transform:translateX(-1px)} }

  /* glow halos */
  @keyframes vO-halo-idle    { 0%,100%{opacity:.45} 50%{opacity:.8}  }
  @keyframes vO-halo-listen  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
  @keyframes vO-halo-speak   { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }

  /* expand rings */
  @keyframes vO-ring {
    0%   { transform: scale(.86); opacity: 0; }
    18%  { opacity: .38; }
    55%  { opacity: .22; }
    100% { transform: scale(2.35); opacity: 0; }
  }

  /* error tint blink */
  @keyframes vO-err-tint { 0%,100%{opacity:0} 50%{opacity:.5} }

  /* error icon glitch */
  @keyframes vO-glitch { 0%,88%,100%{clip-path:none} 90%{clip-path:inset(18% 0 8% 0)} 92%{clip-path:inset(4% 0 24% 0)} 94%{clip-path:inset(24% 0 4% 0)} 96%{clip-path:inset(8% 0 18% 0)} }

  /* voice bars */
  @keyframes vB-1 { 0%,100%{height:22%} 50%{height:88%} }
  @keyframes vB-2 { 0%,100%{height:55%} 50%{height:28%} }
  @keyframes vB-3 { 0%,100%{height:38%} 50%{height:95%} }
  @keyframes vB-4 { 0%,100%{height:80%} 50%{height:20%} }
  @keyframes vB-5 { 0%,100%{height:30%} 50%{height:72%} }
  @keyframes vB-6 { 0%,100%{height:65%} 50%{height:35%} }
  @keyframes vB-7 { 0%,100%{height:48%} 50%{height:82%} }
  @keyframes vB-8 { 0%,100%{height:20%} 50%{height:58%} }
  @keyframes vB-9 { 0%,100%{height:72%} 50%{height:25%} }
`;

/* ─── State config ─────────────────────────────────────────────── */
const CFG = {
  idle:       { spin: "9s",   core: "vO-idle   3.5s ease-in-out infinite", halo: "vO-halo-idle   3.5s ease-in-out infinite" },
  connecting: { spin: "4s",   core: "vO-idle   1.6s ease-in-out infinite", halo: "vO-halo-idle   2s   ease-in-out infinite" },
  listening:  { spin: "2.5s", core: "vO-listen  .9s ease-in-out infinite", halo: "vO-halo-listen  1s  ease-in-out infinite" },
  speaking:   { spin: "1.6s", core: "vO-speak   .7s ease-in-out infinite", halo: "vO-halo-speak  .75s ease-in-out infinite" },
  error:      { spin: "1.1s", core: "vO-err     .45s ease-in-out infinite",halo: "" },
};

/* ─── Theme palettes ──────────────────────────────────────────── */
const ORB_THEME = {
  light: {
    conicNormal: `conic-gradient(
      from 200deg,
      #ff4fb3,
      #8b5cf6,
      #4f46e5,
      #0ea5e9,
      #7c3aed,
      #fb7185,
      #ff4fb3
    )`,
    conicError: `conic-gradient(
      from 200deg,
      #fb7185,
      #a855f7,
      #38bdf8,
      #fb7185,
      #f87171,
      #fb7185
    )`,
    baseFill: "#f4ecff",
    haloBg: "radial-gradient(circle, rgba(167,139,250,.52) 0%, rgba(59,130,246,.26) 45%, transparent 72%)",
    haloShadow: "0 0 32px rgba(124,58,237,.28), 0 0 68px rgba(59,130,246,.16)",
    orbShadow: (size, isError) => isError
      ? `0 0 ${size * .42}px rgba(248,113,113,.34), 0 0 ${size * .9}px rgba(239,68,68,.12)`
      : `0 0 ${size * .42}px rgba(124,58,237,.28), 0 0 ${size * .9}px rgba(59,130,246,.15)`,
  },
  dark: {
    conicNormal: `conic-gradient(
      from 200deg,
      #ff8ad8,
      #a855f7,
      #4f46e5,
      #38bdf8,
      #7c3aed,
      #fb7185,
      #ff8ad8
    )`,
    conicError: `conic-gradient(
      from 200deg,
      #fb7185,
      #a855f7,
      #38bdf8,
      #fb7185,
      #f87171,
      #fb7185
    )`,
    baseFill: "#ede9fe",
    haloBg: "radial-gradient(circle, rgba(196,181,253,.5) 0%, rgba(147,197,253,.25) 45%, transparent 70%)",
    haloShadow: "0 0 40px rgba(108,92,231,0.25), 0 0 80px rgba(108,92,231,0.15)",
    orbShadow: (size, isError) => isError
      ? `0 0 ${size * .5}px rgba(248,113,113,.4), 0 0 ${size}px rgba(196,181,253,.15)`
      : `0 0 ${size * .5}px rgba(196,181,253,.35), 0 0 ${size}px rgba(147,197,253,.15)`,
  },
};

/* ─── Voice bars for Speaking mode ────────────────────────────── */
const BAR_ANIMS = ["vB-1","vB-2","vB-3","vB-4","vB-5","vB-6","vB-7","vB-8","vB-9"];
const BAR_DELAYS = [0, .15, .3, .08, .22, .38, .12, .28, .04];

function VoiceBars({ size }) {
  const barH = size * 1.1;
  const barW = Math.max(3, size * 0.045);
  const gap  = Math.max(4, size * 0.055);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap,
      height: barH,
    }}>
      {BAR_ANIMS.map((anim, i) => (
        <div key={i} style={{
          width: barW,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: "100%",
            borderRadius: barW,
            background: "linear-gradient(to top, #c4b5fd, #93c5fd, #f9a8d4)",
            boxShadow: "0 0 6px rgba(196,181,253,.5)",
            animation: `${anim} ${0.75 + (i % 3) * 0.18}s ease-in-out infinite`,
            animationDelay: `${BAR_DELAYS[i]}s`,
          }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Main VoiceOrb ────────────────────────────────────────────── */
export default function VoiceOrb({ state = "idle", size = 40 }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const cfg = CFG[state] || CFG.idle;
  const blur = size * 0.24;       // proportional blur for fluid blend
  const inner = size * 1.6;       // rotating div is larger than orb for seamless spin
  const offset = -(inner - size) / 2;

  const isListening  = state === "listening";
  const isSpeaking   = state === "speaking";
  const isConnecting = state === "connecting";
  const isError      = state === "error";
  const theme = isDark ? ORB_THEME.dark : ORB_THEME.light;

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.25, flexShrink: 0 }}>
      <style>{KF}</style>

      {/* ── Orb container ── */}
      <div style={{ position: "relative", width: size, height: size, animation: !isListening && !isSpeaking ? "vO-breathe 3.4s ease-in-out infinite" : undefined }}>

        {/* Outer halo glow */}
        <div style={{
          position: "absolute",
          inset: -(size * 0.3),
          borderRadius: "50%",
          background: isError
            ? "radial-gradient(circle, rgba(248,113,113,.45) 0%, transparent 65%)"
            : theme.haloBg,
          filter: `blur(${size * 0.18}px)`,
          animation: cfg.halo || undefined,
          boxShadow: isError
            ? "0 0 40px rgba(248,113,113,.25), 0 0 80px rgba(248,113,113,.12)"
            : theme.haloShadow,
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* LISTENING: 3 concentric expand rings */}
        {isListening && [0,1,2].map(i => (
          <div key={i} style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `1.25px solid rgba(196,181,253,.42)`,
            filter: `blur(${size * 0.01}px)`,
            animation: `vO-ring ${1.7 + i * 0.42}s cubic-bezier(.22,.61,.36,1) infinite`,
            animationDelay: `${i * 0.28}s`,
            opacity: 0, pointerEvents: "none", zIndex: 0,
          }} />
        ))}

        {/* SPEAKING: 3 wave rings */}
        {isSpeaking && [0,1,2].map(i => (
          <div key={i} style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `1.25px solid rgba(216,180,254,.34)`,
            filter: `blur(${size * 0.012}px)`,
            animation: `vO-ring ${1.45 + i * 0.36}s cubic-bezier(.22,.61,.36,1) infinite`,
            animationDelay: `${i * 0.24}s`,
            opacity: 0, pointerEvents: "none", zIndex: 0,
          }} />
        ))}

        {/* CONNECTING: spinner arcs */}
        {isConnecting && <>
          <div style={{
            position: "absolute", inset: -Math.max(4, size * 0.1), borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#c4b5fd",
            borderBottomColor: "rgba(196,181,253,.2)",
            animation: "vO-spin 1.5s linear infinite",
            pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "absolute", inset: -Math.max(8, size * 0.2), borderRadius: "50%",
            border: "1.5px solid transparent",
            borderRightColor: "rgba(147,197,253,.8)",
            borderLeftColor: "rgba(147,197,253,.15)",
            animation: "vO-spin-rev 2.2s linear infinite",
            pointerEvents: "none", zIndex: 0,
          }} />
        </>}

        {/* ── Main orb ── */}
        <div
          style={{
            position: "relative", width: size, height: size,
            borderRadius: "50%",
            overflow: "hidden",
            zIndex: 1,
            animation: cfg.core,
            boxShadow: theme.orbShadow(size, isError),
          }}
        >
          {/* Base fill — prevents transparent gaps */}
          <div style={{ position: "absolute", inset: 0, background: theme.baseFill }} />

          {/* Rotating conic gradient — THE fluid swirl */}
          <div style={{
            position: "absolute",
            width: inner, height: inner,
            top: offset, left: offset,
            background: isError ? theme.conicError : theme.conicNormal,
            filter: `blur(${blur}px)`,
            animation: `vO-spin ${cfg.spin} linear infinite`,
          }} />

          {/* Top-left glass highlight */}
          <div style={{
            position: "absolute",
            top: "6%", left: "12%",
            width: "48%", height: "44%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,.78) 0%, rgba(255,255,255,0) 100%)",
            filter: `blur(${blur * 0.35}px)`,
            pointerEvents: "none",
          }} />

          {/* Bottom-right rim shimmer */}
          <div style={{
            position: "absolute",
            bottom: "7%", right: "8%",
            width: "28%", height: "22%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,.22) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />

          {/* ERROR: red tint pulse */}
          {isError && (
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle at 50% 55%, rgba(239,68,68,.35), transparent 65%)",
              animation: "vO-err-tint 1.1s ease-in-out infinite",
            }} />
          )}

          {/* Mic / X icon */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: isError ? "vO-glitch 2.2s ease-in-out infinite" : undefined,
          }}>
            <svg
              width={size * 0.38} height={size * 0.38}
              viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.92)" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,.75))" }}
            >
              {isError ? (
                <>
                  <line x1="18" y1="6"  x2="6"  y2="18" />
                  <line x1="6"  y1="6"  x2="18" y2="18" />
                </>
              ) : (
                <>
                  <path d="M12 19v3" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                </>
              )}
            </svg>
          </div>
        </div>
      </div>

    </div>
  );
}
