import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Minus, Timer } from "lucide-react";

function Sparkline({ points, stroke }) {
  const width = 120;
  const height = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 6) - 3;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_STYLE = {
  improving: { text: "Improving", tone: "text-[#15803d] dark:text-[#86efac]", icon: ArrowUpRight },
  stable: { text: "Stable", tone: "text-[#0369a1] dark:text-[#7dd3fc]", icon: Minus },
  dropping: { text: "Dropping", tone: "text-[#b91c1c] dark:text-[#fca5a5]", icon: ArrowDownRight },
  good: { text: "Good", tone: "text-[#15803d] dark:text-[#86efac]", icon: Activity },
  warning: { text: "Warning", tone: "text-[#a16207] dark:text-[#fde68a]", icon: AlertTriangle },
  critical: { text: "Critical", tone: "text-[#b91c1c] dark:text-[#fecaca]", icon: AlertTriangle },
};

export default function InsightCard({ label, value, comparison, trendPercent, points, status, accent, metric }) {
  const trendUp = trendPercent > 0;
  const tone = trendPercent === 0
    ? "text-[#64748b] dark:text-[#94a3b8]"
    : trendUp
    ? "text-[#15803d] dark:text-[#86efac]"
    : "text-[#b91c1c] dark:text-[#fecaca]";

  const statusStyle = STATUS_STYLE[status];
  const StatusIcon = statusStyle?.icon || Timer;

  return (
    <div className="group rounded-2xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-[#334155] dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8] dark:text-[#64748b]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0f172a] dark:text-[#f8fafc]">{value}</p>
        </div>
        <div className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#475569] dark:bg-[#0f172a] dark:text-[#cbd5e1]">
          {metric}
        </div>
      </div>

      <div className="mt-4">
        <Sparkline points={points} stroke={accent} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${tone}`}>
            {trendPercent === 0 ? <Minus size={13} /> : trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trendPercent)}%
          </div>
          <p className="mt-1 text-xs text-[#64748b] dark:text-[#94a3b8]">{comparison}</p>
        </div>

        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle?.tone || "text-[#64748b]"}`}>
          <StatusIcon size={13} />
          {statusStyle?.text}
        </div>
      </div>
    </div>
  );
}
