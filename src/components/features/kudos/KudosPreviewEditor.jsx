import { useEffect, useRef, useState } from "react";
import { SparkLogo } from "./kudosPrimitives";
import KudosTemplatePreview from "./KudosTemplatePreview";
import KudosIdleGuide from "./KudosIdleGuide";
import { hasCustomCardStyles } from "@/lib/kudosPreviewUtils";

const CARD_WIDTH = 700;
const CARD_HEIGHT = 500;
const PREVIEW_PADDING = 48;

function usePreviewScale(containerRef, active) {
  const [scale, setScale] = useState(0.55);

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.max(0, el.clientWidth - PREVIEW_PADDING);
      const h = Math.max(0, el.clientHeight - PREVIEW_PADDING);
      const fit = Math.min(w / CARD_WIDTH, h / CARD_HEIGHT);
      setScale(Math.min(Math.max(fit, 0.35), 1));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [active, containerRef]);

  return scale;
}

export default function KudosPreviewEditor({ workflow }) {
  const {
    stage,
    activeTemplate,
    selectedRecipients,
    templateContent,
    baselineTemplateContent,
  } = workflow;
  const containerRef = useRef(null);

  const isIdle = ["idle", "compose", "empty"].includes(stage);
  const showCanvas =
    stage === "generating" || stage === "preview" || stage === "loading-templates";
  const scale = usePreviewScale(containerRef, showCanvas && stage === "preview");
  const styledPreview = hasCustomCardStyles(templateContent, baselineTemplateContent);

  if (isIdle) {
    return <KudosIdleGuide />;
  }

  if (!showCanvas) return <KudosIdleGuide />;

  const scaledW = CARD_WIDTH * scale;
  const scaledH = CARD_HEIGHT * scale;

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-muted">
      {styledPreview && stage === "preview" && (
        <p className="flex-shrink-0 px-4 py-2 text-center text-[11px] text-muted-foreground border-b border-border bg-card/80">
          Live preview with your color and theme changes applied
        </p>
      )}
      {stage === "generating" || stage === "loading-templates" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <SparkLogo size={18} />
          {stage === "loading-templates"
            ? "Syncing templates from cloud storage…"
            : "Generating your appreciation card…"}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-6"
        >
          <div
            className="transition-all duration-200 shrink-0"
            style={{ width: scaledW, height: scaledH }}
          >
            <div
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <KudosTemplatePreview
                key={`${activeTemplate}-${styledPreview ? "styled" : "image"}`}
                templateId={activeTemplate}
                recipients={selectedRecipients}
                content={templateContent}
                baselineContent={baselineTemplateContent}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
