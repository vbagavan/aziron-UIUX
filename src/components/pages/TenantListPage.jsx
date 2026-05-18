import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Building2, Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Filter, Users, DollarSign, Plus, MoreVertical, Eye, Pencil, Trash2,
  ArrowUpDown, Download, CheckCircle2, Bot, GitBranch, Database, Plug2,
  BarChart2, Clock, Shield, AlertTriangle, CalendarDays,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { Toast, useToast } from "@/components/ui/Toast";
import {
  TENANTS, STATUS_CFG, PLAN_CFG,
} from "@/data/adminData";
import { getBaseTierPackage, computePackageMRR } from "@/data/packagesData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  ["var(--primary)","var(--primary)"],["var(--chart-chart-4)","var(--chart-chart-4)"],["var(--destructive)","var(--destructive)"],
  ["var(--warning)","var(--warning)"],["var(--success)","var(--success)"],["var(--info)","var(--info)"],
  ["var(--warning)","var(--warning)"],["var(--chart-chart-3)","var(--chart-chart-3)"],["var(--success)","var(--success)"],
  ["var(--success)","var(--success)"],
];
function avatarGrad(id) {
  const [f, t] = AVATAR_COLORS[id % AVATAR_COLORS.length];
  return `linear-gradient(135deg,${f},${t})`;
}

