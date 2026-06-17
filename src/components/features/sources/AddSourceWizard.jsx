/**
 * AddSourceWizard — the unified Source Onboarding experience.
 *
 * A single reusable modal that walks a user through bringing any source
 * (files, cloud storage, databases, APIs, enterprise apps) into Aziron and
 * routing it to the document library and/or a Knowledge Hub. Connection and
 * discovery are simulated; selections persist as real library records so the
 * success screen's actions (View source / Open hub) work end-to-end.
 *
 * Self-sufficient: pulls persistence + hubs from KnowledgeHubContext and
 * navigation from the router, so any entry point only needs `open`/`onOpenChange`.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_LG,
} from "@/components/features/knowledge/hubDialogSizes";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { createHubPayload } from "@/data/knowledgeHubs";
import {
  buildSourceRecords,
  computeIndexedRecords,
  deriveSourceName,
  getWizardSteps,
  applyExpressDefaults,
  STEP_META,
} from "@/lib/addSourceFlow";
import {
  ChooseSourceTypeStep,
  DestinationStep,
  FilesUploadStep,
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
  EnterpriseConnectStep,
  EnterpriseDiscoverStep,
  EnterpriseObjectsStep,
  EnterpriseSelectStep,
  EnterpriseSyncStep,
} from "@/components/features/sources/connectorFlowSteps";

function initialState() {
  return {
    type: null,
    files: { items: [] },
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
    destination: { mode: "documents", hubId: null, newHubName: "" },
  };
}

export function AddSourceWizard({ open, onOpenChange, onComplete }) {
  const navigate = useNavigate();
  const {
    hubs,
    addHub,
    addDocumentsToLibrary,
    addDocumentsToHub,
    addCategorySourcesToLibrary,
  } = useKnowledgeHubs();

  const [state, setState] = useState(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("wizard"); // "wizard" | "success"
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState(null);

  // Reset everything whenever the dialog closes.
  useEffect(() => {
    if (open) return;
    setState(initialState());
    setStepIndex(0);
    setPhase("wizard");
    setFinishing(false);
    setResult(null);
  }, [open]);

  const steps = useMemo(() => getWizardSteps(state.type), [state.type]);
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
      case "upload": return (s.files.items?.length ?? 0) > 0;
      case "cloud-provider": return Boolean(s.cloud.provider);
      case "cloud-connect": return Boolean(s.cloud.connected);
      case "cloud-browse": return (s.cloud.selected?.length ?? 0) > 0;
      case "db-select": return Boolean(s.db.provider);
      case "db-connect": return Boolean(s.db.tested);
      case "db-data": return (s.db.selectedTableIds?.length ?? 0) > 0;
      case "db-ai": return s.db.embedStrategy === "full" || (s.db.columnIds?.length ?? 0) > 0;
      case "api-type": return Boolean(s.api.apiType);
      case "api-connect": return Boolean(s.api.tested);
      case "api-objects": return (s.api.objectIds?.length ?? 0) > 0;
      case "ent-select": return Boolean(s.ent.app);
      case "ent-connect": return Boolean(s.ent.connected);
      case "ent-objects": return (s.ent.objectIds?.length ?? 0) > 0;
      case "destination":
        if (s.destination.mode === "new-hub") return Boolean(s.destination.newHubName.trim());
        if (s.destination.mode === "existing-hub") return Boolean(s.destination.hubId);
        return true;
      default: return true; // discovery / sync / ai / configure
    }
  }

  function handleBack() {
    let target = stepIndex - 1;
    if (steps[target] === "processing") target -= 1; // don't replay the processing animation
    setStepIndex(Math.max(0, target));
  }

  function handleContinue() {
    if (currentKey === "destination") {
      finish();
      return;
    }
    if (currentKey === "db-connect" || currentKey === "api-connect" || currentKey === "ent-connect") {
      setState((prev) => applyExpressDefaults(prev));
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function handleSelectSourceType(typeId) {
    setState((prev) => ({ ...prev, type: typeId }));
    setStepIndex(1);
  }

  async function finish() {
    setFinishing(true);
    try {
      const resolvedState = applyExpressDefaults(state);
      const dest = resolvedState.destination;
      const sourceName = deriveSourceName(resolvedState);
      const description = resolvedState.config.description;
      let hubId = null;
      let hubName = null;
      let recordIds = [];

      if (state.type === "files") {
        const files = resolvedState.files.items;
        if (dest.mode === "new-hub") {
          const hub = await addHub(
            createHubPayload({ name: dest.newHubName || sourceName, description, pendingFiles: files }),
          );
          hubId = hub.id;
          hubName = hub.name;
          recordIds = (hub.userFiles ?? []).map((f) => f.libraryDocumentId ?? f.id).filter(Boolean);
        } else if (dest.mode === "existing-hub") {
          const res = await addDocumentsToHub(dest.hubId, { files });
          const hub = hubs.find((h) => String(h.id) === String(dest.hubId));
          hubId = dest.hubId;
          hubName = hub?.name ?? null;
          recordIds = (res.records ?? []).map((r) => r.libraryDocumentId ?? r.id).filter(Boolean);
        } else {
          const res = await addDocumentsToLibrary({ files });
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
    } finally {
      setFinishing(false);
    }
  }

  function close() {
    onOpenChange?.(false);
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

      // Files
      case "upload": return <FilesUploadStep state={state} update={update} />;
      case "processing":
        return <ProcessingStep state={state} onDone={() => setStepIndex((i) => i + 1)} />;

      // Cloud
      case "cloud-provider": return <CloudProviderStep state={state} update={update} />;
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

      // Enterprise
      case "ent-select": return <EnterpriseSelectStep state={state} update={update} />;
      case "ent-connect": return <EnterpriseConnectStep state={state} update={update} />;
      case "ent-discover": return <EnterpriseDiscoverStep state={state} />;
      case "ent-objects": return <EnterpriseObjectsStep state={state} update={update} />;
      case "ent-sync": return <EnterpriseSyncStep state={state} update={update} />;

      // Shared tail
      case "destination": return <DestinationStep state={state} update={update} hubs={hubs} />;

      default: return null;
    }
  }

  const meta = STEP_META[currentKey] ?? STEP_META["choose-type"];
  const isSuccess = phase === "success";
  const progressValue = isSuccess ? 100 : ((stepIndex + 1) / steps.length) * 100;
  const showBack = !isSuccess && stepIndex > 0;
  const showContinue = !isSuccess && currentKey !== "processing" && currentKey !== "choose-type";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={HUB_DIALOG_CONTENT_LG}>
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{isSuccess ? "Source successfully added" : meta.title}</DialogTitle>
          <DialogDescription>
            {isSuccess ? "Your source is now part of the Aziron ecosystem." : meta.subtitle}
          </DialogDescription>
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
          {!isSuccess && currentKey !== "choose-type" ? (
            <Alert className="mb-4 py-2">
              <Info className="size-4" />
              <AlertDescription className="text-xs">
                Demo mode — connections and discovery are simulated. No data leaves your browser.
              </AlertDescription>
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

        <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
          {showBack ? (
            <Button type="button" variant="ghost" onClick={handleBack} disabled={finishing}>
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={close} disabled={finishing}>
              Cancel
            </Button>
          )}

          {isSuccess ? (
            <Button type="button" onClick={close}>Done</Button>
          ) : showContinue ? (
            <Button type="button" onClick={handleContinue} disabled={!canAdvance() || finishing}>
              {currentKey === "destination" ? (finishing ? "Adding…" : "Add source") : "Continue"}
            </Button>
          ) : currentKey === "processing" ? (
            <span className="text-xs text-muted-foreground">Processing…</span>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
