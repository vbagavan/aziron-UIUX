import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Bot,
  Database,
  FileText,
  Grid2x2,
  LayoutList,
  MoreVertical,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast, useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { useAuth } from "@/context/AuthContext";
import { formatDisplayDate } from "@/data/knowledgeHubs";
import { KnowledgeHubCreateDialog } from "@/components/features/knowledge/KnowledgeHubCreateDialog";
import { KnowledgeHubDetailView } from "@/components/features/knowledge/KnowledgeHubDetailView";
import { ShareHubDialog } from "@/components/features/knowledge/ShareHubDialog";
import { KnowledgeHubBackNav } from "@/components/features/knowledge/KnowledgeHubBackNav";
import { paginateSlice } from "@/lib/pagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useAgents } from "@/context/AgentsContext";
import { agentsUsingHub, countAgentsUsingHub } from "@/lib/agentKnowledge";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { goToConnectorsCatalog } from "@/lib/connectorsNavigation";
import { useConnectionsStore } from "@/lib/connections/store.js";
import { HUB_CUSTOM_CONNECTOR_CATALOG_ID } from "@/components/features/knowledge/hubAddSourceConnectors";
import { TOOLBAR_CONTROL_CLASS, PAGINATION_CONTROL_CLASS } from "@/lib/listToolbar";
import { getHubDisplayName } from "@/lib/hubDisplay";

const HUB_LIST_PAGE_SIZE = 20;
const HUB_VIEW_KEY = "knowledge_hubs_view_mode";

function loadSavedHubViewMode() {
  try {
    const saved = localStorage.getItem(HUB_VIEW_KEY);
    if (saved === "table" || saved === "grid") return saved;
  } catch {
    /* ignore */
  }
  return null;
}

