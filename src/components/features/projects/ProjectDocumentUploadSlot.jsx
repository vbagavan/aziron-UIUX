import { useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_DOCUMENT_TYPES } from "@/data/projectDocuments";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg";

/**
 * Staging UI: pick document type, choose file, then upload.
 *
 * @param {{
 *   documentType: string,
 *   onDocumentTypeChange: (value: string) => void,
 *   selectedFile: File | null,
 *   onFileSelect: (file: File | null) => void,
 *   onUpload: () => void,
 *   uploadDisabled?: boolean,
 *   error?: string | null,
 *   className?: string,
 *   compact?: boolean,
 * }} props
 */
export function ProjectDocumentUploadSlot({
  documentType,
  onDocumentTypeChange,
  selectedFile,
  onFileSelect,
  onUpload,
  uploadDisabled = false,
  error,
  className,
  compact = false,
}) {
  const fileInputRef = useRef(null);
  const canUpload = Boolean(documentType && selectedFile && !uploadDisabled);

  function handleFileChange(fileList) {
    const file = fileList?.[0] ?? null;
    onFileSelect(file);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-dashed border-border bg-muted/15 p-4",
        className,
      )}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="document-type-select">Document type</FieldLabel>
          <Select value={documentType || ""} onValueChange={onDocumentTypeChange}>
            <SelectTrigger id="document-type-select" className="w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(320px,60vh)]">
              <SelectGroup>
                {PROJECT_DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="items-start py-2">
                    <span className="flex flex-col gap-0.5 text-left">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {t.description}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>Required before uploading a file.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel>File</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={!documentType}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText data-icon="inline-start" />
              {selectedFile ? "Change file" : "Choose file"}
            </Button>
            {selectedFile ? (
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {selectedFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear selected file"
                  onClick={() => onFileSelect(null)}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                PDF, Word, or images up to 25 MB
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPT}
            onChange={(e) => {
              handleFileChange(e.target.files);
              e.target.value = "";
            }}
          />
        </Field>
      </FieldGroup>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className={cn("flex", compact ? "justify-end" : "justify-start")}>
        <Button type="button" disabled={!canUpload} onClick={onUpload}>
          <Upload data-icon="inline-start" />
          Upload
        </Button>
      </div>
    </div>
  );
}
