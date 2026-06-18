import { useRef, useState, useEffect, useMemo } from "react";
import { ArrowLeft, Check, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CreateHubStepIndicator } from "./CreateHubStepIndicator";
import { countSyncStates } from "./hubFileSyncUtils";
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_XL,
} from "@/components/features/knowledge/hubDialogSizes";
import {
  attachedRowsToCloudImports,
  cloudPickerToAttachedRow,
  mergeAttachedFiles,
  uploadToAttachedRow,
} from "./createHubAttachedFiles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { partitionUploadFiles } from "@/lib/hubUploadLimits";
import { createDialogFilePickerGuard } from "@/lib/dialogFilePickerGuard";
import { SourceIntakeTabs } from "@/components/features/knowledge/source-intake/SourceIntakeTabs";
import { SourceWizardFooter } from "@/components/features/knowledge/source-intake/SourceWizardFooter";
import { InlineCloudIntakePanel } from "@/components/features/knowledge/source-intake/InlineCloudIntakePanel";
import { SelectedSourcesCollapsible, SelectedSourcesTable } from "@/components/features/knowledge/SelectedSourcesTable";
import {
  getAllUploadConnections,
  saveUploadSessionConnection,
} from "@/lib/cloudUploadConnections";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

const TOTAL_STEPS = 2;

