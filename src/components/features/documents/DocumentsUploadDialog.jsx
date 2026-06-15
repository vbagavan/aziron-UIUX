import { useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_EXTENSIONS, ACCEPTED_FILE_TYPES_LABEL } from "@/data/knowledgeHubs";
import { partitionUploadFiles } from "@/lib/hubUploadLimits";
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
import { SelectedSourcesTable } from "@/components/features/knowledge/SelectedSourcesTable";
import {
  CloudConnectionsPanel,
  CloudFilePickerPanel,
} from "@/components/features/knowledge/cloud/CloudFilePickerPanel";
import {
  HubSourceUploadRow,
  HubUploadProgressSummary,
} from "@/components/features/knowledge/HubSourceUploadRow";
import { useSourceUploadProgress } from "@/components/features/knowledge/useSourceUploadProgress";
import {
  KNOWLEDGE_TERMS,
  addSourcesConfirmLabel,
  addSourcesDialogTitle,
} from "@/lib/knowledgeTerminology";
import {
  getAllUploadConnections,
  saveUploadSessionConnection,
} from "@/lib/cloudUploadConnections";

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
  disabled = false,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {KNOWLEDGE_TERMS.fromComputer}
        </p>
        <div
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-5 transition-colors",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-primary/50 hover:bg-muted/30",
            dragActive ? "border-primary bg-primary/5" : "border-border",
          )}
          onDragEnter={disabled ? undefined : onDragEnter}
          onDragLeave={disabled ? undefined : onDragLeave}
          onDragOver={(e) => !disabled && e.preventDefault()}
          onDrop={disabled ? undefined : onDrop}
          onClick={disabled ? undefined : onUploadClick}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onUploadClick();
            }
          }}
          aria-label="Upload files from computer"
          aria-disabled={disabled}
        >
          <UploadCloud size={40} className="text-muted-foreground" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{KNOWLEDGE_TERMS.selectFilesPrompt}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{ACCEPTED_FILE_TYPES_LABEL}</p>
          </div>
          <Button
            size="sm"
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick();
            }}
          >
            <UploadCloud data-icon="inline-start" aria-hidden />
            {KNOWLEDGE_TERMS.browseFiles}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_EXTENSIONS}
            className="sr-only"
            onChange={onFileChange}
            tabIndex={-1}
            disabled={disabled}
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

