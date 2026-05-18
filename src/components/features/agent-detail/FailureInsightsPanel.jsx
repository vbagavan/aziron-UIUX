import { AlertTriangle, RotateCcw, TerminalSquare, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function FailureInsightsPanel({ failures, onSelectRun }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-card px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-border dark:bg-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-destructive dark:text-destructive">Failure Insights</h3>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
            {failures.length > 0 ? "Latest failures with logs and tool traces one click away." : "No failed runs in the selected range."}
          </p>
        </div>
        <div className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive dark:bg-card dark:text-destructive">
          {failures.length} failed
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {failures.map((run) => (
          <div key={run.id} className="rounded-2xl border border-border bg-muted px-4 py-3 dark:border-border dark:bg-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-muted p-2 text-destructive dark:bg-card dark:text-destructive">
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground dark:text-foreground">{run.id}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-destructive dark:bg-card dark:text-destructive">{run.errorType}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-muted-foreground">{run.errorMessage}</p>
                  <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">{run.timestamp}</p>

                  <details className="mt-3 rounded-xl border border-destructive/30 bg-card px-3 py-2 dark:border-border dark:bg-background">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground dark:text-muted-foreground">Logs preview and tool execution</summary>
                    <div className="mt-3 space-y-3">
                      <pre className="overflow-x-auto rounded-xl bg-muted px-3 py-2 text-[11px] leading-5 text-foreground">{run.logs.join("\n")}</pre>
                      <div className="flex flex-col gap-2">
                        {run.tools.map((tool) => (
                          <div key={tool.name} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs dark:border-border">
                            <span className="font-medium text-foreground dark:text-foreground">{tool.name}</span>
                            <span className={tool.status === "failed" ? "text-destructive dark:text-destructive" : "text-info dark:text-info"}>{tool.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onSelectRun(run)}>
                  <RotateCcw size={14} />
                  Retry run
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onSelectRun(run)}>
                  <TerminalSquare size={14} />
                  View logs
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onSelectRun(run)}>
                  <Zap size={14} />
                  Replay with debug
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
