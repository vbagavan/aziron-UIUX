import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const TAB_BUTTON_CLASS =
  "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

function TabCount({ count, active }) {
  if (count === undefined || count === null) return null;
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

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
  const tabRefs = useRef([]);

  const focusTabAt = useCallback(
    (index) => {
      const tab = tabs[index];
      if (!tab) return;
      onValueChange?.(tab.id);
      tabRefs.current[index]?.focus();
    },
    [onValueChange, tabs],
  );

  const handleKeyDown = useCallback(
    (event, index) => {
      if (!tabs.length) return;

      let nextIndex = index;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === "End") {
        event.preventDefault();
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      focusTabAt(nextIndex);
    },
    [focusTabAt, tabs.length],
  );

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
        {tabs.map((tab, index) => {
          const active = value === tab.id;
          const Icon = tab.icon;
          const panelId = panelIdForTab(panelIdPrefix, tab.id);
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={panelId ? `${panelIdPrefix}-tab-${tab.id}` : undefined}
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => onValueChange?.(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                TAB_BUTTON_CLASS,
                active
                  ? "-mb-px border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
              {tab.label}
              <TabCount count={tab.count} active={active} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
