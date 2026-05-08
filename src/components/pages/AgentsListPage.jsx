import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Bot, Pencil, Copy, GitFork, Trash2, LayoutGrid, List, ChevronUp, ChevronDown, ChevronsUpDown, Eye, Cpu, X, Send, Maximize2, Minimize2, ThumbsUp, ThumbsDown, RotateCcw, Paperclip, Globe, Lock, Loader2, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import AppHeader from "@/components/layout/AppHeader";
import ProviderLogo from "@/components/common/ProviderLogo";
import Sidebar from "@/components/layout/Sidebar";
import ExpandableSearch from "@/components/common/ExpandableSearch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast, useToast } from "@/components/ui/Toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { INITIAL_AGENTS } from "@/data/agentsCatalog";

// ─── Utilities ────────────────────────────────────────────────────────────────

// Hash agent name → one of 8 gradient pairs for initials avatar
const GRADIENTS = [
  ["#6366f1","#8b5cf6"], ["#3b82f6","#06b6d4"], ["#10b981","#14b8a6"],
  ["#f59e0b","#f97316"], ["#ec4899","#f43f5e"], ["#8b5cf6","#ec4899"],
  ["#06b6d4","#3b82f6"], ["#f97316","#eab308"],
];
function nameToGradient(name) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[h % GRADIENTS.length];
}

/** Matches FlowsPage — animated total for stat chips */
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

const STATUS_CONFIG = {
  active:   { label: "Active",   dot: "#22c55e", bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  idle:     { label: "Idle",     dot: "#94a3b8", bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
  error:    { label: "Error",    dot: "#ef4444", bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  disabled: { label: "Disabled", dot: "#cbd5e1", bg: "#f8fafc", text: "#94a3b8", border: "#e2e8f0" },
};

function formatCatalogDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Fork flow — name/description then append a private copy to the catalog. */
function ForkAgentDialog({ agent, open, onOpenChange, onFork }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open && agent) {
      setName(`${agent.name} (Fork)`);
      setDescription((agent.description || "").trim());
    }
  }, [open, agent?.id]);

  const handleSubmit = () => {
    if (!agent || !name.trim()) return;
    onFork(agent, name.trim(), description);
    onOpenChange(false);
  };

  return (
    <Dialog open={open && !!agent} onOpenChange={onOpenChange}>
      {agent ? (
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Fork agent</DialogTitle>
          <DialogDescription>
            Create a private copy of{" "}
            <span className="font-medium text-foreground">"{agent.name}"</span>. You can rename it and adjust the description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-2">
          <div className="space-y-1.5">
            <label htmlFor="fork-agent-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="fork-agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My fork name"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="fork-agent-desc" className="text-sm font-medium text-foreground">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="fork-agent-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this fork do differently?"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/30 px-6 py-4 sm:justify-end dark:bg-muted/20">
          <Button type="button" variant="outline" className="min-h-10 sm:min-w-[100px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="min-h-10 gap-2 sm:min-w-[120px]" onClick={handleSubmit} disabled={!name.trim()}>
            <GitFork size={15} className="opacity-90" aria-hidden />
            Fork agent
          </Button>
        </DialogFooter>
      </DialogContent>
      ) : null}
    </Dialog>
  );
}

// ─── Provider logo / avatar ───────────────────────────────────────────────────

// ─── Agent avatar ─────────────────────────────────────────────────────────────

