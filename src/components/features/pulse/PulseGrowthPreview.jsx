import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Brain,
  DollarSign,
  Filter,
  Lightbulb,
  PieChart,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const revenueTrend = [
  { m: "Jan", mrr: 42, arr: 504, profit: 12 },
  { m: "Feb", mrr: 48, arr: 576, profit: 15 },
  { m: "Mar", mrr: 55, arr: 660, profit: 18 },
  { m: "Apr", mrr: 62, arr: 744, profit: 21 },
  { m: "May", mrr: 71, arr: 852, profit: 26 },
  { m: "Jun", mrr: 82, arr: 984, profit: 31 },
];

const funnelSteps = [
  { step: "Visits", pct: 100, count: "284k" },
  { step: "Signup", pct: 22, count: "62k" },
  { step: "Convert", pct: 8.2, count: "23k" },
  { step: "Retain (30d)", pct: 5.1, count: "14.5k" },
];

const channels = [
  { ch: "Organic", val: 38 },
  { ch: "Paid social", val: 27 },
  { ch: "Referral", val: 18 },
  { ch: "Partner", val: 11 },
  { ch: "Other", val: 6 },
];

const cohortWeeks = ["W0", "W1", "W2", "W3", "W4"];
const cohortRows = [
  { label: "Jan cohort", vals: [100, 42, 36, 33, 31] },
  { label: "Feb cohort", vals: [100, 45, 39, 35, null] },
  { label: "Mar cohort", vals: [100, 48, null, null, null] },
];

const aiRecs = [
  "Drop-off at checkout ↑ 18% WoW — fix payment UX (card errors +3.2pp on mobile).",
  "Trial→paid conversion lagging in EU — localize pricing page + add SEPA.",
  "Retention week-4 below target for SMB segment — trigger onboarding nudge series.",
];

function heatColor(v) {
  if (v == null) return "bg-slate-100 text-slate-300";
  if (v >= 70) return "bg-emerald-600 text-white";
  if (v >= 40) return "bg-emerald-400/90 text-emerald-950";
  if (v >= 25) return "bg-amber-300 text-amber-950";
  return "bg-orange-200 text-orange-950";
}

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-2 flex size-9 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="size-4 text-white" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function PulseGrowthPreview({ compact = false }) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900 shadow-sm">
      <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-6 py-5 text-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">Growth · Revenue intelligence</p>
            <h2 className="text-xl font-bold tracking-tight">Business Growth &amp; Revenue Intelligence</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              For founders, product teams, and growth teams — from raw metrics to actionable business insights.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
            <Zap className="size-4 text-amber-300" />
            <span className="text-slate-200">
              <span className="font-semibold text-white">Differentiator:</span> analytics + AI strategy suggestions
            </span>
          </div>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-[11px] text-emerald-100">
          <TrendingUp className="size-3.5" />
          Core value: raw metrics → actionable insights
        </p>
      </header>

      <div className={`space-y-5 p-5 ${compact ? "space-y-4 p-4" : ""}`}>
        {/* Revenue overview */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <DollarSign className="size-4 text-emerald-600" />
            Revenue overview
          </h3>
          <div className={`mb-4 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
            <Kpi icon={DollarSign} label="MRR" value="$82k" sub="+12.4% MoM" accent="bg-emerald-600" />
            <Kpi icon={TrendingUp} label="ARR" value="$984k" sub="Run-rate · fiscal" accent="bg-teal-600" />
            <Kpi icon={PieChart} label="Net margin" value="31%" sub="After CAC payback" accent="bg-slate-700" />
            <Kpi icon={Users} label="Active accounts" value="14.5k" sub="Paying + trial" accent="bg-violet-600" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium text-slate-600">MRR, ARR &amp; profit trend</p>
            <div className="h-52 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="mrr" name="MRR ($k)" stroke="#059669" strokeWidth={2} fill="url(#grMrr)" />
                  <Line type="monotone" dataKey="arr" name="ARR ($k)" stroke="#0d9488" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="profit" name="Profit ($k)" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
          {/* User funnel */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Filter className="size-4 text-teal-600" />
              User funnel
            </h3>
            <p className="mb-3 text-[11px] text-slate-500">Visit → Signup → Conversion → Retention</p>
            <div className="space-y-3">
              {funnelSteps.map((f) => (
                <div key={f.step}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-800">{f.step}</span>
                    <span className="tabular-nums text-slate-600">
                      {f.pct}% · {f.count}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${Math.max(6, f.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top channels */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PieChart className="size-4 text-violet-600" />
              Top channels
            </h3>
            <p className="mb-2 text-[11px] text-slate-500">Where growth is coming from (% attribution)</p>
            <div className="h-52 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channels} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="ch"
                    width={compact ? 88 : 100}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v) => [`${v}%`, "Share"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="val" radius={[0, 6, 6, 0]} fill="#10b981">
                    {channels.map((_, i) => (
                      <Cell key={i} fill={["#059669", "#0d9488", "#6366f1", "#8b5cf6", "#94a3b8"][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cohort analysis */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="size-4 text-slate-700" />
            Cohort analysis
          </h3>
          <p className="mb-3 text-[11px] text-slate-500">Retention % by week (illustrative)</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] border-collapse text-center text-[11px]">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold text-slate-500">Cohort</th>
                  {cohortWeeks.map((w) => (
                    <th key={w} className="p-2 font-semibold text-slate-500">
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortRows.map((row) => (
                  <tr key={row.label} className="border-t border-slate-100">
                    <td className="p-2 text-left font-medium text-slate-800">{row.label}</td>
                    {row.vals.map((v, i) => (
                      <td key={i} className="p-1.5">
                        {v != null ? (
                          <span className={`inline-flex min-w-[2.5rem] justify-center rounded px-2 py-1 font-mono font-semibold ${heatColor(v)}`}>
                            {v}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI recommendations */}
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Brain className="size-4 text-violet-600" />
            AI recommendations
          </h3>
          <ul className="space-y-2.5">
            {aiRecs.map((text) => (
              <li
                key={text}
                className="flex gap-2 rounded-lg border border-violet-100 bg-white/80 px-3 py-2 text-xs leading-relaxed text-slate-800"
              >
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-violet-600">
            <Sparkles className="size-3" />
            Combines analytics + AI strategy suggestions
          </p>
        </div>
      </div>
    </div>
  );
}
