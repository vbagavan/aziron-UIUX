import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cog,
  Link2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  canActivateFileSync,
  formatLastSyncedRelative,
  hubSyncStatusForFile,
  isCloudFile,
} from "@/lib/fileSyncStatus";
import { getSourceLifecycleMeta } from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";
import { HubFileSyncIcon } from "@/components/features/knowledge/HubFileSyncIcon";

function StatusIcon({ status, spinning }) {
  const className = cn("size-4 shrink-0", spinning && "animate-spin");
  switch (status) {
    case "cloud-reference":
      return <Link2 className={cn(className, "text-primary")} aria-hidden />;
    case "syncing":
      return <Loader2 className={cn(className, "text-muted-foreground")} aria-hidden />;
    case "synced":
      return <CheckCircle2 className={cn(className, "text-success")} aria-hidden />;
    case "sync-failed":
      return <AlertCircle className={cn(className, "text-destructive")} aria-hidden />;
    case "processing":
      return <Cog className={cn(className, "text-muted-foreground")} aria-hidden />;
    case "ready":
      return <CheckCircle2 className={cn(className, "text-success")} aria-hidden />;
    case "warning":
      return <AlertTriangle className={cn(className, "text-warning")} aria-hidden />;
    case "out-of-sync":
      return <RefreshCw className={cn(className, "text-warning")} aria-hidden />;
    default:
      return <CheckCircle2 className={cn(className, "text-muted-foreground")} aria-hidden />;
  }
}

function SyncStatusIcon({
  status,
  spinning,
  activate,
  iconStatus,
  name,
  message,
  onActivate,
}) {
  if (activate) {
    return (
      <HubFileSyncIcon
        status={iconStatus}
        fileName={name}
        canActivate
        onActivate={onActivate}
      />
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex shrink-0" aria-label={`${name}: ${message}`} />}>
        <StatusIcon status={status} spinning={spinning} />
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  );
}

export function FileSyncStatusIndicator({
  file,
  fileName,
  canActivate = false,
  onActivate,
  showDetail = true,
  showActions = false,
  compact = false,
  iconOnly = false,
  badgeOnly = false,
  includeDemoStatuses = false,
  className,
}) {
  const { status, label, message, badgeVariant } = getSourceLifecycleMeta(file, { includeDemoStatuses });
  const name = fileName ?? file?.name ?? "file";
  const lastSynced = formatLastSyncedRelative(file?.syncedAt);
  const activate = canActivate && canActivateFileSync(file, { includeDemoStatuses });
  const iconStatus = hubSyncStatusForFile(file, { includeDemoStatuses });
  const spinning = status === "syncing" || status === "processing";

  const detailLine = (() => {
    if (status === "sync-failed" && file?.syncError) return file.syncError;
    if (isCloudFile(file) && lastSynced && (status === "synced" || status === "ready")) {
      return `Last synced: ${lastSynced}`;
    }
    if (isCloudFile(file) && status === "cloud-reference") {
      return "Cloud metadata indexed · content not downloaded";
    }
    return message;
  })();

  if (compact) {
    const icon = (
      <SyncStatusIcon
        status={status}
        spinning={spinning}
        activate={activate}
        iconStatus={iconStatus}
        name={name}
        message={message}
        onActivate={onActivate}
      />
    );
    const badge = (
      <Badge variant={badgeVariant} className="text-[10px] font-medium">
        {label}
      </Badge>
    );

    if (iconOnly) {
      return <div className={cn("shrink-0", className)}>{icon}</div>;
    }
    if (badgeOnly) {
      return <div className={cn("flex items-center", className)}>{badge}</div>;
    }

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {icon}
        {badge}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-start gap-2.5", className)}>
      <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
        <SyncStatusIcon
          status={status}
          spinning={spinning}
          activate={activate}
          iconStatus={iconStatus}
          name={name}
          message={message}
          onActivate={onActivate}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badgeVariant} className="text-[10px] font-medium">
            {label}
          </Badge>
          {lastSynced && isCloudFile(file) && status !== "cloud-reference" && status !== "syncing" ? (
            <span className="text-[10px] text-muted-foreground">Last synced: {lastSynced}</span>
          ) : null}
        </div>
        {showDetail && detailLine ? (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{detailLine}</p>
        ) : null}
        {showActions && status === "sync-failed" ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activate && onActivate ? (
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onActivate}>
                Retry sync
              </Button>
            ) : null}
            {file?.syncError ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs">
                      View error details
                    </Button>
                  }
                />
                <TooltipContent className="max-w-xs">{file.syncError}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
