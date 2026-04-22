import { useState, useRef, useEffect } from "react";
import {
  Plus, MoreVertical, Workflow, Play, Pencil, Copy, Trash2,
  LayoutGrid, List, Search, SlidersHorizontal, X, Zap,
  Clock,
  FileText,
  ChevronUp, ChevronDown, ChevronsUpDown, ListOrdered,
  LayoutTemplate, PenLine,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Flow data ────────────────────────────────────────────────────────────────

const flows = [
  {
    id: 0,
    name: "Lead Qualification Pipeline",
    version: "v2.4",
    description: "Automatically scores and routes inbound leads using AI enrichment, CRM lookup, and email sequencing.",
    status: "active",
    steps: [
      { label: "Webhook", icon: "Webhook", color: "#6366f1" },
      { label: "Enrich", icon: "Database", color: "#3b82f6" },
      { label: "Score", icon: "Bot", color: "#8b5cf6" },
      { label: "Email", icon: "Mail", color: "#06b6d4" },
    ],
    lastRun: "3 min ago",
    runs: 1420,
    success: 97,
    createdAt: "12 Jan 2026",
  },
  {
    id: 1,
    name: "Resume Screening Flow",
    version: "v1.1",
    description: "Parses uploaded resumes, ranks candidates against a job description, and sends shortlist to HR.",
    status: "active",
    steps: [
      { label: "Upload", icon: "FileText", color: "#f59e0b" },
      { label: "Parse", icon: "Bot", color: "#6366f1" },
      { label: "Rank", icon: "Zap", color: "#8b5cf6" },
      { label: "Notify", icon: "Mail", color: "#22c55e" },
    ],
    lastRun: "22 min ago",
    runs: 845,
    success: 99,
    createdAt: "28 Jan 2026",
  },
  {
    id: 2,
    name: "Customer Feedback Digest",
    version: "v3.0",
    description: "Collects feedback from multiple channels, summarises sentiment, and posts a weekly digest to Slack.",
    status: "active",
    steps: [
      { label: "Collect", icon: "Globe", color: "#3b82f6" },
      { label: "Analyse", icon: "Bot", color: "#8b5cf6" },
      { label: "Summarise", icon: "FileText", color: "#f97316" },
      { label: "Post", icon: "Webhook", color: "#06b6d4" },
    ],
    lastRun: "1h ago",
    runs: 312,
    success: 100,
    createdAt: "05 Feb 2026",
  },
  {
    id: 3,
    name: "Contract Review Automation",
    version: "v1.7",
    description: "Extracts key clauses from uploaded contracts, flags risks, and generates a plain-language summary.",
    status: "paused",
    steps: [
      { label: "Ingest", icon: "FileText", color: "#64748b" },
      { label: "Extract", icon: "Bot", color: "#6366f1" },
      { label: "Flag", icon: "Zap", color: "#ef4444" },
      { label: "Report", icon: "FileText", color: "#64748b" },
    ],
    lastRun: "2 days ago",
    runs: 203,
    success: 91,
    createdAt: "14 Feb 2026",
  },
  {
    id: 4,
    name: "Social Media Monitor",
    version: "v2.1",
    description: "Tracks brand mentions across platforms in real-time, classifies sentiment, and alerts on spikes.",
    status: "error",
    steps: [
      { label: "Listen", icon: "Globe", color: "#3b82f6" },
      { label: "Classify", icon: "Bot", color: "#8b5cf6" },
      { label: "Alert", icon: "Mail", color: "#ef4444" },
    ],
    lastRun: "45 min ago",
    runs: 6810,
    success: 73,
    createdAt: "20 Feb 2026",
  },
  {
    id: 5,
    name: "Onboarding Email Sequence",
    version: "v1.3",
    description: "Triggers personalised onboarding emails based on user actions and enriches profiles with product usage data.",
    status: "active",
    steps: [
      { label: "Trigger", icon: "Webhook", color: "#6366f1" },
      { label: "Enrich", icon: "Database", color: "#3b82f6" },
      { label: "Branch", icon: "GitBranch", color: "#f59e0b" },
      { label: "Send", icon: "Mail", color: "#22c55e" },
    ],
    lastRun: "8 min ago",
    runs: 2230,
    success: 98,
    createdAt: "01 Mar 2026",
  },
  {
    id: 6,
    name: "Invoice Processing Bot",
    version: "v0.9",
    description: "Reads incoming PDF invoices, validates line items against POs, and routes exceptions for approval.",
    status: "draft",
    steps: [
      { label: "Receive", icon: "Mail", color: "#64748b" },
      { label: "Parse", icon: "Bot", color: "#64748b" },
      { label: "Validate", icon: "Zap", color: "#64748b" },
    ],
    lastRun: "—",
    runs: 0,
    success: null,
    createdAt: "15 Mar 2026",
  },
  {
    id: 7,
    name: "Support Ticket Triage",
    version: "v2.0",
    description: "Classifies incoming tickets by priority, assigns to the correct team, and drafts an initial response.",
    status: "active",
    steps: [
      { label: "Receive", icon: "Webhook", color: "#6366f1" },
      { label: "Classify", icon: "Bot", color: "#8b5cf6" },
      { label: "Assign", icon: "GitBranch", color: "#f59e0b" },
      { label: "Draft", icon: "FileText", color: "#06b6d4" },
    ],
    lastRun: "Just now",
    runs: 4500,
    success: 96,
    createdAt: "18 Mar 2026",
  },
];

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label: "Active",
    dotClass: "bg-success",
    rowBorder: "border-l-success",
    iconTile: "border-success/25 bg-success/10 text-success",
    topAccent: "from-success to-success/70",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-warning",
    rowBorder: "border-l-warning",
    iconTile: "border-warning/25 bg-warning/10 text-warning",
    topAccent: "from-warning to-warning/70",
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

/** Status pill: semantic tokens + shadcn Badge */
function FlowStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  if (status === "error") {
    return (
      <Badge variant="destructive" className="h-6 gap-1 rounded-full px-2 py-0 text-xs font-semibold">
        <span className="size-1.5 shrink-0 rounded-full bg-destructive-foreground/80" />
        {cfg.label}
      </Badge>
    );
  }
  const outline =
    status === "active"
      ? "border-success/35 bg-success/10 text-success dark:bg-success/15"
      : status === "paused"
        ? "border-warning/35 bg-warning/10 text-warning-foreground dark:bg-warning/15"
        : "border-border bg-muted/80 text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("h-6 gap-1 rounded-full px-2 py-0 text-xs font-semibold", outline)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", cfg.dotClass)} />
      {cfg.label}
    </Badge>
  );
}

