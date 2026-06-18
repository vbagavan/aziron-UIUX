import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inferHubFileType } from "@/data/knowledgeHubs";
import { getFileTypeConfig } from "@/components/features/knowledge/hubFileTypeConfig";
import { FileSourceBadge } from "@/components/features/knowledge/FileSourceBadge";
import { totalAttachedSizeMb } from "@/components/features/knowledge/createHubAttachedFiles";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { cn } from "@/lib/utils";

export function getAttachedRowTypeLabel(row) {
  const mime = row.file?.type ?? row.pickerFile?.mimeType ?? row.pickerFile?.type ?? "";
  return inferHubFileType(row.name, mime);
}

export function SelectedSourcesTable({
  attachedFiles,
  onRemove,
  className,
  compact = false,
  maxHeightClass = "max-h-48",
  showHeader = true,
}) {
  if (!attachedFiles?.length) return null;

  const localCount = attachedFiles.filter((r) => r.source === "upload" || r.source === "user").length;
  const cloudCount = attachedFiles.filter((r) => r.source === "cloud").length;
  const totalSizeMb = totalAttachedSizeMb(attachedFiles);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-muted/20", className)}>
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <p className="text-xs font-semibold text-foreground">
            {KNOWLEDGE_TERMS.selectedSources}
            <span className="ml-1.5 font-normal text-muted-foreground">
              ({attachedFiles.length} total
              {localCount > 0 ? ` · ${localCount} local` : ""}
              {cloudCount > 0 ? ` · ${cloudCount} cloud` : ""}
              {` · ${totalSizeMb} MB`})
            </span>
          </p>
        </div>
      ) : null}

      <div className={cn("overflow-y-auto", maxHeightClass)}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={compact ? "h-8 text-[11px]" : undefined}>Name</TableHead>
              <TableHead className={cn("w-[88px]", compact && "h-8 text-[11px]")}>Type</TableHead>
              <TableHead className={cn("w-[88px]", compact && "h-8 text-[11px]")}>Size</TableHead>
              <TableHead className={cn("w-[100px]", compact && "h-8 text-[11px]")}>Source</TableHead>
              {onRemove ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {attachedFiles.map((row) => {
              const typeLabel = getAttachedRowTypeLabel(row);
              const typeConfig = getFileTypeConfig(typeLabel);
              const TypeIcon = typeConfig.icon;
              return (
                <TableRow key={row.id}>
                  <TableCell className={cn("max-w-0 font-medium", compact && "py-2 text-xs")}>
                    <span className="truncate" title={row.name}>
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-muted-foreground", compact && "py-2 text-xs")}>
                    <span className="inline-flex items-center gap-1">
                      <TypeIcon className={cn("size-3.5 shrink-0", typeConfig.fg)} aria-hidden />
                      {typeConfig.label}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-muted-foreground", compact && "py-2 text-xs")}>
                    {row.sizeLabel ?? "—"}
                  </TableCell>
                  <TableCell className={compact ? "py-2" : undefined}>
                    <FileSourceBadge
                      file={{ source: row.source === "cloud" ? "cloud" : "user" }}
                      size="sm"
                    />
                  </TableCell>
                  {onRemove ? (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${row.name}`}
                        onClick={() => onRemove(row.id)}
                      >
                        <X aria-hidden />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function SelectedSourcesCollapsible({
  attachedFiles,
  onRemove,
  open,
  onOpenChange,
}) {
  if (!attachedFiles?.length) return null;

  const count = attachedFiles.length;
  const totalSizeMb = totalAttachedSizeMb(attachedFiles);

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="shrink-0 border-t border-border bg-muted/10"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/20">
        <span className="text-sm font-medium text-foreground">
          {count} source{count === 1 ? "" : "s"} selected
          <span className="ml-1.5 font-normal text-muted-foreground">· {totalSizeMb} MB</span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-6 pb-4">
        <SelectedSourcesTable
          attachedFiles={attachedFiles}
          onRemove={onRemove}
          compact
          showHeader={false}
          maxHeightClass="max-h-40"
          className="border-0 bg-transparent"
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
