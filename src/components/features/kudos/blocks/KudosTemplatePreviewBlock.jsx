import { Star, Cloud, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { KUDOS_BADGE, KUDOS_CAPTION, KUDOS_LABEL, KUDOS_TEMPLATE_LABEL } from "../kudosTypography";
import { TemplateThumb } from "../TemplateThumbnailGallery";

function TemplatePickButton({ tpl, selected, isRecommended, onSelectTemplate, className }) {
  return (
    <button
      type="button"
      onClick={() => onSelectTemplate?.(tpl.id)}
      className={cn(
        "relative h-16 w-full overflow-hidden rounded border text-left transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-2 ring-primary/25"
          : "border-border hover:border-primary/40",
        className,
      )}
      aria-pressed={selected}
      aria-label={`Select ${tpl.label} template`}
    >
      {isRecommended && (
        <span
          className={cn(
            "absolute top-1 left-1 z-10 rounded bg-primary px-1 py-0.5 uppercase tracking-wide text-primary-foreground",
            KUDOS_BADGE,
          )}
        >
          Recommended
        </span>
      )}
      <TemplateThumb template={tpl} />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 border-t border-border bg-card/95 px-1 py-px backdrop-blur-sm">
        <span className={cn("truncate leading-tight", KUDOS_TEMPLATE_LABEL)} title={tpl.label}>
          {tpl.label}
        </span>
        {selected && <Check size={8} className="shrink-0 text-primary" />}
      </div>
    </button>
  );
}

export default function KudosTemplatePreviewBlock({
  templateId,
  templates = [],
  recommendedTemplateId,
  recommended = false,
  onSelectTemplate,
}) {
  const visible = templates?.length ? templates : [];
  const template = visible.find((t) => t.id === templateId) ?? visible[0];

  if (!template) {
    return (
      <div className="overflow-hidden rounded-[8px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
          <span className={cn(KUDOS_LABEL, "font-semibold")}>Template Preview</span>
        </div>
        <div className="px-3 py-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Cloud size={12} className="shrink-0" aria-hidden />
            <span className={KUDOS_CAPTION}>
              Select a template in the prompt below to preview it here.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const singleSelection = visible.length === 1;

  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
        <span className={cn(KUDOS_LABEL, "font-semibold")}>Template Preview</span>
        {recommended && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-warning-ring bg-warning/10 px-2 py-0.5 text-warning",
              KUDOS_BADGE,
            )}
          >
            <Star size={9} className="fill-current" />
            Recommended
          </span>
        )}
      </div>

      <div className="px-3 py-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Cloud size={12} className="shrink-0 text-primary" aria-hidden />
          <span className={KUDOS_CAPTION}>
            {singleSelection
              ? "Attached from prompt"
              : `${visible.length} templates attached`}
          </span>
        </div>

        {singleSelection ? (
          <TemplatePickButton
            tpl={template}
            selected
            isRecommended={template.id === recommendedTemplateId}
            onSelectTemplate={onSelectTemplate}
            className="h-28"
          />
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {visible.map((tpl) => (
              <TemplatePickButton
                key={tpl.id}
                tpl={tpl}
                selected={templateId === tpl.id}
                isRecommended={tpl.id === recommendedTemplateId}
                onSelectTemplate={onSelectTemplate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
