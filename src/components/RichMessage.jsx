import { useState, useEffect } from "react";
import {
  Copy, Check, Download, Terminal, ChevronDown, ChevronUp, ChevronRight,
  AlertCircle, CheckCircle2, FileText, File, FileSpreadsheet,
  Presentation, Image, Brain, Wrench,
} from "lucide-react";

/* ── Thinking ─────────────────────────────────────────────────── */
export function ThinkingBlock({ duration }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <Brain size={16} className="text-[#6366f1] flex-shrink-0" style={{ animation: "rmPulse 1.5s ease-in-out infinite" }} />
      <span className="text-base font-medium text-foreground">
        Thinking<span className="text-muted-foreground">...</span>
      </span>
      {duration && (
        <span className="ml-auto inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono tabular-nums text-muted-foreground">
          {duration}
        </span>
      )}
      <style>{`@keyframes rmPulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ── Generating ───────────────────────────────────────────────── */
export function GeneratingBlock() {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm leading-none"
        style={{ display: "inline-block", animation: "rmSparkle 1s ease-in-out infinite" }}>✨</span>
      <span className="text-sm text-muted-foreground italic">Generating...</span>
      <style>{`@keyframes rmSparkle{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );
}

/* ── Heading ──────────────────────────────────────────────────── */
/* DS: Inter Variable — bold for display headings, medium for sub-headings */
const H_STYLES = {
  1: "text-xl  font-bold   text-foreground mt-4 mb-2",
  2: "text-lg  font-bold   text-foreground mt-3 mb-1.5",
  3: "text-base font-medium text-foreground mt-2 mb-1",
  4: "text-sm  font-medium  text-foreground/90 mt-2 mb-1",
  5: "text-sm  font-medium  text-muted-foreground mt-1 mb-0.5",
  6: "text-xs  font-medium  text-muted-foreground uppercase tracking-wider mt-1 mb-0.5",
};
export function HeadingBlock({ level, content }) {
  const Tag = `h${level}`;
  return <Tag className={H_STYLES[level] || H_STYLES[3]}>{content}</Tag>;
}

/* ── Text ─────────────────────────────────────────────────────── */
/* DS: text-sm (14px) / leading-6 (24px) / font-normal / Inter */
export function TextBlock({ content }) {
  return <p className="text-sm leading-6 text-foreground">{content}</p>;
}

/* ── Blockquote ───────────────────────────────────────────────── */
export function BlockquoteBlock({ content }) {
  return (
    <div className="my-1 rounded-r-2xl border-l-2 border-primary/40 pl-4">
      <p className="text-sm italic leading-6 text-muted-foreground">{content}</p>
    </div>
  );
}

/* ── Code Block ───────────────────────────────────────────────── */
export function CodeBlock({ language, content }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-[#1f2937]">
      <div className="flex items-center justify-between bg-[#111827] px-4 py-2.5">
        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
          {language || "code"}
        </span>
        <button onClick={copy}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 hover:text-white transition-colors">
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#020617] px-4 py-3 text-xs leading-5 whitespace-pre text-[#e2e8f0]">
        {content}
      </pre>
    </div>
  );
}

/* ── Table ────────────────────────────────────────────────────── */
export function TableBlock({ headers, rows }) {
  return (
    <div className="my-2">
      <div className="mb-2 flex justify-end">
        <button className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary">
          <Download size={11} /> Export
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="bg-transparent">
                {row.map((cell, ci) => (
                  <td key={ci} className="border-t border-border px-3 py-2.5 text-sm text-foreground/80">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Steps ────────────────────────────────────────────────────── */
const STEP_CIRCLE = {
  done:    "bg-success text-success-foreground",
  active:  "bg-primary text-primary-foreground",
  pending: "bg-muted text-muted-foreground",
};
export function StepsBlock({ items }) {
  return (
    <div className="my-1 flex flex-col">
      {items.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-medium z-10 ${STEP_CIRCLE[step.status] || STEP_CIRCLE.pending}`}>
              {step.num}
            </div>
            {i < items.length - 1 && <div className="w-px flex-1 min-h-[16px] bg-border my-1" />}
          </div>
          <div className={`flex-1 ${i < items.length - 1 ? "pb-4" : "pb-0"}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{step.title}</span>
              {step.timestamp && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{step.timestamp}</span>
              )}
            </div>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-5">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Terminal Logs ────────────────────────────────────────────── */
const LOG_COLORS = {
  INFO:  "text-[#60a5fa]",
  WARN:  "text-[#fbbf24]",
  ERROR: "text-[#f87171]",
  READY: "text-[#34d399]",
  DEBUG: "text-[#a78bfa]",
};
export function TerminalBlock({ logs }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-1 rounded-[10px] border border-[#334155] dark:border-[#1e293b] overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#1e293b] dark:bg-[#0f172a] hover:bg-[#273548] dark:hover:bg-[#1e293b] transition-colors">
        <Terminal size={13} className="text-[#94a3b8]" />
        <span className="text-xs font-mono text-[#94a3b8]">Terminal Logs</span>
        <span className="ml-auto text-[#94a3b8]">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>
      {open && (
        <div className="bg-[#0f172a] dark:bg-[#0a0f1a] px-4 py-3 max-h-48 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2 text-[11px] font-mono leading-5">
              {log.timestamp && (
                <span className="text-[#475569] dark:text-[#94a3b8] flex-shrink-0">{log.timestamp}</span>
              )}
              <span className={`flex-shrink-0 font-bold ${LOG_COLORS[log.level] || "text-[#94a3b8]"}`}>
                [{log.level}]
              </span>
              <span className="text-[#cbd5e1]">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Alert ────────────────────────────────────────────────────── */
const ALERT_STYLES = {
  error: {
    wrap:  "text-[#dc2626] dark:text-[#fca5a5]",
    icon:  <AlertCircle size={15} className="text-[#ef4444]" />,
    title: "text-[#b91c1c] dark:text-[#fca5a5]",
    desc:  "text-[#dc2626] dark:text-[#fca5a5]",
  },
  success: {
    wrap:  "text-[#15803d] dark:text-[#86efac]",
    icon:  <CheckCircle2 size={15} className="text-[#16a34a]" />,
    title: "text-[#15803d] dark:text-[#86efac]",
    desc:  "text-[#16a34a] dark:text-[#86efac]",
  },
};
export function AlertBlock({ variant, title, description }) {
  const s = ALERT_STYLES[variant] || ALERT_STYLES.error;
  return (
    <div className={`my-1 flex items-start gap-2 ${s.wrap}`}>
      <div className="mt-0.5 shrink-0">{s.icon}</div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${s.title}`}>{title}</p>
        {description && <p className={`text-sm leading-6 ${s.desc}`}>{description}</p>}
      </div>
    </div>
  );
}

/* ── Files ────────────────────────────────────────────────────── */
const FILE_META = {
  pdf:  { Icon: FileText,       color: "text-[#ef4444]", bg: "bg-[#fef2f2] dark:bg-[#7f1d1d]" },
  docx: { Icon: FileText,       color: "text-[#2563eb] dark:text-[#60a5fa]", bg: "bg-[#eff6ff] dark:bg-[#1e3a8a]" },
  xls:  { Icon: FileSpreadsheet,color: "text-[#16a34a]", bg: "bg-[#f0fdf4] dark:bg-[#14532d]" },
  xlsx: { Icon: FileSpreadsheet,color: "text-[#16a34a]", bg: "bg-[#f0fdf4] dark:bg-[#14532d]" },
  pptx: { Icon: Presentation,   color: "text-[#ea580c]", bg: "bg-[#fff7ed] dark:bg-[#78350f]" },
  png:  { Icon: Image,          color: "text-[#7c3aed]", bg: "bg-[#f5f3ff] dark:bg-[#2e1065]" },
  jpg:  { Icon: Image,          color: "text-[#7c3aed]", bg: "bg-[#f5f3ff] dark:bg-[#2e1065]" },
};
export function FilesBlock({ items }) {
  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-[#dbe4f0] dark:border-[#2b374c]">
      {items.map((file, i) => {
        const ext = file.name.split(".").pop().toLowerCase();
        const { Icon, color, bg } = FILE_META[ext] || { Icon: File, color: "text-[#64748b] dark:text-[#94a3b8]", bg: "bg-[#f8fafc] dark:bg-[#1e293b]" };
        return (
          <div key={i}
            className={`flex items-center gap-3 px-3 py-3 transition-colors hover:bg-[#f8fbff] dark:hover:bg-white/[0.03] ${i > 0 ? "border-t border-[#eef2f7] dark:border-[#162033]" : ""}`}>
            <div className={`size-8 rounded-[6px] flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon size={15} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-[11px] text-muted-foreground">{file.size}</p>
            </div>
            <button className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
              <Download size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Agent Timeline ───────────────────────────────────────────── */
/*
 * Step shapes:
 *  { id, kind:"comment", text }
 *  { id, kind:"action",  action:"Read"|"Write"|…, target:"filename", meta:"…", code:[{num,text}] }
 *  { id, kind:"pondering" }
 *
 * Colors: Aziron DS tokens
 *   text-foreground       = var(--foreground)        ≈ #0f172a / #f8fafc dark
 *   text-muted-foreground = var(--muted-foreground)  ≈ #64748b / #94a3b8 dark
 *   bg-muted              = var(--muted)             ≈ #f1f5f9 / dark-equiv
 *   border-border         = var(--border)            ≈ #e2e8f0 / #334155 dark
 *   bg-primary / text-primary = var(--primary)       ≈ #2563eb
 *   text-warning / bg-warning = var(--warning)       ≈ amber
 */
const DEFAULT_TIMELINE_STEPS = [
  { id: 1, kind: "comment", text: "Sure, let me take a look at the file:" },
  { id: 2, kind: "action", action: "Read", target: "localizationUtils.ts", meta: "Read 256 lines", code: null },
  {
    id: 3, kind: "action", action: "Write", target: "src/test/localization.ts", meta: null,
    code: [
      { num: 1, text: "import { formatDate, translateKey, getCurrencySymbol } from '../localizationUtils';" },
      { num: 2, text: "" },
      { num: 3, text: "describe('LocalizationUtil', () => {" },
      { num: 4, text: "  describe('formatDate', () => {" },
      { num: 5, text: "    it('should format date correctly', () => {" },
    ],
  },
  { id: 4, kind: "pondering" },
];

/* Shared keyframes injected once — both blocks reuse the same class names */
const TL_KEYFRAMES = `
  @keyframes tlSlideIn  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tlSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes rmPulse    { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
  @keyframes tlPondRing { 0%{transform:scale(.6);opacity:.5} 70%{transform:scale(2.2);opacity:0} 100%{opacity:0} }
  @keyframes tlEllipsis { to { width: 1.1em } }
  .tl-dots { display:inline-block; overflow:hidden; width:0; vertical-align:bottom;
             animation:tlEllipsis 1.2s steps(3,end) infinite; white-space:nowrap; }
`;

/* Dot for each step kind — uses DS tokens */
function TimelineDot({ kind, isOpen }) {
  if (kind === "pondering") {
    return (
      <span className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
        <span
          className="absolute inset-0 rounded-full bg-primary opacity-0"
          style={{ animation: "tlPondRing 1.6s ease-out infinite" }}
        />
        <span
          className="text-[15px] leading-none text-primary flex-shrink-0 relative z-10"
          style={{ animation: "tlSpin 2.4s linear infinite", display: "inline-block" }}
        >✳</span>
      </span>
    );
  }
  if (kind === "action") {
    return isOpen
      ? <div className="size-2.5 rounded-full bg-primary flex-shrink-0 ring-[3px] ring-primary/20" />
      : <div className="size-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />;
  }
  /* comment dot */
  return <div className="size-2 rounded-full bg-border flex-shrink-0" />;
}

export function AgentTimelineBlock({ steps, duration }) {
  const items = steps || DEFAULT_TIMELINE_STEPS;
  const [expanded, setExpanded] = useState(true);

  /* Per-row open/close — action rows with content start open */
  const [rowOpenIds, setRowOpenIds] = useState(
    () => new Set(
      (steps || DEFAULT_TIMELINE_STEPS)
        .filter(s => s.kind === "action" && (s.meta || (s.code && s.code.length)))
        .map(s => s.id)
    )
  );
  const toggleRow = (id) => setRowOpenIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  /* Stagger entrance: 150 ms first, 300 ms each subsequent */
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (visibleCount >= items.length) return;
    const t = setTimeout(() => setVisibleCount(v => v + 1), visibleCount === 0 ? 150 : 300);
    return () => clearTimeout(t);
  }, [visibleCount, items.length]);

  return (
    <div className="w-full">
      <style>{TL_KEYFRAMES}</style>

      {/* ── Collapsible header — text-base + foreground per Aziron DS ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 py-2 px-2 mb-1 rounded-md w-full text-left
          cursor-pointer group hover:bg-muted/50 transition-colors"
      >
        <Brain size={16} className="text-[#6366f1] flex-shrink-0"
          style={{ animation: "rmPulse 1.5s ease-in-out infinite" }} />
        <span className="text-base font-medium text-foreground">
          Thinking<span className="tl-dots text-muted-foreground">...</span>
        </span>
        {duration && (
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full
            bg-muted text-[10px] font-mono text-muted-foreground tabular-nums">
            {duration}
          </span>
        )}
        <span className={`${duration ? "" : "ml-auto"} text-muted-foreground transition-colors`}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* ── Timeline rows ── */}
      {expanded && (
        <div className="relative flex flex-col pl-2">
          {items.slice(0, visibleCount).map((step, i) => {
            const isLast = i === Math.min(visibleCount, items.length) - 1;
            return (
              <div key={step.id} className="flex gap-3"
                style={{ animation: "tlSlideIn 0.28s ease both" }}>

                {/* Left: dot + connector */}
                <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                  <div className="flex items-center justify-center mt-3"
                    style={{ height: 20, zIndex: 1, position: "relative" }}>
                    <TimelineDot kind={step.kind} isOpen={rowOpenIds.has(step.id)} />
                  </div>
                  {!isLast && (
                    <div className="absolute bg-border"
                      style={{ width: 1, top: 32, bottom: -8, left: "50%", transform: "translateX(-50%)" }} />
                  )}
                </div>

                {/* Right: content */}
                <div className={`flex-1 min-w-0 pt-2.5 ${!isLast ? "pb-5" : "pb-1"}`}>

                  {/* comment — italic muted */}
                  {step.kind === "comment" && (
                    <p className="text-xs text-muted-foreground leading-5 italic">{step.text}</p>
                  )}

                  {/* action */}
                  {step.kind === "action" && (() => {
                    const hasContent = !!(step.meta || (step.code && step.code.length));
                    const rowOpen = rowOpenIds.has(step.id);
                    return (
                      <div>
                        <button
                          onClick={() => hasContent && toggleRow(step.id)}
                          className={`flex items-center justify-between gap-2 w-full text-left
                            rounded-md -mx-1.5 px-1.5 py-0.5 transition-colors group
                            ${hasContent ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
                        >
                          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                            <span className="text-sm font-medium text-foreground flex-shrink-0">
                              {step.action}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              {step.target}
                            </span>
                          </div>
                          {hasContent && (
                            <span className="flex-shrink-0 text-muted-foreground transition-colors">
                              {rowOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </span>
                          )}
                        </button>

                        {hasContent && rowOpen && (
                          <div className="mt-1.5">
                            {step.meta && (
                              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5
                                rounded-full bg-muted text-[10px] font-mono text-muted-foreground">
                                <span className="opacity-60">L</span>
                                {step.meta}
                              </span>
                            )}
                            {step.code && step.code.length > 0 && (
                              <div className="mt-2 rounded-md border border-border overflow-hidden">
                                {step.code.map(line => (
                                  <div key={line.num}
                                    className="flex gap-4 px-3 py-[3px] bg-muted hover:bg-muted/80 transition-colors">
                                    <span className="text-[11px] font-mono text-muted-foreground/40
                                      w-4 text-right flex-shrink-0 select-none">
                                      {line.num}
                                    </span>
                                    <span className="text-[11px] font-mono text-foreground/75 whitespace-pre truncate">
                                      {line.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* pondering */}
                  {step.kind === "pondering" && (
                    <span className="text-xs text-primary italic font-medium">
                      working<span className="tl-dots">...</span>
                    </span>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Tool Execution Block ─────────────────────────────────────── */
const DEFAULT_TOOLS = [
  {
    id: 1, name: "search_knowledge_base", status: "done",
    input: { query: "customer support email templates", limit: 5 },
    output: { count: 5, results: ["Template A — Welcome", "Template B — Follow-up", "Template C — Escalation"] },
  },
  {
    id: 2, name: "send_email", status: "done",
    input: { to: "customer@example.com", subject: "Support Request #4821", body: "Dear Customer, thank you for reaching out..." },
    output: { message_id: "msg_abc123", status: "sent", timestamp: "2026-03-29T10:41:00Z" },
  },
  {
    id: 3, name: "create_whatsapp_message", status: "running",
    input: { phone: "+1234567890", message: "Hi! Following up on your support request #4821. How can we help?" },
    output: null,
  },
];

export function ToolExecutionBlock({ tools }) {
  const items = tools || DEFAULT_TOOLS;
  const [expanded, setExpanded] = useState(true);
  const [openIds,  setOpenIds]  = useState(() => new Set());

  /* Stagger entrance — identical cadence to AgentTimelineBlock */
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (visibleCount >= items.length) return;
    const t = setTimeout(() => setVisibleCount(v => v + 1), visibleCount === 0 ? 150 : 300);
    return () => clearTimeout(t);
  }, [visibleCount, items.length]);

  const toggle = (id) => setOpenIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const doneCount = items.filter(t => t.status === "done").length;

  return (
    <div className="w-full">
      <style>{TL_KEYFRAMES}</style>

      {/* ── Header — text-base + foreground per Aziron DS, warning accent for tool icon ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 py-2 px-2 mb-1 rounded-md w-full text-left
          cursor-pointer group hover:bg-muted/50 transition-colors"
      >
        <Wrench size={16} className="text-warning flex-shrink-0"
          style={{ animation: "rmPulse 1.8s ease-in-out infinite" }} />
        <span className="text-base font-medium text-foreground">
          Tool Execution<span className="tl-dots text-muted-foreground">...</span>
        </span>
        {/* Progress counter — warning palette from DS */}
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full
          bg-warning/10 text-[10px] font-mono text-warning tabular-nums">
          {doneCount}/{items.length}
        </span>
        <span className="text-muted-foreground transition-colors">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* ── Tool rows — mirrored layout of AgentTimelineBlock ── */}
      {expanded && (
        <div className="relative flex flex-col pl-2">
          {items.slice(0, visibleCount).map((tool, i) => {
            const isOpen = openIds.has(tool.id);
            const isLast = i === Math.min(visibleCount, items.length) - 1;
            return (
              <div key={tool.id} className="flex gap-3"
                style={{ animation: "tlSlideIn 0.28s ease both" }}>

                {/* Left: dot + connector */}
                <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                  <div className="flex items-center justify-center mt-3"
                    style={{ height: 20, position: "relative", zIndex: 1 }}>
                    {tool.status === "running" ? (
                      /* Running: pulsing warning ring — mirrors pondering in timeline */
                      <span className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
                        <span className="absolute inset-0 rounded-full bg-warning opacity-0"
                          style={{ animation: "tlPondRing 1.6s ease-out infinite" }} />
                        <span className="size-2.5 rounded-full bg-warning relative z-10"
                          style={{ animation: "rmPulse 1.4s ease-in-out infinite" }} />
                      </span>
                    ) : (
                      /* Done/error: primary dot when open, muted when closed */
                      isOpen
                        ? <div className="size-2.5 rounded-full flex-shrink-0 bg-primary ring-[3px] ring-primary/20" />
                        : <div className="size-2 rounded-full flex-shrink-0 bg-muted-foreground/40" />
                    )}
                  </div>
                  {!isLast && (
                    <div className="absolute bg-border"
                      style={{ width: 1, top: 32, bottom: -8, left: "50%", transform: "translateX(-50%)" }} />
                  )}
                </div>

                {/* Right: content */}
                <div className={`flex-1 min-w-0 pt-2.5 ${!isLast ? "pb-5" : "pb-1"}`}>
                  <button
                    onClick={() => toggle(tool.id)}
                    className="flex items-center justify-between gap-2 w-full text-left
                      rounded-md -mx-1.5 px-1.5 py-0.5 transition-colors group
                      cursor-pointer hover:bg-muted/50"
                  >
                    <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                      <span className="text-sm font-medium text-foreground flex-shrink-0">
                        {tool.name}
                      </span>
                      {tool.status === "running" && (
                        /* Running badge — warning DS palette, pulsing */
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full flex-shrink-0
                            bg-warning/10 text-[10px] font-mono text-warning"
                          style={{ animation: "rmPulse 1.8s ease-in-out infinite" }}
                        >
                          running
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-muted-foreground transition-colors">
                      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                  </button>

                  {/* Expanded: Input + Output JSON panels */}
                  {isOpen && (
                    <div className="mt-1.5 rounded-md border border-border overflow-hidden">
                      <div className="flex items-center px-3 py-1.5 bg-background border-b border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Input</span>
                      </div>
                      <pre className="bg-muted px-3 py-[3px] text-[11px] font-mono
                        text-foreground/75 overflow-x-auto leading-5 whitespace-pre">
                        {JSON.stringify(tool.input, null, 2)}
                      </pre>
                      {tool.output && (
                        <>
                          <div className="flex items-center px-3 py-1.5 bg-background
                            border-t border-b border-border">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Output</span>
                          </div>
                          <pre className="bg-muted px-3 py-[3px] text-[11px] font-mono
                            text-foreground/75 overflow-x-auto leading-5 whitespace-pre">
                            {JSON.stringify(tool.output, null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Rich Message Renderer ────────────────────────────────────── */
export default function RichMessage({ blocks }) {
  if (!blocks || !Array.isArray(blocks)) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "thinking":   return <ThinkingBlock   key={i} {...block} />;
          case "generating": return <GeneratingBlock key={i} />;
          case "text":       return <TextBlock       key={i} {...block} />;
          case "heading":    return <HeadingBlock    key={i} {...block} />;
          case "blockquote": return <BlockquoteBlock key={i} {...block} />;
          case "code":       return <CodeBlock       key={i} {...block} />;
          case "table":      return <TableBlock      key={i} {...block} />;
          case "steps":      return <StepsBlock      key={i} {...block} />;
          case "terminal":   return <TerminalBlock   key={i} {...block} />;
          case "alert":      return <AlertBlock      key={i} {...block} />;
          case "files":      return <FilesBlock          key={i} {...block} />;
          case "timeline":        return <AgentTimelineBlock  key={i} {...block} />;
          case "tool_execution":  return <ToolExecutionBlock  key={i} {...block} />;
          default:                return null;
        }
      })}
    </div>
  );
}
