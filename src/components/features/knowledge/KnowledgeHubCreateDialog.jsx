import { useRef, useState, useEffect } from "react";
import {
  UploadCloud,
  AlertTriangle,
  ArrowLeft,
  Check,
  FileText,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES_LABEL,
} from "@/data/knowledgeHubs";

const MAX_BYTES = 10 * 1024 * 1024;

function Step1Upload({
  fileTooLarge,
  dragActive,
  pendingFiles,
  fileInputRef,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileChange,
  onUploadClick,
  onRemoveFile,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-wrap items-center justify-center gap-4">
        <div className="flex shrink-0 flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-[226px] w-full max-w-[344px] cursor-pointer flex-col items-center justify-center gap-5 rounded-lg border border-dashed p-4 transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30",
            )}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={onUploadClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onUploadClick();
              }
            }}
            aria-label="Upload files area"
          >
            <UploadCloud size={48} className="text-muted-foreground" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm leading-5 text-foreground">
                Select files or drag and drop here
              </p>
              <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                {ACCEPTED_FILE_TYPES_LABEL}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can add more files anytime on the hub page.
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUploadClick();
              }}
            >
              <UploadCloud size={16} />
              Upload files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={ACCEPTED_FILE_EXTENSIONS}
              onChange={onFileChange}
            />
          </div>

          {pendingFiles.length > 0 && (
            <ul className="flex w-full max-w-[344px] flex-col gap-1.5">
              {pendingFiles.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <FileText size={16} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-foreground">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => onRemoveFile(i)}
                  >
                    <X size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {fileTooLarge && (
            <Alert variant="destructive" className="w-full max-w-[344px]">
              <AlertTriangle className="size-4" />
              <AlertTitle>File is too large</AlertTitle>
              <AlertDescription>Maximum file size is 10 MB per file.</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex max-w-[280px] flex-col justify-center gap-2 px-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Cloud connectors</p>
          <p className="text-xs leading-relaxed">
            Google Drive, OneDrive, Dropbox, Box, and Atlassian are not available in this
            prototype. Upload files from your device instead.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step2Details({ formData, pendingFiles, onChange }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {pendingFiles.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <p className="text-muted-foreground">
            {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"} to index:
          </p>
          <ul className="mt-1 max-h-24 overflow-y-auto">
            {pendingFiles.map((f, i) => (
              <li key={`${f.name}-${i}`} className="truncate font-medium text-foreground">
                {f.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="kh-name" className="text-sm font-medium text-foreground">
          Knowledge Hub name
        </label>
        <Input
          id="kh-name"
          placeholder="e.g. Product documentation, HR policies"
          value={formData.name}
          onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
        />
        <p className="text-sm text-muted-foreground">
          Name your hub so your team can recognize what agents will retrieve from it.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="kh-desc" className="text-sm font-medium text-foreground">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="kh-desc"
          placeholder="What documents live here and how agents should use them."
          value={formData.description}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={4}
          className="resize-none"
        />
      </div>
    </div>
  );
}

export function KnowledgeHubCreateDialog({ open, onOpenChange, onCreated }) {
  const [dialogStep, setDialogStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setDialogStep(1);
      setFormData({ name: "", description: "" });
      setPendingFiles([]);
      setFileTooLarge(false);
      setDragActive(false);
    }
  }, [open]);

  function addFiles(fileList) {
    const incoming = Array.from(fileList ?? []).filter(Boolean);
    if (incoming.length === 0) return;
    const tooBig = incoming.some((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setFileTooLarge(true);
      return;
    }
    setFileTooLarge(false);
    setPendingFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const next = [...prev];
      for (const f of incoming) {
        if (!names.has(f.name)) {
          next.push(f);
          names.add(f.name);
        }
      }
      return next;
    });
    if (dialogStep === 1) setDialogStep(2);
  }

  function handleCreate() {
    if (!formData.name.trim()) return;
    onCreated?.({
      name: formData.name,
      description: formData.description,
      pendingFiles: pendingFiles.length > 0 ? pendingFiles : undefined,
      pendingFile: pendingFiles[0] ?? null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
            Step {dialogStep} of 2 — {dialogStep === 1 ? "Add content" : "Name your hub"}
          </p>
          <DialogTitle>Create Knowledge Hub</DialogTitle>
          <DialogDescription>
            Store documents your AI agents use for retrieval, reasoning, and workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {dialogStep === 1 ? (
            <Step1Upload
              fileTooLarge={fileTooLarge}
              dragActive={dragActive}
              pendingFiles={pendingFiles}
              fileInputRef={fileInputRef}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                addFiles(e.dataTransfer.files);
              }}
              onFileChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
              onUploadClick={() => fileInputRef.current?.click()}
              onRemoveFile={(index) =>
                setPendingFiles((prev) => prev.filter((_, i) => i !== index))
              }
            />
          ) : (
            <Step2Details
              formData={formData}
              pendingFiles={pendingFiles}
              onChange={setFormData}
            />
          )}
        </div>

        <DialogFooter className="m-0 shrink-0 gap-0 rounded-none border-t border-border bg-muted/30 p-0 px-6 py-4 !mx-0 !mb-0 dark:bg-muted/20">
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {dialogStep === 1 ? (
              <>
                <Button variant="outline" type="button" onClick={() => setDialogStep(2)}>
                  Skip for now
                </Button>
                <Button type="button" className="gap-1.5" onClick={() => setDialogStep(2)}>
                  Continue
                  <ArrowRight size={15} />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="gap-1.5"
                  onClick={() => setDialogStep(1)}
                >
                  <ArrowLeft size={15} />
                  Back
                </Button>
                <Button
                  type="button"
                  className="gap-1.5"
                  onClick={handleCreate}
                  disabled={!formData.name.trim()}
                >
                  <Check size={15} />
                  Create Knowledge Hub
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
