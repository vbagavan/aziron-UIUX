import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, Check, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationPanel from "@/components/layout/NotificationPanel";

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
      className="relative flex items-center justify-center size-8 rounded-full text-muted-foreground transition-colors hover:bg-muted overflow-hidden"
    >
      <Sun
        size={15}
        className={cn(
          "absolute transition-all duration-300",
          dark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100",
        )}
      />
      <Moon
        size={15}
        className={cn(
          "absolute transition-all duration-300",
          dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50",
        )}
      />
    </button>
  );
}

// ─── Language selector ─────────────────────────────────────────────────────────
function LanguageSelector() {
  const [selected, setSelected] = useState(LANGUAGES[0]);
  const [open, setOpen]         = useState(false);
  const ref                     = useRef(null);

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
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-xs font-medium text-muted-foreground hidden sm:block">
          {selected.code.toUpperCase()}
        </span>
        <ChevronDown
          size={12}
          className={cn("text-muted-foreground transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[188px] bg-popover border border-border rounded-xl overflow-hidden z-50 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Language
            </span>
          </div>

          <div className="py-1 max-h-[260px] overflow-y-auto">
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === selected.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => { setSelected(lang); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left",
                    isActive ? "bg-accent" : "hover:bg-muted",
                  )}
                >
                  <span className="text-base leading-none flex-shrink-0">{lang.flag}</span>
                  <span className={cn(
                    "flex-1 text-sm",
                    isActive
                      ? "font-semibold text-primary"
                      : "font-medium text-foreground",
                  )}>
                    {lang.label}
                  </span>
                  {isActive && <Check size={13} className="text-primary flex-shrink-0" />}
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
  onNavigate,
  children,
  approvals,
  onApprove,
  onReject,
  notifOpen: notifOpenProp,
  onNotifToggle,
}) {
  const [showNotificationsInternal, setShowNotificationsInternal] = useState(false);

  const showNotifications   = notifOpenProp !== undefined ? notifOpenProp : showNotificationsInternal;
  const toggleNotifications = onNotifToggle ?? (() => setShowNotificationsInternal((v) => !v));

  const pendingKudos = (approvals ?? []).filter((a) => a.status === "pending").length;
  const hasBadge     = pendingKudos > 0;

  return (
    <>
      <header className="flex items-center justify-between h-12 px-4 border-b border-border flex-shrink-0 bg-background">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="size-7 text-muted-foreground hover:bg-muted" />
          {children}
        </div>

        <div className="flex items-center gap-1">
          <LanguageSelector />

          <div className="w-px h-4 bg-border mx-1" />

          <ThemeToggle />

          <div className="w-px h-4 bg-border mx-1" />

          <button
            onClick={toggleNotifications}
            className="relative flex items-center justify-center size-8 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <Bell size={16} />
            <span className="absolute top-[7px] right-[7px] size-[7px] bg-destructive rounded-full border border-background" />
            {hasBadge && (
              <span className="absolute top-[5px] right-[5px] size-[11px] rounded-full bg-destructive/40 animate-ping" />
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
