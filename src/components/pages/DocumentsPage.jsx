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
  MoreHorizontal,
  RefreshCw,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { usePermissions } from "@/hooks/usePermissions";
import { FileStatusSummaryBar } from "@/components/features/knowledge/FileStatusSummaryBar";
import { FileSyncStatusIndicator } from "@/components/features/knowledge/FileSyncStatusIndicator";
import { SourceBadge } from "@/components/features/knowledge/SourceBadge";
import {
  getSourceMetricColumnLabel,
  getSourceMetricDisplay,
  getSourceProviderLabel,
  isSingleHubSource,
  resolveSourceCategory,
} from "@/lib/sourceCategories";
import { getFileTypeConfig, getTypeFilterLabel, normalizeDocumentType } from "@/components/features/knowledge/hubFileTypeConfig";
import { HubFileThumbnail } from "@/components/features/knowledge/HubFileThumbnail";
import { AddSourceWizard } from "@/components/features/sources/AddSourceWizard";
import { DocumentReaderDrawer } from "@/components/features/documents/DocumentReaderDrawer";
import { DatabaseDetailView } from "@/components/features/databases/DatabaseDetailView";
import { ApiDetailView } from "@/components/features/apis/ApiDetailView";
import { DocumentsCategoryTabBar } from "@/components/features/documents/DocumentsCategoryTabBar";
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
import { getHubDisplayName } from "@/lib/hubDisplay";
import { LinkingHelpDialog } from "@/components/features/knowledge/LinkingHelpDialog";
import { getHubLinksForDocument } from "@/data/documentLibrary";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOLBAR_CONTROL_CLASS, PAGINATION_CONTROL_CLASS } from "@/lib/listToolbar";
import { paginateSlice } from "@/lib/pagination";
import { resolveFileLifecycleStatus } from "@/lib/fileSyncStatus";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOCS_PAGE_SIZE = 20;
const DOCS_VIEW_KEY = "documents_view_mode";

function docKey(doc) {
  if (doc.isLibraryDocument) return `lib:${doc.id}`;
  return `${doc.hubId}:${doc.id}`;
}

function formatFileSize(kb) {
  if (!kb) return null;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getDocDisplayName(file) {
  return file?.metadata?.title ?? file?.name ?? "Untitled";
}

function truncateMiddle(str, maxLen = 36) {
  if (!str || str.length <= maxLen) return str;
  const half = Math.floor((maxLen - 1) / 2);
  return `${str.slice(0, half)}…${str.slice(-half)}`;
}

function loadSavedViewMode() {
  try {
    const saved = localStorage.getItem(DOCS_VIEW_KEY);
    if (saved === "grid" || saved === "list") return saved;
  } catch {
    /* ignore */
  }
  return null;
}

/** Table footer pagination — matches Knowledge Hub list. */
function DocsTablePagination({ page, totalPages, totalItems, onPageChange }) {
  if (totalItems === 0) return null;
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
        {totalPages > 1 ? (
          <>
            {totalItems} document{totalItems !== 1 ? "s" : ""} · page {currentPage} of {totalPages}
          </>
        ) : (
          <>
            {totalItems} document{totalItems !== 1 ? "s" : ""}
          </>
        )}
      </p>
      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent className="gap-0.5">
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.max(1, currentPage - 1));
                }}
                className={cn(
                  PAGINATION_CONTROL_CLASS,
                  currentPage === 1 && "pointer-events-none opacity-40",
                )}
                aria-disabled={currentPage === 1}
                text="Prev"
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <PaginationItem key={pg}>
                <PaginationLink
                  isActive={pg === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(pg);
                  }}
                  className={cn(PAGINATION_CONTROL_CLASS, "w-11")}
                >
                  {pg}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.min(totalPages, currentPage + 1));
                }}
                className={cn(
                  PAGINATION_CONTROL_CLASS,
                  currentPage === totalPages && "pointer-events-none opacity-40",
                )}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      </div>
    </div>
  );
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

