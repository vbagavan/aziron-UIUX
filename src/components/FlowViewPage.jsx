import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft, Play, Save, MoreHorizontal, ChevronDown, ChevronRight, ChevronLeft,
  ZoomIn, ZoomOut, Crosshair, CheckCircle2, AlertCircle, Clock, Circle,
  Bot, Database, Mail, Webhook, FileText, Globe, Zap, GitBranch,
  Terminal, History, X, Plus, Search, Layers, PanelLeft,
  Settings2, Code2, Info, Activity, Cpu, RefreshCw, AlertTriangle,
  PauseCircle, MousePointer, GitMerge,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

// ─── Constants ─────────────────────────────────────────────────────────────────
const NODE_W = 200;
const NODE_H = 76;
const H_GAP  = 110;
const PAD_X  = 80;
const NODE_Y = 190;

const ICON_MAP = { Bot, Database, Mail, Webhook, FileText, Globe, Zap, GitBranch, GitMerge };

// ─── Per-node type fake config ─────────────────────────────────────────────────
const NODE_CONFIGS = {
  Webhook:   { type: "Trigger",   fields: [["URL","https://hooks.aziron.ai/v1/inbound"],["Method","POST"],["Auth","Bearer Token"],["Payload","JSON"]] },
  Database:  { type: "Data",      fields: [["Connection","CRM-Production"],["Operation","Lookup & Enrich"],["Key Field","email"],["Fallback","Skip record"]] },
  Bot:       { type: "AI Agent",  fields: [["Model","Claude Sonnet 4.6"],["Temperature","0.3"],["Max Tokens","512"],["Prompt","Contextual scoring…"]] },
  Mail:      { type: "Action",    fields: [["To","{{lead.email}}"],["Subject","Welcome to Aziron"],["Template","Sequence #1"],["Delay","0 ms"]] },
  Zap:       { type: "Transform", fields: [["Input","{{prev.output}}"],["Script","score > 70 → HIGH"],["Output","lead.score, lead.tier"],["On Error","Skip"]] },
  FileText:  { type: "Document",  fields: [["Source","{{input.file}}"],["Parser","PDF / DOCX"],["Fields","All"],["Encoding","UTF-8"]] },
  Globe:     { type: "HTTP",      fields: [["URL","https://api.example.com/data"],["Method","GET"],["Auth","API Key"],["Timeout","5 000 ms"]] },
  GitBranch: { type: "Logic",     fields: [["Condition","{{score}} > 70"],["True path","Send email"],["False path","Archive"],["Strict","Yes"]] },
};

const EXEC_STATUS = {
  active:  (i, n) => i < n - 1 ? "success" : "success",
  error:   (i, n) => i < n - 1 ? "success" : "error",
  paused:  (i, n) => i < Math.ceil(n / 2) ? "success" : "pending",
  draft:   ()     => "pending",
};

function getExecStatus(flowStatus, stepIdx, total) {
  return (EXEC_STATUS[flowStatus] ?? EXEC_STATUS.draft)(stepIdx, total);
}

const STEP_EXEC = {
  success: { color: "#22c55e", bg: "#dcfce7", ring: "#bbf7d0", Icon: CheckCircle2, label: "Success" },
  error:   { color: "#ef4444", bg: "#fef2f2", ring: "#fecaca", Icon: AlertCircle,  label: "Error"   },
  pending: { color: "#94a3b8", bg: "#f1f5f9", ring: "#e2e8f0", Icon: Circle,       label: "Pending" },
  running: { color: "#3b82f6", bg: "#dbeafe", ring: "#bfdbfe", Icon: RefreshCw,    label: "Running" },
};

