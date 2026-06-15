import { useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  X,
  Check,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Cloud,
  FileText,
  FolderOpen,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_EXTENSIONS, ACCEPTED_FILE_TYPES_LABEL } from "@/data/knowledgeHubs";
import { partitionUploadFiles } from "@/lib/hubUploadLimits";
import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";
import { CloudConnectionSwitcher } from "@/components/features/knowledge/cloud/CloudConnectionSwitcher";
import { CloudFilePickerTable } from "@/components/features/knowledge/cloud/CloudFilePickerTable";
import { HubAddSourceDialog } from "@/components/features/knowledge/HubAddSourceDialog";
import { HubAddSourcesMenu } from "@/components/features/knowledge/HubAddSourcesMenu";
import {
  attachedRowsToCloudImports,
  cloudPickerToAttachedRow,
  countImportableAttachedRows,
  mergeAttachedFiles,
  uploadToAttachedRow,
} from "@/components/features/knowledge/createHubAttachedFiles";
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_XL,
} from "@/components/features/knowledge/hubDialogSizes";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

// ─── Helpers ──────────────────────────────────────────────────────────────────

import {
  getAllUploadConnections,
  saveUploadSessionConnection,
} from "@/lib/cloudUploadConnections";

function providerLabel(provider) {
  return provider === "google-drive" ? "Google Drive" : "OneDrive";
}

// ─── Local upload panel (left) ────────────────────────────────────────────────

