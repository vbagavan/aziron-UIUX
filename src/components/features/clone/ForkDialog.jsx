/**
 * ForkDialog — unified single-dialog fork flow for agents and flows.
 *
 * Runs structured dependency validation (model, knowledge, tools, vault, access)
 * while the user completes fork details. Cleared to fork when all checks pass;
 * actionable gaps otherwise, with optional fork-and-finish-later when only missing.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { GitFork } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DEP_STATUS,
  getDependencyCheckDefinitions,
  runCloneDependencyCheck,
  markDependencyResolved,
} from "@/lib/cloneDependencyCheck";
import ForkReadinessChecklist from "@/components/features/clone/ForkReadinessChecklist";

/* ── Section label ───────────────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <p className="type-section-eyebrow text-muted-foreground/80">
      {children}
    </p>
  );
}

/* ── Main dialog ─────────────────────────────────────────────────────────────── */

/**
 * @param {object}   props
 * @param {boolean}  props.open
 * @param {function} props.onOpenChange
 * @param {"agent"|"flow"} props.kind
 * @param {object}   props.source         – agent or flow object
 * @param {object}   props.permissions    – { canFork?, canCreateFlow? }
 * @param {function} props.onFork         – ({ name, description, visibility: "private", source }) => void
 * @param {function} [props.onNavigate]   – (target: string) => void
 * @param {boolean}  [props.compact]      – shorter dialog (e.g. marketplace)
 * @param {string}   [props.readinessSectionLabel]
 * @param {string}   [props.forkError]    – API / submit error message
 * @param {boolean}  [props.permissionBlocked]
 * @param {string}   [props.permissionMessage]
 */