function StepNameHub({
  formData,
  attachedFiles,
  onChange,
  linkFromLibraryCount = 0,
  linkFromLibraryPreview = [],
  showNameRequiredHint = false,
}) {
  const syncCounts = countSyncStates(attachedFiles);
  const hasAttachedSources = attachedFiles.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="kh-name" className="text-sm font-medium text-foreground">
          Knowledge Hub name
        </label>
        <Input
          id="kh-name"
          placeholder="e.g. Product documentation, HR policies"
          value={formData.name}
          onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
          aria-invalid={showNameRequiredHint ? "true" : undefined}
          aria-describedby={
            showNameRequiredHint ? "kh-name-hint kh-name-required" : "kh-name-hint"
          }
          className={showNameRequiredHint ? "border-destructive ring-destructive focus-visible:ring-destructive" : undefined}
        />
        <p id="kh-name-hint" className="text-sm text-muted-foreground">
          Name your hub so your team can recognize what agents will retrieve from it.
        </p>
        {showNameRequiredHint ? (
          <p id="kh-name-required" className="text-sm text-destructive" role="status">
            {KNOWLEDGE_TERMS.createHubNameRequiredHint}
          </p>
        ) : null}
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
          rows={3}
          className="resize-none"
        />
      </div>

      {linkFromLibraryCount > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Documents from library</CardTitle>
            <CardDescription>
              {linkFromLibraryCount} selected document
              {linkFromLibraryCount === 1 ? "" : "s"} will be linked to this hub when you create it.
            </CardDescription>
          </CardHeader>
          {linkFromLibraryPreview.length > 0 ? (
            <CardContent className="pt-0">
              <ul className="max-h-28 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                {linkFromLibraryPreview.map((name) => (
                  <li key={name} className="flex items-start gap-2">
                    <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="line-clamp-1">{name}</span>
                  </li>
                ))}
                {linkFromLibraryCount > linkFromLibraryPreview.length ? (
                  <li className="text-xs">
                    + {linkFromLibraryCount - linkFromLibraryPreview.length} more
                  </li>
                ) : null}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {hasAttachedSources ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{KNOWLEDGE_TERMS.sourcesIncluded}</CardTitle>
            <CardDescription>{KNOWLEDGE_TERMS.createHubSourcesIncludedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <SelectedSourcesTable
              attachedFiles={attachedFiles}
              compact
              showHeader={false}
              maxHeightClass="max-h-36"
              className="border-0 bg-transparent"
            />
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">{syncCounts.total}</span>{" "}
                source{syncCounts.total === 1 ? "" : "s"}
              </li>
              {syncCounts.inKnowledgeBase > 0 ? (
                <li>
                  <span className="font-medium text-foreground">{syncCounts.inKnowledgeBase}</span>{" "}
                  {KNOWLEDGE_TERMS.createHubSourcesReadyInLibrary}
                </li>
              ) : null}
              {syncCounts.cloudLink > 0 ? (
                <li>
                  <span className="font-medium text-foreground">{syncCounts.cloudLink}</span>{" "}
                  {KNOWLEDGE_TERMS.createHubCloudLinksPending}
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function KnowledgeHubCreateDialog({
  open,
  onOpenChange,
  onCreated,
  mode = "full",
  linkFromLibraryCount = 0,
  linkFromLibraryPreview = [],
  onBrowseAllConnectors,
  onCustomConnector,
}) {
  const isQuick = mode === "quick";
  const [dialogStep, setDialogStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [cloudMetas, setCloudMetas] = useState({});
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sourceTab, setSourceTab] = useState("computer");
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [savedConnections, setSavedConnections] = useState(() => getAllUploadConnections());
  const [cloudPanelReset, setCloudPanelReset] = useState(0);

  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const prevSelectionCountRef = useRef(0);
  const filePickerGuard = useMemo(() => createDialogFilePickerGuard(), []);
  const uploadInputId = useMemo(
    () => `create-hub-upload-input-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const sourceCount = attachedFiles.length;

  const existingExternalIds = useMemo(
    () => attachedFiles.filter((r) => r.pickerFile?.id).map((r) => r.pickerFile.id),
    [attachedFiles],
  );
  const existingFileNames = useMemo(() => attachedFiles.map((r) => r.name), [attachedFiles]);

  const stepLabel =
    dialogStep === 1 ? KNOWLEDGE_TERMS.createHubStepAddSources : KNOWLEDGE_TERMS.createHubStepNameHub;

  useEffect(() => {
    if (!open) {
      setDialogStep(1);
      setFormData({ name: "", description: "" });
      setAttachedFiles([]);
      setCloudMetas({});
      setFileTooLarge(false);
      setDragActive(false);
      setSourceTab("computer");
      setSelectionOpen(false);
      dragCounterRef.current = 0;
      prevSelectionCountRef.current = 0;
      setCloudPanelReset((n) => n + 1);
      setSavedConnections(getAllUploadConnections());
    }
  }, [open]);

  useEffect(() => {
    const count = attachedFiles.length;
    if (count > 0 && prevSelectionCountRef.current === 0) {
      setSelectionOpen(true);
    }
    prevSelectionCountRef.current = count;
  }, [attachedFiles.length]);

  useEffect(() => {
    if (!open) return;
    if (!isQuick && dialogStep !== 2) return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById("kh-name")?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, dialogStep, isQuick]);

  const showNameRequiredHint = dialogStep === 2 && !formData.name.trim();

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
  }

  function handleRemoveAttached(id) {
    setAttachedFiles((prev) => prev.filter((r) => r.id !== id));
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
    if (!formData.name.trim()) {
      const label = provider === "google-drive" ? "Google Drive" : "OneDrive";
      const suggested = result.connectionName?.replace(/ connection$/i, "") ?? `${label} Hub`;
      setFormData((prev) => ({ ...prev, name: prev.name || suggested }));
    }
  }

  function handleAddFromPicker(selected, connection) {
    const provider = connection?.provider ?? "onedrive";
    const cloudRows = selected.map((f) => cloudPickerToAttachedRow(f, provider));
    setCloudMetas((prev) => ({
      ...prev,
      [provider]: prev[provider] ?? {
        provider,
        connection,
        connectionName:
          connection?.name ??
          `${provider === "google-drive" ? "Google Drive" : "OneDrive"} connection`,
      },
    }));
    setAttachedFiles((prev) => mergeAttachedFiles(prev, cloudRows));
    setSelectionOpen(true);
  }

  async function handleCreate() {
    if (!formData.name.trim()) return;
    const uploadFiles = attachedFiles
      .filter((r) => r.source === "upload" && r.file)
      .map((r) => r.file);
    const cloudImports = attachedRowsToCloudImports(attachedFiles, cloudMetas);
    const cloudImport = cloudImports[0] ?? null;

    const payload = {
      name: formData.name,
      description: formData.description,
      pendingFiles: uploadFiles.length > 0 ? uploadFiles : undefined,
      pendingFile: uploadFiles[0] ?? null,
      cloudImport: cloudImport ?? undefined,
      oneDriveImport: cloudImport?.provider === "onedrive" ? cloudImport : undefined,
    };

    try {
      await onCreated?.(payload);
      onOpenChange(false);
    } catch {
      /* parent shows error toast; keep dialog open */
    }
  }

  function handleDialogOpenChange(next) {
    if (next) {
      onOpenChange(next);
      return;
    }
    if (filePickerGuard.shouldBlockClose()) return;
    if (attachedFiles.length > 0) {
      if (!window.confirm("You have unsaved sources. Close anyway and discard them?")) return;
    }
    onOpenChange(next);
  }

  const cloudPanel = (
    <InlineCloudIntakePanel
      connections={savedConnections}
      excludeExternalIds={existingExternalIds}
      excludeNames={existingFileNames}
      onWizardComplete={handleCloudWizardComplete}
      onAddFromPicker={handleAddFromPicker}
      resetToken={cloudPanelReset}
      onBrowseAll={onBrowseAllConnectors ? () => { onOpenChange(false); window.setTimeout(onBrowseAllConnectors, 0); } : undefined}
      onCustomConnector={onCustomConnector ? () => { onOpenChange(false); window.setTimeout(onCustomConnector, 0); } : undefined}
    />
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={isQuick ? undefined : HUB_DIALOG_CONTENT_XL}>
          <DialogHeader className="border-b border-border px-6 py-4">
            {!isQuick ? (
              <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
                Step {dialogStep} of {TOTAL_STEPS} — {stepLabel}
              </p>
            ) : null}
            <DialogTitle>
              {isQuick ? "Quick create Knowledge Hub" : KNOWLEDGE_TERMS.createKnowledgeHub}
            </DialogTitle>
            <DialogDescription>
              {isQuick
                ? linkFromLibraryCount > 0
                  ? `Name your hub — ${linkFromLibraryCount} selected document${linkFromLibraryCount === 1 ? "" : "s"} will be linked automatically.`
                  : "Name your hub now — add sources from the hub page anytime."
                : dialogStep === 1
                  ? "Add sources from your computer or cloud storage, or continue without sources and add them later."
                  : KNOWLEDGE_TERMS.createHubStep2Description}
            </DialogDescription>
          </DialogHeader>

          <div className={cn(isQuick ? "px-6 py-4" : HUB_DIALOG_BODY_SCROLL, !isQuick && "px-6 py-4")}>
            {isQuick ? (
              <StepNameHub
                formData={formData}
                attachedFiles={[]}
                onChange={setFormData}
                linkFromLibraryCount={linkFromLibraryCount}
                linkFromLibraryPreview={linkFromLibraryPreview}
                showNameRequiredHint={!formData.name.trim()}
              />
            ) : dialogStep === 1 ? (
              <>
                <CreateHubStepIndicator currentStep={dialogStep} />
                <SourceIntakeTabs
                  sourceTab={sourceTab}
                  onSourceTabChange={setSourceTab}
                  computerProps={{
                    inputId: uploadInputId,
                    fileInputRef,
                    dragActive,
                    fileTooLarge,
                    filePickerGuard,
                    hint: KNOWLEDGE_TERMS.createHubSourcesHint,
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
                  cloudContent={cloudPanel}
                />
              </>
            ) : (
              <>
                <CreateHubStepIndicator currentStep={dialogStep} />
                <StepNameHub
                  formData={formData}
                  attachedFiles={attachedFiles}
                  onChange={setFormData}
                  linkFromLibraryCount={linkFromLibraryCount}
                  linkFromLibraryPreview={linkFromLibraryPreview}
                  showNameRequiredHint={showNameRequiredHint}
                />
              </>
            )}
          </div>

          {!isQuick && dialogStep === 1 && attachedFiles.length > 0 ? (
            <div className="border-t border-border bg-muted/20 px-6 py-2">
              <p className="text-xs text-muted-foreground">{KNOWLEDGE_TERMS.uploadReadyHint}</p>
            </div>
          ) : null}

          {!isQuick && dialogStep === 1 ? (
            <SelectedSourcesCollapsible
              attachedFiles={attachedFiles}
              onRemove={handleRemoveAttached}
              open={selectionOpen}
              onOpenChange={setSelectionOpen}
            />
          ) : null}

          {!isQuick && (
            <SourceWizardFooter>
              {dialogStep === 1 ? (
                <>
                  <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" type="button" onClick={() => setDialogStep(2)}>
                      {KNOWLEDGE_TERMS.continueWithoutSources}
                    </Button>
                    <Button
                      type="button"
                      className="gap-1.5"
                      onClick={() => setDialogStep(2)}
                      disabled={sourceCount === 0}
                    >
                      {sourceCount > 0
                        ? `Continue (${sourceCount} source${sourceCount === 1 ? "" : "s"})`
                        : "Continue with sources"}
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      className="gap-1.5"
                      onClick={() => setDialogStep(1)}
                    >
                      <ArrowLeft size={15} />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="gap-1.5"
                      onClick={handleCreate}
                      disabled={!formData.name.trim()}
                      aria-disabled={!formData.name.trim() ? "true" : undefined}
                      aria-describedby={showNameRequiredHint ? "kh-name-required" : undefined}
                    >
                      <Check size={15} />
                      {KNOWLEDGE_TERMS.createKnowledgeHub}
                    </Button>
                  </div>
                </>
              )}
            </SourceWizardFooter>
          )}

          {isQuick && (
            <SourceWizardFooter>
              <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-1.5"
                onClick={handleCreate}
                disabled={!formData.name.trim()}
                aria-describedby={!formData.name.trim() ? "kh-name-required" : undefined}
              >
                <Check size={15} />
                {KNOWLEDGE_TERMS.createKnowledgeHub}
              </Button>
            </SourceWizardFooter>
          )}
        </DialogContent>
      </Dialog>
  );
}
