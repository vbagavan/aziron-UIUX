import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, X } from "lucide-react";

export function Toast({ message, onDismiss, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[99999] flex -translate-x-1/2 items-center gap-3 rounded-[10px] bg-[#0f172a] px-4 py-3 text-sm font-medium text-white shadow-xl transition-all duration-300 dark:bg-[#f8fafc] dark:text-[#0f172a]"
      style={{ opacity: visible ? 1 : 0, transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)` }}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 size={16} className="text-[#22c55e] flex-shrink-0" />
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        aria-label="Dismiss notification"
        className="ml-1 text-white/60 transition-colors hover:text-white dark:text-[#64748b] dark:hover:text-[#0f172a]"
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
