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
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  {
    id: "c1", type: "critical", category: "security",
    avatarBg: "#64748b", avatarInitials: "PR",
    BadgeIcon: ServerCrash, badgeBg: "#ef4444",
    title: "Production deployment failure",
    desc: "main branch · deploy #847 crashed at runtime",
    tag: "PROD", time: "Just now", unread: true, persistent: true,
  },
  {
    id: "c2", type: "critical", category: "security",
    avatarBg: "#ef4444", avatarInitials: "CV",
    BadgeIcon: ShieldAlert, badgeBg: "#ef4444",
    title: "Security vulnerability detected",
    desc: "CVE-2024-1234 (critical) in lodash@4.17.11",
    tag: "CVE", time: "5 min ago", unread: true, persistent: true,
  },
  {
    id: "c3", type: "critical", category: "general",
    avatarBg: "#2563eb", avatarInitials: "AI",
    BadgeIcon: Bot, badgeBg: "#ef4444",
    title: "AI agent execution failure",
    desc: "Customer Support Agent · unhandled exception in run #23",
    tag: "AGENT", time: "12 min ago", unread: true, persistent: true,
  },
  {
    id: "c4", type: "critical", category: "security",
    avatarBg: "#b91c1c", avatarInitials: "UA",
    BadgeIcon: ShieldX, badgeBg: "#ef4444",
    title: "Unauthorized access attempt",
    desc: "IP 203.0.113.42 · 14 failed logins on admin panel",
    tag: "SECURITY", time: "18 min ago", unread: true, persistent: true,
  },
  {
    id: "w1", type: "warning", category: "general",
    avatarBg: "#d97706", avatarInitials: "CI",
    BadgeIcon: Zap, badgeBg: "#f97316",
    title: "Build pipeline instability",
    desc: "CI/CD · 3 of last 5 runs failed — flaky test suspected",
    tag: "CI/CD", time: "45 min ago", unread: true,
  },
  {
    id: "w2", type: "warning", category: "general",
    avatarBg: "#b45309", avatarInitials: "AP",
    BadgeIcon: Gauge, badgeBg: "#f97316",
    title: "API latency spike detected",
    desc: "p95 → 1.4s · 340% above baseline",
    tag: "API", time: "1h ago", unread: false,
  },
  {
    id: "w3", type: "warning", category: "general",
    avatarBg: "#92400e", avatarInitials: "TC",
    BadgeIcon: FlaskConical, badgeBg: "#f97316",
    title: "Test coverage below threshold",
    desc: "Coverage dropped to 68% · minimum required: 80%",
    tag: "TESTS", time: "2h ago", unread: false,
  },
  {
    id: "w4", type: "warning", category: "general",
    avatarBg: "#7c3aed", avatarInitials: "DP",
    BadgeIcon: DatabaseZap, badgeBg: "#f97316",
    title: "Data pipeline near capacity",
    desc: "Queue utilisation at 89% · auto-scaling triggered",
    tag: "PIPELINE", time: "3h ago", unread: false,
  },
  {
    id: "s1", type: "success", category: "general",
    avatarBg: "#16a34a", avatarInitials: "PR",
    BadgeIcon: Rocket, badgeBg: "#22c55e",
    title: "Production deployment successful",
    desc: "v2.4.1 deployed to prod · 0 errors · 12s build",
    tag: "DEPLOY", time: "3h ago", unread: false,
  },
  {
    id: "s2", type: "success", category: "general",
    avatarBg: "#15803d", avatarInitials: "GH",
    BadgeIcon: GitMerge, badgeBg: "#22c55e",
    title: "PR #1247 merged — AI review passed",
    desc: "feat: knowledge-hub picker · reviewed by Aziron AI",
    tag: "PR", time: "4h ago", unread: false,
  },
  {
    id: "a1", type: "approval", category: "approval",
    avatarBg: "#1d4ed8", avatarInitials: "AI",
    BadgeIcon: GitPullRequest, badgeBg: "#2563eb",
    title: "AI-generated code pending review",
    desc: "Aziron AI proposes 3 file changes in CustomerAgent.js",
    tag: "CODE", time: "15 min ago", unread: true, persistent: true,
    actions: ["Review", "Approve", "Reject"],
  },
  {
    id: "a2", type: "approval", category: "approval",
    avatarBg: "#1e40af", avatarInitials: "JA",
    BadgeIcon: Rocket, badgeBg: "#2563eb",
    title: "Deployment approval required",
    desc: "staging → production · v2.5.0-rc.1 · requested by Jay",
    tag: "DEPLOY", time: "30 min ago", unread: true, persistent: true,
    actions: ["Approve", "Reject"],
  },
  {
    id: "a3", type: "approval", category: "approval", category2: "security",
    avatarBg: "#1e3a8a", avatarInitials: "SE",
    BadgeIcon: ShieldAlert, badgeBg: "#2563eb",
    title: "Security exception awaiting review",
    desc: "CORS bypass requested for partner API integration",
    tag: "SECURITY", time: "1h ago", unread: false, persistent: true,
    actions: ["Review"],
  },
  {
    id: "a4", type: "approval", category: "approval",
    avatarBg: "#1d4ed8", avatarInitials: "WF",
    BadgeIcon: Clock, badgeBg: "#2563eb",
    title: "Workflow paused — human decision needed",
    desc: "Invoice reconciliation agent waiting at step 4 of 7",
    tag: "WORKFLOW", time: "2h ago", unread: false, persistent: true,
    actions: ["Review", "Approve"],
  },
];

