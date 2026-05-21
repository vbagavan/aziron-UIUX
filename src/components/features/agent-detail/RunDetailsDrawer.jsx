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
      <SheetContent side="right" className="w-[92vw] max-w-[520px] border-l border-border bg-card p-0 dark:border-border dark:bg-card">
        <SheetHeader className="border-b border-border px-5 py-4 dark:border-border">
          <SheetTitle className="font-mono text-foreground dark:text-foreground">{run.id}</SheetTitle>
          <SheetDescription className="mt-1 flex items-center gap-2 text-xs">
            <Clock3 size={13} />
            {run.timestamp}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-1 border-b border-border px-3 py-2 dark:border-border">
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
          {tab === "summary" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted px-4 py-4 dark:border-border dark:bg-background">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">Outcome</p>
                <p className="mt-2 text-lg font-semibold text-foreground dark:text-foreground">{run.status}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-muted-foreground">{run.preview}</p>
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
            <pre className="overflow-x-auto rounded-2xl bg-muted px-4 py-4 text-[11px] leading-5 text-foreground">
              {run.logs.join("\n")}
            </pre>
          )}

          {tab === "tools" && (
            <div className="space-y-3">
              {run.tools.map((tool) => (
                <div key={tool.name} className="rounded-2xl border border-border px-4 py-3 dark:border-border">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground dark:text-foreground">{tool.name}</p>
                    <span className={tool.status === "failed" ? "text-sm font-medium text-destructive dark:text-destructive" : "text-sm font-medium text-info dark:text-info"}>{tool.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">{tool.detail}</p>
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
    <div className="rounded-2xl border border-border px-3 py-3 dark:border-border">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground dark:text-foreground">{value}</p>
    </div>
  );
}
