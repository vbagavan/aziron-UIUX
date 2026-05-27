import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, LayoutGrid, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KUDOS_DRIVE_FOLDER } from "@/services/oneDriveTemplates";

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
        "inline-flex h-[18px] min-w-[26px] flex-shrink-0 items-center justify-center rounded-[3px] px-1 text-[9px] font-bold leading-none",
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
        "inline-flex h-[18px] min-w-[28px] flex-shrink-0 items-center justify-center rounded-[3px] px-1 text-[9px] font-bold leading-none",
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
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60",
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
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60",
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
        <p className="px-2 py-2 text-xs text-muted-foreground">Syncing folder from cloud storage…</p>
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
              isActive || inContext ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted",
            )}
          >
            <DriveFileFormatBadge file={file} />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">{file.name}</span>
            <span className="max-w-[88px] flex-shrink-0 truncate text-[11px] text-muted-foreground">
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
        <p className="px-1 py-2 text-xs text-muted-foreground">Syncing folder from cloud storage…</p>
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
                <span className="truncate text-[9px] font-medium leading-tight text-foreground">
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
  className,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState("list");

  const fileCountLabel = useMemo(() => {
    if (loading) return null;
    if (files.length === 0) return "No files in";
    return `${files.length} file${files.length === 1 ? "" : "s"} in`;
  }, [files.length, loading]);

  if (!loading && files.length === 0) return null;

  return (
    <div className={cn("border-b border-border bg-muted/30", className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight size={14} className="flex-shrink-0 text-muted-foreground" aria-hidden />
          )}
          <Folder size={14} className="flex-shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 truncate text-xs text-muted-foreground">
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

export function KudosDriveContextChip({ file, onRemove, className }) {
  if (!file) return null;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/60 py-1 pl-2 pr-1 text-xs",
        className,
      )}
    >
      <DriveFileFormatBadge file={file} />
      <span className="truncate font-medium text-foreground">{file.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
          aria-label={`Remove ${file.name} from prompt context`}
          title="Remove from context"
          className="flex size-5 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </span>
  );
}
