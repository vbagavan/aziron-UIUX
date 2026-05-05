import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({ message, onDismiss, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  const dismiss = () => { setVisible(false); setTimeout(onDismiss, 300); };

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
      <CheckCircle2 size={16} className="text-success flex-shrink-0" />
      <span>{message}</span>
      <button
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
  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, showToast, dismissToast };
}
