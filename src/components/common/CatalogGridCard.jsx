import { cn } from "@/lib/utils";

/**
 * Interactive catalog tile (Agents, Flows, Marketplace) — shadcn surface + a11y.
 */
export function CatalogGridCard({
  children,
  className,
  onClick,
  onKeyDown,
  ariaLabel,
  selected = false,
  topAccent,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
    onKeyDown?.(e);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex h-full min-h-[10.25rem] cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:shadow-elevation-md",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected && "ring-2 ring-primary/20 shadow-md",
        className,
      )}
    >
      {topAccent}
      {children}
    </div>
  );
}
