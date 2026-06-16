import { Database, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEMO_DB_TABLES_BY_CONNECTION } from "@/data/documentLibrary";

export function DbBrowseTablesDialog({ connection, open, onOpenChange, onSelectTable }) {
  const tables = connection ? DEMO_DB_TABLES_BY_CONNECTION[connection.id] ?? [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" aria-hidden />
            Browse {connection?.name}
          </DialogTitle>
          <DialogDescription>
            Pick a table or collection to add as a source to your library and this hub.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-64 space-y-2 overflow-y-auto py-1">
          {tables.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              No tables synced yet for this connection.
            </li>
          ) : (
            tables.map((table) => (
              <li key={table.tableName}>
                <button
                  type="button"
                  onClick={() => onSelectTable?.(connection, table)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <Table2 className="size-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium">{table.tableName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {table.schema ? `${table.schema} · ` : ""}
                      {table.rowCount != null
                        ? `${table.rowCount.toLocaleString()} rows`
                        : "Collection"}
                    </p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