export default function ForkDialog({
  open,
  onOpenChange,
  kind,
  source,
  permissions,
  onFork,
  onNavigate,
  onNotify,
  compact = false,
  readinessSectionLabel = "Workspace requirements",
  forkError = null,
  permissionBlocked = false,
  permissionMessage = "",
}) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [checkPhase, setCheckPhase]   = useState("idle");
  const [checkReport, setCheckReport] = useState(null);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });
  const [currentCheckId, setCurrentCheckId] = useState(null);
  const [completedChecks, setCompletedChecks] = useState([]);
  const [checkDefs, setCheckDefs] = useState([]);
  const nameRef = useRef(null);

  /* Reset & seed form when dialog opens */
  useEffect(() => {
    if (open && source) {
      setName(kind === "agent" ? `${source.name} (Fork)` : `Fork of ${source.name}`);
      setDescription(source.description ?? "");
      setCheckPhase("idle");
      setCheckReport(null);
      setCheckProgress({ current: 0, total: 0 });
      setCurrentCheckId(null);
      setCompletedChecks([]);
      setCheckDefs([]);
      setTimeout(() => nameRef.current?.select(), 60);
    }
    if (!open) {
      setCheckPhase("idle");
      setCheckReport(null);
      setCheckProgress({ current: 0, total: 0 });
      setCurrentCheckId(null);
      setCompletedChecks([]);
      setCheckDefs([]);
    }
  }, [open, source?.id, kind]);

  const runCheck = useCallback(async () => {
    if (!source) return;
    const defs = getDependencyCheckDefinitions(source, kind, permissions);
    setCheckPhase("checking");
    setCheckReport(null);
    setCheckDefs(defs);
    setCheckProgress({ current: 0, total: defs.length });
    setCurrentCheckId(null);
    setCompletedChecks([]);
    try {
      const result = await runCloneDependencyCheck(source, kind, {
        ...permissions,
        onCheckStart: (item) => setCurrentCheckId(item.id),
        onProgress: (_result, current, total) => {
          setCheckProgress({ current, total });
          setCompletedChecks((prev) => [...prev, _result]);
          setCurrentCheckId(null);
        },
      });
      setCheckReport(result);
      setCheckPhase("done");
    } catch {
      setCheckPhase("done");
      setCheckReport(null);
    }
  }, [source, kind, permissions]);

  /* Kick off checks as dialog opens — parallel with user filling the form */
  useEffect(() => {
    if (open && source) runCheck();
  }, [open, source?.id, kind]);

  const permError = checkReport?.blocking.some((i) => i.status === DEP_STATUS.ERROR) ?? false;
  const hasMissing = (checkReport?.counts.missing ?? 0) > 0;
  const warningCount = checkReport?.counts.warning ?? 0;
  const fullyReady = checkReport?.fullyReady ?? false;
  const trimmedName = name.trim();
  const canFork =
    trimmedName.length > 0 && !permError && !permissionBlocked;

  const forkNoun = kind === "agent" ? "Fork agent" : "Fork flow";
  const ctaLabel = (() => {
    if (permError) return forkNoun;
    if (fullyReady) return forkNoun;
    if (hasMissing) return `${forkNoun} · set up later`;
    if (warningCount > 0) {
      const w = `${warningCount} warning${warningCount === 1 ? "" : "s"}`;
      return `${forkNoun} · ${w}`;
    }
    return forkNoun;
  })();

  const handleAutoResolve = () => {
    if (!checkReport?.blocking?.length) return;
    checkReport.blocking.forEach((item) => markDependencyResolved(item.id, source, kind));
    onNotify?.(
      `Applied suggested fixes to ${checkReport.blocking.length} item${checkReport.blocking.length === 1 ? "" : "s"}.`,
    );
    runCheck();
  };

  const handleFork = () => {
    if (!canFork) return;
    onFork?.({ name: trimmedName, description: description.trim(), visibility: "private", source });
    onOpenChange(false);
  };

  const stepCount = source?.steps?.length ?? 0;
  const version   = source?.version;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[min(92vh,880px)] flex-col gap-0 overflow-hidden p-0 sm:w-full",
          compact ? "min-h-0" : "min-h-[min(70vh,560px)]",
        )}
      >
        {/* ── Fixed header ── */}
        <DialogHeader className="relative shrink-0 border-b border-border px-8 pt-7 pb-5 pr-16">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 border border-primary/20 dark:bg-primary/20">
              <GitFork className="size-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-left text-xl font-semibold leading-snug text-foreground">
                Fork {kind === "agent" ? "agent" : "flow"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-left text-sm leading-relaxed text-muted-foreground">
                Create an independent copy of{" "}
                <span className="font-medium text-foreground">{source?.name ?? `this ${kind}`}</span>
                {" "}that you can modify freely.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

          {/* Source provenance */}
          {(version || stepCount > 0) && (
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <GitFork className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
              <span>
                Forking from{" "}
                <span className="font-medium text-foreground">{source?.name}</span>
              </span>
              <div className="ml-auto flex shrink-0 items-center gap-2 text-xs">
                {version && (
                  <span className="rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[11px]">
                    {version}
                  </span>
                )}
                {stepCount > 0 && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{stepCount} {stepCount === 1 ? "step" : "steps"}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Fork details section ── */}
          <div className="flex flex-col gap-4">
            <SectionLabel>Fork details</SectionLabel>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="fork-dialog-name">
                Fork name
              </label>
              <Input
                ref={nameRef}
                id="fork-dialog-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canFork) handleFork();
                }}
                placeholder="Name your fork…"
                maxLength={80}
                className="h-10 text-sm"
                autoComplete="off"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="fork-dialog-desc">
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="fork-dialog-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this fork is for…"
                rows={3}
                maxLength={300}
                className={cn(
                  "w-full resize-none rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-xs",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              />
            </div>
          </div>

          {/* ── Readiness section ── */}
          <div className="flex flex-col gap-3">
            {!(checkPhase === "done" && fullyReady && !permError) && (
              <SectionLabel>{readinessSectionLabel}</SectionLabel>
            )}
            <ForkReadinessChecklist
              phase={checkPhase}
              report={checkReport}
              source={source}
              kind={kind}
              checkProgress={checkProgress}
              checkDefs={checkDefs}
              completedChecks={completedChecks}
              currentCheckId={currentCheckId}
              onNavigate={
                onNavigate
                  ? (target) => {
                      onOpenChange(false);
                      onNavigate(target);
                    }
                  : undefined
              }
              onRecheck={runCheck}
              onAutoResolve={handleAutoResolve}
            />
          </div>

        </div>{/* end scrollable body */}

        {(permissionBlocked && permissionMessage) && (
          <p className="shrink-0 border-t border-border bg-destructive/5 px-8 py-3 text-sm text-destructive" role="alert">
            {permissionMessage}
          </p>
        )}

        {forkError && (
          <p className="shrink-0 border-t border-border bg-destructive/5 px-8 py-3 text-sm text-destructive" role="alert">
            {forkError}
          </p>
        )}

        {/* ── Fixed footer ── */}
        <div className="shrink-0 flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-8 py-5 dark:bg-muted/20">
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-[100px] shrink-0"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-10 min-w-[220px] shrink-0 gap-2 px-4"
            disabled={!canFork}
            onClick={handleFork}
            aria-label={
              warningCount > 0 && !fullyReady && !hasMissing && !permError
                ? `${ctaLabel}. Creates your fork; review flagged items in the checklist above.`
                : ctaLabel
            }
          >
            <GitFork className="size-4" aria-hidden />
            {ctaLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