function AgentAvatar({ size = "lg", name = "" }) {
  const dim   = size === "sm" ? "size-8" : "size-12";
  const botPx = size === "sm" ? 16 : 22;
  const [g1, g2] = nameToGradient(name || "Agent");
  return (
    <div
      className={`${dim} rounded-[6px] flex items-center justify-center overflow-hidden flex-shrink-0 relative`}
      style={{ background: `linear-gradient(135deg, ${g1}18 0%, ${g2}28 100%)`, border: `1px solid ${g1}30` }}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(ellipse at 30% 20%, ${g1}22 0%, transparent 70%)` }}
      />
      <Bot
        size={botPx}
        className="relative z-10 text-[#475569] dark:text-[#94a3b8]"
        style={{ filter: `drop-shadow(0 0 4px ${g1}40)` }}
        aria-hidden
      />
    </div>
  );
}

// ─── Success bar ─────────────────────────────────────────────────────────────

function SuccessBar({ pct }) {
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[#f1f5f9] dark:bg-[#334155] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ─── Agent card (grid view) ───────────────────────────────────────────────────

function AgentCard({ agent, openMenu, setOpenMenu, onOpen, onView, onEdit, onFork, onRequestDelete, onRequestVisibilityChange, isSelected }) {
  const isMenuOpen = openMenu === agent.id;
  const statusCfg  = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const btnRef     = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const visibilityActionLabel = agent.visibility === "public" ? "Unpublish" : "Publish";
  const hasDescription = Boolean(agent.description?.trim());

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.right - 160 });
    }
    setOpenMenu(isMenuOpen ? null : agent.id);
  };

  return (
    <>
    <div
      className={`group h-full min-h-[164px] bg-white dark:bg-[#1e293b] border rounded-[8px] p-2 flex flex-col gap-2 hover:shadow-lg dark:hover:shadow-none transition-all duration-200 cursor-pointer relative overflow-hidden ${
        isSelected
          ? "border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-md"
          : "border-[#e2e8f0] dark:border-[#334155]"
      }`}
      style={{ "--accent": statusCfg.dot }}
      onClick={() => onOpen(agent)}
    >
      {/* Status top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-[8px]"
        style={{ background: `linear-gradient(90deg, ${statusCfg.dot}, ${statusCfg.dot}88)` }}
      />

      {/* Top: avatar + info */}
      <div className="flex gap-2 items-start">
        <div className="relative flex-shrink-0">
          <AgentAvatar name={agent.name} />
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: statusCfg.dot }}
            title={statusCfg.label}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {agent.accessEnabled && (
              <div className="bg-[#dc2626] border-2 border-[#f8fafc] dark:border-[#1e293b] rounded-full size-2 flex-shrink-0" />
            )}
            <p className="flex-1 text-base font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-6 truncate">
              {agent.name}
            </p>
            <button
              ref={btnRef}
              onClick={handleMenuToggle}
              aria-label="Agent options"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              className="flex items-center justify-center size-8 rounded-[6px] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {agent.visibility === "public" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
                <Globe size={9} /> Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                <Lock size={9} /> Private
              </span>
            )}
          </div>
          <p
            className={`text-xs leading-4 tracking-[0.12px] overflow-hidden ${hasDescription ? "text-[#64748b] dark:text-[#94a3b8]" : "text-[#94a3b8] dark:text-[#64748b] italic"}`}
            style={{ height: 35, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
          >
            {hasDescription ? agent.description : "No description added yet."}
          </p>
        </div>
      </div>

      <div className="mt-auto h-px bg-[#e2e8f0] dark:bg-[#334155] w-full flex-shrink-0" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[#64748b] dark:text-[#94a3b8] leading-4 whitespace-nowrap">{agent.date}</span>
        </div>
        <div className="flex items-center gap-1">
          <ProviderLogo provider={agent.provider} className="size-3" fallbackClassName="size-3" />
          <span className="text-xs font-medium text-[#64748b] dark:text-[#94a3b8] leading-4 whitespace-nowrap">{agent.model}</span>
        </div>
      </div>

      {/* Context menu — fixed so it escapes any overflow:hidden ancestor */}
      {isMenuOpen && (
        <div
          className="fixed z-[9999] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden w-[160px]"
          style={{ top: menuPos.top, left: menuPos.left, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { setOpenMenu(null); onView?.(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
            <Eye size={14} className="text-[#64748b] dark:text-[#94a3b8]" /> View
          </button>
          <button onClick={() => { setOpenMenu(null); onOpen(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
            <Bot size={14} className="text-[#64748b] dark:text-[#94a3b8]" /> Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(null);
              onEdit?.(agent);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
          >
            <Pencil size={14} className="text-[#64748b] dark:text-[#94a3b8]" /> Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(null);
              onFork?.(agent);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
          >
            <GitFork size={14} className="text-[#64748b] dark:text-[#94a3b8]" /> Fork agent
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(null);
              onRequestVisibilityChange(agent);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
          >
            {agent.visibility === "public"
              ? <Lock size={14} className="text-[#64748b] dark:text-[#94a3b8]" />
              : <Globe size={14} className="text-[#64748b] dark:text-[#94a3b8]" />
            }
            {visibilityActionLabel}
          </button>
          <div className="h-px bg-[#e2e8f0] dark:bg-[#334155]" />
          <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onRequestDelete(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors">
            <Trash2 size={14} className="text-[#ef4444]" /> Delete
          </button>
        </div>
      )}
    </div>
    </>
  );
}

// ─── Agent table row (list view) ──────────────────────────────────────────────

function AgentRow({ agent, openMenu, setOpenMenu, onOpen, onView, onEdit, onFork, onRequestDelete, onRequestVisibilityChange, zebra }) {
  const isMenuOpen  = openMenu === agent.id;
  const statusCfg   = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const [hovered, setHovered] = useState(false);
  const rowBtnRef   = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const visibilityActionLabel = agent.visibility === "public" ? "Unpublish" : "Publish";

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && rowBtnRef.current) {
      const r = rowBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.right - 160 });
    }
    setOpenMenu(isMenuOpen ? null : agent.id);
  };

  return (
    <>
    <tr
      className={`group border-b border-[#f1f5f9] dark:border-[#1e293b] transition-all duration-150 cursor-pointer ${zebra ? "bg-[#fafafa] dark:bg-[#0f172a]" : "bg-white dark:bg-[#1e293b]"}`}
      style={hovered ? {
        backgroundColor: "#f0f7ff",
        boxShadow: `inset 3px 0 0 ${statusCfg.dot}, inset 0 0 0 1px rgba(37,99,235,0.06)`,
      } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(agent)}
    >
      {/* Icon */}
      <td className="px-4 py-2.5 w-[52px]">
        <AgentAvatar size="sm" name={agent.name} />
      </td>

      {/* Agent name */}
      <td className="px-3 py-2.5 min-w-[180px]">
        <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9] truncate max-w-[220px]">{agent.name}</p>
        <p className="text-xs text-[#94a3b8] dark:text-[#64748b] truncate max-w-[220px]">{agent.date}</p>
      </td>

      {/* Provider / Model */}
      <td className="px-3 py-2.5 w-[180px]">
        <div className="flex items-center gap-1.5">
          <ProviderLogo provider={agent.provider} className="size-4" fallbackClassName="size-4" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#475569] dark:text-[#94a3b8] leading-none">{agent.provider}</span>
            <span className="text-sm text-[#94a3b8] dark:text-[#64748b] leading-none">{agent.model}</span>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 w-[120px]">
        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-2 py-1 rounded-full border"
          style={{ color: statusCfg.text, backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}
        >
          <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.dot }} />
          {statusCfg.label}
        </span>
      </td>

      {/* Last run */}
      <td className="px-3 py-2.5 w-[120px]">
        <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">{agent.lastRun}</span>
      </td>

      {/* Success rate */}
      <td className="px-3 py-2.5 w-[140px]">
        <SuccessBar pct={agent.success} />
      </td>

      {/* Access */}
      <td className="px-3 py-2.5 w-[100px]">
        <span
          className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${
            agent.accessEnabled
              ? "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]"
              : "bg-[#f8fafc] text-[#94a3b8] border-[#e2e8f0]"
          }`}
        >
          {agent.accessEnabled ? "Enabled" : "Disabled"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 w-[52px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center">
          <button
            ref={rowBtnRef}
            onClick={handleMenuToggle}
            aria-label="Agent options"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            className="flex items-center justify-center size-7 rounded-[6px] text-[#94a3b8] dark:text-[#64748b] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] hover:text-[#475569] dark:hover:text-[#94a3b8] transition-colors opacity-30 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <div
              className="fixed z-[9999] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden w-[160px]"
              style={{ top: menuPos.top, left: menuPos.left, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { setOpenMenu(null); onView?.(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                <Eye size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> View
              </button>
              <button onClick={() => { setOpenMenu(null); onOpen(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                <Bot size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Open
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(null);
                  onEdit?.(agent);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
              >
                <Pencil size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(null);
                  onFork?.(agent);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
              >
                <GitFork size={13} className="text-[#64748b] dark:text-[#94a3b8]" /> Fork agent
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(null);
                  onRequestVisibilityChange(agent);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
              >
                {agent.visibility === "public"
                  ? <Lock size={13} className="text-[#64748b] dark:text-[#94a3b8]" />
                  : <Globe size={13} className="text-[#64748b] dark:text-[#94a3b8]" />
                }
                {visibilityActionLabel}
              </button>
              <div className="h-px bg-[#e2e8f0] dark:bg-[#334155]" />
              <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onRequestDelete(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors">
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

// ─── Sortable column header ───────────────────────────────────────────────────

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
            {active && sort.dir === "asc"
              ? <ChevronUp size={12} className="text-[#2563eb]" />
              : active && sort.dir === "desc"
              ? <ChevronDown size={12} className="text-[#2563eb]" />
              : <ChevronsUpDown size={12} className="text-[#94a3b8]" />
            }
          </span>
        )}
      </div>
    </th>
  );
}

// ─── Agent Conversation Panel ─────────────────────────────────────────────────

function AgentConversationPanel({ agent, onClose, isExpanded, onToggleExpand }) {
  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  // Seed a greeting whenever the agent changes
  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: `Hi! I'm **${agent.name}**.\n${agent.description}\n\nHow can I help you today?`,
      },
    ]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [agent.id]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `Thanks for your message! As **${agent.name}** I'm processing your request. This is a demo — in production I'd connect to the live agent backend.`,
        },
      ]);
      setLoading(false);
    }, 900);
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isExpanded ? "100%" : 400, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className={`${isExpanded ? "flex-1 min-w-0" : "flex-shrink-0"} border-l border-[#e2e8f0] bg-[#f8fafc] flex flex-col overflow-hidden`}
      style={{ minWidth: 0 }}
    >
      {/* Header — matches AgentPage */}
      <div className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-[#e2e8f0] bg-white px-4">
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[4px] size-9 flex items-center justify-center overflow-hidden flex-shrink-0">
          <Bot size={18} className="text-[#64748b]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0f172a] truncate">{agent.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.dot }} />
            <span className="text-xs capitalize" style={{ color: statusCfg.text }}>{statusCfg.label}</span>
          </div>
        </div>
        <button
          aria-label={isExpanded ? "Restore panel size" : "Maximize"}
          onClick={onToggleExpand}
          className="flex size-7 items-center justify-center rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
        >
          {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <button aria-label="Close" onClick={onClose} className="flex size-7 items-center justify-center rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 px-4 py-4">
        <div className="flex-1" />

        {messages.map((msg, i) => {
          if (msg.role === "user") return (
            <div key={i} className="flex justify-end w-full flex-shrink-0">
              <div className="max-w-[80%] rounded-[12px] rounded-tr-[4px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                <p className="text-sm leading-5 text-[#0f172a] whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          );
          return (
            <div key={i} className="flex flex-col items-start w-full flex-shrink-0">
              <div className="w-full rounded-[12px] rounded-tl-[4px] bg-white border border-[#e2e8f0] px-4 py-3">
                <p className="text-sm leading-6 text-[#4e4d4d] whitespace-pre-line">
                  {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                </p>
              </div>
              {/* Action buttons on AI messages */}
              <div className="flex items-center mt-1">
                {[
                  { icon: <Copy size={14} />, label: "Copy" },
                  { icon: <ThumbsUp size={14} />, label: "Good response" },
                  { icon: <ThumbsDown size={14} />, label: "Bad response" },
                  { icon: <RotateCcw size={14} />, label: "Regenerate" },
                ].map((btn) => (
                  <button key={btn.label} aria-label={btn.label} title={btn.label}
                    className="flex size-7 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b] transition-colors">
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1 px-4 py-3 rounded-[12px] rounded-tl-[4px] bg-white border border-[#e2e8f0]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 rounded-full bg-[#94a3b8] animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prompt box — matches AgentPage style */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className="rounded-[12px] bg-white shadow-[0_4px_24px_0_rgba(37,99,235,0.10)] border border-[#e2e8f0] overflow-hidden">
          {/* Text input row */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e2e8f0]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Ask ${agent.name} anything…`}
              className="flex-1 bg-transparent text-sm leading-5 text-[#0f172a] placeholder:text-[#94a3b8] outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className={`flex items-center justify-center size-8 rounded-full border flex-shrink-0 transition-colors ${
                input.trim() && !loading
                  ? "bg-[#2563eb] border-[#2563eb] text-white hover:bg-[#1d4ed8]"
                  : "bg-white border-[#cbd5e1] text-[#cbd5e1] cursor-not-allowed"
              }`}
            >
              <Send size={14} />
            </button>
          </div>
          {/* Control bar */}
          <div className="flex items-center gap-1 px-3 py-2">
            <button className="flex items-center gap-1.5 h-7 rounded-[6px] px-2 text-xs text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
              <Paperclip size={12} /> Attach
            </button>
            <div className="h-4 w-px bg-[#e2e8f0] mx-1" />
            <span className="text-xs text-[#94a3b8]">Claude-sonnet</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsListPage({
  onNavigate,
  onOpenAgent,
  onViewAgent,
  onEditAgent,
  agents: agentsProp,
  onAgentsChange,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery]   = useState("");
  const [openMenu, setOpenMenu]         = useState(null);
  const [viewMode, setViewMode]         = useState("grid");
  const [sort, setSort]                 = useState({ key: "name", dir: "asc" });
  /** `null` = all agents; otherwise single segment filter (Flows-style mutual exclusion). */
  const [segmentFilter, setSegmentFilter] = useState(null);
  const [internalAgents, setInternalAgents] = useState(INITIAL_AGENTS);
  const agents = agentsProp ?? internalAgents;
  const setAgents = onAgentsChange ?? setInternalAgents;
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isConversationExpanded, setIsConversationExpanded] = useState(false);
  const [agentPendingDelete, setAgentPendingDelete] = useState(null);
  const [agentPendingFork, setAgentPendingFork] = useState(null);
  const [agentPendingPublish, setAgentPendingPublish] = useState(null);
  const [agentPendingUnpublish, setAgentPendingUnpublish] = useState(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const handleSetVisibility = (agentId, visibility) => {
    setAgents((prevAgents) =>
      prevAgents.map((agent) => (agent.id === agentId ? { ...agent, visibility } : agent))
    );
    setSelectedAgent((prevSelected) =>
      prevSelected?.id === agentId ? { ...prevSelected, visibility } : prevSelected
    );
  };

  const handleDeleteAgent = (agentId) => {
    const agentName = agents.find((agent) => agent.id === agentId)?.name ?? "Agent";
    setAgents((prevAgents) => prevAgents.filter((agent) => agent.id !== agentId));
    setSelectedAgent((prevSelected) => (prevSelected?.id === agentId ? null : prevSelected));
    showToast(`Agent "${agentName}" deleted.`);
  };

  const handleForkAgent = (source, name, description) => {
    const nextId = agents.length ? Math.max(...agents.map((a) => a.id)) + 1 : 0;
    const desc = description.trim() || source.description || "";
    const forked = {
      ...source,
      id: nextId,
      name,
      description: desc,
      visibility: "private",
      date: formatCatalogDate(),
      status: "idle",
      lastRun: "Never",
      success: 100,
    };
    setAgents((prev) => [...prev, forked]);
    showToast(`Fork created — "${name}" is in your catalog (private).`);
  };

  const handleRequestVisibilityChange = (agent) => {
    if (agent.visibility === "public") {
      setAgentPendingUnpublish(agent);
      return;
    }
    setAgentPendingPublish(agent);
  };

  /**
   * Opening an agent: Customer Appreciation → navigate to /kudos via onOpenAgent;
   * all other agents → open inline chat panel.
   */
  const handleOpen = (agent) => {
    if (onOpenAgent && agent.name === "Customer Appreciation") {
      onOpenAgent(agent);
      return;
    }
    setSelectedAgent(agent);
  };

  const matchesSearch = (a) => a.name.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesSegmentFilter = (a) => {
    if (!segmentFilter) return true;
    if (segmentFilter === "active") return a.status === "active";
    if (segmentFilter === "disabled") return a.status === "disabled";
    if (segmentFilter === "public") return a.visibility === "public";
    if (segmentFilter === "private") return a.visibility === "private";
    return true;
  };

  const total = agents.length;
  const activeN = agents.filter((a) => a.status === "active").length;
  const disabledN = agents.filter((a) => a.status === "disabled").length;
  const publicN = agents.filter((a) => a.visibility === "public").length;
  const privateN = agents.filter((a) => a.visibility === "private").length;

  const statChipClass = (key) =>
    cn(
      "inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left transition-colors",
      "hover:bg-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      segmentFilter === key && "bg-muted font-medium text-foreground shadow-sm",
    );

  const toggleSegmentFilter = (key) => {
    setSegmentFilter((prev) => (prev === key ? null : key));
  };

  const filtered = agents
    .filter(matchesSearch)
    .filter(matchesSegmentFilter)
    .sort((a, b) => {
      const val = (x) => {
        if (sort.key === "name")     return x.name.toLowerCase();
        if (sort.key === "provider") return x.provider.toLowerCase();
        if (sort.key === "status")   return x.status;
        if (sort.key === "lastRun")  return x.lastRun;
        if (sort.key === "success")  return x.success;
        if (sort.key === "access")   return x.accessEnabled ? 0 : 1;
        return x.name.toLowerCase();
      };
      const cmp = val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });

  const filteredEmpty = agents.length > 0 && filtered.length === 0;

  return (
    <>
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}

      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc]">
        <Sidebar activePage="agents" onNavigate={onNavigate} />

        <div className="flex flex-1 min-w-0 min-h-0">
          <div className={`${selectedAgent && isConversationExpanded ? "hidden" : "flex flex-col flex-1 min-w-0"}`}>
          <AppHeader onNavigate={onNavigate} />

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-4 flex flex-col gap-4">

              {/* Page title + toolbar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-2xl font-semibold text-[#0f172a] leading-8 tracking-[-0.6px]">
                    Agents
                  </h1>
                  <p className="text-sm text-[#64748b] leading-5">
                    Build and manage your team of digital workers.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <ExpandableSearch.Provider
                    value={searchQuery}
                    onChange={setSearchQuery}
                    layoutId="agents-search"
                  >
                    <ExpandableSearch.Action />
                    <ExpandableSearch.Input placeholder="Search agents…" className="w-[240px]" />
                  </ExpandableSearch.Provider>

                  <div className="flex items-center bg-white border border-[#e2e8f0] rounded-[6px] h-9 p-1 gap-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center justify-center size-7 rounded-[4px] transition-colors ${viewMode === "grid" ? "bg-[#f1f5f9] text-[#0f172a]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
                      title="Grid view"
                      aria-label="Switch to grid view"
                      aria-pressed={viewMode === "grid"}
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`flex items-center justify-center size-7 rounded-[4px] transition-colors ${viewMode === "list" ? "bg-[#f1f5f9] text-[#0f172a]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
                      title="List view"
                      aria-label="Switch to list view"
                      aria-pressed={viewMode === "list"}
                    >
                      <List size={15} />
                    </button>
                  </div>

                  <button
                    onClick={() => navigate("/agents/create")}
                    className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 h-9 rounded-[6px] transition-colors flex-shrink-0"
                  >
                    <Plus size={16} />
                    Create Agent
                  </button>
                </div>
              </div>

              {/* Segment filters — matches FlowsPage stat chip pattern */}
              <div
                className="flex flex-wrap items-center gap-3 text-sm"
                role="toolbar"
                aria-label="Filter agents by status and visibility"
              >
                <button
                  type="button"
                  className={statChipClass(null)}
                  onClick={() => setSegmentFilter(null)}
                  aria-pressed={segmentFilter === null}
                  title="Show all agents"
                >
                  <span className="text-muted-foreground">
                    <AnimCount to={total} className="font-semibold text-foreground" /> agents
                  </span>
                </button>
                <span className="text-border select-none" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className={cn(statChipClass("active"), "items-center")}
                  onClick={() => toggleSegmentFilter("active")}
                  aria-pressed={segmentFilter === "active"}
                  title="Show active agents"
                >
                  <span className="size-2 shrink-0 rounded-full bg-primary" />
                  <AnimCount to={activeN} className="font-semibold text-primary" />
                  <span className="text-muted-foreground">active</span>
                </button>
                <span className="text-border select-none" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className={cn(statChipClass("disabled"), "items-center")}
                  onClick={() => toggleSegmentFilter("disabled")}
                  aria-pressed={segmentFilter === "disabled"}
                  title="Show disabled agents"
                >
                  <span className="size-2 shrink-0 rounded-full bg-muted-foreground" />
                  <AnimCount to={disabledN} className="font-semibold text-muted-foreground" />
                  <span className="text-muted-foreground">disabled</span>
                </button>
                <span className="text-border select-none" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className={cn(statChipClass("public"), "items-center")}
                  onClick={() => toggleSegmentFilter("public")}
                  aria-pressed={segmentFilter === "public"}
                  title="Show public agents"
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
                  onClick={() => toggleSegmentFilter("private")}
                  aria-pressed={segmentFilter === "private"}
                  title="Show private agents"
                >
                  <span className="size-2 shrink-0 rounded-full bg-muted-foreground" />
                  <AnimCount to={privateN} className="font-semibold text-muted-foreground" />
                  <span className="text-muted-foreground">private</span>
                </button>
              </div>

              {filteredEmpty && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <p className="text-sm font-medium text-foreground">No agents match your filters</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term or clear the segment filter.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSegmentFilter(null);
                    }}
                  >
                    Clear search and filter
                  </Button>
                </div>
              )}

              {/* Agent grid / list */}
              {!filteredEmpty && filtered.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-4">
                    {filtered.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onOpen={handleOpen}
                        onView={onViewAgent}
                        onEdit={onEditAgent}
                        onFork={(a) => setAgentPendingFork(a)}
                        onRequestDelete={setAgentPendingDelete}
                        onRequestVisibilityChange={handleRequestVisibilityChange}
                        isSelected={selectedAgent?.id === agent.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-[#e2e8f0] rounded-[8px] overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 border-b border-[#e2e8f0]" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(248,250,252,0.88)" }}>
                        <tr>
                          <th className="px-4 py-3 w-[52px]" />
                          <ColHeader label="Agent"          sortKey="name"     sort={sort} onSort={handleSort} className="min-w-[180px]" />
                          <ColHeader label="Provider / Model" sortKey="provider" sort={sort} onSort={handleSort} className="w-[180px]" />
                          <ColHeader label="Status"         sortKey="status"   sort={sort} onSort={handleSort} className="w-[120px]" />
                          <ColHeader label="Last Run"       sortKey="lastRun"  sort={sort} onSort={handleSort} className="w-[120px]" />
                          <ColHeader label="Success Rate"   sortKey="success"  sort={sort} onSort={handleSort} className="w-[140px]" />
                          <ColHeader label="Access"         sortKey="access"   sort={sort} onSort={handleSort} className="w-[100px]" />
                          <th className="px-3 py-3 w-[52px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((agent, i) => (
                          <AgentRow
                            key={agent.id}
                            agent={agent}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            onOpen={handleOpen}
                            onView={onViewAgent}
                            onEdit={onEditAgent}
                            onFork={(a) => setAgentPendingFork(a)}
                            onRequestDelete={setAgentPendingDelete}
                            onRequestVisibilityChange={handleRequestVisibilityChange}
                            zebra={i % 2 !== 0}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : !filteredEmpty ? (
                /* Empty state — no agents in catalog */
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="size-14 bg-[#f1f5f9] rounded-[12px] flex items-center justify-center">
                    <Cpu size={28} className="text-[#94a3b8]" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-semibold text-[#0f172a]">No agents found</p>
                    <p className="text-sm text-[#64748b]">Try adjusting your search or segment filter.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSegmentFilter(null);
                    }}
                    className="text-sm font-medium text-[#2563eb] hover:underline"
                  >
                    Clear filters
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 h-9 rounded-[6px] transition-colors"
                  >
                    <Plus size={16} /> Create your first agent
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          </div>{/* end inner flex-col */}

          {/* Right conversation panel */}
          <AnimatePresence>
            {selectedAgent && (
              <AgentConversationPanel
                key={selectedAgent.id}
                agent={selectedAgent}
                isExpanded={isConversationExpanded}
                onToggleExpand={() => setIsConversationExpanded((prev) => !prev)}
                onClose={() => { setSelectedAgent(null); setIsConversationExpanded(false); }}
              />
            )}
          </AnimatePresence>
        </div>{/* end flex row */}
      </div>
      {agentPendingDelete && (
        <ConfirmDialog
          title={`Delete "${agentPendingDelete.name}"?`}
          message="This agent and all its execution history will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={() => {
            handleDeleteAgent(agentPendingDelete.id);
            setAgentPendingDelete(null);
          }}
          onCancel={() => setAgentPendingDelete(null)}
        />
      )}
      <ForkAgentDialog
        agent={agentPendingFork}
        open={!!agentPendingFork}
        onOpenChange={(open) => {
          if (!open) setAgentPendingFork(null);
        }}
        onFork={handleForkAgent}
      />
      <Dialog open={!!agentPendingPublish} onOpenChange={(open) => { if (!publishBusy && !open) setAgentPendingPublish(null); }}>
        <DialogContent
          showCloseButton
          className="flex w-[calc(100vw-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:w-full"
        >
          <div>
            <DialogHeader className="relative px-6 pt-6 pb-2 pr-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/25">
                <Globe className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <DialogTitle className="text-balance text-center text-lg font-semibold leading-snug text-foreground">
                Publish this agent?
              </DialogTitle>
              <DialogDescription className="text-balance px-1 pt-2 text-center text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{agentPendingPublish?.name || "This agent"}</span>{" "}
                will become visible to all logged-in users in the Agents list.
              </DialogDescription>
            </DialogHeader>

            <div className="mx-6 mb-4 mt-4 space-y-0 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-foreground">Visible to all users</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Anyone logged in can find and run this agent from the Agents page.
                  </p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex gap-3">
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-foreground">Latest agent configuration will be shared</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Users will access this agent with its current saved setup.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-border bg-muted/30 px-6 py-4 dark:bg-muted/20">
            <Button
              type="button"
              variant="outline"
              className="min-h-10 flex-1"
              onClick={() => setAgentPendingPublish(null)}
              disabled={publishBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-10 flex-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={publishBusy}
              onClick={() => {
                if (!agentPendingPublish) return;
                setPublishBusy(true);
                try {
                  handleSetVisibility(agentPendingPublish.id, "public");
                  showToast("Agent published — now visible in the Agents list.");
                  setAgentPendingPublish(null);
                } finally {
                  setPublishBusy(false);
                }
              }}
            >
              {publishBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!agentPendingUnpublish} onOpenChange={(open) => { if (!publishBusy && !open) setAgentPendingUnpublish(null); }}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,420px)] w-[calc(100vw-2rem)] max-w-sm flex-col gap-0 overflow-hidden p-0 sm:w-full"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-4 pr-14">
            <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <Globe className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
            <DialogTitle className="text-balance text-center text-lg font-semibold leading-snug">
              Unpublish "{agentPendingUnpublish?.name || "this agent"}"?
            </DialogTitle>
            <DialogDescription className="text-balance pt-2 text-center text-sm leading-relaxed text-muted-foreground">
              {agentPendingUnpublish?.name || "This agent"} will be hidden from other users and no longer listed as public.
            </DialogDescription>
          </div>
          <div className="flex shrink-0 gap-2 border-t border-border bg-muted/30 px-6 py-4 dark:bg-muted/20">
            <Button
              type="button"
              variant="outline"
              className="min-h-10 flex-1"
              onClick={() => setAgentPendingUnpublish(null)}
              disabled={publishBusy}
            >
              Keep published
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 flex-1"
              disabled={publishBusy}
              onClick={() => {
                if (!agentPendingUnpublish) return;
                setPublishBusy(true);
                try {
                  handleSetVisibility(agentPendingUnpublish.id, "private");
                  showToast("Agent unpublished — hidden from the public list.");
                  setAgentPendingUnpublish(null);
                } finally {
                  setPublishBusy(false);
                }
              }}
            >
              {publishBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unpublish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
      ))}
    </>
  );
}
