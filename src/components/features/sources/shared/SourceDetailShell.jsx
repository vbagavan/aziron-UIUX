import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useReaderHeader } from "@/context/ReaderHeaderContext";
import { cn } from "@/lib/utils";

/**
 * Unified layout for file, database, and API detail views.
 *
 * When a ReaderHeaderProvider is present (Knowledge), the header is portaled
 * into the global AppHeader for a single-bar focus reader. Otherwise it renders
 * its own header bar.
 */
export function SourceDetailShell({
  title,
  headerBadges,
  onClose,
  closeLabel = "Close",
  headerLeading,
  headerActions,
  headerOverlay,
  progress,
  leftRail,
  center,
  rightPanel,
  rightPanelClassName,
  mobilePanelOpen,
  onMobilePanelOpenChange,
  mobilePanelTitle = "Source assistant",
  mobilePanelTabs = [],
  panelTab,
  onOpenMobilePanel,
  className,
}) {
  const reader = useReaderHeader();
  const setActive = reader?.setActive;
  const slotEl = reader?.slotEl ?? null;

  // Take over the global header while this reader is mounted.
  useEffect(() => {
    if (!setActive) return undefined;
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  const mobilePanelButton = rightPanel ? (
    <button
      type="button"
      onClick={() => onOpenMobilePanel?.(panelTab)}
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      title={`Open ${mobilePanelTitle.toLowerCase()}`}
      aria-label={`Open ${mobilePanelTitle.toLowerCase()}`}
    >
      <MessageSquare className="size-4" />
    </button>
  ) : null;

  // Consistent close affordance across every source type: a trailing icon button.
  const closeButton = onClose ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClose}
      title={closeLabel}
      aria-label={closeLabel}
    >
      <X className="size-4" aria-hidden />
    </Button>
  ) : null;

  const leadingBlock = headerLeading ? (
    <div className="flex shrink-0 items-center gap-1">{headerLeading}</div>
  ) : null;

  const titleBlock = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <h1 className="truncate text-[14.5px] font-semibold tracking-tight">{title}</h1>
      {headerBadges}
    </div>
  );

  const actionsBlock = (
    <div className="flex shrink-0 items-center gap-0.5">
      {headerActions}
      {mobilePanelButton}
      {closeButton}
    </div>
  );

  const progressBar =
    typeof progress === "number" ? (
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary/75 to-primary transition-all duration-100"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    ) : null;

  // Merge mode: portal the header into the global AppHeader slot.
  const mergedHeader = slotEl
    ? createPortal(
        <>
          {leadingBlock}
          {titleBlock}
          {actionsBlock}
          {progressBar}
          {headerOverlay}
        </>,
        slotEl,
      )
    : null;

  // Standalone header (no ReaderHeaderProvider in the tree).
  const standaloneHeader = !reader ? (
    <header className="relative z-20 shrink-0 border-b border-border bg-card/50 px-3.5 py-0">
      <div className="flex h-14 items-center gap-2">
        {leadingBlock}
        {titleBlock}
        {actionsBlock}
      </div>
      {typeof progress === "number" ? (
        <div className="h-[3px] bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary/75 to-primary transition-all duration-100"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
      {headerOverlay}
    </header>
  ) : null;

  return (
    <div className={cn("flex h-full w-full flex-col bg-background", className)}>
      {mergedHeader}
      {standaloneHeader}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {leftRail}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{center}</div>
        {rightPanel ? (
          <div
            className={cn(
              "hidden shrink-0 border-l border-border bg-muted/10 lg:flex lg:flex-col",
              rightPanelClassName ?? "w-64 xl:w-72",
            )}
          >
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
