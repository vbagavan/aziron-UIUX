import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  Bot,
  HardDrive,
  Info,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { HubFileSyncIcon } from "@/components/features/knowledge/HubFileSyncIcon";
import { HubFileSyncLegend } from "@/components/features/knowledge/HubFileSyncLegend";
import { HubPendingDownloadBanner } from "@/components/features/knowledge/HubPendingDownloadBanner";
import { HubSyncCoachMark } from "@/components/features/knowledge/HubSyncCoachMark";
import {
  countSyncStates,
  rowsNeedingDownload,
} from "@/components/features/knowledge/hubFileSyncUtils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { paginateSlice } from "@/lib/pagination";
import { agentsUsingHub } from "@/lib/agentKnowledge";
import { useAgents } from "@/context/AgentsContext";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import {
  buildHubFileInventory,
  CLOUD_PROVIDER_LABELS,
  formatDisplayDate,
  formatFileSizeKb,
  formatFileTableDate,
  formatHubTotalSizeMb,
  getHubFileSourceLabel,
  getHubFileStatus,
} from "@/data/knowledgeHubs";
import { CONNECTOR_LOGOS } from "@/components/features/knowledge/CloudConnectorLogos";
import { CloudAddFilesDialog } from "@/components/features/knowledge/cloud/CloudAddFilesDialog";
import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";
import {
  DEFAULT_GOOGLE_DRIVE_CONNECTION,
  DEFAULT_ONEDRIVE_CONNECTION,
} from "@/data/knowledgeHubs";
import { DETAIL_TITLE } from "@/lib/typography";

const FILES_PAGE_SIZE = 15;
const EMPTY_CLOUD_CONNECTIONS = [];

