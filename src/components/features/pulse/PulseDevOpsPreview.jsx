import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Brain,
  Cpu,
  Gauge,
  HardDrive,
  Layers,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Server,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";

const healthSeries = [
  { t: "00:00", cpu: 42, mem: 58, latency: 120, errors: 0.02 },
  { t: "04:00", cpu: 38, mem: 55, latency: 98, errors: 0.01 },
  { t: "08:00", cpu: 61, mem: 72, latency: 210, errors: 0.04 },
  { t: "12:00", cpu: 78, mem: 81, latency: 340, errors: 0.08 },
  { t: "16:00", cpu: 55, mem: 68, latency: 180, errors: 0.03 },
  { t: "20:00", cpu: 48, mem: 62, latency: 145, errors: 0.02 },
];

const errorsByService = [
  { svc: "checkout-api", count: 42 },
  { svc: "auth", count: 18 },
  { svc: "payments", count: 11 },
  { svc: "edge", count: 6 },
];

const incidents = [
  {
    sev: "P1",
    sevClass: "bg-red-600 text-white",
    title: "Elevated 5xx on checkout-api",
    rca: "AI RCA: Rolling deploy v2.4.2 correlated with spike; likely connection pool exhaustion on shard-b.",
    time: "12m ago",
  },
  {
    sev: "P2",
    sevClass: "bg-amber-500 text-slate-900",
    title: "Kafka consumer lag — billing topic",
    rca: "AI RCA: Downstream indexer slow; no deploy window overlap. Recommend scale-out +2 partitions.",
    time: "1h ago",
  },
  {
    sev: "P3",
    sevClass: "bg-slate-200 text-slate-800",
    title: "Synthetic probe flaky — eu-west",
    rca: "AI RCA: Regional DNS TTL drift; infra change window scheduled.",
    time: "3h ago",
  },
];

const aiFeed = [
  { icon: Timer, text: "Latency spike predicted in ~20 min on checkout-api (p99 trend +2.3σ).", tone: "text-amber-700" },
  { icon: Brain, text: "Anomaly: error rate vs. deploy — suggest canary rollback candidate.", tone: "text-violet-700" },
  { icon: Activity, text: "SLO burn alert: payments availability budget 18% remaining this week.", tone: "text-red-700" },
  { icon: Sparkles, text: "Playbook match: \"connection pool\" → auto-scale + pool size bump draft ready.", tone: "text-blue-700" },
];

const logLines = [
  { ts: "14:22:01.442", lvl: "ERR", trace: "a3f9c2", msg: "checkout-api POST /v1/cart timeout=3000ms upstream=payments" },
  { ts: "14:22:01.448", lvl: "WRN", trace: "a3f9c2", msg: "payments grpc deadline exceeded trace_id=a3f9c2 span=checkout-POST" },
  { ts: "14:22:02.011", lvl: "INF", trace: "b81dde", msg: "autoscale decision: checkout-api replicas 6 → 8 (policy=sre-latency)" },
  { ts: "14:22:04.903", lvl: "INF", trace: "b81dde", msg: "deploy hook completed rollback=skipped reason=within_error_budget" },
];

const autoActions = [
  { label: "Restart checkout-api", icon: RefreshCw, style: "border-slate-200 bg-white hover:bg-slate-50" },
  { label: "Rollback deploy v2.4.2", icon: RotateCcw, style: "border-amber-200 bg-amber-50 hover:bg-amber-100" },
  { label: "Scale workers +2", icon: Server, style: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100" },
];

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className={`flex size-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="size-4 text-white" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live</span>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function PulseDevOpsPreview({ compact = false }) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50/90 text-slate-900 shadow-sm">
      {/* Header */}
      <header className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">SRE · DevOps</p>
            <h2 className="text-xl font-bold tracking-tight">SRE Command Center</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              For DevOps / SRE teams to monitor, predict, and resolve incidents.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            <span className="font-semibold text-emerald-400">Core value:</span> reactive monitoring →{" "}
            <span className="text-white">proactive AI-driven resolution</span>
          </div>
        </div>
      </header>

      <div className={`space-y-5 p-5 ${compact ? "space-y-4 p-4" : ""}`}>
        {/* Live system health */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Gauge className="size-4 text-blue-600" />
            Live system health
          </h3>
          <div className={`mb-4 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
            <StatCard icon={Cpu} label="CPU (avg)" value="61%" sub="Fleet · last 5m" accent="bg-blue-600" />
            <StatCard icon={HardDrive} label="Memory" value="72%" sub="Peak shard-b" accent="bg-violet-600" />
            <StatCard icon={Timer} label="Latency p99" value="340ms" sub="checkout-api" accent="bg-amber-500" />
            <StatCard icon={AlertTriangle} label="Error rate" value="0.08%" sub="5xx + timeouts" accent="bg-red-500" />
          </div>
          <div className={`grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-medium text-slate-600">CPU &amp; memory (24h)</p>
              <div className="h-48 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dopCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#2563eb" fill="url(#dopCpu)" strokeWidth={2} />
                    <Area type="monotone" dataKey="mem" name="Mem %" stroke="#7c3aed" fill="transparent" strokeWidth={2} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-medium text-slate-600">Latency &amp; errors</p>
              <div className="h-48 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="latency" name="p99 ms" stroke="#ea580c" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="errors" name="Err %" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
          {/* Active incidents */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="size-4 text-red-500" />
                Active incidents
              </h3>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">3 open</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {incidents.map((inc) => (
                <li key={inc.title} className="px-4 py-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${inc.sevClass}`}>{inc.sev}</span>
                    <span className="text-sm font-semibold text-slate-900">{inc.title}</span>
                    <span className="text-[10px] text-slate-400">{inc.time}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{inc.rca}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* AI insights */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Sparkles className="size-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-900">AI insights feed</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {aiFeed.map((item, i) => (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <item.icon className={`mt-0.5 size-4 shrink-0 ${item.tone}`} />
                  <p className={`text-xs leading-relaxed ${item.tone}`}>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Logs + traces */}
        <div className="rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <ScrollText className="size-4 text-slate-400" />
              Logs + traces explorer
            </h3>
            <span className="text-[10px] text-slate-500">Loki-style · correlated</span>
          </div>
          <pre className="max-h-52 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-200">
            {logLines.map((l) => (
              <div key={l.ts + l.msg} className="border-b border-slate-800/80 py-1 last:border-0">
                <span className="text-slate-500">{l.ts}</span>{" "}
                <span
                  className={
                    l.lvl === "ERR" ? "text-red-400" : l.lvl === "WRN" ? "text-amber-400" : "text-emerald-400"
                  }
                >
                  [{l.lvl}]
                </span>{" "}
                <span className="text-violet-400">trace={l.trace}</span>{" "}
                <span className="text-slate-300">{l.msg}</span>
              </div>
            ))}
          </pre>
        </div>

        {/* Errors by service + auto actions */}
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Layers className="size-4 text-slate-600" />
              Errors by service
            </h3>
            <div className="h-44 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorsByService} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="svc"
                    width={compact ? 72 : 100}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#64748b">
                    {errorsByService.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#dc2626" : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Zap className="size-4 text-amber-500" />
              Auto actions
            </h3>
            <p className="mb-3 text-xs text-slate-600">One-tap remediations (simulated in preview)</p>
            <div className="flex flex-col gap-2">
              {autoActions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-sm transition-colors ${a.style}`}
                >
                  <a.icon className="size-3.5" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
