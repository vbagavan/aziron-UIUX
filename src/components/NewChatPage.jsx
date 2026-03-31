import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Square,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import RichMessage from "@/components/RichMessage";
import VoiceOrb from "@/components/VoiceOrb";
import AIMessage from "@/components/chat/AIMessage";
import ChatInput from "@/components/chat/ChatInput";
import MessageActions from "@/components/chat/MessageActions";
import UserMessage from "@/components/chat/UserMessage";
import UserMessageActions from "@/components/chat/UserMessageActions";

const imgAzironLogo =
  "/logo-mark.svg";

// ─── Voice States (matches VoiceOrb state strings) ────────────────────────
const VS = {
  IDLE:       "idle",
  CONNECTING: "connecting",
  LISTENING:  "listening",
  SENDING:    "sending",
  SPEAKING:   "speaking",
  ERROR:      "error",
};

const VOICE_TURNS = [
  {
    transcript: "Create a customer support agent with email automation and WhatsApp fallback",
    assistant: "Absolutely. I can set that up as a continuous support workflow with email handling, WhatsApp fallback, and escalation rules for urgent customer issues.",
  },
  {
    transcript: "Now add a triage step so billing requests go to finance and bugs go to product support",
    assistant: "Done. I would route billing to finance, technical bugs to product support, and keep a shared inbox summary so the team still has one source of truth.",
  },
  {
    transcript: "Give it a warmer brand voice and make sure every response offers a next step",
    assistant: "I would tune the tone to feel warmer, more reassuring, and action-oriented. Each response can end with a concrete next step, such as confirming ownership or proposing a follow-up.",
  },
];

