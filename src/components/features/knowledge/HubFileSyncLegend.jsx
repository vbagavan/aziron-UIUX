import { AlertCircle, CheckCircle2, Link2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function HubFileSyncLegend({ className, compact = false }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground",
        compact ? "text-xs" : "border-t border-border px-4 py-2 text-xs",
        className,
      )}
      role="note"
      aria-label="File status legend"
    >
      <span className="flex items-center gap-1.5">
        <Link2 className={compact ? "text-primary" : "text-primary"} aria-hidden />
        Cloud link — click to save to knowledge base
      </span>
      <span className="flex items-center gap-1.5">
        <Loader2 className="animate-spin" aria-hidden />
        Saving…
      </span>
      <span className="flex items-center gap-1.5">
        <CheckCircle2 className="text-success" aria-hidden />
        In knowledge base
      </span>
      <span className="flex items-center gap-1.5">
        <AlertCircle className="text-destructive" aria-hidden />
        Failed — click to retry
      </span>
    </div>
  );
}
