import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleX,
  RefreshCw,
  Wrench,
  Download,
  ExternalLink,
  ServerCrash,
  Loader2,
  Zap,
  Minus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getReadinessCopy } from "@/lib/cloneFlowCopy";
import {
  DEP_STATUS,
  getDependencyCheckDefinitions,
  markDependencyResolved,
  runCloneDependencyCheck,
} from "@/lib/cloneDependencyCheck";

const STATUS_META = {
  [DEP_STATUS.SUCCESS]: {
    icon: CheckCircle2,
    label: "Ready",
    badgeVariant: "secondary",
    rowClass: "text-foreground",
    iconClass: "text-success",
  },
  [DEP_STATUS.WARNING]: {
    icon: AlertTriangle,
    label: "Review",
    badgeVariant: "outline",
    rowClass: "text-foreground",
    iconClass: "text-warning",
  },
  [DEP_STATUS.MISSING]: {
    icon: CircleAlert,
    label: "Missing",
    badgeVariant: "destructive",
    rowClass: "text-foreground",
    iconClass: "text-destructive",
  },
  [DEP_STATUS.ERROR]: {
    icon: CircleX,
    label: "Blocked",
    badgeVariant: "destructive",
    rowClass: "text-foreground",
    iconClass: "text-destructive",
  },
};

function ChecklistRow({ item, state }) {
  const meta = STATUS_META[item.status];
  const Icon =
    state === "active"
      ? Loader2
      : state === "pending"
        ? Minus
        : meta?.icon ?? CircleAlert;

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
        state === "active" && "bg-muted/50 text-foreground",
        state === "done" && "text-muted-foreground",
        state === "pending" && "text-muted-foreground/60",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          state === "active" && "animate-spin text-primary",
          state === "done" && meta?.iconClass,
          state === "pending" && "text-muted-foreground/40",
        )}
        aria-hidden
      />
      <span className="flex-1 leading-snug">{item.label}</span>
      {state === "done" && (
        <Badge variant={meta?.badgeVariant ?? "outline"} className="shrink-0 text-[10px]">
          {meta?.label}
        </Badge>
      )}
    </li>
  );
}

function ValidationChecklist({ defs, completed, currentId }) {
  if (!defs?.length) return null;

  return (
    <ul className="space-y-0.5" aria-label="Dependency checks">
      {defs.map((def) => {
        const done = completed.some((c) => c.id === def.id);
        const active = currentId === def.id;
        const state = done ? "done" : active ? "active" : "pending";
        return <ChecklistRow key={def.id} item={def} state={state} />;
      })}
    </ul>
  );
}

