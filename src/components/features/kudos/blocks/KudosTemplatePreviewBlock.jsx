import { Star, Cloud, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "../constants";
import { TemplateThumb } from "../TemplateThumbnailGallery";

export default function KudosTemplatePreviewBlock({
  templateId,
  templates = TEMPLATES,
  recommendedTemplateId,
  recommended = false,
  onSelectTemplate,
}) {
  const catalog = templates?.length ? templates : TEMPLATES;
  const template = catalog.find((t) => t.id === templateId);
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

      {/* OneDrive template thumbnails */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Cloud size={12} className="text-primary flex-shrink-0" />
          <span className="text-[10px] font-medium text-muted-foreground">
            Templates from OneDrive
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {catalog.map((tpl) => {
            const selected = templateId === tpl.id;
            const isRecommended = tpl.id === recommendedTemplateId;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate?.(tpl.id)}
                className={cn(
                  "relative h-16 w-full rounded border overflow-hidden text-left transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary ring-2 ring-primary/25"
                    : "border-border hover:border-primary/40",
                )}
                aria-pressed={selected}
                aria-label={`Select ${tpl.label} template`}
              >
                {isRecommended && (
                  <span className="absolute top-1 left-1 z-10 text-[7px] font-bold uppercase tracking-wide bg-primary text-primary-foreground px-1 py-0.5 rounded">
                    Recommended
                  </span>
                )}
                <TemplateThumb template={tpl} />
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-0.5 bg-card/95 backdrop-blur-sm px-1 py-px border-t border-border">
                  <span className="text-[9px] font-medium text-foreground truncate leading-tight" title={tpl.label}>
                    {tpl.label}
                  </span>
                  {selected && <Check size={8} className="text-primary flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
