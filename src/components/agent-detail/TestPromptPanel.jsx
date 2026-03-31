import { useState } from "react";
import { GitCompareArrows, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function TestPromptPanel({ agentName }) {
  const [prompt, setPrompt] = useState("Summarize the latest system status and mention any anomalies.");
  const [result, setResult] = useState({
    response: `Aziron reports ${agentName} as healthy overall, with one recent failure that appears isolated to a webhook timeout.`,
    tokens: 1240,
    latency: 1.8,
  });

  const runPrompt = () => {
    const nextLatency = Number((1.4 + (prompt.length % 13) * 0.08).toFixed(1));
    const nextTokens = 900 + prompt.length * 4;
    setResult({
      response: `Preview for "${prompt.slice(0, 48)}${prompt.length > 48 ? "..." : ""}": the agent would respond with a concise summary, next step recommendation, and diagnostics note.`,
      tokens: nextTokens,
      latency: nextLatency,
    });
  };

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-[#334155] dark:bg-[#111827]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#94a3b8] dark:text-[#64748b]">Test Playground</h3>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">Run a quick prompt to validate response quality and runtime characteristics.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8] dark:bg-[#0f172a] dark:text-[#93c5fd]">
          <GitCompareArrows size={14} />
          Compare-ready
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-3">
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[136px] leading-6" />
          <Button className="gap-1.5 bg-[#2563eb] text-white hover:bg-[#1d4ed8]" onClick={runPrompt}>
            <Play size={14} />
            Run test prompt
          </Button>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 dark:border-[#334155] dark:bg-[#0f172a]">
          <div className="flex items-center gap-2 text-sm font-medium text-[#0f172a] dark:text-[#f8fafc]">
            <Sparkles size={15} className="text-[#2563eb]" />
            Response Preview
          </div>
          <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-[#cbd5e1]">{result.response}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Tokens used" value={result.tokens.toLocaleString()} />
            <Metric label="Latency" value={`${result.latency}s`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-3 dark:border-[#334155] dark:bg-[#111827]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] dark:text-[#64748b]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">{value}</p>
    </div>
  );
}
