import { useState, useRef, useEffect } from "react";
import {
  Plus, MoreVertical, Workflow, Play, Pencil, Copy, Trash2,
  LayoutGrid, List, Search, SlidersHorizontal, X, Zap,
  ArrowRight, Clock, CheckCircle2, AlertCircle, PauseCircle,
  GitBranch, Database, Bot, Mail, Webhook, FileText, Globe,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ─── Flow data ────────────────────────────────────────────────────────────────

const STEP_ICONS = { Bot, Database, Mail, Webhook, FileText, Globe, Zap, GitBranch };

const flows = [
  {
    id: 0,
    name: "Lead Qualification Pipeline",
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
  active:  { label: "Active",  dot: "#22c55e", bg: "#dcfce7", text: "#15803d", border: "#bbf7d0", Icon: CheckCircle2 },
  paused:  { label: "Paused",  dot: "#f59e0b", bg: "#fef9c3", text: "#a16207", border: "#fde68a", Icon: PauseCircle },
  error:   { label: "Error",   dot: "#ef4444", bg: "#fef2f2", text: "#dc2626", border: "#fecaca", Icon: AlertCircle },
  draft:   { label: "Draft",   dot: "#94a3b8", bg: "#f1f5f9", text: "#475569", border: "#e2e8f0", Icon: FileText },
};

const STATUS_FILTERS = ["All", "Active", "Paused", "Error", "Draft"];

// ─── Mini pipeline ─────────────────────────────────────────────────────────────

function MiniPipeline({ steps, compact = false }) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {steps.map((step, i) => {
        const Icon = STEP_ICONS[step.icon] ?? Zap;
        return (
          <div key={i} className="flex items-center gap-0.5">
            <div
              className={`flex items-center gap-1 rounded-[5px] border ${compact ? "px-1.5 py-0.5" : "px-2 py-1"}`}
              style={{ borderColor: `${step.color}30`, background: `${step.color}10` }}
            >
              <Icon size={compact ? 10 : 11} style={{ color: step.color }} />
              {!compact && <span className="text-xs font-medium leading-none whitespace-nowrap" style={{ color: step.color }}>{step.label}</span>}
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={compact ? 8 : 10} className="text-[#cbd5e1] dark:text-[#475569] flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Success bar ───────────────────────────────────────────────────────────────

function SuccessBar({ pct }) {
  if (pct === null) return <span className="text-xs text-[#94a3b8] dark:text-[#64748b]">—</span>;
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[#f1f5f9] dark:bg-[#1e293b] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ─── Flow card (grid view) ─────────────────────────────────────────────────────

function FlowCard({ flow, openMenu, setOpenMenu, onViewFlow }) {
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
      <div className="group bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] p-4 flex flex-col gap-3 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden" onClick={() => onViewFlow && onViewFlow(flow)}>
        {/* Status accent top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.dot}66)` }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="size-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
            style={{ background: `${cfg.dot}18`, border: `1px solid ${cfg.dot}30` }}>
            <Workflow size={17} style={{ color: cfg.dot }} />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
              style={{ color: cfg.text, background: cfg.bg, borderColor: cfg.border }}
            >
              <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
            <button
              ref={btnRef}
              onClick={handleMenuToggle}
              aria-label="Flow options"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              className="flex items-center justify-center size-7 rounded-[6px] text-[#94a3b8] dark:text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] opacity-0 group-hover:opacity-100 transition-colors"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Name + description */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-5 line-clamp-1">{flow.name}</p>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8] leading-4 line-clamp-2">{flow.description}</p>
        </div>

        {/* Pipeline steps */}
        <MiniPipeline steps={flow.steps} />

        <div className="h-px bg-[#f1f5f9] dark:bg-[#334155]" />

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#94a3b8]">
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>{flow.lastRun}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={11} />
            <span>{flow.runs.toLocaleString()} runs</span>
          </div>
          {flow.success !== null && (
            <span className="font-medium" style={{ color: flow.success >= 90 ? "#16a34a" : flow.success >= 70 ? "#d97706" : "#dc2626" }}>
              {flow.success}%
            </span>
          )}
        </div>

        {/* Context menu */}
        {isMenuOpen && (
          <div
            className="fixed z-[9999] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden w-[160px]"
            style={{ top: menuPos.top, left: menuPos.left, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setOpenMenu(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]">
              <Play size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Run now
            </button>
            <button onClick={() => { setOpenMenu(null); onViewFlow(flow); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]">
              <Pencil size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Edit flow
            </button>
            <button onClick={() => setOpenMenu(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]">
              <Copy size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Duplicate
            </button>
            <div className="h-px bg-[#e2e8f0] dark:bg-[#334155]" />
            <button onClick={() => { setOpenMenu(null); setConfirmDelete(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-[#7f1d1d]">
              <Trash2 size={13} className="text-[#ef4444]" /> Delete
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
        className={`group border-b border-[#f1f5f9] dark:border-[#1e293b] transition-all duration-150 cursor-pointer ${zebra ? "bg-[#fafafa] dark:bg-[#0f172a]" : "bg-white dark:bg-[#1e293b]"}`}
        style={hovered ? { backgroundColor: "#f0f7ff", boxShadow: `inset 3px 0 0 ${cfg.dot}` } : {}}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onViewFlow && onViewFlow(flow)}
      >
        {/* Icon */}
        <td className="px-4 py-3 w-[52px]">
          <div className="size-8 rounded-[6px] flex items-center justify-center flex-shrink-0"
            style={{ background: `${cfg.dot}15`, border: `1px solid ${cfg.dot}25` }}>
            <Workflow size={14} style={{ color: cfg.dot }} />
          </div>
        </td>

        {/* Name */}
        <td className="px-3 py-3 min-w-[200px]">
          <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9] truncate max-w-[260px]">{flow.name}</p>
          <p className="text-xs text-[#94a3b8] dark:text-[#64748b]">{flow.createdAt}</p>
        </td>

        {/* Steps */}
        <td className="px-3 py-3 w-[240px]">
          <MiniPipeline steps={flow.steps} compact />
        </td>

        {/* Status */}
        <td className="px-3 py-3 w-[110px]">
          <span
            className="inline-flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full border"
            style={{ color: cfg.text, background: cfg.bg, borderColor: cfg.border }}
          >
            <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
            {cfg.label}
          </span>
        </td>

        {/* Last run */}
        <td className="px-3 py-3 w-[110px]">
          <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">{flow.lastRun}</span>
        </td>

        {/* Runs */}
        <td className="px-3 py-3 w-[90px]">
          <span className="text-xs text-[#475569] dark:text-[#94a3b8] tabular-nums">{flow.runs.toLocaleString()}</span>
        </td>

        {/* Success rate */}
        <td className="px-3 py-3 w-[140px]">
          <SuccessBar pct={flow.success} />
        </td>

        {/* Actions */}
        <td className="px-3 py-3 w-[52px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center">
            <button
              ref={rowBtnRef}
              onClick={handleMenuToggle}
              aria-label="Flow options"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              className="flex items-center justify-center size-7 rounded-[6px] text-[#94a3b8] dark:text-[#64748b] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] hover:text-[#475569] dark:hover:text-[#94a3b8] transition-colors opacity-30 group-hover:opacity-100"
            >
              <MoreVertical size={14} />
            </button>
            {isMenuOpen && (
              <div
                className="fixed z-[9999] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden w-[160px]"
                style={{ top: menuPos.top, left: menuPos.left, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => setOpenMenu(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]">
                  <Play size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Run now
                </button>
                <button onClick={() => { setOpenMenu(null); onViewFlow(flow); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]">
                  <Pencil size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Edit flow
                </button>
                <button onClick={() => setOpenMenu(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]">
                  <Copy size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Duplicate
                </button>
                <div className="h-px bg-[#e2e8f0] dark:bg-[#334155]" />
                <button onClick={() => { setOpenMenu(null); setConfirmDelete(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-[#7f1d1d]">
                  <Trash2 size={13} className="text-[#ef4444]" /> Delete
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
      className={`px-3 py-3 text-left select-none ${sortKey ? "cursor-pointer" : ""} ${className}`}
      onClick={() => sortKey && onSort(sortKey)}
    >
      <div className="flex items-center gap-1 group/col">
        <span className={`text-sm font-bold tracking-[0.06em] uppercase ${active ? "text-[#2563eb]" : "text-[#94a3b8] dark:text-[#64748b]"}`}>
          {label}
        </span>
        {sortKey && (
          <span className={`transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover/col:opacity-50"}`}>
            {active && sort.dir === "asc" ? <ChevronUp size={12} className="text-[#2563eb]" />
              : active && sort.dir === "desc" ? <ChevronDown size={12} className="text-[#2563eb]" />
              : <ChevronsUpDown size={12} className="text-[#94a3b8] dark:text-[#64748b]" />}
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FlowsPage({ onNavigate, onViewFlow, onCreateFlow, sidebarCollapsed, onToggleSidebar }) {
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

      <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-[#0f172a] overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} activePage="flows" onNavigate={onNavigate} />

        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader onToggleSidebar={onToggleSidebar} onNavigate={onNavigate} />

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-4 flex flex-col gap-4">

              {/* Page title + toolbar */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-8 tracking-[-0.6px]">Flows</h1>
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-5">Design and automate multi-step AI workflows.</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                  {/* Search */}
                  <div className="flex items-center gap-2 h-9 px-3 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[6px] w-[220px]">
                    <Search size={14} className="text-[#94a3b8] dark:text-[#64748b] flex-shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search flows…"
                      aria-label="Search flows"
                      className="flex-1 text-sm text-[#0f172a] dark:text-[#f1f5f9] placeholder:text-[#94a3b8] dark:placeholder:text-[#64748b] outline-none bg-transparent"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} aria-label="Clear search" className="text-[#94a3b8] dark:text-[#64748b] hover:text-[#475569] dark:hover:text-[#94a3b8]">
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filter */}
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setFilterOpen((v) => !v)}
                      aria-label="Filter flows"
                      aria-haspopup="true"
                      aria-expanded={filterOpen}
                      className={`flex items-center gap-1.5 h-9 px-3 rounded-[6px] border text-sm font-medium transition-colors ${
                        statusFilter !== "All"
                          ? "bg-[#eff6ff] dark:bg-[#1e3a8a] border-[#bfdbfe] dark:border-[#1d4ed8] text-[#2563eb] dark:text-[#60a5fa]"
                          : "bg-white dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:border-[#cbd5e1] dark:hover:border-[#475569]"
                      }`}
                    >
                      <SlidersHorizontal size={14} />
                      Filters
                      {statusFilter !== "All" && (
                        <span className="flex items-center justify-center size-4 rounded-full bg-[#2563eb] text-white text-xs font-bold">1</span>
                      )}
                    </button>

                    {filterOpen && (
                      <div className="absolute left-0 top-11 z-30 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] shadow-lg w-[200px] p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0f172a] dark:text-[#f1f5f9] uppercase tracking-[0.06em]">Status</span>
                          {statusFilter !== "All" && (
                            <button onClick={() => setStatusFilter("All")} className="text-xs text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] flex items-center gap-0.5">
                              <X size={10} /> Clear
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {STATUS_FILTERS.map((s) => {
                            const cfg = STATUS_CONFIG[s.toLowerCase()];
                            const isActive = statusFilter === s;
                            return (
                              <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  isActive ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-[#f8fafc] dark:bg-[#0f172a] text-[#64748b] dark:text-[#94a3b8] border-[#e2e8f0] dark:border-[#334155] hover:border-[#cbd5e1] dark:hover:border-[#475569]"
                                }`}
                              >
                                {cfg && !isActive && <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />}
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active filter chip */}
                  <AnimatePresence>
                    {statusFilter !== "All" && (
                      <motion.button
                        key="status-chip"
                        initial={{ opacity: 0, scale: 0.8, x: -6 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -6 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setStatusFilter("All")}
                        className="flex items-center gap-1 px-2 h-6 rounded-full text-sm font-semibold border border-[#bfdbfe] dark:border-[#1d4ed8] bg-[#eff6ff] dark:bg-[#1e3a8a] text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#dbeafe] dark:hover:bg-[#1e3a8a] transition-colors"
                      >
                        {statusFilter} <X size={10} />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* View toggle */}
                  <div className="flex items-center bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[6px] h-9 p-1 gap-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      aria-label="Switch to grid view"
                      aria-pressed={viewMode === "grid"}
                      className={`flex items-center justify-center size-7 rounded-[4px] transition-colors ${viewMode === "grid" ? "bg-[#f1f5f9] dark:bg-[#334155] text-[#0f172a] dark:text-[#f1f5f9]" : "text-[#94a3b8] dark:text-[#64748b] hover:text-[#64748b] dark:hover:text-[#94a3b8]"}`}
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      aria-label="Switch to list view"
                      aria-pressed={viewMode === "list"}
                      className={`flex items-center justify-center size-7 rounded-[4px] transition-colors ${viewMode === "list" ? "bg-[#f1f5f9] dark:bg-[#334155] text-[#0f172a] dark:text-[#f1f5f9]" : "text-[#94a3b8] dark:text-[#64748b] hover:text-[#64748b] dark:hover:text-[#94a3b8]"}`}
                    >
                      <List size={15} />
                    </button>
                  </div>

                  <button onClick={onCreateFlow} className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 h-9 rounded-[6px] transition-colors flex-shrink-0">
                    <Plus size={16} />
                    Create Flow
                  </button>
                </div>
              </div>

              {/* Summary bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  <AnimCount to={total} className="font-semibold text-[#0f172a] dark:text-[#f1f5f9]" /> flows
                </span>
                <span className="text-[#e2e8f0] dark:text-[#334155]">·</span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="size-2 rounded-full bg-[#22c55e]" />
                  <AnimCount to={active} className="font-semibold text-[#15803d] dark:text-[#4ade80]" />
                  <span className="text-[#64748b] dark:text-[#94a3b8]">active</span>
                </span>
                <span className="text-[#e2e8f0] dark:text-[#334155]">·</span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="size-2 rounded-full bg-[#94a3b8] dark:bg-[#64748b]" />
                  <AnimCount to={drafts} className="font-semibold text-[#475569] dark:text-[#94a3b8]" />
                  <span className="text-[#64748b] dark:text-[#94a3b8]">drafts</span>
                </span>
                {errors > 0 && (
                  <>
                    <span className="text-[#e2e8f0] dark:text-[#334155]">·</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="size-2 rounded-full bg-[#ef4444]" />
                      <AnimCount to={errors} className="font-semibold text-[#dc2626]" />
                      <span className="text-[#64748b] dark:text-[#94a3b8]">errors</span>
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
                  <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[8px] overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 border-b border-[#e2e8f0] dark:border-[#334155]" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(248,250,252,0.88)" }}>
                        <tr>
                          <th className="px-4 py-3 w-[52px]" />
                          <ColHeader label="Flow"        sortKey="name"    sort={sort} onSort={handleSort} className="min-w-[200px]" />
                          <ColHeader label="Steps"       sortKey={null}    sort={sort} onSort={handleSort} className="w-[240px]" />
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
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="size-14 bg-[#f1f5f9] dark:bg-[#1e293b] rounded-[12px] flex items-center justify-center">
                    <Workflow size={28} className="text-[#94a3b8] dark:text-[#64748b]" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">No flows found</p>
                    <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">Try adjusting your search or filters.</p>
                  </div>
                  <button
                    onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                    className="text-sm font-medium text-[#2563eb] dark:text-[#60a5fa] hover:underline"
                  >
                    Clear filters
                  </button>
                  <button onClick={onCreateFlow} className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 h-9 rounded-[6px] transition-colors">
                    <Plus size={16} /> Create your first flow
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

    </>
  );
}
