import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Database,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkedKnowledgeHubSection } from "@/components/features/knowledge/LinkedKnowledgeHubSection";
import { SourceBadge } from "@/components/features/knowledge/SourceBadge";
import { getSourceLifecycleMeta } from "@/lib/sourceCategories";
import { mockDatabaseReply } from "@/lib/databaseDetailModel";
import { CAPTION, SECTION_EYEBROW } from "@/lib/typography";
import { cn } from "@/lib/utils";

const PANEL_TABS = [
  { id: "ask", label: "Ask AI" },
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

function DatabaseAskTab({ detail, record, seedPrompt, onSeedPromptApplied, onOpenQueryStudio }) {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      role: "ai",
      text: `You're exploring **${detail.title}** (\`${detail.focusedTable}\`). Ask about schema, metrics, or business concepts.`,
    },
  ]);

  const suggested = detail.knowledge.suggestedQuestions;

  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: `You're exploring **${detail.title}** (\`${detail.focusedTable}\`). Ask about schema, metrics, or business concepts.`,
      },
    ]);
    setInput("");
  }, [detail.id, detail.title, detail.focusedTable]);

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
      setMessages((prev) => [...prev, { role: "ai", text: mockDatabaseReply(q, detail) }]);
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
          <p className="truncate text-xs font-semibold text-foreground">Database assistant</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {detail.provider} · {detail.focusedTable}
          </p>
        </div>
        <button
          type="button"
          title="Clear conversation"
          aria-label="Clear conversation"
          onClick={() =>
            setMessages([
              {
                role: "ai",
                text: "Conversation cleared. Ask a new question about this database.",
              },
            ])
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
              placeholder="Ask about this database…"
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
          {onOpenQueryStudio ? (
            <button
              type="button"
              onClick={onOpenQueryStudio}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border/60 px-3 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <ChevronDown className="size-3 rotate-[-90deg]" aria-hidden />
              Open Query Studio
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DatabaseDetailsTab({
  detail,
  record,
  hubLinks = [],
  hubs = [],
  canEdit = true,
  canCreate = true,
  onNavigateToHub,
  onLinkToHub,
  onUnlinkFromHub,
  onCreateHub,
}) {
  const lifecycle = getSourceLifecycleMeta(record);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Database details
        </p>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Connection</dt>
            <dd className="font-medium text-foreground">{detail.connectionName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Provider</dt>
            <dd className="font-medium text-foreground">{detail.provider}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Environment</dt>
            <dd className="font-medium text-foreground">{detail.environment}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Focused table</dt>
            <dd className="font-mono text-[11px]">{detail.focusedTable}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">{lifecycle.label}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Last sync</dt>
            <dd className="font-medium text-foreground">{detail.lastSyncRelative}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Health</dt>
            <dd className="font-medium text-foreground">{detail.health}</dd>
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

      <LinkedKnowledgeHubSection
        record={record}
        hubLinks={hubLinks}
        hubs={hubs}
        canEdit={canEdit}
        canCreate={canCreate}
        hubIcon={Database}
        emptyMessage="Not linked to a Knowledge Hub yet. Add it to a hub when you want agents to query this database for retrieval."
        onNavigateToHub={onNavigateToHub}
        onLinkToHub={onLinkToHub}
        onUnlinkFromHub={onUnlinkFromHub}
        onCreateHub={onCreateHub}
      />
    </div>
  );
}

export function DatabaseRightPanel({
  detail,
  record,
  hubLinks = [],
  hubs = [],
  canEdit = true,
  canCreate = true,
  tab,
  onTabChange,
  seedPrompt,
  onSeedPromptApplied,
  onNavigateToHub,
  onLinkToHub,
  onUnlinkFromHub,
  onCreateHub,
  onOpenQueryStudio,
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
        <DatabaseAskTab
          detail={detail}
          record={record}
          seedPrompt={seedPrompt}
          onSeedPromptApplied={onSeedPromptApplied}
          onOpenQueryStudio={onOpenQueryStudio}
        />
      ) : (
        <DatabaseDetailsTab
          detail={detail}
          record={record}
          hubLinks={hubLinks}
          hubs={hubs}
          canEdit={canEdit}
          canCreate={canCreate}
          onNavigateToHub={onNavigateToHub}
          onLinkToHub={onLinkToHub}
          onUnlinkFromHub={onUnlinkFromHub}
          onCreateHub={onCreateHub}
        />
      )}
    </div>
  );
}

export { PANEL_TABS as DATABASE_PANEL_TABS };
