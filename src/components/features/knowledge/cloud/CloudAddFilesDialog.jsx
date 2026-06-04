import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { CAPTION } from "@/lib/typography";

import { CloudConnectionSwitcher } from "./CloudConnectionSwitcher";
import { CloudFilePickerTable } from "./CloudFilePickerTable";
import { getCloudProviderConfig } from "./cloudProviderConfig";

export function CloudAddFilesDialog({
  provider = "onedrive",
  open,
  onOpenChange,
  connectionName,
  connections: connectionsProp,
  activeConnection: activeConnectionProp,
  onActiveConnectionChange,
  excludeExternalIds = [],
  excludeNames = [],
  onConfirm,
}) {
  const config = getCloudProviderConfig(provider);
  const connectionOptions = useMemo(
    () =>
      connectionsProp?.length > 0 ? connectionsProp : config.mockConnections ?? [],
    [connectionsProp, config.mockConnections],
  );

  const connectionIdsKey = useMemo(
    () => connectionOptions.map((c) => c.id).join(","),
    [connectionOptions],
  );

  const [activeConnection, setActiveConnection] = useState(
    () => activeConnectionProp ?? connectionOptions[0] ?? null,
  );
  const [phase, setPhase] = useState("loading");
  const [fileSearch, setFileSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const displayConnection =
    activeConnection?.name ?? connectionName ?? config.label;

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
    if (!open) {
      setPhase("loading");
      setFileSearch("");
      setSelectedIds(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const initial = activeConnectionProp ?? connectionOptions[0] ?? null;
    setActiveConnection(initial);
    setPhase("loading");
    const timer = window.setTimeout(() => setPhase("picker"), 900);
    return () => window.clearTimeout(timer);
  }, [open, activeConnectionProp?.id, connectionIdsKey]);

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
    onActiveConnectionChange?.(conn);
    setSelectedIds(new Set());
    setFileSearch("");
    setPhase("loading");
    window.setTimeout(() => setPhase("picker"), 700);
  }

  function handleAdd() {
    const selected = selectableFiles.filter((f) => selectedIds.has(f.id));
    if (selected.length === 0) return;
    onConfirm?.(selected, activeConnection);
    onOpenChange(false);
  }

  const accountsLabel =
    provider === "google-drive" ? "Google Drive accounts" : "OneDrive accounts";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Add more files</DialogTitle>
          <DialogDescription>
            Select additional files from your connected {config.label} account.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <CloudConnectionSwitcher
            logo={config.logo}
            connections={connectionOptions}
            activeConnection={activeConnection}
            onSelectConnection={handleSwitchConnection}
            accountsLabel={accountsLabel}
            className={phase === "loading" ? "mb-4" : "mb-0"}
          />

          {phase === "loading" ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Spinner className="size-10" />
              <p className="text-sm font-medium text-foreground">
                Loading {config.label} files
              </p>
              <p className={cn(CAPTION, "max-w-sm text-center")}>
                Fetching files from {displayConnection}…
              </p>
            </div>
          ) : selectableFiles.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              All available files from this connection are already in the hub.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <InputGroup>
                <InputGroupAddon>
                  <Search aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search"
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

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={phase !== "picker" || selectedIds.size === 0}
            onClick={handleAdd}
          >
            Add to hub
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
