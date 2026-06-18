import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileSyncStatusIndicator } from "@/components/features/knowledge/FileSyncStatusIndicator";
import {
  getSourceLifecycleMeta,
  resolveSourceCategory,
} from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";

function CategoryLifecycleStatusIcon({ status, spinning, className }) {
  const iconClass = cn("size-4 shrink-0", spinning && "animate-spin", className);

  switch (status) {
    case "live":
    case "fetched":
      return <CheckCircle2 className={cn(iconClass, "text-success")} aria-hidden />;
    case "snapshot":
      return <Database className={cn(iconClass, "text-muted-foreground")} aria-hidden />;
    case "schema-drift":
    case "stale":
      return <AlertTriangle className={cn(iconClass, "text-warning")} aria-hidden />;
    case "fetching":
      return <Loader2 className={cn(iconClass, "text-muted-foreground")} aria-hidden />;
    case "error":
    case "fetch-error":
      return <AlertCircle className={cn(iconClass, "text-destructive")} aria-hidden />;
    default:
      return <Clock className={cn(iconClass, "text-muted-foreground")} aria-hidden />;
  }
}

/**
 * Category-aware status for list rows — files use sync UI; DB/API use lifecycle badges.
 */
export function SourceStatusIndicator({
  record,
  fileName,
  canActivate = false,
  onActivate,
  compact = true,
  iconOnly = false,
  includeDemoStatuses = false,
  className,
}) {
  const category = resolveSourceCategory(record);

  if (category === "files") {
    return (
      <FileSyncStatusIndicator
        file={record}
        fileName={fileName}
        canActivate={canActivate}
        onActivate={onActivate}
        compact={compact}
        iconOnly={iconOnly}
        includeDemoStatuses={includeDemoStatuses}
        className={className}
      />
    );
  }

  const { status, label, message, badgeVariant } = getSourceLifecycleMeta(record, {
    includeDemoStatuses,
  });
  const name = fileName ?? record?.name ?? "source";
  const spinning = status === "fetching";

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className={cn("inline-flex shrink-0", className)} aria-label={`${name}: ${label}`}>
              <CategoryLifecycleStatusIcon status={status} spinning={spinning} />
            </span>
          }
        />
        <TooltipContent>{message || label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant={badgeVariant} className={cn("text-[10px] font-medium", className)}>
            {label}
          </Badge>
        }
      />
      <TooltipContent>{message || label}</TooltipContent>
    </Tooltip>
  );
}
