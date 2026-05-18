import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ClipboardList, Users, FileText, CheckCircle2,
  Search, Download, Send, ChevronDown,
  MoreVertical, Eye, EyeOff, Mail, Clock, Calendar, Building2, X,
  TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, BarChart2, FileSpreadsheet, Filter, Zap,
  ArrowRight, FileDown, Play, UserPlus,
  Activity,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

/** Semantic tokens for Recharts (SVG resolves CSS variables). */
const CHART = {
  grid: "var(--border)",
  tick: "var(--muted-foreground)",
  primary: "var(--primary)",
  primaryMuted: "var(--chart-chart-2)",
  tooltipBorder: "var(--border)",
};

const METRIC_VARIANT = {
  primary:     { icon: "text-primary",     iconBg: "bg-primary/10",     bar: "bg-primary" },
  success:     { icon: "text-success",     iconBg: "bg-success/10",     bar: "bg-success" },
  warning:     { icon: "text-warning",     iconBg: "bg-warning/10",     bar: "bg-warning" },
  destructive: { icon: "text-destructive", iconBg: "bg-destructive/10", bar: "bg-destructive" },
  info:        { icon: "text-info",        iconBg: "bg-info/10",        bar: "bg-info" },
  muted:       { icon: "text-muted-foreground", iconBg: "bg-muted", bar: "bg-muted-foreground" },
};

const AVATAR_STYLES = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-chart-chart-4/15 text-chart-chart-4",
  "bg-destructive/15 text-destructive",
  "bg-accent text-accent-foreground",
  "bg-chart-chart-3/15 text-chart-chart-3",
  "bg-chart-chart-2/15 text-chart-chart-2",
  "bg-chart-chart-5/15 text-chart-chart-5",
];

// ─── Mock data ────────────────────────────────────────────────────────────────

const DEPARTMENTS = ["Engineering", "Marketing", "Finance", "HR", "Operations", "Sales", "Legal", "Product"];

