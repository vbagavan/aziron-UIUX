import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Unified layout for file, database, and API detail views.
 */
export function SourceDetailShell({
  title,
  headerBadges,
  onClose,
  closeLabel = "Close",
  center,
  rightPanel,
  mobilePanelOpen,
  onMobilePanelOpenChange,
  mobilePanelTitle = "Source assistant",
  mobilePanelTabs = [],
  panelTab,
  onOpenMobilePanel,
  className,
}) {
  return (
    <div className={cn("flex h-full w-full flex-col bg-background", className)}>
      <header className="shrink-0 border-b border-border bg-card/50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
            {headerBadges}
          </div>
          <div className="flex items-center gap-1">
            {rightPanel ? (
              <button
                type="button"
                onClick={() => onOpenMobilePanel?.(panelTab)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                title={`Open ${mobilePanelTitle.toLowerCase()}`}
                aria-label={`Open ${mobilePanelTitle.toLowerCase()}`}
              >
                <MessageSquare className="size-4" />
              </button>
            ) : null}
            {onClose ? (
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                {closeLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{center}</div>
        {rightPanel ? (
          <div className="hidden w-64 shrink-0 border-l border-border bg-muted/10 lg:flex lg:flex-col xl:w-72">
            {rightPanel}
          </div>
        ) : null}
      </div>

      {mobilePanelTabs.length > 0 ? (
        <div className="flex shrink-0 items-center gap-1 border-t border-border bg-background px-2 py-2 lg:hidden">
          {mobilePanelTabs.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => onOpenMobilePanel?.(id)}
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                panelTab === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label}
              {count != null ? (
                <span className="ml-0.5 tabular-nums text-[10px] opacity-80">({count})</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {rightPanel ? (
        <Sheet open={mobilePanelOpen} onOpenChange={onMobilePanelOpenChange}>
          <SheetContent side="bottom" className="h-[min(88vh,720px)] gap-0 p-0">
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
              <SheetTitle className="text-sm">{mobilePanelTitle}</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-hidden">{rightPanel}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
