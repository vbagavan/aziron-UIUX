import { FileText, Database, Zap, LayoutGrid } from "lucide-react";
import { CATEGORY_FILTER_OPTIONS } from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";

const TAB_ICONS = {
  all: LayoutGrid,
  files: FileText,
  dbs: Database,
  apis: Zap,
};

export function DocumentsCategoryTabBar({ value = "all", onChange, className }) {
  return (
    <div
      role="tablist"
      aria-label="Source category"
      className={cn(
        "flex shrink-0 items-center gap-1 border-b border-border bg-background px-6",
        className,
      )}
    >
      {CATEGORY_FILTER_OPTIONS.map((tab) => {
        const active = value === tab.id;
        const Icon = TAB_ICONS[tab.id] ?? LayoutGrid;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.id)}
            className={cn(
              "mr-4 flex items-center gap-1.5 border-b-[3px] px-0.5 pb-2.5 pt-2.5 text-sm font-medium transition-colors last:mr-0",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
