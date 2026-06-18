import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  UploadCloud,
  AlertTriangle,
  ArrowLeft,
  Check,
  FileText,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES_LABEL,
} from "@/data/knowledgeHubs";
import { downloadCloudFileBlob } from "@/lib/knowledgeHubCloudSync";
import { saveKnowledgeHubFile } from "@/lib/knowledgeHubFileStorage";
import { CloudConnectorLogoRow } from "./CloudConnectorLogos";
import { CreateHubStepIndicator } from "./CreateHubStepIndicator";
import { countSyncStates } from "./hubFileSyncUtils";
import { getCloudProviderConfig } from "./cloud/cloudProviderConfig";
import { CloudFilePickerPanel } from "./cloud/CloudFilePickerPanel";
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_XL,
} from "@/components/features/knowledge/hubDialogSizes";
import { GoogleDriveConnectionWizard } from "./googledrive/GoogleDriveConnectionWizard";
import { OneDriveConnectionWizard } from "./onedrive/OneDriveConnectionWizard";
import { CreateHubFilesStep } from "./CreateHubFilesStep";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_ONEDRIVE_CONNECTION } from "@/data/knowledgeHubs";
import {
  attachedRowsToCloudImport,
  cloudPickerToAttachedRow,
  mergeAttachedFiles,
  uploadToAttachedRow,
} from "./createHubAttachedFiles";

import { partitionUploadFiles } from "@/lib/hubUploadLimits";
import { createDialogFilePickerGuard } from "@/lib/dialogFilePickerGuard";

const TOTAL_STEPS = 3;

function draftBlobKey(rowId) {
  return `draft-${rowId}`;
}

