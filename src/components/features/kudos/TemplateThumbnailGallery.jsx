import { Check, Cloud, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function TemplateThumb({ template }) {
  if (template.thumbSrc) {
    return (
      <img
        src={template.thumbSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
        draggable={false}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
      style={{ background: template.thumbBg }}
    >
      <div
        className="h-0.5 w-8 rounded-full opacity-80"
        style={{ backgroundColor: template.thumbAccent }}
      />
      <div
        className="text-[9px] font-semibold italic leading-none opacity-90"
        style={{ color: template.thumbAccent }}
      >
        {template.label.split(" ")[0]}
      </div>
      <div className="flex gap-1 mt-0.5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="size-3 rounded-full border"
            style={{ borderColor: template.thumbAccent, backgroundColor: `${template.thumbAccent}33` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TemplateThumbnailGallery({
  templates,
  activeTemplate,
  recommendedTemplateId,
  onSelect,
  onOpenFullPreview,
}) {
  if (!templates?.length) return null;

  const recommended = templates.find((t) => t.id === recommendedTemplateId);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <Cloud size={14} className="text-primary" />
        <p className="text-xs font-semibold text-foreground flex-1">Cloud template gallery</p>
        {onOpenFullPreview && (
          <button
            type="button"
            onClick={onOpenFullPreview}
            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
          >
            <Maximize2 size={12} aria-hidden />
            View full size
          </button>
        )}
      </div>
      {recommended && (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2">
          <Sparkles size={14} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground leading-4">
            <span className="font-medium">Recommended:</span> {recommended.label} — based on{" "}
            {recommended.teamFriendly ? "team" : "individual"} recognition, recipient count, and
            category.
          </p>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground leading-4">
        Click a thumbnail to update the left preview. Templates are synced from your connected
        cloud folder.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((tpl) => {
          const selected = activeTemplate === tpl.id;
          const isRecommended = tpl.id === recommendedTemplateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={cn(
                "relative rounded-lg border-2 overflow-hidden aspect-[5/4] text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary ring-2 ring-primary/25 shadow-sm"
                  : "border-border hover:border-primary/40",
              )}
              aria-pressed={selected}
              aria-label={`Select ${tpl.label} template`}
            >
              {isRecommended && (
                <span className="absolute top-1 left-1 z-10 text-[8px] font-bold uppercase tracking-wide bg-primary text-primary-foreground px-1 py-0.5 rounded">
                  Recommended
                </span>
              )}
              <TemplateThumb template={tpl} />
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-1 bg-card/95 backdrop-blur-sm px-2 py-1 border-t border-border">
                <span className="text-[10px] font-medium text-foreground truncate">{tpl.label}</span>
                {selected && <Check size={12} className="text-primary flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
