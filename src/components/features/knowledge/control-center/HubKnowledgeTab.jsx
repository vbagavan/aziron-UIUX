import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  BarChart3,
  ChevronRight,
  ClipboardList,
  FileText,
  Lightbulb,
  Pin,
  PinOff,
  Presentation,
  Search,
  Send,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HubMarkdownPreview } from "@/components/features/knowledge/HubMarkdownPreview";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import {
  ASSET_TYPES,
  ASSET_TYPE_ORDER,
  assetTypeLabel,
  createHubAsset,
  formatDisplayDate,
} from "@/data/knowledgeHubs";
import { hubRoleCan } from "@/lib/hubRoles";
import { SampleDataBadge } from "@/components/features/knowledge/control-center/SampleDataNote";

const ASSETS_PAGE_SIZE = 12;

const TYPE_ICON = {
  note: StickyNote,
  summary: FileText,
  report: ClipboardList,
  insight: Lightbulb,
  document: FileText,
  presentation: Presentation,
};

const STATUS_TABS = [
  { id: "active", label: "Active" },
  { id: "pinned", label: "Pinned" },
  { id: "archived", label: "Archived" },
];

const ORIGIN_LABEL = { "ask-ai": "Ask AI", studio: "Studio", note: "Note", ai: "AI" };

// ── Generate Studio outputs (one entry per asset type the composer can emit) ──
const GENERATE_MENU = [
  { type: "summary", label: "Summary", icon: FileText },
  { type: "report", label: "Report", icon: ClipboardList },
  { type: "insight", label: "Insight", icon: Lightbulb },
  { type: "document", label: "Document", icon: FileText },
  { type: "presentation", label: "Presentation deck", icon: Presentation },
];

function inferAssetType(question) {
  const q = question.toLowerCase();
  if (/\b(summary|summarize|overview|tl;dr|recap)\b/.test(q)) return "summary";
  if (/\b(report|analysis|breakdown)\b/.test(q)) return "report";
  if (/\b(insight|trend|pattern|takeaway|recommend)\b/.test(q)) return "insight";
  if (/\b(deck|slides|presentation)\b/.test(q)) return "presentation";
  return "note";
}

/** Mock generator — the auto-save loop is real; only the content is stubbed. */
function generateContent(type, hubName, sources, prompt) {
  const srcLine = sources.length
    ? `${sources.length} source${sources.length === 1 ? "" : "s"}`
    : "all connected sources";
  const heading = prompt?.trim() ? prompt.trim().replace(/\?+$/, "") : `${assetTypeLabel(type)} — ${hubName}`;
  const intro = `Generated from ${srcLine} in **${hubName}**.`;

  switch (type) {
    case "summary":
      return {
        title: prompt?.trim() ? `Summary: ${heading}` : `Executive summary — ${hubName}`,
        body: `# ${heading}\n\n${intro}\n\n## Overview\nThe connected sources collectively cover the core topics in this hub. Key themes are surfaced below for quick consumption by the team.\n\n## Key points\n- Primary objective and scope drawn from the sources\n- Notable procedures, definitions, and decisions\n- Cross-references that recur across documents\n\n## Suggested next step\nAsk a follow-up question to drill into any point above — the answer is saved here automatically.`,
      };
    case "report":
      return {
        title: prompt?.trim() ? `Report: ${heading}` : `Coverage report — ${hubName}`,
        body: `# ${heading}\n\n${intro}\n\n## Findings\n1. The sources address the requested topic with good coverage.\n2. A few gaps remain where additional sources would help.\n3. Confidence is moderate-to-high based on overlap across documents.\n\n## Detail\nEach finding above is grounded in the hub's sources and can be expanded on request.`,
      };
    case "insight":
      return {
        title: prompt?.trim() ? `Insight: ${heading}` : `Insight — recurring themes`,
        body: `# ${heading}\n\n${intro}\n\n> The strongest signal across the sources is a consistent emphasis on the topic you asked about.\n\n- Theme appears in the majority of documents\n- Two sources offer conflicting guidance worth reconciling\n- One emerging trend is under-documented and may need a new source`,
      };
    case "presentation":
      return {
        title: prompt?.trim() ? `Deck: ${heading}` : `${hubName} overview deck`,
        body: `# ${heading}\n\n${intro}\n\n## Slide 1 — Context\nWhy this matters and who it's for.\n\n## Slide 2 — Key points\nThree to five points drawn directly from the sources.\n\n## Slide 3 — Recommendation\nThe suggested action and its rationale.`,
      };
    case "document":
      return {
        title: prompt?.trim() ? `Draft: ${heading}` : `Draft document — ${hubName}`,
        body: `# ${heading}\n\n${intro}\n\nThis draft assembles the relevant passages from the hub's sources into a single document you can refine and share.`,
      };
    default:
      return {
        title: prompt?.trim() ? heading : `Note — ${hubName}`,
        body: `${intro}\n\n${prompt?.trim() ? `**Q:** ${prompt.trim()}\n\n` : ""}Based on the connected sources, here is a concise, grounded answer that has been saved to this hub's knowledge for everyone with access.`,
      };
  }
}

