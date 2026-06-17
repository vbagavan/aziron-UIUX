import { Badge } from "@/components/ui/badge";
import { SourceProviderIcon } from "@/components/features/knowledge/SourceProviderIcon";
import { getSourceBadgeLabel } from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";

/**
 * Category-aware source badge — Files (local/cloud), DBs, or APIs.
 */
export function SourceBadge({ record, className, size = "default" }) {
  const label = getSourceBadgeLabel(record);
  const compact = size === "sm";

  return (
    <Badge
      variant="outline"
      className={cn(compact ? "text-[10px]" : "text-[11px]", className)}
    >
      <SourceProviderIcon record={record} size="xs" />
      {label}
    </Badge>
  );
}
