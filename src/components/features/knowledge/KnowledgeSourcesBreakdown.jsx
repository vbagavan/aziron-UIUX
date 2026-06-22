import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Cloud,
  Database,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { countFileStatusMetrics } from "@/lib/fileSyncStatus";
import { resolveSourceCategory } from "@/lib/sourceCategories";
import { isCloudFile, isLocalFile } from "@/lib/fileSyncStatus";

function BreakdownBar({ label, icon: Icon, count, total, variant = "default" }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-2.5 flex items-center gap-2.5 last:mb-0">
      <span className="flex min-w-[86px] items-center gap-1.5 text-[13px] font-medium">
        {Icon ? <Icon className="size-3.5 text-muted-foreground" aria-hidden /> : null}
        {label}
      </span>
      <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            variant === "ok" && "bg-emerald-500",
            variant === "warn" && "bg-amber-500",
            variant === "err" && "bg-destructive",
            variant === "default" && "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[18px] text-right text-[12.5px] font-semibold tabular-nums text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

export function KnowledgeSourcesBreakdown({
  docs = [],
  activeStatusFilter,
  onFilterStatus,
  onClearStatusFilter,
  className,
  open: openProp,
  onOpenChange,
  mode = "full",
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const metrics = countFileStatusMetrics(docs);
  const ready = metrics.ready + metrics.synced;
  const attention =
    metrics.failed +
    metrics.warning +
    metrics.outOfSync +
    metrics.processing +
    metrics.cloudReferences +
    metrics.syncing;

  const total = docs.length || 1;
  const filesCount = docs.filter((d) => resolveSourceCategory(d) === "files").length;
  const dbsCount = docs.filter((d) => resolveSourceCategory(d) === "dbs").length;
  const apisCount = docs.filter((d) => resolveSourceCategory(d) === "apis").length;
  const localCount = docs.filter((d) => isLocalFile(d)).length;
  const cloudCount = docs.filter((d) => isCloudFile(d)).length;

  if (docs.length === 0) return null;

  if (mode === "panel") {
    if (!open) return null;
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-7 rounded-xl border border-border bg-card p-5 md:grid-cols-3",
          className,
        )}
      >
        <div>
          <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            By type
          </h4>
          <BreakdownBar label="Files" icon={BookOpen} count={filesCount} total={total} />
          <BreakdownBar label="Database" icon={Database} count={dbsCount} total={total} />
          <BreakdownBar label="Others" icon={MoreHorizontal} count={apisCount} total={total} />
        </div>
        <div>
          <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            By origin
          </h4>
          <BreakdownBar label="Local" icon={Download} count={localCount} total={total} />
          <BreakdownBar label="Cloud" icon={Cloud} count={cloudCount} total={total} />
        </div>
        <div>
          <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            By status
          </h4>
          <BreakdownBar label="Ready" count={ready} total={total} variant="ok" />
          <BreakdownBar label="Warning" count={metrics.warning} total={total} variant="warn" />
          <BreakdownBar label="Failed" count={metrics.failed} total={total} variant="err" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("shrink-0", className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            if (activeStatusFilter) onClearStatusFilter?.();
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors",
            activeStatusFilter
              ? "bg-primary/10 text-primary ring-2 ring-primary/30"
              : "bg-primary/10 text-primary hover:bg-primary/15",
          )}
        >
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Ready: {ready}
        </button>
        {attention > 0 && (
          <button
            type="button"
            onClick={() => onFilterStatus?.("attention")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors",
              activeStatusFilter === "attention" || activeStatusFilter === "processing" || activeStatusFilter === "failed" || activeStatusFilter === "warning"
                ? "bg-amber-500/20 text-amber-800 ring-2 ring-amber-500/30 dark:text-amber-200"
                : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            <AlertTriangle className="size-3.5" aria-hidden />
            Needs attention: {attention}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex min-h-[24px] items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {open ? "Hide breakdown" : "Show breakdown"}
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </div>

      {mode === "full" && open && (
        <div
          className="mt-3.5 grid grid-cols-1 gap-7 rounded-xl border border-border bg-card p-5 md:grid-cols-3"
        >
          <div>
            <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              By type
            </h4>
            <BreakdownBar label="Files" icon={BookOpen} count={filesCount} total={total} />
            <BreakdownBar label="Database" icon={Database} count={dbsCount} total={total} />
            <BreakdownBar label="Others" icon={MoreHorizontal} count={apisCount} total={total} />
          </div>
          <div>
            <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              By origin
            </h4>
            <BreakdownBar label="Local" icon={Download} count={localCount} total={total} />
            <BreakdownBar label="Cloud" icon={Cloud} count={cloudCount} total={total} />
          </div>
          <div>
            <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              By status
            </h4>
            <BreakdownBar label="Ready" count={ready} total={total} variant="ok" />
            <BreakdownBar label="Warning" count={metrics.warning} total={total} variant="warn" />
            <BreakdownBar label="Failed" count={metrics.failed} total={total} variant="err" />
          </div>
        </div>
      )}
    </div>
  );
}
