import { useState } from "react";
import {
  ChevronRight, Building2, Globe, Mail, Calendar, Briefcase,
  UserCircle, Server, Check, Pencil, RotateCcw, Save, X,
  TrendingUp, Zap, HardDrive, Users, DollarSign, FileText,
  AlertCircle, BadgeCheck, UserPlus, UserMinus, UserX, UserCheck,
  ShieldCheck, Search, MoreVertical,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import {
  SAAS_TIERS, ONPREM_TIERS, INVOICES, TENANT_USER_USAGE, TENANT_USERS, TREND_MONTHS,
  TIER_CFG, DEPLOY_CFG, STATUS_CFG, INV_STATUS_CFG,
  getTierDef, getLimits, computeMRR, formatMRR,
} from "@/data/adminData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
function fmtNum(v) {
  if (v === null || v === undefined) return "Unlimited";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}k`;
  return v.toLocaleString();
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color = "#2563eb" }) {
  return (
    <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 flex items-start gap-3">
      <div className="size-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] font-medium leading-none mb-1">{label}</p>
        <p className="text-lg font-bold text-[#0f172a] dark:text-[#f1f5f9] leading-none">{value}</p>
        {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function TrendChart({ trend, color = "#2563eb" }) {
  const max = Math.max(...trend, 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {trend.map((v, i) => {
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full rounded-t-[3px] transition-all" style={{
              height: `${Math.max(pct, v > 0 ? 4 : 0)}%`,
              background: i === trend.length - 1
                ? color
                : `${color}55`,
              minHeight: v > 0 ? 3 : 0,
            }} />
            <span className="text-[9px] text-[#94a3b8] whitespace-nowrap">{TREND_MONTHS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Usage meter ──────────────────────────────────────────────────────────────
function UsageMeter({ label, used, limit, unit = "", color = "#2563eb" }) {
  const pct = (limit != null && limit > 0) ? Math.min(100, (used / limit) * 100) : null;
  const warn = pct != null && pct >= 80;
  const barColor = pct >= 90 ? "#ef4444" : pct >= 80 ? "#f59e0b" : color;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#475569] dark:text-[#94a3b8] font-medium">{label}</span>
        <span className={`font-semibold tabular-nums ${warn ? "text-[#d97706]" : "text-[#0f172a] dark:text-[#f1f5f9]"}`}>
          {used != null ? fmtNum(used) : "—"}
          {limit != null ? ` / ${fmtNum(limit)}${unit}` : "  Unlimited"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#f1f5f9] dark:bg-[#334155] overflow-hidden">
        {pct != null && (
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        )}
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",     label: "Overview"     },
  { id: "subscription", label: "Subscription" },
  { id: "usage",        label: "Usage"        },
  { id: "billing",      label: "Billing"      },
  { id: "users",        label: "Users"        },
];

// ─── Overview tab ────────────────────────────────────────────────────────────
function OverviewTab({ tenant }) {
  const mrr = computeMRR(tenant);
  const tierDef = getTierDef(tenant);
  const deployCfg = DEPLOY_CFG[tenant.deployment];

  const metrics = tenant.deployment === "saas" ? [
    { icon: DollarSign, label: "MRR",             value: formatMRR(mrr),                 sub: "platform fee",          color: "#7c3aed" },
    { icon: Users,      label: "Seats",            value: (tenant.seats || 0).toLocaleString(), sub: `${tenant.usage?.seatsUsed ?? 0} active`, color: "#0ea5e9" },
    { icon: Zap,        label: "Tokens / mo",      value: `${(tenant.usage?.tokensConsumed ?? 0).toLocaleString()}M`,  sub: `@ $${tierDef?.tokenRatePerM}/1M`, color: "#f59e0b" },
    { icon: TrendingUp, label: "Flow Executions",  value: fmtNum(tenant.usage?.flowExecutions), sub: "this month",      color: "#16a34a" },
  ] : [
    { icon: DollarSign, label: "Monthly License",  value: formatMRR(mrr),                 sub: `${tierDef?.label} tier`, color: "#7c3aed" },
    { icon: Zap,        label: "Flow Executions",  value: fmtNum(tenant.usage?.flowExecutions), sub: "this month",      color: "#16a34a" },
    { icon: TrendingUp, label: "Token Consumption",value: `${(tenant.usage?.tokensConsumed ?? 0).toLocaleString()}M`, sub: "this month", color: "#f59e0b" },
    { icon: Server,     label: "Deployment",       value: deployCfg.label,                sub: "self-hosted",           color: "#059669" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Org info */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-4">Organisation Details</h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: Globe,       label: "Domain",      value: tenant.domain },
              { icon: Briefcase,   label: "Industry",    value: tenant.industry },
              { icon: Mail,        label: "Contact",     value: `${tenant.contactName} · ${tenant.contactEmail}` },
              { icon: Calendar,    label: "Member since",value: new Date(tenant.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
              ...(tenant.solutionsArchitect ? [{ icon: UserCircle, label: "Solutions Architect", value: tenant.solutionsArchitect }] : []),
              ...(tenant.licenseStart ? [{ icon: Calendar, label: "License Start", value: new Date(tenant.licenseStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }] : []),
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Icon size={13} className="text-[#94a3b8] mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[#94a3b8] font-medium leading-none mb-0.5">{label}</p>
                  <p className="text-sm text-[#0f172a] dark:text-[#f1f5f9] truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token trend */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Token Consumption Trend</h3>
            <span className="text-xs text-[#94a3b8]">6-month</span>
          </div>
          <p className="text-xs text-[#94a3b8] mb-4">Platform tokens consumed per month (millions)</p>
          <TrendChart trend={tenant.usage?.trend ?? [0,0,0,0,0,0]} color="#2563eb" />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f1f5f9] dark:border-[#334155]">
            <span className="text-xs text-[#64748b]">Peak: {Math.max(...(tenant.usage?.trend ?? [0]))}M</span>
            <span className="text-xs text-[#64748b]">Latest: {(tenant.usage?.trend ?? [0]).at(-1)}M</span>
            <span className={`text-xs font-semibold ${
              ((tenant.usage?.trend ?? [0]).at(-1) > (tenant.usage?.trend ?? [0]).at(-2))
                ? "text-[#16a34a]" : "text-[#ef4444]"
            }`}>
              {(() => {
                const t = tenant.usage?.trend ?? [0,0];
                const diff = t.at(-1) - t.at(-2);
                return `${diff >= 0 ? "+" : ""}${diff}M`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription tab ────────────────────────────────────────────────────────
function SubscriptionTab({ tenant }) {
  const tierDef = getTierDef(tenant);
  const tierCfg = TIER_CFG[tenant.tier];
  const deployCfg = DEPLOY_CFG[tenant.deployment];
  const baseLimits = tierDef?.limits ?? {};
  const [overrides, setOverrides] = useState({ ...tenant.overrides });
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({ ...tenant.overrides });

  const LIMIT_DEFS = tenant.deployment === "saas" ? [
    { key: "agents",           label: "Agents",               unit: ""    },
    { key: "workflows",        label: "Workflows",            unit: ""    },
    { key: "concurrentFlows",  label: "Concurrent Flows",     unit: ""    },
    { key: "flowExecPerMonth", label: "Flow Executions / mo", unit: ""    },
    { key: "knowledgeHubGB",   label: "Knowledge Hub",        unit: " GB" },
  ] : [
    { key: "agents",           label: "Agents",               unit: ""    },
    { key: "concurrentFlows",  label: "Concurrent Flows",     unit: ""    },
    { key: "flowExecPerMonth", label: "Flow Executions / mo", unit: ""    },
  ];

  const saveOverrides = () => {
    setOverrides({ ...draft });
    setEditMode(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tier card */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold"
                style={{ background: tierCfg.bg, color: tierCfg.text }}>
                {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
              </span>
              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold"
                style={{ background: deployCfg.bg + "20", color: deployCfg.bg }}>
                {deployCfg.label}
              </span>
            </div>
            {tenant.deployment === "saas" ? (
              <>
                <p className="text-2xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">
                  ${tierDef?.pricePerSeat}<span className="text-sm font-normal text-[#64748b]">/seat/mo</span>
                </p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Platform tokens: ${tierDef?.tokenRatePerM?.toFixed(2)}/1M · {tierDef?.seatRange}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">
                  ${(tierDef?.monthlyFee ?? 0).toLocaleString()}<span className="text-sm font-normal text-[#64748b]">/mo</span>
                </p>
                <p className="text-xs text-[#94a3b8] mt-0.5">Unlimited users · self-hosted</p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-[#64748b] dark:text-[#94a3b8]">
            {[
              ["SSO / RBAC", true],
              ["Audit Logs", tierDef?.auditLogs ?? tierDef?.ltsBuilds ?? false],
              ["HIPAA-Ready", tierDef?.hipaa ?? false],
              ...(tenant.deployment === "saas" ? [["Dedicated Infra", tierDef?.dedicatedInfra ?? false]] : [["LTS Builds", tierDef?.ltsBuilds ?? false]]),
              ...(tenant.deployment === "on-prem" ? [["Named Solution Architect", tierDef?.namedSA ?? false]] : []),
            ].map(([label, enabled], i) => (
              <span key={i} className={`flex items-center gap-1.5 ${enabled ? "text-[#0f172a] dark:text-[#f1f5f9]" : "opacity-40 line-through"}`}>
                {enabled ? <BadgeCheck size={12} className="text-[#16a34a]" /> : <X size={12} />}
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Limit overrides */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155]">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Limit Overrides</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">Per-tenant custom limits that override tier defaults.</p>
          </div>
          {!editMode ? (
            <button onClick={() => { setDraft({ ...overrides }); setEditMode(true); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] text-xs font-medium text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
              <Pencil size={12} /> Edit Overrides
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditMode(false)}
                className="h-8 px-3 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] text-xs font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                Cancel
              </button>
              <button onClick={saveOverrides}
                className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#2563eb] text-white text-xs font-medium hover:bg-[#1d4ed8] transition-colors">
                <Save size={12} /> Save
              </button>
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">Limit</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">Tier Default</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">Override</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">Effective</th>
              {editMode && <th className="px-5 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {LIMIT_DEFS.map(({ key, label, unit }) => {
              const base = baseLimits[key] ?? null;
              const ov = overrides[key] ?? null;
              const effective = ov ?? base;
              const hasOverride = ov != null;
              return (
                <tr key={key} className="border-b border-[#f8fafc] dark:border-[#1e293b] last:border-0">
                  <td className="px-5 py-3 text-[#475569] dark:text-[#94a3b8]">{label}</td>
                  <td className="px-5 py-3 text-[#0f172a] dark:text-[#f1f5f9] tabular-nums">
                    {base != null ? `${fmtNum(base)}${unit}` : "Unlimited"}
                  </td>
                  <td className="px-5 py-3">
                    {editMode ? (
                      <input
                        type="number" min="0"
                        value={draft[key] ?? ""}
                        onChange={e => setDraft(prev => ({
                          ...prev,
                          [key]: e.target.value === "" ? undefined : Number(e.target.value),
                        }))}
                        placeholder="Default"
                        className="w-28 h-7 px-2 text-xs rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                      />
                    ) : hasOverride ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] bg-[#eff6ff] dark:bg-[#1e3a8a] px-2 py-0.5 rounded-full">
                        {fmtNum(ov)}{unit}
                      </span>
                    ) : (
                      <span className="text-[#94a3b8] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-semibold text-[#0f172a] dark:text-[#f1f5f9] tabular-nums">
                    {effective != null ? `${fmtNum(effective)}${unit}` : "Unlimited"}
                  </td>
                  {editMode && (
                    <td className="px-5 py-3">
                      {(draft[key] != null) && (
                        <button onClick={() => setDraft(prev => { const n = { ...prev }; delete n[key]; return n; })}
                          className="text-xs text-[#94a3b8] hover:text-[#ef4444] flex items-center gap-1 transition-colors">
                          <RotateCcw size={11} /> Reset
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Usage tab ────────────────────────────────────────────────────────────────
function UsageTab({ tenant }) {
  const limits = getLimits(tenant);
  const usage  = tenant.usage ?? {};
  const users  = TENANT_USER_USAGE[tenant.id] ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Trend chart */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Token Consumption</h3>
          <span className="text-xs text-[#94a3b8]">Last 6 months · millions</span>
        </div>
        <p className="text-xs text-[#94a3b8] mb-4">Platform token consumption trend</p>
        <TrendChart trend={usage.trend ?? [0,0,0,0,0,0]} color="#2563eb" />
      </div>

      {/* Meters */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-4">Resource Utilisation</h3>
        <div className="flex flex-col gap-4">
          {tenant.deployment === "saas" && (
            <UsageMeter label="Seats" used={usage.seatsUsed} limit={tenant.seats} color="#0ea5e9" />
          )}
          <UsageMeter label="Tokens consumed (M)" used={usage.tokensConsumed} limit={null} color="#2563eb" />
          <UsageMeter label="Flow Executions / mo" used={usage.flowExecutions} limit={limits.flowExecPerMonth} color="#16a34a" />
          {tenant.deployment === "saas" && (
            <UsageMeter label="Knowledge Hub" used={usage.storageGB} limit={limits.knowledgeHubGB} unit=" GB" color="#f59e0b" />
          )}
        </div>
      </div>

      {/* Per-user table */}
      {users.length > 0 && (
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155]">
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Top Users by Consumption</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
                {["User", "Role", "Tokens (M)", "Flow Runs"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-[#f8fafc] dark:border-[#1e293b] last:border-0 hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-[#0f172a] dark:text-[#f1f5f9]">{u.name}</p>
                      <p className="text-xs text-[#94a3b8]">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={u.role === "Admin"
                        ? { background: "#2563eb", color: "#fff" }
                        : { background: "#334155", color: "#fff" }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-[#0f172a] dark:text-[#f1f5f9]">{u.tokensM}</td>
                  <td className="px-5 py-3 tabular-nums text-[#0f172a] dark:text-[#f1f5f9]">{u.flows.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────
const USER_STATUS_CFG = {
  Active:   { bg: "#dcfce7", text: "#16a34a" },
  Inactive: { bg: "#f1f5f9", text: "#64748b" },
  Invited:  { bg: "#fef9c3", text: "#ca8a04" },
};
const USER_ROLE_CFG = {
  Admin:  { bg: "#2563eb", text: "#fff" },
  Member: { bg: "#334155", text: "#fff" },
};

function UsersTab({ tenant }) {
  const [users, setUsers] = useState(() => TENANT_USERS[tenant.id] ?? []);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "Member" });
  const [inviteError, setInviteError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const provisioned = tenant.seats ?? null; // null = unlimited (on-prem)
  const seatsUsed   = users.filter(u => u.status !== "Inactive").length;
  const seatsFull   = provisioned != null && seatsUsed >= provisioned;
  const seatsPct    = provisioned ? Math.min(100, (seatsUsed / provisioned) * 100) : 0;

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sendInvite = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!invite.email.trim())              return setInviteError("Email is required.");
    if (!emailRe.test(invite.email.trim()))return setInviteError("Enter a valid email address.");
    if (users.find(u => u.email === invite.email.trim())) return setInviteError("This email already has access.");
    if (seatsFull) return setInviteError("No seats available. Adjust the provisioned seat count first.");
    const displayName = invite.email.split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
    setUsers(prev => [...prev, {
      id: Date.now(), name: displayName, email: invite.email.trim(),
      role: invite.role, status: "Invited", lastActive: "—",
    }]);
    setInvite({ email: "", role: "Member" });
    setInviteError("");
    setShowInvite(false);
  };

  const changeRole   = (id, r)  => { setUsers(p => p.map(u => u.id === id ? { ...u, role: r } : u)); setOpenMenuId(null); };
  const toggleStatus = (id)     => { setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u)); setOpenMenuId(null); };
  const revokeSeat   = (id)     => { setUsers(p => p.filter(u => u.id !== id)); setOpenMenuId(null); };

  return (
    <div className="flex flex-col gap-4">
      {/* Seat utilisation banner */}
      {provisioned != null && (
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Seat Utilisation</h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">Active + Invited seats count toward the provisioned limit.</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tabular-nums" style={{ color: seatsFull ? "#ef4444" : "#0f172a" }}>
                {seatsUsed} <span className="text-sm font-normal text-[#64748b]">/ {provisioned}</span>
              </p>
              <p className="text-xs text-[#94a3b8]">{provisioned - seatsUsed} seats available</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[#f1f5f9] dark:bg-[#334155] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${seatsPct}%`,
              background: seatsPct >= 90 ? "#ef4444" : seatsPct >= 75 ? "#f59e0b" : "#0ea5e9",
            }} />
          </div>
          {seatsFull && (
            <p className="text-xs text-[#dc2626] mt-2 flex items-center gap-1">
              <AlertCircle size={12} /> All seats are occupied. Revoke a seat or increase the provisioned count in Subscription.
            </p>
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
              Users <span className="ml-1 text-xs font-normal text-[#94a3b8]">({users.length})</span>
            </h3>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="h-7 pl-7 pr-3 text-xs rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 w-40" />
            </div>
          </div>
          <button onClick={() => setShowInvite(v => !v)}
            disabled={seatsFull}
            className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#2563eb] text-white text-xs font-medium hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <UserPlus size={13} /> Invite User
          </button>
        </div>

        {/* Invite inline panel */}
        {showInvite && (
          <div className="px-5 py-4 border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label className="text-xs font-medium text-[#475569] dark:text-[#94a3b8]">Email address</label>
                <input type="email" value={invite.email}
                  onChange={e => { setInvite(p => ({ ...p, email: e.target.value })); setInviteError(""); }}
                  placeholder="colleague@company.com"
                  className="h-8 px-3 text-xs rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#475569] dark:text-[#94a3b8]">Role</label>
                <select value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value }))}
                  className="h-8 px-2 text-xs rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30">
                  <option>Member</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={sendInvite}
                  className="h-8 px-3 rounded-[8px] bg-[#2563eb] text-white text-xs font-medium hover:bg-[#1d4ed8] transition-colors">
                  Send Invite
                </button>
                <button onClick={() => { setShowInvite(false); setInviteError(""); setInvite({ email: "", role: "Member" }); }}
                  className="h-8 px-3 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
            {inviteError && (
              <p className="text-xs text-[#dc2626] mt-2 flex items-center gap-1.5">
                <AlertCircle size={11} /> {inviteError}
              </p>
            )}
          </div>
        )}

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
              {["User", "Role", "Status", "Last Active", ""].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[#94a3b8]">No users found.</td></tr>
            ) : filtered.map(u => {
              const sc = USER_STATUS_CFG[u.status] ?? USER_STATUS_CFG.Inactive;
              const rc = USER_ROLE_CFG[u.role]   ?? USER_ROLE_CFG.Member;
              const [av1, av2] = AVATAR_COLORS[u.id % AVATAR_COLORS.length];
              return (
                <tr key={u.id} className="border-b border-[#f8fafc] dark:border-[#1e293b] last:border-0 hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg,${av1},${av2})` }}>
                        {initials(u.name)}
                      </div>
                      <div>
                        <p className="font-medium text-[#0f172a] dark:text-[#f1f5f9]">{u.name}</p>
                        <p className="text-xs text-[#94a3b8]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold"
                      style={{ background: rc.bg, color: rc.text }}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.text }}>{u.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#64748b] dark:text-[#94a3b8]">{u.lastActive}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="relative inline-block">
                      <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="size-7 rounded-[6px] flex items-center justify-center text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors">
                        <MoreVertical size={14} />
                      </button>
                      {openMenuId === u.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] shadow-lg z-10 py-1">
                          <button onClick={() => changeRole(u.id, u.role === "Admin" ? "Member" : "Admin")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                            <ShieldCheck size={12} /> Change to {u.role === "Admin" ? "Member" : "Admin"}
                          </button>
                          {u.status !== "Invited" && (
                            <button onClick={() => toggleStatus(u.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                              {u.status === "Active" ? <UserX size={12} /> : <UserCheck size={12} />}
                              {u.status === "Active" ? "Deactivate" : "Reactivate"}
                            </button>
                          )}
                          <div className="border-t border-[#f1f5f9] dark:border-[#334155] my-1" />
                          <button onClick={() => revokeSeat(u.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#dc2626] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a] transition-colors">
                            <UserMinus size={12} /> Revoke Seat
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Billing tab ─────────────────────────────────────────────────────────────
function BillingTab({ tenant }) {
  const invoices = INVOICES.filter(inv => inv.tenantId === tenant.id);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] rounded-xl px-5 py-3.5 flex items-start gap-3">
        <AlertCircle size={16} className="text-[#d97706] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#92400e] dark:text-[#fde68a] leading-5">
          Billing is managed manually. Invoices are issued at the start of each calendar month.
          Payment terms: <strong>Net 30</strong>. Late payments may incur a 1.5% monthly service charge.
        </p>
      </div>

      {/* Invoice table */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Invoice History</h3>
          <span className="text-xs text-[#94a3b8]">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <FileText size={28} className="text-[#cbd5e1]" />
            <p className="text-sm text-[#94a3b8]">No invoices found for this tenant.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
                {["Invoice ID", "Period", "Amount", "Status", "Issued"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const cfg = INV_STATUS_CFG[inv.status] ?? INV_STATUS_CFG.draft;
                return (
                  <tr key={inv.id} className="border-b border-[#f8fafc] dark:border-[#1e293b] last:border-0 hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#475569] dark:text-[#94a3b8]">{inv.id}</td>
                    <td className="px-5 py-3 text-[#0f172a] dark:text-[#f1f5f9]">{inv.period}</td>
                    <td className="px-5 py-3 font-semibold text-[#0f172a] dark:text-[#f1f5f9] tabular-nums">
                      ${inv.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold"
                        style={{ background: cfg.bg, color: cfg.text }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#94a3b8] text-xs">{inv.issuedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TenantDetailPage({ tenant, onNavigate }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!tenant) {
    return (
      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <Sidebar activePage="tenants" onNavigate={onNavigate} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppHeader onNavigate={onNavigate} />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#94a3b8]">No tenant selected.</p>
          </div>
        </div>
      </div>
    );
  }

  const tierCfg   = TIER_CFG[tenant.tier];
  const deployCfg = DEPLOY_CFG[tenant.deployment];
  const statusCfg = STATUS_CFG[tenant.status] ?? STATUS_CFG.active;

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="tenants" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]" />
            <button onClick={() => onNavigate?.("tenants")}
              className="text-sm text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] transition-colors">
              Tenants
            </button>
            <ChevronRight size={14} className="text-[#94a3b8]" />
            <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] font-medium truncate max-w-[200px]">{tenant.name}</span>
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Tenant header */}
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${AVATAR_COLORS[tenant.id % AVATAR_COLORS.length][0]},${AVATAR_COLORS[tenant.id % AVATAR_COLORS.length][1]})` }}>
              {initials(tenant.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">{tenant.name}</h1>
                <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-bold"
                  style={{ background: tierCfg.bg, color: tierCfg.text }}>
                  {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
                </span>
                <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold"
                  style={{ background: deployCfg.bg + "22", color: deployCfg.bg }}>
                  {deployCfg.label}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: statusCfg.text }}>
                  <span className="size-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0.5">{tenant.domain} · {tenant.industry}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#e2e8f0] dark:border-[#334155] gap-0">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#2563eb] text-[#2563eb]"
                    : "border-transparent text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview"     && <OverviewTab      tenant={tenant} />}
          {activeTab === "subscription" && <SubscriptionTab  tenant={tenant} />}
          {activeTab === "usage"        && <UsageTab         tenant={tenant} />}
          {activeTab === "billing"      && <BillingTab       tenant={tenant} />}
          {activeTab === "users"        && <UsersTab         tenant={tenant} />}
        </div>
      </div>
    </div>
  );
}
