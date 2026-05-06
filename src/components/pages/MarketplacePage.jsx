import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronDown,
  Copy,
  GitFork,
  LayoutGrid,
  Loader2,
  Search,
  Users,
  Workflow,
  X,
  Download,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toast, useToast } from "@/components/ui/Toast";
import { forkAgent } from "@/lib/marketplaceApi";
import { cn } from "@/lib/utils";
import { useFlowCatalog } from "@/context/FlowCatalogContext";

// ─── Static data ──────────────────────────────────────────────────────────────

/** Category filters (mock-aligned); `id: null` = All */
const CATEGORY_FILTERS = [
  { id: null, label: "All" },
  { id: "data", label: "Data & Analytics" },
  { id: "customer_success", label: "Customer Success" },
  { id: "devops", label: "DevOps" },
  { id: "finance", label: "Finance" },
  { id: "documents", label: "Documents" },
  { id: "email", label: "Email & Comms" },
];

const FLOWS = [
  { id: 1, name: "Alert → Enrich → Ticket", blurb: "Normalize alerts from any source, enrich with CMDB context, and open tracked tickets automatically.", steps: 6, category: "Incident", author: "Platform", tags: ["alerts", "CMDB", "ticketing"], useCases: ["devops"], installs: 2340, badge: "Featured", addedDays: 55 },
  { id: 2, name: "Weekly KPI Digest",        blurb: "Pull metrics from your data warehouse, summarize anomalies with AI, and email stakeholders.",          steps: 4, category: "Analytics", author: "Platform", tags: ["warehouse", "email", "KPI"], useCases: ["data", "finance", "email"], installs: 1150, badge: null,       addedDays: 40 },
  { id: 3, name: "Invoice Intake Pipeline",  blurb: "Capture invoices from email, extract line items, validate against POs, and push to ERP.",             steps: 8, category: "Finance",   author: "Platform", tags: ["invoice", "ERP", "email"], useCases: ["finance", "documents", "email"], installs: 880, badge: "New",      addedDays: 5  },
  { id: 4, name: "Customer Churn Signals",   blurb: "Score accounts by churn risk using usage data, then trigger automated CSM outreach.",                  steps: 5, category: "CRM",      author: "Platform", tags: ["CRM", "churn", "CSM"], useCases: ["customer_success", "data"], installs: 630, badge: null,       addedDays: 25 },
];

const STATIC_AGENTS = [
  { id: "demo-1", name: "Observability Copilot",   blurb: "Correlate logs, metrics, and traces to surface root causes in seconds.",                   provider: "OpenAI",    author: "OpenAI",    model: "gpt-4o",            tags: ["logs", "APM", "traces"], installs: 1840, badge: "Popular", addedDays: 45, useCases: ["devops", "data"], canFork: true, isOwnedByMe: false },
  { id: "demo-2", name: "Contract Reviewer",        blurb: "Extract key clauses, flag risky language, and summarize obligations automatically.",        provider: "Anthropic", author: "Anthropic", model: "claude-3-5-sonnet", tags: ["legal", "contracts", "PDF"], installs: 924, badge: null,      addedDays: 30, useCases: ["documents"],          canFork: true, isOwnedByMe: false },
  { id: "demo-3", name: "SRE Assistant",            blurb: "Suggest runbooks, draft postmortems, and automate incident status communications.",         provider: "OpenAI",    author: "OpenAI",    model: "gpt-4o-mini",       tags: ["SRE", "incidents", "runbooks"], installs: 612, badge: "New",     addedDays:  7, useCases: ["devops"], canFork: true, isOwnedByMe: false },
  { id: "demo-4", name: "Finance Forecast Helper",  blurb: "Model revenue scenarios and generate executive-ready forecast summaries on demand.",        provider: "Anthropic", author: "Anthropic", model: "claude-3-haiku",    tags: ["forecast", "revenue", "exec"], installs: 430, badge: null,      addedDays: 60, useCases: ["finance", "data"],    canFork: true, isOwnedByMe: false },
  { id: "demo-5", name: "Data Insight Agent",       blurb: "Analyze tabular data, detect anomalies, and write plain-language insight summaries.",       provider: "OpenAI",    author: "OpenAI",    model: "gpt-4o",            tags: ["analytics", "SQL", "anomalies"], installs: 2103, badge: "Featured", addedDays: 90, useCases: ["data"],               canFork: true, isOwnedByMe: false },
  { id: "demo-6", name: "Document Extractor",       blurb: "Parse PDFs, invoices, and forms — output structured JSON with high accuracy.",             provider: "Anthropic", author: "Anthropic", model: "claude-3-5-sonnet", tags: ["PDF", "extraction", "JSON"], installs: 765, badge: null,      addedDays: 21, useCases: ["documents", "finance"], canFork: true, isOwnedByMe: false },
];

