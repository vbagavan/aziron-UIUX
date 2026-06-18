import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Lightbulb,
  Network,
  Presentation,
  Search,
  Send,
  Share2,
  Sparkles,
  StickyNote,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HubMarkdownPreview } from "@/components/features/knowledge/HubMarkdownPreview";
import { ShareAssetDialog } from "@/components/features/knowledge/ShareAssetDialog";
import { SampleDataBadge } from "@/components/features/knowledge/control-center/SampleDataNote";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import {
  ASSET_TYPES,
  ASSET_TYPE_ORDER,
  assetTypeLabel,
  createHubAsset,
  formatDisplayDate,
} from "@/data/knowledgeHubs";
import {
  detectProjectDocIntent,
  generateHubContent,
  HUB_CREATION_TOOLS,
  inferAssetTypeFromPrompt,
  mockHubAssistantReply,
} from "@/lib/hubAssistantModel";
import { hubRoleCan } from "@/lib/hubRoles";

const ASSETS_PAGE_SIZE = 12;

const TYPE_ICON = {
  note: StickyNote,
  summary: FileText,
  report: FileText,
  insight: Lightbulb,
  document: FileText,
  presentation: Presentation,
  mindmap: Network,
  flashcards: Layers,
  datatable: FileSpreadsheet,
};

const ORIGIN_LABEL = { "ask-ai": "Ask AI", studio: "Studio", note: "Note", ai: "AI" };

const PROJECT_QUICK_PROMPTS = [
  { label: "Purchase order", prompt: "Generate purchase order for milestone 1" },
  { label: "Invoice", prompt: "Create invoice for Acme" },
  { label: "RFP summary", prompt: "Draft RFP response summary" },
];