/* ── Typing indicator ──────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} className="size-1.5 rounded-full bg-[#94a3b8] dark:bg-[#64748b]"
          style={{ animation: `ncBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes ncBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

/* ── Pre-populated showcase conversation ──────────────────────── */
const DEMO_MESSAGES = [
  /* ── 1. Thinking + Generating ── */
  {
    id: 1, role: "user",
    content: "Walk me through the different response types you support.",
  },
  {
    id: 2, role: "assistant",
    blocks: [
      { type: "thinking", duration: "2.4s" },
      { type: "generating" },
      { type: "text", content: "Here's a showcase of every response format I can produce — from streaming states to generated documents." },
    ],
  },

  /* ── 2. Headings ── */
  {
    id: 3, role: "user",
    content: "Show me heading hierarchy.",
  },
  {
    id: 4, role: "assistant",
    blocks: [
      { type: "heading", level: 1, content: "H1 — Page Title" },
      { type: "heading", level: 2, content: "H2 — Section Header" },
      { type: "heading", level: 3, content: "H3 — Subsection" },
      { type: "heading", level: 4, content: "H4 — Group Label" },
      { type: "heading", level: 5, content: "H5 — Detail" },
      { type: "heading", level: 6, content: "H6 — Caption / Micro-label" },
      { type: "text", content: "Each heading level carries its own weight, size, and spacing to create a clear visual hierarchy." },
    ],
  },

  /* ── 3. Blockquote ── */
  {
    id: 5, role: "user",
    content: "Give me a blockquote example.",
  },
  {
    id: 6, role: "assistant",
    blocks: [
      { type: "text", content: "Here's an excerpt from a geographic study:" },
      {
        type: "blockquote",
        content: "Chennai's coastal geography, shaped by the Bay of Bengal, creates a unique microclimate that significantly influences monsoon patterns across the broader Tamil Nadu region.",
      },
      { type: "text", content: "Block quotes are great for citing sources, highlighting key insights, or drawing attention to important passages." },
    ],
  },

  /* ── 4. Code Block ── */
  {
    id: 7, role: "user",
    content: "Show me a JSON code block.",
  },
  {
    id: 8, role: "assistant",
    blocks: [
      { type: "text", content: "Here's a sample API request payload:" },
      {
        type: "code",
        language: "json",
        content: `{
  "model": "claude-sonnet-4-6",
  "messages": [
    {
      "role": "user",
      "content": "Summarise the quarterly report."
    }
  ],
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": true
}`,
      },
      { type: "text", content: "Click the Copy button in the top-right corner of the block to copy the code to your clipboard." },
    ],
  },

  /* ── 5. Table ── */
  {
    id: 9, role: "user",
    content: "Compare the three pricing tiers.",
  },
  {
    id: 10, role: "assistant",
    blocks: [
      { type: "text", content: "Here's a side-by-side comparison:" },
      {
        type: "table",
        headers: ["Plan", "Speed", "Accuracy", "Cost / 1K tokens"],
        rows: [
          ["Starter",    "Fast",   "Good",    "$0.003"],
          ["Pro",        "Medium", "Better",  "$0.015"],
          ["Enterprise", "Varies", "Best",    "$0.075"],
        ],
      },
      { type: "text", content: "Use the Export button to download this table as a CSV." },
    ],
  },

  /* ── 6. Steps ── */
  {
    id: 11, role: "user",
    content: "Show me a step-by-step reasoning breakdown.",
  },
  {
    id: 12, role: "assistant",
    blocks: [
      { type: "heading", level: 3, content: "Analysis Workflow" },
      {
        type: "steps",
        items: [
          {
            num: 1, title: "Problem Definition",
            description: "Clearly articulate the problem statement and success criteria.",
            timestamp: "0.3s", status: "done",
          },
          {
            num: 2, title: "Data Gathering",
            description: "Collect all relevant context, constraints, and existing knowledge.",
            timestamp: "1.1s", status: "done",
          },
          {
            num: 3, title: "Analysis",
            description: "Examine the data, identify patterns, and surface key insights.",
            timestamp: "2.4s", status: "active",
          },
          {
            num: 4, title: "Synthesis",
            description: "Combine findings into a coherent, actionable recommendation.",
            status: "pending",
          },
          {
            num: 5, title: "Validation",
            description: "Verify the solution against the original requirements.",
            status: "pending",
          },
        ],
      },
    ],
  },

  /* ── 7. Terminal Logs ── */
  {
    id: 13, role: "user",
    content: "What happened during the last deployment?",
  },
  {
    id: 14, role: "assistant",
    blocks: [
      { type: "text", content: "The deployment completed with one warning. Expand the logs below for details:" },
      {
        type: "terminal",
        logs: [
          { timestamp: "09:41:02", level: "INFO",  message: "Starting deployment pipeline v2.4.1…" },
          { timestamp: "09:41:04", level: "INFO",  message: "Building Docker image — layer cache hit (3 layers reused)" },
          { timestamp: "09:41:07", level: "DEBUG", message: "Injecting environment variables from vault" },
          { timestamp: "09:41:09", level: "WARN",  message: "TIMEOUT not set — defaulting to 30s" },
          { timestamp: "09:41:12", level: "INFO",  message: "Pushing image to registry: sha256:4f2acd…" },
          { timestamp: "09:41:17", level: "INFO",  message: "Rolling update: 3/3 pods healthy" },
          { timestamp: "09:41:18", level: "READY", message: "Service live at https://api.example.com ✓" },
        ],
      },
    ],
  },

  /* ── 8. Alerts ── */
  {
    id: 15, role: "user",
    content: "Show me error and success alerts.",
  },
  {
    id: 16, role: "assistant",
    blocks: [
      {
        type: "alert",
        variant: "error",
        title: "Unable to process your payment",
        description: "Your card was declined. Please check your billing details or try a different payment method.",
      },
      {
        type: "alert",
        variant: "success",
        title: "Success! Your changes have been saved.",
        description: "The updated configuration is now live. Changes will take effect within 60 seconds.",
      },
    ],
  },

  /* ── 9. Generated Files ── */
  {
    id: 17, role: "user",
    content: "Generate the project documents.",
  },
  {
    id: 18, role: "assistant",
    blocks: [
      { type: "text", content: "I've prepared the following documents based on your brief:" },
      {
        type: "files",
        items: [
          { name: "Project-Brief.pdf",         size: "1.2 MB" },
          { name: "Proposal-Draft.docx",        size: "340 KB" },
          { name: "Budget-Breakdown.xlsx",      size: "88 KB"  },
          { name: "Pitch-Deck.pptx",            size: "4.7 MB" },
          { name: "Architecture-Diagram.png",   size: "512 KB" },
        ],
      },
      { type: "text", content: "Click the download icon next to any file to save it locally." },
    ],
  },
];

