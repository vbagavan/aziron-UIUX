import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  Eye,
  Users,
  MousePointer2,
  Package,
  Calendar,
  ChevronDown,
  Download,
  Plus,
  Star,
} from "lucide-react";

const profitData = [
  { label: "1 Jan", current: 7200, previous: 4100 },
  { label: "8 Jan", current: 9100, previous: 4800 },
  { label: "15 Jan", current: 8800, previous: 5200 },
  { label: "18 Jan", current: 12324, previous: 5563 },
  { label: "22 Jan", current: 10100, previous: 4900 },
  { label: "29 Jan", current: 11800, previous: 6100 },
];

/** Compact line chart for the former “AI assistant” slot — hourly storefront sessions. */
const sessionsByHour = [
  { hour: "6a", sessions: 180 },
  { hour: "8a", sessions: 420 },
  { hour: "10a", sessions: 890 },
  { hour: "12p", sessions: 1120 },
  { hour: "2p", sessions: 980 },
  { hour: "4p", sessions: 760 },
  { hour: "6p", sessions: 640 },
  { hour: "8p", sessions: 510 },
  { hour: "10p", sessions: 290 },
];

const activityByDay = [
  { day: "Sun", value: 4200 },
  { day: "Mon", value: 6100 },
  { day: "Tue", value: 8162 },
  { day: "Wed", value: 5400 },
  { day: "Thu", value: 6900 },
  { day: "Fri", value: 5100 },
  { day: "Sat", value: 3800 },
];

const segments = [
  { label: "Retailers", count: 2884, pct: 59, color: "bg-blue-500" },
  { label: "Distributors", count: 1432, pct: 29, color: "bg-emerald-500" },
  { label: "Wholesalers", count: 562, pct: 12, color: "bg-amber-500" },
];

const products = [
  { id: "P-104", name: "Hybrid Active Noise Cance…", sold: 842, revenue: "$48.2K", revUp: true, rating: 5.0 },
  { id: "P-221", name: "Casio G-Shock…", sold: 612, revenue: "$22.1K", revUp: false, rating: 4.8 },
  { id: "P-089", name: "SAMSUNG Galaxy S25 Ultra…", sold: 1204, revenue: "$124K", revUp: true, rating: 5.0 },
];

function KpiCard({ icon: Icon, label, value, delta, deltaPositive, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
          <Icon className="size-5 text-blue-600" />
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            deltaPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {delta}
        </span>
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function ProfitTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p) => p.dataKey === "current");
  const prev = payload.find((p) => p.dataKey === "previous");
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-blue-600">${Number(cur?.value).toLocaleString()} this month</p>
      <p className="text-slate-500">${Number(prev?.value).toLocaleString()} last month</p>
    </div>
  );
}

function RepeatGauge({ value = 68 }) {
  const target = 80;
  const rest = Math.max(0, 100 - value);
  const gaugeData = [
    { name: "rate", v: value, fill: "#3b82f6" },
    { name: "rest", v: rest, fill: "#e2e8f0" },
  ];
  return (
    <div className="flex flex-col items-center py-1">
      <div className="relative mx-auto h-32 w-full max-w-[220px]">
        <PieChart width={220} height={130} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={gaugeData}
            dataKey="v"
            cx={110}
            cy={118}
            startAngle={180}
            endAngle={0}
            innerRadius={58}
            outerRadius={78}
            stroke="none"
            isAnimationActive={false}
          >
            {gaugeData.map((e) => (
              <Cell key={e.name} fill={e.fill} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-6 text-center">
          <span className="text-2xl font-bold text-slate-900">{value}%</span>
          <span className="text-[11px] text-slate-500">On track for {target}% target</span>
        </div>
      </div>
      <button type="button" className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-700">
        Show details
      </button>
    </div>
  );
}

export default function PulseAnalyticsPreview({ compact = false }) {
  return (
    <div
      className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 shadow-sm ${
        compact ? "text-[11px]" : ""
      }`}
    >
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Calendar className="size-3.5 text-slate-500" />
            Jan 1, 2025 – Feb 1, 2025
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Last 30 days
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Plus className="mr-1 inline size-3.5" />
            Add widget
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Download className="size-3.5" />
            Export
          </button>
        </div>
      </header>

      <div className={`space-y-6 p-6 ${compact ? "space-y-4 p-4" : ""}`}>
        {/* KPI row */}
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          <KpiCard
            icon={Eye}
            label="Page views"
            value="16,431"
            delta="+15.5%"
            deltaPositive
            sub="vs. 14,653 last period"
          />
          <KpiCard
            icon={Users}
            label="Visitors"
            value="6,225"
            delta="+8.4%"
            deltaPositive
            sub="vs. 5,732 last period"
          />
          <KpiCard
            icon={MousePointer2}
            label="Click"
            value="2,832"
            delta="-10.5%"
            deltaPositive={false}
            sub="vs. 3,294 last period"
          />
          <KpiCard
            icon={Package}
            label="Orders"
            value="1,224"
            delta="+4.4%"
            deltaPositive
            sub="vs. 1,186 last period"
          />
        </div>

        <div className={`grid gap-6 ${compact ? "grid-cols-1" : "lg:grid-cols-3"}`}>
          {/* Left column */}
          <div className={`space-y-6 ${compact ? "" : "lg:col-span-2"}`}>
            {/* Total profit + area chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total profit</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">$446.7K</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      +24.4%
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-56 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pulseProfitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<ProfitTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="previous"
                      stroke="#cbd5e1"
                      strokeWidth={2}
                      fill="transparent"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="current"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#pulseProfitFill)"
                      dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Customer segments</p>
                {segments.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{s.label}</span>
                      <span className="text-slate-500">{s.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best selling products */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">Best selling products</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Sold</th>
                      <th className="px-5 py-3">Revenue</th>
                      <th className="px-5 py-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((row) => (
                      <tr key={row.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3 font-mono text-slate-600">{row.id}</td>
                        <td className="max-w-[180px] truncate px-5 py-3 font-medium text-slate-800">{row.name}</td>
                        <td className="px-5 py-3 text-slate-600">{row.sold.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={row.revUp ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                            {row.revenue}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {row.rating}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Most day active</h3>
              <div className="h-52 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityByDay} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {activityByDay.map((entry) => (
                        <Cell
                          key={entry.day}
                          fill={entry.day === "Tue" ? "#3b82f6" : "#e2e8f0"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">
                Peak <span className="font-semibold text-blue-600">Tue</span> ·{" "}
                <span className="font-semibold text-slate-800">8,162</span> sessions
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Repeat customer rate</h3>
              <RepeatGauge value={68} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-0.5 text-sm font-semibold text-slate-900">Hourly sessions</h3>
              <p className="mb-3 text-xs text-slate-500">Storefront · last 24 hours</p>
              <div className="h-44 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionsByHour} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis hide domain={["dataMin - 80", "dataMax + 120"]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(v) => [`${Number(v).toLocaleString()} sessions`, "Sessions"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