// ─── Log generator ─────────────────────────────────────────────────────────────
function buildLogs(flow) {
  const lines = [];
  let ms = 0;
  const fmt = (d) => {
    const h = String(15).padStart(2,"0");
    const m = String(49).padStart(2,"0");
    const s = String(Math.floor(d / 1000)).padStart(2,"0");
    const ms = String(d % 1000).padStart(3,"0");
    return `${h}:${m}:${s}.${ms}`;
  };
  lines.push({ ts: fmt(ms), level: "INFO",    msg: `Flow "${flow.name}" triggered` });
  flow.steps.forEach((step, i) => {
    ms += 60 + Math.round(Math.random() * 80);
    lines.push({ ts: fmt(ms), level: "INFO", msg: `Step ${i+1} — ${step.label}: started` });
    ms += 200 + Math.round(Math.random() * 300);
    const exec = getExecStatus(flow.status, i, flow.steps.length);
    if (exec === "error") {
      lines.push({ ts: fmt(ms), level: "ERROR", msg: `Step ${i+1} — ${step.label}: failed — connection timeout` });
    } else if (exec === "pending") {
      lines.push({ ts: fmt(ms), level: "WARN", msg: `Step ${i+1} — ${step.label}: waiting for upstream` });
    } else {
      lines.push({ ts: fmt(ms), level: "SUCCESS", msg: `Step ${i+1} — ${step.label}: completed in ${ms}ms` });
    }
  });
  lines.push({ ts: fmt(ms + 10), level: "INFO", msg: `Run completed — total ${ms}ms` });
  return lines;
}

const LOG_COLORS = {
  INFO:    "text-[#64748b]",
  SUCCESS: "text-[#16a34a]",
  ERROR:   "text-[#dc2626]",
  WARN:    "text-[#d97706]",
};
const LOG_BADGES = {
  INFO:    "bg-[#f1f5f9] text-[#64748b]",
  SUCCESS: "bg-[#dcfce7] text-[#15803d]",
  ERROR:   "bg-[#fef2f2] text-[#dc2626]",
  WARN:    "bg-[#fef9c3] text-[#a16207]",
};

// ─── Left nav node palette data ────────────────────────────────────────────────
const NODE_PALETTE = [
  { cat: "Triggers",  color: "#6366f1", nodes: [{ icon: Webhook, label: "Webhook" },{ icon: Clock, label: "Schedule" },{ icon: Mail, label: "Email In" }] },
  { cat: "AI Agents", color: "#8b5cf6", nodes: [{ icon: Bot, label: "Claude" },{ icon: Cpu, label: "GPT-4o" },{ icon: Zap, label: "Custom LLM" }] },
  { cat: "Data",      color: "#3b82f6", nodes: [{ icon: Database, label: "Database" },{ icon: FileText, label: "Document" },{ icon: Globe, label: "HTTP" }] },
  { cat: "Actions",   color: "#06b6d4", nodes: [{ icon: Mail, label: "Send Email" },{ icon: Webhook, label: "Webhook Out" }] },
  { cat: "Logic",     color: "#f59e0b", nodes: [{ icon: GitBranch, label: "If / Else" },{ icon: GitMerge, label: "Merge" }] },
];