/* ── Organic voice waveform ────────────────────────────────────── */
const WAVE_KF = `
  @keyframes drift {
    from { transform: translateX(0); }
    to { transform: translateX(-120px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.3); }
  }
`;

const VOICE_COLOR = {
  connecting: '#c4b5fd',
  listening:  '#a78bfa',
  sending:    '#93c5fd',
  speaking:   '#c4b5fd',
  error:      '#f87171',
};

function VoiceInputCenter({ state }) {
  const color  = VOICE_COLOR[state] || '#c4b5fd';
  const active = state === 'listening' || state === 'speaking' || state === 'sending';
  const baseOpacity = active ? 0.88 : 0.45;

  const gradientId = `voice-wave-gradient-${state}`;
  const filterId = `${gradientId}-blur`;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 40,
      overflow: 'hidden',
      opacity: baseOpacity,
    }}>
      <style>{WAVE_KF}</style>
      <svg
        width="200%"
        height="40"
        viewBox="0 0 240 80"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.2" />
            <stop offset="25%" stopColor="#93c5fd" stopOpacity="0.5" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="75%" stopColor="#5eead4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d9f99d" stopOpacity="0.2" />
          </linearGradient>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        <path
          className="wave1"
          d="M0 40 C 14 28, 28 52, 42 40 C 56 24, 72 58, 88 40 C 100 10, 112 74, 120 40 C 128 6, 142 78, 154 40 C 168 18, 184 60, 198 40 C 212 26, 226 50, 240 40"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          filter={`url(#${filterId})`}
          style={{
            transformOrigin: "center",
            animation: active ? "drift 5.6s linear infinite, pulse 1.8s ease-in-out infinite" : "none",
          }}
        />
        <path
          className="wave2"
          d="M0 40 C 14 46, 28 34, 42 40 C 56 52, 72 28, 88 40 C 102 22, 112 56, 120 40 C 128 18, 140 60, 154 40 C 168 26, 184 54, 198 40 C 212 32, 226 48, 240 40"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          opacity="0.6"
          style={{
            transformOrigin: "center",
            animation: active ? "drift 3.8s linear infinite reverse, pulse 2.3s ease-in-out infinite" : "none",
          }}
        />
        <path
          className="wave3"
          d="M0 40 C 16 36, 28 44, 42 40 C 58 32, 72 48, 88 40 C 102 26, 112 54, 120 40 C 128 24, 140 56, 154 40 C 168 30, 184 50, 198 40 C 214 34, 226 46, 240 40"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          opacity="0.3"
          style={{
            transformOrigin: "center",
            animation: active ? "drift 6.8s linear infinite, pulse 2.8s ease-in-out infinite" : "none",
          }}
        />
      </svg>
    </div>
  );
}

/* ── Rotating new-message replies ─────────────────────────────── */
const NEXT_REPLIES = [
  [
    { type: "thinking", duration: "1.8s" },
    { type: "text", content: "I can help with that. I would start by clarifying the goal, outline a lean plan, and then execute in small reviewable steps." },
  ],
  [
    { type: "text", content: "Great question. Here's a code snippet to get you started:" },
    { type: "code", language: "typescript", content: `async function fetchData(url: string) {\n  const res = await fetch(url);\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n}` },
  ],
  [
    { type: "alert", variant: "success", title: "Done!", description: "Your request has been processed successfully." },
    { type: "text", content: "Is there anything else you'd like me to help with?" },
  ],
  [
    { type: "text", content: "Here's the data you asked for:" },
    { type: "table", headers: ["Name", "Value", "Status"], rows: [["Alpha", "142", "Active"], ["Beta", "89", "Idle"], ["Gamma", "210", "Active"]] },
  ],
];
let replyIdx = 0;
function getNextReply() {
  return NEXT_REPLIES[replyIdx++ % NEXT_REPLIES.length];
}

