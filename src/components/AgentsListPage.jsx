import { useState, useRef, useEffect } from "react";
import { Plus, MoreVertical, Bot, Pencil, Copy, Trash2, LayoutGrid, List, ChevronUp, ChevronDown, ChevronsUpDown, Eye, Cpu, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import ExpandableSearch from "@/components/ExpandableSearch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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

// Animated count — springs from 0 to target on mount
function AnimCount({ to, className = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 700;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * to));
      if (t < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className={className}>{val}</span>;
}

// Figma asset URLs
const imgAvatarRobot = "https://www.figma.com/api/mcp/asset/30669545-e841-413b-80af-a7db03ab0d8c";
const imgOpenAI = "https://www.figma.com/api/mcp/asset/8933db25-5a1e-4a78-ae17-f0251297e0e4";

const agents = [
  { id: 0,  name: "Customer Appreciation",   description: "AI-powered recognition workflow that creates personalized appreciation cards and messages for clients.",                        date: "23 Mar 2025", provider: "OpenAI",    model: "GPT-4.5",        status: "active",   lastRun: "2 min ago",   success: 98,  accessEnabled: true  },
  { id: 1,  name: "CV Agent",                description: "Streamlines resume creation with smart suggestions and formatting to help you stand out in any application.",                date: "23 Mar 2025", provider: "OpenAI",    model: "GPT-4.5",        status: "active",   lastRun: "1h ago",      success: 94,  accessEnabled: true  },
  { id: 2,  name: "Portfolio Builder",       description: "Creates and curates a personalized portfolio showcasing your best work and achievements effectively.",                        date: "15 Apr 2025", provider: "Anthropic", model: "Claude 3.5",     status: "idle",     lastRun: "3h ago",      success: 87,  accessEnabled: false },
  { id: 3,  name: "Job Matcher",             description: "Intelligently matches you with job listings based on your skills, experience, and career preferences.",                      date: "10 May 2025", provider: "OpenAI",    model: "GPT-4o",         status: "idle",     lastRun: "Yesterday",   success: 91,  accessEnabled: false },
  { id: 4,  name: "Interview Coach",         description: "Prepares you for interviews with practice questions, feedback, and real-time personalized coaching.",                        date: "01 Jun 2025", provider: "Anthropic", model: "Claude 3.5",     status: "active",   lastRun: "30 min ago",  success: 96,  accessEnabled: true  },
  { id: 5,  name: "Skill Tracker",           description: "Monitors your skill development progress and recommends tailored learning paths for continuous growth.",                     date: "20 Jun 2025", provider: "OpenAI",    model: "GPT-4.5",        status: "error",    lastRun: "2h ago",      success: 62,  accessEnabled: false },
  { id: 6,  name: "Networking Assistant",    description: "Helps you build and maintain professional connections on LinkedIn and other major platforms.",                               date: "30 Jul 2025", provider: "Anthropic", model: "Claude 3 Haiku", status: "idle",     lastRun: "2 days ago",  success: 89,  accessEnabled: false },
  { id: 7,  name: "Salary Insights",         description: "Provides data-driven salary benchmarks and effective negotiation strategies for your specific role.",                        date: "12 Aug 2025", provider: "OpenAI",    model: "GPT-4o",         status: "active",   lastRun: "15 min ago",  success: 100, accessEnabled: true  },
  { id: 8,  name: "Freelance Finder",        description: "Discovers freelance opportunities that precisely match your expertise and hourly rate expectations.",                        date: "25 Sep 2025", provider: "OpenAI",    model: "GPT-4.5",        status: "idle",     lastRun: "5h ago",      success: 83,  accessEnabled: false },
  { id: 9,  name: "Profile Enhancer",        description: "Optimizes your professional profiles on major job platforms to maximize your visibility to recruiters.",                     date: "05 Oct 2025", provider: "Anthropic", model: "Claude 3.5",     status: "disabled", lastRun: "1 week ago",  success: 78,  accessEnabled: false },
  { id: 10, name: "Job Application Tracker", description: "Keeps track of all your job applications, deadlines, follow-up actions, and application statuses.",                         date: "15 Nov 2025", provider: "OpenAI",    model: "GPT-4o mini",    status: "active",   lastRun: "5 min ago",   success: 99,  accessEnabled: false },
  { id: 11, name: "Resume Analyzer",         description: "Analyzes your resume and provides specific, actionable feedback to significantly improve your success rates.",               date: "03 Dec 2025", provider: "Anthropic", model: "Claude 3.5",     status: "active",   lastRun: "45 min ago",  success: 93,  accessEnabled: true  },
  { id: 12, name: "Cover Letter Generator",  description: "Generates compelling and personalized cover letters precisely tailored to each individual job posting.",                     date: "20 Jan 2026", provider: "OpenAI",    model: "GPT-4.5",        status: "idle",     lastRun: "Yesterday",   success: 90,  accessEnabled: false },
  { id: 13, name: "Skill Assessment",        description: "Evaluates your technical and soft skills through engaging interactive assessments and practical quizzes.",                   date: "28 Feb 2026", provider: "OpenAI",    model: "GPT-4o",         status: "error",    lastRun: "3h ago",      success: 55,  accessEnabled: false },
  { id: 14, name: "Personal Branding",       description: "Helps you craft a strong and consistent personal brand narrative across all professional channels.",                         date: "15 Mar 2026", provider: "Anthropic", model: "Claude 3 Haiku", status: "idle",     lastRun: "4 days ago",  success: 85,  accessEnabled: false },
  { id: 15, name: "Career Path Explorer",    description: "Maps out potential career trajectories based on your unique goals and current market demand trends.",                        date: "12 Apr 2026", provider: "OpenAI",    model: "GPT-4.5",        status: "active",   lastRun: "1h ago",      success: 97,  accessEnabled: true  },
  { id: 16, name: "Mentorship Match",        description: "Connects you with experienced mentors in your industry for personalized guidance and ongoing support.",                      date: "29 Apr 2026", provider: "Anthropic", model: "Claude 3.5",     status: "disabled", lastRun: "2 weeks ago", success: 72,  accessEnabled: false },
  { id: 17, name: "Industry News Alerts",    description: "Curates and delivers relevant industry news and emerging trends to keep you consistently informed.",                         date: "10 May 2026", provider: "OpenAI",    model: "GPT-4o mini",    status: "active",   lastRun: "10 min ago",  success: 100, accessEnabled: false },
  { id: 18, name: "Work-Life Balance Tracker", description: "Monitors your work patterns and suggests practical strategies for achieving a healthier balance.",                        date: "25 Jun 2026", provider: "Anthropic", model: "Claude 3 Haiku", status: "idle",     lastRun: "1 week ago",  success: 81,  accessEnabled: false },
  { id: 19, name: "Continuous Learning Hub", description: "Recommends and tracks online courses and certifications to support your ongoing professional development.",                  date: "15 Jul 2026", provider: "OpenAI",    model: "GPT-4o",         status: "idle",     lastRun: "3 days ago",  success: 88,  accessEnabled: false },
];

const PROVIDER_LOGOS = {
  OpenAI:    imgOpenAI,
  Anthropic: null,
};

const STATUS_CONFIG = {
  active:   { label: "Active",   dot: "#22c55e", bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  idle:     { label: "Idle",     dot: "#94a3b8", bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
  error:    { label: "Error",    dot: "#ef4444", bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  disabled: { label: "Disabled", dot: "#cbd5e1", bg: "#f8fafc", text: "#94a3b8", border: "#e2e8f0" },
};

const STATUS_FILTERS = ["All", "Active", "Idle", "Error", "Disabled"];
const PROVIDER_FILTERS = ["All", "OpenAI", "Anthropic"];

// ─── Provider logo / avatar ───────────────────────────────────────────────────

function ProviderLogo({ provider, size = 4 }) {
  const logo = PROVIDER_LOGOS[provider];
  const cls = `size-${size} object-contain flex-shrink-0`;
  if (logo) return <img src={logo} alt={provider} className={cls} />;
  return (
    <div className={`size-${size} rounded bg-[#e0e7ff] flex items-center justify-center flex-shrink-0`}>
      <span className="text-[8px] font-bold text-[#4f46e5]">{provider[0]}</span>
    </div>
  );
}

// ─── Agent avatar ─────────────────────────────────────────────────────────────

function AgentAvatar({ size = "lg", name = "" }) {
  const dim   = size === "sm" ? "size-8" : "size-12";
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
      <img src={imgAvatarRobot} alt="" className="w-[55%] h-[55%] object-contain relative z-10" style={{ opacity: 0.7, filter: `drop-shadow(0 0 4px ${g1}60)` }} />
    </div>
  );
}

// ─── Success bar ─────────────────────────────────────────────────────────────

function SuccessBar({ pct }) {
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ─── Agent card (grid view) ───────────────────────────────────────────────────

function AgentCard({ agent, openMenu, setOpenMenu, onOpen, onView }) {
  const isMenuOpen = openMenu === agent.id;
  const statusCfg  = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const btnRef     = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    {confirmDelete && (
      <ConfirmDialog
        title={`Delete "${agent.name}"?`}
        message="This agent will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        onConfirm={() => setConfirmDelete(false)}
        onCancel={() => setConfirmDelete(false)}
      />
    )}
    <div
      className="group bg-white border border-[#e2e8f0] rounded-[8px] p-2 flex flex-col gap-2 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
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
              <div className="bg-[#dc2626] border-2 border-[#f8fafc] rounded-full size-2 flex-shrink-0" />
            )}
            <p className="flex-1 text-base font-medium text-[#0f172a] leading-6 truncate">
              {agent.name}
            </p>
            <button
              ref={btnRef}
              onClick={handleMenuToggle}
              aria-label="Agent options"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              className="flex items-center justify-center size-8 rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>
          </div>
          <p
            className="text-xs text-[#64748b] leading-4 tracking-[0.12px] overflow-hidden"
            style={{ height: 35, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
          >
            {agent.description}
          </p>
        </div>
      </div>

      <div className="h-px bg-[#e2e8f0] w-full flex-shrink-0" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#64748b] leading-4 whitespace-nowrap">{agent.date}</span>
        <div className="flex items-center gap-1">
          <ProviderLogo provider={agent.provider} size={3} />
          <span className="text-xs font-medium text-[#64748b] leading-4 whitespace-nowrap">{agent.model}</span>
        </div>
      </div>

      {/* Context menu — fixed so it escapes any overflow:hidden ancestor */}
      {isMenuOpen && (
        <div
          className="fixed z-[9999] bg-white border border-[#e2e8f0] rounded-[10px] overflow-hidden w-[160px]"
          style={{ top: menuPos.top, left: menuPos.left, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { setOpenMenu(null); onView?.(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
            <Eye size={14} className="text-[#64748b]" /> View
          </button>
          <button onClick={() => { setOpenMenu(null); onOpen(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
            <Bot size={14} className="text-[#64748b]" /> Open
          </button>
          <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
            <Pencil size={14} className="text-[#64748b]" /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
            <Copy size={14} className="text-[#64748b]" /> Duplicate
          </button>
          <div className="h-px bg-[#e2e8f0]" />
          <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); setConfirmDelete(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors">
            <Trash2 size={14} className="text-[#ef4444]" /> Delete
          </button>
        </div>
      )}
    </div>
    </>
  );
}

// ─── Agent table row (list view) ──────────────────────────────────────────────

function AgentRow({ agent, openMenu, setOpenMenu, onOpen, onView, zebra }) {
  const isMenuOpen  = openMenu === agent.id;
  const statusCfg   = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const [hovered, setHovered] = useState(false);
  const rowBtnRef   = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    {confirmDelete && (
      <ConfirmDialog
        title={`Delete "${agent.name}"?`}
        message="This agent will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        onConfirm={() => setConfirmDelete(false)}
        onCancel={() => setConfirmDelete(false)}
      />
    )}
    <tr
      className={`group border-b border-[#f1f5f9] transition-all duration-150 cursor-pointer ${zebra ? "bg-[#fafafa]" : "bg-white"}`}
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
        <p className="text-sm font-medium text-[#0f172a] truncate max-w-[220px]">{agent.name}</p>
        <p className="text-xs text-[#94a3b8] truncate max-w-[220px]">{agent.date}</p>
      </td>

      {/* Provider / Model */}
      <td className="px-3 py-2.5 w-[180px]">
        <div className="flex items-center gap-1.5">
          <ProviderLogo provider={agent.provider} size={4} />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#475569] leading-none">{agent.provider}</span>
            <span className="text-[11px] text-[#94a3b8] leading-none">{agent.model}</span>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 w-[120px]">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border"
          style={{ color: statusCfg.text, backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}
        >
          <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.dot }} />
          {statusCfg.label}
        </span>
      </td>

      {/* Last run */}
      <td className="px-3 py-2.5 w-[120px]">
        <span className="text-xs text-[#64748b]">{agent.lastRun}</span>
      </td>

      {/* Success rate */}
      <td className="px-3 py-2.5 w-[140px]">
        <SuccessBar pct={agent.success} />
      </td>

      {/* Access */}
      <td className="px-3 py-2.5 w-[100px]">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
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
            className="flex items-center justify-center size-7 rounded-[6px] text-[#94a3b8] hover:bg-[#e2e8f0] hover:text-[#475569] transition-colors opacity-30 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <div
              className="fixed z-[9999] bg-white border border-[#e2e8f0] rounded-[10px] overflow-hidden w-[160px]"
              style={{ top: menuPos.top, left: menuPos.left, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { setOpenMenu(null); onView?.(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <Eye size={13} className="text-[#64748b]" /> View
              </button>
              <button onClick={() => { setOpenMenu(null); onOpen(agent); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <Bot size={13} className="text-[#64748b]" /> Open
              </button>
              <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <Pencil size={13} className="text-[#64748b]" /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <Copy size={13} className="text-[#64748b]" /> Duplicate
              </button>
              <div className="h-px bg-[#e2e8f0]" />
              <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); setConfirmDelete(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors">
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
        <span className={`text-[11px] font-bold tracking-[0.06em] uppercase ${active ? "text-[#2563eb]" : "text-[#94a3b8]"}`}>
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

// ─── Filter dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ statusFilter, setStatusFilter, providerFilter, setProviderFilter, onClear }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const activeCount = (statusFilter !== "All" ? 1 : 0) + (providerFilter !== "All" ? 1 : 0);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-9 px-3 rounded-[6px] border text-sm font-medium transition-colors ${
          activeCount > 0
            ? "bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]"
            : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#475569]"
        }`}
      >
        <SlidersHorizontal size={14} />
        Filters
        {activeCount > 0 && (
          <span className="flex items-center justify-center size-4 rounded-full bg-[#2563eb] text-white text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-30 bg-white border border-[#e2e8f0] rounded-[10px] shadow-lg w-[260px] p-3 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0f172a] uppercase tracking-[0.06em]">Filters</span>
            {activeCount > 0 && (
              <button onClick={onClear} className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors">
                <X size={11} /> Clear all
              </button>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.06em]">Status</span>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((s) => {
                const isActive = statusFilter === s;
                const cfg = STATUS_CONFIG[s.toLowerCase()];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isActive
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]"
                    }`}
                  >
                    {cfg && !isActive && (
                      <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
                    )}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.06em]">Provider</span>
            <div className="flex flex-wrap gap-1">
              {PROVIDER_FILTERS.map((p) => {
                const isActive = providerFilter === p;
                const logo = p !== "All" ? PROVIDER_LOGOS[p] : null;
                return (
                  <button
                    key={p}
                    onClick={() => setProviderFilter(p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isActive
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]"
                    }`}
                  >
                    {logo && !isActive && <img src={logo} alt={p} className="size-3 object-contain" />}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsListPage({ onNavigate, onOpenAgent, onViewAgent, sidebarCollapsed, onToggleSidebar }) {
  const [searchQuery, setSearchQuery]   = useState("");
  const [openMenu, setOpenMenu]         = useState(null);
  const [viewMode, setViewMode]         = useState("grid");
  const [sort, setSort]                 = useState({ key: "name", dir: "asc" });
  const [statusFilter, setStatusFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  // Derived stats
  const total    = agents.length;
  const active   = agents.filter((a) => a.status === "active").length;
  const errCount = agents.filter((a) => a.status === "error").length;
  const idle     = agents.filter((a) => a.status === "idle").length;

  const filtered = agents
    .filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((a) => statusFilter === "All"   || a.status   === statusFilter.toLowerCase())
    .filter((a) => providerFilter === "All" || a.provider === providerFilter)
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

  return (
    <>
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}

      <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} activePage="agents" onNavigate={onNavigate} />

        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader onToggleSidebar={onToggleSidebar} onNavigate={onNavigate} />

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

                  <FilterDropdown
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    providerFilter={providerFilter}
                    setProviderFilter={setProviderFilter}
                    onClear={() => { setStatusFilter("All"); setProviderFilter("All"); }}
                  />

                  {/* Active filter chips */}
                  <AnimatePresence>
                    {statusFilter !== "All" && (
                      <motion.button
                        key="status-chip"
                        initial={{ opacity: 0, scale: 0.8, x: -6 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -6 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setStatusFilter("All")}
                        className="flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-semibold border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] transition-colors"
                      >
                        {statusFilter}
                        <X size={10} />
                      </motion.button>
                    )}
                    {providerFilter !== "All" && (
                      <motion.button
                        key="provider-chip"
                        initial={{ opacity: 0, scale: 0.8, x: -6 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -6 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setProviderFilter("All")}
                        className="flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-semibold border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] transition-colors"
                      >
                        {providerFilter}
                        <X size={10} />
                      </motion.button>
                    )}
                  </AnimatePresence>

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

                  <button className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 h-9 rounded-[6px] transition-colors flex-shrink-0">
                    <Plus size={16} />
                    Create Agent
                  </button>
                </div>
              </div>

              {/* Summary bar */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#64748b]">
                  <AnimCount to={total} className="font-semibold text-[#0f172a]" /> agents
                </span>
                <span className="text-[#e2e8f0]">·</span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="size-2 rounded-full bg-[#22c55e]" />
                  <AnimCount to={active} className="font-semibold text-[#15803d]" />
                  <span className="text-[#64748b]">active</span>
                </span>
                <span className="text-[#e2e8f0]">·</span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="size-2 rounded-full bg-[#94a3b8]" />
                  <AnimCount to={idle} className="font-semibold text-[#475569]" />
                  <span className="text-[#64748b]">idle</span>
                </span>
                {errCount > 0 && (
                  <>
                    <span className="text-[#e2e8f0]">·</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="size-2 rounded-full bg-[#ef4444]" />
                      <AnimCount to={errCount} className="font-semibold text-[#dc2626]" />
                      <span className="text-[#64748b]">errors</span>
                    </span>
                  </>
                )}
              </div>

              {/* Agent grid / list */}
              {filtered.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onOpen={onOpenAgent}
                        onView={onViewAgent}
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
                            onOpen={onOpenAgent}
                            onView={onViewAgent}
                            zebra={i % 2 !== 0}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="size-14 bg-[#f1f5f9] rounded-[12px] flex items-center justify-center">
                    <Cpu size={28} className="text-[#94a3b8]" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-semibold text-[#0f172a]">No agents found</p>
                    <p className="text-sm text-[#64748b]">Try adjusting your search or filters.</p>
                  </div>
                  <button
                    onClick={() => { setSearchQuery(""); setStatusFilter("All"); setProviderFilter("All"); }}
                    className="text-sm font-medium text-[#2563eb] hover:underline"
                  >
                    Clear filters
                  </button>
                  <button className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 h-9 rounded-[6px] transition-colors">
                    <Plus size={16} /> Create your first agent
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
