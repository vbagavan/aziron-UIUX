import { Globe, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { VISIBILITY_BADGE } from "@/lib/designTokens";
import { cn } from "@/lib/utils";

/**
 * Public / private access pill — shared across Agents, Flows, and catalog grids.
 */
export function VisibilityBadge({ visibility, showIcon = true, className }) {
  const isPublic = visibility === "public";

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1 rounded-full px-2 py-0 text-xs font-semibold",
        isPublic ? VISIBILITY_BADGE.public : VISIBILITY_BADGE.private,
        className,
      )}
    >
      {showIcon ? (
        isPublic ? (
          <Globe className="size-3 shrink-0" aria-hidden />
        ) : (
          <Lock className="size-3 shrink-0" aria-hidden />
        )
      ) : (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", isPublic ? "bg-primary" : "bg-muted-foreground")}
          aria-hidden
        />
      )}
      {isPublic ? "Public" : "Private"}
    </Badge>
  );
}
