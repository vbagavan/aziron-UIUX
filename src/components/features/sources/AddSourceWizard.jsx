/**
 * AddSourceWizard — the unified Source Onboarding experience.
 *
 * A single reusable modal that walks a user through bringing any source
 * (files including cloud storage, databases, APIs) into Aziron and
 * routing it to the document library and/or a Knowledge Hub. Connection and
 * discovery are simulated; selections persist as real library records so the
 * success screen's actions (View source / Open hub) work end-to-end.
 *
 * Self-sufficient: pulls persistence + hubs from KnowledgeHubContext and
 * navigation from the router, so any entry point only needs `open`/`onOpenChange`.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_LG,
  HUB_DIALOG_CONTENT_XL,
} from "@/components/features/knowledge/hubDialogSizes";
import { SourceWizardFooter } from "@/components/features/knowledge/source-intake/SourceWizardFooter";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { createHubPayload } from "@/data/knowledgeHubs";
import {
  buildSourceRecords,
  computeIndexedRecords,
  deriveSourceName,
  getWizardStepsForContext,
  applyExpressDefaults,
  STEP_META,
} from "@/lib/addSourceFlow";
import {
  saveLastSourceType,
} from "@/lib/wizardPrefs";
import { createDialogFilePickerGuard } from "@/lib/dialogFilePickerGuard";
import { SOURCE_TYPES } from "@/data/addSourceCatalog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConnectionsStore } from "@/lib/connections/store.js";
import { goToConnectorsCatalog } from "@/lib/connectorsNavigation";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import {
  ChooseSourceTypeStep,
  FilesIntakeStep,
  ProcessingStep,
  SuccessStep,
} from "@/components/features/sources/coreFlowSteps";
import {
  ApiAiStep,
  ApiConnectStep,
  ApiDiscoverStep,
  ApiObjectsStep,
  ApiSyncStep,
  ApiTypeStep,
  CloudBrowseStep,
  CloudConnectStep,
  CloudProviderStep,
  CloudSyncStep,
  DbAiStep,
  DbConnectStep,
  DbDiscoverStep,
  DbSelectDataStep,
  DbSelectStep,
  DbSyncStep,
} from "@/components/features/sources/connectorFlowSteps";

function initialState({ defaultHubId } = {}) {
  const destination = defaultHubId
    ? { mode: "existing-hub", hubId: defaultHubId, newHubName: "" }
    : { mode: "documents", hubId: null, newHubName: "" };

  return {
    type: null,
    files: { items: [], intakeMode: "upload" },
    cloud: {
      provider: null,
      connected: false,
      selected: [],
      importMode: "selected",
      syncFreq: "realtime",
    },
    db: {
      provider: null,
      tested: false,
      connection: { name: "", host: "", port: "", username: "", password: "", ssl: true },
      selectedTableIds: [],
      embedStrategy: "selected",
      columnIds: ["customer_name", "company", "industry"],
      syncType: "incremental",
      syncFreq: "realtime",
    },
    api: {
      apiType: null,
      tested: false,
      connection: { name: "", baseUrl: "", auth: "oauth2" },
      objectIds: [],
      fetchStrategy: "scheduled",
      schedule: "15m",
      ai: { knowledgeIndex: true, semanticSearch: true, entityGraph: true },
    },
    ent: { app: null, connected: false, objectIds: [], syncFreq: "realtime" },
    config: { name: "", description: "", tags: [], visibility: "organization", autoSync: true },
    destination,
  };
}

export function AddSourceWizard({ open, onOpenChange, onComplete, defaultHubId = null, defaultSourceType = null }) {
  const navigate = useNavigate();
  const {
    hubs,
    addHub,
    addDocumentsToLibrary,
    addDocumentsToHub,
    addCategorySourcesToLibrary,
  } = useKnowledgeHubs();

  // When defaultHubId is set, sources attach to that hub; otherwise they go to Documents.
  const skipChooseType = Boolean(defaultSourceType);

  const [state, setState] = useState(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("wizard"); // "wizard" | "success"
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(null);
  const [result, setResult] = useState(null);
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const filePickerGuard = useMemo(() => createDialogFilePickerGuard(), []);
  const openIntegrationsWizard = useConnectionsStore((s) => s.openWizard);
  const openIntegrationsWizardWithProvider = useConnectionsStore((s) => s.openWizardWithProvider);

  // Reset whenever the dialog closes; restore preferences + context on open.
  useEffect(() => {
    if (!open) {
      setState(initialState());
      setStepIndex(0);
      setPhase("wizard");
      setFinishing(false);
      setFinishError(null);
      setResult(null);
      setDismissConfirmOpen(false);
      return;
    }

    setState({
      ...initialState({ defaultHubId }),
      type: defaultSourceType ?? "files",
    });
    setStepIndex(0);
    setPhase("wizard");
    setFinishing(false);
    setFinishError(null);
    setResult(null);
  }, [open, defaultHubId, defaultSourceType]);

  const steps = useMemo(
    () => getWizardStepsForContext(state.type, state, { skipChooseType }),
    [state, skipChooseType],
  );
  const currentKey = steps[stepIndex] ?? "choose-type";

  function update(section, partial) {
    setState((prev) =>
      section ? { ...prev, [section]: { ...prev[section], ...partial } } : { ...prev, ...partial },
    );
  }

  function canAdvance() {
    const s = state;
    switch (currentKey) {
      case "choose-type": return Boolean(s.type);
      case "files-intake":
        return s.type === "files" && s.files?.intakeMode !== "cloud" && (s.files.items?.length ?? 0) > 0;
      case "upload": return (s.files.items?.length ?? 0) > 0;
      case "cloud-provider": return Boolean(s.cloud.provider);
      case "cloud-connect": return Boolean(s.cloud.connected);
      case "cloud-browse": return (s.cloud.selected?.length ?? 0) > 0;
      case "db-select": return Boolean(s.db.provider);
      case "db-connect": {
        if (!s.db?.tested) return false;
        const conn = s.db?.connection ?? {};
        return Boolean(conn.host?.trim() && conn.username?.trim() && conn.name?.trim());
      }
      case "db-data": return (s.db.selectedTableIds?.length ?? 0) > 0;
      case "db-ai": return s.db.embedStrategy === "full" || (s.db.columnIds?.length ?? 0) > 0;
      case "api-type": return Boolean(s.api.apiType);
      case "api-connect": {
        if (!s.api?.tested) return false;
        const conn = s.api?.connection ?? {};
        return Boolean(conn.baseUrl?.trim() && conn.name?.trim());
      }
      case "api-objects": return (s.api.objectIds?.length ?? 0) > 0;
      default: return true; // discovery / sync / ai / configure
    }
  }

  const isLastStep = stepIndex === steps.length - 1;
  const isFinishStep = isLastStep;

  function handleBack() {
    setFinishError(null);
    setStepIndex(Math.max(0, stepIndex - 1));
  }

  function handleContinue() {
    setFinishError(null);
    if (isFinishStep) {
      finish();
      return;
    }
    if (currentKey === "db-connect" || currentKey === "api-connect") {
      setState((prev) => applyExpressDefaults(prev));
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function handleSelectSourceType(typeId) {
    saveLastSourceType(typeId);
    setFinishError(null);
    setState((prev) => ({
      ...prev,
      type: typeId,
      files: { ...prev.files, intakeMode: "upload", items: typeId === "files" ? prev.files?.items ?? [] : [] },
    }));
  }

  function handleStartCloudFlow(nextState) {
    const resolved = nextState ?? state;
    const nextSteps = getWizardStepsForContext(resolved.type, resolved, { skipChooseType });
    const targetKey = resolved.cloud?.connected ? "cloud-browse" : "cloud-connect";
    const index = nextSteps.indexOf(targetKey);
    if (index >= 0) setStepIndex(index);
  }

  function handleSelectCloudProvider(providerId) {
    setFinishError(null);
    setState((prev) => {
      const next = {
        ...prev,
        type: "files",
        files: { ...prev.files, intakeMode: "cloud" },
        cloud: { ...prev.cloud, provider: providerId, connected: false, selected: [] },
      };
      window.setTimeout(() => handleStartCloudFlow(next), 0);
      return next;
    });
  }

  function handleSelectConnectedCloudAccount(connection) {
    setFinishError(null);
    setState((prev) => {
      const next = {
        ...prev,
        type: "files",
        files: { ...prev.files, intakeMode: "cloud" },
        cloud: { ...prev.cloud, provider: connection.provider, connected: true, selected: [] },
      };
      window.setTimeout(() => handleStartCloudFlow(next), 0);
      return next;
    });
  }

  async function finish() {
    setFinishing(true);
    setFinishError(null);
    try {
      const resolvedState = applyExpressDefaults(state);
      const dest = resolvedState.destination;
      const sourceName = deriveSourceName(resolvedState);
      const description = resolvedState.config.description;
      let hubId = null;
      let hubName = null;
      let recordIds = [];

      if (resolvedState.type === "files" && resolvedState.files?.intakeMode !== "cloud") {
        const files = resolvedState.files.items ?? [];
        if (files.length === 0) {
          throw new Error("Select at least one file to upload.");
        }

        if (dest.mode === "new-hub") {
          const hub = await addHub(
            createHubPayload({ name: dest.newHubName || sourceName, description, pendingFiles: files }),
          );
          hubId = hub.id;
          hubName = hub.name;
          recordIds = (hub.userFiles ?? []).map((f) => f.libraryDocumentId ?? f.id).filter(Boolean);
        } else if (dest.mode === "existing-hub") {
          const res = await addDocumentsToHub(dest.hubId, { files });
          if (res?.error) throw new Error(res.error);
          if ((res.added ?? []).length === 0) {
            throw new Error(
              res.skippedDuplicates > 0
                ? "These files are already linked to this hub."
                : "No files were added to this hub.",
            );
          }
          const hub = hubs.find((h) => String(h.id) === String(dest.hubId));
          hubId = dest.hubId;
          hubName = hub?.name ?? null;
          recordIds = (res.records ?? []).map((r) => r.libraryDocumentId ?? r.id).filter(Boolean);
        } else {
          const res = await addDocumentsToLibrary({ files });
          if ((res.added ?? []).length === 0) {
            throw new Error(
              res.rejected > 0
                ? `${res.rejected} file${res.rejected === 1 ? "" : "s"} exceeded the size limit.`
                : "No files were added to your library.",
            );
          }
          recordIds = (res.records ?? []).map((r) => r.id).filter(Boolean);
        }
      } else {
        const records = buildSourceRecords(resolvedState);
        if (dest.mode === "new-hub") {
          const hub = await addHub(createHubPayload({ name: dest.newHubName || sourceName, description }));
          hubId = hub.id;
          hubName = hub.name;
          addCategorySourcesToLibrary(records, hub.id);
        } else if (dest.mode === "existing-hub") {
          addCategorySourcesToLibrary(records, dest.hubId);
          const hub = hubs.find((h) => String(h.id) === String(dest.hubId));
          hubId = dest.hubId;
          hubName = hub?.name ?? null;
        } else {
          addCategorySourcesToLibrary(records, null);
        }
        recordIds = records.map((r) => r.id);
      }

      const nextResult = {
        sourceName,
        indexedRecords: computeIndexedRecords(resolvedState, resolvedState.files.items.length),
        hubId,
        hubName,
        recordIds,
      };
      setResult(nextResult);
      setPhase("success");
      onComplete?.(nextResult);
    } catch (error) {
      setFinishError(error instanceof Error ? error.message : "Could not add source.");
    } finally {
      setFinishing(false);
    }
  }

  function close() {
    setDismissConfirmOpen(false);
    onOpenChange?.(false);
  }

  function requestClose() {
    if (filePickerGuard.shouldBlockClose()) return;
    if (phase === "success" || stepIndex === 0) {
      close();
      return;
    }
    setDismissConfirmOpen(true);
  }

  function handleDialogOpenChange(next) {
    if (next) {
      onOpenChange?.(true);
      return;
    }
    requestClose();
  }

  function browseConnectorsCatalog({ providerId = null } = {}) {
    close();
    window.setTimeout(
      () =>
        goToConnectorsCatalog(navigate, {
          openNew: !providerId,
          providerId,
          openWizard: openIntegrationsWizard,
          openWizardWithProvider: openIntegrationsWizardWithProvider,
        }),
      0,
    );
  }

  function goTo(path) {
    close();
    // defer so the dialog unmount doesn't race the route change
    window.setTimeout(() => navigate(path), 0);
  }

  function renderStep() {
    switch (currentKey) {
      case "choose-type":
        return <ChooseSourceTypeStep state={state} onSelectType={handleSelectSourceType} />;

      // Files (upload + cloud)
      case "files-intake":
        return (
          <FilesIntakeStep
            state={state}
            update={update}
            filePickerGuard={filePickerGuard}
            onSelectConnected={handleSelectConnectedCloudAccount}
            onBrowseAll={() => browseConnectorsCatalog()}
            onProviderPick={handleSelectCloudProvider}
          />
        );
      case "upload":
        return (
          <FilesIntakeStep
            state={state}
            update={update}
            filePickerGuard={filePickerGuard}
            onSelectConnected={handleSelectConnectedCloudAccount}
            onBrowseAll={() => browseConnectorsCatalog()}
            onProviderPick={handleSelectCloudProvider}
          />
        );
      case "processing":
        return <ProcessingStep state={state} onDone={() => setStepIndex((i) => i + 1)} />;

      // Cloud (under Files)
      case "cloud-provider":
        return (
          <CloudProviderStep
            state={state}
            update={update}
            onSelectConnected={handleSelectConnectedCloudAccount}
            onBrowseAll={() => browseConnectorsCatalog()}
            onProviderPick={handleSelectCloudProvider}
          />
        );
      case "cloud-connect": return <CloudConnectStep state={state} update={update} />;
      case "cloud-browse": return <CloudBrowseStep state={state} update={update} />;
      case "cloud-sync": return <CloudSyncStep state={state} update={update} />;

      // Database
      case "db-select": return <DbSelectStep state={state} update={update} />;
      case "db-connect": return <DbConnectStep state={state} update={update} />;
      case "db-discover": return <DbDiscoverStep state={state} />;
      case "db-data": return <DbSelectDataStep state={state} update={update} />;
      case "db-ai": return <DbAiStep state={state} update={update} />;
      case "db-sync": return <DbSyncStep state={state} update={update} />;

      // API
      case "api-type": return <ApiTypeStep state={state} update={update} />;
      case "api-connect": return <ApiConnectStep state={state} update={update} />;
      case "api-discover": return <ApiDiscoverStep state={state} />;
      case "api-objects": return <ApiObjectsStep state={state} update={update} />;
      case "api-sync": return <ApiSyncStep state={state} update={update} />;
      case "api-ai": return <ApiAiStep state={state} update={update} />;

      default: return null;
    }
  }

  const meta = STEP_META[currentKey] ?? STEP_META["choose-type"];
  const isSuccess = phase === "success";
  const progressValue = isSuccess ? 100 : ((stepIndex + 1) / steps.length) * 100;
  const showBack = !isSuccess && stepIndex > 0;
  const showContinue = !isSuccess && (currentKey !== "choose-type" || Boolean(state.type));
  const activeCategory = SOURCE_TYPES.find((t) => t.id === state.type);
  const ActiveCategoryIcon = activeCategory?.icon;

  const showDemoBanner =
    !isSuccess && currentKey !== "choose-type" && currentKey !== "files-intake" && currentKey !== "upload";
  const useWideDialog =
    !isSuccess && (currentKey === "choose-type" || currentKey === "files-intake" || currentKey === "upload");

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={useWideDialog ? HUB_DIALOG_CONTENT_XL : HUB_DIALOG_CONTENT_LG}>
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle>
                {isSuccess ? KNOWLEDGE_TERMS.addSourceSuccessTitle : meta.title}
              </DialogTitle>
              <DialogDescription>
                {isSuccess ? KNOWLEDGE_TERMS.addSourceSuccessDescription : meta.subtitle}
              </DialogDescription>
            </div>
            {!isSuccess && activeCategory && currentKey !== "choose-type" ? (
              <Badge variant="outline" className="shrink-0 gap-1.5 py-1">
                {ActiveCategoryIcon ? <ActiveCategoryIcon className="size-3.5" aria-hidden /> : null}
                {activeCategory.label}
              </Badge>
            ) : null}
          </div>
          {!isSuccess ? (
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progressValue} className="h-1.5 flex-1" aria-label="Wizard progress" />
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </span>
            </div>
          ) : null}
        </DialogHeader>

        <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-5")}>
          {!isSuccess && showDemoBanner ? (
            <p className="mb-4 text-center text-[11px] text-muted-foreground">
              {KNOWLEDGE_TERMS.demoModeHint}
            </p>
          ) : null}
          {finishError ? (
            <Alert variant="destructive" className="mb-4 py-2">
              <AlertTriangle className="size-4" />
              <AlertTitle className="text-sm">Could not add source</AlertTitle>
              <AlertDescription className="text-xs">{finishError}</AlertDescription>
            </Alert>
          ) : null}
          {isSuccess ? (
            <SuccessStep
              result={result}
              onViewSource={() =>
                goTo(
                  result?.recordIds?.length
                    ? `/knowledge?tab=documents&highlight=${result.recordIds.join(",")}`
                    : "/knowledge?tab=documents",
                )
              }
              onOpenHub={() => result?.hubId != null && goTo(`/knowledge/${result.hubId}`)}
              onCreateAgent={() => goTo("/agents/create")}
              onCreateFlow={() => goTo("/create-flow")}
            />
          ) : (
            renderStep()
          )}
        </div>

        <SourceWizardFooter>
          {showBack ? (
            <Button type="button" variant="ghost" onClick={handleBack} disabled={finishing}>
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={requestClose} disabled={finishing}>
              Cancel
            </Button>
          )}

          {isSuccess ? (
            <Button type="button" onClick={close}>Done</Button>
          ) : showContinue ? (
            <Button type="button" onClick={handleContinue} disabled={!canAdvance() || finishing}>
              {currentKey === "choose-type"
                ? "Continue"
                : isFinishStep
                  ? finishing
                    ? "Adding…"
                    : "Add source"
                  : "Continue"}
            </Button>
          ) : null}
        </SourceWizardFooter>
      </DialogContent>

      {dismissConfirmOpen ? (
        <ConfirmDialog
          title={KNOWLEDGE_TERMS.wizardDiscardTitle}
          message={KNOWLEDGE_TERMS.wizardDiscardMessage}
          confirmLabel="Discard"
          confirmVariant="destructive"
          onConfirm={close}
          onCancel={() => setDismissConfirmOpen(false)}
        />
      ) : null}
    </Dialog>
  );
}
