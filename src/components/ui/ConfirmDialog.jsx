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
        className="relative bg-white rounded-2xl w-[340px] overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#ef4444] to-[#f97316]" />
        <div className="px-6 pt-6 pb-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="size-14 rounded-full bg-[#fef2f2] flex items-center justify-center">
              <div className="size-9 rounded-full bg-[#fee2e2] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[#ef4444]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 id="confirm-title" className="text-base font-semibold text-[#0f172a] leading-snug">{title}</h2>
              <p className="text-sm text-[#64748b] leading-5">{message}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-[8px] border border-[#e2e8f0] bg-white text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
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