// ─── Canvas node component ─────────────────────────────────────────────────────
function CanvasNode({ step, index, x, y, selected, execStatus, onClick }) {
  const Icon = ICON_MAP[step.icon] ?? Zap;
  const exec = STEP_EXEC[execStatus] ?? STEP_EXEC.pending;
  const ExecIcon = exec.Icon;

  return (
    <g onClick={() => onClick(index)} style={{ cursor: "pointer" }}>
      {/* Selection ring */}
      {selected && (
        <rect x={x - 4} y={y - 4} width={NODE_W + 8} height={NODE_H + 8}
          rx={14} fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="6 3" opacity={0.8} />
      )}
      {/* Card shadow */}
      <rect x={x + 2} y={y + 3} width={NODE_W} height={NODE_H} rx={10}
        fill="rgba(0,0,0,0.06)" />
      {/* Card background */}
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={10}
        fill="white" stroke={selected ? "#2563eb" : "#e2e8f0"} strokeWidth={selected ? 1.5 : 1} />
      {/* Left color accent */}
      <rect x={x} y={y + 8} width={4} height={NODE_H - 16} rx={2} fill={step.color} />
      {/* Status badge - top right */}
      <circle cx={x + NODE_W - 14} cy={y + 14} r={7} fill={exec.bg} stroke={exec.ring} strokeWidth={1} />
      <foreignObject x={x + NODE_W - 20} y={y + 7.5} width={14} height={14}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="flex items-center justify-center size-full">
          <ExecIcon size={9} color={exec.color} />
        </div>
      </foreignObject>
      {/* Icon circle */}
      <circle cx={x + 34} cy={y + NODE_H / 2} r={17}
        fill={`${step.color}18`} stroke={`${step.color}35`} strokeWidth={1} />
      <foreignObject x={x + 20} y={y + NODE_H / 2 - 11} width={28} height={22}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="flex items-center justify-center size-full">
          <Icon size={14} color={step.color} />
        </div>
      </foreignObject>
      {/* Step number */}
      <text x={x + 34} y={y + NODE_H / 2 + 28} textAnchor="middle"
        fontSize={8} fill={step.color} fontWeight={600} opacity={0.7}>{`0${index + 1}`}</text>
      {/* Label */}
      <text x={x + 62} y={y + 28} fontSize={12} fontWeight={600} fill="#0f172a">{step.label}</text>
      {/* Type tag */}
      <rect x={x + 62} y={y + 36} width={72} height={15} rx={4}
        fill={`${step.color}15`} />
      <text x={x + 98} y={y + 47} textAnchor="middle" fontSize={9} fill={step.color} fontWeight={500}>
        {NODE_CONFIGS[step.icon]?.type ?? "Step"}
      </text>
      {/* Exec label */}
      <text x={x + 62} y={y + NODE_H - 10} fontSize={9} fill={exec.color} fontWeight={500}>
        {exec.label}
      </text>
      {/* Output port */}
      <circle cx={x + NODE_W} cy={y + NODE_H / 2} r={5}
        fill="white" stroke={selected ? "#2563eb" : "#cbd5e1"} strokeWidth={1.5} />
      {/* Input port */}
      {index > 0 && (
        <circle cx={x} cy={y + NODE_H / 2} r={5}
          fill="white" stroke={selected ? "#2563eb" : "#cbd5e1"} strokeWidth={1.5} />
      )}
    </g>
  );
}

