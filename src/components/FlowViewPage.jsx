import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft, Play, Save, MoreHorizontal, ChevronDown, ChevronRight, ChevronLeft,
  ZoomIn, ZoomOut, Crosshair, CheckCircle2, AlertCircle, Clock, Circle,
  Bot, Database, Mail, Webhook, FileText, Globe, Zap, GitBranch,
  Terminal, History, X, Plus, Search, Layers,
  Settings2, Info, Activity, Cpu, RefreshCw,
  MousePointer, GitMerge, Trash2,
  Send, Sparkles, RotateCcw, ChevronUp,
  ListChecks, Braces, ScrollText, Hammer, Gauge,
  Copy, Download, Share2, Settings, Clock as ClockIcon, Pencil,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { useFlowStore } from "@/store/flowStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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

const LOG_COLORS  = { INFO: "text-[#475569]", SUCCESS: "text-[#16a34a]", ERROR: "text-[#dc2626]", WARN: "text-[#b45309]" };
const LOG_BADGES  = { INFO: "bg-[#f1f5f9] text-[#64748b]", SUCCESS: "bg-[#dcfce7] text-[#15803d]", ERROR: "bg-[#fef2f2] text-[#dc2626]", WARN: "bg-[#fef9c3] text-[#a16207]" };

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
        "It transforms and processes data within the workflow."
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
  { icon: Clock,     label: "Logs",   color: "#7c3aed", hoverBg: "#f5f3ff" },
  { icon: RefreshCw, label: "Retry",  color: "#0891b2", hoverBg: "#ecfeff" },
  { icon: Trash2,    label: "Delete", color: "#ef4444", hoverBg: "#fef2f2" },
];
const TB_BTN     = 26;
const TB_GAP     = 3;
const TB_PAD     = 8;  // Increased from 4 to 8 for more breathing room
const TB_TOTAL_W = NODE_TOOLBAR_BTNS.length * TB_BTN + (NODE_TOOLBAR_BTNS.length - 1) * TB_GAP + TB_PAD * 2;
const TB_TOTAL_H = TB_BTN + TB_PAD * 2;
const EDGE_R     = 9;