const SORT_OPTIONS = [
  { id: "popular", label: "Most Popular" },
  { id: "newest",  label: "Newest"       },
];

const CONTENT_TYPES = [
  { id: "all",    label: "All",    icon: LayoutGrid, count: STATIC_AGENTS.length + FLOWS.length },
  { id: "agents", label: "Agents", icon: Bot,        count: STATIC_AGENTS.length                },
  { id: "flows",  label: "Flows",  icon: Workflow,   count: FLOWS.length                        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtInstalls(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}

function formatUpdated(addedDays) {
  if (addedDays <= 0) return "Updated today";
  if (addedDays === 1) return "Updated yesterday";
  if (addedDays < 7) return `Updated ${addedDays}d ago`;
  if (addedDays < 30) return `Updated ${Math.floor(addedDays / 7)}w ago`;
  return `Updated ${Math.floor(addedDays / 30)}mo ago`;
}

function applySort(list, sortBy) {
  const copy = [...list];
  if (sortBy === "popular") return copy.sort((a, b) => b.installs - a.installs);
  if (sortBy === "newest")  return copy.sort((a, b) => a.addedDays - b.addedDays);
  return copy;
}

function categoryLabel(id) {
  const row = CATEGORY_FILTERS.find((c) => c.id === id);
  return row?.label ?? id;
}

function matchesTextSearch(item, q) {
  if (!q.trim()) return true;
  const L = q.toLowerCase();
  const tagHit = (item.tags ?? []).some((t) => String(t).toLowerCase().includes(L));
  return (
    item.name.toLowerCase().includes(L) ||
    item.blurb.toLowerCase().includes(L) ||
    (item.provider && item.provider.toLowerCase().includes(L)) ||
    (item.author && item.author.toLowerCase().includes(L)) ||
    (item.model    && item.model.toLowerCase().includes(L)) ||
    (item.category && item.category.toLowerCase().includes(L)) ||
    tagHit
  );
}

const BADGE_STYLES = {
  Popular:  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  New:      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Featured: "bg-primary/10 text-primary border-primary/20",
};

/** Fixed description block height (3 lines of text-xs) so cards align in grid rows */
const CARD_DESC_BLOCK = "min-h-[3.75rem] flex-1 flex flex-col justify-start";

// ─── Shared primitives ────────────────────────────────────────────────────────

function UsesMetric({ count }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Users className="size-3 shrink-0 opacity-80" aria-hidden />
      <span className="tabular-nums">{fmtInstalls(count)}</span>
      <span className="hidden sm:inline">uses</span>
    </span>
  );
}

function ItemBadge({ label }) {
  if (!label) return null;
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
      BADGE_STYLES[label] ?? "bg-muted text-muted-foreground border-border",
    )}>
      {label}
    </span>
  );
}

function KindPill({ kind }) {
  const isAgent = kind === "agent";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isAgent ? "bg-primary/12 text-primary" : "bg-cyan-500/12 text-cyan-700 dark:text-cyan-400",
      )}
    >
      {isAgent ? "Agent" : "Flow"}
    </span>
  );
}

// ─── Horizontal toolbar (replaces sidebar filters) ─────────────────────────────

