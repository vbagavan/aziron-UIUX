import { Bot, FileText, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { cn } from "@/lib/utils";

const RELATIONSHIP_SECTIONS = [
  { key: "documents", label: KNOWLEDGE_TERMS.hubSourcesTab, icon: FileText, route: null },
  { key: "agents", label: "Agents", icon: Bot, route: "/agents" },
  { key: "workflows", label: "Workflows", icon: GitBranch, route: "/flows" },
];

function handleRelationshipItemClick(key, item, { onNavigateDocuments, navigate }) {
  if (key === "documents") {
    onNavigateDocuments?.();
    return;
  }
  if (key === "agents") {
    navigate("/agents", { state: { highlightAgentId: item.id } });
    return;
  }
  if (key === "workflows") {
    navigate("/flows");
  }
}

function isRelationshipItemClickable(key) {
  return key === "documents" || key === "agents" || key === "workflows";
}

export function HubControlCenterRelationships({ relationships, onNavigateDocuments, className, hideHeading = false }) {
  const navigate = useNavigate();

  return (
    <aside className={cn("flex flex-col gap-4", className)}>
      {!hideHeading ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Relationships
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            How this hub connects across the platform
          </p>
        </div>
      ) : null}

      {RELATIONSHIP_SECTIONS.map(({ key, label, icon, route }) => {
        const Icon = icon;
        const items = relationships?.[key] ?? [];
        if (items.length === 0) return null;
        const clickable = isRelationshipItemClickable(key);

        return (
          <div key={key} className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {items.length}
              </Badge>
            </div>
            <ul className="flex flex-col gap-1">
              {items.slice(0, 4).map((item) => (
                <li key={item.id}>
                  {clickable ? (
                    <button
                      type="button"
                      className="w-full truncate rounded-md px-2 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      onClick={() =>
                        handleRelationshipItemClick(key, item, { onNavigateDocuments, navigate })
                      }
                    >
                      {item.name}
                    </button>
                  ) : (
                    <span className="block truncate px-2 py-1 text-[11px] text-muted-foreground">
                      {item.name}
                    </span>
                  )}
                </li>
              ))}
              {items.length > 4 ? (
                <li>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-[10px] font-medium text-primary transition-colors hover:bg-muted/50 hover:underline"
                    onClick={() =>
                      key === "documents" ? onNavigateDocuments?.() : navigate(route)
                    }
                  >
                    +{items.length - 4} more
                  </button>
                </li>
              ) : null}
            </ul>
            {route ? (
              <button
                type="button"
                className="mt-2 text-[10px] font-medium text-primary hover:underline"
                onClick={() => navigate(route)}
              >
                View all {label.toLowerCase()}
              </button>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}
