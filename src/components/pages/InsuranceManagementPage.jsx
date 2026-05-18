import { useMemo, useState, Fragment } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
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

const BATCH_TREND = [
  { label: "Feb B1", cost: 1120, submissions: 98  },
  { label: "Feb B2", cost: 1145, submissions: 112 },
  { label: "Mar B1", cost: 1180, submissions: 119 },
  { label: "Mar B2", cost: 1156, submissions: 107 },
  { label: "Apr B1", cost: 1210, submissions: 124 },
  { label: "Apr B2", cost: 1228, submissions: 131 },
  { label: "May B1", cost: 1241, submissions: 127 },
];

const BATCH_DATA = {
  b1: {
    id: "b1", label: "Batch 1–15", range: "May 1–15, 2026", status: "active",
    totalEmployees: 148, enrollmentStarted: 148, completed: 97, pending: 24, missedDeadline: 27,
    totalPremium: 312500, autoAssigned: 15, companyContribution: 218750, employeeContribution: 93750,
    dependents: {
      Self:     { completed: 97,  pending: 24, missed: 27, coverage: 500000, premiumTotal: 97000, companyShare: 67900, empShare: 29100 },
      Spouse:   { completed: 58,  pending: 16, missed: 14, coverage: 400000, premiumTotal: 74000, companyShare: 51800, empShare: 22200 },
      Father:   { completed: 41,  pending: 12, missed: 10, coverage: 300000, premiumTotal: 52000, companyShare: 36400, empShare: 15600 },
      Mother:   { completed: 45,  pending: 14, missed: 11, coverage: 300000, premiumTotal: 54000, companyShare: 37800, empShare: 16200 },
      Children: { completed: 44,  pending: 13, missed: 9,  coverage: 200000, premiumTotal: 35500, companyShare: 24850, empShare: 10650 },
    },
  },
  b2: {
    id: "b2", label: "Batch 16–30", range: "May 16–30, 2026", status: "upcoming",
    totalEmployees: 134, enrollmentStarted: 134, completed: 82, pending: 28, missedDeadline: 24,
    totalPremium: 282500, autoAssigned: 12, companyContribution: 197750, employeeContribution: 84750,
    dependents: {
      Self:     { completed: 82,  pending: 28, missed: 24, coverage: 500000, premiumTotal: 86000, companyShare: 60200, empShare: 25800 },
      Spouse:   { completed: 50,  pending: 20, missed: 15, coverage: 400000, premiumTotal: 68000, companyShare: 47600, empShare: 20400 },
      Father:   { completed: 35,  pending: 14, missed: 10, coverage: 300000, premiumTotal: 48000, companyShare: 33600, empShare: 14400 },
      Mother:   { completed: 38,  pending: 16, missed: 11, coverage: 300000, premiumTotal: 50000, companyShare: 35000, empShare: 15000 },
      Children: { completed: 39,  pending: 15, missed: 9,  coverage: 200000, premiumTotal: 30500, companyShare: 21350, empShare: 9150  },
    },
  },
};

const MISSED_EMPLOYEES_DATA = [
  { id: "EMP0042", name: "Brian Kwon",   dept: "Marketing",   batch: "b1", missedDays: 14, autoPolicy: "Basic Health",     minCoverage: 300000, monthlyPremium: 340, payrollDeduction: 272, companyShare: 68, status: "auto_assigned"  },
  { id: "EMP0061", name: "Frank Osei",   dept: "Sales",       batch: "b1", missedDays: 9,  autoPolicy: "Essential Shield", minCoverage: 250000, monthlyPremium: 290, payrollDeduction: 232, companyShare: 58, status: "auto_assigned"  },
  { id: "EMP0100", name: "James Okafor", dept: "Marketing",   batch: "b1", missedDays: 11, autoPolicy: "Basic Health",     minCoverage: 300000, monthlyPremium: 340, payrollDeduction: 272, companyShare: 68, status: "pending_review" },
  { id: "EMP0161", name: "Rosa Kim",     dept: "Marketing",   batch: "b1", missedDays: 8,  autoPolicy: "Essential Shield", minCoverage: 250000, monthlyPremium: 290, payrollDeduction: 232, companyShare: 58, status: "auto_assigned"  },
  { id: "EMP0073", name: "Grace Tanner", dept: "Legal",       batch: "b1", missedDays: 3,  autoPolicy: "Basic Health",     minCoverage: 300000, monthlyPremium: 340, payrollDeduction: 272, companyShare: 68, status: "pending_review" },
  { id: "EMP0201", name: "Tom Bradley",  dept: "Engineering", batch: "b2", missedDays: 5,  autoPolicy: "Essential Shield", minCoverage: 250000, monthlyPremium: 290, payrollDeduction: 232, companyShare: 58, status: "auto_assigned"  },
  { id: "EMP0218", name: "Nina Patel",   dept: "Finance",     batch: "b2", missedDays: 3,  autoPolicy: "Basic Health",     minCoverage: 300000, monthlyPremium: 340, payrollDeduction: 272, companyShare: 68, status: "pending_review" },
  { id: "EMP0234", name: "Marcus Webb",  dept: "HR",          batch: "b2", missedDays: 7,  autoPolicy: "Basic Health",     minCoverage: 300000, monthlyPremium: 340, payrollDeduction: 272, companyShare: 68, status: "auto_assigned"  },
  { id: "EMP0249", name: "Priya Sharma", dept: "Operations",  batch: "b2", missedDays: 2,  autoPolicy: "Essential Shield", minCoverage: 250000, monthlyPremium: 290, payrollDeduction: 232, companyShare: 58, status: "auto_assigned"  },
  { id: "EMP0267", name: "Ali Hassan",   dept: "Product",     batch: "b2", missedDays: 4,  autoPolicy: "Basic Health",     minCoverage: 300000, monthlyPremium: 340, payrollDeduction: 272, companyShare: 68, status: "pending_review" },
];

