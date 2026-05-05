import { useState, useEffect } from "react";
import { GitFork, Lock, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * ForkFlowDialog
 *
 * Opens when the user chooses to fork a flow. Lets them set a custom name,
 * description, and visibility before the fork is created.
 *
 * Props:
 *   open           – boolean
 *   onOpenChange   – (bool) => void
 *   sourceFlow     – the original flow object { name, description, steps, visibility, version }
 *   onConfirm      – ({ name, description, visibility }) => void  — called on "Fork"
 */
export function ForkFlowDialog({ open, onOpenChange, sourceFlow, onConfirm }) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility]   = useState("private");
  const [busy, setBusy]               = useState(false);

  // Reset fields each time the dialog opens
  useEffect(() => {
    if (open && sourceFlow) {
      setName(`Fork of ${sourceFlow.name}`);
      setDescription(typeof sourceFlow.description === "string" ? sourceFlow.description : "");
      setVisibility("private");
      setBusy(false);
    }
  }, [open, sourceFlow]);

  const stepCount = sourceFlow?.steps?.length ?? 0;
  const version   = sourceFlow?.version ?? "v0.1";
  const trimmed   = name.trim();

  const handleConfirm = () => {
    if (!trimmed) return;
    setBusy(true);
    try {
      onConfirm?.({ name: trimmed, description: description.trim(), visibility });
    } finally {
      setBusy(false);
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="w-[calc(100vw-2rem)] max-w-md gap-0 p-0 sm:w-full"
      >
        <DialogHeader className="relative px-6 pt-6 pb-2 pr-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/25">
            <GitFork className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <DialogTitle className="text-balance text-center text-lg font-semibold leading-snug text-foreground">
            Fork flow
          </DialogTitle>
          <DialogDescription className="text-balance px-1 pt-2 text-center text-sm leading-relaxed text-muted-foreground">
            Create an independent copy of{" "}
            <span className="font-medium text-foreground">
              {sourceFlow?.name ?? "this flow"}
            </span>{" "}
            that you can modify freely.
          </DialogDescription>
        </DialogHeader>

        {/* Source provenance pill */}
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          <GitFork className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
          <span>
            Forking from{" "}
            <span className="font-medium text-foreground">{sourceFlow?.name}</span>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{version}</span>
            <span className="text-muted-foreground/60">·</span>
            <span>{stepCount} {stepCount === 1 ? "step" : "steps"}</span>
          </span>
        </div>

        <Separator className="mt-4" />

        {/* Fields */}
        <div className="flex flex-col gap-4 px-6 pt-4 pb-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="fork-name">
              Fork name
            </label>
            <Input
              id="fork-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fork name…"
              maxLength={80}
              className="h-9"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="fork-desc">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="fork-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this fork is for…"
              rows={3}
              maxLength={300}
              className={cn(
                "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            />
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground">Visibility</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "private", icon: Lock,  label: "Private", sub: "Only you can see this" },
                { value: "public",  icon: Globe, label: "Public",  sub: "Visible to all users" },
              ].map(({ value: v, icon: Icon, label, sub }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
                    visibility === v
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", visibility === v ? "text-primary" : "text-muted-foreground")} aria-hidden />
                  <span className="flex flex-col gap-0.5">
                    <span className={cn("font-medium", visibility === v && "text-foreground")}>{label}</span>
                    <span className="text-xs leading-snug text-muted-foreground">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border bg-muted/30 px-6 py-4 mt-4 dark:bg-muted/20">
          <Button
            type="button"
            variant="outline"
            className="min-h-10 flex-1"
            onClick={() => onOpenChange?.(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-10 flex-1 gap-1.5"
            disabled={busy || !trimmed}
            onClick={handleConfirm}
          >
            <GitFork className="h-3.5 w-3.5" />
            Fork flow
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
