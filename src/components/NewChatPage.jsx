import { useState, useRef } from "react";
import { Paperclip, Send, ChevronDown, Database, Cpu } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";

const imgAzironLogo =
  "https://www.figma.com/api/mcp/asset/f4c83c9c-c4ed-4c76-880e-b0d714d34c1e";
const imgToolsIcon =
  "https://www.figma.com/api/mcp/asset/ff2b2176-1ed2-4a50-a2df-65dd00a693ff";

// Simple donut-progress SVG representing token usage
function UsageDonut({ pct = 65 }) {
  const r = 5;
  const cx = 7;
  const cy = 7;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ rotate: "-90deg" }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NewChatPage({ onNavigate, onStartChat, sidebarCollapsed, onToggleSidebar }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!message.trim()) return;
    onStartChat?.(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-grow textarea
  const handleInput = (e) => {
    setMessage(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        activePage="new-chat"
        onNavigate={onNavigate}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader onToggleSidebar={onToggleSidebar} onNavigate={onNavigate} />

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8 pb-12">
          {/* Large Aziron logo */}
          <img
            src={imgAzironLogo}
            alt="Aziron"
            className="object-contain"
            style={{ width: 88, height: 80 }}
          />

          {/* Greeting */}
          <h1
            className="text-2xl font-medium text-[#0f172a]"
            style={{ letterSpacing: "-0.6px" }}
          >
            Hi John, Where should we start?
          </h1>

          {/* Prompt box — responsive width, blue active border */}
          <div
            className="bg-[#f8fafc] rounded-[12px] overflow-hidden w-full max-w-[680px]"
            style={{ border: "2px solid #2563eb" }}
          >
            {/* ── Top panel: attachment · input · send ── */}
            <div className="flex items-start gap-3 px-4 py-4">
              <button aria-label="Attach file" className="flex items-center justify-center size-10 rounded-full text-[#64748b] hover:bg-[#f1f5f9] transition-colors flex-shrink-0 mt-0.5">
                <Paperclip size={18} />
              </button>

              <textarea
                ref={textareaRef}
                value={message}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, or describe your task…"
                rows={1}
                className="flex-1 bg-transparent text-base text-[#0f172a] placeholder:text-[#64748b] outline-none resize-none leading-6 py-2"
                style={{ minHeight: 40, maxHeight: 160 }}
              />

              <button
                onClick={handleSend}
                disabled={!message.trim()}
                aria-label="Send message"
                className={`flex items-center justify-center size-10 rounded-full border flex-shrink-0 mt-0.5 transition-colors ${
                  message.trim()
                    ? "bg-[#2563eb] border-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    : "bg-white border-[#cbd5e1] text-[#cbd5e1] cursor-not-allowed"
                }`}
              >
                <Send size={16} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e2e8f0]" />

            {/* ── Control panel ── */}
            <div className="flex items-center justify-between px-4 h-9">
              {/* Left controls */}
              <div className="flex items-center gap-2.5">
                {/* Tools */}
                <button aria-label="Select tools" aria-haspopup="true" className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors whitespace-nowrap">
                  <img
                    src={imgToolsIcon}
                    alt=""
                    className="size-3.5 object-contain opacity-60"
                  />
                  <span>Tools</span>
                  <ChevronDown size={11} />
                </button>

                <div className="w-px h-4 bg-[#e2e8f0]" />

                {/* Knowledge hub */}
                <button aria-label="Select knowledge hub" aria-haspopup="true" className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors whitespace-nowrap">
                  <Database size={13} />
                  <span>Knowledge hub</span>
                  <ChevronDown size={11} />
                </button>

                <div className="w-px h-4 bg-[#e2e8f0]" />

                {/* Chat status */}
                <div className="flex items-center gap-1 text-xs font-medium text-[#64748b]">
                  <UsageDonut pct={65} />
                  <span>65% used</span>
                </div>
              </div>

              {/* Model selector */}
              <button aria-label="Select AI model" aria-haspopup="true" className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors whitespace-nowrap">
                <Cpu size={12} />
                <span>Claude-sonnet</span>
                <ChevronDown size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
