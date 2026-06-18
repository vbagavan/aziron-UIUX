import { useEffect, useRef, useState } from "react";
import { Bot, RotateCcw, Sparkles } from "lucide-react";
import { SourceAskPromptBox } from "@/components/features/sources/shared/SourceAskPromptBox";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { mockApiReply } from "@/lib/apiDetailModel";

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

export function ApiAskTab({ detail, record, seedPrompt, onSeedPromptApplied, onOpenPlayground }) {
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

      <SourceAskPromptBox
        inputRef={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSend={() => send()}
        placeholder="Ask about this API…"
        loading={loading}
        ariaLabel="Ask about this API"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{KNOWLEDGE_TERMS.askAiSearchingApi}</span>
            {onOpenPlayground ? (
              <button
                type="button"
                onClick={onOpenPlayground}
                className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Open Playground
              </button>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
