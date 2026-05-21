import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Loader2,
  Minus,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DEP_STATUS,
  FORK_PILLARS,
  getForkReadinessSummary,
  markDependencyResolved,
} from "@/lib/cloneDependencyCheck";

const STATUS_META = {
  [DEP_STATUS.SUCCESS]: {
    icon: CheckCircle2,
    badge: "Ready",
    badgeClass: "border-success/30 bg-success/10 text-success",
    iconClass: "text-success",
  },
  [DEP_STATUS.WARNING]: {
    icon: AlertTriangle,
    badge: "Review",
    badgeClass: "border-warning/30 bg-warning/10 text-warning",
    iconClass: "text-warning",
  },
  [DEP_STATUS.MISSING]: {
    icon: CircleAlert,
    badge: "Missing",
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
    iconClass: "text-destructive",
  },
  [DEP_STATUS.ERROR]: {
    icon: CircleX,
    badge: "Blocked",
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
    iconClass: "text-destructive",
  },
};

function getPillarStepStates(checkDefs, completedChecks, currentCheckId) {
  return FORK_PILLARS.map((pillar) => {
    const items = checkDefs.filter((d) => d.category === pillar.id);
    if (items.length === 0) return { ...pillar, state: "skip" };
    const done = items.every((d) => completedChecks.some((c) => c.id === d.id));
    const active = items.some((d) => d.id === currentCheckId);
    if (done) return { ...pillar, state: "done" };
    if (active) return { ...pillar, state: "active" };
    const started = items.some((d) => completedChecks.some((c) => c.id === d.id));
    if (started) return { ...pillar, state: "active" };
    return { ...pillar, state: "pending" };
  }).filter((p) => p.state !== "skip");
}

