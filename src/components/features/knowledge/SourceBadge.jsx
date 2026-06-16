import { Cloud, Database, HardDrive, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getSourceBadgeLabel,
  resolveSourceCategory,
  resolveSourceKind,
} from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";

function CategoryIcon({ record, className }) {
  const category = resolveSourceCategory(record);
  if (category === "dbs") return <Database data-icon="inline-start" aria-hidden className={className} />;
  if (category === "apis") return <Zap data-icon="inline-start" aria-hidden className={className} />;
  const kind = resolveSourceKind(record);
  if (kind === "cloud-storage" || record?.source === "cloud") {
    return <Cloud data-icon="inline-start" aria-hidden className={className} />;
  }
  return <HardDrive data-icon="inline-start" aria-hidden className={className} />;
}

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
      <CategoryIcon record={record} />
      {label}
    </Badge>
  );
}
