import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  Copy,
  Download,
  Pencil,
  RotateCcw,
  Send,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HubNotesPanel } from "@/components/features/knowledge/HubNotesPanel";
import { mockDocumentCentricReply } from "@/components/features/knowledge/hubSourceGuide";
import {
  generateHubStudioContent,
  HUB_STUDIO_TOOLS,
  mockHubAssistantReply,
} from "@/lib/hubAssistantModel";
import { CAPTION, SECTION_EYEBROW } from "@/lib/typography";
import { cn } from "@/lib/utils";

export const HUB_ASSISTANT_PANEL_TABS = [
  { id: "ask", label: "Ask AI" },
  { id: "studio", label: "Studio" },
  { id: "notes", label: "Notes" },
];

export function loadHubNotes(hubId) {
  try {
    const raw = localStorage.getItem(`hub-notes-${hubId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function ChatAssistantMessage({ message, onCitationClick, onSaveAsNote }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex w-full shrink-0 flex-col items-start">
      <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border bg-card px-4 py-3">
        <p className="whitespace-pre-line text-sm leading-6 text-foreground">
          {message.content.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1")}
        </p>
        {message.citations?.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border pt-2">
            <span className="text-[10px] text-muted-foreground">Sources:</span>
            {message.citations.map((cite) => (
              <button
                key={cite.fileId}
                type="button"
                className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
                title={cite.name}
                onClick={() => onCitationClick?.(cite.fileId)}
              >
                [{cite.index}] {cite.name.length > 18 ? `${cite.name.slice(0, 16)}…` : cite.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-1 flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Copy"
          title="Copy"
          onClick={handleCopy}
          className="flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-muted-foreground transition-colors hover:bg-muted"
        >
          {copied ? <span className="text-[10px] font-medium text-primary">Copied</span> : <Copy size={14} />}
        </button>
        <button
          type="button"
          aria-label="Good response"
          onClick={() => toast.success("Thanks — feedback noted")}
          className="flex h-7 min-w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ThumbsUp size={14} />
        </button>
        <button
          type="button"
          aria-label="Bad response"
          onClick={() => toast("Thanks — we'll use this to improve")}
          className="flex h-7 min-w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ThumbsDown size={14} />
        </button>
        <button
          type="button"
          onClick={() => onSaveAsNote?.(message)}
          title="Save as note"
          aria-label="Save as note"
          className="flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil size={11} />
          Save as note
        </button>
      </div>
    </div>
  );
}

function HubAskTab({
  hubName,
  allFiles,
  focusFile,
  onClearFocus,
  onCitationClick,
  onSaveAsNote,
}) {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `Hi — I'm your hub assistant. Ask questions about the ${allFiles.length} source${allFiles.length === 1 ? "" : "s"} in "${hubName}".`,
      citations: [],
    },
  ]);

  const sourceCount = allFiles.length;
  const canSend = input.trim().length > 0 && !loading && sourceCount > 0;

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hi — I'm your hub assistant. Ask questions about the ${allFiles.length} source${allFiles.length === 1 ? "" : "s"} in "${hubName}".`,
        citations: [],
      },
    ]);
    setInput("");
  }, [hubName, allFiles.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send() {
    const text = input.trim();
    if (!text || loading || sourceCount === 0) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text, citations: [] }]);
    setInput("");
    setLoading(true);

    window.setTimeout(() => {
      const scopedFiles = focusFile ? [focusFile] : allFiles;
      const reply =
        focusFile?.sourceGuide?.status === "ready"
          ? mockDocumentCentricReply(text, focusFile, focusFile.sourceGuide)
          : mockHubAssistantReply(text, hubName, scopedFiles);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: reply.content, citations: reply.citations },
      ]);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-4 py-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-border bg-muted">
          <Bot className="size-3.5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">Hub assistant</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {focusFile
              ? `Focused: ${focusFile.metadata?.title ?? focusFile.name}`
              : `${sourceCount} source${sourceCount === 1 ? "" : "s"} in this hub`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {focusFile ? (
            <button
              type="button"
              title="Search all hub sources"
              aria-label="Search all hub sources"
              onClick={onClearFocus}
              className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            title="Clear conversation"
            aria-label="Clear conversation"
            onClick={() =>
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: "Conversation cleared. Ask a new question about this hub.",
                  citations: [],
                },
              ])
            }
            className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {sourceCount === 0 ? (
        <div className="mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
          Add at least one source to ask questions.
        </div>
      ) : null}

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Assistant conversation"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        <div className="flex-1" />
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex w-full shrink-0 justify-end">
              <div className="max-w-[85%] rounded-[12px] rounded-tr-[4px] border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="whitespace-pre-line text-sm leading-5 text-foreground">{msg.content}</p>
              </div>
            </div>
          ) : (
            <ChatAssistantMessage
              key={msg.id}
              message={msg}
              onCitationClick={onCitationClick}
              onSaveAsNote={onSaveAsNote}
            />
          ),
        )}
        {loading ? (
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex gap-1 rounded-[12px] border border-border bg-card px-4 py-3">
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

      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_4px_24px_0_rgba(37,99,235,0.10)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <textarea
              ref={inputRef}
              rows={1}
              aria-label="Ask about this hub"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={sourceCount === 0 ? "Add sources to enable chat…" : "Ask about this hub…"}
              disabled={sourceCount === 0}
              className="flex-1 resize-none bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                canSend
                  ? "border-border bg-primary text-primary-foreground hover:bg-primary"
                  : "cursor-not-allowed border-border bg-card text-foreground opacity-40",
              )}
            >
              <Send size={14} />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              Scope: {focusFile ? "Focused source" : "All hub sources"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Chat isn't saved · use the Knowledge tab to save &amp; share
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HubStudioTab({ hubName, allFiles, onSaveAsNote }) {
  const [activeTool, setActiveTool] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveTool(null);
    setCustomPrompt("");
    setOutput(null);
    setGenerating(false);
  }, [hubName]);

  function handleGenerate() {
    if (!activeTool) return;
    setGenerating(true);
    setOutput(null);
    window.setTimeout(() => {
      const content = generateHubStudioContent(
        activeTool.id,
        hubName,
        allFiles.length ? allFiles : [{ name: "hub sources" }],
        customPrompt,
      );
      setOutput({
        toolId: activeTool.id,
        title: `${hubName} — ${activeTool.label}`,
        content,
      });
      setGenerating(false);
    }, 900);
  }

  function handleCopy() {
    navigator.clipboard.writeText(output?.content ?? "").catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([output?.content ?? ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output?.title?.replace(/[^\w\s-]/g, "") ?? "studio"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <p className="mb-2.5 text-center text-[10px] text-muted-foreground">
          Generate from all sources in this hub
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {HUB_STUDIO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool?.id === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool);
                  setOutput(null);
                }}
                disabled={generating}
                className={cn(
                  "relative flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition-all",
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted/40",
                  generating && "cursor-not-allowed opacity-50",
                )}
              >
                <span className={cn("flex size-7 items-center justify-center rounded-lg", tool.className)}>
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-foreground">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activeTool && !generating && !output ? (
          <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg", activeTool.className)}>
                <activeTool.icon className="size-3" />
              </span>
              <p className="text-xs font-semibold text-foreground">Generate {activeTool.label}</p>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: focus on specific aspects…"
              className="mb-2.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <activeTool.icon className="size-3.5" />
              Generate {activeTool.label}
            </button>
          </div>
        ) : null}

        {generating ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Generating {activeTool?.label}…</p>
          </div>
        ) : null}

        {output && !generating ? (
          <div className="rounded-xl border border-border bg-muted/10">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <p className="flex-1 truncate text-xs font-semibold text-foreground">{output.title}</p>
              <button type="button" title={copied ? "Copied!" : "Copy"} onClick={handleCopy} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                {copied ? <span className="text-[10px] text-primary">✓</span> : <Copy className="size-3" />}
              </button>
              <button type="button" title="Download" onClick={handleDownload} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                <Download className="size-3" />
              </button>
              <button type="button" title="Regenerate" onClick={handleGenerate} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                <RotateCcw className="size-3" />
              </button>
            </div>
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-[11px] leading-relaxed text-foreground/85">
              {output.content}
            </pre>
            <div className="border-t border-border px-3 py-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 w-full text-xs"
                onClick={() => onSaveAsNote?.({ content: output.content, title: output.title })}
              >
                <Pencil className="size-3" data-icon="inline-start" aria-hidden />
                Save as note
              </Button>
            </div>
          </div>
        ) : null}

        {!activeTool && !generating && !output ? (
          <p className="pt-2 text-center text-[11px] text-muted-foreground/60">
            Pick a tool above to generate content from this hub.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function HubDetailsTab({ hubName, hubDescription, metadata, summary, linkedAgents, linkedWorkflows, onEditHub, canEdit }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Hub details
      </p>
      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="text-right font-medium text-foreground">{hubName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium capitalize text-foreground">{metadata?.status ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="font-medium text-foreground">{metadata?.owner?.name ?? "Unknown"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Sources</dt>
          <dd className="font-medium tabular-nums text-foreground">{summary?.documents ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="font-medium text-foreground">{metadata?.updatedAtRelative ?? "—"}</dd>
        </div>
      </dl>

      {hubDescription ? (
        <section className="mt-4">
          <p className={SECTION_EYEBROW}>Description</p>
          <p className={cn(CAPTION, "mt-1.5 leading-relaxed")}>{hubDescription}</p>
        </section>
      ) : null}

      {metadata?.tags?.length > 0 ? (
        <section className="mt-4">
          <p className={SECTION_EYEBROW}>Tags</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {metadata.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mx-0 my-4 h-px bg-border" />

      <section>
        <p className={SECTION_EYEBROW}>Linked agents</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {linkedAgents?.length ? (
            linkedAgents.map((agent) => (
              <Badge key={agent.id} variant="outline" className="text-[10px]">
                {agent.name}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No agents linked yet.</p>
          )}
        </div>
      </section>

      <section className="mt-4">
        <p className={SECTION_EYEBROW}>Linked workflows</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {linkedWorkflows?.length ? (
            linkedWorkflows.map((flow) => (
              <Badge key={flow.id} variant="secondary" className="text-[10px]">
                {flow.name}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No workflows linked yet.</p>
          )}
        </div>
      </section>

      {canEdit && onEditHub ? (
        <Button type="button" size="sm" variant="outline" className="mt-4 w-full" onClick={onEditHub}>
          <Pencil className="size-3.5" data-icon="inline-start" aria-hidden />
          Edit hub settings
        </Button>
      ) : null}
    </div>
  );
}

export function HubAssistantPanel({
  hubId,
  hubName,
  hubDescription,
  allFiles = [],
  metadata,
  summary,
  linkedAgents = [],
  linkedWorkflows = [],
  canEdit = true,
  tab,
  onTabChange,
  onOpenSource,
  onEditHub,
}) {
  const [internalTab, setInternalTab] = useState("ask");
  const [focusFileId, setFocusFileId] = useState(null);
  const [notes, setNotes] = useState(() => loadHubNotes(hubId));
  const [pendingQuote, setPendingQuote] = useState(null);

  const activeTab = tab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  const focusFile = useMemo(
    () => (focusFileId ? allFiles.find((f) => f.id === focusFileId) ?? null : null),
    [allFiles, focusFileId],
  );

  useEffect(() => {
    setNotes(loadHubNotes(hubId));
    setFocusFileId(null);
    setPendingQuote(null);
  }, [hubId]);

  useEffect(() => {
    try {
      localStorage.setItem(`hub-notes-${hubId}`, JSON.stringify(notes));
    } catch {
      // Ignore quota errors.
    }
  }, [notes, hubId]);

  const handleCitationClick = useCallback(
    (fileId) => {
      onOpenSource?.(fileId);
    },
    [onOpenSource],
  );

  const handleSaveMessageAsNote = useCallback((message) => {
    setPendingQuote({ text: message.content.slice(0, 200), sourceFile: null });
    setTab("notes");
  }, [setTab]);

  const handleSaveStudioAsNote = useCallback((item) => {
    setPendingQuote({ text: item.content?.slice(0, 200) ?? item.title, sourceFile: item.title });
    setTab("notes");
  }, [setTab]);

  function handleAddNote(data) {
    const note = { id: `n-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    setNotes((prev) => [note, ...prev]);
  }

  function handleEditNote(updated) {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
  }

  function handleDeleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2.5">
        {HUB_ASSISTANT_PANEL_TABS.map(({ id, label }) => (
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
        <HubAskTab
          hubName={hubName}
          allFiles={allFiles}
          focusFile={focusFile}
          onClearFocus={() => setFocusFileId(null)}
          onCitationClick={handleCitationClick}
          onSaveAsNote={handleSaveMessageAsNote}
        />
      ) : activeTab === "studio" ? (
        <HubStudioTab hubName={hubName} allFiles={allFiles} onSaveAsNote={handleSaveStudioAsNote} />
      ) : (
        <HubNotesPanel
          hubId={hubId}
          notes={notes}
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          pendingQuote={pendingQuote}
          onClearPendingQuote={() => setPendingQuote(null)}
        />
      )}
    </div>
  );
}
