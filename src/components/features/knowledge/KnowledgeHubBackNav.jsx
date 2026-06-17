import { ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { cn } from "@/lib/utils";

/**
 * Hub drill-down back control.
 * - With `hubTitle`: [← Hub name] — title doubles as back affordance (native app pattern).
 * - Without: [← Knowledge Hubs] — compact link in the app header.
 */
export function KnowledgeHubBackNav({
  onBack,
  hubTitle,
  className,
  showSeparator = true,
}) {
  if (!onBack) return null;

  const label = hubTitle?.trim() || KNOWLEDGE_TERMS.hubs;
  const isHubTitle = Boolean(hubTitle?.trim());

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isHubTitle ? "min-w-0 shrink-0" : "min-w-0",
        showSeparator && "ml-1",
        className,
      )}
    >
      {showSeparator ? <Separator orientation="vertical" className="h-6 shrink-0" /> : null}
      <button
        type="button"
        onClick={onBack}
        aria-label={`Back to ${KNOWLEDGE_TERMS.hubs}`}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md py-0.5 text-left transition-colors",
          isHubTitle
            ? "-ml-1 max-w-none shrink-0 px-1 text-foreground hover:bg-muted/60"
            : "max-w-full min-w-0 px-1 text-sm font-medium text-muted-foreground hover:text-foreground",
        )}
      >
        <ChevronLeft
          className={cn("shrink-0 text-muted-foreground", isHubTitle ? "size-5" : "size-4")}
          aria-hidden
        />
        <span
          className={cn(
            isHubTitle
              ? "whitespace-normal text-lg font-semibold leading-tight tracking-tight"
              : "truncate text-sm font-medium",
          )}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
