import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, MoreVertical, Workflow, Play, Pencil, Trash2,
  Search, X, Zap,
  Clock,
  ChevronDown, ListOrdered,
  LayoutTemplate, PenLine, GitFork, Upload, Loader2,
  FileJson2, AlertCircle, CheckCircle2, Info,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ForkFlowDialog } from "@/components/ui/ForkFlowDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFlowCatalog } from "@/context/FlowCatalogContext";
import { parseAndValidateFlowImport } from "@/lib/flowImport";
import { PAGE_PATH, pathToActivePage } from "@/navigation/pagePaths";
import { Toast, useToast } from "@/components/ui/Toast";

/** Re-export for legacy imports */
export { INITIAL_FLOWS } from "@/data/initialFlows";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  idle: {
    label: "Idle",
    dotClass: "bg-muted-foreground",
    rowBorder: "border-l-muted-foreground",
    iconTile: "border-border bg-muted text-muted-foreground",
    topAccent: "from-muted-foreground to-muted-foreground/50",
  },
  inprogress: {
    label: "In Progress",
    dotClass: "bg-primary",
    rowBorder: "border-l-primary",
    iconTile: "border-primary/25 bg-primary/10 text-primary",
    topAccent: "from-primary to-primary/70",
  },
  completed: {
    label: "Completed",
    dotClass: "bg-success",
    rowBorder: "border-l-success",
    iconTile: "border-success/25 bg-success/10 text-success",
    topAccent: "from-success to-success/70",
  },
  error: {
    label: "Error",
    dotClass: "bg-destructive",
    rowBorder: "border-l-destructive",
    iconTile: "border-destructive/25 bg-destructive/10 text-destructive",
    topAccent: "from-destructive to-destructive/70",
  },
  draft: {
    label: "Draft",
    dotClass: "bg-muted-foreground",
    rowBorder: "border-l-muted-foreground",
    iconTile: "border-border bg-muted text-muted-foreground",
    topAccent: "from-muted-foreground to-muted-foreground/50",
  },
};

/** Public / private access pill */
function FlowVisibilityBadge({ visibility }) {
  const isPublic = visibility === "public";
  const outline = isPublic
    ? "border-primary/35 bg-primary/10 text-primary dark:bg-primary/15"
    : "border-border bg-muted/80 text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("h-6 gap-1 rounded-full px-2 py-0 text-xs font-semibold", outline)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", isPublic ? "bg-primary" : "bg-muted-foreground")} />
      {isPublic ? "Public" : "Private"}
    </Badge>
  );
}

function FlowAccessBadge({ flow }) {
  if (flow.status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="destructive" className="h-6 gap-1 rounded-full px-2 py-0 text-xs font-semibold">
          <span className="size-1.5 shrink-0 rounded-full bg-destructive-foreground/80" />
          Error
        </Badge>
        <FlowVisibilityBadge visibility={flow.visibility} />
      </div>
    );
  }
  return <FlowVisibilityBadge visibility={flow.visibility} />;
}

// ─── Flow card (grid view) ─────────────────────────────────────────────────────

