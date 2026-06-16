import { Database, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DB_SOURCE_CONNECTORS } from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";

function ConnectedDbRow({ connection, onBrowse }) {
  return (
    <button
      type="button"
      onClick={() => onBrowse?.(connection)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <Database className="size-8 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{connection.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {connection.providerLabel}
          {connection.tableCount != null ? ` · ${connection.tableCount} tables synced` : ""}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        <FolderOpen aria-hidden />
        Browse
      </span>
    </button>
  );
}

export function AddDbSourcePanel({
  connectedDatabases = [],
  onConnectProvider,
  onBrowseConnection,
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Connect a database, then pick tables, views, or collections to add as sources.
      </p>

      {connectedDatabases.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Connected
            </p>
            <Badge variant="secondary" className="text-[10px]">
              {connectedDatabases.length}
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            {connectedDatabases.map((conn) => (
              <ConnectedDbRow
                key={conn.id ?? conn.name}
                connection={conn}
                onBrowse={onBrowseConnection}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Connect database
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DB_SOURCE_CONNECTORS.map((connector) => (
            <Button
              key={connector.id}
              type="button"
              variant="outline"
              disabled={!connector.enabled}
              className={cn(
                "flex h-auto flex-col items-center gap-2 p-3",
                !connector.enabled && "opacity-60",
              )}
              onClick={() => connector.enabled && onConnectProvider?.(connector.id)}
            >
              <Database className="size-8 text-muted-foreground" aria-hidden />
              <span className="min-w-0 w-full truncate text-center text-xs font-semibold">
                {connector.label}
              </span>
              {!connector.enabled ? (
                <Badge variant="outline" className="text-[10px]">
                  Soon
                </Badge>
              ) : null}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
