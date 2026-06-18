import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Cloud, FolderOpen, LayoutGrid, Search, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HUB_POPULAR_CONNECTORS } from "@/components/features/knowledge/hubAddSourceConnectors";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { CloudConnectionSwitcher } from "./CloudConnectionSwitcher";
import { CloudFilePickerTable } from "./CloudFilePickerTable";
import { getCloudProviderConfig } from "./cloudProviderConfig";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

function providerLabel(provider) {
  return provider === "google-drive" ? "Google Drive" : "OneDrive";
}

export function CloudFilePickerPanel({
  provider,
  connection,
  connections,
  excludeExternalIds = [],
  excludeNames = [],
  onBack,
  onAddConnection,
  onAddFiles,
  addButtonLabel = KNOWLEDGE_TERMS.addToSelection,
  showBackButton = true,
  embedded = false,
}) {
  const config = getCloudProviderConfig(provider);
  const connectionOptions = useMemo(
    () =>
      (connections ?? []).filter((c) => c.provider === provider).length > 0
        ? connections.filter((c) => c.provider === provider)
        : config.mockConnections ?? [],
    [connections, provider, config.mockConnections],
  );

  const [activeConnection, setActiveConnection] = useState(
    () => connection ?? connectionOptions[0] ?? null,
  );
  const [phase, setPhase] = useState("loading");
  const [fileSearch, setFileSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const sourceFiles = useMemo(() => {
    if (config.getMockFilesForConnection && activeConnection?.id) {
      return config.getMockFilesForConnection(activeConnection.id);
    }
    return config.mockFiles;
  }, [config, activeConnection?.id]);

  const excludeIdSet = useMemo(() => new Set(excludeExternalIds), [excludeExternalIds]);
  const excludeNameSet = useMemo(
    () => new Set(excludeNames.map((n) => n.toLowerCase())),
    [excludeNames],
  );

  const pickerItems = useMemo(
    () =>
      sourceFiles.filter(
        (f) =>
          f.type === "folder" ||
          (!excludeIdSet.has(f.id) && !excludeNameSet.has(f.name.toLowerCase())),
      ),
    [sourceFiles, excludeIdSet, excludeNameSet],
  );

  const selectableFiles = useMemo(
    () => pickerItems.filter((f) => f.type === "file"),
    [pickerItems],
  );

  useEffect(() => {
    setActiveConnection(connection ?? connectionOptions[0] ?? null);
    setPhase("loading");
    setFileSearch("");
    setSelectedIds(new Set());
    const timer = window.setTimeout(() => setPhase("picker"), 700);
    return () => window.clearTimeout(timer);
  }, [connection?.id, provider]);

  function handleToggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleAll(e) {
    if (e.target.checked) {
      setSelectedIds(new Set(selectableFiles.map((f) => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSwitchConnection(conn) {
    if (conn.id === activeConnection?.id) return;
    setActiveConnection(conn);
    setSelectedIds(new Set());
    setFileSearch("");
    setPhase("loading");
    window.setTimeout(() => setPhase("picker"), 700);
  }

  function handleAddSelected() {
    const selected = selectableFiles.filter((f) => selectedIds.has(f.id));
    if (selected.length === 0) return;
    onAddFiles?.(selected, activeConnection);
    setSelectedIds(new Set());
  }

  const accountsLabel =
    provider === "google-drive" ? "Google Drive accounts" : "OneDrive accounts";

  const shellClass = embedded
    ? "flex min-h-0 flex-1 flex-col overflow-hidden"
    : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card";

  return (
    <div className={shellClass}>
      {showBackButton && onBack ? (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label={KNOWLEDGE_TERMS.backToConnections}
          >
            <ArrowLeft aria-hidden />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              Browse {config.label}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Select files to add to your upload
            </p>
          </div>
        </div>
      ) : (
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Browse {config.label}</p>
          <p className="text-xs text-muted-foreground">
            Select files from {providerLabel(provider)}
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <CloudConnectionSwitcher
          logo={config.logo}
          connections={connectionOptions}
          activeConnection={activeConnection}
          onSelectConnection={handleSwitchConnection}
          onAddConnection={onAddConnection}
          accountsLabel={accountsLabel}
          className="mb-3"
        />

        {phase === "loading" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">Loading files…</p>
          </div>
        ) : selectableFiles.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No files available from this connection.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search files"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                aria-label={`Search ${config.label} files`}
              />
            </InputGroup>
            <CloudFilePickerTable
              files={pickerItems}
              selectedIds={selectedIds}
              search={fileSearch}
              onToggleFile={handleToggle}
              onToggleAll={handleToggleAll}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/25 px-3 py-2.5">
        <span className="text-xs text-muted-foreground">
          {selectedIds.size > 0
            ? `${selectedIds.size} file${selectedIds.size === 1 ? "" : "s"} selected`
            : "Select files to import"}
        </span>
        <Button
          type="button"
          size="sm"
          disabled={phase !== "picker" || selectedIds.size === 0}
          onClick={handleAddSelected}
        >
          {addButtonLabel}
        </Button>
      </div>
    </div>
  );
}

export function CloudConnectionsPanel({
  connections,
  onBrowseConnection,
  onSelectProvider,
  onBrowseAll,
  onCustomConnector,
}) {
  return (
    <div className="flex flex-col gap-4">
      {connections.length > 0 ? (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Connected accounts
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {connections.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {connections.map((conn) => {
                const config = getCloudProviderConfig(conn.provider);
                return (
                  <button
                    key={`${conn.provider}-${conn.id}`}
                    type="button"
                    onClick={() => onBrowseConnection(conn)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                  >
                    {config.logo ? (
                      <img src={config.logo} alt="" className="size-8 shrink-0 object-contain" draggable={false} />
                    ) : (
                      <Cloud className="size-8 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{conn.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {providerLabel(conn.provider)}
                        {conn.accountEmail ? ` · ${conn.accountEmail}` : ""}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                      <FolderOpen className="size-3.5" aria-hidden />
                      Browse
                    </span>
                  </button>
                );
              })}
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
          {HUB_POPULAR_CONNECTORS.map((connector) => (
            <Button
              key={connector.id}
              type="button"
              variant="outline"
              disabled={!connector.enabled}
              className={cn(
                "flex h-auto flex-col items-center gap-2 p-3",
                !connector.enabled && "opacity-60",
              )}
              onClick={() => connector.enabled && onSelectProvider?.(connector.id)}
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
                <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
              ) : null}
              {!connector.enabled ? (
                <Badge variant="outline" className="text-[10px]">Soon</Badge>
              ) : null}
            </Button>
          ))}
        </div>
      </section>

      {(onBrowseAll || onCustomConnector) ? (
        <>
          <Separator />
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              More options
            </p>
            <div className="flex flex-col gap-2">
              {onBrowseAll ? (
                <button
                  type="button"
                  onClick={onBrowseAll}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <LayoutGrid className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Browse all connectors</span>
                    <span className="text-xs text-muted-foreground">Search the full integrations catalog</span>
                  </span>
                </button>
              ) : null}
              {onCustomConnector ? (
                <button
                  type="button"
                  onClick={onCustomConnector}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <Wrench className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Custom connector</span>
                    <span className="text-xs text-muted-foreground">Connect an MCP server or custom integration</span>
                  </span>
                </button>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
