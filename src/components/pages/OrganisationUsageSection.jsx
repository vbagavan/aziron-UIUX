import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle, Bot, Brain, CheckCircle2, Database,
  Download, FileJson, FileSpreadsheet, FileText,
  Lightbulb, Network, RefreshCw, TrendingUp, Users, Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TENANT_USERS, TENANT_USER_USAGE, INVOICES,
} from "@/data/adminData";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lastNMonths(n) {
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return M[d.getMonth()];
  });
}

// Deterministic growth shape — 6 months approaching current value
const GROWTH_SHAPE = [0.70, 0.77, 0.83, 0.88, 0.94, 1.00];
// Previous-period comparison shape (simulate previous 30d)
const PREV_SHAPE   = [0.60, 0.67, 0.73, 0.78, 0.84, 0.91];

function buildTrend(current, months = 6) {
  const labels = lastNMonths(months);
  return labels.map((month, i) => ({
    month,
    current:  Math.round(current * GROWTH_SHAPE[i]),
    previous: Math.round(current * PREV_SHAPE[i]),
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** SVG circular progress ring */
function RingProgress({ pct, size = 80, strokeWidth = 8, color = "#2563eb" }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct ?? 0, 100);
  const dash = (filled / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
        className="dark:stroke-muted"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

/** Compact chart tooltip */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-xl text-xs dark:border-border">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-foreground">{(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/** Single mini area chart card */
function TrendCard({ label, current, prev, data, color, icon: Icon }) {
  const delta = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 0;
  const up = delta >= 0;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:border-border dark:bg-card/90">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {current.toLocaleString()}
          </p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
          up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
        )}>
          {up ? "+" : ""}{delta}% vs last period
        </span>
      </div>
      <div className="h-20 w-full px-0 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="current"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${label})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="previous"
              stroke={color}
              strokeWidth={1}
              strokeDasharray="3 3"
              fill="none"
              dot={false}
              activeDot={false}
              opacity={0.4}
            />
            <Tooltip content={<ChartTip />} cursor={false} />
            <XAxis dataKey="month" hide />
            <YAxis hide domain={["auto", "auto"]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrganisationUsageSection({ tenant, onNavigate }) {
  const u        = tenant.usage ?? {};
  const ov       = tenant.overrides ?? {};
  const members  = u.memberCount  ?? tenant.seats ?? 0;
  const maxUsers = tenant.max_users;
  const agents   = u.agentCount   ?? 0;
  const workflows= u.workflowCount?? 0;
  const vectorDbs= u.vectorDbCount?? 0;
  const knowledgeGB = ov.knowledgeHubGB ?? vectorDbs * 14;
  const providers= u.providerCount?? 0;

  const seatPct = maxUsers ? Math.min(100, Math.round((members / maxUsers) * 100)) : null;
  const storagePct = Math.min(100, Math.round((knowledgeGB / (ov.knowledgeHubGB ?? 500)) * 100));

  // User roster
  const userRoster = TENANT_USERS[tenant.id] ?? [];
  const activeCount   = userRoster.filter(u => u.status === "Active").length || Math.round(members * 0.82);
  const inactiveCount = Math.max(0, members - activeCount);
  const userUsage     = TENANT_USER_USAGE[tenant.id] ?? [];

  // Latest invoice
  const latestInv = useMemo(() =>
    [...(INVOICES ?? [])].filter(i => i.tenantId === tenant.id)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0]
  , [tenant.id]);

  // Efficiency
  const safeM = Math.max(1, members);
  const avgAgents    = (agents    / safeM).toFixed(2);
  const avgWorkflows = (workflows / safeM).toFixed(2);
  const resourcesPerM= ((agents + workflows + vectorDbs) / safeM).toFixed(2);
  const activeUsersCount = userRoster.filter(u => u.status === "Active").length || Math.round(members * 0.82);
  const adoptionRate = Math.round((activeUsersCount / safeM) * 100);

  // Trend data
  const memberTrend   = useMemo(() => buildTrend(members), [members]);
  const agentTrend    = useMemo(() => buildTrend(agents), [agents]);
  const workflowTrend = useMemo(() => buildTrend(workflows), [workflows]);
  const vectorTrend   = useMemo(() => buildTrend(vectorDbs), [vectorDbs]);

  // Alerts
  const alerts = [
    seatPct != null && seatPct >= 85 && {
      level: "danger",
      msg: `Seat limit at ${seatPct}% — ${maxUsers - members} seats remaining`,
      action: "Manage members",
      navId: "members",
    },
    agents > 35 && {
      level: "warn",
      msg: "High agent count detected — review unused agents",
      action: "Review",
      navId: null,
    },
    latestInv?.status === "overdue" && {
      level: "danger",
      msg: "Invoice overdue — service interruption risk",
      action: "View billing",
      navId: null,
    },
  ].filter(Boolean);

  // Insights
  const insightLines = [
    {
      icon: TrendingUp,
      color: "text-primary",
      text: `Members grew ~${Math.round((GROWTH_SHAPE[5] - GROWTH_SHAPE[3]) / GROWTH_SHAPE[3] * 100)}% in the last 2 months based on usage trajectory.`,
    },
    {
      icon: Brain,
      color: "text-violet-500",
      text: agents / safeM > 0.05
        ? "Usage pattern suggests heavy automation adoption — consider dedicated agent quotas per team."
        : "Agent adoption is below average for this plan tier — onboarding push recommended.",
    },
    {
      icon: Users,
      color: "text-blue-500",
      text: seatPct != null && seatPct > 85
        ? `At current trajectory, seats will be exhausted within this billing cycle.`
        : `Seat headroom is healthy — ${maxUsers ? `${(maxUsers - members).toLocaleString()} seats` : "unlimited"} available.`,
    },
    {
      icon: Lightbulb,
      color: "text-amber-500",
      text: latestInv
        ? `Latest invoice: $${latestInv.amount.toLocaleString()} (${latestInv.period}). Renewal ${tenant.subscriptionRenewalDate ?? "—"}.`
        : "No billing data available for this tenant.",
    },
  ];

  const ringColor = seatPct == null ? "#2563eb" : seatPct >= 90 ? "#ef4444" : seatPct >= 75 ? "#f59e0b" : "#2563eb";

  return (
    <div className="col-span-12 flex flex-col gap-6 pb-4">

      {/* ── Section 1: Core Metrics ── */}
      <section aria-labelledby="core-metrics-heading">
        <div className="mb-3">
          <h2 id="core-metrics-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Core metrics
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Current snapshot against plan limits.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

          {/* Members — ring progress */}
          <button
            type="button"
            onClick={() => onNavigate?.("members")}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-card/90"
            aria-label={`Members: ${members.toLocaleString()}. Go to members tab`}
          >
            <div className="relative inline-flex items-center justify-center">
              <RingProgress pct={seatPct ?? 70} size={72} strokeWidth={7} color={ringColor} />
              <span className={cn(
                "absolute text-sm font-bold tabular-nums",
                seatPct != null && seatPct >= 90 ? "text-destructive" : "text-foreground",
              )}>
                {seatPct != null ? `${seatPct}%` : "—"}
              </span>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{members.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Members</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {maxUsers ? `of ${maxUsers.toLocaleString()}` : "Unlimited"}
              </p>
            </div>
          </button>

          {/* Agents */}
          <button
            type="button"
            onClick={() => onNavigate?.("usage")}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-card/90"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/30">
              <Bot className="size-7 text-violet-500" strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{agents.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agents</p>
              <p className="mt-0.5 text-[11px] text-success">↑ 3 this week</p>
            </div>
          </button>

          {/* Workflows */}
          <button
            type="button"
            onClick={() => onNavigate?.("usage")}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-card/90"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/30">
              <Workflow className="size-7 text-teal-500" strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{workflows.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workflows</p>
              <p className="mt-0.5 text-[11px] text-success">↑ 1 this week</p>
            </div>
          </button>

          {/* Vector DBs */}
          <button
            type="button"
            onClick={() => onNavigate?.("usage")}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-card/90"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <Database className="size-7 text-amber-500" strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{vectorDbs.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vector DBs</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{knowledgeGB.toLocaleString()} GB</p>
            </div>
          </button>

          {/* Providers */}
          <button
            type="button"
            onClick={() => onNavigate?.("usage")}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-card/90"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/30">
              <Network className="size-7 text-sky-500" strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{providers.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Providers</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Model routes</p>
            </div>
          </button>
        </div>
      </section>

      {/* ── Section 2: Utilization & Health ── */}
      <section aria-labelledby="util-heading">
        <h2 id="util-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Utilization &amp; Health
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          {/* Seat utilization bar */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm dark:border-border dark:bg-card/90">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Seat limit</p>
              {seatPct != null && (
                <span className={cn(
                  "text-[11px] font-bold tabular-nums",
                  seatPct >= 90 ? "text-destructive" : seatPct >= 75 ? "text-amber-500" : "text-success",
                )}>
                  {seatPct}%
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
              {members.toLocaleString()} <span className="text-base font-normal text-muted-foreground">/ {maxUsers?.toLocaleString() ?? "∞"}</span>
            </p>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", seatPct >= 90 ? "bg-destructive" : seatPct >= 75 ? "bg-amber-500" : "bg-primary")}
                style={{ width: `${seatPct ?? 70}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {maxUsers ? `${(maxUsers - members).toLocaleString()} seats remaining` : "Unlimited plan"}
            </p>
          </div>

          {/* Storage utilization */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm dark:border-border dark:bg-card/90">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Knowledge storage</p>
              <span className={cn(
                "text-[11px] font-bold tabular-nums",
                storagePct >= 90 ? "text-destructive" : storagePct >= 75 ? "text-amber-500" : "text-success",
              )}>
                {storagePct}%
              </span>
            </div>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
              {knowledgeGB.toLocaleString()} <span className="text-base font-normal text-muted-foreground">GB</span>
            </p>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", storagePct >= 90 ? "bg-destructive" : storagePct >= 75 ? "bg-amber-500" : "bg-primary")}
                style={{ width: `${storagePct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Across {vectorDbs} vector stores</p>
          </div>

          {/* Active vs Inactive */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm dark:border-border dark:bg-card/90">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active vs Inactive</p>
            <div className="mt-2 flex items-end gap-3">
              <div>
                <p className="font-mono text-xl font-semibold tabular-nums text-success">{activeCount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <span className="mb-1 text-muted-foreground/40">/</span>
              <div>
                <p className="font-mono text-xl font-semibold tabular-nums text-muted-foreground">{inactiveCount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Inactive</p>
              </div>
            </div>
            {/* Stacked bar */}
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${Math.round((activeCount / Math.max(1, activeCount + inactiveCount)) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{adoptionRate}% adoption rate</p>
          </div>

          {/* Alert cards column */}
          <div className="flex flex-col gap-2">
            {alerts.length === 0 ? (
              <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-success/30 bg-success/5 p-4 shadow-sm">
                <CheckCircle2 className="size-5 shrink-0 text-success" strokeWidth={1.5} aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-success">All systems healthy</p>
                  <p className="text-[11px] text-muted-foreground">No active alerts detected.</p>
                </div>
              </div>
            ) : alerts.map((a, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2.5 rounded-2xl border p-3 shadow-sm",
                  a.level === "danger"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-amber-200/70 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
                )}
              >
                <AlertTriangle
                  className={cn("mt-0.5 size-4 shrink-0", a.level === "danger" ? "text-destructive" : "text-amber-500")}
                  strokeWidth={2}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className={cn("text-xs font-semibold", a.level === "danger" ? "text-destructive" : "text-amber-700 dark:text-amber-400")}>
                    {a.msg}
                  </p>
                  {a.action && (
                    <button
                      type="button"
                      onClick={() => a.navId && onNavigate?.(a.navId)}
                      className={cn(
                        "mt-0.5 text-[11px] font-medium underline-offset-2 hover:underline",
                        a.level === "danger" ? "text-destructive" : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {a.action} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Efficiency & Derived Metrics ── */}
      <section aria-labelledby="efficiency-heading">
        <h2 id="efficiency-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Efficiency &amp; derived metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Avg agents / member",    value: avgAgents,     sub: "Adoption efficiency",     color: "bg-violet-50 dark:bg-violet-950/30 text-violet-500" },
            { label: "Avg workflows / member", value: avgWorkflows,   sub: "Automation maturity",     color: "bg-teal-50 dark:bg-teal-950/30 text-teal-500" },
            { label: "Resources / member",     value: resourcesPerM,  sub: "Overall load index",      color: "bg-sky-50 dark:bg-sky-950/30 text-sky-500" },
            { label: "Active users (30d)",     value: activeUsersCount.toLocaleString(), sub: "Real engagement", color: "bg-green-50 dark:bg-green-950/30 text-green-500" },
            {
              label: "Est. monthly cost",
              value: latestInv ? `$${latestInv.amount.toLocaleString()}` : "—",
              sub: latestInv ? `Period: ${latestInv.period}` : "No billing data",
              color: "bg-amber-50 dark:bg-amber-950/30 text-amber-500",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-sm dark:border-border dark:bg-card/90"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-foreground">{m.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Trends ── */}
      <section aria-labelledby="trends-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="trends-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Growth trends — last 6 months
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Solid line = current period · Dashed line = previous period
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TrendCard
            label="Members"
            current={members}
            prev={Math.round(members * PREV_SHAPE[5])}
            data={memberTrend}
            color="#2563eb"
            icon={Users}
          />
          <TrendCard
            label="Agents"
            current={agents}
            prev={Math.round(agents * PREV_SHAPE[5])}
            data={agentTrend}
            color="#8b5cf6"
            icon={Bot}
          />
          <TrendCard
            label="Workflows"
            current={workflows}
            prev={Math.round(workflows * PREV_SHAPE[5])}
            data={workflowTrend}
            color="#14b8a6"
            icon={Workflow}
          />
          <TrendCard
            label="Vector DBs"
            current={vectorDbs}
            prev={Math.round(vectorDbs * PREV_SHAPE[5])}
            data={vectorTrend}
            color="#f59e0b"
            icon={Database}
          />
        </div>
      </section>

      {/* ── Section 5: Breakdown & Insights ── */}
      <section aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Breakdown &amp; insights
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Top users table */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:border-border dark:bg-card/90">
            <div className="border-b border-border/60 px-4 py-3 dark:border-border/70">
              <p className="text-sm font-semibold text-foreground">Top 5 active users</p>
              <p className="text-[11px] text-muted-foreground">Ranked by AI token consumption</p>
            </div>
            {userUsage.length > 0 ? (
              <div className="divide-y divide-border/50 dark:divide-border/60">
                {userUsage.slice(0, 5).map((u, i) => {
                  const maxTokens = Math.max(...userUsage.map(x => x.tokensM));
                  const pct = Math.round((u.tokensM / maxTokens) * 100);
                  return (
                    <div key={u.email} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-5 shrink-0 text-center text-[11px] font-bold text-muted-foreground">#{i + 1}</span>
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <div className="h-1 w-full max-w-[6rem] overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted-foreground">{u.tokensM}M tok</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{u.role}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{u.flows.toLocaleString()} flows</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">No user usage data available.</p>
            )}
          </div>

          {/* Smart insights */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:border-border dark:bg-card/90">
            <div className="border-b border-border/60 px-4 py-3 dark:border-border/70">
              <p className="text-sm font-semibold text-foreground">Smart insights</p>
              <p className="text-[11px] text-muted-foreground">AI-generated observations for this tenant</p>
            </div>
            <ul className="divide-y divide-border/50 dark:divide-border/60">
              {insightLines.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <li key={i} className="flex items-start gap-3 px-4 py-3.5">
                    <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/50")}>
                      <Icon className={cn("size-4", ins.color)} strokeWidth={1.5} aria-hidden />
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{ins.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Section 6: Actions footer ── */}
      <section aria-label="Usage actions">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm dark:border-border dark:bg-card/90">
          <p className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Export</p>
          {[
            { icon: FileSpreadsheet, label: "CSV",  color: "text-green-600" },
            { icon: FileText,        label: "PDF",  color: "text-red-500" },
            { icon: FileJson,        label: "JSON", color: "text-amber-500" },
          ].map((ex) => {
            const Icon = ex.icon;
            return (
              <button
                key={ex.label}
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted dark:border-border dark:bg-background/60"
              >
                <Icon className={cn("size-3.5 shrink-0", ex.color)} aria-hidden />
                {ex.label}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted dark:border-border dark:bg-background/60"
            >
              <RefreshCw className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              Refresh data
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("audit")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted dark:border-border dark:bg-background/60"
            >
              <Download className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              View detailed logs
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