export function KnowledgeHubDetailView({
  hub: hubProp,
  onSave,
  onDelete,
  onFilesAdded,
  onFileDeleted,
  onCloudFileSynced,
  onCloudFileSyncFailed,
  onMetadataChange,
  canEdit = true,
  canDelete = true,
}) {
  const { getHubById, deleteHubFile, downloadCloudFileToHub, addCloudFilesToHub } =
    useKnowledgeHubs();
  const liveHub = hubProp ? getHubById(hubProp.id) ?? hubProp : null;

  const { agents } = useAgents();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fileQuery, setFileQuery] = useState("");
  const [filePage, setFilePage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedFileIds, setSelectedFileIds] = useState(() => new Set());
  const [fileToDelete, setFileToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [cloudAddOpen, setCloudAddOpen] = useState(false);
  const [cloudAddProvider, setCloudAddProvider] = useState("onedrive");
  const [cloudAddConnection, setCloudAddConnection] = useState(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const selectAllFilesRef = useRef(null);
  useEffect(() => {
    if (!liveHub) return;
    setName(liveHub.name ?? "");
    setDescription(liveHub.description ?? "");
    setEditingField(null);
  }, [liveHub?.id, liveHub?.name, liveHub?.description]);

  useEffect(() => {
    if (!editingField) return;
    const id = editingField === "name" ? "hub-detail-name" : "hub-detail-desc";
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  }, [editingField]);

  const inventoryPack = useMemo(
    () => (liveHub ? buildHubFileInventory(liveHub) : null),
    [liveHub],
  );

  const linkedAgents = useMemo(
    () => (liveHub ? agentsUsingHub(liveHub.id, agents) : []),
    [liveHub, agents],
  );

  const allFiles = inventoryPack?.allFiles ?? [];

  const sortedFiles = useMemo(() => {
    let list = [...allFiles];
    const q = fileQuery.trim().toLowerCase();
    if (q) list = list.filter((row) => row.name.toLowerCase().includes(q));
    list.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [allFiles, fileQuery, sortAsc]);

  useEffect(() => {
    setFilePage(1);
  }, [fileQuery, liveHub?.id, liveHub?.files, sortAsc]);

  const filePagination = useMemo(
    () => paginateSlice(sortedFiles, filePage, FILES_PAGE_SIZE),
    [sortedFiles, filePage],
  );

  const detailsDirty =
    liveHub &&
    (name.trim() !== (liveHub.name ?? "").trim() ||
      description.trim() !== (liveHub.description ?? "").trim());

  const totalFiles = inventoryPack?.totalListed ?? 0;
  const totalSizeMb = formatHubTotalSizeMb(allFiles);
  const showDemoStatuses = inventoryPack?.hasDemoRows ?? false;
  const filteredCount = sortedFiles.length;
  const cloudConnections =
    liveHub?.cloudConnections?.length > 0
      ? liveHub.cloudConnections
      : EMPTY_CLOUD_CONNECTIONS;
  const oneDriveConnection =
    cloudConnections.find((c) => c.provider === "onedrive") ?? DEFAULT_ONEDRIVE_CONNECTION;
  const googleDriveConnection =
    cloudConnections.find((c) => c.provider === "google-drive") ??
    DEFAULT_GOOGLE_DRIVE_CONNECTION;
  const providerConnections = useMemo(() => {
    const fromHub = cloudConnections.filter((c) => c.provider === cloudAddProvider);
    if (fromHub.length > 0) return fromHub;
    return getCloudProviderConfig(cloudAddProvider).mockConnections ?? [];
  }, [liveHub?.id, liveHub?.cloudConnections, cloudAddProvider]);

  function openCloudAdd(provider) {
    setCloudAddProvider(provider);
    const fromHub = cloudConnections.filter((c) => c.provider === provider);
    const defaults = getCloudProviderConfig(provider).mockConnections ?? [];
    const options = fromHub.length > 0 ? fromHub : defaults;
    const initial =
      options.find((c) => c.id === (provider === "google-drive" ? googleDriveConnection.id : oneDriveConnection.id)) ??
      options[0] ??
      null;
    setCloudAddConnection(initial);
    setCloudAddOpen(true);
  }
  const hasCloudFiles = allFiles.some((row) => row.source === "cloud");
  const hasSampleDemoFiles = allFiles.some((row) => row.isSampleDemo);
  const fileSyncCounts = countSyncStates(allFiles);
  const pendingDownloadRows = useMemo(() => rowsNeedingDownload(allFiles), [allFiles]);
  const existingExternalIds = useMemo(
    () =>
      allFiles
        .map((f) => f.externalFileId)
        .filter(Boolean),
    [allFiles],
  );
  const existingFileNames = useMemo(() => allFiles.map((f) => f.name), [allFiles]);

  const handleDownloadCloudFile = useCallback(
    async (row) => {
      if (!liveHub || row.source !== "cloud") return;
      const status = getHubFileStatus(row);
      if (status !== "linked" && status !== "failed") return;

      const result = await downloadCloudFileToHub(liveHub.id, row.id);
      if (result.ok) {
        onCloudFileSynced?.(result.fileName ?? row.name);
      } else if (result.error !== "Already downloading") {
        onCloudFileSyncFailed?.(row.name, result.error);
      }
    },
    [liveHub, downloadCloudFileToHub, onCloudFileSynced, onCloudFileSyncFailed],
  );

  const handleDownloadAllLinked = useCallback(async () => {
    if (!liveHub) return;
    setIsDownloadingAll(true);
    for (const row of pendingDownloadRows) {
      await handleDownloadCloudFile(row);
    }
    setIsDownloadingAll(false);
  }, [liveHub, pendingDownloadRows, handleDownloadCloudFile]);

  useEffect(() => {
    onMetadataChange?.({
      name: name.trim() || liveHub?.name,
      detailsDirty: !!detailsDirty,
    });
  }, [name, description, detailsDirty, liveHub?.name, onMetadataChange]);

  useEffect(() => {
    if (!detailsDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [detailsDirty]);

  useEffect(() => {
    const el = selectAllFilesRef.current;
    if (!el) return;
    const pageRows = filePagination.items;
    const allOn =
      pageRows.length > 0 && pageRows.every((r) => selectedFileIds.has(r.id));
    const someOn = pageRows.some((r) => selectedFileIds.has(r.id));
    el.indeterminate = someOn && !allOn;
  }, [filePagination.items, selectedFileIds]);

  const toggleFileRow = useCallback((id) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllFilesOnPage = useCallback(() => {
    const ids = filePagination.items.map((r) => r.id);
    const allOn = ids.length > 0 && ids.every((id) => selectedFileIds.has(id));
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, [filePagination.items, selectedFileIds]);

  if (!liveHub) return null;

  function handleSaveDetails() {
    if (!name.trim()) return;
    onSave?.({ name: name.trim(), description: description.trim() });
    setEditingField(null);
  }

  const editableFieldTriggerClass =
    "w-full rounded-md px-1 -mx-1 py-0.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function executeBulkDelete() {
    const ids = [...selectedFileIds];
    ids.forEach((id) => deleteHubFile(liveHub.id, id));
    setSelectedFileIds(new Set());
    setBulkDeleteOpen(false);
    if (ids.length === 1) {
      const row = allFiles.find((f) => f.id === ids[0]);
      if (row) onFileDeleted?.(row.name);
    } else if (ids.length > 1) {
      onFileDeleted?.(`${ids.length} files`);
    }
  }

  const filesToolbar = (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
      <div className="relative min-w-[180px] flex-1 sm:w-[200px] sm:flex-none">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={fileQuery}
          onChange={(e) => setFileQuery(e.target.value)}
          placeholder="Search files…"
          aria-label="Search files in hub"
          className="h-9 pl-8"
        />
      </div>
      {canEdit && (
        <>
          {selectedFileIds.size > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 size={14} />
              Delete selected ({selectedFileIds.size})
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => openCloudAdd("google-drive")}
            title="From Google Drive"
          >
            <Plus data-icon="inline-start" aria-hidden />
            Add from Google Drive
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => openCloudAdd("onedrive")}
            title="From Microsoft OneDrive"
          >
            <Plus data-icon="inline-start" aria-hidden />
            Add from OneDrive
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {!canEdit && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription>
            You have view-only access. You can browse files and linked agents but cannot
            upload, edit, or delete content.
          </AlertDescription>
        </Alert>
      )}

      {hasSampleDemoFiles && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription>
            This hub includes sample OneDrive files for demo purposes. Save them to your
            knowledge base or remove them and add your own files.
          </AlertDescription>
        </Alert>
      )}

      <HubSyncCoachMark visible={hasCloudFiles && fileSyncCounts.cloudLink > 0} />

      <HubPendingDownloadBanner
        pendingCount={pendingDownloadRows.length}
        loadingCount={fileSyncCounts.loading}
        isDownloadingAll={isDownloadingAll}
        onDownloadAll={pendingDownloadRows.length > 0 ? handleDownloadAllLinked : undefined}
      />

      {cloudConnections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cloud connections</CardTitle>
            <CardDescription>
              Files linked from connected drives appear in the inventory below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {cloudConnections.map((conn) => {
              const logo =
                conn.provider === "onedrive"
                  ? CONNECTOR_LOGOS.onedrive
                  : conn.provider === "google-drive"
                    ? CONNECTOR_LOGOS.googleDrive
                    : null;
              const label = CLOUD_PROVIDER_LABELS[conn.provider] ?? conn.provider;
              return (
                <div
                  key={conn.id ?? `${conn.provider}-${conn.name}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
                >
                  {logo ? (
                    <img src={logo} alt="" className="size-10 object-contain" draggable={false} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{conn.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {label}
                      {conn.connectedBy ? ` · Connected by ${conn.connectedBy}` : ""}
                      {conn.connectedAt ? `, ${conn.connectedAt}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {detailsDirty && canEdit && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5">
          <p className="text-sm text-foreground">Unsaved changes to hub details</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setName(liveHub.name ?? "");
                setDescription(liveHub.description ?? "");
                setEditingField(null);
              }}
            >
              Discard
            </Button>
            <Button type="button" size="sm" onClick={handleSaveDetails}>
              Save details
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          {canEdit ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                {editingField === "name" ? (
                  <Input
                    id="hub-detail-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setName(liveHub.name ?? "");
                        setEditingField(null);
                      }
                      if (e.key === "Enter") setEditingField(null);
                    }}
                    placeholder="Knowledge Hub name"
                    className="text-lg font-semibold"
                    aria-label="Hub name"
                  />
                ) : (
                  <button
                    type="button"
                    className={editableFieldTriggerClass}
                    onClick={() => setEditingField("name")}
                    aria-label="Edit hub name"
                  >
                    <p className={DETAIL_TITLE}>
                      {name.trim() || "Untitled hub"}
                    </p>
                  </button>
                )}
                {editingField === "description" ? (
                  <Input
                    id="hub-detail-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setDescription(liveHub.description ?? "");
                        setEditingField(null);
                      }
                      if (e.key === "Enter") setEditingField(null);
                    }}
                    placeholder="What documents live here and how agents use them"
                    className="text-sm"
                    aria-label="Hub description"
                  />
                ) : (
                  <button
                    type="button"
                    className={cn(editableFieldTriggerClass, "mt-0.5")}
                    onClick={() => setEditingField("description")}
                    aria-label="Edit hub description"
                  >
                    <p
                      className={cn(
                        "text-sm",
                        description.trim()
                          ? "text-muted-foreground"
                          : "text-muted-foreground/70 italic",
                      )}
                    >
                      {description.trim() ||
                        "Add a description — click to edit"}
                    </p>
                  </button>
                )}
              </div>
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={onDelete}
                >
                  <Trash2 size={14} />
                  Delete hub
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className={DETAIL_TITLE}>{liveHub.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {liveHub.description || "No description"}
              </p>
            </>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Created{" "}
            <time dateTime={liveHub.createdOn} title={liveHub.createdOn}>
              {formatDisplayDate(liveHub.createdOn)}
            </time>
            {" · "}
            {liveHub.provider}
            {linkedAgents.length > 0 && (
              <>
                {" · "}
                {linkedAgents.length} linked agent
                {linkedAgents.length === 1 ? "" : "s"}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Total Files:</span> {totalFiles}
            {fileQuery.trim() && filteredCount !== totalFiles && (
              <span className="text-muted-foreground">
                {" "}
                ({filteredCount} shown)
              </span>
            )}
            <span className="mx-2 text-border">|</span>
            <span className="font-medium text-foreground">Total Size:</span>{" "}
            {totalSizeMb} MB
          </p>
          {filesToolbar}
        </div>

        {totalFiles === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12">
            <HardDrive size={32} className="text-muted-foreground" aria-hidden />
            <p className="text-center text-sm text-muted-foreground">
              No files attached yet.
              {canEdit ? " Add files from Google Drive or OneDrive." : ""}
            </p>
            {canEdit && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => openCloudAdd("google-drive")}
                >
                  <Plus data-icon="inline-start" aria-hidden />
                  Add from Google Drive
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => openCloudAdd("onedrive")}
                >
                  <Plus data-icon="inline-start" aria-hidden />
                  Add from OneDrive
                </Button>
              </div>
            )}
          </div>
        ) : (
          <TooltipProvider delay={300}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {canEdit && (
                    <TableHead className="w-10">
                      <input
                        ref={selectAllFilesRef}
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={
                          filePagination.items.length > 0 &&
                          filePagination.items.every((r) => selectedFileIds.has(r.id))
                        }
                        onChange={toggleAllFilesOnPage}
                        aria-label="Select all files on this page"
                      />
                    </TableHead>
                  )}
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium"
                      onClick={() => setSortAsc((v) => !v)}
                    >
                      File Name
                      <ArrowUpDown size={14} className="text-muted-foreground" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px]">File Size</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead className="w-[110px]">Date</TableHead>
                  {canEdit && (
                    <TableHead className="w-[72px] text-right">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filePagination.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canEdit ? 6 : 4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No files match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filePagination.items.map((row) => (
                    <TableRow key={row.id}>
                      {canEdit && (
                        <TableCell>
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={selectedFileIds.has(row.id)}
                            onChange={() => toggleFileRow(row.id)}
                            aria-label={`Select ${row.name}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="max-w-0 font-medium">
                        <div className="flex min-w-0 items-center gap-2">
                          <HubFileSyncIcon
                            status={getHubFileStatus(row, {
                              includeDemoStatuses: showDemoStatuses,
                            })}
                            fileName={row.name}
                            canActivate={
                              canEdit &&
                              row.source === "cloud" &&
                              (getHubFileStatus(row) === "linked" ||
                                getHubFileStatus(row) === "failed")
                            }
                            onActivate={() => handleDownloadCloudFile(row)}
                          />
                          <span className="truncate" title={row.name}>
                            {row.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatFileSizeKb(row.sizeKb)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getHubFileSourceLabel(row)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileTableDate(row, liveHub)}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${row.name}`}
                            onClick={() => setFileToDelete(row)}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalFiles > 0 && (
              <HubFileSyncLegend className="border-t border-border px-5 py-2" />
            )}
            {showDemoStatuses && (
              <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">
                Demo seed rows may show sample processing states.
              </p>
            )}
            {sortedFiles.length > FILES_PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
                <p className="text-xs text-muted-foreground">
                  {filePagination.totalItems} files · page {filePagination.currentPage} of{" "}
                  {filePagination.totalPages}
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent className="gap-0.5">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={(e) => {
                          e.preventDefault();
                          setFilePage((p) => Math.max(1, p - 1));
                        }}
                        className={cn(
                          "h-7 cursor-pointer text-xs",
                          filePagination.currentPage === 1 &&
                            "pointer-events-none opacity-40",
                        )}
                        text="Prev"
                      />
                    </PaginationItem>
                    {Array.from({ length: filePagination.totalPages }, (_, i) => i + 1).map(
                      (pg) => (
                        <PaginationItem key={pg}>
                          <PaginationLink
                            isActive={pg === filePagination.currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setFilePage(pg);
                            }}
                            className="h-7 w-7 cursor-pointer text-xs"
                          >
                            {pg}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault();
                          setFilePage((p) =>
                            Math.min(filePagination.totalPages, p + 1),
                          );
                        }}
                        className={cn(
                          "h-7 cursor-pointer text-xs",
                          filePagination.currentPage === filePagination.totalPages &&
                            "pointer-events-none opacity-40",
                        )}
                        text="Next"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TooltipProvider>
        )}

        {inventoryPack?.hasDemoRows && (
          <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">
            Sample rows are shown for demo seed hubs. Upload your own files or remove rows
            you do not need.
          </p>
        )}
      </div>

      {fileToDelete && (
        <ConfirmDialog
          title="Delete file?"
          message={`Remove “${fileToDelete.name}” from this hub?`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteHubFile(liveHub.id, fileToDelete.id);
            onFileDeleted?.(fileToDelete.name);
            setFileToDelete(null);
            setSelectedFileIds((prev) => {
              const next = new Set(prev);
              next.delete(fileToDelete.id);
              return next;
            });
          }}
          onCancel={() => setFileToDelete(null)}
        />
      )}

      {bulkDeleteOpen && (
        <ConfirmDialog
          title="Delete selected files?"
          message={`Remove ${selectedFileIds.size} file${selectedFileIds.size === 1 ? "" : "s"} from this hub?`}
          confirmLabel="Delete"
          onConfirm={executeBulkDelete}
          onCancel={() => setBulkDeleteOpen(false)}
        />
      )}

      {canEdit && (
        <CloudAddFilesDialog
          provider={cloudAddProvider}
          open={cloudAddOpen}
          onOpenChange={setCloudAddOpen}
          connections={providerConnections}
          activeConnection={cloudAddConnection}
          onActiveConnectionChange={setCloudAddConnection}
          connectionName={cloudAddConnection?.name}
          excludeExternalIds={existingExternalIds}
          excludeNames={existingFileNames}
          onConfirm={(selected, connection) => {
            const conn = connection ?? cloudAddConnection;
            const names = addCloudFilesToHub(liveHub.id, selected, conn);
            if (names.length > 0) {
              onFilesAdded?.(names);
            }
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle as="h3">Agents using this hub</CardTitle>
          <CardDescription>Agents with this knowledge base attached</CardDescription>
        </CardHeader>
        <CardContent>
          {linkedAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agents are attached yet. Attach this hub when creating or editing an agent.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {linkedAgents.map((agent) => (
                <li key={agent.id}>
                  <Link
                    to={`/agents/${agent.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Bot size={14} className="text-primary" />
                    {agent.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
