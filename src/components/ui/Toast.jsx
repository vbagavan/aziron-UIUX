import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Toast({
  message,
  onDismiss,
  duration = 3000,
  actionLabel,
  onAction,
}) {
  const [visible, setVisible] = useState(true);
  const effectiveDuration = actionLabel ? Math.max(duration, 8000) : duration;

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, effectiveDuration);
    return () => clearTimeout(t);
  }, [effectiveDuration, onDismiss]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-[99999] flex -translate-x-1/2 items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium shadow-xl transition-all duration-300",
        "bg-foreground text-background dark:bg-background dark:text-foreground",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
      )}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 size={16} className="text-success shrink-0" />
      <span>{message}</span>
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-background hover:bg-background/15 dark:text-foreground dark:hover:bg-foreground/10"
          onClick={() => {
            onAction();
            dismiss();
          }}
        >
          {actionLabel}
        </Button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="ml-1 text-background/60 transition-colors hover:text-background dark:text-foreground/60 dark:hover:text-foreground"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, options) => {
    const id = Date.now();
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
      },
    ]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, showToast, dismissToast };
}
