import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cog,
  HardDrive,
  Link2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countFileStatusMetrics } from "@/lib/fileSyncStatus";
import { cn } from "@/lib/utils";

function MetricPill({ icon: Icon, label, value, variant = "secondary" }) {
  if (!value) return null;
  return (
    <Badge variant={variant} className="text-[11px]">
      <Icon data-icon="inline-start" aria-hidden />
      {label}: {value}
    </Badge>
  );
}

export function FileStatusSummaryBar({
  files = [],
  title = "Files",
  includeDemoStatuses = false,
  className,
}) {
  const m = countFileStatusMetrics(files, { includeDemoStatuses });
  if (m.total === 0) return null;

  return (
    <Card className={cn("gap-0 py-0 shadow-sm", className)}>
      <CardHeader className="border-b-0 px-4 py-3 pb-0">
        <CardTitle className="text-sm font-medium">
          {title} ({m.total})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5 px-4 pb-3 pt-2">
        <MetricPill icon={HardDrive} label="Local" value={m.local} variant="secondary" />
        <MetricPill icon={Link2} label="Cloud references" value={m.cloudReferences} variant="outline" />
        <MetricPill icon={CheckCircle2} label="Synced" value={m.synced} variant="default" />
        <MetricPill icon={CheckCircle2} label="Ready" value={m.ready} variant="default" />
        <MetricPill icon={Cog} label="Processing" value={m.processing} variant="secondary" />
        <MetricPill icon={AlertCircle} label="Failed" value={m.failed} variant="destructive" />
        <MetricPill icon={AlertTriangle} label="Attention" value={m.warning} variant="destructive" />
        <MetricPill icon={RefreshCw} label="Out of sync" value={m.outOfSync} variant="outline" />
      </CardContent>
    </Card>
  );
}
