import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cog,
  HardDrive,
  Link2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { countFileStatusMetrics } from "@/lib/fileSyncStatus";
import { cn } from "@/lib/utils";

function MetricPill({ icon: Icon, label, value, variant = "secondary", statusKey, activeFilter, onFilter }) {
  if (!value) return null;
  const isActive = activeFilter === statusKey;
  const isClickable = !!onFilter && !!statusKey;
  const pillVariant = isActive ? "default" : variant;

  if (isClickable) {
    return (
      <Badge
        variant={pillVariant}
        className="cursor-pointer"
        render={
          <button
            type="button"
            onClick={() => onFilter(isActive ? null : statusKey)}
            aria-pressed={isActive}
          />
        }
      >
        <Icon data-icon="inline-start" aria-hidden />
        {label}: {value}
      </Badge>
    );
  }

  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}: {value}
    </Badge>
  );
}

function StatusBreakdownPills({ metrics: m, activeFilter, onFilter, excludeKeys = [] }) {
  const skip = (key) => excludeKeys.includes(key);
  return (
    <>
      {!skip("local") ? (
        <MetricPill icon={HardDrive} label="Local" value={m.local} variant="secondary" statusKey="local" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
      {!skip("cloud-reference") ? (
        <MetricPill icon={Link2} label="Cloud references" value={m.cloudReferences} variant="outline" statusKey="cloud-reference" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
      {!skip("synced") ? (
        <MetricPill icon={CheckCircle2} label="Synced" value={m.synced} variant="default" statusKey="synced" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
      {!skip("ready") ? (
        <MetricPill icon={CheckCircle2} label="Ready" value={m.ready} variant="default" statusKey="ready" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
      {!skip("processing") ? (
        <MetricPill icon={Cog} label="Processing" value={m.processing} variant="secondary" statusKey="processing" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
      {!skip("sync-failed") ? (
        <MetricPill icon={AlertCircle} label="Failed" value={m.failed} variant="destructive" statusKey="sync-failed" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
      {!skip("warning") ? (
        <MetricPill icon={AlertTriangle} label="Attention" value={m.warning} variant="destructive" statusKey="warning" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
      {!skip("out-of-sync") ? (
        <MetricPill icon={RefreshCw} label="Out of sync" value={m.outOfSync} variant="outline" statusKey="out-of-sync" activeFilter={activeFilter} onFilter={onFilter} />
      ) : null}
    </>
  );
}

export function FileStatusSummaryBar({
  files = [],
  title = "Files",
  includeDemoStatuses = false,
  activeFilter = null,
  onFilter,
  compact = false,
  hideTotalCount = false,
  excludeSourceMetrics = false,
  hideWhenHealthy = false,
  className,
}) {
  const [expanded, setExpanded] = useState(false);
  const m = countFileStatusMetrics(files, { includeDemoStatuses });
  if (m.total === 0) return null;

  const attentionCount = m.failed + m.warning + m.outOfSync + m.processing;

  if (hideWhenHealthy && attentionCount === 0 && !activeFilter) return null;

  const compactBreakdownExclude = ["ready"];
  if (excludeSourceMetrics) {
    compactBreakdownExclude.push("local", "cloud-reference");
  }

  if (!compact) {
    return (
      <Card className={cn("gap-0 py-0 shadow-sm", className)}>
        <CardHeader className="border-b-0 px-4 py-3 pb-0">
          <CardTitle className="text-sm font-medium">
            {title} ({m.total})
            {activeFilter && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                — filtered ·{" "}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="inline h-auto p-0 text-xs"
                  onClick={() => onFilter?.(null)}
                >
                  clear
                </Button>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5 px-4 pb-3 pt-2">
          <StatusBreakdownPills metrics={m} activeFilter={activeFilter} onFilter={onFilter} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className={cn("gap-0 py-0 shadow-sm", className)}>
        <CardContent className="flex flex-col gap-2 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!hideTotalCount ? (
                <span className="text-sm font-medium text-foreground">
                  {title} · {m.total}
                </span>
              ) : null}
              <MetricPill icon={CheckCircle2} label="Ready" value={m.ready} variant="default" statusKey="ready" activeFilter={activeFilter} onFilter={onFilter} />
              {attentionCount > 0 ? (
                <Badge variant="destructive">
                  <AlertTriangle data-icon="inline-start" aria-hidden />
                  Needs attention: {attentionCount}
                </Badge>
              ) : null}
              {!excludeSourceMetrics ? (
                <MetricPill icon={Link2} label="Cloud" value={m.cloudReferences} variant="outline" statusKey="cloud-reference" activeFilter={activeFilter} onFilter={onFilter} />
              ) : null}
              {activeFilter ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-xs"
                  onClick={() => onFilter?.(null)}
                >
                  Clear status filter
                </Button>
              ) : null}
            </div>
            <CollapsibleTrigger
              render={
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" />
              }
            >
              {expanded ? "Hide breakdown" : "Show breakdown"}
              {expanded ? <ChevronUp data-icon="inline-end" aria-hidden /> : <ChevronDown data-icon="inline-end" aria-hidden />}
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="flex flex-wrap gap-1.5">
            <StatusBreakdownPills
              metrics={m}
              activeFilter={activeFilter}
              onFilter={onFilter}
              excludeKeys={compactBreakdownExclude}
            />
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