// ─── Bezier connection ─────────────────────────────────────────────────────────
function Connection({ x1, y1, x2, y2, color }) {
  const cp = (x2 - x1) * 0.45;
  const d = `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  return (
    <>
      <path d={d} fill="none" stroke="#e2e8f0" strokeWidth={2} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5} strokeDasharray="5 4" />
    </>
  );
}

// ─── Right panel ───────────────────────────────────────────────────────────────
function RightPanel({ flow, selectedIdx }) {
  const [tab, setTab] = useState("inspector");
  const step = selectedIdx !== null ? flow.steps[selectedIdx] : null;
  const cfg  = step ? (NODE_CONFIGS[step.icon] ?? {}) : null;
  const exec = step ? getExecStatus(flow.status, selectedIdx, flow.steps.length) : null;
  const execInfo = exec ? STEP_EXEC[exec] : null;

  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col border-l border-[#e2e8f0] bg-white overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center border-b border-[#e2e8f0] flex-shrink-0 px-1">
        {[
          { id: "inspector", icon: MousePointer, label: "Inspector" },
          { id: "settings",  icon: Settings2,    label: "Settings"  },
          { id: "history",   icon: History,      label: "History"   },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-selected={tab === id}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "inspector" && (
          <div className="flex flex-col">
            {step ? (
              <>
                {/* Node header */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-[#f1f5f9]">
                  {(() => { const Icon = ICON_MAP[step.icon] ?? Zap; return (
                    <div className="size-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                      style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}>
                      <Icon size={18} style={{ color: step.color }} />
                    </div>
                  ); })()}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a]">{step.label}</p>
                    <span className="text-xs text-[#64748b]">{cfg?.type ?? "Node"} · Step {selectedIdx + 1}</span>
                  </div>
                  {execInfo && (
                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: execInfo.bg, color: execInfo.color }}>
                      {execInfo.label}
                    </span>
                  )}
                </div>

                {/* Configuration */}
                <div className="px-4 py-3 border-b border-[#f1f5f9]">
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3">Configuration</p>
                  <div className="flex flex-col gap-2.5">
                    {(cfg?.fields ?? []).map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wide">{k}</span>
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5">
                          <span className="text-xs text-[#0f172a] font-mono break-all">{v}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last execution */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3">Last Execution</p>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-[#64748b]">Status</span>
                      <span className="font-medium" style={{ color: execInfo?.color }}>{execInfo?.label}</span></div>
                    <div className="flex justify-between"><span className="text-[#64748b]">Duration</span>
                      <span className="font-medium text-[#0f172a]">{230 + selectedIdx * 80}ms</span></div>
                    <div className="flex justify-between"><span className="text-[#64748b]">Records</span>
                      <span className="font-medium text-[#0f172a]">1</span></div>
                    <div className="flex justify-between"><span className="text-[#64748b]">Last run</span>
                      <span className="font-medium text-[#0f172a]">{flow.lastRun}</span></div>
                  </div>
                </div>
              </>
            ) : (
              /* Nothing selected */
              <div className="flex flex-col gap-5 px-4 py-5">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Flow Overview</p>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  {[
                    ["Name",      flow.name],
                    ["Status",    flow.status.charAt(0).toUpperCase() + flow.status.slice(1)],
                    ["Steps",     flow.steps.length],
                    ["Total Runs", flow.runs.toLocaleString()],
                    ["Success",   flow.success != null ? `${flow.success}%` : "—"],
                    ["Last Run",  flow.lastRun],
                    ["Created",   flow.createdAt],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1.5 border-b border-[#f8fafc]">
                      <span className="text-[#64748b]">{k}</span>
                      <span className="font-medium text-[#0f172a] text-right max-w-[180px] truncate">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-xs text-[#64748b] flex items-start gap-2">
                  <Info size={12} className="flex-shrink-0 mt-0.5 text-[#94a3b8]" />
                  Click any node on the canvas to inspect its configuration and last execution result.
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="flex flex-col gap-4 px-4 py-4">
            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Flow Settings</p>
            {[
              { label: "Execution mode",   value: "Sequential" },
              { label: "Retry on error",   value: "3 times" },
              { label: "Timeout",          value: "30 s" },
              { label: "Concurrency",      value: "1" },
              { label: "Error handling",   value: "Stop flow" },
              { label: "Logging level",    value: "INFO" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wide">{label}</span>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5">
                  <span className="text-xs text-[#0f172a]">{value}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Recent Runs</p>
            </div>
            {[
              { id: "run_8f3a", ts: flow.lastRun,  dur: "1.82s", status: flow.status === "error" ? "Failed" : "Success" },
              { id: "run_7e2b", ts: "2h ago",       dur: "1.74s", status: "Success" },
              { id: "run_6d1c", ts: "5h ago",       dur: "2.01s", status: "Success" },
              { id: "run_5c0a", ts: "Yesterday",    dur: "3.20s", status: flow.status === "error" ? "Failed" : "Success" },
              { id: "run_4b9f", ts: "2 days ago",   dur: "1.91s", status: "Success" },
            ].map((run) => (
              <div key={run.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-mono text-[#0f172a]">{run.id}</span>
                  <span className="text-[10px] text-[#94a3b8]">{run.ts} · {run.dur}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  run.status === "Success" ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fef2f2] text-[#dc2626]"
                }`}>{run.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bottom panel (logs) ───────────────────────────────────────────────────────
function BottomPanel({ flow, collapsed, onToggle }) {
  const [logTab, setLogTab] = useState("log");
  const logs = buildLogs(flow);

  return (
    <div
      className="flex-shrink-0 border-t border-[#e2e8f0] bg-[#0f172a] flex flex-col transition-all duration-300 overflow-hidden"
      style={{ height: collapsed ? 40 : 240 }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 h-10 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center gap-1">
          {[
            { id: "log",     Icon: Terminal, label: "Execution Log" },
            { id: "history", Icon: History,  label: "Run History"  },
          ].map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setLogTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                logTab === id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">{logs.length} entries</span>
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand log panel" : "Collapse log panel"}
            className="flex items-center justify-center size-6 rounded-[4px] text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronDown size={13} /> : <ChevronDown size={13} className="rotate-180" />}
          </button>
        </div>
      </div>

      {/* Log content */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto font-mono text-xs py-2 px-4 flex flex-col gap-0.5">
          {logTab === "log" ? (
            logs.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 py-0.5 hover:bg-white/5 rounded px-1 transition-colors">
                <span className="text-white/30 flex-shrink-0 tabular-nums">{entry.ts}</span>
                <span className={`flex-shrink-0 w-[52px] text-center px-1 py-0.5 rounded text-[9px] font-bold uppercase ${LOG_BADGES[entry.level]}`}>
                  {entry.level}
                </span>
                <span className={`leading-4 ${LOG_COLORS[entry.level]}`}>{entry.msg}</span>
              </div>
            ))
          ) : (
            <div className="text-white/40 py-4 text-center text-xs">Select a run from the Inspector → History tab to view its full log.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Left nav ──────────────────────────────────────────────────────────────────
function LeftNav({ expanded, onToggle }) {
  const [openCat, setOpenCat] = useState("Triggers");

  return (
    <div
      className="flex-shrink-0 bg-white border-r border-[#e2e8f0] flex flex-col transition-all duration-200 overflow-hidden"
      style={{ width: expanded ? 240 : 64 }}
    >
      {/* Header */}
      <div className={`flex items-center h-11 flex-shrink-0 border-b border-[#e2e8f0] px-3 ${expanded ? "justify-between" : "justify-center"}`}>
        {expanded && <span className="text-xs font-bold text-[#0f172a] uppercase tracking-widest">Nodes</span>}
        <button
          onClick={onToggle}
          aria-label={expanded ? "Collapse node panel" : "Expand node panel"}
          className="flex items-center justify-center size-7 rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
        >
          {expanded ? <PanelLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Search (expanded only) */}
      {expanded && (
        <div className="px-3 py-2 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-2 py-1.5">
            <Search size={12} className="text-[#94a3b8] flex-shrink-0" />
            <input placeholder="Search nodes…" aria-label="Search nodes" className="flex-1 text-xs outline-none bg-transparent text-[#0f172a] placeholder:text-[#94a3b8]" />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-2">
        {NODE_PALETTE.map(({ cat, color, nodes }) => (
          <div key={cat}>
            {expanded ? (
              <>
                <button
                  onClick={() => setOpenCat(openCat === cat ? null : cat)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs font-medium text-[#0f172a]">{cat}</span>
                  </div>
                  <ChevronDown size={12} className={`text-[#94a3b8] transition-transform ${openCat === cat ? "" : "-rotate-90"}`} />
                </button>
                {openCat === cat && (
                  <div className="flex flex-col pb-1">
                    {nodes.map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        draggable
                        title={label}
                        className="flex items-center gap-2.5 px-4 py-2 cursor-grab hover:bg-[#f0f7ff] transition-colors rounded-[6px] mx-2"
                      >
                        <div className="size-7 rounded-[6px] flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        <span className="text-xs text-[#475569]">{label}</span>
                        <Plus size={10} className="ml-auto text-[#cbd5e1]" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 px-2 py-1">
                {nodes.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    title={label}
                    aria-label={`Add ${label} node`}
                    className="flex items-center justify-center size-9 rounded-[6px] hover:bg-[#f1f5f9] transition-colors"
                    style={{ color }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Canvas ────────────────────────────────────────────────────────────────────
function Canvas({ flow, selectedIdx, onSelectNode }) {
  const canvasW = PAD_X * 2 + flow.steps.length * NODE_W + (flow.steps.length - 1) * H_GAP;
  const canvasH = 480;

  return (
    <div className="relative flex-1 min-w-0 overflow-auto bg-[#f8fafc]"
      style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      onClick={() => onSelectNode(null)}
    >
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white border border-[#e2e8f0] rounded-[8px] p-1 shadow-sm">
        <button aria-label="Zoom in"  className="flex items-center justify-center size-7 rounded-[6px] hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><ZoomIn size={14} /></button>
        <div className="h-px bg-[#e2e8f0]" />
        <button aria-label="Zoom out" className="flex items-center justify-center size-7 rounded-[6px] hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><ZoomOut size={14} /></button>
        <div className="h-px bg-[#e2e8f0]" />
        <button aria-label="Fit to screen" className="flex items-center justify-center size-7 rounded-[6px] hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><Crosshair size={14} /></button>
      </div>

      {/* SVG canvas */}
      <svg
        width={Math.max(canvasW, 800)}
        height={canvasH}
        className="block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Connections */}
        {flow.steps.map((step, i) => {
          if (i === flow.steps.length - 1) return null;
          const x1 = PAD_X + i * (NODE_W + H_GAP) + NODE_W;
          const y1 = NODE_Y + NODE_H / 2;
          const x2 = PAD_X + (i + 1) * (NODE_W + H_GAP);
          const y2 = NODE_Y + NODE_H / 2;
          return <Connection key={i} x1={x1} y1={y1} x2={x2} y2={y2} color={step.color} />;
        })}

        {/* Nodes */}
        {flow.steps.map((step, i) => {
          const x = PAD_X + i * (NODE_W + H_GAP);
          const execStatus = getExecStatus(flow.status, i, flow.steps.length);
          return (
            <CanvasNode
              key={i}
              step={step}
              index={i}
              x={x}
              y={NODE_Y}
              selected={selectedIdx === i}
              execStatus={execStatus}
              onClick={onSelectNode}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ─── Top bar ───────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  active:  { bg: "#dcfce7", text: "#15803d", dot: "#22c55e", label: "Active"  },
  paused:  { bg: "#fef9c3", text: "#a16207", dot: "#f59e0b", label: "Paused"  },
  error:   { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444", label: "Error"   },
  draft:   { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8", label: "Draft"   },
};

function TopBar({ flow, onBack }) {
  const badge = STATUS_BADGE[flow.status] ?? STATUS_BADGE.draft;
  return (
    <div className="flex items-center gap-3 h-16 px-4 bg-white border-b border-[#e2e8f0] flex-shrink-0">
      <button
        onClick={onBack}
        aria-label="Back to flows"
        className="flex items-center justify-center size-8 rounded-[8px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors flex-shrink-0"
      >
        <ArrowLeft size={16} />
      </button>

      <div className="h-5 w-px bg-[#e2e8f0]" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-[#94a3b8]">
        <button onClick={onBack} className="hover:text-[#64748b] transition-colors">Flows</button>
        <ChevronRight size={13} />
        <span className="text-[#0f172a] font-medium truncate max-w-[240px]">{flow.name}</span>
      </div>

      {/* Status badge */}
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ background: badge.bg, color: badge.text }}
      >
        <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: badge.dot }} />
        {badge.label}
      </span>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-white border border-[#e2e8f0] text-[#475569] text-xs font-medium hover:bg-[#f8fafc] transition-colors">
          <Save size={13} /> Save
        </button>
        <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-medium transition-colors">
          <Play size={12} fill="white" /> Run Now
        </button>
        <button aria-label="More options" className="flex items-center justify-center size-8 rounded-[6px] bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] transition-colors">
          <MoreHorizontal size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FlowViewPage({ flow, onNavigate, sidebarCollapsed, onToggleSidebar }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [logsCollapsed, setLogsCollapsed] = useState(false);

  if (!flow) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc] flex-col gap-4">
        <p className="text-[#64748b]">No flow selected.</p>
        <button onClick={() => onNavigate("flows")} className="text-sm text-[#2563eb] hover:underline">Back to Flows</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} activePage="flows" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar flow={flow} onBack={() => onNavigate("flows")} />

        {/* Middle: Left Nav + Canvas + Right Panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <LeftNav expanded={leftExpanded} onToggle={() => setLeftExpanded((v) => !v)} />
          <Canvas flow={flow} selectedIdx={selectedIdx} onSelectNode={setSelectedIdx} />
          <RightPanel flow={flow} selectedIdx={selectedIdx} />
        </div>

        {/* Bottom log panel */}
        <BottomPanel flow={flow} collapsed={logsCollapsed} onToggle={() => setLogsCollapsed((v) => !v)} />
      </div>
    </div>
  );
}