const EMPLOYEES = [
  { id: 1,  name: "Alice Monroe",    dept: "Engineering", status: "approved",            submitted: "2026-05-01", deadline: "2026-05-15", email: "alice@meridian.com",  cycle: 1, plan: "Family",     cost: 820 },
  { id: 2,  name: "Brian Kwon",      dept: "Marketing",   status: "pending",             submitted: null,         deadline: "2026-05-15", email: "brian@meridian.com",  cycle: 1, plan: "Individual",  cost: 0   },
  { id: 3,  name: "Carla Ruiz",      dept: "Finance",     status: "under_clarification", submitted: "2026-05-03", deadline: "2026-05-15", email: "carla@meridian.com",  cycle: 1, plan: "Couple",      cost: 610 },
  { id: 4,  name: "David Chen",      dept: "HR",          status: "submitted",           submitted: "2026-05-07", deadline: "2026-05-15", email: "david@meridian.com",  cycle: 1, plan: "Individual",  cost: 340 },
  { id: 5,  name: "Eva Larsson",     dept: "Operations",  status: "approved",            submitted: "2026-04-29", deadline: "2026-05-15", email: "eva@meridian.com",    cycle: 1, plan: "Family",      cost: 820 },
  { id: 6,  name: "Frank Osei",      dept: "Sales",       status: "draft",               submitted: null,         deadline: "2026-05-15", email: "frank@meridian.com",  cycle: 1, plan: "—",           cost: 0   },
  { id: 7,  name: "Grace Tanner",    dept: "Legal",       status: "pending",             submitted: null,         deadline: "2026-04-30", email: "grace@meridian.com",  cycle: 2, plan: "—",           cost: 0   },
  { id: 8,  name: "Henry Park",      dept: "Product",     status: "approved",            submitted: "2026-04-28", deadline: "2026-05-15", email: "henry@meridian.com",  cycle: 1, plan: "Couple",      cost: 610 },
  { id: 9,  name: "Iris Nakamura",   dept: "Engineering", status: "submitted",           submitted: "2026-05-10", deadline: "2026-05-15", email: "iris@meridian.com",   cycle: 1, plan: "Individual",  cost: 340 },
  { id: 10, name: "James Okafor",    dept: "Marketing",   status: "not_accessed",        submitted: null,         deadline: "2026-05-15", email: "james@meridian.com",  cycle: 1, plan: "—",           cost: 0   },
  { id: 11, name: "Kira Patel",      dept: "Finance",     status: "approved",            submitted: "2026-05-02", deadline: "2026-05-15", email: "kira@meridian.com",   cycle: 1, plan: "Family",      cost: 820 },
  { id: 12, name: "Leo Fernandez",   dept: "HR",          status: "closed",              submitted: "2026-04-20", deadline: "2026-05-01", email: "leo@meridian.com",    cycle: 2, plan: "Individual",  cost: 340 },
  { id: 13, name: "Maya Johansson",  dept: "Operations",  status: "pending",             submitted: null,         deadline: "2026-05-15", email: "maya@meridian.com",   cycle: 1, plan: "—",           cost: 0   },
  { id: 14, name: "Nathan Torres",   dept: "Sales",       status: "under_clarification", submitted: "2026-05-05", deadline: "2026-05-15", email: "nathan@meridian.com", cycle: 1, plan: "Couple",      cost: 610 },
  { id: 15, name: "Olivia Nguyen",   dept: "Legal",       status: "submitted",           submitted: "2026-05-09", deadline: "2026-05-15", email: "olivia@meridian.com", cycle: 1, plan: "Individual",  cost: 340 },
  { id: 16, name: "Peter Walsh",     dept: "Product",     status: "not_accessed",        submitted: null,         deadline: "2026-05-15", email: "peter@meridian.com",  cycle: 1, plan: "—",           cost: 0   },
  { id: 17, name: "Quinn Adeyemi",   dept: "Engineering", status: "approved",            submitted: "2026-04-27", deadline: "2026-05-15", email: "quinn@meridian.com",  cycle: 1, plan: "Family",      cost: 820 },
  { id: 18, name: "Rosa Kim",        dept: "Marketing",   status: "draft",               submitted: null,         deadline: "2026-05-15", email: "rosa@meridian.com",   cycle: 1, plan: "—",           cost: 0   },
  { id: 19, name: "Sam Eriksson",    dept: "Finance",     status: "submitted",           submitted: "2026-04-28", deadline: "2026-04-30", email: "sam@meridian.com",    cycle: 2, plan: "—",           cost: 0   },
  { id: 20, name: "Tara Mitchell",   dept: "HR",          status: "closed",              submitted: "2026-04-18", deadline: "2026-05-01", email: "tara@meridian.com",   cycle: 2, plan: "Couple",      cost: 610 },
];

const LOCATION_COST = [
  { location: "Bangalore",  short: "BLR", employees: 72, enrolled: 61, cost: 412000, prev: 387000 },
  { location: "Chennai",    short: "MAA", employees: 48, enrolled: 38, cost: 264000, prev: 249000 },
  { location: "Hyderabad",  short: "HYD", employees: 55, enrolled: 44, cost: 298000, prev: 311000 },
  { location: "Noida",      short: "NOI", employees: 39, enrolled: 29, cost: 197000, prev: 181000 },
  { location: "Kolkata",    short: "CCU", employees: 34, enrolled: 25, cost: 151000, prev: 143000 },
];

/** Sync strip only (replace with live fetch). */
const DASHBOARD_SUMMARY = {
  last_sync_timestamp: "2026-05-15T08:00:00Z",
  last_sync_status: "SUCCESS",
  emails_sent_last_sync: 18,
};

const CYCLE_TREND = [
  { label: "Feb C1", cost: 1120, submissions: 98  },
  { label: "Feb C2", cost: 1145, submissions: 112 },
  { label: "Mar C1", cost: 1180, submissions: 119 },
  { label: "Mar C2", cost: 1156, submissions: 107 },
  { label: "Apr C1", cost: 1210, submissions: 124 },
  { label: "Apr C2", cost: 1228, submissions: 131 },
  { label: "May C1", cost: 1241, submissions: 127 },
];

