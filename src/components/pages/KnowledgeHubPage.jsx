import { useEffect, useMemo, useRef, useState } from "react";
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
  Trash2,
  X,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { formatDisplayDate } from "@/data/knowledgeHubs";
import { KnowledgeHubCreateDialog } from "@/components/features/knowledge/KnowledgeHubCreateDialog";
import { KnowledgeHubDetailView } from "@/components/features/knowledge/KnowledgeHubDetailView";
import { KnowledgeHubHeaderBreadcrumb } from "@/components/features/knowledge/KnowledgeHubHeaderBreadcrumb";
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
import { TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";

const HUB_LIST_PAGE_SIZE = 20;

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
                  "h-7 cursor-pointer text-xs",
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
                  className="h-7 w-7 cursor-pointer text-xs"
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
                  "h-7 cursor-pointer text-xs",
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

function HubCardGrid({ hubs, onOpenHub, onDeleteRequest, canDelete }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {hubs.map((hub, i) => {
        const accent = HUB_TAG_COLORS[i % HUB_TAG_COLORS.length];
        return (
          <button
            key={hub.id}
            type="button"
            onClick={() => onOpenHub(hub.id)}
            className="group relative flex flex-col rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className={cn("mb-3 flex size-10 items-center justify-center rounded-lg", accent)}>
              <Database className="size-5" aria-hidden />
            </div>
            <p className="truncate text-sm font-semibold text-foreground">{hub.name}</p>
            {hub.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hub.description}</p>
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
            {canDelete && (
              <button
                type="button"
                aria-label={`Delete ${hub.name}`}
                onClick={(e) => { e.stopPropagation(); onDeleteRequest(hub); }}
                className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ onAdd, onBrowseDocuments }) {
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
        {onAdd ? (
          <Button size="sm" onClick={onAdd} className="gap-1.5">
            <Plus size={16} />
            Add {KNOWLEDGE_TERMS.hubSingular}
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
  openMenuId,
  menuRef,
  onToggleRow,
  onMenuOpen,
  onDeleteRequest,
  onOpenHub,
  page,
  totalPages,
  totalItems,
  onPageChange,
  canDelete,
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
                "cursor-pointer",
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
                <span className="font-medium text-foreground">{hub.name}</span>
                {hub.description && (
                  <p className="mt-0.5 hidden max-w-[240px] truncate text-xs text-muted-foreground sm:block">
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
                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onMenuOpen(openMenuId === hub.id ? null : hub.id)}
                    aria-label={`Delete ${hub.name}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === hub.id}
                  >
                    <MoreVertical size={15} />
                  </Button>
                )}
                {canDelete && openMenuId === hub.id && (
                  <div
                    ref={menuRef}
                    role="menu"
                    className="absolute right-4 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-popover py-1 shadow-md ring-1 ring-foreground/10"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      role="menuitem"
                      className="h-8 w-full justify-start gap-2 px-3 font-normal text-destructive hover:text-destructive"
                      onClick={() => onDeleteRequest(hub)}
                    >
                      <Trash2 size={13} />
                      Delete
                    </Button>
                  </div>
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

export default function KnowledgeHubPage({ onNavigate }) {
  const { hubId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { agents, setAgents } = useAgents();
  const canCreate = can("knowledge.create");
  const canEdit = can("knowledge.edit");
  const canDelete = can("knowledge.delete");
  const { hubs, addHub, updateHub, deleteHub, deleteHubs, getHubById } =
    useKnowledgeHubs();
  const { toasts, showToast, dismissToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [listPage, setListPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detailDraft, setDetailDraft] = useState({
    name: null,
    detailsDirty: false,
    hubSurface: "control-center",
    libraryFileName: null,
  });
  const [hubNavRequest, setHubNavRequest] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const menuRef = useRef(null);

  const detailHub = hubId ? getHubById(hubId) : null;

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
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, canCreate]);

  useEffect(() => {
    if (!openMenuId) return;
    function onKey(e) {
      if (e.key === "Escape") setOpenMenuId(null);
    }
    function onPointer(e) {
      if (menuRef.current?.contains(e.target)) return;
      setOpenMenuId(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [openMenuId]);

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

  function handleKnowledgeHubBreadcrumbClick() {
    if (detailDraft.detailsDirty) {
      const leave = window.confirm("You have unsaved changes. Leave without saving?");
      if (!leave) return;
    }
    navigate("/knowledge");
  }

  function handleHubBreadcrumbClick() {
    if (detailDraft.hubSurface === "library") {
      setHubNavRequest("control-center");
    }
  }

  function openHub(id) {
    navigate(`/knowledge/${id}`);
  }

  function handleFilesAdded(names, provider) {
    if (provider === "published") {
      showToast("Knowledge Hub published and available to agents and workflows.");
      return;
    }
    if (!names?.length) return;
    const label =
      provider === "google-drive"
        ? "Google Drive"
        : provider === "onedrive"
          ? "OneDrive"
          : provider === "upload"
            ? "upload"
            : "source";
    showToast(
      names.length === 1
        ? label === "upload"
          ? `"${names[0]}" added to hub and document library.`
          : `"${names[0]}" added from ${label}.`
        : label === "upload"
          ? `${names.length} files added to hub and document library.`
          : `${names.length} files added from ${label}.`,
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
        ? `Knowledge Hub “${hub.name}” created with ${totalFiles} file${totalFiles === 1 ? "" : "s"}${cloudNote}.`
        : `Knowledge Hub “${hub.name}” created.`,
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
    setOpenMenuId(null);
    setConfirmDelete({ type: "single", hub });
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
      showToast(`Knowledge Hub “${hub.name}” deleted.`);
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
      ? `Delete “${hub.name}”? It is used by ${used} agent${used === 1 ? "" : "s"} (${linked.join(", ")}). Detach from agents first or proceed.`
      : `Delete “${hub.name}”? This cannot be undone.`;
  }

  if (hubId && !detailHub) {
    return (
      <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
        <Sidebar activePage="knowledge" onNavigate={onNavigate} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">Knowledge Hub not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/knowledge")}>
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="knowledge" onNavigate={onNavigate} />

      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          {detailHub ? (
            <KnowledgeHubHeaderBreadcrumb
              hubName={detailDraft.name ?? detailHub.name}
              detailsDirty={detailDraft.detailsDirty}
              libraryFileName={detailDraft.libraryFileName}
              onKnowledgeHubClick={handleKnowledgeHubBreadcrumbClick}
              onHubClick={handleHubBreadcrumbClick}
            />
          ) : null}
        </AppHeader>

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
                  showToast(`Knowledge Hub “${patch.name}” updated.`);
                }}
                onDelete={() => requestDelete(detailHub)}
                onFilesAdded={handleFilesAdded}
                onFileDeleted={(name) =>
                  showToast(`“${name}” removed from hub.`)
                }
                onCloudFileSynced={(name) =>
                  showToast(`“${name}” downloaded and stored in this knowledge base.`)
                }
                onCloudFileSyncFailed={(name, error) =>
                  showToast(
                    error
                      ? `Could not download “${name}”: ${error}`
                      : `Could not download “${name}”.`,
                  )
                }
              />
          ) : (
            <div className="flex flex-col gap-4 px-6 py-4 min-h-full">
              <>
                <PageHeader
                  title="Knowledge Hub"
                  description="Manage every knowledge hub in your workspace — document stores your agents use for retrieval."
                >
                    {!isEmpty && (
                      <>
                        <div className="relative h-8 w-[220px]">
                          <Search
                            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden
                          />
                          <Input
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
                              onClick={() => setListSearch("")}
                              aria-label="Clear search"
                              className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger
                            className={cn(TOOLBAR_CONTROL_CLASS, "w-[180px] py-0")}
                            aria-label="Sort Knowledge Hubs"
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
                        <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                          <button
                            type="button"
                            aria-label="Table view"
                            onClick={() => setViewMode("table")}
                            className={cn("flex size-7 items-center justify-center rounded-md transition-colors",
                              viewMode === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                          >
                            <LayoutList className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Grid view"
                            onClick={() => setViewMode("grid")}
                            className={cn("flex size-7 items-center justify-center rounded-md transition-colors",
                              viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                          >
                            <Grid2x2 className="size-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                    {canCreate && (
                      <Button
                        onClick={() => setCreateOpen(true)}
                        className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                      >
                        <Plus size={16} />
                        Add Knowledge Hub
                      </Button>
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
                    onAdd={canCreate ? () => setCreateOpen(true) : undefined}
                    onBrowseDocuments={() => navigate("/documents")}
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
                  <HubCardGrid
                    hubs={filteredSorted}
                    onOpenHub={openHub}
                    onDeleteRequest={requestDelete}
                    canDelete={canDelete}
                  />
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
                      openMenuId={openMenuId}
                      menuRef={menuRef}
                      onToggleRow={toggleRow}
                      onMenuOpen={setOpenMenuId}
                      onDeleteRequest={requestDelete}
                      onOpenHub={openHub}
                      page={hubPagination.currentPage}
                      totalPages={hubPagination.totalPages}
                      totalItems={hubPagination.totalItems}
                      onPageChange={setListPage}
                      canDelete={canDelete}
                    />
                  </>
                )}
              </>
            </div>
          )}
        </div>
      </div>

      {canCreate && (
        <KnowledgeHubCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
          onCloudFileSynced={(name) =>
            showToast(`“${name}” saved to your knowledge base.`)
          }
          onCloudFileSyncFailed={(name, error) =>
            showToast(
              error
                ? `Could not save “${name}”: ${error}`
                : `Could not save “${name}”.`,
            )
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
    </div>
  );
}
