import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, LayoutGrid, List, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KUDOS_DRIVE_FOLDER } from "@/services/oneDriveTemplates";
import {
  KUDOS_BADGE,
  KUDOS_CAPTION,
  KUDOS_FILE_META,
  KUDOS_FILE_NAME,
  KUDOS_TEMPLATE_LABEL,
} from "./kudosTypography";

const FILE_EXT_STYLES = {
  pptx: { label: "PPT", className: "bg-[#d24726] text-white" },
  ppt: { label: "PPT", className: "bg-[#d24726] text-white" },
  docx: { label: "DOC", className: "bg-[#2b579a] text-white" },
  pdf: { label: "PDF", className: "bg-[#e53e3e] text-white" },
  md: { label: "MD", className: "bg-primary text-primary-foreground" },
};

const IMAGE_FORMAT_STYLES = {
  png: { label: "PNG", className: "bg-[#10b981] text-white" },
  jpg: { label: "JPG", className: "bg-[#059669] text-white" },
  jpeg: { label: "JPEG", className: "bg-[#059669] text-white" },
  webp: { label: "WEBP", className: "bg-[#0d9488] text-white" },
  gif: { label: "GIF", className: "bg-[#8b5cf6] text-white" },
  svg: { label: "SVG", className: "bg-[#6366f1] text-white" },
  avif: { label: "AVIF", className: "bg-[#14b8a6] text-white" },
};

function resolveFormatStyle(ext) {
  const normalized = ext?.toLowerCase() ?? "";
  if (IMAGE_FORMAT_STYLES[normalized]) return IMAGE_FORMAT_STYLES[normalized];
  if (FILE_EXT_STYLES[normalized]) return FILE_EXT_STYLES[normalized];
  return {
    label: normalized.slice(0, 4).toUpperCase() || "FILE",
    className: "bg-muted text-foreground",
  };
}

/** Source file badge (pptx, pdf, …) — used in list rows and context chips. */
export function DriveFileTypeIcon({ extension = "png", className }) {
  const style = resolveFormatStyle(extension);

  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[26px] flex-shrink-0 items-center justify-center rounded-[3px] px-1",
        KUDOS_BADGE,
        style.className,
        className,
      )}
      aria-hidden
    >
      {style.label}
    </span>
  );
}

/** Preview thumbnail format (png, jpg, …). */
export function resolvePreviewFormat(file) {
  if (!file) return "png";
  return (
    file.thumbFormat ??
    file.thumbSrc?.match(/\.([a-z0-9]+)(?:\?.*)?$/i)?.[1]?.toLowerCase() ??
    "png"
  );
}

function isImageFormat(ext) {
  return Boolean(IMAGE_FORMAT_STYLES[ext?.toLowerCase()]);
}

/** Preview / image format badge — grid overlays and context chips. */
export function DriveImageFormatBadge({ format, className, subtle = false }) {
  const style = resolveFormatStyle(format);

  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[28px] flex-shrink-0 items-center justify-center rounded-[3px] px-1",
        KUDOS_BADGE,
        subtle ? "border-0 shadow-none" : "border border-white/20 shadow-sm",
        style.className,
        className,
      )}
      aria-hidden
    >
      {style.label}
    </span>
  );
}

/** Picks image preview format when available, otherwise source file extension. */
export function DriveFileFormatBadge({ file, className, preferPreview = true }) {
  const previewFormat = resolvePreviewFormat(file);
  const usePreview = preferPreview && (file?.thumbSrc || file?.thumbFormat) && isImageFormat(previewFormat);

  if (usePreview) {
    return <DriveImageFormatBadge format={previewFormat} className={className} subtle />;
  }

  return <DriveFileTypeIcon extension={file?.extension} className={className} />;
}

function gridPreviewFormat(file) {
  return resolvePreviewFormat(file);
}

function DriveViewSwitcher({ viewMode, onViewModeChange }) {
  return (
    <div
      className="flex flex-shrink-0 items-center rounded-[6px] border border-border bg-card p-0.5"
      role="group"
      aria-label="File view"
    >
      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        title="List view"
        aria-label="List view"
        aria-pressed={viewMode === "list"}
        className={cn(
          "flex size-7 items-center justify-center rounded-[4px] transition-colors",
          viewMode === "list"
            ? "bg-accent text-foreground"
            : "text-foreground/60 hover:bg-accent hover:text-foreground",
        )}
      >
        <List size={14} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("grid")}
        title="Grid view"
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
        className={cn(
          "flex size-7 items-center justify-center rounded-[4px] transition-colors",
          viewMode === "grid"
            ? "bg-accent text-foreground"
            : "text-foreground/60 hover:bg-accent hover:text-foreground",
        )}
      >
        <LayoutGrid size={14} aria-hidden />
      </button>
    </div>
  );
}

