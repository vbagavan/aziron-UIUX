import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Library, LayoutDashboard } from "lucide-react";
import { HubSyncCoachMark } from "@/components/features/knowledge/HubSyncCoachMark";
import { HubAddSourceDialog } from "@/components/features/knowledge/HubAddSourceDialog";
import {
  countSyncStates,
  rowsNeedingDownload,
} from "@/components/features/knowledge/hubFileSyncUtils";
import { KnowledgeHubWorkspaceView } from "@/components/features/knowledge/KnowledgeHubWorkspaceView";
import { HubLibraryView } from "@/components/features/knowledge/HubLibraryView";
import { getKnowledgeHubCloudProvider } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import ConnectionWizard from "@/components/connections/ConnectionWizard.jsx";
import { useConnectionsStore } from "@/lib/connections/store.js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HubFilePreviewViewer } from "@/components/features/knowledge/HubFilePreviewViewer";
import { agentsUsingHub } from "@/lib/agentKnowledge";
import { useAgents } from "@/context/AgentsContext";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import {
  ACCEPTED_FILE_EXTENSIONS,
  buildHubFileInventory,
  getHubFileStatus,
} from "@/data/knowledgeHubs";
import { useHubFileUploads } from "@/components/features/knowledge/useHubFileUploads";
import { cn } from "@/lib/utils";

