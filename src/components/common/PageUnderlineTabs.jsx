import { cn } from "@/lib/utils";

const TAB_BUTTON_CLASS =
  "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Page-level underline tabs — matches ApiDetailView, DatabaseDetailView, ConnectionsPanel.
 * Uses plain buttons so active tabs stay flat (no shadcn pill background).
 */
export function panelIdForTab(panelIdPrefix, tabId) {
  return panelIdPrefix ? `${panelIdPrefix}-panel-${tabId}` : undefined;
}

export function PageUnderlineTabs({
  value,
  onValueChange,
  tabs,
  ariaLabel,
  panelIdPrefix,
  className,
  listClassName,
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-end overflow-x-auto border-b border-border bg-background px-6",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn("flex h-10 w-max min-w-0 items-stretch", listClassName)}
      >
        {tabs.map((tab) => {
          const active = value === tab.id;
          const Icon = tab.icon;
          const panelId = panelIdForTab(panelIdPrefix, tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={panelId ? `${panelIdPrefix}-tab-${tab.id}` : undefined}
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => onValueChange?.(tab.id)}
              className={cn(
                TAB_BUTTON_CLASS,
                active
                  ? "-mb-px border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
