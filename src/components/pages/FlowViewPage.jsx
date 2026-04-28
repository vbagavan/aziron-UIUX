import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ArrowLeft, Play, Save, MoreHorizontal, ChevronDown, ChevronRight, ChevronLeft,
  ZoomIn, ZoomOut, Crosshair, CheckCircle2, AlertCircle, Clock, Circle,
  Bot, Database, Mail, Webhook, FileText, Globe, Zap, GitBranch,
  Terminal, History, X, Plus, Search, Layers,
  Settings2, Info, Activity, Cpu, RefreshCw,
  MousePointer, GitMerge, Trash2,
  Send, Sparkles, RotateCcw, ChevronUp,
  ListChecks, Braces, ScrollText, Hammer, Gauge,
  Copy, Download, Share2, Settings, Clock as ClockIcon, Pencil, Eye,
  PanelRight, PanelRightClose,
  Filter, Plug, Bell, UserCheck, Shield, Wrench, Brain,
  MessageCircle, Upload, HardDrive, Building2, SplitSquareHorizontal,
  Code2, Network, Shuffle, Timer, Variable, BarChart3, ImageIcon,
  Microscope, FolderInput, Archive, Boxes, BotMessageSquare,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import AppHeader from "@/components/layout/AppHeader";
import { useFlowStore } from "@/store/flowStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast, useToast } from "@/components/ui/Toast";

// ─── Constants ─────────────────────────────────────────────────────────────────
const NODE_W = 200;
const NODE_H = 76;
const H_GAP  = 110;
const PAD_X  = 80;
const NODE_Y = 190;

const ICON_MAP = {
  Bot, Database, Mail, Webhook, FileText, Globe, Zap, GitBranch, GitMerge,
  Terminal, Cpu, Filter, Code2, Network, Braces,
  Bell, UserCheck, Shield, Wrench, Brain, MessageCircle,
  Upload, HardDrive, Building2, SplitSquareHorizontal, Shuffle,
  Timer, Variable, BarChart3, ImageIcon, Microscope,
  FolderInput, Archive, Boxes, BotMessageSquare, Plug, Layers,
};

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
  Braces:    { type: "Code Block", fields: [] },
  Code2:     { type: "Script",     fields: [] },
  Terminal:  { type: "CLI Task",   fields: [] },
  Cpu:       { type: "Function",   fields: [] },
};

/** Node `icon` keys that use the script / code editor in Configuration. */
const SCRIPT_NODE_ICONS = new Set(["Braces", "Code2", "Terminal", "Cpu"]);

const DEFAULT_SCRIPT_INPUT = `{
  "example": true,
  "payload": {}
}`;

const DEFAULT_SCRIPT_BODY = `async function run(ctx) {
  const { input } = ctx;
  // Edit your logic; return an object for downstream steps
  return { output: input };
}`;

const DEFAULT_SCRIPT_OUTPUT = `{
  "output": {}
}`;

function isScriptNodeIcon(icon) {
  return SCRIPT_NODE_ICONS.has(icon);
}

