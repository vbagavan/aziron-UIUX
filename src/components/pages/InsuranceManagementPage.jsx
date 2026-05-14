import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ClipboardList, Users, UserCheck, UserX, FileText, CheckCircle2,
  AlertTriangle, Search, Download, Send, ChevronDown,
  MoreVertical, Eye, Mail, Clock, Calendar, Building2, X,
  TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, BarChart2, FileSpreadsheet, Filter, Zap,
  CircleSlash, ArrowRight, FileDown, Play,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";

// ─── Mock data ────────────────────────────────────────────────────────────────

const DEPARTMENTS = ["Engineering", "Marketing", "Finance", "HR", "Operations", "Sales", "Legal", "Product"];

const EMPLOYEES = [
  { id: 1,  name: "Alice Monroe",    dept: "Engineering", status: "approved",            submitted: "2026-05-01", deadline: "2026-05-15", email: "alice@meridian.com",  cycle: 1, plan: "Family",     cost: 820 },
  { id: 2,  name: "Brian Kwon",      dept: "Marketing",   status: "pending",             submitted: null,         deadline: "2026-05-15", email: "brian@meridian.com",  cycle: 1, plan: "Individual",  cost: 0   },
  { id: 3,  name: "Carla Ruiz",      dept: "Finance",     status: "under_clarification", submitted: "2026-05-03", deadline: "2026-05-15", email: "carla@meridian.com",  cycle: 1, plan: "Couple",      cost: 610 },
  { id: 4,  name: "David Chen",      dept: "HR",          status: "submitted",           submitted: "2026-05-07", deadline: "2026-05-15", email: "david@meridian.com",  cycle: 1, plan: "Individual",  cost: 340 },
  { id: 5,  name: "Eva Larsson",     dept: "Operations",  status: "approved",            submitted: "2026-04-29", deadline: "2026-05-15", email: "eva@meridian.com",    cycle: 1, plan: "Family",      cost: 820 },
  { id: 6,  name: "Frank Osei",      dept: "Sales",       status: "draft",               submitted: null,         deadline: "2026-05-15", email: "frank@meridian.com",  cycle: 1, plan: "—",           cost: 0   },
  { id: 7,  name: "Grace Tanner",    dept: "Legal",       status: "expired",             submitted: null,         deadline: "2026-04-30", email: "grace@meridian.com",  cycle: 2, plan: "—",           cost: 0   },
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
  { id: 19, name: "Sam Eriksson",    dept: "Finance",     status: "expired",             submitted: null,         deadline: "2026-04-30", email: "sam@meridian.com",    cycle: 2, plan: "—",           cost: 0   },
  { id: 20, name: "Tara Mitchell",   dept: "HR",          status: "closed",              submitted: "2026-04-18", deadline: "2026-05-01", email: "tara@meridian.com",   cycle: 2, plan: "Couple",      cost: 610 },
];

