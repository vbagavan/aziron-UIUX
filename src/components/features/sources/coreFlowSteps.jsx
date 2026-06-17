/**
 * Core + shared steps for the Add Source wizard:
 * choose-type, files upload, processing, configure, destination, success.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Database,
  Library,
  UploadCloud,
  Workflow,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FILE_FORMATS,
  SOURCE_TYPES,
  SUGGESTED_TAGS,
  VISIBILITY_OPTIONS,
} from "@/data/addSourceCatalog";
import { deriveSourceName, SOURCE_TYPE_STEP_HINTS } from "@/lib/addSourceFlow";
import {
  OptionCard,
  RadioRow,
  StatTile,
  WizardSection,
} from "@/components/features/sources/wizardPrimitives";

function formatSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

// ─── Step 1 — choose source type ─────────────────────────────────────────────

export function ChooseSourceTypeStep({ state, onSelectType }) {
  return (
    <div className="flex flex-col gap-3">
      {SOURCE_TYPES.map((type) => (
        <OptionCard
          key={type.id}
          icon={type.icon}
          accent={type.accent}
          title={type.label}
          description={type.description}
          badge={SOURCE_TYPE_STEP_HINTS[type.id]}
          selected={state.type === type.id}
          onClick={() => onSelectType?.(type.id)}
        />
      ))}
    </div>
  );
}

// ─── Flow A — upload files ───────────────────────────────────────────────────

export function FilesUploadStep({ state, update, filePickerGuard = null }) {
  const inputRef = useRef(null);
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);
  const items = state.files?.items ?? [];

  function openFilePicker() {
    if (filePickerGuard) {
      filePickerGuard.openFileInput(inputRef.current);
      return;
    }
    inputRef.current?.click();
  }

  function handleFileInputChange(e) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList ?? []).filter(Boolean);
    if (!incoming.length) return;
    const existing = new Set(items.map((f) => `${f.name}:${f.size}`));
    const merged = [...items];
    for (const f of incoming) {
      const key = `${f.name}:${f.size}`;
      if (!existing.has(key)) {
        merged.push(f);
        existing.add(key);
      }
    }
    update("files", { items: merged });
  }

  function removeFile(index) {
    update("files", { items: items.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <UploadCloud size={40} strokeWidth={1.5} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Drag &amp; drop files here</p>
          <p className="mt-0.5 text-xs text-muted-foreground">or click to browse your computer</p>
        </div>
        <label
          htmlFor={inputId}
          className={cn(buttonVariants({ size: "sm" }), "cursor-pointer")}
          onClick={(e) => e.stopPropagation()}
        >
          <UploadCloud data-icon="inline-start" aria-hidden />
          Browse files
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={
            filePickerGuard
              ? filePickerGuard.onFileInputChange(handleFileInputChange)
              : handleFileInputChange
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Supported formats:</span>
        {FILE_FORMATS.map((fmt) => (
          <Badge key={fmt} variant="secondary" className="text-[10px]">
            {fmt}
          </Badge>
        ))}
      </div>

      {items.length > 0 ? (
        <WizardSection title={`Selected files (${items.length})`}>
          <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
            {items.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <UploadCloud className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(i)}
                >
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </WizardSection>
      ) : null}
    </div>
  );
}

// ─── Flow A — processing (simulated indexing) ────────────────────────────────

const PROCESSING_TASKS = [
  "Generating embeddings…",
  "Creating knowledge index…",
  "Extracting metadata…",
];

export function ProcessingStep({ state, onDone }) {
  const [progress, setProgress] = useState(0);
  const items = state.files?.items ?? [];

  useEffect(() => {
    let pct = 0;
    const id = window.setInterval(() => {
      pct = Math.min(100, pct + 4);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        window.setTimeout(() => onDone?.(), 350);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [onDone]);

  const fileThreshold = items.length
    ? Math.ceil((progress / 70) * items.length)
    : 0;

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Uploading &amp; indexing…</p>
        <Progress value={progress} className="mt-1" />
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((file, i) => {
            const done = i < fileThreshold;
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <span className="size-4 shrink-0 animate-pulse rounded-full bg-muted" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      <ul className="flex flex-col gap-2">
        {PROCESSING_TASKS.map((task, i) => {
          const active = progress >= 70 + i * 10;
          return (
            <li key={task} className="flex items-center gap-2 text-sm">
              {active ? (
                <CheckCircle2 className="size-4 text-success" aria-hidden />
              ) : (
                <span className="size-4 animate-pulse rounded-full bg-muted" aria-hidden />
              )}
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{task}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Shared — configure source ───────────────────────────────────────────────

export function ConfigureSourceStep({ state, update }) {
  const config = state.config;

  function toggleTag(tag) {
    const tags = config.tags ?? [];
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    update("config", { tags: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="src-name">Name</Label>
        <Input
          id="src-name"
          value={config.name}
          placeholder={deriveSourceName(state)}
          onChange={(e) => update("config", { name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="src-desc">Description</Label>
        <Textarea
          id="src-desc"
          rows={3}
          value={config.description}
          placeholder="What does this source contain?"
          onChange={(e) => update("config", { description: e.target.value })}
        />
      </div>

      <WizardSection title="Tags">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.map((tag) => {
            const active = (config.tags ?? []).includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </WizardSection>

      <WizardSection title="Visibility">
        <div className="flex flex-col gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <RadioRow
              key={opt.id}
              label={opt.label}
              description={opt.description}
              selected={config.visibility === opt.id}
              onClick={() => update("config", { visibility: opt.id })}
            />
          ))}
        </div>
      </WizardSection>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">Auto sync</span>
          <span className="text-xs text-muted-foreground">Keep this source up to date automatically</span>
        </div>
        <Switch
          checked={config.autoSync}
          onCheckedChange={(checked) => update("config", { autoSync: checked })}
          aria-label="Auto sync"
        />
      </div>
    </div>
  );
}

// ─── Shared — destination ────────────────────────────────────────────────────

export function DestinationStep({ state, update, hubs = [] }) {
  const dest = state.destination;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <RadioRow
          label="Save to Documents only"
          description="Add to the document library — link to a hub later"
          selected={dest.mode === "documents"}
          onClick={() => update("destination", { mode: "documents" })}
        />
        <RadioRow
          label="Create new Knowledge Hub"
          description="Spin up a hub and add this source to it"
          selected={dest.mode === "new-hub"}
          onClick={() => update("destination", { mode: "new-hub" })}
        />
        <RadioRow
          label="Add to existing Knowledge Hub"
          description="Attach this source to a hub you already have"
          selected={dest.mode === "existing-hub"}
          onClick={() => update("destination", { mode: "existing-hub" })}
        />
      </div>

      {dest.mode === "new-hub" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-hub-name">Knowledge Hub name</Label>
          <Input
            id="new-hub-name"
            value={dest.newHubName}
            placeholder="e.g. Customer Hub"
            onChange={(e) => update("destination", { newHubName: e.target.value })}
          />
        </div>
      ) : null}

      {dest.mode === "existing-hub" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="existing-hub">Select Knowledge Hub</Label>
          {hubs.length > 0 ? (
            <Select
              value={dest.hubId ? String(dest.hubId) : undefined}
              onValueChange={(value) => update("destination", { hubId: value })}
            >
              <SelectTrigger id="existing-hub">
                <SelectValue placeholder="Choose a hub…" />
              </SelectTrigger>
              <SelectContent>
                {hubs.map((hub) => (
                  <SelectItem key={hub.id} value={String(hub.id)}>
                    {hub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No Knowledge Hubs yet — create one above instead.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── Shared — success ────────────────────────────────────────────────────────

export function SuccessStep({ result, onViewSource, onOpenHub, onCreateAgent, onCreateFlow }) {
  if (!result) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="size-7 text-success" aria-hidden />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">Source successfully added</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your source is indexed and ready to use across Aziron.
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-3">
        <StatTile label="Source" value={result.sourceName} />
        <StatTile label="Indexed records" value={result.indexedRecords.toLocaleString()} accent="#2563eb" />
        <StatTile label="Knowledge Hub" value={result.hubName ?? "Documents library"} />
      </div>

      <div className="flex w-full flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next actions</p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onViewSource}>
            <Library data-icon="inline-start" aria-hidden />
            View source
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!result.hubId}
            onClick={onOpenHub}
          >
            <Database data-icon="inline-start" aria-hidden />
            Open Knowledge Hub
          </Button>
          <Button type="button" variant="outline" onClick={onCreateAgent}>
            <Bot data-icon="inline-start" aria-hidden />
            Create Agent
          </Button>
          <Button type="button" variant="outline" onClick={onCreateFlow}>
            <Workflow data-icon="inline-start" aria-hidden />
            Create Flow
          </Button>
        </div>
      </div>
    </div>
  );
}
