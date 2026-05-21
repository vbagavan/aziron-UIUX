import { useRef, useState } from "react";
import { UploadCloud, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES_LABEL,
  MAX_FILE_BYTES,
} from "@/data/knowledgeHubs";

/**
 * @param {{ compact?: boolean, multiple?: boolean, onFilesAccepted: (files: File[]) => void }} props
 */
export function KnowledgeHubFileUploadZone({
  compact = false,
  multiple = true,
  onFilesAccepted,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [lastQueued, setLastQueued] = useState([]);

  function processFiles(fileList) {
    const all = Array.from(fileList ?? []);
    if (all.length === 0) return;
    const valid = all.filter((f) => f.size <= MAX_FILE_BYTES);
    const rejected = all.length - valid.length;
    setFileTooLarge(rejected > 0);
    if (valid.length === 0) return;
    setLastQueued(valid.map((f) => f.name));
    onFilesAccepted(valid);
  }

  return (
    <div className={cn("flex flex-col gap-3", compact ? "w-full" : "")}>
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-4 transition-colors",
          compact ? "min-h-[140px]" : "min-h-[180px]",
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
          processFiles(e.dataTransfer.files);
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
        aria-label="Upload files to Knowledge Hub"
      >
        <UploadCloud
          size={compact ? 32 : 40}
          className="text-muted-foreground"
          strokeWidth={1.5}
        />
        <div className="text-center">
          <p className="text-sm text-foreground">
            {multiple ? "Select files or drag and drop here" : "Select a file or drag and drop here"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{ACCEPTED_FILE_TYPES_LABEL}</p>
        </div>
        <Button
          size="sm"
          type="button"
          className="gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <UploadCloud size={16} />
          {multiple ? "Choose files" : "Choose file"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={ACCEPTED_FILE_EXTENSIONS}
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {lastQueued.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <FileText size={16} className="shrink-0 text-primary" />
            <span className="font-medium">
              {lastQueued.length} file{lastQueued.length === 1 ? "" : "s"} added to this hub
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {lastQueued.join(", ")}
          </p>
        </div>
      )}

      {fileTooLarge && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Some files were skipped</AlertTitle>
          <AlertDescription>Each file must be 10 MB or smaller.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
