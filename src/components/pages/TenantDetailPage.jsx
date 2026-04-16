import { useState } from "react";
import {
  ChevronRight, Building2, Globe, Mail, Calendar, Briefcase,
  UserCircle, Server, Check, Pencil, RotateCcw, Save, X,
  TrendingUp, Zap, HardDrive, Users, DollarSign, FileText,
  AlertCircle, BadgeCheck, UserPlus, UserMinus, UserX, UserCheck,
  ShieldCheck, Search, MoreVertical, Package, Plus, Sparkles,
  ShieldAlert, BarChart2, Headphones, KeyRound,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  INVOICES, TENANT_USER_USAGE, TENANT_USERS, TREND_MONTHS,
  DEPLOY_CFG, STATUS_CFG, INV_STATUS_CFG,
  getLimits, formatMRR,
} from "@/data/adminData";
import {
  PACKAGES, TENANT_PACKAGES as ALL_TENANT_PACKAGES,
  getBaseTierPackage, getAddonPackages, getTenantPackages,
  getEntitlements, computePackageMRR, PKG_STATUS_CFG,
} from "@/data/packagesData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#ec4899","#be185d"],
  ["#f59e0b","#b45309"],["#10b981","#047857"],["#06b6d4","#0e7490"],
  ["#f97316","#c2410c"],["#6366f1","#4338ca"],["#84cc16","#4d7c0f"],
  ["#14b8a6","#0f766e"],
];
function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function fmtNum(v) {
  if (v === null || v === undefined) return "Unlimited";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}k`;
  return v.toLocaleString();
}
function fmtLimit(v, unit = "") {
  if (v === null || v === undefined) return "Unlimited";
  return `${fmtNum(v)}${unit}`;
}

// Map icon keys to Lucide components
const ADDON_ICONS = {
  "shield":      ShieldAlert,
  "key":         KeyRound,
  "trending-up": BarChart2,
  "hard-drive":  HardDrive,
  "sparkles":    Sparkles,
  "headphones":  Headphones,
};

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
      {trend.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full rounded-t-[3px] transition-all" style={{
            height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%`,
            background: i === trend.length - 1 ? color : `${color}55`,
            minHeight: v > 0 ? 3 : 0,
          }} />
          <span className="text-[9px] text-[#94a3b8] whitespace-nowrap">{TREND_MONTHS[i]}</span>
        </div>
      ))}
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
  { id: "overview",  label: "Overview"  },
  { id: "packages",  label: "Packages"  },
  { id: "usage",     label: "Usage"     },
  { id: "billing",   label: "Billing"   },
  { id: "users",     label: "Users"     },
];

