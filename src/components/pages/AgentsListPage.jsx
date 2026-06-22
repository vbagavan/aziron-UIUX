import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, MoreVertical, Bot, Pencil, Copy, GitFork, Trash2, LayoutGrid, List, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Eye, Cpu, X, Send, Maximize2, Minimize2, ThumbsUp, ThumbsDown, RotateCcw, Paperclip, Globe, Lock, Loader2, Database, Tag } from "lucide-react";
import { useLabelsStore } from "@/lib/agentLabels.js";
import { agentMatchesSearch, agentMatchesLabelFilter } from "@/lib/agentLabelUtils.js";
import { LabelChip, LabelFilterButton, AgentLabelsRow } from "@/components/agents/LabelSelector.jsx";
import LabelManageDialog from "@/components/agents/LabelManageDialog.jsx";
import { AnimatePresence, motion } from "motion/react";
import AppHeader from "@/components/layout/AppHeader";
import ProviderLogo from "@/components/common/ProviderLogo";
import Sidebar from "@/components/layout/Sidebar";
import { CatalogGridCard } from "@/components/common/CatalogGridCard";
import ExpandableSearch from "@/components/common/ExpandableSearch";
import { PageHeader } from "@/components/common/PageHeader";
import { VisibilityBadge } from "@/components/common/VisibilityBadge";
import { TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { INITIAL_AGENTS } from "@/data/agentsCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { ROLE_SCOPE } from "@/config/rbac";
import {
  agentPublishScopePatch,
  getAgentPublishScope,
  isAgentPublished,
  publishSuccessMessage,
  PUBLISH_SCOPES,
  unpublishScopeMessage,
} from "@/lib/agentPublishScope";
import PublishScopePicker from "@/components/features/publish/PublishScopePicker";
import { useKudosWorkflow } from "@/components/features/kudos/useKudosWorkflow";
import KudosConversationPanel from "@/components/features/kudos/KudosConversationPanel";
import KudosPreviewEditor from "@/components/features/kudos/KudosPreviewEditor";
import ForkDialog from "@/components/features/clone/ForkDialog";
import { PAGE_PATH } from "@/navigation/pagePaths";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { getPublishKnowledgeHubSummary } from "@/lib/agentPublishPreview";
import PublishSharedVaultVariablesSection from "@/components/features/publish/PublishSharedVaultVariablesSection";

const KUDOS_AGENT_NAME = "Customer Appreciation";

// ─── Utilities ────────────────────────────────────────────────────────────────

// Hash agent name → one of 8 gradient pairs for initials avatar
const GRADIENTS = [
  ["var(--chart-chart-3)","var(--chart-chart-4)"], ["var(--primary)","var(--info)"], ["var(--success)","var(--success)"],
  ["var(--warning)","var(--warning)"], ["var(--destructive)","var(--destructive)"], ["var(--chart-chart-4)","var(--destructive)"],
  ["var(--info)","var(--primary)"], ["var(--warning)","var(--warning)"],
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
  active:   { label: "Active",   dot: "var(--success)", bg: "var(--success)/10", text: "var(--success)", border: "var(--success-ring)" },
  idle:     { label: "Idle",     dot: "var(--muted-foreground)", bg: "var(--muted)", text: "var(--muted-foreground)", border: "var(--border)" },
  error:    { label: "Error",    dot: "var(--destructive)", bg: "var(--destructive)/10", text: "var(--destructive)", border: "var(--destructive-ring)" },
  disabled: { label: "Disabled", dot: "var(--border)", bg: "var(--background)", text: "var(--muted-foreground)", border: "var(--border)" },
};

function formatCatalogDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
        className="relative z-10 text-muted-foreground dark:text-muted-foreground"
        style={{ filter: `drop-shadow(0 0 4px ${g1}40)` }}
        aria-hidden
      />
    </div>
  );
}

// ─── Success bar ─────────────────────────────────────────────────────────────