const DEP_NAMES = ["Self", "Spouse", "Father", "Mother", "Children"];

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

// ─── Batch Processing Dashboard ──────────────────────────────────────────────

function CompletionDonut({ batch }) {
  const data = [
    { name: "Completed", value: batch.completed,      fill: "var(--success)"     },
    { name: "Pending",   value: batch.pending,        fill: "var(--warning)"     },
    { name: "Missed",    value: batch.missedDeadline, fill: "var(--destructive)" },
  ];
  const pct = Math.round((batch.completed / batch.totalEmployees) * 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={46} outerRadius={62}
            paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
          </Pie>
          <Tooltip formatter={(v, n) => [v, n]}
            contentStyle={{ borderRadius: 10, fontSize: 11, border: "1px solid var(--border)", padding: "4px 8px" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold text-foreground leading-none">{pct}%</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">Complete</span>
      </div>
    </div>
  );
}

function BatchProcessingDashboard() {
  const [batchFilter, setBatchFilter]   = useState("all");
  const [deptFilter,  setDeptFilter]    = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const batches = Object.values(BATCH_DATA);

  const depBarData = DEP_NAMES.map(dep => ({
    name: dep,
    "B1 Completed": BATCH_DATA.b1.dependents[dep].completed,
    "B1 Pending":   BATCH_DATA.b1.dependents[dep].pending,
    "B1 Missed":    BATCH_DATA.b1.dependents[dep].missed,
    "B2 Completed": BATCH_DATA.b2.dependents[dep].completed,
    "B2 Pending":   BATCH_DATA.b2.dependents[dep].pending,
    "B2 Missed":    BATCH_DATA.b2.dependents[dep].missed,
  }));

  const filteredMissed = useMemo(() => MISSED_EMPLOYEES_DATA.filter(emp => {
    const matchBatch  = batchFilter  === "all" || emp.batch  === batchFilter;
    const matchDept   = deptFilter   === "all" || emp.dept   === deptFilter;
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q);
    return matchBatch && matchDept && matchStatus && matchSearch;
  }), [batchFilter, deptFilter, statusFilter, search]);

  const totalPremium  = batches.reduce((s, b) => s + b.totalPremium, 0);
  const totalCompany  = batches.reduce((s, b) => s + b.companyContribution, 0);
  const totalEmployee = batches.reduce((s, b) => s + b.employeeContribution, 0);
  const missedPremium = MISSED_EMPLOYEES_DATA.reduce((s, e) => s + e.monthlyPremium, 0);
  const missedPayroll = MISSED_EMPLOYEES_DATA.reduce((s, e) => s + e.payrollDeduction, 0);

  const premiumChartData = [
    { batch: "B1–15",  company: Math.round(BATCH_DATA.b1.companyContribution / 1000), employee: Math.round(BATCH_DATA.b1.employeeContribution / 1000) },
    { batch: "B16–30", company: Math.round(BATCH_DATA.b2.companyContribution / 1000), employee: Math.round(BATCH_DATA.b2.employeeContribution / 1000) },
  ];

  const missedStatusMeta = {
    auto_assigned:  { label: "Auto-Assigned",  pill: "bg-info/10 text-info border-info-ring"         },
    pending_review: { label: "Pending Review", pill: "bg-warning/10 text-warning border-warning-ring" },
  };

  return (
    <div className="space-y-6">

      {/* ── SECTION 1: Two-column batch overview ── */}
      <div>
        <SectionHeading icon={BarChart2} label="Batch Overview" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {batches.map(batch => {
            const pct = v => Math.round((v / batch.totalEmployees) * 100);
            return (
              <div key={batch.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{batch.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{batch.range}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                    batch.status === "active"
                      ? "bg-success/10 text-success border-success/25"
                      : "bg-muted text-muted-foreground border-border",
                  )}>
                    {batch.status === "active" ? "ACTIVE" : "UPCOMING"}
                  </span>
                </div>

                {/* Donut + key stats */}
                <div className="flex items-center gap-5">
                  <CompletionDonut batch={batch} />
                  <div className="flex-1 space-y-2">
                    {[
                      { label: "Total Employees",    value: batch.totalEmployees,    color: "text-primary",         dot: "bg-primary"         },
                      { label: "Enrollment Started", value: batch.enrollmentStarted, color: "text-info",            dot: "bg-info"            },
                      { label: "Completed",          value: batch.completed,         color: "text-success",         dot: "bg-success"         },
                      { label: "Pending",            value: batch.pending,           color: "text-warning",         dot: "bg-warning"         },
                      { label: "Missed Deadline",    value: batch.missedDeadline,    color: "text-destructive",     dot: "bg-destructive"     },
                      { label: "Auto-Assigned",      value: batch.autoAssigned,      color: "text-muted-foreground", dot: "bg-muted-foreground" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("size-1.5 rounded-full flex-shrink-0", item.dot)} />
                          <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        </div>
                        <span className={cn("text-xs font-bold tabular-nums", item.color)}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-2 pt-3 border-t border-border">
                  {[
                    { label: "Completed",       pct: pct(batch.completed),       bar: "bg-success"     },
                    { label: "Pending",         pct: pct(batch.pending),         bar: "bg-warning"     },
                    { label: "Missed Deadline", pct: pct(batch.missedDeadline),  bar: "bg-destructive" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        <span className="text-[11px] font-semibold text-foreground">{item.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-1.5 rounded-full transition-all duration-500", item.bar)}
                          style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Premium footer */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "Total Premium",   value: fmtCurrency(batch.totalPremium),         accent: "text-foreground" },
                    { label: "Company",         value: fmtCurrency(batch.companyContribution),  accent: "text-success"    },
                    { label: "Employee",        value: fmtCurrency(batch.employeeContribution), accent: "text-primary"    },
                  ].map(item => (
                    <div key={item.label} className="bg-muted rounded-xl px-3 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className={cn("text-xs font-bold mt-0.5", item.accent)}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: Dependent-wise stacked bar chart ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <SectionHeading icon={Users} label="Dependent-wise Enrollment Comparison" />
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
          {[
            { label: "B1 Completed", color: "#22c55e" },
            { label: "B1 Pending",   color: "#f97316" },
            { label: "B1 Missed",    color: "#fca5a5" },
            { label: "B2 Completed", color: "#6366f1" },
            { label: "B2 Pending",   color: "#eab308" },
            { label: "B2 Missed",    color: "#ef4444" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm flex-shrink-0" style={{ background: l.color }} />
              <span className="text-[11px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={depBarData} barSize={9} barGap={2} barCategoryGap="32%">
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.tooltipBorder}`, fontSize: 12 }} />
            <Bar dataKey="B1 Completed" stackId="b1" fill="#22c55e" />
            <Bar dataKey="B1 Pending"   stackId="b1" fill="#f97316" />
            <Bar dataKey="B1 Missed"    stackId="b1" fill="#fca5a5" radius={[3,3,0,0]} />
            <Bar dataKey="B2 Completed" stackId="b2" fill="#6366f1" />
            <Bar dataKey="B2 Pending"   stackId="b2" fill="#eab308" />
            <Bar dataKey="B2 Missed"    stackId="b2" fill="#ef4444" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── SECTION 3: Dependent split-up table ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <SectionHeading icon={Users} label="Dependent Split-up Details" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {batches.map(batch => (
            <div key={batch.id}>
              <div className="px-5 py-2.5 bg-muted/40 border-b border-border flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{batch.label}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  batch.status === "active" ? "bg-success/10 text-success border-success/25" : "bg-muted text-muted-foreground border-border",
                )}>{batch.status === "active" ? "ACTIVE" : "UPCOMING"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Dependent", "Completed", "Pending", "Missed", "Coverage", "Company", "Emp. Payable"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEP_NAMES.map(dep => {
                      const d = batch.dependents[dep];
                      return (
                        <tr key={dep} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-2.5"><span className="text-xs font-semibold text-foreground">{dep}</span></td>
                          <td className="px-4 py-2.5"><span className="text-xs font-bold text-success">{d.completed}</span></td>
                          <td className="px-4 py-2.5"><span className="text-xs font-bold text-warning">{d.pending}</span></td>
                          <td className="px-4 py-2.5"><span className="text-xs font-bold text-destructive">{d.missed}</span></td>
                          <td className="px-4 py-2.5"><span className="text-xs text-muted-foreground">{fmtCurrency(d.coverage)}</span></td>
                          <td className="px-4 py-2.5"><span className="text-xs text-success font-semibold">{fmtCurrency(d.companyShare)}</span></td>
                          <td className="px-4 py-2.5"><span className="text-xs font-bold text-primary">{fmtCurrency(d.empShare)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: Missed deadline employees ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <SectionHeading icon={Clock} label="Missed Deadline Employees" />
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
              {filteredMissed.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / ID…"
                className="h-8 pl-7 pr-3 w-44 rounded-xl text-xs bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            {[
              { value: batchFilter,  onChange: setBatchFilter,  opts: [["all","All Batches"],["b1","Batch 1–15"],["b2","Batch 16–30"]] },
              { value: deptFilter,   onChange: setDeptFilter,   opts: [["all","All Depts"], ...DEPARTMENTS.map(d => [d, d])] },
              { value: statusFilter, onChange: setStatusFilter, opts: [["all","All Statuses"],["auto_assigned","Auto-Assigned"],["pending_review","Pending Review"]] },
            ].map((sel, i) => (
              <div key={i} className="relative">
                <select value={sel.value} onChange={e => sel.onChange(e.target.value)}
                  className="h-8 pl-3 pr-7 rounded-xl text-xs bg-muted border border-border text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer">
                  {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            ))}
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-auto">
              <FileDown size={11} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-8 px-3 py-3" />
                {["Employee","ID","Dept","Batch","Missed Since","Auto Plan","Min. Coverage","Monthly Premium","Payroll Deduction","Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMissed.length === 0 ? (
                <tr><td colSpan={11} className="px-5 py-10 text-center text-sm text-muted-foreground">No employees match your filters.</td></tr>
              ) : filteredMissed.map(emp => {
                const expanded = expandedRows.has(emp.id);
                const sm = missedStatusMeta[emp.status] ?? missedStatusMeta.auto_assigned;
                return (
                  <Fragment key={emp.id}>
                    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="px-3 py-3">
                        <button onClick={() => toggleRow(emp.id)}
                          className="size-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                          <ChevronDown size={13} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <EmployeeAvatar id={parseInt(emp.id.replace("EMP", ""), 10)} name={emp.name} />
                          <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="font-mono text-xs text-muted-foreground">{emp.id}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{emp.dept}</span></td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          emp.batch === "b1" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border")}>
                          {emp.batch === "b1" ? "B1–15" : "B16–30"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs font-semibold text-destructive whitespace-nowrap">
                          <Clock size={11} />{emp.missedDays}d ago
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground whitespace-nowrap">{emp.autoPolicy}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-semibold text-foreground">{fmtCurrency(emp.minCoverage)}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-bold text-primary">${emp.monthlyPremium}<span className="font-normal text-muted-foreground">/mo</span></span></td>
                      <td className="px-4 py-3"><span className="text-xs font-bold text-warning">${emp.payrollDeduction}</span></td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap", sm.pill)}>
                          {sm.label}
                        </span>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-muted/20 border-b border-border">
                        <td colSpan={11} className="px-8 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: "Min. Coverage",     value: fmtCurrencyFull(emp.minCoverage),  accent: "text-foreground" },
                              { label: "Monthly Premium",   value: `$${emp.monthlyPremium}/mo`,        accent: "text-primary"    },
                              { label: "Payroll Deduction", value: `$${emp.payrollDeduction}/mo`,      accent: "text-warning"    },
                              { label: "Company Share",     value: `$${emp.companyShare}/mo`,          accent: "text-success"    },
                            ].map(item => (
                              <div key={item.label} className="bg-card border border-border rounded-xl p-3">
                                <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
                                <p className={cn("text-sm font-bold mt-1", item.accent)}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 5: Financial summary ── */}
      <div className="space-y-4">
        <SectionHeading icon={DollarSign} label="Financial Summary" />
        <MetricCard icon={DollarSign} label="Total Premium" value={fmtCurrency(totalPremium)} variant="primary" />
      </div>

      {/* ── Batch-wise Report ── */}
      <div>
        <SectionHeading icon={BarChart2} label="Batch-wise Report" />
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Batch", "Date Range", "Total Employees", "Enrollment Started", "Completed", "Pending", "Missed Deadline", "Total Premium", "Company Contribution", "Emp. Contribution"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(BATCH_DATA).map(batch => (
                  <tr key={batch.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3"><span className="text-xs font-semibold text-foreground">{batch.label}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{batch.range}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold text-foreground">{batch.totalEmployees}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold text-foreground">{batch.enrollmentStarted}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-bold text-success">{batch.completed}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-bold text-warning">{batch.pending}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-bold text-destructive">{batch.missedDeadline}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold text-foreground">{fmtCurrency(batch.totalPremium)}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-success">{fmtCurrency(batch.companyContribution)}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-primary">{fmtCurrency(batch.employeeContribution)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Consolidated Report ── */}
      <div>
        <SectionHeading icon={ClipboardList} label="Consolidated Report" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Summary Cards */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Overall Metrics</p>
            <div className="space-y-3">
              {[
                { label: "Total Employees", value: Object.values(BATCH_DATA).reduce((s, b) => s + b.totalEmployees, 0), color: "text-foreground" },
                { label: "Enrollment Started", value: Object.values(BATCH_DATA).reduce((s, b) => s + b.enrollmentStarted, 0), color: "text-primary" },
                { label: "Completed", value: Object.values(BATCH_DATA).reduce((s, b) => s + b.completed, 0), color: "text-success" },
                { label: "Pending", value: Object.values(BATCH_DATA).reduce((s, b) => s + b.pending, 0), color: "text-warning" },
                { label: "Missed Deadline", value: Object.values(BATCH_DATA).reduce((s, b) => s + b.missedDeadline, 0), color: "text-destructive" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Financial Summary</p>
            <div className="space-y-3">
              {[
                { label: "Total Premium", value: fmtCurrency(Object.values(BATCH_DATA).reduce((s, b) => s + b.totalPremium, 0)), color: "text-foreground" },
                { label: "Company Contribution", value: fmtCurrency(Object.values(BATCH_DATA).reduce((s, b) => s + b.companyContribution, 0)), color: "text-success" },
                { label: "Employee Contribution", value: fmtCurrency(Object.values(BATCH_DATA).reduce((s, b) => s + b.employeeContribution, 0)), color: "text-primary" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location Summary */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border bg-muted/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location-wise Enrollment</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Location", "Employees", "Enrolled", "Enrollment %", "Current Cost", "Previous Cost", "Change"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LOCATION_COST.map(loc => {
                    const enrollmentPct = Math.round((loc.enrolled / loc.employees) * 100);
                    const change = loc.cost - loc.prev;
                    const changePct = Math.round((change / loc.prev) * 100);
                    return (
                      <tr key={loc.location} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3"><span className="text-xs font-semibold text-foreground">{loc.location}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-foreground">{loc.employees}</span></td>
                        <td className="px-4 py-3"><span className="text-xs font-semibold text-success">{loc.enrolled}</span></td>
                        <td className="px-4 py-3"><span className="text-xs font-semibold text-primary">{enrollmentPct}%</span></td>
                        <td className="px-4 py-3"><span className="text-xs font-semibold text-foreground">{fmtCurrency(loc.cost)}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{fmtCurrency(loc.prev)}</span></td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs font-semibold", change >= 0 ? "text-destructive" : "text-success")}>
                            {change >= 0 ? "+" : ""}{fmtCurrency(change)} ({changePct >= 0 ? "+" : ""}{changePct}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


// ─── Tab: Batch Processing ────────────────────────────────────────────────────

function BatchTab() {
  return <BatchProcessingDashboard />;
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
            <p className="text-sm font-semibold text-foreground">Insurance Cost Trend (7 Batches)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total estimated liability per batch · in $k</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={BATCH_TREND}>
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
  { id: "batch",      label: "Batch Processing"  },
  { id: "financial",  label: "Financial Insights"},
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">Batch 1 · May 1–15</span>
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
            {activeTab === "batch"     && <BatchTab />}
            {activeTab === "financial" && <FinancialTab />}

          </div>
        </div>
      </div>
    </div>
  );
}