/** Table footer pagination — matches InsuranceManagementPage / shadcn Pagination. */
function HubTablePagination({ page, totalPages, totalItems, itemLabel, onPageChange }) {
  if (totalItems === 0) return null;
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
      <p className="text-xs text-muted-foreground">
        {totalPages > 1 ? (
          <>
            {totalItems} {itemLabel} · page {currentPage} of {totalPages}
          </>
        ) : (
          <>
            {totalItems} {itemLabel}
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
                text="Next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  { id: "name", label: "Name (A–Z)" },
  { id: "newest", label: "Newest first" },
  { id: "files", label: "Most files" },
];

const HUB_TAG_COLORS = [
  "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "bg-rose-500/10 text-rose-700 dark:text-rose-300",
];

function HubCardGrid({ hubs, onOpenHub, onDeleteRequest, canDelete, onShareRequest, canShare, selectedRows, onToggleRow }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {hubs.map((hub, i) => {
        const accent = HUB_TAG_COLORS[i % HUB_TAG_COLORS.length];
        const displayName = getHubDisplayName(hub);
        const isSelected = selectedRows?.has(hub.id) ?? false;
        return (
          <div
            key={hub.id}
            className={cn(
              "group relative rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
              isSelected && "border-primary/40 bg-primary/5",
            )}
          >
            {onToggleRow && (
              <div className="absolute left-3 top-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRow(hub.id)}
                  aria-label={`Select ${displayName}`}
                  className="size-4 cursor-pointer rounded border-border accent-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpenHub(hub.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenHub(hub.id);
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-xl",
                onToggleRow && "pl-10",
              )}
            >
              <div className={cn("mb-3 flex size-10 items-center justify-center rounded-lg", accent)}>
                <Database className="size-5" aria-hidden />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              </div>
              {hub.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={hub.description}>{hub.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="size-3" />
                  {hub.files ?? 0} files
                </span>
                <span className="flex items-center gap-1">
                  <Bot className="size-3" />
                  {hub.usedBy ?? 0} agents
                </span>
                <span>{hub.storageMB ?? 0} MB</span>
              </div>
            </div>
            {(canDelete || canShare) && (
              <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`More options for ${displayName}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                  >
                    <MoreVertical className="size-4" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuGroup>
                      {canShare && onShareRequest ? (
                        <DropdownMenuItem onClick={() => onShareRequest(hub)}>
                          <Share2 data-icon="inline-start" aria-hidden />
                          Share hub
                        </DropdownMenuItem>
                      ) : null}
                      {canDelete && onDeleteRequest ? (
                        <>
                          {canShare && onShareRequest ? <DropdownMenuSeparator /> : null}
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDeleteRequest(hub)}
                          >
                            <Trash2 data-icon="inline-start" aria-hidden />
                            Delete hub
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ onCreate, onBrowseDocuments }) {
  return (
    <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center gap-3 py-16">
      <svg width="130" height="123" viewBox="0 0 130 123" fill="none" aria-hidden="true">
        <rect x="22" y="72" width="86" height="11" rx="4" fill="#E2E8F0" />
        <rect x="16" y="85" width="98" height="11" rx="4" fill="#CBD5E1" />
        <rect x="28" y="58" width="74" height="14" rx="4" fill="#EEF2FF" />
        <rect x="34" y="44" width="62" height="14" rx="4" fill="#E2E8F0" />
        <rect x="40" y="31" width="50" height="13" rx="4" fill="#F1F5F9" />
        <circle cx="65" cy="40" r="14" fill="none" stroke="#94A3B8" strokeWidth="2.5" />
        <line x1="75" y1="50" x2="86" y2="61" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="108" cy="22" r="3" fill="#C7D2FE" />
        <circle cx="14" cy="48" r="2.2" fill="#CBD5E1" />
        <circle cx="118" cy="58" r="2" fill="#A5B4FC" />
        <circle cx="20" cy="22" r="1.5" fill="#E2E8F0" />
      </svg>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Create your first {KNOWLEDGE_TERMS.hubSingular.toLowerCase()} to organize documents for agents
        and workflows. Or upload to {KNOWLEDGE_TERMS.documents.toLowerCase()} and link later.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onCreate ? (
          <Button size="sm" onClick={onCreate} className="gap-1.5">
            <Plus size={16} />
            Create {KNOWLEDGE_TERMS.hubSingular.toLowerCase()}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            You have view-only access to {KNOWLEDGE_TERMS.hubs.toLowerCase()}.
          </p>
        )}
        {onBrowseDocuments ? (
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onBrowseDocuments}>
            Go to {KNOWLEDGE_TERMS.documents}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function HubTable({
  hubs,
  selectedRows,
  onToggleRow,
  onDeleteRequest,
  onShareRequest,
  onOpenHub,
  page,
  totalPages,
  totalItems,
  onPageChange,
  canDelete,
  canShare,
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10">
              <span className="sr-only">Select</span>
            </TableHead>
            <TableHead>Knowledge Hub name</TableHead>
            <TableHead className="hidden md:table-cell">Files</TableHead>
            <TableHead className="hidden sm:table-cell">Storage</TableHead>
            <TableHead className="hidden lg:table-cell">Linked agents</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hubs.map((hub) => (
            <TableRow
              key={hub.id}
              className={cn(
                "group cursor-pointer",
                selectedRows.has(hub.id) && "bg-primary/5",
              )}
              onClick={() => onOpenHub(hub.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedRows.has(hub.id)}
                  onChange={() => onToggleRow(hub.id)}
                  className="size-4 cursor-pointer accent-primary"
                  aria-label={`Select ${hub.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-foreground">{getHubDisplayName(hub)}</span>
                </div>
                {hub.description && (
                  <p
                    className="mt-0.5 hidden max-w-[240px] truncate text-xs text-muted-foreground sm:block"
                    title={hub.description}
                  >
                    {hub.description}
                  </p>
                )}
              </TableCell>
              <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                {hub.files ?? 0}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {hub.storageMB ?? 0} MB
              </TableCell>
              <TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">
                {hub.usedBy ?? 0}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <time dateTime={hub.createdOn} title={hub.createdOn}>
                  {formatDisplayDate(hub.createdOn)}
                </time>
              </TableCell>
              <TableCell
                className="relative"
                onClick={(e) => e.stopPropagation()}
              >
                {(canShare || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${hub.name}`}
                          className="opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
                        />
                      }
                    >
                      <MoreVertical size={15} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuGroup>
                        {canShare ? (
                          <DropdownMenuItem onClick={() => onShareRequest(hub)}>
                            <Share2 data-icon="inline-start" aria-hidden />
                            Share
                          </DropdownMenuItem>
                        ) : null}
                        {canShare && canDelete ? <DropdownMenuSeparator /> : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDeleteRequest(hub)}
                          >
                            <Trash2 data-icon="inline-start" aria-hidden />
                            Delete
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <HubTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemLabel="hubs"
        onPageChange={onPageChange}
      />
    </div>
  );
}

export default function KnowledgeHubPage({
  onNavigate,
  embedded = false,
  onHeaderSlot,
  onRequestTab,
}) {
  const { hubId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const openIntegrationsWizard = useConnectionsStore((s) => s.openWizard);
  const openIntegrationsWizardWithProvider = useConnectionsStore((s) => s.openWizardWithProvider);
  const { can } = usePermissions();
  const { agents, setAgents } = useAgents();
  const { auth } = useAuth();
  const canCreate = can("knowledge.create");
  const canEdit = can("knowledge.edit");
  const canDelete = can("knowledge.delete");
  const canShare = canEdit;
  const { hubs, addHub, updateHub, deleteHub, deleteHubs, getHubById, addHubMembers } =
    useKnowledgeHubs();
  const { toasts, showToast, dismissToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const searchInputRef = useRef(null);
  const [sortBy, setSortBy] = useState("newest");
  const [listPage, setListPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [shareHub, setShareHub] = useState(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [detailDraft, setDetailDraft] = useState({
    name: null,
    detailsDirty: false,
    hubSurface: "control-center",
    libraryFileName: null,
  });
  const [hubNavRequest, setHubNavRequest] = useState(null);
  const [viewMode, setViewMode] = useState(() => loadSavedHubViewMode() ?? "table"); // "table" | "grid"

  useEffect(() => {
    try {
      localStorage.setItem(HUB_VIEW_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  function openCreate() {
    setCreateOpen(true);
  }

  const detailHub = hubId ? getHubById(hubId) : null;
  const requestedHubTab = searchParams.get("tab");
  const requestedAssetId = searchParams.get("asset");

  const openDocumentsTab = (opts) => {
    if (onRequestTab) {
      onRequestTab("documents", opts);
      return;
    }
    const params = new URLSearchParams();
    params.set("tab", "documents");
    if (opts?.linkHub) params.set("linkHub", String(opts.linkHub));
    if (opts?.openSource) params.set("openSource", String(opts.openSource));
    navigate(`/knowledge?${params.toString()}`);
  };

  useEffect(() => {
    if (!hubId) {
      setDetailDraft({
        name: null,
        detailsDirty: false,
        hubSurface: "control-center",
        libraryFileName: null,
      });
      setHubNavRequest(null);
    }
  }, [hubId]);

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, canCreate]);

  useEffect(() => {
    setListPage(1);
  }, [listSearch, sortBy]);

  const filteredSorted = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    let list = hubs.filter(
      (h) =>
        !q ||
        h.name.toLowerCase().includes(q) ||
        (h.description ?? "").toLowerCase().includes(q),
    );
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "files") return (b.files ?? 0) - (a.files ?? 0);
      return String(b.createdOn).localeCompare(String(a.createdOn));
    });
    return list;
  }, [hubs, listSearch, sortBy]);

  const hubPagination = useMemo(
    () => paginateSlice(filteredSorted, listPage, HUB_LIST_PAGE_SIZE),
    [filteredSorted, listPage],
  );

  const isEmpty = hubs.length === 0;
  const selectedCount = selectedRows.size;

  const handleKnowledgeHubBreadcrumbClick = useCallback(() => {
    if (detailDraft.detailsDirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    navigate("/knowledge");
  }, [detailDraft.detailsDirty, navigate]);

  function confirmLeaveHub() {
    setLeaveConfirmOpen(false);
    navigate("/knowledge");
  }

  const showHubBackNav = Boolean(detailHub && !detailDraft.libraryFileName);
  const showHubBackNavInHeader = showHubBackNav && !embedded;

  useEffect(() => {
    if (!embedded || !onHeaderSlot) return undefined;
    onHeaderSlot(
      showHubBackNavInHeader ? (
        <KnowledgeHubBackNav
          onBack={handleKnowledgeHubBreadcrumbClick}
          hubTitle={getHubDisplayName(detailDraft.name ?? detailHub?.name)}
        />
      ) : null,
    );
    return () => onHeaderSlot(null);
  }, [
    embedded,
    onHeaderSlot,
    showHubBackNavInHeader,
    handleKnowledgeHubBreadcrumbClick,
    detailDraft.name,
    detailHub?.name,
  ]);

  function openHub(id) {
    navigate(`/knowledge/${id}`);
  }

  function handleFilesAdded(names, provider, { skipped = 0 } = {}) {
    if (!names?.length) return;
    const label =
      provider === "google-drive"
        ? "Google Drive"
        : provider === "onedrive"
          ? "OneDrive"
          : provider === "upload"
            ? "upload"
            : "source";
    const skipNote =
      skipped > 0 ? ` ${skipped} file${skipped === 1 ? "" : "s"} skipped (too large or invalid).` : "";
    showToast(
      names.length === 1
        ? label === "upload"
          ? `"${names[0]}" added to hub and document library.${skipNote}`
          : `"${names[0]}" added from ${label}.${skipNote}`
        : label === "upload"
          ? `${names.length} sources added to hub and document library.${skipNote}`
          : `${names.length} files added from ${label}.${skipNote}`,
    );
  }

  async function handleCreated(payload) {
    const hub = await addHub(payload);
    const uploadCount =
      payload.pendingFiles?.length ?? (payload.pendingFile ? 1 : 0);
    const cloudImport = payload.cloudImport ?? payload.oneDriveImport;
    const cloudCount = cloudImport?.selectedFiles?.length ?? 0;
    const cloudLabel =
      cloudImport?.provider === "google-drive" ? "Google Drive" : "OneDrive";
    const totalFiles = uploadCount + cloudCount;
    const cloudNote =
      cloudCount > 0
        ? ` (${cloudCount} from ${cloudLabel}${uploadCount > 0 ? `, ${uploadCount} uploaded` : ""})`
        : "";
    showToast(
      totalFiles > 0
        ? `Knowledge Hub "${hub.name}" created with ${totalFiles} file${totalFiles === 1 ? "" : "s"}${cloudNote}.`
        : `Knowledge Hub "${hub.name}" created.`,
    );
    navigate(`/knowledge/${hub.id}`);
  }

  function toggleRow(id) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    const visibleIds = hubPagination.items.map((h) => h.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedRows.has(id));
    if (allSelected) {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function requestDelete(hub) {
    setConfirmDelete({ type: "single", hub });
  }

  function requestShare(hub) {
    setShareHub(hub);
  }

  function requestBulkDelete() {
    const targets = hubs.filter((h) => selectedRows.has(h.id));
    if (targets.length === 0) return;
    setConfirmDelete({ type: "bulk", hubs: targets });
  }

  function detachHubFromAgents(removedIds) {
    const idSet = new Set([...removedIds].map((id) => Number(id)));
    setAgents((prev) =>
      prev.map((a) => {
        const nextHubs = (a.knowledgeHubs ?? []).filter((id) => !idSet.has(Number(id)));
        const nextFileIds = { ...(a.knowledgeHubFileIds ?? {}) };
        for (const key of Object.keys(nextFileIds)) {
          if (idSet.has(Number(key))) delete nextFileIds[key];
        }
        return { ...a, knowledgeHubs: nextHubs, knowledgeHubFileIds: nextFileIds };
      }),
    );
  }

  function executeDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === "single") {
      const hub = confirmDelete.hub;
      deleteHub(hub.id);
      detachHubFromAgents([hub.id]);
      showToast(`Knowledge Hub "${hub.name}" deleted.`);
      if (hubId && String(hub.id) === String(hubId)) navigate("/knowledge");
    } else {
      const ids = confirmDelete.hubs.map((h) => h.id);
      deleteHubs(ids);
      detachHubFromAgents(ids);
      showToast(
        `${confirmDelete.hubs.length} Knowledge Hub${confirmDelete.hubs.length === 1 ? "" : "s"} deleted.`,
      );
      setSelectedRows(new Set());
      if (hubId && confirmDelete.hubs.some((h) => String(h.id) === String(hubId))) {
        navigate("/knowledge");
      }
    }
    setConfirmDelete(null);
  }

  function deleteMessage(hubOrHubs) {
    if (Array.isArray(hubOrHubs)) {
      const used = hubOrHubs.reduce(
        (n, h) => n + countAgentsUsingHub(h.id, agents),
        0,
      );
      return used > 0
        ? `Delete ${hubOrHubs.length} hubs? ${used} agent attachment(s) across these hubs will be removed. This cannot be undone.`
        : `Delete ${hubOrHubs.length} selected hubs? This cannot be undone.`;
    }
    const hub = hubOrHubs;
    const used = countAgentsUsingHub(hub.id, agents);
    const linked = agentsUsingHub(hub.id, agents).map((a) => a.name);
    return used > 0
      ? `Delete "${hub.name}"? It is used by ${used} agent${used === 1 ? "" : "s"} (${linked.join(", ")}). Detach from agents first or proceed.`
      : `Delete "${hub.name}"? This cannot be undone.`;
  }

  if (hubId && !detailHub) {
    const notFound = (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Knowledge Hub not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/knowledge")}>
          Back to list
        </Button>
      </div>
    );
    if (embedded) {
      return (
        <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
          {notFound}
        </div>
      );
    }
    return (
      <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
        <Sidebar activePage="knowledge" onNavigate={onNavigate} />
        {notFound}
      </div>
    );
  }

  const panelContent = (
    <div className={detailHub ? "flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-1" : "min-h-0 flex-1 overflow-y-auto"}>
      {detailHub ? (
        <KnowledgeHubDetailView
                hub={detailHub}
                canEdit={canEdit}
                canDelete={canDelete}
                hubNavRequest={hubNavRequest}
                onHubNavHandled={() => setHubNavRequest(null)}
                onMetadataChange={setDetailDraft}
                onSave={(patch) => {
                  updateHub(detailHub.id, patch);
                  setDetailDraft({ name: patch.name, detailsDirty: false });
                  showToast(`Knowledge Hub "${patch.name}" updated.`);
                }}
                onDelete={() => requestDelete(detailHub)}
                onFilesAdded={handleFilesAdded}
                onFileDeleted={(name) =>
                  showToast(`"${name}" removed from hub.`)
                }
                onCloudFileSynced={(name) =>
                  showToast(`"${name}" downloaded and stored in this knowledge base.`)
                }
                onCloudFileSyncFailed={(name, error) =>
                  showToast(
                    error
                      ? `Could not download "${name}": ${error}`
                      : `Could not download "${name}".`,
                    { variant: "destructive" },
                  )
                }
                onNotify={(payload) => showToast(payload)}
                onBrowseDocumentsLibrary={(id) => openDocumentsTab({ linkHub: id })}
                onOpenDocument={(sourceId) => openDocumentsTab({ openSource: sourceId })}
                onBackToHubs={handleKnowledgeHubBreadcrumbClick}
                requestedTab={requestedHubTab}
                requestedAssetId={requestedAssetId}
              />
          ) : (
            <div className="flex flex-col gap-4 px-6 py-4 min-h-full">
              <>
                <PageHeader
                  title="Knowledge Hubs"
                  description="Manage every knowledge hub in your workspace — document stores your agents use for retrieval."
                >
                    {canCreate && (
                      <Button
                        onClick={openCreate}
                        className="h-8 shrink-0 gap-1.5 px-3 text-sm font-semibold leading-none"
                      >
                        <Plus size={16} />
                        Create {KNOWLEDGE_TERMS.hubSingular.toLowerCase()}
                      </Button>
                    )}
                    {!isEmpty && (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative h-8 w-[180px] sm:w-[220px]">
                          <Search
                            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden
                          />
                          <Input
                            ref={searchInputRef}
                            value={listSearch}
                            onChange={(e) => setListSearch(e.target.value)}
                            placeholder="Search hubs…"
                            aria-label="Search Knowledge Hubs"
                            className={cn(
                              TOOLBAR_CONTROL_CLASS,
                              "min-h-8 max-h-8 w-full py-0 pl-8 pr-8",
                            )}
                          />
                          {listSearch && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => { setListSearch(""); searchInputRef.current?.focus(); }}
                              aria-label="Clear search"
                              className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger
                            className={cn(TOOLBAR_CONTROL_CLASS, "w-[140px] py-0 sm:w-[180px]")}
                            aria-label={`Sort Knowledge Hubs, currently: ${SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? sortBy}`}
                          >
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            {SORT_OPTIONS.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className={cn("hidden sm:flex items-center rounded-lg border border-border/60 bg-background p-0.5", TOOLBAR_CONTROL_CLASS)}>
                          <Button
                            type="button"
                            variant={viewMode === "table" ? "secondary" : "ghost"}
                            size="icon-sm"
                            aria-label={viewMode === "table" ? "Currently in table view" : "Switch to table view"}
                            aria-pressed={viewMode === "table"}
                            onClick={() => setViewMode("table")}
                          >
                            <LayoutList className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon-sm"
                            aria-label={viewMode === "grid" ? "Currently in grid view" : "Switch to grid view"}
                            aria-pressed={viewMode === "grid"}
                            onClick={() => setViewMode("grid")}
                          >
                            <Grid2x2 className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    )}
                </PageHeader>

                {selectedCount > 0 && canDelete && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2">
                    <span className="text-sm text-foreground">
                      {selectedCount} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive gap-1.5"
                      onClick={requestBulkDelete}
                    >
                      <Trash2 size={14} />
                      Delete selected
                    </Button>
                  </div>
                )}

                {isEmpty ? (
                  <EmptyState
                    onCreate={canCreate ? openCreate : undefined}
                    onBrowseDocuments={() => openDocumentsTab()}
                  />
                ) : filteredSorted.length === 0 ? (
                  <Empty className="border border-dashed py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Database aria-hidden />
                      </EmptyMedia>
                      <EmptyTitle>No Knowledge Hubs match your search</EmptyTitle>
                      <EmptyDescription>
                        Try a different term or clear your search to see all hubs.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button type="button" size="sm" variant="outline" onClick={() => setListSearch("")}>
                        Clear search
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : viewMode === "grid" ? (
                  <>
                    <HubCardGrid
                      hubs={hubPagination.items}
                      onOpenHub={openHub}
                      onDeleteRequest={requestDelete}
                      canDelete={canDelete}
                      onShareRequest={requestShare}
                      canShare
                      selectedRows={selectedRows}
                      onToggleRow={toggleRow}
                    />
                    <HubTablePagination
                      page={hubPagination.currentPage}
                      totalPages={hubPagination.totalPages}
                      totalItems={hubPagination.totalItems}
                      itemLabel="hubs"
                      onPageChange={setListPage}
                    />
                  </>
                ) : (
                  <>
                    {!isEmpty && canDelete && (
                      <div className="flex items-center gap-2 px-1 -mb-2">
                        <input
                          type="checkbox"
                          checked={
                            hubPagination.items.length > 0 &&
                            hubPagination.items.every((h) => selectedRows.has(h.id))
                          }
                          onChange={toggleSelectAllVisible}
                          className="size-4 accent-primary cursor-pointer"
                          aria-label="Select all Knowledge Hubs on this page"
                        />
                        <span className="text-xs text-muted-foreground">
                          Select all on this page
                        </span>
                      </div>
                    )}
                    <HubTable
                      hubs={hubPagination.items}
                      selectedRows={selectedRows}
                      onToggleRow={toggleRow}
                      onDeleteRequest={requestDelete}
                      onShareRequest={requestShare}
                      onOpenHub={openHub}
                      page={hubPagination.currentPage}
                      totalPages={hubPagination.totalPages}
                      totalItems={hubPagination.totalItems}
                      onPageChange={setListPage}
                      canDelete={canDelete}
                      canShare={canShare}
                    />
                  </>
                )}
              </>
            </div>
          )}
    </div>
  );

  const pageOverlays = (
    <>
      {canCreate && (
        <KnowledgeHubCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
          onCloudFileSynced={(name) =>
            showToast(`"${name}" saved to your knowledge base.`)
          }
          onCloudFileSyncFailed={(name, error) =>
            showToast(
              error
                ? `Could not save "${name}": ${error}`
                : `Could not save "${name}".`,
            )
          }
          onBrowseAllConnectors={() =>
            goToConnectorsCatalog(navigate, {
              openNew: true,
              openWizard: openIntegrationsWizard,
              openWizardWithProvider: openIntegrationsWizardWithProvider,
            })
          }
          onCustomConnector={() =>
            goToConnectorsCatalog(navigate, {
              providerId: HUB_CUSTOM_CONNECTOR_CATALOG_ID,
              openWizardWithProvider: openIntegrationsWizardWithProvider,
            })
          }
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={
            confirmDelete.type === "bulk"
              ? "Delete selected hubs?"
              : "Delete Knowledge Hub?"
          }
          message={
            confirmDelete.type === "bulk"
              ? deleteMessage(confirmDelete.hubs)
              : deleteMessage(confirmDelete.hub)
          }
          confirmLabel="Delete"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {shareHub ? (
        <ShareHubDialog
          open={Boolean(shareHub)}
          onOpenChange={(open) => {
            if (!open) setShareHub(null);
          }}
          hub={shareHub}
          members={shareHub.members ?? []}
          actor={auth?.user}
          onShare={(newMembers) => {
            const { added } = addHubMembers(shareHub.id, newMembers) ?? {};
            showToast({
              title: "Hub shared",
              description: `${added ?? newMembers.length} ${(added ?? newMembers.length) === 1 ? "principal" : "principals"} now have access.`,
              variant: "success",
            });
            setShareHub(null);
          }}
          onManageMembers={() => {
            const hubId = shareHub.id;
            setShareHub(null);
            openHub(hubId);
          }}
        />
      ) : null}

      {leaveConfirmOpen && (
        <ConfirmDialog
          title="Leave without saving?"
          message="You have unsaved changes to this Knowledge Hub. Leave without saving?"
          confirmLabel="Leave"
          onConfirm={confirmLeaveHub}
          onCancel={() => setLeaveConfirmOpen(false)}
        />
      )}

      {toasts.length > 0 && (
        <div className="pointer-events-none fixed right-4 bottom-4 z-[99999] flex w-full max-w-md flex-col gap-2">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast
                message={t.message}
                variant={t.variant ?? "default"}
                actionLabel={t.actionLabel}
                onAction={t.onAction}
                onDismiss={() => dismissToast(t.id)}
              />
            </div>
          ))}
        </div>
      )}
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
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="knowledge" onNavigate={onNavigate} />

      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          {showHubBackNav ? (
            <KnowledgeHubBackNav
              onBack={handleKnowledgeHubBreadcrumbClick}
              hubTitle={getHubDisplayName(detailDraft.name ?? detailHub?.name)}
            />
          ) : null}
        </AppHeader>

        {panelContent}
        {pageOverlays}
      </div>
    </div>
  );
}
