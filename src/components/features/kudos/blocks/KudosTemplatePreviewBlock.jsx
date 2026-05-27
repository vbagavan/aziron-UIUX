import { Star, Cloud, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "../constants";
import { KUDOS_BADGE, KUDOS_CAPTION, KUDOS_LABEL, KUDOS_TEMPLATE_LABEL } from "../kudosTypography";
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
        <span className={cn(KUDOS_LABEL, "font-semibold")}>Template Preview</span>
        {recommended && (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full border border-warning-ring bg-warning/10 px-2 py-0.5 text-warning",
            KUDOS_BADGE,
          )}>
            <Star size={9} className="fill-current" />
            Recommended
          </span>
        )}
      </div>

      {/* Cloud folder template thumbnails */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Cloud size={12} className="text-primary flex-shrink-0" />
          <span className={KUDOS_CAPTION}>Templates from cloud folder</span>
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
                  <span className={cn(
                    "absolute top-1 left-1 z-10 rounded bg-primary px-1 py-0.5 uppercase tracking-wide text-primary-foreground",
                    KUDOS_BADGE,
                  )}>
                    Recommended
                  </span>
                )}
                <TemplateThumb template={tpl} />
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-0.5 bg-card/95 backdrop-blur-sm px-1 py-px border-t border-border">
                  <span className={cn("truncate leading-tight", KUDOS_TEMPLATE_LABEL)} title={tpl.label}>
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