const STATUS_META = {
  approved:            { label: "Approved",            pill: "bg-success/10 text-success border-success-ring",             dot: "bg-success" },
  submitted:           { label: "Submitted",           pill: "bg-info/10 text-info border-info-ring",                     dot: "bg-info" },
  under_clarification: { label: "Under Clarification", pill: "bg-warning/10 text-warning border-warning-ring",           dot: "bg-warning" },
  pending:             { label: "Pending",             pill: "bg-warning/10 text-warning-foreground border-warning-ring", dot: "bg-warning" },
  closed:              { label: "Closed",              pill: "bg-muted text-muted-foreground border-border",             dot: "bg-muted-foreground" },
  draft:               { label: "Draft",               pill: "bg-accent text-accent-foreground border-border",           dot: "bg-primary" },
  not_accessed:        { label: "Not Accessed",        pill: "bg-warning/10 text-warning border-warning-ring",           dot: "bg-warning" },
  expired:             { label: "Expired",             pill: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  rejected:            { label: "Rejected",            pill: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
};

/** True if the employee has opened the invitation link (demo: everyone except `not_accessed`). */
function invitationOpened(emp) {
  if (typeof emp.invitationOpened === "boolean") return emp.invitationOpened;
  return emp.status !== "not_accessed";
}

function computeEnrollmentDashboardMetrics(employees) {
  const total = employees.length;
  const opened = employees.filter(invitationOpened).length;
  const notOpened = employees.filter((e) => !invitationOpened(e)).length;
  const pending = employees.filter((e) => e.status === "pending").length;
  const draft = employees.filter((e) => e.status === "draft").length;
  const completed = employees.filter((e) => e.status === "approved" || e.status === "closed").length;
  const underReview = employees.filter((e) => e.status === "submitted").length;
  const underProcessing = employees.filter((e) => e.status === "under_clarification").length;
  const notOpenedBar = employees.filter((e) => e.status === "not_accessed").length;
  const inPipeline = employees.filter((e) => e.status === "submitted" || e.status === "under_clarification").length;
  const progressSegments = [
    { key: "not_opened", label: "Not opened invitation", count: notOpenedBar, className: "bg-muted-foreground" },
    { key: "pending", label: "Pending", count: pending, className: "bg-warning" },
    { key: "draft", label: "Draft saved", count: draft, className: "bg-chart-chart-4" },
    { key: "pipeline", label: "Under review / clarification", count: inPipeline, className: "bg-primary" },
    { key: "completed", label: "Completed", count: completed, className: "bg-success" },
  ];
  const partitionSum = progressSegments.reduce((a, s) => a + s.count, 0);
  return {
    total,
    opened,
    notOpened,
    pending,
    draft,
    completed,
    underReview,
    underProcessing,
    progressSegments,
    partitionSum,
  };
}

function avatarStyle(id) {
  return AVATAR_STYLES[id % AVATAR_STYLES.length];
}
function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function EmployeeAvatar({ id, name, className }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none ring-1 ring-border/50",
        avatarStyle(id),
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
function fmtCurrency(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000)    return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}
function fmtCurrencyFull(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtSyncTimestamp(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatusPill({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none whitespace-nowrap border",
      m.pill,
    )}>
      <span className={cn("size-1.5 rounded-full flex-shrink-0", m.dot)} />
      {m.label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sub, variant = "primary", trend, onClick, active }) {
  const v = METRIC_VARIANT[variant] ?? METRIC_VARIANT.primary;
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-2xl p-4 flex-1 min-w-0 relative overflow-hidden transition-all cursor-default border bg-card",
        active ? "ring-2 ring-ring border-primary/30 bg-primary/5" : "border-border",
      )}
    >
      <div className={cn("size-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", v.iconBg)}>
        <Icon size={17} className={v.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium leading-none mb-1.5">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </div>
      {trend != null && (
        <div className={cn(
          "flex items-center gap-0.5 text-[11px] font-semibold mt-1",
          trend >= 0 ? "text-success" : "text-destructive",
        )}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend)}%
        </div>
      )}
      <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-20", v.bar)} />
    </div>
  );
}

