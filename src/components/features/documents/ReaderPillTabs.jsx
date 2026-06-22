import { cn } from "@/lib/utils";

/**
 * Document reader tabs — segment pills (center) or underline (right panel).
 */
export function ReaderPillTabs({
  value,
  onChange,
  tabs,
  ariaLabel,
  className,
  variant = "segment",
}) {
  if (variant === "underline") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-end gap-0.5 overflow-x-auto border-b border-border px-3 pt-1",
          className,
        )}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const active = value === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors -mb-px",
                active
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
              {tab.label}
              {tab.badge != null ? (
                <span
                  className={cn(
                    "ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold leading-none tabular-nums",
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn("flex shrink-0 items-center border-b border-border px-4 py-2", className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="inline-flex gap-0.5 rounded-[9px] bg-muted/60 p-0.5">
        {tabs.map((tab) => {
          const active = value === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-background font-semibold text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
              {tab.label}
              {tab.badge != null ? (
                <span
                  className={cn(
                    "ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold leading-none tabular-nums",
                    active
                      ? "bg-muted text-foreground"
                      : "bg-background/80 text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