function formatHubDisplayName(hubName) {
  return getHubDisplayName(hubName);
}

function HubBadge({ hubName }) {
  const displayName = formatHubDisplayName(hubName);
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex min-w-0 max-w-full" />}>
        <Badge variant="outline" className="max-w-[120px]">
          <Database data-icon="inline-start" aria-hidden />
          <span className="truncate">{displayName}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{displayName}</TooltipContent>
    </Tooltip>
  );
}

function HubLinksBadge({ hubLinks = [], record }) {
  if (hubLinks.length === 0) {
    return <Badge variant="secondary">Not linked to a hub</Badge>;
  }

  const names = hubLinks.map((link) => formatHubDisplayName(link.hubName)).filter(Boolean);
  const singleHubOnly = isSingleHubSource(record);

  if (hubLinks.length === 1 || singleHubOnly) {
    return <HubBadge hubName={names[0]} />;
  }

  const linkedSummary = names.join(", ");

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex min-w-0 max-w-full items-center gap-1" />}>
        <HubBadge hubName={names[0]} />
        <Badge variant="secondary" className="shrink-0">
          +{hubLinks.length - 1}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        Linked to {hubLinks.length} hubs: {linkedSummary}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── File card (grid view) ────────────────────────────────────────────────────

function DocFileCard({ hubId, file, hubLinks, selectionMode, selected, highlighted, onToggleSelect, onOpen, canEdit, onSyncFile }) {
  const cfg = getFileTypeConfig(file.type);
  const sizeLabel = formatFileSize(file.sizeKb);
  const displayName = getDocDisplayName(file);

  function handleActivate() {
    if (selectionMode) onToggleSelect(docKey(file));
    else onOpen?.(file);
  }

  return (
    <Card
      data-doc-id={file.id}
      className={cn(
        "group cursor-pointer border-transparent py-0 shadow-none transition-all duration-150 hover:border-border hover:bg-muted/40",
        selectionMode && selected && "border-primary bg-primary/5 ring-2 ring-primary/25",
        highlighted && "border-primary ring-2 ring-primary/40 motion-safe:animate-pulse",
      )}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      aria-label={selectionMode ? `${selected ? "Deselect" : "Select"} ${displayName}` : `Open ${displayName}`}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleActivate();
        }
      }}
      aria-pressed={selectionMode ? selected : undefined}
    >
      <CardContent className="flex flex-col items-center gap-2 p-2 pb-3">
      <div className="relative mx-auto aspect-[3/4] w-[92px] overflow-hidden rounded-lg sm:w-[104px]">
        <HubFileThumbnail
          hubId={hubId}
          file={file}
          cfg={cfg}
          iconSize="size-5"
          imgClassName="p-1"
        />

        {!selectionMode && (
          <div className="absolute right-1.5 top-1.5 z-10">
            <FileSyncStatusIndicator
              file={file}
              fileName={displayName}
              compact
              iconOnly
              canActivate={canEdit && file.source === "cloud"}
              onActivate={onSyncFile ? () => onSyncFile(file) : undefined}
            />
          </div>
        )}

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

      <div className="min-w-0 w-full px-0.5 text-center">
        <p className="text-xs font-medium leading-snug text-foreground" title={displayName}>
          {truncateMiddle(displayName, 28)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {cfg.label}{sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
        <div className="mt-1.5 flex min-w-0 justify-center">
          <HubLinksBadge hubLinks={hubLinks} record={file} />
        </div>
      </div>
      </CardContent>
    </Card>
  );
}

// ─── File row (list view) ─────────────────────────────────────────────────────

