import { UploadCloud, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_EXTENSIONS, ACCEPTED_FILE_TYPES_LABEL } from "@/data/knowledgeHubs";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export function LocalComputerDropZone({
  inputId,
  fileInputRef,
  dragActive = false,
  fileTooLarge = false,
  disabled = false,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileChange,
  filePickerGuard = null,
  hint = null,
  className,
}) {
  function openFilePicker() {
    if (disabled) return;
    if (filePickerGuard) {
      filePickerGuard.openFileInput(fileInputRef.current);
      return;
    }
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e) {
    onFileChange?.(e);
    e.target.value = "";
  }

  return (
    <div className={cn("flex min-h-[320px] flex-col gap-4", className)}>
      <div
        className={cn(
          "flex min-h-[280px] flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 transition-colors",
          disabled && "cursor-not-allowed opacity-60",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
        onDragEnter={disabled ? undefined : onDragEnter}
        onDragLeave={disabled ? undefined : onDragLeave}
        onDragOver={(e) => !disabled && e.preventDefault()}
        onDrop={disabled ? undefined : onDrop}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Drop files to upload from your computer"
      >
        <UploadCloud size={40} className="text-muted-foreground" strokeWidth={1.5} aria-hidden />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{KNOWLEDGE_TERMS.selectFilesPrompt}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ACCEPTED_FILE_TYPES_LABEL}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <Button
          type="button"
          size="sm"
          className="pointer-events-auto"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            openFilePicker();
          }}
        >
          <UploadCloud data-icon="inline-start" aria-hidden />
          {KNOWLEDGE_TERMS.browseFiles}
        </Button>
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_EXTENSIONS}
          className="hidden"
          tabIndex={-1}
          disabled={disabled}
          onChange={
            filePickerGuard
              ? filePickerGuard.onFileInputChange(handleFileInputChange)
              : handleFileInputChange
          }
        />
      </div>

      {fileTooLarge ? (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="size-4" />
          <AlertTitle className="text-sm">File is too large</AlertTitle>
          <AlertDescription className="text-xs">
            Documents must be under 10 MB; video, audio, and EPUB files under 100 MB.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