function FlowCard({ flow, openMenu, setOpenMenu, onViewFlow, onEditFlow, onRunFlow, onForkFlow, onDeleteFlow }) {
  const stepCount = flow.steps?.length ?? 0;
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMenuOpen = openMenu === flow.id;

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.right - 160 });
    }
    setOpenMenu(isMenuOpen ? null : flow.id);
  };

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${flow.name}"?`}
          message="This flow and all its run history will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={() => {
            onDeleteFlow?.(flow.id);
            setConfirmDelete(false);
            setOpenMenu(null);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open flow ${flow.name}`}
        className={cn(
          "group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-shadow duration-200 hover:shadow-md",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        onClick={() => onViewFlow?.(flow)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onViewFlow?.(flow);
          }
        }}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100",
            flow.status === "error" ? "from-destructive to-destructive/70" : "from-border to-border/50",
          )}
          aria-hidden
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">{flow.name}</p>
            <Button
              ref={btnRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleMenuToggle}
              aria-label="Flow options"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              className="size-7 shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[10px] font-medium">
              {flow.version}
            </Badge>
            <FlowAccessBadge flow={flow} />
          </div>
        </div>

        {flow.description?.trim() ? (
          <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">{flow.description}</p>
        ) : (
          <p className="line-clamp-2 text-xs leading-4 text-muted-foreground/70 italic">No description — add one in Flow Settings (⋯).</p>
        )}

        <Separator />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3 shrink-0" aria-hidden />
            <span>{flow.lastRun}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="size-3 shrink-0" aria-hidden />
            <span>{flow.runs.toLocaleString()} runs</span>
          </div>
          <div className="flex items-center gap-1">
            <ListOrdered className="size-3 shrink-0" aria-hidden />
            <span className="tabular-nums">
              {stepCount} {stepCount === 1 ? "step" : "steps"}
            </span>
          </div>
        </div>

        {isMenuOpen && (
          <div
            className="fixed z-[9999] w-40 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onRunFlow?.(flow);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Play className="size-3.5 text-muted-foreground" /> Run now
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onEditFlow?.(flow);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Pencil className="size-3.5 text-muted-foreground" /> Edit flow
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onForkFlow?.(flow);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <GitFork className="size-3.5 text-muted-foreground" /> Fork
            </button>
            <Separator />
            <button
              type="button"
              onClick={() => { setOpenMenu(null); setConfirmDelete(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Animated count ────────────────────────────────────────────────────────────

function AnimCount({ to, className = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / 700, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * to));
      if (t < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className={className}>{val}</span>;
}

// ─── Create flow (list entry) — explicit pathway before opening the editor ─────

function CreateFlowDropdown({ onCreateFlow, onImportFlow, variant = "toolbar", buttonLabel = "Create Flow" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const choose = (mode) => {
    setOpen(false);
    onCreateFlow?.(mode);
  };

  return (
    <div className={cn("relative", variant === "toolbar" ? "flex-shrink-0" : "w-full max-w-sm")} ref={ref}>
      <Button
        type="button"
        size="lg"
        className={cn("gap-1.5", variant === "prominent" && "w-full")}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className="size-4" />
        {buttonLabel}
        <ChevronDown className="size-4 opacity-70" aria-hidden />
      </Button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1.5 min-w-[260px] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg",
            variant === "toolbar" ? "right-0" : "left-0 right-0",
          )}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => choose("scratch")}
          >
            <span className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
              <PenLine className="size-4 text-muted-foreground" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium text-foreground">Start from scratch</span>
              <span className="text-xs leading-snug text-muted-foreground">Empty canvas — add nodes one at a time.</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => choose("template")}
          >
            <span className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
              <LayoutTemplate className="size-4 text-muted-foreground" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium text-foreground">Choose from template</span>
              <span className="text-xs leading-snug text-muted-foreground">Starter layouts you can customize.</span>
            </span>
          </button>
          <Separator className="my-1" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => { setOpen(false); onImportFlow?.(); }}
          >
            <span className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
              <Upload className="size-4 text-muted-foreground" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium text-foreground">Import from file</span>
              <span className="text-xs leading-snug text-muted-foreground">Upload a JSON flow config.</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── List loading skeleton (reference-style grid) ───────────────────────────────

function FlowsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[11rem] flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 max-w-[14rem] w-[85%]" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[92%]" />
          <Separator />
          <div className="flex justify-between gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Import preview dialog ─────────────────────────────────────────────────────

function ImportPreviewDialog({ open, onOpenChange, preview, onConfirm, importing, error, onDismissError }) {
  const showError = !preview && !!error;
  const { flows, warnings, fileName } = preview ?? {};
  const multi = (flows?.length ?? 0) > 1;

  // ── Error dialog ──────────────────────────────────────────────────────────
  if (showError) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onDismissError?.(); }}>
        <DialogContent showCloseButton={false} className="max-w-md gap-0 p-0 overflow-hidden">
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10">
              <AlertCircle className="size-4 text-destructive" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Import failed</p>
              <p className="mt-0.5 text-xs text-muted-foreground">The file could not be imported.</p>
            </div>
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss"
              className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            <Button type="button" size="sm" onClick={onDismissError}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Preview dialog ────────────────────────────────────────────────────────
  if (!preview) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importing) { onOpenChange(v); } }}>
      <DialogContent showCloseButton={false} className="max-w-lg gap-0 p-0 overflow-hidden">
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
            <FileJson2 className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {multi ? `Import ${flows.length} flows` : `Import "${flows[0]?.name}"`}
            </p>
            <p className="truncate text-xs text-muted-foreground">{fileName}</p>
          </div>
          {!importing && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Cancel import"
              className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto px-5 py-3">
          <div className="flex flex-col gap-2">
            {flows.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Workflow className="size-3.5 text-muted-foreground" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.steps.length} step{f.steps.length !== 1 ? "s" : ""} · {f.visibility}
                    {f.versionHistory?.length > 0 && ` · ${f.versionHistory.length} version${f.versionHistory.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{f.version}</span>
              </div>
            ))}
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="mx-5 mb-1 flex flex-col gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Info className="size-3.5 shrink-0" aria-hidden /> Notes
            </p>
            <ul className="ml-5 list-disc space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-700 dark:text-amber-300">{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={onConfirm} disabled={importing} className="gap-1.5">
            {importing ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden />
            )}
            {importing ? "Importing…" : multi ? `Import ${flows.length} flows` : "Import flow"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FlowsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { flows, removeFlow, createDraftFlow, forkFlow, importFlow } = useFlowCatalog();
  const { toasts, showToast, dismissToast } = useToast();
  const fileImportRef = useRef(null);
  const pageRef = useRef(null);

  const onNavigate = useCallback(
    (page) => {
      navigate(PAGE_PATH[page] ?? "/new-chat");
    },
    [navigate],
  );

  const activePage = pathToActivePage(location.pathname);

  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  /** `null` = all; `public`/`private` = `visibility`; `error` = operational error status */
  const [statFilter, setStatFilter] = useState(null);
  const [listLoading, setListLoading] = useState(true);

  // ── Import state
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importPreview, setImportPreview] = useState(null); // { flows, warnings, fileName }
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Drag-and-drop
  const [dragOver, setDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setListLoading(false), 420);
    return () => clearTimeout(t);
  }, []);

  const total = flows.length;
  const publicN = flows.filter((f) => f.visibility === "public").length;
  const privateN = flows.filter((f) => f.visibility === "private").length;
  const errorN = flows.filter((f) => f.status === "error").length;

  const statChipClass = (key) =>
    cn(
      "inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left transition-colors",
      "hover:bg-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      statFilter === key && "bg-muted font-medium text-foreground shadow-sm",
    );

  const toggleStatFilter = (key) => {
    setStatFilter((prev) => (prev === key ? null : key));
  };

  const matchesStatFilter = (f) => {
    if (!statFilter) return true;
    if (statFilter === "error") return f.status === "error";
    if (statFilter === "public") return f.visibility === "public";
    if (statFilter === "private") return f.visibility === "private";
    return true;
  };

  const filtered = flows
    .filter(matchesStatFilter)
    .filter((f) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      const hay = `${f.name} ${f.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const openFlowView = (flow) => {
    navigate(`/flows/${flow.id}`, { state: { flowOpenIntent: "execute" } });
  };

  const openFlowEdit = (flow) => {
    navigate(`/flows/${flow.id}`, { state: { flowOpenIntent: "edit" } });
  };

  const openFlowRunNow = (flow) => {
    navigate(`/flows/${flow.id}`, { state: { flowOpenIntent: "execute", autoRun: true } });
  };

  const [forkSource, setForkSource] = useState(null);

  const handleOpenFork = (flow) => {
    setForkSource(flow);
  };

  const handleConfirmFork = ({ name, description, visibility }) => {
    if (!forkSource) return;
    const forked = forkFlow(forkSource.id, { name, description, visibility });
    setForkSource(null);
    if (forked) navigate(`/flows/${forked.id}`, { state: { flowOpenIntent: "edit" } });
  };

  const handleCreateFlow = (entry) => {
    const f = createDraftFlow(entry);
    navigate(`/flows/${f.id}`, { state: { flowOpenIntent: "edit" } });
  };

  const handleDeleteFlow = (flowId) => {
    removeFlow(flowId);
  };

  /** Read a File → parse → open preview dialog (or show inline error). */
  const processFile = async (file) => {
    setImportError(null);
    if (!file) return;
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setImportError('Only .json files are supported.');
      return;
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImportError('File too large — use a JSON file under 2 MB.');
      return;
    }
    setImportBusy(true);
    try {
      const text = await file.text();
      const { flows: parsedFlows, warnings } = parseAndValidateFlowImport(text);
      setImportPreview({ flows: parsedFlows, warnings, fileName: file.name });
      setPreviewOpen(true);
    } catch (err) {
      setImportError(typeof err?.message === 'string' ? err.message : 'Import failed — check the file format.');
    } finally {
      setImportBusy(false);
    }
  };

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    await processFile(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;
    setImportBusy(true);
    try {
      const created = importFlow(importPreview.flows);
      setPreviewOpen(false);
      setImportPreview(null);
      if (created.length === 1) {
        showToast('Imported “' + created[0].name + '” — opening editor.');
        navigate('/flows/' + created[0].id, { state: { flowOpenIntent: 'edit' } });
      } else {
        showToast('Imported ' + created.length + ' flows successfully.');
      }
    } finally {
      setImportBusy(false);
    }
  };

  // ── Drag-and-drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) setDragOver(true);
  };
  const handleDragLeave = () => {
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setDragOver(false); }
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const catalogEmpty = !listLoading && flows.length === 0;
  const filteredEmpty = !listLoading && flows.length > 0 && filtered.length === 0;


  return (
    <>
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}
      <ForkFlowDialog
        open={!!forkSource}
        onOpenChange={(v) => { if (!v) setForkSource(null); }}
        sourceFlow={forkSource}
        onConfirm={handleConfirmFork}
      />
      <ImportPreviewDialog
        open={previewOpen || !!importError}
        onOpenChange={(v) => {
          if (!importBusy) { setPreviewOpen(v); if (!v) setImportPreview(null); }
        }}
        preview={importPreview}
        onConfirm={handleConfirmImport}
        importing={importBusy}
        error={importError}
        onDismissError={() => setImportError(null)}
      />

      <div
        ref={pageRef}
        className={cn("flex min-h-0 w-full flex-1 overflow-hidden bg-background transition-colors", dragOver && "ring-2 ring-inset ring-primary/60")}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
            <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/10">
              <Upload className="size-9 text-primary" aria-hidden />
            </div>
            <p className="text-base font-semibold text-foreground">Drop your JSON file here</p>
            <p className="text-sm text-muted-foreground">Release to import a flow</p>
          </div>
        )}

        <Sidebar activePage={activePage} onNavigate={onNavigate} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onNavigate={onNavigate} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-2xl font-semibold leading-8 tracking-tight text-foreground">Flows</h1>
                  <p className="text-sm leading-5 text-muted-foreground">
                    Design and automate multi-step AI workflows.
                  </p>
                </div>

                <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                  <div className="relative w-[220px]">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search flows…"
                      aria-label="Search flows"
                      className="h-9 pl-8 pr-8"
                    />
                    {searchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                        className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <input
                    ref={fileImportRef}
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    aria-hidden
                    tabIndex={-1}
                    onChange={handleImportJson}
                  />

                  {!catalogEmpty && (
                    <CreateFlowDropdown
                      onCreateFlow={handleCreateFlow}
                      onImportFlow={() => { setImportError(null); fileImportRef.current?.click(); }}
                      variant="toolbar"
                    />
                  )}
                </div>
              </div>

              {!catalogEmpty && (
                <div
                  className="flex flex-wrap items-center gap-3 text-sm"
                  role="toolbar"
                  aria-label="Filter flows by visibility and error state"
                >
                  <button
                    type="button"
                    className={statChipClass(null)}
                    onClick={() => setStatFilter(null)}
                    aria-pressed={statFilter === null}
                    title="Show all flows"
                  >
                    <span className="text-muted-foreground">
                      <AnimCount to={total} className="font-semibold text-foreground" /> flows
                    </span>
                  </button>
                  <span className="text-border select-none" aria-hidden>
                    ·
                  </span>
                  <button
                    type="button"
                    className={cn(statChipClass("public"), "items-center")}
                    onClick={() => toggleStatFilter("public")}
                    aria-pressed={statFilter === "public"}
                    title="Show public flows"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                    <AnimCount to={publicN} className="font-semibold text-primary" />
                    <span className="text-muted-foreground">public</span>
                  </button>
                  <span className="text-border select-none" aria-hidden>
                    ·
                  </span>
                  <button
                    type="button"
                    className={cn(statChipClass("private"), "items-center")}
                    onClick={() => toggleStatFilter("private")}
                    aria-pressed={statFilter === "private"}
                    title="Show private flows"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-muted-foreground" />
                    <AnimCount to={privateN} className="font-semibold text-muted-foreground" />
                    <span className="text-muted-foreground">private</span>
                  </button>
                  <span className="text-border select-none" aria-hidden>
                    ·
                  </span>
                  <button
                    type="button"
                    className={cn(statChipClass("error"), "items-center")}
                    onClick={() => toggleStatFilter("error")}
                    aria-pressed={statFilter === "error"}
                    title="Show flows with errors"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-destructive" />
                    <AnimCount to={errorN} className="font-semibold text-destructive" />
                    <span className="text-muted-foreground">error</span>
                  </button>
                </div>
              )}

              {listLoading && <FlowsSkeleton />}

              {catalogEmpty && (
                <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-24 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                    <Workflow className="size-8 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="flex max-w-md flex-col gap-1">
                    <p className="text-base font-semibold text-foreground">No flows yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create a workflow to automate steps, connect tools, and run on demand or on a schedule.
                    </p>
                  </div>
                  <CreateFlowDropdown
                    onCreateFlow={handleCreateFlow}
                    onImportFlow={() => { setImportError(null); fileImportRef.current?.click(); }}
                    variant="prominent"
                    buttonLabel="Create your first flow"
                  />
                </div>
              )}

              {!listLoading && !catalogEmpty && filteredEmpty && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="text-sm font-medium text-foreground">No flows match your filters</p>
                  <p className="text-xs text-muted-foreground">Try a different search term or clear the segment filter.</p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => { setSearchQuery(""); setStatFilter(null); }}
                  >
                    Clear search and filter
                  </Button>
                </div>
              )}

              {!listLoading && !catalogEmpty && filtered.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((flow) => (
                    <FlowCard
                      key={flow.id}
                      flow={flow}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                      onViewFlow={openFlowView}
                      onEditFlow={openFlowEdit}
                      onRunFlow={openFlowRunNow}
                      onForkFlow={handleOpenFork}
                      onDeleteFlow={handleDeleteFlow}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
      ))}
    </>
  );
}