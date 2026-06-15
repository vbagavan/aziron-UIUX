import { useState } from "react";
import { cn } from "@/lib/utils";

export function HubMiniBarChart({
  data = [],
  valueKey = "value",
  labelKey = "label",
  color = "var(--primary)",
  height = 72,
  className,
}) {
  const values = data.map((d) => d[valueKey] ?? 0);
  const max = Math.max(...values, 1);
  const [hovered, setHovered] = useState(null);

  return (
    <div className={cn("flex items-end gap-1.5", className)} style={{ height: height + 22 }}>
      {data.map((point, i) => {
        const v = point[valueKey] ?? 0;
        const pct = (v / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div
            key={point[labelKey] ?? i}
            className="relative flex flex-1 flex-col items-center gap-1"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i ? (
              <div className="absolute -top-7 z-10 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-semibold shadow-md">
                {v.toLocaleString()}
              </div>
            ) : null}
            <div
              className="w-full cursor-pointer rounded-t-[4px] transition-all"
              style={{
                height: `${Math.max(pct, v > 0 ? 4 : 0)}%`,
                maxHeight: height,
                minHeight: v > 0 ? 4 : 0,
                background: isLast ? color : hovered === i ? `${color}cc` : `${color}55`,
              }}
            />
            <span className="truncate text-[9px] text-muted-foreground">{point[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HubMetricRing({ value, max = 100, label, className }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className="relative flex size-14 items-center justify-center rounded-full border-4 border-muted"
        style={{
          borderTopColor: "var(--primary)",
          borderRightColor: pct > 25 ? "var(--primary)" : undefined,
          borderBottomColor: pct > 50 ? "var(--primary)" : undefined,
          borderLeftColor: pct > 75 ? "var(--primary)" : undefined,
        }}
      >
        <span className="text-sm font-semibold tabular-nums">{pct}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