function SyncStatusBar({ summary }) {
  const success = summary.last_sync_status === "SUCCESS";
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-card px-4 py-3 mb-5"
      role="status"
      aria-label="Last sync status"
    >
      <div className="flex items-center gap-2 min-w-0">
        <RefreshCw size={14} className="text-muted-foreground flex-shrink-0" aria-hidden />
        <span className="text-xs text-muted-foreground">Last sync</span>
        <span className="text-xs font-semibold text-foreground">{fmtSyncTimestamp(summary.last_sync_timestamp)}</span>
      </div>
      <div className="h-4 w-px bg-border hidden sm:block" aria-hidden />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Status</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
            success
              ? "bg-success/10 text-success border-success-ring"
              : "bg-destructive/10 text-destructive border-destructive/30",
          )}
        >
          <span className={cn("size-1.5 rounded-full", success ? "bg-success" : "bg-destructive")} />
          {summary.last_sync_status}
        </span>
      </div>
      <div className="h-4 w-px bg-border hidden sm:block" aria-hidden />
      <div className="flex items-center gap-1.5">
        <Mail size={13} className="text-muted-foreground" aria-hidden />
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{summary.emails_sent_last_sync}</span>
          {" "}emails sent on last sync
        </span>
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter]   = useState("all");
  const [page, setPage]               = useState(1);
  const PER_PAGE = 8;

  const metrics = useMemo(() => computeEnrollmentDashboardMetrics(EMPLOYEES), []);

  const filtered = EMPLOYEES.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || e.status === statusFilter;
    const matchD = deptFilter   === "all" || e.dept   === deptFilter;
    return matchQ && matchS && matchD;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const completionPct = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Primary stats: invitations + funnel */}
      <div>
        <SectionHeading icon={Send} label="Invitation overview" />
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total invitations sent</p>
          <p className="mt-1 text-3xl sm:text-4xl font-bold tabular-nums text-foreground">{metrics.total}</p>
          <p className="mt-1 text-sm text-muted-foreground">All employees included in this open enrollment cycle.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={Eye} label="Opened invitation link" value={metrics.opened} sub="At least one visit recorded" variant="primary" />
          <MetricCard icon={EyeOff} label="Not yet opened" value={metrics.notOpened} sub="No recorded visit" variant="muted" />
          <MetricCard icon={Clock} label="Pending" value={metrics.pending} sub="Awaiting employee action" variant="warning" />
          <MetricCard icon={FileText} label="Draft saved" value={metrics.draft} sub="In progress, not submitted" variant="info" />
          <MetricCard icon={CheckCircle2} label="Completed" value={metrics.completed} sub="Approved or closed" variant="success" />
        </div>
      </div>

      <SyncStatusBar summary={DASHBOARD_SUMMARY} />

      {/* Processing Metrics */}
      <div>
        <SectionHeading icon={ClipboardList} label="Processing metrics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <MetricCard icon={Activity} label="Under processing" value={metrics.underProcessing} sub="Clarification or data follow-up" variant="warning" />
          <MetricCard icon={FileText} label="Under review" value={metrics.underReview} sub="Submitted, awaiting review" variant="primary" />
        </div>
      </div>

      {/* Progress bar — partitions match invitation / workflow stages above */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Overall enrollment progress</p>
            <p className="text-xs text-muted-foreground mt-0.5">Open Enrollment 2026 · Deadline May 15, 2026</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">{completionPct}%</span>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>
        <div className="flex gap-0.5 h-3 rounded-full overflow-hidden w-full">
          {metrics.progressSegments.map(({ key, count, className }) =>
            count > 0 ? (
              <div
                key={key}
                className={cn("h-full", className)}
                style={{ width: `${(count / metrics.partitionSum) * 100}%` }}
                title={`${key}: ${count}`}
              />
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          {metrics.progressSegments.map(({ key, label, count, className }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", className)} />
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-semibold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollment table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Enrollment Records</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search employees…"
                className="h-8 pl-7 pr-3 rounded-xl text-xs bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-8 pl-3 pr-7 rounded-xl text-xs bg-muted border border-border text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer">
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                className="h-8 pl-3 pr-7 rounded-xl text-xs bg-muted border border-border text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer">
                <option value="all">All Depts</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Employee ID", "Employee", "Department", "Status", "Deadline", "Actions"].map(h => (
                  <th key={h} className={`px-5 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">No records match your filters.</td></tr>
              ) : paginated.map(emp => (
                <tr key={emp.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">{String(emp.id).padStart(4, "0")}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <EmployeeAvatar id={emp.id} name={emp.name} />
                      <div>
                        <p className="text-[13px] font-semibold text-foreground leading-none">{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 size={11} className="text-muted-foreground" />{emp.dept}</span></td>
                  <td className="px-5 py-3"><StatusPill status={emp.status} /></td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={11} className="text-muted-foreground" />
                      {new Date(emp.deadline + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Eye size={13} /></button>
                      <button className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"><Mail size={13} /></button>
                      <button className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"><MoreVertical size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`size-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Cycle Processing ────────────────────────────────────────────────────

function CycleTab() {
  const currentCycle = {
    number: 1, label: "Cycle 1 — May 2026",
    start: "May 1", end: "May 15", cutoff: "May 15, 2026",
    daysRemaining: 1, submissionsInBatch: 12, prevTotal: 18,
    completionPct: 67, status: "active",
  };
  const nextCycle = { label: "Cycle 2 — May 2026", start: "May 15", end: "May 31", starts: "May 15, 2026" };

  const batchQueue = EMPLOYEES.filter(e => ["submitted", "under_clarification"].includes(e.status));

  return (
    <div className="space-y-5">
      {/* Current cycle banner */}
      <div className="rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary to-primary/80" >
        <div className="px-6 py-5 flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-card/10 flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">Current Active Cycle</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/20 text-success border border-green-400/30">LIVE</span>
              </div>
              <h2 className="text-xl font-bold text-white">{currentCycle.label}</h2>
              <p className="text-sm text-primary/80 mt-1">
                {currentCycle.start} → {currentCycle.end} · Processing begins on cutoff: <strong className="text-white">{currentCycle.cutoff}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{currentCycle.daysRemaining}</p>
              <p className="text-xs text-primary/80 mt-0.5">day{currentCycle.daysRemaining !== 1 ? "s" : ""} to cutoff</p>
            </div>
            <div className="w-px h-10 bg-card/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{currentCycle.submissionsInBatch}</p>
              <p className="text-xs text-primary/80 mt-0.5">in this batch</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-primary/80">Cycle completion</span>
            <span className="text-xs font-semibold text-white">{currentCycle.completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-card/20">
            <div className="h-2 rounded-full bg-card transition-all duration-500" style={{ width: `${currentCycle.completionPct}%` }} />
          </div>
        </div>
      </div>

      {/* Cycle metrics */}
      <div>
        <SectionHeading icon={BarChart2} label="Cycle Metrics" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard icon={Users}        label="Current Cycle Volume" value={currentCycle.submissionsInBatch}
            sub="Submissions queued"                               variant="primary" />
          <MetricCard icon={BarChart2}    label="vs Previous Cycle"   value={currentCycle.prevTotal}
            sub="Apr C2 submissions"                              variant="info"
            trend={Math.round((currentCycle.submissionsInBatch - currentCycle.prevTotal) / currentCycle.prevTotal * 100)} />
          <MetricCard icon={CheckCircle2} label="Cycle Completion"    value={`${currentCycle.completionPct}%`}
            sub="Of expected submissions"                         variant="success" />
          <MetricCard icon={DollarSign}   label="Est. Cycle Cost"     value="$284k"
            sub="Projected insurance cost"                        variant="warning" />
        </div>
      </div>

      {/* Business logic callout */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning/10 border border-warning-ring">
        <div className="size-8 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Clock size={15} className="text-warning" />
        </div>
        <div>
          <p className="text-sm font-semibold text-warning-foreground">Batch Processing Logic</p>
          <p className="text-xs text-warning mt-1 leading-relaxed">
            All submissions received between <strong>May 1 – May 15</strong> are batched together.
            Even if an employee submits on May 2nd, their request will not be processed until the <strong>cycle cutoff on May 15</strong>.
            This consolidates requests for operational and financial processing.
          </p>
        </div>
      </div>

      {/* Cycle timeline */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm font-semibold text-foreground mb-4">May 2026 — Processing Timeline</p>
        <div className="relative">
          {/* Track */}
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-border rounded-full" />
          <div className="flex items-start justify-between relative">
            {[
              { day: "May 1",  label: "C1 Opens",        state: "done",    sub: "Enrollment begins" },
              { day: "May 7",  label: "Mid-Cycle",        state: "done",    sub: "12 submissions so far" },
              { day: "May 14", label: "Today",            state: "current", sub: "1 day to cutoff" },
              { day: "May 15", label: "C1 Cutoff",        state: "next",    sub: "Processing begins" },
              { day: "May 15", label: "C2 Opens",         state: "future",  sub: "Next cycle starts" },
              { day: "May 31", label: "C2 Cutoff",        state: "future",  sub: "Month end" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2 z-10">
                <div className={`size-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step.state === "done"    ? "bg-primary border-primary text-white" :
                  step.state === "current" ? "bg-card border-blue-600 text-primary ring-4 ring-primary/20" :
                  step.state === "next"    ? "bg-amber-50 border-warning text-warning" :
                  "bg-card border-border text-muted-foreground"
                }`}>
                  {step.state === "done" ? <CheckCircle2 size={16} /> : step.state === "current" ? <Play size={12} /> : <ArrowRight size={12} />}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-foreground">{step.day}</p>
                  <p className={`text-[11px] font-semibold ${step.state === "current" ? "text-primary" : "text-muted-foreground"}`}>{step.label}</p>
                  <p className="text-[10px] text-muted-foreground max-w-[70px]">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Batch queue */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Current Batch Queue</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">{batchQueue.length} pending processing</span>
          </div>
          <span className="text-xs text-muted-foreground">Processing on May 15, 2026</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Employee", "Department", "Plan", "Submitted", "Status", "Est. Cost"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batchQueue.map(emp => (
              <tr key={emp.id} className="border-b border-border hover:bg-muted transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <EmployeeAvatar id={emp.id} name={emp.name} />
                    <span className="text-[13px] font-semibold text-foreground">{emp.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{emp.dept}</span></td>
                <td className="px-5 py-3"><span className="text-xs font-medium text-muted-foreground">{emp.plan}</span></td>
                <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{emp.submitted ? new Date(emp.submitted + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span></td>
                <td className="px-5 py-3"><StatusPill status={emp.status} /></td>
                <td className="px-5 py-3"><span className="text-xs font-semibold text-foreground">{emp.cost > 0 ? `$${emp.cost}` : "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next cycle preview */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted border border-border">
        <div className="size-8 rounded-xl bg-border flex items-center justify-center flex-shrink-0">
          <ArrowRight size={15} className="text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Next: {nextCycle.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{nextCycle.start} → {nextCycle.end} · Opens {nextCycle.starts}</p>
        </div>
        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-border text-muted-foreground">Upcoming</span>
      </div>
    </div>
  );
}

// ─── Tab: Financial Insights ──────────────────────────────────────────────────

function FinancialTab() {
  const totalLiability  = LOCATION_COST.reduce((s, d) => s + d.cost, 0);
  const prevLiability   = LOCATION_COST.reduce((s, d) => s + d.prev, 0);
  const totalEmployees  = LOCATION_COST.reduce((s, d) => s + d.employees, 0);
  const totalEnrolled   = LOCATION_COST.reduce((s, d) => s + d.enrolled, 0);
  const avgCostPerEmp   = Math.round(totalLiability / totalEnrolled);
  const utilizationPct  = Math.round(totalEnrolled / totalEmployees * 100);

  const chartData = LOCATION_COST.map(d => ({
    name: d.short,
    Current: Math.round(d.cost / 1000),
    Previous: Math.round(d.prev / 1000),
  }));

  return (
    <div className="space-y-5">
      {/* Key financial stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><DollarSign size={18} className="text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Estimated Liability</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(totalLiability)}</p>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              {totalLiability > prevLiability
                ? <><TrendingUp size={11} className="text-success" /><span className="text-success font-semibold">+{Math.round((totalLiability - prevLiability) / prevLiability * 100)}%</span></>
                : <><TrendingDown size={11} className="text-destructive" /><span className="text-destructive font-semibold">{Math.round((totalLiability - prevLiability) / prevLiability * 100)}%</span></>
              }
              <span className="text-muted-foreground">vs prev cycle</span>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0"><Users size={18} className="text-success" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Avg Cost per Employee</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(avgCostPerEmp)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{totalEnrolled} enrolled of {totalEmployees} total</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0"><BarChart2 size={18} className="text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Insurance Utilization</p>
            <p className="text-2xl font-bold text-foreground">{utilizationPct}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">{totalEnrolled} out of {totalEmployees} employees</p>
          </div>
        </div>
      </div>

      {/* Dept cost chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Location-wise Cost Analysis</p>
            <p className="text-xs text-muted-foreground mt-0.5">Current vs previous cycle · in ₹k</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" />Current</div>
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/30" />Previous</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.tooltipBorder}`, fontSize: 12 }}
              formatter={(v, name) => [`₹${v}k`, name]}
            />
            <Bar dataKey="Current"  fill={CHART.primary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Previous" fill={CHART.primaryMuted} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost trend */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Insurance Cost Trend (7 Cycles)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total estimated liability per cycle · in $k</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={CYCLE_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={v => `$${v}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.tooltipBorder}`, fontSize: 12 }}
              formatter={(v) => [`$${v}k`, "Est. Cost"]}
            />
            <Line type="monotone" dataKey="cost" stroke={CHART.primary} strokeWidth={2.5} dot={{ r: 4, fill: CHART.primary }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dept breakdown table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Location Cost Breakdown</p>
          <p className="text-xs text-muted-foreground mt-0.5">Employee count vs insurance cost per location</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Location", "Total Employees", "Enrolled", "Utilization", "Est. Cost (Current)", "vs Previous", "Avg/Employee"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LOCATION_COST.map(d => {
              const delta = d.cost - d.prev;
              const deltaPct = Math.round(delta / d.prev * 100);
              return (
                <tr key={d.location} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-muted-foreground" />
                      <span className="text-[13px] font-semibold text-foreground">{d.location}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{d.employees}</span></td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{d.enrolled}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-border">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.round(d.enrolled / d.employees * 100)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{Math.round(d.enrolled / d.employees * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs font-semibold text-foreground">{fmtCurrency(d.cost)}</span></td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${delta >= 0 ? "text-success" : "text-destructive"}`}>
                      {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {delta >= 0 ? "+" : ""}{deltaPct}%
                    </span>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{fmtCurrency(Math.round(d.cost / d.enrolled))}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Reports & Export ────────────────────────────────────────────────────

function ReportsTab() {
  const [dateFrom, setDateFrom]     = useState("2026-05-01");
  const [dateTo, setDateTo]         = useState("2026-05-15");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatus]   = useState("all");
  const [category, setCategory]     = useState("all");
  const [generating, setGenerating] = useState(null);

  const handleGenerate = (type) => {
    setGenerating(type);
    setTimeout(() => setGenerating(null), 1800);
  };

  const REPORT_TYPES = [
    { id: "excel",       icon: FileSpreadsheet, label: "Excel Export",          desc: "Full data export as .xlsx with all employee records and statuses", variant: "success" },
    { id: "cycle",       icon: RefreshCw,       label: "Cycle-wise Report",     desc: "Submission volume, completion %, and cost estimates per cycle",    variant: "primary" },
    { id: "daily",       icon: Calendar,        label: "Daily Operational",     desc: "Day-by-day submission counts and status changes",                  variant: "info" },
    { id: "dept",        icon: Building2,       label: "Department Summary",    desc: "Per-department enrollment rates, costs, and pending actions",      variant: "warning" },
    { id: "status",      icon: ClipboardList,   label: "Submission Status",     desc: "Breakdown by status — approved, pending, rejected, clarification", variant: "warning" },
    { id: "financial",   icon: DollarSign,      label: "Financial Estimation",  desc: "Projected insurance liability and cost per cycle for Finance team", variant: "info" },
  ];

  return (
    <div className="space-y-5">
      {/* Filter panel */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Report Filters</p>
          <span className="text-xs text-muted-foreground">Applied to all exports below</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-xs bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-xs bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Department</label>
            <div className="relative">
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="w-full h-9 pl-3 pr-7 rounded-xl text-xs bg-muted border border-border text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer">
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                className="w-full h-9 pl-3 pr-7 rounded-xl text-xs bg-muted border border-border text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer">
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Employee Category</label>
            <div className="relative">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-9 pl-3 pr-7 rounded-xl text-xs bg-muted border border-border text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer">
                <option value="all">All Employees</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">Active filters:</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{dateFrom} → {dateTo}</span>
            {deptFilter !== "all" && <span className="px-2 py-0.5 rounded-full bg-accent text-purple-700 font-medium">{deptFilter}</span>}
            {statusFilter !== "all" && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-warning font-medium">{STATUS_META[statusFilter]?.label}</span>}
          </div>
        </div>
      </div>

      {/* Report types */}
      <div>
        <SectionHeading icon={FileDown} label="Available Reports" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_TYPES.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-info-ring transition-colors">
              <div className="flex items-start gap-3">
                <div className={cn("size-9 rounded-xl flex items-center justify-center flex-shrink-0", METRIC_VARIANT[r.variant].iconBg)}>
                  <r.icon size={16} className={METRIC_VARIANT[r.variant].icon} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <button
                  onClick={() => handleGenerate(r.id)}
                  className={cn(
                    "flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold transition-colors text-primary-foreground",
                    generating === r.id ? "bg-muted-foreground" : "bg-primary",
                  )}
                  disabled={generating === r.id}
                >
                  {generating === r.id
                    ? <><RefreshCw size={11} className="animate-spin" /> Generating…</>
                    : <><Download size={11} /> Download</>
                  }
                </button>
                <button
                  onClick={() => handleGenerate(r.id + "_preview")}
                  className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Eye size={11} /> Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share to Finance */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/5 to-info/10 border border-info-ring">
        <div className="size-10 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Send size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Share Estimation Report with Finance Team</p>
          <p className="text-xs text-muted-foreground mt-0.5">Auto-send cycle-level financial summaries for budgeting, approvals, and fund allocation.</p>
        </div>
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors flex-shrink-0">
          <Send size={13} /> Send to Finance
        </button>
      </div>
    </div>
  );
}

// ─── Section heading helper ───────────────────────────────────────────────────

function SectionHeading({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={13} className="text-muted-foreground" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "Overview"          },
  { id: "cycle",      label: "Cycle Processing"  },
  { id: "financial",  label: "Financial Insights"},
  { id: "reports",    label: "Reports & Export"  },
];

export default function InsuranceManagementPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="insurance-management" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border dark:bg-border" />
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">Admin</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm text-foreground dark:text-foreground font-medium">Insurance Management</span>
          </div>
        </AppHeader>

        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full min-h-0 max-w-[1280px] flex-col px-6 pt-5 pb-8">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">Insurance Management</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">Cycle 1 · May 1–15</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Open Enrollment 2026 · Benefits enrollment oversight · Super Admin</p>
              </div>
              <button
                type="button"
                className="flex flex-shrink-0 items-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-medium text-muted-foreground bg-card border border-border hover:bg-muted transition-colors"
              >
                <RefreshCw size={13} /> Sync
              </button>
            </div>

            {/* Tab nav */}
            <div className="flex items-center gap-0.5 bg-muted rounded-2xl p-1 mb-6 w-fit">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-8 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview"  && <OverviewTab />}
            {activeTab === "cycle"     && <CycleTab />}
            {activeTab === "financial" && <FinancialTab />}
            {activeTab === "reports"   && <ReportsTab />}

          </div>
        </div>
      </div>
    </div>
  );
}