function LocalUploadPanel({
  pendingCount,
  dragActive,
  fileTooLarge,
  fileInputRef,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileChange,
  onUploadClick,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          From your computer
        </p>
        <div
          className={cn(
            "flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-5 transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
          )}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={onUploadClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onUploadClick();
            }
          }}
          aria-label="Upload files from computer"
        >
          <UploadCloud size={40} className="text-muted-foreground" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Select files or drag and drop</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{ACCEPTED_FILE_TYPES_LABEL}</p>
          </div>
          <Button
            size="sm"
            type="button"
            className="gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick();
            }}
          >
            <UploadCloud size={16} />
            Browse files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_EXTENSIONS}
            className="sr-only"
            onChange={onFileChange}
            tabIndex={-1}
          />
          {pendingCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {pendingCount} local file{pendingCount === 1 ? "" : "s"} in selection — see summary below
            </p>
          ) : null}
        </div>
      </div>

      {fileTooLarge && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="size-4" />
          <AlertTitle className="text-sm">File is too large</AlertTitle>
          <AlertDescription className="text-xs">
            Documents must be under 10 MB; video, audio, and EPUB files under 100 MB.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ─── Cloud connections panel (right) ─────────────────────────────────────────

function ConnectionRow({ connection, onBrowse }) {
  const config = getCloudProviderConfig(connection.provider);
  return (
    <button
      type="button"
      onClick={() => onBrowse(connection)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <img src={config.logo} alt="" className="size-8 shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{connection.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {providerLabel(connection.provider)}
          {connection.accountEmail ? ` · ${connection.accountEmail}` : ""}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        <FolderOpen className="size-3.5" />
        Browse
      </span>
    </button>
  );
}

function CloudConnectionsPanel({ connections, onBrowseConnection, onAddConnection }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-2.5 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <Cloud className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">Cloud storage</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Browse files from connected accounts or add a new cloud connection.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {connections.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No cloud connections yet. Add one below to import files.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Connected accounts
            </p>
            {connections.map((conn) => (
              <ConnectionRow
                key={`${conn.provider}-${conn.id}`}
                connection={conn}
                onBrowse={onBrowseConnection}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-muted/25 p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={onAddConnection}
        >
          <Plus className="size-4" />
          Add new cloud connection
        </Button>
      </div>
    </div>
  );
}

function CloudFilePickerPanel({
  provider,
  connection,
  connections,
  excludeExternalIds,
  excludeNames,
  onBack,
  onAddConnection,
  onAddFiles,
}) {
  const config = getCloudProviderConfig(provider);
  const connectionOptions = useMemo(
    () =>
      (connections ?? []).filter((c) => c.provider === provider).length > 0
        ? connections.filter((c) => c.provider === provider)
        : config.mockConnections ?? [],
    [connections, provider, config.mockConnections],
  );

  const [activeConnection, setActiveConnection] = useState(
    () => connection ?? connectionOptions[0] ?? null,
  );
  const [phase, setPhase] = useState("loading");
  const [fileSearch, setFileSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const sourceFiles = useMemo(() => {
    if (config.getMockFilesForConnection && activeConnection?.id) {
      return config.getMockFilesForConnection(activeConnection.id);
    }
    return config.mockFiles;
  }, [config, activeConnection?.id]);

  const excludeIdSet = useMemo(() => new Set(excludeExternalIds), [excludeExternalIds]);
  const excludeNameSet = useMemo(
    () => new Set(excludeNames.map((n) => n.toLowerCase())),
    [excludeNames],
  );

  const pickerItems = useMemo(
    () =>
      sourceFiles.filter(
        (f) =>
          f.type === "folder" ||
          (!excludeIdSet.has(f.id) && !excludeNameSet.has(f.name.toLowerCase())),
      ),
    [sourceFiles, excludeIdSet, excludeNameSet],
  );

  const selectableFiles = useMemo(
    () => pickerItems.filter((f) => f.type === "file"),
    [pickerItems],
  );

  useEffect(() => {
    setActiveConnection(connection ?? connectionOptions[0] ?? null);
    setPhase("loading");
    setFileSearch("");
    setSelectedIds(new Set());
    const timer = window.setTimeout(() => setPhase("picker"), 700);
    return () => window.clearTimeout(timer);
  }, [connection?.id, provider]);

  function handleToggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleAll(e) {
    if (e.target.checked) {
      setSelectedIds(new Set(selectableFiles.map((f) => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSwitchConnection(conn) {
    if (conn.id === activeConnection?.id) return;
    setActiveConnection(conn);
    setSelectedIds(new Set());
    setFileSearch("");
    setPhase("loading");
    window.setTimeout(() => setPhase("picker"), 700);
  }

  function handleAddSelected() {
    const selected = selectableFiles.filter((f) => selectedIds.has(f.id));
    if (selected.length === 0) return;
    onAddFiles(selected, activeConnection);
    setSelectedIds(new Set());
  }

  const accountsLabel =
    provider === "google-drive" ? "Google Drive accounts" : "OneDrive accounts";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Browse {config.label}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Select files to add to your upload
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <CloudConnectionSwitcher
          logo={config.logo}
          connections={connectionOptions}
          activeConnection={activeConnection}
          onSelectConnection={handleSwitchConnection}
          onAddConnection={onAddConnection}
          accountsLabel={accountsLabel}
          className="mb-3"
        />

        {phase === "loading" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">Loading files…</p>
          </div>
        ) : selectableFiles.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No files available from this connection.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search files"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                aria-label={`Search ${config.label} files`}
              />
            </InputGroup>
            <CloudFilePickerTable
              files={pickerItems}
              selectedIds={selectedIds}
              search={fileSearch}
              onToggleFile={handleToggle}
              onToggleAll={handleToggleAll}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/25 px-3 py-2.5">
        <span className="text-xs text-muted-foreground">
          {selectedIds.size > 0
            ? `${selectedIds.size} file${selectedIds.size === 1 ? "" : "s"} selected`
            : "Select files to import"}
        </span>
        <Button
          type="button"
          size="sm"
          disabled={phase !== "picker" || selectedIds.size === 0}
          onClick={handleAddSelected}
        >
          Add to selection
        </Button>
      </div>
    </div>
  );
}

// ─── Attached files summary ───────────────────────────────────────────────────

function AttachedFilesSummary({ attachedFiles, onRemove }) {
  if (attachedFiles.length === 0) return null;

  const localCount = attachedFiles.filter((r) => r.source === "upload").length;
  const cloudCount = attachedFiles.filter((r) => r.source === "cloud").length;

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">
          Selected for upload
          <span className="ml-1.5 font-normal text-muted-foreground">
            ({attachedFiles.length} total
            {localCount > 0 ? ` · ${localCount} local` : ""}
            {cloudCount > 0 ? ` · ${cloudCount} cloud` : ""})
          </span>
        </p>
      </div>
      <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto">
        {attachedFiles.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-2 rounded-md bg-background/80 px-2 py-1.5"
          >
            {row.source === "cloud" ? (
              <Cloud className="size-3.5 shrink-0 text-sky-500" />
            ) : (
              <Check className="size-3.5 shrink-0 text-emerald-500" />
            )}
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">{row.name}</span>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {row.source === "cloud" ? "Cloud" : "Local"}
            </Badge>
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${row.name}`}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function DocumentsUploadDialog({
  open,
  onOpenChange,
  onFilesAdded,
  hubId = null,
  hubName = null,
}) {
  const isHubTarget = hubId != null;
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [cloudMetas, setCloudMetas] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [skippedLocalCount, setSkippedLocalCount] = useState(0);
  const [savedConnections, setSavedConnections] = useState(() => getAllUploadConnections());

  const [rightPanelMode, setRightPanelMode] = useState("connections");
  const [pickerConnection, setPickerConnection] = useState(null);
  const [pickerProvider, setPickerProvider] = useState("onedrive");
  const [chooseConnectorOpen, setChooseConnectorOpen] = useState(false);
  const [addSourceWizardOpen, setAddSourceWizardOpen] = useState(false);
  const [addSourceProvider, setAddSourceProvider] = useState(null);

  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const filePickerOpenRef = useRef(false);

  const existingExternalIds = useMemo(
    () => attachedFiles.filter((r) => r.pickerFile?.id).map((r) => r.pickerFile.id),
    [attachedFiles],
  );
  const existingFileNames = useMemo(() => attachedFiles.map((r) => r.name), [attachedFiles]);

  function resetDialog() {
    setAttachedFiles([]);
    setPendingFiles([]);
    setCloudMetas({});
    setDragActive(false);
    setFileTooLarge(false);
    setSkippedLocalCount(0);
    dragCounterRef.current = 0;
    setRightPanelMode("connections");
    setPickerConnection(null);
    setPickerProvider("onedrive");
    setChooseConnectorOpen(false);
    setAddSourceWizardOpen(false);
    setAddSourceProvider(null);
    setSavedConnections(getAllUploadConnections());
  }

  function handleClose() {
    onOpenChange(false);
  }

  useEffect(() => {
    if (!open) resetDialog();
  }, [open]);

  function openFilePicker() {
    filePickerOpenRef.current = true;
    window.requestAnimationFrame(() => {
      fileInputRef.current?.click();
    });
  }

  function appendUploadFiles(fileList) {
    const incoming = Array.from(fileList ?? []).filter(Boolean);
    if (incoming.length === 0) return;
    const { valid, rejected } = partitionUploadFiles(incoming);
    if (rejected.length > 0) {
      setSkippedLocalCount((prev) => prev + rejected.length);
      setFileTooLarge(true);
    }
    if (valid.length === 0) return;

    const stamp = Date.now();
    const newRows = valid.map((f, i) => uploadToAttachedRow(f, stamp + i));

    setAttachedFiles((prev) => mergeAttachedFiles(prev, newRows));
    setPendingFiles((prev) => {
      const keys = new Set(prev.map((f) => `${f.name}:${f.lastModified}`));
      const next = [...prev];
      for (const f of valid) {
        const key = `${f.name}:${f.lastModified}`;
        if (!keys.has(key)) {
          next.push(f);
          keys.add(key);
        }
      }
      return next;
    });
  }

  function handleRemoveAttached(id) {
    setAttachedFiles((prev) => {
      const removed = prev.find((r) => r.id === id);
      if (removed?.file) {
        setPendingFiles((pf) => pf.filter((f) => f !== removed.file));
      }
      return prev.filter((r) => r.id !== id);
    });
  }

  function handleCloudWizardComplete(result, provider) {
    if (result?.connection) {
      saveUploadSessionConnection(result.connection, provider);
      setSavedConnections(getAllUploadConnections());
    }
    const cloudRows = result.selectedFiles.map((f) => cloudPickerToAttachedRow(f, provider));
    setCloudMetas((prev) => ({
      ...prev,
      [provider]: {
        provider,
        connection: result.connection,
        connectionName: result.connectionName,
        authMethod: result.authMethod,
      },
    }));
    setAttachedFiles((prev) => {
      const withoutProvider = prev.filter(
        (r) => !(r.source === "cloud" && (r.cloudProvider ?? "onedrive") === provider),
      );
      return mergeAttachedFiles(withoutProvider, cloudRows);
    });
    setRightPanelMode("connections");
  }

  function openHubConnectorWizard(provider) {
    setAddSourceProvider(provider);
    setAddSourceWizardOpen(true);
  }

  function handleConnectCatalogProvider() {
    // Catalog connectors save connections only — not wired to document import in this flow.
  }

  function handleBrowseAllConnectors() {
    // Hidden when showCatalogConnectors is false on HubAddSourcesMenu.
  }

  function handleCustomConnector() {
    // Hidden when showCatalogConnectors is false on HubAddSourcesMenu.
  }

  function handleAddFromPicker(selected, connection) {
    const provider = connection?.provider ?? pickerProvider;
    const cloudRows = selected.map((f) => cloudPickerToAttachedRow(f, provider));
    setCloudMetas((prev) => ({
      ...prev,
      [provider]: prev[provider] ?? {
        provider,
        connection,
        connectionName: connection?.name ?? `${providerLabel(provider)} connection`,
      },
    }));
    setAttachedFiles((prev) => mergeAttachedFiles(prev, cloudRows));
  }

  function handleBrowseConnection(connection) {
    setPickerProvider(connection.provider);
    setPickerConnection(connection);
    setRightPanelMode("picker");
  }

  function handleAddNewConnection() {
    setChooseConnectorOpen(true);
  }

  function handlePickerAddConnection() {
    setAddSourceProvider(pickerProvider);
    setAddSourceWizardOpen(true);
  }

  function handleConfirm() {
    const uploadFiles = attachedFiles
      .filter((r) => (r.source === "upload" || r.source === "user") && r.file)
      .map((r) => r.file);

    const fallbackUploads =
      uploadFiles.length > 0
        ? uploadFiles
        : pendingFiles.length > 0
          ? [...pendingFiles]
          : [];

    if (fallbackUploads.length === 0 && attachedFiles.filter((r) => r.source === "cloud").length === 0) {
      return;
    }

    const cloudImports = attachedRowsToCloudImports(attachedFiles, cloudMetas);

    onFilesAdded?.({
      files: fallbackUploads,
      cloudImports,
      skippedLocal: skippedLocalCount,
    });
    handleClose();
  }

  const importableCount = useMemo(() => {
    const counted = countImportableAttachedRows(attachedFiles, cloudMetas);
    const fallback = Math.max(attachedFiles.length, pendingFiles.length);
    return Math.max(counted, fallback);
  }, [attachedFiles, cloudMetas, pendingFiles.length]);

  const canUpload = importableCount > 0;

  const rightPanel = (() => {
    if (rightPanelMode === "picker") {
      return (
        <CloudFilePickerPanel
          provider={pickerProvider}
          connection={pickerConnection}
          connections={savedConnections}
          excludeExternalIds={existingExternalIds}
          excludeNames={existingFileNames}
          onBack={() => setRightPanelMode("connections")}
          onAddConnection={handlePickerAddConnection}
          onAddFiles={handleAddFromPicker}
        />
      );
    }

    return (
      <CloudConnectionsPanel
        connections={savedConnections}
        onBrowseConnection={handleBrowseConnection}
        onAddConnection={handleAddNewConnection}
      />
    );
  })();

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) return;
          if (filePickerOpenRef.current) {
            filePickerOpenRef.current = false;
            return;
          }
          handleClose();
        }}
      >
      <DialogContent className={HUB_DIALOG_CONTENT_XL}>
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>
            {isHubTarget ? `Add sources to ${KNOWLEDGE_TERMS.hubSingular.toLowerCase()}` : `Upload ${KNOWLEDGE_TERMS.documents}`}
          </DialogTitle>
          <DialogDescription>
            {isHubTarget ? (
              <>
                Upload files to{" "}
                <span className="font-medium text-foreground">{hubName ?? "this hub"}</span>.
                Documents are saved to your central library and linked to this hub automatically — one
                copy, visible in both Documents and Knowledge Hub.
              </>
            ) : (
              <>
                Add files to your document library from your computer or connected cloud storage.
                Link documents to Knowledge Hubs anytime from the Documents page or reader view.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-5")}>
          <div className="flex flex-col gap-5">
            <div className="grid min-h-[360px] grid-cols-1 gap-5 lg:grid-cols-2">
              <LocalUploadPanel
                pendingCount={pendingFiles.length}
                dragActive={dragActive}
                fileTooLarge={fileTooLarge}
                fileInputRef={fileInputRef}
                onDragEnter={() => {
                  dragCounterRef.current += 1;
                  setDragActive(true);
                }}
                onDragLeave={() => {
                  dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
                  if (dragCounterRef.current === 0) setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dragCounterRef.current = 0;
                  setDragActive(false);
                  appendUploadFiles(e.dataTransfer.files);
                }}
                onFileChange={(e) => {
                  filePickerOpenRef.current = false;
                  appendUploadFiles(e.target.files);
                  e.target.value = "";
                }}
                onUploadClick={openFilePicker}
              />
              {rightPanel}
            </div>
            <AttachedFilesSummary attachedFiles={attachedFiles} onRemove={handleRemoveAttached} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canUpload}>
            {importableCount > 0
              ? isHubTarget
                ? `Add ${importableCount} source${importableCount > 1 ? "s" : ""} to hub`
                : `Upload ${importableCount} document${importableCount > 1 ? "s" : ""}`
              : "Select files to upload"}
          </Button>
        </div>
      </DialogContent>
      </Dialog>

      <HubAddSourcesMenu
        open={chooseConnectorOpen}
        onOpenChange={setChooseConnectorOpen}
        showTrigger={false}
        showCatalogConnectors={false}
        hideUploadOption
        onConnectHubProvider={openHubConnectorWizard}
        onConnectCatalogProvider={handleConnectCatalogProvider}
        onBrowseAllConnectors={handleBrowseAllConnectors}
        onCustomConnector={handleCustomConnector}
        onUploadFiles={openFilePicker}
      />

      <HubAddSourceDialog
        open={addSourceWizardOpen}
        onOpenChange={(nextOpen) => {
          setAddSourceWizardOpen(nextOpen);
          if (!nextOpen) setAddSourceProvider(null);
        }}
        provider={addSourceProvider}
        target={isHubTarget ? "hub" : "library"}
        onComplete={handleCloudWizardComplete}
      />
    </>
  );
}
