import { useMemo, useState } from "react";
import { Cloud, FolderOpen, LayoutGrid, Plus, Upload, Wrench } from "lucide-react";
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
import {
  HUB_DIALOG_BODY_SCROLL,
  HUB_DIALOG_CONTENT_MD,
} from "@/components/features/knowledge/hubDialogSizes";
import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";
import { cloudProviderLabel } from "@/lib/hubCloudConnections";
import { cn } from "@/lib/utils";

function deferAfterClose(action) {
  if (!action) return;
  window.setTimeout(action, 0);
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

function ConnectedAccountRow({ connection, onBrowse }) {
  const config = getCloudProviderConfig(connection.provider);
  return (
    <button
      type="button"
      onClick={() => onBrowse(connection)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      {config.logo ? (
        <img src={config.logo} alt="" className="size-8 shrink-0 object-contain" draggable={false} />
      ) : (
        <Cloud className="size-8 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{connection.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {cloudProviderLabel(connection.provider)}
          {connection.connectedBy ? ` · ${connection.connectedBy}` : ""}
          {connection.connectedAt ? ` · ${connection.connectedAt}` : ""}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        <FolderOpen aria-hidden />
        Browse
      </span>
    </button>
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
  showCatalogConnectors = true,
  hideUploadOption = false,
  cloudConnections = [],
  onConnectHubProvider,
  onConnectCatalogProvider,
  onBrowseAllConnectors,
  onCustomConnector,
  onUploadFiles,
  onBrowseCloudConnection,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const chooseOpen = openProp ?? internalOpen;
  const setChooseOpen = onOpenChangeProp ?? setInternalOpen;

  function closeAndRun(action) {
    setChooseOpen(false);
    deferAfterClose(action);
  }

  function handleHubProvider(providerId) {
    if (!onConnectHubProvider) return;
    closeAndRun(() => onConnectHubProvider(providerId));
  }

  function handleCatalogProvider(catalogId) {
    if (!onConnectCatalogProvider) return;
    closeAndRun(() => onConnectCatalogProvider(catalogId));
  }

  function handleBrowseAll() {
    if (!onBrowseAllConnectors) return;
    closeAndRun(onBrowseAllConnectors);
  }

  function handleCustom() {
    if (!onCustomConnector) return;
    closeAndRun(() => onCustomConnector(HUB_CUSTOM_CONNECTOR_CATALOG_ID));
  }

  function handleUpload() {
    if (!onUploadFiles) return;
    closeAndRun(onUploadFiles);
  }

  function handleBrowseConnection(connection) {
    if (!onBrowseCloudConnection) return;
    closeAndRun(() => onBrowseCloudConnection(connection));
  }

  const visibleConnectors = showCatalogConnectors
    ? HUB_POPULAR_CONNECTORS
    : HUB_POPULAR_CONNECTORS.filter((c) => c.hubProviderId);

  const connectedAccounts = useMemo(
    () => cloudConnections ?? [],
    [cloudConnections],
  );

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
        <DialogContent className={HUB_DIALOG_CONTENT_MD}>
          <DialogHeader className="shrink-0 px-6 py-4">
            <DialogTitle>Choose source type</DialogTitle>
            <DialogDescription>
              {hideUploadOption
                ? "Connect OneDrive or Google Drive to import files into your library."
                : showCatalogConnectors
                  ? "Upload from your computer, connect a cloud provider, or browse the integrations catalog."
                  : "Upload from your computer or connect OneDrive / Google Drive to import files."}
            </DialogDescription>
          </DialogHeader>

          <Separator className="shrink-0" />

          <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-4")}>
            <div className="flex flex-col gap-4">
              {!hideUploadOption ? (
                <>
                  <SourceOptionRow
                    icon={Upload}
                    title="Upload files"
                    description="Add documents from your computer"
                    onClick={handleUpload}
                  />

                  <Separator />
                </>
              ) : null}

              {connectedAccounts.length > 0 ? (
                <>
                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Connected accounts
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {connectedAccounts.length}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {connectedAccounts.map((conn) => (
                        <ConnectedAccountRow
                          key={`${conn.provider}-${conn.id ?? conn.name}`}
                          connection={conn}
                          onBrowse={handleBrowseConnection}
                        />
                      ))}
                    </div>
                  </section>

                  <Separator />
                </>
              ) : null}

              <section className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Popular connectors
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visibleConnectors.map((connector) => (
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
                          return;
                        }
                        if (connector.flow === "integrations-wizard") {
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

              {showCatalogConnectors ? (
                <>
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
                </>
              ) : null}
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
