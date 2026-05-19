import { useState, useRef, useEffect } from "react";
import {
  X,
  CheckCheck,
  ChevronRight,
  ServerCrash,
  ShieldAlert,
  Bot,
  ShieldX,
  Zap,
  Gauge,
  FlaskConical,
  DatabaseZap,
  Rocket,
  GitMerge,
  GitPullRequest,
  Clock,
  CheckCircle2,
  BellOff,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  {
    id: "c1", type: "critical", category: "security",
    avatarBg: "var(--muted-foreground)", avatarInitials: "PR",
    BadgeIcon: ServerCrash, badgeBg: "var(--destructive)",
    title: "Production deployment failure",
    desc: "main branch · deploy #847 crashed at runtime",
    tag: "PROD", time: "Just now", unread: true, persistent: true,
  },
  {
    id: "c2", type: "critical", category: "security",
    avatarBg: "var(--destructive)", avatarInitials: "CV",
    BadgeIcon: ShieldAlert, badgeBg: "var(--destructive)",
    title: "Security vulnerability detected",
    desc: "CVE-2024-1234 (critical) in lodash@4.17.11",
    tag: "CVE", time: "5 min ago", unread: true, persistent: true,
  },
  {
    id: "c3", type: "critical", category: "general",
    avatarBg: "var(--primary)", avatarInitials: "AI",
    BadgeIcon: Bot, badgeBg: "var(--destructive)",
    title: "AI agent execution failure",
    desc: "Customer Support Agent · unhandled exception in run #23",
    tag: "AGENT", time: "12 min ago", unread: true, persistent: true,
  },
  {
    id: "c4", type: "critical", category: "security",
    avatarBg: "var(--destructive)", avatarInitials: "UA",
    BadgeIcon: ShieldX, badgeBg: "var(--destructive)",
    title: "Unauthorized access attempt",
    desc: "IP 203.0.113.42 · 14 failed logins on admin panel",
    tag: "SECURITY", time: "18 min ago", unread: true, persistent: true,
  },
  {
    id: "w1", type: "warning", category: "general",
    avatarBg: "var(--warning)", avatarInitials: "CI",
    BadgeIcon: Zap, badgeBg: "var(--warning)",
    title: "Build pipeline instability",
    desc: "CI/CD · 3 of last 5 runs failed — flaky test suspected",
    tag: "CI/CD", time: "45 min ago", unread: true,
  },
  {
    id: "w2", type: "warning", category: "general",
    avatarBg: "var(--warning)", avatarInitials: "AP",
    BadgeIcon: Gauge, badgeBg: "var(--warning)",
    title: "API latency spike detected",
    desc: "p95 → 1.4s · 340% above baseline",
    tag: "API", time: "1h ago", unread: false,
  },
  {
    id: "w3", type: "warning", category: "general",
    avatarBg: "var(--warning)", avatarInitials: "TC",
    BadgeIcon: FlaskConical, badgeBg: "var(--warning)",
    title: "Test coverage below threshold",
    desc: "Coverage dropped to 68% · minimum required: 80%",
    tag: "TESTS", time: "2h ago", unread: false,
  },
  {
    id: "w4", type: "warning", category: "general",
    avatarBg: "var(--chart-chart-4)", avatarInitials: "DP",
    BadgeIcon: DatabaseZap, badgeBg: "var(--warning)",
    title: "Data pipeline near capacity",
    desc: "Queue utilisation at 89% · auto-scaling triggered",
    tag: "PIPELINE", time: "3h ago", unread: false,
  },
  {
    id: "s1", type: "success", category: "general",
    avatarBg: "var(--success)", avatarInitials: "PR",
    BadgeIcon: Rocket, badgeBg: "var(--success)",
    title: "Production deployment successful",
    desc: "v2.4.1 deployed to prod · 0 errors · 12s build",
    tag: "DEPLOY", time: "3h ago", unread: false,
  },
  {
    id: "s2", type: "success", category: "general",
    avatarBg: "var(--success)", avatarInitials: "GH",
    BadgeIcon: GitMerge, badgeBg: "var(--success)",
    title: "PR #1247 merged — AI review passed",
    desc: "feat: knowledge-hub picker · reviewed by Aziron AI",
    tag: "PR", time: "4h ago", unread: false,
  },
  {
    id: "a1", type: "approval", category: "approval",
    avatarBg: "var(--primary)", avatarInitials: "AI",
    BadgeIcon: GitPullRequest, badgeBg: "var(--primary)",
    title: "AI-generated code pending review",
    desc: "Aziron AI proposes 3 file changes in CustomerAgent.js",
    tag: "CODE", time: "15 min ago", unread: true, persistent: true,
    actions: ["Review", "Approve", "Reject"],
  },
  {
    id: "a2", type: "approval", category: "approval",
    avatarBg: "var(--primary)", avatarInitials: "JA",
    BadgeIcon: Rocket, badgeBg: "var(--primary)",
    title: "Deployment approval required",
    desc: "staging → production · v2.5.0-rc.1 · requested by Jay",
    tag: "DEPLOY", time: "30 min ago", unread: true, persistent: true,
    actions: ["Approve", "Reject"],
  },
  {
    id: "a3", type: "approval", category: "approval", category2: "security",
    avatarBg: "var(--primary)", avatarInitials: "SE",
    BadgeIcon: ShieldAlert, badgeBg: "var(--primary)",
    title: "Security exception awaiting review",
    desc: "CORS bypass requested for partner API integration",
    tag: "SECURITY", time: "1h ago", unread: false, persistent: true,
    actions: ["Review"],
  },
  {
    id: "a4", type: "approval", category: "approval",
    avatarBg: "var(--primary)", avatarInitials: "WF",
    BadgeIcon: Clock, badgeBg: "var(--primary)",
    title: "Workflow paused — human decision needed",
    desc: "Invoice reconciliation agent waiting at step 4 of 7",
    tag: "WORKFLOW", time: "2h ago", unread: false, persistent: true,
    actions: ["Review", "Approve"],
  },
];

