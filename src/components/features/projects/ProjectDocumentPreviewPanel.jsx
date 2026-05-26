import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectDocumentTypeLabel } from "@/data/projectDocuments";
import { ProjectDocumentPreviewViewer } from "@/components/features/projects/ProjectDocumentPreviewViewer";
import { ProjectDocumentUploadSlot } from "@/components/features/projects/ProjectDocumentUploadSlot";
import { supportsObjectUrlPreview } from "@/lib/projectDocumentPreview";
import { saveFileToStorage, deleteFileFromStorage } from "@/lib/projectFileStorage";
import { cn } from "@/lib/utils";

const MAX_BYTES = 25 * 1024 * 1024;

function createUploadId() {
  return `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * @param {{
 *   uploads: Array<{ id: string, file?: File, documentType: string, fileName: string, previewUrl?: string | null }>,
 *   activeIndex: number,
 *   onActiveIndexChange: (index: number) => void,
 *   onUploadsChange: (uploads: Array) => void,
 *   className?: string,
 * }} props
 */
export function ProjectDocumentPreviewPanel({
  uploads,
  activeIndex,
  onActiveIndexChange,
  onUploadsChange,
  className,
}) {
  const [stagingType, setStagingType] = useState("");
  const [stagingFile, setStagingFile] = useState(null);
  const [stagingError, setStagingError] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(true);

  const active = uploads[activeIndex];
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < uploads.length - 1;

  function resetStaging() {
    setStagingType("");
    setStagingFile(null);
    setStagingError(null);
  }

  async function commitStagingUpload() {
    setStagingError(null);
    if (!stagingType) {
      setStagingError("Select a document type before uploading.");
      return;
    }
    if (!stagingFile) {
      setStagingError("Choose a file to upload.");
      return;
    }
    if (stagingFile.size > MAX_BYTES) {
      setStagingError(`${stagingFile.name} exceeds the 25 MB limit.`);
      return;
    }

    const id = createUploadId();
    const entry = {
      id,
      file: stagingFile,
      fileName: stagingFile.name,
      documentType: stagingType,
      previewUrl: supportsObjectUrlPreview(stagingFile.name, stagingFile.type)
        ? URL.createObjectURL(stagingFile)
        : null,
    };

    try {
      await saveFileToStorage(id, stagingFile);
    } catch {
      // Non-fatal — file remains in memory
    }

    const nextUploads = [...uploads, entry];
    onUploadsChange(nextUploads);
    onActiveIndexChange(nextUploads.length - 1);
    resetStaging();
    setShowAddSlot(false);
  }

  function removeAt(index) {
    const removed = uploads[index];
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    deleteFileFromStorage(removed.id).catch(() => {});
    const next = uploads.filter((_, i) => i !== index);
    onUploadsChange(next);
    onActiveIndexChange(Math.max(0, Math.min(activeIndex, next.length - 1)));
    if (next.length === 0) {
      setShowAddSlot(true);
    }
  }

  if (!uploads.length) {
    return (
      <Card className={cn("flex h-full min-h-[480px] flex-col", className)}>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Document preview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center p-6">
          <ProjectDocumentUploadSlot
            documentType={stagingType}
            onDocumentTypeChange={setStagingType}
            selectedFile={stagingFile}
            onFileSelect={setStagingFile}
            onUpload={commitStagingUpload}
            error={stagingError}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex h-full min-h-[480px] flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border py-3">
        <CardTitle className="text-sm font-semibold">Document preview</CardTitle>
        {!showAddSlot ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              resetStaging();
              setShowAddSlot(true);
            }}
          >
            <Plus data-icon="inline-start" />
            Add more files
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {showAddSlot ? (
          <ProjectDocumentUploadSlot
            compact
            documentType={stagingType}
            onDocumentTypeChange={setStagingType}
            selectedFile={stagingFile}
            onFileSelect={setStagingFile}
            onUpload={commitStagingUpload}
            error={stagingError}
          />
        ) : null}

        <div className="relative flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-muted/20">
          {uploads.length > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute top-1/2 left-2 z-10 -translate-y-1/2 shadow-sm"
                disabled={!canPrev}
                onClick={() => onActiveIndexChange(activeIndex - 1)}
                aria-label="Previous document"
              >
                <ChevronLeft data-icon="inline-start" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute top-1/2 right-2 z-10 -translate-y-1/2 shadow-sm"
                disabled={!canNext}
                onClick={() => onActiveIndexChange(activeIndex + 1)}
                aria-label="Next document"
              >
                <ChevronRight data-icon="inline-start" />
              </Button>
            </>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <div className="flex flex-wrap items-center justify-center gap-2 px-1">
              <Badge variant="secondary">
                {getProjectDocumentTypeLabel(active.documentType)}
              </Badge>
              <span className="max-w-full truncate text-center text-sm font-medium">
                {active.fileName}
              </span>
            </div>

            <div className="flex min-h-[min(360px,52vh)] min-w-0 flex-1 flex-col">
              <ProjectDocumentPreviewViewer
                key={active.id}
                upload={active}
                className="h-full min-h-[min(360px,52vh)] w-full"
              />
            </div>
          </div>

          {uploads.length > 1 ? (
            <div className="border-t border-border bg-card/80 px-3 py-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {uploads.map((u, index) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onActiveIndexChange(index)}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-1 rounded-lg border p-2 transition-colors",
                      index === activeIndex
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-background hover:bg-muted/50",
                    )}
                    aria-label={`View ${u.fileName}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  >
                    <span className="flex size-12 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {u.previewUrl && supportsObjectUrlPreview(u.fileName, u.file?.type) ? (
                        <img src={u.previewUrl} alt="" className="size-12 object-cover" />
                      ) : (
                        <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <span className="max-w-[72px] truncate text-[10px] font-medium">{u.fileName}</span>
                    <Badge variant="outline" className="text-[9px] font-normal">
                      {getProjectDocumentTypeLabel(u.documentType)}
                    </Badge>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {activeIndex + 1} of {uploads.length}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => removeAt(activeIndex)}
          >
            <Trash2 data-icon="inline-start" />
            Remove this file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
