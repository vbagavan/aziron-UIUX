import { Globe, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PUBLISH_SCOPES } from "@/lib/agentPublishScope";

const SCOPE_OPTIONS = [
  {
    value: PUBLISH_SCOPES.ORG,
    icon: Users,
    label: "Organization",
    description: (orgName) =>
      `Anyone in ${orgName} can find and run this agent from the Agents page.`,
  },
  {
    value: PUBLISH_SCOPES.MARKETPLACE,
    icon: Globe,
    label: "Marketplace",
    description: () =>
      "All organizations can discover, fork, and run this agent from the Marketplace.",
    requiresPermission: "marketplace.publish",
    lockedHint: "Requires platform admin permission to list across organizations.",
  },
];

/**
 * Org vs multi-org publish scope selector for agent publish dialogs.
 */
export default function PublishScopePicker({
  value,
  onChange,
  orgName = "your organization",
  canPublishMarketplace = false,
  className,
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-xs font-medium text-foreground">Publish to</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SCOPE_OPTIONS.map(({ value: scopeValue, icon: Icon, label, description, lockedHint }) => {
          const isMarketplace = scopeValue === PUBLISH_SCOPES.MARKETPLACE;
          const disabled = isMarketplace && !canPublishMarketplace;
          const selected = value === scopeValue;

          return (
            <button
              key={scopeValue}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(scopeValue)}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/8 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-60 hover:bg-background hover:text-muted-foreground",
              )}
            >
              {disabled ? (
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={cn("font-semibold", selected && "text-foreground")}>{label}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {description(orgName)}
                </span>
                {disabled && lockedHint ? (
                  <span className="text-xs leading-relaxed text-warning">{lockedHint}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
