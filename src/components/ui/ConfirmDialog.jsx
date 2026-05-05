import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  confirmClass,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="w-[340px] max-w-[340px] overflow-hidden rounded-2xl p-0 gap-0"
        aria-labelledby="confirm-title"
      >
        {/* Danger accent stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-destructive to-orange-500" />

        <div className="px-6 pt-6 pb-5 flex flex-col gap-5">
          {/* Icon */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
              <div className="flex size-9 items-center justify-center rounded-full bg-destructive/20 dark:bg-destructive/30">
                <AlertTriangle size={18} className="text-destructive" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 id="confirm-title" className="text-base font-semibold leading-snug text-foreground">
                {title}
              </h2>
              <p className="text-sm leading-5 text-muted-foreground">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={
                confirmClass ||
                "flex-1 h-10 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors"
              }
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
