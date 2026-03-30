import { useState, useEffect } from "react";
import {
  Copy, Check, Download, Terminal, ChevronDown, ChevronUp, ChevronRight,
  AlertCircle, CheckCircle2, FileText, File, FileSpreadsheet,
  Presentation, Image, Brain, Wrench,
} from "lucide-react";

/* ── Thinking ─────────────────────────────────────────────────── */
export function ThinkingBlock({ duration }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Brain size={14} className="text-[#6366f1]" style={{ animation: "rmPulse 1.5s ease-in-out infinite" }} />
      <span className="text-xs text-[#64748b] dark:text-[#94a3b8] italic">Thinking...</span>
      {duration && <span className="text-[10px] text-[#94a3b8] dark:text-[#64748b]">{duration}</span>}
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
      <span className="text-xs text-[#64748b] dark:text-[#94a3b8] italic">Generating...</span>
      <style>{`@keyframes rmSparkle{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );
}

/* ── Heading ──────────────────────────────────────────────────── */
const H_STYLES = {
  1: "text-xl font-bold   text-[#0f172a] dark:text-[#f1f5f9] mt-4 mb-2",
  2: "text-lg  font-bold   text-[#0f172a] dark:text-[#f1f5f9] mt-3 mb-1.5",
  3: "text-base font-semibold text-[#0f172a] dark:text-[#f1f5f9] mt-2 mb-1",
  4: "text-sm  font-semibold text-[#1e293b] dark:text-[#e2e8f0] mt-2 mb-1",
  5: "text-sm  font-medium  text-[#334155] dark:text-[#cbd5e1] mt-1 mb-0.5",
  6: "text-xs  font-medium  text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider mt-1 mb-0.5",
};
export function HeadingBlock({ level, content }) {
  const Tag = `h${level}`;
  return <Tag className={H_STYLES[level] || H_STYLES[3]}>{content}</Tag>;
}

/* ── Text ─────────────────────────────────────────────────────── */
export function TextBlock({ content }) {
  return <p className="text-sm text-[#0f172a] dark:text-[#f1f5f9] leading-6">{content}</p>;
}

/* ── Blockquote ───────────────────────────────────────────────── */
export function BlockquoteBlock({ content }) {
  return (
    <div className="border-l-4 border-[#6366f1] bg-[#f5f3ff] dark:bg-[#2e1065] rounded-r-[8px] px-4 py-3 my-1">
      <p className="text-sm text-[#374151] dark:text-[#cbd5e1] leading-6 italic">{content}</p>
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
    <div className="my-1 rounded-[10px] overflow-hidden border border-[#334155] dark:border-[#1e293b]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b] dark:bg-[#0f172a]">
        <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
          {language || "code"}
        </span>
        <button onClick={copy}
          className="flex items-center gap-1.5 text-[10px] text-[#94a3b8] hover:text-white transition-colors">
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-[#0f172a] dark:bg-[#0a0f1a] px-4 py-3 text-xs font-mono text-[#e2e8f0] overflow-x-auto leading-5 whitespace-pre">
        {content}
      </pre>
    </div>
  );
}

/* ── Table ────────────────────────────────────────────────────── */
export function TableBlock({ headers, rows }) {
  return (
    <div className="my-1">
      <div className="flex justify-end mb-1.5">
        <button className="flex items-center gap-1 text-[11px] text-[#64748b] dark:text-[#94a3b8] hover:text-[#2563eb] dark:hover:text-[#60a5fa] transition-colors">
          <Download size={11} /> Export
        </button>
      </div>
      <div className="rounded-[10px] border border-[#e2e8f0] dark:border-[#334155] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-left font-semibold text-[#374151] dark:text-[#cbd5e1]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white dark:bg-[#1e293b]" : "bg-[#f8fafc] dark:bg-[#0f172a]"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2.5 text-[#475569] dark:text-[#94a3b8] border-t border-[#f1f5f9] dark:border-[#1e293b]">{cell}</td>
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
  done:    "bg-[#16a34a] text-white",
  active:  "bg-[#2563eb] text-white",
  pending: "bg-[#e2e8f0] dark:bg-[#334155] text-[#94a3b8] dark:text-[#64748b]",
};
export function StepsBlock({ items }) {
  return (
    <div className="my-1 flex flex-col">
      {items.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold z-10 ${STEP_CIRCLE[step.status] || STEP_CIRCLE.pending}`}>
              {step.num}
            </div>
            {i < items.length - 1 && <div className="w-px flex-1 min-h-[16px] bg-[#e2e8f0] dark:bg-[#334155] my-1" />}
          </div>
          <div className={`flex-1 ${i < items.length - 1 ? "pb-4" : "pb-0"}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{step.title}</span>
              {step.timestamp && (
                <span className="text-[10px] text-[#94a3b8] dark:text-[#64748b] flex-shrink-0">{step.timestamp}</span>
              )}
            </div>
            {step.description && (
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5 leading-5">{step.description}</p>
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
    wrap:  "bg-[#fef2f2] dark:bg-[#7f1d1d] border-[#fecaca]",
    icon:  <AlertCircle size={15} className="text-[#ef4444]" />,
    title: "text-[#b91c1c] dark:text-[#fca5a5]",
    desc:  "text-[#dc2626] dark:text-[#fca5a5]",
  },
  success: {
    wrap:  "bg-[#f0fdf4] dark:bg-[#14532d] border-[#bbf7d0]",
    icon:  <CheckCircle2 size={15} className="text-[#16a34a]" />,
    title: "text-[#15803d] dark:text-[#86efac]",
    desc:  "text-[#16a34a] dark:text-[#86efac]",
  },
};
export function AlertBlock({ variant, title, description }) {
  const s = ALERT_STYLES[variant] || ALERT_STYLES.error;
  return (
    <div className={`flex gap-3 px-4 py-3 rounded-[10px] border my-1 ${s.wrap}`}>
      <div className="flex-shrink-0 mt-0.5">{s.icon}</div>
      <div>
        {title && <p className={`text-xs font-semibold ${s.title}`}>{title}</p>}
        {description && <p className={`text-xs mt-0.5 leading-5 ${s.desc}`}>{description}</p>}
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
    <div className="my-1 flex flex-col gap-2">
      {items.map((file, i) => {
        const ext = file.name.split(".").pop().toLowerCase();
        const { Icon, color, bg } = FILE_META[ext] || { Icon: File, color: "text-[#64748b] dark:text-[#94a3b8]", bg: "bg-[#f8fafc] dark:bg-[#1e293b]" };
        return (
          <div key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] hover:border-[#c7d2fe] dark:hover:border-[#4338ca] transition-colors">
            <div className={`size-8 rounded-[6px] flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon size={15} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#0f172a] dark:text-[#f1f5f9] truncate">{file.name}</p>
              <p className="text-[10px] text-[#94a3b8] dark:text-[#64748b]">{file.size}</p>
            </div>
            <button className="flex items-center justify-center size-7 rounded-[6px] text-[#64748b] dark:text-[#94a3b8] hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a8a] transition-colors flex-shrink-0">
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
 */
const DEFAULT_TIMELINE_STEPS = [
  {
    id: 1,
    kind: "comment",
    text: "Sure, let me take a look at the file:",
  },
  {
    id: 2,
    kind: "action",
    action: "Read",
    target: "localizationUtils.ts",
    meta: "Read 256 lines",
    code: null,
  },
  {
    id: 3,
    kind: "action",
    action: "Write",
    target: "src/test/localization.ts",
    meta: null,
    code: [
      { num: 1, text: "import { formatDate, translateKey, getCurrencySymbol } from '../localizationUtils';" },
      { num: 2, text: "" },
      { num: 3, text: "describe('LocalizationUtil', () => {" },
      { num: 4, text: "  describe('formatDate', () => {" },
      { num: 5, text: "    it('should format date correctly', () => {" },
    ],
  },
  {
    id: 4,
    kind: "pondering",
  },
];

/* Dot for each step kind */
function TimelineDot({ kind, isOpen }) {
  if (kind === "pondering") {
    /* Fix 5 — pulsing ring around ✳ to signal live/active state */
    return (
      <span className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
        <span
          className="absolute inset-0 rounded-full bg-[#2563eb] opacity-0"
          style={{ animation: "tlPondRing 1.6s ease-out infinite" }}
        />
        <span
          className="text-[15px] leading-none text-[#2563eb] flex-shrink-0 relative z-10"
          style={{ animation: "tlSpin 2.4s linear infinite", display: "inline-block" }}
        >✳</span>
      </span>
    );
  }
  if (kind === "action") {
    return isOpen
      ? <div className="size-2.5 rounded-full bg-[#2563eb] flex-shrink-0 shadow-[0_0_0_3px_rgba(37,99,235,.15)]" />
      : <div className="size-2 rounded-full bg-[#94a3b8] dark:bg-[#64748b] flex-shrink-0" />;
  }
  /* Fix 8 — comment dot stays gray */
  return <div className="size-2 rounded-full bg-[#cbd5e1] dark:bg-[#475569] flex-shrink-0" />;
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
  const toggleRow = (id) => {
    setRowOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* Fix 9 — snappier stagger: 150 ms first, 300 ms each subsequent */
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (visibleCount >= items.length) return;
    const t = setTimeout(
      () => setVisibleCount(v => v + 1),
      visibleCount === 0 ? 150 : 300,
    );
    return () => clearTimeout(t);
  }, [visibleCount, items.length]);

  return (
    <div className="w-full">
      <style>{`
        @keyframes tlSlideIn   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tlSpin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rmPulse     { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes tlPondRing  { 0%{transform:scale(.6);opacity:.5} 70%{transform:scale(2.2);opacity:0} 100%{opacity:0} }
        @keyframes tlEllipsis  { to { width: 1.1em } }
        .tl-dots { display:inline-block; overflow:hidden; width:0; vertical-align:bottom;
                   animation:tlEllipsis 1.2s steps(3,end) infinite; white-space:nowrap; }
      `}</style>

      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 py-2 px-2 mb-1 rounded-[6px] w-full text-left
          cursor-pointer group hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
      >
        <Brain
          size={16}
          className="text-[#6366f1] flex-shrink-0"
          style={{ animation: "rmPulse 1.5s ease-in-out infinite" }}
        />
        <span className="text-sm font-medium text-[#475569] dark:text-[#94a3b8]">
          Thinking<span className="tl-dots text-[#94a3b8] dark:text-[#64748b]">...</span>
        </span>
        {duration && (
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full
            bg-[#f1f5f9] dark:bg-[#334155]
            text-[10px] font-mono text-[#94a3b8] dark:text-[#64748b] tabular-nums">
            {duration}
          </span>
        )}
        <span className={`${duration ? "" : "ml-auto"} text-[#94a3b8] dark:text-[#64748b] group-hover:text-[#64748b] transition-colors`}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* Timeline rows */}
      {expanded && (
        <div className="relative flex flex-col pl-2">
          {items.slice(0, visibleCount).map((step, i) => {
            const isLast = i === Math.min(visibleCount, items.length) - 1;
            return (
              <div
                key={step.id}
                className="flex gap-3"
                style={{ animation: "tlSlideIn 0.28s ease both" }}
              >
                {/* Fix 2 — left col is position:relative so the line can stretch full height */}
                <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                  <div className="flex items-center justify-center mt-3" style={{ height: 20, zIndex: 1, position: "relative" }}>
                    <TimelineDot kind={step.kind} isOpen={rowOpenIds.has(step.id)} />
                  </div>
                  {/* Fix 2 — line is absolute so it spans full row height regardless of content */}
                  {!isLast && (
                    <div
                      className="absolute bg-[#e2e8f0] dark:bg-[#334155]"
                      style={{ width: 1, top: 32, bottom: -8, left: "50%", transform: "translateX(-50%)" }}
                    />
                  )}
                </div>

                {/* Right column: content */}
                <div className={`flex-1 min-w-0 pt-2.5 ${!isLast ? "pb-5" : "pb-1"}`}>

                  {/* Fix 8 — comment: xs + italic + lighter color */}
                  {step.kind === "comment" && (
                    <p className="text-xs text-[#94a3b8] dark:text-[#64748b] leading-5 italic">{step.text}</p>
                  )}

                  {/* action */}
                  {step.kind === "action" && (() => {
                    const hasContent = !!(step.meta || (step.code && step.code.length));
                    const rowOpen = rowOpenIds.has(step.id);
                    return (
                      <div>
                        {/* Fix 1 + 4 — cursor-pointer + hover bg on row */}
                        <button
                          onClick={() => hasContent && toggleRow(step.id)}
                          className={`flex items-center justify-between gap-2 w-full text-left
                            rounded-[5px] -mx-1.5 px-1.5 py-0.5 transition-colors group
                            ${hasContent
                              ? "cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]"
                              : "cursor-default"}`}
                        >
                          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                            <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] flex-shrink-0">
                              {step.action}
                            </span>
                            <span className="text-xs text-[#64748b] dark:text-[#94a3b8] font-mono truncate">
                              {step.target}
                            </span>
                          </div>
                          {/* Fix 3 — chevron always visible at #94a3b8 */}
                          {hasContent && (
                            <span className="flex-shrink-0 text-[#94a3b8] dark:text-[#64748b]
                              group-hover:text-[#64748b] transition-colors">
                              {rowOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </span>
                          )}
                        </button>

                        {/* expandable content */}
                        {hasContent && rowOpen && (
                          <div className="mt-1.5">
                            {/* Fix 6 — meta as inline pill badge */}
                            {step.meta && (
                              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5
                                rounded-full bg-[#f1f5f9] dark:bg-[#334155]
                                text-[10px] font-mono text-[#64748b] dark:text-[#94a3b8]">
                                <span className="text-[#94a3b8]">L</span>
                                {step.meta}
                              </span>
                            )}
                            {/* Fix 7 — code block bg #f1f5f9 (more distinct from white) */}
                            {step.code && step.code.length > 0 && (
                              <div className="mt-2 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] overflow-hidden">
                                {step.code.map(line => (
                                  <div
                                    key={line.num}
                                    className="flex gap-4 px-3 py-[3px] bg-[#f1f5f9] dark:bg-[#0f172a]
                                      hover:bg-[#e8edf5] dark:hover:bg-[#1e293b] transition-colors"
                                  >
                                    <span className="text-[11px] font-mono text-[#cbd5e1] dark:text-[#475569]
                                      w-4 text-right flex-shrink-0 select-none">
                                      {line.num}
                                    </span>
                                    <span className="text-[11px] font-mono text-[#374151] dark:text-[#94a3b8]
                                      whitespace-pre truncate">
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

                  {/* Fix 5 — Pondering: italic + muted blue */}
                  {step.kind === "pondering" && (
                    <span className="text-xs text-[#2563eb] dark:text-[#60a5fa] italic font-medium">
                      Pondering...
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
    id: 1,
    name: "search_knowledge_base",
    status: "done",
    input: { query: "customer support email templates", limit: 5 },
    output: { count: 5, results: ["Template A — Welcome", "Template B — Follow-up", "Template C — Escalation"] },
  },
  {
    id: 2,
    name: "send_email",
    status: "done",
    input: { to: "customer@example.com", subject: "Support Request #4821", body: "Dear Customer, thank you for reaching out..." },
    output: { message_id: "msg_abc123", status: "sent", timestamp: "2026-03-29T10:41:00Z" },
  },
  {
    id: 3,
    name: "create_whatsapp_message",
    status: "running",
    input: { phone: "+1234567890", message: "Hi! Following up on your support request #4821. How can we help?" },
    output: null,
  },
];

const TOOL_STATUS = {
  done:    { dot: "bg-[#2563eb]",  pulse: false },
  running: { dot: "bg-[#f59e0b]",  pulse: true  },
  error:   { dot: "bg-[#ef4444]",  pulse: false },
};

export function ToolExecutionBlock({ tools }) {
  const items = tools || DEFAULT_TOOLS;
  const [expanded, setExpanded]   = useState(true);
  const [openIds,  setOpenIds]    = useState(() => new Set());

  /* Stagger entrance — identical cadence to AgentTimelineBlock */
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (visibleCount >= items.length) return;
    const t = setTimeout(
      () => setVisibleCount(v => v + 1),
      visibleCount === 0 ? 150 : 300,
    );
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
      {/* Shared keyframes — same set as AgentTimelineBlock */}
      <style>{`
        @keyframes tlSlideIn   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tlSpin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rmPulse     { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes tlPondRing  { 0%{transform:scale(.6);opacity:.5} 70%{transform:scale(2.2);opacity:0} 100%{opacity:0} }
        @keyframes tlEllipsis  { to { width: 1.1em } }
        .tl-dots { display:inline-block; overflow:hidden; width:0; vertical-align:bottom;
                   animation:tlEllipsis 1.2s steps(3,end) infinite; white-space:nowrap; }
      `}</style>

      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 py-2 px-2 mb-1 rounded-[6px] w-full text-left
          cursor-pointer group hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
      >
        <Wrench
          size={16}
          className="text-[#f59e0b] flex-shrink-0"
          style={{ animation: "rmPulse 1.8s ease-in-out infinite" }}
        />
        <span className="text-sm font-medium text-[#475569] dark:text-[#94a3b8]">
          Tool Execution<span className="tl-dots text-[#94a3b8] dark:text-[#64748b]">...</span>
        </span>
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full
          bg-[#fef3c7] dark:bg-[#451a03]
          text-[10px] font-mono text-[#92400e] dark:text-[#fbbf24] tabular-nums">
          {doneCount}/{items.length}
        </span>
        <span className="text-[#94a3b8] dark:text-[#64748b] group-hover:text-[#64748b] transition-colors">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* ── Tool rows — mirrored layout of AgentTimelineBlock ── */}
      {expanded && (
        <div className="relative flex flex-col pl-2">
          {items.slice(0, visibleCount).map((tool, i) => {
            const isOpen = openIds.has(tool.id);
            const isLast = i === Math.min(visibleCount, items.length) - 1;
            const st     = TOOL_STATUS[tool.status] || TOOL_STATUS.done;
            return (
              <div
                key={tool.id}
                className="flex gap-3"
                style={{ animation: "tlSlideIn 0.28s ease both" }}
              >

                {/* ── Left: dot + absolute connector line ── */}
                <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                  <div className="flex items-center justify-center mt-3"
                    style={{ height: 20, position: "relative", zIndex: 1 }}>
                    {tool.status === "running" ? (
                      /* Running: animated ring — same treatment as pondering in timeline */
                      <span className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
                        <span
                          className="absolute inset-0 rounded-full bg-[#f59e0b] opacity-0"
                          style={{ animation: "tlPondRing 1.6s ease-out infinite" }}
                        />
                        <span
                          className="size-2.5 rounded-full bg-[#f59e0b] relative z-10"
                          style={{ animation: "rmPulse 1.4s ease-in-out infinite" }}
                        />
                      </span>
                    ) : (
                      /* Done / error: mirrors action-dot in AgentTimelineBlock —
                         blue+ring when open, gray when closed */
                      isOpen
                        ? <div className="size-2.5 rounded-full flex-shrink-0 bg-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,.15)]" />
                        : <div className="size-2 rounded-full flex-shrink-0 bg-[#94a3b8] dark:bg-[#64748b]" />
                    )}
                  </div>
                  {!isLast && (
                    <div className="absolute bg-[#e2e8f0] dark:bg-[#334155]"
                      style={{ width: 1, top: 32, bottom: -8, left: "50%", transform: "translateX(-50%)" }}
                    />
                  )}
                </div>

                {/* ── Right: content ── */}
                <div className={`flex-1 min-w-0 pt-2.5 ${!isLast ? "pb-5" : "pb-1"}`}>

                  {/* Row button — identical pattern to action rows in timeline */}
                  <button
                    onClick={() => toggle(tool.id)}
                    className="flex items-center justify-between gap-2 w-full text-left
                      rounded-[5px] -mx-1.5 px-1.5 py-0.5 transition-colors group
                      cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]"
                  >
                    <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                      <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] flex-shrink-0">
                        {tool.name}
                      </span>
                      {tool.status === "running" && (
                        /* Running pill badge — mirrors duration pill in timeline header */
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full flex-shrink-0
                            bg-[#fef3c7] dark:bg-[#451a03]
                            text-[10px] font-mono text-[#92400e] dark:text-[#fbbf24]"
                          style={{ animation: "rmPulse 1.8s ease-in-out infinite" }}
                        >
                          running
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-[#94a3b8] dark:text-[#64748b]
                      group-hover:text-[#64748b] transition-colors">
                      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                  </button>

                  {/* Expanded: Input + Output JSON — same tightened padding as code lines in timeline */}
                  {isOpen && (
                    <div className="mt-1.5 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] overflow-hidden">
                      <div className="flex items-center px-3 py-1.5 bg-[#f8fafc] dark:bg-[#1e293b]
                        border-b border-[#e2e8f0] dark:border-[#334155]">
                        <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Input</span>
                      </div>
                      <pre className="bg-[#f1f5f9] dark:bg-[#0f172a] px-3 py-[3px] text-[11px] font-mono
                        text-[#374151] dark:text-[#94a3b8] overflow-x-auto leading-5 whitespace-pre">
                        {JSON.stringify(tool.input, null, 2)}
                      </pre>
                      {tool.output && (
                        <>
                          <div className="flex items-center px-3 py-1.5 bg-[#f8fafc] dark:bg-[#1e293b]
                            border-t border-b border-[#e2e8f0] dark:border-[#334155]">
                            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Output</span>
                          </div>
                          <pre className="bg-[#f1f5f9] dark:bg-[#0f172a] px-3 py-[3px] text-[11px] font-mono
                            text-[#374151] dark:text-[#94a3b8] overflow-x-auto leading-5 whitespace-pre">
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
