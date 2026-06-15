import { Cloud, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getFileSourceLabel, isCloudFile, isLocalFile } from "@/lib/fileSyncStatus";
import { cn } from "@/lib/utils";

export function FileSourceBadge({ file, className, size = "default" }) {
  const isCloud = isCloudFile(file);
  const isLocal = isLocalFile(file);
  const label = getFileSourceLabel(file);
  const compact = size === "sm";

  return (
    <Badge
      variant="outline"
      className={cn(compact ? "text-[10px]" : "text-[11px]", className)}
    >
      {isCloud ? (
        <Cloud data-icon="inline-start" aria-hidden />
      ) : (
        <HardDrive data-icon="inline-start" aria-hidden />
      )}
      {isLocal ? "Local" : label}
    </Badge>
  );
}
