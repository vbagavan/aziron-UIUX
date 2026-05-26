import { useRef, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PROJECT_DOCUMENT_TYPES } from "@/data/projectDocuments";
import { detectDocumentType, saveFileToStorage, deleteFileFromStorage } from "@/lib/projectFileStorage";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * @param {{
 *   uploads: Array<{ id: string, file: File, documentType: string, fileName: string, previewUrl?: string }>,
 *   onUploadsChange: (uploads: Array) => void,
 * }} props
 */
export function ProjectDocumentUploadZone({ uploads, onUploadsChange }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  async function addFiles(fileList) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    const valid = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name} exceeds 25 MB limit.`);
        continue;
      }
      const id = `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const autoType = detectDocumentType(file.name);
      const entry = {
        id,
        file,
        fileName: file.name,
        documentType: autoType,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      };
      valid.push(entry);
      // Persist to IndexedDB in background — non-blocking
      saveFileToStorage(id, file).catch(() => {});
    }

    if (valid.length) {
      setError(null);
      onUploadsChange([...uploads, ...valid]);
    }
  }

  function removeUpload(id) {
    const removed = uploads.find((u) => u.id === id);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    deleteFileFromStorage(id).catch(() => {});
    onUploadsChange(uploads.filter((u) => u.id !== id));
  }

  function updateType(id, documentType) {
    onUploadsChange(uploads.map((u) => (u.id === id ? { ...u, documentType } : u)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload project documents"
      >
        <UploadCloud className="size-8 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-sm text-foreground">Drag and drop contract documents here</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            NDA, PO, MSA, SOW, or Amendment — PDF, Word, or images up to 25 MB
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Document type is detected automatically from the filename
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <UploadCloud data-icon="inline-start" />
          Choose files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept={ACCEPT}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Upload issue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{u.fileName}</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                auto-detected
              </Badge>
              <Select value={u.documentType} onValueChange={(v) => updateType(u.id, v)}>
                <SelectTrigger className="w-[150px]" aria-label={`Document type for ${u.fileName}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PROJECT_DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${u.fileName}`}
                onClick={() => removeUpload(u.id)}
              >
                <Trash2 data-icon="inline-start" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
