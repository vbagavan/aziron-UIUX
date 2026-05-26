import { Star } from "lucide-react";
import { TEMPLATES } from "../constants";

export default function KudosTemplatePreviewBlock({
  templateId,
  recommended = false,
  onSelectTemplate,
  onViewFullPreview,
}) {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  return (
    <div className="bg-card border border-border rounded-[8px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted">
        <span className="text-xs font-semibold text-foreground">Template Preview</span>
        {recommended && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning-ring">
            <Star size={9} className="fill-current" />
            Recommended
          </span>
        )}
      </div>

      {/* Template Thumbnail */}
      <div
        className="mx-3 my-3 h-32 rounded-[6px] border border-border cursor-pointer transition-all hover:ring-2 hover:ring-primary/40"
        style={{ background: template.thumbBg }}
        onClick={() => onViewFullPreview?.()}
      >
        <div className="h-full flex items-center justify-center relative">
          <div
            className="absolute inset-0 rounded-[6px] opacity-30 pointer-events-none"
            style={{
              boxShadow: `inset 0 1px 3px rgba(0,0,0,0.1), inset 0 0 20px ${template.thumbAccent}33`,
            }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: template.thumbAccent }}
          >
            {template.label}
          </span>
        </div>
      </div>

      {/* Template Name */}
      <div className="px-3 py-2 border-t border-border text-center">
        <p className="text-xs font-medium text-foreground">{template.label}</p>
      </div>

      {/* Action */}
      <div className="px-3 py-2 border-t border-border">
        <button
          type="button"
          onClick={() => onViewFullPreview?.()}
          className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View full preview →
        </button>
      </div>
    </div>
  );
}