function DependencyRow({ item, onResolve, onImport, onNavigate }) {
  const meta = STATUS_META[item.status];
  const Icon = meta?.icon ?? CircleAlert;
  const needsAction =
    item.status === DEP_STATUS.MISSING || item.status === DEP_STATUS.ERROR;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-transparent px-2 py-2.5 transition-colors",
        needsAction && "border-destructive/20 bg-destructive/5",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", meta?.iconClass)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-sm font-medium leading-snug", meta?.rowClass)}>
            {item.label}
          </p>
          <Badge variant={meta?.badgeVariant ?? "outline"} className="shrink-0">
            {meta?.label}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{item.message}</p>
        {needsAction && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => onResolve(item)}
            >
              <Wrench className="size-3.5" aria-hidden />
              {item.resolveHint}
            </Button>
            {(item.category === "vault" || item.id.includes("env")) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => onImport(item)}
              >
                <Download className="size-3.5" aria-hidden />
                Import environment file
              </Button>
            )}
            {item.resolveTarget && onNavigate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => onNavigate(item.resolveTarget)}
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Open settings
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySection({ group, onResolve, onImport, onNavigate }) {
  return (
    <section className="space-y-1">
      <div className="px-2 pb-1">
        <h3 className="text-sm font-medium text-foreground">{group.label}</h3>
        <p className="text-xs text-muted-foreground">{group.description}</p>
      </div>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <DependencyRow
            key={item.id}
            item={item}
            onResolve={onResolve}
            onImport={onImport}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

export default function CloneDependencyCheckDialog({
  open,
  onOpenChange,
  kind,
  source,
  permissions,
  onProceed,
  onNavigate,
  onImportConfig,
  onNotify,
  forkChain = false,
}) {
  const summaryId = useId();
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentCheckId, setCurrentCheckId] = useState(null);
  const [completedChecks, setCompletedChecks] = useState([]);
  const [checkDefs, setCheckDefs] = useState([]);
  const [report, setReport] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [autoResolveConfirm, setAutoResolveConfirm] = useState(false);
  const checklistRef = useRef(null);

  const sourceName = source?.name ?? (kind === "agent" ? "Agent" : "Flow");
  const copy = getReadinessCopy(kind, { forkChain });

  const runValidation = useCallback(async () => {
    if (!source) return;
    setPhase("checking");
    setReport(null);
    setValidationError(null);
    setProgress({ current: 0, total: 0 });
    setCurrentCheckId(null);
    setCompletedChecks([]);
    const defs = getDependencyCheckDefinitions(source, kind, permissions);
    setCheckDefs(defs);
    setAutoResolveConfirm(false);

    try {
      const result = await runCloneDependencyCheck(source, kind, {
        ...permissions,
        onCheckStart: (item) => setCurrentCheckId(item.id),
        onProgress: (result, current, total) => {
          setProgress({ current, total });
          setCompletedChecks((prev) => [...prev, result]);
          setCurrentCheckId(null);
        },
      });
      setReport(result);
      setPhase("done");
    } catch (err) {
      setValidationError(err?.message ?? "Unexpected error during validation.");
      setPhase("error");
    }
  }, [source, kind, permissions]);

  useEffect(() => {
    if (open && source) runValidation();
    else if (!open) {
      setPhase("idle");
      setReport(null);
      setValidationError(null);
      setCurrentCheckId(null);
      setCompletedChecks([]);
      setCheckDefs([]);
      setAutoResolveConfirm(false);
    }
  }, [open, source?.id, kind, runValidation]);

  useEffect(() => {
    checklistRef.current?.scrollTo({ top: checklistRef.current.scrollHeight, behavior: "smooth" });
  }, [completedChecks.length, currentCheckId]);

  const notify = (message) => onNotify?.(message);

  const handleResolve = (item) => {
    markDependencyResolved(item.id, source, kind);
    notify(`"${item.label}" marked configured — running check again.`);
    runValidation();
  };

  const handleImport = (item) => {
    markDependencyResolved(item.id, source, kind);
    onImportConfig?.(item);
    notify("Environment file imported — running check again.");
    runValidation();
  };

  const handleAutoResolve = () => {
    if (!report?.blocking?.length) return;
    report.blocking.forEach((item) => markDependencyResolved(item.id, source, kind));
    setAutoResolveConfirm(false);
    notify(
      `Applied suggested fixes to ${report.blocking.length} item${report.blocking.length === 1 ? "" : "s"}.`,
    );
    runValidation();
  };

  const checking = phase === "checking";
  const hasError = phase === "error";
  const passed = report?.passed ?? false;
  const pct =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (checking && !v) return;
        onOpenChange(v);
      }}
    >
      <DialogContent
        aria-busy={checking}
        aria-describedby={phase === "done" ? summaryId : undefined}
        className={cn(
          "flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
          "sm:max-w-lg",
        )}
      >
        <DialogHeader className="space-y-3 border-b border-border px-6 py-5 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <DialogTitle>{copy.readinessTitle}</DialogTitle>
            <Badge variant="outline" className="shrink-0 font-normal">
              Step {copy.stepCurrent} of {copy.stepTotal}
            </Badge>
          </div>
          <DialogDescription>{copy.readinessDescription(sourceName)}</DialogDescription>
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
              onClick={runValidation}
              disabled={checking}
            >
              <RefreshCw className={cn("size-3.5", checking && "animate-spin")} aria-hidden />
              Run check again
            </Button>
          </div>
          {checking && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  {copy.checkingTitle}
                </span>
                <span>
                  {progress.total > 0
                    ? `${progress.current} of ${progress.total}`
                    : "Starting…"}
                </span>
              </div>
              <Progress value={progress.total > 0 ? pct : 8} max={100} />
            </div>
          )}
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
          role="status"
          aria-live="polite"
        >
          {checking && (
            <div ref={checklistRef} className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
              {checkDefs.length > 0 ? (
                <ValidationChecklist
                  defs={checkDefs}
                  completed={completedChecks}
                  currentId={currentCheckId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Preparing dependency scan…</p>
              )}
            </div>
          )}

          {hasError && (
            <Alert variant="destructive" className="mb-4">
              <ServerCrash className="size-4" aria-hidden />
              <AlertTitle>Validation failed</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={runValidation}
              >
                Try again
              </Button>
            </Alert>
          )}

          {phase === "done" && report && (
            <>
              <div id={summaryId}>
                {passed ? (
                  <Alert className="mb-4 border-success/30 bg-success/5">
                    <CheckCircle2 className="size-4 text-success" aria-hidden />
                    <AlertTitle className="text-foreground">{copy.passedTitle}</AlertTitle>
                    <AlertDescription>
                      {copy.passedBody}
                      {report.counts.warning > 0 && (
                        <span className="mt-1 block">
                          {report.counts.warning} item
                          {report.counts.warning === 1 ? " needs" : "s need"} review but will
                          not block you.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="mb-4">
                    <CircleAlert className="size-4" aria-hidden />
                    <AlertTitle>{copy.blockedTitle}</AlertTitle>
                    <AlertDescription>
                      {copy.blockedBody(report.blocking.length)}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-6">
                {report.grouped.map((group, index) => (
                  <div key={group.id}>
                    {index > 0 && <Separator className="mb-6" />}
                    <CategorySection
                      group={group}
                      onResolve={handleResolve}
                      onImport={handleImport}
                      onNavigate={
                        onNavigate
                          ? (target) => {
                              onOpenChange(false);
                              onNavigate(target);
                            }
                          : null
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-col gap-3 rounded-none border-t border-border bg-muted/30 p-0 px-6 py-4 dark:bg-muted/20 sm:flex-row sm:items-center sm:justify-end">
          {autoResolveConfirm ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Apply suggested workspace fixes to all {report?.blocking?.length ?? 0} blocking
                items? You can adjust them later in settings.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10"
                  onClick={() => setAutoResolveConfirm(false)}
                >
                  Back
                </Button>
                <Button type="button" className="min-h-10 gap-1.5" onClick={handleAutoResolve}>
                  <Zap className="size-4" aria-hidden />
                  Confirm fixes
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="min-h-10 sm:min-w-[100px]"
                onClick={() => onOpenChange(false)}
                disabled={checking}
              >
                Cancel
              </Button>
              {phase === "done" && !passed && (
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 gap-1.5"
                  onClick={() => setAutoResolveConfirm(true)}
                  disabled={checking}
                  title="Creates placeholder bindings in this workspace for demo"
                >
                  <Zap className="size-4" aria-hidden />
                  Apply suggested fixes
                </Button>
              )}
              {phase === "done" && (
                <Button
                  type="button"
                  className="min-h-10 min-w-[140px] gap-1.5"
                  disabled={!passed}
                  aria-describedby={!passed ? summaryId : undefined}
                  title={
                    !passed
                      ? "Resolve blocking items in the list above to continue"
                      : undefined
                  }
                  onClick={() => {
                    onOpenChange(false);
                    onProceed?.(source);
                  }}
                >
                  {copy.proceedLabel}
                </Button>
              )}
              {checking && (
                <Button type="button" className="min-h-10 min-w-[120px]" disabled>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Checking…
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
