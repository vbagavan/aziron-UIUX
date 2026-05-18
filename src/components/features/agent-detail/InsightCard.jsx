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
  improving: { text: "Improving", tone: "text-success dark:text-success", icon: ArrowUpRight },
  stable: { text: "Stable", tone: "text-info dark:text-info", icon: Minus },
  dropping: { text: "Dropping", tone: "text-destructive dark:text-destructive", icon: ArrowDownRight },
  good: { text: "Good", tone: "text-success dark:text-success", icon: Activity },
  warning: { text: "Warning", tone: "text-warning dark:text-warning", icon: AlertTriangle },
  critical: { text: "Critical", tone: "text-destructive dark:text-destructive", icon: AlertTriangle },
};

export default function InsightCard({ label, value, comparison, trendPercent, points, status, accent, metric }) {
  const trendUp = trendPercent > 0;
  const tone = trendPercent === 0
    ? "text-muted-foreground dark:text-muted-foreground"
    : trendUp
    ? "text-success dark:text-success"
    : "text-destructive dark:text-destructive";

  const statusStyle = STATUS_STYLE[status];
  const StatusIcon = statusStyle?.icon || Timer;

  return (
    <div className="group rounded-2xl border border-border bg-card px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-border dark:bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground dark:text-foreground">{value}</p>
        </div>
        <div className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:bg-background dark:text-muted-foreground">
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
          <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">{comparison}</p>
        </div>

        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle?.tone || "text-muted-foreground"}`}>
          <StatusIcon size={13} />
          {statusStyle?.text}
        </div>
      </div>
    </div>
  );
}
