import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Files,
  Search,
  Upload,
  LayoutGrid,
  List,
  Filter,
  Check,
  X,
  Plus,
  Database,
  ChevronDown,
  FileText,
  SortDesc,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { usePermissions } from "@/hooks/usePermissions";
import { FileSourceBadge } from "@/components/features/knowledge/FileSourceBadge";
import { FileStatusSummaryBar } from "@/components/features/knowledge/FileStatusSummaryBar";
import { FileSyncStatusIndicator } from "@/components/features/knowledge/FileSyncStatusIndicator";
import { getFileTypeConfig } from "@/components/features/knowledge/hubFileTypeConfig";
import { HubFileThumbnail } from "@/components/features/knowledge/HubFileThumbnail";
import { DocumentsUploadDialog } from "@/components/features/documents/DocumentsUploadDialog";
import { DocumentReaderDrawer } from "@/components/features/documents/DocumentReaderDrawer";
import { DocumentsHeaderBreadcrumb } from "@/components/features/documents/DocumentsHeaderBreadcrumb";
import { KnowledgeHubCreateDialog } from "@/components/features/knowledge/KnowledgeHubCreateDialog";
import { KnowledgeHubSearchPicker } from "@/components/common/KnowledgeHubSearchPicker";
import { Toast, useToast } from "@/components/ui/Toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { getHubLinksForDocument } from "@/data/documentLibrary";
import { TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docKey(doc) {
  if (doc.isLibraryDocument) return `lib:${doc.id}`;
  return `${doc.hubId}:${doc.id}`;
}

function formatFileSize(kb) {
  if (!kb) return null;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const SORT_OPTIONS = [
  { id: "recent",   label: "Recent first"  },
  { id: "name",     label: "Name (A–Z)"    },
  { id: "size",     label: "Largest first" },
  { id: "hub",      label: "Hub link"      },
];

const SOURCE_FILTER_OPTIONS = [
  { id: "all",   label: "All sources"  },
  { id: "local", label: "Local upload" },
  { id: "cloud", label: "Cloud import" },
];

// ─── Badges ───────────────────────────────────────────────────────────────────

function HubBadge({ hubName }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
      <Database className="size-2.5 shrink-0" />
      <span className="truncate max-w-[96px]">{hubName}</span>
    </span>
  );
}

function HubLinksBadge({ hubLinks = [] }) {
  if (hubLinks.length === 0) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        Standalone
      </span>
    );
  }
  if (hubLinks.length === 1) {
    return <HubBadge hubName={hubLinks[0].hubName} />;
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
      <Database className="size-2.5 shrink-0" />
      {hubLinks.length} hubs
    </span>
  );
}

// ─── File card (grid view) ────────────────────────────────────────────────────

