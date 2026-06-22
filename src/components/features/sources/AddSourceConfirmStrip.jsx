import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExpressSettingsSummary } from "@/components/features/sources/coreFlowSteps";

/**
 * Sticky Zone 3 — selection summary, optional advanced settings, navigation + primary action.
 */
export function AddSourceConfirmStrip({
  summary,
  finishLabel,
  expressSummaryLines = [],
  showBack,
  showContinue,
  isFinishStep,
  canAdvance,
  finishing,
  onBack,
  onCancel,
  onContinue,
  className,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasAdvanced = isFinishStep && expressSummaryLines.length > 0;

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-muted/25 px-5 py-2.5">
        <p className="text-center text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{summary.countLabel}</span>
          {summary.count > 0 ? (
            <>
              <span aria-hidden className="mx-1.5 text-border">·</span>
              <span>{summary.origin}</span>
              <span aria-hidden className="mx-1.5 text-border">·</span>
              <span>{summary.destination}</span>
            </>
          ) : (
            <span className="ml-1">— pick files or configure a connection above</span>
          )}
        </p>
      </div>

      {hasAdvanced ? (
        <div className="border-b border-border/60 px-5 py-2">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={advancedOpen}
          >
            Advanced settings
            <ChevronDown
              className={cn("size-3.5 transition-transform", advancedOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          {advancedOpen ? (
            <div className="pt-2 pb-1">
              <ExpressSettingsSummary lines={expressSummaryLines} className="mb-0 border-0 bg-transparent p-0" />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        {showBack ? (
          <Button type="button" variant="ghost" size="sm" onClick={onBack} disabled={finishing}>
            <ArrowLeft data-icon="inline-start" aria-hidden />
            Back
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={finishing}>
            Cancel
          </Button>
        )}

        {showContinue ? (
          <Button
            type="button"
            size="sm"
            className="ml-auto min-w-[7.5rem]"
            onClick={onContinue}
            disabled={!canAdvance || finishing}
          >
            {isFinishStep ? finishLabel : "Continue"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
