import { useState } from "react";
import { LayoutGrid, Plus, Upload, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  HUB_CUSTOM_CONNECTOR_CATALOG_ID,
  HUB_POPULAR_CONNECTORS,
} from "@/components/features/knowledge/hubAddSourceConnectors";
import { cn } from "@/lib/utils";

function deferAfterClose(action) {
  window.requestAnimationFrame(() => action?.());
}

function SourceOptionRow({ icon: Icon, title, description, onClick }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto w-full justify-start gap-3 px-3 py-3"
      onClick={onClick}
    >
      <Icon data-icon="inline-start" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs font-normal text-muted-foreground">{description}</span>
      </span>
    </Button>
  );
}

/**
 * Add sources control — opens a shadcn Dialog to choose source type, then routes
 * to the appropriate connector wizard or upload flow.
 */
export function HubAddSourcesMenu({
  className,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  showTrigger = true,
  onConnectHubProvider,
  onConnectCatalogProvider,
  onBrowseAllConnectors,
  onCustomConnector,
  onUploadFiles,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const chooseOpen = openProp ?? internalOpen;
  const setChooseOpen = onOpenChangeProp ?? setInternalOpen;

  function closeAndRun(action) {
    setChooseOpen(false);
    deferAfterClose(action);
  }

  function handleHubProvider(providerId) {
    closeAndRun(() => onConnectHubProvider?.(providerId));
  }

  function handleCatalogProvider(catalogId) {
    closeAndRun(() => onConnectCatalogProvider?.(catalogId));
  }

  function handleBrowseAll() {
    closeAndRun(() => onBrowseAllConnectors?.());
  }

  function handleCustom() {
    closeAndRun(() => onCustomConnector?.(HUB_CUSTOM_CONNECTOR_CATALOG_ID));
  }

  function handleUpload() {
    closeAndRun(() => onUploadFiles?.());
  }

  return (
    <>
      {showTrigger ? (
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-center rounded-full", className)}
          onClick={() => setChooseOpen(true)}
        >
          <Plus data-icon="inline-start" aria-hidden />
          Add sources
        </Button>
      ) : null}

      <Dialog open={chooseOpen} onOpenChange={setChooseOpen}>
        <DialogContent className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="px-6 py-4">
            <DialogTitle>Choose source type</DialogTitle>
            <DialogDescription>
              Upload from your computer, connect a cloud provider, or browse the integrations
              catalog.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-4">
              <SourceOptionRow
                icon={Upload}
                title="Upload files"
                description="Add documents from your computer"
                onClick={handleUpload}
              />

              <Separator />

              <section className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Popular connectors
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {HUB_POPULAR_CONNECTORS.map((connector) => (
                    <Button
                      key={connector.id}
                      type="button"
                      variant="outline"
                      disabled={!connector.enabled}
                      className="flex h-auto flex-col items-center gap-2 p-3"
                      onClick={() => {
                        if (!connector.enabled) return;
                        if (connector.flow === "hub-wizard") {
                          handleHubProvider(connector.id);
                        } else if (connector.flow === "integrations-wizard") {
                          handleCatalogProvider(connector.catalogId);
                        }
                      }}
                    >
                      {connector.logo ? (
                        <img
                          src={connector.logo}
                          alt=""
                          className="size-8 object-contain"
                          draggable={false}
                        />
                      ) : null}
                      <span className="min-w-0 w-full truncate text-center text-xs font-semibold">
                        {connector.label}
                      </span>
                      {connector.recommended ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Recommended
                        </Badge>
                      ) : null}
                      {!connector.enabled ? (
                        <Badge variant="outline" className="text-[10px]">
                          Soon
                        </Badge>
                      ) : null}
                    </Button>
                  ))}
                </div>
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  More options
                </p>
                <div className="flex flex-col gap-2">
                  <SourceOptionRow
                    icon={LayoutGrid}
                    title="Browse all connectors"
                    description="Search the full integrations catalog"
                    onClick={handleBrowseAll}
                  />
                  <SourceOptionRow
                    icon={Wrench}
                    title="Custom connector"
                    description="Connect an MCP server or custom integration"
                    onClick={handleCustom}
                  />
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 rounded-none border-t border-border bg-muted/30 p-0 px-6 py-4 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setChooseOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
