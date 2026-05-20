import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import {
  ClipboardList, Users, FileText, CheckCircle2,
  Search, Download, Send, ChevronDown,
  MoreVertical, Eye, EyeOff, Clock, Calendar, Building2, X,
  TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, BarChart2, FileSpreadsheet, Filter,
  ArrowRight, FileDown, UserPlus,
  Activity, Settings,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/** Semantic tokens for Recharts (SVG resolves CSS variables). */
const CHART = {
  grid: "var(--border)",
  tick: "var(--muted-foreground)",
  primary: "var(--primary)",
  primaryMuted: "var(--chart-chart-2)",
  tooltipBorder: "var(--border)",
};

/** Explicit fills for Recharts SVG — CSS variables often do not apply to Bar fill. */
const CHART_STATUS_COLORS = {
  completed: "#22c55e",
  pending: "#f59e0b",
  missed: "#ef4444",
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
  pending:   { label: "Pending",         badge: "border-warning-ring bg-warning/10 text-warning",           dot: "bg-warning" },
  completed: { label: "Enrolled",        badge: "border-success-ring bg-success/10 text-success",         dot: "bg-success" },
  missed:    { label: "Did not enroll",  badge: "border-destructive/30 bg-destructive/10 text-destructive", dot: "bg-destructive" },
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
  completed: { label: "Enrolled", fill: CHART_STATUS_COLORS.completed },
  pending:   { label: "Pending", fill: CHART_STATUS_COLORS.pending },
  missed:    { label: "Did not enroll", fill: CHART_STATUS_COLORS.missed },
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

function LocationBarTotalLabel({ x, y, width, height, value }) {
  const total = Number(value);
  if (!total) return null;
  return (
    <text
      x={(x ?? 0) + (width ?? 0) + 8}
      y={(y ?? 0) + (height ?? 0) / 2}
      fill="var(--foreground)"
      fontSize={11}
      fontWeight={600}
      dominantBaseline="middle"
    >
      {total}
    </text>
  );
}

function LocationSegmentLabel({ x, y, width, height, value, dataKey }) {
  const count = Number(value);
  if (!count || count < 2 || (width ?? 0) < 22) return null;
  const fill = dataKey === "pending" ? "#422006" : "#ffffff";
  return (
    <text
      x={(x ?? 0) + (width ?? 0) / 2}
      y={(y ?? 0) + (height ?? 0) / 2}
      fill={fill}
      fontSize={9}
      fontWeight={600}
      textAnchor="middle"
      dominantBaseline="middle"
    >
      {count}
    </text>
  );
}

function LocationStatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const total = row.total || 1;
  const enrolledPct = Math.round((row.completed / total) * 100);
  return (
    <div
      className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs shadow-lg min-w-[168px]"
      style={{ borderColor: CHART.tooltipBorder }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="font-semibold text-foreground">{row.location}</p>
        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{row.total} total</span>
      </div>
      {(["completed", "pending", "missed"]).map(key => {
        if (!row[key]) return null;
        const pct = Math.round((row[key] / total) * 100);
        return (
          <div key={key} className="flex items-center gap-2 mb-1">
            <span className="size-2 rounded-sm shrink-0" style={{ backgroundColor: STATUS_STACK[key].fill }} />
            <span className="flex-1 text-muted-foreground">{STATUS_STACK[key].label}</span>
            <span className="font-semibold text-foreground tabular-nums">{row[key]}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
          </div>
        );
      })}
      <div className="mt-2 pt-2 border-t border-border space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Enrollment rate</span>
          <span className="font-semibold text-success">{enrolledPct}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Estimated premium</span>
          <span className="font-semibold text-foreground">{fmtCurrency(row.cost)}</span>
        </div>
      </div>
    </div>
  );
}

function LocationOverviewPanel({ data, subtitle }) {
  if (data.length === 0) {
    return (
      <Card className="p-5 shadow-none">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground mb-1">
          Location overview
        </p>
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
        <p className="text-xs text-muted-foreground text-center py-6">No employees match this filter.</p>
      </Card>
    );
  }

  const chartHeight = Math.max(160, data.length * 48);
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const chartData = data.map(d => ({ ...d, _trackTrail: Math.max(0, maxTotal - d.total) }));

  return (
    <Card className="p-5 shadow-none">
      <div className="mb-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
          Location overview
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 0, bottom: 4 }}
          barSize={22}
          barCategoryGap="32%"
        >
          <XAxis
            type="number"
            domain={[0, Math.ceil(maxTotal * 1.1)]}
            hide
          />
          <YAxis
            type="category"
            dataKey="short"
            width={38}
            tick={{ fontSize: 10, fill: CHART.tick, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<LocationStatusTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.35 }} />
          <Bar
            dataKey="completed"
            stackId="status"
            fill={STATUS_STACK.completed.fill}
            radius={[4, 0, 0, 4]}
            background={{ fill: "var(--muted)", radius: 4 }}
          >
            <LabelList dataKey="completed" content={<LocationSegmentLabel />} />
          </Bar>
          <Bar dataKey="pending" stackId="status" fill={STATUS_STACK.pending.fill}>
            <LabelList dataKey="pending" content={<LocationSegmentLabel />} />
          </Bar>
          <Bar dataKey="missed" stackId="status" fill={STATUS_STACK.missed.fill} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="missed" content={<LocationSegmentLabel />} />
          </Bar>
          <Bar
            dataKey="_trackTrail"
            stackId="status"
            fill="transparent"
            isAnimationActive={false}
          >
            <LabelList dataKey="total" content={<LocationBarTotalLabel />} />
          </Bar>
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

    </Card>
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
// ─── Shared sub-components ────────────────────────────────────────────────────

function OverviewStatusPill({ status, enrollmentClosed }) {
  const key = getOverviewStatus(status, enrollmentClosed);
  const m = OVERVIEW_STATUS_META[key];
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        m.badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full flex-shrink-0", m.dot)} aria-hidden />
      {m.label}
    </Badge>
  );
}

function MetricCard({ icon: Icon, label, value, sub, variant = "primary", trend, onClick, active }) {
  const v = METRIC_VARIANT[variant] ?? METRIC_VARIANT.primary;
  const interactive = Boolean(onClick);
  return (
    <Card
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={cn(
        "flex items-start gap-3 p-4 flex-1 min-w-0 relative overflow-hidden transition-all shadow-none",
        interactive ? "cursor-pointer hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50" : "cursor-default",
        active ? "ring-2 ring-ring border-primary/30 bg-primary/5" : "",
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
      <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-20", v.bar)} />
    </Card>
  );
}

// ─── Dependent donut chart (SVG) ─────────────────────────────────────────────

const DEP_COLORS = {
  employee: "var(--chart-chart-2)",
  spouse:   "var(--primary)",
  father:   "var(--warning)",
  mother:   "var(--chart-chart-4)",
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
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>total dependents</p>
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
          <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>total dependents</p>
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
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      onClick={onSelect}
      aria-label={`${batch.label}, ${batch.dateRange}`}
      aria-pressed={isSelected}
      className={cn(
        "flex h-auto flex-1 min-w-0 flex-col items-start gap-1 rounded-lg px-3 py-2 text-left",
        !isSelected && "bg-muted text-muted-foreground hover:text-foreground",
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
    </Button>
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
    <Card className="mb-6 flex flex-wrap items-center gap-3 p-3 shadow-none">
      <div className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-muted p-1">
        {[["batch", "By batch"], ["range", "By date range"]].map(([mode, label]) => (
          <Button
            key={mode}
            type="button"
            variant={filterMode === mode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterMode(mode)}
            className={cn(
              "h-7 rounded-md px-3 text-xs font-semibold",
              filterMode === mode && "bg-card text-foreground shadow-sm",
            )}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="hidden sm:block w-px h-6 bg-border flex-shrink-0" />

      {filterMode === "batch" ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => canGoPrev && setActiveBatch(BATCH_CONFIGS[index - 1].id)}
            disabled={!canGoPrev}
            aria-label="Previous batch"
            className="flex-shrink-0"
          ><ChevronLeft size={15} /></Button>

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

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => canGoNext && setActiveBatch(BATCH_CONFIGS[index + 1].id)}
            disabled={!canGoNext}
            aria-label="Next batch"
            className="flex-shrink-0"
          ><ChevronRight size={15} /></Button>
        </>
      ) : (
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="enrollment-from" className="whitespace-nowrap text-xs font-medium text-muted-foreground">From</label>
            <Input
              id="enrollment-from"
              type="date"
              value={fromDate}
              max={toDate}
              onChange={e => setFromDate(e.target.value)}
              className="h-8 w-auto cursor-pointer text-xs"
            />
          </div>
          <ArrowRight size={13} className="flex-shrink-0 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <label htmlFor="enrollment-to" className="whitespace-nowrap text-xs font-medium text-muted-foreground">To</label>
            <Input
              id="enrollment-to"
              type="date"
              value={toDate}
              min={fromDate}
              onChange={e => setToDate(e.target.value)}
              className="h-8 w-auto cursor-pointer text-xs"
            />
          </div>
        </div>
      )}

      {employeeCount > 0 && (
        <Badge className="ml-auto flex-shrink-0 bg-primary/10 text-primary hover:bg-primary/10">
          {employeeCount} employee{employeeCount !== 1 ? "s" : ""} in view
        </Badge>
      )}
    </Card>
  );
}

// ─── Report downloads (right rail) ─────────────────────────────────────────────

const REPORT_DEFS = {
  batch: {
    title: "Batch report",
    description: "Enrollment, dependents, status, and premium for the selected batch.",
    icon: FileSpreadsheet,
    includes: [
      "Employee and dependent breakdown",
      "Status summary (pending, enrolled, did not enroll)",
      "Premium by employee",
      "Premium by location",
    ],
  },
  consolidated: {
    title: "Consolidated report",
    description: "Enrollment and premium totals across batches in the open enrollment window.",
    icon: FileDown,
    includes: [
      "All batches in enrollment window",
      "Batch comparison and premium trend",
      "Organization-wide enrollment rate",
      "Premium by dependent type",
    ],
  },
};

function buildReportScope(reportId, { filterMode, batch, activeBatch, fromDate, toDate, filteredCount }) {
  if (reportId === "batch") {
    if (filterMode === "batch" && batch) {
      return {
        subtitle: `${batch.label} · ${batch.dateRange}`,
        employees: filteredCount,
        filename: `insurance-${batch.label.toLowerCase().replace(/\s+/g, "-")}`,
      };
    }
    return {
      subtitle: `${fromDate} – ${toDate}`,
      employees: filteredCount,
      filename: `insurance-range-${fromDate}-${toDate}`,
    };
  }
  const batchCount = filterMode === "batch"
    ? BATCH_CONFIGS.filter(b => b.id <= activeBatch).length
    : BATCH_CONFIGS.length;
  return {
    subtitle: filterMode === "batch"
      ? `Batches 1 – ${activeBatch} · Open Enrollment 2026`
      : `${fromDate} – ${toDate}`,
    employees: EMPLOYEES.length,
    batches: batchCount,
    filename: "insurance-consolidated-2026",
  };
}

function ReportDownloadsPanel({ filterMode, activeBatch, fromDate, toDate, layout = "sidebar" }) {
  const isHorizontal = layout === "horizontal";
  const [format, setFormat] = useState("xlsx");
  const [busyId, setBusyId] = useState(null);
  const [readyId, setReadyId] = useState(null);

  const batch = BATCH_CONFIGS.find(b => b.id === activeBatch);
  const filteredEmps = useMemo(
    () => getFilteredEmployees({ filterMode, activeBatch, fromDate, toDate }),
    [filterMode, activeBatch, fromDate, toDate],
  );

  useEffect(() => {
    setFormat("xlsx");
    setBusyId(null);
    setReadyId(null);
  }, [filterMode, activeBatch, fromDate, toDate]);

  useEffect(() => {
    if (!readyId) return undefined;
    const t = window.setTimeout(() => setReadyId(null), 5000);
    return () => window.clearTimeout(t);
  }, [readyId]);

  const filterContext = useMemo(() => {
    if (filterMode === "batch" && batch) return `${batch.label} · ${batch.dateRange}`;
    return `${fromDate} – ${toDate}`;
  }, [filterMode, batch, fromDate, toDate]);

  const handleDownload = (reportId) => {
    setBusyId(reportId);
    setReadyId(null);
    window.setTimeout(() => {
      setBusyId(null);
      setReadyId(reportId);
    }, 900);
  };

  const ext = format === "xlsx" ? "xlsx" : "pdf";
  const formatLabel = format === "xlsx" ? "Excel" : "PDF";

  return (
    <Card className="overflow-hidden p-0 shadow-none">
      <CardHeader className="border-b border-border">
        <div className={cn(
          "flex flex-col gap-3",
          isHorizontal && "sm:flex-row sm:items-center sm:justify-between",
        )}>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Download size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Export reports</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Includes: {filterContext}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Format</span>
            <div className="inline-flex rounded-lg bg-muted p-0.5" role="group" aria-label="Export format">
              {[["xlsx", "Excel", FileSpreadsheet], ["pdf", "PDF", FileText]].map(([id, label, Icon]) => (
                <Button
                  key={id}
                  type="button"
                  variant={format === id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFormat(id)}
                  disabled={busyId != null}
                  className={cn(
                    "h-7 gap-1.5 rounded-md px-2.5 text-xs font-semibold",
                    format === id && "bg-card text-foreground shadow-sm",
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className={cn("grid gap-3", isHorizontal ? "sm:grid-cols-2" : "grid-cols-1")}>
          {Object.entries(REPORT_DEFS).map(([id, def]) => {
            const scope = buildReportScope(id, {
              filterMode,
              batch,
              activeBatch,
              fromDate,
              toDate,
              filteredCount: filteredEmps.length,
            });
            const Icon = def.icon;
            const isBusy = busyId === id;
            const isReady = readyId === id;
            const isDisabled = busyId != null && !isBusy;
            const filename = `${scope.filename}.${ext}`;

            return (
              <div
                key={id}
                className={cn(
                  "flex flex-col rounded-xl border border-border bg-muted/20 p-4 transition-colors",
                  isReady && "border-success-ring bg-success/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{def.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{def.description}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{scope.subtitle}</span>
                  {" · "}
                  {scope.employees} employee{scope.employees !== 1 ? "s" : ""}
                  {scope.batches != null && (
                    <> · {scope.batches} batch{scope.batches !== 1 ? "es" : ""}</>
                  )}
                </p>

                <ul className="mt-2 space-y-1">
                  {def.includes.slice(0, 3).map(item => (
                    <li key={item} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 size={11} className="shrink-0 text-success" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>

                {isReady && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success" role="status" aria-live="polite">
                    <CheckCircle2 size={14} className="shrink-0" aria-hidden />
                    <span className="truncate">Ready to download · {filename}</span>
                  </p>
                )}

                <Button
                  type="button"
                  variant={isReady ? "outline" : "default"}
                  className="mt-3 w-full gap-2"
                  onClick={() => handleDownload(id)}
                  disabled={isDisabled}
                  aria-busy={isBusy}
                >
                  {isBusy ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" aria-hidden />
                      Building your {formatLabel} file…
                    </>
                  ) : isReady ? (
                    <>
                      <Download size={14} aria-hidden />
                      Download again
                    </>
                  ) : (
                    <>
                      <Download size={14} aria-hidden />
                      Download as {formatLabel}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

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

  // ── Dependents table: search + pagination ────────────────────────────────
  const DEP_TABLE_PAGE_SIZE = 5;
  const [depSearch, setDepSearch] = useState("");
  const [depPage, setDepPage]     = useState(1);

  // Reset search and page when upstream filters change
  useEffect(() => {
    setDepSearch("");
    setDepPage(1);
  }, [filterMode, activeBatch, fromDate, toDate, statusFilter]);

  const depSearchedEmps = useMemo(() => {
    const q = depSearch.trim().toLowerCase();
    if (!q) return tableEmps;
    return tableEmps.filter(e =>
      e.name.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q),
    );
  }, [tableEmps, depSearch]);

  const depTotalPages = Math.max(1, Math.ceil(depSearchedEmps.length / DEP_TABLE_PAGE_SIZE));

  // Clamp page if total pages shrank
  const depCurrentPage = Math.min(depPage, depTotalPages);

  const depPagedEmps = useMemo(() => {
    const start = (depCurrentPage - 1) * DEP_TABLE_PAGE_SIZE;
    return depSearchedEmps.slice(start, start + DEP_TABLE_PAGE_SIZE);
  }, [depSearchedEmps, depCurrentPage]);

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
    ? `Enrollment status and premium by location · ${batch?.label ?? "Batch"}`
    : `Enrollment status and premium by location · ${fromDate} – ${toDate}`;

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
              label="Total employees"
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
              label="Enrolled"
              value={metrics.completed}
              variant="success"
              active={statusFilter === "completed"}
              onClick={() => toggleStatusFilter("completed")}
            />
            {showMissedMetric && (
              <MetricCard
                icon={X}
                label="Did not enroll"
                value={metrics.missed}
                variant="destructive"
                active={statusFilter === "missed"}
                onClick={() => toggleStatusFilter("missed")}
              />
            )}
          </div>

          {/* Employee breakdown table */}
          <Card className="overflow-hidden p-0 shadow-none">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Dependents by employee</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filterMode === "batch" ? `${batch.label} · ${batch.dateRange}` : `${fromDate} – ${toDate}`}
                  {statusFilterLabel ? ` · Filter: ${statusFilterLabel}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Search employees…"
                    value={depSearch}
                    onChange={e => { setDepSearch(e.target.value); setDepPage(1); }}
                    className="h-8 w-48 pl-8 text-xs"
                  />
                </div>
                {statusFilterLabel && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setStatusFilter(null)}
                    className="h-8 gap-1 bg-primary/10 text-[11px] text-primary hover:bg-primary/15"
                  >
                    Clear filter
                    <X size={12} />
                  </Button>
                )}
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {["Employee", "Status", "Spouse", "Father", "Mother", "Children", "Total dependents", "Premium"].map(h => (
                    <TableHead
                      key={h}
                      scope="col"
                      className={cn(
                        "py-2.5 text-[11px] normal-case tracking-normal",
                        h === "Premium" ? "pr-5 text-right" : h === "Total dependents" ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                  {depPagedEmps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        {depSearch.trim()
                          ? `No employees match "${depSearch.trim()}".`
                          : filteredEmps.length === 0
                            ? `No employees match this ${filterMode === "batch" ? "batch" : "date range"}.`
                            : statusFilter === "pending"
                              ? `No pending employees in this ${filterMode === "batch" ? "batch" : "period"}.`
                              : statusFilter === "completed"
                                ? `No enrolled employees in this ${filterMode === "batch" ? "batch" : "period"}.`
                                : `No employees who did not enroll in this ${filterMode === "batch" ? "batch" : "period"}.`}
                      </TableCell>
                    </TableRow>
                  ) : depPagedEmps.map(emp => {
                    const d   = EMPLOYEE_DEPENDENTS[emp.id] ?? { spouse: 0, father: 0, mother: 0, children: 0 };
                    const tot = d.spouse + d.father + d.mother + d.children;
                    const enrollmentClosed = filterMode === "batch"
                      ? batchEnrollmentClosed
                      : isEnrollmentClosed(emp, null);
                    return (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <EmployeeAvatar id={emp.id} name={emp.name} />
                            <div>
                              <p className="text-xs font-semibold text-foreground leading-none">{emp.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{emp.dept}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <OverviewStatusPill status={emp.status} enrollmentClosed={enrollmentClosed} />
                        </TableCell>
                        <TableCell className="text-center">{d.spouse   ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.spouse   }}>{d.spouse}</span>   : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-center">{d.father   ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.father   }}>{d.father}</span>   : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-center">{d.mother   ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.mother   }}>{d.mother}</span>   : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-center">{d.children ? <span className="text-xs font-semibold" style={{ color: DEP_COLORS.children }}>{d.children}</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("text-sm font-bold", tot > 0 ? "text-primary" : "text-muted-foreground")}>{tot}</span>
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          {emp.cost > 0 ? (
                            <span className="text-xs font-semibold text-foreground tabular-nums">{fmtCurrencyFull(emp.cost)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            {/* Pagination footer */}
            {depTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  {depSearchedEmps.length} employee{depSearchedEmps.length !== 1 ? "s" : ""} · page {depCurrentPage} of {depTotalPages}
                </p>
                <Pagination className="w-auto mx-0">
                  <PaginationContent className="gap-0.5">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={e => { e.preventDefault(); setDepPage(p => Math.max(1, p - 1)); }}
                        className={cn("h-7 text-xs cursor-pointer", depCurrentPage === 1 && "pointer-events-none opacity-40")}
                        aria-disabled={depCurrentPage === 1}
                        text="Prev"
                      />
                    </PaginationItem>
                    {Array.from({ length: depTotalPages }, (_, i) => i + 1).map(pg => (
                      <PaginationItem key={pg}>
                        <PaginationLink
                          isActive={pg === depCurrentPage}
                          onClick={e => { e.preventDefault(); setDepPage(pg); }}
                          className="h-7 w-7 text-xs cursor-pointer"
                        >
                          {pg}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={e => { e.preventDefault(); setDepPage(p => Math.min(depTotalPages, p + 1)); }}
                        className={cn("h-7 text-xs cursor-pointer", depCurrentPage === depTotalPages && "pointer-events-none opacity-40")}
                        aria-disabled={depCurrentPage === depTotalPages}
                        text="Next"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>

          {/* Dependent distribution donut */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground">Dependents by type</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enrolled only · {filterMode === "batch"
                  ? `${batch.label} · ${batch.dateRange}`
                  : `${fromDate} – ${toDate}`}
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
                <p className="text-sm text-muted-foreground">No enrolled dependents in this {filterMode === "batch" ? "batch" : "period"}.</p>
              )}
            </div>
          </div>

        </div>

        {/* ── Right sidebar (1/3) ── */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          {/* Insights panel — adapts to batch vs range mode */}
          <Card className="rounded-xl border border-border border-l-4 border-l-primary bg-card p-5 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {filterMode === "batch" ? "Batch summary" : "Date range summary"}
              </p>
              {filterMode === "batch" ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                    batch.status === "active" && "border-primary/30 bg-primary/10 text-primary",
                    batch.status === "completed" && "border-border bg-muted text-muted-foreground",
                    batch.status !== "active" && batch.status !== "completed" && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {batch.status === "active" ? "Active" : batch.status === "completed" ? "Completed" : "Upcoming"}
                </Badge>
              ) : (
                <Badge variant="outline" className="h-auto shrink-0 rounded-full border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">
                  Custom range
                </Badge>
              )}
            </div>
            <h3 className="mt-1 mb-0.5 text-base font-bold text-foreground">
              {filterMode === "batch" ? batch.label : "Custom date range"}
            </h3>
            <p className="mb-5 text-xs text-muted-foreground">
              {filterMode === "batch" ? batch.dateRange : `${fromDate} – ${toDate}`}
            </p>

            <div className="space-y-3">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="mb-1 text-[10px] font-medium text-muted-foreground">Total premium</p>
                <p className="text-2xl font-bold text-primary">
                  {fmtCurrency(filterMode === "batch" ? batch.totalPremium : rangePremium)}
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Enrollment completion
                  </p>
                  <p className="text-sm font-bold text-foreground">{perfPct}% complete</p>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${perfPct}%` }} />
                </div>
              </div>
            </div>
          </Card>

          <LocationOverviewPanel data={locationOverview} subtitle={locationSubtitle} />
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
    <div className="space-y-5">
      <div className="space-y-5 min-w-0">
      {/* Key financial stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><DollarSign size={18} className="text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Premium</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(totalPremium)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0"><Users size={18} className="text-success" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Average premium per enrolled employee</p>
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(avgCostPerEmp)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{totalEnrolled} of {totalEmployees} employees enrolled</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0"><BarChart2 size={18} className="text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Enrollment rate</p>
            <p className="text-2xl font-bold text-foreground">{utilizationPct}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">{totalEnrolled} of {totalEmployees} employees enrolled</p>
          </div>
        </div>
      </div>

      {/* Cost trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Premium trend by batch</p>
            <p className="text-xs text-muted-foreground mt-0.5">Last 7 batches · amounts in ₹ thousands</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={BATCH_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={v => `₹${v}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.tooltipBorder}`, fontSize: 12 }}
              formatter={(v) => [`₹${v}k`, "Estimated premium"]}
            />
            <Line type="monotone" dataKey="cost" stroke={CHART.primary} strokeWidth={2.5} dot={{ r: 4, fill: CHART.primary }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cost distribution by dependents */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Premium by dependent type</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dependentTableSubtitle} · Split across enrolled employees
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Dependent type", "Count", "Premium"].map((h, i) => (
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
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Premium by location</p>
          <p className="text-xs text-muted-foreground mt-0.5">Headcount, enrollment, and premium</p>
          {locationData.length === 0 && (
            <p className="text-[11px] text-warning mt-1">No employees match your filter. Showing company-wide baseline data.</p>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Location", "Employees", "Enrolled", "Enrollment rate", "Premium", "Change vs prior period", "Avg premium per enrolled"].map(h => (
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

      <ReportDownloadsPanel
        layout="horizontal"
        filterMode={filterMode}
        activeBatch={activeBatch}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "Overview"           },
  { id: "financial",  label: "Financials" },
];

export default function InsuranceManagementPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filterMode, setFilterMode] = useState("batch");
  const [activeBatch, setActiveBatch] = useState(() => getDefaultActiveBatchId());
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-05-18");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredEmployeeCount = useMemo(
    () => getFilteredEmployees({ filterMode, activeBatch, fromDate, toDate }).length,
    [filterMode, activeBatch, fromDate, toDate],
  );

  const filterProps = { filterMode, activeBatch, fromDate, toDate };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <main className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="insurance-management" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full min-h-0 max-w-[1280px] flex-col px-6 pt-5 pb-8">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h1 className="text-xl font-bold text-foreground">Insurance Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Open Enrollment 2026 · Track enrollment and premium across batches</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  aria-busy={isRefreshing}
                >
                  <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => onNavigate?.("insurance-config")}
                >
                  <Settings size={13} />
                  Configuration
                </Button>
              </div>
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="mb-0">
                {TABS.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="overview" className="mt-5">
                <OverviewTab {...filterProps} />
              </TabsContent>
              <TabsContent value="financial" className="mt-5">
                <FinancialTab {...filterProps} />
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </div>
    </main>
  );
}