const DEPT_COST = [
  { dept: "Engineering", short: "Eng",  employees: 52, enrolled: 41, cost: 320000, prev: 298000 },
  { dept: "Marketing",   short: "Mktg", employees: 28, enrolled: 19, cost: 148000, prev: 162000 },
  { dept: "Finance",     short: "Fin",  employees: 35, enrolled: 29, cost: 226000, prev: 214000 },
  { dept: "HR",          short: "HR",   employees: 18, enrolled: 14, cost: 109000, prev: 104000 },
  { dept: "Operations",  short: "Ops",  employees: 44, enrolled: 33, cost: 257000, prev: 241000 },
  { dept: "Sales",       short: "Sales",employees: 31, enrolled: 22, cost: 171000, prev: 179000 },
  { dept: "Legal",       short: "Legal",employees: 14, enrolled: 10, cost: 78000,  prev: 74000  },
  { dept: "Product",     short: "Prod", employees: 26, enrolled: 21, cost: 163000, prev: 156000 },
];

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
  approved:             { label: "Approved",            color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", dot: "#10b981" },
  submitted:            { label: "Submitted",           color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", dot: "#3b82f6" },
  under_clarification:  { label: "Under Clarification", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b" },
  pending:              { label: "Pending",             color: "#ea580c", bg: "#fff7ed", border: "#fdba74", dot: "#f97316" },
  closed:               { label: "Closed",              color: "#64748b", bg: "#f8fafc", border: "#cbd5e1", dot: "#94a3b8" },
  draft:                { label: "Draft",               color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", dot: "#8b5cf6" },
  not_accessed:         { label: "Not Accessed",        color: "#b45309", bg: "#fefce8", border: "#fde68a", dot: "#eab308" },
  expired:              { label: "Expired",             color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
  rejected:             { label: "Rejected",            color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
};

const AVATAR_COLORS = [
  ["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#ec4899","#be185d"],
  ["#f59e0b","#b45309"],["#10b981","#047857"],["#06b6d4","#0e7490"],
  ["#f97316","#c2410c"],["#6366f1","#4338ca"],["#84cc16","#4d7c0f"],
  ["#14b8a6","#0f766e"],
];
function avatarGrad(id) {
  const [f, t] = AVATAR_COLORS[id % AVATAR_COLORS.length];
  return `linear-gradient(135deg,${f},${t})`;
}
function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function fmtCurrency(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000)    return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatusPill({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none whitespace-nowrap"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color, bg, trend, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl p-4 flex-1 min-w-0 relative overflow-hidden transition-all cursor-default ${
        active ? "ring-2" : "ring-0"
      }`}
      style={{
        background: active ? bg : "#fff",
        border: active ? `1px solid ${color}55` : "1px solid #e2e8f0",
        ringColor: color,
      }}
    >
      <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: bg }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#64748b] font-medium leading-none mb-1.5">{label}</p>
        <p className="text-2xl font-bold text-[#0f172a] leading-none">{value}</p>
        {sub && <p className="text-[11px] text-[#94a3b8] mt-1">{sub}</p>}
      </div>
      {trend != null && (
        <div className={`flex items-center gap-0.5 text-[11px] font-semibold mt-1 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend)}%
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl" style={{ background: color, opacity: 0.2 }} />
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

  const totalInvited  = EMPLOYEES.length;
  const activeEnroll  = EMPLOYEES.filter(e => e.status === "approved").length;
  const pendingEnroll = EMPLOYEES.filter(e => ["pending", "submitted"].includes(e.status)).length;
  const drafts        = EMPLOYEES.filter(e => e.status === "draft").length;
  const completed     = EMPLOYEES.filter(e => ["approved", "closed"].includes(e.status)).length;
  const dropOffs      = EMPLOYEES.filter(e => ["expired", "not_accessed"].includes(e.status)).length;

  const underReview   = EMPLOYEES.filter(e => e.status === "submitted").length;
  const clarification = EMPLOYEES.filter(e => e.status === "under_clarification").length;
  const approved      = EMPLOYEES.filter(e => e.status === "approved").length;
  const closed        = EMPLOYEES.filter(e => e.status === "closed").length;
  const rejected      = 7; // mock

  const progressSegs = [
    { color: "#10b981", count: completed },
    { color: "#3b82f6", count: underReview },
    { color: "#f59e0b", count: clarification },
    { color: "#8b5cf6", count: drafts },
    { color: "#f97316", count: pendingEnroll - underReview },
    { color: "#ef4444", count: dropOffs },
  ];

  const filtered = EMPLOYEES.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || e.status === statusFilter;
    const matchD = deptFilter   === "all" || e.dept   === deptFilter;
    return matchQ && matchS && matchD;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Enrollment Metrics */}
      <div>
        <SectionHeading icon={Users} label="Enrollment Metrics" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard icon={Users}        label="Total Invitations"  value={totalInvited}  sub="All employees"          color="#2563eb" bg="#eff6ff" />
          <MetricCard icon={UserCheck}    label="Active Enrollments" value={activeEnroll}  sub={`${Math.round(activeEnroll/totalInvited*100)}% enrolled`} color="#059669" bg="#ecfdf5" trend={8}  />
          <MetricCard icon={Clock}        label="Pending"            value={pendingEnroll} sub="Awaiting action"        color="#ea580c" bg="#fff7ed" />
          <MetricCard icon={FileText}     label="Drafts Saved"       value={drafts}        sub="In progress"            color="#7c3aed" bg="#f5f3ff" />
          <MetricCard icon={CheckCircle2} label="Completed"          value={completed}     sub="Approved & closed"      color="#059669" bg="#ecfdf5" trend={12} />
          <MetricCard icon={UserX}        label="Drop-offs"          value={dropOffs}      sub="Expired / not accessed" color="#dc2626" bg="#fef2f2" />
        </div>
      </div>

      {/* Processing Metrics */}
      <div>
        <SectionHeading icon={ClipboardList} label="Processing Metrics" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={FileText}     label="Under Review"         value={underReview}   sub="Awaiting processing" color="#2563eb" bg="#eff6ff" />
          <MetricCard icon={AlertTriangle}label="Clarification Pending" value={clarification} sub="Need more info"     color="#d97706" bg="#fffbeb" />
          <MetricCard icon={CheckCircle2} label="Approved"             value={approved}      sub="Fully approved"      color="#059669" bg="#ecfdf5" trend={5}  />
          <MetricCard icon={X}            label="Closed"               value={closed}        sub="Cases resolved"      color="#64748b" bg="#f8fafc" />
          <MetricCard icon={CircleSlash}  label="Rejected"             value={rejected}      sub="Requires follow-up"  color="#dc2626" bg="#fef2f2" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">Overall Enrollment Progress</p>
            <p className="text-xs text-[#64748b] mt-0.5">Open Enrollment 2026 · Deadline May 15, 2026</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-[#0f172a]">{Math.round(completed / totalInvited * 100)}%</span>
            <p className="text-xs text-[#64748b]">Complete</p>
          </div>
        </div>
        <div className="flex gap-0.5 h-3 rounded-full overflow-hidden w-full">
          {progressSegs.map(({ color, count }, i) =>
            count > 0 ? (
              <div key={i} className="h-full" style={{ width: `${(count / totalInvited) * 100}%`, background: color }} />
            ) : null
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          {[
            { label: "Completed",     color: "#10b981", count: completed    },
            { label: "Under Review",  color: "#3b82f6", count: underReview  },
            { label: "Clarification", color: "#f59e0b", count: clarification},
            { label: "Draft",         color: "#8b5cf6", count: drafts       },
            { label: "Pending",       color: "#f97316", count: pendingEnroll - underReview },
            { label: "Drop-offs",     color: "#ef4444", count: dropOffs     },
          ].map(({ label, color, count }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-[#64748b]">{label}</span>
              <span className="text-xs font-semibold text-[#0f172a]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollment table */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#0f172a]">Enrollment Records</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#64748b]">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search employees…"
                className="h-8 pl-7 pr-3 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-blue-400 w-44" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-8 pl-3 pr-7 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer">
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
            <div className="relative">
              <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                className="h-8 pl-3 pr-7 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer">
                <option value="all">All Depts</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9]">
                {["Employee", "Department", "Plan", "Status", "Cycle", "Est. Cost", "Deadline", "Actions"].map(h => (
                  <th key={h} className={`px-5 py-3 text-left text-xs font-semibold text-[#64748b] whitespace-nowrap ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-[#94a3b8]">No records match your filters.</td></tr>
              ) : paginated.map(emp => (
                <tr key={emp.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ background: avatarGrad(emp.id) }}>{initials(emp.name)}</div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f172a] leading-none">{emp.name}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-[#475569] flex items-center gap-1.5"><Building2 size={11} className="text-[#94a3b8]" />{emp.dept}</span></td>
                  <td className="px-5 py-3"><span className="text-xs font-medium text-[#475569]">{emp.plan}</span></td>
                  <td className="px-5 py-3"><StatusPill status={emp.status} /></td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1f5f9] text-[#475569]">
                      C{emp.cycle}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-[#0f172a]">{emp.cost > 0 ? `$${emp.cost}` : "—"}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                      <Calendar size={11} className="text-[#94a3b8]" />
                      {new Date(emp.deadline + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="size-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#2563eb] hover:bg-blue-50 transition-colors"><Eye size={13} /></button>
                      <button className="size-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#059669] hover:bg-emerald-50 transition-colors"><Mail size={13} /></button>
                      <button className="size-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] transition-colors"><MoreVertical size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#f1f5f9]">
            <p className="text-xs text-[#64748b]">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="size-7 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`size-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${n === page ? "bg-blue-600 text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="size-7 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed">
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
      <div className="rounded-2xl overflow-hidden border border-[#bfdbfe]" style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}>
        <div className="px-6 py-5 flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Current Active Cycle</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-400/20 text-green-300 border border-green-400/30">LIVE</span>
              </div>
              <h2 className="text-xl font-bold text-white">{currentCycle.label}</h2>
              <p className="text-sm text-blue-200 mt-1">
                {currentCycle.start} → {currentCycle.end} · Processing begins on cutoff: <strong className="text-white">{currentCycle.cutoff}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{currentCycle.daysRemaining}</p>
              <p className="text-xs text-blue-200 mt-0.5">day{currentCycle.daysRemaining !== 1 ? "s" : ""} to cutoff</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{currentCycle.submissionsInBatch}</p>
              <p className="text-xs text-blue-200 mt-0.5">in this batch</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-blue-200">Cycle completion</span>
            <span className="text-xs font-semibold text-white">{currentCycle.completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/20">
            <div className="h-2 rounded-full bg-white transition-all duration-500" style={{ width: `${currentCycle.completionPct}%` }} />
          </div>
        </div>
      </div>

      {/* Cycle metrics */}
      <div>
        <SectionHeading icon={BarChart2} label="Cycle Metrics" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard icon={Users}        label="Current Cycle Volume" value={currentCycle.submissionsInBatch}
            sub="Submissions queued"                               color="#2563eb" bg="#eff6ff" />
          <MetricCard icon={BarChart2}    label="vs Previous Cycle"   value={currentCycle.prevTotal}
            sub="Apr C2 submissions"                              color="#7c3aed" bg="#f5f3ff"
            trend={Math.round((currentCycle.submissionsInBatch - currentCycle.prevTotal) / currentCycle.prevTotal * 100)} />
          <MetricCard icon={CheckCircle2} label="Cycle Completion"    value={`${currentCycle.completionPct}%`}
            sub="Of expected submissions"                         color="#059669" bg="#ecfdf5" />
          <MetricCard icon={DollarSign}   label="Est. Cycle Cost"     value="$284k"
            sub="Projected insurance cost"                        color="#d97706" bg="#fffbeb" />
        </div>
      </div>

      {/* Business logic callout */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
        <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Clock size={15} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">Batch Processing Logic</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            All submissions received between <strong>May 1 – May 15</strong> are batched together.
            Even if an employee submits on May 2nd, their request will not be processed until the <strong>cycle cutoff on May 15</strong>.
            This consolidates requests for operational and financial processing.
          </p>
        </div>
      </div>

      {/* Cycle timeline */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <p className="text-sm font-semibold text-[#0f172a] mb-4">May 2026 — Processing Timeline</p>
        <div className="relative">
          {/* Track */}
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-[#e2e8f0] rounded-full" />
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
                  step.state === "done"    ? "bg-blue-600 border-blue-600 text-white" :
                  step.state === "current" ? "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100" :
                  step.state === "next"    ? "bg-amber-50 border-amber-400 text-amber-700" :
                  "bg-white border-[#e2e8f0] text-[#94a3b8]"
                }`}>
                  {step.state === "done" ? <CheckCircle2 size={16} /> : step.state === "current" ? <Play size={12} /> : <ArrowRight size={12} />}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-[#0f172a]">{step.day}</p>
                  <p className={`text-[11px] font-semibold ${step.state === "current" ? "text-blue-600" : "text-[#475569]"}`}>{step.label}</p>
                  <p className="text-[10px] text-[#94a3b8] max-w-[70px]">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Batch queue */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#0f172a]">Current Batch Queue</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{batchQueue.length} pending processing</span>
          </div>
          <span className="text-xs text-[#64748b]">Processing on May 15, 2026</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9]">
              {["Employee", "Department", "Plan", "Submitted", "Status", "Est. Cost"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#64748b]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batchQueue.map(emp => (
              <tr key={emp.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: avatarGrad(emp.id) }}>{initials(emp.name)}</div>
                    <span className="text-[13px] font-semibold text-[#0f172a]">{emp.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3"><span className="text-xs text-[#475569]">{emp.dept}</span></td>
                <td className="px-5 py-3"><span className="text-xs font-medium text-[#475569]">{emp.plan}</span></td>
                <td className="px-5 py-3"><span className="text-xs text-[#64748b]">{emp.submitted ? new Date(emp.submitted + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span></td>
                <td className="px-5 py-3"><StatusPill status={emp.status} /></td>
                <td className="px-5 py-3"><span className="text-xs font-semibold text-[#0f172a]">{emp.cost > 0 ? `$${emp.cost}` : "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next cycle preview */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
        <div className="size-8 rounded-xl bg-[#e2e8f0] flex items-center justify-center flex-shrink-0">
          <ArrowRight size={15} className="text-[#64748b]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#0f172a]">Next: {nextCycle.label}</p>
          <p className="text-xs text-[#64748b] mt-0.5">{nextCycle.start} → {nextCycle.end} · Opens {nextCycle.starts}</p>
        </div>
        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#e2e8f0] text-[#64748b]">Upcoming</span>
      </div>
    </div>
  );
}

// ─── Tab: Financial Insights ──────────────────────────────────────────────────

function FinancialTab() {
  const totalLiability  = DEPT_COST.reduce((s, d) => s + d.cost, 0);
  const prevLiability   = DEPT_COST.reduce((s, d) => s + d.prev, 0);
  const totalEmployees  = DEPT_COST.reduce((s, d) => s + d.employees, 0);
  const totalEnrolled   = DEPT_COST.reduce((s, d) => s + d.enrolled, 0);
  const avgCostPerEmp   = Math.round(totalLiability / totalEnrolled);
  const utilizationPct  = Math.round(totalEnrolled / totalEmployees * 100);

  const chartData = DEPT_COST.map(d => ({
    name: d.short,
    Current: Math.round(d.cost / 1000),
    Previous: Math.round(d.prev / 1000),
  }));

  return (
    <div className="space-y-5">
      {/* Key financial stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><DollarSign size={18} className="text-blue-600" /></div>
          <div>
            <p className="text-xs text-[#64748b] font-medium mb-1">Total Estimated Liability</p>
            <p className="text-2xl font-bold text-[#0f172a]">{fmtCurrency(totalLiability)}</p>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              {totalLiability > prevLiability
                ? <><TrendingUp size={11} className="text-emerald-600" /><span className="text-emerald-600 font-semibold">+{Math.round((totalLiability - prevLiability) / prevLiability * 100)}%</span></>
                : <><TrendingDown size={11} className="text-red-500" /><span className="text-red-500 font-semibold">{Math.round((totalLiability - prevLiability) / prevLiability * 100)}%</span></>
              }
              <span className="text-[#94a3b8]">vs prev cycle</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0"><Users size={18} className="text-emerald-600" /></div>
          <div>
            <p className="text-xs text-[#64748b] font-medium mb-1">Avg Cost per Employee</p>
            <p className="text-2xl font-bold text-[#0f172a]">{fmtCurrency(avgCostPerEmp)}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">{totalEnrolled} enrolled of {totalEmployees} total</p>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0"><BarChart2 size={18} className="text-purple-600" /></div>
          <div>
            <p className="text-xs text-[#64748b] font-medium mb-1">Insurance Utilization</p>
            <p className="text-2xl font-bold text-[#0f172a]">{utilizationPct}%</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">{totalEnrolled} out of {totalEmployees} employees</p>
          </div>
        </div>
      </div>

      {/* Dept cost chart */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">Department-wise Cost Analysis</p>
            <p className="text-xs text-[#64748b] mt-0.5">Current vs previous cycle · in $k</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-blue-500" />Current</div>
            <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-blue-200" />Previous</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v, name) => [`$${v}k`, name]}
            />
            <Bar dataKey="Current"  fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Previous" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost trend */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">Insurance Cost Trend (7 Cycles)</p>
            <p className="text-xs text-[#64748b] mt-0.5">Total estimated liability per cycle · in $k</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={CYCLE_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={v => `$${v}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v) => [`$${v}k`, "Est. Cost"]}
            />
            <Line type="monotone" dataKey="cost" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dept breakdown table */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9]">
          <p className="text-sm font-semibold text-[#0f172a]">Department Cost Breakdown</p>
          <p className="text-xs text-[#64748b] mt-0.5">Employee count vs insurance cost per department</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9]">
              {["Department", "Total Employees", "Enrolled", "Utilization", "Est. Cost (Current)", "vs Previous", "Avg/Employee"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEPT_COST.map(d => {
              const delta = d.cost - d.prev;
              const deltaPct = Math.round(delta / d.prev * 100);
              return (
                <tr key={d.dept} className="border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-[#94a3b8]" />
                      <span className="text-[13px] font-semibold text-[#0f172a]">{d.dept}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-[#475569]">{d.employees}</span></td>
                  <td className="px-5 py-3"><span className="text-xs text-[#475569]">{d.enrolled}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[#e2e8f0]">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.round(d.enrolled / d.employees * 100)}%` }} />
                      </div>
                      <span className="text-xs text-[#64748b]">{Math.round(d.enrolled / d.employees * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs font-semibold text-[#0f172a]">{fmtCurrency(d.cost)}</span></td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {delta >= 0 ? "+" : ""}{deltaPct}%
                    </span>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-[#64748b]">{fmtCurrency(Math.round(d.cost / d.enrolled))}</span></td>
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
    { id: "excel",       icon: FileSpreadsheet, label: "Excel Export",          desc: "Full data export as .xlsx with all employee records and statuses", color: "#059669", bg: "#ecfdf5" },
    { id: "cycle",       icon: RefreshCw,       label: "Cycle-wise Report",     desc: "Submission volume, completion %, and cost estimates per cycle",    color: "#2563eb", bg: "#eff6ff" },
    { id: "daily",       icon: Calendar,        label: "Daily Operational",     desc: "Day-by-day submission counts and status changes",                  color: "#7c3aed", bg: "#f5f3ff" },
    { id: "dept",        icon: Building2,       label: "Department Summary",    desc: "Per-department enrollment rates, costs, and pending actions",      color: "#d97706", bg: "#fffbeb" },
    { id: "status",      icon: ClipboardList,   label: "Submission Status",     desc: "Breakdown by status — approved, pending, rejected, clarification", color: "#ea580c", bg: "#fff7ed" },
    { id: "financial",   icon: DollarSign,      label: "Financial Estimation",  desc: "Projected insurance liability and cost per cycle for Finance team", color: "#0891b2", bg: "#ecfeff" },
  ];

  return (
    <div className="space-y-5">
      {/* Filter panel */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-[#64748b]" />
          <p className="text-sm font-semibold text-[#0f172a]">Report Filters</p>
          <span className="text-xs text-[#94a3b8]">Applied to all exports below</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Department</label>
            <div className="relative">
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="w-full h-9 pl-3 pr-7 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer">
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Status</label>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                className="w-full h-9 pl-3 pr-7 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer">
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Employee Category</label>
            <div className="relative">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-9 pl-3 pr-7 rounded-xl text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer">
                <option value="all">All Employees</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f1f5f9]">
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <span className="font-medium">Active filters:</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{dateFrom} → {dateTo}</span>
            {deptFilter !== "all" && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{deptFilter}</span>}
            {statusFilter !== "all" && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">{STATUS_META[statusFilter]?.label}</span>}
          </div>
        </div>
      </div>

      {/* Report types */}
      <div>
        <SectionHeading icon={FileDown} label="Available Reports" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_TYPES.map(r => (
            <div key={r.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#bfdbfe] transition-colors">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: r.bg }}>
                  <r.icon size={16} style={{ color: r.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a]">{r.label}</p>
                  <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-[#f8fafc]">
                <button
                  onClick={() => handleGenerate(r.id)}
                  className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold transition-colors text-white"
                  style={{ background: generating === r.id ? "#94a3b8" : r.color }}
                  disabled={generating === r.id}
                >
                  {generating === r.id
                    ? <><RefreshCw size={11} className="animate-spin" /> Generating…</>
                    : <><Download size={11} /> Download</>
                  }
                </button>
                <button
                  onClick={() => handleGenerate(r.id + "_preview")}
                  className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-medium border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] transition-colors"
                >
                  <Eye size={11} /> Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share to Finance */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <div className="size-10 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Send size={18} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0f172a]">Share Estimation Report with Finance Team</p>
          <p className="text-xs text-[#64748b] mt-0.5">Auto-send cycle-level financial summaries for budgeting, approvals, and fund allocation.</p>
        </div>
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex-shrink-0">
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
      <Icon size={13} className="text-[#64748b]" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">{label}</h2>
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
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="insurance-management" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]" />
            <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">Admin</span>
            <ChevronRight size={14} className="text-[#94a3b8]" />
            <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] font-medium">Insurance Management</span>
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-6 pt-5 pb-8">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100">
                  <ClipboardList size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#0f172a]">Insurance Management</h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Cycle 1 · May 1–15</span>
                  </div>
                  <p className="text-sm text-[#64748b] mt-0.5">Open Enrollment 2026 · Benefits enrollment oversight · Super Admin</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-medium text-[#475569] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                  <RefreshCw size={13} /> Sync
                </button>
                <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  <Send size={13} /> Send Reminders
                </button>
              </div>
            </div>

            {/* Tab nav */}
            <div className="flex items-center gap-0.5 bg-[#f1f5f9] rounded-2xl p-1 mb-6 w-fit">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-8 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-[#0f172a] shadow-sm"
                      : "text-[#64748b] hover:text-[#0f172a]"
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