// ─── Overview tab ────────────────────────────────────────────────────────────
function OverviewTab({ tenant, assignments }) {
  const baseTier = getBaseTierPackage(tenant.id);
  const mrr = computePackageMRR(tenant.id, tenant.usage?.tokensConsumed ?? 0);
  const deployCfg = DEPLOY_CFG[tenant.deployment];

  const metrics = tenant.deployment === "saas" ? [
    { icon: DollarSign, label: "MRR",             value: formatMRR(mrr),                        sub: "all packages",        color: "#7c3aed" },
    { icon: Users,      label: "Seats",            value: (baseTier?.assignment?.seats ?? 0).toLocaleString(), sub: `${tenant.usage?.seatsUsed ?? 0} active`, color: "#0ea5e9" },
    { icon: Zap,        label: "Tokens / mo",      value: `${(tenant.usage?.tokensConsumed ?? 0).toLocaleString()}M`, sub: baseTier?.pkg?.tokenRatePerM ? `@ $${baseTier.pkg.tokenRatePerM}/1M` : "no rate", color: "#f59e0b" },
    { icon: TrendingUp, label: "Flow Executions",  value: fmtNum(tenant.usage?.flowExecutions),  sub: "this month",          color: "#16a34a" },
  ] : [
    { icon: DollarSign, label: "Monthly License",  value: formatMRR(mrr),                        sub: baseTier?.pkg?.name ?? "No package", color: "#7c3aed" },
    { icon: Zap,        label: "Flow Executions",  value: fmtNum(tenant.usage?.flowExecutions),  sub: "this month",          color: "#16a34a" },
    { icon: TrendingUp, label: "Token Consumption",value: `${(tenant.usage?.tokensConsumed ?? 0).toLocaleString()}M`, sub: "this month", color: "#f59e0b" },
    { icon: Server,     label: "Deployment",       value: deployCfg.label,                       sub: "self-hosted",         color: "#059669" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* No-package warning */}
      {!baseTier && (
        <div className="flex items-start gap-3 p-4 bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] rounded-xl">
          <AlertCircle size={16} className="text-[#d97706] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#92400e] dark:text-[#fde68a]">No packages assigned yet</p>
            <p className="text-xs text-[#92400e] dark:text-[#fde68a] mt-0.5">
              Go to the <strong>Packages tab</strong> to assign a base tier and start billing.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Org info */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-4">Organisation Details</h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: Globe,       label: "Domain",       value: tenant.domain },
              { icon: Briefcase,   label: "Industry",     value: tenant.industry },
              { icon: Mail,        label: "Contact",      value: `${tenant.contactName} · ${tenant.contactEmail}` },
              { icon: Calendar,    label: "Member since", value: new Date(tenant.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
              ...(tenant.solutionsArchitect ? [{ icon: UserCircle, label: "Solutions Architect", value: tenant.solutionsArchitect }] : []),
              ...(tenant.licenseStart       ? [{ icon: Calendar,   label: "License Start",        value: new Date(tenant.licenseStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }] : []),
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
              ((tenant.usage?.trend ?? [0]).at(-1) > (tenant.usage?.trend ?? [0]).at(-2)) ? "text-[#16a34a]" : "text-[#ef4444]"
            }`}>
              {(() => { const t = tenant.usage?.trend ?? [0,0]; const d = t.at(-1) - t.at(-2); return `${d >= 0 ? "+" : ""}${d}M`; })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Packages tab ─────────────────────────────────────────────────────────────
function PackagesTab({ tenant }) {
  const [assignments, setAssignments] = useState(() => getTenantPackages(tenant.id));
  const [showAssign, setShowAssign]   = useState(false);
  const [assignStep, setAssignStep]   = useState(1); // 1=select base, 2=select addons, 3=configure
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [seatCount, setSeatCount] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const activeAssignments = assignments.filter(a => ["active", "trial"].includes(a.status));
  const baseTier = activeAssignments.find(a => PACKAGES[a.packageId]?.type === "base_tier");
  const addonAssignments = activeAssignments.filter(a => PACKAGES[a.packageId]?.type === "addon");

  // Available base tiers for this deployment
  const availableBaseTiers = Object.values(PACKAGES).filter(
    p => p.type === "base_tier" && p.deployment === tenant.deployment
  );
  // Available add-ons
  const availableAddons = Object.values(PACKAGES).filter(
    p => p.type === "addon" && (p.deployment === "both" || p.deployment === tenant.deployment)
  );

  const handleConfirmAssign = () => {
    const now = new Date().toISOString().split("T")[0];
    const newAssignments = [];

    if (selectedBase && !baseTier) {
      newAssignments.push({
        id: `tp-new-${Date.now()}`, tenantId: tenant.id,
        packageId: selectedBase,
        seats: tenant.deployment === "saas" ? (parseInt(seatCount) || 0) : undefined,
        quantity: 1, status: "active", billingStart: now, overrides: {},
      });
    }
    for (const addonId of selectedAddons) {
      if (!addonAssignments.find(a => a.packageId === addonId)) {
        newAssignments.push({
          id: `tp-addon-${Date.now()}-${addonId}`, tenantId: tenant.id,
          packageId: addonId, quantity: 1, status: "active", billingStart: now,
        });
      }
    }
    setAssignments(prev => [...prev, ...newAssignments]);
    setShowAssign(false);
    setAssignStep(1);
    setSelectedBase(null);
    setSelectedAddons([]);
    setSeatCount("");
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 3000);
  };

  const removeAddon = (assignmentId) => {
    setAssignments(prev => prev.map(a =>
      a.id === assignmentId ? { ...a, status: "cancelled" } : a
    ));
  };

  const mrr = (() => {
    let total = 0;
    for (const a of activeAssignments) {
      const pkg = PACKAGES[a.packageId];
      if (!pkg) continue;
      if (pkg.priceModel === "per_seat") total += (a.seats ?? 0) * pkg.basePrice;
      else if (pkg.priceModel === "fixed_monthly") total += pkg.basePrice;
      else if (pkg.priceModel === "per_unit") total += (a.quantity ?? 1) * pkg.basePrice;
    }
    return total;
  })();

  return (
    <div className="flex flex-col gap-4">

      {/* Confirmed toast */}
      {confirmed && (
        <div className="flex items-center gap-2 p-3 bg-[#f0fdf4] dark:bg-[#052e16] border border-[#bbf7d0] dark:border-[#166534] rounded-xl">
          <Check size={14} className="text-[#16a34a]" />
          <p className="text-sm text-[#14532d] dark:text-[#86efac] font-medium">Package(s) assigned successfully.</p>
        </div>
      )}

      {/* No packages — empty state */}
      {activeAssignments.length === 0 && !showAssign && (
        <div className="flex flex-col items-center gap-4 py-16 bg-white dark:bg-[#1e293b] border border-dashed border-[#cbd5e1] dark:border-[#475569] rounded-2xl">
          <div className="size-14 rounded-full bg-[#f1f5f9] dark:bg-[#334155] flex items-center justify-center">
            <Package size={22} className="text-[#94a3b8]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">No packages assigned</p>
            <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1 max-w-xs">
              Assign a base tier to activate this tenant's subscription and unlock billing.
            </p>
          </div>
          <button onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
            <Plus size={14} /> Assign Package
          </button>
        </div>
      )}

      {/* Base tier card */}
      {baseTier && (() => {
        const pkg = PACKAGES[baseTier.packageId];
        const sc = PKG_STATUS_CFG[baseTier.status] ?? PKG_STATUS_CFG.active;
        return (
          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
            <div className={`bg-gradient-to-br ${pkg.gradient} px-5 py-4 text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Base Tier</span>
                    <span className="inline-flex items-center h-4 px-1.5 rounded text-[9px] font-bold"
                      style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                  </div>
                  <h3 className="text-lg font-bold">{pkg.name}</h3>
                  <p className="text-xs opacity-70 mt-0.5">{pkg.description}</p>
                </div>
                <div className="text-right">
                  {pkg.priceModel === "per_seat" ? (
                    <>
                      <p className="text-2xl font-bold">${pkg.basePrice}<span className="text-xs font-normal opacity-70">/seat/mo</span></p>
                      <p className="text-xs opacity-60">{baseTier.seats?.toLocaleString()} seats · ${((baseTier.seats ?? 0) * pkg.basePrice).toLocaleString()}/mo</p>
                      {pkg.tokenRatePerM && <p className="text-xs opacity-60 mt-0.5">Tokens @ ${pkg.tokenRatePerM}/1M</p>}
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">${(pkg.basePrice ?? 0).toLocaleString()}<span className="text-xs font-normal opacity-70">/mo</span></p>
                      <p className="text-xs opacity-60">Fixed license</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Features + limits */}
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Limits</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    ["Agents",           fmtLimit(pkg.limits?.agents)                      ],
                    ["Workflows",        fmtLimit(pkg.limits?.workflows)                   ],
                    ["Concurrent Flows", fmtLimit(pkg.limits?.concurrentFlows)             ],
                    ["Flow Exec / mo",   fmtLimit(pkg.limits?.flowExecPerMonth)            ],
                    ["Knowledge Hub",    fmtLimit(pkg.limits?.knowledgeHubGB, " GB")       ],
                  ].filter(([, v]) => v !== undefined).map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">{l}</span>
                      <span className="font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Features</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    ["SSO",             pkg.features?.sso            ],
                    ["Audit Logs",      pkg.features?.auditLogs      ],
                    ["HIPAA-Ready",     pkg.features?.hipaa          ],
                    ["Dedicated Infra", pkg.features?.dedicatedInfra ],
                    ["LTS Builds",      pkg.features?.ltsBuilds      ],
                    ["Named SA",        pkg.features?.namedSA        ],
                  ].filter(([, v]) => v !== undefined).map(([l, v]) => (
                    <span key={l} className={`flex items-center gap-1.5 text-xs ${v ? "text-[#0f172a] dark:text-[#f1f5f9]" : "opacity-35 line-through"}`}>
                      {v ? <BadgeCheck size={12} className="text-[#16a34a]" /> : <X size={11} />} {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#f1f5f9] dark:border-[#334155] flex items-center justify-between">
              <p className="text-xs text-[#94a3b8]">Active since {baseTier.billingStart}</p>
              <p className="text-xs font-medium text-[#64748b]">Support: {pkg.support}</p>
            </div>
          </div>
        );
      })()}

      {/* Add-on packages */}
      {addonAssignments.length > 0 && (
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155]">
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
              Add-on Packages <span className="text-xs font-normal text-[#94a3b8] ml-1">({addonAssignments.length})</span>
            </h3>
          </div>
          <div className="divide-y divide-[#f8fafc] dark:divide-[#334155]">
            {addonAssignments.map(a => {
              const pkg = PACKAGES[a.packageId];
              if (!pkg) return null;
              const Icon = ADDON_ICONS[pkg.iconKey] ?? Package;
              const sc = PKG_STATUS_CFG[a.status] ?? PKG_STATUS_CFG.active;
              const cost = pkg.priceModel === "per_unit"
                ? `$${((a.quantity ?? 1) * pkg.basePrice).toLocaleString()}/mo`
                : `$${pkg.basePrice.toLocaleString()}/mo`;
              return (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                  <div className="size-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${pkg.color}18` }}>
                    <Icon size={15} style={{ color: pkg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{pkg.name}</p>
                    <p className="text-xs text-[#94a3b8] truncate">{pkg.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {a.quantity > 1 && (
                      <span className="text-xs text-[#64748b]">×{a.quantity}</span>
                    )}
                    <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{cost}</span>
                    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold"
                      style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                    <button onClick={() => removeAddon(a.id)}
                      className="size-6 flex items-center justify-center rounded text-[#94a3b8] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MRR summary */}
      {activeAssignments.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-[#f0fdf4] dark:bg-[#052e16] border border-[#bbf7d0] dark:border-[#166534] rounded-xl">
          <DollarSign size={16} className="text-[#16a34a] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#14532d] dark:text-[#86efac]">
              Package MRR: {formatMRR(mrr)}/mo
              <span className="font-normal text-xs text-[#16a34a] dark:text-[#4ade80] ml-1">(excl. token usage)</span>
            </p>
            <p className="text-xs text-[#16a34a] dark:text-[#4ade80] mt-0.5">
              {activeAssignments.length} active package{activeAssignments.length !== 1 ? "s" : ""} · billing monthly
            </p>
          </div>
          {!showAssign && (
            <button onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[#bbf7d0] dark:border-[#166534] text-xs font-medium text-[#15803d] dark:text-[#86efac] hover:bg-[#dcfce7] dark:hover:bg-[#14532d] transition-colors">
              <Plus size={12} /> Add Package
            </button>
          )}
        </div>
      )}

      {/* Package assignment panel */}
      {showAssign && (
        <div className="bg-white dark:bg-[#1e293b] border border-[#2563eb] rounded-xl overflow-hidden shadow-md shadow-blue-500/10">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#eff6ff] dark:bg-[#1e3a8a]/20 border-b border-[#bfdbfe] dark:border-[#1e3a8a]">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-[#2563eb]" />
              <p className="text-sm font-semibold text-[#1e40af] dark:text-[#93c5fd]">Assign Package</p>
            </div>
            <button onClick={() => { setShowAssign(false); setAssignStep(1); setSelectedBase(null); setSelectedAddons([]); setSeatCount(""); }}
              className="text-[#94a3b8] hover:text-[#475569] transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {/* Step 1: Base tier (only if none assigned) */}
            {!baseTier && (
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">Base Tier</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {availableBaseTiers.map(pkg => {
                    const sel = selectedBase === pkg.id;
                    return (
                      <button key={pkg.id} onClick={() => setSelectedBase(pkg.id)}
                        className={`relative text-left rounded-xl border-2 overflow-hidden transition-all ${
                          sel ? "border-[#2563eb] shadow-md shadow-blue-500/10" : "border-[#e2e8f0] dark:border-[#334155]"
                        }`}>
                        {pkg.recommended && !sel && (
                          <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b]">
                            POPULAR
                          </div>
                        )}
                        {sel && (
                          <div className="absolute top-2 right-2 size-5 rounded-full bg-[#2563eb] flex items-center justify-center">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                        <div className={`bg-gradient-to-br ${pkg.gradient} px-3 pt-3 pb-2 text-white`}>
                          <p className="text-lg font-bold">
                            {pkg.priceModel === "per_seat"
                              ? <>${pkg.basePrice}<span className="text-xs font-normal opacity-70">/seat</span></>
                              : <>${(pkg.basePrice / 1000).toFixed(0)}k<span className="text-xs font-normal opacity-70">/mo</span></>
                            }
                          </p>
                          <p className="text-xs font-bold">{pkg.name.replace("SaaS ", "").replace("On-Prem ", "")}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1e293b] px-3 py-2 text-xs text-[#94a3b8]">
                          {pkg.seatRange ?? pkg.support}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Seat count for SaaS */}
                {selectedBase && tenant.deployment === "saas" && (
                  <div className="mt-3 flex items-center gap-3">
                    <Users size={14} className="text-[#94a3b8]" />
                    <input
                      type="number" min="1" value={seatCount}
                      onChange={e => setSeatCount(e.target.value)}
                      placeholder="Number of seats"
                      className="h-8 w-40 px-3 text-xs rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                    />
                    {selectedBase && seatCount && (
                      <span className="text-xs text-[#64748b]">
                        = ${((parseInt(seatCount) || 0) * (PACKAGES[selectedBase]?.basePrice ?? 0)).toLocaleString()}/mo
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Add-ons */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">Add-on Packages (optional)</p>
              <div className="flex flex-col gap-2">
                {availableAddons
                  .filter(pkg => !addonAssignments.find(a => a.packageId === pkg.id))
                  .map(pkg => {
                    const Icon = ADDON_ICONS[pkg.iconKey] ?? Package;
                    const checked = selectedAddons.includes(pkg.id);
                    return (
                      <label key={pkg.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          checked
                            ? "border-[#2563eb] bg-[#eff6ff] dark:bg-[#1e3a8a]/20"
                            : "border-[#e2e8f0] dark:border-[#334155] hover:border-[#93c5fd]"
                        }`}>
                        <input type="checkbox" checked={checked}
                          onChange={() => setSelectedAddons(prev =>
                            prev.includes(pkg.id) ? prev.filter(id => id !== pkg.id) : [...prev, pkg.id]
                          )}
                          className="sr-only"
                        />
                        <div className={`size-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                          checked ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5e1] dark:border-[#475569]"
                        }`}>
                          {checked && <Check size={10} className="text-white" />}
                        </div>
                        <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${pkg.color}18` }}>
                          <Icon size={13} style={{ color: pkg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{pkg.name}</p>
                          <p className="text-xs text-[#94a3b8] truncate">{pkg.description}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#475569] dark:text-[#94a3b8] flex-shrink-0">{pkg.tagline}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Confirm */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f1f5f9] dark:border-[#334155]">
              <button onClick={() => { setShowAssign(false); setAssignStep(1); setSelectedBase(null); setSelectedAddons([]); setSeatCount(""); }}
                className="h-8 px-3 text-xs font-medium text-[#64748b] hover:text-[#0f172a] transition-colors">
                Cancel
              </button>
              <button
                disabled={!baseTier && !selectedBase}
                onClick={handleConfirmAssign}
                className="flex items-center gap-1.5 h-8 px-4 rounded-[8px] bg-[#2563eb] text-white text-xs font-medium hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Check size={12} /> Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled packages — history */}
      {(() => {
        const cancelled = assignments.filter(a => a.status === "cancelled");
        if (!cancelled.length) return null;
        return (
          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden opacity-60">
            <div className="px-5 py-3 border-b border-[#f1f5f9] dark:border-[#334155]">
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide">Cancelled / Historical</p>
            </div>
            {cancelled.map(a => {
              const pkg = PACKAGES[a.packageId];
              if (!pkg) return null;
              return (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#f8fafc] dark:border-[#1e293b] last:border-0">
                  <p className="text-sm text-[#94a3b8] flex-1">{pkg.name}</p>
                  <span className="text-xs text-[#94a3b8]">Since {a.billingStart}</span>
                  <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#dc2626]">Cancelled</span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Usage tab ────────────────────────────────────────────────────────────────
function UsageTab({ tenant }) {
  const { limits } = getEntitlements(tenant.id);
  const usage = tenant.usage ?? {};
  const users = TENANT_USER_USAGE[tenant.id] ?? [];
  const baseTier = getBaseTierPackage(tenant.id);
  const seats = baseTier?.assignment?.seats ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Token Consumption</h3>
          <span className="text-xs text-[#94a3b8]">Last 6 months · millions</span>
        </div>
        <p className="text-xs text-[#94a3b8] mb-4">Platform token consumption trend</p>
        <TrendChart trend={usage.trend ?? [0,0,0,0,0,0]} color="#2563eb" />
      </div>

      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-4">Resource Utilisation</h3>
        <div className="flex flex-col gap-4">
          {tenant.deployment === "saas" && seats && (
            <UsageMeter label="Seats" used={usage.seatsUsed} limit={seats} color="#0ea5e9" />
          )}
          <UsageMeter label="Tokens consumed (M)" used={usage.tokensConsumed} limit={null} color="#2563eb" />
          <UsageMeter label="Flow Executions / mo" used={usage.flowExecutions} limit={limits.flowExecPerMonth} color="#16a34a" />
          {tenant.deployment === "saas" && limits.knowledgeHubGB && (
            <UsageMeter label="Knowledge Hub" used={usage.storageGB} limit={limits.knowledgeHubGB} unit=" GB" color="#f59e0b" />
          )}
        </div>
      </div>

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
                    <p className="font-medium text-[#0f172a] dark:text-[#f1f5f9]">{u.name}</p>
                    <p className="text-xs text-[#94a3b8]">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={u.role === "Admin" ? { background: "#2563eb", color: "#fff" } : { background: "#334155", color: "#fff" }}>
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
  const [invite, setInvite]         = useState({ email: "", role: "Member" });
  const [inviteError, setInviteError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const baseTier = getBaseTierPackage(tenant.id);
  const provisioned = baseTier?.assignment?.seats ?? null;
  const seatsUsed  = users.filter(u => u.status !== "Inactive").length;
  const seatsFull  = provisioned != null && seatsUsed >= provisioned;
  const seatsPct   = provisioned ? Math.min(100, (seatsUsed / provisioned) * 100) : 0;

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sendInvite = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!invite.email.trim())               return setInviteError("Email is required.");
    if (!emailRe.test(invite.email.trim())) return setInviteError("Enter a valid email address.");
    if (users.find(u => u.email === invite.email.trim())) return setInviteError("This email already has access.");
    if (seatsFull) return setInviteError("No seats available. Adjust seat count in Packages tab.");
    const displayName = invite.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    setUsers(prev => [...prev, { id: Date.now(), name: displayName, email: invite.email.trim(), role: invite.role, status: "Invited", lastActive: "—" }]);
    setInvite({ email: "", role: "Member" });
    setInviteError("");
    setShowInvite(false);
  };

  const changeRole   = (id, r) => { setUsers(p => p.map(u => u.id === id ? { ...u, role: r } : u)); setOpenMenuId(null); };
  const toggleStatus = (id)    => { setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u)); setOpenMenuId(null); };
  const revokeSeat   = (id)    => { setUsers(p => p.filter(u => u.id !== id)); setOpenMenuId(null); };

  return (
    <div className="flex flex-col gap-4">
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
              <p className="text-xs text-[#94a3b8]">{provisioned - seatsUsed} available</p>
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
              <AlertCircle size={12} /> All seats occupied. Increase seat count from the Packages tab.
            </p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
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
          <button onClick={() => setShowInvite(v => !v)} disabled={seatsFull}
            className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#2563eb] text-white text-xs font-medium hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <UserPlus size={13} /> Invite User
          </button>
        </div>

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
                <button onClick={sendInvite} className="h-8 px-3 rounded-[8px] bg-[#2563eb] text-white text-xs font-medium hover:bg-[#1d4ed8] transition-colors">Send Invite</button>
                <button onClick={() => { setShowInvite(false); setInviteError(""); setInvite({ email: "", role: "Member" }); }}
                  className="h-8 px-3 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">Cancel</button>
              </div>
            </div>
            {inviteError && (
              <p className="text-xs text-[#dc2626] mt-2 flex items-center gap-1.5">
                <AlertCircle size={11} /> {inviteError}
              </p>
            )}
          </div>
        )}

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
      <div className="bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] rounded-xl px-5 py-3.5 flex items-start gap-3">
        <AlertCircle size={16} className="text-[#d97706] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#92400e] dark:text-[#fde68a] leading-5">
          Billing is managed manually. Invoices are issued at the start of each calendar month.
          Payment terms: <strong>Net 30</strong>. Late payments may incur a 1.5% monthly service charge.
        </p>
      </div>

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
                    <td className="px-5 py-3 font-semibold text-[#0f172a] dark:text-[#f1f5f9] tabular-nums">${inv.amount.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold"
                        style={{ background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
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

  const deployCfg = DEPLOY_CFG[tenant.deployment];
  const statusCfg = STATUS_CFG[tenant.status] ?? STATUS_CFG.active;
  const baseTier  = getBaseTierPackage(tenant.id);
  const addonPkgs = getAddonPackages(tenant.id);

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
                {/* Tier badge from packages */}
                {baseTier && (
                  <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-bold text-white"
                    style={{ background: baseTier.pkg.color }}>
                    {baseTier.pkg.name.replace("SaaS ", "").replace("On-Prem ", "")}
                  </span>
                )}
                {/* Add-on count badge */}
                {addonPkgs.length > 0 && (
                  <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-xs font-semibold bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-[#94a3b8]">
                    <Package size={10} /> {addonPkgs.length} add-on{addonPkgs.length !== 1 ? "s" : ""}
                  </span>
                )}
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
          <div className="flex border-b border-[#e2e8f0] dark:border-[#334155]">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#2563eb] text-[#2563eb]"
                    : "border-transparent text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]"
                }`}>
                {tab.label}
                {tab.id === "packages" && !baseTier && (
                  <span className="ml-1.5 inline-flex size-1.5 rounded-full bg-[#f59e0b]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && <OverviewTab tenant={tenant} />}
          {activeTab === "packages" && <PackagesTab tenant={tenant} />}
          {activeTab === "usage"    && <UsageTab    tenant={tenant} />}
          {activeTab === "billing"  && <BillingTab  tenant={tenant} />}
          {activeTab === "users"    && <UsersTab    tenant={tenant} />}
        </div>
      </div>
    </div>
  );
}
