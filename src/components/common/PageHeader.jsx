import { cn } from "@/lib/utils";
import { PAGE_SUBTITLE, PAGE_TITLE } from "@/lib/typography";

/**
 * Standard app page header — one H1 + optional description per route.
 */
export function PageHeader({
  title,
  description,
  className,
  titleClassName,
  children,
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className={cn(PAGE_TITLE, titleClassName)}>{title}</h1>
          {description ? <p className={PAGE_SUBTITLE}>{description}</p> : null}
        </div>
        {children ? <div className="flex shrink-0 flex-wrap items-center gap-3">{children}</div> : null}
      </div>
    </div>
  );
}