function formatRelativeDate(isoDate) {
  if (!isoDate) return "—";
  const then = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  const now = new Date();
  let diff = Math.max(0, now.getTime() - then.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function parseLocalDate(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Trial end → subscription renewal (list context). */
function planLicenceCaption(tenant) {
  if (tenant.trialEndsAt) {
    return { kind: "trial", iso: tenant.trialEndsAt, label: "Trial ends" };
  }
  if (tenant.subscriptionRenewalDate) {
    return { kind: "subscription", iso: tenant.subscriptionRenewalDate, label: "Renews" };
  }
  return null;
}

/** Calendar-day delta from local today to date (local noon parse). Negative = past. */
function calendarDaysUntil(isoDate) {
  const d = parseLocalDate(isoDate);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Exact calendar date for renewal column (e.g. 1 Sept 2026). */
function formatRenewalExactDate(isoDate) {
  const d = parseLocalDate(isoDate);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const EXPIRING_SOON_DAYS = 14;

/**
 * @returns {{
 *   statusLabel: string,
 *   primary: string,
 *   exactDate: string,
 *   sortMillis: number,
 *   tone: "trial" | "active" | "expiring" | "expired",
 * } | null}
 */
function renewalRowModel(tenant) {
  const cap = planLicenceCaption(tenant);
  if (!cap?.iso) return null;
  const days = calendarDaysUntil(cap.iso);
  if (days == null) return null;
  const exactDate = formatRenewalExactDate(cap.iso);
  const d = parseLocalDate(cap.iso);
  const sortMillis = d ? d.getTime() : Number.MAX_SAFE_INTEGER;

  if (cap.kind === "trial") {
    if (days < 0) {
      const n = -days;
      return {
        statusLabel: "Expired",
        primary: n === 1 ? "Trial ended 1 day ago" : `Trial ended ${n} days ago`,
        exactDate,
        sortMillis,
        tone: "expired",
      };
    }
    if (days === 0) {
      return {
        statusLabel: "Trial",
        primary: "Trial ends today",
        exactDate,
        sortMillis,
        tone: "trial",
      };
    }
    return {
      statusLabel: "Trial",
      primary: days === 1 ? "Trial ends in 1 day" : `Trial ends in ${days} days`,
      exactDate,
      sortMillis,
      tone: "trial",
    };
  }

  // subscription renewal
  if (days < 0) {
    const n = -days;
    return {
      statusLabel: "Expired",
      primary: n === 1 ? "Expired 1 day ago" : `Expired ${n} days ago`,
      exactDate,
      sortMillis,
      tone: "expired",
    };
  }
  if (days === 0) {
    return {
      statusLabel: "Expiring Soon",
      primary: "Renews today",
      exactDate,
      sortMillis,
      tone: "expiring",
    };
  }
  if (days <= EXPIRING_SOON_DAYS) {
    return {
      statusLabel: "Expiring Soon",
      primary: days === 1 ? "Renews in 1 day" : `Renews in ${days} days`,
      exactDate,
      sortMillis,
      tone: "expiring",
    };
  }
  return {
    statusLabel: "Active",
    primary: `Renews in ${days} days`,
    exactDate,
    sortMillis,
    tone: "active",
  };
}

/** Milliseconds for sorting renewal dates; missing dates sort last when ascending. */
function renewalSortMillis(tenant) {
  const m = renewalRowModel(tenant);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return m.sortMillis;
}

const PLAN_SORT = { trial: 0, standard: 1, professional: 2, enterprise: 3 };
const STATUS_SORT = { active: 0, trial: 1, suspended: 2, deleted: 3, churned: 4 };

/** Seat fill 0–100+ vs cap; null if unlimited cap or unknown members. */
function seatUsagePercent(memberCount, maxUsers) {
  if (memberCount == null || maxUsers == null || maxUsers <= 0) return null;
  return (memberCount / maxUsers) * 100;
}

/** Green if under 70%, yellow from 70% through 90%, red above 90%. */
function seatUsageTone(pct) {
  if (pct < 70) return "green";
  if (pct <= 90) return "yellow";
  return "red";
}

/** Mini bar + % for members vs seat cap (threshold-coloured). */
function MembersSeatUsageBar({ memberCount, maxUsers }) {
  const pct = seatUsagePercent(memberCount, maxUsers);
  if (pct == null) return null;
  const tone = seatUsageTone(pct);
  const fillPct = Math.min(100, pct);
  const barClass =
    tone === "green"
      ? "bg-success/100 dark:bg-emerald-400"
      : tone === "yellow"
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-destructive/100 dark:bg-red-400";
  const labelClass =
    tone === "green"
      ? "text-success dark:text-emerald-400"
      : tone === "yellow"
        ? "text-warning dark:text-amber-400"
        : "text-destructive dark:text-red-400";
  const rounded = Math.round(pct);
  return (
    <div className="flex items-center gap-2 min-w-0 mb-0.5">
      <div
        className="flex-1 min-w-[2.5rem] h-2 rounded-full bg-border dark:bg-border overflow-hidden"
        role="progressbar"
        aria-valuenow={memberCount}
        aria-valuemin={0}
        aria-valuemax={maxUsers}
        aria-label={`Seats used ${rounded} percent of cap`}
      >
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <span className={`text-[11px] font-semibold tabular-nums flex-shrink-0 leading-none ${labelClass}`}>
        {rounded}%
      </span>
    </div>
  );
}

const RENEWAL_TONE_TEXT = {
  trial: "text-sky-700 dark:text-sky-400",
  active: "text-success dark:text-emerald-400",
  expiring: "text-warning dark:text-amber-400",
  expired: "text-destructive dark:text-red-400",
};

function RenewalCell({ model }) {
  if (!model) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const toneClass = RENEWAL_TONE_TEXT[model.tone];
  return (
    <div
      role="group"
      className="min-w-0"
      aria-label={`${model.statusLabel}. ${model.primary}. ${model.exactDate}`}
    >
      <p className={`text-[11px] font-semibold leading-snug ${toneClass}`}>
        {model.primary}
      </p>
      <p className="mt-0.5 text-[10px] tabular-nums leading-tight text-muted-foreground dark:text-muted-foreground">
        {model.exactDate}
      </p>
    </div>
  );
}

// ─── Stats card ───────────────────────────────────────────────────────────────
/**
 * alertLevel: "danger" | "warning" | undefined
 * onClick: when set, card becomes a button that applies a table filter
 */
function StatCard({ icon: Icon, label, value, sub, color = "var(--primary)", onClick, alertLevel }) {
  const isZero = value === 0 || value === "0";
  const alertDotColor =
    alertLevel === "danger" ? "var(--destructive)" :
    alertLevel === "warning" ? "var(--warning)" : null;

  const borderCls =
    alertLevel === "danger" && !isZero
      ? "border-destructive/30 dark:border-border/70"
      : alertLevel === "warning" && !isZero
        ? "border-warning-ring dark:border-border/70"
        : "border-border dark:border-border";

  const bgCls =
    alertLevel === "danger" && !isZero
      ? "bg-muted dark:bg-card"
      : alertLevel === "warning" && !isZero
        ? "bg-warning/10 dark:bg-card"
        : "bg-card dark:bg-card";

  const interactiveCls = onClick
    ? "cursor-pointer hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px active:scale-[0.99] select-none"
    : "";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-xl p-4 flex-1 min-w-0 border transition-all duration-150 ${bgCls} ${borderCls} ${interactiveCls}`}
    >
      {alertDotColor && !isZero && (
        <span
          className="absolute top-2.5 right-2.5 size-1.5 rounded-full animate-pulse"
          style={{ background: alertDotColor }}
        />
      )}
      <div
        className="size-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium leading-none mb-1.5">{label}</p>
        <p className={`text-2xl font-bold leading-none ${isZero ? "text-foreground dark:text-muted-foreground" : "text-foreground dark:text-foreground"}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      {onClick && !isZero && (
        <ChevronRight size={13} className="text-foreground dark:text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );
}

// ─── Health & Plans chart card ────────────────────────────────────────────────
function TenantHealthChart({ tenants, newThisMonth, onFilterPlan, onFilterStatus }) {
  const total = tenants.length;

  const planData = [
    { key: "enterprise",   label: "Enterprise",   color: "var(--primary)" },
    { key: "professional", label: "Professional", color: "var(--chart-chart-4)" },
    { key: "standard",     label: "Standard",     color: "var(--info)" },
    { key: "trial",        label: "Trial",        color: "var(--warning)" },
  ].map(p => ({ ...p, count: tenants.filter(t => t.plan === p.key).length }));

  const statusData = [
    { key: "active",    label: "Active",    color: "var(--success)" },
    { key: "trial",     label: "Trial",     color: "var(--warning)", alert: "warning" },
    { key: "suspended", label: "Suspended", color: "var(--destructive)", alert: "danger"  },
  ].map(s => ({ ...s, count: tenants.filter(t => t.status === s.key).length }));

  // SVG donut — rotation-based (avoids dashoffset confusion)
  const r = 36, cx = 50, cy = 50;
  const C = 2 * Math.PI * r;
  const GAP_PX = 2;

  let startAngle = -90;
  const donutSegments = planData.map(p => {
    const spanAngle = total > 0 ? (p.count / total) * 360 : 0;
    const length = total > 0 ? Math.max(0, (p.count / total) * C - GAP_PX) : 0;
    const seg = { ...p, startAngle, length };
    startAngle += spanAngle;
    return seg;
  });

  return (
    <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl p-5">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-6 items-center">

        {/* ── Donut ── */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
            {/* Track ring */}
            <circle r={r} cx={cx} cy={cy} fill="none" stroke="var(--border)" strokeWidth="11" />
            {/* Coloured segments */}
            {donutSegments.map(s => s.count > 0 && (
              <circle
                key={s.key}
                r={r} cx={cx} cy={cy}
                fill="none"
                stroke={s.color}
                strokeWidth="11"
                strokeDasharray={`${s.length} ${C}`}
                strokeDashoffset={0}
                transform={`rotate(${s.startAngle} ${cx} ${cy})`}
              />
            ))}
          </svg>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[22px] font-bold text-foreground dark:text-foreground leading-none">{total}</span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-none">tenants</span>
          </div>
        </div>

        {/* ── Plan distribution ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-3">Plan Distribution</p>
          <div className="space-y-2.5">
            {planData.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => onFilterPlan(p.key)}
                className="w-full flex items-center gap-2.5 hover:opacity-75 transition-opacity text-left"
              >
                <span className="size-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground w-[78px] flex-shrink-0 truncate">{p.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted dark:bg-border overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${total > 0 ? (p.count / total) * 100 : 0}%`, background: p.color }} />
                </div>
                <span className={`text-xs font-bold tabular-nums w-4 text-right flex-shrink-0 ${
                  p.count === 0 ? "text-foreground dark:text-muted-foreground" : "text-foreground dark:text-foreground"
                }`}>{p.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tenant health ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-3">Tenant Health</p>
          <div className="space-y-2.5">
            {statusData.map(s => {
              const isAlert = s.alert && s.count > 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onFilterStatus(s.key)}
                  className="w-full flex items-center gap-2.5 hover:opacity-75 transition-opacity text-left"
                >
                  <span
                    className={`size-2 rounded-full flex-shrink-0 ${isAlert ? "animate-pulse" : ""}`}
                    style={{ background: s.color }}
                  />
                  <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground w-[78px] flex-shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted dark:bg-border overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%`, background: s.color }} />
                  </div>
                  <span className={`text-xs font-bold tabular-nums w-4 text-right flex-shrink-0 ${
                    s.count === 0 ? "text-foreground dark:text-muted-foreground" : "text-foreground dark:text-foreground"
                  }`}>{s.count}</span>
                </button>
              );
            })}
            <div className="flex items-center gap-2.5 pt-2 mt-0.5 border-t border-border dark:border-border">
              <CalendarDays size={10} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium text-muted-foreground flex-1">New this month</span>
              <span className={`text-xs font-bold tabular-nums ${
                newThisMonth === 0 ? "text-foreground dark:text-muted-foreground" : "text-foreground"
              }`}>{newThisMonth}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Stats section label with accent bar ─────────────────────────────────────
function StatSectionLabel({ label, accentColor, children }) {
  return (
    <div className="flex items-center justify-between mt-1">
      <div className="flex items-center gap-2">
        <div className="w-[3px] h-3.5 rounded-full" style={{ background: accentColor }} />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) {
    return <ArrowUpDown size={12} className="text-foreground opacity-45" aria-hidden />;
  }
  return sortDir === "asc"
    ? <ChevronUp size={12} className="text-primary" aria-hidden />
    : <ChevronDown size={12} className="text-primary" aria-hidden />;
}

// ─── Row actions (more menu) ─────────────────────────────────────────────────
function TenantRowActionsMenu({
  tenant,
  isDeleted,
  menuOpenId,
  setMenuOpenId,
  onViewTenant,
  onEditTenant,
  onRequestDelete,
}) {
  const open = menuOpenId === tenant.id;
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setMenuOpenId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setMenuOpenId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpenId(null);
        btnRef.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = [
        ...menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') ?? [],
      ];
      if (!items.length) return;
      e.preventDefault();
      const cur = document.activeElement;
      let idx = items.indexOf(cur);
      if (idx < 0) idx = e.key === "ArrowDown" ? -1 : 0;
      idx = (idx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[idx].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setMenuOpenId]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const first = menuRef.current.querySelector('[role="menuitem"]:not([disabled])');
    const id = requestAnimationFrame(() => first?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const close = () => setMenuOpenId(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: r.bottom + 4,
        right: window.innerWidth - r.right,
        minWidth: 160,
        zIndex: 9999,
      });
    }
    setMenuOpenId(open ? null : tenant.id);
  };

  return (
    <div className="relative flex justify-end" onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={e => { e.stopPropagation(); toggle(); }}
        className="size-8 inline-flex items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted dark:hover:bg-muted dark:text-muted-foreground transition-colors"
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className="bg-card dark:bg-card border border-border dark:border-border rounded-[10px] overflow-hidden py-1"
          style={{ ...menuStyle, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={e => { e.stopPropagation(); close(); onViewTenant?.(tenant); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            <Eye size={14} className="text-muted-foreground shrink-0" /> View
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={e => { e.stopPropagation(); close(); onEditTenant?.(tenant); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            <Pencil size={14} className="text-muted-foreground shrink-0" /> Edit
          </button>
          <div className="border-t border-border dark:border-border my-1" />
          <button
            type="button"
            role="menuitem"
            disabled={isDeleted}
            onClick={e => {
              e.stopPropagation();
              if (!isDeleted) {
                close();
                onRequestDelete?.();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10 dark:hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={14} className="shrink-0" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TenantListPage({ onNavigate, onViewTenant, onEditTenant, onCreateTenant }) {
  const [tenants, setTenants] = useState(TENANTS);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailStats, setShowDetailStats] = useState(true);
  const [actionsMenuTenantId, setActionsMenuTenantId] = useState(null);
  const [deleteConfirmTenant, setDeleteConfirmTenant] = useState(null);
  const { toasts, showToast, dismissToast } = useToast();
  const PER_PAGE = 8;

  const hasListFilters = Boolean(
    search.trim() || filterPlan !== "all" || filterStatus !== "all",
  );

  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return tenants.filter((t) => {
      if (search && !t.name.toLowerCase().includes(q) &&
          !t.domain.toLowerCase().includes(q) &&
          !(t.slug && t.slug.toLowerCase().includes(q))) return false;
      if (filterPlan !== "all" && t.plan !== filterPlan) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });
  }, [tenants, search, filterPlan, filterStatus]);

  const filtered = useMemo(() => {
    const copy = [...baseFiltered];
    copy.sort((a, b) => {
      let av, bv;
      if (sortKey === "name") {
        av = a.name.toLowerCase(); bv = b.name.toLowerCase();
      } else if (sortKey === "status") {
        av = STATUS_SORT[a.status] ?? 99; bv = STATUS_SORT[b.status] ?? 99;
      } else if (sortKey === "plan") {
        av = PLAN_SORT[a.plan] ?? 99; bv = PLAN_SORT[b.plan] ?? 99;
      } else if (sortKey === "renewal") {
        av = renewalSortMillis(a); bv = renewalSortMillis(b);
      } else if (sortKey === "members") {
        av = a.usage?.memberCount ?? a.usage?.seatsUsed ?? -1;
        bv = b.usage?.memberCount ?? b.usage?.seatsUsed ?? -1;
      } else if (sortKey === "created") {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else {
        av = a.name; bv = b.name;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return copy;
  }, [baseFiltered, sortKey, sortDir]);

  const activeCountAll = useMemo(
    () => tenants.filter((t) => t.status === "active").length,
    [tenants],
  );
  const totalMRRAll = useMemo(
    () => tenants.reduce((s, t) => s + computePackageMRR(t.id, t.usage?.tokensConsumed ?? 0), 0),
    [tenants],
  );
  const activeSaasSeatsAll = useMemo(
    () => tenants
      .filter((t) => t.status === "active")
      .reduce((s, t) => s + (getBaseTierPackage(t.id)?.assignment?.seats || t.seats || 0), 0),
    [tenants],
  );

  // Row 1 — High Level Overview
  const totalMembersAll = useMemo(
    () => tenants.reduce((s, t) => s + (t.usage?.memberCount ?? 0), 0),
    [tenants],
  );
  const totalAgentsAll = useMemo(
    () => tenants.reduce((s, t) => s + (t.usage?.agentCount ?? 0), 0),
    [tenants],
  );
  // Row 2 — Resource Usage
  const totalWorkflowsAll = useMemo(
    () => tenants.reduce((s, t) => s + (t.usage?.workflowCount ?? 0), 0),
    [tenants],
  );
  const totalVectorDbsAll = useMemo(
    () => tenants.reduce((s, t) => s + (t.usage?.vectorDbCount ?? 0), 0),
    [tenants],
  );
  const totalProvidersAll = useMemo(
    () => tenants.reduce((s, t) => s + (t.usage?.providerCount ?? 0), 0),
    [tenants],
  );
  const avgMembersPerTenant = useMemo(
    () => tenants.length ? Math.round(totalMembersAll / tenants.length) : 0,
    [tenants, totalMembersAll],
  );
  // Row 3 — Health & Plans
  const trialCountAll = useMemo(
    () => tenants.filter((t) => t.status === "trial").length,
    [tenants],
  );
  const enterpriseCountAll = useMemo(
    () => tenants.filter((t) => t.plan === "enterprise").length,
    [tenants],
  );
  const suspendedCountAll = useMemo(
    () => tenants.filter((t) => t.status === "suspended").length,
    [tenants],
  );
  const newThisMonthAll = useMemo(() => {
    const now = new Date();
    return tenants.filter((t) => {
      const d = parseLocalDate(t.createdAt);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [tenants]);

  const clearListFilters = useCallback(() => {
    setSearch("");
    setFilterPlan("all");
    setFilterStatus("all");
    setPage(1);
  }, []);

  const exportFilteredCsv = useCallback(() => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [
      "Name", "Slug", "Domain", "Plan", "Renewal",
      "Members", "Max users",
      "Created", "Status",
    ];
    const lines = [header.join(",")];
    for (const t of baseFiltered) {
      const members = t.usage?.memberCount ?? t.usage?.seatsUsed ?? "";
      const maxU = t.max_users == null ? "Unlimited" : t.max_users;
      const ren = renewalRowModel(t);
      const renCsv = ren ? `${ren.statusLabel} — ${ren.primary} — ${ren.exactDate}` : "";
      lines.push([
        esc(t.name), esc(t.slug), esc(t.domain), esc(t.plan),
        esc(renCsv),
        esc(members), esc(maxU),
        esc(t.createdAt),
        esc(t.status),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tenants-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${baseFiltered.length} row${baseFiltered.length === 1 ? "" : "s"} to CSV.`);
  }, [baseFiltered, showToast]);

  const confirmDeleteTenant = useCallback(() => {
    if (!deleteConfirmTenant) return;
    const t = deleteConfirmTenant;
    const prevStatus = t.status;
    const id = t.id;
    const name = t.name;
    setDeleteConfirmTenant(null);
    setTenants((prev) => prev.map((x) => (x.id === id ? { ...x, status: "deleted" } : x)));
    showToast(`“${name}” marked as deleted.`, {
      duration: 8000,
      actionLabel: "Undo",
      onAction: () => {
        setTenants((prev) => prev.map((x) => (x.id === id ? { ...x, status: prevStatus } : x)));
      },
    });
  }, [deleteConfirmTenant, showToast]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setActionsMenuTenantId(null);
  }, [page, search, filterPlan, filterStatus]);

  const sort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const COL = [
    { key: "name",     label: "Name",     width: "22%", sortable: true },
    { key: "plan",     label: "Plan",     width: "12%", sortable: true },
    { key: "renewal",  label: "Renewal",  width: "15%", sortable: true },
    { key: "members",  label: "Members",  width: "18%", sortable: true },
    { key: "created",  label: "Created",  width: "11%", sortable: true },
    { key: "status",   label: "Status",   width: "11%", sortable: true },
    { key: null,       label: "Actions",  width: "11%", sortable: false },
  ];

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="tenants" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border dark:bg-border" />
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">Admin</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm text-foreground dark:text-foreground font-medium">Tenants</span>
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Page header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-foreground tracking-tight">Tenants</h1>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                Manage all customer organisations, subscriptions, and overrides.
              </p>
            </div>
            <button onClick={() => onNavigate?.("tenant-create")}
              className="flex items-center gap-2 h-9 px-4 rounded-[8px] bg-primary hover:bg-primary text-white text-sm font-semibold transition-colors flex-shrink-0">
              <Plus size={15} /> Create Tenant
            </button>
          </div>

          {/* Stats dashboard — platform-wide; not affected by list filters/search */}
          <div className="flex flex-col gap-2">
            {/* Row 1 — High Level Overview */}
            <StatSectionLabel label="High Level Overview" accentColor="var(--primary)">
              <button
                onClick={() => setShowDetailStats(v => !v)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground transition-colors"
              >
                {showDetailStats
                  ? <><ChevronUp size={12} /> Show less</>
                  : <><ChevronDown size={12} /> Show more</>}
              </button>
            </StatSectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Building2}    label="Total Tenants"  value={tenants.length}                   sub={`${activeCountAll} active`}  color="var(--primary)" />
              <StatCard icon={CheckCircle2} label="Active Tenants" value={activeCountAll}                   sub="Currently active"            color="var(--success)"
                onClick={() => { setFilterStatus("active"); setPage(1); setShowFilters(false); }} />
              <StatCard icon={Users}        label="Total Members"  value={totalMembersAll.toLocaleString()} sub="Across all tenants"          color="var(--info)" />
              <StatCard icon={Bot}          label="Total Agents"   value={totalAgentsAll.toLocaleString()}  sub="Deployed platform-wide"      color="var(--warning)" />
            </div>

            {showDetailStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-max">
                {/* Row 2 — Resource Usage */}
                <div className="flex flex-col">
                  <StatSectionLabel label="Resource Usage" accentColor="var(--chart-chart-4)" />
                  <div className="grid grid-cols-2 gap-3 mt-3 flex-1">
                    <StatCard icon={GitBranch} label="Total Workflows"      value={totalWorkflowsAll.toLocaleString()}    sub="Active workflow definitions" color="var(--chart-chart-4)" />
                    <StatCard icon={Database}  label="Total Vector DBs"     value={totalVectorDbsAll.toLocaleString()}    sub="Knowledge hub stores"        color="var(--info)" />
                    <StatCard icon={Plug2}     label="Total Providers"      value={totalProvidersAll.toLocaleString()}    sub="Connected integrations"      color="var(--warning)" />
                    <StatCard icon={BarChart2} label="Avg Members / Tenant" value={avgMembersPerTenant.toLocaleString()}  sub="Mean across all tenants"     color="var(--success)" />
                  </div>
                </div>

                {/* Row 3 — Health & Plans */}
                <div className="flex flex-col">
                  <StatSectionLabel label="Health &amp; Plans" accentColor="var(--destructive)" />
                  <div className="mt-3 flex-1">
                    <TenantHealthChart
                      tenants={tenants}
                      newThisMonth={newThisMonthAll}
                      onFilterPlan={(plan) => { setFilterPlan(plan); setPage(1); setShowFilters(false); }}
                      onFilterStatus={(status) => { setFilterStatus(status); setPage(1); setShowFilters(false); }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filter bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search tenants…"
                  className="w-full pl-8 pr-8 h-9 text-sm rounded-[8px] border border-border dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-[8px] border text-sm font-medium transition-colors ${
                  showFilters || hasListFilters
                    ? "border-border bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary dark:border-primary/20"
                    : "border-border dark:border-border bg-card dark:bg-card text-muted-foreground dark:text-muted-foreground"
                }`}>
                <Filter size={13} /> Filters
                {hasListFilters && (
                  <span className="size-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {(filterPlan !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0) + (search.trim() ? 1 : 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={exportFilteredCsv}
                className="flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-border dark:border-border bg-card dark:bg-card text-sm font-medium text-muted-foreground dark:text-muted-foreground hover:border-border hover:text-primary transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            {/* Filter pills */}
            {showFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Plan",       state: filterPlan,   set: setFilterPlan,   opts: [["all","All"], ["trial","Trial"], ["standard","Standard"], ["professional","Professional"], ["enterprise","Enterprise"]] },
                  { label: "Status",     state: filterStatus, set: setFilterStatus, opts: [["all","All"], ["active","Active"], ["trial","Trial"], ["suspended","Suspended"], ["deleted","Deleted"]] },
                ].map(({ label, state, set, opts }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground font-medium">{label}:</span>
                    <div className="flex gap-1">
                      {opts.map(([val, lbl]) => (
                        <button key={val} onClick={() => { set(val); setPage(1); }}
                          className={`h-6 px-2.5 rounded-full text-xs font-medium transition-colors ${
                            state === val
                              ? "bg-primary text-white"
                              : "bg-card dark:bg-card border border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:border-border"
                          }`}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  {COL.map((c, i) => <col key={i} style={{ width: c.width }} />)}
                </colgroup>
                <thead className="sticky top-0 z-20">
                  <tr className="border-b border-border dark:border-border bg-card dark:bg-card">
                    {COL.map((col, i) => (
                      <th key={i}
                        className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground dark:text-muted-foreground whitespace-nowrap shadow-[inset_0_-1px_0_0_rgb(241_245_249)] dark:shadow-[inset_0_-1px_0_0_rgb(51_65_85)] ${
                          col.label === "Actions" ? "text-right" : "text-left"
                        } ${col.sortable ? "cursor-pointer select-none hover:text-foreground dark:hover:text-foreground" : ""}`}
                        onClick={() => col.sortable && col.key && sort(col.key)}>
                        <div className={`flex items-center gap-1 ${col.label === "Actions" ? "justify-end" : ""}`}>
                          {col.label}
                          {col.sortable && col.key && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">No tenants match your filters.</p>
                        {hasListFilters ? (
                          <button
                            type="button"
                            onClick={clearListFilters}
                            className="mt-4 inline-flex h-9 items-center rounded-[8px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary transition-colors"
                          >
                            Clear filters
                          </button>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">Try adjusting search or create a new tenant.</p>
                        )}
                      </td>
                    </tr>
                  ) : paged.map(t => {
                    const members = t.usage?.memberCount ?? t.usage?.seatsUsed;
                    const maxCap = t.max_users == null ? "Unlimited" : t.max_users.toLocaleString();
                    const statusCfg = STATUS_CFG[t.status] || STATUS_CFG.active;
                    const planCfg = PLAN_CFG[t.plan];
                    const renewal = renewalRowModel(t);
                    const isDeleted = t.status === "deleted";
                    return (
                      <tr key={t.id}
                        onClick={() => !isDeleted && onViewTenant?.(t)}
                        className={`border-b border-border dark:border-border transition-colors ${
                          isDeleted
                            ? "opacity-50 bg-background"
                            : "hover:bg-muted dark:hover:bg-muted cursor-pointer"
                        }`}>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                              style={{ background: avatarGrad(t.id) }}>
                              {initials(t.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground dark:text-foreground leading-tight truncate">{t.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">{t.slug || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          {planCfg ? (
                            <span className="inline-flex w-fit items-center h-5 px-2 rounded-full text-xs font-semibold"
                              style={{ background: planCfg.bg, color: planCfg.text }}>
                              {planCfg.label}
                            </span>
                          ) : (
                            <span className="inline-flex w-fit items-center h-5 px-2 rounded-full text-xs font-semibold bg-muted dark:bg-border text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <RenewalCell model={renewal} />
                        </td>
                        <td className="px-3 py-3 align-middle" title="Member count and seat cap">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <MembersSeatUsageBar memberCount={members} maxUsers={t.max_users} />
                            <p className="text-sm tabular-nums leading-tight text-foreground dark:text-foreground">
                              <span className="font-semibold">
                                {members != null ? members.toLocaleString() : "—"}
                              </span>
                              <span className="text-foreground dark:text-muted-foreground font-normal mx-1">/</span>
                              <span className={`font-medium ${t.max_users == null ? "text-muted-foreground dark:text-muted-foreground text-xs" : "text-muted-foreground dark:text-muted-foreground"}`}>
                                {maxCap}
                              </span>
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground dark:text-muted-foreground text-xs align-middle whitespace-nowrap">
                          {formatRelativeDate(t.createdAt)}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-xs font-semibold"
                            style={{ background: statusCfg.bg, color: statusCfg.badgeText ?? statusCfg.text }}>
                            <span className="size-1.5 rounded-full flex-shrink-0"
                              style={{ background: statusCfg.dot }} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right align-middle">
                          <TenantRowActionsMenu
                            tenant={t}
                            isDeleted={isDeleted}
                            menuOpenId={actionsMenuTenantId}
                            setMenuOpenId={setActionsMenuTenantId}
                            onViewTenant={onViewTenant}
                            onEditTenant={onEditTenant}
                            onRequestDelete={() => setDeleteConfirmTenant(t)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-border">
              <span className="text-xs text-muted-foreground">
                {filtered.length} tenant{filtered.length !== 1 ? "s" : ""}
                {filtered.length !== tenants.length && <span className="text-primary font-medium"> (filtered)</span>}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="size-7 flex items-center justify-center rounded-[6px] border border-border dark:border-border text-muted-foreground hover:bg-muted dark:hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`size-7 flex items-center justify-center rounded-[6px] text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-muted dark:hover:bg-muted"
                    }`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="size-7 flex items-center justify-center rounded-[6px] border border-border dark:border-border text-muted-foreground hover:bg-muted dark:hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteConfirmTenant && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4"
          role="presentation"
          onClick={() => setDeleteConfirmTenant(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tenant-delete-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl dark:border-border dark:bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tenant-delete-title" className="text-lg font-semibold text-foreground dark:text-foreground">
              Delete tenant?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <span className="font-medium text-foreground dark:text-foreground">{deleteConfirmTenant.name}</span>
              {" "}will be marked as deleted. You can undo from the banner for a few seconds.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTenant(null)}
                className="h-9 rounded-[8px] border border-border bg-card px-4 text-sm font-medium text-muted-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTenant}
                className="h-9 rounded-[8px] bg-muted px-4 text-sm font-semibold text-white hover:bg-destructive transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          duration={t.duration}
          actionLabel={t.actionLabel}
          onAction={t.onAction}
          onDismiss={() => dismissToast(t.id)}
        />
      ))}
    </div>
  );
}