function UploadCompletePanel({ result, isHubTarget, onViewInDocuments, onClose }) {
  const count = result?.added?.length ?? 0;
  const skipped = result?.rejected ?? 0;
  const recordIds = (result?.records ?? [])
    .map((r) => r.id ?? r.libraryDocumentId)
    .filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="size-6 text-success" aria-hidden />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">{KNOWLEDGE_TERMS.uploadComplete}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {count > 0
            ? `${count} source${count === 1 ? "" : "s"} added${isHubTarget ? " to hub and library" : " to your library"}.${skipped > 0 ? ` ${skipped} skipped.` : ""}`
            : KNOWLEDGE_TERMS.uploadCompleteDescription}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {!isHubTarget && recordIds.length > 0 && onViewInDocuments ? (
          <Button
            type="button"
            onClick={() => {
              onViewInDocuments(recordIds);
              onClose();
            }}
          >
            {KNOWLEDGE_TERMS.viewInDocuments}
          </Button>
        ) : null}
        <Button type="button" variant={recordIds.length && !isHubTarget ? "outline" : "default"} onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function DocumentsUploadDialog({
  open,
  onOpenChange,
  onUpload,
  onUploadComplete,
  onViewInDocuments,
  hubId = null,
  hubName = null,
  cloudConnections = null,
  initialBrowseConnection = null,
  excludeExternalIds = [],
  excludeNames = [],
}) {
  const isHubTarget = hubId != null;
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [cloudMetas, setCloudMetas] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [skippedLocalCount, setSkippedLocalCount] = useState(0);
  const [savedConnections, setSavedConnections] = useState(() =>
    cloudConnections?.length ? cloudConnections : getAllUploadConnections(),
  );

  const [rightPanelMode, setRightPanelMode] = useState("connections");
  const [pickerConnection, setPickerConnection] = useState(null);
  const [pickerProvider, setPickerProvider] = useState("onedrive");
  const [chooseConnectorOpen, setChooseConnectorOpen] = useState(false);
  const [addSourceWizardOpen, setAddSourceWizardOpen] = useState(false);
  const [addSourceProvider, setAddSourceProvider] = useState(null);

  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const filePickerOpenRef = useRef(false);

  const {
    phase: uploadPhase,
    items: uploadItems,
    result: uploadResult,
    runUpload,
    retryFailed,
    reset: resetUpload,
  } = useSourceUploadProgress({ onUpload });

  const isUploading = uploadPhase === "uploading";
  const isComplete = uploadPhase === "done" || uploadPhase === "error";

  const existingExternalIds = useMemo(
    () => attachedFiles.filter((r) => r.pickerFile?.id).map((r) => r.pickerFile.id),
    [attachedFiles],
  );
  const existingFileNames = useMemo(() => attachedFiles.map((r) => r.name), [attachedFiles]);

  const mergedExcludeExternalIds = useMemo(
    () => [...existingExternalIds, ...excludeExternalIds],
    [existingExternalIds, excludeExternalIds],
  );
  const mergedExcludeNames = useMemo(
    () => [...existingFileNames, ...excludeNames],
    [existingFileNames, excludeNames],
  );

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
    setSavedConnections(
      cloudConnections?.length ? cloudConnections : getAllUploadConnections(),
    );
    resetUpload();
  }

  function handleClose() {
    onOpenChange(false);
  }

  useEffect(() => {
    if (!open) resetDialog();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSavedConnections(
      cloudConnections?.length ? cloudConnections : getAllUploadConnections(),
    );
  }, [open, cloudConnections]);

  useEffect(() => {
    if (!open || !initialBrowseConnection?.provider || isUploading || isComplete) return;
    setPickerProvider(initialBrowseConnection.provider);
    setPickerConnection(initialBrowseConnection);
    setRightPanelMode("picker");
  }, [open, initialBrowseConnection?.id, initialBrowseConnection?.provider, isUploading, isComplete]);

  function openFilePicker() {
    if (isUploading || isComplete) return;
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

  function handleAddFromPicker(selected, connection) {
    const provider = connection?.provider ?? pickerProvider;
    const cloudRows = selected.map((f) => cloudPickerToAttachedRow(f, provider));
    setCloudMetas((prev) => ({
      ...prev,
      [provider]: prev[provider] ?? {
        provider,
        connection,
        connectionName: connection?.name ?? `${provider === "google-drive" ? "Google Drive" : "OneDrive"} connection`,
      },
    }));
    setAttachedFiles((prev) => mergeAttachedFiles(prev, cloudRows));
  }

  function handleBrowseConnection(connection) {
    setPickerProvider(connection.provider);
    setPickerConnection(connection);
    setRightPanelMode("picker");
  }

  async function handleConfirm() {
    const uploadFiles = attachedFiles
      .filter((r) => (r.source === "upload" || r.source === "user") && r.file)
      .map((r) => r.file);

    const fallbackUploads =
      uploadFiles.length > 0
        ? uploadFiles
        : pendingFiles.length > 0
          ? [...pendingFiles]
          : [];

    if (
      fallbackUploads.length === 0 &&
      attachedFiles.filter((r) => r.source === "cloud").length === 0
    ) {
      return;
    }

    const cloudImports = attachedRowsToCloudImports(attachedFiles, cloudMetas);
    const finalResult = await runUpload({
      files: fallbackUploads,
      cloudImports,
      skippedLocal: skippedLocalCount,
    });

    onUploadComplete?.(finalResult);
  }

  const importableCount = useMemo(() => {
    const counted = countImportableAttachedRows(attachedFiles, cloudMetas);
    const fallback = Math.max(attachedFiles.length, pendingFiles.length);
    return Math.max(counted, fallback);
  }, [attachedFiles, cloudMetas, pendingFiles.length]);

  const canUpload = importableCount > 0 && !isUploading && !isComplete;

  const rightPanel = (() => {
    if (isUploading || isComplete) return null;

    if (rightPanelMode === "picker") {
      return (
        <CloudFilePickerPanel
          provider={pickerProvider}
          connection={pickerConnection}
          connections={savedConnections}
          excludeExternalIds={mergedExcludeExternalIds}
          excludeNames={mergedExcludeNames}
          onBack={() => setRightPanelMode("connections")}
          onAddConnection={() => {
            setAddSourceProvider(pickerProvider);
            setAddSourceWizardOpen(true);
          }}
          onAddFiles={handleAddFromPicker}
        />
      );
    }

    return (
      <CloudConnectionsPanel
        connections={savedConnections}
        onBrowseConnection={handleBrowseConnection}
        onAddConnection={() => setChooseConnectorOpen(true)}
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
          if (isUploading) return;
          handleClose();
        }}
      >
        <DialogContent className={HUB_DIALOG_CONTENT_XL}>
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>
              {isComplete && uploadResult?.success
                ? KNOWLEDGE_TERMS.uploadComplete
                : isUploading
                  ? KNOWLEDGE_TERMS.uploadingSources
                  : addSourcesDialogTitle({
                      hubName: isHubTarget ? (hubName ?? KNOWLEDGE_TERMS.hubSingular) : null,
                    })}
            </DialogTitle>
            <DialogDescription>
              {isUploading || isComplete ? (
                isComplete && uploadResult?.hasError && !uploadResult?.success
                  ? KNOWLEDGE_TERMS.uploadFailedDescription
                  : "Please wait while your sources are processed."
              ) : isHubTarget ? (
                <>
                  Add files to{" "}
                  <span className="font-medium text-foreground">{hubName ?? "this hub"}</span>.{" "}
                  {KNOWLEDGE_TERMS.addSourcesDescriptionHub}
                </>
              ) : (
                KNOWLEDGE_TERMS.addSourcesDescriptionLibrary
              )}
            </DialogDescription>
          </DialogHeader>

          <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-5")}>
            {isComplete ? (
              uploadResult?.success ? (
                <UploadCompletePanel
                  result={uploadResult}
                  isHubTarget={isHubTarget}
                  onViewInDocuments={onViewInDocuments}
                  onClose={handleClose}
                />
              ) : (
                <div className="flex flex-col gap-4 py-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>{KNOWLEDGE_TERMS.uploadFailed}</AlertTitle>
                    <AlertDescription>{KNOWLEDGE_TERMS.uploadFailedDescription}</AlertDescription>
                  </Alert>
                  <ul className="flex flex-col gap-1">
                    {uploadItems.map((item) => (
                      <HubSourceUploadRow
                        key={item.id}
                        upload={item}
                        onRetry={() => retryFailed()}
                      />
                    ))}
                  </ul>
                </div>
              )
            ) : isUploading ? (
              <div className="flex flex-col gap-3 py-2">
                <HubUploadProgressSummary uploads={uploadItems} />
                <ul className="flex flex-col gap-1">
                  {uploadItems.map((item) => (
                    <HubSourceUploadRow key={item.id} upload={item} />
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="grid min-h-[360px] grid-cols-1 gap-5 lg:grid-cols-2">
                  <LocalUploadPanel
                    pendingCount={pendingFiles.length}
                    dragActive={dragActive}
                    fileTooLarge={fileTooLarge}
                    fileInputRef={fileInputRef}
                    disabled={isUploading}
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
                <SelectedSourcesTable
                  attachedFiles={attachedFiles}
                  onRemove={handleRemoveAttached}
                  maxHeightClass="max-h-52"
                />
              </div>
            )}
          </div>

          {!isComplete && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              {isUploading ? (
                <Button disabled>Adding…</Button>
              ) : uploadPhase === "error" ? (
                <Button onClick={() => retryFailed()}>Retry failed</Button>
              ) : (
                <Button onClick={handleConfirm} disabled={!canUpload}>
                  {addSourcesConfirmLabel(importableCount, { hub: isHubTarget })}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <HubAddSourcesMenu
        open={chooseConnectorOpen}
        onOpenChange={setChooseConnectorOpen}
        showTrigger={false}
        showCatalogConnectors={false}
        hideUploadOption
        onConnectHubProvider={openHubConnectorWizard}
        onConnectCatalogProvider={() => {}}
        onBrowseAllConnectors={() => {}}
        onCustomConnector={() => {}}
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