const TYPE_CONFIG = {
  critical: { bar: "var(--destructive)", dot: "var(--destructive)", label: "CRITICAL", labelColor: "var(--destructive)" },
  warning:  { bar: "var(--warning)", dot: "var(--warning)", label: "WARNING",  labelColor: "var(--warning)" },
  success:  { bar: "var(--success)", dot: "var(--success)", label: "SUCCESS",  labelColor: "var(--success)" },
  approval: { bar: "var(--primary)", dot: "var(--primary)", label: "APPROVAL", labelColor: "var(--primary)" },
};

const ACTION_STYLE = {
  Approve: "bg-success text-success-foreground hover:bg-success/90",
  Reject:  "border border-border text-destructive bg-card dark:bg-card hover:bg-destructive/10 dark:hover:bg-muted",
  Review:  "border border-border text-primary bg-card dark:bg-card hover:bg-primary/10 dark:hover:bg-primary/20",
};

const TABS = [
  { key: "all",       label: "All" },
  { key: "approvals", label: "Approvals" },
  { key: "security",  label: "Security" },
  { key: "unread",    label: "Unread" },
];

// All unique tags derived from data
const ALL_TAGS = [...new Set(NOTIFICATIONS.map((n) => n.tag))].sort();

const FILTER_TYPE_OPTIONS = [
  { value: "critical", label: "Critical", color: "var(--destructive)" },
  { value: "warning",  label: "Warning",  color: "var(--warning)" },
  { value: "success",  label: "Success",  color: "var(--success)" },
  { value: "approval", label: "Approval", color: "var(--primary)" },
];

const FILTER_STATUS_OPTIONS = [
  { value: "unread",     label: "Unread only" },
  { value: "read",       label: "Read only" },
  { value: "persistent", label: "Persistent" },
];

// Default empty filters
const EMPTY_FILTERS = { types: [], tags: [], statuses: [] };

// ─── Filtering logic ──────────────────────────────────────────────────────────

function applyTab(items, tab) {
  if (tab === "all")       return items;
  if (tab === "approvals") return items.filter((n) => n.category === "approval");
  if (tab === "security")  return items.filter((n) => n.category === "security" || n.category2 === "security");
  if (tab === "unread")    return items.filter((n) => n.unread);
  return items;
}

function applyFilters(items, filters) {
  let result = items;
  if (filters.types.length)    result = result.filter((n) => filters.types.includes(n.type));
  if (filters.tags.length)     result = result.filter((n) => filters.tags.includes(n.tag));
  if (filters.statuses.length) {
    result = result.filter((n) => {
      if (filters.statuses.includes("unread")     && n.unread)      return true;
      if (filters.statuses.includes("read")       && !n.unread)     return true;
      if (filters.statuses.includes("persistent") && n.persistent)  return true;
      return false;
    });
  }
  return result;
}