function DriveFileListRows({ files, activeFileId, contextFileIds = [], onSelectFile, loading, folderName }) {
  return (
    <div
      className="max-h-[132px] overflow-y-auto overscroll-y-contain px-1.5 pb-2"
      role="listbox"
      aria-label={`Files in ${folderName}`}
    >
      {loading && files.length === 0 && (
        <p className={cn("px-2 py-2", KUDOS_CAPTION)}>Syncing folder from cloud storage…</p>
      )}
      {files.map((file) => {
        const inContext = contextFileIds.includes(file.id);
        const isActive = file.id === activeFileId;
        return (
          <button
            key={file.id}
            type="button"
            role="option"
            aria-selected={isActive || inContext}
            onClick={() => onSelectFile?.(file.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left transition-colors",
              isActive || inContext
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "hover:bg-accent",
            )}
          >
            <DriveFileFormatBadge file={file} />
            <span className={cn("min-w-0 flex-1 truncate", KUDOS_FILE_NAME)}>{file.name}</span>
            <span className={cn("max-w-[88px] flex-shrink-0 truncate", KUDOS_FILE_META)}>
              {file.folder}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DriveFileGrid({ files, activeFileId, contextFileIds = [], onSelectFile, loading, folderName }) {
  return (
    <div
      className="max-h-[280px] overflow-y-auto overscroll-y-contain px-2 pb-2"
      role="listbox"
      aria-label={`Files in ${folderName}`}
    >
      {loading && files.length === 0 && (
        <p className={cn("px-1 py-2", KUDOS_CAPTION)}>Syncing folder from cloud storage…</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {files.map((file) => {
          const inContext = contextFileIds.includes(file.id);
          const isActive = file.id === activeFileId;
          return (
            <button
              key={file.id}
              type="button"
              role="option"
              aria-selected={isActive || inContext}
              title={file.name}
              onClick={() => onSelectFile?.(file.id)}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[6px] border text-left transition-colors",
                isActive || inContext
                  ? "border-primary bg-primary/10 ring-2 ring-primary/25"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-sm",
              )}
            >
              <div
                className="relative h-20 w-full overflow-hidden"
                style={{ background: file.thumbBg ?? "var(--muted)" }}
              >
                {file.thumbSrc ? (
                  <img
                    src={file.thumbSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <DriveFileTypeIcon extension={file.extension} />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 z-10">
                  <DriveImageFormatBadge format={gridPreviewFormat(file)} />
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-border bg-card/95 px-1.5 py-1 backdrop-blur-sm">
                <span className={cn("truncate leading-tight", KUDOS_TEMPLATE_LABEL)}>
                  {file.label ?? file.name.replace(/\.[^.]+$/, "")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function KudosDriveFileList({
  files = [],
  activeFileId,
  contextFileIds = [],
  onSelectFile,
  loading = false,
  folderName = KUDOS_DRIVE_FOLDER,
  defaultExpanded = true,
  expanded: expandedProp,
  onExpandedChange,
  className,
}) {
  const [expandedInternal, setExpandedInternal] = useState(defaultExpanded);
  const isControlled = expandedProp !== undefined;
  const expanded = isControlled ? expandedProp : expandedInternal;
  const [viewMode, setViewMode] = useState("list");

  const toggleExpanded = () => {
    const next = !expanded;
    if (isControlled) {
      onExpandedChange?.(next);
    } else {
      setExpandedInternal(next);
    }
  };

  const fileCountLabel = useMemo(() => {
    if (loading) return null;
    if (files.length === 0) return "No files in";
    return `${files.length} file${files.length === 1 ? "" : "s"} in`;
  }, [files.length, loading]);

  if (!loading && files.length === 0) return null;

  return (
    <div className={cn("border-b border-border bg-background", className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown size={14} className="flex-shrink-0 text-foreground/70" aria-hidden />
          ) : (
            <ChevronRight size={14} className="flex-shrink-0 text-foreground/70" aria-hidden />
          )}
          <Folder size={14} className="flex-shrink-0 text-primary" aria-hidden />
          <span className={cn("min-w-0 truncate", KUDOS_CAPTION, "text-foreground")}>
            {loading ? (
              <>
                Loading{" "}
                <span className="font-semibold text-foreground">{folderName}</span>…
              </>
            ) : (
              <>
                {fileCountLabel}{" "}
                <span className="font-semibold text-foreground">{folderName}</span>
              </>
            )}
          </span>
        </button>
        <DriveViewSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {expanded &&
        (viewMode === "grid" ? (
          <DriveFileGrid
            files={files}
            activeFileId={activeFileId}
            contextFileIds={contextFileIds}
            onSelectFile={onSelectFile}
            loading={loading}
            folderName={folderName}
          />
        ) : (
          <DriveFileListRows
            files={files}
            activeFileId={activeFileId}
            contextFileIds={contextFileIds}
            onSelectFile={onSelectFile}
            loading={loading}
            folderName={folderName}
          />
        ))}
    </div>
  );
}

function getDriveFileDisplayLabel(file) {
  if (file?.label) return file.label;
  const base = file?.name?.replace(/\.[^.]+$/, "") ?? "";
  if (!base) return "File";
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function KudosDriveContextChip({ file, onRemove, className }) {
  if (!file) return null;

  const displayLabel = getDriveFileDisplayLabel(file);

  return (
    <Badge
      variant="secondary"
      role="listitem"
      title={displayLabel}
      className={cn(
        "h-7 gap-0.5 rounded-md border-border py-0.5 pl-0.5 pr-0.5",
        className,
      )}
    >
      <span
        className="relative size-6 shrink-0 overflow-hidden rounded-[5px] ring-1 ring-border/40"
        style={{ background: file.thumbBg ?? "var(--muted)" }}
      >
        {file.thumbSrc ? (
          <img
            src={file.thumbSrc}
            alt={displayLabel}
            className="size-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <DriveFileTypeIcon extension={file.extension} className="h-4 min-w-4 text-[8px]" />
          </span>
        )}
      </span>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
          aria-label={`Remove ${displayLabel} from prompt context`}
          title="Remove from context"
          className="shrink-0 text-foreground/70"
        >
          <X />
        </Button>
      )}
    </Badge>
  );
}

export function KudosDriveContextStrip({ files, onRemoveFile, className }) {
  if (!files?.length) return null;

  return (
    <div
      className={cn(
        "border-b border-border bg-background px-2 py-1.5",
        className,
      )}
    >
      <div
        role="list"
        aria-label="Templates attached to your message"
        className="flex gap-1.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {files.map((file) => (
          <KudosDriveContextChip
            key={file.id}
            file={file}
            onRemove={onRemoveFile}
          />
        ))}
      </div>
    </div>
  );
}
