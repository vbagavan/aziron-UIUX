import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff } from "lucide-react";

// ─── State machine ────────────────────────────────────────────────────────────
const VS = {
  IDLE:       "idle",
  LISTENING:  "listening",
  PROCESSING: "processing",
};

// ─── Demo transcript ──────────────────────────────────────────────────────────
const DEMO_TRANSCRIPT =
  "Create a customer support agent with email automation and WhatsApp fallback";

// ─── Minimal VoiceOrb ─────────────────────────────────────────────────────────
function MinimalVoiceOrb({ state, muted }) {
  const isListening = state === VS.LISTENING;
  const isProcessing = state === VS.PROCESSING;

  const orbColor = isListening ? "#7c3aed" : isProcessing ? "#f59e0b" : "#2563eb";
  const orbGlow = isListening
    ? "0 0 24px #7c3aed60, 0 0 48px #7c3aed30"
    : isProcessing
    ? "0 0 20px #f59e0b50"
    : "none";

  return (
    <div className="flex items-center gap-3">
      {/* Minimal Orb */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-300"
        style={{
          width: 44,
          height: 44,
          background: `radial-gradient(circle at 35% 35%, ${orbColor}30, ${orbColor}10)`,
          border: `2px solid ${orbColor}40`,
          boxShadow: orbGlow,
          animation: isListening ? "vMinimalPulse 1.5s ease-in-out infinite" : "none",
        }}
      >
        {muted ? (
          <MicOff size={18} color="white" strokeWidth={2} />
        ) : (
          <Mic size={18} color="white" strokeWidth={2} />
        )}
      </div>

      {/* Status text */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-white">
          {isListening && "Listening…"}
          {isProcessing && "Processing…"}
        </p>
        <p className="text-xs text-white/50">Voice input active</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VoiceConversation({ onClose, onSendMessage }) {
  const [state,      setState]      = useState(VS.IDLE);
  const [transcript, setTranscript] = useState("");
  const [frozen,     setFrozen]     = useState(false);
  const [confidence, setConfidence] = useState(75);
  const [muted,      setMuted]      = useState(false);

  const timers = useRef([]);
  const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id); };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    t(() => runSimulation(), 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSimulation = (customTranscript) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const src = customTranscript || DEMO_TRANSCRIPT;
    setState(VS.LISTENING);
    setTranscript("");
    setFrozen(false);
    setConfidence(72);

    let i = 0;
    const stream = () => {
      if (i < src.length) {
        i++;
        setTranscript(src.slice(0, i));
        setConfidence(72 + Math.min(i, 19));
        t(stream, 42);
      } else {
        setConfidence(91);
        t(() => {
          setFrozen(true);
          setState(VS.PROCESSING);
          t(() => {
            onSendMessage?.(src);
            onClose?.();
          }, 1200);
        }, 300);
      }
    };
    t(stream, 500);
  };

  // ── Minimal floating panel ─────────────────────────────────────────────────
  return createPortal(
    <>
      <style>{MINIMAL_KEYFRAMES}</style>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center p-6 pointer-events-none">
        <div className="pointer-events-auto mb-4 animate-[vFadeUp_0.3s_ease-out]">
          <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl px-6 py-4 shadow-2xl"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            <MinimalVoiceOrb state={state} muted={muted} />

            {/* Live transcript */}
            {transcript && (
              <div className="mt-4 text-sm text-white/85 max-w-sm">
                <p className="font-medium">&ldquo;{transcript}{state === VS.LISTENING ? <span className="inline-block w-0.5 h-4 bg-white/70 ml-1 align-middle" style={{ animation: "vCursor 1s step-end infinite" }} /> : ''}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

const MINIMAL_KEYFRAMES = `
  @keyframes vMinimalPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes vCursor       { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes vFadeUp       { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`;
