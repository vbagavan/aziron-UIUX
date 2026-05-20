import { useEffect, useRef, useState } from "react";
import { SparkLogo } from "./kudosUi";
import KudosTemplatePreview from "./KudosTemplatePreview";

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
  const { stage, activeTemplate, selectedRecipients, templateContent } = workflow;
  const containerRef = useRef(null);

  const showCanvas =
    stage === "generating" || stage === "preview" || stage === "loading-templates";
  const scale = usePreviewScale(containerRef, showCanvas && stage === "preview");

  if (!showCanvas) return null;

  const scaledW = CARD_WIDTH * scale;
  const scaledH = CARD_HEIGHT * scale;

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-muted">
      {stage === "generating" || stage === "loading-templates" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <SparkLogo size={18} />
          {stage === "loading-templates"
            ? "Syncing templates from Microsoft OneDrive…"
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
                templateId={activeTemplate}
                recipients={selectedRecipients}
                content={templateContent}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
