import { useRef, useState } from "react";
import { ArrowUpDown, Cloud, MoreHorizontal, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";
import { HubFileSyncIcon, hubSyncStatusForRow } from "@/components/features/knowledge/HubFileSyncIcon";
import { HubFileSyncLegend } from "@/components/features/knowledge/HubFileSyncLegend";
import { HubPendingDownloadBanner } from "@/components/features/knowledge/HubPendingDownloadBanner";
import { HubSyncCoachMark } from "@/components/features/knowledge/HubSyncCoachMark";
import { countSyncStates, rowsNeedingDownload } from "@/components/features/knowledge/hubFileSyncUtils";
import { totalAttachedSizeMb } from "@/components/features/knowledge/createHubAttachedFiles";
import { ACCEPTED_FILE_EXTENSIONS } from "@/data/knowledgeHubs";

export function CreateHubFilesStep({
  attachedFiles,
  connectionName,
  cloudProvider = "onedrive",
  onAddFromCloud,
  onUploadFromComputer,
  onRemoveFile,
  onDownloadCloudFile,
  onDownloadAllLinked,
  isDownloadingAll = false,
  sortAsc,
  onSortToggle,
}) {
  const fileInputRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const cloudConfig = getCloudProviderConfig(cloudProvider);

  const totalFiles = attachedFiles.length;
  const totalSizeMb = totalAttachedSizeMb(attachedFiles);
  const syncCounts = countSyncStates(attachedFiles);
  const pendingRows = rowsNeedingDownload(attachedFiles);
  const hasCloudFiles = attachedFiles.some((r) => r.source === "cloud");

  const sorted = [...attachedFiles].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name);
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="flex flex-col gap-4">
      <HubSyncCoachMark visible={hasCloudFiles && syncCounts.cloudLink > 0} />

      <HubPendingDownloadBanner
        pendingCount={pendingRows.length}
        loadingCount={syncCounts.loading}
        isDownloadingAll={isDownloadingAll}
        onDownloadAll={
          pendingRows.length > 0 ? () => onDownloadAllLinked?.(pendingRows) : undefined
        }
      />

      {connectionName && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
          <img
            src={cloudConfig.connectorLogo}
            alt=""
            className="size-6 object-contain"
            draggable={false}
          />
          <span className="truncate text-sm font-medium text-foreground">{connectionName}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Total Files:</span> {totalFiles}
            <span className="mx-2 text-border">|</span>
            <span className="font-medium text-foreground">Total Size:</span> {totalSizeMb} MB
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={ACCEPTED_FILE_EXTENSIONS}
              onChange={(e) => {
                if (e.target.files?.length) onUploadFromComputer?.(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload data-icon="inline-start" aria-hidden />
              Upload from computer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onAddFromCloud}
            >
              <Plus data-icon="inline-start" aria-hidden />
              Add from {cloudConfig.label}
            </Button>
          </div>
        </div>

        {totalFiles === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10">
            <p className="text-center text-sm text-muted-foreground">
              No files attached yet. Connect {cloudConfig.label} or upload from your computer.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" className="gap-1.5" onClick={onAddFromCloud}>
                <Cloud data-icon="inline-start" aria-hidden />
                Connect {cloudConfig.label}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload data-icon="inline-start" aria-hidden />
                Upload from computer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      aria-label="Select all files"
                      checked={sorted.length > 0 && sorted.every((r) => selectedIds.has(r.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(sorted.map((r) => r.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium"
                      onClick={onSortToggle}
                    >
                      Filename
                      <ArrowUpDown className="text-muted-foreground" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px]">File size</TableHead>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => {
                  const syncStatus = hubSyncStatusForRow(row);
                  const canDownload =
                    row.source === "cloud" &&
                    (syncStatus === "linked" || syncStatus === "failed");
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={selectedIds.has(row.id)}
                          onChange={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(row.id)) next.delete(row.id);
                              else next.add(row.id);
                              return next;
                            });
                          }}
                          aria-label={`Select ${row.name}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-0 font-medium">
                        <div className="flex min-w-0 items-center gap-2">
                          <HubFileSyncIcon
                            status={syncStatus}
                            fileName={row.name}
                            canActivate={canDownload}
                            onActivate={() => onDownloadCloudFile?.(row)}
                          />
                          <span className="truncate" title={row.name}>
                            {row.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.sizeLabel}</TableCell>
                      <TableCell className="text-muted-foreground">{row.date}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${row.name}`}
                            >
                              <MoreHorizontal aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              {canDownload && (
                                <DropdownMenuItem
                                  onClick={() => onDownloadCloudFile?.(row)}
                                >
                                  Save to knowledge base
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onRemoveFile?.(row.id)}
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {hasCloudFiles && <HubFileSyncLegend />}
          </>
        )}
      </div>

      {syncCounts.uploaded > 0 && syncCounts.cloudLink > 0 && (
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            Files uploaded from your computer are already in the knowledge base. Cloud-linked
            files need the link icon (or Download all) before agents can use them.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
