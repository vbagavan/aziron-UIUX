import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Cloud, LayoutGrid, List, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KUDOS_DRIVE_FOLDER } from "@/services/oneDriveTemplates";
import {
  formatFileOriginTooltip,
  getCloudProviderLogoSrc,
  summarizeOrigins,
} from "@/lib/cloudFileOrigin";
import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";
import {
  KUDOS_BADGE,
  KUDOS_CAPTION,
  KUDOS_FILE_META,
  KUDOS_FILE_NAME,
  KUDOS_TEMPLATE_LABEL,
} from "./kudosTypography";

function CloudProviderIcon({ provider, className, size = "sm" }) {
  const src = getCloudProviderLogoSrc(provider);
  const sizeClass = size === "xs" ? "size-3" : "size-3.5";

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={cn(sizeClass, "shrink-0 object-contain", className)}
    />
  );
}

function CloudProviderStack({ providers, className }) {
  const visible = providers.slice(0, 3);
  const overflow = providers.length - visible.length;

  return (
    <span className={cn("flex shrink-0 items-center", className)} aria-hidden>
      {visible.map((provider, index) => (
        <span
          key={provider}
          className={cn(
            "flex size-4 items-center justify-center rounded-full border border-background bg-card",
            index > 0 && "-ml-1.5",
          )}
          style={{ zIndex: visible.length - index }}
        >
          <CloudProviderIcon provider={provider} size="xs" />
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="-ml-1.5 flex size-4 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-semibold text-muted-foreground"
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}

function DriveListSourceIcon({ summary, loading }) {
  if (loading) {
    return <Cloud size={14} className="shrink-0 text-muted-foreground" aria-hidden />;
  }
  if (summary.providerCount === 0) {
    return <Cloud size={14} className="shrink-0 text-primary" aria-hidden />;
  }
  if (summary.providerCount === 1 && summary.singleProvider) {
    return <CloudProviderIcon provider={summary.singleProvider} className="shrink-0" />;
  }
  return <CloudProviderStack providers={summary.providers} />;
}

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

function getDriveFileDisplayLabel(file) {
  if (file?.label) return file.label;
  const base = file?.name?.replace(/\.[^.]+$/, "") ?? "";
  if (!base) return "File";
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DriveTemplateRemoveButton({ label, onRemove, className, overlay = false }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className={cn(
        overlay
          ? [
              "absolute inset-0 z-10 flex items-center justify-center rounded-[3px]",
              "bg-foreground/65 text-background",
              "opacity-0 transition-opacity",
              "group-hover:opacity-100 group-focus-within:opacity-100",
              "focus-visible:opacity-100",
              "[@media(hover:none)]:opacity-100",
            ]
          : "flex shrink-0 items-center justify-center rounded-[4px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      aria-label={`Remove ${label} from prompt`}
      title="Remove from prompt"
    >
      <X size={10} strokeWidth={2.5} aria-hidden />
    </button>
  );
}

function DriveFileRowThumb({ file, className }) {
  return (
    <span
      className={cn(
        "relative inline-block h-4 w-4 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-border/40",
        className,
      )}
      style={{ background: file.thumbBg ?? "var(--muted)" }}
      aria-hidden
    >
      {file.thumbSrc ? (
        <img
          src={file.thumbSrc}
          alt=""
          className="absolute inset-0 block h-full w-full max-h-full max-w-full object-cover object-top"
          draggable={false}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <DriveFileTypeIcon extension={file.extension} className="h-2.5 min-w-2.5 text-[6px]" />
        </span>
      )}
    </span>
  );
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

const COMPACT_LIST_ROW_CLASS =
  "flex h-7 w-full min-h-7 items-center gap-2 rounded-md px-2 text-left transition-colors";

function DriveFileCompactListRow({
  file,
  displayLabel,
  title,
  inContext,
  onSelectFile,
  onRemoveFile,
}) {
  const thumb = (
    <DriveFileRowThumb
      file={file}
      className={inContext ? "ring-2 ring-inset ring-primary" : undefined}
    />
  );

  if (inContext && onRemoveFile) {
    return (
      <div
        role="option"
        aria-selected
        title={title}
        className={cn(
          COMPACT_LIST_ROW_CLASS,
          "group gap-1 bg-primary/10 pr-1 ring-1 ring-inset ring-primary/25",
        )}
      >
        <div className="relative size-4 shrink-0">
          {thumb}
          <DriveTemplateRemoveButton
            label={displayLabel}
            overlay
            onRemove={() => onRemoveFile(file.id)}
          />
        </div>
        <button
          type="button"
          onClick={() => onSelectFile?.(file.id)}
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            KUDOS_FILE_NAME,
            "leading-4",
          )}
        >
          {displayLabel}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      role="option"
      aria-selected={false}
      title={title}
      onClick={() => onSelectFile?.(file.id)}
      className={cn(COMPACT_LIST_ROW_CLASS, "hover:bg-accent")}
    >
      {thumb}
      <span className={cn("min-w-0 flex-1 truncate", KUDOS_FILE_NAME, "leading-4")}>
        {displayLabel}
      </span>
    </button>
  );
}

function DriveFileListRows({
  files,
  activeFileId,
  contextFileIds = [],
  onSelectFile,
  onRemoveFile,
  loading,
  folderName,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "overflow-y-auto overscroll-y-contain",
        compact
          ? "flex max-h-[120px] flex-col gap-0.5 px-2 py-1"
          : "max-h-[132px] px-1.5 pb-2",
      )}
      role="listbox"
      aria-label={`Files in ${folderName}`}
    >
      {loading && files.length === 0 && (
        <p className={cn("px-2 py-2", KUDOS_CAPTION)}>
          Syncing templates from {getCloudProviderConfig("onedrive").label}…
        </p>
      )}
      {files.map((file) => {
        const inContext = contextFileIds.includes(file.id);
        const isActive = file.id === activeFileId;
        const displayLabel = compact ? getDriveFileDisplayLabel(file) : file.name;
        const title = formatFileOriginTooltip(file, displayLabel);
        const rowSelected = compact ? inContext : isActive || inContext;

        if (compact) {
          return (
            <DriveFileCompactListRow
              key={file.id}
              file={file}
              displayLabel={displayLabel}
              title={title}
              inContext={inContext}
              onSelectFile={onSelectFile}
              onRemoveFile={onRemoveFile}
            />
          );
        }

        return (
          <button
            key={file.id}
            type="button"
            role="option"
            aria-selected={rowSelected}
            title={title}
            onClick={() => onSelectFile?.(file.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left transition-colors",
              rowSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent",
            )}
          >
            <DriveFileFormatBadge file={file} />
            <span className={cn("min-w-0 flex-1 truncate", KUDOS_FILE_NAME)}>
              {displayLabel}
            </span>
            <span className={cn("max-w-[88px] flex-shrink-0 truncate", KUDOS_FILE_META)}>
              {file.folder}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DriveFileCollapsedStrip({
  files,
  contextFileIds = [],
  onSelectFile,
  onRemoveFile,
}) {
  const attachedFiles = files.filter((file) => contextFileIds.includes(file.id));

  if (attachedFiles.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto overscroll-x-contain px-2 pb-0 leading-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Templates attached to your message"
    >
      {attachedFiles.map((file) => {
        const label = getDriveFileDisplayLabel(file);
        const tooltip = formatFileOriginTooltip(file, label);
        return (
          <div
            key={file.id}
            role="listitem"
            className="group relative inline-flex shrink-0 items-center leading-none rounded-[5px] border border-primary/40 bg-primary/10 p-px"
          >
            <button
              type="button"
              title={tooltip}
              onClick={() => onSelectFile?.(file.id)}
              className="flex size-4 items-center justify-center rounded-[3px] p-0 leading-none"
            >
              <DriveFileRowThumb file={file} className="ring-2 ring-inset ring-primary" />
            </button>
            {onRemoveFile && (
              <DriveTemplateRemoveButton
                label={label}
                overlay
                onRemove={() => onRemoveFile(file.id)}
              />
            )}
          </div>
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
        <p className={cn("px-1 py-2", KUDOS_CAPTION)}>
          Syncing templates from {getCloudProviderConfig("onedrive").label}…
        </p>
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
  onRemoveFile,
  loading = false,
  folderName = KUDOS_DRIVE_FOLDER,
  defaultExpanded = true,
  expanded: expandedProp,
  onExpandedChange,
  compact = false,
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

  const originSummary = useMemo(() => summarizeOrigins(files), [files]);

  const fileCountLabel = useMemo(() => {
    if (loading) return null;
    if (files.length === 0) return compact ? "No templates in" : "No files in";
    if (compact) {
      return `${files.length} template${files.length === 1 ? "" : "s"} ·`;
    }
    return `${files.length} file${files.length === 1 ? "" : "s"} in`;
  }, [files.length, loading, compact]);

  const headerLocationLabel =
    !loading && originSummary.headerLocationLabel
      ? originSummary.headerLocationLabel
      : folderName;

  const headerTooltip = useMemo(() => {
    if (loading || files.length === 0) return undefined;
    if (!originSummary.isHomogeneous) {
      return `${originSummary.fileCount} templates across ${originSummary.sourceCount} cloud sources`;
    }
    const first = files[0];
    return formatFileOriginTooltip(first, getDriveFileDisplayLabel(first));
  }, [files, loading, originSummary]);

  if (!loading && files.length === 0) return null;

  return (
    <div
      className={cn(
        "bg-background",
        compact ? "border-0" : "border-b border-border",
        compact && !expanded && "pb-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-8 items-center gap-2",
          compact ? "px-2 py-1" : "px-3 py-2",
          compact && expanded && "border-b border-border/60",
        )}
      >
        <button
          type="button"
          onClick={toggleExpanded}
          title={headerTooltip}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown size={14} className="flex-shrink-0 text-foreground/70" aria-hidden />
          ) : (
            <ChevronRight size={14} className="flex-shrink-0 text-foreground/70" aria-hidden />
          )}
          <DriveListSourceIcon summary={originSummary} loading={loading} />
          <span className={cn("min-w-0 truncate", KUDOS_CAPTION, "text-foreground")}>
            {loading ? (
              <>
                Loading{" "}
                <span className="font-semibold text-foreground">{folderName}</span>…
              </>
            ) : (
              <>
                {fileCountLabel}{" "}
                <span className="font-semibold text-foreground">{headerLocationLabel}</span>
              </>
            )}
          </span>
        </button>
        {!compact && (
          <DriveViewSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
        )}
      </div>

      {compact && !expanded && !loading && contextFileIds.length > 0 && (
        <DriveFileCollapsedStrip
          files={files}
          contextFileIds={contextFileIds}
          onSelectFile={onSelectFile}
          onRemoveFile={onRemoveFile}
        />
      )}

      {expanded &&
        (viewMode === "grid" && !compact ? (
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
            onRemoveFile={onRemoveFile}
            loading={loading}
            folderName={folderName}
            compact={compact}
          />
        ))}
    </div>
  );
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
