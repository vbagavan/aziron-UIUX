import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  FileText,
  Italic,
  List,
  MessageSquareQuote,
  MoreHorizontal,
  Pencil,
  Plus,
  Quote,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

function formatNoteDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return "just now";
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const EMPTY_DRAFT = "";

function NoteEditor({ note, onSave, onCancel }) {
  const [body, setBody] = useState(note?.body ?? EMPTY_DRAFT);
  const [title, setTitle] = useState(note?.title ?? "");
  const areaRef = useRef(null);

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  function insertMarkdown(prefix, suffix = "") {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const next =
      body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.selectionStart = start + prefix.length;
      el.selectionEnd = start + prefix.length + selected.length;
      el.focus();
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel?.();
    }
  }

  function handleSave() {
    const trimBody = body.trim();
    if (!trimBody) return;
    onSave?.({
      title: title.trim() || trimBody.split("\n")[0].slice(0, 60),
      body: trimBody,
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-card p-4 shadow-sm">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title (optional)…"
        className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
      />
      <div className="flex items-center gap-0.5 border-b border-border pb-2">
        {[
          { label: "Bold", icon: Bold, action: () => insertMarkdown("**", "**") },
          { label: "Italic", icon: Italic, action: () => insertMarkdown("_", "_") },
          { label: "Quote", icon: Quote, action: () => insertMarkdown("> ") },
          { label: "List", icon: List, action: () => insertMarkdown("- ") },
        ].map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={action}
            className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-3.5" />
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">
          ⌘↵ to save · Esc to cancel
        </span>
      </div>
      <textarea
        ref={areaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write anything — ideas, observations, questions…"
        rows={6}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={!body.trim()}>
          Save note
        </Button>
      </div>
    </div>
  );
}

function renderMarkdownBody(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## ")) {
      return <h2 key={i} className="mt-2 text-sm font-semibold text-foreground">{line.slice(3)}</h2>;
    }
    if (line.startsWith("# ")) {
      return <h1 key={i} className="mt-2 text-base font-bold text-foreground">{line.slice(2)}</h1>;
    }
    if (line.startsWith("> ")) {
      return (
        <blockquote key={i} className="my-1 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
          {line.slice(2)}
        </blockquote>
      );
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={i} className="ml-4 list-disc text-sm text-foreground">
          {line.slice(2)}
        </li>
      );
    }
    if (!line.trim()) return <br key={i} />;
    // inline bold/italic
    const parts = line.split(/(\*\*.*?\*\*|_.*?_)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("_") && part.endsWith("_")) {
        return <em key={j}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
    return <p key={i} className="text-sm leading-relaxed text-foreground">{parts}</p>;
  });
}

function NoteCard({ note, onEdit, onDelete, onAddToSources }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.body.split("\n").length > 6 || note.body.length > 300;

  return (
    <article
      className={cn(
        "group rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        note.type === "citation" && "border-primary/20 bg-primary/5",
        note.type === "chat-quote" && "border-violet-500/20 bg-violet-500/5",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {note.type === "citation" ? (
            <FileText className="size-3.5 shrink-0 text-primary" aria-hidden />
          ) : note.type === "chat-quote" ? (
            <MessageSquareQuote className="size-3.5 shrink-0 text-violet-500" aria-hidden />
          ) : (
            <Pencil className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">{note.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{formatNoteDate(note.createdAt)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100"
                  aria-label="Note actions"
                />
              }
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {note.type !== "citation" && note.type !== "chat-quote" && (
                <DropdownMenuItem onClick={() => onEdit?.(note)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onAddToSources?.(note)}>
                <Upload className="mr-2 size-4" />
                Add to sources
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(note.id)}>
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {note.sourceFile && (
        <div className="mb-2 rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
          From: <span className="font-medium text-foreground">{note.sourceFile}</span>
        </div>
      )}

      <div className={cn("overflow-hidden", !expanded && isLong && "max-h-24")}>
        <div className="space-y-0.5">
          {renderMarkdownBody(note.body)}
        </div>
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </article>
  );
}

export function HubNotesPanel({
  hubId,
  notes = [],
  onAddNote,
  onEditNote,
  onDeleteNote,
  onAddNoteToSources,
  pendingQuote,
  onClearPendingQuote,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    if (pendingQuote) {
      setEditorOpen(true);
    }
  }, [pendingQuote]);

  const handleSave = useCallback(
    (data) => {
      if (editTarget) {
        onEditNote?.({ ...editTarget, ...data });
        setEditTarget(null);
      } else {
        onAddNote?.({
          ...data,
          type: pendingQuote ? "chat-quote" : "note",
          sourceFile: pendingQuote?.sourceFile,
          body: pendingQuote
            ? `> ${pendingQuote.text}\n\n${data.body}`
            : data.body,
        });
        onClearPendingQuote?.();
      }
      setEditorOpen(false);
    },
    [editTarget, onAddNote, onEditNote, pendingQuote, onClearPendingQuote],
  );

  function handleEdit(note) {
    setEditTarget(note);
    setEditorOpen(true);
  }

  function handleCancel() {
    setEditorOpen(false);
    setEditTarget(null);
    onClearPendingQuote?.();
  }

  const freeNotes = notes.filter((n) => n.type === "note" || !n.type);
  const citationNotes = notes.filter((n) => n.type === "citation");
  const chatQuoteNotes = notes.filter((n) => n.type === "chat-quote");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border p-4">
        {pendingQuote && !editorOpen && (
          <div className="mb-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="size-3.5 shrink-0 text-violet-500" />
                <p className="text-xs font-medium text-foreground">Saving chat quote</p>
              </div>
              <button type="button" onClick={onClearPendingQuote} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground italic">"{pendingQuote.text}"</p>
          </div>
        )}
        {editorOpen ? (
          <NoteEditor
            note={
              editTarget ?? (pendingQuote ? { body: "" } : null)
            }
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <Button
            type="button"
            className="w-full gap-1.5 rounded-full"
            onClick={() => setEditorOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            Add note
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
        {notes.length === 0 && !editorOpen ? (
          <Empty className="border border-dashed py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Pencil aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No notes yet</EmptyTitle>
              <EmptyDescription>
                Capture ideas, save chat quotes, and annotate sources.
                Notes stay with this hub.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" size="sm" onClick={() => setEditorOpen(true)}>
                Write your first note
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-3">
            {chatQuoteNotes.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Chat quotes
                </p>
                <div className="space-y-2">
                  {chatQuoteNotes.map((n) => (
                    <NoteCard key={n.id} note={n} onEdit={handleEdit} onDelete={onDeleteNote} onAddToSources={onAddNoteToSources} />
                  ))}
                </div>
              </div>
            )}
            {citationNotes.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Source annotations
                </p>
                <div className="space-y-2">
                  {citationNotes.map((n) => (
                    <NoteCard key={n.id} note={n} onEdit={handleEdit} onDelete={onDeleteNote} onAddToSources={onAddNoteToSources} />
                  ))}
                </div>
              </div>
            )}
            {freeNotes.length > 0 && (
              <div>
                {(chatQuoteNotes.length > 0 || citationNotes.length > 0) && (
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                )}
                <div className="space-y-2">
                  {freeNotes.map((n) => (
                    <NoteCard key={n.id} note={n} onEdit={handleEdit} onDelete={onDeleteNote} onAddToSources={onAddNoteToSources} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
