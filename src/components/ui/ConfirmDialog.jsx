import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  confirmClass,
  onConfirm,
  onCancel,
}) {
  const useSolidDestructive = confirmVariant === 'destructive' && !confirmClass

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent
        showCloseButton={false}
        overlayVariant={confirmVariant === "destructive" ? "destructive" : "default"}
        className="gap-0 overflow-hidden p-0 sm:max-w-[340px]"
      >
        <DialogHeader className="flex flex-col items-center gap-3 border-b-0 px-6 pt-6 pb-0 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <div className="flex size-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <AlertTriangle />
            </div>
          </div>
          <DialogTitle className="text-base leading-snug">{title}</DialogTitle>
          <DialogDescription className="leading-5">{message}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t-0 bg-transparent px-6 pt-5 pb-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={useSolidDestructive ? 'default' : confirmVariant}
            onClick={onConfirm}
            className={cn(
              'flex-1',
              useSolidDestructive && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              confirmClass,
            )}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
