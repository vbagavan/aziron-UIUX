import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CloudIntakeBreadcrumb({ segments, className }) {
  if (!segments?.length) return null;

  return (
    <nav
      aria-label="Cloud source location"
      className={cn("flex flex-wrap items-center gap-1 px-0.5 pb-3 text-xs text-muted-foreground", className)}
    >
      {segments.map((label, index) => {
        const isLast = index === segments.length - 1;
        return (
          <Fragment key={`${label}-${index}`}>
            {index > 0 ? (
              <ChevronRight className="size-3 shrink-0 opacity-50" aria-hidden />
            ) : null}
            <span className={cn(isLast && "font-medium text-foreground")}>{label}</span>
          </Fragment>
        );
      })}
    </nav>
  );
}
