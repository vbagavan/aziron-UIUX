import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { GoogleDriveConnectionWizard } from "@/components/features/knowledge/googledrive/GoogleDriveConnectionWizard";
import { OneDriveConnectionWizard } from "@/components/features/knowledge/onedrive/OneDriveConnectionWizard";
import { getKnowledgeHubCloudProviderLabel } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_XL,
} from "@/components/features/knowledge/hubDialogSizes";

/**
 * Runs the full cloud connector flow (auth → scope → file picker) when adding
 * sources to an existing Knowledge Hub.
 */
export function HubAddSourceDialog({ open, onOpenChange, provider, onComplete }) {
  const [wizardTitle, setWizardTitle] = useState("Connect cloud storage");

  useEffect(() => {
    if (!open) {
      setWizardTitle("Connect cloud storage");
    }
  }, [open]);

  const handleCloudWizardStepMeta = useCallback((meta) => {
    setWizardTitle(meta?.title ?? "Connect cloud storage");
  }, []);

  function handleWizardComplete(result) {
    onComplete?.(result, provider);
    onOpenChange(false);
  }

  const providerLabel = provider ? getKnowledgeHubCloudProviderLabel(provider) : "Cloud storage";
  const isHubWizardProvider = provider === "onedrive" || provider === "google-drive";

  if (!isHubWizardProvider) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className={HUB_DIALOG_CONTENT_XL}>
        <DialogHeader className="border-b border-border px-6 py-4">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
            {wizardTitle}
          </p>
          <DialogTitle>Connector setup — {providerLabel}</DialogTitle>
          <DialogDescription>
            Authenticate, select a data scope, choose files, and add them to this knowledge hub.
          </DialogDescription>
        </DialogHeader>

        <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-4")}>
          {provider === "onedrive" ? (
            <OneDriveConnectionWizard
              onComplete={handleWizardComplete}
              onCancel={() => onOpenChange(false)}
              onBackToUpload={() => onOpenChange(false)}
              onStepMetaChange={handleCloudWizardStepMeta}
            />
          ) : (
            <GoogleDriveConnectionWizard
              onComplete={handleWizardComplete}
              onCancel={() => onOpenChange(false)}
              onBackToUpload={() => onOpenChange(false)}
              onStepMetaChange={handleCloudWizardStepMeta}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
