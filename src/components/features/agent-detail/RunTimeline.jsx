import { AlertTriangle, CircleCheck, Clock3, Sparkles, Zap } from "lucide-react";

const STATUS_META = {
  Success: {
    Icon: CircleCheck,
    wrap: "border-border bg-success/10 text-success dark:border-border dark:bg-card dark:text-success",
  },
  Failed: {
    Icon: AlertTriangle,
    wrap: "border-destructive/30 bg-destructive/10 text-destructive dark:border-border dark:bg-card dark:text-destructive",
  },
};

export default function RunTimeline({ runs, onSelectRun }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-border dark:bg-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">Run Timeline</h3>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">Interactive run feed with quick diagnostics.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {runs.map((run, index) => {
          const meta = STATUS_META[run.status] || STATUS_META.Success;
          const Icon = meta.Icon;

          return (
            <button
              key={run.id}
              onClick={() => onSelectRun(run)}
              className="group relative rounded-2xl border border-transparent px-3 py-3 text-left transition-all hover:border-border hover:bg-muted dark:hover:border-border dark:hover:bg-muted"
            >
              {index !== runs.length - 1 && <span className="absolute left-[18px] top-12 h-[calc(100%-28px)] w-px bg-border dark:bg-border" />}

              <div className="flex gap-3">
                <div className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border ${meta.wrap}`}>
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground dark:text-foreground">{run.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.wrap}`}>{run.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">{run.timestamp}</span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-muted-foreground">{run.preview}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {run.duration}s</span>
                    <span className="inline-flex items-center gap-1.5"><Zap size={13} /> {run.tokens.toLocaleString()} tokens</span>
                    <span className="inline-flex items-center gap-1.5"><Sparkles size={13} /> {run.errorType || "Normal execution"}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
