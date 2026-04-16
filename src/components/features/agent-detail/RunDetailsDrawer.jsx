import { useState } from "react";
import { Clock3, ListTree, ScrollText, Wrench } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TABS = [
  { id: "summary", label: "Summary", icon: ListTree },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "tools", label: "Tool Execution", icon: Wrench },
];

export default function RunDetailsDrawer({ run, open, onOpenChange }) {
  const [tab, setTab] = useState("summary");

  if (!run) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[92vw] max-w-[520px] border-l border-[#e2e8f0] bg-white p-0 dark:border-[#334155] dark:bg-[#111827]">
        <SheetHeader className="border-b border-[#e2e8f0] px-5 py-4 dark:border-[#334155]">
          <SheetTitle className="font-mono text-[#0f172a] dark:text-[#f8fafc]">{run.id}</SheetTitle>
          <SheetDescription className="mt-1 flex items-center gap-2 text-xs">
            <Clock3 size={13} />
            {run.timestamp}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-1 border-b border-[#e2e8f0] px-3 py-2 dark:border-[#334155]">
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-[#0f172a] text-white dark:bg-[#f8fafc] dark:text-[#0f172a]" : "text-[#64748b] hover:bg-[#f8fafc] dark:text-[#94a3b8] dark:hover:bg-[#0f172a]"}`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "summary" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 dark:border-[#334155] dark:bg-[#0f172a]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8] dark:text-[#64748b]">Outcome</p>
                <p className="mt-2 text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">{run.status}</p>
                <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-[#cbd5e1]">{run.preview}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Duration" value={`${run.duration}s`} />
                <Stat label="Tokens" value={run.tokens.toLocaleString()} />
                <Stat label="Latency band" value={run.duration > 3 ? "Warning" : "Healthy"} />
                <Stat label="Anomaly" value={run.isAnomaly ? "Yes" : "No"} />
              </div>
            </div>
          )}

          {tab === "logs" && (
            <pre className="overflow-x-auto rounded-2xl bg-[#020617] px-4 py-4 text-[11px] leading-5 text-[#dbeafe]">
              {run.logs.join("\n")}
            </pre>
          )}

          {tab === "tools" && (
            <div className="space-y-3">
              {run.tools.map((tool) => (
                <div key={tool.name} className="rounded-2xl border border-[#e2e8f0] px-4 py-3 dark:border-[#334155]">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#0f172a] dark:text-[#f8fafc]">{tool.name}</p>
                    <span className={tool.status === "failed" ? "text-sm font-medium text-[#dc2626] dark:text-[#fca5a5]" : "text-sm font-medium text-[#0369a1] dark:text-[#7dd3fc]"}>{tool.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#64748b] dark:text-[#94a3b8]">{tool.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] px-3 py-3 dark:border-[#334155]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8] dark:text-[#64748b]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">{value}</p>
    </div>
  );
}
