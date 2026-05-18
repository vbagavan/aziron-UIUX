import * as React from "react";
import { AlertTriangle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function buildLinePath(points, width, height, accessor, maxValue) {
  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - (accessor(point) / maxValue) * (height - 28) - 14;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(points, width, height, accessor, maxValue) {
  if (points.length === 0) return "";
  const line = buildLinePath(points, width, height, accessor, maxValue);
  return `${line} L ${width},${height - 8} L 0,${height - 8} Z`;
}

function formatTick(label) {
  const compact = label.replace("Today, ", "").replace("Yesterday, ", "Y ").replace("2 days ago, ", "2d ");
  return compact;
}

export default function OperationsTimelineChart({ runs }) {
  const [timeRange, setTimeRange] = React.useState("7d");
  const [hoveredRun, setHoveredRun] = React.useState(null);

  const filteredRuns = React.useMemo(() => {
    if (timeRange === "24h") {
      return runs.filter((run) => !run.timestamp.startsWith("2 days ago"));
    }
    if (timeRange === "5r") {
      return runs.slice(0, 5);
    }
    return runs;
  }, [runs, timeRange]);

  const width = 760;
  const height = 250;
  const latencyMax = Math.max(...filteredRuns.map((run) => run.duration), 4.5);
  const tokenMax = Math.max(...filteredRuns.map((run) => run.tokens), 2200);

  const latencyLine = buildLinePath(filteredRuns, width, height, (run) => run.duration, latencyMax);
  const tokenLine = buildLinePath(filteredRuns, width, height, (run) => run.tokens, tokenMax);
  const latencyArea = buildAreaPath(filteredRuns, width, height, (run) => run.duration, latencyMax);
  const tokenArea = buildAreaPath(filteredRuns, width, height, (run) => run.tokens, tokenMax);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-border dark:bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 dark:border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">Operations Timeline</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Showing latency peaks, token surges, and failure moments across recent runs.
          </p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px] rounded-lg bg-card dark:bg-background" aria-label="Select timeline range">
            <SelectValue placeholder="Last 7 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            <SelectItem value="24h" className="rounded-lg">Last 24 hours</SelectItem>
            <SelectItem value="5r" className="rounded-lg">Last 5 runs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="px-3 pt-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground dark:text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Latency</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted" /> Tokens</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" /> Failure</span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
              <defs>
                <linearGradient id="ops-latency-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity="0.28" />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id="ops-token-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-chart-4)" stopOpacity="0.22" />
                  <stop offset="95%" stopColor="var(--chart-chart-4)" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = height - ratio * (height - 28) - 14;
                return (
                  <line
                    key={ratio}
                    x1="0"
                    x2={width}
                    y1={y}
                    y2={y}
                    stroke="rgba(148,163,184,0.14)"
                    strokeDasharray="4 6"
                  />
                );
              })}

              <path d={tokenArea} fill="url(#ops-token-fill)" />
              <path d={latencyArea} fill="url(#ops-latency-fill)" />
              <path d={tokenLine} fill="none" stroke="var(--chart-chart-4)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
              <path d={latencyLine} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {filteredRuns.map((run, index) => {
                const x = filteredRuns.length === 1 ? width / 2 : (index / (filteredRuns.length - 1)) * width;
                const latencyY = height - (run.duration / latencyMax) * (height - 28) - 14;
                const tokenY = height - (run.tokens / tokenMax) * (height - 28) - 14;
                const isFailure = run.status === "Failed";
                const isHovered = hoveredRun?.id === run.id;

                return (
                  <g
                    key={run.id}
                    onMouseEnter={() => setHoveredRun(run)}
                    onMouseLeave={() => setHoveredRun((current) => (current?.id === run.id ? null : current))}
                  >
                    <line x1={x} x2={x} y1="10" y2={height - 30} stroke={isHovered ? "rgba(37,99,235,0.18)" : "rgba(148,163,184,0.05)"} />

                    <circle cx={x} cy={tokenY} r={isHovered ? "5" : "4"} fill="var(--chart-chart-4)" opacity="0.9" />
                    <circle cx={x} cy={latencyY} r={isFailure ? (isHovered ? "6.5" : "5.5") : isHovered ? "5.5" : "4.5"} fill={isFailure ? "var(--destructive)" : "var(--primary)"} />

                    {isFailure && (
                      <g transform={`translate(${x - 7}, ${latencyY - 28})`}>
                        <circle cx="7" cy="7" r="7" fill="var(--destructive)/10" />
                        <foreignObject x="1" y="1" width="12" height="12">
                          <div className="flex h-full w-full items-center justify-center text-destructive">
                            <AlertTriangle size={12} />
                          </div>
                        </foreignObject>
                      </g>
                    )}

                    <text x={x} y={height - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                      {formatTick(run.timestamp)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="border-t border-border px-1 py-3 dark:border-border">
          {hoveredRun ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold text-foreground dark:text-foreground">{hoveredRun.id}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${hoveredRun.status === "Failed" ? "bg-destructive/10 text-destructive dark:bg-card dark:text-destructive" : "bg-primary/10 text-primary dark:bg-background dark:text-primary"}`}>
                  {hoveredRun.status}
                </span>
                <span className="text-muted-foreground dark:text-muted-foreground">{hoveredRun.timestamp}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground dark:text-muted-foreground">
                <span>Latency: <span className="font-semibold text-foreground dark:text-foreground">{hoveredRun.duration}s</span></span>
                <span>Tokens: <span className="font-semibold text-foreground dark:text-foreground">{hoveredRun.tokens.toLocaleString()}</span></span>
                <span>{hoveredRun.errorType || "Healthy execution"}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">Hover over a point to inspect a specific run.</p>
          )}
        </div>
      </div>
    </div>
  );
}
