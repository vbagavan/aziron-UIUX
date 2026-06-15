import { useCallback, useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HubSyncCoachMark } from "@/components/features/knowledge/HubSyncCoachMark";
import { HubAddSourceDialog } from "@/components/features/knowledge/HubAddSourceDialog";
import {
  countSyncStates,
  rowsNeedingDownload,
} from "@/components/features/knowledge/hubFileSyncUtils";
import { KnowledgeHubControlCenter } from "@/components/features/knowledge/control-center/KnowledgeHubControlCenter";
import { HubLibraryView } from "@/components/features/knowledge/HubLibraryView";
import { HubFilePreviewViewer } from "@/components/features/knowledge/HubFilePreviewViewer";
import { DocumentsUploadDialog } from "@/components/features/documents/DocumentsUploadDialog";
import { getKnowledgeHubCloudProvider } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import ConnectionWizard from "@/components/connections/ConnectionWizard.jsx";
import { useConnectionsStore } from "@/lib/connections/store.js";
import { HubAddSourcesMenu } from "@/components/features/knowledge/HubAddSourcesMenu";
import { CloudAddFilesDialog } from "@/components/features/knowledge/cloud/CloudAddFilesDialog";
import { HubSettingsSheet } from "@/components/features/knowledge/HubSettingsSheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { buildHubFileInventory, getHubFileStatus } from "@/data/knowledgeHubs";
import { getMergedHubCloudConnections } from "@/lib/hubCloudConnections";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export function KnowledgeHubDetailView({
  hub: hubProp,
  onSave,
  onDelete,
  onFilesAdded,
  onFileDeleted,
  onCloudFileSynced,
  onCloudFileSyncFailed,
  onMetadataChange,
  hubNavRequest = null,
  onHubNavHandled,
  canEdit = true,
  canDelete = true,
}) {
  const { getHubById, deleteHubFile, downloadCloudFileToHub, addCloudFilesToHub, addDocumentsToHub, hubs, recordHubAccess, updateHub } =
    useKnowledgeHubs();

  const liveHub = useMemo(
    () => (hubProp ? getHubById(hubProp.id) ?? hubProp : null),
    [hubProp, getHubById, hubs],
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fileToDelete, setFileToDelete] = useState(null);
  const [addSourceWizardOpen, setAddSourceWizardOpen] = useState(false);
  const [addSourceProvider, setAddSourceProvider] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [chooseSourceOpen, setChooseSourceOpen] = useState(false);
  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [cloudPickerConnection, setCloudPickerConnection] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [hubSurface, setHubSurface] = useState("control-center");
  const [libraryFileId, setLibraryFileId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilterType, setLibraryFilterType] = useState("all");
  const [librarySortBy, setLibrarySortBy] = useState("recent");
  const openIntegrationsWizard = useConnectionsStore((s) => s.openWizard);
  const openIntegrationsWizardWithProvider = useConnectionsStore((s) => s.openWizardWithProvider);
  const navigate = useNavigate();

  useEffect(() => {
    if (!liveHub) return;
    setName(liveHub.name ?? "");
    setDescription(liveHub.description ?? "");
    recordHubAccess(liveHub.id);
    setHubSurface("control-center");
    setLibraryFileId(null);
    setPreviewFile(null);
  }, [liveHub, recordHubAccess]);

  const inventoryPack = useMemo(
    () => (liveHub ? buildHubFileInventory(liveHub) : null),
    [liveHub],
  );

  const allFiles = useMemo(() => inventoryPack?.allFiles ?? [], [inventoryPack]);

  const cloudConnections = useMemo(
    () => getMergedHubCloudConnections(liveHub),
    [liveHub],
  );

  const cloudPickerExcludeExternalIds = useMemo(
    () => allFiles.map((f) => f.externalFileId).filter(Boolean),
    [allFiles],
  );

  const cloudPickerExcludeNames = useMemo(
    () => allFiles.map((f) => f.name),
    [allFiles],
  );

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

  async function handleAddSourceWizardComplete(result, provider) {
    const names = await addCloudFilesToHub(liveHub.id, result.selectedFiles, result.connection);
    if (names.length > 0) {
      onFilesAdded?.(names, provider);
    }
  }

  function openUploadDialog() {
    setUploadDialogOpen(true);
  }

  async function handleHubUpload({ files = [], cloudImport, cloudImports, skippedLocal = 0 } = {}) {
    try {
      const result = await addDocumentsToHub(liveHub.id, { files, cloudImport, cloudImports });
      const count = result?.added?.length ?? 0;
      if (count === 0) return;
      onFilesAdded?.(result.added, "upload");
    } catch {
      onFilesAdded?.([], "upload");
    }
  }

  const hasCloudFiles = allFiles.some((row) => row.source === "cloud");
  const hasSampleDemoFiles = allFiles.some((row) => row.isSampleDemo);
  const fileSyncCounts = countSyncStates(allFiles);
  const pendingDownloadRows = useMemo(() => rowsNeedingDownload(allFiles), [allFiles]);

  const libraryFileName = useMemo(() => {
    if (!libraryFileId) return null;
    return allFiles.find((f) => f.id === libraryFileId)?.name ?? null;
  }, [libraryFileId, allFiles]);

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
      hubSurface,
      libraryFileName,
    });
  }, [name, description, detailsDirty, liveHub?.name, hubSurface, libraryFileName, onMetadataChange]);

  useEffect(() => {
    if (hubNavRequest !== "control-center") return;
    setHubSurface("control-center");
    setLibraryFileId(null);
    onHubNavHandled?.();
  }, [hubNavRequest, onHubNavHandled]);

  useEffect(() => {
    if (!detailsDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [detailsDirty]);

  if (!liveHub) return null;

  function handleSaveDetails() {
    if (!name.trim()) return;
    onSave?.({ name: name.trim(), description: description.trim() });
  }

  function handlePublish() {
    updateHub(liveHub.id, { status: "published" });
    onFilesAdded?.([], "published");
  }

  function openLibraryFile(fileId) {
    setLibraryFileId(fileId);
    setHubSurface("library");
  }

  function backToControlCenter() {
    setHubSurface("control-center");
    setLibraryFileId(null);
  }

  function openCloudFilePicker(connection) {
    if (!connection?.provider) return;
    setCloudPickerConnection(connection);
    setCloudPickerOpen(true);
  }

  async function handleAddFromCloudPicker(selectedFiles, connection) {
    const names = await addCloudFilesToHub(liveHub.id, selectedFiles, connection);
    if (names.length > 0) {
      onFilesAdded?.(names, connection?.provider ?? "cloud");
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {!canEdit && (
        <Alert className="mx-3 mt-2 shrink-0 py-2">
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            View-only access — uploads and edits are disabled.
          </AlertDescription>
        </Alert>
      )}

      {hasSampleDemoFiles && (
        <Alert className="mx-3 mt-2 shrink-0 py-2">
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            Sample OneDrive files included for demo. Save them to your knowledge base or replace with your own sources.
          </AlertDescription>
        </Alert>
      )}

      <HubSyncCoachMark visible={hasCloudFiles && fileSyncCounts.cloudLink > 0} />

      {hubSurface === "library" ? (
        <HubLibraryView
          hubId={liveHub.id}
          hubName={name.trim() || liveHub.name}
          allFiles={allFiles}
          canEdit={canEdit}
          onUploadFiles={canEdit ? openUploadDialog : undefined}
          onDeleteFile={canEdit ? setFileToDelete : undefined}
          onPreviewFile={setPreviewFile}
          searchQuery={librarySearch}
          onSearchQueryChange={setLibrarySearch}
          filterType={libraryFilterType}
          onFilterTypeChange={setLibraryFilterType}
          sortBy={librarySortBy}
          onSortByChange={setLibrarySortBy}
          initialFileId={libraryFileId}
          onBrowseDocumentsLibrary={() =>
            navigate(`/documents?linkHub=${encodeURIComponent(liveHub.id)}`)
          }
          backLabel={KNOWLEDGE_TERMS.controlCenter}
          onBack={backToControlCenter}
        />
      ) : (
        <KnowledgeHubControlCenter
          hub={liveHub}
          hubName={name.trim() || liveHub.name}
          hubDescription={description.trim() || liveHub.description}
          allFiles={allFiles}
          canEdit={canEdit}
          showDemoStatuses={showDemoStatuses}
          onOpenSources={canEdit ? () => setChooseSourceOpen(true) : undefined}
          onOpenLibraryFile={openLibraryFile}
          onDeleteFile={canEdit ? setFileToDelete : undefined}
          onDownloadCloudFile={handleDownloadCloudFile}
          onEditHub={canEdit ? () => setSettingsOpen(true) : undefined}
          onPublish={canEdit ? handlePublish : undefined}
          pendingDownloadCount={pendingDownloadRows.length}
          onDownloadAllPending={pendingDownloadRows.length > 0 ? handleDownloadAllLinked : undefined}
          onBrowseDocumentsLibrary={() =>
            navigate(`/documents?linkHub=${encodeURIComponent(liveHub.id)}`)
          }
          className="min-h-0 flex-1"
        />
      )}

      {canEdit && (
        <DocumentsUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          hubId={liveHub.id}
          hubName={name.trim() || liveHub.name}
          onFilesAdded={handleHubUpload}
        />
      )}

      {fileToDelete && (
        <ConfirmDialog
          title="Remove from hub?"
          message={`Remove "${fileToDelete.name}" from this hub? The document will remain in your library if linked.`}
          confirmLabel="Remove"
          onConfirm={() => {
            deleteHubFile(liveHub.id, fileToDelete.id);
            onFileDeleted?.(fileToDelete.name);
            if (previewFile?.id === fileToDelete.id) setPreviewFile(null);
            if (libraryFileId === fileToDelete.id) backToControlCenter();
            setFileToDelete(null);
          }}
          onCancel={() => setFileToDelete(null)}
        />
      )}

      {previewFile && liveHub ? (
        <Dialog open onOpenChange={(open) => { if (!open) setPreviewFile(null); }}>
          <DialogContent className="flex h-[min(88vh,calc(100dvh-2rem))] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
            <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
              <DialogTitle className="truncate text-base">{previewFile.name}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden">
              <HubFilePreviewViewer
                hubId={liveHub.id}
                file={previewFile}
                allFiles={allFiles}
                showDemoStatuses={showDemoStatuses}
                onRequestDownload={() => handleDownloadCloudFile(previewFile)}
                className="h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <HubSettingsSheet
            embedded
            name={name}
            description={description}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onSave={() => {
              handleSaveDetails();
              setSettingsOpen(false);
            }}
            onDelete={canDelete ? onDelete : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
            detailsDirty={!!detailsDirty}
            onNameBlur={handleSaveDetails}
            onDescriptionBlur={handleSaveDetails}
          />
        </SheetContent>
      </Sheet>

      <HubAddSourcesMenu
        open={chooseSourceOpen && canEdit}
        onOpenChange={(open) => {
          if (!canEdit) return;
          setChooseSourceOpen(open);
        }}
        showTrigger={false}
        cloudConnections={cloudConnections}
        onBrowseCloudConnection={openCloudFilePicker}
        onConnectHubProvider={openHubConnectorWizard}
        onConnectCatalogProvider={openIntegrationsWizardWithProvider}
        onBrowseAllConnectors={openIntegrationsWizard}
        onCustomConnector={openIntegrationsWizardWithProvider}
        onUploadFiles={openUploadDialog}
      />

      {canEdit && cloudPickerConnection ? (
        <CloudAddFilesDialog
          provider={cloudPickerConnection.provider}
          open={cloudPickerOpen}
          onOpenChange={(open) => {
            setCloudPickerOpen(open);
            if (!open) setCloudPickerConnection(null);
          }}
          connectionName={cloudPickerConnection.name}
          connections={cloudConnections.filter(
            (c) => c.provider === cloudPickerConnection.provider,
          )}
          activeConnection={cloudPickerConnection}
          excludeExternalIds={cloudPickerExcludeExternalIds}
          excludeNames={cloudPickerExcludeNames}
          onConfirm={handleAddFromCloudPicker}
        />
      ) : null}

      {canEdit && addSourceProvider ? (
        <HubAddSourceDialog
          open={addSourceWizardOpen}
          onOpenChange={(nextOpen) => {
            setAddSourceWizardOpen(nextOpen);
            if (!nextOpen) setAddSourceProvider(null);
          }}
          provider={addSourceProvider}
          onComplete={handleAddSourceWizardComplete}
        />
      ) : null}

      {canEdit ? <ConnectionWizard /> : null}
    </div>
  );
}
