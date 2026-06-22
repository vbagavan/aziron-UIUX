import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export const HUB_WORKSPACE_VIEWS = {
  sources: "sources",
  insights: "insights",
};

const TABS = [
  { id: HUB_WORKSPACE_VIEWS.sources, label: KNOWLEDGE_TERMS.hubSourcesTab },
  { id: HUB_WORKSPACE_VIEWS.insights, label: KNOWLEDGE_TERMS.insightsTab, icon: Sparkles },
];

export function KnowledgeHubViewTabs({ value, onChange, className }) {
  return (
    <div
      className={cn("flex items-center gap-0.5 border-b border-border pb-3", className)}
      role="tablist"
      aria-label="Hub workspace view"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-foreground font-semibold text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
