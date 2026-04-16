import { AlertTriangle, RotateCcw, TerminalSquare, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function FailureInsightsPanel({ failures, onSelectRun }) {
  return (
    <div className="rounded-2xl border border-[#fecaca] bg-white px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-[#7f1d1d] dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef4444] dark:text-[#fca5a5]">Failure Insights</h3>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">
            {failures.length > 0 ? "Latest failures with logs and tool traces one click away." : "No failed runs in the selected range."}
          </p>
        </div>
        <div className="rounded-full bg-[#fef2f2] px-3 py-1 text-xs font-medium text-[#b91c1c] dark:bg-[#450a0a] dark:text-[#fecaca]">
          {failures.length} failed
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {failures.map((run) => (
          <div key={run.id} className="rounded-2xl border border-[#fee2e2] bg-[#fff7f7] px-4 py-3 dark:border-[#4c1010] dark:bg-[#160909]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-[#fee2e2] p-2 text-[#dc2626] dark:bg-[#450a0a] dark:text-[#fca5a5]">
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">{run.id}</span>
                    <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] font-medium text-[#b91c1c] dark:bg-[#450a0a] dark:text-[#fecaca]">{run.errorType}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-[#cbd5e1]">{run.errorMessage}</p>
                  <p className="mt-2 text-xs text-[#94a3b8] dark:text-[#64748b]">{run.timestamp}</p>

                  <details className="mt-3 rounded-xl border border-[#fecaca] bg-white px-3 py-2 dark:border-[#4c1010] dark:bg-[#0f172a]">
                    <summary className="cursor-pointer text-xs font-medium text-[#64748b] dark:text-[#94a3b8]">Logs preview and tool execution</summary>
                    <div className="mt-3 space-y-3">
                      <pre className="overflow-x-auto rounded-xl bg-[#0f172a] px-3 py-2 text-[11px] leading-5 text-[#dbeafe]">{run.logs.join("\n")}</pre>
                      <div className="flex flex-col gap-2">
                        {run.tools.map((tool) => (
                          <div key={tool.name} className="flex items-center justify-between rounded-xl border border-[#e5e7eb] px-3 py-2 text-xs dark:border-[#334155]">
                            <span className="font-medium text-[#0f172a] dark:text-[#f8fafc]">{tool.name}</span>
                            <span className={tool.status === "failed" ? "text-[#dc2626] dark:text-[#fca5a5]" : "text-[#0369a1] dark:text-[#7dd3fc]"}>{tool.status}</span>
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
