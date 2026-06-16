import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ExternalLink,
  GitBranch,
  RotateCcw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/features/knowledge/SourceBadge";
import { getSourceLifecycleMeta } from "@/lib/sourceCategories";
import { mockApiReply } from "@/lib/apiDetailModel";
import { CAPTION, SECTION_EYEBROW } from "@/lib/typography";
import { cn } from "@/lib/utils";

const PANEL_TABS = [
  { id: "ask", label: "Ask AI" },
  { id: "insights", label: "Insights" },
  { id: "details", label: "Details" },
];

function ChatMessage({ message }) {
  const plainText = message.text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");

  if (message.role === "user") {
    return (
      <div className="flex w-full shrink-0 justify-end">
        <div className="max-w-[85%] rounded-[12px] rounded-tr-[4px] border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="whitespace-pre-line text-sm leading-5 text-foreground">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full shrink-0 flex-col items-start">
      <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border bg-card px-4 py-3">
        <p className="whitespace-pre-line text-sm leading-6 text-foreground">{plainText}</p>
      </div>
    </div>
  );
}

function ApiAskTab({ detail, record, seedPrompt, onSeedPromptApplied, onOpenPlayground }) {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      role: "ai",
      text: `You're exploring **${detail.title}** (${detail.version}). Ask about endpoints, auth, rate limits, or use cases.`,
    },
  ]);

  const suggested = detail.knowledge.suggestedQuestions;

  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: `You're exploring **${detail.title}** (${detail.version}). Ask about endpoints, auth, rate limits, or use cases.`,
      },
    ]);
    setInput("");
  }, [detail.id, detail.title, detail.version]);

  useEffect(() => {
    if (!seedPrompt?.trim()) return;
    setInput(seedPrompt);
    onSeedPromptApplied?.();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [seedPrompt, onSeedPromptApplied]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: mockApiReply(q, detail) }]);
      setLoading(false);
    }, 700);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-4 py-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-border bg-muted">
          <Bot className="size-3.5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">API assistant</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {detail.authentication} · {detail.version}
          </p>
        </div>
        <button
          type="button"
          title="Clear conversation"
          aria-label="Clear conversation"
          onClick={() =>
            setMessages([{ role: "ai", text: "Conversation cleared. Ask a new question about this API." }])
          }
          className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="flex-1" />
        {messages.map((msg, i) => (
          <ChatMessage key={`${detail.id}-msg-${i}`} message={msg} />
        ))}
        {loading ? (
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex gap-1 rounded-[12px] rounded-tl-[4px] border border-border bg-card px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 px-4 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {suggested.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => send(q)}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] text-foreground/70 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
            >
              <Sparkles className="size-2.5 shrink-0 text-primary/60" aria-hidden />
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_4px_24px_0_rgba(37,99,235,0.10)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about this API…"
              className="flex-1 bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={!input.trim() || loading}
              onClick={() => send()}
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </div>
          {onOpenPlayground ? (
            <button
              type="button"
              onClick={onOpenPlayground}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border/60 px-3 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <ChevronDown className="size-3 rotate-[-90deg]" aria-hidden />
              Open Playground
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ApiInsightsTab({ detail, onAskQuestion, onOpenPlayground, onSelectEndpoint }) {
  const primaryEndpoint = detail.endpoints[0];

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">Purpose</p>
        <p className={cn(CAPTION, "mt-1 leading-relaxed")}>{detail.knowledge.purpose}</p>
      </div>

      <section>
        <p className={SECTION_EYEBROW}>Business functions</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {detail.knowledge.businessFunctions.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px]">
              {f}
            </Badge>
          ))}
        </div>
      </section>

      <section>
        <p className={SECTION_EYEBROW}>Suggested use cases</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {detail.knowledge.suggestedUseCases.map((u) => (
            <Badge key={u} variant="outline" className="text-[10px]">
              {u}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className={SECTION_EYEBROW}>Quick actions</p>
        {detail.knowledge.suggestedQuestions.slice(0, 3).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onAskQuestion?.(q)}
            className="flex w-full items-start gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-xs transition-colors hover:border-primary/30 hover:bg-muted/30"
          >
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>{q}</span>
          </button>
        ))}
      </section>

      {primaryEndpoint ? (
        <section className="rounded-lg border border-border bg-muted/20 p-3">
          <p className={SECTION_EYEBROW}>Primary endpoint</p>
          <button
            type="button"
            onClick={() => onSelectEndpoint?.(primaryEndpoint.id)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-left font-mono text-[11px] transition-colors hover:border-primary/30"
          >
            <span className="font-semibold text-emerald-600">{primaryEndpoint.method}</span>{" "}
            {primaryEndpoint.path}
          </button>
          {onOpenPlayground ? (
            <Button type="button" size="sm" variant="outline" className="mt-3 h-7 w-full text-xs" onClick={onOpenPlayground}>
              Try in Playground
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ApiDetailsTab({ detail, record, hubLinks = [], onNavigateToHub }) {
  const lifecycle = getSourceLifecycleMeta(record);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          API details
        </p>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Connection</dt>
            <dd className="font-medium text-foreground">{detail.connectionName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-medium text-foreground">{detail.version}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Authentication</dt>
            <dd className="font-medium text-foreground">{detail.authentication}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">{detail.status}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Latency</dt>
            <dd className="font-medium text-foreground">{detail.latencyMs}ms</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Availability</dt>
            <dd className="font-medium text-foreground">{detail.availability}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Last sync</dt>
            <dd className="font-medium text-foreground">{detail.lastSyncRelative}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Lifecycle</dt>
            <dd className="font-medium text-foreground">{lifecycle.label}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Source</dt>
            <dd>
              <SourceBadge record={record} size="sm" />
            </dd>
          </div>
        </dl>
      </div>

      <div className="mx-4 h-px bg-border" />

      <div className="px-4 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Linked Knowledge Hubs
        </p>
        {hubLinks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            Not linked to a Knowledge Hub yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hubLinks.map((link) => (
              <li
                key={`${link.hubId}-${link.hubFileId}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
              >
                <Zap className="size-3.5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{link.hubName}</p>
                  <p className="text-[10px] text-muted-foreground">Knowledge Hub</p>
                </div>
                {onNavigateToHub ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Open hub"
                    onClick={() => onNavigateToHub(link.hubId)}
                  >
                    <ExternalLink className="size-3.5" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mx-4 h-px bg-border" />

      <div className="px-4 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Downstream usage
        </p>
        <div className="space-y-3 text-xs">
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-muted-foreground">
              <GitBranch className="size-3" aria-hidden />
              Agents
            </p>
            <div className="flex flex-wrap gap-1">
              {detail.usage.agents.map((a) => (
                <Badge key={a} variant="outline" className="text-[10px]">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-muted-foreground">Flows</p>
            <div className="flex flex-wrap gap-1">
              {detail.usage.flows.map((f) => (
                <Badge key={f} variant="secondary" className="text-[10px]">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApiRightPanel({
  detail,
  record,
  hubLinks = [],
  tab,
  onTabChange,
  seedPrompt,
  onSeedPromptApplied,
  onNavigateToHub,
  onOpenPlayground,
  onAskQuestion,
  onSelectEndpoint,
}) {
  const [internalTab, setInternalTab] = useState("ask");
  const activeTab = tab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2.5">
        {PANEL_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "ask" ? (
        <ApiAskTab
          detail={detail}
          record={record}
          seedPrompt={seedPrompt}
          onSeedPromptApplied={onSeedPromptApplied}
          onOpenPlayground={onOpenPlayground}
        />
      ) : activeTab === "insights" ? (
        <ApiInsightsTab
          detail={detail}
          onAskQuestion={onAskQuestion}
          onOpenPlayground={onOpenPlayground}
          onSelectEndpoint={onSelectEndpoint}
        />
      ) : (
        <ApiDetailsTab
          detail={detail}
          record={record}
          hubLinks={hubLinks}
          onNavigateToHub={onNavigateToHub}
        />
      )}
    </div>
  );
}

export { PANEL_TABS as API_PANEL_TABS };
