import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ClipboardList, Users, FileText, CheckCircle2,
  Search, Download, Send, ChevronDown,
  MoreVertical, Eye, EyeOff, Mail, Clock, Calendar, Building2, X,
  TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, BarChart2, FileSpreadsheet, Filter,
  ArrowRight, FileDown, UserPlus,
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
  // ── Batch 1: Apr 1–15 (Completed) ──────────────────────────────────────────
  { id: 1,  name: "Alice Monroe",    dept: "Engineering", location: "Bangalore",  status: "approved",  submitted: "2026-04-05", deadline: "2026-04-15", email: "alice@meridian.com",  batch: 1, plan: "Family",    cost: 82000 },
  { id: 2,  name: "Brian Kwon",      dept: "Marketing",   location: "Chennai",    status: "closed",    submitted: null,         deadline: "2026-04-15", email: "brian@meridian.com",  batch: 1, plan: "—",          cost: 0     },
  { id: 3,  name: "Carla Ruiz",      dept: "Finance",     location: "Hyderabad",  status: "approved",  submitted: "2026-04-03", deadline: "2026-04-15", email: "carla@meridian.com",  batch: 1, plan: "Couple",    cost: 61000 },
  { id: 4,  name: "David Chen",      dept: "HR",          location: "Noida",      status: "approved",  submitted: "2026-04-07", deadline: "2026-04-15", email: "david@meridian.com",  batch: 1, plan: "Individual", cost: 34000 },
  { id: 5,  name: "Eva Larsson",     dept: "Operations",  location: "Kolkata",    status: "approved",  submitted: "2026-04-02", deadline: "2026-04-15", email: "eva@meridian.com",    batch: 1, plan: "Family",    cost: 82000 },
  { id: 6,  name: "Frank Osei",      dept: "Sales",       location: "Bangalore",  status: "closed",    submitted: null,         deadline: "2026-04-15", email: "frank@meridian.com",  batch: 1, plan: "—",          cost: 0     },
  { id: 7,  name: "Grace Tanner",    dept: "Legal",       location: "Chennai",    status: "approved",  submitted: "2026-04-12", deadline: "2026-04-15", email: "grace@meridian.com",  batch: 1, plan: "Individual", cost: 34000 },
  // ── Batch 2: Apr 16–30 (Completed) ─────────────────────────────────────────
  { id: 8,  name: "Henry Park",      dept: "Product",     location: "Hyderabad",  status: "approved",  submitted: "2026-04-18", deadline: "2026-04-30", email: "henry@meridian.com",  batch: 2, plan: "Couple",    cost: 61000 },
  { id: 9,  name: "Iris Nakamura",   dept: "Engineering", location: "Bangalore",  status: "approved",  submitted: "2026-04-22", deadline: "2026-04-30", email: "iris@meridian.com",   batch: 2, plan: "Individual", cost: 34000 },
  { id: 10, name: "James Okafor",    dept: "Marketing",   location: "Noida",      status: "closed",    submitted: null,         deadline: "2026-04-30", email: "james@meridian.com",  batch: 2, plan: "—",          cost: 0     },
  { id: 11, name: "Kira Patel",      dept: "Finance",     location: "Kolkata",    status: "approved",  submitted: "2026-04-20", deadline: "2026-04-30", email: "kira@meridian.com",   batch: 2, plan: "Family",    cost: 82000 },
  { id: 12, name: "Leo Fernandez",   dept: "HR",          location: "Chennai",    status: "approved",  submitted: "2026-04-25", deadline: "2026-04-30", email: "leo@meridian.com",    batch: 2, plan: "Individual", cost: 34000 },
  { id: 13, name: "Maya Johansson",  dept: "Operations",  location: "Hyderabad",  status: "closed",    submitted: null,         deadline: "2026-04-30", email: "maya@meridian.com",   batch: 2, plan: "—",          cost: 0     },
  // ── Batch 3: May 1–15 (Completed) ─────────────────────────────────────────────
  { id: 14, name: "Nathan Torres",   dept: "Sales",       location: "Bangalore",  status: "approved",            submitted: "2026-05-05", deadline: "2026-05-15", email: "nathan@meridian.com", batch: 3, plan: "Couple",    cost: 61000 },
  { id: 15, name: "Olivia Nguyen",   dept: "Legal",       location: "Chennai",    status: "approved",            submitted: "2026-05-09", deadline: "2026-05-15", email: "olivia@meridian.com", batch: 3, plan: "Individual", cost: 34000 },
  { id: 16, name: "Peter Walsh",     dept: "Product",     location: "Noida",      status: "closed",              submitted: null,         deadline: "2026-05-15", email: "peter@meridian.com",  batch: 3, plan: "—",          cost: 0     },
  { id: 17, name: "Quinn Adeyemi",   dept: "Engineering", location: "Hyderabad",  status: "approved",            submitted: "2026-05-03", deadline: "2026-05-15", email: "quinn@meridian.com",  batch: 3, plan: "Family",    cost: 82000 },
  { id: 18, name: "Rosa Kim",        dept: "Marketing",   location: "Kolkata",    status: "closed",              submitted: null,         deadline: "2026-05-15", email: "rosa@meridian.com",   batch: 3, plan: "—",          cost: 0     },
  { id: 19, name: "Sam Eriksson",    dept: "Finance",     location: "Bangalore",  status: "closed",              submitted: null,         deadline: "2026-05-15", email: "sam@meridian.com",    batch: 3, plan: "—",          cost: 0     },
  { id: 20, name: "Tara Mitchell",   dept: "HR",          location: "Chennai",    status: "approved",            submitted: "2026-05-07", deadline: "2026-05-15", email: "tara@meridian.com",   batch: 3, plan: "Couple",    cost: 61000 },
  // ── Batch 4: May 16–31 (Active — current period) ───────────────────────────────
  { id: 21, name: "Uma Reddy",       dept: "Engineering", location: "Bangalore",  status: "submitted",           submitted: "2026-05-17", deadline: "2026-05-31", email: "uma@meridian.com",    batch: 4, plan: "Couple",    cost: 61000 },
  { id: 22, name: "Victor Hahn",     dept: "Marketing",   location: "Chennai",    status: "pending",             submitted: null,         deadline: "2026-05-31", email: "victor@meridian.com", batch: 4, plan: "—",          cost: 0     },
  { id: 23, name: "Willa Cho",       dept: "Finance",     location: "Hyderabad",  status: "approved",            submitted: "2026-05-16", deadline: "2026-05-31", email: "willa@meridian.com",  batch: 4, plan: "Individual", cost: 34000 },
  { id: 24, name: "Xavier Brooks",   dept: "Product",     location: "Noida",      status: "not_accessed",        submitted: null,         deadline: "2026-05-31", email: "xavier@meridian.com", batch: 4, plan: "—",          cost: 0     },
  { id: 25, name: "Yara Singh",      dept: "Sales",       location: "Kolkata",    status: "draft",               submitted: null,         deadline: "2026-05-31", email: "yara@meridian.com",   batch: 4, plan: "—",          cost: 0     },
  { id: 26, name: "Zack Miller",     dept: "Operations",  location: "Bangalore",  status: "under_clarification", submitted: "2026-05-18", deadline: "2026-05-31", email: "zack@meridian.com",   batch: 4, plan: "Family",    cost: 82000 },
  { id: 27, name: "Amy Foster",      dept: "Legal",       location: "Chennai",    status: "approved",            submitted: "2026-05-17", deadline: "2026-05-31", email: "amy@meridian.com",    batch: 4, plan: "Couple",    cost: 61000 },
];

