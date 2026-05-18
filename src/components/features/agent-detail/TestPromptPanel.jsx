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
    <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-border dark:bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">Test Playground</h3>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">Run a quick prompt to validate response quality and runtime characteristics.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary dark:bg-background dark:text-primary">
          <GitCompareArrows size={14} />
          Compare-ready
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-3">
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[136px] leading-6" />
          <Button className="gap-1.5 bg-primary text-white hover:bg-primary" onClick={runPrompt}>
            <Play size={14} />
            Run test prompt
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-muted px-4 py-4 dark:border-border dark:bg-background">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-foreground">
            <Sparkles size={15} className="text-primary" />
            Response Preview
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-muted-foreground">{result.response}</p>

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
    <div className="rounded-xl border border-border bg-card px-3 py-3 dark:border-border dark:bg-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground dark:text-foreground">{value}</p>
    </div>
  );
}