function countActiveFilters(filters) {
  return filters.types.length + filters.tags.length + filters.statuses.length;
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({ filters, onChange, onClose, anchorRef }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const toggle = (key, value) => {
    onChange((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const hasAny = countActiveFilters(filters) > 0;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 bg-card dark:bg-card border border-border dark:border-border rounded-[12px] w-[280px] flex flex-col"
      style={{ boxShadow: "0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border dark:border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-muted-foreground dark:text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground dark:text-foreground">Filters</span>
          {hasAny && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {countActiveFilters(filters)}
            </span>
          )}
        </div>
        {hasAny && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs text-destructive font-medium hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Type */}
        <div>
          <p className="text-sm font-bold tracking-[0.06em] uppercase text-muted-foreground dark:text-muted-foreground mb-2">Type</p>
          <div className="flex flex-col gap-1">
            {FILTER_TYPE_OPTIONS.map(({ value, label, color }) => {
              const active = filters.types.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggle("types", value)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] text-sm transition-colors w-full text-left ${
                    active ? "bg-background" : "hover:bg-muted dark:hover:bg-muted"
                  }`}
                >
                  {/* Checkbox */}
                  <span
                    className={`flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors ${
                      active ? "border-transparent" : "border-border"
                    }`}
                    style={active ? { backgroundColor: color, borderColor: color } : {}}
                  >
                    {active && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {/* Color dot */}
                  <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className={`text-sm ${active ? "font-medium text-foreground dark:text-foreground" : "text-muted-foreground dark:text-muted-foreground"}`}>
                    {label}
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground dark:text-muted-foreground">
                    {NOTIFICATIONS.filter((n) => n.type === value).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm font-bold tracking-[0.06em] uppercase text-muted-foreground dark:text-muted-foreground mb-2">Status</p>
          <div className="flex flex-col gap-1">
            {FILTER_STATUS_OPTIONS.map(({ value, label }) => {
              const active = filters.statuses.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggle("statuses", value)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] text-sm transition-colors w-full text-left ${
                    active ? "bg-background" : "hover:bg-muted dark:hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors ${
                      active ? "bg-primary border-border" : "border-border"
                    }`}
                  >
                    {active && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm ${active ? "font-medium text-foreground dark:text-foreground" : "text-muted-foreground dark:text-muted-foreground"}`}>
                    {label}
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground dark:text-muted-foreground">
                    {value === "unread"     ? NOTIFICATIONS.filter((n) => n.unread).length
                    : value === "read"      ? NOTIFICATIONS.filter((n) => !n.unread).length
                    : NOTIFICATIONS.filter((n) => n.persistent).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="text-sm font-bold tracking-[0.06em] uppercase text-muted-foreground dark:text-muted-foreground mb-2">Tag</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map((tag) => {
              const active = filters.tags.includes(tag);
              // Find the type color for this tag
              const sample = NOTIFICATIONS.find((n) => n.tag === tag);
              const color = sample ? TYPE_CONFIG[sample.type].bar : "var(--muted-foreground)";
              return (
                <button
                  key={tag}
                  onClick={() => toggle("tags", tag)}
                  className={`px-2 py-[3px] rounded text-sm font-bold tracking-wide border transition-all ${
                    active
                      ? "text-white border-transparent"
                      : "text-muted-foreground dark:text-muted-foreground bg-background border-border dark:border-border hover:border-border"
                  }`}
                  style={active ? { backgroundColor: color, borderColor: color } : {}}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ item, expanded, onToggle, onDismiss, onMarkRead }) {
  const cfg = TYPE_CONFIG[item.type];
  const { BadgeIcon } = item;

  return (
    <div
      className={`group relative rounded-[12px] border border-border dark:border-border bg-card dark:bg-card transition-all duration-200 cursor-pointer ${
        expanded ? "shadow-md dark:shadow-none" : "hover:shadow-sm dark:hover:shadow-none"
      }`}
      onClick={() => onToggle(item.id)}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Unread dot */}
        <div className="flex-shrink-0 flex items-center justify-center w-3 mt-[18px]">
          {item.unread ? (
            <div
              className={`size-2.5 rounded-full opacity-50 ${item.type === "critical" ? "animate-pulse !opacity-100" : ""}`}
              style={{ backgroundColor: cfg.dot }}
            />
          ) : (
            <div className="size-2.5 rounded-full bg-border" />
          )}
        </div>

        {/* Avatar + badge */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div
            className="size-11 rounded-full flex items-center justify-center text-white text-sm font-bold select-none"
            style={{ backgroundColor: item.avatarBg }}
          >
            {item.avatarInitials}
          </div>
          <div
            className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card dark:border-border flex items-center justify-center"
            style={{ backgroundColor: item.badgeBg }}
          >
            <BadgeIcon size={10} color="white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-sm text-foreground dark:text-foreground leading-snug ${item.unread ? "font-semibold" : "font-medium"}`}>
                {item.title}
              </p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground dark:text-muted-foreground whitespace-nowrap">{item.time}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
                aria-label="Dismiss notification"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 flex items-center justify-center size-6 rounded-full text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-muted-foreground dark:hover:text-muted-foreground transition-all"
              >
                <X size={13} aria-hidden />
              </button>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span
              className="px-2 py-[2px] rounded text-xs font-bold tracking-wide border"
              style={{ color: cfg.labelColor, backgroundColor: `${cfg.bar}12`, borderColor: `${cfg.bar}30` }}
            >
              {item.tag}
            </span>
            <span
              className="text-xs font-semibold px-2 py-[2px] rounded border"
              style={{ color: cfg.labelColor, backgroundColor: `${cfg.bar}10`, borderColor: `${cfg.bar}20` }}
            >
              {cfg.label}
            </span>
            {item.persistent && (
              <span className="text-xs text-muted-foreground dark:text-muted-foreground bg-background border border-border dark:border-border px-2 py-[2px] rounded font-medium">
                persistent
              </span>
            )}
            {item.unread && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkRead(item.id); }}
                className="text-xs text-primary hover:text-primary font-medium transition-colors ml-auto"
              >
                Mark as read
              </button>
            )}
          </div>

          {/* Expanded action buttons */}
          {item.actions && (
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expanded ? "max-h-16 mt-3 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center gap-2">
                {item.actions.map((action) => (
                  <button
                    key={action}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${ACTION_STYLE[action]}`}
                  >
                    {action === "Approve" && <CheckCheck size={12} />}
                    {action === "Reject"  && <X size={12} />}
                    {action === "Review"  && <ChevronRight size={12} />}
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group section header ──────────────────────────────────────────────────────

function SectionHeader({ type, count }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <div className="flex items-center gap-3 mt-6 mb-2 first:mt-0">
      <span className="text-sm font-bold tracking-[0.08em] uppercase" style={{ color: cfg.labelColor }}>
        {cfg.label}
      </span>
      <span
        className="text-xs font-bold px-1.5 py-[1px] rounded-full"
        style={{ color: cfg.labelColor, backgroundColor: `${cfg.bar}15` }}
      >
        {count}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: `${cfg.bar}20` }} />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="size-16 rounded-full bg-background border border-border dark:border-border flex items-center justify-center">
        <BellOff size={24} className="text-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-medium text-muted-foreground dark:text-muted-foreground">No notifications match</p>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Try adjusting your filters</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage({ onNavigate

}) {
  const [activeTab, setActiveTab]   = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [items, setItems]           = useState(NOTIFICATIONS);
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef                = useRef(null);

  // Tab → filters → display
  const tabItems      = applyTab(items, activeTab);
  const displayItems  = applyFilters(tabItems, filters);
  const activeFilterCount = countActiveFilters(filters);

  const unreadCount = items.filter((n) => n.unread).length;

  const handleToggle    = (id) => setExpandedId((prev) => (prev === id ? null : id));
  const handleDismiss   = (id) => setItems((prev) => prev.filter((n) => n.id !== id));
  const handleMarkRead  = (id) => setItems((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  const handleMarkAllRead = ()  => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  // Tab unread badge counts (before additional filters for UX clarity)
  const tabCount = (key) => applyTab(items, key).filter((n) => n.unread).length;

  return (
    <main className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="notifications" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader onNavigate={onNavigate}>
          <nav className="flex items-center gap-1.5 text-sm ml-1">
            <span className="text-muted-foreground dark:text-muted-foreground">Settings</span>
            <ChevronRight size={13} className="text-foreground dark:text-muted-foreground" />
            <span className="text-foreground dark:text-foreground font-medium">Notifications</span>
          </nav>
        </AppHeader>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <div className="px-6 py-5 flex flex-col gap-4 max-w-[1400px] mx-auto flex-1 min-h-0">

            {/* ── Heading ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-[22px] font-semibold text-foreground dark:text-foreground leading-8 tracking-[-0.4px]">
                  Notifications
                </h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                  {unreadCount > 0 ? (
                    <span>
                      You have{" "}
                      <span className="font-semibold text-foreground dark:text-foreground">{unreadCount} unread</span>{" "}
                      notification{unreadCount !== 1 ? "s" : ""}
                    </span>
                  ) : "All notifications are read"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[7px] border border-border dark:border-border bg-card dark:bg-card text-sm font-medium text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <CheckCheck size={14} />
                    Mark all as read
                  </button>
                )}

                {/* Filter button */}
                <div className="relative">
                  <button
                    ref={filterBtnRef}
                    onClick={() => setFilterOpen((v) => !v)}
                    className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-[7px] border text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
                      filterOpen || activeFilterCount > 0
                        ? "bg-primary text-primary-foreground border-border hover:bg-primary"
                        : "border-border dark:border-border bg-card dark:bg-card text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted"
                    }`}
                  >
                    <Filter size={14} />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-card text-primary text-xs font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {filterOpen && (
                    <FilterPanel
                      filters={filters}
                      onChange={setFilters}
                      onClose={() => setFilterOpen(false)}
                      anchorRef={filterBtnRef}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 border-b border-border dark:border-border -mb-1">
              {TABS.map(({ key, label }) => {
                const cnt    = tabCount(key);
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setExpandedId(null); }}
                    aria-current={active ? "page" : undefined}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      active
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    }`}
                  >
                    {label}
                    {cnt > 0 && (
                      <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ${
                        active ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-border text-muted-foreground dark:text-muted-foreground"
                      }`}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Active filter chips ── */}
            {countActiveFilters(filters) > 0 && (
              <div className="flex items-center gap-2 flex-wrap -mt-1">
                <span className="text-xs text-muted-foreground">Active:</span>
                {[
                  ...filters.types.map((v) => ({ key: "types", value: v, label: v.charAt(0).toUpperCase() + v.slice(1), color: TYPE_CONFIG[v].bar })),
                  ...filters.statuses.map((v) => { const opt = FILTER_STATUS_OPTIONS.find((o) => o.value === v); return { key: "statuses", value: v, label: opt?.label ?? v, color: "var(--muted-foreground)" }; }),
                  ...filters.tags.map((v) => { const sample = NOTIFICATIONS.find((n) => n.tag === v); return { key: "tags", value: v, label: v, color: sample ? TYPE_CONFIG[sample.type].bar : "var(--muted-foreground)" }; }),
                ].map(({ key, value, label, color }) => (
                  <button
                    key={`${key}-${value}`}
                    onClick={() => setFilters((prev) => ({ ...prev, [key]: prev[key].filter((v) => v !== value) }))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-transparent transition-opacity hover:opacity-80"
                    style={{ backgroundColor: color }}
                  >
                    {label} <X size={10} strokeWidth={2.5} />
                  </button>
                ))}
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="text-xs text-muted-foreground dark:text-muted-foreground hover:text-destructive font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ── Notification list ── */}
            {displayItems.length === 0 ? (
              <EmptyState />
            ) : activeTab === "all" && activeFilterCount === 0 ? (
              ["critical", "warning", "approval", "success"].map((type) => {
                const group = displayItems.filter((n) => n.type === type);
                if (!group.length) return null;
                return (
                  <div key={type}>
                    <SectionHeader type={type} count={group.length} />
                    <div className="flex flex-col gap-2">
                      {group.map((item) => (
                        <NotificationRow
                          key={item.id}
                          item={item}
                          expanded={expandedId === item.id}
                          onToggle={handleToggle}
                          onDismiss={handleDismiss}
                          onMarkRead={handleMarkRead}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col gap-2">
                {displayItems.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggle={handleToggle}
                    onDismiss={handleDismiss}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            )}

            {/* ── Footer stats ── */}
            <div className="flex items-center justify-between py-1 text-xs text-muted-foreground dark:text-muted-foreground">
              <span>
                {displayItems.length} notification{displayItems.length !== 1 ? "s" : ""}
                {activeFilterCount > 0 && <span className="text-primary font-medium"> (filtered)</span>}
                {" "}· {displayItems.filter((n) => n.unread).length} unread
              </span>
              <div className="flex items-center gap-3">
                {items.filter((n) => n.type === "critical" && n.unread).length > 0 && (
                  <span className="text-destructive font-medium">
                    {items.filter((n) => n.type === "critical" && n.unread).length} critical
                  </span>
                )}
                {items.filter((n) => n.type === "approval" && n.unread).length > 0 && (
                  <span className="text-primary font-medium">
                    {items.filter((n) => n.type === "approval" && n.unread).length} pending approval
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
