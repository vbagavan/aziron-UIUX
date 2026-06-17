import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Cloud,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/data/knowledgeHubs";
import { HubFileThumbnail } from "@/components/features/knowledge/HubFileThumbnail";
import { getFileTypeConfig } from "@/components/features/knowledge/hubFileTypeConfig";
import {
  getHubFileCatalogProfile,
  getHubFileDisplayFields,
} from "@/components/features/knowledge/hubFileMetadata";
import { downloadHubFile } from "@/components/features/knowledge/hubFileDownload";

function HeroCover({ hubId, file, cfg, onPreview }) {
  return (
    <div className="relative flex w-full max-w-[320px] flex-col items-center">
      <div
        className="hub-cover-disc pointer-events-none absolute left-1/2 top-[40%] size-[280px] -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      />

      <button
        type="button"
        onClick={() => onPreview?.(file)}
        className="group relative z-10 w-full max-w-[240px] transition-transform duration-300 ease-out hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Preview ${file.name}`}
      >
        <div
          className="hub-library-cover relative overflow-hidden rounded-xl"
          style={{ aspectRatio: "3 / 4" }}
        >
          <HubFileThumbnail hubId={hubId} file={file} cfg={cfg} fit="contain" iconSize="size-10" />
        </div>
      </button>

      <p className="relative z-10 mt-4 text-xs text-muted-foreground">
        Tap cover to preview
      </p>
    </div>
  );
}

function MetaCell({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0 space-y-1">
      <p className="hub-showcase-meta-label">{label}</p>
      <p className="hub-showcase-meta-value">{value}</p>
    </div>
  );
}

function CollectionStripItem({ hubId, file, active, onClick }) {
  const cfg = getFileTypeConfig(file.type);
  const { title } = getHubFileDisplayFields(file);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col items-center gap-2.5 px-2 py-3 transition-opacity duration-200",
        active ? "opacity-100" : "opacity-50 hover:opacity-80",
      )}
    >
      {active && (
        <span
          className={cn("absolute bottom-2 left-0 top-2 w-0.5 rounded-full", cfg.stripe)}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "hub-library-cover w-[76px] overflow-hidden rounded-lg",
          active && "ring-2 ring-primary/30",
        )}
        style={{ aspectRatio: "3 / 4" }}
      >
        <HubFileThumbnail hubId={hubId} file={file} cfg={cfg} fit="contain" iconSize="size-4" />
      </div>

      <p
        className={cn(
          "max-w-[96px] text-center text-[10px] leading-tight",
          active ? "font-medium text-foreground" : "text-muted-foreground",
        )}
        title={title}
      >
        {title}
      </p>
    </button>
  );
}

export function HubAssetDetailView({
  file,
  hubId,
  hubName,
  allFiles = [],
  canEdit = true,
  onNavigate,
  onDelete,
  onPreview,
}) {
  const [downloading, setDownloading] = useState(false);

  if (!file) return null;

  const cfg = getFileTypeConfig(file.type);
  const profile = useMemo(
    () => getHubFileCatalogProfile(file, hubName, cfg.label),
    [file, hubName, cfg.label],
  );

  const sourceLabel = file.source === "cloud" ? "Cloud sync" : "Local upload";
  const showCollection = allFiles.length > 1;

  const metaCells = useMemo(
    () => [
      { key: "file", label: "File name", value: profile.fileName },
      { key: "library", label: "Library", value: profile.library },
      { key: "collection", label: "Collection", value: profile.collection },
      { key: "format", label: "Format", value: profile.format },
      { key: "size", label: "File size", value: profile.fileSize },
      profile.durationLabel ? { key: "duration", label: "Duration", value: profile.durationLabel } : null,
      profile.resolution ? { key: "resolution", label: "Resolution", value: profile.resolution } : null,
      { key: "language", label: "Language", value: profile.language },
      { key: "added", label: "Upload date", value: formatDisplayDate(file.uploadedAt) },
      { key: "source", label: "Source", value: sourceLabel },
      profile.documentType ? { key: "doctype", label: "Document type", value: profile.documentType } : null,
      profile.publisher ? { key: "publisher", label: "Publisher", value: profile.publisher } : null,
      profile.publishedDate ? { key: "published", label: "Published", value: profile.publishedDate } : null,
      profile.isbn ? { key: "isbn", label: "ISBN", value: profile.isbn } : null,
      profile.wordCount
        ? { key: "words", label: "Word count", value: profile.wordCount.toLocaleString() }
        : null,
    ].filter(Boolean),
    [profile, file.uploadedAt, sourceLabel],
  );

  async function handleDownload() {
    setDownloading(true);
    try {
      const ok = await downloadHubFile(hubId, file);
      if (!ok) {
        toast.error("Download unavailable", {
          description: "This file isn't available to download yet.",
        });
      }
    } finally {
      setDownloading(false);
    }
  }

  const headerLine = [profile.publisher, profile.publishedDate, profile.format]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div
      className={cn(
        "hub-showcase-canvas grid h-full w-full min-h-0 overflow-hidden",
        showCollection ? "grid-cols-[minmax(0,1fr)_120px]" : "grid-cols-1",
      )}
    >
      <div className="flex min-h-0 min-w-0 overflow-hidden">
        {/* Cover stage */}
        <div className="hub-catalog-cover-stage flex w-[min(34vw,380px)] shrink-0 items-center justify-center border-r border-border/60 px-6 py-8 lg:px-10">
          <HeroCover hubId={hubId} file={file} cfg={cfg} onPreview={onPreview} />
        </div>

        {/* Content */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-card [scrollbar-gutter:stable]">
          <article className="mx-auto flex min-h-full max-w-3xl flex-col px-8 py-10 sm:px-10 lg:px-12 lg:py-12">
            {headerLine && (
              <p className="hub-showcase-eyebrow">{headerLine}</p>
            )}

            <h1 className="hub-showcase-title mt-3">{profile.title}</h1>

            {profile.author && (
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                by {profile.author}
              </p>
            )}

            {file.source === "cloud" && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Cloud className="size-3.5" /> Synced from cloud
              </p>
            )}

            {/* Description — always shown, derived from file content */}
            <div className="mt-8">
              {profile.isEnriching ? (
                <div className="space-y-2" aria-busy="true">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                  <p className="pt-1 text-xs text-muted-foreground">Analyzing file contents…</p>
                </div>
              ) : (
                <p className="hub-showcase-body">{profile.description}</p>
              )}
            </div>

            <div className="my-10 h-px bg-border" />

            <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {metaCells.map((cell) => (
                <MetaCell key={cell.key} label={cell.label} value={cell.value} />
              ))}
            </div>

            {(profile.tags.length > 0 || profile.genres.length > 0) && (
              <div className="mt-8 flex flex-wrap gap-2">
                {[...profile.genres, ...profile.tags].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-3 pt-10">
              <Button type="button" variant="default" size="sm" onClick={() => onPreview?.(file)}>
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={downloading}
                onClick={handleDownload}
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Download
              </Button>
              {canEdit && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(file)}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              )}
            </div>
          </article>
        </div>
      </div>

      {showCollection && (
        <aside className="flex min-h-0 flex-col overflow-hidden border-l border-border/60 bg-muted/10">
          <p className="shrink-0 px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            In this library
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-1 [scrollbar-gutter:stable]">
            {allFiles.map((f) => (
              <CollectionStripItem
                key={f.id}
                hubId={hubId}
                file={f}
                active={f.id === file.id}
                onClick={() => f.id !== file.id && onNavigate?.(f)}
              />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