function ValidationProgressPanel({ checkProgress, checkDefs, completedChecks, currentCheckId }) {
  const { current, total } = checkProgress;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const currentDef = checkDefs.find((d) => d.id === currentCheckId);
  const currentPillar = FORK_PILLARS.find((p) => p.id === currentDef?.category);
  const pillarSteps = getPillarStepStates(checkDefs, completedChecks, currentCheckId);

  return (
    <div className="space-y-4 px-5 py-4" role="status" aria-live="polite" aria-busy="true">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
            Validating your workspace
          </span>
          <span className="tabular-nums text-muted-foreground">
            {total > 0 ? `${current} of ${total}` : "Starting…"}
          </span>
        </div>
        <Progress value={total > 0 ? pct : 6} max={100} className="h-2" />
        <p className="text-[11px] text-muted-foreground">
          {total > 0 ? `${pct}% complete` : "Preparing checks…"}
        </p>
      </div>

      {currentDef && (
        <p className="text-sm text-foreground">
          Checking{" "}
          <span className="font-medium">{currentPillar?.label ?? "configuration"}</span>
          <span className="text-muted-foreground"> — {currentDef.label}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {pillarSteps.map((pillar) => (
          <span
            key={pillar.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
              pillar.state === "done" &&
                "border-success/30 bg-success/10 text-success",
              pillar.state === "active" &&
                "border-primary/30 bg-primary/10 text-primary",
              pillar.state === "pending" &&
                "border-border bg-muted/40 text-muted-foreground",
            )}
          >
            {pillar.state === "done" ? (
              <CheckCircle2 className="size-3 shrink-0" aria-hidden />
            ) : pillar.state === "active" ? (
              <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
            ) : (
              <span className="size-3 shrink-0 rounded-full border border-muted-foreground/40" aria-hidden />
            )}
            {pillar.label.split(" ")[0]}
          </span>
        ))}
      </div>

      {checkDefs.length > 0 && (
        <ul className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-background/60 p-2">
          {checkDefs.map((def) => {
            const done = completedChecks.some((c) => c.id === def.id);
            const active = currentCheckId === def.id;
            const state = done ? "done" : active ? "active" : "pending";
            return (
              <li
                key={def.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
                  active && "bg-primary/10 text-foreground",
                  done && "text-muted-foreground",
                  state === "pending" && "text-muted-foreground/60",
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden />
                ) : active ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden />
                ) : (
                  <Minus className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
                )}
                <span className="truncate">{def.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RecheckLink({ onRecheck, className }) {
  return (
    <button
      type="button"
      onClick={onRecheck}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      <RefreshCw size={10} aria-hidden />
      Run check again
    </button>
  );
}

function DependencyItemRow({ item, source, kind, onNavigate, onResolved }) {
  const meta = STATUS_META[item.status];
  const Icon = meta?.icon ?? CircleAlert;
  const needsAction = item.status === DEP_STATUS.MISSING || item.status === DEP_STATUS.ERROR;

  return (
    <li className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", meta?.iconClass)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium leading-snug text-foreground">{item.label}</span>
          <Badge variant="outline" className={cn("text-[10px] font-semibold", meta?.badgeClass)}>
            {meta?.badge}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{item.message}</p>
        {needsAction && item.resolveHint && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {item.resolveTarget && onNavigate ? (
              <button
                type="button"
                onClick={() => {
                  markDependencyResolved(item.id, source, kind);
                  onResolved?.();
                  onNavigate(item.resolveTarget);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Wrench size={10} aria-hidden />
                {item.resolveHint}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  markDependencyResolved(item.id, source, kind);
                  onResolved?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Wrench size={10} aria-hidden />
                Mark configured
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

const ACTIONABLE_STATUSES = new Set([
  DEP_STATUS.MISSING,
  DEP_STATUS.WARNING,
  DEP_STATUS.ERROR,
]);

/** Pillars containing only missing, review, or blocked checks. */
function groupActionableOnly(grouped) {
  return grouped
    .map((pillar) => ({
      ...pillar,
      items: pillar.items.filter((i) => ACTIONABLE_STATUSES.has(i.status)),
    }))
    .filter((pillar) => pillar.items.length > 0);
}

function ActionableIssuesList({ grouped, source, kind, onNavigate, onRecheck }) {
  const pillars = groupActionableOnly(grouped);
  if (pillars.length === 0) return null;

  return (
    <div className="divide-y divide-border/60 border-t border-border/50">
      {pillars.map((pillar) => (
        <section key={pillar.id} className="px-5 py-3">
          <p className="mb-2 text-xs font-semibold text-foreground">{pillar.label}</p>
          <ul className="space-y-0">
            {pillar.items.map((item) => (
              <DependencyItemRow
                key={item.id}
                item={item}
                source={source}
                kind={kind}
                onNavigate={onNavigate}
                onResolved={onRecheck}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CardFooter({ onRecheck, onAutoResolve, showAutoResolve, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 px-5 py-2.5">
      {children}
      {showAutoResolve && onAutoResolve && (
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onAutoResolve}>
          <Wrench className="size-3" aria-hidden />
          Apply suggested fixes
        </Button>
      )}
      <RecheckLink onRecheck={onRecheck} className={cn(!children && !showAutoResolve && "ml-auto")} />
    </div>
  );
}

/**
 * Structured pillar checklist for fork readiness (model, knowledge, tools, vault, access).
 * Shows a compact success/review message when all clear; full checklist only when needed.
 */
export default function ForkReadinessChecklist({
  phase,
  report,
  source,
  kind,
  checkProgress = { current: 0, total: 0 },
  checkDefs = [],
  completedChecks = [],
  currentCheckId = null,
  onNavigate,
  onRecheck,
  onAutoResolve,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isChecking = phase === "idle" || phase === "checking";

  useEffect(() => {
    if (isChecking) setDetailsOpen(false);
  }, [isChecking, source?.id, kind]);

  if (isChecking) {
    return (
      <div className="rounded-xl border border-primary/20 bg-muted/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold text-foreground">Setup readiness</p>
          <span className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            In progress
          </span>
        </div>
        <ValidationProgressPanel
          checkProgress={checkProgress}
          checkDefs={checkDefs}
          completedChecks={completedChecks}
          currentCheckId={currentCheckId}
        />
      </div>
    );
  }

  if (!report) return null;

  const summary = report.summary ?? getForkReadinessSummary(report);
  const { grouped, counts, results, blocking } = report;
  const permError = blocking.some((i) => i.status === DEP_STATUS.ERROR);
  const missingCount = counts.missing ?? 0;
  const warningCount = counts.warning ?? 0;
  const warningItems = results.filter((r) => r.status === DEP_STATUS.WARNING);

  const headerTone =
    summary.state === "ready"
      ? "border-success/30 bg-success/6"
      : summary.state === "blocked"
        ? "border-destructive/35 bg-destructive/6"
        : summary.state === "review"
          ? "border-warning/30 bg-warning/6"
          : "border-border bg-muted/20";

  /* ── All good: one short message, no expand ── */
  if (summary.state === "ready" && !permError) {
    return (
      <div className={cn("rounded-xl border overflow-hidden", headerTone)}>
        <div className="flex items-center gap-3 px-5 py-4">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Ready to fork</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Workspace checks passed — model, knowledge, tools, and vault.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Warnings only: short list, optional detail expand ── */
  if (summary.state === "review" && !permError && missingCount === 0) {
    return (
      <div className={cn("rounded-xl border overflow-hidden", headerTone)}>
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              {warningCount} item{warningCount !== 1 ? "s" : ""} to review — you can still fork
            </p>
          </div>
          {!detailsOpen && (
            <ul className="space-y-1 pl-6">
              {warningItems.map((item) => (
                <li key={item.id} className="text-xs text-muted-foreground truncate">
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        {detailsOpen && (
          <ActionableIssuesList
            grouped={grouped}
            source={source}
            kind={kind}
            onNavigate={onNavigate}
            onRecheck={onRecheck}
          />
        )}
        <CardFooter onRecheck={onRecheck}>
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {detailsOpen ? "Hide details" : "Show details"}
          </button>
        </CardFooter>
      </div>
    );
  }

  /* ── Missing / blocked: minimal intro + issues only ── */
  return (
    <div className={cn("rounded-xl border overflow-hidden", headerTone)}>
      <div className="px-5 py-4">
        {permError ? (
          <p className="text-sm text-destructive">
            You don&apos;t have permission to fork. Contact your administrator.
          </p>
        ) : (
          <p className="text-sm text-foreground">
            {missingCount} item{missingCount !== 1 ? "s" : ""} need setup — fix below or fork and finish later.
          </p>
        )}
      </div>
      <ActionableIssuesList
        grouped={grouped}
        source={source}
        kind={kind}
        onNavigate={onNavigate}
        onRecheck={onRecheck}
      />
      <CardFooter onRecheck={onRecheck} onAutoResolve={onAutoResolve} showAutoResolve={missingCount > 0} />
    </div>
  );
}
