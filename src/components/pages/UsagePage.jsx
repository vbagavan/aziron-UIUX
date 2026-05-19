import { useState } from "react";
import {
  BarChart2, ChevronRight, Zap, Users, TrendingUp,
  HardDrive, Workflow, DollarSign,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  TENANTS, SAAS_TIERS, TREND_MONTHS, TENANT_USER_USAGE, getLimits,
} from "@/data/adminData";

// ─── Current org context (Vanta Logistics — SaaS Growth) ─────────────────────
const CURRENT = TENANTS.find(t => t.id === 3);
const TIER_DEF = SAAS_TIERS[CURRENT.tier];
const LIMITS   = getLimits(CURRENT);
const USERS    = TENANT_USER_USAGE[3] ?? [];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "var(--primary)" }) {
  return (
    <div className="flex items-center gap-3 bg-card dark:bg-card border border-border dark:border-border rounded-xl p-4 flex-1 min-w-0">
      <div className="size-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium leading-none mb-1">{label}</p>
        <p className="text-xl font-bold text-foreground dark:text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, labels, color = "var(--primary)", unit = "M", height = 80 }) {
  const max = Math.max(...data, 1);
  const [hovered, setHovered] = useState(null);

  return (
    <div className="flex items-end gap-1.5 relative" style={{ height: height + 24 }}>
      {data.map((v, i) => {
        const pct = (v / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 relative"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {/* Tooltip */}
            {hovered === i && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 bg-muted text-white text-[10px] font-semibold px-2 py-1 rounded-[5px] whitespace-nowrap">
                {v.toLocaleString()}{unit}
              </div>
            )}
            <div className="w-full rounded-t-[4px] transition-all cursor-pointer" style={{
              height: `${Math.max(pct, v > 0 ? 3 : 0)}%`,
              maxHeight: height,
              background: isLast
                ? color
                : hovered === i ? `${color}cc` : `${color}55`,
              minHeight: v > 0 ? 3 : 0,
            }} />
            <span className="text-[9px] text-muted-foreground whitespace-nowrap leading-none">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Usage meter ──────────────────────────────────────────────────────────────
function UsageMeter({ label, used, limit, unit = "", color = "var(--primary)", icon: Icon }) {
  const pct = (limit != null && limit > 0) ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const warn = pct != null && pct >= 80;
  const barColor = pct >= 90 ? "var(--destructive)" : pct >= 80 ? "var(--warning)" : color;
  const fmtV = v => v == null ? "—" : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toLocaleString();

  return (
    <div className="flex flex-col gap-2 bg-card dark:bg-card border border-border dark:border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-muted-foreground" />}
          <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">{label}</span>
        </div>
        {pct != null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            warn ? "bg-warning/20 text-warning" : "bg-muted dark:bg-border text-muted-foreground dark:text-muted-foreground"
          }`}>{pct}%</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-muted dark:bg-border overflow-hidden">
        {pct != null && (
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground dark:text-foreground tabular-nums">
          {fmtV(used)}{unit}
          {limit != null && <span className="font-normal text-muted-foreground"> / {fmtV(limit)}{unit}</span>}
        </span>
        {limit == null && <span className="italic">Unlimited</span>}
        {limit != null && <span>{limit - used >= 0 ? fmtV(limit - used) + unit + " remaining" : "Over limit"}</span>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UsagePage({ onNavigate }) {
  const usage = CURRENT.usage;

  // Period selector state (cosmetic)
  const [period, setPeriod] = useState("apr-2025");

  return (
    <main className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="usage" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border dark:bg-border" />
            <span className="text-sm text-foreground dark:text-foreground font-medium">Usage</span>
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-foreground tracking-tight">Usage Analytics</h1>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                Vanta Logistics · Growth tier · Platform consumption for current billing period
              </p>
            </div>
            {/* Period selector */}
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="h-9 px-3 rounded-[8px] border border-border dark:border-border bg-card dark:bg-card text-sm text-muted-foreground dark:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30">
              <option value="apr-2025">April 2025</option>
              <option value="mar-2025">March 2025</option>
              <option value="feb-2025">February 2025</option>
            </select>
          </div>

          {/* Summary stats */}
          <div className="flex gap-3 flex-wrap">
            <StatCard icon={Zap}       label="Tokens Consumed"    value={`${(usage.tokensConsumed ?? 0)}M`}      sub={`@ $${TIER_DEF.tokenRatePerM}/1M`}          color="var(--primary)" />
            <StatCard icon={Users}     label="Active Seats"       value={`${usage.seatsUsed ?? 0} / ${CURRENT.seats}`} sub="of provisioned seats"                  color="var(--info)" />
            <StatCard icon={Workflow}  label="Flow Executions"    value={(usage.flowExecutions ?? 0).toLocaleString()} sub={`of ${(LIMITS.flowExecPerMonth ?? 0).toLocaleString()} limit`} color="var(--success)" />
            <StatCard icon={HardDrive} label="Knowledge Hub"      value={`${usage.storageGB ?? 0} GB`}           sub={`of ${LIMITS.knowledgeHubGB ?? 0} GB`}       color="var(--warning)" />
          </div>

          {/* Token trend chart */}
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground dark:text-foreground">Platform Token Consumption</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-primary" /> Current month
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-muted" /> Prior months
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Millions of platform tokens · last 6 months</p>
            <BarChart data={usage.trend ?? [0,0,0,0,0,0]} labels={TREND_MONTHS} color="var(--primary)" unit="M" height={100} />
            <div className="grid grid-cols-3 divide-x divide-muted dark:divide-[#334155] mt-4 pt-4 border-t border-border dark:border-border">
              {[
                { label: "6-month total", value: `${(usage.trend ?? []).reduce((a,b)=>a+b,0)}M` },
                { label: "Peak month",    value: `${Math.max(...(usage.trend ?? [0]))}M`         },
                { label: "MoM change",    value: (() => { const t = usage.trend ?? [0,0]; const d = t.at(-1) - t.at(-2); return `${d >= 0 ? "+" : ""}${d}M`; })() },
              ].map(({ label, value }, i) => (
                <div key={i} className="px-4 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-base font-bold text-foreground dark:text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resource meters */}
          <div>
            <h2 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">Resource Utilisation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UsageMeter icon={Users}     label="Seats"                  used={usage.seatsUsed}        limit={CURRENT.seats}             color="var(--info)" />
              <UsageMeter icon={Zap}       label="Flow Executions / mo"   used={usage.flowExecutions}   limit={LIMITS.flowExecPerMonth}   color="var(--success)" />
              <UsageMeter icon={HardDrive} label="Knowledge Hub Storage"  used={usage.storageGB}        limit={LIMITS.knowledgeHubGB}     unit=" GB" color="var(--warning)" />
              <UsageMeter icon={TrendingUp} label="Platform Tokens (M)"   used={usage.tokensConsumed}   limit={null}                      color="var(--primary)" />
            </div>
          </div>

          {/* Per-user breakdown */}
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border dark:border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground dark:text-foreground">Top Users by Consumption</h2>
              <span className="text-xs text-muted-foreground">April 2025</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border">
                  {["User", "Role", "Tokens (M)", "Flow Runs", "% of Total"].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USERS.map((u, i) => {
                  const totalTokens = USERS.reduce((s, x) => s + x.tokensM, 0);
                  const pct = totalTokens > 0 ? Math.round((u.tokensM / totalTokens) * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-border dark:border-border last:border-0 hover:bg-muted dark:hover:bg-muted transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-foreground dark:text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={u.role === "Admin"
                            ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                            : { background: "var(--border)", color: "var(--primary-foreground)" }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-foreground dark:text-foreground font-semibold">{u.tokensM}</td>
                      <td className="px-5 py-3 tabular-nums text-foreground dark:text-foreground">{u.flows.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-muted dark:bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Billing note */}
          <div className="flex items-start gap-3 bg-muted dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3">
            <DollarSign size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-5">
              Estimates assume 2M platform tokens per user per month as a standard baseline. AI provider costs (OpenAI, Anthropic, xAI) are billed
              directly by the respective provider under your own API agreement. Aziron has no visibility into or liability for those costs.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
