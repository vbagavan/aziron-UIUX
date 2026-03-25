import { useState, useRef, useEffect } from "react";
import { PanelLeft, Bell, ChevronDown, Check, Sun, Moon } from "lucide-react";
import NotificationPanel from "@/components/NotificationPanel";

// ─── Language data ─────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English",    flag: "🇺🇸" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "zh", label: "中文",        flag: "🇨🇳" },
  { code: "ar", label: "العربية",    flag: "🇸🇦" },
  { code: "pt", label: "Português",  flag: "🇧🇷" },
];

// ─── Theme toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Apply on mount and whenever dark changes
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((v) => !v)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex items-center justify-center size-8 rounded-full text-[#64748b] hover:bg-[#f1f5f9] transition-colors overflow-hidden"
    >
      {/* Sun icon — visible in light mode */}
      <Sun
        size={15}
        className="absolute transition-all duration-300"
        style={{
          opacity: dark ? 0 : 1,
          transform: dark ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
        }}
      />
      {/* Moon icon — visible in dark mode */}
      <Moon
        size={15}
        className="absolute transition-all duration-300"
        style={{
          opacity: dark ? 1 : 0,
          transform: dark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
        }}
      />
    </button>
  );
}

// ─── Language selector ─────────────────────────────────────────────────────────
function LanguageSelector() {
  const [selected, setSelected] = useState(LANGUAGES[0]);
  const [open, setOpen]         = useState(false);
  const ref                     = useRef(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onKey     = (e) => { if (e.key === "Escape") setOpen(false); };
    const onOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-xs font-medium text-[#475569] hidden sm:block">{selected.code.toUpperCase()}</span>
        <ChevronDown
          size={12}
          className={`text-[#94a3b8] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] w-[188px] bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden z-[999]"
          style={{
            boxShadow: "0 8px 28px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
            animation: "langIn 0.15s cubic-bezier(0.34,1.2,0.64,1)",
          }}
        >
          <style>{`
            @keyframes langIn {
              from { opacity:0; transform:translateY(4px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div className="px-3 py-2 border-b border-[#f1f5f9]">
            <span className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Language</span>
          </div>

          {/* Options */}
          <div className="py-1 max-h-[260px] overflow-y-auto">
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === selected.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => { setSelected(lang); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left ${
                    isActive ? "bg-[#f0f7ff]" : "hover:bg-[#f8fafc]"
                  }`}
                >
                  <span className="text-base leading-none flex-shrink-0">{lang.flag}</span>
                  <span className={`flex-1 text-sm ${isActive ? "font-semibold text-[#2563eb]" : "font-medium text-[#0f172a]"}`}>
                    {lang.label}
                  </span>
                  {isActive && <Check size={13} className="text-[#2563eb] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App header ────────────────────────────────────────────────────────────────
export default function AppHeader({
  onToggleSidebar,
  onNavigate,
  children,
  approvals,
  onApprove,
  onReject,
  notifOpen: notifOpenProp,
  onNotifToggle,
}) {
  const [showNotificationsInternal, setShowNotificationsInternal] = useState(false);

  const showNotifications  = notifOpenProp !== undefined ? notifOpenProp : showNotificationsInternal;
  const toggleNotifications = onNotifToggle ?? (() => setShowNotificationsInternal((v) => !v));

  const pendingKudos = (approvals ?? []).filter((a) => a.status === "pending").length;
  const hasBadge     = pendingKudos > 0;

  return (
    <>
      <header className="flex items-center justify-between h-12 px-4 border-b border-[#e2e8f0] flex-shrink-0 bg-white">
        {/* Left: sidebar toggle + optional children */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center size-7 rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
          >
            <PanelLeft size={16} />
          </button>
          {children}
        </div>

        {/* Right: language selector + theme toggle + bell */}
        <div className="flex items-center gap-1">
          <LanguageSelector />

          <div className="w-px h-4 bg-[#e2e8f0] mx-1" />

          <ThemeToggle />

          <div className="w-px h-4 bg-[#e2e8f0] mx-1" />

          <button
            onClick={toggleNotifications}
            className="relative flex items-center justify-center size-8 rounded-full text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
          >
            <Bell size={16} />
            <span className="absolute top-[7px] right-[7px] size-[7px] bg-[#ef4444] rounded-full border border-white" />
            {hasBadge && (
              <span className="absolute top-[5px] right-[5px] size-[11px] rounded-full bg-[#ef4444] opacity-40 animate-ping" />
            )}
          </button>
        </div>
      </header>

      <NotificationPanel
        open={showNotifications}
        onClose={toggleNotifications}
        onNavigate={onNavigate}
        approvals={approvals}
        onApprove={onApprove}
        onReject={onReject}
      />
    </>
  );
}