function DocFileCard({ hubId, file, hubLinks, selectionMode, selected, onToggleSelect, onOpen, canEdit, onSyncFile }) {
  const cfg = getFileTypeConfig(file.type);
  const sizeLabel = formatFileSize(file.sizeKb);

  function handleActivate() {
    if (selectionMode) onToggleSelect(docKey(file));
    else onOpen?.(file);
  }

  return (
    <article
      className={cn(
        "group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-1 pb-2 transition-all duration-150",
        selectionMode && selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/25"
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
      {/* Thumbnail — compact cover, centered in grid cell */}
      <div className="relative mx-auto aspect-[3/4] w-[92px] overflow-hidden rounded-lg sm:w-[104px]">
        <HubFileThumbnail
          hubId={hubId}
          file={file}
          cfg={cfg}
          iconSize="size-5"
          imgClassName="p-1"
        />

        {/* Selection indicator — visible in selection mode */}
        {selectionMode && (
          <div
            className={cn(
              "absolute left-2 top-2 z-10 flex size-5 items-center justify-center rounded-full border shadow-sm transition-all duration-150",
              selected
                ? "border-primary bg-primary text-primary-foreground scale-100 opacity-100"
                : "border-border bg-background/95 text-foreground opacity-100",
            )}
            aria-hidden
          >
            {selected && <Check className="size-2.5" strokeWidth={3} />}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="min-w-0 w-full px-0.5 text-center">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground" title={file.name}>
          {file.name}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/70">
          {cfg.label}{sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
        <div className="mt-1.5 flex min-w-0 flex-col items-center gap-1.5">
          <div className="flex min-w-0 flex-wrap justify-center gap-1">
            <FileSourceBadge file={file} size="sm" />
            <HubLinksBadge hubLinks={hubLinks} />
          </div>
          <FileSyncStatusIndicator
            file={file}
            compact
            canActivate={canEdit && file.source === "cloud"}
            onActivate={onSyncFile ? () => onSyncFile(file) : undefined}
            className="justify-center"
          />
        </div>
      </div>
    </article>
  );
}

// ─── File row (list view) ─────────────────────────────────────────────────────

function DocFileRow({ hubId, file, hubLinks, selectionMode, selected, onToggleSelect, onOpen, canEdit, onSyncFile }) {
  const cfg = getFileTypeConfig(file.type);
  const Icon = cfg.icon;
  const sizeLabel = formatFileSize(file.sizeKb);

  function handleActivate() {
    if (selectionMode) onToggleSelect(docKey(file));
    else onOpen?.(file);
  }

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150",
        selectionMode && selected
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/25"
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
      {/* Checkbox — visible in selection mode */}
      {selectionMode && (
        <div
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border transition-all duration-150",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 bg-background",
          )}
          aria-hidden
        >
          {selected && <Check className="size-2.5" strokeWidth={3} />}
        </div>
      )}

      {/* Type icon */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/[0.04]",
          cfg.bg,
        )}
      >
        <Icon className={cn("size-3.5", cfg.fg)} strokeWidth={1.75} />
      </div>

      {/* Name + badges */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <FileSourceBadge file={file} size="sm" />
          <HubLinksBadge hubLinks={hubLinks} />
        </div>
        <div className="mt-1">
          <FileSyncStatusIndicator
            file={file}
            compact
            canActivate={canEdit && file.source === "cloud"}
            onActivate={onSyncFile ? () => onSyncFile(file) : undefined}
          />
        </div>
      </div>

      {/* Meta — right side */}
      <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
        {sizeLabel && <span className="hidden sm:block">{sizeLabel}</span>}
        <span className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[10px] md:block">
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkActionBar({
  count,
  hubs,
  canCreateHub,
  canEdit,
  linkTargetHub,
  onClearSelection,
  onCreateHub,
  onAddToHub,
  onRemove,
}) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-2xl ring-1 ring-black/[0.08]">
        {/* Count pill */}
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
          {count === 1 ? "file" : "files"} selected
        </span>

        <div className="mx-1.5 h-4 w-px bg-border" />

        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-3" />
          Clear
        </button>

        <button
          type="button"
          onClick={onCreateHub}
          disabled={!canCreateHub}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Create Knowledge Hub
        </button>

        {canEdit ? (
          <>
            {linkTargetHub ? (
              <button
                type="button"
                onClick={() => onAddToHub(linkTargetHub.id)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Link to {linkTargetHub.name}
              </button>
            ) : (
              <KnowledgeHubSearchPicker
                hubs={hubs}
                placement="top"
                align="center"
                onSelect={(hub) => onAddToHub(hub.id)}
                onRequestCreate={canCreateHub ? onCreateHub : undefined}
                renderTrigger={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    <Database className="size-3.5" />
                    Add to Hub
                    <ChevronDown className="size-3 opacity-70" />
                  </button>
                )}
              />
            )}

            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15"
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyDocuments({ onUpload, onBrowseHubs, canUpload, canCreateHub }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Files className="size-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">No documents yet</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Upload from your computer or import from cloud storage. Link documents to{" "}
          {KNOWLEDGE_TERMS.hubs.toLowerCase()} anytime.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {canUpload ? (
          <Button size="sm" onClick={onUpload} className="gap-1.5">
            <Upload className="size-4" />
            Upload {KNOWLEDGE_TERMS.documents}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            You don&apos;t have permission to upload documents. Contact your administrator for access.
          </p>
        )}
        {canCreateHub && onBrowseHubs ? (
          <Button type="button" size="sm" variant="outline" onClick={onBrowseHubs}>
            Create {KNOWLEDGE_TERMS.hubSingular}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocumentsPage({ onNavigate }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkHubId = searchParams.get("linkHub");
  const { can } = usePermissions();
  const {
    hubs,
    documents,
    addHub,
    addDocumentsToLibrary,
    linkDocumentsToHub,
    linkDocumentToHub,
    unlinkDocumentFromHub,
    removeDocumentFromLibrary,
    deleteHubFile,
    copyHubFilesToHub,
    getDocumentHubLinks,
    downloadCloudFileToHub,
    downloadCloudFileToLibrary,
  } = useKnowledgeHubs();
  const { toasts, showToast, dismissToast } = useToast();
  const canCreate = can("knowledge.create");
  const canEdit = can("knowledge.edit");

  const [viewMode, setViewMode]         = useState("grid");
  const [searchQuery, setSearchQuery]   = useState("");
  const [sortBy, setSortBy]             = useState("recent");
  const [filterSource, setFilterSource] = useState("all");
  const [filterType, setFilterType]     = useState("all");
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [readerDoc, setReaderDoc]       = useState(null);
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [linkAfterHubCreate, setLinkAfterHubCreate] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const linkTargetHub = useMemo(
    () => hubs.find((h) => String(h.id) === String(linkHubId)),
    [hubs, linkHubId],
  );

  useEffect(() => {
    if (!linkHubId || !linkTargetHub) return;
    setReaderDoc(null);
    setSelectionMode(true);
  }, [linkHubId, linkTargetHub]);

  // ── Flat document list: library + legacy hub-only files ───────────────────

  const allDocs = useMemo(() => {
    const docs = [];

    for (const doc of documents) {
      const hubLinks = getHubLinksForDocument(doc.id, hubs);
      docs.push({
        ...doc,
        isLibraryDocument: true,
        hubId: "library",
        hubLinks,
      });
    }

    for (const hub of hubs) {
      const visible = (hub.userFiles ?? []).filter(
        (f) => !(hub.hiddenFileIds ?? []).includes(f.id),
      );
      for (const file of visible) {
        if (file.libraryDocumentId) continue;
        docs.push({
          ...file,
          isLibraryDocument: false,
          hubId: hub.id,
          hubLinks: [{ hubId: hub.id, hubFileId: file.id, hubName: hub.name }],
        });
      }
    }

    return docs;
  }, [documents, hubs]);

  const typeOptions = useMemo(() => {
    const types = new Set(allDocs.map((d) => d.type).filter(Boolean));
    return [
      { id: "all", label: "All types" },
      ...[...types].sort().map((t) => ({
        id: t,
        label: getFileTypeConfig(t).label ?? t,
      })),
    ];
  }, [allDocs]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = allDocs.filter((d) => {
      const hubLabel = d.hubLinks?.map((l) => l.hubName).join(" ") ?? "";
      if (q && !d.name?.toLowerCase().includes(q) && !hubLabel.toLowerCase().includes(q))
        return false;
      if (filterSource === "local" && d.source !== "user" && d.source !== "upload") return false;
      if (filterSource === "cloud" && d.source !== "cloud") return false;
      if (filterType !== "all" && d.type !== filterType) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sortBy === "size") return (b.sizeKb ?? 0) - (a.sizeKb ?? 0);
      if (sortBy === "hub") {
        const aHub = a.hubLinks?.[0]?.hubName ?? "";
        const bHub = b.hubLinks?.[0]?.hubName ?? "";
        const hubCmp = aHub.localeCompare(bHub);
        if (hubCmp !== 0) return hubCmp;
        return (a.name ?? "").localeCompare(b.name ?? "");
      }
      return (b.uploadedAt ?? b.created ?? "").localeCompare(a.uploadedAt ?? a.created ?? "");
    });
  }, [allDocs, searchQuery, filterSource, filterType, sortBy]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getSelectedDocRefs() {
    return filteredDocs
      .filter((d) => selectedKeys.has(docKey(d)))
      .map((d) =>
        d.isLibraryDocument
          ? { type: "library", documentId: d.id }
          : { type: "hub", hubId: d.hubId, fileId: d.id },
      );
  }

  function toggleSelect(key) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearSelection() {
    setSelectedKeys(new Set());
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    clearSelection();
    if (linkHubId) {
      const next = new URLSearchParams(searchParams);
      next.delete("linkHub");
      setSearchParams(next, { replace: true });
    }
  }

  function handleOpenDoc(doc) {
    setReaderDoc(doc);
    exitSelectionMode();
  }

  function handleCloseReader() {
    setReaderDoc(null);
  }

  function selectAllVisible() {
    setSelectedKeys(new Set(filteredDocs.map(docKey)));
  }

  function enterSelectionMode() {
    setReaderDoc(null);
    setSelectionMode(true);
  }

  async function handleFilesAdded({ files = [], cloudImport, cloudImports, skippedLocal = 0 } = {}) {
    try {
      const result = await addDocumentsToLibrary({ files, cloudImport, cloudImports });
      const count = result?.added?.length ?? 0;
      const skipped = (result?.rejected ?? 0) + (skippedLocal ?? 0);
      if (count === 0) {
        showToast({
          title: skipped > 0 ? "Nothing uploaded" : "Nothing uploaded",
          description:
            skipped > 0
              ? `${skipped} file${skipped === 1 ? "" : "s"} skipped (invalid or too large).`
              : "No valid files were added to your library.",
          variant: skipped > 0 ? "destructive" : "default",
        });
        return;
      }
      const skipNote =
        skipped > 0 ? ` ${skipped} file${skipped === 1 ? "" : "s"} skipped (too large or invalid).` : "";
      showToast({
        title: "Documents uploaded",
        description: `${count} document${count === 1 ? "" : "s"} added to your library.${skipNote}`,
        variant: "success",
      });
    } catch {
      showToast({
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleAddToHub(hubId) {
    const refs = getSelectedDocRefs();
    if (!refs.length) return;
    try {
      const libraryIds = refs.filter((r) => r.type === "library").map((r) => r.documentId);
      const hubRefs = refs.filter((r) => r.type === "hub");

      let linked = 0;
      if (libraryIds.length) {
        const { linked: linkedIds } = await linkDocumentsToHub(libraryIds, hubId);
        linked += linkedIds.length;
      }
      if (hubRefs.length) {
        const { copied } = await copyHubFilesToHub(hubRefs, hubId);
        linked += copied.length;
      }

      const hub = hubs.find((h) => String(h.id) === String(hubId));
      if (linked === 0) {
        showToast({
          title: "Already linked",
          description: `Selected documents are already in "${hub?.name ?? "this hub"}".`,
          variant: "default",
        });
      } else {
        showToast({
          title: "Added to hub",
          description: `${linked} document${linked === 1 ? "" : "s"} linked to "${hub?.name ?? "hub"}".`,
          variant: "success",
        });
      }
      exitSelectionMode();
    } catch {
      showToast({
        title: "Could not add documents",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleHubCreated(payload) {
    try {
      const hub = await addHub(payload);
      const refs = getSelectedDocRefs();
      const libraryIds = refs.filter((r) => r.type === "library").map((r) => r.documentId);
      const hubRefs = refs.filter((r) => r.type === "hub");
      if (linkAfterHubCreate) libraryIds.push(linkAfterHubCreate);
      const uniqueIds = [...new Set(libraryIds)];

      let linkedCount = 0;
      if (uniqueIds.length > 0) {
        const { linked } = await linkDocumentsToHub(uniqueIds, hub.id);
        linkedCount += linked.length;
      }
      if (hubRefs.length > 0) {
        const { copied } = await copyHubFilesToHub(
          hubRefs.map((r) => ({ hubId: r.hubId, fileId: r.fileId })),
          hub.id,
        );
        linkedCount += copied.length;
      }

      if (linkedCount > 0) {
        showToast({
          title: "Knowledge Hub created",
          description: `"${payload.name}" was created with ${linkedCount} linked document${linkedCount === 1 ? "" : "s"}.`,
          variant: "success",
        });
      } else {
        showToast({
          title: "Knowledge Hub created",
          description: `"${payload.name}" is ready. Link documents from the Documents page when needed.`,
          variant: "success",
        });
      }
      setCreateHubOpen(false);
      setLinkAfterHubCreate(null);
      exitSelectionMode();
    } catch {
      showToast({
        title: "Could not create hub",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleLinkDocToHub(documentId, hubId) {
    const result = linkDocumentToHub(documentId, hubId);
    const hub = hubs.find((h) => String(h.id) === String(hubId));
    if (result.linked) {
      showToast({
        title: "Linked to hub",
        description: `Document added to "${hub?.name ?? "hub"}".`,
        variant: "success",
      });
    } else if (result.reason === "already_linked") {
      showToast({
        title: "Already linked",
        description: `This document is already in "${hub?.name ?? "this hub"}".`,
        variant: "default",
      });
    } else {
      showToast({
        title: "Could not link document",
        description: "The document or Knowledge Hub could not be found.",
        variant: "destructive",
      });
    }
  }

  async function handleUnlinkDocFromHub(documentId, hubId) {
    unlinkDocumentFromHub(documentId, hubId);
    const hub = hubs.find((h) => String(h.id) === String(hubId));
    showToast({
      title: "Removed from hub",
      description: `Document unlinked from "${hub?.name ?? "hub"}". It remains in your library.`,
      variant: "success",
    });
  }

  async function handleLinkHubFileToHub(sourceHubId, fileId, targetHubId) {
    if (Number(sourceHubId) === Number(targetHubId)) {
      showToast({
        title: "Already linked",
        description: "This document is already in that Knowledge Hub.",
        variant: "default",
      });
      return;
    }
    try {
      const { copied } = await copyHubFilesToHub(
        [{ hubId: sourceHubId, fileId }],
        targetHubId,
      );
      const hub = hubs.find((h) => String(h.id) === String(targetHubId));
      if (copied.length === 0) {
        showToast({
          title: "Already linked",
          description: `This document is already in "${hub?.name ?? "this hub"}".`,
          variant: "default",
        });
      } else {
        showToast({
          title: "Added to hub",
          description: `Document copied to "${hub?.name ?? "hub"}".`,
          variant: "success",
        });
      }
    } catch {
      showToast({
        title: "Could not add document",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  function requestBulkRemove() {
    const refs = getSelectedDocRefs();
    if (!refs.length) return;
    const libraryCount = refs.filter((r) => r.type === "library").length;
    const hubCount = refs.filter((r) => r.type === "hub").length;
    setRemoveConfirm({ mode: "bulk", refs, libraryCount, hubCount });
  }

  function requestRemoveActiveDocument() {
    if (!activeReaderDoc || !canEdit) return;
    if (activeReaderDoc.isLibraryDocument) {
      setRemoveConfirm({
        mode: "single-library",
        documentId: activeReaderDoc.id,
        name: activeReaderDoc.name,
      });
    } else {
      setRemoveConfirm({
        mode: "single-hub",
        hubId: activeReaderDoc.hubId,
        fileId: activeReaderDoc.id,
        name: activeReaderDoc.name,
      });
    }
  }

  function executeRemoveConfirm() {
    if (!removeConfirm) return;

    if (removeConfirm.mode === "bulk") {
      let removedLibrary = 0;
      let removedHub = 0;
      for (const ref of removeConfirm.refs ?? []) {
        if (ref.type === "library") {
          const result = removeDocumentFromLibrary(ref.documentId);
          if (result.removed) removedLibrary += 1;
        } else {
          deleteHubFile(ref.hubId, ref.fileId);
          removedHub += 1;
        }
      }
      const total = removedLibrary + removedHub;
      showToast({
        title: "Documents removed",
        description:
          total === 0
            ? "No documents were removed."
            : `${total} document${total === 1 ? "" : "s"} removed from your library.`,
        variant: total > 0 ? "success" : "default",
      });
      exitSelectionMode();
    } else if (removeConfirm.mode === "single-library") {
      const result = removeDocumentFromLibrary(removeConfirm.documentId);
      if (result.removed) {
        showToast({
          title: "Removed from library",
          description: `"${result.name}" was deleted from your document library.`,
          variant: "success",
        });
        handleCloseReader();
      }
    } else if (removeConfirm.mode === "single-hub") {
      deleteHubFile(removeConfirm.hubId, removeConfirm.fileId);
      showToast({
        title: "Removed from hub",
        description: `"${removeConfirm.name}" was removed from the Knowledge Hub.`,
        variant: "success",
      });
      handleCloseReader();
    }

    setRemoveConfirm(null);
  }

  async function handleRemoveHubFile(hubId, fileId) {
    deleteHubFile(hubId, fileId);
    const hub = hubs.find((h) => Number(h.id) === Number(hubId));
    showToast({
      title: "Removed from hub",
      description: `Document removed from "${hub?.name ?? "hub"}".`,
      variant: "success",
    });
    handleCloseReader();
  }

  async function handleSyncFile(file) {
    if (!canEdit || file?.source !== "cloud") return;

    if (file.isLibraryDocument) {
      const result = await downloadCloudFileToLibrary(file.id);
      if (result.ok) {
        showToast({
          title: "File synced",
          description: `"${result.fileName ?? file.name}" downloaded and indexed locally.`,
          variant: "success",
        });
      } else if (result.error !== "Already downloading") {
        showToast({ title: "Sync failed", description: result.error, variant: "error" });
      }
      return;
    }

    const result = await downloadCloudFileToHub(file.hubId, file.id);
    if (result.ok) {
      showToast({
        title: "File synced",
        description: `"${result.fileName ?? file.name}" downloaded and indexed locally.`,
        variant: "success",
      });
    } else if (result.error !== "Already downloading") {
      showToast({ title: "Sync failed", description: result.error, variant: "error" });
    }
  }

  const selectedCount = selectedKeys.size;

  const activeReaderDoc = useMemo(() => {
    if (!readerDoc) return null;
    if (readerDoc.isLibraryDocument) {
      const fresh = documents.find((d) => d.id === readerDoc.id);
      const hubLinks = getDocumentHubLinks(readerDoc.id);
      return {
        ...(fresh ?? readerDoc),
        isLibraryDocument: true,
        hubId: "library",
        hubLinks,
      };
    }
    const hub = hubs.find((h) => Number(h.id) === Number(readerDoc.hubId));
    const file = hub?.userFiles?.find((f) => f.id === readerDoc.id);
    if (!file) return { ...readerDoc, hubLinks: readerDoc.hubLinks ?? [] };
    return {
      ...file,
      isLibraryDocument: false,
      hubId: readerDoc.hubId,
      hubLinks: [{ hubId: hub.id, hubFileId: file.id, hubName: hub.name }],
    };
  }, [readerDoc, documents, hubs, getDocumentHubLinks]);

  // Toolbar trigger base class (avoids nested button by not using <Button> inside <DropdownMenuTrigger>)
  const triggerBase = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    TOOLBAR_CONTROL_CLASS,
    "gap-1.5",
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar activePage="documents" onNavigate={onNavigate} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader activePage="documents" onNavigate={onNavigate}>
          {readerDoc && activeReaderDoc ? (
            <DocumentsHeaderBreadcrumb
              fileName={activeReaderDoc.name}
              hubLinks={activeReaderDoc.hubLinks ?? []}
              onDocumentsClick={handleCloseReader}
              onHubClick={(hubId) => navigate(`/knowledge/${hubId}`)}
            />
          ) : null}
        </AppHeader>

        <main className="flex flex-1 flex-col overflow-hidden">

          {/* Page header — hidden in reader view */}
          {!readerDoc && (
          <div className="flex-shrink-0 px-6 py-4">
            <PageHeader
              title={KNOWLEDGE_TERMS.documents}
              description={KNOWLEDGE_TERMS.documentsPageDescription}
            >
              {canCreate && (
                <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
                  <Upload className="size-4" />
                  Upload
                </Button>
              )}
            </PageHeader>
          </div>
          )}

          {/* Toolbar — hidden in reader view */}
          {!readerDoc && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-y border-border bg-muted/20 px-6 py-2">

            {/* Search */}
            <div className="relative min-w-[180px] flex-1 max-w-[280px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn(TOOLBAR_CONTROL_CLASS, "pl-8")}
                placeholder="Search documents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Source filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className={triggerBase}>
                <Filter className="size-3.5" />
                {SOURCE_FILTER_OPTIONS.find((o) => o.id === filterSource)?.label}
                <ChevronDown className="size-3 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {SOURCE_FILTER_OPTIONS.map((o) => (
                  <DropdownMenuItem key={o.id} onClick={() => setFilterSource(o.id)} className="gap-2">
                    {filterSource === o.id
                      ? <Check className="size-3.5 text-primary" />
                      : <span className="size-3.5" />}
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Type filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className={triggerBase}>
                <FileText className="size-3.5" />
                {typeOptions.find((o) => o.id === filterType)?.label ?? "All types"}
                <ChevronDown className="size-3 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-60 w-44 overflow-y-auto">
                {typeOptions.map((o) => (
                  <DropdownMenuItem key={o.id} onClick={() => setFilterType(o.id)} className="gap-2">
                    {filterType === o.id
                      ? <Check className="size-3.5 text-primary" />
                      : <span className="size-3.5" />}
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger className={triggerBase}>
                <SortDesc className="size-3.5" />
                {SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Sort"}
                <ChevronDown className="size-3 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {SORT_OPTIONS.map((o) => (
                  <DropdownMenuItem key={o.id} onClick={() => setSortBy(o.id)} className="gap-2">
                    {sortBy === o.id
                      ? <Check className="size-3.5 text-primary" />
                      : <span className="size-3.5" />}
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Spacer + count + view toggle */}
            <div className="ml-auto flex items-center gap-3">
              {allDocs.length > 0 && !readerDoc && (
                <p className="text-xs text-muted-foreground">
                  {filteredDocs.length === allDocs.length
                    ? `${allDocs.length} file${allDocs.length !== 1 ? "s" : ""}`
                    : `${filteredDocs.length} of ${allDocs.length}`}
                </p>
              )}

              {allDocs.length > 0 && canEdit && !readerDoc && (
                <Button
                  type="button"
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                  onClick={() => {
                    if (selectionMode) exitSelectionMode();
                    else enterSelectionMode();
                  }}
                >
                  {selectionMode ? "Done" : "Select"}
                </Button>
              )}

              {!readerDoc && (
              <div className="flex items-center rounded-full border border-border/60 bg-background p-0.5 shadow-sm">
                {[
                  { id: "grid", icon: LayoutGrid, label: "Grid view" },
                  { id: "list", icon: List,       label: "List view" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={viewMode === id}
                    onClick={() => setViewMode(id)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full transition-all duration-150",
                      viewMode === id
                        ? "bg-muted text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={viewMode === id ? 2.25 : 1.75} />
                  </button>
                ))}
              </div>
              )}
            </div>
          </div>
          )}

          {selectionMode && !readerDoc && (
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/30 px-6 py-2">
              <span className="text-xs font-medium text-foreground">
                {linkTargetHub
                  ? `Select documents to link to "${linkTargetHub.name}"`
                  : selectedCount === 0
                    ? "Click or tap documents to select"
                    : `${selectedCount} selected`}
              </span>
              {filteredDocs.length > 0 && selectedCount < filteredDocs.length && (
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
              <button
                type="button"
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                onClick={exitSelectionMode}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Content area */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {readerDoc ? (
              <DocumentReaderDrawer
                file={activeReaderDoc}
                hubLinks={activeReaderDoc?.hubLinks ?? []}
                hubs={hubs}
                canEdit={canEdit}
                canCreate={canCreate}
                onNotify={showToast}
                onNavigateToHub={(hubId) => navigate(`/knowledge/${hubId}`)}
                onLinkToHub={handleLinkDocToHub}
                onLinkHubFileToHub={handleLinkHubFileToHub}
                onUnlinkFromHub={handleUnlinkDocFromHub}
                onRemoveHubFile={handleRemoveHubFile}
                onRemoveFromLibrary={requestRemoveActiveDocument}
                onCreateHub={() => {
                  if (!canCreate) return;
                  if (activeReaderDoc?.isLibraryDocument) {
                    setLinkAfterHubCreate(activeReaderDoc.id);
                  }
                  setCreateHubOpen(true);
                }}
                onClose={handleCloseReader}
              />
              ) : (
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5",
                selectionMode && selectedCount > 0 && "pb-24",
              )}
            >
              {allDocs.length > 0 ? (
                <FileStatusSummaryBar files={allDocs} title="Documents" className="mb-5 shrink-0" />
              ) : null}
              {allDocs.length === 0 ? (
                <EmptyDocuments
                  canUpload={canCreate}
                  canCreateHub={canCreate}
                  onUpload={() => canCreate && setUploadOpen(true)}
                  onBrowseHubs={() => navigate("/knowledge")}
                />
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground">No documents match your filters.</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1"
                    onClick={() => { setSearchQuery(""); setFilterSource("all"); setFilterType("all"); }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                  {filteredDocs.map((doc) => (
                    <DocFileCard
                      key={docKey(doc)}
                      hubId={doc.hubId}
                      file={doc}
                      hubLinks={doc.hubLinks}
                      selectionMode={selectionMode}
                      selected={selectedKeys.has(docKey(doc))}
                      onToggleSelect={toggleSelect}
                      onOpen={handleOpenDoc}
                      canEdit={canEdit}
                      onSyncFile={handleSyncFile}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredDocs.map((doc) => (
                    <DocFileRow
                      key={docKey(doc)}
                      hubId={doc.hubId}
                      file={doc}
                      hubLinks={doc.hubLinks}
                      selectionMode={selectionMode}
                      selected={selectedKeys.has(docKey(doc))}
                      onToggleSelect={toggleSelect}
                      onOpen={handleOpenDoc}
                      canEdit={canEdit}
                      onSyncFile={handleSyncFile}
                    />
                  ))}
                </div>
              )}
            </div>
            )}

          </div>
        </main>
      </div>

      {/* Floating bulk action bar */}
      {selectionMode && selectedCount > 0 && (
        <BulkActionBar
          count={selectedCount}
          hubs={hubs}
          canCreateHub={canCreate}
          canEdit={canEdit}
          linkTargetHub={linkTargetHub}
          onClearSelection={clearSelection}
          onCreateHub={() => setCreateHubOpen(true)}
          onAddToHub={handleAddToHub}
          onRemove={requestBulkRemove}
        />
      )}

      <DocumentsUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onFilesAdded={handleFilesAdded}
      />

      <KnowledgeHubCreateDialog
        open={createHubOpen}
        onOpenChange={(open) => {
          setCreateHubOpen(open);
          if (!open) setLinkAfterHubCreate(null);
        }}
        onCreated={handleHubCreated}
      />

      <div
        className={cn(
          "fixed right-4 z-[99999] flex flex-col gap-2",
          selectionMode && selectedCount > 0 ? "bottom-24" : "bottom-4",
        )}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            variant={t.variant ?? "default"}
            actionLabel={t.actionLabel}
            onAction={t.onAction}
            onDismiss={() => dismissToast(t.id)}
          />
        ))}
      </div>

      <Dialog open={Boolean(removeConfirm)} onOpenChange={(open) => !open && setRemoveConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {removeConfirm?.mode === "bulk" ? "Remove selected documents?" : "Remove document?"}
            </DialogTitle>
            <DialogDescription>
              {removeConfirm?.mode === "bulk" ? (
                <>
                  {removeConfirm.libraryCount > 0
                    ? `${removeConfirm.libraryCount} library file${removeConfirm.libraryCount === 1 ? "" : "s"} will be deleted permanently. `
                    : null}
                  {removeConfirm.hubCount > 0
                    ? `${removeConfirm.hubCount} hub-managed file${removeConfirm.hubCount === 1 ? "" : "s"} will be removed from their hub${removeConfirm.hubCount === 1 ? "" : "s"}.`
                    : null}
                </>
              ) : removeConfirm?.mode === "single-library" ? (
                `"${removeConfirm.name}" will be deleted from your library. Hub links will be removed. This cannot be undone.`
              ) : (
                `"${removeConfirm?.name}" will be removed from its Knowledge Hub. It will no longer appear in Documents.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={executeRemoveConfirm}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