function SuccessBar({ pct }) {
  const color = pct >= 90 ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-muted dark:bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ─── Agent card (grid view) ───────────────────────────────────────────────────

function AgentCard({ agent, openMenu, setOpenMenu, onOpen, onView, onEdit, onFork, onRequestDelete, onRequestVisibilityChange, isSelected, isHighlighted }) {
  const isMenuOpen = openMenu === agent.id;
  const statusCfg  = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const btnRef     = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const visibilityActionLabel = isAgentPublished(agent) ? "Unpublish" : "Publish";
  const hasDescription = Boolean(agent.description?.trim());
  const { can } = usePermissions();

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
    <div data-agent-id={agent.id} className="h-full">
    <CatalogGridCard
      ariaLabel={`Open agent ${agent.name}`}
      selected={isSelected}
      onClick={() => onOpen(agent)}
      className={cn("gap-2", isHighlighted && "ring-2 ring-primary shadow-md")}
      topAccent={
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px] opacity-0 transition-opacity duration-200 rounded-t-xl group-hover:opacity-100 focus-visible:opacity-100"
          style={{ background: `linear-gradient(90deg, ${statusCfg.dot}, color-mix(in oklch, ${statusCfg.dot} 55%, transparent))` }}
          aria-hidden
        />
      }
    >
      <div className="flex gap-2 items-start">
        <div className="relative shrink-0">
          <AgentAvatar name={agent.name} />
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card"
            style={{ backgroundColor: statusCfg.dot }}
            title={statusCfg.label}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {agent.accessEnabled && (
              <div className="size-2 shrink-0 rounded-full border-2 border-border bg-muted" />
            )}
            <p className="flex-1 truncate text-sm font-semibold leading-5 text-foreground">
              {agent.name}
            </p>
            <Button
              ref={btnRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleMenuToggle}
              aria-label="Agent options"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </div>
          <VisibilityBadge agent={agent} visibility={agent.visibility} />
          <p
            className={cn(
              "line-clamp-3 text-xs leading-4",
              hasDescription ? "text-muted-foreground" : "italic text-muted-foreground",
            )}
          >
            {hasDescription ? agent.description : "No description added yet."}
          </p>
        </div>
      </div>

      {agent.labels?.length > 0 && (
        <AgentLabelsRow labelIds={agent.labels} />
      )}

      <Separator className="mt-auto" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium whitespace-nowrap">{agent.date}</span>
        <div className="flex items-center gap-1">
          <ProviderLogo provider={agent.provider} className="size-3" fallbackClassName="size-3" />
          <span className="font-medium whitespace-nowrap">{agent.model}</span>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed z-[9999] w-40 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { setOpenMenu(null); onView?.(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors">
            <Eye size={14} className="text-muted-foreground dark:text-muted-foreground" /> View
          </button>
          <button onClick={() => { setOpenMenu(null); onOpen(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors">
            <Bot size={14} className="text-muted-foreground dark:text-muted-foreground" /> Open
          </button>
          {can("agents.edit") && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onEdit?.(agent); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <Pencil size={14} className="text-muted-foreground dark:text-muted-foreground" /> Edit
            </button>
          )}
          {can("agents.fork") && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onFork?.(agent); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <GitFork size={14} className="text-muted-foreground dark:text-muted-foreground" /> Fork agent
            </button>
          )}
          {can("agents.publish") && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onRequestVisibilityChange(agent); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              {isAgentPublished(agent)
                ? <Lock size={14} className="text-muted-foreground dark:text-muted-foreground" />
                : <Globe size={14} className="text-muted-foreground dark:text-muted-foreground" />
              }
              {visibilityActionLabel}
            </button>
          )}
          {can("agents.delete") && (
            <>
              <div className="h-px bg-border dark:bg-border" />
              <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onRequestDelete(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} className="text-destructive" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </CatalogGridCard>
    </div>
    </>
  );
}

// ─── Agent table row (list view) ──────────────────────────────────────────────

function AgentRow({ agent, openMenu, setOpenMenu, onOpen, onView, onEdit, onFork, onRequestDelete, onRequestVisibilityChange, zebra, isHighlighted }) {
  const isMenuOpen  = openMenu === agent.id;
  const statusCfg   = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const [hovered, setHovered] = useState(false);
  const rowBtnRef   = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const visibilityActionLabel = isAgentPublished(agent) ? "Unpublish" : "Publish";
  const { can } = usePermissions();

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
      data-agent-id={agent.id}
      className={cn(
        "group border-b border-border dark:border-border transition-all duration-150 cursor-pointer",
        zebra ? "bg-background dark:bg-background" : "bg-card dark:bg-card",
        isHighlighted && "ring-2 ring-inset ring-primary bg-primary/5",
      )}
      style={hovered ? {
        backgroundColor: "color-mix(in oklch, var(--primary) 8%, var(--background))",
        boxShadow: `inset 3px 0 0 ${statusCfg.dot}, inset 0 0 0 1px color-mix(in oklch, var(--primary) 6%, transparent)`,
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
        <p className="text-sm font-medium text-foreground dark:text-foreground truncate max-w-[220px]">{agent.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">{agent.date}</p>
          {agent.labels?.slice(0, 2).map(id => (
            <LabelChip key={id} labelId={id} size="xs" />
          ))}
          {agent.labels?.length > 2 && (
            <Badge variant="secondary" className="h-5 text-xs">
              +{agent.labels.length - 2}
            </Badge>
          )}
        </div>
      </td>

      {/* Provider / Model */}
      <td className="px-3 py-2.5 w-[180px]">
        <div className="flex items-center gap-1.5">
          <ProviderLogo provider={agent.provider} className="size-4" fallbackClassName="size-4" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground leading-none">{agent.provider}</span>
            <span className="text-sm text-muted-foreground dark:text-muted-foreground leading-none">{agent.model}</span>
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
        <span className="text-xs text-muted-foreground dark:text-muted-foreground">{agent.lastRun}</span>
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
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-muted text-muted-foreground border-border"
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
            className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground dark:text-muted-foreground hover:bg-border dark:hover:bg-muted hover:text-muted-foreground dark:hover:text-muted-foreground transition-colors opacity-30 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <div
              className="fixed z-[9999] w-[160px] overflow-hidden rounded-[10px] border border-border bg-card shadow-elevation-md dark:border-border dark:bg-card"
              style={{ top: menuPos.top, left: menuPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { setOpenMenu(null); onView?.(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors">
                <Eye size={13} className="text-muted-foreground dark:text-muted-foreground" /> View
              </button>
              <button onClick={() => { setOpenMenu(null); onOpen(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors">
                <Bot size={13} className="text-muted-foreground dark:text-muted-foreground" /> Open
              </button>
              {can("agents.edit") && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onEdit?.(agent); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
                >
                  <Pencil size={13} className="text-muted-foreground dark:text-muted-foreground" /> Edit
                </button>
              )}
              {can("agents.fork") && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onFork?.(agent); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
                >
                  <GitFork size={13} className="text-muted-foreground dark:text-muted-foreground" /> Fork agent
                </button>
              )}
              {can("agents.publish") && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onRequestVisibilityChange(agent); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
                >
                  {agent.visibility === "public"
                    ? <Lock size={13} className="text-muted-foreground dark:text-muted-foreground" />
                    : <Globe size={13} className="text-muted-foreground dark:text-muted-foreground" />
                  }
                  {visibilityActionLabel}
                </button>
              )}
              {can("agents.delete") && (
                <>
                  <div className="h-px bg-border dark:bg-border" />
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onRequestDelete(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 size={13} className="text-destructive" /> Delete
                  </button>
                </>
              )}
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
        <span className={`text-sm font-bold tracking-[0.06em] uppercase ${active ? "text-primary" : "text-muted-foreground dark:text-muted-foreground"}`}>
          {label}
        </span>
        {sortKey && (
          <span className={`transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover/col:opacity-50"}`}>
            {active && sort.dir === "asc"
              ? <ChevronUp size={12} className="text-primary" />
              : active && sort.dir === "desc"
              ? <ChevronDown size={12} className="text-primary" />
              : <ChevronsUpDown size={12} className="text-muted-foreground" />
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
      className={`${isExpanded ? "flex-1 min-w-0" : "flex-shrink-0"} border-l border-border bg-muted flex flex-col overflow-hidden`}
      style={{ minWidth: 0 }}
    >
      {/* Header — matches AgentPage */}
      <div className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-border bg-card px-4">
        <div className="bg-muted border border-border rounded-[4px] size-9 flex items-center justify-center overflow-hidden flex-shrink-0">
          <Bot size={18} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.dot }} />
            <span className="text-xs capitalize" style={{ color: statusCfg.text }}>{statusCfg.label}</span>
          </div>
        </div>
        <button
          aria-label={isExpanded ? "Restore panel size" : "Maximize"}
          onClick={onToggleExpand}
          className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
        >
          {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <button aria-label="Close" onClick={onClose} className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 px-4 py-4">
        <div className="flex-1" />

        {messages.map((msg, i) => {
          if (msg.role === "user") return (
            <div key={i} className="flex justify-end w-full flex-shrink-0">
              <div className="max-w-[80%] rounded-[12px] rounded-tr-[4px] border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="text-sm leading-5 text-foreground whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          );
          return (
            <div key={i} className="flex flex-col items-start w-full flex-shrink-0">
              <div className="w-full rounded-[12px] rounded-tl-[4px] bg-card border border-border px-4 py-3">
                <p className="text-sm leading-6 text-foreground whitespace-pre-line">
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
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-muted-foreground transition-colors">
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1 px-4 py-3 rounded-[12px] rounded-tl-[4px] bg-card border border-border">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 rounded-full bg-muted animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prompt box — matches AgentPage style */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className="rounded-[12px] bg-card shadow-[0_4px_24px_0_rgba(37,99,235,0.10)] border border-border overflow-hidden">
          {/* Text input row */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Ask ${agent.name} anything…`}
              className="flex-1 bg-transparent text-sm leading-5 text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className={`flex items-center justify-center size-8 rounded-full border flex-shrink-0 transition-colors ${
                input.trim() && !loading
                  ? "bg-primary border-border text-primary-foreground hover:bg-primary"
                  : "bg-card border-border text-foreground cursor-not-allowed"
              }`}
            >
              <Send size={14} />
            </button>
          </div>
          {/* Control bar */}
          <div className="flex items-center gap-1 px-3 py-2">
            <button className="flex items-center gap-1.5 h-7 rounded-[6px] px-2 text-xs text-muted-foreground hover:bg-muted transition-colors">
              <Paperclip size={12} /> Attach
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <span className="text-xs text-muted-foreground">Claude-sonnet</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PublishAgentMarketplaceDetails({ agent }) {
  const { hubs } = useKnowledgeHubs();
  const hubSummary = getPublishKnowledgeHubSummary(agent, hubs);
  const [hubsExpanded, setHubsExpanded] = useState(false);

  const notListedHubCount = hubSummary.attached.filter((h) => !h.marketplacePublished).length;

  return (
    <>
      <Separator className="my-3" />
      <div className="flex gap-3">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" aria-hidden />
        <div className="min-w-0 flex-1 text-left">
          <p className="font-medium text-foreground">
            Knowledge hubs
            {hubSummary.total > 0 && (
              <span className="font-normal text-muted-foreground"> ({hubSummary.total})</span>
            )}
          </p>
          {hubSummary.total === 0 ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              No knowledge hubs attached to this agent.
            </p>
          ) : (
            <>
              <button
                type="button"
                aria-expanded={hubsExpanded}
                aria-controls="publish-hub-list"
                onClick={() => setHubsExpanded((prev) => !prev)}
                className="mt-1 flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline transition-colors"
              >
                <span>
                  {hubsExpanded ? "Hide hubs" : `Show ${hubSummary.total} hub${hubSummary.total !== 1 ? "s" : ""}`}
                  {!hubsExpanded && notListedHubCount > 0 && ` · ${notListedHubCount} not on marketplace`}
                </span>
                <ChevronDown size={12} className={cn("transition-transform", hubsExpanded && "rotate-180")} />
              </button>
              {hubsExpanded && (
                <ul id="publish-hub-list" className="mt-1.5 space-y-1 text-xs leading-relaxed">
                  {hubSummary.attached.map((hub) => (
                    <li key={hub.id} className="text-foreground">{hub.name}</li>
                  ))}
                </ul>
              )}
              {notListedHubCount > 0 && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Some connected hubs aren&apos;t listed publicly — they&apos;ll still be accessible to logged-in users.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <PublishSharedVaultVariablesSection
        source={agent}
        kind="agent"
        listId="publish-agent-shared-vault-list"
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsListPage({
  onNavigate,
  onViewAgent,
  onEditAgent,
  agents: agentsProp,
  onAgentsChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();
  const { can } = usePermissions();
  const orgName = ROLE_SCOPE[auth.role]?.sublabel ?? "your organization";
  const [searchQuery, setSearchQuery]   = useState("");
  const [openMenu, setOpenMenu]         = useState(null);
  const [viewMode, setViewMode]         = useState("grid");
  const [sort, setSort]                 = useState({ key: "name", dir: "asc" });
  /** `null` = all agents; otherwise single segment filter (Flows-style mutual exclusion). */
  const [segmentFilter, setSegmentFilter] = useState(null);
  /** Active label filters — OR (any) or AND (all) when multiple selected. */
  const [labelFilters, setLabelFilters] = useState([]);
  const [labelFilterMode, setLabelFilterMode] = useState("any");
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);
  const { labels: allLabels, getLabel } = useLabelsStore();
  const [internalAgents, setInternalAgents] = useState(INITIAL_AGENTS);
  const agents = agentsProp ?? internalAgents;
  const setAgents = onAgentsChange ?? setInternalAgents;

  useEffect(() => {
    setLabelFilters(prev => prev.filter(id => allLabels.some(l => l.id === id)));
  }, [allLabels]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [highlightedAgentId, setHighlightedAgentId] = useState(null);
  const [isConversationExpanded, setIsConversationExpanded] = useState(false);
  const kudosWorkflow = useKudosWorkflow();
  const isKudosAgent = selectedAgent?.name === KUDOS_AGENT_NAME;
  /** Kudos: left preview fills remaining width; chat stays 400px unless preview is maximized. */
  const isKudosPreviewExpanded = isKudosAgent && isConversationExpanded;
  const showKudosWorkspace = isKudosAgent && !!selectedAgent;
  const hideAgentsMainColumn = selectedAgent && isConversationExpanded && !isKudosAgent;
  const hideKudosChatPanel = isKudosPreviewExpanded;
  const [agentPendingDelete, setAgentPendingDelete] = useState(null);
  const [agentPendingFork, setAgentPendingFork] = useState(null);
  const [agentPendingPublish, setAgentPendingPublish] = useState(null);
  const [publishScopeChoice, setPublishScopeChoice] = useState(PUBLISH_SCOPES.ORG);
  const [agentPendingUnpublish, setAgentPendingUnpublish] = useState(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    if (!location.state?.openKudosAgent) return;
    const kudosAgent = agents.find((a) => a.name === KUDOS_AGENT_NAME);
    if (kudosAgent) {
      setIsConversationExpanded(false);
      setSelectedAgent(kudosAgent);
    }
    navigate("/agents", { replace: true, state: null });
  }, [location.state?.openKudosAgent, agents, navigate]);

  useEffect(() => {
    const highlightId = location.state?.highlightAgentId;
    if (highlightId == null || highlightId === "") return;

    const agent = agents.find((a) => String(a.id) === String(highlightId));
    navigate("/agents", { replace: true, state: null });

    if (!agent) {
      showToast("That agent is not in your catalog.", { variant: "destructive" });
      return;
    }

    setSearchQuery("");
    setSegmentFilter(null);
    setLabelFilters([]);
    setLabelFilterMode("any");
    setIsConversationExpanded(false);
    setSelectedAgent(agent);
    setHighlightedAgentId(agent.id);

    window.setTimeout(() => {
      document
        .querySelector(`[data-agent-id="${agent.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    const clearHighlight = window.setTimeout(() => setHighlightedAgentId(null), 3200);
    return () => window.clearTimeout(clearHighlight);
  }, [location.state?.highlightAgentId, agents, navigate, showToast]);

  useEffect(() => {
    const search = location.state?.searchAgents;
    if (!search) return;
    navigate("/agents", { replace: true, state: null });
    setSegmentFilter(null);
    setLabelFilters([]);
    setSearchQuery(search);
  }, [location.state?.searchAgents, navigate]);

  const handleKudosActionComplete = (message) => {
    if (message) showToast(message);
  };

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  useEffect(() => {
    if (!agentPendingPublish) return;
    const currentScope = getAgentPublishScope(agentPendingPublish);
    setPublishScopeChoice(
      currentScope === PUBLISH_SCOPES.MARKETPLACE ? PUBLISH_SCOPES.MARKETPLACE : PUBLISH_SCOPES.ORG,
    );
  }, [agentPendingPublish]);

  const handleSetPublishScope = (agentId, scope) => {
    const patch = agentPublishScopePatch(scope);
    setAgents((prevAgents) =>
      prevAgents.map((agent) => (agent.id === agentId ? { ...agent, ...patch } : agent))
    );
    setSelectedAgent((prevSelected) =>
      prevSelected?.id === agentId ? { ...prevSelected, ...patch } : prevSelected
    );
  };

  const handleDeleteAgent = (agentId) => {
    const agentName = agents.find((agent) => agent.id === agentId)?.name ?? "Agent";
    setAgents((prevAgents) => prevAgents.filter((agent) => agent.id !== agentId));
    setSelectedAgent((prevSelected) => (prevSelected?.id === agentId ? null : prevSelected));
    showToast(`Agent "${agentName}" deleted.`);
  };

  const requestAgentFork = (agent) => setAgentPendingFork(agent);



  const forkPermissions = useMemo(
    () => ({ canFork: can("agents.fork"), canCreateFlow: can("flows.create") }),
    [can],
  );

  const handleForkAgent = ({ name, description, source }) => {
    const nextId = agents.length ? Math.max(...agents.map((a) => a.id)) + 1 : 0;
    const desc = description.trim() || source.description || "";
    const forked = {
      ...source,
      id: nextId,
      name,
      description: desc,
      visibility: "private",
      publishScope: "private",
      date: formatCatalogDate(),
      status: "idle",
      lastRun: "Never",
      success: 100,
    };
    setAgents((prev) => [...prev, forked]);
    setAgentPendingFork(null);
    showToast(`Fork created — "${name}" is in your catalog (private).`);
  };

  const handleRequestVisibilityChange = (agent) => {
    if (isAgentPublished(agent)) {
      setAgentPendingUnpublish(agent);
      return;
    }
    setAgentPendingPublish(agent);
  };

  /** Open the inline conversation panel on the right (agents list stays visible). */
  const handleOpen = (agent) => {
    setIsConversationExpanded(false);
    if (agent.name !== KUDOS_AGENT_NAME) {
      kudosWorkflow.reset();
    }
    setSelectedAgent(agent);
  };

  const handleClosePanel = () => {
    kudosWorkflow.reset();
    setSelectedAgent(null);
    setIsConversationExpanded(false);
  };

  const matchesSearch = (a) => agentMatchesSearch(a, searchQuery, getLabel);

  const matchesSegmentFilter = (a) => {
    if (!segmentFilter) return true;
    if (segmentFilter === "active") return a.status === "active";
    if (segmentFilter === "disabled") return a.status === "disabled";
    if (segmentFilter === "public") return isAgentPublished(a);
    if (segmentFilter === "private") return !isAgentPublished(a);
    return true;
  };

  const matchesLabelFilter = (a) => agentMatchesLabelFilter(a, labelFilters, labelFilterMode);

  const toggleLabelFilter = (id) => {
    setLabelFilters(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const total = agents.length;
  const activeN = agents.filter((a) => a.status === "active").length;
  const disabledN = agents.filter((a) => a.status === "disabled").length;
  const publicN = agents.filter((a) => isAgentPublished(a)).length;
  const privateN = agents.filter((a) => !isAgentPublished(a)).length;

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
    .filter(matchesLabelFilter)
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
  const hasAnyFilter = !!searchQuery || !!segmentFilter || labelFilters.length > 0;

  function clearAllFilters() {
    setSearchQuery("");
    setSegmentFilter(null);
    setLabelFilters([]);
    setLabelFilterMode("any");
  }

  return (
    <>
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}

      <main className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
        <Sidebar activePage="agents" onNavigate={onNavigate} />

        <div className="flex flex-1 min-w-0 min-h-0 h-full overflow-hidden">
          <div className={`${hideAgentsMainColumn ? "hidden" : "flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden"}`}>
          <AppHeader
            onNavigate={onNavigate}
            approvals={isKudosAgent ? kudosWorkflow.approvals : undefined}
            onApprove={kudosWorkflow.handleApprove}
            onReject={kudosWorkflow.handleReject}
            onRequestChanges={kudosWorkflow.handleRequestChanges}
            onKudosActionComplete={isKudosAgent ? handleKudosActionComplete : undefined}
            notifOpen={isKudosAgent ? kudosWorkflow.notifOpen : undefined}
            onNotifToggle={
              isKudosAgent ? () => kudosWorkflow.setNotifOpen((v) => !v) : undefined
            }
          >
            {selectedAgent && (
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm min-w-0">
                <button
                  type="button"
                  onClick={handleClosePanel}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  Agents
                </button>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" aria-hidden />
                <span className="font-medium text-foreground truncate">{selectedAgent.name}</span>
              </nav>
            )}
          </AppHeader>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
            {showKudosWorkspace ? (
              <>
                <KudosPreviewEditor workflow={kudosWorkflow} />
                {isKudosPreviewExpanded && (
                  <button
                    type="button"
                    onClick={() => setIsConversationExpanded(false)}
                    className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                  >
                    <Minimize2 size={14} aria-hidden />
                    Show chat
                  </button>
                )}
              </>
            ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-4 flex flex-col gap-4">

              <PageHeader
                title="Agents"
                description="Build and manage your team of digital workers."
              >
                <ExpandableSearch.Provider
                  value={searchQuery}
                  onChange={setSearchQuery}
                  layoutId="agents-search"
                >
                  <ExpandableSearch.Action />
                  <ExpandableSearch.Input placeholder="Search name, description, labels…" className="w-[240px]" />
                </ExpandableSearch.Provider>

                <div className={cn("flex items-center rounded-lg border border-border bg-card p-0.5", TOOLBAR_CONTROL_CLASS)}>
                  <Button
                    type="button"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                    aria-label="Switch to grid view"
                    aria-pressed={viewMode === "grid"}
                  >
                    <LayoutGrid className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("list")}
                    title="List view"
                    aria-label="Switch to list view"
                    aria-pressed={viewMode === "list"}
                  >
                    <List className="size-3.5" />
                  </Button>
                </div>

                {can("agents.create") && (
                  <Button type="button" className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")} onClick={() => navigate("/agents/create")}>
                    <Plus className="size-4" />
                    Create Agent
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                  onClick={() => setManageLabelsOpen(true)}
                >
                  <Tag className="size-4" />
                  Manage labels
                </Button>
              </PageHeader>

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

              {/* Label filter bar */}
              {allLabels.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Filter agents by label">
                    <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Tag aria-hidden />
                      <span>Labels:</span>
                    </div>
                    {allLabels.map(label => {
                      const count = agents.filter(a => (a.labels ?? []).includes(label.id)).length
                      return (
                        <LabelFilterButton
                          key={label.id}
                          label={label}
                          active={labelFilters.includes(label.id)}
                          count={count}
                          unused={count === 0}
                          onClick={() => toggleLabelFilter(label.id)}
                        />
                      )
                    })}
                    {labelFilters.length > 0 && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setLabelFilters([])}
                        className="h-auto px-0 text-xs"
                      >
                        Clear labels
                      </Button>
                    )}
                  </div>
                  {labelFilters.length > 0 && (
                    <div
                      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                      role="group"
                      aria-label="Label filter match mode"
                    >
                      <span>Match:</span>
                      <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
                        <Button
                          type="button"
                          size="xs"
                          variant={labelFilterMode === "any" ? "secondary" : "ghost"}
                          aria-pressed={labelFilterMode === "any"}
                          onClick={() => setLabelFilterMode("any")}
                        >
                          Any label
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant={labelFilterMode === "all" ? "secondary" : "ghost"}
                          aria-pressed={labelFilterMode === "all"}
                          onClick={() => setLabelFilterMode("all")}
                          disabled={labelFilters.length < 2}
                        >
                          All labels
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {filteredEmpty && (
                <Empty className="border-none py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Tag />
                    </EmptyMedia>
                    <EmptyTitle>No agents match your filters</EmptyTitle>
                    <EmptyDescription>
                      Try a different search term, segment, or label filter.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={clearAllFilters}
                  >
                    Clear search and filters
                  </Button>
                </Empty>
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
                        onFork={requestAgentFork}
                        onRequestDelete={setAgentPendingDelete}
                        onRequestVisibilityChange={handleRequestVisibilityChange}
                        isSelected={selectedAgent?.id === agent.id}
                        isHighlighted={highlightedAgentId === agent.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-[8px] overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 border-b border-border bg-card/85 backdrop-blur-md">
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
                            onFork={requestAgentFork}
                            onRequestDelete={setAgentPendingDelete}
                            onRequestVisibilityChange={handleRequestVisibilityChange}
                            zebra={i % 2 !== 0}
                            isHighlighted={highlightedAgentId === agent.id}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : !filteredEmpty ? (
                /* Empty state — no agents in catalog */
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="size-14 bg-muted rounded-[12px] flex items-center justify-center">
                    <Cpu size={28} className="text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-semibold text-foreground">No agents found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or segment filter.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSegmentFilter(null);
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                  {can("agents.create") && (
                    <Button
                      type="button"
                      className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                      onClick={() => navigate("/agents/create")}
                    >
                      <Plus className="size-4" /> Create your first agent
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
            </div>
            )}
          </div>
          </div>{/* end inner flex-col */}

          {/* Right conversation panel — fixed 400px for kudos; other agents may expand chat */}
          <div className="flex h-full min-h-0 flex-shrink-0 overflow-hidden">
          <AnimatePresence>
            {selectedAgent && isKudosAgent && !hideKudosChatPanel && (
              <KudosConversationPanel
                key="kudos-panel"
                workflow={kudosWorkflow}
                isExpanded={false}
                onToggleExpand={() => setIsConversationExpanded((prev) => !prev)}
                onClose={handleClosePanel}
                expandPreviewLabel
              />
            )}
            {selectedAgent && !isKudosAgent && (
              <AgentConversationPanel
                key={selectedAgent.id}
                agent={selectedAgent}
                isExpanded={isConversationExpanded}
                onToggleExpand={() => setIsConversationExpanded((prev) => !prev)}
                onClose={handleClosePanel}
              />
            )}
          </AnimatePresence>
          </div>
        </div>{/* end flex row */}
      </main>
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
      <ForkDialog
        open={!!agentPendingFork}
        onOpenChange={(open) => { if (!open) setAgentPendingFork(null); }}
        kind="agent"
        source={agentPendingFork}
        permissions={forkPermissions}
        onNavigate={(page) => navigate(PAGE_PATH[page] ?? "/agents")}
        onNotify={showToast}
        onFork={handleForkAgent}
      />
      <Dialog open={!!agentPendingPublish} onOpenChange={(open) => { if (!publishBusy && !open) setAgentPendingPublish(null); }}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,720px)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl sm:w-full"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DialogHeader className="relative px-6 pt-6 pb-2 pr-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/25">
                <Globe className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <DialogTitle className="text-balance text-center text-lg font-semibold leading-snug text-foreground">
                Publish this agent?
              </DialogTitle>
              <DialogDescription asChild>
                <div className="px-1 pt-2 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {agentPendingPublish?.name || "This agent"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You can unpublish at any time from the agent&apos;s settings.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="mx-6 mb-4 mt-4 space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <PublishScopePicker
                value={publishScopeChoice}
                onChange={setPublishScopeChoice}
                orgName={orgName}
                canPublishMarketplace={can("marketplace.publish")}
              />
              {agentPendingPublish ? (
                <PublishAgentMarketplaceDetails agent={agentPendingPublish} />
              ) : null}
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
              Keep Private
            </Button>
            <Button
              type="button"
              className="min-h-10 flex-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={publishBusy}
              onClick={() => {
                if (!agentPendingPublish) return;
                setPublishBusy(true);
                try {
                  const scope = can("marketplace.publish")
                    ? publishScopeChoice
                    : PUBLISH_SCOPES.ORG;
                  handleSetPublishScope(agentPendingPublish.id, scope);
                  const agentName = agentPendingPublish.name;
                  setAgentPendingPublish(null);
                  showToast(publishSuccessMessage(agentName, scope, orgName));
                  if (scope === PUBLISH_SCOPES.MARKETPLACE) {
                    onNavigate?.("marketplace");
                  }
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
            <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-warning/15 dark:bg-amber-950">
              <Globe className="h-6 w-6 text-warning dark:text-amber-400" aria-hidden />
            </div>
            <DialogTitle className="text-balance text-center text-lg font-semibold leading-snug">
              Unpublish "{agentPendingUnpublish?.name || "this agent"}"?
            </DialogTitle>
            <DialogDescription className="text-balance pt-2 text-center text-sm leading-relaxed text-muted-foreground">
              {agentPendingUnpublish
                ? unpublishScopeMessage(agentPendingUnpublish, orgName)
                : "This agent will be hidden from other users and no longer listed as public."}
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
                  handleSetPublishScope(agentPendingUnpublish.id, PUBLISH_SCOPES.PRIVATE);
                  showToast(`"${agentPendingUnpublish.name}" unpublished — status set to Private.`);
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
      <LabelManageDialog
        open={manageLabelsOpen}
        onOpenChange={setManageLabelsOpen}
        agents={agents}
        onAgentsChange={setAgents}
      />
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
      ))}
    </>
  );
}