const LOCATION_SHORT = Object.fromEntries(
  [["Bangalore", "BLR"], ["Chennai", "MAA"], ["Hyderabad", "HYD"], ["Noida", "NOI"], ["Kolkata", "CCU"]],
);

const LOCATION_COST = [
  { location: "Bangalore",  short: "BLR", employees: 72, enrolled: 61, cost: 412000, prev: 387000 },
  { location: "Chennai",    short: "MAA", employees: 48, enrolled: 38, cost: 264000, prev: 249000 },
  { location: "Hyderabad",  short: "HYD", employees: 55, enrolled: 44, cost: 298000, prev: 311000 },
  { location: "Noida",      short: "NOI", employees: 39, enrolled: 29, cost: 197000, prev: 181000 },
  { location: "Kolkata",    short: "CCU", employees: 34, enrolled: 25, cost: 151000, prev: 143000 },
];

/** Sync strip only (replace with live fetch). */
const DASHBOARD_SUMMARY = {
  last_sync_timestamp: "2026-05-18T08:00:00Z",
  last_sync_status: "SUCCESS",
  emails_sent_last_sync: 24,
};

const BATCH_TREND = [
  { label: "Feb B1", cost: 2480, submissions: 98  },
  { label: "Feb B2", cost: 2310, submissions: 112 },
  { label: "Mar B1", cost: 2650, submissions: 119 },
  { label: "Mar B2", cost: 2540, submissions: 107 },
  { label: "Apr B1", cost: 2930, submissions: 124 },
  { label: "Apr B2", cost: 2110, submissions: 131 },
  { label: "May B1", cost: 2380, submissions: 127 },
  { label: "May B2", cost: 2150, submissions: 118 },
];

const BATCH_CONFIGS = [
  { id: 1, label: "Batch 1", dateRange: "Apr 1 – 15, 2026",  startDate: "2026-04-01", endDate: "2026-04-15", status: "completed", totalPremium: 293000 },
  { id: 2, label: "Batch 2", dateRange: "Apr 16 – 30, 2026", startDate: "2026-04-16", endDate: "2026-04-30", status: "completed", totalPremium: 211000 },
  { id: 3, label: "Batch 3", dateRange: "May 1 – 15, 2026",  startDate: "2026-05-01", endDate: "2026-05-15", status: "completed", totalPremium: 238000 },
  { id: 4, label: "Batch 4", dateRange: "May 16 – 31, 2026", startDate: "2026-05-16", endDate: "2026-05-31", status: "active",    totalPremium: 215000 },
];

function getDefaultActiveBatchId() {
  return BATCH_CONFIGS.find(b => b.status === "active")?.id ?? BATCH_CONFIGS[BATCH_CONFIGS.length - 1].id;
}

function getBatchTriplet(activeBatchId) {
  const index = BATCH_CONFIGS.findIndex(b => b.id === activeBatchId);
  const safeIndex = index >= 0 ? index : BATCH_CONFIGS.length - 1;
  return {
    index: safeIndex,
    previous: safeIndex > 0 ? BATCH_CONFIGS[safeIndex - 1] : null,
    current: BATCH_CONFIGS[safeIndex],
    next: safeIndex < BATCH_CONFIGS.length - 1 ? BATCH_CONFIGS[safeIndex + 1] : null,
  };
}