/** Mock “enhanced” script for inline AI (keeps user code, adds guards / structure hints). */
function stubEnhanceScript(code) {
  const trimmed = code.trim();
  if (!trimmed) return DEFAULT_SCRIPT_BODY;
  if (/async\s+function\s+run\s*\(/i.test(trimmed)) {
    return `${trimmed}\n\n// —— Enhance with AI ——\n// Consider: early return if ctx?.input is missing, and narrow catch blocks to known error types.\n`;
  }
  const indented = trimmed.split("\n").map((l) => `    ${l}`).join("\n");
  return `async function run(ctx) {\n  const input = ctx?.input ?? {};\n  try {\n${indented}\n    return { output: input };\n  } catch (err) {\n    return { output: null, error: String(err) };\n  }\n}`;
}

// ─── Mock I/O data per node type ───────────────────────────────────────────────
const NODE_IO = {
  Webhook:   {
    input:  { trigger: "HTTP POST", headers: { "content-type": "application/json" }, body: { email: "jane@acme.com", event: "form_submit" } },
    output: { status: "received", payload: { email: "jane@acme.com", ts: "2026-03-24T15:49:02Z" } },
  },
  Database:  {
    input:  { query: "SELECT * FROM leads WHERE email = ?", params: ["jane@acme.com"] },
    output: { found: true, record: { id: "lead_3821", email: "jane@acme.com", score: 82, tier: "Enterprise" } },
  },
  Bot:       {
    input:  { model: "claude-sonnet-4-6", prompt: "Score this lead…", context: { email: "jane@acme.com", score: 82 } },
    output: { score: 82, tier: "HIGH", reasoning: "Enterprise size, recent engagement, budget indicator present." },
  },
  Mail:      {
    input:  { to: "jane@acme.com", subject: "Welcome to Aziron", template: "Sequence #1" },
    output: { sent: true, messageId: "msg_48fa9c", deliveredAt: "2026-03-24T15:49:08Z" },
  },
  Zap:       {
    input:  { score: 82, tier: "HIGH", rawData: { size: "Enterprise" } },
    output: { transformed: true, lead: { score: 82, tier: "HIGH", qualified: true } },
  },
  FileText:  {
    input:  { file: "contract_v3.pdf", parser: "PDF/DOCX" },
    output: { pages: 12, fields: { parties: ["Acme Corp","Aziron Inc"], value: "$48 000" } },
  },
  Globe:     {
    input:  { url: "https://api.example.com/data", method: "GET" },
    output: { status: 200, latency: "312ms", data: { records: 4 } },
  },
  GitBranch: {
    input:  { condition: "score > 70", value: 82 },
    output: { branch: "true", nextStep: "Send Email" },
  },
};

// ─── Execution status helpers ──────────────────────────────────────────────────
const EXEC_STATUS = {
  active:  (i, n) => "success",
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

const LOG_COLORS  = { INFO: "text-muted-foreground", SUCCESS: "text-[#16a34a]", ERROR: "text-[#dc2626]", WARN: "text-[#b45309]" };
const LOG_BADGES  = { INFO: "bg-muted text-muted-foreground", SUCCESS: "bg-[#dcfce7] text-[#15803d]", ERROR: "bg-[#fef2f2] text-[#dc2626]", WARN: "bg-[#fef9c3] text-[#a16207]" };
/** Compact log row — level dot (INFO hidden from stream elsewhere) */
const LOG_LEVEL_DOT = { SUCCESS: "#22c55e", ERROR: "#ef4444", WARN: "#ca8a04", INFO: "#94a3b8" };

function createExecutionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Compact label for log rows; full id via `title` */
function shortExecutionId(id) {
  if (!id) return "";
  const compact = id.replace(/-/g, "");
  return compact.length >= 8 ? compact.slice(0, 8) : id.slice(0, 12);
}

/** Elapsed wall time for an in-flight run (live updates from parent tick). */
function formatElapsed(ms) {
  if (ms == null || ms < 0) return "";
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// ─── Stub AI engine ───────────────────────────────────────────────────────────
function buildAIResponse(query, step, execKey) {
  const q   = query.toLowerCase();
  const cfg = NODE_CONFIGS[step?.icon] ?? {};
  if (q.includes("explain") || q.includes("what") || q.includes("describe")) {
    return {
      message: `**${step?.label}** is a **${cfg.type ?? "Node"}** step. ${
        cfg.type === "Trigger"   ? "It listens for incoming events and starts the flow automatically." :
        cfg.type === "AI Agent"  ? "It sends a prompt to an LLM and receives a structured response." :
        cfg.type === "Data"      ? "It queries your connected database to look up or enrich records." :
        cfg.type === "Action"    ? "It dispatches an action (e.g. email) to an external recipient." :
        cfg.type === "Logic"     ? "It evaluates a condition and routes execution down the correct branch." :
        cfg.type === "Code Block" || cfg.type === "Script" || cfg.type === "CLI Task" || cfg.type === "Function"
          ? "It executes your script against the step input and returns output for downstream nodes."
        : "It transforms and processes data within the workflow."
      }`,
      suggestions: ["Add error handling for failures", "Enable retry logic (3 attempts)", "Log output to audit trail"],
      actions: [{ label: "View Docs", type: "docs" }, { label: "Test Node", type: "test" }, { label: "Add Retry", type: "configure" }],
    };
  }
  if (q.includes("fail") || q.includes("error") || q.includes("wrong") || q.includes("broke")) {
    return {
      message: execKey === "error"
        ? `This node **failed** due to a **connection timeout** (5 000 ms). The downstream API did not respond within the configured window — likely a rate-limit or network spike.`
        : `This node ran **successfully**. If you see unexpected data, inspect the output payload in the **Execution** tab.`,
      suggestions: ["Increase timeout to 10 000 ms", "Add a fallback branch", "Enable exponential back-off"],
      actions: [{ label: "Retry Node", type: "retry" }, { label: "View Logs", type: "logs" }, { label: "Edit Timeout", type: "configure" }],
    };
  }
  if (q.includes("optim") || q.includes("improve") || q.includes("faster") || q.includes("better")) {
    return {
      message: `**3 optimizations** found:\n\n1. **Cache DB results** — Add a 5-min TTL to cut latency ~65%.\n2. **Batch API calls** — Group records to reduce round-trips.\n3. **Parallelize** — Steps 2 & 3 have no dependency; run them concurrently.`,
      suggestions: ["Enable result caching (TTL: 5 min)", "Switch to batch mode", "Mark steps 2–3 as parallel"],
      actions: [{ label: "Apply Caching", type: "configure" }, { label: "View Schema", type: "docs" }],
    };
  }
  return {
    message: `Ask me anything about **${step?.label ?? "this flow"}**:\n\n• *"Explain this node"*\n• *"Why did this fail?"*\n• *"Optimize this step"*`,
    suggestions: [],
    actions: [],
  };
}

// ─── Canvas node ───────────────────────────────────────────────────────────────
const NODE_TOOLBAR_BTNS = [
  { icon: Play,      label: "Play",   color: "#22c55e", hoverBg: "#f0fdf4" },
  { icon: Activity,  label: "Logs",   color: "#7c3aed", hoverBg: "#f5f3ff" },
  { icon: Trash2,    label: "Delete", color: "#ef4444", hoverBg: "#fef2f2" },
];
const TB_BTN     = 26;
const TB_GAP     = 3;
const TB_PAD     = 8;  // Increased from 4 to 8 for more breathing room
const TB_TOTAL_W = NODE_TOOLBAR_BTNS.length * TB_BTN + (NODE_TOOLBAR_BTNS.length - 1) * TB_GAP + TB_PAD * 2;
const TB_TOTAL_H = TB_BTN + TB_PAD * 2;
const EDGE_R     = 9;

/** Pure-SVG execution glyph inside the top-right badge (avoids foreignObject + React icon quirks). */
function NodeExecStatusGlyph({ cx, cy, execKey, color }) {
  const t = `translate(${cx},${cy})`;
  if (execKey === "success") {
    return (
      <g transform={t} pointerEvents="none">
        <path
          d="M-3.2 0.2 L-1 2.5 L3.6 -2.8"
          fill="none"
          stroke={color}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (execKey === "error") {
    return (
      <g transform={t} pointerEvents="none">
        <circle r={3.6} fill="none" stroke={color} strokeWidth={1.2} />
        <line x1={0} y1={-1.2} x2={0} y2={0.8} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        <circle cx={0} cy={2.4} r={0.75} fill={color} />
      </g>
    );
  }
  if (execKey === "running") {
    return (
      <g transform={t} pointerEvents="none">
        <circle
          r={3.6}
          fill="none"
          stroke={color}
          strokeWidth={1.45}
          strokeDasharray="3 6"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" values="0;-18" dur="0.75s" repeatCount="indefinite" />
        </circle>
      </g>
    );
  }
  /* pending */
  return (
    <g transform={t} pointerEvents="none">
      <circle r={2.9} fill="none" stroke={color} strokeWidth={1.15} opacity={0.9} />
    </g>
  );
}

function CanvasNode({ step, index, x, y, selected, execStatus, onClick, onOpenPicker, onToolbarAction, isRunning = false, isDone = false, readOnly = false }) {
  const Icon = ICON_MAP[step.icon] ?? Zap;
  const dynamicExecKey = isRunning ? "running" : isDone ? "success" : execStatus;
  const exec     = STEP_EXEC[dynamicExecKey] ?? STEP_EXEC.pending;
  const [hovered,  setHovered]  = useState(false);
  const [tbHover,  setTbHover]  = useState(null);
  const [edgeHov,  setEdgeHov]  = useState(null);
  const hideTimer = useRef(null);

  const tbX = x + NODE_W - TB_TOTAL_W;
  const tbY = y + NODE_H + 6;
  const rightEdge = { cx: x + NODE_W, cy: y + NODE_H / 2 };
  const leftEdge  = { cx: x,          cy: y + NODE_H / 2 };

  // Increased timeout to 500ms to give users time to move cursor to toolbar without triggering hide
  const startHide  = () => { hideTimer.current = setTimeout(() => { setHovered(false); setTbHover(null); setEdgeHov(null); }, 500); };
  const cancelHide = () => clearTimeout(hideTimer.current);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <g onClick={() => onClick(index)} onMouseEnter={() => { cancelHide(); setHovered(true); }} onMouseLeave={startHide} style={{ cursor: "pointer" }}>
      {/* Extended hit area — encompasses node, edges, and toolbar with generous padding */}
      <rect x={x - EDGE_R - 8} y={y - 8} width={NODE_W + (EDGE_R + 8) * 2} height={NODE_H + TB_TOTAL_H + 20} fill="transparent" />

      {/* Selection ring — handled by card border below */}

      {isDone && !isRunning && (
        <rect x={x-3} y={y-3} width={NODE_W+6} height={NODE_H+6} rx={13} fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.85} />
      )}

      {/* Card */}
      <rect x={x+2} y={y+3} width={NODE_W} height={NODE_H} rx={10} fill="rgba(0,0,0,0.06)" />
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={10} fill="white"
        stroke={isRunning ? "#3b82f6" : selected ? "#2563eb" : hovered ? "#94a3b8" : "#e2e8f0"}
        strokeWidth={isRunning ? 2 : selected ? 2 : 1} />

      {isRunning && (
        <rect
          className="canvas-node-running-ring"
          x={x - 3}
          y={y - 3}
          width={NODE_W + 6}
          height={NODE_H + 6}
          rx={13}
          fill="none"
          stroke={exec.color}
          strokeWidth={2}
          strokeDasharray="9 7"
          strokeLinecap="round"
          pointerEvents="none"
        />
      )}

      {/* Status badge */}
      <circle cx={x+NODE_W-14} cy={y+14} r={7} fill={exec.bg} stroke={exec.ring} strokeWidth={1} />
      <NodeExecStatusGlyph cx={x + NODE_W - 14} cy={y + 14} execKey={dynamicExecKey} color={exec.color} />

      {/* Icon */}
      <circle cx={x+34} cy={y+NODE_H/2} r={17} fill={`${step.color}18`} stroke={`${step.color}35`} strokeWidth={1} />
      <foreignObject x={x+20} y={y+NODE_H/2-11} width={28} height={22}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%" }}>
          <Icon size={14} color={step.color} />
        </div>
      </foreignObject>

      {/* Label + type */}
      <text x={x+62} y={y+28} fontSize={12} fontWeight={600} fill="#0f172a">{step.label}</text>
      <rect x={x+62} y={y+36} width={72} height={15} rx={4} fill={`${step.color}15`} />
      <text x={x+98} y={y+47} textAnchor="middle" fontSize={9} fill={step.color} fontWeight={500}>
        {NODE_CONFIGS[step.icon]?.type ?? "Step"}
      </text>

      {/* Running only — pending/success/error read from top-right badge */}
      {isRunning && (
        <foreignObject x={x+62} y={y+NODE_H-20} width={100} height={16}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display:"flex",alignItems:"center",gap:3,fontSize:9,fontWeight:500,color:"#3b82f6" }}>
            Running
            {[0,1,2].map(i => <span key={i} style={{ display:"inline-block",width:3,height:3,borderRadius:"50%",background:"#3b82f6",animation:`nodeBounce 0.8s ease-in-out ${i*0.18}s infinite` }} />)}
          </div>
        </foreignObject>
      )}

      {/* Edge + buttons — build mode only */}
      {!readOnly && hovered && (
        <g onClick={(e) => { e.stopPropagation(); onOpenPicker?.(index, rightEdge.cx+16, rightEdge.cy); }}
           onMouseEnter={(e) => { e.stopPropagation(); cancelHide(); setEdgeHov("right"); }}
           onMouseLeave={(e) => { e.stopPropagation(); setEdgeHov(null); }} style={{ cursor:"pointer" }}>
          {/* Expanded hit area for better clickability */}
          <circle cx={rightEdge.cx} cy={rightEdge.cy} r={16} fill="transparent" />
          <circle cx={rightEdge.cx} cy={rightEdge.cy} r={EDGE_R} fill={edgeHov==="right"?"#2563eb":"white"} stroke={edgeHov==="right"?"#2563eb":"#94a3b8"} strokeWidth={1.5} />
          <line x1={rightEdge.cx-4} y1={rightEdge.cy} x2={rightEdge.cx+4} y2={rightEdge.cy} stroke={edgeHov==="right"?"white":"#64748b"} strokeWidth={1.8} strokeLinecap="round" />
          <line x1={rightEdge.cx} y1={rightEdge.cy-4} x2={rightEdge.cx} y2={rightEdge.cy+4} stroke={edgeHov==="right"?"white":"#64748b"} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
      {!readOnly && hovered && (
        <g onClick={(e) => { e.stopPropagation(); onOpenPicker?.(index-1, x-320, leftEdge.cy); }}
           onMouseEnter={(e) => { e.stopPropagation(); cancelHide(); setEdgeHov("left"); }}
           onMouseLeave={(e) => { e.stopPropagation(); setEdgeHov(null); }} style={{ cursor:"pointer" }}>
          {/* Expanded hit area for better clickability */}
          <circle cx={leftEdge.cx} cy={leftEdge.cy} r={16} fill="transparent" />
          <circle cx={leftEdge.cx} cy={leftEdge.cy} r={EDGE_R} fill={edgeHov==="left"?"#2563eb":"white"} stroke={edgeHov==="left"?"#2563eb":"#94a3b8"} strokeWidth={1.5} />
          <line x1={leftEdge.cx-4} y1={leftEdge.cy} x2={leftEdge.cx+4} y2={leftEdge.cy} stroke={edgeHov==="left"?"white":"#64748b"} strokeWidth={1.8} strokeLinecap="round" />
          <line x1={leftEdge.cx} y1={leftEdge.cy-4} x2={leftEdge.cx} y2={leftEdge.cy+4} stroke={edgeHov==="left"?"white":"#64748b"} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
      {!hovered && (
        <>
          <circle cx={rightEdge.cx} cy={rightEdge.cy} r={5} fill="white" stroke={selected?"#2563eb":"#cbd5e1"} strokeWidth={1.5} />
          {index > 0 && <circle cx={leftEdge.cx} cy={leftEdge.cy} r={5} fill="white" stroke={selected?"#2563eb":"#cbd5e1"} strokeWidth={1.5} />}
        </>
      )}

      {/* Bottom toolbar — build mode only */}
      {!readOnly && hovered && (
        <g style={{ filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.10))" }} onMouseEnter={cancelHide} onMouseLeave={startHide}>
          {/* Expanded gap area for easier cursor transition from node to toolbar — extends to bottom of toolbar */}
          <rect x={tbX-8} y={y+NODE_H} width={TB_TOTAL_W+16} height={6+TB_TOTAL_H} fill="transparent" />
          <rect x={tbX} y={tbY} width={TB_TOTAL_W} height={TB_TOTAL_H} rx={8} fill="white" stroke="#e2e8f0" strokeWidth={1} />
          {NODE_TOOLBAR_BTNS.map((btn, bi) => {
            const btnX = tbX + TB_PAD + bi * (TB_BTN + TB_GAP);
            const btnCX = btnX + TB_BTN / 2;
            const btnCY = tbY + TB_PAD + TB_BTN / 2;
            const isHov = tbHover === bi;
            const BtnIcon = btn.icon;
            const handleBtnClick = (e) => {
              e.stopPropagation();
              if (btn.label === "Delete") onToolbarAction?.("delete", index);
              else if (btn.label === "Play") onToolbarAction?.("play", index);
              else if (btn.label === "Logs") onToolbarAction?.("logs", index);
            };
            return (
              <g key={bi}>
                {/* Hover background — constrained within toolbar height */}
                {isHov && <rect x={btnX-8} y={tbY+TB_PAD} width={TB_BTN+16} height={TB_BTN} rx={5} fill={btn.hoverBg} />}
                {/* Expanded hit area (8px padding on left/right only to avoid overflow) */}
                <rect x={btnX-8} y={tbY+TB_PAD} width={TB_BTN+16} height={TB_BTN} fill="transparent"
                  onMouseEnter={(e) => { e.stopPropagation(); cancelHide(); setTbHover(bi); }}
                  onMouseLeave={(e) => { e.stopPropagation(); setTbHover(null); }}
                  onClick={handleBtnClick} style={{ cursor:"pointer" }} title={`${btn.label}: ${btn.label === 'Delete' ? 'Remove this node' : btn.label === 'Retry' ? 'Retry this node' : 'View execution logs'}`} />
                {/* Icon — pointer-events none to maintain hover on rect */}
                <foreignObject x={btnCX-8} y={btnCY-8} width={16} height={16} pointerEvents="none">
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{ display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",pointerEvents:"none" }}>
                    <BtnIcon size={13} color={isHov?btn.color:"#94a3b8"} strokeWidth={isHov?2.2:1.8} />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}

// ─── Bezier connection with midpoint "+" ──────────────────────────────────────
function ConnectionWithAdd({ x1, y1, x2, y2, color, afterIndex, onOpenPicker, isFlowing = false, isDone = false, readOnly = false }) {
  const [hovered, setHovered] = useState(false);
  const cp = (x2 - x1) * 0.45;
  const d  = `M ${x1} ${y1} C ${x1+cp} ${y1}, ${x2-cp} ${y2}, ${x2} ${y2}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const R  = 9;
  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <path d={d} fill="none" stroke="transparent" strokeWidth={22} />
      <path d={d} fill="none" stroke={isDone?"#bbf7d0":"#e2e8f0"} strokeWidth={isDone?2.5:2} />
      {!isFlowing && !isDone && <path d={d} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} strokeDasharray="5 4" />}
      {isDone && <path d={d} fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.7} />}
      {isFlowing && (
        <>
          <path d={d} fill="none" stroke="#bfdbfe" strokeWidth={3} />
          <path d={d} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="10 8" style={{ animation:"connFlow 0.45s linear infinite" }} />
        </>
      )}
      {!readOnly && hovered && (
        <g onClick={(e) => { e.stopPropagation(); onOpenPicker?.(afterIndex, mx, my); }} style={{ cursor:"pointer" }}>
          <circle cx={mx} cy={my} r={R+4} fill="#2563eb" opacity={0.08} />
          <circle cx={mx} cy={my} r={R} fill="white" stroke="#2563eb" strokeWidth={1.5} />
          <line x1={mx-4} y1={my} x2={mx+4} y2={my} stroke="#2563eb" strokeWidth={1.8} strokeLinecap="round" />
          <line x1={mx} y1={my-4} x2={mx} y2={my+4} stroke="#2563eb" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

// ─── Add-node picker ──────────────────────────────────────────────────────────
const PICKER_COLORS = {
  Bot:"#7c3aed", Webhook:"#6366f1", Zap:"#f59e0b",
  Globe:"#2563eb", Database:"#0891b2", Mail:"#06b6d4",
  FileText:"#f59e0b", GitBranch:"#0284c7", GitMerge:"#0284c7",
  Terminal:"#d97706", Cpu:"#d97706", Filter:"#16a34a", Code2:"#16a34a",
  Network:"#7c3aed", Braces:"#16a34a", Bell:"#be185d", UserCheck:"#ea580c",
  Shield:"#0369a1", Wrench:"#64748b", Brain:"#9333ea", MessageCircle:"#059669",
  Upload:"#e11d48", HardDrive:"#d97706", Building2:"#3b82f6",
  SplitSquareHorizontal:"#0284c7", Shuffle:"#0284c7",
  Timer:"#64748b", Variable:"#64748b", BarChart3:"#16a34a",
  ImageIcon:"#9333ea", Microscope:"#9333ea",
  FolderInput:"#e11d48", Archive:"#d97706", Boxes:"#2563eb",
  BotMessageSquare:"#059669", Plug:"#7c3aed", Layers:"#2563eb",
};
const PICKER_CATEGORIES = [
  { icon:SplitSquareHorizontal, bg:"#eff6ff", iconColor:"#0284c7", label:"Control Flow",   desc:"Routing, branching, loops",    iconKey:"SplitSquareHorizontal" },
  { icon:Terminal,              bg:"#fefce8", iconColor:"#d97706", label:"Execution",       desc:"Run code & AI agents",         iconKey:"Terminal"              },
  { icon:Filter,                bg:"#f0fdf4", iconColor:"#16a34a", label:"Data",            desc:"Transform & process data",     iconKey:"Filter"                },
  { icon:Plug,                  bg:"#f5f3ff", iconColor:"#7c3aed", label:"Integration",     desc:"External system calls",        iconKey:"Plug"                  },
  { icon:Zap,                   bg:"#fef9c3", iconColor:"#ca8a04", label:"Trigger",         desc:"Start workflows",              iconKey:"Zap"                   },
  { icon:Bell,                  bg:"#fdf2f8", iconColor:"#be185d", label:"Communication",   desc:"Notify & message users",       iconKey:"Bell"                  },
  { icon:UserCheck,             bg:"#fff7ed", iconColor:"#ea580c", label:"Interactive",     desc:"Human-in-loop actions",        iconKey:"UserCheck"             },
  { icon:Shield,                bg:"#f0f9ff", iconColor:"#0369a1", label:"Logic",           desc:"Validation & rules",           iconKey:"Shield"                },
  { icon:Wrench,                bg:"#f8fafc", iconColor:"#64748b", label:"Utility",         desc:"Helpers & control",            iconKey:"Wrench"                },
  { icon:Brain,                 bg:"#faf5ff", iconColor:"#9333ea", label:"Advanced Data",   desc:"AI + data intelligence",       iconKey:"Brain"                 },
  { icon:MessageCircle,         bg:"#f0fdf4", iconColor:"#059669", label:"Conversational",  desc:"NLP-based routing",            iconKey:"MessageCircle"         },
  { icon:FolderInput,           bg:"#fff1f2", iconColor:"#e11d48", label:"File Handling",   desc:"File processing",              iconKey:"FolderInput"           },
  { icon:HardDrive,             bg:"#fef3c7", iconColor:"#d97706", label:"Storage",         desc:"Persist & retrieve data",      iconKey:"HardDrive"             },
  { icon:Boxes,                 bg:"#eff6ff", iconColor:"#2563eb", label:"Concurrency",     desc:"Parallel execution",           iconKey:"Boxes"                 },
  { icon:Building2,             bg:"#f0f4ff", iconColor:"#3b82f6", label:"Microsoft / Bot", desc:"Microsoft ecosystem",          iconKey:"Building2"             },
];
const PICKER_FREQUENT = [
  { icon:Globe,         bg:"#eff6ff", iconColor:"#2563eb", label:"API Call",       desc:"Call external endpoints",      iconKey:"Globe"         },
  { icon:Braces,        bg:"#f0fdf4", iconColor:"#16a34a", label:"Code Block",     desc:"Run inline code",              iconKey:"Braces"        },
  { icon:MessageCircle, bg:"#f0fdf4", iconColor:"#059669", label:"Chat Trigger",   desc:"Start from a chat message",    iconKey:"MessageCircle" },
  { icon:Filter,        bg:"#f0fdf4", iconColor:"#16a34a", label:"Transform",      desc:"Shape & map data",             iconKey:"Filter"        },
  { icon:UserCheck,     bg:"#fff7ed", iconColor:"#ea580c", label:"Human Approval", desc:"Pause for human review",       iconKey:"UserCheck"     },
  { icon:GitBranch,     bg:"#eff6ff", iconColor:"#0284c7", label:"If / Else",      desc:"Branch on a condition",        iconKey:"GitBranch"     },
];

// ─── Nodes grouped by category ─────────────────────────────────────────────────
const PICKER_NODES_BY_CATEGORY = {
  "Control Flow": [
    { icon:Shuffle,               label:"Router",             desc:"Route to multiple branches",          iconKey:"Shuffle"               },
    { icon:GitBranch,             label:"If / Else",          desc:"Branch on a boolean condition",       iconKey:"GitBranch"             },
    { icon:RefreshCw,             label:"While Loop",         desc:"Repeat steps while condition holds",  iconKey:"Wrench"                },
    { icon:GitMerge,              label:"Join",               desc:"Merge parallel branches",             iconKey:"GitMerge"              },
    { icon:SplitSquareHorizontal, label:"Switch",             desc:"Multi-way branch on value",           iconKey:"SplitSquareHorizontal" },
    { icon:X,                     label:"Break",              desc:"Exit a loop early",                   iconKey:"Shield"                },
    { icon:ChevronRight,          label:"Continue",           desc:"Skip to next loop iteration",         iconKey:"Shield"                },
  ],
  "Execution": [
    { icon:Braces,   label:"Code Block",        desc:"Write & run inline code",            iconKey:"Braces"   },
    { icon:Bot,      label:"Agent Call",         desc:"Invoke an AI agent",                 iconKey:"Bot"      },
    { icon:Code2,    label:"Script Runner",      desc:"Execute an external script",         iconKey:"Code2"    },
    { icon:Cpu,      label:"Function Executor",  desc:"Call a serverless function",         iconKey:"Cpu"      },
    { icon:Terminal, label:"CLI Task",           desc:"Run a shell command",                iconKey:"Terminal" },
  ],
  "Data": [
    { icon:Shuffle,  label:"Transform",   desc:"Reshape data with a mapping",        iconKey:"Shuffle"   },
    { icon:Filter,   label:"Filter",      desc:"Keep only matching records",         iconKey:"Filter"    },
    { icon:Layers,   label:"Map",         desc:"Apply function to each item",        iconKey:"Layers"    },
    { icon:BarChart3,label:"Aggregate",   desc:"Sum, count, avg across records",     iconKey:"BarChart3" },
    { icon:Wrench,   label:"Formatter",   desc:"Format dates, numbers, strings",     iconKey:"Wrench"    },
    { icon:Braces,   label:"Parser",      desc:"Parse JSON, CSV, XML",               iconKey:"Braces"    },
  ],
  "Integration": [
    { icon:Globe,    label:"API Call",          desc:"HTTP request to any endpoint",      iconKey:"Globe"    },
    { icon:RefreshCw,label:"Polling API",       desc:"Poll endpoint until result ready",  iconKey:"Globe"    },
    { icon:Webhook,  label:"Webhook",           desc:"Receive inbound HTTP webhooks",     iconKey:"Webhook"  },
    { icon:Database, label:"Database Query",    desc:"Query SQL / NoSQL database",        iconKey:"Database" },
    { icon:Network,  label:"GraphQL Request",   desc:"Execute a GraphQL query",           iconKey:"Network"  },
  ],
  "Trigger": [
    { icon:MessageCircle, label:"Chat Trigger",    desc:"Start flow from a chat message",   iconKey:"MessageCircle" },
    { icon:Webhook,       label:"Webhook Trigger", desc:"Inbound HTTP request trigger",      iconKey:"Webhook"       },
    { icon:Clock,         label:"Cron",            desc:"Recurring schedule trigger",        iconKey:"Timer"         },
    { icon:Timer,         label:"Schedule",        desc:"One-time or interval schedule",     iconKey:"Timer"         },
  ],
  "Communication": [
    { icon:Bell,      label:"Notification",       desc:"Push in-app notification",          iconKey:"Bell"      },
    { icon:Mail,      label:"Email",              desc:"Send a transactional email",        iconKey:"Mail"      },
    { icon:Building2, label:"Teams Notification", desc:"Post to Microsoft Teams channel",   iconKey:"Building2" },
    { icon:Mail,      label:"Microsoft Email",    desc:"Send via Microsoft 365 / Outlook",  iconKey:"Mail"      },
  ],
  "Interactive": [
    { icon:UserCheck,    label:"Human Approval", desc:"Pause for human review & approval",  iconKey:"UserCheck" },
    { icon:MousePointer, label:"User Input",     desc:"Collect structured input from user", iconKey:"UserCheck" },
  ],
  "Logic": [
    { icon:Shield,      label:"Guardrails",  desc:"Safety & content policy checks",    iconKey:"Shield"   },
    { icon:GitBranch,   label:"Condition",   desc:"Evaluate boolean expression",       iconKey:"GitBranch"},
    { icon:CheckCircle2,label:"Validator",   desc:"Validate schema or field rules",    iconKey:"Shield"   },
    { icon:Layers,      label:"Rule Engine", desc:"Apply declarative business rules",  iconKey:"Shield"   },
  ],
  "Utility": [
    { icon:Timer,     label:"Delay",           desc:"Pause flow for a set duration",     iconKey:"Timer"    },
    { icon:Variable,  label:"Set State",       desc:"Store a variable for later steps",  iconKey:"Variable" },
    { icon:ScrollText,label:"Logger",          desc:"Emit structured log events",        iconKey:"Wrench"   },
    { icon:Variable,  label:"Variable Setter", desc:"Assign values to named variables",  iconKey:"Variable" },
    { icon:Clock,     label:"Timer",           desc:"Measure elapsed time between steps",iconKey:"Timer"    },
    { icon:BarChart3, label:"Counter",         desc:"Increment / decrement a counter",   iconKey:"BarChart3"},
  ],
  "Advanced Data": [
    { icon:Microscope, label:"Similarity Search", desc:"Vector / semantic search",           iconKey:"Microscope" },
    { icon:Globe,      label:"Web Scraper",        desc:"Extract content from a webpage",     iconKey:"Globe"      },
    { icon:Network,    label:"Website Crawler",    desc:"Crawl pages recursively",            iconKey:"Network"    },
    { icon:Brain,      label:"AI Extract",         desc:"LLM-powered data extraction",        iconKey:"Brain"      },
    { icon:ImageIcon,  label:"Image Generation",   desc:"Generate images with AI models",     iconKey:"ImageIcon"  },
    { icon:Microscope, label:"AI Research",        desc:"Deep research via AI agents",        iconKey:"Brain"      },
    { icon:BarChart3,  label:"Data Enricher",      desc:"Augment records with external data", iconKey:"BarChart3"  },
  ],
  "Conversational": [
    { icon:MessageCircle,   label:"Chat Trigger",        desc:"Start flow from chat message",   iconKey:"MessageCircle"   },
    { icon:BotMessageSquare,label:"Prompt Intent Router",desc:"Route messages by intent",       iconKey:"BotMessageSquare"},
  ],
  "File Handling": [
    { icon:FolderInput, label:"File Ingestion",     desc:"Upload & ingest files",              iconKey:"FolderInput" },
    { icon:FileText,    label:"Document Extractor", desc:"Extract content from documents",     iconKey:"FileText"    },
  ],
  "Storage": [
    { icon:Archive,   label:"Vector Upsert",     desc:"Upsert embeddings to vector store",    iconKey:"Archive"   },
    { icon:HardDrive, label:"Workspace Storage", desc:"Read / write workspace key-value",     iconKey:"HardDrive" },
    { icon:Database,  label:"Cache Storage",     desc:"Short-lived key-value cache",          iconKey:"Database"  },
  ],
  "Concurrency": [
    { icon:Boxes,    label:"Parallel Executor", desc:"Run branches in parallel",              iconKey:"Boxes"    },
    { icon:GitMerge, label:"Result Aggregator", desc:"Collect & merge parallel results",      iconKey:"GitMerge" },
  ],
  "Microsoft / Bot": [
    { icon:Building2,       label:"Teams Notification", desc:"Post to Microsoft Teams channel",  iconKey:"Building2"       },
    { icon:Mail,            label:"Microsoft Email",    desc:"Send via Outlook / Microsoft 365", iconKey:"Mail"            },
    { icon:BotMessageSquare,label:"Bot Trigger",        desc:"Receive messages from a bot",      iconKey:"BotMessageSquare"},
  ],
};

function AddNodePicker({ anchorX, anchorY, afterIndex, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const ref = useRef(null), inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Backspace" && query === "" && selectedCategory) setSelectedCategory(null);
    };
    const onOut = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOut);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onOut); };
  }, [onClose, query, selectedCategory]);

  const q = query.toLowerCase();
  const allNodes = Object.values(PICKER_NODES_BY_CATEGORY).flat();
  const filtered = q ? allNodes.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) : null;
  const pick = (tool) => { onAdd(afterIndex, { label:tool.label, icon:tool.iconKey, color:PICKER_COLORS[tool.iconKey]??"#64748b" }); onClose(); };
  const openCategory = (categoryLabel) => { setSelectedCategory(categoryLabel); setQuery(""); };

  const PW = 320, PH = 500;
  const left = Math.min(anchorX, window.innerWidth - PW - 20);
  const top  = Math.max(8, anchorY - PH / 2);

  return (
    <div ref={ref} className="absolute z-[200] bg-card rounded-[16px] flex flex-col overflow-hidden"
      style={{ left, top, width:PW, maxHeight:PH, boxShadow:"0 20px 60px rgba(0,0,0,0.16),0 4px 16px rgba(0,0,0,0.08)", animation:"pickerIn 0.2s cubic-bezier(0.34,1.15,0.64,1)", border:"1px solid rgba(0,0,0,0.06)" }}
      onClick={(e) => e.stopPropagation()}>
      <style>{`@keyframes pickerIn{from{opacity:0;transform:scale(0.95) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        {selectedCategory ? (
          <div className="flex items-center gap-2 mb-2.5">
            <button onClick={()=>setSelectedCategory(null)} className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors flex-shrink-0">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-foreground">{selectedCategory}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2.5 border border-border rounded-[10px] px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <Search size={15} className="text-muted-foreground flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder={selectedCategory ? `Search ${selectedCategory}...` : "Search all nodes"} className="flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent" />
          <button onClick={query?()=>setQuery(""):selectedCategory?()=>setSelectedCategory(null):onClose}><X size={13} className="text-muted-foreground hover:text-muted-foreground" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {/* Show search results OR category content */}
        {filtered ? (
          <>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Search size={24} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No matches for &quot;{query}&quot;</p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-[6px] border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Clear search
                </button>
              </div>
            )}
            {filtered.map(tool => { const Icon = tool.icon; return (
              <button key={tool.label} onClick={()=>pick(tool)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-[8px] hover:bg-background transition-colors text-left group">
                <div className="size-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{background:tool.bg,border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={18} style={{color:tool.iconColor}}/></div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0"><span className="text-sm font-medium text-foreground">{tool.label}</span><span className="text-xs text-muted-foreground line-clamp-1">{tool.desc}</span></div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-muted-foreground flex-shrink-0" />
              </button>
            ); })}
          </>
        ) : selectedCategory ? (
          <>
            {/* Show nodes in selected category */}
            {(PICKER_NODES_BY_CATEGORY[selectedCategory] || []).map(node => { const Icon = node.icon; return (
              <button key={node.label} onClick={()=>pick(node)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-[8px] hover:bg-background transition-colors text-left group">
                <div className="size-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{background:PICKER_COLORS[node.iconKey]+"15",border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={18} style={{color:PICKER_COLORS[node.iconKey]||"#64748b"}}/></div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0"><span className="text-sm font-medium text-foreground">{node.label}</span><span className="text-xs text-muted-foreground line-clamp-1">{node.desc}</span></div>
              </button>
            ); })}
          </>
        ) : (
          <>
            {/* Show category list */}
            {PICKER_CATEGORIES.map(cat => { const Icon = cat.icon; return (
              <button key={cat.label} onClick={()=>openCategory(cat.label)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-[10px] hover:bg-background transition-colors text-left group">
                <div className="size-11 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{background:cat.bg,border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={20} style={{color:cat.iconColor}}/></div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0"><span className="text-sm font-semibold text-foreground">{cat.label}</span><span className="text-xs text-muted-foreground line-clamp-1">{cat.desc}</span></div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-muted-foreground flex-shrink-0" />
              </button>
            ); })}
            <div className="mt-2 mb-1.5 px-1"><span className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Frequently Used</span></div>
            <div className="grid grid-cols-2 gap-1.5">
              {PICKER_FREQUENT.map(tool => { const Icon = tool.icon; return (
                <button key={tool.label} onClick={()=>pick(tool)} className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] hover:bg-background border border-border hover:border-border transition-all text-left">
                  <div className="size-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{background:tool.bg,border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={16} style={{color:tool.iconColor}}/></div>
                  <div className="flex flex-col gap-0 min-w-0"><span className="text-xs font-semibold text-foreground truncate">{tool.label}</span><span className="text-xs text-muted-foreground truncate">{tool.desc}</span></div>
                </button>
              ); })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Script / code step editor (Configuration tab) ───────────────────────────
function ScriptStepEditor({ step, selectedIdx, flow, cfg, execInfo, Icon, onUpdateStep, readOnly = false }) {
  const [inputJson, setInputJson]     = useState(step.scriptInput ?? DEFAULT_SCRIPT_INPUT);
  const [codeBody, setCodeBody]       = useState(step.scriptCode ?? DEFAULT_SCRIPT_BODY);
  const [outputJson, setOutputJson]   = useState(step.scriptOutput ?? DEFAULT_SCRIPT_OUTPUT);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const enhanceTimerRef = useRef(null);
  const suggestionPanelRef = useRef(null);

  useEffect(() => {
    setInputJson(step.scriptInput ?? DEFAULT_SCRIPT_INPUT);
    setCodeBody(step.scriptCode ?? DEFAULT_SCRIPT_BODY);
    setOutputJson(step.scriptOutput ?? DEFAULT_SCRIPT_OUTPUT);
  }, [selectedIdx, step.label, step.icon, step.scriptInput, step.scriptCode, step.scriptOutput]);

  useEffect(() => {
    setAiSuggestion(null);
    setAiLoading(false);
    return () => {
      if (enhanceTimerRef.current) {
        clearTimeout(enhanceTimerRef.current);
        enhanceTimerRef.current = null;
      }
    };
  }, [selectedIdx, step.label, step.icon]);

  useEffect(() => {
    if (aiSuggestion && !aiLoading && suggestionPanelRef.current) {
      suggestionPanelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [aiSuggestion, aiLoading]);

  const flush = () => {
    if (readOnly) return;
    onUpdateStep?.({
      scriptInput: inputJson,
      scriptCode: codeBody,
      scriptOutput: outputJson,
    });
  };

  const runEnhanceWithAI = () => {
    if (readOnly) return;
    if (enhanceTimerRef.current) {
      clearTimeout(enhanceTimerRef.current);
      enhanceTimerRef.current = null;
    }
    const snapshot = codeBody;
    flush();
    setAiLoading(true);
    setAiSuggestion(null);
    enhanceTimerRef.current = setTimeout(() => {
      enhanceTimerRef.current = null;
      setAiSuggestion(stubEnhanceScript(snapshot));
      setAiLoading(false);
    }, 900);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-[8px]" style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}>
          <Icon size={18} style={{ color: step.color }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold text-foreground">{step.label}</p>
          <span className="text-xs text-muted-foreground">{cfg.type ?? "Code"} · Step {selectedIdx + 1}</span>
        </div>
        <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: execInfo.bg, color: execInfo.color }}>
          {execInfo.label}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input</p>
            <span className="text-[10px] text-muted-foreground">JSON / context passed into this step</span>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            onBlur={flush}
            readOnly={readOnly}
            spellCheck={false}
            className="min-h-[72px] resize-y rounded-[8px] border border-border bg-background px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 read-only:cursor-default read-only:bg-muted/30"
            aria-label="Script input payload"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Code</p>
            <button
              type="button"
              onClick={runEnhanceWithAI}
              disabled={readOnly || aiLoading}
              className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-gradient-to-r from-primary/10 to-card px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm transition-colors hover:border-primary/30 hover:from-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiLoading ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {aiLoading ? "Enhancing…" : "Enhance with AI"}
            </button>
          </div>
          <textarea
            value={codeBody}
            onChange={(e) => setCodeBody(e.target.value)}
            onBlur={flush}
            readOnly={readOnly}
            spellCheck={false}
            className="min-h-[200px] resize-y rounded-[8px] border border-border bg-slate-950 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 read-only:cursor-default read-only:opacity-90"
            aria-label="Script source code"
          />
          {(aiLoading || aiSuggestion) && (
            <div
              ref={suggestionPanelRef}
              className="rounded-[8px] border border-primary/30 bg-primary/5 px-3 py-2.5"
              role="region"
              aria-label="AI enhancement suggestion"
            >
              {aiLoading && (
                <div className="flex items-center gap-2 text-[11px] font-medium text-primary">
                  <RefreshCw size={12} className="animate-spin flex-shrink-0" />
                  Analyzing your snippet…
                </div>
              )}
              {aiSuggestion && !aiLoading && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="flex-shrink-0 text-primary" />
                    <span className="text-[11px] font-semibold text-primary">Suggested code</span>
                  </div>
                  <textarea
                    readOnly
                    value={aiSuggestion}
                    spellCheck={false}
                    className="max-h-[180px] min-h-[100px] w-full resize-y rounded-[6px] border border-primary/25 bg-card px-2.5 py-2 font-mono text-[10px] leading-relaxed text-primary"
                    aria-label="AI suggested code"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        if (readOnly) return;
                        setCodeBody(aiSuggestion);
                        setAiSuggestion(null);
                        onUpdateStep?.({ scriptInput: inputJson, scriptCode: aiSuggestion, scriptOutput: outputJson });
                      }}
                      className="rounded-[6px] bg-primary px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Replace code
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        if (readOnly) return;
                        const merged = `${codeBody.trimEnd()}\n\n${aiSuggestion}`;
                        setCodeBody(merged);
                        setAiSuggestion(null);
                        onUpdateStep?.({ scriptInput: inputJson, scriptCode: merged, scriptOutput: outputJson });
                      }}
                      className="rounded-[6px] border border-primary/30 bg-card px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Append below
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiSuggestion(null)}
                      className="rounded-[6px] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-card/80"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="text-[10px] leading-snug text-muted-foreground">
            <span className="font-semibold text-muted-foreground">Enhance with AI</span> suggests edits inline. Use the{" "}
            <span className="font-semibold text-muted-foreground">Chat</span> tab for free-form questions.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output</p>
            <span className="text-[10px] text-muted-foreground">Shape returned to the next step (mock / contract)</span>
          </div>
          <textarea
            value={outputJson}
            onChange={(e) => setOutputJson(e.target.value)}
            onBlur={flush}
            readOnly={readOnly}
            spellCheck={false}
            className="min-h-[72px] resize-y rounded-[8px] border border-border bg-background px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 read-only:cursor-default read-only:bg-muted/30"
            aria-label="Script output schema"
          />
        </div>

        <div className="rounded-[8px] border border-dashed border-border bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Last run {flow.lastRun} · inputs and outputs are simulated until this flow is connected to a runtime.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Configure mode ───────────────────────────────────────────────────────────
function ConfigureMode({ step, selectedIdx, flow, onOpenChatTab, onUpdateStep, readOnly = false }) {
  const cfg      = NODE_CONFIGS[step.icon] ?? {};
  const execKey  = getExecStatus(flow.status, selectedIdx, flow.steps.length);
  const execInfo = STEP_EXEC[execKey];
  const [advOpen, setAdvOpen] = useState(false);
  const Icon = ICON_MAP[step.icon] ?? Zap;

  if (isScriptNodeIcon(step.icon)) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <ScriptStepEditor
          step={step}
          selectedIdx={selectedIdx}
          flow={flow}
          cfg={cfg}
          execInfo={execInfo}
          Icon={Icon}
          onUpdateStep={onUpdateStep}
          readOnly={readOnly}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {readOnly && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-[8px] border border-border bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
          <Info size={14} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
          <span>
            <span className="font-semibold text-foreground">View only.</span> Click <span className="font-semibold text-foreground">Edit</span> in the top bar to change this step.
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="size-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{background:`${step.color}18`,border:`1px solid ${step.color}30`}}>
          <Icon size={18} style={{color:step.color}} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{step.label}</p>
          <span className="text-xs text-muted-foreground">{cfg.type ?? "Node"} · Step {selectedIdx + 1}</span>
        </div>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{background:execInfo.bg,color:execInfo.color}}>{execInfo.label}</span>
      </div>

      {/* Primary fields — key/value list */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Configuration</p>
        <div className="rounded-[8px] border border-border overflow-hidden">
          {(cfg.fields ?? []).slice(0, 2).map(([k, v], i, arr) => (
            <div key={k} className={`flex items-center gap-3 px-3 py-2.5 bg-card ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
              <span className="text-xs font-medium text-muted-foreground w-20 flex-shrink-0">{k}</span>
              <span className="flex-1 h-px bg-muted" />
              <span className="text-xs font-mono text-foreground text-right truncate max-w-[140px]">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced collapsible */}
      <div className="border-b border-border">
        <button type="button" disabled={readOnly} onClick={() => !readOnly && setAdvOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-background transition-colors disabled:cursor-not-allowed disabled:opacity-60">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Advanced</span>
          <ChevronDown size={13} className={`text-muted-foreground transition-transform ${advOpen?"":"−rotate-90"}`} style={{transform:advOpen?"none":"rotate(-90deg)"}} />
        </button>
        {advOpen && (
          <div className="px-4 pb-3 flex flex-col gap-2.5">
            {(cfg.fields ?? []).slice(2).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{k}</label>
                <input readOnly={readOnly} defaultValue={v} className="bg-background border border-border rounded-[6px] px-3 py-1.5 text-xs text-foreground font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all read-only:bg-muted/30" />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Retry on Error</label>
              <select disabled={readOnly} className="bg-background border border-border rounded-[6px] px-3 py-1.5 text-xs text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60">
                <option>None</option><option>1 time</option><option>3 times</option><option>5 times</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Timeout (ms)</label>
              <input readOnly={readOnly} defaultValue="5000" type="number" className="bg-background border border-border rounded-[6px] px-3 py-1.5 text-xs text-foreground font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all read-only:bg-muted/30" />
            </div>
          </div>
        )}
      </div>

      {/* Preview summary */}
      <div className="px-4 py-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Preview</p>
        <div className="bg-background border border-border rounded-[8px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-5 rounded-[4px] flex items-center justify-center" style={{background:`${step.color}18`}}>
              <Icon size={11} style={{color:step.color}} />
            </div>
            <span className="text-xs font-semibold text-foreground">{step.label}</span>
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{background:execInfo.bg,color:execInfo.color}}>{execInfo.label}</span>
          </div>
          {(cfg.fields ?? []).slice(0, 3).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-16 flex-shrink-0 truncate">{k}</span>
              <span className="text-muted-foreground font-mono truncate flex-1">{v}</span>
            </div>
          ))}
          <div className="mt-1 pt-1.5 border-t border-border text-xs text-muted-foreground">
            Last ran {flow.lastRun} · {230 + selectedIdx * 80}ms
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ask AI mode ──────────────────────────────────────────────────────────────
function AskAIMode({ step, selectedIdx, flow, runState, readOnly = false }) {
  const execKey  = getExecStatus(flow.status, selectedIdx, flow.steps.length);
  const execInfo = STEP_EXEC[execKey];
  const Icon     = ICON_MAP[step.icon] ?? Zap;
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const scrollRef = useRef(null);

  const QUICK = [
    { label: "Explain this node",   icon: Info        },
    { label: "Why did this fail?",  icon: AlertCircle },
    { label: "Optimize this step",  icon: Gauge       },
  ];

  const send = (text) => {
    if (readOnly) return;
    const q = text.trim();
    if (!q) return;
    setMessages(m => [...m, { role:"user", text:q }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role:"ai", ...buildAIResponse(q, step, execKey) }]);
      setLoading(false);
    }, 900);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Context chip */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
        <div className="size-6 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{background:`${step.color}18`}}>
          <Icon size={12} style={{color:step.color}} />
        </div>
        <span className="text-xs text-muted-foreground">Context: <span className="font-medium text-foreground">{step.label}</span></span>
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{background:execInfo.bg,color:execInfo.color}}>{execInfo.label}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="size-7 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <Sparkles size={13} color="white" />
              </div>
              <span className="text-xs font-semibold text-foreground">AI Assistant</span>
            </div>
            <p className="text-xs text-muted-foreground leading-5">Ask me anything about <span className="font-medium text-foreground">{step.label}</span>.</p>
            <div className="flex flex-col gap-1.5 mt-1">
              {QUICK.map(({ label, icon: QIcon }) => (
                <button key={label} type="button" disabled={readOnly} onClick={() => send(label)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-background border border-border hover:bg-muted hover:border-muted-foreground/25 transition-all text-left group disabled:cursor-not-allowed disabled:opacity-50">
                  <QIcon size={12} className="text-muted-foreground group-hover:text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role==="user"?"items-end":"items-start"}`}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] px-3 py-2 rounded-[10px] bg-slate-950 text-white text-xs leading-5">{msg.text}</div>
            ) : (
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={10} color="white" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">AI Assistant</span>
                </div>
                <div className="bg-background border border-border rounded-[10px] px-3 py-2.5 text-xs text-[#374151] leading-5">
                  {msg.message.split("\n").map((line, li) => (
                    <p key={li} className={line===""?"h-2":""}>{line.replace(/\*\*(.*?)\*\*/g,"$1")}</p>
                  ))}
                </div>
                {msg.suggestions?.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {msg.suggestions.map((s, si) => (
                      <div key={si} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-[#22c55e] font-bold flex-shrink-0 mt-px">→</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.actions?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.actions.map((a, ai) => (
                      <button key={ai} className="px-2.5 py-1 rounded-[6px] bg-card border border-border text-xs font-medium text-muted-foreground hover:bg-background hover:border-muted-foreground/25 transition-all">
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
              <Sparkles size={10} color="white" />
            </div>
            <div className="flex gap-1 px-3 py-2 rounded-[10px] bg-background border border-border">
              {[0,1,2].map(i => <span key={i} className="size-1.5 rounded-full bg-muted-foreground" style={{animation:`nodeBounce 0.8s ease-in-out ${i*0.2}s infinite`}} />)}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-2 pt-2 flex gap-2 flex-shrink-0 border-t border-border">
        <button type="button" disabled={readOnly} className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-[6px] border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-background transition-colors disabled:cursor-not-allowed disabled:opacity-50">
          <RotateCcw size={11} /> Retry Node
        </button>
        <button type="button" disabled={readOnly} className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-[6px] bg-slate-950 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
          <CheckCircle2 size={11} /> Apply Changes
        </button>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div className={`flex items-center gap-2 border border-border rounded-[10px] px-3 py-2 transition-all bg-card ${readOnly ? "opacity-60" : "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"}`}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            readOnly={readOnly}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);} }}
            placeholder={readOnly ? "Edit flow to use chat…" : "Ask about this node…"}
            className="flex-1 text-xs text-foreground placeholder:text-muted-foreground outline-none bg-transparent" />
          <button type="button" onClick={()=>send(input)} disabled={readOnly || !input.trim()}
            className="flex items-center justify-center size-6 rounded-[6px] bg-primary text-white disabled:opacity-40 hover:bg-primary transition-colors">
            <Send size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Execution mode ───────────────────────────────────────────────────────────
function ExecutionMode({ step, selectedIdx, flow, runState }) {
  const [subTab, setSubTab] = useState("summary");
  const execKey     = getExecStatus(flow.status, selectedIdx, flow.steps.length);
  const execInfo    = STEP_EXEC[execKey];
  const io          = NODE_IO[step.icon] ?? { input:{}, output:{} };
  const isRunning   = runState.activeIdx === selectedIdx;
  const isDone      = runState.doneIdxs.has(selectedIdx);
  const dynInfo     = isRunning ? STEP_EXEC.running : isDone ? STEP_EXEC.success : execInfo;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Sub-tabs — modern underline design */}
      <div className="flex items-center gap-0 px-0 py-0 border-b border-border flex-shrink-0">
        {[
          { id:"summary", icon:ListChecks, label:"Summary" },
          { id:"json",    icon:Braces,     label:"JSON"    },
          { id:"logs",    icon:ScrollText, label:"Logs"    },
        ].map(({ id, icon:TabIcon, label }) => (
          <button key={id} onClick={()=>setSubTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all border-b-2 ${
              subTab===id?"text-foreground border-b-primary":"text-muted-foreground border-b-transparent hover:text-muted-foreground"
            }`}>
            <TabIcon size={12} /> {label}
          </button>
        ))}
        <div className="ml-auto">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background:dynInfo.bg,color:dynInfo.color}}>
            {isRunning?"Running…":isDone?"Done":dynInfo.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {subTab === "summary" && (
          <div className="flex flex-col">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px bg-muted border-b border-border">
              {[["Duration",`${230+selectedIdx*80}ms`],["Records","1"],["Retries","0"]].map(([l,v])=>(
                <div key={l} className="bg-card flex flex-col items-center py-3 gap-0.5">
                  <span className="text-lg font-bold text-foreground">{v}</span>
                  <span className="text-xs text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Input</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(io.input).slice(0,4).map(([k,v])=>(
                  <div key={k} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground w-20 flex-shrink-0 pt-0.5">{k}</span>
                    <span className="text-foreground font-mono break-all">{typeof v==="object"?JSON.stringify(v):String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Output</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(io.output).slice(0,5).map(([k,v])=>(
                  <div key={k} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground w-20 flex-shrink-0 pt-0.5">{k}</span>
                    <span className="text-foreground font-mono break-all">{typeof v==="object"?JSON.stringify(v):String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {subTab === "json" && (
          <div className="px-4 py-3 flex flex-col gap-3">
            {[["Input",io.input],["Output",io.output]].map(([lbl,data])=>(
              <div key={lbl}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{lbl}</p>
                <pre className="bg-background border border-border rounded-[8px] px-3 py-2.5 text-sm font-mono text-[#374151] overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(data,null,2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {subTab === "logs" && (
          <div className="px-3 py-2 font-mono flex flex-col gap-0.5">
            {[
              { ts:"15:49:00.000", level:"INFO",    msg:`Step ${selectedIdx+1} — ${step.label}: started` },
              { ts:"15:49:00.180", level:"INFO",    msg:"Authenticating with upstream service" },
              { ts:"15:49:00.312", level:"INFO",    msg:"Request dispatched" },
              { ts:"15:49:00.501", level:execKey==="error"?"ERROR":"SUCCESS", msg:execKey==="error"?`Connection timeout after 5000ms`:`Completed in ${230+selectedIdx*80}ms` },
            ].map((entry,i)=>(
              <div key={i} className="flex items-start gap-2 py-0.5 hover:bg-background rounded px-1 text-xs">
                <span className="text-muted-foreground flex-shrink-0 tabular-nums">{entry.ts}</span>
                <span className={`flex-shrink-0 w-[52px] text-center px-1 py-0.5 rounded text-xs font-bold uppercase ${LOG_BADGES[entry.level]}`}>{entry.level}</span>
                <span className={LOG_COLORS[entry.level]}>{entry.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Flow overview (no node selected) ─────────────────────────────────────────
function FlowOverview({ flow, executeOnly = false }) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-3">
          <dl className="flex flex-col gap-0 text-xs">
            {[
              ["Name",       flow.name],
              ["Description", flow.description || "—"],
              ["Status",     flow.status?.charAt(0).toUpperCase()+flow.status?.slice(1)],
              ["Steps",      flow.steps.length],
              ["Total Runs", flow.runs?.toLocaleString()],
              ["Success",    flow.success!=null?`${flow.success}%`:"—"],
              ["Last Run",   flow.lastRun],
              ["Created",    flow.createdAt],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 border-b border-border py-1.5">
                <dt className="text-muted-foreground text-xs">{k}</dt>
                <dd className="m-0 font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-start gap-2 rounded-[8px] border border-primary/25 bg-primary/10 px-3 py-2.5 text-xs text-primary">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <span>
              {executeOnly ? (
                <>
                  <strong>Tip:</strong> Click a node to inspect configuration and logs. Click <strong>Edit</strong> in the top bar to add or remove nodes.
                </>
              ) : (
                <>
                  <strong>Tip:</strong> Click any node in the canvas to inspect its configuration and execution result. Use the toolbar to add or remove nodes.
                </>
              )}
            </span>
          </div>
        </div>
    </div>
  );
}

// ─── Shared template definitions ──────────────────────────────────────────────
const CREATION_TEMPLATES = [
  {
    icon: Mail, color: "#06b6d4", label: "Email automation",
    desc: "Trigger → Filter → Send",
    steps: [
      { label: "Email Trigger", icon: "Webhook",   color: "#6366f1", status: "pending" },
      { label: "Filter Rules",  icon: "GitBranch", color: "#f59e0b", status: "pending" },
      { label: "Send Email",    icon: "Mail",      color: "#06b6d4", status: "pending" },
    ],
  },
  {
    icon: Database, color: "#0891b2", label: "Data pipeline",
    desc: "Fetch → Validate → Store",
    steps: [
      { label: "Fetch Data",    icon: "Globe",    color: "#2563eb", status: "pending" },
      { label: "Validate",      icon: "Zap",      color: "#f59e0b", status: "pending" },
      { label: "Store Results", icon: "Database", color: "#0891b2", status: "pending" },
    ],
  },
  {
    icon: Bot, color: "#7c3aed", label: "Lead scoring",
    desc: "CRM Trigger → Score → Update",
    steps: [
      { label: "CRM Trigger",   icon: "Webhook",  color: "#6366f1", status: "pending" },
      { label: "Score with AI", icon: "Bot",      color: "#7c3aed", status: "pending" },
      { label: "Update CRM",    icon: "Database", color: "#0891b2", status: "pending" },
    ],
  },
  {
    icon: FileText, color: "#f59e0b", label: "Document processing",
    desc: "Upload → Extract → Save",
    steps: [
      { label: "File Upload",   icon: "FileText", color: "#f59e0b", status: "pending" },
      { label: "Smart Extract", icon: "Bot",      color: "#7c3aed", status: "pending" },
      { label: "Save to DB",    icon: "Database", color: "#0891b2", status: "pending" },
    ],
  },
];

// ─── Flow creation helper component (embedded inside ConversationPanel) ────────
function FlowCreationMode({ onSendMessage, onAddTemplate }) {
  return (
    <div className="flex flex-col gap-1.5 px-1 pb-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 pt-2">Start with a template</p>
      {CREATION_TEMPLATES.map((tpl, i) => {
        const TplIcon = tpl.icon;
        return (
          <button
            key={i}
            onClick={() => {
              onAddTemplate(tpl.steps);
              onSendMessage(`Build a ${tpl.label.toLowerCase()} workflow`);
            }}
            className="flex items-center gap-3 p-2.5 rounded-[10px] border border-border hover:border-primary hover:bg-primary/10 transition-all text-left group"
          >
            <div className="size-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ background: `${tpl.color}18`, border: `1px solid ${tpl.color}28` }}>
              <TplIcon size={16} style={{ color: tpl.color }} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{tpl.label}</span>
              <span className="text-[11px] text-muted-foreground">{tpl.desc}</span>
            </div>
            <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
          </button>
        );
      })}
      <button
        onClick={() => onSendMessage("Help me build a custom workflow from scratch")}
        className="flex items-center justify-center gap-1.5 py-2 mt-0.5 rounded-[8px] border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
      >
        <Plus size={12} /> Start from scratch
      </button>
    </div>
  );
}

// ─── Right panel — always visible; shows flow config or node config+chat ───────
function RightPanel({
  flow,
  selectedIdx,
  runState,
  onClose,
  showEmptyFlowAssistant,
  onCloseEmptyFlowAssistant,
  assistantFocusKey,
  convMessages,
  onAddConvMessage,
  onRunFlow,
  onAddTemplate,
  logs,
  convCollapsed,
  onToggleConvCollapse,
  onUpdateStep,
  onRefreshLogs,
  logRefreshing,
  allowLogRefresh,
  onSelectLogNode,
  runElapsedLabel = null,
  executeOnly = false,
}) {
  const [panelMode, setPanelMode] = useState("configure");
  const [emptyFlowTab, setEmptyFlowTab] = useState("assistant"); // "assistant" | "settings"

  const hasNode   = selectedIdx !== null && flow.steps[selectedIdx];
  const step      = hasNode ? flow.steps[selectedIdx] : null;
  const isRunning = hasNode && runState.activeIdx === selectedIdx;
  const isDone    = hasNode && runState.doneIdxs.has(selectedIdx);
  const execKey   = hasNode ? getExecStatus(flow.status, selectedIdx, flow.steps.length) : "pending";
  const dynInfo   = isRunning ? STEP_EXEC.running : isDone ? STEP_EXEC.success : STEP_EXEC[execKey] ?? STEP_EXEC.pending;
  const isEmpty   = flow.steps.length === 0;

  // Reset to configure tab when node changes
  useEffect(() => { setPanelMode("configure"); }, [selectedIdx]);

  useEffect(() => {
    if (assistantFocusKey > 0) setEmptyFlowTab("assistant");
  }, [assistantFocusKey]);

  return (
    <div className="flex h-full min-h-0 w-[360px] flex-shrink-0 flex-col overflow-hidden border-l border-border bg-card">

      {/* ── EMPTY FLOW: Overview only ── */}
      {!hasNode && isEmpty && (
        <>
          <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border flex-shrink-0">
            <div className="size-6 rounded-[6px] bg-muted flex items-center justify-center flex-shrink-0">
              <Eye size={13} className="text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Overview</span>
          </div>
          <FlowOverview flow={flow} executeOnly={executeOnly} />
        </>
      )}

      {/* ── NO NODE, HAS STEPS: flow-level overview ── */}
      {!hasNode && !isEmpty && (
        <FlowOverview flow={flow} executeOnly={executeOnly} />
      )}

      {/* ── NODE SELECTED: Configuration | Chat tabs ── */}
      {hasNode && (
        <>
          {/* Node header */}
          <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border flex-shrink-0 bg-card">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{step.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{step.icon}</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: dynInfo.bg, color: dynInfo.color }}>
              {isRunning ? "Running…" : isDone ? "Done" : dynInfo.label}
            </span>
            <button onClick={onClose}
              className="size-6 flex items-center justify-center rounded-[5px] text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors flex-shrink-0">
              <X size={13} />
            </button>
          </div>

          {/* Tab bar: Configuration | Chat */}
          <div className="flex border-b border-border flex-shrink-0">
            {[
              { id: "configure", icon: Hammer,   label: "Configuration" },
              { id: "chat",      icon: Sparkles,  label: "Chat"          },
            ].map(({ id, icon: TIcon, label }) => (
              <button key={id} onClick={() => setPanelMode(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2 ${
                  panelMode === id
                    ? "text-foreground border-b-primary"
                    : "text-muted-foreground border-b-transparent hover:text-muted-foreground"
                }`}>
                <TIcon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {panelMode === "configure" && (
              <div className="flex-1 overflow-y-auto">
                <ConfigureMode
                  step={step}
                  selectedIdx={selectedIdx}
                  flow={flow}
                  onOpenChatTab={() => setPanelMode("chat")}
                  onUpdateStep={(patch) => onUpdateStep?.(selectedIdx, patch)}
                  readOnly={executeOnly}
                />
              </div>
            )}
            {panelMode === "chat" && (
              <AskAIMode step={step} selectedIdx={selectedIdx} flow={flow} runState={runState} readOnly={executeOnly} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Execution log panel (bottom or right dock — log stream only) ─────────────
function ExecutionLogPanel({
  logs,
  runState,
  runElapsedLabel = null,
  lastRunTotalLabel = null,
  collapsed,
  onToggleCollapse,
  onMouseDownResize,
  onRefresh,
  refreshing = false,
  allowRefresh = true,
  dock = "bottom",
  flow = null,
}) {
  const logsRef    = useRef(null);
  const [activeTab, setActiveTab] = useState("logs");
  const isRunning  = runState.activeIdx !== -1;
  const hasDone    = runState.doneIdxs.size > 0;
  const isRight    = dock === "right";
  const canRefresh = typeof onRefresh === "function" && !isRunning && allowRefresh && activeTab === "logs";
  const displayLogs = logs.filter((e) => e.level !== "INFO");
  const executionId = logs.find((e) => e.executionId)?.executionId ?? null;

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  // ── Mock execution history rows (deterministic so they don't jitter) ──
  const execHistory = useMemo(() => {
    const total = Math.min(flow?.runs || 0, 20);
    const successRate = flow?.success ?? 80;
    const stepCount = flow?.steps?.length ?? 0;
    const triggers = ["Webhook", "Manual", "Scheduled", "API"];
    const base = Date.now();
    return Array.from({ length: total }, (_, i) => {
      const ok = ((Math.sin(i * 73 + 1) + 1) / 2) * 100 < successRate;
      const minsAgo = (i + 1) * 11 + ((i * 17) % 23);
      const d = new Date(base - minsAgo * 60000);
      const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const dateStr = minsAgo < 60
        ? `Today, ${timeStr}`
        : minsAgo < 1440
        ? `Today, ${timeStr}`
        : `${Math.floor(minsAgo / 1440)}d ago`;
      const durMs = 400 + ((i * 313 + 7) % 2800);
      const dur = durMs >= 1000 ? `${(durMs / 1000).toFixed(1)}s` : `${durMs}ms`;
      return {
        id: `run_${(base - i * 9999).toString(36).slice(-8)}`,
        status: ok ? "success" : "error",
        started: dateStr,
        duration: dur,
        steps: stepCount,
        trigger: triggers[i % 4],
      };
    });
  }, [flow?.runs, flow?.success, flow?.steps?.length]);

  return (
    <div
      className={`flex h-full w-full min-h-0 overflow-hidden bg-card dark:bg-card ${
        isRight ? "flex-row" : "flex-col"
      }`}
    >
      {/* Resize handle */}
      {!collapsed && onMouseDownResize && !isRight && (
        <div
          onMouseDown={onMouseDownResize}
          className="group flex h-1.5 w-full flex-shrink-0 cursor-row-resize items-center justify-center"
        >
          <div className="h-1 w-10 rounded-full bg-border transition-colors group-hover:bg-primary dark:bg-[#334155]" />
        </div>
      )}
      {!collapsed && onMouseDownResize && isRight && (
        <div
          onMouseDown={onMouseDownResize}
          className="group flex w-1.5 flex-shrink-0 cursor-col-resize items-center justify-center border-r border-border dark:border-border"
        >
          <div className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-primary dark:bg-[#334155]" />
        </div>
      )}

      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${isRight && collapsed ? "min-w-0" : ""}`}>

        {/* ── Header row ───────────────────────────────────────────── */}
        <div
          className={`flex flex-shrink-0 items-center gap-2 border-b border-border dark:border-border ${
            isRight && collapsed
              ? "h-full w-full flex-col justify-start gap-2 py-2 px-1"
              : "h-10 px-3"
          }`}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex size-6 flex-shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <Terminal size={13} className="flex-shrink-0 text-muted-foreground" />

          {!(isRight && collapsed) && (
            <>
              {/* Tab switcher */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("logs")}
                  className={`flex h-6 items-center gap-1.5 rounded-[5px] px-2.5 text-[11px] font-semibold transition-colors ${
                    activeTab === "logs"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Logs
                  {(isRunning || hasDone) && activeTab !== "logs" && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`flex h-6 items-center gap-1.5 rounded-[5px] px-2.5 text-[11px] font-semibold transition-colors ${
                    activeTab === "history"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Execution History
                  {execHistory.length > 0 && (
                    <span className="rounded-full bg-muted px-1.5 py-px text-[9px] font-bold tabular-nums text-muted-foreground">
                      {execHistory.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Status badges + actions */}
              <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
                {activeTab === "logs" && isRunning && (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <RefreshCw size={9} className="animate-spin" />
                    <span className="tabular-nums">{runElapsedLabel ?? "0.0s"}</span>
                  </span>
                )}
                {activeTab === "logs" && !isRunning && hasDone && (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-[#dcfce7]/80 px-1.5 py-0.5 text-[10px] font-medium text-[#15803d]">
                    Done{lastRunTotalLabel ? <span className="tabular-nums opacity-90">· {lastRunTotalLabel}</span> : null}
                  </span>
                )}
                {canRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    title={displayLogs.length > 0 ? `Refresh · ${displayLogs.length} entries` : "Rebuild log from current flow (demo)"}
                    aria-label="Refresh execution log"
                    className="flex size-7 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Tab content ──────────────────────────────────────────── */}
        {!collapsed && (
          <>
            {/* LOGS tab */}
            {activeTab === "logs" && (
              <div
                ref={logsRef}
                className="min-h-0 flex-1 overflow-y-auto bg-background dark:bg-background"
              >
                {logs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-8">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Terminal size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">No execution output yet.</p>
                    <p className="max-w-[240px] text-center text-[11px] leading-relaxed text-muted-foreground">
                      Run the flow to see logs here. Use refresh to regenerate demo output.
                    </p>
                  </div>
                ) : displayLogs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                    <Terminal size={20} className="text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">INFO lines are hidden</p>
                    <p className="max-w-[240px] text-[11px] leading-relaxed text-muted-foreground">
                      This run only produced INFO-level messages. SUCCESS, WARN, and ERROR lines still appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 px-2 py-1 font-mono">
                    {displayLogs.map((entry) => {
                      const rowExecId = entry.executionId ?? executionId;
                      return (
                        <div
                          key={entry.id ?? `${entry.ts}-${entry.msg}`}
                          className="flex items-start gap-2 py-1.5 pl-1 pr-2 text-[10px] leading-snug text-foreground transition-colors hover:bg-muted/40"
                          title={rowExecId ? `${entry.level} · ${rowExecId}` : entry.level}
                        >
                          <span
                            className="mt-1.5 size-1.5 flex-shrink-0 rounded-full"
                            style={{ background: LOG_LEVEL_DOT[entry.level] ?? LOG_LEVEL_DOT.INFO }}
                            aria-hidden
                          />
                          <span
                            className="w-[72px] flex-shrink-0 truncate font-mono tabular-nums text-muted-foreground"
                            title={rowExecId ?? undefined}
                          >
                            {rowExecId ? shortExecutionId(rowExecId) : "—"}
                          </span>
                          <span className="w-[76px] flex-shrink-0 tabular-nums text-muted-foreground">{entry.ts}</span>
                          <span className={`min-w-0 flex-1 break-words ${LOG_COLORS[entry.level] ?? "text-foreground"}`}>{entry.msg}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* EXECUTION HISTORY tab */}
            {activeTab === "history" && (
              <div className="min-h-0 flex-1 overflow-auto bg-background dark:bg-background">
                {execHistory.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-8">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <History size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">No runs yet.</p>
                    <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-muted-foreground">
                      Run this flow to start building execution history.
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[520px] border-collapse text-[11px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-border bg-muted/60 dark:bg-muted/40">
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Run ID</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Started</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Duration</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Steps</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Trigger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {execHistory.map((row) => (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                            {row.id}
                          </td>
                          <td className="px-3 py-2">
                            {row.status === "success" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#dcfce7] px-1.5 py-0.5 text-[10px] font-semibold text-[#15803d] dark:bg-[#14532d]/50 dark:text-[#4ade80]">
                                <CheckCircle2 size={9} />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#fee2e2] px-1.5 py-0.5 text-[10px] font-semibold text-[#dc2626] dark:bg-[#450a0a]/50 dark:text-[#f87171]">
                                <AlertCircle size={9} />
                                Error
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{row.started}</td>
                          <td className="px-3 py-2 tabular-nums text-foreground">{row.duration}</td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.steps}</td>
                          <td className="px-3 py-2">
                            <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {row.trigger}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Execution timeline panel (kept for reference, no longer rendered) ─────────
function ExecutionTimeline({ flow, runState, logs, onHighlightNode, collapsed, onToggle }) {
  const [logTab, setLogTab] = useState("timeline");
  const execStatus = runState.activeIdx !== -1 ? "running" : runState.doneIdxs.size > 0 ? "done" : "idle";
  const displayLogs = logs.filter((e) => e.level !== "INFO");

  return (
    <div className="flex-shrink-0 border-t border-border bg-card flex flex-col overflow-hidden transition-all duration-300"
      style={{ height: collapsed ? 40 : 220 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 flex-shrink-0 border-b border-border">
        <div className="flex items-center gap-1">
          {[
            { id:"timeline", icon:Activity, label:"Execution" },
            { id:"log",      icon:Terminal, label:"Log"       },
          ].map(({ id, icon:TabIcon, label }) => (
            <button key={id} onClick={()=>setLogTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                logTab===id?"bg-muted text-foreground":"text-muted-foreground hover:text-muted-foreground hover:bg-background"
              }`}>
              <TabIcon size={12} /> {label}
            </button>
          ))}
          {execStatus!=="idle" && (
            <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${execStatus==="running"?"bg-[#dbeafe] text-primary":"bg-[#dcfce7] text-[#15803d]"}`}>
              {execStatus==="running"?"Running…":"Completed"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{flow.steps.length} steps</span>
          <button onClick={onToggle} className="flex items-center justify-center size-6 rounded-[4px] text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors">
            {collapsed ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          {logTab === "timeline" && (
            <div className="px-6 py-3 relative">
              {/* Connecting line — positioned at circle center height */}
              <div className="absolute top-[35px] left-[20px] right-[20px] h-px bg-border" style={{zIndex:0}} />
              <div className="flex items-start gap-0">
                {flow.steps.map((step, i) => {
                  const isRunning = runState.activeIdx === i;
                  const isDone    = runState.doneIdxs.has(i);
                  const exec = isRunning ? STEP_EXEC.running : isDone ? STEP_EXEC.success : STEP_EXEC.pending;
                  return (
                    <button key={i} onClick={()=>onHighlightNode(i)}
                      className="flex flex-col items-center gap-1.5 flex-1 min-w-0 relative group hover:opacity-90 transition-opacity"
                      title={`${step.label}`}>
                      <div className="size-10 rounded-full border-2 flex items-center justify-center relative z-10 bg-card transition-all"
                        style={{ borderColor:exec.color, background:isRunning||isDone?exec.bg:"white", boxShadow:isRunning?`0 0 0 3px ${exec.ring}`:"none" }}>
                        {isRunning
                          ? <RefreshCw size={14} color={exec.color} style={{animation:"nodeSpinAnim 0.8s linear infinite"}} />
                          : isDone
                            ? <CheckCircle2 size={14} color={exec.color} />
                            : <Circle size={14} color={exec.color} />
                        }
                      </div>
                      <span className="text-xs font-medium text-muted-foreground text-center truncate w-full px-1">{step.label}</span>
                      <span className="text-xs text-muted-foreground">{isDone?`${230+i*80}ms`:isRunning?"…":"—"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {logTab === "log" && (
            <div className="flex flex-col gap-0.5 px-4 py-2 font-mono text-xs">
              {displayLogs.length === 0 ? (
                <div className="text-muted-foreground py-4 text-center text-xs">Run the flow to see logs.</div>
              ) : displayLogs.map((entry,i) => (
                <div key={i}
                  className={`flex items-start gap-2 py-0.5 hover:bg-background rounded px-1 transition-colors ${entry.nodeIdx!==null?"cursor-pointer":""}`}
                  onClick={()=>entry.nodeIdx!==null&&onHighlightNode(entry.nodeIdx)}>
                  <span className="text-muted-foreground flex-shrink-0 tabular-nums">{entry.ts}</span>
                  <span className={`flex-shrink-0 w-[52px] text-center px-1 py-0.5 rounded text-xs font-bold uppercase ${LOG_BADGES[entry.level]}`}>{entry.level}</span>
                  <span className={LOG_COLORS[entry.level]}>{entry.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Canvas ────────────────────────────────────────────────────────────────────
function Canvas({ flow, selectedIdx, onSelectNode, onAddNode, onAddTemplate, runState, onSetCreationEntry, onOpenFlowAssistant, onNodeToolbarAction, readOnly = false }) {
  const [picker, setPicker]           = useState(null);
  const [emptyHov, setEmptyHov]       = useState(false);
  const [zoom, setZoom]               = useState(1);
  const canvasScrollRef               = useRef(null);

  useEffect(() => {
    if (readOnly) setPicker(null);
  }, [readOnly]);
  const canvasW = PAD_X * 2 + flow.steps.length * NODE_W + (flow.steps.length - 1) * H_GAP + 160;
  const canvasH = 480;
  const svgW    = Math.max(canvasW, 800);
  const ZOOM_MIN = 0.7;
  const ZOOM_MAX = 1.4;
  const ZOOM_STEP = 0.1;

  // Empty-node geometry (centered on canvas)
  const eX  = (svgW - NODE_W) / 2;
  const eY  = NODE_Y;
  const eCX = eX + NODE_W / 2;
  const eCY = eY + NODE_H / 2;

  return (
    <div
      ref={canvasScrollRef}
      className="relative flex-1 min-w-0 overflow-auto bg-background"
      style={{ backgroundImage:"radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize:"24px 24px" }}
      onClick={() => { onSelectNode(null); setPicker(null); }}
    >

      {/* Empty-canvas overlay — shown only when there are no steps yet */}
      {flow.steps.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-5 pointer-events-auto" onClick={e => e.stopPropagation()}>
            {readOnly ? (
              <div className="flex max-w-[320px] flex-col items-center gap-2 rounded-[12px] border border-border bg-card px-6 py-5 text-center shadow-sm">
                <p className="text-sm font-semibold text-foreground">No steps to run yet</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This flow has no steps. Click <span className="font-semibold text-foreground">Edit</span> in the top bar to add nodes and build the workflow.
                </p>
              </div>
            ) : flow.creationEntry === "scratch" ? (
              <>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="size-12 rounded-[14px] bg-card border border-border shadow-sm flex items-center justify-center mb-1">
                    <Plus size={22} className="text-primary" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Start from scratch</p>
                  <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">Build your flow step by step. Open the node picker to add any node type, or switch to starter templates if you prefer a head start.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPicker({ afterIndex: -1, anchorX: (svgW + NODE_W) / 2 + 24, anchorY: NODE_Y + NODE_H / 2 }); }}
                    className="flex h-10 items-center gap-2 rounded-[10px] bg-slate-950 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
                  >
                    <Plus size={16} strokeWidth={2.5} /> Add first step
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenFlowAssistant?.(); }}
                    className="flex h-10 items-center gap-2 rounded-[10px] border border-border bg-card px-5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-background"
                  >
                    <Sparkles size={16} className="text-primary" /> Ask AI
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSetCreationEntry?.("template"); }}
                  className="text-xs font-medium text-primary hover:text-primary underline-offset-2 hover:underline"
                >
                  Browse starter templates
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div className="size-12 rounded-[14px] bg-card border border-border shadow-sm flex items-center justify-center mb-1">
                    <Zap size={22} className="text-primary" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Design your workflow</p>
                  <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">Pick a template to get started instantly, or add your first step manually.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-[400px]">
                  {CREATION_TEMPLATES.map((tpl, i) => {
                    const TplIcon = tpl.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onAddTemplate(tpl.steps)}
                        className="flex items-center gap-2.5 p-3 rounded-[12px] bg-card border border-border hover:border-primary hover:shadow-md hover:-translate-y-px transition-all text-left group"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                      >
                        <div className="size-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                          style={{ background: `${tpl.color}15`, border: `1px solid ${tpl.color}25` }}>
                          <TplIcon size={15} style={{ color: tpl.color }} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">{tpl.label}</span>
                          <span className="text-[11px] text-muted-foreground truncate">{tpl.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPicker({ afterIndex: -1, anchorX: (svgW + NODE_W) / 2 + 24, anchorY: NODE_Y + NODE_H / 2 }); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-[6px] hover:bg-card border border-transparent hover:border-border"
                >
                  <Plus size={12} /> Add first step manually
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSetCreationEntry?.("scratch"); }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Prefer a blank canvas?
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenFlowAssistant?.(); }}
                  className="text-xs font-medium text-primary hover:text-primary underline-offset-2 hover:underline"
                >
                  Ask AI to plan this flow
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-[8px] border border-border bg-card p-1 shadow-sm">
        <button
          type="button"
          title="Zoom in"
          aria-label="Zoom in"
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100)); }}
          className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted"
        >
          <ZoomIn size={14} />
        </button>
        <div className="h-px bg-border" />
        <button
          type="button"
          title="Zoom out"
          aria-label="Zoom out"
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100)); }}
          className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted"
        >
          <ZoomOut size={14} />
        </button>
        <div className="h-px bg-border" />
        <button
          type="button"
          title="Reset zoom and scroll"
          aria-label="Reset zoom and scroll"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            canvasScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
          }}
          className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted"
        >
          <Crosshair size={14} />
        </button>
      </div>

      <div
        className="inline-block origin-top-left transition-transform duration-150 ease-out will-change-transform"
        style={{ transform: `scale(${zoom})` }}
        onClick={(e) => e.stopPropagation()}
      >
      <svg width={svgW} height={canvasH} className="block" onClick={e=>e.stopPropagation()}>
        {/* Empty-canvas SVG placeholder hidden — HTML overlay handles it */}

        {flow.steps.map((step, i) => {
          if (i === flow.steps.length - 1) return null;
          const x1 = PAD_X + i*(NODE_W+H_GAP) + NODE_W;
          const y1 = NODE_Y + NODE_H/2;
          const x2 = PAD_X + (i+1)*(NODE_W+H_GAP);
          const y2 = NODE_Y + NODE_H/2;
          return (
            <ConnectionWithAdd key={i} x1={x1} y1={y1} x2={x2} y2={y2} color={step.color}
              afterIndex={i}
              onOpenPicker={(ai, mx, my) => setPicker({ afterIndex:ai, anchorX:mx+20, anchorY:my })}
              isFlowing={runState.activeIdx === i+1}
              isDone={runState.doneIdxs.has(i) && runState.doneIdxs.has(i+1)}
              readOnly={readOnly}
            />
          );
        })}

        {flow.steps.map((step, i) => (
          <CanvasNode key={step.label+i} step={step} index={i}
            x={PAD_X + i*(NODE_W+H_GAP)} y={NODE_Y}
            selected={selectedIdx === i}
            execStatus={getExecStatus(flow.status, i, flow.steps.length)}
            onClick={onSelectNode}
            onOpenPicker={(ai, ax, ay) => setPicker({ afterIndex:ai, anchorX:ax, anchorY:ay })}
            onToolbarAction={onNodeToolbarAction}
            isRunning={runState.activeIdx === i}
            isDone={runState.doneIdxs.has(i)}
            readOnly={readOnly}
          />
        ))}
      </svg>
      </div>

      {picker && !readOnly && (
        <AddNodePicker
          anchorX={picker.anchorX} anchorY={picker.anchorY} afterIndex={picker.afterIndex}
          onAdd={(ai, ns) => { onAddNode(ai, ns); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

// ─── Conversation panel ────────────────────────────────────────────────────────

function OverviewCard({ flow }) {
  const badge = STATUS_BADGE[flow.status] ?? STATUS_BADGE.draft;
  const desc = typeof flow.description === "string" ? flow.description.trim() : "";
  return (
    <div className="bg-background border border-border rounded-[10px] p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground truncate">{flow.name}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
          style={{background: badge.bg, color: badge.text}}>
          <span className="size-1.5 rounded-full inline-block" style={{background: badge.dot}} />
          {badge.label}
        </span>
      </div>
      {desc ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-4">{desc}</p>
      ) : (
        <p className="text-[10px] leading-relaxed text-muted-foreground/90 italic">
          No description yet. Use the menu (⋯) → Settings to say what this flow does.
        </p>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {[["Steps", flow.steps.length], ["Runs", flow.runs?.toLocaleString() ?? "0"], ["Success", flow.success != null ? `${flow.success}%` : "—"]].map(([k,v]) => (
          <div key={k} className="flex flex-col items-center bg-card border border-border rounded-[6px] py-2 gap-0.5">
            <span className="text-sm font-bold text-foreground">{v}</span>
            <span className="text-[10px] text-muted-foreground">{k}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Clock size={9} />
        <span>Last run: {flow.lastRun ?? "—"}</span>
      </div>
    </div>
  );
}

function RunStartMsg({ name }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-[#dbeafe] rounded-[8px] border border-[#bfdbfe]">
      <RefreshCw size={11} className="text-primary animate-spin flex-shrink-0" />
      <span className="text-xs font-medium text-[#1e40af]">Executing "{name}"…</span>
    </div>
  );
}

function StepActiveMsg({ msg }) {
  const Icon = ICON_MAP[msg.icon] ?? Zap;
  return (
    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-[8px] border border-border bg-card">
      <div className="size-5 rounded-[4px] flex items-center justify-center flex-shrink-0" style={{background:`${msg.color}18`}}>
        <Icon size={10} style={{color: msg.color}} />
      </div>
      <span className="text-xs text-muted-foreground flex-1 truncate">
        Step {msg.idx + 1}: <span className="font-medium text-foreground">{msg.label}</span>
      </span>
      <div className="flex gap-0.5 flex-shrink-0">
        {[0,1,2].map(i => (
          <span key={i} className="size-1 rounded-full bg-[#3b82f6]"
            style={{animation:`nodeBounce 0.8s ease-in-out ${i*0.2}s infinite`}} />
        ))}
      </div>
    </div>
  );
}

function StepDoneMsg({ msg }) {
  return (
    <div className="flex items-center gap-2 py-1 px-2.5">
      <CheckCircle2 size={12} className="text-[#22c55e] flex-shrink-0" />
      <span className="text-xs text-muted-foreground flex-1 truncate">{msg.label}</span>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">{msg.duration}ms</span>
    </div>
  );
}

function RunDoneMsg({ msg }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-[#dcfce7] rounded-[8px] border border-[#bbf7d0]">
      <CheckCircle2 size={11} className="text-[#16a34a] flex-shrink-0" />
      <span className="text-xs font-medium text-[#15803d]">
        Completed — {msg.total} step{msg.total !== 1 ? "s" : ""} · {(msg.duration / 1000).toFixed(1)}s
      </span>
    </div>
  );
}

function ConversationPanel({
  flow,
  runState,
  messages,
  onAddMessage,
  onRunFlow,
  onAddTemplate,
  logs = [],
  collapsed = false,
  onToggleCollapse,
  focusChatKey = 0,
  onRefreshLogs,
  logRefreshing = false,
  allowLogRefresh = true,
  onSelectLogNode,
  runElapsedLabel = null,
}) {
  const [input, setInput]         = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "logs"
  const scrollRef                 = useRef(null);
  const logsRef                   = useRef(null);
  const chatInputRef              = useRef(null);
  const isRunning                 = runState.activeIdx !== -1;
  const isNewFlow                 = flow.steps.length === 0;
  const hasRun                    = logs.length > 0;
  const logExecutionId            = logs.find((e) => e.executionId)?.executionId ?? null;
  const displayLogs               = logs.filter((e) => e.level !== "INFO");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiLoading]);

  // Auto-switch to logs tab when a run starts; auto-scroll logs
  useEffect(() => {
    if (isRunning) setActiveTab("logs");
  }, [isRunning]);

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (focusChatKey <= 0) return;
    const id = requestAnimationFrame(() => {
      chatInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [focusChatKey]);

  const sendMessage = (text) => {
    const q = text.trim();
    if (!q) return;
    onAddMessage({ type: "user", id: `u-${Date.now()}`, text: q });
    setInput("");
    setAiLoading(true);
    setTimeout(() => {
      const resp = buildAIResponse(q, null, "pending");
      onAddMessage({ type: "ai", id: `ai-${Date.now()}`, message: resp.message });
      setAiLoading(false);
    }, 900);
  };

  const hasUserMsg = messages.some(m => m.type === "user");

  const QUICK = [
    { label: "Explain this flow",      icon: Info  },
    { label: "How can I optimize it?", icon: Gauge },
    { label: "What does step 1 do?",   icon: Zap   },
  ];

  return (
    <div className="flex flex-col w-full bg-card overflow-hidden" style={{ height: collapsed ? 48 : "100%" }}>

      {/* Header — always visible, acts as collapse toggle bar */}
      <div className="flex items-center gap-2 px-3 h-12 border-b border-border flex-shrink-0">
        {/* Collapse / expand button */}
        <button onClick={onToggleCollapse}
          className="flex items-center justify-center size-6 rounded-[5px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0">
          {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <div className={`size-5 rounded-full flex items-center justify-center flex-shrink-0 ${isNewFlow ? "bg-gradient-to-br from-[#2563eb] to-[#6366f1]" : "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]"}`}>
          <Sparkles size={10} color="white" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {isNewFlow ? "Build with AI" : "Assistant"}
        </span>

        {/* Tabs — inline in header for existing flows */}
        {!isNewFlow && (
          <div className="flex items-center gap-0 ml-2">
            {[
              { id: "chat", icon: Sparkles, label: "Chat" },
              { id: "logs", icon: Terminal, label: "Logs", badge: hasRun },
            ].map(({ id, icon: TabIcon, label, badge }) => (
              <button key={id} onClick={() => { setActiveTab(id); if (collapsed) onToggleCollapse?.(); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all relative ${
                  activeTab === id && !collapsed
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-muted-foreground hover:bg-background"
                }`}>
                <TabIcon size={11} />
                {label}
                {badge && !(activeTab === id && !collapsed) && (
                  <span className="size-1.5 rounded-full bg-[#22c55e] absolute top-1 right-0.5" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {isNewFlow && (
          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            New flow
          </span>
        )}
        {isRunning && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#dbeafe] text-primary flex items-center gap-1 flex-shrink-0"
            title={runElapsedLabel ? `Elapsed: ${runElapsedLabel}` : undefined}
          >
            <RefreshCw size={9} className="animate-spin" /> Running
            {runElapsedLabel ? (
              <span className="font-mono tabular-nums opacity-90">· {runElapsedLabel}</span>
            ) : null}
          </span>
        )}
      </div>

      {/* ── BODY (hidden when collapsed) ── */}
      {/* ── LOGS TAB ── */}
      {!collapsed && !isNewFlow && activeTab === "logs" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border px-2 py-1.5">
            <div className="flex min-w-0 flex-1 items-baseline gap-1.5" title={logExecutionId ?? undefined}>
              <span className="flex-shrink-0 text-[10px] font-medium text-muted-foreground">Execution ID</span>
              {logExecutionId ? (
                <span className="min-w-0 truncate font-mono text-[10px] text-foreground">{shortExecutionId(logExecutionId)}</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </div>
            {typeof onRefreshLogs === "function" && allowLogRefresh && (
              <button
                type="button"
                onClick={onRefreshLogs}
                disabled={logRefreshing || isRunning}
                title="Refresh log from current flow (demo)"
                aria-label="Refresh execution log"
                className="flex size-7 flex-shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={13} className={logRefreshing ? "animate-spin" : ""} />
              </button>
            )}
          </div>
          <div ref={logsRef} className="min-h-0 flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Terminal size={18} className="text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-xs font-medium text-muted-foreground">No logs yet</p>
                  <p className="text-[11px] text-muted-foreground">Run the flow to see the execution log.</p>
                </div>
              </div>
            ) : displayLogs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <p className="text-xs font-medium text-muted-foreground">Nothing to show yet</p>
                <p className="text-[11px] text-muted-foreground">INFO-level lines are hidden. Run or refresh to see SUCCESS, WARN, or ERROR entries.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 px-2 py-1 font-mono">
                {displayLogs.map((entry, i) => {
                  const rowExecId = entry.executionId ?? logExecutionId;
                  return (
                  <div
                    key={entry.id ?? `${entry.ts}-${i}`}
                    className={`flex items-start gap-2 py-1.5 pl-1 pr-2 text-[10px] leading-snug transition-colors hover:bg-muted/40 ${entry.nodeIdx !== null && onSelectLogNode ? "cursor-pointer" : ""}`}
                    title={rowExecId ? `${entry.level} · ${rowExecId}` : entry.level}
                    onClick={() => entry.nodeIdx !== null && onSelectLogNode?.(entry.nodeIdx)}
                    onKeyDown={(e) => {
                      if (entry.nodeIdx !== null && onSelectLogNode && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onSelectLogNode(entry.nodeIdx);
                      }
                    }}
                    role={entry.nodeIdx !== null && onSelectLogNode ? "button" : undefined}
                    tabIndex={entry.nodeIdx !== null && onSelectLogNode ? 0 : undefined}
                  >
                    <span
                      className="mt-1.5 size-1.5 flex-shrink-0 rounded-full"
                      style={{ background: LOG_LEVEL_DOT[entry.level] ?? LOG_LEVEL_DOT.INFO }}
                      aria-hidden
                    />
                    <span
                      className="w-[72px] flex-shrink-0 truncate font-mono tabular-nums text-muted-foreground"
                      title={rowExecId ?? undefined}
                    >
                      {rowExecId ? shortExecutionId(rowExecId) : "—"}
                    </span>
                    <span className="w-[76px] flex-shrink-0 tabular-nums text-muted-foreground">{entry.ts}</span>
                    <span className={`min-w-0 flex-1 break-words ${LOG_COLORS[entry.level] ?? "text-foreground"}`}>{entry.msg}</span>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHAT TAB (or full panel for new flows) ── */}
      {!collapsed && (isNewFlow || activeTab === "chat") && (
        <>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">

        {/* For new flows with no chat yet: show template picker */}
        {isNewFlow && !hasUserMsg && (
          <FlowCreationMode
            onSendMessage={sendMessage}
            onAddTemplate={onAddTemplate}
          />
        )}

        {/* For existing flows: always show OverviewCard */}
        {!isNewFlow && messages.map((msg) => {
          if (msg.type === "overview")    return <OverviewCard  key={msg.id} flow={flow} />;
          if (msg.type === "run-start")   return <RunStartMsg   key={msg.id} name={msg.name} />;
          if (msg.type === "step-active") return <StepActiveMsg key={msg.id} msg={msg} />;
          if (msg.type === "step-done")   return <StepDoneMsg   key={msg.id} msg={msg} />;
          if (msg.type === "run-done")    return <RunDoneMsg    key={msg.id} msg={msg} />;
          if (msg.type === "user") return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] px-3 py-2 rounded-[10px] bg-slate-950 text-white text-xs leading-5">{msg.text}</div>
            </div>
          );
          if (msg.type === "ai") return (
            <div key={msg.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
                  <Sparkles size={9} color="white" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">AI</span>
              </div>
              <div className="bg-background border border-border rounded-[10px] px-3 py-2.5 text-xs text-[#374151] leading-5">
                {msg.message.split("\n").map((line, li) => (
                  <p key={li} className={line === "" ? "h-2" : ""}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
                ))}
              </div>
            </div>
          );
          return null;
        })}

        {/* For new flows: show chat messages after the first user message */}
        {isNewFlow && hasUserMsg && messages.map((msg) => {
          if (msg.type === "overview") return null;
          if (msg.type === "user") return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] px-3 py-2 rounded-[10px] bg-slate-950 text-white text-xs leading-5">{msg.text}</div>
            </div>
          );
          if (msg.type === "ai") return (
            <div key={msg.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded-full bg-gradient-to-br from-[#2563eb] to-[#6366f1] flex items-center justify-center flex-shrink-0">
                  <Sparkles size={9} color="white" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">AI</span>
              </div>
              <div className="bg-background border border-border rounded-[10px] px-3 py-2.5 text-xs text-[#374151] leading-5">
                {msg.message.split("\n").map((line, li) => (
                  <p key={li} className={line === "" ? "h-2" : ""}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
                ))}
              </div>
            </div>
          );
          return null;
        })}

        {aiLoading && (
          <div className="flex items-center gap-2">
            <div className={`size-5 rounded-full flex items-center justify-center flex-shrink-0 ${isNewFlow ? "bg-gradient-to-br from-[#2563eb] to-[#6366f1]" : "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]"}`}>
              <Sparkles size={9} color="white" />
            </div>
            <div className="flex gap-1 px-3 py-2 rounded-[10px] bg-background border border-border">
              {[0,1,2].map(i => <span key={i} className="size-1.5 rounded-full bg-muted-foreground" style={{animation:`nodeBounce 0.8s ease-in-out ${i*0.2}s infinite`}} />)}
            </div>
          </div>
        )}

        {/* Quick actions — only for existing flows with no messages yet */}
        {!isNewFlow && !hasUserMsg && !aiLoading && (
          <div className="flex flex-col gap-1.5 mt-1">
            {QUICK.map(({ label, icon: QIcon }) => (
              <button key={label} onClick={() => sendMessage(label)}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-background border border-border hover:bg-muted hover:border-muted-foreground/25 transition-all text-left">
                <QIcon size={12} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2 border border-border rounded-[10px] px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-card">
          <input ref={chatInputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={isNewFlow ? "Describe your workflow…" : "Ask about this flow…"}
            className="flex-1 text-xs text-foreground placeholder:text-muted-foreground outline-none bg-transparent" />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()}
            className="flex items-center justify-center size-6 rounded-[6px] bg-primary text-white disabled:opacity-40 hover:bg-primary transition-colors">
            <Send size={11} />
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

// ─── Top bar ───────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  active: { bg:"#dcfce7", text:"#15803d", dot:"#22c55e", label:"Active" },
  paused: { bg:"#fef9c3", text:"#a16207", dot:"#f59e0b", label:"Paused" },
  error:  { bg:"#fef2f2", text:"#dc2626", dot:"#ef4444", label:"Error"  },
  draft:  { bg:"#f1f5f9", text:"#475569", dot:"#94a3b8", label:"Draft"  },
};

function TopBar({
  flow,
  onBack,
  onRunNow,
  isRunning,
  runElapsedLabel = null,
  /** Latest run id from logs (full id in tooltip) */
  executionId = null,
  onRename,
  /** Persist description from Flow Settings dialog */
  onSaveFlowSettings,
  versions = [],
  onSaveVersion,
  activeVersionId,
  onRestoreVersion,
  pageMode = "view",
  onSetPageMode,
  showRightPanelToggle,
  rightPanelOpen,
  onToggleRightPanel,
  onActivate,
  showToast,
}) {
  const badge                   = STATUS_BADGE[flow.status] ?? STATUS_BADGE.draft;
  const isNewUntitled           = flow.name === "Untitled Flow" && flow.steps.length === 0;
  const [editing, setEditing]   = useState(isNewUntitled);
  const [draft,   setDraft]     = useState(flow.name);
  const inputRef                = useRef(null);

  // For brand-new flows, auto-select the name field so the user can rename immediately
  useEffect(() => {
    if (isNewUntitled) {
      setTimeout(() => { inputRef.current?.select(); }, 120);
    }
  // Only run on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Context menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  // Dialog states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDescDraft, setSettingsDescDraft] = useState(() => flow.description ?? "");

  useEffect(() => {
    if (settingsOpen) setSettingsDescDraft(flow.description ?? "");
  }, [settingsOpen, flow.description]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved

  // Version state
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [savedFeedback, setSavedFeedback]       = useState(null); // version id just saved
  const versionPanelRef = useRef(null);
  useEffect(() => {
    if (!versionPanelOpen) return;
    const onOut = (e) => { if (!e.target.closest("[data-version-panel]")) setVersionPanelOpen(false); };
    const onEsc = (e) => { if (e.key === "Escape") setVersionPanelOpen(false); };
    document.addEventListener("mousedown", onOut);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onOut);
      document.removeEventListener("keydown", onEsc);
    };
  }, [versionPanelOpen]);

  const handleSaveVersion = () => {
    onSaveVersion?.();
    const nextId = `v${versions.length + 1}`;
    setSavedFeedback(nextId);
    setTimeout(() => setSavedFeedback(null), 2000);
  };

  const activeVersion = versions.find(v => v.id === activeVersionId);

  const startEdit = () => {
    setDraft(flow.name);
    setEditing(true);
    setTimeout(() => { inputRef.current?.select(); }, 0);
  };

  const commit = () => {
    const val = draft.trim() || flow.name;
    onRename(val);
    setEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter")  { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setEditing(false); setDraft(flow.name); }
  };

  // Menu handlers
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    if (!menuOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.right - 180 });
    }
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Click-outside detection
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) && !e.target.closest('[data-menu]')) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSave = useCallback(() => {
    setSaving(true);
    setSaveStatus("saving");
    window.setTimeout(() => {
      console.log("Flow saved:", flow.name);
      setSaveStatus("saved");
      showToast?.("Flow saved");
      window.setTimeout(() => {
        setSaveStatus("idle");
        setSaving(false);
      }, 2000);
    }, 500);
  }, [flow.name, showToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleDuplicate = () => {
    console.log("Duplicating flow:", flow.name);
    showToast?.(`Created copy: "Copy of ${flow.name}" (demo)`);
    closeMenu();
  };

  const handleExport = () => {
    const json = JSON.stringify(flow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flow.name.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    closeMenu();
  };

  const handleShare = () => {
    showToast?.("Share is coming soon — contact support for sharing options.");
    closeMenu();
  };


  const handleDeleteClick = () => {
    setConfirmDelete(true);
    closeMenu();
  };

  const handleConfirmDelete = () => {
    console.log("Flow deleted:", flow.name);
    showToast?.(`Flow "${flow.name}" deleted`);
    setConfirmDelete(false);
    onBack();
  };

  const handleSettings = () => {
    setSettingsOpen(true);
    closeMenu();
  };

  return (
    <>
      <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-border bg-card px-4 dark:border-border dark:bg-[#111827]">
        <button onClick={onBack} className="flex size-8 flex-shrink-0 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted dark:text-muted-foreground dark:hover:bg-slate-800">
          <ArrowLeft size={16} />
        </button>
        <div className="h-5 w-px bg-border dark:bg-[#334155]" />
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
          <button onClick={onBack} className="transition-colors hover:text-muted-foreground dark:hover:text-muted-foreground">Flows</button>
          <ChevronRight size={13} />
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              className="h-7 max-w-[220px] rounded-[5px] border border-primary bg-card px-2 text-sm font-medium text-foreground outline-none ring-2 ring-primary/20 dark:bg-slate-950 dark:text-[#f8fafc]"
            />
          ) : (
            <span
              onClick={pageMode === "edit" ? startEdit : undefined}
              title={pageMode === "edit" ? "Click to rename" : "Click Edit in the toolbar to rename this flow"}
              className={`max-w-[200px] truncate rounded-[5px] px-1.5 py-0.5 font-medium text-foreground dark:text-[#f8fafc] ${
                pageMode === "edit" ? "cursor-text transition-colors hover:bg-muted dark:hover:bg-slate-800" : "cursor-default"
              }`}
            >
              {flow.name}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{background:badge.bg,color:badge.text}}>
          <span className="size-1.5 rounded-full flex-shrink-0" style={{background:badge.dot}} />
          {badge.label}
        </span>

        {isRunning && (
          <span
            className="flex h-8 items-center gap-1.5 rounded-[6px] border border-primary/25 bg-primary/5 px-2.5 text-xs font-semibold tabular-nums text-primary"
            title="Elapsed time this run"
            aria-live="polite"
          >
            <Timer size={13} className="flex-shrink-0 opacity-80" aria-hidden />
            {runElapsedLabel ?? "0.0s"}
          </span>
        )}

        {executionId && (
          <span
            className="hidden min-w-0 max-w-[200px] items-center gap-1.5 rounded-[6px] border border-border bg-muted/40 px-2 py-1 sm:inline-flex"
            title={executionId}
          >
            <span className="flex-shrink-0 text-[10px] font-medium text-muted-foreground">Execution ID</span>
            <span className="truncate font-mono text-[10px] text-foreground">{shortExecutionId(executionId)}</span>
          </span>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {!isRunning && (
            <div className="flex items-center gap-1.5">
              {/* ── No versions yet: show a Save button to create the first version ── */}
              {versions.length === 0 && pageMode === "edit" && (
                <button
                  onClick={handleSaveVersion}
                  title="Save first version"
                  className="flex h-8 items-center gap-1.5 rounded-[6px] bg-slate-950 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-background dark:text-foreground dark:hover:bg-border"
                >
                  <Save size={12} /> Save
                </button>
              )}

              {/* ── Version picker — edit mode only (saving / restoring changes the flow) ── */}
              {versions.length > 0 && pageMode === "edit" && (
              <div className="relative" data-version-panel ref={versionPanelRef}>
                <button
                  onClick={() => setVersionPanelOpen(v => !v)}
                  title="Version history"
                  className="flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background dark:border-border dark:bg-[#1e293b] dark:text-muted-foreground dark:hover:bg-slate-950"
                >
                  <History size={13} />
                  {activeVersion ? (
                    <span className="font-semibold text-foreground dark:text-[#f8fafc]">{activeVersion.name}</span>
                  ) : (
                    <span className="text-muted-foreground dark:text-muted-foreground">Latest</span>
                  )}
                  <ChevronDown size={11} className="text-muted-foreground dark:text-muted-foreground" />
                </button>

                {versionPanelOpen && (
                  <div data-version-panel className="absolute right-0 top-10 z-[999] w-[260px] overflow-hidden rounded-[12px] border border-border bg-card dark:border-border dark:bg-[#111827]"
                    style={{boxShadow:"0 8px 24px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06)"}}>
                    <div className="flex items-center justify-between border-b border-border px-3 py-2.5 dark:border-border">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">Version history</p>
                      {pageMode === "edit" && (
                        <button
                          onClick={() => { handleSaveVersion(); setVersionPanelOpen(false); }}
                          className="flex h-6 items-center gap-1 rounded-[5px] bg-slate-950 px-2 text-[10px] font-medium text-white transition-colors hover:bg-slate-800 dark:bg-background dark:text-foreground dark:hover:bg-border"
                        >
                          <Save size={10} /> Save v{versions.length + 1}
                        </button>
                      )}
                    </div>
                    {versions.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground dark:text-muted-foreground">No versions saved yet</div>
                    ) : (
                      <div className="py-1 max-h-[220px] overflow-y-auto">
                        {/* Working copy row */}
                        <button
                          onClick={() => { setVersionPanelOpen(false); onRestoreVersion?.({ id: null, steps: [], flowName: flow.name, flowDescription: flow.description ?? "" }); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${!activeVersionId ? "bg-primary/10 dark:bg-[#15233f]" : "hover:bg-background dark:hover:bg-slate-950"}`}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-semibold text-foreground dark:text-[#f8fafc]">Latest (unsaved)</span>
                            <span className="text-[10px] text-muted-foreground dark:text-muted-foreground">Current working copy</span>
                          </div>
                          {!activeVersionId && <span className="text-[10px] font-semibold text-primary flex-shrink-0 ml-2">● Active</span>}
                        </button>
                        <div className="mx-3 h-px bg-muted dark:bg-[#334155]" />
                        {versions.map((v) => {
                          const isCurrent = v.id === activeVersionId;
                          return (
                            <button
                              key={v.id}
                              onClick={() => { setVersionPanelOpen(false); onRestoreVersion?.(v); }}
                              className={`group w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${isCurrent ? "bg-primary/10 dark:bg-[#15233f]" : "hover:bg-background dark:hover:bg-slate-950"}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex-shrink-0 rounded-[4px] bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground dark:bg-[#1e293b] dark:text-muted-foreground">{v.name}</span>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="truncate text-xs text-foreground dark:text-[#f8fafc]">{v.date}</span>
                                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground">{v.stepCount} step{v.stepCount !== 1 ? "s" : ""}</span>
                                </div>
                              </div>
                              {isCurrent
                                ? <span className="text-[10px] font-semibold text-primary flex-shrink-0 ml-2">● Active</span>
                                : <span className="text-[10px] font-medium text-primary flex-shrink-0 ml-2">Restore</span>
                              }
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )} {/* end versions.length > 0 */}

              {/* Run Flow — always when idle (edit + view) */}
              <button
                onClick={onRunNow}
                disabled={isRunning || !flow.steps?.length}
                title={!flow.steps?.length ? "Add steps before running" : undefined}
                className="flex h-8 items-center gap-1.5 rounded-[6px] bg-slate-950 px-3.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-background dark:text-foreground dark:hover:bg-border"
              >
                <Play size={12} fill="white" /> Run Flow
              </button>

              {/* View / Edit — optional focus toggle (both modes allow full editing) */}
              {pageMode === "view" ? (
                <button
                  type="button"
                  onClick={() => onSetPageMode("edit")}
                  className="flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-background dark:border-border dark:bg-[#1e293b] dark:text-muted-foreground dark:hover:bg-slate-950"
                  title="Enable editing — add nodes, change steps, save versions"
                >
                  <Pencil size={12} /> Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetPageMode("view")}
                  className="flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-background dark:border-border dark:bg-[#1e293b] dark:text-muted-foreground dark:hover:bg-slate-950"
                  title="Leave edit mode — run-only view (canvas changes are kept)"
                >
                  <Eye size={12} /> Exit edit
                </button>
              )}

              {/* Activate — draft flows, edit mode only (publishes / changes lifecycle) */}
              {pageMode === "edit" && flow.status === "draft" && (
                <button
                  onClick={onActivate}
                  title="Activate this flow"
                  className="flex h-8 items-center gap-1.5 rounded-[6px] bg-[#16a34a] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#15803d]"
                >
                  <Zap size={12} fill="white" /> Activate
                </button>
              )}
            </div>
          )}
          {showRightPanelToggle && (
            <button
              type="button"
              onClick={onToggleRightPanel}
              title={rightPanelOpen ? "Hide conversation & settings panel" : "Show conversation & settings panel"}
              aria-label={rightPanelOpen ? "Hide conversation panel" : "Show conversation panel"}
              aria-pressed={rightPanelOpen}
              className={`relative flex size-8 flex-shrink-0 items-center justify-center rounded-[6px] border text-muted-foreground transition-colors dark:text-muted-foreground ${
                rightPanelOpen
                  ? "border-border bg-primary/10 text-primary hover:bg-[#dbeafe] dark:border-border dark:bg-[#1e3a8a] dark:text-[#60a5fa] dark:hover:bg-[#1e40af]"
                  : "border-border bg-card hover:bg-background dark:border-border dark:bg-[#1e293b] dark:hover:bg-slate-950"
              }`}
            >
              {rightPanelOpen ? <PanelRightClose size={16} strokeWidth={2} /> : <PanelRight size={16} strokeWidth={2} />}
            </button>
          )}
          <button
            ref={btnRef}
            onClick={handleMenuToggle}
            className="flex size-8 items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground transition-colors hover:bg-background dark:border-border dark:bg-[#1e293b] dark:text-muted-foreground dark:hover:bg-slate-950"
            title="More options"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Context Menu Dropdown */}
      {menuOpen && (
        <div
          data-menu="true"
          className="fixed z-[9999] w-[200px] overflow-hidden rounded-[10px] border border-border bg-card shadow-xl dark:border-border dark:bg-[#111827]"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Group 1: Actions */}
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background dark:text-[#f8fafc] dark:hover:bg-slate-950"
          >
            <Copy size={14} className="text-muted-foreground dark:text-muted-foreground" /> Duplicate
          </button>
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background dark:text-[#f8fafc] dark:hover:bg-slate-950"
          >
            <Download size={14} className="text-muted-foreground dark:text-muted-foreground" /> Export as JSON
          </button>

          {/* Divider */}
          <div className="h-px bg-muted dark:bg-[#334155]" />

          {/* Group 3: Sharing & Info */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background dark:text-[#f8fafc] dark:hover:bg-slate-950"
          >
            <Share2 size={14} className="text-muted-foreground dark:text-muted-foreground" /> Share
          </button>

          {/* Divider */}
          <div className="h-px bg-muted dark:bg-[#334155]" />

          {/* Group 4: Settings & Danger */}
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background dark:text-[#f8fafc] dark:hover:bg-slate-950"
          >
            <Settings2 size={14} className="text-muted-foreground dark:text-muted-foreground" /> Settings
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors text-left"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${flow.name}"?`}
          message="This flow will be permanently deleted. This action cannot be undone."
          confirmLabel="Delete Flow"
          confirmClass="flex-1 h-10 rounded-[8px] bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium transition-colors"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Settings Dialog */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setSettingsOpen(false)} />
          <div
            className="relative w-[420px] overflow-hidden rounded-2xl bg-card dark:bg-[#111827]"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb]" />
            <div className="px-6 pt-6 pb-6">
              <h2 className="mb-5 text-lg font-semibold text-foreground dark:text-[#f8fafc]">Flow Settings</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="flow-settings-description" className="mb-2 block text-sm font-medium text-foreground dark:text-[#f8fafc]">
                    Description
                  </label>
                  <textarea
                    id="flow-settings-description"
                    rows={3}
                    value={settingsDescDraft}
                    onChange={(e) => setSettingsDescDraft(e.target.value)}
                    maxLength={500}
                    placeholder="What this flow does (shown on the flow list and in the assistant overview)."
                    className="w-full resize-none rounded-[6px] border border-border bg-card px-3 py-2 text-sm leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:border-border dark:bg-slate-950 dark:text-[#f8fafc]"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{settingsDescDraft.length}/500</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground dark:text-[#f8fafc]">Execution Timeout</label>
                  <input
                    type="text"
                    defaultValue="30 seconds"
                    className="w-full rounded-[6px] border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:border-border dark:bg-slate-950 dark:text-[#f8fafc]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground dark:text-[#f8fafc]">Max Retries</label>
                  <input
                    type="text"
                    defaultValue="3"
                    className="w-full rounded-[6px] border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:border-border dark:bg-slate-950 dark:text-[#f8fafc]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground dark:text-[#f8fafc]">Retry Delay</label>
                  <input
                    type="text"
                    defaultValue="1 second"
                    className="w-full rounded-[6px] border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:border-border dark:bg-slate-950 dark:text-[#f8fafc]"
                  />
                </div>
              </div>
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="flex-1 h-10 rounded-[8px] border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-background dark:border-border dark:bg-[#1e293b] dark:text-muted-foreground dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveFlowSettings?.({ description: settingsDescDraft.trim() });
                    showToast?.("Settings saved");
                    setSettingsOpen(false);
                  }}
                  className="flex-1 h-10 rounded-[8px] bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FlowViewPage({ flow: flowProp, onNavigate, flowOpenIntent = "execute", onFlowPatch }) {
  const [steps, setSteps]             = useState(flowProp?.steps ?? []);
  const [flowName, setFlowName]       = useState(flowProp?.name ?? "Untitled Flow");
  const [flowDescription, setFlowDescription] = useState(() =>
    typeof flowProp?.description === "string" ? flowProp.description : "",
  );
  const [flowStatus, setFlowStatus]   = useState(flowProp?.status ?? "draft");
  const [creationEntry, setCreationEntry] = useState(() => flowProp?.creationEntry ?? "template");
  const [creationAssistantOpen, setCreationAssistantOpen] = useState(false);
  const [convPanelCollapsed, setConvPanelCollapsed] = useState(false);
  const [assistantFocusKey, setAssistantFocusKey] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [runState, setRunState]       = useState({ activeIdx:-1, doneIdxs:new Set() });
  const [runStartedAt, setRunStartedAt] = useState(null);
  const [, setRunTick]                = useState(0);
  const [lastRunTotalMs, setLastRunTotalMs] = useState(null);
  const [logs, setLogs]               = useState([]);
  const runTimers                     = useRef([]);
  const [convMessages, setConvMessages] = useState([{ type: "overview", id: "overview" }]);
  const [versions, setVersions]         = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null); // null = unsaved working copy
  /** "view" = run / inspect only (from flow list); "edit" = full authoring (new flow or after Edit) */
  const [pageMode, setPageMode] = useState(() => (flowOpenIntent === "edit" ? "edit" : "view"));
  const [rightPanelOpen, setRightPanelOpen]   = useState(true);
  const [logPanelCollapsed, setLogPanelCollapsed] = useState(true);
  const [logPanelH, setLogPanelH]             = useState(240);
  const [logRefreshing, setLogRefreshing]     = useState(false);
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState(null);
  const resizeRef                             = useRef(null);
  const handleRunNowRef                       = useRef(() => {});
  const { toasts, showToast, dismissToast }   = useToast();

  useEffect(() => {
    if (!flowProp) return;
    setSteps(flowProp.steps ?? []);
    setFlowName(flowProp.name ?? "Untitled Flow");
    setFlowStatus(flowProp.status ?? "draft");
    setFlowDescription(typeof flowProp.description === "string" ? flowProp.description : "");
    setCreationEntry(flowProp.creationEntry ?? "template");
    setCreationAssistantOpen(false);
    setConvPanelCollapsed(false);
    setAssistantFocusKey(0);
    setRightPanelOpen(true);
    setLogPanelCollapsed(true);
    setLogPanelH(240);
    setLastRunTotalMs(null);
    setPageMode(flowOpenIntent === "edit" ? "edit" : "view");
  }, [flowProp?.id, flowOpenIntent]);

  const openFlowAssistant = useCallback(() => {
    setCreationAssistantOpen(true);
    setRightPanelOpen(true);
    setConvPanelCollapsed(false);
    setAssistantFocusKey((k) => k + 1);
  }, []);

  const isRunning = runState.activeIdx !== -1;

  useEffect(() => {
    if (!isRunning) {
      setRunStartedAt(null);
      return;
    }
    const id = window.setInterval(() => setRunTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const runElapsedLabel =
    isRunning && runStartedAt != null ? formatElapsed(Date.now() - runStartedAt) : null;

  const lastRunTotalLabel =
    lastRunTotalMs != null ? formatElapsed(lastRunTotalMs) : null;

  // Bottom panel drag-to-resize
  const startResize = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = logPanelH;
    const onMove = (ev) => {
      const delta = startY - ev.clientY;
      setLogPanelH(Math.max(120, Math.min(500, startH + delta)));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }, [logPanelH]);

  const flow = flowProp
    ? { ...flowProp, steps, name: flowName, status: flowStatus, creationEntry, description: flowDescription }
    : null;

  const handleRename = useCallback(
    (name) => {
      const v = (name ?? "").trim() || flowName;
      setFlowName(v);
      if (flowProp?.id != null) onFlowPatch?.(flowProp.id, { name: v });
    },
    [flowName, flowProp?.id, onFlowPatch],
  );

  const handleSaveFlowSettings = useCallback(
    ({ description }) => {
      const d = typeof description === "string" ? description : "";
      setFlowDescription(d);
      if (flowProp?.id != null) onFlowPatch?.(flowProp.id, { description: d });
    },
    [flowProp?.id, onFlowPatch],
  );

  // Sync Zustand store
  const { initFlow } = useFlowStore();
  useEffect(() => { if (flowProp) initFlow(flowProp); }, [flowProp]);

  const handleAddNode = (afterIndex, newStep) => {
    if (pageMode !== "edit") return;
    setActiveVersionId(null); // mark as unsaved after edit
    setSteps(prev => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, { ...newStep, status:"pending" });
      return next;
    });
    setSelectedIdx(afterIndex + 1);
  };

  // Populate the canvas with a full template at once (used by FlowCreationMode & canvas empty state)
  const handleAddTemplate = (templateSteps) => {
    if (pageMode !== "edit") return;
    setActiveVersionId(null);
    setSteps(templateSteps);
    setSelectedIdx(null);
  };

  const updateStepAt = useCallback(
    (idx, patch) => {
      if (pageMode !== "edit") return;
      setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    },
    [pageMode],
  );

  const buildLogsLocal = useCallback((nodes, name, executionId) => {
    const base = Date.now();
    const lines = [];
    let offset = 0;
    const fmt = () => {
      const d = new Date(base + offset);
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      const ms = String(d.getMilliseconds()).padStart(3, "0");
      return `${h}:${m}:${s}.${ms}`;
    };
    const push = (level, nodeIdx, msg) => {
      lines.push({
        id: `${base}-${lines.length}-${Math.random().toString(36).slice(2, 9)}`,
        ts: fmt(),
        level,
        nodeIdx,
        msg,
        executionId,
      });
      offset += 45 + Math.round(Math.random() * 85);
    };
    push("INFO", null, `Flow "${name}" triggered`);
    nodes.forEach((node, i) => {
      push("INFO", i, `[${node.label}] started`);
      const dur = 200 + Math.round(Math.random() * 400);
      offset += dur;
      push("SUCCESS", i, `[${node.label}] completed in ${dur}ms`);
    });
    push("INFO", null, `Run completed — ${nodes.length} step${nodes.length !== 1 ? "s" : ""}`);
    return lines;
  }, []);

  const handleRefreshLogs = useCallback(() => {
    if (runState.activeIdx !== -1 || steps.length === 0) return;
    setLogRefreshing(true);
    setLogs(buildLogsLocal(steps, flowName, createExecutionId()));
    window.setTimeout(() => setLogRefreshing(false), 400);
  }, [runState.activeIdx, steps, flowName, buildLogsLocal]);

  const handleRunNow = () => {
    runTimers.current.forEach(clearTimeout);
    runTimers.current = [];
    const n = steps.length;
    const startTime = Date.now();

    setRunStartedAt(Date.now());
    setLastRunTotalMs(null);
    setRunState({ activeIdx:0, doneIdxs:new Set() });
    setLogs(buildLogsLocal(steps, flowName, createExecutionId()));
    setLogPanelCollapsed(false);

    // Seed conversation with run-start message (keep overview + any chat)
    setConvMessages(prev => [
      ...prev.filter(m => m.type === "overview" || m.type === "user" || m.type === "ai"),
      { type: "run-start", id: `rs-${Date.now()}`, name: flowName },
    ]);

    steps.forEach((step, i) => {
      // Step active message
      const tActive = setTimeout(() => {
        setConvMessages(prev => [...prev, {
          type: "step-active", id: `sa-${i}-${Date.now()}`,
          idx: i, label: step.label, color: step.color, icon: step.icon,
        }]);
      }, i * 1500 + 100);

      // Step done + runState update
      const tDone = setTimeout(() => {
        const duration = 200 + Math.round(Math.random() * 400);
        setRunState(prev => {
          const next = new Set(prev.doneIdxs);
          next.add(i);
          return { activeIdx: i < n-1 ? i+1 : -1, doneIdxs: next };
        });
        setConvMessages(prev => {
          // Replace the step-active with step-done
          const filtered = prev.filter(m => !(m.type === "step-active" && m.idx === i));
          return [...filtered, { type: "step-done", id: `sd-${i}-${Date.now()}`, idx: i, label: step.label, duration }];
        });
        if (i === n - 1) {
          setTimeout(() => {
            const totalMs = Date.now() - startTime;
            setLastRunTotalMs(totalMs);
            setConvMessages(prev => [...prev, {
              type: "run-done", id: `rd-${Date.now()}`,
              total: n, duration: totalMs,
            }]);
          }, 300);
        }
      }, (i+1) * 1500);

      runTimers.current.push(tActive, tDone);
    });
  };

  handleRunNowRef.current = handleRunNow;

  const handleNodeToolbar = useCallback((kind, index) => {
    const step = steps[index];
    if (!step) return;
    if (kind === "delete") {
      if (pageMode !== "edit") return;
      setPendingDeleteIdx(index);
      return;
    }
    if (kind === "play") {
      showToast(`Running "${step.label}"… (demo)`);
      return;
    }
    if (kind === "logs") {
      setSelectedIdx(index);
      setLogPanelCollapsed(false);
      showToast(`Logs — "${step.label}"`);
    }
  }, [steps, showToast, pageMode]);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (steps.length > 0 && runState.activeIdx === -1) handleRunNowRef.current();
      }
      if (e.key === "Delete" && selectedIdx !== null && pageMode === "edit") {
        e.preventDefault();
        setPendingDeleteIdx(selectedIdx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length, runState.activeIdx, selectedIdx, pageMode]);

  const saveVersion = () => {
    const num = versions.length + 1;
    const id  = `v${num}`;
    const snap = {
      id,
      name: id,
      num,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      stepCount: steps.length,
      steps: [...steps],
      flowName,
      flowDescription,
    };
    setVersions(prev => [snap, ...prev]);
    setActiveVersionId(id);
  };

  const restoreVersion = (v) => {
    if (v.id === null) {
      setActiveVersionId(null);
      return;
    }
    setSteps([...v.steps]);
    setFlowName(v.flowName ?? flowName);
    setFlowDescription(typeof v.flowDescription === "string" ? v.flowDescription : "");
    setActiveVersionId(v.id);
  };

  if (!flow) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col gap-4">
        <p className="text-muted-foreground">No flow selected.</p>
        <button onClick={() => onNavigate("flows")} className="text-sm text-primary hover:underline">Back to Flows</button>
      </div>
    );
  }

  return (
    <>
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="flows" onNavigate={onNavigate} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          flow={flow} onBack={()=>onNavigate("flows")}
          onRunNow={handleRunNow} isRunning={runState.activeIdx !== -1}
          runElapsedLabel={runElapsedLabel}
          executionId={logs.find((e) => e.executionId)?.executionId ?? null}
          onRename={handleRename}
          onSaveFlowSettings={handleSaveFlowSettings}
          versions={versions} onSaveVersion={saveVersion} activeVersionId={activeVersionId} onRestoreVersion={restoreVersion}
          pageMode={pageMode} onSetPageMode={setPageMode}
          showRightPanelToggle={flow.steps.length > 0 || creationAssistantOpen}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={() => setRightPanelOpen((v) => !v)}
          onActivate={() => setFlowStatus("active")}
          showToast={showToast}
        />
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Top row: Canvas + RightPanel (always visible) */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <Canvas
              flow={flow}
              selectedIdx={selectedIdx}
              onSelectNode={setSelectedIdx}
              onAddNode={handleAddNode}
              onAddTemplate={handleAddTemplate}
              runState={runState}
              onSetCreationEntry={setCreationEntry}
              onOpenFlowAssistant={openFlowAssistant}
              onNodeToolbarAction={handleNodeToolbar}
              readOnly={pageMode === "view"}
            />
            {(flow.steps.length > 0 || creationAssistantOpen) && rightPanelOpen && (
              <RightPanel
                flow={flow}
                selectedIdx={selectedIdx}
                runState={runState}
                onClose={() => setSelectedIdx(null)}
                showEmptyFlowAssistant={creationAssistantOpen}
                onCloseEmptyFlowAssistant={() => setCreationAssistantOpen(false)}
                assistantFocusKey={assistantFocusKey}
                convMessages={convMessages}
                onAddConvMessage={(m) => setConvMessages((prev) => [...prev, m])}
                onRunFlow={handleRunNow}
                onAddTemplate={handleAddTemplate}
                logs={logs}
                convCollapsed={convPanelCollapsed}
                onToggleConvCollapse={() => setConvPanelCollapsed((v) => !v)}
                onUpdateStep={updateStepAt}
                onRefreshLogs={handleRefreshLogs}
                logRefreshing={logRefreshing}
                allowLogRefresh={steps.length > 0}
                runElapsedLabel={runElapsedLabel}
                onSelectLogNode={(nodeIdx) => {
                  setSelectedIdx(nodeIdx);
                  setRightPanelOpen(true);
                }}
                executeOnly={pageMode === "view"}
              />
            )}
          </div>

          {/* Bottom: execution log — visible by default, starts collapsed */}
          <div
            ref={resizeRef}
            className="flex-shrink-0 overflow-hidden border-t border-border dark:border-border"
            style={{ height: logPanelCollapsed ? 42 : logPanelH }}
          >
            <ExecutionLogPanel
              dock="bottom"
              logs={logs}
              runState={runState}
              runElapsedLabel={runElapsedLabel}
              lastRunTotalLabel={lastRunTotalLabel}
              collapsed={logPanelCollapsed}
              onToggleCollapse={() => setLogPanelCollapsed((v) => !v)}
              onMouseDownResize={startResize}
              onRefresh={handleRefreshLogs}
              refreshing={logRefreshing}
              allowRefresh={steps.length > 0}
              flow={flow}
            />
          </div>
        </div>
      </div>
    </div>

    {pendingDeleteIdx !== null && steps[pendingDeleteIdx] && (
      <ConfirmDialog
        title={`Remove "${steps[pendingDeleteIdx].label}"?`}
        message="This step will be removed from the flow."
        confirmLabel="Remove step"
        onConfirm={() => {
          const idx = pendingDeleteIdx;
          setSteps((prev) => prev.filter((_, i) => i !== idx));
          setSelectedIdx((s) => {
            if (s === null) return null;
            if (s === idx) return null;
            return s > idx ? s - 1 : s;
          });
          setActiveVersionId(null);
          setPendingDeleteIdx(null);
          showToast("Step removed");
        }}
        onCancel={() => setPendingDeleteIdx(null)}
      />
    )}

    {toasts.map((t) => (
      <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
    ))}
    </>
  );
}
