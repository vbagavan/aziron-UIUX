import { Suspense, lazy } from "react";

/**
 * Lazy-loads card renderers from KudosPage to avoid a synchronous import cycle
 * (KudosPage ↔ KudosPreviewEditor) that can blank the preview pane at runtime.
 */
const LazyKudosCard = lazy(() =>
  import("@/components/pages/KudosPage").then((mod) => ({
    default: function KudosCardView({ templateId, recipients, content }) {
      return mod.renderKudosTemplate(templateId, recipients, content);
    },
  })),
);

export default function KudosTemplatePreview({ templateId, recipients, content }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-[400px] h-[300px] text-sm text-muted-foreground">
          Loading template preview…
        </div>
      }
    >
      <LazyKudosCard templateId={templateId} recipients={recipients} content={content} />
    </Suspense>
  );
}
