import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CloudConnectionsPanel,
  CloudFilePickerPanel,
} from "@/components/features/knowledge/cloud/CloudFilePickerPanel";
import { GoogleDriveConnectionWizard } from "@/components/features/knowledge/googledrive/GoogleDriveConnectionWizard";
import { OneDriveConnectionWizard } from "@/components/features/knowledge/onedrive/OneDriveConnectionWizard";
import { getKnowledgeHubCloudProviderLabel } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";
import { KNOWLEDGE_TERMS, cloudBreadcrumbBrowseLabel } from "@/lib/knowledgeTerminology";
import { CloudProviderPickerPanel } from "./CloudProviderPickerPanel";
import { CloudIntakeBreadcrumb } from "./CloudIntakeBreadcrumb";

/** Panel modes within a single dialog — no stacked modals. */
const MODES = {
  connections: "connections",
  chooseProvider: "choose-provider",
  connectWizard: "connect-wizard",
  picker: "picker",
};

export function InlineCloudIntakePanel({
  connections,
  excludeExternalIds = [],
  excludeNames = [],
  onWizardComplete,
  onAddFromPicker,
  resetToken = 0,
  initialConnection = null,
  onBrowseAll,
  onCustomConnector,
}) {
  const [mode, setMode] = useState(MODES.connections);
  const [pickerProvider, setPickerProvider] = useState("onedrive");
  const [pickerConnection, setPickerConnection] = useState(null);
  const [connectProvider, setConnectProvider] = useState(null);
  const [wizardTitle, setWizardTitle] = useState("Connect cloud storage");

  useEffect(() => {
    if (initialConnection?.provider) {
      setPickerProvider(initialConnection.provider);
      setPickerConnection(initialConnection);
      setMode(MODES.picker);
    } else {
      setMode(MODES.connections);
      setPickerProvider("onedrive");
      setPickerConnection(null);
    }
    setConnectProvider(null);
    setWizardTitle("Connect cloud storage");
  }, [resetToken, initialConnection?.id, initialConnection?.provider]);

  const handleWizardStepMeta = useCallback((meta) => {
    setWizardTitle(meta?.title ?? "Connect cloud storage");
  }, []);

  function startConnectWizard(provider) {
    setConnectProvider(provider);
    setWizardTitle("Connect cloud storage");
    setMode(MODES.connectWizard);
  }

  function handleWizardComplete(result) {
    onWizardComplete?.(result, connectProvider);
    setMode(MODES.connections);
    setConnectProvider(null);
  }

  const breadcrumbSegments = useMemo(() => {
    const root = KNOWLEDGE_TERMS.cloudBreadcrumbConnections;
    if (mode === MODES.chooseProvider) {
      return [root, KNOWLEDGE_TERMS.cloudBreadcrumbConnectProvider];
    }
    if (mode === MODES.connectWizard && connectProvider) {
      return [root, `Connect ${getKnowledgeHubCloudProviderLabel(connectProvider)}`];
    }
    if (mode === MODES.picker) {
      return [root, cloudBreadcrumbBrowseLabel(getCloudProviderConfig(pickerProvider).label)];
    }
    return null;
  }, [mode, connectProvider, pickerProvider]);

  function wrapWithBreadcrumb(content) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <CloudIntakeBreadcrumb segments={breadcrumbSegments} />
        <div className="flex min-h-0 flex-1 flex-col">{content}</div>
      </div>
    );
  }

  if (mode === MODES.picker) {
    return wrapWithBreadcrumb(
      <CloudFilePickerPanel
        provider={pickerProvider}
        connection={pickerConnection}
        connections={connections}
        excludeExternalIds={excludeExternalIds}
        excludeNames={excludeNames}
        onBack={() => setMode(MODES.connections)}
        onAddConnection={() => startConnectWizard(pickerProvider)}
        onAddFiles={(selected, connection) => {
          onAddFromPicker?.(selected, connection);
        }}
      />,
    );
  }

  if (mode === MODES.chooseProvider) {
    return wrapWithBreadcrumb(
      <CloudProviderPickerPanel
        onBack={() => setMode(MODES.connections)}
        onSelectProvider={startConnectWizard}
      />,
    );
  }

  if (mode === MODES.connectWizard && connectProvider) {
    const providerLabel = getKnowledgeHubCloudProviderLabel(connectProvider);
    const Wizard =
      connectProvider === "google-drive"
        ? GoogleDriveConnectionWizard
        : OneDriveConnectionWizard;

    return wrapWithBreadcrumb(
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMode(MODES.connections)}
            aria-label={KNOWLEDGE_TERMS.backToConnections}
          >
            <ArrowLeft aria-hidden />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground" aria-live="polite">
              {wizardTitle}
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              Connect {providerLabel}
            </p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <Wizard
            onComplete={handleWizardComplete}
            onCancel={() => setMode(MODES.connections)}
            onBackToUpload={() => setMode(MODES.connections)}
            onStepMetaChange={handleWizardStepMeta}
          />
        </div>
      </div>,
    );
  }

  return (
    <CloudConnectionsPanel
      connections={connections}
      onBrowseConnection={(connection) => {
        setPickerProvider(connection.provider);
        setPickerConnection(connection);
        setMode(MODES.picker);
      }}
      onSelectProvider={startConnectWizard}
      onBrowseAll={onBrowseAll}
      onCustomConnector={onCustomConnector}
    />
  );
}
