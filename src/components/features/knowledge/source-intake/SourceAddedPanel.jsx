import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export function SourceAddedPanel({
  title = KNOWLEDGE_TERMS.uploadComplete,
  description,
  primaryLabel = "Done",
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="size-6 text-success" aria-hidden />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {secondaryLabel && onSecondary ? (
          <Button type="button" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          variant={secondaryLabel ? "outline" : "default"}
          onClick={onPrimary}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
