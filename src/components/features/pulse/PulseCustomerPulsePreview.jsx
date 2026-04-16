import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Headset,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  TrendingDown,
  Zap,
} from "lucide-react";

const responseTrend = [
  { d: "Mon", first: 18, resolve: 4.2 },
  { d: "Tue", first: 22, resolve: 5.1 },
  { d: "Wed", first: 14, resolve: 3.8 },
  { d: "Thu", first: 16, resolve: 4.0 },
  { d: "Fri", first: 12, resolve: 3.2 },
  { d: "Sat", first: 9, resolve: 2.6 },
  { d: "Sun", first: 11, resolve: 2.9 },
];

const sentimentSlices = [
  { name: "Positive", value: 58, fill: "#0ea5e9" },
  { name: "Neutral", value: 27, fill: "#94a3b8" },
  { name: "Negative", value: 15, fill: "#f43f5e" },
];

const topIssues = [
  { issue: "Billing / invoice", count: 412 },
  { issue: "Login / SSO", count: 318 },
  { issue: "API rate limits", count: 241 },
  { issue: "Export failed", count: 186 },
  { issue: "Slow dashboard", count: 142 },
];

function Kpi({ icon: Icon, label, value, sub, ring }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-2 flex size-9 items-center justify-center rounded-lg ${ring}`}>
        <Icon className="size-4 text-white" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function PulseCustomerPulsePreview({ compact = false }) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-gradient-to-b from-sky-50/50 via-white to-white text-slate-900 shadow-sm">
      <header className="border-b border-sky-100 bg-gradient-to-r from-sky-900 via-cyan-900 to-slate-900 px-6 py-5 text-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/90">Customer Pulse</p>
            <h2 className="text-xl font-bold tracking-tight">Customer Experience &amp; Support Intelligence</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              For support teams, CX leaders, and CRM ops — from ticket handling to intelligent customer experience.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
            <Zap className="size-4 text-amber-300" />
            <span className="text-slate-200">
              <span className="font-semibold text-white">Differentiator:</span> support → proactive customer intelligence
            </span>
          </div>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-[11px] text-sky-100">
          <Sparkles className="size-3.5" />
          Core value: tickets → smarter CX decisions
        </p>
      </header>

      <div className={`space-y-5 p-5 ${compact ? "space-y-4 p-4" : ""}`}>
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageSquare className="size-4 text-sky-600" />
            Ticket overview
          </h3>
          <div className={`grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-3"}`}>
            <Kpi icon={MessageSquare} label="Open" value="1,284" sub="Queue · P1–P4" ring="bg-sky-600" />
            <Kpi icon={CheckCircle2} label="Resolved (7d)" value="6.9k" sub="98.2% within policy" ring="bg-emerald-600" />
            <Kpi icon={AlertTriangle} label="SLA breaches" value="23" sub="-31% WoW · trending down" ring="bg-rose-600" />
          </div>
        </section>

        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock className="size-4 text-cyan-600" />
              Response time trends
            </h3>
            <p className="mb-3 text-[11px] text-slate-500">First response (min) vs resolution time (h)</p>
            <div className="h-52 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="first" name="First response (min)" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="resolve" name="Resolution (h)" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ThumbsUp className="size-4 text-sky-600" />
              Customer sentiment
            </h3>
            <p className="mb-2 text-[11px] text-slate-500">AI sentiment on last 30d ticket threads</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentSlices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={2}>
                      {sentimentSlices.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, "Share"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-wrap justify-center gap-3 text-[11px] sm:flex-col sm:items-start">
                {sentimentSlices.map((s) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="tabular-nums text-slate-500">{s.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <TrendingDown className="size-4 text-amber-600" />
              Top issues
            </h3>
            <p className="mb-2 text-[11px] text-slate-500">Recurring complaints (volume)</p>
            <div className="h-52 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topIssues} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="issue"
                    width={compact ? 100 : 120}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v) => [v, "Tickets"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/80 to-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Bot className="size-4 text-cyan-700" />
              AI assist performance
            </h3>
            <p className="mb-4 text-[11px] text-slate-600">Share of tickets auto-resolved vs escalated to humans</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/80 bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Auto-resolved</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-700">41%</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-emerald-600">
                  <ThumbsUp className="size-3" /> +4.2pp MoM
                </p>
              </div>
              <div className="rounded-lg border border-white/80 bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Escalated</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">59%</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-slate-500">
                  <Headset className="size-3" /> Agent queue
                </p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[41%] rounded-full bg-gradient-to-r from-cyan-500 to-sky-500" title="Auto-resolved" />
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">Stacked view: AI deflection vs human touch</p>
          </div>
        </div>
      </div>
    </div>
  );
}
