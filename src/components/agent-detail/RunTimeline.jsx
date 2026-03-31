import { AlertTriangle, CircleCheck, Clock3, Sparkles, Zap } from "lucide-react";

const STATUS_META = {
  Success: {
    Icon: CircleCheck,
    wrap: "border-[#dcfce7] bg-[#f0fdf4] text-[#15803d] dark:border-[#14532d] dark:bg-[#052e16] dark:text-[#86efac]",
  },
  Failed: {
    Icon: AlertTriangle,
    wrap: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fca5a5]",
  },
};

export default function RunTimeline({ runs, onSelectRun }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-[#334155] dark:bg-[#111827]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#94a3b8] dark:text-[#64748b]">Run Timeline</h3>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">Interactive run feed with quick diagnostics.</p>
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
              className="group relative rounded-2xl border border-transparent px-3 py-3 text-left transition-all hover:border-[#dbe4f0] hover:bg-[#f8fafc] dark:hover:border-[#334155] dark:hover:bg-[#0f172a]"
            >
              {index !== runs.length - 1 && <span className="absolute left-[18px] top-12 h-[calc(100%-28px)] w-px bg-[#e2e8f0] dark:bg-[#334155]" />}

              <div className="flex gap-3">
                <div className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border ${meta.wrap}`}>
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">{run.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.wrap}`}>{run.status}</span>
                    </div>
                    <span className="text-xs text-[#94a3b8] dark:text-[#64748b]">{run.timestamp}</span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-[#cbd5e1]">{run.preview}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#64748b] dark:text-[#94a3b8]">
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
