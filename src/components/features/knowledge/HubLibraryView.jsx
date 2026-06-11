import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Cloud,
  Files,
  Filter,
  LayoutGrid,
  List,
  BookOpen,
  Search,
  SortDesc,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatDisplayDate } from "@/data/knowledgeHubs";
import { HubFileThumbnail } from "@/components/features/knowledge/HubFileThumbnail";
import { getFileTypeConfig } from "@/components/features/knowledge/hubFileTypeConfig";
import { getHubFileDisplayFields } from "@/components/features/knowledge/hubFileMetadata";
import { HubAssetDetailView } from "@/components/features/knowledge/HubAssetDetailView";
import { useCloudThumbnailPrefetch } from "@/components/features/knowledge/useCloudThumbnailPrefetch";

const VIEW_OPTIONS = [
  { id: "grid",   label: "Grid",   icon: LayoutGrid },
  { id: "list",   label: "List",   icon: List       },
  { id: "detail", label: "Catalog", icon: BookOpen  },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Recent"    },
  { id: "name",   label: "Name (A-Z)" },
  { id: "size",   label: "Size"      },
];

const FILE_TYPE_SECTION_ORDER = [
  "PDF", "Word", "PowerPoint", "Excel", "CSV",
  "Image", "Video", "Audio", "eBook",
  "Text", "Markdown", "HTML",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatFileSize(kb) {
  if (kb == null || kb === 0) return null;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function groupFilesByType(files) {
  const groups = new Map();
  for (const file of files) {
    const key = file.type ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  }
  const ordered = [];
  for (const type of FILE_TYPE_SECTION_ORDER) {
    if (groups.has(type)) ordered.push([type, groups.get(type)]);
  }
  for (const [type, list] of groups) {
    if (!FILE_TYPE_SECTION_ORDER.includes(type)) ordered.push([type, list]);
  }
  return ordered;
}

function LibraryViewSwitcher({ viewMode, onViewModeChange }) {
  return (
    <div className="hub-view-switcher flex items-center rounded-full border border-border/60 bg-muted/20 p-0.5 shadow-sm">
      {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={`${label} view`}
          aria-pressed={viewMode === id}
          onClick={() => onViewModeChange(id)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-all duration-200",
            viewMode === id
              ? "bg-background text-foreground shadow-sm ring-1 ring-black/[0.04]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" strokeWidth={viewMode === id ? 2 : 1.75} />
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FileCard (grid view)
// ─────────────────────────────────────────────────────────────────────────────

function FileCard({ hubId, file, selectionMode, selected, highlighted, cardRef, onToggleSelect, onOpen }) {
  const cfg = getFileTypeConfig(file.type);
  const sizeLabel = formatFileSize(file.sizeKb);
  const { title, author } = getHubFileDisplayFields(file);

  function handleActivate() {
    if (selectionMode) onToggleSelect(file.id);
    else onOpen?.(file);
  }

  return (
    <article
      ref={cardRef}
      className={cn(
        "hub-library-card group flex cursor-pointer flex-col gap-3",
        selected && selectionMode && "hub-library-card-selected",
        highlighted && "hub-library-card-selected",
      )}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleActivate();
        }
      }}
      aria-pressed={selectionMode ? selected : undefined}
    >
      <div className="hub-library-cover relative aspect-[3/4] w-full overflow-hidden rounded-xl">
        <HubFileThumbnail hubId={hubId} file={file} cfg={cfg} />

        {selectionMode && (
          <div
            className={cn(
              "absolute left-2.5 top-2.5 z-10 flex size-5 items-center justify-center rounded-full border transition-all duration-200",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background/95 shadow-sm",
            )}
            aria-hidden
          >
            {selected && <Check className="size-2.5" />}
          </div>
        )}

        {file.source === "cloud" && (
          <div className={cn("absolute z-10", selectionMode ? "right-2.5 top-2.5" : "right-2.5 top-2.5")}>
            <span className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
              <Cloud className="size-2.5" /> Cloud
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 px-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground" title={title}>
          {title}
        </p>
        {author && (
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{author}</p>
        )}
        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
          {cfg.label}{sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
      </div>
    </article>
  );
}

function FileTypeSection({ type, files, hubId, selectionMode, selected, highlightFileId, cardRefs, onToggleSelect, onOpen }) {
  const cfg = getFileTypeConfig(type);
  const Icon = cfg.icon;
  const label = type === "Other" ? "Other files" : type;
  const useCompactList = files.length <= 2;

  return (
    <section aria-label={`${label} files`} className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/[0.04]", cfg.bg)}>
            <Icon className={cn("size-4", cfg.fg)} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{label}</h3>
            <p className="text-[11px] text-muted-foreground">
              {files.length} {files.length === 1 ? "volume" : "volumes"}
            </p>
          </div>
        </div>
      </div>
      {useCompactList ? (
        <div className="flex flex-col gap-1">
          {files.map((file) => (
            <FileListRow
              key={file.id}
              hubId={hubId}
              file={file}
              selectionMode={selectionMode}
              selected={selected.has(file.id)}
              highlighted={highlightFileId === file.id}
              rowRef={(el) => {
                if (el) cardRefs.current[file.id] = el;
                else delete cardRefs.current[file.id];
              }}
              onToggleSelect={onToggleSelect}
              onOpen={onOpen}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {files.map((file) => (
            <FileCard
              key={file.id}
              hubId={hubId}
              file={file}
              selectionMode={selectionMode}
              selected={selected.has(file.id)}
              highlighted={highlightFileId === file.id}
              cardRef={(el) => {
                if (el) cardRefs.current[file.id] = el;
                else delete cardRefs.current[file.id];
              }}
              onToggleSelect={onToggleSelect}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FileListRow (list view)
// ─────────────────────────────────────────────────────────────────────────────

function FileListRow({ hubId, file, selectionMode, selected, highlighted, rowRef, onToggleSelect, onOpen }) {
  const cfg = getFileTypeConfig(file.type);
  const sizeLabel = formatFileSize(file.sizeKb);
  const { title, fileLabel } = getHubFileDisplayFields(file);

  function handleActivate() {
    if (selectionMode) onToggleSelect(file.id);
    else onOpen?.(file);
  }

  return (
    <div
      ref={rowRef}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
        selectionMode && selected
          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
          : highlighted
            ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
            : "border-transparent hover:border-border hover:bg-muted/40",
      )}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleActivate();
        }
      }}
      aria-pressed={selectionMode ? selected : undefined}
    >
      {selectionMode && (
        <div
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background",
          )}
          aria-hidden
        >
          {selected && <Check className="size-2.5" />}
        </div>
      )}

      <div className="hub-library-cover relative size-12 shrink-0 overflow-hidden rounded-lg">
        <HubFileThumbnail hubId={hubId} file={file} cfg={cfg} iconSize="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{title}</p>
        {(fileLabel || file.name !== title) && (
          <p className="truncate text-[11px] text-muted-foreground">{fileLabel ?? file.name}</p>
        )}
      </div>

      <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.accent)}>
        {cfg.label}
      </span>

      {sizeLabel && (
        <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground">{sizeLabel}</span>
      )}

      <span className="hidden w-24 shrink-0 text-right text-[11px] text-muted-foreground sm:block">
        {formatDisplayDate(file.uploadedAt)}
      </span>

      {file.source === "cloud" && (
        <Cloud className="size-3.5 shrink-0 text-sky-500" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function HubLibraryView({
  hubId,
  hubName,
  allFiles = [],
  canEdit = true,
  onUploadFiles,
  onDeleteFile,
  onPreviewFile,
  searchQuery,
  onSearchQueryChange,
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortByChange,
  highlightFileId = null,
  onHighlightSeen,
}) {
  const [selected, setSelected] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [catalogFile, setCatalogFile] = useState(null);
  const cardRefs = useRef({});

  useCloudThumbnailPrefetch(hubId, allFiles);

  useEffect(() => {
    if (!highlightFileId) return;
    const el = cardRefs.current[highlightFileId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const timer = window.setTimeout(() => onHighlightSeen?.(), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightFileId, allFiles, onHighlightSeen]);

  const availableTypes = useMemo(() => {
    const types = new Set(allFiles.map((f) => f.type).filter(Boolean));
    return [...types].sort();
  }, [allFiles]);

  const displayFiles = useMemo(() => {
    let list = [...allFiles];
    const q = (searchQuery ?? "").trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) => f.name.toLowerCase().includes(q) || (f.type ?? "").toLowerCase().includes(q),
      );
    }
    if (filterType && filterType !== "all") {
      list = list.filter((f) => f.type === filterType);
    }
    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "size") {
      list.sort((a, b) => (b.sizeKb ?? 0) - (a.sizeKb ?? 0));
    } else {
      list.sort((a, b) => {
        const aTime = Date.parse(a.uploadedAt ?? "") || 0;
        const bTime = Date.parse(b.uploadedAt ?? "") || 0;
        return bTime - aTime;
      });
    }
    return list;
  }, [allFiles, searchQuery, filterType, sortBy]);

  const filesByType = useMemo(() => groupFilesByType(displayFiles), [displayFiles]);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function clearSelection() { setSelected(new Set()); }

  function exitSelectionMode() {
    setSelectionMode(false);
    clearSelection();
  }

  function openCatalog(file) {
    exitSelectionMode();
    setCatalogFile(file);
    setViewMode("detail");
  }

  function handleViewModeChange(mode) {
    if (mode === "detail") {
      if (!catalogFile && displayFiles.length > 0) {
        setCatalogFile(displayFiles[0]);
      }
      if (displayFiles.length === 0) return;
    }
    exitSelectionMode();
    setViewMode(mode);
  }

  function selectAllVisible() {
    setSelected(new Set(displayFiles.map((f) => f.id)));
  }

  const activeSort = SORT_OPTIONS.find((s) => s.id === (sortBy ?? "recent")) ?? SORT_OPTIONS[0];
  const hasActiveFilter = filterType && filterType !== "all";
  const anyFiltersActive = (searchQuery ?? "").trim() !== "" || hasActiveFilter;
  const activeCatalogFile = catalogFile ?? displayFiles[0] ?? null;

  if (viewMode === "detail") {
    return (
      <div className="hub-showcase-canvas flex h-full w-full min-h-0 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={() => handleViewModeChange("grid")}
          >
            <ArrowLeft className="size-3.5" />
            Library
          </Button>
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {anyFiltersActive
              ? `${displayFiles.length} of ${allFiles.length} · Catalog`
              : `${hubName || "Library"} · Catalog`}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {canEdit && (
              <Button type="button" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={onUploadFiles}>
                <Upload className="size-3.5" /> Upload
              </Button>
            )}
            <LibraryViewSwitcher viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
        </div>

        {displayFiles.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">No files to display.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden w-full">
            <HubAssetDetailView
              file={activeCatalogFile}
              hubId={hubId}
              hubName={hubName}
              allFiles={displayFiles}
              canEdit={canEdit}
              onNavigate={(f) => setCatalogFile(f)}
              onPreview={onPreviewFile}
              onDelete={canEdit && onDeleteFile ? (f) => {
                onDeleteFile(f);
                if (f.id === activeCatalogFile?.id) {
                  const next = displayFiles.find((x) => x.id !== f.id);
                  setCatalogFile(next ?? null);
                }
              } : undefined}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-5 py-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={searchQuery ?? ""}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search your library…"
            className="h-9 border-border/50 bg-background/80 pl-9 text-xs shadow-none"
          />
          {(searchQuery ?? "") !== "" && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant={hasActiveFilter ? "default" : "outline"} size="sm" className="h-8 gap-1.5 px-3 text-xs" />}
          >
            <Filter className="size-3.5" />
            {hasActiveFilter ? filterType : "Type"}
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-[11px]">Filter by type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFilterTypeChange("all")}>
              <span className="flex-1">All types</span>
              {(!filterType || filterType === "all") && <Check className="ml-2 size-3.5" />}
            </DropdownMenuItem>
            {availableTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => onFilterTypeChange(type)}>
                <span className="flex-1">{type}</span>
                {filterType === type && <Check className="ml-2 size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs" />}
          >
            <SortDesc className="size-3.5" />
            {activeSort.label}
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel className="text-[11px]">Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.id} onClick={() => onSortByChange(opt.id)}>
                <span className="flex-1">{opt.label}</span>
                {(sortBy ?? "recent") === opt.id && <Check className="ml-2 size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {canEdit && (
          <Button
            type="button"
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => {
              if (selectionMode) exitSelectionMode();
              else setSelectionMode(true);
            }}
          >
            {selectionMode ? "Done" : "Select"}
          </Button>
        )}

        {canEdit && (
          <Button type="button" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={onUploadFiles}>
            <Upload className="size-3.5" /> Upload
          </Button>
        )}

        <LibraryViewSwitcher viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </div>

      {selectionMode && (
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/30 px-5 py-2">
          <span className="text-xs font-medium text-foreground">
            {selected.size === 0
              ? "Tap files to select"
              : `${selected.size} selected`}
          </span>
          {displayFiles.length > 0 && selected.size < displayFiles.length && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={selectAllVisible}
            >
              Select all
            </Button>
          )}
          {canEdit && selected.size > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                selected.forEach((id) => {
                  const file = allFiles.find((f) => f.id === id);
                  if (file) onDeleteFile?.(file);
                });
                exitSelectionMode();
              }}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          )}
          <button
            type="button"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={exitSelectionMode}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Filter status (sections show per-type counts in grid view) ── */}
      {allFiles.length > 0 && (anyFiltersActive || viewMode === "list") && (
        <div className="flex shrink-0 items-center justify-between px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {anyFiltersActive
              ? `${displayFiles.length} of ${allFiles.length} files`
              : `${displayFiles.length} file${displayFiles.length !== 1 ? "s" : ""}`}
          </p>
          {anyFiltersActive && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { onSearchQueryChange(""); onFilterTypeChange("all"); }}
            >
              <X className="size-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div className="hub-library-canvas min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-2 sm:px-8">
        {allFiles.length > 0 && displayFiles.length > 0 && viewMode === "grid" && !anyFiltersActive && (
          <header className="hub-library-hero mb-12 mt-6 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {hubName || "Knowledge Hub"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem]">
              Library
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Click any file to open its catalog page. Use Select to choose multiple files.
            </p>
          </header>
        )}

        {allFiles.length === 0 ? (
          <div className="flex h-full items-center justify-center py-16">
            <Empty>
              <EmptyMedia><Files className="size-12 text-muted-foreground/40" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No files yet</EmptyTitle>
                <EmptyDescription>Upload files or connect a cloud source to get started.</EmptyDescription>
              </EmptyHeader>
              {canEdit && (
                <EmptyContent>
                  <Button type="button" size="sm" onClick={onUploadFiles}>
                    <Upload className="mr-1.5 size-3.5" /> Upload files
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : displayFiles.length === 0 ? (
          <div className="flex h-full items-center justify-center py-16">
            <Empty>
              <EmptyMedia><Search className="size-12 text-muted-foreground/40" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No files match</EmptyTitle>
                <EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" variant="outline" size="sm" onClick={() => { onSearchQueryChange(""); onFilterTypeChange("all"); }}>
                  Clear filters
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : viewMode === "list" ? (
          /* ── List view ── */
          <div className="flex flex-col gap-0.5 pt-1">
            {/* Header row */}
            <div className="flex items-center gap-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {selectionMode && <div className="size-5 shrink-0" />}
              <div className="size-11 shrink-0" />
              <span className="flex-1">Name</span>
              <span className="w-14 shrink-0">Type</span>
              <span className="w-16 shrink-0 text-right">Size</span>
              <span className="hidden w-24 shrink-0 text-right sm:block">Added</span>
            </div>
            {displayFiles.map((file) => (
              <FileListRow
                key={file.id}
                hubId={hubId}
                file={file}
                selectionMode={selectionMode}
                selected={selected.has(file.id)}
                highlighted={highlightFileId === file.id}
                rowRef={(el) => {
                  if (el) cardRefs.current[file.id] = el;
                  else delete cardRefs.current[file.id];
                }}
                onToggleSelect={toggleSelect}
                onOpen={openCatalog}
              />
            ))}
          </div>
        ) : (
          /* ── Grid view ── */
          <div className="flex flex-col gap-14 pt-1">
            {filesByType.map(([type, files]) => (
              <FileTypeSection
                key={type}
                type={type}
                files={files}
                hubId={hubId}
                selectionMode={selectionMode}
                selected={selected}
                highlightFileId={highlightFileId}
                cardRefs={cardRefs}
                onToggleSelect={toggleSelect}
                onOpen={openCatalog}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