let voiceTurnIdx = 0;
function getNextVoiceTurn() {
  return VOICE_TURNS[voiceTurnIdx++ % VOICE_TURNS.length];
}

const SUGGESTIONS = [
  "Summarise my recent tasks",
  "Help me draft a message",
  "Analyse this data",
  "Create a workflow",
];

const VOICE_AUTO_SEND_DELAY_MS = 4000;

export default function NewChatPage({ onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage]   = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Voice input state
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceState, setVoiceState]   = useState(VS.IDLE);
  const [assistantPreview, setAssistantPreview] = useState("");
  const [lastVoiceTurn, setLastVoiceTurn] = useState(null);

  const textareaRef             = useRef(null);
  const bottomRef               = useRef(null);
  const voiceTimersRef          = useRef([]);
  const voiceActiveRef          = useRef(false);
  const activeVoiceTurnRef      = useRef(VOICE_TURNS[0]);
  const nextMessageIdRef        = useRef(1000);
  const hasMessages             = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  // Cleanup voice timers on unmount
  useEffect(() => {
    return () => {
      voiceTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearVoiceTimers = () => {
    voiceTimersRef.current.forEach(clearTimeout);
    voiceTimersRef.current = [];
  };

  const scheduleVoiceTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    voiceTimersRef.current.push(id);
    return id;
  };

  const nextMessageId = () => {
    const id = nextMessageIdRef.current;
    nextMessageIdRef.current += 1;
    return id;
  };

  const beginListeningCycle = (turn = getNextVoiceTurn()) => {
    clearVoiceTimers();
    activeVoiceTurnRef.current = turn;
    setVoiceState(VS.CONNECTING);
    setAssistantPreview("");

    scheduleVoiceTimer(() => {
      setVoiceState(VS.LISTENING);

      const source = turn.transcript;
      let index = 0;
      const streamTranscript = () => {
        if (index < source.length) {
          index += 1;
          scheduleVoiceTimer(streamTranscript, 34);
        } else {
          scheduleVoiceTimer(() => {
            if (voiceActiveRef.current) autoSendVoiceTurn(turn, source);
          }, VOICE_AUTO_SEND_DELAY_MS);
        }
      };
      scheduleVoiceTimer(streamTranscript, 240);
    }, 700);
  };

  const startVoiceInput = () => {
    voiceActiveRef.current = true;
    setVoiceActive(true);
    beginListeningCycle();
  };

  const closeVoiceMode = () => {
    clearVoiceTimers();
    voiceActiveRef.current = false;
    setVoiceActive(false);
    setVoiceState(VS.IDLE);
    setAssistantPreview("");
    setTimeout(() => textareaRef.current?.focus(), 180);
  };

  const autoSendVoiceTurn = (turn, transcript) => {
    if (!transcript) return;

    const userMsg = { id: nextMessageId(), role: "user", content: transcript };
    setMessages((prev) => [...prev, userMsg]);
    clearVoiceTimers();
    voiceActiveRef.current = false;
    setVoiceActive(false);
    setVoiceState(VS.IDLE);
    setAssistantPreview("");
    setIsTyping(true);
    setTimeout(() => textareaRef.current?.focus(), 180);

    const reply = turn.assistant;
    setTimeout(() => {
      setIsTyping(false);
      setLastVoiceTurn({ transcript, assistant: reply });
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: "assistant", blocks: [{ type: "text", content: reply }] },
      ]);
    }, 900);
  };

  const stopVoiceInput = () => {
    closeVoiceMode();
  };

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    const userMsg = { id: nextMessageId(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsTyping(true);

    const isTimeline = text.toLowerCase() === "timeline";
    const isTools    = text.toLowerCase() === "tools";
    const isTable    = text.toLowerCase() === "table";
    const delay = (isTimeline || isTools || isTable) ? 900 : 1200 + Math.random() * 800;
    setTimeout(() => {
      setIsTyping(false);
      const reply = isTimeline
        ? [{ type: "timeline",       duration: "3.1s" }]
        : isTools
        ? [{ type: "tool_execution" }]
        : isTable
        ? [
            { type: "text", content: "Here's the data you asked for:" },
            {
              type: "table",
              headers: ["Name", "Value", "Status"],
              rows: [
                ["Alpha", "142", "Active"],
                ["Beta", "89", "Idle"],
                ["Gamma", "210", "Active"],
              ],
            },
          ]
        : getNextReply();
      setMessages(prev => [...prev, { id: nextMessageId(), role: "assistant", blocks: reply }]);
    }, delay);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  const handleSuggestionSelect = (suggestion) => {
    setMessage(suggestion);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
        el.focus();
      }
    });
  };

  const copyMessage = (id, blocks) => {
    const text = (blocks || []).map(b => b.content || "").join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyUserPrompt = (id, text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const editUserPrompt = (text) => {
    setMessage(text);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
        el.focus();
      }
    });
  };

  const regenerateReply = () => {
    if (isTyping) return;
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: "assistant", blocks: getNextReply() },
      ]);
    }, 900);
  };

  const startNew = () => { setMessages([]); setIsTyping(false); setMessage(""); };
  const assistantPanelText = assistantPreview || lastVoiceTurn?.assistant || "";
  const promptBox = (
    voiceActive ? (
      <div
        className="overflow-hidden rounded-[24px] border border-[#2557ff]/35 bg-white shadow-[0_18px_70px_-36px_rgba(3,8,22,.45)] dark:bg-[#050816]"
        style={{
          boxShadow: "0 0 0 1px rgba(37,87,255,.12), 0 18px 70px -36px rgba(3,8,22,.30)",
        }}
      >
        <div className="relative min-h-[172px] px-3 pt-3 pb-2 sm:min-h-[200px] sm:px-4 sm:pt-4 sm:pb-2 lg:min-h-[220px] lg:px-10 lg:pt-6 lg:pb-4">
          <style>{`
            @keyframes voiceReferenceFade {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes voiceReferenceRing {
              0%,100% { opacity: .42; transform: scale(1); }
              50% { opacity: .72; transform: scale(1.03); }
            }
            @keyframes voiceListeningFade {
              0%,100% { opacity: .18; }
              50% { opacity: .62; }
            }
          `}</style>

          <div
            className="mx-auto w-full max-w-[460px] rounded-[16px] sm:rounded-[18px] px-3 pt-3 pb-2 sm:px-6 sm:pt-4 sm:pb-4 lg:px-8 lg:pt-5"
            style={{ animation: "voiceReferenceFade .24s ease-out" }}
          >
            {voiceState === VS.LISTENING && (
              <div className="mb-2 flex justify-center">
                <span
                  className="text-[11px] sm:text-[12px] font-medium tracking-[0.02em] text-[#c4b5fd] drop-shadow-[0_0_10px_rgba(196,181,253,.28)] dark:text-white/80"
                  style={{ animation: "voiceListeningFade 2.2s ease-in-out infinite" }}
                >
                  Listening...
                </span>
              </div>
            )}

            <div className="text-center">
              <p
                className="mx-auto max-w-[380px] overflow-hidden text-[12px] font-medium leading-[1.45] text-white/96 sm:text-[13px] sm:leading-[1.5] lg:text-[15px] lg:leading-[1.55]"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {assistantPanelText}
              </p>
            </div>

            <div className="relative mt-4 sm:mt-6 flex items-center justify-center">
              <div className="absolute inset-x-[-18px] top-1/2 -translate-y-1/2 sm:inset-x-[-56px] lg:inset-x-[-92px]">
                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/20" />
                  <div className="opacity-95">
                    <VoiceInputCenter state={voiceState} />
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div
                  className="absolute inset-[-12px] rounded-full border border-[#8b5cf6]/28 sm:inset-[-14px] lg:inset-[-18px]"
                  style={{ animation: "voiceReferenceRing 2.8s ease-in-out infinite" }}
                />
                <div className="absolute inset-[-20px] rounded-full border border-[#6366f1]/18 sm:inset-[-24px] lg:inset-[-30px]" />
                <div className="rounded-full scale-[0.58] sm:scale-[0.84] lg:scale-100 shadow-[0_0_28px_rgba(236,72,153,0.18),0_0_66px_rgba(99,102,241,0.2)]">
                  <VoiceOrb state={voiceState === VS.SENDING ? VS.CONNECTING : voiceState} size={82} />
                </div>
              </div>
            </div>

            <div className="mt-2 sm:mt-4 flex justify-center">
              <button
                onClick={stopVoiceInput}
                aria-label="Stop voice mode"
                className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#0f172a]/8 dark:bg-white/10 px-3 py-1.5 text-[13px] sm:px-4 sm:py-2 sm:text-[14px] font-medium text-[#0f172a] dark:text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,.28)] dark:shadow-[0_10px_24px_-18px_rgba(0,0,0,.95)] ring-1 ring-[#2563eb]/12 dark:ring-white/8 backdrop-blur-md transition-all duration-200 hover:bg-[#0f172a]/12 dark:hover:bg-white/14"
              >
                <Square size={14} className="fill-current" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <ChatInput
        textareaRef={textareaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onSend={sendMessage}
        onVoice={startVoiceInput}
        onAttach={() => {}}
        onSuggestionSelect={handleSuggestionSelect}
        disabled={!message.trim() || isTyping}
        suggestions={!hasMessages ? SUGGESTIONS : []}
      />
    )
  );

  return (
    <>
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="new-chat" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <div className="flex h-full items-center justify-center px-4 py-10">
              <div className="w-full max-w-[720px]">
                <div className="flex flex-col items-center justify-center gap-6">
                  <img src={imgAzironLogo} alt="Aziron" className="object-contain" style={{ width: 72, height: 66 }} />
                  <div className="space-y-2 text-center">
                    <h1 className="text-[30px] font-medium text-foreground" style={{ letterSpacing: "-0.8px" }}>
                      Hi John, where should we start?
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Ask a question, sketch an idea, or start a voice conversation.
                    </p>
                  </div>
                  <div className="w-full pt-2">
                    {promptBox}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-6">
              {messages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <UserMessage
                      key={msg.id}
                      actions={
                        <UserMessageActions
                          copied={copiedId === msg.id}
                          onCopy={() => copyUserPrompt(msg.id, msg.content)}
                          onEdit={() => editUserPrompt(msg.content)}
                        />
                      }
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{msg.content}</p>
                    </UserMessage>
                  );
                }

                const hasProtectedBlocks = msg.blocks?.some((block) =>
                  ["thinking", "timeline", "tool_execution"].includes(block.type),
                );

                return (
                  <AIMessage
                    key={msg.id}
                    className={hasProtectedBlocks ? "max-w-none bg-transparent px-0 py-0 ring-0" : undefined}
                    actions={
                      <MessageActions
                        copied={copiedId === msg.id}
                        onCopy={() => copyMessage(msg.id, msg.blocks)}
                        onRegenerate={regenerateReply}
                        onThumbsUp={() => {}}
                        onThumbsDown={() => {}}
                      />
                    }
                  >
                    <RichMessage blocks={msg.blocks} />
                  </AIMessage>
                );
              })}

              {isTyping && (
                <AIMessage>
                  <div className="inline-flex items-center rounded-full bg-[#f8fafc] px-2 py-1 dark:bg-white/[0.04]">
                    <TypingIndicator />
                  </div>
                </AIMessage>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        {hasMessages && (
          <div className="sticky bottom-0 flex-shrink-0 border-t border-[#e8edf4] bg-[#f8fafc]/92 px-4 pb-4 pt-3 backdrop-blur dark:border-white/[0.05] dark:bg-[#0f172a]/88">
            <div className="mx-auto max-w-[760px]">
              {!voiceActive && (
                <div className="mb-3 flex justify-center">
                  <button onClick={startNew}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
                    <Plus size={12} /> New conversation
                  </button>
                </div>
              )}
              {promptBox}
            </div>
          </div>
        )}
      </div>
    </div>

  </>
  );
}
