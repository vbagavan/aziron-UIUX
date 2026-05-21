import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Minus, Timer } from "lucide-react";

import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";

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
  improving: { text: "Improving", tone: "text-success", icon: ArrowUpRight },
  stable: { text: "Stable", tone: "text-info", icon: Minus },
  dropping: { text: "Dropping", tone: "text-destructive", icon: ArrowDownRight },
  good: { text: "Good", tone: "text-success", icon: Activity },
  warning: { text: "Warning", tone: "text-warning", icon: AlertTriangle },
  critical: { text: "Critical", tone: "text-destructive", icon: AlertTriangle },
};

export default function InsightCard({ label, value, comparison, trendPercent, points, status, accent, metric }) {
  const trendUp = trendPercent > 0;
  const tone =
    trendPercent === 0 ? "text-muted-foreground" : trendUp ? "text-success" : "text-destructive";

  const statusStyle = STATUS_STYLE[status];
  const StatusIcon = statusStyle?.icon || Timer;

  return (
    <SectionCard className="group transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-elevation-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="type-section-eyebrow">{label}</p>
          <p className="type-metric-value mt-2 text-3xl tracking-tight">{value}</p>
        </div>
        <div className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{metric}</div>
      </div>

      <div className="mt-4">
        <Sparkline points={points} stroke={accent} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <div className={cn("flex items-center gap-1 text-xs font-semibold", tone)}>
            {trendPercent === 0 ? <Minus size={13} /> : trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trendPercent)}%
          </div>
          <p className="type-caption mt-1">{comparison}</p>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            statusStyle?.tone || "text-muted-foreground",
          )}
        >
          <StatusIcon size={13} />
          {statusStyle?.text}
        </div>
      </div>
    </SectionCard>
  );
}
