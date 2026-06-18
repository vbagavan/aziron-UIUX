import { useEffect, useState } from "react";
import {
  ClipboardList,
  FileText,
  MoreHorizontal,
  Network,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const CAPTURE_ACTIONS = [
  { id: "save-note", label: "Save as Note", icon: Pencil },
  { id: "save-node", label: "Save to Existing Node", icon: Network },
  { id: "create-document", label: "Create New Document", icon: FileText },
  { id: "generate-report", label: "Generate Report", icon: ClipboardList },
];

export function CaptureActionItems({ onSelect, disabled = false }) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-xs">Capture content</DropdownMenuLabel>
      {CAPTURE_ACTIONS.map(({ id, label, icon: Icon }) => (
        <DropdownMenuItem
          key={id}
          disabled={disabled}
          onClick={() => onSelect?.(id)}
          className="gap-2"
        >
          <Icon className="size-3.5 text-muted-foreground" />
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );
}

export function ContentCaptureDropdown({
  content,
  sourceLabel,
  onCapture,
  disabled = false,
  align = "start",
  triggerClassName,
  triggerTitle = "Capture content",
}) {
  const canCapture = !disabled && Boolean(content?.trim());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={!canCapture}
            title={triggerTitle}
            aria-label={triggerTitle}
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
              triggerClassName,
            )}
          />
        }
      >
        <MoreHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <CaptureActionItems
          disabled={!canCapture}
          onSelect={(action) => onCapture?.(action, content, sourceLabel)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SelectionContextMenu({ menu, onCapture, onClose }) {
  useEffect(() => {
    if (!menu) return undefined;
    function handleDismiss() {
      onClose?.();
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") handleDismiss();
    }
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close capture menu"
        className="fixed inset-0 z-[80]"
        onClick={onClose}
      />
      <div
        className="fixed z-[81] min-w-[220px] overflow-hidden rounded-[10px] border border-border bg-popover py-1 shadow-lg"
        style={{ left: menu.x, top: menu.y }}
        role="menu"
      >
        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Selected text
        </p>
        <div className="my-1 h-px bg-border" />
        {CAPTURE_ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="menuitem"
            onClick={() => {
              onCapture?.(id, menu.text, menu.sourceLabel);
              onClose?.();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted"
          >
            <Icon className="size-3.5 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

export function SaveToNodeDialog({ open, nodes, onOpenChange, onSave }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to existing node</DialogTitle>
          <DialogDescription>
            Attach this content to a workspace node. Nodes help organize insights without leaving
            the reader.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
          {(nodes ?? []).map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSave?.(node.id)}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-sm font-medium text-foreground">{node.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {(node.items ?? []).length} item{(node.items ?? []).length === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateDocumentDialog({
  open,
  defaultName,
  onOpenChange,
  onCreate,
}) {
  const [name, setName] = useState(defaultName ?? "capture.md");

  useEffect(() => {
    if (open) setName(defaultName ?? "capture.md");
  }, [open, defaultName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create new document</DialogTitle>
          <DialogDescription>
            Convert the captured content into a new document in your library.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Document name…"
          aria-label="Document name"
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onCreate?.(name.trim())} disabled={!name.trim()}>
            Create document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GenerateReportDialog({
  open,
  reportMarkdown,
  onOpenChange,
  onSaveAsNote,
  onSaveToNode,
  onCreateDocument,
  onDownload,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generated report</DialogTitle>
          <DialogDescription>
            Review the structured report, then save or export it.
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[min(50vh,420px)] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground">
          {reportMarkdown}
        </pre>
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSaveAsNote}>
              Save as note
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onSaveToNode}>
              Save to node
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDownload}>
              Download
            </Button>
            <Button type="button" size="sm" onClick={onCreateDocument}>
              Create document
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
