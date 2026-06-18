import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCloudProviderConfig } from "./cloudProviderConfig";
import { CloudFilePickerPanel } from "./CloudFilePickerPanel";
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_XL,
} from "@/components/features/knowledge/hubDialogSizes";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export function CloudAddFilesDialog({
  provider = "onedrive",
  open,
  onOpenChange,
  connectionName,
  connections: connectionsProp,
  activeConnection: activeConnectionProp,
  excludeExternalIds = [],
  excludeNames = [],
  onConfirm,
}) {
  const config = getCloudProviderConfig(provider);
  const connections =
    connectionsProp?.length > 0 ? connectionsProp : config.mockConnections ?? [];
  const activeConnection = activeConnectionProp ?? connections[0] ?? null;

  function handleAddFiles(selected, connection) {
    if (selected.length === 0) return;
    onConfirm?.(selected, connection);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={HUB_DIALOG_CONTENT_XL}>
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Add more files</DialogTitle>
          <DialogDescription>
            Select additional files from your connected {config.label} account
            {connectionName ? ` (${connectionName})` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-4")}>
          <CloudFilePickerPanel
            provider={provider}
            connection={activeConnection}
            connections={connections}
            excludeExternalIds={excludeExternalIds}
            excludeNames={excludeNames}
            onAddFiles={handleAddFiles}
            addMode="batch"
            showBackButton={false}
            embedded
            addButtonLabel={KNOWLEDGE_TERMS.addToSelection}
          />
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