/** Per-employee dependent breakdown: spouse / father / mother / children */
const EMPLOYEE_DEPENDENTS = {
  // Batch 1 (Apr 1–15)
  1:  { spouse: 1, father: 0, mother: 1, children: 2 },  // Alice  — Family
  2:  { spouse: 0, father: 0, mother: 0, children: 0 },  // Brian  — closed
  3:  { spouse: 1, father: 0, mother: 0, children: 0 },  // Carla  — Couple
  4:  { spouse: 0, father: 0, mother: 0, children: 0 },  // David  — Individual
  5:  { spouse: 1, father: 1, mother: 1, children: 1 },  // Eva    — Family
  6:  { spouse: 0, father: 0, mother: 0, children: 0 },  // Frank  — closed
  7:  { spouse: 0, father: 0, mother: 0, children: 0 },  // Grace  — Individual
  // Batch 2 (Apr 16–30)
  8:  { spouse: 1, father: 0, mother: 0, children: 0 },  // Henry  — Couple
  9:  { spouse: 0, father: 0, mother: 0, children: 0 },  // Iris   — Individual
  10: { spouse: 0, father: 0, mother: 0, children: 0 },  // James  — closed
  11: { spouse: 1, father: 1, mother: 0, children: 2 },  // Kira   — Family
  12: { spouse: 0, father: 0, mother: 0, children: 0 },  // Leo    — Individual
  13: { spouse: 0, father: 0, mother: 0, children: 0 },  // Maya   — closed
  // Batch 3 (May 1–15)
  14: { spouse: 1, father: 0, mother: 0, children: 0 },  // Nathan — Couple
  15: { spouse: 0, father: 0, mother: 0, children: 0 },  // Olivia — Individual
  16: { spouse: 0, father: 0, mother: 0, children: 0 },  // Peter  — not_accessed
  17: { spouse: 1, father: 1, mother: 1, children: 1 },  // Quinn  — Family
  18: { spouse: 0, father: 0, mother: 0, children: 0 },  // Rosa   — draft
  19: { spouse: 0, father: 0, mother: 0, children: 0 },  // Sam    — pending
  20: { spouse: 1, father: 0, mother: 0, children: 0 },  // Tara   — Couple
  // Batch 4 (May 16–31)
  21: { spouse: 1, father: 0, mother: 0, children: 0 },  // Uma    — Couple
  22: { spouse: 0, father: 0, mother: 0, children: 0 },  // Victor — pending
  23: { spouse: 0, father: 0, mother: 0, children: 0 },  // Willa  — Individual
  24: { spouse: 0, father: 0, mother: 0, children: 0 },  // Xavier — not_accessed
  25: { spouse: 0, father: 0, mother: 0, children: 0 },  // Yara   — draft
  26: { spouse: 1, father: 1, mother: 0, children: 1 },  // Zack   — Family
  27: { spouse: 1, father: 0, mother: 0, children: 0 },  // Amy    — Couple
};

/** Overview tab: collapse granular statuses into Pending / Completed / Missed. */
const OVERVIEW_STATUS_META = {
  pending:   { label: "Pending",   pill: "bg-warning/10 text-warning border-warning-ring",           dot: "bg-warning" },
  completed: { label: "Completed", pill: "bg-success/10 text-success border-success-ring",         dot: "bg-success" },
  missed:    { label: "Missed",    pill: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
};

/** True once the enrollment window has ended (batch cutoff or employee deadline passed). */
function isPastEnrollmentDeadline(dateStr) {
  if (!dateStr) return false;
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
}

function isEnrollmentClosed(emp, batch) {
  if (batch) {
    if (batch.status === "completed") return true;
    return isPastEnrollmentDeadline(batch.endDate);
  }
  return isPastEnrollmentDeadline(emp.deadline);
}

/**
 * Overview rollup: Pending / Completed / Missed.
 * Missed is only knowable after enrollment closes — not_accessed/closed
 * count as missed only when the batch (or employee deadline) has passed.
 */
function getOverviewStatus(status, enrollmentClosed) {
  if (status === "approved") return "completed";
  if (enrollmentClosed && (status === "not_accessed" || status === "closed")) return "missed";
  return "pending";
}

const STATUS_STACK = {
  completed: { label: "Completed", fill: "var(--success)" },
  pending:   { label: "Pending",   fill: "var(--warning)" },
  missed:    { label: "Missed",    fill: "var(--destructive)" },
};

function buildLocationOverviewData(employees, { batch: selectedBatch, filterMode }) {
  const byLoc = {};
  employees.forEach(emp => {
    const loc = emp.location ?? "Unknown";
    if (!byLoc[loc]) {
      byLoc[loc] = {
        location: loc,
        short: LOCATION_SHORT[loc] ?? loc.slice(0, 3).toUpperCase(),
        completed: 0,
        pending: 0,
        missed: 0,
        cost: 0,
        total: 0,
      };
    }
    const empBatch = BATCH_CONFIGS.find(b => b.id === emp.batch);
    const enrollmentClosed = filterMode === "batch"
      ? isEnrollmentClosed(emp, selectedBatch)
      : isEnrollmentClosed(emp, null);
    byLoc[loc].total += 1;
    byLoc[loc][getOverviewStatus(emp.status, enrollmentClosed)] += 1;
    if (emp.status === "approved") byLoc[loc].cost += emp.cost;
  });
  return Object.values(byLoc).sort((a, b) => b.total - a.total);
}

function LocationStatusTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div
      className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs shadow-lg"
      style={{ borderColor: CHART.tooltipBorder }}
    >
      <p className="font-semibold text-foreground mb-1.5">{row.location}</p>
      {(["completed", "pending", "missed"]).map(key => row[key] > 0 && (
        <div key={key} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{STATUS_STACK[key].label}</span>
          <span className="font-semibold text-foreground">{row[key]}</span>
        </div>
      ))}
      <div className="mt-1.5 pt-1.5 border-t border-border flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Est. cost</span>
        <span className="font-semibold text-foreground">{fmtCurrency(row.cost)}</span>
      </div>
    </div>
  );
}

