import { Suspense, lazy } from "react";
import { getKudosTemplate } from "./constants";
import { hasCustomCardStyles } from "@/lib/kudosPreviewUtils";
import KudosOneDriveTemplatePreview from "./KudosOneDriveTemplatePreview";

const LazyKudosCard = lazy(() =>
  import("@/components/pages/KudosPage").then((mod) => ({
    default: function KudosCardView({ templateId, recipients, content }) {
      return mod.renderKudosTemplate(templateId, recipients, content);
    },
  })),
);

export default function KudosTemplatePreview({
  templateId,
  recipients,
  content,
  baselineContent,
}) {
  const catalogEntry = getKudosTemplate(templateId);
  const useStyledRenderer = hasCustomCardStyles(content, baselineContent);

  if (useStyledRenderer) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center w-[400px] h-[300px] text-sm text-muted-foreground">
            Loading styled preview…
          </div>
        }
      >
        <LazyKudosCard key={`styled-${templateId}`} templateId={templateId} recipients={recipients} content={content} />
      </Suspense>
    );
  }

  if (catalogEntry?.thumbSrc) {
    return <KudosOneDriveTemplatePreview template={catalogEntry} />;
  }

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
