import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline marker for surfaces that render simulated/demo metrics, so they are
 * never read as real analytics. Prototype telemetry is synthesized, not measured.
 */
export function SampleDataNote({ className, children }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-2.5 py-1 text-[11px] text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      <FlaskConical className="size-3 shrink-0" />
      {children ?? "Sample data — these metrics are simulated for preview, not measured."}
    </div>
  );
}

export function SampleDataBadge({ className, label = "Sample" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-px text-[10px] font-medium text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      <FlaskConical className="size-2.5" />
      {label}
    </span>
  );
}
