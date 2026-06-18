import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  buildFileTree,
  filterFilesForSearch,
  flattenVisibleTree,
  getFolderIds,
  getSelectableFiles,
} from "@/components/features/knowledge/cloud/cloudFileTree";

const INDENT_PX = [0, 20, 36, 52, 68];

function indentForDepth(depth) {
  return INDENT_PX[Math.min(depth, INDENT_PX.length - 1)];
}

export function CloudFilePickerTable({
  files,
  selectedIds,
  search = "",
  onToggleFile,
  onToggleAll,
  onActivateFile,
}) {
  const [expandedIds, setExpandedIds] = useState(() => new Set(getFolderIds(files)));

  useEffect(() => {
    setExpandedIds(new Set(getFolderIds(files)));
  }, [files]);

  const tree = useMemo(() => buildFileTree(files), [files]);
  const searchRows = useMemo(() => filterFilesForSearch(files, search), [files, search]);
  const rows = searchRows ?? flattenVisibleTree(tree, expandedIds);

  const selectableFiles = getSelectableFiles(files);
  const allSelected =
    selectableFiles.length > 0 && selectableFiles.every((file) => selectedIds.has(file.id));

  function toggleExpand(folderId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  return (
    <div className="max-h-[min(52vh,480px)] overflow-auto rounded-lg border border-border overscroll-y-contain">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                role="checkbox"
                aria-label="Select all files"
                checked={allSelected}
                onChange={onToggleAll}
                className="size-4 rounded border-input accent-primary"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                No files match your search.
              </TableCell>
            </TableRow>
          ) : (
            rows.map(({ node, depth, pathLabel }) => {
              const isFolder = node.type === "folder";
              const isExpanded = expandedIds.has(node.id);
              const checked = selectedIds.has(node.id);
              const displayName = pathLabel ?? node.name;

              return (
                <TableRow key={node.id} data-state={checked ? "selected" : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      role="checkbox"
                      aria-label={`Select ${displayName}`}
                      checked={checked}
                      disabled={isFolder}
                      onChange={() => onToggleFile(node.id)}
                      className="size-4 rounded border-input accent-primary disabled:opacity-40"
                    />
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex min-w-0 items-center gap-1.5"
                      style={{ paddingLeft: indentForDepth(depth) }}
                    >
                      {isFolder && !searchRows ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}`}
                          onClick={() => toggleExpand(node.id)}
                        >
                          <ChevronRight
                            className={cn("transition-transform", isExpanded && "rotate-90")}
                            aria-hidden
                          />
                        </Button>
                      ) : (
                        <span className="size-6 shrink-0" aria-hidden />
                      )}
                      {isFolder ? (
                        <Folder className="shrink-0 text-muted-foreground" aria-hidden />
                      ) : (
                        <FileText className="shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <button
                        type="button"
                        className={cn(
                          "min-w-0 truncate text-left font-medium text-foreground",
                          isFolder && !searchRows && "hover:text-primary",
                          !isFolder && onActivateFile && "cursor-pointer hover:text-primary",
                        )}
                        onClick={() => {
                          if (isFolder && !searchRows) toggleExpand(node.id);
                          else if (!isFolder) onActivateFile?.(node);
                        }}
                        disabled={isFolder && !!searchRows}
                      >
                        {displayName}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{node.size}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
