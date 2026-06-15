import { HubMarkdownPreview } from "@/components/features/knowledge/HubMarkdownPreview";
import { cn } from "@/lib/utils";

/**
 * Renders the stored file blob — PDF iframe, image, media, or extracted markdown.
 */
export function HubFileRawPreview({
  file,
  previewKind,
  previewSrc,
  markdownContent,
  className,
  fullHeight = false,
}) {
  if (previewKind === "pdf" && previewSrc) {
    return (
      <iframe
        title={`Document ${file.name}`}
        src={previewSrc}
        className={cn(
          "w-full rounded-lg border border-border bg-background",
          fullHeight ? "min-h-0 flex-1" : "min-h-[320px]",
          className,
        )}
      />
    );
  }

  if (previewKind === "image" && previewSrc) {
    return (
      <img
        src={previewSrc}
        alt={file.name}
        className={cn(
          "w-full rounded-lg border border-border object-contain",
          fullHeight ? "max-h-full" : "max-h-[560px]",
          className,
        )}
      />
    );
  }

  if (previewKind === "video" && previewSrc) {
    return (
      <video
        src={previewSrc}
        controls
        className={cn(
          "w-full rounded-lg border border-border bg-black",
          fullHeight ? "max-h-full" : "max-h-[560px]",
          className,
        )}
      >
        <track kind="captions" />
      </video>
    );
  }

  if (previewKind === "audio" && previewSrc) {
    return <audio src={previewSrc} controls className={cn("w-full", className)} />;
  }

  if (markdownContent) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-background p-6",
          fullHeight && "min-h-0 overflow-y-auto",
          className,
        )}
      >
        <HubMarkdownPreview content={markdownContent} />
      </div>
    );
  }

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      No raw document preview available for this file type.
    </p>
  );
}

export function hasRawFilePreview({ previewSrc, markdownContent }) {
  return Boolean(previewSrc || markdownContent);
}
