import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function formatToastMessage(input) {
  if (typeof input === "string") return input;
  if (!input || typeof input !== "object") return "Done";
  const { title, description } = input;
  if (title && description) return `${title} — ${description}`;
  return title ?? description ?? "Done";
}

const VARIANT_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-success shrink-0",
    surface: "bg-foreground text-background dark:bg-background dark:text-foreground",
  },
  destructive: {
    icon: AlertCircle,
    iconClass: "text-destructive shrink-0",
    surface: "border border-destructive/30 bg-destructive text-destructive-foreground",
  },
  default: {
    icon: Info,
    iconClass: "text-muted-foreground shrink-0",
    surface: "bg-foreground text-background dark:bg-background dark:text-foreground",
  },
};

export function Toast({
  message,
  variant = "default",
  onDismiss,
  duration = 3000,
  actionLabel,
  onAction,
  className,
}) {
  const [visible, setVisible] = useState(true);
  const effectiveDuration = actionLabel ? Math.max(duration, 8000) : duration;
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  const Icon = styles.icon;

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
        "flex max-w-md items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium shadow-xl transition-all duration-300",
        styles.surface,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
        className,
      )}
      role={variant === "destructive" ? "alert" : "status"}
      aria-live={variant === "destructive" ? "assertive" : "polite"}
    >
      <Icon size={16} className={styles.iconClass} />
      <span className="min-w-0 flex-1">{message}</span>
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 shrink-0",
            variant === "destructive"
              ? "text-destructive-foreground hover:bg-destructive-foreground/10"
              : "text-background hover:bg-background/15 dark:text-foreground dark:hover:bg-foreground/10",
          )}
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
        className={cn(
          "ml-1 shrink-0 transition-colors",
          variant === "destructive"
            ? "text-destructive-foreground/70 hover:text-destructive-foreground"
            : "text-background/60 hover:text-background dark:text-foreground/60 dark:hover:text-foreground",
        )}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const isObjectPayload =
      message &&
      typeof message === "object" &&
      (message.title || message.description);

    setToasts((prev) => [
      ...prev,
      {
        id,
        message: isObjectPayload ? formatToastMessage(message) : String(message ?? ""),
        variant: isObjectPayload
          ? (message.variant ?? options.variant ?? "default")
          : (options.variant ?? "default"),
        actionLabel: options.actionLabel,
        onAction: options.onAction,
      },
    ]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, showToast, dismissToast };
}