function AssetTypeBadge({ type }) {
  const Icon = TYPE_ICON[type] ?? FileText;
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", ASSET_TYPES[type]?.accent)}>
      <Icon className="size-4" />
    </span>
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

function AssetRow({ asset, onOpen, onShare, canDelete, onDelete }) {
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
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Share / Export" title="Share / Export" onClick={onShare}>
          <Share2 className="size-3.5" />
        </Button>
        {canDelete ? (
          <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" aria-label="Delete" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AssetDrawer({ asset, onOpenChange, hubName, hubId, canShare, onShared }) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  function handleCopy() {
    const text = asset?.body ?? asset?.excerpt ?? "";
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload(format) {
    const content = asset?.body ?? asset?.excerpt ?? "";
    const filename = `${(asset?.title ?? "asset").replace(/[^\w\s-]/g, "").trim()}${format === "md" ? ".md" : ".txt"}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Sheet open={Boolean(asset)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-xl">
        {asset ? (
          <>
            <SheetHeader className="shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{assetTypeLabel(asset.type)}</Badge>
                <Badge variant="outline" className="text-[10px]">{ORIGIN_LABEL[asset.origin] ?? "AI"}</Badge>
                {asset.origin !== "note" ? <SampleDataBadge label="Simulated" /> : null}
                {asset.status === "archived" ? <Badge variant="outline">Archived</Badge> : null}
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

              {/* Share / export actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {canShare ? (
                  <Button type="button" variant="default" size="sm" className="gap-1.5" onClick={() => setShareOpen(true)}>
                    <Share2 className="size-3.5" />
                    Share
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied!" : "Copy content"}
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownload("md")}>
                  <Download className="size-3.5" />
                  Download .md
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownload("txt")}>
                  <Download className="size-3.5" />
                  Download .txt
                </Button>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
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

      <ShareAssetDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        asset={asset}
        hubId={hubId}
        hubName={hubName}
        onShared={onShared}
      />
    </Sheet>
  );
}

export function HubStudioTab({ hub, hubRole, actor, allFiles = [], initialAssetId = null }) {
  const { hubs, addHubAsset, removeHubAsset } = useKnowledgeHubs();
  const liveHub = useMemo(
    () => hubs.find((h) => Number(h.id) === Number(hub?.id)) ?? hub,
    [hubs, hub],
  );

  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [question, setQuestion] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openAsset, setOpenAsset] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const sources = useMemo(
    () => (allFiles.length ? allFiles : hub?.userFiles ?? []),
    [allFiles, hub?.userFiles],
  );
  const assets = useMemo(() => liveHub?.assets ?? [], [liveHub?.assets]);
  const canGenerate = hubRoleCan(hubRole, "ai.generate");
  const canShareAsset = hubRoleCan(hubRole, "hub.share") || hubRoleCan(hubRole, "assets.view");
  const hubId = liveHub?.id ?? hub?.id;
  const canDelete = hubRoleCan(hubRole, "assets.delete");
  const hubName = hub?.name ?? "this hub";

  function handleAssetShared(payload) {
    if (payload?.type === "recipients") {
      toast.success("Asset shared", {
        description: `Sent to ${payload.names}. They can open it in Studio.`,
      });
    }
  }

  useEffect(() => {
    if (!initialAssetId || !assets.length) return;
    const match = assets.find((a) => a.id === initialAssetId);
    if (match) setOpenAsset(match);
  }, [initialAssetId, assets]);

  const visibleAssets = useMemo(
    () => assets.filter((a) => a.status !== "archived"),
    [assets],
  );

  const typeCounts = useMemo(() => {
    const counts = { all: visibleAssets.length };
    for (const t of ASSET_TYPE_ORDER) counts[t] = 0;
    for (const a of visibleAssets) counts[a.type] = (counts[a.type] ?? 0) + 1;
    return counts;
  }, [visibleAssets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = visibleAssets;
    if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter);
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) || (a.excerpt ?? "").toLowerCase().includes(q),
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [visibleAssets, typeFilter, search]);

  const pagination = useMemo(() => paginate(filtered, page), [filtered, page]);

  function changeType(id) {
    setTypeFilter(id);
    setPage(1);
  }
  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function requireSources() {
    if (sources.length > 0) return true;
    toast.error("Add sources first", {
      description: "Link project documents to this hub on the Hub sources tab, then try again.",
    });
    return false;
  }

  function persistAsset(toolId, prompt, origin) {
    const selected = sources.length ? sources : [{ name: "hub sources" }];
    const { title, body, assetType } = generateHubContent(toolId, hubName, selected, prompt);
    const asset = createHubAsset({
      type: assetType ?? toolId,
      title,
      body,
      origin,
      sources: sources.slice(0, 3).map((f) => f.name),
      sourceFileIds: sources.slice(0, 3).map((f) => f.id),
      actor,
    });
    addHubAsset(hubId, asset);
    return asset;
  }

  function persistAskAnswer(prompt) {
    const { content } = mockHubAssistantReply(prompt, hubName, sources);
    const asset = createHubAsset({
      type: "note",
      title: prompt.replace(/\?+$/, "").trim().slice(0, 120) || `Answer — ${hubName}`,
      body: content,
      origin: "ask-ai",
      sources: sources.slice(0, 3).map((f) => f.name),
      sourceFileIds: sources.slice(0, 3).map((f) => f.id),
      actor,
    });
    addHubAsset(hubId, asset);
    return asset;
  }

  function finishCreate(asset) {
    setQuestion("");
    setActiveTool(null);
    setCustomPrompt("");
    setTypeFilter("all");
    setPage(1);
    setOpenAsset(asset);
    toast.success("Saved to Studio", {
      description: `${assetTypeLabel(asset.type)} added to this hub for everyone with access.`,
      action: { label: "Open", onClick: () => setOpenAsset(asset) },
    });
  }

  function runGenerate(toolId, prompt, origin = "studio") {
    if (!canGenerate || generating) return;
    if (!requireSources()) return;
    setGenerating(true);
    window.setTimeout(() => {
      try {
        finishCreate(persistAsset(toolId, prompt, origin));
      } catch {
        toast.error("Couldn't generate that", {
          description: "Something went wrong while saving. Please try again.",
          action: { label: "Retry", onClick: () => runGenerate(toolId, prompt, origin) },
        });
      } finally {
        setGenerating(false);
      }
    }, 650);
  }

  function handleAsk() {
    const q = question.trim();
    if (!q || !canGenerate || generating) return;
    if (!requireSources()) return;

    const structured =
      detectProjectDocIntent(q) ||
      inferAssetTypeFromPrompt(q) !== "note";

    if (structured) {
      runGenerate(inferAssetTypeFromPrompt(q), q, "ask-ai");
      return;
    }

    setGenerating(true);
    window.setTimeout(() => {
      try {
        finishCreate(persistAskAnswer(q));
      } catch {
        toast.error("Couldn't save that answer", {
          description: "Something went wrong. Please try again.",
          action: { label: "Retry", onClick: () => handleAsk() },
        });
      } finally {
        setGenerating(false);
      }
    }, 450);
  }

  function handleToolGenerate() {
    if (!activeTool) return;
    runGenerate(activeTool.id, customPrompt, "studio");
  }

  function handleQuickPrompt(prompt) {
    setQuestion(prompt);
    runGenerate(inferAssetTypeFromPrompt(prompt), prompt, "ask-ai");
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
      <div className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-0 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
        {canGenerate ? (
          <div className="rounded-xl border border-border bg-gradient-to-b from-primary/[0.04] to-transparent p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wand2 className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Create from sources</p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Pick a tool or ask freely — everything is saved to your asset library.
              {sources.length > 0 ? (
                <span className="mt-1 block text-foreground/80">
                  {sources.length} source{sources.length === 1 ? "" : "s"} connected
                </span>
              ) : (
                <span className="mt-1 block text-amber-700 dark:text-amber-300">
                  Link documents on Hub sources before generating.
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {HUB_CREATION_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool?.id === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setActiveTool(isActive ? null : tool);
                      setCustomPrompt("");
                    }}
                    disabled={generating}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
                      isActive
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/30 hover:bg-muted/40",
                      generating && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className={cn("flex size-8 items-center justify-center rounded-lg", tool.className)}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold text-foreground">{tool.label}</span>
                    {isActive ? (
                      <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {activeTool && !generating ? (
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                {(() => {
                  const ToolIcon = activeTool.icon;
                  return (
                <>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg", activeTool.className)}>
                    <ToolIcon className="size-3.5" />
                  </span>
                  <p className="text-xs font-semibold text-foreground">Generate {activeTool.label}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTool(null)}
                    className="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <Input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleToolGenerate();
                    }
                  }}
                  placeholder={
                    activeTool.id === "document"
                      ? "e.g. Generate purchase order, create invoice…"
                      : "Optional: focus on specific aspects…"
                  }
                  className="mb-2.5 h-9 text-xs"
                />
                <Button type="button" size="sm" className="w-full gap-1.5" onClick={handleToolGenerate}>
                  <ToolIcon className="size-3.5" />
                  Generate {activeTool.label}
                </Button>
                </>
                  );
                })()}
              </div>
            ) : null}

            {generating ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                <Sparkles className="size-4 animate-pulse text-primary" />
                <p className="text-xs text-muted-foreground">Generating and saving…</p>
              </div>
            ) : null}

            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">Project deliverables</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {PROJECT_QUICK_PROMPTS.map(({ label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    disabled={generating || sources.length === 0}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
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
                  rows={2}
                  placeholder="Or ask AI about this hub — the answer is saved automatically…"
                  className="min-h-9 resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="mt-2 flex justify-end">
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
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            Generated reports, summaries, and notes appear in your asset library. Your role can read every
            asset but cannot generate new ones.
          </div>
        )}
      </div>

      <div className="min-w-0 order-1 lg:order-none lg:col-start-1 lg:row-start-1">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Your assets</h3>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search assets…"
              className="h-9 pl-8"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
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

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <Sparkles className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium">
              {visibleAssets.length === 0 ? "No assets yet" : "No assets match"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              {visibleAssets.length === 0
                ? "Use a tool or ask AI to get started. Everything you create is saved here and shared with all members."
                : "Try a different type or search."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pagination.items.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                onOpen={() => setOpenAsset(asset)}
                onShare={() => setOpenAsset(asset)}
                canDelete={canDelete}
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
      </div>
      </div>

      <AssetDrawer
        asset={openAsset}
        onOpenChange={(o) => !o && setOpenAsset(null)}
        hubName={hubName}
        hubId={hubId}
        canShare={canShareAsset}
        onShared={handleAssetShared}
      />

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this asset?"
          message={`“${pendingDelete.title}” will be permanently removed from this hub for all members.`}
          confirmLabel="Delete"
          onConfirm={() => {
            removeHubAsset(hubId, pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </>
  );
}
