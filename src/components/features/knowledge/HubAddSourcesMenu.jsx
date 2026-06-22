import { useMemo, useRef, useState } from "react";
import {
  Cloud,
  Database,
  FileText,
  FolderOpen,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  UploadCloud,
  Wrench,
} from "lucide-react";
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
import { AddApiSourcePanel } from "@/components/features/knowledge/sources/AddApiSourcePanel";
import { AddDbSourcePanel } from "@/components/features/knowledge/sources/AddDbSourcePanel";
import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";
import { SOURCE_CATEGORIES } from "@/lib/sourceCategories";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { cloudProviderLabel } from "@/lib/hubCloudConnections";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = [
  { id: "files", label: SOURCE_CATEGORIES.files.label, icon: FileText },
  { id: "dbs", label: SOURCE_CATEGORIES.dbs.label, icon: Database },
  { id: "apis", label: SOURCE_CATEGORIES.apis.label, icon: MoreHorizontal },
];

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

function UploadDropZone({ onUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  function handleFiles(fileList) {
    const files = Array.from(fileList ?? []).filter(Boolean);
    if (files.length === 0) return;
    onUpload?.(files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload files from your computer"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer",
        dragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/20",
      )}
      onClick={() => { inputRef.current?.click(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
    >
      <UploadCloud className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <div>
        <p className="text-sm font-semibold text-foreground">Upload files</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drag &amp; drop or click to browse from your computer
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
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

function FilesSourcePanel({
  hideUploadOption,
  showCatalogConnectors,
  visibleConnectors,
  connectedAccounts,
  onUpload,
  onBrowseConnection,
  onHubProvider,
  onCatalogProvider,
  onBrowseAll,
  onCustom,
}) {
  return (
    <div className="flex flex-col gap-4">
      {!hideUploadOption ? (
        <>
          <UploadDropZone onUpload={onUpload} />
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
                  onBrowse={onBrowseConnection}
                />
              ))}
            </div>
          </section>
          <Separator />
        </>
      ) : null}

      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cloud storage
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
                  onHubProvider(connector.id);
                  return;
                }
                if (connector.flow === "integrations-wizard") {
                  onCatalogProvider(connector.catalogId);
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
                title={KNOWLEDGE_TERMS.browseAllConnectorsTitle}
                description={KNOWLEDGE_TERMS.browseAllConnectorsDescription}
                onClick={onBrowseAll}
              />
              <SourceOptionRow
                icon={Wrench}
                title={KNOWLEDGE_TERMS.customConnectorTitle}
                description={KNOWLEDGE_TERMS.customConnectorDescription}
                onClick={onCustom}
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

/**
 * Add sources control — category tabs (Files · Database · Others) route to the right wizard.
 */
export function HubAddSourcesMenu({
  className,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  showTrigger = true,
  showCatalogConnectors = true,
  hideUploadOption = false,
  cloudConnections = [],
  connectedDatabases = [],
  onConnectHubProvider,
  onConnectCatalogProvider,
  onConnectDbProvider,
  onBrowseDbConnection,
  onAddApiSource,
  onConnectApiProvider,
  onBrowseAllConnectors,
  onCustomConnector,
  onUploadFiles,
  onBrowseCloudConnection,
  onOpenSetupWizard,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("files");
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

  function handleDbProvider(providerId) {
    if (!onConnectDbProvider) return;
    closeAndRun(() => onConnectDbProvider(providerId));
  }

  function handleBrowseDb(connection) {
    if (!onBrowseDbConnection) return;
    closeAndRun(() => onBrowseDbConnection(connection));
  }

  function handleAddApi(config) {
    if (!onAddApiSource) return;
    closeAndRun(() => onAddApiSource(config));
  }

  function handleApiProvider(providerId) {
    if (!onConnectApiProvider) return;
    closeAndRun(() => onConnectApiProvider(providerId));
  }

  function handleBrowseAll() {
    if (!onBrowseAllConnectors) return;
    closeAndRun(onBrowseAllConnectors);
  }

  function handleCustom() {
    if (!onCustomConnector) return;
    closeAndRun(() => onCustomConnector(HUB_CUSTOM_CONNECTOR_CATALOG_ID));
  }

  function handleUpload(files) {
    if (!onUploadFiles) return;
    closeAndRun(() => onUploadFiles(files));
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

  const categoryDescriptions = {
    files: "Upload locally or connect cloud storage — OneDrive, Google Drive, AWS S3, and more.",
    dbs: "Connect a database, then pick tables, views, or collections.",
    apis: "Add REST or GraphQL endpoints, webhooks, and custom integrations.",
  };

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

      <Dialog
        open={chooseOpen}
        onOpenChange={(next) => {
          setChooseOpen(next);
          if (!next) setActiveCategory("files");
        }}
      >
        <DialogContent className={HUB_DIALOG_CONTENT_MD}>
          <DialogHeader className="shrink-0 px-6 py-4">
            <DialogTitle>{KNOWLEDGE_TERMS.addSources}</DialogTitle>
            <DialogDescription>
              Same categories as All Sources filters — pick how you want to connect.
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 border-b border-border px-6">
            <div className="flex gap-1" role="tablist" aria-label="Source category">
              {CATEGORY_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === id}
                  onClick={() => setActiveCategory(id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
                    activeCategory === id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={cn(HUB_DIALOG_BODY_SCROLL, "px-6 py-4 pb-6")}>
            {activeCategory === "files" ? (
              <p className="mb-4 text-sm text-muted-foreground">
                {categoryDescriptions.files}
              </p>
            ) : null}

            {activeCategory === "files" ? (
              <FilesSourcePanel
                hideUploadOption={hideUploadOption}
                showCatalogConnectors={showCatalogConnectors}
                visibleConnectors={visibleConnectors}
                connectedAccounts={connectedAccounts}
                onUpload={handleUpload}
                onBrowseConnection={handleBrowseConnection}
                onHubProvider={handleHubProvider}
                onCatalogProvider={handleCatalogProvider}
                onBrowseAll={handleBrowseAll}
                onCustom={handleCustom}
              />
            ) : null}

            {activeCategory === "dbs" ? (
              <AddDbSourcePanel
                connectedDatabases={connectedDatabases}
                onConnectProvider={handleDbProvider}
                onBrowseConnection={handleBrowseDb}
              />
            ) : null}

            {activeCategory === "apis" ? (
              <AddApiSourcePanel
                onAddApiSource={handleAddApi}
                onConnectProvider={handleApiProvider}
              />
            ) : null}
          </div>

          <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 rounded-none border-t border-border bg-muted/30 p-0 px-6 py-4 sm:justify-between">
            <div>
              {onOpenSetupWizard ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => closeAndRun(() => onOpenSetupWizard(activeCategory))}
                >
                  Open setup wizard
                </Button>
              ) : null}
            </div>
            <Button type="button" variant="ghost" onClick={() => setChooseOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