function CanvasNode({ step, index, x, y, selected, execStatus, onClick, onOpenPicker, isRunning = false, isDone = false }) {
  const Icon = ICON_MAP[step.icon] ?? Zap;
  const dynamicExecKey = isRunning ? "running" : isDone ? "success" : execStatus;
  const exec     = STEP_EXEC[dynamicExecKey] ?? STEP_EXEC.pending;
  const ExecIcon = exec.Icon;
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

      {/* Run animation rings */}
      {isRunning && (
        <>
          <rect x={x-5} y={y-5} width={NODE_W+10} height={NODE_H+10} rx={15} fill="none" stroke="#3b82f6" strokeWidth={6} opacity={0.15} style={{ animation: "nodePulse 1s ease-in-out infinite" }} />
          <rect x={x-3} y={y-3} width={NODE_W+6} height={NODE_H+6} rx={13} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="10 6" style={{ animation: "nodeRunDash 0.55s linear infinite" }} />
        </>
      )}
      {isDone && !isRunning && (
        <rect x={x-3} y={y-3} width={NODE_W+6} height={NODE_H+6} rx={13} fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.85} />
      )}

      {/* Card */}
      <rect x={x+2} y={y+3} width={NODE_W} height={NODE_H} rx={10} fill="rgba(0,0,0,0.06)" />
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={10} fill="white"
        stroke={selected ? "#2563eb" : hovered ? "#94a3b8" : "#e2e8f0"} strokeWidth={selected ? 2 : 1} />

      {/* Status badge */}
      <circle cx={x+NODE_W-14} cy={y+14} r={7} fill={exec.bg} stroke={exec.ring} strokeWidth={1} />
      <foreignObject x={x+NODE_W-20} y={y+7.5} width={14} height={14}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%" }}>
          <ExecIcon size={9} color={exec.color} />
        </div>
      </foreignObject>

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

      {/* Exec label */}
      {isRunning ? (
        <foreignObject x={x+62} y={y+NODE_H-20} width={100} height={16}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display:"flex",alignItems:"center",gap:3,fontSize:9,fontWeight:500,color:"#3b82f6" }}>
            Running
            {[0,1,2].map(i => <span key={i} style={{ display:"inline-block",width:3,height:3,borderRadius:"50%",background:"#3b82f6",animation:`nodeBounce 0.8s ease-in-out ${i*0.18}s infinite` }} />)}
          </div>
        </foreignObject>
      ) : (
        <text x={x+62} y={y+NODE_H-10} fontSize={9} fill={exec.color} fontWeight={500}>{exec.label}</text>
      )}

      {/* Edge + buttons — build mode only */}
      {hovered && (
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
      {hovered && (
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
      {hovered && (
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
              if (btn.label === "Delete") {
                // Delete node action
                console.log(`Delete node ${index}`);
                alert('Node deleted successfully');
              } else if (btn.label === "Retry") {
                // Retry node action
                console.log(`Retry node ${index}`);
                alert(`Retrying node "${step.label}"...`);
              } else if (btn.label === "Logs") {
                // View logs action
                console.log(`View logs for node ${index}`);
                alert(`Opening logs for "${step.label}"`);
              }
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
function ConnectionWithAdd({ x1, y1, x2, y2, color, afterIndex, onOpenPicker, isFlowing = false, isDone = false }) {
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
      {hovered && (
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
  FileText:"#f59e0b", GitBranch:"#f59e0b", GitMerge:"#f59e0b",
};
const PICKER_CATEGORIES = [
  { icon:Layers,    bg:"#f1f5f9", iconColor:"#475569", label:"Core Nodes",        desc:"Essential workflow components",        iconKey:"Zap"       },
  { icon:Bot,       bg:"#f5f3ff", iconColor:"#7c3aed", label:"Using AI",          desc:"Leverage AI for various tasks",         iconKey:"Bot"       },
  { icon:Webhook,   bg:"#ecfdf5", iconColor:"#059669", label:"Triggers",          desc:"Automate actions based on events",      iconKey:"Webhook"   },
  { icon:Settings2, bg:"#f8fafc", iconColor:"#64748b", label:"Your Custom Nodes", desc:"Create your own workflow nodes",        iconKey:"Zap"       },
  { icon:GitMerge,  bg:"#f8fafc", iconColor:"#64748b", label:"Subflows",          desc:"Automate with nested subflows",         iconKey:"GitMerge"  },
];
const PICKER_FREQUENT = [
  { icon:Cpu,       bg:"#fef2f2", iconColor:"#ef4444", label:"Ask AI",       desc:"Prompt an AI...",      iconKey:"Bot"       },
  { icon:FileText,  bg:"#f8fafc", iconColor:"#64748b", label:"Input",        desc:"Entry point for...",   iconKey:"FileText"  },
  { icon:Database,  bg:"#fef2f2", iconColor:"#ef4444", label:"Extract Data", desc:"Extract key piece...", iconKey:"Database"  },
  { icon:Globe,     bg:"#f8fafc", iconColor:"#64748b", label:"Output",       desc:"Exit point for...",    iconKey:"Globe"     },
  { icon:Bot,       bg:"#fef2f2", iconColor:"#be185d", label:"Agent",        desc:"Run an agent...",      iconKey:"Bot"       },
  { icon:GitMerge,  bg:"#f8fafc", iconColor:"#64748b", label:"Router",       desc:"Control workflow...",  iconKey:"GitBranch" },
];

// ─── Nodes grouped by category ─────────────────────────────────────────────────
const PICKER_NODES_BY_CATEGORY = {
  "Core Nodes": [
    { icon:Webhook,   label:"Web Trigger",       desc:"HTTP webhook trigger",                          iconKey:"Webhook" },
    { icon:Database,  label:"Database Query",    desc:"Query databases and tables",                     iconKey:"Database" },
    { icon:Bot,       label:"API Request",       desc:"Make API calls to external services",           iconKey:"Bot" },
    { icon:Mail,      label:"Send Email",        desc:"Send emails from workflow",                      iconKey:"Mail" },
    { icon:FileText,  label:"Parse File",        desc:"Extract and parse file content",                 iconKey:"FileText" },
    { icon:Globe,     label:"HTTP Request",      desc:"Call external HTTP endpoints",                   iconKey:"Globe" },
  ],
  "Using AI": [
    { icon:Bot,       label:"Ask Claude",        desc:"Query Claude AI with context",                   iconKey:"Bot" },
    { icon:Sparkles,  label:"Smart Extract",     desc:"AI-powered data extraction",                     iconKey:"Bot" },
    { icon:Cpu,       label:"Summarize",         desc:"Generate summaries with AI",                     iconKey:"Bot" },
    { icon:Database,  label:"Data Classification", desc:"Classify data using AI",                        iconKey:"Database" },
  ],
  "Triggers": [
    { icon:Webhook,   label:"Webhook",           desc:"Triggered by HTTP requests",                     iconKey:"Webhook" },
    { icon:Clock,     label:"Schedule",          desc:"Trigger on schedule (cron)",                     iconKey:"Webhook" },
    { icon:Mail,      label:"Email Received",    desc:"Trigger when email arrives",                     iconKey:"Mail" },
    { icon:Zap,       label:"Event",             desc:"Trigger from external events",                   iconKey:"Zap" },
  ],
  "Your Custom Nodes": [
    { icon:Settings2, label:"Create New Node",   desc:"Build a custom workflow node",                   iconKey:"Zap" },
    { icon:GitMerge,  label:"Node Library",      desc:"Browse your saved nodes",                        iconKey:"GitMerge" },
  ],
  "Subflows": [
    { icon:GitMerge,  label:"Subflow",           desc:"Call a nested subflow",                          iconKey:"GitMerge" },
    { icon:FileText,  label:"Import Flow",       desc:"Import another flow",                            iconKey:"FileText" },
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
  const all = [...PICKER_CATEGORIES, ...PICKER_FREQUENT];
  const filtered = q ? all.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) : null;
  const pick = (tool) => { onAdd(afterIndex, { label:tool.label, icon:tool.iconKey, color:PICKER_COLORS[tool.iconKey]??"#64748b" }); onClose(); };
  const openCategory = (categoryLabel) => { setSelectedCategory(categoryLabel); setQuery(""); };

  const PW = 320, PH = 500;
  const left = Math.min(anchorX, window.innerWidth - PW - 20);
  const top  = Math.max(8, anchorY - PH / 2);

  return (
    <div ref={ref} className="absolute z-[200] bg-white rounded-[16px] flex flex-col overflow-hidden"
      style={{ left, top, width:PW, maxHeight:PH, boxShadow:"0 20px 60px rgba(0,0,0,0.16),0 4px 16px rgba(0,0,0,0.08)", animation:"pickerIn 0.2s cubic-bezier(0.34,1.15,0.64,1)", border:"1px solid rgba(0,0,0,0.06)" }}
      onClick={(e) => e.stopPropagation()}>
      <style>{`@keyframes pickerIn{from{opacity:0;transform:scale(0.95) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        {selectedCategory ? (
          <div className="flex items-center gap-2 mb-2.5">
            <button onClick={()=>setSelectedCategory(null)} className="flex items-center justify-center size-7 rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors flex-shrink-0">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-[#0f172a]">{selectedCategory}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2.5 border border-[#e2e8f0] rounded-[10px] px-3 py-2 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
          <Search size={15} className="text-[#94a3b8] flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder={selectedCategory ? `Search ${selectedCategory}...` : "Search all nodes"} className="flex-1 text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none bg-transparent" />
          <button onClick={query?()=>setQuery(""):selectedCategory?()=>setSelectedCategory(null):onClose}><X size={13} className="text-[#94a3b8] hover:text-[#64748b]" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {/* Show search results OR category content */}
        {filtered ? (
          <>
            {filtered.length === 0 && <div className="flex flex-col items-center py-12 gap-2"><Search size={24} className="text-[#cbd5e1]" /><p className="text-xs text-[#94a3b8]">No matches for "{query}"</p></div>}
            {filtered.map(tool => { const Icon = tool.icon; return (
              <button key={tool.label} onClick={()=>pick(tool)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-[8px] hover:bg-[#f8fafc] transition-colors text-left group">
                <div className="size-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{background:tool.bg,border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={18} style={{color:tool.iconColor}}/></div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0"><span className="text-sm font-medium text-[#0f172a]">{tool.label}</span><span className="text-xs text-[#94a3b8] line-clamp-1">{tool.desc}</span></div>
                <ChevronRight size={14} className="text-[#cbd5e1] group-hover:text-[#94a3b8] flex-shrink-0" />
              </button>
            ); })}
          </>
        ) : selectedCategory ? (
          <>
            {/* Show nodes in selected category */}
            {(PICKER_NODES_BY_CATEGORY[selectedCategory] || []).map(node => { const Icon = node.icon; return (
              <button key={node.label} onClick={()=>pick(node)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-[8px] hover:bg-[#f8fafc] transition-colors text-left group">
                <div className="size-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{background:PICKER_COLORS[node.iconKey]+"15",border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={18} style={{color:PICKER_COLORS[node.iconKey]||"#64748b"}}/></div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0"><span className="text-sm font-medium text-[#0f172a]">{node.label}</span><span className="text-xs text-[#94a3b8] line-clamp-1">{node.desc}</span></div>
              </button>
            ); })}
          </>
        ) : (
          <>
            {/* Show category list */}
            {PICKER_CATEGORIES.map(cat => { const Icon = cat.icon; return (
              <button key={cat.label} onClick={()=>openCategory(cat.label)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-[10px] hover:bg-[#f8fafc] transition-colors text-left group">
                <div className="size-11 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{background:cat.bg,border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={20} style={{color:cat.iconColor}}/></div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0"><span className="text-sm font-semibold text-[#0f172a]">{cat.label}</span><span className="text-xs text-[#64748b] line-clamp-1">{cat.desc}</span></div>
                <ChevronRight size={14} className="text-[#cbd5e1] group-hover:text-[#94a3b8] flex-shrink-0" />
              </button>
            ); })}
            <div className="mt-2 mb-1.5 px-1"><span className="text-sm font-semibold text-[#94a3b8] tracking-wider uppercase">Frequently Used</span></div>
            <div className="grid grid-cols-2 gap-1.5">
              {PICKER_FREQUENT.map(tool => { const Icon = tool.icon; return (
                <button key={tool.label} onClick={()=>pick(tool)} className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] hover:bg-[#f8fafc] border border-[#f1f5f9] hover:border-[#e2e8f0] transition-all text-left">
                  <div className="size-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{background:tool.bg,border:"1px solid rgba(0,0,0,0.06)"}}><Icon size={16} style={{color:tool.iconColor}}/></div>
                  <div className="flex flex-col gap-0 min-w-0"><span className="text-xs font-semibold text-[#0f172a] truncate">{tool.label}</span><span className="text-xs text-[#94a3b8] truncate">{tool.desc}</span></div>
                </button>
              ); })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Configure mode ───────────────────────────────────────────────────────────
function ConfigureMode({ step, selectedIdx, flow }) {
  const cfg      = NODE_CONFIGS[step.icon] ?? {};
  const execKey  = getExecStatus(flow.status, selectedIdx, flow.steps.length);
  const execInfo = STEP_EXEC[execKey];
  const [advOpen, setAdvOpen] = useState(false);
  const Icon = ICON_MAP[step.icon] ?? Zap;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#f1f5f9]">
        <div className="size-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{background:`${step.color}18`,border:`1px solid ${step.color}30`}}>
          <Icon size={18} style={{color:step.color}} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold text-[#0f172a] truncate">{step.label}</p>
          <span className="text-xs text-[#64748b]">{cfg.type ?? "Node"} · Step {selectedIdx + 1}</span>
        </div>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{background:execInfo.bg,color:execInfo.color}}>{execInfo.label}</span>
      </div>

      {/* Primary fields */}
      <div className="px-4 py-3 border-b border-[#f1f5f9]">
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-3">Configuration</p>
        <div className="flex flex-col gap-2.5">
          {(cfg.fields ?? []).slice(0, 2).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <label className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">{k}</label>
              <input defaultValue={v} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5 text-xs text-[#0f172a] font-mono outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Advanced collapsible */}
      <div className="border-b border-[#f1f5f9]">
        <button onClick={() => setAdvOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#f8fafc] transition-colors">
          <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Advanced</span>
          <ChevronDown size={13} className={`text-[#94a3b8] transition-transform ${advOpen?"":"−rotate-90"}`} style={{transform:advOpen?"none":"rotate(-90deg)"}} />
        </button>
        {advOpen && (
          <div className="px-4 pb-3 flex flex-col gap-2.5">
            {(cfg.fields ?? []).slice(2).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">{k}</label>
                <input defaultValue={v} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5 text-xs text-[#0f172a] font-mono outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all" />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">Retry on Error</label>
              <select className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5 text-xs text-[#0f172a] outline-none">
                <option>None</option><option>1 time</option><option>3 times</option><option>5 times</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">Timeout (ms)</label>
              <input defaultValue="5000" type="number" className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5 text-xs text-[#0f172a] font-mono outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all" />
            </div>
          </div>
        )}
      </div>

      {/* Preview summary */}
      <div className="px-4 py-3">
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-3">Preview</p>
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-5 rounded-[4px] flex items-center justify-center" style={{background:`${step.color}18`}}>
              <Icon size={11} style={{color:step.color}} />
            </div>
            <span className="text-xs font-semibold text-[#0f172a]">{step.label}</span>
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{background:execInfo.bg,color:execInfo.color}}>{execInfo.label}</span>
          </div>
          {(cfg.fields ?? []).slice(0, 3).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="text-[#94a3b8] w-16 flex-shrink-0 truncate">{k}</span>
              <span className="text-[#475569] font-mono truncate flex-1">{v}</span>
            </div>
          ))}
          <div className="mt-1 pt-1.5 border-t border-[#e2e8f0] text-xs text-[#94a3b8]">
            Last ran {flow.lastRun} · {230 + selectedIdx * 80}ms
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ask AI mode ──────────────────────────────────────────────────────────────
function AskAIMode({ step, selectedIdx, flow, runState }) {
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
      <div className="px-4 py-2.5 border-b border-[#f1f5f9] flex items-center gap-2 flex-shrink-0">
        <div className="size-6 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{background:`${step.color}18`}}>
          <Icon size={12} style={{color:step.color}} />
        </div>
        <span className="text-xs text-[#64748b]">Context: <span className="font-medium text-[#0f172a]">{step.label}</span></span>
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
              <span className="text-xs font-semibold text-[#0f172a]">AI Assistant</span>
            </div>
            <p className="text-xs text-[#64748b] leading-5">Ask me anything about <span className="font-medium text-[#0f172a]">{step.label}</span>.</p>
            <div className="flex flex-col gap-1.5 mt-1">
              {QUICK.map(({ label, icon: QIcon }) => (
                <button key={label} onClick={() => send(label)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9] hover:border-[#cbd5e1] transition-all text-left group">
                  <QIcon size={12} className="text-[#94a3b8] group-hover:text-[#64748b] flex-shrink-0" />
                  <span className="text-xs text-[#475569] group-hover:text-[#0f172a]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role==="user"?"items-end":"items-start"}`}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] px-3 py-2 rounded-[10px] bg-[#0f172a] text-white text-xs leading-5">{msg.text}</div>
            ) : (
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={10} color="white" />
                  </div>
                  <span className="text-xs font-semibold text-[#64748b]">AI Assistant</span>
                </div>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-3 py-2.5 text-xs text-[#374151] leading-5">
                  {msg.message.split("\n").map((line, li) => (
                    <p key={li} className={line===""?"h-2":""}>{line.replace(/\*\*(.*?)\*\*/g,"$1")}</p>
                  ))}
                </div>
                {msg.suggestions?.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {msg.suggestions.map((s, si) => (
                      <div key={si} className="flex items-start gap-2 text-xs text-[#64748b]">
                        <span className="text-[#22c55e] font-bold flex-shrink-0 mt-px">→</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.actions?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.actions.map((a, ai) => (
                      <button key={ai} className="px-2.5 py-1 rounded-[6px] bg-white border border-[#e2e8f0] text-xs font-medium text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all">
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
            <div className="flex gap-1 px-3 py-2 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0]">
              {[0,1,2].map(i => <span key={i} className="size-1.5 rounded-full bg-[#94a3b8]" style={{animation:`nodeBounce 0.8s ease-in-out ${i*0.2}s infinite`}} />)}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-2 pt-2 flex gap-2 flex-shrink-0 border-t border-[#f1f5f9]">
        <button className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-[6px] border border-[#e2e8f0] bg-white text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
          <RotateCcw size={11} /> Retry Node
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-[6px] bg-[#0f172a] text-sm font-medium text-white hover:bg-[#1e293b] transition-colors">
          <CheckCircle2 size={11} /> Apply Changes
        </button>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[10px] px-3 py-2 focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]/10 transition-all bg-white">
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);} }}
            placeholder="Ask about this node…"
            className="flex-1 text-xs text-[#0f172a] placeholder:text-[#94a3b8] outline-none bg-transparent" />
          <button onClick={()=>send(input)} disabled={!input.trim()}
            className="flex items-center justify-center size-6 rounded-[6px] bg-[#6366f1] text-white disabled:opacity-40 hover:bg-[#4f46e5] transition-colors">
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
      <div className="flex items-center gap-0 px-0 py-0 border-b border-[#e2e8f0] flex-shrink-0">
        {[
          { id:"summary", icon:ListChecks, label:"Summary" },
          { id:"json",    icon:Braces,     label:"JSON"    },
          { id:"logs",    icon:ScrollText, label:"Logs"    },
        ].map(({ id, icon:TabIcon, label }) => (
          <button key={id} onClick={()=>setSubTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all border-b-2 ${
              subTab===id?"text-[#0f172a] border-b-[#2563eb]":"text-[#94a3b8] border-b-transparent hover:text-[#64748b]"
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
            <div className="grid grid-cols-3 gap-px bg-[#f1f5f9] border-b border-[#f1f5f9]">
              {[["Duration",`${230+selectedIdx*80}ms`],["Records","1"],["Retries","0"]].map(([l,v])=>(
                <div key={l} className="bg-white flex flex-col items-center py-3 gap-0.5">
                  <span className="text-lg font-bold text-[#0f172a]">{v}</span>
                  <span className="text-xs text-[#94a3b8]">{l}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-b border-[#f1f5f9]">
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Input</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(io.input).slice(0,4).map(([k,v])=>(
                  <div key={k} className="flex items-start gap-2 text-sm">
                    <span className="text-[#94a3b8] w-20 flex-shrink-0 pt-0.5">{k}</span>
                    <span className="text-[#0f172a] font-mono break-all">{typeof v==="object"?JSON.stringify(v):String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Output</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(io.output).slice(0,5).map(([k,v])=>(
                  <div key={k} className="flex items-start gap-2 text-sm">
                    <span className="text-[#94a3b8] w-20 flex-shrink-0 pt-0.5">{k}</span>
                    <span className="text-[#0f172a] font-mono break-all">{typeof v==="object"?JSON.stringify(v):String(v)}</span>
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
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-2">{lbl}</p>
                <pre className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm font-mono text-[#374151] overflow-x-auto whitespace-pre-wrap break-all">
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
              <div key={i} className="flex items-start gap-2 py-0.5 hover:bg-[#f8fafc] rounded px-1 text-xs">
                <span className="text-[#94a3b8] flex-shrink-0 tabular-nums">{entry.ts}</span>
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
function FlowOverview({ flow }) {
  const [tab, setTab] = useState("overview");
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 flex-shrink-0">
        {[{id:"overview",label:"Overview"},{id:"settings",label:"Settings"},{id:"history",label:"History"}].map(({id,label})=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors ${tab===id?"bg-[#f1f5f9] text-[#0f172a]":"text-[#94a3b8] hover:text-[#64748b]"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-4 px-4 py-3">
          <div className="flex flex-col gap-2 text-xs">
            {[
              ["Name",       flow.name],
              ["Status",     flow.status?.charAt(0).toUpperCase()+flow.status?.slice(1)],
              ["Steps",      flow.steps.length],
              ["Total Runs", flow.runs?.toLocaleString()],
              ["Success",    flow.success!=null?`${flow.success}%`:"—"],
              ["Last Run",   flow.lastRun],
              ["Created",    flow.createdAt],
            ].map(([k,v])=>(
              <div key={k} className="flex justify-between items-center py-1.5 border-b border-[#f8fafc]">
                <span className="text-[#64748b]">{k}</span>
                <span className="font-medium text-[#0f172a] text-right max-w-[180px] truncate">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#f0f7ff] border border-[#bfdbfe] rounded-[8px] px-3 py-2.5 text-xs text-[#1e40af] flex items-start gap-2">
            <Info size={12} className="flex-shrink-0 mt-0.5 text-[#2563eb]" />
            <span><strong>Tip:</strong> Click any node in the canvas to inspect its configuration and execution result. Use the toolbar buttons to add, retry, or delete nodes.</span>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="flex flex-col gap-3 px-4 py-3">
          {[["Execution mode","Sequential"],["Retry on error","3 times"],["Timeout","30 s"],["Concurrency","1"],["Error handling","Stop flow"],["Logging level","INFO"]].map(([l,v])=>(
            <div key={l} className="flex flex-col gap-1">
              <span className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">{l}</span>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5">
                <span className="text-xs text-[#0f172a]">{v}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="flex flex-col">
          {[
            { id:"run_8f3a", ts:flow.lastRun,  dur:"1.82s", ok: flow.status!=="error" },
            { id:"run_7e2b", ts:"2h ago",       dur:"1.74s", ok:true  },
            { id:"run_6d1c", ts:"5h ago",       dur:"2.01s", ok:true  },
            { id:"run_5c0a", ts:"Yesterday",    dur:"3.20s", ok: flow.status!=="error" },
            { id:"run_4b9f", ts:"2 days ago",   dur:"1.91s", ok:true  },
          ].map(run=>(
            <div key={run.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors cursor-pointer">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-mono text-[#0f172a]">{run.id}</span>
                <span className="text-xs text-[#94a3b8]">{run.ts} · {run.dur}</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${run.ok?"bg-[#dcfce7] text-[#15803d]":"bg-[#fef2f2] text-[#dc2626]"}`}>
                {run.ok?"Success":"Failed"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flow creation helper component ───────────────────────────────────────────
function FlowCreationMode({ flow, runState }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const CREATION_PROMPTS = [
    { icon: Mail, text: "Help me create an email automation workflow" },
    { icon: Database, text: "Build a data validation and enrichment flow" },
    { icon: Bot, text: "Create a lead scoring and qualification workflow" },
    { icon: Zap, text: "Help me automate a document processing pipeline" },
  ];

  const handleSendCreation = () => {
    if (!query.trim()) return;
    const newMessages = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    const aiResp = buildAIResponse(query, null, "pending");
    setMessages(prev => [...prev, { role: "assistant", content: aiResp.message }]);
    setSuggestions(aiResp.suggestions || []);
    setQuery("");
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#f1f5f9] flex-shrink-0">
        <p className="text-sm font-semibold text-[#0f172a] mb-2">🚀 Build your workflow with AI</p>
        <p className="text-xs text-[#64748b] leading-relaxed">Tell me what you want to automate, and I'll help you create the workflow. Or choose one of the templates below to get started.</p>
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="px-4 py-3 flex flex-col gap-2 flex-shrink-0">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">Try these templates:</p>
          {CREATION_PROMPTS.map((prompt, i) => {
            const PromptIcon = prompt.icon;
            return (
              <button key={i} onClick={() => { setQuery(prompt.text); }}
                className="flex items-start gap-2.5 p-2.5 rounded-[8px] border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-[#f0f7ff] transition-colors text-left">
                <PromptIcon size={14} className="text-[#2563eb] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-[#0f172a] leading-snug">{prompt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-[8px] px-3 py-2 text-xs ${
                msg.role === "user"
                  ? "bg-[#2563eb] text-white rounded-br-none"
                  : "bg-[#f1f5f9] text-[#0f172a] rounded-bl-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 flex flex-col gap-2 flex-shrink-0 border-t border-[#f1f5f9]">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">Suggested steps:</p>
          {suggestions.map((sug, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-[6px] bg-[#f8fafc] border border-[#e2e8f0] text-sm">
              <Sparkles size={12} className="text-[#2563eb] flex-shrink-0 mt-0.5" />
              <span className="text-[#0f172a]">{sug}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#f1f5f9] flex-shrink-0">
        <div className="flex items-end gap-2">
          <input placeholder="Describe your workflow..." value={query} onChange={(e)=>setQuery(e.target.value)}
            onKeyDown={(e)=>e.key==="Enter"&&handleSendCreation()}
            className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-xs outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all resize-none max-h-16" />
          <button onClick={handleSendCreation} className="flex items-center justify-center size-8 rounded-[6px] bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors flex-shrink-0">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Right panel (3-mode) ─────────────────────────────────────────────────────
function RightPanel({ flow, selectedIdx, runState }) {
  const [panelMode, setPanelMode] = useState("configure");
  const step = selectedIdx !== null ? flow.steps[selectedIdx] : null;
  const isRunning = runState.activeIdx !== -1;

  // Auto-switch to execution while running
  useEffect(() => { if (isRunning && step) setPanelMode("execution"); }, [isRunning, step]);
  useEffect(() => { if (!step) setPanelMode(flow.steps.length === 0 ? "askai" : "configure"); }, [step, flow.steps.length]);

  const MODES = [
    { id:"configure", icon:Hammer,   label:"Configure" },
    { id:"askai",     icon:Sparkles, label:"Ask AI"    },
    { id:"execution", icon:Gauge,    label:"Execution" },
  ];

  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col border-l border-[#e2e8f0] bg-white overflow-hidden">
      {step ? (
        <>
          {/* Mode tabs — modern underline design */}
          <div className="flex items-center gap-0 px-0 border-b border-[#e2e8f0] bg-white flex-shrink-0">
            {MODES.map(({ id, icon:MIcon, label }) => (
              <button key={id} onClick={()=>setPanelMode(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 text-sm font-medium transition-all border-b-2 relative ${
                  panelMode===id
                    ? id==="askai"
                      ? "text-[#6366f1] border-b-[#6366f1]"
                      : "text-[#0f172a] border-b-[#2563eb]"
                    : "text-[#94a3b8] border-b-transparent hover:text-[#64748b]"
                }`}>
                <MIcon size={14} /> <span>{label}</span>
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {panelMode==="configure" && <ConfigureMode step={step} selectedIdx={selectedIdx} flow={flow} />}
            {panelMode==="askai"     && <AskAIMode     step={step} selectedIdx={selectedIdx} flow={flow} runState={runState} />}
            {panelMode==="execution" && <ExecutionMode step={step} selectedIdx={selectedIdx} flow={flow} runState={runState} />}
          </div>
        </>
      ) : flow.steps.length === 0 ? (
        <FlowCreationMode flow={flow} runState={runState} />
      ) : (
        <>
          <div className="px-4 py-3 border-b border-[#f1f5f9] flex-shrink-0">
            <p className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest">Panel</p>
          </div>
          <FlowOverview flow={flow} />
        </>
      )}
    </div>
  );
}

// ─── Execution timeline panel ─────────────────────────────────────────────────
function ExecutionTimeline({ flow, runState, logs, onHighlightNode, collapsed, onToggle }) {
  const [logTab, setLogTab] = useState("timeline");
  const execStatus = runState.activeIdx !== -1 ? "running" : runState.doneIdxs.size > 0 ? "done" : "idle";

  return (
    <div className="flex-shrink-0 border-t border-[#e2e8f0] bg-white flex flex-col overflow-hidden transition-all duration-300"
      style={{ height: collapsed ? 40 : 220 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 flex-shrink-0 border-b border-[#f1f5f9]">
        <div className="flex items-center gap-1">
          {[
            { id:"timeline", icon:Activity, label:"Execution" },
            { id:"log",      icon:Terminal, label:"Log"       },
          ].map(({ id, icon:TabIcon, label }) => (
            <button key={id} onClick={()=>setLogTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                logTab===id?"bg-[#f1f5f9] text-[#0f172a]":"text-[#94a3b8] hover:text-[#64748b] hover:bg-[#f8fafc]"
              }`}>
              <TabIcon size={12} /> {label}
            </button>
          ))}
          {execStatus!=="idle" && (
            <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${execStatus==="running"?"bg-[#dbeafe] text-[#1d4ed8]":"bg-[#dcfce7] text-[#15803d]"}`}>
              {execStatus==="running"?"Running…":"Completed"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94a3b8]">{flow.steps.length} steps</span>
          <button onClick={onToggle} className="flex items-center justify-center size-6 rounded-[4px] text-[#94a3b8] hover:text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            {collapsed ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          {logTab === "timeline" && (
            <div className="px-6 py-3 relative">
              {/* Connecting line — positioned at circle center height */}
              <div className="absolute top-[35px] left-[20px] right-[20px] h-px bg-[#e2e8f0]" style={{zIndex:0}} />
              <div className="flex items-start gap-0">
                {flow.steps.map((step, i) => {
                  const isRunning = runState.activeIdx === i;
                  const isDone    = runState.doneIdxs.has(i);
                  const exec = isRunning ? STEP_EXEC.running : isDone ? STEP_EXEC.success : STEP_EXEC.pending;
                  return (
                    <button key={i} onClick={()=>onHighlightNode(i)}
                      className="flex flex-col items-center gap-1.5 flex-1 min-w-0 relative group hover:opacity-90 transition-opacity"
                      title={`${step.label}`}>
                      <div className="size-10 rounded-full border-2 flex items-center justify-center relative z-10 bg-white transition-all"
                        style={{ borderColor:exec.color, background:isRunning||isDone?exec.bg:"white", boxShadow:isRunning?`0 0 0 3px ${exec.ring}`:"none" }}>
                        {isRunning
                          ? <RefreshCw size={14} color={exec.color} style={{animation:"nodeSpinAnim 0.8s linear infinite"}} />
                          : isDone
                            ? <CheckCircle2 size={14} color={exec.color} />
                            : <Circle size={14} color={exec.color} />
                        }
                      </div>
                      <span className="text-xs font-medium text-[#64748b] text-center truncate w-full px-1">{step.label}</span>
                      <span className="text-xs text-[#94a3b8]">{isDone?`${230+i*80}ms`:isRunning?"…":"—"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {logTab === "log" && (
            <div className="flex flex-col gap-0.5 px-4 py-2 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-[#94a3b8] py-4 text-center text-xs">Run the flow to see logs.</div>
              ) : logs.map((entry,i) => (
                <div key={i}
                  className={`flex items-start gap-2 py-0.5 hover:bg-[#f8fafc] rounded px-1 transition-colors ${entry.nodeIdx!==null?"cursor-pointer":""}`}
                  onClick={()=>entry.nodeIdx!==null&&onHighlightNode(entry.nodeIdx)}>
                  <span className="text-[#94a3b8] flex-shrink-0 tabular-nums">{entry.ts}</span>
                  <span className={`flex-shrink-0 w-[52px] text-center px-1 py-0.5 rounded text-xs font-bold uppercase ${LOG_BADGES[entry.level]}`}>{entry.level}</span>
                  <span className={LOG_COLORS[entry.level]}>{entry.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes nodeSpinAnim { to { transform: rotate(360deg); } }
        @keyframes nodeBounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      `}</style>
    </div>
  );
}

// ─── Canvas ────────────────────────────────────────────────────────────────────
function Canvas({ flow, selectedIdx, onSelectNode, onAddNode, runState }) {
  const [picker, setPicker]           = useState(null);
  const [emptyHov, setEmptyHov]       = useState(false);
  const canvasW = PAD_X * 2 + flow.steps.length * NODE_W + (flow.steps.length - 1) * H_GAP + 160;
  const canvasH = 480;
  const svgW    = Math.max(canvasW, 800);

  // Empty-node geometry (centered on canvas)
  const eX  = (svgW - NODE_W) / 2;
  const eY  = NODE_Y;
  const eCX = eX + NODE_W / 2;
  const eCY = eY + NODE_H / 2;

  return (
    <div className="relative flex-1 min-w-0 overflow-auto bg-[#f8fafc]"
      style={{ backgroundImage:"radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize:"24px 24px" }}
      onClick={() => { onSelectNode(null); setPicker(null); }}>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 bg-white border border-[#e2e8f0] rounded-[8px] p-1 shadow-sm">
        <button className="flex items-center justify-center size-7 rounded-[6px] hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><ZoomIn size={14}/></button>
        <div className="h-px bg-[#e2e8f0]" />
        <button className="flex items-center justify-center size-7 rounded-[6px] hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><ZoomOut size={14}/></button>
        <div className="h-px bg-[#e2e8f0]" />
        <button className="flex items-center justify-center size-7 rounded-[6px] hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><Crosshair size={14}/></button>
      </div>

      <svg width={svgW} height={canvasH} className="block" onClick={e=>e.stopPropagation()}>
        <defs>
          <style>{`
            @keyframes nodeRunDash { to { stroke-dashoffset: -24; } }
            @keyframes connFlow    { to { stroke-dashoffset: -18; } }
            @keyframes nodePulse   { 0%,100%{opacity:0.25} 50%{opacity:0.55} }
            @keyframes emptyPulse  { 0%,100%{r:18} 50%{r:21} }
          `}</style>
        </defs>

        {/* ── Empty-canvas start node ─────────────────────────────────── */}
        {flow.steps.length === 0 && (
          <g
            onClick={(e) => { e.stopPropagation(); setPicker({ afterIndex:-1, anchorX: eX + NODE_W + 24, anchorY: eCY }); }}
            onMouseEnter={() => { setEmptyHov(true); }}
            onMouseLeave={() => setEmptyHov(false)}
            style={{ cursor: "pointer" }}
          >
            {/* Drop shadow */}
            <rect x={eX+2} y={eY+3} width={NODE_W} height={NODE_H} rx={10} fill={emptyHov ? "rgba(37,99,235,0.08)" : "rgba(0,0,0,0.04)"} />
            {/* Card */}
            <rect x={eX} y={eY} width={NODE_W} height={NODE_H} rx={10}
              fill={emptyHov ? "#eff6ff" : "white"}
              stroke={emptyHov ? "#2563eb" : "#cbd5e1"}
              strokeWidth={emptyHov ? 2 : 1.5}
              strokeDasharray={emptyHov ? "0" : "7 5"}
            />
            {/* Plus circle */}
            <circle cx={eCX} cy={eCY} r={20}
              fill={emptyHov ? "#dbeafe" : "#f8fafc"}
              stroke={emptyHov ? "#93c5fd" : "#e2e8f0"}
              strokeWidth={1.5}
            />
            <line x1={eCX-8} y1={eCY} x2={eCX+8} y2={eCY} stroke={emptyHov ? "#2563eb" : "#94a3b8"} strokeWidth={2.2} strokeLinecap="round" />
            <line x1={eCX} y1={eCY-8} x2={eCX} y2={eCY+8} stroke={emptyHov ? "#2563eb" : "#94a3b8"} strokeWidth={2.2} strokeLinecap="round" />
            {/* Label */}
            <text x={eCX} y={eY + NODE_H + 24} textAnchor="middle" fontSize={12}
              fill={emptyHov ? "#2563eb" : "#94a3b8"} fontWeight={500} fontFamily="Inter, sans-serif">
              Click to add your first step
            </text>
          </g>
        )}

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
            isRunning={runState.activeIdx === i}
            isDone={runState.doneIdxs.has(i)}
          />
        ))}
      </svg>

      {picker && (
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
  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#0f172a] truncate">{flow.name}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
          style={{background: badge.bg, color: badge.text}}>
          <span className="size-1.5 rounded-full inline-block" style={{background: badge.dot}} />
          {badge.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[["Steps", flow.steps.length], ["Runs", flow.runs?.toLocaleString() ?? "0"], ["Success", flow.success != null ? `${flow.success}%` : "—"]].map(([k,v]) => (
          <div key={k} className="flex flex-col items-center bg-white border border-[#e2e8f0] rounded-[6px] py-2 gap-0.5">
            <span className="text-sm font-bold text-[#0f172a]">{v}</span>
            <span className="text-[10px] text-[#94a3b8]">{k}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
        <Clock size={9} />
        <span>Last run: {flow.lastRun ?? "—"}</span>
      </div>
    </div>
  );
}

function RunStartMsg({ name }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-[#dbeafe] rounded-[8px] border border-[#bfdbfe]">
      <RefreshCw size={11} className="text-[#2563eb] animate-spin flex-shrink-0" />
      <span className="text-xs font-medium text-[#1e40af]">Executing "{name}"…</span>
    </div>
  );
}

function StepActiveMsg({ msg }) {
  const Icon = ICON_MAP[msg.icon] ?? Zap;
  return (
    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-[8px] border border-[#e2e8f0] bg-white">
      <div className="size-5 rounded-[4px] flex items-center justify-center flex-shrink-0" style={{background:`${msg.color}18`}}>
        <Icon size={10} style={{color: msg.color}} />
      </div>
      <span className="text-xs text-[#475569] flex-1 truncate">
        Step {msg.idx + 1}: <span className="font-medium text-[#0f172a]">{msg.label}</span>
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
      <span className="text-xs text-[#475569] flex-1 truncate">{msg.label}</span>
      <span className="text-[10px] text-[#94a3b8] flex-shrink-0">{msg.duration}ms</span>
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

function ConversationPanel({ flow, runState, messages, onAddMessage, onRunFlow }) {
  const [input, setInput]         = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef                 = useRef(null);
  const isRunning                 = runState.activeIdx !== -1;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiLoading]);

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
    { label: "Explain this flow",     icon: Info       },
    { label: "How can I optimize it?", icon: Gauge      },
    { label: "What does step 1 do?",  icon: Zap        },
  ];

  return (
    <div className="w-[340px] flex-shrink-0 flex flex-col border-l border-[#e2e8f0] bg-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#e2e8f0] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
            <Sparkles size={10} color="white" />
          </div>
          <span className="text-sm font-semibold text-[#0f172a]">Conversation</span>
        </div>
        <button onClick={onRunFlow} disabled={isRunning}
          className={`flex items-center gap-1.5 h-7 px-3 rounded-[6px] text-xs font-semibold transition-all ${
            isRunning
              ? "bg-[#dbeafe] text-[#1d4ed8] cursor-not-allowed"
              : "bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          }`}>
          {isRunning
            ? <><RefreshCw size={10} className="animate-spin" /> Running…</>
            : <><Play size={10} fill="white" /> Run Flow</>}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
        {messages.map((msg) => {
          if (msg.type === "overview")     return <OverviewCard   key={msg.id} flow={flow} />;
          if (msg.type === "run-start")    return <RunStartMsg    key={msg.id} name={msg.name} />;
          if (msg.type === "step-active")  return <StepActiveMsg  key={msg.id} msg={msg} />;
          if (msg.type === "step-done")    return <StepDoneMsg    key={msg.id} msg={msg} />;
          if (msg.type === "run-done")     return <RunDoneMsg     key={msg.id} msg={msg} />;
          if (msg.type === "user") return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] px-3 py-2 rounded-[10px] bg-[#0f172a] text-white text-xs leading-5">{msg.text}</div>
            </div>
          );
          if (msg.type === "ai") return (
            <div key={msg.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
                  <Sparkles size={9} color="white" />
                </div>
                <span className="text-[11px] font-semibold text-[#64748b]">AI</span>
              </div>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-3 py-2.5 text-xs text-[#374151] leading-5">
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
            <div className="size-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
              <Sparkles size={9} color="white" />
            </div>
            <div className="flex gap-1 px-3 py-2 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0]">
              {[0,1,2].map(i => <span key={i} className="size-1.5 rounded-full bg-[#94a3b8]" style={{animation:`nodeBounce 0.8s ease-in-out ${i*0.2}s infinite`}} />)}
            </div>
          </div>
        )}

        {!hasUserMsg && !aiLoading && (
          <div className="flex flex-col gap-1.5 mt-1">
            {QUICK.map(({ label, icon: QIcon }) => (
              <button key={label} onClick={() => sendMessage(label)}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#f1f5f9] hover:border-[#cbd5e1] transition-all text-left">
                <QIcon size={12} className="text-[#94a3b8] flex-shrink-0" />
                <span className="text-xs text-[#475569]">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-[#e2e8f0] flex-shrink-0">
        <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[10px] px-3 py-2 focus-within:border-[#6366f1]/50 focus-within:ring-2 focus-within:ring-[#6366f1]/10 transition-all bg-white">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask about this flow…"
            className="flex-1 text-xs text-[#0f172a] placeholder:text-[#94a3b8] outline-none bg-transparent" />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()}
            className="flex items-center justify-center size-6 rounded-[6px] bg-[#6366f1] text-white disabled:opacity-40 hover:bg-[#4f46e5] transition-colors">
            <Send size={11} />
          </button>
        </div>
      </div>
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

function TopBar({ flow, onBack, onRunNow, isRunning, onRename, versions = [], onSaveVersion, activeVersionId, onRestoreVersion, pageMode = "view", onSetPageMode }) {
  const badge                   = STATUS_BADGE[flow.status] ?? STATUS_BADGE.draft;
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(flow.name);
  const inputRef                = useRef(null);

  // Context menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  // Dialog states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

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
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
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

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDuplicate = () => {
    console.log("Duplicating flow:", flow.name);
    alert(`Created copy: "Copy of ${flow.name}"`);
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
    alert("Share flow feature - coming soon!\nPlease contact support for sharing options.");
    closeMenu();
  };

  const handleCopyURL = () => {
    const url = `${window.location.origin}?flowId=${flow.id || Date.now()}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("✓ Flow URL copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy URL");
    });
    closeMenu();
  };

  const handleViewChangelog = () => {
    setChangelogOpen(true);
    closeMenu();
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
    closeMenu();
  };

  const handleConfirmDelete = () => {
    console.log("Flow deleted:", flow.name);
    alert(`Flow "${flow.name}" has been deleted.`);
    setConfirmDelete(false);
    onBack();
  };

  const handleSettings = () => {
    setSettingsOpen(true);
    closeMenu();
  };

  const handleSave = () => {
    setSaving(true);
    setSaveStatus("saving");

    // Simulate save operation (500ms delay)
    setTimeout(() => {
      console.log("Flow saved:", flow.name);
      setSaveStatus("saved");

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setSaving(false);
      }, 2000);
    }, 500);
  };

  return (
    <>
      <div className="flex items-center gap-3 h-16 px-4 bg-white border-b border-[#e2e8f0] flex-shrink-0">
        <button onClick={onBack} className="flex items-center justify-center size-8 rounded-[8px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors flex-shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="h-5 w-px bg-[#e2e8f0]" />
        <div className="flex items-center gap-1.5 text-sm text-[#94a3b8]">
          <button onClick={onBack} className="hover:text-[#64748b] transition-colors">Flows</button>
          <ChevronRight size={13} />
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              className="text-sm font-medium text-[#0f172a] bg-white border border-[#2563eb] rounded-[5px] px-2 h-7 max-w-[220px] outline-none ring-2 ring-[#2563eb]/20"
            />
          ) : (
            <span
              onClick={startEdit}
              title="Click to rename"
              className="text-[#0f172a] font-medium truncate max-w-[200px] rounded-[5px] px-1.5 py-0.5 transition-colors cursor-text hover:bg-[#f1f5f9]"
            >
              {flow.name}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{background:badge.bg,color:badge.text}}>
          <span className="size-1.5 rounded-full flex-shrink-0" style={{background:badge.dot}} />
          {badge.label}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {!isRunning && (
            <div className="flex items-center gap-1.5">
              {/* Version history picker — visible in both view and edit mode */}
              <div className="relative" data-version-panel ref={versionPanelRef}>
                <button
                  onClick={() => setVersionPanelOpen(v => !v)}
                  title="Version history"
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] bg-white border border-[#e2e8f0] text-[#475569] text-xs font-medium hover:bg-[#f8fafc] transition-colors"
                >
                  <History size={13} />
                  {activeVersion ? (
                    <span className="font-semibold text-[#0f172a]">{activeVersion.name}</span>
                  ) : versions.length > 0 ? (
                    <span className="text-[#64748b]">Latest</span>
                  ) : (
                    <span className="text-[#94a3b8]">No versions</span>
                  )}
                  <ChevronDown size={11} className="text-[#94a3b8]" />
                </button>

                {versionPanelOpen && (
                  <div data-version-panel className="absolute right-0 top-10 z-[999] bg-white border border-[#e2e8f0] rounded-[12px] w-[260px] overflow-hidden"
                    style={{boxShadow:"0 8px 24px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06)"}}>
                    <div className="px-3 py-2.5 border-b border-[#f1f5f9] flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-widest">Version history</p>
                      {pageMode === "edit" && (
                        <button
                          onClick={() => { handleSaveVersion(); setVersionPanelOpen(false); }}
                          className="flex items-center gap-1 h-6 px-2 rounded-[5px] bg-[#0f172a] text-white text-[10px] font-medium hover:bg-[#1e293b] transition-colors"
                        >
                          <Save size={10} /> Save v{versions.length + 1}
                        </button>
                      )}
                    </div>
                    {versions.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-[#94a3b8]">No versions saved yet</div>
                    ) : (
                      <div className="py-1 max-h-[220px] overflow-y-auto">
                        {/* Working copy row */}
                        <button
                          onClick={() => { setVersionPanelOpen(false); onRestoreVersion?.({ id: null, steps: [], flowName: flow.name }); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${!activeVersionId ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]"}`}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-semibold text-[#0f172a]">Latest (unsaved)</span>
                            <span className="text-[10px] text-[#94a3b8]">Current working copy</span>
                          </div>
                          {!activeVersionId && <span className="text-[10px] font-semibold text-[#2563eb] flex-shrink-0 ml-2">● Active</span>}
                        </button>
                        <div className="h-px bg-[#f1f5f9] mx-3" />
                        {versions.map((v) => {
                          const isCurrent = v.id === activeVersionId;
                          return (
                            <button
                              key={v.id}
                              onClick={() => { setVersionPanelOpen(false); onRestoreVersion?.(v); }}
                              className={`group w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${isCurrent ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]"}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[11px] font-bold text-[#475569] bg-[#f1f5f9] px-1.5 py-0.5 rounded-[4px] flex-shrink-0">{v.name}</span>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-xs text-[#0f172a] truncate">{v.date}</span>
                                  <span className="text-[10px] text-[#94a3b8]">{v.stepCount} step{v.stepCount !== 1 ? "s" : ""}</span>
                                </div>
                              </div>
                              {isCurrent
                                ? <span className="text-[10px] font-semibold text-[#2563eb] flex-shrink-0 ml-2">● Active</span>
                                : <span className="text-[10px] font-medium text-[#2563eb] flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">Restore</span>
                              }
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Run Flow — view mode */}
              {pageMode === "view" && (
                <button
                  onClick={onRunNow} disabled={isRunning}
                  className="flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] bg-[#0f172a] text-white text-xs font-medium hover:bg-[#1e293b] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Play size={12} fill="white" /> Run Flow
                </button>
              )}

              {/* Edit Flow — view mode only */}
              {pageMode === "view" && (
                <button
                  onClick={() => onSetPageMode("edit")}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-white border border-[#e2e8f0] text-[#475569] text-xs font-medium hover:bg-[#f8fafc] transition-colors"
                >
                  <Pencil size={12} /> Edit Flow
                </button>
              )}
            </div>
          )}
          <button
            ref={btnRef}
            onClick={handleMenuToggle}
            className="flex items-center justify-center size-8 rounded-[6px] bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] transition-colors"
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
          className="fixed bg-white border border-[#e2e8f0] rounded-[10px] w-[200px] z-[9999] shadow-xl overflow-hidden"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Group 1: Actions */}
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors text-left"
          >
            <Copy size={14} className="text-[#64748b]" /> Duplicate
          </button>
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors text-left"
          >
            <Download size={14} className="text-[#64748b]" /> Export as JSON
          </button>

          {/* Divider */}
          <div className="h-px bg-[#f1f5f9]" />

          {/* Group 3: Sharing & Info */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors text-left"
          >
            <Share2 size={14} className="text-[#64748b]" /> Share
          </button>
          <button
            onClick={handleCopyURL}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors text-left"
          >
            <Copy size={14} className="text-[#64748b]" /> Copy URL
          </button>
          <button
            onClick={handleViewChangelog}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors text-left"
          >
            <History size={14} className="text-[#64748b]" /> Changelog
          </button>

          {/* Divider */}
          <div className="h-px bg-[#f1f5f9]" />

          {/* Group 4: Settings & Danger */}
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors text-left"
          >
            <Settings2 size={14} className="text-[#64748b]" /> Settings
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
            className="relative bg-white rounded-2xl w-[420px] overflow-hidden"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb]" />
            <div className="px-6 pt-6 pb-6">
              <h2 className="text-lg font-semibold text-[#0f172a] mb-5">Flow Settings</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-2">Execution Timeout</label>
                  <input
                    type="text"
                    defaultValue="30 seconds"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-[6px] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-2">Max Retries</label>
                  <input
                    type="text"
                    defaultValue="3"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-[6px] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-2">Retry Delay</label>
                  <input
                    type="text"
                    defaultValue="1 second"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-[6px] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="flex-1 h-10 rounded-[8px] border border-[#e2e8f0] bg-white text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Settings saved!");
                    setSettingsOpen(false);
                  }}
                  className="flex-1 h-10 rounded-[8px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Changelog Dialog */}
      {changelogOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setChangelogOpen(false)} />
          <div
            className="relative bg-white rounded-2xl w-[480px] max-h-[600px] overflow-hidden flex flex-col"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1]" />
            <div className="px-6 pt-6 pb-6 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#0f172a]">Flow Changelog</h2>
                <button
                  onClick={() => setChangelogOpen(false)}
                  className="text-[#94a3b8] hover:text-[#64748b]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-3">
                {[
                  { time: "Today at 3:45 PM", action: "Flow status changed to Active", user: "You" },
                  { time: "Today at 2:30 PM", action: "Step 'Score' configuration updated", user: "You" },
                  { time: "Yesterday at 4:10 PM", action: "Added new step 'Email'", user: "You" },
                  { time: "2 days ago at 10:20 AM", action: "Flow created", user: "You" },
                  { time: "2 days ago at 9:15 AM", action: "Initial setup completed", user: "You" },
                ].map((entry, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-[#f1f5f9]">
                    <div className="text-xs text-[#94a3b8] flex-shrink-0 w-20">{entry.time}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0f172a]">{entry.action}</p>
                      <p className="text-xs text-[#94a3b8]">by {entry.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FlowViewPage({ flow: flowProp, onNavigate, sidebarCollapsed, onToggleSidebar }) {
  const [steps, setSteps]             = useState(flowProp?.steps ?? []);
  const [flowName, setFlowName]       = useState(flowProp?.name ?? "Untitled Flow");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [tlCollapsed, setTLCollapsed] = useState(false);
  const [runState, setRunState]       = useState({ activeIdx:-1, doneIdxs:new Set() });
  const [logs, setLogs]               = useState([]);
  const runTimers                     = useRef([]);
  const [convMessages, setConvMessages] = useState([{ type: "overview", id: "overview" }]);
  const [versions, setVersions]         = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null); // null = unsaved working copy
  // "edit" for new/blank flows, "view" for existing ones
  const [pageMode, setPageMode] = useState(!flowProp?.steps?.length ? "edit" : "view");

  // Expand timeline when execution starts
  const isRunning = runState.activeIdx !== -1;
  useEffect(() => { if (isRunning) setTLCollapsed(false); }, [isRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        alert('Flow saved! ✓');
      }
      // Ctrl+Enter or Cmd+Enter: Run flow
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        alert('Running flow... ⚡');
      }
      // Delete: Delete selected node
      if (e.key === 'Delete' && selectedIdx !== null) {
        if (confirm(`Delete "${steps[selectedIdx]?.label}"?`)) {
          alert('Node deleted');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, steps]);

  const flow = flowProp ? { ...flowProp, steps, name: flowName } : null;

  // Sync Zustand store
  const { initFlow } = useFlowStore();
  useEffect(() => { if (flowProp) initFlow(flowProp); }, [flowProp]);

  const handleAddNode = (afterIndex, newStep) => {
    setActiveVersionId(null); // mark as unsaved after edit
    setSteps(prev => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, { ...newStep, status:"pending" });
      return next;
    });
    setSelectedIdx(afterIndex + 1);
  };

  const buildLogsLocal = (nodes, name) => {
    const lines = [];
    let ms = 0;
    const fmt = d => `15:49:${String(Math.floor(d/1000)).padStart(2,"0")}.${String(d%1000).padStart(3,"0")}`;
    lines.push({ ts:fmt(ms), level:"INFO", nodeIdx:null, msg:`Flow "${name}" triggered` });
    nodes.forEach((node, i) => {
      ms += 80 + Math.round(Math.random() * 120);
      lines.push({ ts:fmt(ms), level:"INFO", nodeIdx:i, msg:`[${node.label}] started` });
      ms += 200 + Math.round(Math.random() * 400);
      lines.push({ ts:fmt(ms), level:"SUCCESS", nodeIdx:i, msg:`[${node.label}] completed in ${ms%600}ms` });
    });
    lines.push({ ts:fmt(ms+12), level:"INFO", nodeIdx:null, msg:`Run completed — total ${ms}ms` });
    return lines;
  };

  const handleRunNow = () => {
    runTimers.current.forEach(clearTimeout);
    runTimers.current = [];
    const n = steps.length;
    const startTime = Date.now();

    setRunState({ activeIdx:0, doneIdxs:new Set() });
    setLogs(buildLogsLocal(steps, flowName));
    setTLCollapsed(false);

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
            setConvMessages(prev => [...prev, {
              type: "run-done", id: `rd-${Date.now()}`,
              total: n, duration: Date.now() - startTime,
            }]);
          }, 300);
        }
      }, (i+1) * 1500);

      runTimers.current.push(tActive, tDone);
    });
  };

  const saveVersion = () => {
    const num = versions.length + 1;
    const id  = `v${num}`;
    const snap = { id, name: id, num, date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), stepCount: steps.length, steps: [...steps], flowName };
    setVersions(prev => [snap, ...prev]);
    setActiveVersionId(id);
  };

  const restoreVersion = (v) => {
    if (v.id === null) { setActiveVersionId(null); return; }
    setSteps([...v.steps]);
    setFlowName(v.flowName ?? flowName);
    setActiveVersionId(v.id);
  };

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
        <TopBar
          flow={flow} onBack={()=>onNavigate("flows")}
          onRunNow={handleRunNow} isRunning={runState.activeIdx !== -1}
          onRename={setFlowName}
          versions={versions} onSaveVersion={saveVersion} activeVersionId={activeVersionId} onRestoreVersion={restoreVersion}
          pageMode={pageMode} onSetPageMode={setPageMode}
        />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Canvas flow={flow} selectedIdx={selectedIdx} onSelectNode={setSelectedIdx} onAddNode={handleAddNode} runState={runState} />
          <ConversationPanel
            flow={flow}
            runState={runState}
            messages={convMessages}
            onAddMessage={(msg) => setConvMessages(prev => [...prev, msg])}
            onRunFlow={handleRunNow}
          />
        </div>
        <ExecutionTimeline
          flow={flow} runState={runState} logs={logs}
          onHighlightNode={setSelectedIdx}
          collapsed={tlCollapsed} onToggle={()=>setTLCollapsed(v=>!v)}
        />
      </div>
    </div>
  );
}