function Step1Upload({
  fileTooLarge,
  dragActive,
  pendingFiles,
  fileInputRef,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileChange,
  onUploadClick,
  onRemoveFile,
  onConnectorSelect,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-wrap items-start justify-center gap-6">
        <div className="flex shrink-0 flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-[226px] w-full max-w-[344px] cursor-pointer flex-col items-center justify-center gap-5 rounded-lg border border-dashed p-4 transition-colors",
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
            aria-label="Upload files area"
          >
            <UploadCloud size={48} className="text-muted-foreground" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm leading-5 text-foreground">
                Select files or drag and drop here
              </p>
              <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                {ACCEPTED_FILE_TYPES_LABEL}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can add more files anytime on the hub page.
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUploadClick();
              }}
            >
              <UploadCloud size={16} />
              Upload from computer
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={ACCEPTED_FILE_EXTENSIONS}
              onChange={onFileChange}
            />
          </div>

          {pendingFiles.length > 0 && (
            <ul className="flex w-full max-w-[344px] flex-col gap-1.5">
              {pendingFiles.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <FileText size={16} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-foreground">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => onRemoveFile(i)}
                  >
                    <X size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {fileTooLarge && (
            <Alert variant="destructive" className="w-full max-w-[344px]">
              <AlertTriangle className="size-4" />
              <AlertTitle>File is too large</AlertTitle>
              <AlertDescription>
                Documents must be 10 MB or smaller. Video, audio, and EPUB files can be up to 100 MB.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <CloudConnectorLogoRow
          className="shrink-0 self-center"
          onConnectorSelect={onConnectorSelect}
        />
      </div>
    </div>
  );
}

function Step3NameHub({ formData, attachedFiles, onChange }) {
  const syncCounts = countSyncStates(attachedFiles);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {attachedFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attachment summary</CardTitle>
            <CardDescription>Review before creating your hub.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            <ul className="flex flex-col gap-1">
              <li>
                <span className="font-medium text-foreground">{syncCounts.total}</span> file
                {syncCounts.total === 1 ? "" : "s"} selected
              </li>
              <li>
                <span className="font-medium text-foreground">{syncCounts.inKnowledgeBase}</span>{" "}
                in knowledge base
              </li>
              {syncCounts.cloudLink > 0 && (
                <li>
                  <span className="font-medium text-foreground">{syncCounts.cloudLink}</span>{" "}
                  OneDrive link{syncCounts.cloudLink === 1 ? "" : "s"} — save after create from hub
                  page
                </li>
              )}
              {syncCounts.failed > 0 && (
                <li className="text-destructive">
                  <span className="font-medium">{syncCounts.failed}</span> failed to save
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="kh-name" className="text-sm font-medium text-foreground">
          Knowledge Hub name
        </label>
        <Input
          id="kh-name"
          placeholder="e.g. Product documentation, HR policies"
          value={formData.name}
          onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
        />
        <p className="text-sm text-muted-foreground">
          Name your hub so your team can recognize what agents will retrieve from it.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="kh-desc" className="text-sm font-medium text-foreground">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="kh-desc"
          placeholder="What documents live here and how agents should use them."
          value={formData.description}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={4}
          className="resize-none"
        />
      </div>
    </div>
  );
}

export function KnowledgeHubCreateDialog({
  open,
  onOpenChange,
  onCreated,
  onCloudFileSynced,
  onCloudFileSyncFailed,
  mode = "full",
}) {
  const isQuick = mode === "quick";
  const [dialogStep, setDialogStep] = useState(1);
  const [contentMode, setContentMode] = useState("upload");
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [cloudMeta, setCloudMeta] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filesSortAsc, setFilesSortAsc] = useState(true);
  const [cloudWizardTitle, setCloudWizardTitle] = useState("Connect cloud storage");
  const [cloudAddOpen, setCloudAddOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const fileInputRef = useRef(null);
  const filePickerGuard = useMemo(() => createDialogFilePickerGuard(), []);

  const cloudProvider = cloudMeta?.provider ?? "onedrive";
  const cloudConfig = getCloudProviderConfig(cloudProvider);
  const cloudConnection =
    cloudMeta?.connection ??
    (cloudProvider === "google-drive"
      ? { provider: "google-drive", name: "Google Drive connection" }
      : DEFAULT_ONEDRIVE_CONNECTION);
  const connectionDisplayName =
    cloudMeta?.connectionName ?? cloudConnection.name ?? cloudConfig.label;
  const syncCounts = countSyncStates(attachedFiles);

  const handleCloudWizardStepMeta = useCallback((meta) => {
    setCloudWizardTitle(meta?.title ?? "Connect cloud storage");
  }, []);

  useEffect(() => {
    if (!open) {
      setDialogStep(1);
      setContentMode("upload");
      setFormData({ name: "", description: "" });
      setAttachedFiles([]);
      setCloudMeta(null);
      setPendingFiles([]);
      setFileTooLarge(false);
      setDragActive(false);
      setFilesSortAsc(true);
      setCloudWizardTitle("Connect cloud storage");
      setCloudAddOpen(false);
      setIsDownloadingAll(false);
    }
  }, [open]);

  function appendUploadFiles(fileList) {
    const incoming = Array.from(fileList ?? []).filter(Boolean);
    if (incoming.length === 0) return;
    const { valid, rejected } = partitionUploadFiles(incoming);
    if (valid.length === 0) {
      setFileTooLarge(rejected.length > 0);
      return;
    }
    setFileTooLarge(rejected.length > 0);
    const stamp = Date.now();
    const newRows = valid.map((f, i) => uploadToAttachedRow(f, stamp + i));
    setAttachedFiles((prev) => mergeAttachedFiles(prev, newRows));
    setPendingFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const next = [...prev];
      for (const f of valid) {
        if (!names.has(f.name)) {
          next.push(f);
          names.add(f.name);
        }
      }
      return next;
    });
  }

  function addFiles(fileList) {
    appendUploadFiles(fileList);
  }

  function handleCloudComplete(result, provider) {
    const cloudRows = result.selectedFiles.map((f) => cloudPickerToAttachedRow(f, provider));
    setCloudMeta({
      provider,
      connection: result.connection,
      connectionName: result.connectionName,
      authMethod: result.authMethod,
    });
    setAttachedFiles((prev) =>
      mergeAttachedFiles(
        prev.filter(
          (r) => !(r.source === "cloud" && (r.cloudProvider ?? "onedrive") === provider),
        ),
        cloudRows,
      ),
    );
    setContentMode("upload");
    setDialogStep(2);
    if (!formData.name.trim()) {
      const label = provider === "google-drive" ? "Google Drive" : "OneDrive";
      const suggested = result.connectionName?.replace(/ connection$/i, "") ?? `${label} Hub`;
      setFormData((prev) => ({ ...prev, name: prev.name || suggested }));
    }
  }

  const downloadAttachedCloudFile = useCallback(
    async (row) => {
      if (row.source !== "cloud" || row.syncStatus === "loading") return;

      setAttachedFiles((prev) =>
        prev.map((f) =>
          f.id === row.id ? { ...f, syncStatus: "loading", syncError: null } : f,
        ),
      );

      try {
        const blob = await downloadCloudFileBlob(row);
        const storageId = draftBlobKey(row.id);
        await saveKnowledgeHubFile(storageId, blob, row.name);
        setAttachedFiles((prev) =>
          prev.map((f) =>
            f.id === row.id
              ? {
                  ...f,
                  syncStatus: "stored",
                  draftBlobId: storageId,
                  syncedAt: new Date().toISOString(),
                  syncError: null,
                }
              : f,
          ),
        );
        onCloudFileSynced?.(row.name);
      } catch (err) {
        const message = err?.message ?? "Download failed";
        setAttachedFiles((prev) =>
          prev.map((f) =>
            f.id === row.id ? { ...f, syncStatus: "failed", syncError: message } : f,
          ),
        );
        onCloudFileSyncFailed?.(row.name, message);
      }
    },
    [onCloudFileSynced, onCloudFileSyncFailed],
  );

  const downloadAllLinked = useCallback(
    async (rows) => {
      setIsDownloadingAll(true);
      for (const row of rows) {
        if (row.syncStatus !== "linked" && row.syncStatus !== "failed") continue;
        await downloadAttachedCloudFile(row);
      }
      setIsDownloadingAll(false);
    },
    [downloadAttachedCloudFile],
  );

  function handleAddFromCloudPicker(selected) {
    const cloudRows = selected.map((f) => cloudPickerToAttachedRow(f, cloudProvider));
    if (!cloudMeta) {
      setCloudMeta({
        provider: cloudProvider,
        connection: cloudConnection,
        connectionName: connectionDisplayName,
      });
    }
    setAttachedFiles((prev) => mergeAttachedFiles(prev, cloudRows));
  }

  function handleCreate() {
    if (!formData.name.trim()) return;
    const uploadFiles = attachedFiles
      .filter((r) => r.source === "upload" && r.file)
      .map((r) => r.file);
    const cloudImport = attachedRowsToCloudImport(attachedFiles, cloudMeta);

    onCreated?.({
      name: formData.name,
      description: formData.description,
      pendingFiles: uploadFiles.length > 0 ? uploadFiles : undefined,
      pendingFile: uploadFiles[0] ?? null,
      cloudImport: cloudImport ?? undefined,
      oneDriveImport:
        cloudImport?.provider === "onedrive" ? cloudImport : undefined,
    });
    onOpenChange(false);
  }

  function goToFilesStep() {
    if (attachedFiles.length > 0 || dialogStep === 1) {
      setDialogStep(2);
    }
  }

  const isCloudWizardStep =
    (contentMode === "onedrive" || contentMode === "google-drive") && dialogStep === 1;

  const stepLabel = isCloudWizardStep
    ? cloudWizardTitle
    : dialogStep === 1
      ? "Add content"
      : dialogStep === 2
        ? "Attached files"
        : "Name your hub";

  const showDefaultFooter = !isCloudWizardStep;
  const hasPendingCloudLinks = syncCounts.cloudLink > 0 || syncCounts.failed > 0;
  const existingExternalIds = attachedFiles
    .filter((r) => r.pickerFile?.id)
    .map((r) => r.pickerFile.id);
  const existingFileNames = attachedFiles.map((r) => r.name);

  function handleDialogOpenChange(next) {
    if (next) { onOpenChange(next); return; }
    if (filePickerGuard.shouldBlockClose()) return;
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={isQuick ? undefined : HUB_DIALOG_CONTENT_XL}>
        <DialogHeader className="border-b border-border px-6 py-4">
          {!isQuick ? (
            <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
              Step {dialogStep} of {TOTAL_STEPS} — {stepLabel}
            </p>
          ) : null}
          <DialogTitle>{isQuick ? "Quick create Knowledge Hub" : "Create Knowledge Hub"}</DialogTitle>
          <DialogDescription>
            {isQuick
              ? "Name your hub now — add sources from the hub page anytime."
              : "Store documents your AI agents use for retrieval, reasoning, and workflows."}
          </DialogDescription>
        </DialogHeader>

        <div className={cn(isQuick ? "px-6 py-4" : HUB_DIALOG_BODY_SCROLL, !isQuick && "px-6 py-4")}>
          {isQuick ? (
            <Step3NameHub
              formData={formData}
              attachedFiles={[]}
              onChange={setFormData}
            />
          ) : (
            <>
          {dialogStep >= 1 && !isCloudWizardStep && (
            <CreateHubStepIndicator currentStep={dialogStep} />
          )}
          {dialogStep === 1 && contentMode === "onedrive" ? (
            <OneDriveConnectionWizard
              onComplete={(result) => handleCloudComplete(result, "onedrive")}
              onCancel={() => onOpenChange(false)}
              onBackToUpload={() => setContentMode("upload")}
              onStepMetaChange={handleCloudWizardStepMeta}
            />
          ) : dialogStep === 1 && contentMode === "google-drive" ? (
            <GoogleDriveConnectionWizard
              onComplete={(result) => handleCloudComplete(result, "google-drive")}
              onCancel={() => onOpenChange(false)}
              onBackToUpload={() => setContentMode("upload")}
              onStepMetaChange={handleCloudWizardStepMeta}
            />
          ) : dialogStep === 1 ? (
            <Step1Upload
              fileTooLarge={fileTooLarge}
              dragActive={dragActive}
              pendingFiles={pendingFiles}
              fileInputRef={fileInputRef}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                addFiles(e.dataTransfer.files);
              }}
              onFileChange={filePickerGuard.onFileInputChange((e) => {
                addFiles(e.target.files);
                e.target.value = "";
              })}
              onUploadClick={() => filePickerGuard.openFileInput(fileInputRef.current)}
              onRemoveFile={(index) => {
                const removed = pendingFiles[index];
                setPendingFiles((prev) => prev.filter((_, i) => i !== index));
                if (removed) {
                  setAttachedFiles((prev) =>
                    prev.filter(
                      (r) => !(r.source === "upload" && r.file === removed),
                    ),
                  );
                }
              }}
              onConnectorSelect={(id) => {
                if (id === "onedrive" || id === "google-drive") setContentMode(id);
              }}
            />
          ) : dialogStep === 2 ? (
            <CreateHubFilesStep
              attachedFiles={attachedFiles}
              connectionName={connectionDisplayName}
              cloudProvider={cloudProvider}
              onAddFromCloud={() => setCloudAddOpen(true)}
              onUploadFromComputer={appendUploadFiles}
              onRemoveFile={(id) => {
                setAttachedFiles((prev) => {
                  const removed = prev.find((r) => r.id === id);
                  if (removed?.file) {
                    setPendingFiles((pf) => pf.filter((f) => f !== removed.file));
                  }
                  return prev.filter((r) => r.id !== id);
                });
              }}
              onDownloadCloudFile={downloadAttachedCloudFile}
              onDownloadAllLinked={downloadAllLinked}
              isDownloadingAll={isDownloadingAll}
              sortAsc={filesSortAsc}
              onSortToggle={() => setFilesSortAsc((v) => !v)}
            />
          ) : (
            <Step3NameHub
              formData={formData}
              attachedFiles={attachedFiles}
              onChange={setFormData}
            />
          )}
            </>
          )}
        </div>

        <Dialog open={cloudAddOpen} onOpenChange={setCloudAddOpen}>
          <DialogContent className={HUB_DIALOG_CONTENT_XL}>
            <DialogHeader className="border-b border-border px-6 py-4">
              <DialogTitle>Add files from {cloudConfig.label}</DialogTitle>
              <DialogDescription>
                Select additional files from {connectionDisplayName}.
              </DialogDescription>
            </DialogHeader>
            <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-4")}>
              <CloudFilePickerPanel
                provider={cloudProvider}
                connection={cloudConnection}
                connections={[cloudConnection]}
                excludeExternalIds={existingExternalIds}
                excludeNames={existingFileNames}
                onAddFiles={(selected) => {
                  handleAddFromCloudPicker(selected);
                  setCloudAddOpen(false);
                }}
                showBackButton={false}
                embedded
              />
            </div>
          </DialogContent>
        </Dialog>

        {!isQuick && showDefaultFooter && (
          <DialogFooter className="m-0 shrink-0 gap-0 rounded-none border-t border-border bg-muted/30 p-0 px-6 py-4 !mx-0 !mb-0 dark:bg-muted/20">
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              {dialogStep === 1 ? (
                <>
                  <Button variant="outline" type="button" onClick={() => setDialogStep(2)}>
                    Skip for now
                  </Button>
                  <Button type="button" className="gap-1.5" onClick={goToFilesStep}>
                    {pendingFiles.length > 0
                      ? `Continue (${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"})`
                      : "Continue"}
                    <ArrowRight size={15} />
                  </Button>
                </>
              ) : dialogStep === 2 ? (
                <div className="flex w-full flex-col items-end gap-2">
                  {hasPendingCloudLinks && (
                    <p className="w-full text-left text-xs text-muted-foreground" role="status">
                      {syncCounts.cloudLink + syncCounts.failed} file
                      {syncCounts.cloudLink + syncCounts.failed === 1 ? "" : "s"} not in the
                      knowledge base yet. You can save them now or after creating the hub.
                    </p>
                  )}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="gap-1.5"
                      onClick={() => {
                        setDialogStep(1);
                        setContentMode("upload");
                      }}
                    >
                      <ArrowLeft size={15} />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="gap-1.5"
                      onClick={() => setDialogStep(3)}
                    >
                      Next
                      <ArrowRight data-icon="inline-end" aria-hidden />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="gap-1.5"
                    onClick={() => setDialogStep(2)}
                  >
                    <ArrowLeft size={15} />
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="gap-1.5"
                    onClick={handleCreate}
                    disabled={!formData.name.trim()}
                  >
                    <Check size={15} />
                    Create Knowledge Hub
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        )}

        {isQuick && (
          <DialogFooter className="m-0 shrink-0 gap-0 rounded-none border-t border-border bg-muted/30 p-0 px-6 py-4 !mx-0 !mb-0 dark:bg-muted/20">
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-1.5"
                onClick={handleCreate}
                disabled={!formData.name.trim()}
              >
                <Check size={15} />
                Create Knowledge Hub
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