const VIEW_MODES = [
  { id: "library",   label: "Library",   icon: Library },
  { id: "workspace", label: "Workspace", icon: LayoutDashboard },
];

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
  const { getHubById, deleteHubFile, downloadCloudFileToHub, addCloudFilesToHub, addFilesToHub, hubs } =
    useKnowledgeHubs();
  // Memoize liveHub by identity-stable deps to avoid creating a new object on
  // every render (getHubById always returns `{ ...hub, usedBy }` — a new ref).
  // Using hubProp.id + getHubById (which is stable via useCallback in context)
  // ensures this only recomputes when the hub data or agents actually change.
  const liveHub = useMemo(
    () => (hubProp ? getHubById(hubProp.id) ?? hubProp : null),
    [hubProp, getHubById, hubs],
  );

  const { agents } = useAgents();
  const [viewMode, setViewMode] = useState("library");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fileQuery, setFileQuery] = useState("");
  const [uploadHighlightId, setUploadHighlightId] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // Library view preserved state
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilterType, setLibraryFilterType] = useState("all");
  const [librarySortBy, setLibrarySortBy] = useState("recent");
  const [addSourceWizardOpen, setAddSourceWizardOpen] = useState(false);
  const [addSourceProvider, setAddSourceProvider] = useState(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const openIntegrationsWizard = useConnectionsStore((s) => s.openWizard);
  const openIntegrationsWizardWithProvider = useConnectionsStore((s) => s.openWizardWithProvider);
  const uploadInputRef = useRef(null);

  const { pendingUploads, cancelUpload, uploadFiles } = useHubFileUploads({
    hubId: liveHub?.id,
    addFilesToHub,
    onUploadComplete: (records) => {
      const latest = records[records.length - 1];
      if (latest?.id) {
        setUploadHighlightId(latest.id);
      }
      setFileQuery("");
      setLibrarySearch("");
      setLibraryFilterType("all");
      if (records.length > 0) {
        onFilesAdded?.(records.map((r) => r.name), "upload");
      }
    },
  });

  useEffect(() => {
    if (!liveHub) return;
    setName(liveHub.name ?? "");
    setDescription(liveHub.description ?? "");
  }, [liveHub]);

  const inventoryPack = useMemo(
    () => (liveHub ? buildHubFileInventory(liveHub) : null),
    [liveHub],
  );

  const linkedAgents = useMemo(
    () => (liveHub ? agentsUsingHub(liveHub.id, agents) : []),
    [liveHub, agents],
  );

  const allFiles = useMemo(
    () => inventoryPack?.allFiles ?? [],
    [inventoryPack],
  );

  const sortedFiles = useMemo(() => {
    let list = [...allFiles];
    const q = fileQuery.trim().toLowerCase();
    if (q) list = list.filter((row) => row.name.toLowerCase().includes(q));
    list.sort((a, b) => {
      const aTime = Date.parse(a.uploadedAt ?? "") || 0;
      const bTime = Date.parse(b.uploadedAt ?? "") || 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [allFiles, fileQuery]);

  const detailsDirty =
    liveHub &&
    (name.trim() !== (liveHub.name ?? "").trim() ||
      description.trim() !== (liveHub.description ?? "").trim());

  const showDemoStatuses = inventoryPack?.hasDemoRows ?? false;

  function openHubConnectorWizard(provider) {
    const providerConfig = getKnowledgeHubCloudProvider(provider);
    if (providerConfig && !providerConfig.enabled) return;
    setAddSourceProvider(provider);
    setAddSourceWizardOpen(true);
  }

  function handleAddSourceWizardComplete(result, provider) {
    const names = addCloudFilesToHub(liveHub.id, result.selectedFiles, result.connection);
    if (names.length > 0) {
      onFilesAdded?.(names, provider);
    }
  }

  const hasCloudFiles = allFiles.some((row) => row.source === "cloud");
  const hasSampleDemoFiles = allFiles.some((row) => row.isSampleDemo);
  const fileSyncCounts = countSyncStates(allFiles);
  const pendingDownloadRows = useMemo(() => rowsNeedingDownload(allFiles), [allFiles]);

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

  async function handleUploadFilesPick(e) {
    const list = e.target.files;
    if (!list?.length || !liveHub) return;
    await uploadFiles(list);
    e.target.value = "";
  }

  async function handleAddStudioToSources(item) {
    if (!liveHub || !canEdit || !item) return;
    const body =
      item.content ??
      `Generated studio output for ${liveHub.name}.\n\nConnect the Studio backend for live content.`;
    const safeBase =
      item.title.replace(/[^\w\s.-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) ||
      "studio-output";
    let fileName = safeBase.toLowerCase().endsWith(".txt") ? safeBase : `${safeBase}.txt`;
    const existing = new Set(allFiles.map((f) => f.name.toLowerCase()));
    let counter = 1;
    while (existing.has(fileName.toLowerCase())) {
      const stem = safeBase.replace(/\.txt$/i, "");
      fileName = `${stem} (${counter}).txt`;
      counter += 1;
    }

    const file = new File([`${item.title}\n\n${body}`], fileName, { type: "text/plain" });
    const result = await addFilesToHub(liveHub.id, [file]);
    if (result.added?.length > 0) {
      onFilesAdded?.(result.added);
    }
  }

  if (!liveHub) return null;

  function handleSaveDetails() {
    if (!name.trim()) return;
    onSave?.({ name: name.trim(), description: description.trim() });
  }

  function handleSettingsBlur() {
    if (detailsDirty && name.trim()) {
      handleSaveDetails();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {!canEdit && (
        <Alert className="shrink-0 py-2">
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            View-only access — browse sources and chat; uploads and edits are disabled.
          </AlertDescription>
        </Alert>
      )}

      {hasSampleDemoFiles && (
        <Alert className="shrink-0 py-2">
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            Sample OneDrive files included for demo. Save them to your knowledge base or replace with your own sources.
          </AlertDescription>
        </Alert>
      )}

      <HubSyncCoachMark visible={hasCloudFiles && fileSyncCounts.cloudLink > 0} />

      {/* ── View Switcher ── */}
      <div className="flex shrink-0 items-center justify-center">
        <div className="flex rounded-xl border border-border bg-muted/40 p-0.5">
          {VIEW_MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-all",
                viewMode === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Library View ── */}
      {viewMode === "library" && (
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/40 bg-background shadow-elevation-sm">
          <HubLibraryView
            hubId={liveHub.id}
            hubName={name.trim() || liveHub.name}
            allFiles={sortedFiles}
            canEdit={canEdit}
            onUploadFiles={() => uploadInputRef.current?.click()}
            onDeleteFile={canEdit ? setFileToDelete : undefined}
            onPreviewFile={setPreviewFile}
            searchQuery={librarySearch}
            onSearchQueryChange={setLibrarySearch}
            filterType={libraryFilterType}
            onFilterTypeChange={setLibraryFilterType}
            sortBy={librarySortBy}
            onSortByChange={setLibrarySortBy}
            highlightFileId={uploadHighlightId}
            onHighlightSeen={() => setUploadHighlightId(null)}
          />
        </div>
      )}

      {/* ── Workspace View ── */}
      {viewMode === "workspace" && (
        <KnowledgeHubWorkspaceView
          hubId={liveHub.id}
          hubName={name.trim() || liveHub.name}
          hubDescription={description.trim() || liveHub.description}
          settingsName={name}
          settingsDescription={description}
          onSettingsNameChange={setName}
          onSettingsDescriptionChange={setDescription}
          onSaveSettings={handleSaveDetails}
          onDeleteHub={canDelete ? onDelete : undefined}
          settingsDirty={!!detailsDirty}
          onSettingsBlur={handleSettingsBlur}
          allFiles={sortedFiles}
          canEdit={canEdit}
          showDemoStatuses={showDemoStatuses}
          onRefreshSources={handleDownloadAllLinked}
          sourceQuery={fileQuery}
          onSourceQueryChange={setFileQuery}
          onConnectCloudProvider={openHubConnectorWizard}
          onConnectCatalogProvider={openIntegrationsWizardWithProvider}
          onBrowseAllConnectors={openIntegrationsWizard}
          onCustomConnector={openIntegrationsWizardWithProvider}
          onUploadFiles={() => uploadInputRef.current?.click()}
          onDownloadCloudFile={handleDownloadCloudFile}
          onDeleteFile={canEdit ? setFileToDelete : undefined}
          pendingDownloadCount={pendingDownloadRows.length}
          onDownloadAllPending={
            pendingDownloadRows.length > 0 ? handleDownloadAllLinked : undefined
          }
          isDownloadingAll={isDownloadingAll}
          linkedAgents={linkedAgents}
          pendingUploads={pendingUploads}
          onCancelUpload={cancelUpload}
          uploadHighlightId={uploadHighlightId}
          onUploadHighlightSeen={() => setUploadHighlightId(null)}
          onAddStudioToSources={canEdit ? handleAddStudioToSources : undefined}
        />
      )}

      {/* Shared: hidden file input, delete confirm, and source dialogs */}
      <input
        ref={uploadInputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_EXTENSIONS}
        className="sr-only"
        onChange={handleUploadFilesPick}
        aria-hidden
      />

      {fileToDelete && (
        <ConfirmDialog
          title="Delete file?"
          message={`Remove "${fileToDelete.name}" from this hub?`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteHubFile(liveHub.id, fileToDelete.id);
            onFileDeleted?.(fileToDelete.name);
            if (previewFile?.id === fileToDelete.id) setPreviewFile(null);
            setFileToDelete(null);
          }}
          onCancel={() => setFileToDelete(null)}
        />
      )}

      {previewFile && liveHub && (
        <Dialog open onOpenChange={(open) => { if (!open) setPreviewFile(null); }}>
          <DialogContent className="flex h-[min(88vh,calc(100dvh-2rem))] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
            <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
              <DialogTitle className="truncate text-base">{previewFile.name}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden">
              <HubFilePreviewViewer
                hubId={liveHub.id}
                file={previewFile}
                allFiles={sortedFiles}
                showDemoStatuses={showDemoStatuses}
                onRequestDownload={() => handleDownloadCloudFile(previewFile)}
                className="h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {canEdit && (
        <>
          <HubAddSourceDialog
            open={addSourceWizardOpen}
            onOpenChange={(nextOpen) => {
              setAddSourceWizardOpen(nextOpen);
              if (!nextOpen) setAddSourceProvider(null);
            }}
            provider={addSourceProvider}
            onComplete={handleAddSourceWizardComplete}
          />

          <ConnectionWizard />
        </>
      )}
    </div>
  );
}