function AssetTypeBadge({ type }) {
  const Icon = TYPE_ICON[type] ?? FileText;
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", ASSET_TYPES[type]?.accent)}>
      <Icon className="size-4" />
    </span>
  );
}

export function HubKnowledgeTab({ hub, hubRole, actor }) {
  const { addHubAsset, updateHubAsset, removeHubAsset } = useKnowledgeHubs();

  const [statusTab, setStatusTab] = useState("active");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [question, setQuestion] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openAsset, setOpenAsset] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const assets = useMemo(() => hub?.assets ?? [], [hub?.assets]);
  const canGenerate = hubRoleCan(hubRole, "ai.generate");
  const canPin = hubRoleCan(hubRole, "assets.pin");
  const canArchive = hubRoleCan(hubRole, "assets.archive");
  const canDelete = hubRoleCan(hubRole, "assets.delete");

  // Status scope first, then type + search.
  const statusScoped = useMemo(() => {
    if (statusTab === "archived") return assets.filter((a) => a.status === "archived");
    if (statusTab === "pinned") return assets.filter((a) => a.status !== "archived" && a.pinned);
    return assets.filter((a) => a.status !== "archived");
  }, [assets, statusTab]);

  const typeCounts = useMemo(() => {
    const counts = { all: statusScoped.length };
    for (const t of ASSET_TYPE_ORDER) counts[t] = 0;
    for (const a of statusScoped) counts[a.type] = (counts[a.type] ?? 0) + 1;
    return counts;
  }, [statusScoped]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = statusScoped;
    if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter);
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) || (a.excerpt ?? "").toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (statusTab === "active") {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [statusScoped, typeFilter, search, statusTab]);

  const pagination = useMemo(
    () => paginate(filtered, page),
    [filtered, page],
  );

  function changeStatus(id) {
    setStatusTab(id);
    setPage(1);
  }
  function changeType(id) {
    setTypeFilter(id);
    setPage(1);
  }
  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function persistAsset(type, prompt) {
    const sources = hub?.userFiles ?? [];
    const { title, body } = generateContent(type, hub?.name ?? "this hub", sources, prompt);
    const asset = createHubAsset({
      type,
      title,
      body,
      origin: prompt ? "ask-ai" : "studio",
      sources: sources.slice(0, 3).map((f) => f.name),
      sourceFileIds: sources.slice(0, 3).map((f) => f.id),
      actor,
    });
    addHubAsset(hub.id, asset);
    return asset;
  }

  function runGenerate(type, prompt) {
    if (!canGenerate || generating) return;
    setGenerating(true);
    // Simulate the model round-trip, then auto-save (no manual save step).
    window.setTimeout(() => {
      try {
        const asset = persistAsset(type, prompt);
        setQuestion("");
        setStatusTab("active");
        setTypeFilter("all");
        setPage(1);
        toast.success("Saved to Knowledge", {
          description: `${assetTypeLabel(type)} added to this hub for everyone with access.`,
          action: { label: "Open", onClick: () => setOpenAsset(asset) },
        });
      } catch {
        toast.error("Couldn't generate that", {
          description: "Something went wrong while saving. Please try again.",
          action: { label: "Retry", onClick: () => runGenerate(type, prompt) },
        });
      } finally {
        setGenerating(false);
      }
    }, 650);
  }

  function handleAsk() {
    const q = question.trim();
    if (!q) return;
    runGenerate(inferAssetType(q), q);
  }

  return (
    <div className="space-y-5">
      {/* Ask AI composer — generation auto-saves into the repository below */}
      {canGenerate ? (
        <div className="rounded-xl border border-border bg-gradient-to-b from-primary/[0.04] to-transparent p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-2 size-4 shrink-0 text-primary" />
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              rows={1}
              placeholder="Ask AI about this hub — the answer is saved here automatically…"
              className="min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={generating} />}
              >
                <BarChart3 className="size-3.5" />
                Generate
                <ChevronRight className="size-3.5 rotate-90 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Create from sources</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {GENERATE_MENU.map(({ type, label, icon }) => {
                    const Icon = icon;
                    return (
                      <DropdownMenuItem key={type} onClick={() => runGenerate(type, "")}>
                        <Icon data-icon="inline-start" aria-hidden />
                        {label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" size="sm" className="gap-1.5" disabled={generating || !question.trim()} onClick={handleAsk}>
              {generating ? (
                <>
                  <Sparkles className="size-3.5 animate-pulse" />
                  Generating…
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  Ask
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          Generated reports, summaries, and notes appear here. Your role can read every
          asset but cannot generate new ones.
        </div>
      )}

      {/* Status segmented control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {STATUS_TABS.map((t) => {
            const count =
              t.id === "archived"
                ? assets.filter((a) => a.status === "archived").length
                : t.id === "pinned"
                  ? assets.filter((a) => a.status !== "archived" && a.pinned).length
                  : assets.filter((a) => a.status !== "archived").length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => changeStatus(t.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusTab === t.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className="ml-1 tabular-nums text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search knowledge…"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={typeFilter === "all"} onClick={() => changeType("all")} label="All" count={typeCounts.all} />
        {ASSET_TYPE_ORDER.map((t) => (
          <FilterChip
            key={t}
            active={typeFilter === t}
            onClick={() => changeType(t)}
            label={ASSET_TYPES[t].plural}
            count={typeCounts[t]}
          />
        ))}
      </div>

      {/* Asset list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-medium">
            {assets.length === 0
              ? "No knowledge yet"
              : statusTab === "archived"
                ? "Nothing archived"
                : "No assets match"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {assets.length === 0
              ? "Ask AI or generate a summary above. Everything you create is saved here and shared with all members."
              : "Try a different type, status, or search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagination.items.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              onOpen={() => setOpenAsset(asset)}
              canPin={canPin}
              canArchive={canArchive}
              canDelete={canDelete}
              onTogglePin={() =>
                updateHubAsset(hub.id, asset.id, { pinned: !asset.pinned })
              }
              onArchive={() =>
                updateHubAsset(hub.id, asset.id, {
                  status: asset.status === "archived" ? "active" : "archived",
                  pinned: asset.status === "archived" ? asset.pinned : false,
                })
              }
              onDelete={() => setPendingDelete(asset)}
            />
          ))}

          {pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                {pagination.totalItems} assets · page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent className="gap-0.5">
                  <PaginationItem>
                    <PaginationPrevious
                      text="Prev"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className={cn("h-7 cursor-pointer text-xs", pagination.currentPage === 1 && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      text="Next"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(pagination.totalPages, p + 1));
                      }}
                      className={cn("h-7 cursor-pointer text-xs", pagination.currentPage === pagination.totalPages && "pointer-events-none opacity-40")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </div>
      )}

      <AssetDrawer
        asset={openAsset}
        onOpenChange={(o) => !o && setOpenAsset(null)}
        hubName={hub?.name}
      />

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this asset?"
          message={`“${pendingDelete.title}” will be permanently removed from this hub for all members.`}
          confirmLabel="Delete"
          onConfirm={() => {
            removeHubAsset(hub.id, pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}

function paginate(items, page) {
  const totalPages = Math.max(1, Math.ceil(items.length / ASSETS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * ASSETS_PAGE_SIZE;
  return {
    items: items.slice(start, start + ASSETS_PAGE_SIZE),
    currentPage,
    totalPages,
    totalItems: items.length,
  };
}

function FilterChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {label}
      <span className="tabular-nums opacity-70">{count ?? 0}</span>
    </button>
  );
}

function AssetRow({ asset, onOpen, canPin, canArchive, canDelete, onTogglePin, onArchive, onDelete }) {
  const archived = asset.status === "archived";
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40",
        archived && "opacity-70",
      )}
    >
      <AssetTypeBadge type={asset.type} />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          {asset.pinned && !archived ? <Pin className="size-3 shrink-0 fill-current text-primary" /> : null}
          <p className="truncate text-sm font-medium">{asset.title}</p>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{asset.excerpt}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">{assetTypeLabel(asset.type)}</Badge>
          <span className="rounded border border-border px-1 py-px text-[10px]">{ORIGIN_LABEL[asset.origin] ?? "AI"}</span>
          <span>{asset.createdByName}</span>
          <span aria-hidden>·</span>
          <span>{formatDisplayDate(asset.createdAt)}</span>
          {archived ? <Badge variant="outline" className="text-[10px]">Archived</Badge> : null}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {canPin && !archived ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={asset.pinned ? "Unpin" : "Pin"} onClick={onTogglePin}>
            {asset.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          </Button>
        ) : null}
        {canArchive ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={archived ? "Restore" : "Archive"} onClick={onArchive}>
            {archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
          </Button>
        ) : null}
        {canDelete ? (
          <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" aria-label="Delete" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AssetDrawer({ asset, onOpenChange, hubName }) {
  return (
    <Sheet open={Boolean(asset)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {asset ? (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{assetTypeLabel(asset.type)}</Badge>
                <Badge variant="outline" className="text-[10px]">{ORIGIN_LABEL[asset.origin] ?? "AI"}</Badge>
                {asset.origin !== "note" ? <SampleDataBadge label="Simulated" /> : null}
                {asset.status === "archived" ? <Badge variant="outline">Archived</Badge> : null}
                {asset.pinned && asset.status !== "archived" ? (
                  <Badge variant="outline" className="gap-1"><Pin className="size-3" />Pinned</Badge>
                ) : null}
              </div>
              <SheetTitle className="mt-1">{asset.title}</SheetTitle>
              <SheetDescription>
                {asset.origin === "note"
                  ? `Created by ${asset.createdByName}`
                  : `AI-generated · requested by ${asset.createdByName}`}
                {" · "}
                {formatDisplayDate(asset.createdAt)}
                {hubName ? ` · ${hubName}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6">
              {asset.sources?.length ? (
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Sources:</span>
                  {asset.sources.map((s) => (
                    <Badge key={s} variant="outline" className="max-w-[180px] truncate text-[10px]">{s}</Badge>
                  ))}
                </div>
              ) : null}
              {asset.body ? (
                <HubMarkdownPreview content={asset.body} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{asset.excerpt}</p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