function DocumentsListTable({
  docs,
  selectionMode,
  selectedKeys,
  highlightedIds,
  canEdit,
  metricColumnLabel = "Size",
  onToggleSelect,
  onOpen,
  onSyncFile,
  onUnlinkFromHub,
  onRequestRemove,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {selectionMode ? <TableHead className="w-10" /> : null}
          <TableHead className="hidden w-12 text-center sm:table-cell">Status</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Source</TableHead>
          <TableHead className="hidden sm:table-cell">Hubs</TableHead>
          <TableHead className="hidden sm:table-cell">Type</TableHead>
          <TableHead className="hidden text-right sm:table-cell">{metricColumnLabel}</TableHead>
          {!selectionMode ? <TableHead className="w-10 sm:table-cell" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((doc) => (
          <DocFileRow
            key={docKey(doc)}
            hubId={doc.hubId}
            file={doc}
            hubLinks={doc.hubLinks}
            selectionMode={selectionMode}
            selected={selectedKeys.has(docKey(doc))}
            highlighted={highlightedIds?.has(doc.id) || highlightedIds?.has(doc.libraryDocumentId)}
            onToggleSelect={onToggleSelect}
            onOpen={onOpen}
            canEdit={canEdit}
            onSyncFile={onSyncFile}
            onUnlinkFromHub={onUnlinkFromHub}
            onRequestRemove={onRequestRemove}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function DocFileRow({
  hubId,
  file,
  hubLinks,
  selectionMode,
  selected,
  highlighted,
  onToggleSelect,
  onOpen,
  canEdit,
  onSyncFile,
  onUnlinkFromHub,
  onRequestRemove,
}) {
  const cfg = getFileTypeConfig(file.type);
  const Icon = cfg.icon;
  const sizeLabel = getSourceMetricDisplay(file).label;
  const displayName = getDocDisplayName(file);
  const sourceLabel = getSourceProviderLabel(file);
  const isCloud = file.source === "cloud";
  const hasHubActions = hubLinks?.length > 0;

  function handleActivate() {
    if (selectionMode) onToggleSelect(docKey(file));
    else onOpen?.(file);
  }

  function stopRowClick(e) {
    e.stopPropagation();
  }

  return (
    <TableRow
      data-doc-id={file.id}
      data-state={selected ? "selected" : undefined}
      className={cn("cursor-pointer", highlighted && "bg-primary/5 ring-2 ring-inset ring-primary/40")}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleActivate();
        }
      }}
      tabIndex={0}
      aria-pressed={selectionMode ? selected : undefined}
    >
      {selectionMode ? (
        <TableCell className="w-10">
          <div
            className={cn(
              "flex size-4 items-center justify-center rounded border",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-background",
            )}
            aria-hidden
          >
            {selected && <Check className="size-2.5" strokeWidth={3} />}
          </div>
        </TableCell>
      ) : null}

      <TableCell className="hidden text-center sm:table-cell">
        <div className="flex justify-center" onClick={stopRowClick}>
          <FileSyncStatusIndicator
            file={file}
            fileName={displayName}
            compact
            iconOnly
            canActivate={canEdit && isCloud}
            onActivate={onSyncFile ? () => onSyncFile(file) : undefined}
          />
        </div>
      </TableCell>

      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-border/60 sm:hidden", cfg.bg)}>
            <Icon className={cn("size-3.5", cfg.fg)} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground" title={displayName}>
              {truncateMiddle(displayName, 48)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:hidden">
              <SourceBadge record={file} size="sm" />
              <HubLinksBadge hubLinks={hubLinks} record={file} />
              <FileSyncStatusIndicator
                file={file}
                fileName={displayName}
                compact
                iconOnly
                canActivate={canEdit && isCloud}
                onActivate={onSyncFile ? () => onSyncFile(file) : undefined}
              />
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" onClick={stopRowClick} />}>
            <SourceBadge record={file} size="sm" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">{sourceLabel}</p>
            {file.connectionName ? (
              <p className="text-muted-foreground">{file.connectionName}</p>
            ) : null}
            {isCloud ? (
              <p className="mt-1 text-muted-foreground">
                Use row actions to sync or reload from cloud storage.
              </p>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <HubLinksBadge hubLinks={hubLinks} record={file} />
      </TableCell>

      <TableCell className="hidden text-muted-foreground sm:table-cell">{cfg.label}</TableCell>

      <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
        {sizeLabel ?? "—"}
      </TableCell>

      {!selectionMode ? (
        <TableCell className="w-10 p-0 text-right" onClick={stopRowClick}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label={`Actions for ${displayName}`}
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onOpen?.(file)}>
                  <ExternalLink data-icon="inline-start" aria-hidden />
                  Open in reader
                </DropdownMenuItem>
                {canEdit && isCloud && onSyncFile ? (
                  <DropdownMenuItem onClick={() => onSyncFile(file)}>
                    <RefreshCw data-icon="inline-start" aria-hidden />
                    Sync from cloud
                  </DropdownMenuItem>
                ) : null}
                {canEdit && file.isLibraryDocument && hasHubActions
                  ? hubLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.hubId}
                        onClick={() => onUnlinkFromHub?.(file.id, link.hubId)}
                      >
                        <Unlink data-icon="inline-start" aria-hidden />
                        Unlink from {link.hubName}
                      </DropdownMenuItem>
                    ))
                  : null}
                {canEdit && onRequestRemove ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onRequestRemove(file)}
                    >
                      <Trash2 data-icon="inline-start" aria-hidden />
                      {file.isLibraryDocument ? "Remove from library" : "Remove from hub"}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      ) : null}
    </TableRow>
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
      <Card className="pointer-events-auto border-border py-0 shadow-2xl">
        <CardContent className="flex items-center gap-2 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Badge className="size-5 justify-center rounded-full p-0 text-xs">
            {count}
          </Badge>
          {count === 1 ? "file" : "files"} selected
        </span>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onClearSelection}>
          <X data-icon="inline-start" aria-hidden />
          Clear
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={onCreateHub}
          disabled={!canCreateHub}
        >
          <Plus data-icon="inline-start" aria-hidden />
          Create Knowledge Hub
        </Button>

        {canEdit ? (
          <>
            {linkTargetHub ? (
              <Button type="button" size="sm" className="h-8 text-xs" onClick={() => onAddToHub(linkTargetHub.id)}>
                Link to {linkTargetHub.name}
              </Button>
            ) : (
              <KnowledgeHubSearchPicker
                hubs={hubs}
                placement="top"
                align="center"
                onSelect={(hub) => onAddToHub(hub.id)}
                onRequestCreate={canCreateHub ? onCreateHub : undefined}
                renderTrigger={({ toggle }) => (
                  <Button type="button" size="sm" className="h-8 text-xs" onClick={toggle}>
                    <Database data-icon="inline-start" aria-hidden />
                    Add to Hub
                    <ChevronDown data-icon="inline-end" className="opacity-70" aria-hidden />
                  </Button>
                )}
              />
            )}

            <Button type="button" variant="destructive" size="sm" className="h-8 text-xs" onClick={onRemove}>
              <Trash2 data-icon="inline-start" aria-hidden />
              Remove
            </Button>
          </>
        ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyDocuments({ onUpload, onBrowseHubs, canUpload, canCreateHub }) {
  return (
    <Empty className="flex-1 border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Files aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          Upload from your computer or import from cloud storage. Link documents to{" "}
          {KNOWLEDGE_TERMS.hubs.toLowerCase()} anytime.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {canUpload ? (
          <Button
            type="button"
            className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
            onClick={onUpload}
          >
            <Upload data-icon="inline-start" aria-hidden />
            {KNOWLEDGE_TERMS.addSources}
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
      </EmptyContent>
    </Empty>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocumentsPage({
  onNavigate,
  embedded = false,
  onRequestTab,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkHubId = searchParams.get("linkHub");
  const highlightParam = searchParams.get("highlight");
  const highlightIds = useMemo(() => {
    if (!highlightParam) return new Set();
    return new Set(highlightParam.split(",").map((id) => id.trim()).filter(Boolean));
  }, [highlightParam]);
  const { can } = usePermissions();
  const {
    hubs,
    documents,
    addHub,
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

  const categoryParam = searchParams.get("category");
  const validCategories = new Set(["all", "files", "dbs", "apis"]);

  const [viewMode, setViewMode]         = useState(() => loadSavedViewMode() ?? "list");
  const [docsPage, setDocsPage]         = useState(1);
  const [searchQuery, setSearchQuery]   = useState("");
  const [sortBy, setSortBy]             = useState("recent");
  const [filterSource, setFilterSource] = useState("all");
  const [filterCategory, setFilterCategoryState] = useState(() =>
    validCategories.has(categoryParam) ? categoryParam : "all",
  );
  const [filterType, setFilterType]     = useState("all");
  const [filterStatus, setFilterStatus] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [readerDoc, setReaderDoc]       = useState(null);
  const [wizardOpen, setWizardOpen]     = useState(false);
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [linkAfterHubCreate, setLinkAfterHubCreate] = useState(null);
  const [linkingHelpOpen, setLinkingHelpOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const linkTargetHub = useMemo(
    () => hubs.find((h) => String(h.id) === String(linkHubId)),
    [hubs, linkHubId],
  );

  function setFilterCategory(id) {
    setFilterCategoryState(id);
    setDocsPage(1);
    const next = new URLSearchParams(searchParams);
    if (id === "all") next.delete("category");
    else next.set("category", id);
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    const fromUrl = ["all", "files", "dbs", "apis"].includes(categoryParam) ? categoryParam : "all";
    setFilterCategoryState((prev) => (prev !== fromUrl ? fromUrl : prev));
  }, [categoryParam]);

  useEffect(() => {
    if (!linkHubId) return;
    if (!linkTargetHub) {
      if (hubs.length > 0) {
        showToast({
          title: "Hub not found",
          description: "That Knowledge Hub link is invalid or was removed.",
          variant: "destructive",
        });
        const next = new URLSearchParams(searchParams);
        next.delete("linkHub");
        setSearchParams(next, { replace: true });
      }
      return;
    }
    setReaderDoc(null);
    setSelectionMode(true);
  }, [linkHubId, linkTargetHub, hubs.length, searchParams, setSearchParams, showToast]);

  useEffect(() => {
    setDocsPage(1);
  }, [searchQuery, filterSource, filterCategory, filterType, filterStatus, sortBy]);

  // ── Flat document list: library + legacy hub-only files ───────────────────

  const allDocs = useMemo(() => {
    const docs = [];

    for (const doc of documents) {
      const scanned = getHubLinksForDocument(doc.id, hubs, documents);
      const hubLinks = scanned.length > 0 ? scanned : (doc.hubLinks ?? []);
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

  useEffect(() => {
    if (loadSavedViewMode() !== null) return;
    if (allDocs.length === 0) return;
    setViewMode(allDocs.length > 20 ? "list" : "grid");
  }, [allDocs.length]);

  function handleViewModeChange(mode) {
    setViewMode(mode);
    try {
      localStorage.setItem(DOCS_VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  const typeOptions = useMemo(() => {
    const byType = new Map();
    for (const doc of allDocs) {
      if (!doc.type) continue;
      const id = normalizeDocumentType(doc.type);
      if (!byType.has(id)) {
        byType.set(id, getTypeFilterLabel(doc.type));
      }
    }
    return [
      { id: "all", label: "All types" },
      ...[...byType.entries()]
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([id, label]) => ({ id, label })),
    ];
  }, [allDocs]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = allDocs.filter((d) => {
      const hubLabel = d.hubLinks?.map((l) => l.hubName).join(" ") ?? "";
      const displayName = getDocDisplayName(d).toLowerCase();
      if (
        q
        && !displayName.includes(q)
        && !d.name?.toLowerCase().includes(q)
        && !hubLabel.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filterSource === "local" && d.source !== "user" && d.source !== "upload") return false;
      if (filterSource === "cloud" && d.source !== "cloud") return false;
      if (filterCategory !== "all" && resolveSourceCategory(d) !== filterCategory) return false;
      if (filterType !== "all" && normalizeDocumentType(d.type) !== filterType) return false;
      if (filterStatus) {
        const status = resolveFileLifecycleStatus(d);
        if (filterStatus === "local") {
          if (d.source !== "user" && d.source !== "upload") return false;
        } else if (filterStatus === "processing") {
          if (status !== "processing" && status !== "syncing") return false;
        } else if (status !== filterStatus) {
          return false;
        }
      }
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
  }, [allDocs, searchQuery, filterSource, filterCategory, filterType, filterStatus, sortBy]);

  const docsPagination = useMemo(
    () => paginateSlice(filteredDocs, docsPage, DOCS_PAGE_SIZE),
    [filteredDocs, docsPage],
  );

  useEffect(() => {
    if (highlightIds.size === 0) return undefined;

    const firstHighlighted = filteredDocs.find(
      (doc) => highlightIds.has(doc.id) || highlightIds.has(doc.libraryDocumentId),
    );
    if (firstHighlighted) {
      const index = filteredDocs.findIndex(
        (doc) => doc.id === firstHighlighted.id,
      );
      if (index >= 0) {
        const targetPage = Math.floor(index / DOCS_PAGE_SIZE) + 1;
        setDocsPage(targetPage);
      }
      window.requestAnimationFrame(() => {
        document
          .querySelector(`[data-doc-id="${firstHighlighted.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("highlight");
      setSearchParams(next, { replace: true });
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [highlightParam, filteredDocs, searchParams, setSearchParams, highlightIds.size]);

  function clearAllFilters() {
    setSearchQuery("");
    setFilterSource("all");
    setFilterCategory("all");
    setFilterType("all");
    setFilterStatus(null);
    setDocsPage(1);
  }

  const metricColumnLabel = getSourceMetricColumnLabel(filterCategory);

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
  }

  function handleCloseReader() {
    setReaderDoc(null);
  }

  function handleNavigateToHub(hubId) {
    handleCloseReader();
    if (onRequestTab) {
      onRequestTab("hubs", { hubId });
      return;
    }
    navigate(`/knowledge/${hubId}`);
  }

  function openHubsTab() {
    if (onRequestTab) {
      onRequestTab("hubs");
      return;
    }
    navigate("/knowledge");
  }

  function selectAllVisible() {
    setSelectedKeys(new Set(filteredDocs.map(docKey)));
  }

  function enterSelectionMode() {
    setReaderDoc(null);
    setSelectionMode(true);
  }

  function handleSourceAdded(result) {
    if (!result) return;
    const where = result.hubName ? `"${result.hubName}"` : "your document library";
    showToast({
      title: "Source added",
      description: `${result.sourceName} added to ${where}.`,
      variant: "success",
    });
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
        title: result.moved ? "Moved to hub" : "Linked to hub",
        description: result.moved
          ? `Source moved to "${hub?.name ?? "hub"}".`
          : `Document added to "${hub?.name ?? "hub"}".`,
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

  function requestRemoveDoc(doc) {
    if (!canEdit || !doc) return;
    const name = getDocDisplayName(doc);
    if (doc.isLibraryDocument) {
      setRemoveConfirm({ mode: "single-library", documentId: doc.id, name });
    } else {
      setRemoveConfirm({ mode: "single-hub", hubId: doc.hubId, fileId: doc.id, name });
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

  // Document reader has its own title + close header — no AppHeader breadcrumb.
  // Toolbar trigger base class (avoids nested button by not using <Button> inside <DropdownMenuTrigger>)
  const triggerBase = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    TOOLBAR_CONTROL_CLASS,
    "gap-1.5",
  );

  const panelContent = (
    <main className="flex flex-1 flex-col overflow-hidden">

          {/* Page header — hidden in reader view */}
          {!readerDoc && (
          <div className="flex-shrink-0 px-6 py-4">
            <PageHeader
              title={KNOWLEDGE_TERMS.documents}
              description={
                <>
                  {KNOWLEDGE_TERMS.documentsPageDescription}{" "}
                  <button
                    type="button"
                    onClick={() => setLinkingHelpOpen(true)}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {KNOWLEDGE_TERMS.documentsLearnMore}
                  </button>
                </>
              }
            >
              {canCreate && (
                <Button
                  type="button"
                  className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                  onClick={() => setWizardOpen(true)}
                >
                  <Upload data-icon="inline-start" aria-hidden />
                  {KNOWLEDGE_TERMS.addSources}
                </Button>
              )}
            </PageHeader>
          </div>
          )}

          {!readerDoc && (
            <DocumentsCategoryTabBar
              value={filterCategory}
              onChange={setFilterCategory}
            />
          )}

          {/* Toolbar — hidden in reader view */}
          {!readerDoc && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-y border-border bg-muted/20 px-6 py-2">

            <InputGroup className={cn("min-w-[180px] flex-1 max-w-[280px]", TOOLBAR_CONTROL_CLASS)}>
              <InputGroupAddon>
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search documents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                  >
                    <X aria-hidden />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>

            {/* Source filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className={triggerBase}>
                <Filter className="size-3.5" />
                {SOURCE_FILTER_OPTIONS.find((o) => o.id === filterSource)?.label}
                <ChevronDown className="size-3 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuGroup>
                  {SOURCE_FILTER_OPTIONS.map((o) => (
                    <DropdownMenuItem key={o.id} onClick={() => setFilterSource(o.id)} className="gap-2">
                      {filterSource === o.id
                        ? <Check className="size-3.5 text-primary" />
                        : <span className="size-3.5" />}
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
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
                <DropdownMenuGroup>
                  {typeOptions.map((o) => (
                    <DropdownMenuItem key={o.id} onClick={() => setFilterType(o.id)} className="gap-2">
                      {filterType === o.id
                        ? <Check className="size-3.5 text-primary" />
                        : <span className="size-3.5" />}
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
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
                <DropdownMenuGroup>
                  {SORT_OPTIONS.map((o) => (
                    <DropdownMenuItem key={o.id} onClick={() => setSortBy(o.id)} className="gap-2">
                      {sortBy === o.id
                        ? <Check className="size-3.5 text-primary" />
                        : <span className="size-3.5" />}
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
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
              <div className="flex items-center rounded-lg border border-border/60 bg-background p-0.5">
                {[
                  { id: "grid", icon: LayoutGrid, label: "Grid view" },
                  { id: "list", icon: List, label: "List view" },
                ].map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    type="button"
                    variant={viewMode === id ? "secondary" : "ghost"}
                    size="icon-sm"
                    title={label}
                    aria-label={label}
                    aria-pressed={viewMode === id}
                    onClick={() => handleViewModeChange(id)}
                  >
                    <Icon aria-hidden />
                  </Button>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-xs"
                onClick={exitSelectionMode}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Content area */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {readerDoc ? (
              resolveSourceCategory(activeReaderDoc) === "dbs" ? (
                <DatabaseDetailView
                  record={activeReaderDoc}
                  hubLinks={activeReaderDoc?.hubLinks ?? []}
                  hubs={hubs}
                  canEdit={canEdit}
                  canCreate={canCreate}
                  onClose={handleCloseReader}
                  onNavigateToHub={handleNavigateToHub}
                  onLinkToHub={handleLinkDocToHub}
                  onUnlinkFromHub={handleUnlinkDocFromHub}
                  onCreateHub={() => {
                    if (!canCreate) return;
                    if (activeReaderDoc?.isLibraryDocument) {
                      setLinkAfterHubCreate(activeReaderDoc.id);
                    }
                    setCreateHubOpen(true);
                  }}
                />
              ) : resolveSourceCategory(activeReaderDoc) === "apis" ? (
                <ApiDetailView
                  record={activeReaderDoc}
                  hubLinks={activeReaderDoc?.hubLinks ?? []}
                  hubs={hubs}
                  canEdit={canEdit}
                  canCreate={canCreate}
                  onClose={handleCloseReader}
                  onNavigateToHub={handleNavigateToHub}
                  onLinkToHub={handleLinkDocToHub}
                  onUnlinkFromHub={handleUnlinkDocFromHub}
                  onCreateHub={() => {
                    if (!canCreate) return;
                    if (activeReaderDoc?.isLibraryDocument) {
                      setLinkAfterHubCreate(activeReaderDoc.id);
                    }
                    setCreateHubOpen(true);
                  }}
                />
              ) : (
              <DocumentReaderDrawer
                file={activeReaderDoc}
                hubLinks={activeReaderDoc?.hubLinks ?? []}
                hubs={hubs}
                canEdit={canEdit}
                canCreate={canCreate}
                onNotify={showToast}
                onNavigateToHub={handleNavigateToHub}
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
              )
              ) : (
            <div
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-6 py-5",
                selectionMode && selectedCount > 0 && "pb-24",
              )}
            >
              {allDocs.length > 0 ? (
                <FileStatusSummaryBar
                  files={allDocs}
                  title="Documents"
                  compact
                  hideTotalCount
                  excludeSourceMetrics
                  hideWhenHealthy
                  className="mb-4 shrink-0"
                  activeFilter={filterStatus}
                  onFilter={setFilterStatus}
                />
              ) : null}

              {allDocs.length === 0 ? (
                <EmptyDocuments
                  canUpload={canCreate}
                  canCreateHub={canCreate}
                  onUpload={() => canCreate && setWizardOpen(true)}
                  onBrowseHubs={openHubsTab}
                />
              ) : filteredDocs.length === 0 ? (
                <Empty className="flex-1 border border-dashed py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Filter aria-hidden />
                    </EmptyMedia>
                    <EmptyTitle>No documents match your filters</EmptyTitle>
                    <EmptyDescription>
                      Try adjusting your search or filters to see more documents.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button type="button" size="sm" variant="outline" onClick={clearAllFilters}>
                      Clear filters
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : viewMode === "grid" ? (
                <>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                    {docsPagination.items.map((doc) => (
                      <DocFileCard
                        key={docKey(doc)}
                        hubId={doc.hubId}
                        file={doc}
                        hubLinks={doc.hubLinks}
                        selectionMode={selectionMode}
                        selected={selectedKeys.has(docKey(doc))}
                        highlighted={
                          highlightIds.has(doc.id) || highlightIds.has(doc.libraryDocumentId)
                        }
                        onToggleSelect={toggleSelect}
                        onOpen={handleOpenDoc}
                        canEdit={canEdit}
                        onSyncFile={handleSyncFile}
                      />
                    ))}
                  </div>
                  <DocsTablePagination
                    page={docsPagination.currentPage}
                    totalPages={docsPagination.totalPages}
                    totalItems={docsPagination.totalItems}
                    onPageChange={setDocsPage}
                  />
                </>
              ) : (
                <>
                  <DocumentsListTable
                    docs={docsPagination.items}
                    selectionMode={selectionMode}
                    selectedKeys={selectedKeys}
                    highlightedIds={highlightIds}
                    canEdit={canEdit}
                    metricColumnLabel={metricColumnLabel}
                    onToggleSelect={toggleSelect}
                    onOpen={handleOpenDoc}
                    onSyncFile={handleSyncFile}
                    onUnlinkFromHub={handleUnlinkDocFromHub}
                    onRequestRemove={requestRemoveDoc}
                  />
                  <DocsTablePagination
                    page={docsPagination.currentPage}
                    totalPages={docsPagination.totalPages}
                    totalItems={docsPagination.totalItems}
                    onPageChange={setDocsPage}
                  />
                </>
              )}
            </div>
            )}

          </div>
    </main>
  );

  const pageOverlays = (
    <>
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

      <AddSourceWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleSourceAdded}
      />

      <LinkingHelpDialog open={linkingHelpOpen} onOpenChange={setLinkingHelpOpen} />

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
    </>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        {panelContent}
        {pageOverlays}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar activePage="knowledge" onNavigate={onNavigate} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader activePage="knowledge" onNavigate={onNavigate} />

        {panelContent}
        {pageOverlays}
      </div>
    </div>
  );
}
