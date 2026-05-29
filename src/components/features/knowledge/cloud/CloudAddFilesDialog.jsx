import { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CAPTION } from "@/lib/typography";

import { CloudConnectionSwitcher } from "./CloudConnectionSwitcher";
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

  const availableFiles = useMemo(
    () =>
      sourceFiles.filter(
        (f) =>
          f.type !== "folder" &&
          !excludeIdSet.has(f.id) &&
          !excludeNameSet.has(f.name.toLowerCase()),
      ),
    [sourceFiles, excludeIdSet, excludeNameSet],
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

  const filtered = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    if (!q) return availableFiles;
    return availableFiles.filter((f) => f.name.toLowerCase().includes(q));
  }, [availableFiles, fileSearch]);

  const allSelected =
    filtered.length > 0 && filtered.every((f) => selectedIds.has(f.id));

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
      setSelectedIds(new Set(filtered.map((f) => f.id)));
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
    const selected = availableFiles.filter((f) => selectedIds.has(f.id));
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
          ) : availableFiles.length === 0 ? (
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

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          role="checkbox"
                          aria-label="Select all files"
                          checked={allSelected}
                          onChange={handleToggleAll}
                          className="size-4 rounded border-input accent-primary"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                          No files match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((file) => (
                        <TableRow
                          key={file.id}
                          data-state={selectedIds.has(file.id) ? "selected" : undefined}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              role="checkbox"
                              aria-label={`Select ${file.name}`}
                              checked={selectedIds.has(file.id)}
                              onChange={() => handleToggle(file.id)}
                              className="size-4 rounded border-input accent-primary"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="text-muted-foreground" aria-hidden />
                              <span className="truncate font-medium text-foreground">
                                {file.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {file.size}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
