import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Sticky form actions — matches ProjectDocumentWorkflow footer and dialog footers.
 *
 * @param {{ left?: React.ReactNode, right?: React.ReactNode, className?: string }} props
 */
export function ProjectFormFooter({ left, right, className }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-6 flex flex-col bg-muted/30 backdrop-blur-sm",
        className,
      )}
    >
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap gap-2">{left}</div>
        <div className="flex flex-wrap items-center justify-end gap-2">{right}</div>
      </div>
    </div>
  );
}