const TYPE_CONFIG = {
  critical: { bar: "#ef4444", dot: "#ef4444", label: "CRITICAL", labelColor: "#ef4444" },
  warning:  { bar: "#f97316", dot: "#f97316", label: "WARNING",  labelColor: "#f97316" },
  success:  { bar: "#22c55e", dot: "#22c55e", label: "SUCCESS",  labelColor: "#22c55e" },
  approval: { bar: "#2563eb", dot: "#2563eb", label: "APPROVAL", labelColor: "#2563eb" },
};

const ACTION_STYLE = {
  Approve: "bg-[#22c55e] text-white hover:bg-[#16a34a]",
  Reject:  "border border-[#ef4444] text-[#ef4444] bg-white dark:bg-[#1e293b] hover:bg-[#fef2f2] dark:hover:bg-[#1e293b]",
  Review:  "border border-[#2563eb] text-[#2563eb] bg-white dark:bg-[#1e293b] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a8a]",
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
  { value: "critical", label: "Critical", color: "#ef4444" },
  { value: "warning",  label: "Warning",  color: "#f97316" },
  { value: "success",  label: "Success",  color: "#22c55e" },
  { value: "approval", label: "Approval", color: "#2563eb" },
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
      className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[12px] w-[280px] flex flex-col"
      style={{ boxShadow: "0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#f1f5f9] dark:border-[#1e293b]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#475569] dark:text-[#94a3b8]" />
          <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Filters</span>
          {hasAny && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563eb] text-white text-xs font-bold">
              {countActiveFilters(filters)}
            </span>
          )}
        </div>
        {hasAny && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs text-[#ef4444] font-medium hover:text-[#dc2626] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Type */}
        <div>
          <p className="text-sm font-bold tracking-[0.06em] uppercase text-[#94a3b8] dark:text-[#64748b] mb-2">Type</p>
          <div className="flex flex-col gap-1">
            {FILTER_TYPE_OPTIONS.map(({ value, label, color }) => {
              const active = filters.types.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggle("types", value)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] text-sm transition-colors w-full text-left ${
                    active ? "bg-[#f8fafc] dark:bg-[#0f172a]" : "hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"
                  }`}
                >
                  {/* Checkbox */}
                  <span
                    className={`flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors ${
                      active ? "border-transparent" : "border-[#cbd5e1]"
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
                  <span className={`text-sm ${active ? "font-medium text-[#0f172a] dark:text-[#f1f5f9]" : "text-[#475569] dark:text-[#94a3b8]"}`}>
                    {label}
                  </span>
                  <span className="ml-auto text-sm text-[#94a3b8] dark:text-[#64748b]">
                    {NOTIFICATIONS.filter((n) => n.type === value).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm font-bold tracking-[0.06em] uppercase text-[#94a3b8] dark:text-[#64748b] mb-2">Status</p>
          <div className="flex flex-col gap-1">
            {FILTER_STATUS_OPTIONS.map(({ value, label }) => {
              const active = filters.statuses.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggle("statuses", value)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] text-sm transition-colors w-full text-left ${
                    active ? "bg-[#f8fafc] dark:bg-[#0f172a]" : "hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors ${
                      active ? "bg-[#2563eb] border-[#2563eb]" : "border-[#cbd5e1]"
                    }`}
                  >
                    {active && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm ${active ? "font-medium text-[#0f172a] dark:text-[#f1f5f9]" : "text-[#475569] dark:text-[#94a3b8]"}`}>
                    {label}
                  </span>
                  <span className="ml-auto text-sm text-[#94a3b8] dark:text-[#64748b]">
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
          <p className="text-sm font-bold tracking-[0.06em] uppercase text-[#94a3b8] dark:text-[#64748b] mb-2">Tag</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map((tag) => {
              const active = filters.tags.includes(tag);
              // Find the type color for this tag
              const sample = NOTIFICATIONS.find((n) => n.tag === tag);
              const color = sample ? TYPE_CONFIG[sample.type].bar : "#64748b";
              return (
                <button
                  key={tag}
                  onClick={() => toggle("tags", tag)}
                  className={`px-2 py-[3px] rounded text-sm font-bold tracking-wide border transition-all ${
                    active
                      ? "text-white border-transparent"
                      : "text-[#475569] dark:text-[#94a3b8] bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] hover:border-[#cbd5e1]"
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

// ─── Active filter chips ───────────────────────────────────────────────────────

function FilterChips({ filters, onChange }) {
  const chips = [
    ...filters.types.map((v) => ({ key: "types", value: v, label: v.charAt(0).toUpperCase() + v.slice(1), color: TYPE_CONFIG[v].bar })),
    ...filters.statuses.map((v) => {
      const opt = FILTER_STATUS_OPTIONS.find((o) => o.value === v);
      return { key: "statuses", value: v, label: opt?.label ?? v, color: "#64748b" };
    }),
    ...filters.tags.map((v) => {
      const sample = NOTIFICATIONS.find((n) => n.tag === v);
      return { key: "tags", value: v, label: v, color: sample ? TYPE_CONFIG[sample.type].bar : "#64748b" };
    }),
  ];

  if (!chips.length) return null;

  return (
    <div className="flex items-center gap-2 px-6 py-2 flex-wrap border-b border-[#f1f5f9] dark:border-[#1e293b] bg-[#fafbfc] dark:bg-[#0f172a]">
      <span className="text-sm text-[#94a3b8] dark:text-[#64748b] font-medium flex-shrink-0">Active:</span>
      {chips.map(({ key, value, label, color }) => (
        <button
          key={`${key}-${value}`}
          onClick={() =>
            onChange((prev) => ({ ...prev, [key]: prev[key].filter((v) => v !== value) }))
          }
          className="flex items-center gap-1 px-2 py-[3px] rounded-full text-sm font-semibold text-white border border-transparent transition-opacity hover:opacity-80"
          style={{ backgroundColor: color }}
        >
          {label}
          <X size={10} strokeWidth={2.5} />
        </button>
      ))}
      <button
        onClick={() => onChange(EMPTY_FILTERS)}
        className="text-sm text-[#64748b] dark:text-[#94a3b8] hover:text-[#ef4444] font-medium transition-colors ml-1"
      >
        Clear all
      </button>
    </div>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ item, expanded, onToggle, onDismiss, onMarkRead }) {
  const cfg = TYPE_CONFIG[item.type];
  const { BadgeIcon } = item;

  return (
    <div
      className={`group relative rounded-[12px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] transition-all duration-200 cursor-pointer ${
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
            <div className="size-2.5 rounded-full bg-[#e2e8f0]" />
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
            className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-white dark:border-[#1e293b] flex items-center justify-center"
            style={{ backgroundColor: item.badgeBg }}
          >
            <BadgeIcon size={10} color="white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-sm text-[#0f172a] dark:text-[#f1f5f9] leading-snug ${item.unread ? "font-semibold" : "font-medium"}`}>
                {item.title}
              </p>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0.5 leading-snug">{item.desc}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[#94a3b8] dark:text-[#64748b] whitespace-nowrap">{item.time}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
                className="opacity-0 group-hover:opacity-100 flex items-center justify-center size-6 rounded-full text-[#94a3b8] dark:text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:text-[#475569] dark:hover:text-[#94a3b8] transition-all"
              >
                <X size={13} />
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
              <span className="text-xs text-[#94a3b8] dark:text-[#64748b] bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] px-2 py-[2px] rounded font-medium">
                persistent
              </span>
            )}
            {item.unread && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkRead(item.id); }}
                className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors ml-auto"
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
      <div className="size-16 rounded-full bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] flex items-center justify-center">
        <BellOff size={24} className="text-[#cbd5e1]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-medium text-[#475569] dark:text-[#94a3b8]">No notifications match</p>
        <p className="text-sm text-[#94a3b8] dark:text-[#64748b]">Try adjusting your filters</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage({ onNavigate, sidebarCollapsed, onToggleSidebar }) {
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
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} activePage="notifications" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader onToggleSidebar={onToggleSidebar} onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]" />
            <nav className="flex items-center gap-[10px]">
              <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">Settings</span>
              <ChevronRight size={14} className="text-[#94a3b8] dark:text-[#64748b]" />
              <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9]">Notifications</span>
            </nav>
          </div>
        </AppHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Page title + actions */}
          <div className="flex items-end justify-between px-6 pt-5 pb-0 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f1f5f9] tracking-[-0.6px] leading-8">
                Notifications
              </h1>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-5 mt-0.5">
                {unreadCount > 0 ? (
                  <span>
                    You have{" "}
                    <span className="font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{unreadCount} unread</span>{" "}
                    notification{unreadCount !== 1 ? "s" : ""}
                  </span>
                ) : "All notifications are read"}
              </p>
            </div>

            <div className="flex items-center gap-3 pb-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                >
                  <CheckCheck size={15} />
                  Mark all as read
                </button>
              )}

              {/* Filter button */}
              <div className="relative">
                <button
                  ref={filterBtnRef}
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`flex items-center gap-1.5 text-sm font-medium border rounded-[8px] px-3 py-1.5 transition-colors ${
                    filterOpen || activeFilterCount > 0
                      ? "bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1d4ed8]"
                      : "text-[#64748b] dark:text-[#94a3b8] border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]"
                  }`}
                >
                  <Filter size={14} />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#2563eb] text-xs font-bold">
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

          {/* Tabs */}
          <div className="flex items-center gap-0 px-6 mt-4 border-b border-[#e2e8f0] dark:border-[#334155] flex-shrink-0">
            {TABS.map(({ key, label }) => {
              const cnt    = tabCount(key);
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setExpandedId(null); }}
                  className={`relative flex items-center gap-1.5 mr-7 pb-3 text-sm font-medium transition-colors ${
                    active ? "text-[#2563eb]" : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]"
                  }`}
                >
                  {label}
                  {cnt > 0 && (
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ${
                      active ? "bg-[#2563eb] text-white" : "bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8]"
                    }`}>
                      {cnt}
                    </span>
                  )}
                  {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563eb] rounded-full" />}
                </button>
              );
            })}
          </div>

          {/* Active filter chips */}
          <FilterChips filters={filters} onChange={setFilters} />

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {displayItems.length === 0 ? (
              <EmptyState />
            ) : activeTab === "all" && activeFilterCount === 0 ? (
              // Grouped by type (only when no extra filters, to avoid empty groups)
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
              // Flat list when filters are active or on non-"all" tabs
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#e2e8f0] dark:border-[#334155] flex-shrink-0 bg-white dark:bg-[#1e293b]">
            <span className="text-sm text-[#94a3b8] dark:text-[#64748b]">
              {displayItems.length} notification{displayItems.length !== 1 ? "s" : ""}
              {activeFilterCount > 0 && (
                <span className="text-[#2563eb] font-medium"> (filtered)</span>
              )}
              {" "}· {displayItems.filter((n) => n.unread).length} unread
            </span>
            <div className="flex items-center gap-3 text-xs">
              {items.filter((n) => n.type === "critical" && n.unread).length > 0 && (
                <span className="text-[#ef4444] font-medium">
                  {items.filter((n) => n.type === "critical" && n.unread).length} critical
                </span>
              )}
              {items.filter((n) => n.type === "approval" && n.unread).length > 0 && (
                <span className="text-[#2563eb] font-medium">
                  {items.filter((n) => n.type === "approval" && n.unread).length} pending approval
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
