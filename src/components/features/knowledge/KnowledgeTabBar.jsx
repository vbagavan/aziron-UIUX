import { useLocation, useNavigate } from "react-router-dom";
import { Layers, Files } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Knowledge Hubs", icon: Layers, path: "/knowledge" },
  { label: "Documents", icon: Files, path: "/documents" },
];

/**
 * Shared tab bar rendered at the top of both the Knowledge Hubs and Documents views.
 * Clicking a tab navigates between /knowledge and /documents while keeping a single
 * "Knowledge" sidebar item active for both routes.
 */
export function KnowledgeTabBar({ className }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isDocuments = location.pathname.startsWith("/documents");

  return (
    <div
      role="tablist"
      aria-label="Knowledge section"
      className={cn("flex shrink-0 border-b border-border bg-background px-6", className)}
    >
      {TABS.map((tab) => {
        const active = tab.path === "/documents" ? isDocuments : !isDocuments;
        return (
          <button
            key={tab.label}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => navigate(tab.path)}
            className={cn(
              "mr-6 flex items-center gap-1.5 border-b-[3px] px-0.5 pb-2.5 pt-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-4 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