function MarketplaceToolbar({
  contentType,
  setContentType,
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
}) {
  const sortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Sort";

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background py-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="sr-only">Content type</span>
        {CONTENT_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={contentType === id}
            onClick={() => setContentType(id)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              contentType === id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <span className="sr-only">Category</span>
          <div className="flex w-max min-w-full gap-2 pb-0.5">
            {CATEGORY_FILTERS.map(({ id, label }) => {
              const active = activeCategory === id;
              return (
                <button
                  key={id ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-muted/40 text-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative shrink-0">
          <label htmlFor="marketplace-sort" className="sr-only">
            Sort results
          </label>
          <select
            id="marketplace-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={cn(
              "h-10 min-w-[10.5rem] cursor-pointer appearance-none rounded-full border border-border bg-card py-2 pl-3 pr-9 text-xs font-medium text-foreground shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/35",
            )}
          >
            {SORT_OPTIONS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <span className="sr-only">Selected: {sortLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({ item, open, onClose, onAction, forkedIds }) {
  if (!item) return null;
  const isAgent  = item._kind === "agent";
  const isForked = isAgent && forkedIds.has(String(item.id));
  const canAct   = isAgent ? (item.canFork || item.isOwnedByMe) : true;
  const ctaLabel = isAgent
    ? (item.isOwnedByMe || isForked ? "Open in Agents" : "Clone this agent")
    : "Use this template";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-lg" showCloseButton>
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                isAgent
                  ? "bg-primary/10 text-primary"
                  : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
              )}
            >
              {isAgent ? <Bot className="size-5" aria-hidden /> : <Workflow className="size-5" aria-hidden />}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <KindPill kind={isAgent ? "agent" : "flow"} />
                <ItemBadge label={item.badge} />
              </div>
              <DialogTitle className="text-left text-lg leading-snug">{item.name}</DialogTitle>
              <DialogDescription className="text-left text-xs leading-relaxed">
                {isAgent
                  ? `${item.provider} · ${item.model}`
                  : `${item.steps} steps · ${item.category}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{item.blurb}</p>

          {(item.useCases ?? []).length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(item.useCases ?? []).map((ucId) => (
                  <span
                    key={ucId}
                    className="rounded-full border border-border bg-muted/40 px-2 py-1 text-[11px] text-foreground"
                  >
                    {categoryLabel(ucId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Uses
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {fmtInstalls(item.installs)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Updated</p>
              <p className="mt-0.5 text-sm text-foreground">{formatUpdated(item.addedDays)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border bg-muted/30 px-6 py-4 dark:bg-muted/20">
          <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={onClose}>
            Close
          </Button>
          {canAct && (
            <Button
              type="button"
              className="min-h-11 flex-1 gap-2"
              onClick={() => { onClose(); onAction(item); }}
            >
              {isAgent
                ? <Copy className="size-4" aria-hidden />
                : <Download className="size-4" aria-hidden />}
              {ctaLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fork modal ───────────────────────────────────────────────────────────────

function ForkAgentModal({ agent, open, onClose, onSuccess }) {
  const [name,        setName]    = useState("");
  const [description, setDesc]    = useState("");
  const [loading,     setLoading] = useState(false);
  const [error,       setError]   = useState(null);

  useEffect(() => {
    if (agent) {
      setName(`${agent.name} (Fork)`);
      setDesc(agent.blurb ?? "");
      setError(null);
    }
  }, [agent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (String(agent.id).startsWith("demo-")) {
        onSuccess({ id: agent.id, name: name.trim(), description: description.trim() });
        return;
      }
      const forked = await forkAgent(agent.id, { name: name.trim(), description: description.trim() });
      onSuccess(forked);
    } catch (err) {
      setError(err?.message ?? "Fork failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fork agent</DialogTitle>
          <DialogDescription>
            Create a private copy of{" "}
            <span className="font-medium text-foreground">"{agent.name}"</span>. You can rename it and adjust the description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label htmlFor="fork-agent-name" className="text-sm font-medium text-foreground">Name</label>
            <Input
              id="fork-agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My fork name"
              disabled={loading}
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="fork-agent-desc" className="text-sm font-medium text-foreground">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="fork-agent-desc"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What will this fork do differently?"
              rows={3}
              disabled={loading}
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive" role="alert">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {error}
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="min-h-10 gap-2 sm:min-w-[120px]"
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {loading ? "Forking…" : "Fork agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Agent card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, isForked, onFork, onOpenForked, onPreview }) {
  const cta =
    agent.isOwnedByMe || isForked
      ? { label: "Open copy", action: () => onOpenForked?.(agent), color: "text-foreground hover:bg-muted/60" }
      : { label: "Clone", action: () => onFork?.(agent), color: "text-primary hover:bg-primary/10" };

  return (
    <article className="group relative flex h-full min-h-[17.5rem] flex-col overflow-hidden rounded-xl border border-transparent bg-card shadow-sm transition-all duration-200 hover:border-primary/35 hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary to-primary/50 transition-transform duration-200 group-hover:scale-x-100" />

      <button
        type="button"
        className="flex min-h-0 flex-1 flex-col gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        onClick={() => onPreview?.({ ...agent, _kind: "agent" })}
        aria-label={`Preview ${agent.name}, by ${agent.author ?? agent.provider}`}
      >
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{agent.name}</p>
                  <KindPill kind="agent" />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="text-[11px] text-muted-foreground">
                    by {agent.author ?? agent.provider}
                  </p>
                  {isForked && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                      <GitFork className="size-2.5" aria-hidden />
                      Forked
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ItemBadge label={agent.badge} />
          </div>
        </div>

        <div className={CARD_DESC_BLOCK}>
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{agent.blurb}</p>
        </div>

        <div className="flex min-h-[1.625rem] shrink-0 flex-wrap gap-1.5">
          {(agent.tags ?? []).slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3 text-[11px]">
          <UsesMetric count={agent.installs} />
          <span className="text-muted-foreground">{formatUpdated(agent.addedDays)}</span>
        </div>
      </button>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
        <span className="text-[11px] text-muted-foreground">Quick action</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className={cn("min-h-9 gap-1", cta.color)}
          onClick={(e) => { e.stopPropagation(); cta.action(); }}
        >
          {!(isForked || agent.isOwnedByMe) && <Copy className="size-3" aria-hidden />}
          {cta.label}
          <ArrowRight className="size-3" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

// ─── Flow card ────────────────────────────────────────────────────────────────

function FlowCard({ flow, onUseTemplate, onPreview }) {
  return (
    <article className="group relative flex h-full min-h-[17.5rem] flex-col overflow-hidden rounded-xl border border-transparent bg-card shadow-sm transition-all duration-200 hover:border-cyan-500/35 hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary/60 via-cyan-500/50 to-primary/40 transition-transform duration-200 group-hover:scale-x-100" />

      <button
        type="button"
        className="flex min-h-0 flex-1 flex-col gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
        onClick={() => onPreview?.({ ...flow, _kind: "flow" })}
        aria-label={`Preview flow ${flow.name}, ${flow.steps} steps`}
      >
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Workflow className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{flow.name}</p>
                  <KindPill kind="flow" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  by {flow.author ?? "Platform"} · {flow.steps} steps · {flow.category}
                </p>
              </div>
            </div>
            <ItemBadge label={flow.badge} />
          </div>
        </div>

        <div className={CARD_DESC_BLOCK}>
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{flow.blurb}</p>
        </div>

        <div className="flex min-h-[1.625rem] shrink-0 flex-wrap gap-1.5">
          {(flow.tags ?? []).slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3 text-[11px]">
          <UsesMetric count={flow.installs} />
          <span className="text-muted-foreground">{formatUpdated(flow.addedDays)}</span>
        </div>
      </button>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
        <span className="text-[11px] text-muted-foreground">Quick action</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="min-h-9 gap-1 text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400"
          onClick={(e) => { e.stopPropagation(); onUseTemplate?.(flow); }}
        >
          <Download className="size-3" aria-hidden />
          Use template
          <ArrowRight className="size-3" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MarketplacePage({ onNavigate }) {
  const [contentType,    setContentType]    = useState("all");
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [sortBy,         setSortBy]         = useState("popular");
  const [previewItem,    setPreviewItem]    = useState(null);
  const [forkTarget,     setForkTarget]     = useState(null);
  const [forkedIds,      setForkedIds]      = useState(new Set());

  const searchRef = useRef(null);
  const { importFlow } = useFlowCatalog();
  const { toasts, showToast, dismissToast } = useToast();

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t?.tagName;
      const editable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t?.isContentEditable;
      if (editable) return;
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        focusSearch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusSearch]);

  const displayedItems = useMemo(() => {
    let agents = contentType === "flows"  ? [] : STATIC_AGENTS;
    let flows  = contentType === "agents" ? [] : FLOWS;

    if (activeCategory) {
      agents = agents.filter((a) => a.useCases.includes(activeCategory));
      flows  = flows.filter((f) => f.useCases.includes(activeCategory));
    }

    if (searchQuery.trim()) {
      agents = agents.filter((a) => matchesTextSearch(a, searchQuery));
      flows  = flows.filter((f) => matchesTextSearch(f, searchQuery));
    }

    const tagged = [
      ...agents.map((a) => ({ ...a, _kind: "agent" })),
      ...flows.map((f)  => ({ ...f, _kind: "flow"  })),
    ];

    return applySort(tagged, sortBy);
  }, [contentType, activeCategory, searchQuery, sortBy]);

  const totalUnfiltered = STATIC_AGENTS.length + FLOWS.length;

  const activeChips = [
    contentType !== "all" && { key: "type", label: contentType === "agents" ? "Agents" : "Flows", onRemove: () => setContentType("all") },
    activeCategory && { key: "category", label: categoryLabel(activeCategory), onRemove: () => setActiveCategory(null) },
    searchQuery.trim() && { key: "search", label: `"${searchQuery}"`, onRemove: () => setSearchQuery("") },
  ].filter(Boolean);

  const hasFilters = activeChips.length > 0;

  const clearAll = () => {
    setContentType("all");
    setActiveCategory(null);
    setSearchQuery("");
  };

  const handleFork = (agent) => {
    setPreviewItem(null);
    setForkTarget(agent);
  };

  const handleForkSuccess = (forkedAgent) => {
    setForkedIds((prev) => new Set([...prev, String(forkTarget?.id)]));
    setForkTarget(null);
    showToast(`"${forkedAgent.name}" forked — open Agents to customize it.`);
  };

  const handleUseTemplate = (flow) => {
    setPreviewItem(null);
    importFlow({
      name:        flow.name,
      description: flow.blurb,
      version:     "v0.1",
      steps:       [],
    });
    showToast(`"${flow.name}" added to your flows.`);
    onNavigate?.("flows");
  };

  const handlePreviewAction = (item) => {
    if (item._kind === "agent") handleFork(item);
    else handleUseTemplate(item);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="marketplace" onNavigate={onNavigate} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <header className="relative shrink-0 overflow-hidden border-b border-border bg-card px-4 py-8 sm:px-6 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-12 size-[400px] rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -left-12 size-[300px] rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
            <div className="mx-auto w-full max-w-2xl space-y-3">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Build faster with pre-made agents &amp; flows.
              </h1>
              <p className="text-pretty text-sm text-muted-foreground sm:text-base">
                Browse {totalUnfiltered} curated agents and automation flows. Clone, customize, and ship to production in minutes.
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Press{" "}
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                  /
                </kbd>{" "}
                anywhere to jump to search
              </p>
            </div>

            <div className="relative w-full max-w-xl shrink-0">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-5 shrink-0 -translate-y-1/2 text-muted-foreground sm:left-5"
                aria-hidden
              />
              <input
                ref={searchRef}
                id="marketplace-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents, flows, tags…"
                className="h-12 w-full rounded-full border border-border bg-background pl-12 pr-12 text-base shadow-md outline-none ring-offset-background transition-shadow focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/35 sm:h-14 sm:pl-14 sm:pr-14"
                aria-label="Search marketplace"
                autoComplete="off"
                enterKeyHint="search"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-4"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            id="marketplace-results"
            className="flex min-w-0 flex-1 flex-col overflow-hidden"
            aria-label="Marketplace search results"
          >
            <div className="flex-1 overflow-y-auto scroll-smooth">
              <div className="mx-auto max-w-6xl px-4 py-5 pb-20 md:px-5">
                <MarketplaceToolbar
                  contentType={contentType}
                  setContentType={setContentType}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />

                <div className="flex flex-wrap items-center gap-2 py-3">
                  <span className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
                    {displayedItems.length} result{displayedItems.length !== 1 ? "s" : ""}
                  </span>

                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.onRemove}
                      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                    >
                      {chip.label}
                      <X className="size-3 text-muted-foreground" aria-hidden />
                    </button>
                  ))}

                  {hasFilters && activeChips.length > 1 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="min-h-9 text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {displayedItems.length === 0 && (
                  <div
                    className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center"
                    role="status"
                  >
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                      <Search className="size-7 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-foreground">
                        {searchQuery ? `No matches for "${searchQuery}"` : "Nothing matches these filters"}
                      </p>
                      <p className="max-w-sm text-sm text-muted-foreground">
                        {searchQuery
                          ? "Try another keyword or clear the search box."
                          : "Adjust content type or category, or reset filters."}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="min-h-10" onClick={clearAll}>
                        Reset all filters
                      </Button>
                      {searchQuery && (
                        <Button type="button" variant="ghost" size="sm" className="min-h-10" onClick={() => setSearchQuery("")}>
                          Clear search only
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {displayedItems.length > 0 && (
                  <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch" role="list">
                    {displayedItems.map((item) => (
                      <li key={`${item._kind}-${item.id}`} className="min-h-0 h-full">
                        {item._kind === "agent" ? (
                          <AgentCard
                            agent={item}
                            isForked={forkedIds.has(String(item.id))}
                            onFork={handleFork}
                            onOpenForked={() => onNavigate?.("agents")}
                            onPreview={setPreviewItem}
                          />
                        ) : (
                          <FlowCard
                            flow={item}
                            onUseTemplate={handleUseTemplate}
                            onPreview={setPreviewItem}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <PreviewModal
        item={previewItem}
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onAction={handlePreviewAction}
        forkedIds={forkedIds}
      />

      <ForkAgentModal
        agent={forkTarget}
        open={!!forkTarget}
        onClose={() => setForkTarget(null)}
        onSuccess={handleForkSuccess}
      />

      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