function LocationOverviewPanel({ data, subtitle }) {
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Location Overview
        </p>
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
        <p className="text-xs text-muted-foreground text-center py-6">No employees for this selection.</p>
      </div>
    );
  }

  const chartHeight = Math.max(140, data.length * 44);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Location Overview
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
          barSize={18}
        >
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="short"
            width={34}
            tick={{ fontSize: 10, fill: CHART.tick }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<LocationStatusTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
          <Bar dataKey="completed" stackId="status" fill={STATUS_STACK.completed.fill} radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending" stackId="status" fill={STATUS_STACK.pending.fill} />
          <Bar dataKey="missed" stackId="status" fill={STATUS_STACK.missed.fill} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-3 mb-4">
        {Object.entries(STATUS_STACK).map(([key, { label, fill }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm flex-shrink-0" style={{ backgroundColor: fill }} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        {data.map(row => (
          <div key={row.location} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[9px] font-bold text-primary">
                {row.short}
              </span>
              <span className="text-xs font-medium text-foreground truncate">{row.location}</span>
            </div>
            <span className="text-xs font-semibold text-foreground shrink-0">{fmtCurrency(row.cost)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}
function fmtCurrencyFull(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
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

function OverviewStatusPill({ status, enrollmentClosed }) {
  const key = getOverviewStatus(status, enrollmentClosed);
  const m = OVERVIEW_STATUS_META[key];
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
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={cn(
        "flex items-start gap-3 rounded-2xl p-4 flex-1 min-w-0 relative overflow-hidden transition-all border bg-card",
        interactive ? "cursor-pointer hover:border-primary/40" : "cursor-default",
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

// ─── Dependent donut chart (SVG) ─────────────────────────────────────────────

const DEP_COLORS = {
  employee: "var(--chart-chart-2)",
  spouse:   "var(--primary)",
  father:   "var(--warning)",
  mother:   "#ec4899",
  children: "var(--success)",
};

const DEPENDENT_COST_TYPES = [
  { key: "employee", label: "Employee (Self)" },
  { key: "spouse",   label: "Spouse" },
  { key: "father",   label: "Father" },
  { key: "mother",   label: "Mother" },
  { key: "children", label: "Children" },
];

/** Premium allocated by dependent slot (proportional to enrolled employee cost). */
function buildDependentCostDistribution(employees) {
  const agg = Object.fromEntries(
    DEPENDENT_COST_TYPES.map(({ key, label }) => [key, { type: label, key, count: 0, premium: 0 }]),
  );

  employees.filter(e => e.cost > 0).forEach(emp => {
    const d = EMPLOYEE_DEPENDENTS[emp.id] ?? { spouse: 0, father: 0, mother: 0, children: 0 };
    const slots = {
      employee: 1,
      spouse: d.spouse,
      father: d.father,
      mother: d.mother,
      children: d.children,
    };
    const totalSlots = Object.values(slots).reduce((s, n) => s + n, 0);
    if (totalSlots === 0) return;

    DEPENDENT_COST_TYPES.forEach(({ key }) => {
      if (slots[key] > 0) {
        agg[key].count += slots[key];
        agg[key].premium += (emp.cost / totalSlots) * slots[key];
      }
    });
  });

  const rows = DEPENDENT_COST_TYPES.map(({ key }) => ({
    ...agg[key],
    premium: Math.round(agg[key].premium),
  }));

  const totals = {
    type: "Total",
    key: "total",
    count: rows.reduce((s, r) => s + r.count, 0),
    premium: rows.reduce((s, r) => s + r.premium, 0),
  };

  return { rows, totals };
}

function DependentDonutChart({ data }) {
  const size   = 160;
  const strokeW = 28;
  const r      = (size / 2) - strokeW / 2 - 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const total  = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={strokeW} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-bold" style={{ color: "var(--muted-foreground)" }}>0</p>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>dependents</p>
        </div>
      </div>
    );
  }

  let cumArc = 0;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={strokeW} />
        {data.map(d => {
          const arc    = (d.value / total) * circ;
          const offset = circ / 4 - cumArc;
          cumArc += arc;
          return (
            <circle
              key={d.name}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeW}
              strokeDasharray={`${arc} ${circ}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-bold leading-none" style={{ color: "var(--foreground)" }}>{total}</p>
        <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>total</p>
      </div>
    </div>
  );
}

// ─── Shared enrollment filter (page-level) ────────────────────────────────────

function getFilteredEmployees({ filterMode, activeBatch, fromDate, toDate }) {
  if (filterMode === "batch") return EMPLOYEES.filter(e => e.batch === activeBatch);
  return EMPLOYEES.filter(e => e.deadline >= fromDate && e.deadline <= toDate);
}

function buildLocationCostFromEmployees(employees) {
  const map = {};
  employees.forEach(emp => {
    const loc = emp.location ?? "Unknown";
    if (!map[loc]) {
      map[loc] = { location: loc, short: LOCATION_SHORT[loc] ?? loc.slice(0, 3).toUpperCase(), employees: 0, enrolled: 0, cost: 0, prev: 0 };
    }
    map[loc].employees += 1;
    if (emp.status === "approved") {
      map[loc].enrolled += 1;
      map[loc].cost += emp.cost;
    }
  });
  return Object.values(map)
    .map(row => {
      const base = LOCATION_COST.find(l => l.location === row.location);
      return { ...row, prev: base?.prev ?? (Math.round(row.cost * 0.95) || 0) };
    })
    .sort((a, b) => b.cost - a.cost);
}

function BatchSlotCard({ batch, isSelected, onSelect }) {
  if (!batch) {
    return (
      <div
        className="flex flex-1 min-w-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 opacity-60 min-h-[38px]"
        aria-hidden
      >
        <span className="text-xs text-muted-foreground">—</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${batch.label}, ${batch.dateRange}`}
      aria-pressed={isSelected}
      className={cn(
        "flex flex-1 min-w-0 flex-col gap-1 rounded-xl border px-3 py-2 text-left transition-all",
        isSelected
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-muted text-muted-foreground border-border hover:text-foreground hover:border-primary/30",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold truncate">{batch.label}</span>
        {batch.status === "active" && (
          <span className="size-1.5 rounded-full flex-shrink-0 bg-success" />
        )}
        {batch.status === "completed" && (
          <span className={cn(
            "size-1.5 rounded-full flex-shrink-0",
            isSelected ? "bg-primary-foreground/40" : "bg-muted-foreground/50",
          )} />
        )}
      </div>
      <span className={cn(
        "text-xs truncate",
        isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
      )}>
        {batch.dateRange}
      </span>
    </button>
  );
}

function EnrollmentFilterBar({
  filterMode, setFilterMode,
  activeBatch, setActiveBatch,
  fromDate, setFromDate,
  toDate, setToDate,
  employeeCount,
}) {
  const { index, previous, current, next } = getBatchTriplet(activeBatch);
  const canGoPrev = index > 0;
  const canGoNext = index < BATCH_CONFIGS.length - 1;

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-2xl p-3 mb-6">
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 flex-shrink-0">
        {[["batch", "By Batch"], ["range", "Date Range"]].map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilterMode(mode)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              filterMode === mode
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="hidden sm:block w-px h-6 bg-border flex-shrink-0" />

      {filterMode === "batch" ? (
        <>
          <button
            type="button"
            onClick={() => canGoPrev && setActiveBatch(BATCH_CONFIGS[index - 1].id)}
            disabled={!canGoPrev}
            aria-label="Previous batch"
            className="size-8 rounded-xl flex items-center justify-center bg-muted border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          ><ChevronLeft size={15} /></button>

          <div className="grid flex-1 min-w-0 grid-cols-3 gap-2">
            <BatchSlotCard
              batch={previous}
              isSelected={false}
              onSelect={() => previous && setActiveBatch(previous.id)}
            />
            <BatchSlotCard
              batch={current}
              isSelected
              onSelect={() => current && setActiveBatch(current.id)}
            />
            <BatchSlotCard
              batch={next}
              isSelected={false}
              onSelect={() => next && setActiveBatch(next.id)}
            />
          </div>

          <button
            type="button"
            onClick={() => canGoNext && setActiveBatch(BATCH_CONFIGS[index + 1].id)}
            disabled={!canGoNext}
            aria-label="Next batch"
            className="size-8 rounded-xl flex items-center justify-center bg-muted border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          ><ChevronRight size={15} /></button>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">From</label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={e => setFromDate(e.target.value)}
              className="h-8 px-3 rounded-xl border border-border bg-muted text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            />
          </div>
          <ArrowRight size={13} className="text-muted-foreground flex-shrink-0" />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">To</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={e => setToDate(e.target.value)}
              className="h-8 px-3 rounded-xl border border-border bg-muted text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            />
          </div>
        </div>
      )}

      {employeeCount > 0 && (
        <span className="ml-auto px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
          {employeeCount} employee{employeeCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─── Report downloads (right rail) ─────────────────────────────────────────────

const REPORT_DEFS = {
  batch: {
    title: "Batch-wise Report",
    description: "Employee enrollment, dependents, status, and premium for one batch period.",
    icon: FileSpreadsheet,
    includes: [
      "Employee & dependent breakdown",
      "Status summary (pending, completed, missed)",
      "Premium by employee",
      "Location rollup",
    ],
  },
  consolidated: {
    title: "Consolidated Report",
    description: "Cross-batch enrollment summary with totals, trends, and financial rollups.",
    icon: FileDown,
    includes: [
      "All batches in enrollment window",
      "Batch comparison & cost trend",
      "Organization-wide utilization",
      "Dependent cost distribution",
    ],
  },
};

function ReportDownloadsPanel({ filterMode, activeBatch, fromDate, toDate }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [format, setFormat] = useState("xlsx");
  const [phase, setPhase] = useState("idle");

  const batch = BATCH_CONFIGS.find(b => b.id === activeBatch);
  const filteredEmps = useMemo(
    () => getFilteredEmployees({ filterMode, activeBatch, fromDate, toDate }),
    [filterMode, activeBatch, fromDate, toDate],
  );

  const scope = useMemo(() => {
    if (selectedReport === "batch") {
      if (filterMode === "batch" && batch) {
        return {
          label: batch.label,
          period: batch.dateRange,
          employees: filteredEmps.length,
          filename: `insurance-${batch.label.toLowerCase().replace(/\s+/g, "-")}`,
        };
      }
      return {
        label: "Custom date range",
        period: `${fromDate} – ${toDate}`,
        employees: filteredEmps.length,
        filename: `insurance-range-${fromDate}-${toDate}`,
      };
    }
    if (selectedReport === "consolidated") {
      const batchCount = filterMode === "batch"
        ? BATCH_CONFIGS.filter(b => b.id <= activeBatch).length
        : BATCH_CONFIGS.length;
      return {
        label: "Consolidated enrollment",
        period: filterMode === "batch"
          ? `Batches 1 – ${activeBatch} · Open Enrollment 2026`
          : `${fromDate} – ${toDate}`,
        employees: EMPLOYEES.length,
        batches: batchCount,
        filename: "insurance-consolidated-2026",
      };
    }
    return null;
  }, [selectedReport, filterMode, batch, activeBatch, fromDate, toDate, filteredEmps.length]);

  const reportDef = selectedReport ? REPORT_DEFS[selectedReport] : null;
  const ReportIcon = reportDef?.icon;

  useEffect(() => {
    setSelectedReport(null);
    setPhase("idle");
    setFormat("xlsx");
  }, [filterMode, activeBatch, fromDate, toDate]);

  const handleDownload = () => {
    setPhase("generating");
    window.setTimeout(() => setPhase("success"), 1400);
  };

  const handleReset = () => {
    setSelectedReport(null);
    setPhase("idle");
    setFormat("xlsx");
  };

  const ext = format === "xlsx" ? "xlsx" : "pdf";
  const downloadLabel = scope ? `${scope.filename}.${ext}` : "report";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Report Downloads</p>
            <p className="text-xs text-muted-foreground mt-0.5">Export enrollment & financial data</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {phase === "success" && reportDef && scope ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-success/10 border border-success-ring p-4 text-center">
              <div className="size-10 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={20} className="text-success" />
              </div>
              <p className="text-sm font-semibold text-foreground">Report ready</p>
              <p className="text-xs text-muted-foreground mt-1 break-all">{downloadLabel}</p>
            </div>
            <button
              type="button"
              className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download size={14} />
              Download {ext.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-8 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate another report
            </button>
          </div>
        ) : selectedReport && reportDef && scope ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={phase === "generating"}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft size={14} />
              Back to reports
            </button>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {ReportIcon && <ReportIcon size={16} className="text-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{reportDef.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{reportDef.description}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Report scope</p>
              <div className="flex justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Period</span>
                <span className="font-semibold text-foreground text-right">{scope.label}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Coverage</span>
                <span className="font-semibold text-foreground text-right">{scope.period}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Employees</span>
                <span className="font-semibold text-foreground">{scope.employees}</span>
              </div>
              {scope.batches != null && (
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Batches</span>
                  <span className="font-semibold text-foreground">{scope.batches}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Format</p>
              <div className="grid grid-cols-2 gap-2">
                {[["xlsx", "Excel", FileSpreadsheet], ["pdf", "PDF", FileText]].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormat(id)}
                    disabled={phase === "generating"}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                      format === id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Includes</p>
              <ul className="space-y-1.5">
                {reportDef.includes.map(item => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <CheckCircle2 size={12} className="text-success flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={phase === "generating"}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 transition-colors"
            >
              {phase === "generating" ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download size={14} />
                  Generate report
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground mb-3">Select a report type to configure and download.</p>
            {Object.entries(REPORT_DEFS).map(([id, def]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedReport(id)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/30 text-left transition-all group"
              >
                <div className="size-9 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 group-hover:border-primary/30">
                  <def.icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{def.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{def.description}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Overview (batch-based dashboard) ────────────────────────────────────

function OverviewTab({ filterMode, activeBatch, fromDate, toDate }) {
  const batch      = BATCH_CONFIGS.find(b => b.id === activeBatch);

  /** Metric card filter: null = all, or pending / completed / missed */
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    setStatusFilter(null);
  }, [filterMode, activeBatch, fromDate, toDate]);

  const toggleStatusFilter = (key) => {
    setStatusFilter(prev => (prev === key ? null : key));
  };

  const filteredEmps = useMemo(
    () => getFilteredEmployees({ filterMode, activeBatch, fromDate, toDate }),
    [filterMode, activeBatch, fromDate, toDate],
  );

  const batchEnrollmentClosed = batch
    && (batch.status === "completed" || isPastEnrollmentDeadline(batch.endDate));

  const metrics = useMemo(() => {
    const total = filteredEmps.length;
    let completed = 0;
    let missed = 0;
    let pending = 0;
    filteredEmps.forEach(e => {
      const enrollmentClosed = filterMode === "batch"
        ? batchEnrollmentClosed
        : isEnrollmentClosed(e, null);
      const rollup = getOverviewStatus(e.status, enrollmentClosed);
      if (rollup === "completed") completed += 1;
      else if (rollup === "missed") missed += 1;
      else pending += 1;
    });
    return { total, completed, pending, missed };
  }, [filteredEmps, filterMode, batchEnrollmentClosed]);

  const tableEmps = useMemo(() => {
    if (!statusFilter) return filteredEmps;
    return filteredEmps.filter(e => {
      const enrollmentClosed = filterMode === "batch"
        ? batchEnrollmentClosed
        : isEnrollmentClosed(e, null);
      return getOverviewStatus(e.status, enrollmentClosed) === statusFilter;
    });
  }, [filteredEmps, statusFilter, filterMode, batchEnrollmentClosed]);

  const statusFilterLabel = statusFilter
    ? OVERVIEW_STATUS_META[statusFilter]?.label ?? statusFilter
    : null;

  const depChartData = useMemo(() => {
    const agg = { spouse: 0, father: 0, mother: 0, children: 0 };
    filteredEmps.forEach(emp => {
      const d = EMPLOYEE_DEPENDENTS[emp.id];
      if (!d) return;
      agg.spouse   += d.spouse;
      agg.father   += d.father;
      agg.mother   += d.mother;
      agg.children += d.children;
    });
    return [
      { name: "Spouse",   value: agg.spouse,   color: DEP_COLORS.spouse   },
      { name: "Father",   value: agg.father,   color: DEP_COLORS.father   },
      { name: "Mother",   value: agg.mother,   color: DEP_COLORS.mother   },
      { name: "Children", value: agg.children, color: DEP_COLORS.children },
    ].filter(d => d.value > 0);
  }, [filteredEmps]);

  // Premium for date-range mode (sum of approved employee costs)
  const rangePremium = useMemo(
    () => filteredEmps.filter(e => e.status === "approved").reduce((s, e) => s + e.cost, 0),
    [filteredEmps],
  );

  const locationOverview = useMemo(
    () => buildLocationOverviewData(filteredEmps, { batch, filterMode }),
    [filteredEmps, batch, filterMode],
  );

  const locationSubtitle = filterMode === "batch"
    ? `${batch?.label ?? "Batch"} · Status & cost by location`
    : `${fromDate} – ${toDate} · Status & cost by location`;

  const perfPct = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;

  /** Pending only applies while a batch is open or employees are still in flight. */
  const showPendingMetric =
    filterMode === "range"
      ? metrics.pending > 0
      : batch?.status === "active" || metrics.pending > 0;

  /** Missed is only meaningful after enrollment has closed. */
  const showMissedMetric =
    filterMode === "range"
      ? metrics.missed > 0
      : Boolean(batchEnrollmentClosed);

  const metricColCount = 1 + (showPendingMetric ? 1 : 0) + 1 + (showMissedMetric ? 1 : 0);

  return (
    <div className="space-y-5">

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── Left (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Metric cards — hide Pending on closed batches with nothing in flight */}
          <div className={cn(
            "grid gap-3",
            metricColCount >= 4 ? "grid-cols-2 sm:grid-cols-4"
              : metricColCount === 3 ? "grid-cols-3"
              : "grid-cols-2",
          )}>
            <MetricCard
              icon={Users}
              label="Total Requests"
              value={metrics.total}
              variant="primary"
              active={statusFilter === null}
              onClick={() => setStatusFilter(null)}
            />
            {showPendingMetric && (
              <MetricCard
                icon={Clock}
                label="Pending"
                value={metrics.pending}
                variant="warning"
                active={statusFilter === "pending"}
                onClick={() => toggleStatusFilter("pending")}
              />
            )}
            <MetricCard
              icon={CheckCircle2}
              label="Completed"
              value={metrics.completed}
              variant="success"
              active={statusFilter === "completed"}
              onClick={() => toggleStatusFilter("completed")}
            />
            {showMissedMetric && (
              <MetricCard
                icon={X}
                label="Missed"
                value={metrics.missed}
                variant="destructive"
                active={statusFilter === "missed"}
                onClick={() => toggleStatusFilter("missed")}
              />
            )}
          </div>

          {/* Employee breakdown table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Employee Dependent Breakdown</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Per-employee dependent count · {filterMode === "batch" ? batch.label : `${fromDate} – ${toDate}`}
                  {statusFilterLabel ? ` · Showing ${statusFilterLabel}` : ""}
                </p>
              </div>
              {statusFilterLabel && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(null)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/15 transition-colors"
                >
                  Clear filter
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Employee", "Status", "Spouse", "Father", "Mother", "Children", "Total Deps", "Total Premium"].map(h => (
                      <th key={h} className={cn(
                        "px-4 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap",
                        h === "Total Premium" ? "text-right pr-5" : h === "Total Deps" ? "text-right" : "text-left",
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableEmps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {filteredEmps.length === 0
                          ? `No employees found for the selected ${filterMode === "batch" ? "batch" : "date range"}.`
                          : `No ${statusFilterLabel?.toLowerCase() ?? ""} employees in this ${filterMode === "batch" ? "batch" : "period"}.`}
                      </td>
                    </tr>
                  ) : tableEmps.map(emp => {
                    const d   = EMPLOYEE_DEPENDENTS[emp.id] ?? { spouse: 0, father: 0, mother: 0, children: 0 };
                    const tot = d.spouse + d.father + d.mother + d.children;
                    const enrollmentClosed = filterMode === "batch"
                      ? batchEnrollmentClosed
                      : isEnrollmentClosed(emp, null);
                    return (
                      <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <EmployeeAvatar id={emp.id} name={emp.name} />
                            <div>
                              <p className="text-xs font-semibold text-foreground leading-none">{emp.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{emp.dept}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <OverviewStatusPill status={emp.status} enrollmentClosed={enrollmentClosed} />
                        </td>
                        <td className="px-4 py-3 text-center">{d.spouse   ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.spouse   }}>{d.spouse}</span>   : <span className="text-xs text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3 text-center">{d.father   ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.father   }}>{d.father}</span>   : <span className="text-xs text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3 text-center">{d.mother   ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.mother   }}>{d.mother}</span>   : <span className="text-xs text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3 text-center">{d.children ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.children }}>{d.children}</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("text-sm font-bold", tot > 0 ? "text-primary" : "text-muted-foreground")}>{tot}</span>
                        </td>
                        <td className="px-4 py-3 text-right pr-5">
                          {emp.cost > 0 ? (
                            <span className="text-xs font-semibold text-foreground tabular-nums">{fmtCurrencyFull(emp.cost)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dependent distribution donut */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground">Dependent Distribution</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filterMode === "batch"
                  ? `${batch.label} · Enrolled dependents by type`
                  : `${fromDate} – ${toDate} · Enrolled dependents by type`}
              </p>
            </div>
            <div className="flex items-center gap-8">
              <DependentDonutChart data={depChartData} />
              {depChartData.length > 0 ? (
                <div className="flex-1 space-y-3">
                  {depChartData.map(d => {
                    const tot = depChartData.reduce((s, x) => s + x.value, 0);
                    return (
                      <div key={d.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="text-xs font-medium text-foreground">{d.name}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: d.color }}>{d.value}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.value / tot) * 100}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No dependents enrolled for this {filterMode === "batch" ? "batch" : "period"}.</p>
              )}
            </div>
          </div>

        </div>

        {/* ── Right sidebar (1/3) ── */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          {/* Insights panel — adapts to batch vs range mode */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
                {filterMode === "batch" ? "Batch Insights" : "Range Insights"}
              </p>
              {filterMode === "batch" ? (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                  batch.status === "active"    ? "bg-green-400/20 text-green-300 border-green-400/30"
                  : batch.status === "completed" ? "bg-white/15 text-white/80 border-white/25"
                  :                               "bg-white/10 text-white/60 border-white/20",
                )}>
                  {batch.status === "active" ? "Active" : batch.status === "completed" ? "Completed" : "Upcoming"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-sky-400/20 text-sky-200 border-sky-400/30">Custom</span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1 mb-0.5">
              {filterMode === "batch" ? batch.label : "Custom Range"}
            </h3>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
              {filterMode === "batch" ? batch.dateRange : `${fromDate} – ${toDate}`}
            </p>

            <div className="space-y-3">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Total Premium</p>
                <p className="text-2xl font-bold text-white">
                  {fmtCurrency(filterMode === "batch" ? batch.totalPremium : rangePremium)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Completed</p>
                  <p className="text-xl font-bold text-green-300">{metrics.completed}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}%</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Missed</p>
                  <p className="text-xl font-bold text-red-300">{metrics.missed}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{metrics.total > 0 ? Math.round((metrics.missed / metrics.total) * 100) : 0}%</p>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {filterMode === "batch" ? "Batch Performance" : "Overall Performance"}
                  </p>
                  <p className="text-sm font-bold text-white">{perfPct}%</p>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <div className="h-full rounded-full bg-green-400 transition-all duration-700" style={{ width: `${perfPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <LocationOverviewPanel data={locationOverview} subtitle={locationSubtitle} />

          <ReportDownloadsPanel
            filterMode={filterMode}
            activeBatch={activeBatch}
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      </div>

    </div>
  );
}

// ─── Tab: Financial Insights ──────────────────────────────────────────────────

function FinancialTab({ filterMode, activeBatch, fromDate, toDate }) {
  const filteredEmps = useMemo(
    () => getFilteredEmployees({ filterMode, activeBatch, fromDate, toDate }),
    [filterMode, activeBatch, fromDate, toDate],
  );

  const selectedBatch = filterMode === "batch" ? BATCH_CONFIGS.find(b => b.id === activeBatch) : null;
  const locationData  = buildLocationCostFromEmployees(filteredEmps);
  const locationRows  = locationData.length > 0 ? locationData : LOCATION_COST;

  const totalPremium = filterMode === "batch" && selectedBatch
    ? selectedBatch.totalPremium
    : filteredEmps.filter(e => e.status === "approved").reduce((s, e) => s + e.cost, 0);
  const totalEmployees  = locationRows.reduce((s, d) => s + d.employees, 0);
  const totalEnrolled   = locationRows.reduce((s, d) => s + d.enrolled, 0);
  const avgCostPerEmp   = totalEnrolled > 0 ? Math.round(totalPremium / totalEnrolled) : 0;
  const utilizationPct  = totalEmployees > 0 ? Math.round(totalEnrolled / totalEmployees * 100) : 0;

  const dependentCostDist = useMemo(
    () => buildDependentCostDistribution(filteredEmps),
    [filteredEmps],
  );

  const dependentTableSubtitle = filterMode === "batch" && selectedBatch
    ? `${selectedBatch.label} · ${selectedBatch.dateRange}`
    : `${fromDate} – ${toDate}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
      <div className="lg:col-span-2 space-y-5 min-w-0">
      {/* Key financial stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><DollarSign size={18} className="text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Premium</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(totalPremium)}</p>
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

      {/* Cost trend */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Insurance Cost Trend (7 Batches)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total estimated liability per batch · in ₹k</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={BATCH_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={v => `₹${v}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.tooltipBorder}`, fontSize: 12 }}
              formatter={(v) => [`₹${v}k`, "Est. Cost"]}
            />
            <Line type="monotone" dataKey="cost" stroke={CHART.primary} strokeWidth={2.5} dot={{ r: 4, fill: CHART.primary }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cost distribution by dependents */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Cost Distribution by Dependents</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dependentTableSubtitle} · Premium allocated by dependent type
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Type of Dependent", "Total Dependents", "Premium Cost"].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-5 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap",
                    i > 0 ? "text-right" : "text-left",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dependentCostDist.rows.map(row => (
              <tr key={row.key} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: DEP_COLORS[row.key] ?? "var(--muted-foreground)" }}
                    />
                    <span className="text-[13px] font-semibold text-foreground">{row.type}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-xs font-semibold text-foreground tabular-nums">{row.count}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {row.premium > 0 ? fmtCurrencyFull(row.premium) : "—"}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="bg-muted/20">
              <td className="px-5 py-3 text-[13px] font-semibold text-foreground">{dependentCostDist.totals.type}</td>
              <td className="px-5 py-3 text-right text-xs font-semibold text-foreground tabular-nums">
                {dependentCostDist.totals.count}
              </td>
              <td className="px-5 py-3 text-right text-xs font-semibold text-foreground tabular-nums">
                {dependentCostDist.totals.premium > 0
                  ? fmtCurrencyFull(dependentCostDist.totals.premium)
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Location breakdown table */}
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
            {locationRows.map(d => {
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

      <aside className="space-y-4 lg:sticky lg:top-6 self-start">
        <ReportDownloadsPanel
          filterMode={filterMode}
          activeBatch={activeBatch}
          fromDate={fromDate}
          toDate={toDate}
        />
      </aside>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "Overview"           },
  { id: "financial",  label: "Financial Insights" },
];

export default function InsuranceManagementPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filterMode, setFilterMode] = useState("batch");
  const [activeBatch, setActiveBatch] = useState(() => getDefaultActiveBatchId());
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-05-18");

  const filteredEmployeeCount = useMemo(
    () => getFilteredEmployees({ filterMode, activeBatch, fromDate, toDate }).length,
    [filterMode, activeBatch, fromDate, toDate],
  );

  const filterProps = { filterMode, activeBatch, fromDate, toDate };

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
                <h1 className="text-xl font-bold text-foreground">Insurance Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Open Enrollment 2026 · Benefits enrollment oversight · Super Admin</p>
              </div>
              <button
                type="button"
                className="flex flex-shrink-0 items-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-medium text-muted-foreground bg-card border border-border hover:bg-muted transition-colors"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            <EnrollmentFilterBar
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              activeBatch={activeBatch}
              setActiveBatch={setActiveBatch}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
              employeeCount={filteredEmployeeCount}
            />

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
            {activeTab === "overview"  && <OverviewTab {...filterProps} />}
            {activeTab === "financial" && <FinancialTab {...filterProps} />}

          </div>
        </div>
      </div>
    </div>
  );
}
