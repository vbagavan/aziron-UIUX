import { X } from "lucide-react";
import KudosTemplatePreview from "./KudosTemplatePreview";

export default function KudosPreviewModal({ open, onClose, templateId, recipients, content }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Full size template preview"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-full overflow-auto rounded-xl border border-border bg-muted shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted"
        >
          <X size={16} aria-hidden />
        </button>
        <div className="p-6">
          <KudosTemplatePreview templateId={templateId} recipients={recipients} content={content} />
        </div>
      </div>
    </div>
  );
}
