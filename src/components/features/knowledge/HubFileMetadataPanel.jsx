import { BookOpen, ExternalLink, Globe, Loader2, Sparkles, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MetadataField({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function sourceLabel(source) {
  if (source === "openlibrary") return "Open Library";
  if (source === "local") return "Extracted locally";
  return "Enriched";
}

/**
 * @param {{ metadata?: object | null, className?: string }} props
 */
export function HubFileMetadataPanel({ metadata, className }) {
  if (!metadata) return null;

  if (metadata.status === "loading") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
        Looking up file metadata…
      </div>
    );
  }

  if (metadata.status === "failed") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        Could not enrich metadata for this file. Basic preview content is still available below.
      </div>
    );
  }

  const hasDetails =
    metadata.author ||
    metadata.publisher ||
    metadata.publishedDate ||
    metadata.isbn ||
    metadata.doi ||
    metadata.description ||
    metadata.summary ||
    (metadata.tags?.length ?? 0) > 0;

  if (!hasDetails && !metadata.title) return null;

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {metadata.coverUrl ? (
          <img
            src={metadata.coverUrl}
            alt=""
            className="size-16 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
            <BookOpen className="size-6 text-muted-foreground" aria-hidden />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {metadata.title ?? "Untitled document"}
              </p>
              {metadata.author ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{metadata.author}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {metadata.documentType ? (
                <Badge variant="secondary" className="text-[10px]">
                  {metadata.documentType}
                </Badge>
              ) : null}
              {metadata.source ? (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  {metadata.source === "openlibrary" ? (
                    <Globe className="size-3" aria-hidden />
                  ) : (
                    <Sparkles className="size-3" aria-hidden />
                  )}
                  {sourceLabel(metadata.source)}
                </Badge>
              ) : null}
            </div>
          </div>

          {(metadata.description || metadata.summary) && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {metadata.description ?? metadata.summary}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetadataField label="Publisher" value={metadata.publisher} />
        <MetadataField label="Published" value={metadata.publishedDate} />
        <MetadataField label="ISBN" value={metadata.isbn} />
        <MetadataField label="DOI" value={metadata.doi} />
        {metadata.wordCount ? (
          <MetadataField
            label="Word count"
            value={`${metadata.wordCount.toLocaleString()} words`}
          />
        ) : null}
      </div>

      {(metadata.tags?.length ?? 0) > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Tag className="size-3.5 text-muted-foreground" aria-hidden />
          {metadata.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {metadata.externalUrl ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={
              <a href={metadata.externalUrl} target="_blank" rel="noreferrer" />
            }
          >
            <ExternalLink data-icon="inline-start" />
            View on Open Library
          </Button>
        </div>
      ) : null}
    </section>
  );
}
