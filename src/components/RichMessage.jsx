import { useState } from "react";
import {
  Copy, Check, Download, Terminal, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, FileText, File, FileSpreadsheet,
  Presentation, Image,
} from "lucide-react";

/* ── Thinking ─────────────────────────────────────────────────── */
export function ThinkingBlock({ duration }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="size-1.5 rounded-full bg-[#6366f1]"
            style={{ animation: `rmPulse 1.5s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
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
          case "files":      return <FilesBlock      key={i} {...block} />;
          default:           return null;
        }
      })}
    </div>
  );
}
