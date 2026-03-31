import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({ title, message, confirmLabel = "Delete", confirmClass, onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        className="relative w-[340px] overflow-hidden rounded-2xl bg-white dark:bg-[#111827]"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#ef4444] to-[#f97316]" />
        <div className="px-6 pt-6 pb-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#fef2f2] dark:bg-[#3b0a0a]">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#fee2e2] dark:bg-[#5b1111]">
                <AlertTriangle size={18} className="text-[#ef4444]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 id="confirm-title" className="text-base font-semibold leading-snug text-[#0f172a] dark:text-[#f8fafc]">{title}</h2>
              <p className="text-sm leading-5 text-[#64748b] dark:text-[#94a3b8]">{message}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-[8px] border border-[#e2e8f0] bg-white text-sm font-medium text-[#475569] transition-colors hover:bg-[#f8fafc] dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#cbd5e1] dark:hover:bg-[#0f172a]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={confirmClass || "flex-1 h-10 rounded-[8px] bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium transition-colors"}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