const STATUS_FILTERS = ["All", "Active", "Paused", "Error", "Draft"];

// ─── Success bar ───────────────────────────────────────────────────────────────

function SuccessBar({ pct }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">—</span>;
  const barClass = pct >= 90 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-destructive";
  const textClass = pct >= 90 ? "text-success" : pct >= 70 ? "text-warning" : "text-destructive";
  return (
    <div className="flex w-full items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("w-8 shrink-0 text-right text-xs font-medium tabular-nums", textClass)}>{pct}%</span>
    </div>
  );
}

// ─── Flow card (grid view) ─────────────────────────────────────────────────────

function FlowCard({ flow, openMenu, setOpenMenu, onViewFlow }) {
  const stepCount = flow.steps?.length ?? 0;
  const cfg = STATUS_CONFIG[flow.status] ?? STATUS_CONFIG.draft;
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
          onConfirm={() => setConfirmDelete(false)}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div
        className={cn(
          "group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-shadow duration-200 hover:shadow-md",
        )}
        onClick={() => onViewFlow && onViewFlow(flow)}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[3px] rounded-t-lg bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100",
            cfg.topAccent,
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
              className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[10px] font-medium">
              {flow.version}
            </Badge>
            <FlowStatusBadge status={flow.status} />
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">{flow.description}</p>

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
              onClick={() => setOpenMenu(null)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Play className="size-3.5 text-muted-foreground" /> Run now
            </button>
            <button
              type="button"
              onClick={() => { setOpenMenu(null); onViewFlow(flow); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Pencil className="size-3.5 text-muted-foreground" /> Edit flow
            </button>
            <button
              type="button"
              onClick={() => setOpenMenu(null)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Copy className="size-3.5 text-muted-foreground" /> Duplicate
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

// ─── Flow row (list view) ──────────────────────────────────────────────────────

function FlowRow({ flow, openMenu, setOpenMenu, zebra, onViewFlow }) {
  const cfg = STATUS_CONFIG[flow.status] ?? STATUS_CONFIG.draft;
  const rowBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMenuOpen = openMenu === flow.id;

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && rowBtnRef.current) {
      const r = rowBtnRef.current.getBoundingClientRect();
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
          onConfirm={() => setConfirmDelete(false)}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <tr
        className={cn(
          "group cursor-pointer border-b border-border border-l-2 border-l-transparent transition-colors duration-150",
          zebra ? "bg-muted/35" : "bg-card",
          hovered && "bg-accent/50",
          hovered && cfg.rowBorder,
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onViewFlow && onViewFlow(flow)}
      >
        <td className="w-[52px] px-4 py-3">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md border",
              cfg.iconTile,
            )}
          >
            <Workflow className="size-3.5" />
          </div>
        </td>

        <td className="min-w-[200px] px-3 py-3">
          <div className="flex items-center gap-1.5">
            <p className="max-w-[240px] truncate text-sm font-medium text-foreground">{flow.name}</p>
            <Badge variant="secondary" className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[10px] font-medium">
              {flow.version}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{flow.createdAt}</p>
        </td>

        <td className="w-[110px] px-3 py-3">
          <FlowStatusBadge status={flow.status} />
        </td>

        <td className="w-[110px] px-3 py-3">
          <span className="text-xs text-muted-foreground">{flow.lastRun}</span>
        </td>

        <td className="w-[90px] px-3 py-3">
          <span className="text-xs tabular-nums text-foreground/80">{flow.runs.toLocaleString()}</span>
        </td>

        {/* Success rate */}
        <td className="px-3 py-3 w-[140px]">
          <SuccessBar pct={flow.success} />
        </td>

        {/* Actions */}
        <td className="w-[52px] px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center">
            <Button
              ref={rowBtnRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleMenuToggle}
              aria-label="Flow options"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              className="opacity-40 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="size-3.5" />
            </Button>
            {isMenuOpen && (
              <div
                className="fixed z-[9999] w-40 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
                style={{ top: menuPos.top, left: menuPos.left }}
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={() => setOpenMenu(null)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground">
                  <Play className="size-3.5 text-muted-foreground" /> Run now
                </button>
                <button type="button" onClick={() => { setOpenMenu(null); onViewFlow(flow); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground">
                  <Pencil className="size-3.5 text-muted-foreground" /> Edit flow
                </button>
                <button type="button" onClick={() => setOpenMenu(null)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground">
                  <Copy className="size-3.5 text-muted-foreground" /> Duplicate
                </button>
                <Separator />
                <button type="button" onClick={() => { setOpenMenu(null); setConfirmDelete(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

// ─── Sortable col header ───────────────────────────────────────────────────────

function ColHeader({ label, sortKey, sort, onSort, className = "" }) {
  const active = sort.key === sortKey;
  return (
    <th
      className={cn("px-3 py-3 text-left select-none", sortKey && "cursor-pointer", className)}
      onClick={() => sortKey && onSort(sortKey)}
    >
      <div className="group/col flex items-center gap-1">
        <span
          className={cn(
            "text-sm font-bold uppercase tracking-[0.06em]",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {sortKey && (
          <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-0 group-hover/col:opacity-50")}>
            {active && sort.dir === "asc" ? <ChevronUp className="size-3 text-primary" />
              : active && sort.dir === "desc" ? <ChevronDown className="size-3 text-primary" />
              : <ChevronsUpDown className="size-3 text-muted-foreground" />}
          </span>
        )}
      </div>
    </th>
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

function CreateFlowDropdown({ onCreateFlow, variant = "toolbar", buttonLabel = "Create Flow" }) {
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
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FlowsPage({ onNavigate, onViewFlow, onCreateFlow

}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSort = (key) =>
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  // Stats
  const total   = flows.length;
  const active  = flows.filter((f) => f.status === "active").length;
  const drafts  = flows.filter((f) => f.status === "draft").length;
  const errors  = flows.filter((f) => f.status === "error").length;

  const filtered = flows
    .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((f) => statusFilter === "All" || f.status === statusFilter.toLowerCase())
    .sort((a, b) => {
      const val = (x) => {
        if (sort.key === "name")    return x.name.toLowerCase();
        if (sort.key === "status")  return x.status;
        if (sort.key === "lastRun") return x.lastRun;
        if (sort.key === "runs")    return x.runs;
        if (sort.key === "success") return x.success ?? -1;
        return x.name.toLowerCase();
      };
      const cmp = val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });

  return (
    <>
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}

      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
        <Sidebar activePage="flows" onNavigate={onNavigate} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onNavigate={onNavigate} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 px-6 py-4">

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-2xl font-semibold leading-8 tracking-tight text-foreground">Flows</h1>
                  <p className="text-sm leading-5 text-muted-foreground">Design and automate multi-step AI workflows.</p>
                </div>

                <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                  <div className="relative w-[220px]">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
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

                  <div className="relative" ref={filterRef}>
                    <Button
                      type="button"
                      variant={statusFilter !== "All" ? "secondary" : "outline"}
                      size="lg"
                      onClick={() => setFilterOpen((v) => !v)}
                      aria-label="Filter flows"
                      aria-haspopup="true"
                      aria-expanded={filterOpen}
                      className={cn(statusFilter !== "All" && "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15")}
                    >
                      <SlidersHorizontal className="size-3.5" />
                      Filters
                      {statusFilter !== "All" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          1
                        </span>
                      )}
                    </Button>

                    {filterOpen && (
                      <div className="absolute left-0 top-11 z-30 flex w-[200px] flex-col gap-2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-foreground">Status</span>
                          {statusFilter !== "All" && (
                            <Button type="button" variant="ghost" size="xs" onClick={() => setStatusFilter("All")} className="h-auto gap-0.5 px-1 py-0 text-xs text-muted-foreground">
                              <X className="size-2.5" /> Clear
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {STATUS_FILTERS.map((s) => {
                            const cfg = STATUS_CONFIG[s.toLowerCase()];
                            const isActive = statusFilter === s;
                            return (
                              <Button
                                key={s}
                                type="button"
                                variant={isActive ? "default" : "outline"}
                                size="xs"
                                onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                                className={cn(
                                  "gap-1.5 rounded-full",
                                  !isActive && "border-border bg-muted/50 text-muted-foreground hover:bg-muted",
                                )}
                              >
                                {cfg && !isActive && <span className={cn("size-1.5 shrink-0 rounded-full", cfg.dotClass)} />}
                                {s}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {statusFilter !== "All" && (
                      <motion.div
                        key="status-chip"
                        initial={{ opacity: 0, scale: 0.8, x: -6 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -6 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setStatusFilter("All")}
                          className="h-6 rounded-full border-primary/25 bg-primary/10 px-2 text-primary hover:bg-primary/15"
                        >
                          {statusFilter} <X className="size-2.5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex h-9 items-center gap-0.5 rounded-lg border border-border bg-card p-1">
                    <Button
                      type="button"
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => setViewMode("grid")}
                      aria-label="Switch to grid view"
                      aria-pressed={viewMode === "grid"}
                      className="size-7 rounded-md"
                    >
                      <LayoutGrid className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => setViewMode("list")}
                      aria-label="Switch to list view"
                      aria-pressed={viewMode === "list"}
                      className="size-7 rounded-md"
                    >
                      <List className="size-3.5" />
                    </Button>
                  </div>

                  <CreateFlowDropdown onCreateFlow={onCreateFlow} variant="toolbar" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  <AnimCount to={total} className="font-semibold text-foreground" /> flows
                </span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success" />
                  <AnimCount to={active} className="font-semibold text-success" />
                  <span className="text-muted-foreground">active</span>
                </span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-muted-foreground" />
                  <AnimCount to={drafts} className="font-semibold text-muted-foreground" />
                  <span className="text-muted-foreground">drafts</span>
                </span>
                {errors > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-destructive" />
                      <AnimCount to={errors} className="font-semibold text-destructive" />
                      <span className="text-muted-foreground">errors</span>
                    </span>
                  </>
                )}
              </div>

              {/* Content */}
              {filtered.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((flow) => (
                      <FlowCard key={flow.id} flow={flow} openMenu={openMenu} setOpenMenu={setOpenMenu} onViewFlow={onViewFlow} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur-sm supports-[backdrop-filter]:bg-card/75">
                        <tr>
                          <th className="px-4 py-3 w-[52px]" />
                          <ColHeader label="Flow"        sortKey="name"    sort={sort} onSort={handleSort} className="min-w-[200px]" />
                          <ColHeader label="Status"      sortKey="status"  sort={sort} onSort={handleSort} className="w-[110px]" />
                          <ColHeader label="Last Run"    sortKey="lastRun" sort={sort} onSort={handleSort} className="w-[110px]" />
                          <ColHeader label="Runs"        sortKey="runs"    sort={sort} onSort={handleSort} className="w-[90px]" />
                          <ColHeader label="Success Rate" sortKey="success" sort={sort} onSort={handleSort} className="w-[140px]" />
                          <th className="px-3 py-3 w-[52px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((flow, i) => (
                          <FlowRow
                            key={flow.id}
                            flow={flow}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            zebra={i % 2 !== 0}
                            onViewFlow={onViewFlow}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
                    <Workflow className="size-7 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-semibold text-foreground">No flows found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                  </div>
                  <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}>
                    Clear filters
                  </Button>
                  <CreateFlowDropdown onCreateFlow={onCreateFlow} variant="prominent" buttonLabel="Create your first flow" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

    </>
  );
}
