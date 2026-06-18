import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { partitionUploadFiles } from "@/lib/hubUploadLimits";
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
import { SelectedSourcesCollapsible } from "@/components/features/knowledge/SelectedSourcesTable";
import {
  HubSourceUploadRow,
  HubUploadProgressSummary,
} from "@/components/features/knowledge/HubSourceUploadRow";
import { useSourceUploadProgress } from "@/components/features/knowledge/useSourceUploadProgress";
import { SourceIntakeTabs } from "@/components/features/knowledge/source-intake/SourceIntakeTabs";
import { SourceAddedPanel } from "@/components/features/knowledge/source-intake/SourceAddedPanel";
import { SourceWizardFooter } from "@/components/features/knowledge/source-intake/SourceWizardFooter";
import { InlineCloudIntakePanel } from "@/components/features/knowledge/source-intake/InlineCloudIntakePanel";
import {
  KNOWLEDGE_TERMS,
  addSourcesConfirmLabel,
  addSourcesDialogTitle,
} from "@/lib/knowledgeTerminology";
import {
  getAllUploadConnections,
  saveUploadSessionConnection,
} from "@/lib/cloudUploadConnections";
import { createDialogFilePickerGuard } from "@/lib/dialogFilePickerGuard";

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
  initialLocalFiles = null,
  onInitialLocalFilesConsumed = null,
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

  const [sourceTab, setSourceTab] = useState("computer");
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [cloudPanelReset, setCloudPanelReset] = useState(0);
  const [initialCloudConnection, setInitialCloudConnection] = useState(null);

  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const prevSelectionCountRef = useRef(0);
  const filePickerGuard = useMemo(() => createDialogFilePickerGuard(), []);
  const uploadInputId = useMemo(
    () => `documents-upload-input-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

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
    setSourceTab("computer");
    setSelectionOpen(false);
    prevSelectionCountRef.current = 0;
    setInitialCloudConnection(null);
    setCloudPanelReset((n) => n + 1);
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
    setSourceTab("cloud");
    setInitialCloudConnection(initialBrowseConnection);
    setCloudPanelReset((n) => n + 1);
  }, [open, initialBrowseConnection?.id, initialBrowseConnection?.provider, isUploading, isComplete]);

  useEffect(() => {
    if (!open || !initialLocalFiles?.length || isUploading || isComplete) return;
    appendUploadFiles(initialLocalFiles);
    onInitialLocalFilesConsumed?.();
  }, [open, initialLocalFiles, isUploading, isComplete, onInitialLocalFilesConsumed]);

  useEffect(() => {
    const count = attachedFiles.length;
    if (count > 0 && prevSelectionCountRef.current === 0) {
      setSelectionOpen(true);
    }
    prevSelectionCountRef.current = count;
  }, [attachedFiles.length]);

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
    setSelectionOpen(true);
  }

  function handleAddFromPicker(selected, connection) {
    const provider = connection?.provider ?? "onedrive";
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
    setSelectionOpen(true);
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

    if (finalResult?.success && !finalResult?.allSkipped) {
      handleClose();
    }
  }

  const importableCount = useMemo(() => {
    const counted = countImportableAttachedRows(attachedFiles, cloudMetas);
    const fallback = Math.max(attachedFiles.length, pendingFiles.length);
    return Math.max(counted, fallback);
  }, [attachedFiles, cloudMetas, pendingFiles.length]);

  const canUpload = importableCount > 0 && !isUploading && !isComplete;

  const rightPanel =
    isUploading || isComplete ? null : (
      <InlineCloudIntakePanel
        connections={savedConnections}
        excludeExternalIds={mergedExcludeExternalIds}
        excludeNames={mergedExcludeNames}
        onWizardComplete={handleCloudWizardComplete}
        onAddFromPicker={handleAddFromPicker}
        resetToken={cloudPanelReset}
        initialConnection={initialCloudConnection}
      />
    );

  return (
    <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) return;
          if (filePickerGuard.shouldBlockClose()) return;
          if (isUploading) return;
          handleClose();
        }}
      >
        <DialogContent className={HUB_DIALOG_CONTENT_XL}>
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>
              {isComplete && uploadResult?.success
                ? uploadResult?.allSkipped
                  ? KNOWLEDGE_TERMS.uploadSkippedTitle
                  : KNOWLEDGE_TERMS.uploadComplete
                : isUploading
                  ? KNOWLEDGE_TERMS.uploadingSources
                  : addSourcesDialogTitle({
                      hubName: isHubTarget ? (hubName ?? KNOWLEDGE_TERMS.hubSingular) : null,
                    })}
            </DialogTitle>
            <DialogDescription>
              {isUploading || isComplete ? (
                isComplete && uploadResult?.allSkipped
                  ? KNOWLEDGE_TERMS.uploadSkippedDescription
                  : isComplete && uploadResult?.hasError && !uploadResult?.success
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
                uploadResult?.allSkipped ? (
                  <div className="flex flex-col gap-4 py-4">
                    <Alert>
                      <AlertTriangle className="size-4" />
                      <AlertTitle>{KNOWLEDGE_TERMS.uploadSkippedTitle}</AlertTitle>
                      <AlertDescription>{KNOWLEDGE_TERMS.uploadSkippedDescription}</AlertDescription>
                    </Alert>
                    <ul className="flex flex-col gap-1">
                      {uploadItems.map((item) => (
                        <HubSourceUploadRow key={item.id} upload={item} />
                      ))}
                    </ul>
                  </div>
                ) : (
                  <SourceAddedPanel
                    title={KNOWLEDGE_TERMS.uploadComplete}
                    description={
                      (() => {
                        const count = uploadResult?.added?.length ?? 0;
                        const skipped = uploadResult?.rejected ?? 0;
                        const skippedDuplicates = uploadResult?.skippedDuplicates ?? 0;
                        if (count <= 0) return KNOWLEDGE_TERMS.uploadCompleteDescription;
                        return `${count} source${count === 1 ? "" : "s"} added${isHubTarget ? " to hub and library" : " to your library"}.${skipped > 0 ? ` ${skipped} skipped.` : ""}${skippedDuplicates > 0 ? ` ${skippedDuplicates} already linked.` : ""}`;
                      })()
                    }
                    primaryLabel="Done"
                    onPrimary={handleClose}
                    secondaryLabel={
                      !isHubTarget &&
                      (uploadResult?.records ?? []).some((r) => r.id ?? r.libraryDocumentId) &&
                      onViewInDocuments
                        ? KNOWLEDGE_TERMS.viewInDocuments
                        : undefined
                    }
                    onSecondary={
                      !isHubTarget && onViewInDocuments
                        ? () => {
                            const recordIds = (uploadResult?.records ?? [])
                              .map((r) => r.id ?? r.libraryDocumentId)
                              .filter(Boolean);
                            onViewInDocuments(recordIds);
                            handleClose();
                          }
                        : undefined
                    }
                  />
                )
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
              <SourceIntakeTabs
                sourceTab={sourceTab}
                onSourceTabChange={setSourceTab}
                disabled={isUploading}
                computerProps={{
                  inputId: uploadInputId,
                  fileInputRef,
                  dragActive,
                  fileTooLarge,
                  filePickerGuard,
                  disabled: isUploading,
                  onDragEnter: () => {
                    dragCounterRef.current += 1;
                    setDragActive(true);
                  },
                  onDragLeave: () => {
                    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
                    if (dragCounterRef.current === 0) setDragActive(false);
                  },
                  onDrop: (e) => {
                    e.preventDefault();
                    dragCounterRef.current = 0;
                    setDragActive(false);
                    appendUploadFiles(e.dataTransfer.files);
                  },
                  onFileChange: (e) => appendUploadFiles(e.target.files),
                }}
                cloudContent={rightPanel}
              />
            )}
          </div>

          {!isUploading && !isComplete && attachedFiles.length > 0 ? (
            <div className="border-t border-border bg-muted/20 px-6 py-2">
              <p className="text-xs text-muted-foreground">{KNOWLEDGE_TERMS.uploadReadyHint}</p>
            </div>
          ) : null}

          {!isUploading && !isComplete ? (
            <SelectedSourcesCollapsible
              attachedFiles={attachedFiles}
              onRemove={handleRemoveAttached}
              open={selectionOpen}
              onOpenChange={setSelectionOpen}
            />
          ) : null}

          {!isComplete && (
            <SourceWizardFooter>
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
            </SourceWizardFooter>
          )}

          {isComplete && !uploadResult?.success ? (
            <SourceWizardFooter>
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
              {uploadResult?.hasError ? (
                <Button onClick={() => retryFailed()}>Retry failed</Button>
              ) : null}
            </SourceWizardFooter>
          ) : null}

          {isComplete && uploadResult?.allSkipped ? (
            <SourceWizardFooter>
              <span aria-hidden />
              <Button onClick={handleClose}>Close</Button>
            </SourceWizardFooter>
          ) : null}
        </DialogContent>
      </Dialog>
  );
}
