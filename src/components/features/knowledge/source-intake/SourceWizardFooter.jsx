import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SourceWizardFooter({ children, className }) {
  return (
    <DialogFooter
      className={cn(
        "m-0 shrink-0 gap-0 rounded-none border-t border-border bg-muted/30 p-0 px-6 py-4 !mx-0 !mb-0 dark:bg-muted/20",
        className,
      )}
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-2">{children}</div>
    </DialogFooter>
  );
}
