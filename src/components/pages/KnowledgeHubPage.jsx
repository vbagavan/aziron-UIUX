import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  Trash2,
  Search,
  ChevronRight,
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
import { paginateSlice } from "@/lib/pagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useAgents } from "@/context/AgentsContext";
import { agentsUsingHub, countAgentsUsingHub } from "@/lib/agentKnowledge";
import { PageHeader } from "@/components/common/PageHeader";

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

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 min-h-[400px]">
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
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Create your first Knowledge Hub to upload documents and let agents answer questions
        from your content.
      </p>
      {onAdd ? (
        <Button size="sm" onClick={onAdd} className="gap-1.5">
          <Plus size={16} />
          Add Knowledge Hub
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">You have view-only access to Knowledge Hub.</p>
      )}
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
  const [detailDraft, setDetailDraft] = useState({ name: null, detailsDirty: false });
  const menuRef = useRef(null);

  const detailHub = hubId ? getHubById(hubId) : null;

  useEffect(() => {
    if (!hubId) setDetailDraft({ name: null, detailsDirty: false });
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

  function openHub(id) {
    navigate(`/knowledge/${id}`);
  }

  function handleFilesAdded(names) {
    if (!names?.length) return;
    showToast(
      names.length === 1
        ? `“${names[0]}” added from OneDrive.`
        : `${names.length} files added from OneDrive.`,
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
          {detailHub && (
            <div className="ml-1 flex min-w-0 items-center gap-2">
              <div className="h-6 w-px bg-border" />
              <button
                type="button"
                onClick={() => navigate("/knowledge")}
                className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Knowledge Hub
              </button>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="max-w-[200px] truncate text-sm font-medium text-foreground">
                {detailDraft.name ?? detailHub.name}
                {detailDraft.detailsDirty && (
                  <span className="ml-1.5 font-normal text-muted-foreground">(unsaved)</span>
                )}
              </span>
            </div>
          )}
        </AppHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 px-6 py-4 min-h-full">
            {detailHub ? (
              <KnowledgeHubDetailView
                hub={detailHub}
                canEdit={canEdit}
                canDelete={canDelete}
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
                  <EmptyState onAdd={canCreate ? () => setCreateOpen(true) : undefined} />
                ) : filteredSorted.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No Knowledge Hubs match your search.
                  </p>
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
            )}
          </div>
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

      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
