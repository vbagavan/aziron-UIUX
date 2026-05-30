import { Globe, Lock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getAgentPublishScope, PUBLISH_SCOPES } from "@/lib/agentPublishScope";
import { VISIBILITY_BADGE } from "@/lib/designTokens";
import { cn } from "@/lib/utils";

const SCOPE_BADGE = {
  [PUBLISH_SCOPES.ORG]: {
    label: "Organization",
    icon: Users,
    className: VISIBILITY_BADGE.public,
  },
  [PUBLISH_SCOPES.MARKETPLACE]: {
    label: "Marketplace",
    icon: Globe,
    className: "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
};

/**
 * Public / private access pill — shared across Agents, Flows, and catalog grids.
 * Agents may pass `publishScope` or an `agent` object for org vs marketplace labels.
 */
export function VisibilityBadge({ visibility, publishScope, agent, showIcon = true, className }) {
  const scope = publishScope ?? (agent ? getAgentPublishScope(agent) : null);
  const isAgentScope = scope === PUBLISH_SCOPES.ORG || scope === PUBLISH_SCOPES.MARKETPLACE;
  const isPublic = isAgentScope || visibility === "public";
  const scopeMeta = isAgentScope ? SCOPE_BADGE[scope] : null;
  const ScopeIcon = scopeMeta?.icon ?? (isPublic ? Globe : Lock);
  const label = scopeMeta?.label ?? (isPublic ? "Public" : "Private");

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1 rounded-full px-2 py-0 text-xs font-semibold",
        scopeMeta?.className ?? (isPublic ? VISIBILITY_BADGE.public : VISIBILITY_BADGE.private),
        className,
      )}
    >
      {showIcon ? (
        <ScopeIcon className="size-3 shrink-0" aria-hidden />
      ) : (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", isPublic ? "bg-primary" : "bg-muted-foreground")}
          aria-hidden
        />
      )}
      {label}
    </Badge>
  );
}
