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
import { FeatureErrorBoundary } from "@/components/common/FeatureErrorBoundary";
import { DocumentReaderDrawer } from "@/components/features/documents/DocumentReaderDrawer";
import { DatabaseDetailView } from "@/components/features/databases/DatabaseDetailView";
import { ApiDetailView } from "@/components/features/apis/ApiDetailView";
import { DocumentsUploadDialog } from "@/components/features/documents/DocumentsUploadDialog";
import { DbBrowseTablesDialog } from "@/components/features/knowledge/sources/DbBrowseTablesDialog";
import { getKnowledgeHubCloudProvider } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import ConnectionWizard from "@/components/connections/ConnectionWizard.jsx";
import { useConnectionsStore } from "@/lib/connections/store.js";
import { HubAddSourcesMenu } from "@/components/features/knowledge/HubAddSourcesMenu";
import { HubSettingsSheet } from "@/components/features/knowledge/HubSettingsSheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { buildHubFileInventory, getHubFileStatus } from "@/data/knowledgeHubs";
import {
  createApiLibraryRecord,
  createDbLibraryRecord,
  DEMO_DB_CONNECTIONS,
} from "@/data/documentLibrary";
import { getMergedHubCloudConnections } from "@/lib/hubCloudConnections";
import { DB_SOURCE_CONNECTORS, resolveSourceCategory } from "@/lib/sourceCategories";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export function KnowledgeHubDetailView({
  hub: hubProp,
  onSave,
  onDelete,
  onFilesAdded,
  onFileDeleted,
  onCloudFileSynced,
  onCloudFileSyncFailed,
  onNotify,
  onMetadataChange,
  hubNavRequest = null,
  onHubNavHandled,
  canEdit = true,
  canDelete = true,
  onBrowseDocumentsLibrary,
  onOpenDocument,
  onBackToHubs,
  requestedTab = null,
  requestedAssetId = null,
}) {
  const { getHubById, deleteHubFile, downloadCloudFileToHub, addCloudFilesToHub, addDocumentsToHub, addCategorySourcesToLibrary, hubs, recordHubAccess, updateHub } =
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
  const [uploadBrowseConnection, setUploadBrowseConnection] = useState(null);
  const [chooseSourceOpen, setChooseSourceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [hubSurface, setHubSurface] = useState("control-center");
  const [previewFile, setPreviewFile] = useState(null);
  const [dbConnections, setDbConnections] = useState(DEMO_DB_CONNECTIONS);
  const [dbBrowseTarget, setDbBrowseTarget] = useState(null);
  const openIntegrationsWizard = useConnectionsStore((s) => s.openWizard);
  const openIntegrationsWizardWithProvider = useConnectionsStore((s) => s.openWizardWithProvider);
  const navigate = useNavigate();

  const browseDocumentsLibrary = useCallback(
    (hubId) => {
      if (onBrowseDocumentsLibrary) {
        onBrowseDocumentsLibrary(hubId);
        return;
      }
      const params = new URLSearchParams({ tab: "documents", linkHub: String(hubId) });
      navigate(`/knowledge?${params.toString()}`);
    },
    [navigate, onBrowseDocumentsLibrary],
  );

  // Only fire when the hub ID changes (navigating to a different hub), not on every
  // hub-data refresh. Without this, recordHubAccess() → context update → liveHub new
  // reference → effect re-fires → access counter inflates on every tab switch.
  const liveHubId = liveHub?.id ?? null;
  useEffect(() => {
    if (!liveHub) return;
    setName(liveHub.name ?? "");
    setDescription(liveHub.description ?? "");
    recordHubAccess(liveHub.id);
    setHubSurface("control-center");
    setPreviewFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHubId, recordHubAccess]);

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
    setUploadBrowseConnection(null);
    setUploadDialogOpen(true);
  }

  function handleUploadComplete(result) {
    const count = result?.added?.length ?? 0;
    const skipped = result?.rejected ?? 0;
    if (count === 0) {
      onNotify?.({
        title: "Nothing added",
        description:
          skipped > 0
            ? `${skipped} file${skipped === 1 ? "" : "s"} skipped (invalid or too large).`
            : "No valid files were added to this hub.",
        variant: skipped > 0 ? "destructive" : "default",
      });
      return;
    }
    const names = result.added.map((f) => (typeof f === "string" ? f : f?.name)).filter(Boolean);
    onFilesAdded?.(names.length ? names : [`${count} sources`], "upload", { skipped });
  }

  function handleUploadError() {
    onNotify?.({
      title: "Could not add sources",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  }

  const hasCloudFiles = allFiles.some((row) => row.source === "cloud");
  const fileSyncCounts = countSyncStates(allFiles);
  const pendingDownloadRows = useMemo(() => rowsNeedingDownload(allFiles), [allFiles]);

  const activeFileName = previewFile?.name ?? null;

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
      libraryFileName: activeFileName,
    });
  }, [name, description, detailsDirty, liveHub?.name, hubSurface, activeFileName, onMetadataChange]);

  useEffect(() => {
    if (hubNavRequest === "close-preview") {
      setPreviewFile(null);
      onHubNavHandled?.();
      return;
    }
    if (hubNavRequest !== "control-center") return;
    setHubSurface("control-center");
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

  function openHubSource(source) {
    if (!source) return;
    const file = allFiles.find((f) => f.id === source.id) ?? source;
    const openId = file.libraryDocumentId ?? file.id;
    if (onOpenDocument) {
      onOpenDocument(openId);
      return;
    }
    navigate(`/knowledge?tab=documents&openSource=${encodeURIComponent(openId)}`);
  }

  function handleNavigateToHub(hId) {
    setPreviewFile(null);
    if (String(hId) !== String(liveHub.id)) {
      navigate(`/knowledge/${hId}`);
    }
  }

  function backToControlCenter() {
    setHubSurface("control-center");
  }

  function openCloudFilePicker(connection) {
    if (!connection?.provider) return;
    setUploadBrowseConnection(connection);
    setUploadDialogOpen(true);
  }

  function handleConnectDbProvider(providerId) {
    const connector = DB_SOURCE_CONNECTORS.find((c) => c.id === providerId);
    const label = connector?.label ?? providerId;
    const conn = {
      id: `${providerId}-${Date.now()}`,
      name: `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36).slice(-4)}`,
      providerLabel: label,
      provider: providerId,
      tableCount: 0,
    };
    setDbConnections((prev) => [...prev, conn]);
    onNotify?.({
      title: "Database connected",
      description: `${conn.name} is ready — browse tables to add sources.`,
    });
  }

  function handleBrowseDbConnection(connection) {
    setChooseSourceOpen(false);
    setDbBrowseTarget(connection);
  }

  function handleAddDbTable(connection, table) {
    const record = createDbLibraryRecord({
      provider: connection.provider,
      connectionName: connection.name,
      tableName: table.tableName,
      schema: table.schema,
      databaseName: table.databaseName,
      collectionName: table.collectionName,
      rowCount: table.rowCount,
    });
    const { added } = addCategorySourcesToLibrary([record], liveHub.id);
    setDbBrowseTarget(null);
    const name = added[0]?.name ?? table.tableName;
    onFilesAdded?.([name], "database");
    onNotify?.({
      title: "Database source added",
      description: `"${name}" was added to your library and linked to this hub.`,
    });
  }

  function handleAddApiSource(config) {
    const isWebhook = config?.provider === "webhook" || config?.kind === "webhook";
    const record = createApiLibraryRecord({
      ...config,
      kind: isWebhook ? "webhook" : config?.kind ?? "rest-graphql",
      provider: isWebhook ? "webhook" : config?.provider ?? "rest",
    });
    const { added } = addCategorySourcesToLibrary([record], liveHub.id);
    setChooseSourceOpen(false);
    const name = added[0]?.name ?? "API source";
    onFilesAdded?.([name], "api");
    onNotify?.({
      title: "API source added",
      description: `"${name}" was added to your library and linked to this hub.`,
    });
  }

  function handleConnectApiProvider(providerId) {
    if (providerId === "webhook") {
      onNotify?.({
        title: "Webhook",
        description: "Set the inbound URL in the form below, then click Add as source.",
      });
      return;
    }
    onNotify?.({
      title: "REST API",
      description: "Enter the endpoint URL below, preview if needed, then Add as source.",
    });
  }

  function openLibraryView() {
    setPreviewFile(null);
    setHubSurface("control-center");
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

      <HubSyncCoachMark visible={hasCloudFiles && fileSyncCounts.cloudLink > 0} />

      {previewFile ? (
        resolveSourceCategory(previewFile) === "dbs" ? (
          <DatabaseDetailView
            record={{ ...previewFile, hubId: previewFile.hubId ?? liveHub.id }}
            hubLinks={[{ hubId: liveHub.id, hubFileId: previewFile.id, hubName: name.trim() || liveHub.name }]}
            onClose={() => setPreviewFile(null)}
            onNavigateToHub={handleNavigateToHub}
          />
        ) : resolveSourceCategory(previewFile) === "apis" ? (
          <ApiDetailView
            record={{ ...previewFile, hubId: previewFile.hubId ?? liveHub.id }}
            hubLinks={[{ hubId: liveHub.id, hubFileId: previewFile.id, hubName: name.trim() || liveHub.name }]}
            onClose={() => setPreviewFile(null)}
            onNavigateToHub={handleNavigateToHub}
          />
        ) : (
        <DocumentReaderDrawer
          file={{ ...previewFile, hubId: previewFile.hubId ?? liveHub.id, isLibraryDocument: false }}
          hubLinks={[{ hubId: liveHub.id, hubFileId: previewFile.id, hubName: name.trim() || liveHub.name }]}
          hubs={hubs}
          canEdit={canEdit}
          canCreate={false}
          onNavigateToHub={handleNavigateToHub}
          onRemoveHubFile={(hId, fId) => {
            deleteHubFile(hId, fId);
            setPreviewFile(null);
            onFileDeleted?.(previewFile.name);
          }}
          onClose={() => setPreviewFile(null)}
          onNotify={(msg) => onNotify?.(msg)}
        />
        )
      ) : (
        <FeatureErrorBoundary key={liveHub.id}>
        <KnowledgeHubControlCenter
          hub={liveHub}
          hubName={name.trim() || liveHub.name}
          hubDescription={description.trim() || liveHub.description}
          allFiles={allFiles}
          canEdit={canEdit}
          showDemoStatuses={showDemoStatuses}
          onOpenSources={canEdit ? () => setChooseSourceOpen(true) : undefined}
          onOpenSource={openHubSource}
          onDeleteFile={canEdit ? setFileToDelete : undefined}
          onDownloadCloudFile={handleDownloadCloudFile}
          onEditHub={canEdit ? () => setSettingsOpen(true) : undefined}
          pendingDownloadCount={pendingDownloadRows.length}
          onDownloadAllPending={pendingDownloadRows.length > 0 ? handleDownloadAllLinked : undefined}
          onBrowseDocumentsLibrary={() => browseDocumentsLibrary(liveHub.id)}
          onBackToHubs={onBackToHubs}
          requestedTab={requestedTab}
          requestedAssetId={requestedAssetId}
          className="min-h-0 flex-1"
        />
        </FeatureErrorBoundary>
      )}

      {canEdit && (
        <DocumentsUploadDialog
          open={uploadDialogOpen}
          onOpenChange={(nextOpen) => {
            setUploadDialogOpen(nextOpen);
            if (!nextOpen) setUploadBrowseConnection(null);
          }}
          hubId={liveHub.id}
          hubName={name.trim() || liveHub.name}
          cloudConnections={cloudConnections}
          initialBrowseConnection={uploadBrowseConnection}
          excludeExternalIds={cloudPickerExcludeExternalIds}
          excludeNames={cloudPickerExcludeNames}
          onUpload={(payload) => addDocumentsToHub(liveHub?.id, payload)}
          onUploadComplete={(result) => {
            if (result?.allSkipped) {
              onNotify?.({
                title: "Already linked",
                description: "Those files are already sources in this hub. Pick new files or close to continue.",
              });
              return;
            }
            if (result?.hasError && !result?.success) {
              handleUploadError();
              return;
            }
            handleUploadComplete(result);
          }}
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
            setFileToDelete(null);
          }}
          onCancel={() => setFileToDelete(null)}
        />
      )}


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
        connectedDatabases={dbConnections}
        onBrowseCloudConnection={openCloudFilePicker}
        onConnectHubProvider={openHubConnectorWizard}
        onConnectCatalogProvider={openIntegrationsWizardWithProvider}
        onBrowseAllConnectors={openIntegrationsWizard}
        onCustomConnector={openIntegrationsWizardWithProvider}
        onUploadFiles={openUploadDialog}
        onConnectDbProvider={handleConnectDbProvider}
        onBrowseDbConnection={handleBrowseDbConnection}
        onAddApiSource={handleAddApiSource}
        onConnectApiProvider={handleConnectApiProvider}
      />

      <DbBrowseTablesDialog
        connection={dbBrowseTarget}
        open={Boolean(dbBrowseTarget)}
        onOpenChange={(open) => {
          if (!open) setDbBrowseTarget(null);
        }}
        onSelectTable={handleAddDbTable}
      />

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
