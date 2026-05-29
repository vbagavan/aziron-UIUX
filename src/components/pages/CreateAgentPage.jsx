import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
import {
  ArrowRight, ChevronLeft, X, Plus, Search, Bot,
  Check, Database, Wrench, Lock, Key, ChevronDown,
  FileText, AlertCircle,
  Loader2, MoreVertical, Pencil, Trash2, Link2, ToggleLeft,
  FolderOpen,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TOOLS, AGENT_TOOLS_METADATA } from "@/data/agentToolsCatalog";
import { buildHubFileInventory, formatFileSizeKb } from "@/data/knowledgeHubs";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { useAgents } from "@/context/AgentsContext";
import { agentsUsingHub } from "@/lib/agentKnowledge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { KnowledgeHubCreateDialog } from "@/components/features/knowledge/KnowledgeHubCreateDialog";
import { paginateSlice } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const HUB_FILES_MODAL_PAGE_SIZE = 8;

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Agent Details" },
  { id: 2, label: "Attach Knowledge" },
  { id: 3, label: "Tools Configurations" },
  { id: 4, label: "Summary" },
];

const PROVIDERS = [
  { id: "openai",    name: "OpenAI",    displayId: "openai",    models: ["GPT-3.5 Turbo", "GPT-4", "GPT-4o", "GPT-4.1", "GPT-4o mini"] },
  { id: "anthropic", name: "Anthropic", displayId: "anthropic", models: ["claude-sonnet-4-6", "Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Haiku"] },
  { id: "google",    name: "Google",    displayId: "google",    models: ["Gemini 1.5 Flash", "Gemini 1.5 Pro", "Gemini Ultra"] },
];

const API_TOKENS_BY_PROVIDER = {
  anthropic: [
    { id: "anthropic-default", label: "Anthropic Default", masked: "sk-ant-api03-cg2...aqAA" },
    { id: "anthropic-tier1",   label: "Anthropic Tier 1", masked: "sk-ant-api03-gqw...LgAA" },
    { id: "anthropic-rnd",     label: "Anthropic R&D",    masked: "sk-ant-api03-Mz4...jwAA" },
  ],
  openai: [
    { id: "openai-default", label: "OpenAI Default", masked: "sk-••••••••••••••••3d7f" },
  ],
  google: [
    { id: "google-default", label: "Google AI Default", masked: "AIza••••••••••••••••5k1p" },
  ],
};

const PROVIDER_ID_TO_LABEL = { openai: "OpenAI", anthropic: "Anthropic", google: "Google" };

function providerLabelToId(label) {
  const s = (label || "").toLowerCase();
  if (s.includes("openai")) return "openai";
  if (s.includes("google")) return "google";
  return "anthropic";
}

/** Maps catalog agent row → wizard form (edit flow). */
function listAgentToForm(agent) {
  const providerId = providerLabelToId(agent.provider);
  const p = PROVIDERS.find((x) => x.id === providerId) ?? PROVIDERS[0];
  let model = p.models[0];
  if (agent.model) {
    const exact = p.models.find((m) => m === agent.model);
    if (exact) model = exact;
    else {
      const loose = p.models.find(
        (m) =>
          agent.model.includes(m) ||
          m.split(/[\s-]/).some((part) => part.length > 2 && agent.model.includes(part)),
      );
      if (loose) model = loose;
    }
  }
  const tokens = API_TOKENS_BY_PROVIDER[providerId] ?? [];
  const apiTokenId = tokens[0]?.id ?? "";
  const desc = (agent.description || "").trim();
  const systemPrompt =
    agent.systemPrompt?.trim() ||
    (desc
      ? `You are "${agent.name}". ${desc}\n\nStay concise and follow user instructions.`
      : `You are "${agent.name}", a helpful assistant.`);

  return {
    name: agent.name ?? "",
    description: desc || "No description added yet.",
    systemPrompt,
    provider: providerId,
    model,
    apiTokenId: agent.apiTokenId ?? apiTokenId,
    category: agent.category ?? "recruitment",
    useCase: agent.useCase ?? "cv_processing",
    vectorSearch: agent.vectorSearch === true,
    ragMode: agent.ragMode === true,
    quickPrompts: agent.quickPrompts ?? [],
    knowledgeHubs: [...(agent.knowledgeHubs ?? [])],
    knowledgeHubFileIds: { ...(agent.knowledgeHubFileIds ?? {}) },
    tools: [...(agent.tools ?? [])],
    toolCategoryAccessTokens: { ...(agent.toolCategoryAccessTokens ?? {}) },
  };
}

function formToAgentPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    systemPrompt: form.systemPrompt?.trim() ?? "",
    provider: PROVIDER_ID_TO_LABEL[form.provider] ?? "Anthropic",
    model: form.model,
    apiTokenId: form.apiTokenId,
    category: form.category,
    useCase: form.useCase,
    vectorSearch: !!form.vectorSearch,
    ragMode: !!form.ragMode,
    quickPrompts: form.quickPrompts ?? [],
    knowledgeHubs: [...(form.knowledgeHubs ?? [])],
    knowledgeHubFileIds: { ...(form.knowledgeHubFileIds ?? {}) },
    tools: [...(form.tools ?? [])],
    toolCategoryAccessTokens: { ...(form.toolCategoryAccessTokens ?? {}) },
  };
}

function KnowledgeHubFilesModal({
  hub,
  open,
  onOpenChange,
  initialFileIds = [],
  onSaveFileScope,
}) {
  const [query, setQuery] = useState("");
  const [filePage, setFilePage] = useState(1);
  const [selected, setSelected] = useState(() => new Set(initialFileIds));
  const selectAllRef = useRef(null);

  const inventoryPack = hub ? buildHubFileInventory(hub) : null;
  const inventory = inventoryPack?.allFiles ?? [];
  const filtered = useMemo(
    () =>
      inventory.filter(
        row =>
          (row.source === "user" ||
            (row.source === "cloud" &&
              (row.syncStatus === "stored" || row.localBlobId))) &&
          (!query.trim() ||
            row.name.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [inventory, query],
  );

  const scopeKey = (initialFileIds ?? []).join("|");

  useEffect(() => {
    if (open) {
      setSelected(new Set(initialFileIds));
    }
  }, [open, hub?.id, scopeKey]);

  const filePagination = useMemo(
    () => paginateSlice(filtered, filePage, HUB_FILES_MODAL_PAGE_SIZE),
    [filtered, filePage],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilePage(1);
      setSelected(new Set());
    }
  }, [open, hub?.id]);

  useEffect(() => {
    setFilePage(1);
  }, [query, hub?.id]);

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    const pageRows = filePagination.items;
    const allOn = pageRows.length > 0 && pageRows.every(r => selected.has(r.id));
    const someOn = pageRows.some(r => selected.has(r.id));
    el.indeterminate = someOn && !allOn;
  }, [filePagination.items, selected]);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    const ids = filePagination.items.map(r => r.id);
    const allOn = ids.length > 0 && ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allOn) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }

  if (!hub) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="gap-1 border-b border-border px-5 py-4 dark:border-border">
          <div className="flex items-start gap-2 pr-8">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-left text-base font-semibold leading-snug">
                Files in this Knowledge Hub
              </DialogTitle>
              <p className="truncate text-sm font-medium text-foreground dark:text-foreground">{hub.name}</p>
              <DialogDescription className="text-left text-xs leading-relaxed">
                <span className="flex items-start gap-1.5 text-muted-foreground dark:text-muted-foreground">
                  <Lock size={12} className="mt-0.5 shrink-0 text-primary" />
                  Access is limited to this hub. File names are not surfaced anywhere else in the app navigation.
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 pt-4">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search files…"
              className="h-9 pl-9 text-sm"
              aria-label="Filter files"
            />
          </div>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            {filtered.length} uploaded file{filtered.length === 1 ? "" : "s"}
            {inventoryPack?.hasDemoRows
              ? ` (${inventoryPack.totalReported} total in hub includes demo data not shown here)`
              : ""}
            {query.trim() ? " match your search" : ""}. Select files this agent may retrieve from; leave none selected to use the full hub.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-2 pb-2">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-[1] bg-background">
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:border-border dark:text-muted-foreground">
                  <th className="w-10 px-2 py-2">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="size-3.5 rounded border-border accent-primary"
                      checked={
                        filePagination.items.length > 0 &&
                        filePagination.items.every(r => selected.has(r.id))
                      }
                      onChange={toggleAllOnPage}
                      aria-label="Select all files on this page"
                    />
                  </th>
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="hidden w-[72px] px-2 py-2 font-semibold sm:table-cell">Type</th>
                  <th className="hidden w-[76px] px-2 py-2 font-semibold md:table-cell">Size</th>
                  <th className="hidden w-[96px] px-2 py-2 font-semibold lg:table-cell">Indexed</th>
                </tr>
              </thead>
              <tbody>
                {filePagination.items.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-border transition-colors hover:bg-muted dark:border-border dark:hover:bg-muted/80"
                  >
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-border accent-primary"
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="max-w-[200px] truncate px-2 py-2 font-mono text-[12px] text-foreground dark:text-foreground sm:max-w-none">
                      {row.name}
                    </td>
                    <td className="hidden px-2 py-2 text-muted-foreground sm:table-cell">{row.type}</td>
                    <td className="hidden px-2 py-2 tabular-nums text-muted-foreground md:table-cell">{formatFileSizeKb(row.sizeKb)}</td>
                    <td className="hidden px-2 py-2 text-muted-foreground lg:table-cell">{row.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {inventoryPack?.userFiles?.length === 0
                  ? "No uploaded files in this hub yet. Upload files on the hub page, then scope them here."
                  : "No files match your search."}
              </p>
            )}
          </div>
          {filtered.length > 0 && filePagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                {filePagination.totalItems} files · page {filePagination.currentPage} of{" "}
                {filePagination.totalPages}
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent className="gap-0.5">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault();
                        setFilePage((p) => Math.max(1, p - 1));
                      }}
                      className={cn(
                        "h-7 cursor-pointer text-xs",
                        filePagination.currentPage === 1 && "pointer-events-none opacity-40",
                      )}
                      aria-disabled={filePagination.currentPage === 1}
                      text="Prev"
                    />
                  </PaginationItem>
                  {Array.from({ length: filePagination.totalPages }, (_, i) => i + 1).map((pg) => (
                    <PaginationItem key={pg}>
                      <PaginationLink
                        isActive={pg === filePagination.currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setFilePage(pg);
                        }}
                        className="h-7 w-7 cursor-pointer text-xs"
                      >
                        {pg}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        setFilePage((p) => Math.min(filePagination.totalPages, p + 1));
                      }}
                      className={cn(
                        "h-7 cursor-pointer text-xs",
                        filePagination.currentPage === filePagination.totalPages &&
                          "pointer-events-none opacity-40",
                      )}
                      aria-disabled={filePagination.currentPage === filePagination.totalPages}
                      text="Next"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        <DialogFooter className="mt-auto !mx-0 !mb-0 gap-2 border-t border-border bg-muted/90 px-5 py-3 dark:border-border dark:bg-background/90 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            {selected.size > 0 ? (
              <>{selected.size} file{selected.size === 1 ? "" : "s"} selected for review</>
            ) : (
              <>No files selected</>
            )}
          </p>
          <Button
            type="button"
            variant="default"
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              onSaveFileScope?.(Array.from(selected));
              onOpenChange(false);
            }}
          >
            Save selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolCategoryModal({ category, tools, open, onOpenChange, form, setForm }) {
  const list = tools ?? [];
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [accessToken, setAccessToken] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const selectAllRef = useRef(null);

  useEffect(() => {
    if (!open || !category || !list.length) return;
    const enabled = form.tools ?? [];
    setPendingIds(new Set(list.filter(t => enabled.includes(t.id)).map(t => t.id)));
    setAccessToken((form.toolCategoryAccessTokens ?? {})[category] ?? "");
    setTokenError(false);
    // Re-sync when modal opens for this category; omit `list` ref equality so parent re-renders don’t reset drafts.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only when shell changes
  }, [open, category]);

  function togglePending(id) {
    setPendingIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const allIds = list.map(t => t.id);
    const allOn = allIds.length > 0 && allIds.every(id => pendingIds.has(id));
    setPendingIds(prev => {
      const next = new Set(prev);
      if (allOn) allIds.forEach(id => next.delete(id));
      else allIds.forEach(id => next.add(id));
      return next;
    });
  }

  function handleSave() {
    const idsInCategory = new Set(list.map(t => t.id));
    const other = (form.tools ?? []).filter(id => !idsInCategory.has(id));
    const nextSelected = list.filter(t => pendingIds.has(t.id)).map(t => t.id);

    if (nextSelected.length > 0 && !accessToken.trim()) {
      setTokenError(true);
      return;
    }
    setTokenError(false);

    setForm(f => ({
      ...f,
      tools: [...other, ...nextSelected],
      toolCategoryAccessTokens: {
        ...(f.toolCategoryAccessTokens ?? {}),
        [category]: nextSelected.length > 0 ? accessToken.trim() : "",
      },
    }));
    onOpenChange(false);
  }

  const allPendingOn = list.length > 0 && list.every(t => pendingIds.has(t.id));
  const somePendingOn = list.some(t => pendingIds.has(t.id));

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = somePendingOn && !allPendingOn;
  }, [somePendingOn, allPendingOn]);

  return (
    <Dialog open={open && !!category && list.length > 0} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px]"
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-border px-6 py-4 dark:border-border">
          <DialogTitle className="text-left text-xl font-bold text-foreground dark:text-background">
            {category}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select tools and save access credentials for this integration category.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left — tool checklist */}
          <div className="flex min-h-[280px] min-w-0 flex-1 flex-col border-b border-border p-6 dark:border-border md:border-b-0 md:border-r">
            <p className="mb-3 text-sm font-bold text-foreground dark:text-foreground">Selected tools</p>
            <div className="flex max-h-[min(52vh,420px)] flex-col overflow-hidden rounded-lg border border-border bg-card dark:border-border dark:bg-background">
              <div className="flex items-center gap-3 border-b border-border px-3 py-2 dark:border-border">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="size-4 shrink-0 rounded border-border accent-[#2563eb]"
                  checked={allPendingOn}
                  onChange={toggleAllVisible}
                  aria-label="Select all tools in category"
                />
                <span className="text-xs font-medium text-muted-foreground">Select all</span>
              </div>
              <div className="overflow-y-auto">
                {list.map(tool => {
                  const checked = pendingIds.has(tool.id);
                  return (
                    <label
                      key={tool.id}
                      className={`flex cursor-pointer gap-3 border-b border-border px-3 py-3 last:border-b-0 dark:border-border ${
                        checked ? "bg-muted dark:bg-card" : "hover:bg-background dark:hover:bg-muted/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border-border accent-[#2563eb]"
                        checked={checked}
                        onChange={() => togglePending(tool.id)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-foreground dark:text-foreground">{tool.name}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground dark:text-muted-foreground">
                          {tool.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — credentials */}
          <div className="flex w-full shrink-0 flex-col justify-start border-border p-6 dark:border-border md:w-[300px] md:border-l md:border-t-0">
            <label className="text-sm font-bold text-foreground dark:text-foreground">
              Access Token <span className="text-destructive">*</span>
            </label>
            <Input
              type="password"
              autoComplete="off"
              value={accessToken}
              onChange={e => {
                setAccessToken(e.target.value);
                setTokenError(false);
              }}
              placeholder="Paste token"
              className={`mt-2 h-10 ${tokenError ? "border-border ring-1 ring-[#ef4444]/30" : ""}`}
            />
            <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">OAuth 2.0 access token</p>
            {tokenError && (
              <p className="mt-2 text-xs text-destructive">Access token is required when at least one tool is selected.</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4 dark:border-border">
          <Button type="button" variant="ghost" className="text-foreground" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="bg-primary px-5 hover:bg-primary" onClick={handleSave}>
            Save configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CREATION_TASKS = [
  "Validating agent configuration",
  "Uploading system prompt",
  "Connecting model API",
  "Attaching knowledge bases",
  "Configuring tools",
  "Running initial health check",
  "Applying access permissions",
  "Registering agent endpoint",
  "Finalising deployment",
];

const UPDATE_TASKS = [
  "Validating changes",
  "Updating system prompt",
  "Syncing model configuration",
  "Refreshing knowledge attachments",
  "Updating tool configurations",
  "Applying access permissions",
  "Publishing agent revision",
];

// ─── Stepper ──────────────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl items-center">
      {STEPS.map((step, i) => {
        const state = step.id < current ? "done" : step.id === current ? "active" : "idle";
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                state === "done"   ? "bg-primary text-primary-foreground" :
                state === "active" ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                                     "bg-border dark:bg-border text-muted-foreground"
              }`}>
                {state === "done" ? <Check size={13} /> : step.id}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap tracking-wide ${
                state === "done"   ? "text-primary" :
                state === "active" ? "text-primary" :
                                     "text-muted-foreground dark:text-muted-foreground"
              }`}>
                Step {step.id}
              </span>
              <span className={`text-[10px] whitespace-nowrap -mt-0.5 ${
                state === "active" ? "text-primary font-medium" : "text-muted-foreground dark:text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 transition-colors ${
                step.id < current ? "bg-primary" : "bg-border dark:bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-muted-foreground dark:text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, optional, children }) {
  return (
    <div className="bg-card dark:bg-card rounded-2xl border border-border dark:border-border p-6 flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground dark:text-foreground">{title}</h3>
          {optional && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted dark:bg-border text-muted-foreground dark:text-muted-foreground border border-border dark:border-border">
              Optional
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Toggle card ──────────────────────────────────────────────────────────────

function ToggleCard({ icon: Icon, iconColor, title, description, checked, onChange }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
      checked
        ? "border-primary/30 bg-primary/10 dark:bg-primary/20/20 dark:border-border/40"
        : "border-border dark:border-border bg-background/40"
    }`}>
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}18` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground dark:text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Step 1 – Agent Details ───────────────────────────────────────────────────

function Step1({ form, setForm, errors }) {
  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const provRef = useRef(null);
  const modRef = useRef(null);
  const tokenRef = useRef(null);

  const selectedProvider = PROVIDERS.find(p => p.id === form.provider) ?? PROVIDERS[0];
  const apiTokens = API_TOKENS_BY_PROVIDER[selectedProvider.id] ?? API_TOKENS_BY_PROVIDER.anthropic;
  const selectedToken = apiTokens.find(t => t.id === form.apiTokenId);

  useEffect(() => {
    function handler(e) {
      if (provRef.current && !provRef.current.contains(e.target)) setProviderOpen(false);
      if (modRef.current && !modRef.current.contains(e.target)) setModelOpen(false);
      if (tokenRef.current && !tokenRef.current.contains(e.target)) setTokenOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const quickPrompts = form.quickPrompts ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      {/* Basic Info */}
      <SectionCard title="Basic Information" subtitle="Name your agent and describe what it does.">
        <Field label="Agent Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Customer Support Bot"
          />
        </Field>
        <Field label="Description" required error={errors.description}>
          <Textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What does this agent do, and what should it NOT do?"
            rows={3}
            className="resize-none"
          />
        </Field>
      </SectionCard>

      {/* Core Behaviour */}
      <SectionCard title="Core Behaviour" subtitle="Define the system prompt that governs your agent's behaviour.">
        <Field label="System Prompt" required error={errors.systemPrompt}>
          <Textarea
            value={form.systemPrompt}
            onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
            placeholder="You are a helpful assistant that… Any additional guidance on tone, boundaries, or constraints."
            rows={5}
            className="resize-none font-mono text-[13px]"
          />
        </Field>
      </SectionCard>

      {/* Model Configuration */}
      <SectionCard title="Model Configuration" subtitle="Choose the LLM provider, model, and API token for this agent.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* LLM provider */}
          <div ref={provRef} className="relative">
            <label className="text-sm font-medium text-muted-foreground dark:text-foreground block mb-1.5">LLM provider</label>
            <button
              type="button"
              onClick={() => setProviderOpen(o => !o)}
              className={`w-full flex items-center gap-2 h-9 px-3 rounded-lg border bg-background/50 text-sm text-foreground dark:text-foreground hover:border-info-ring transition-colors ${
                providerOpen ? "border-border ring-2 ring-primary/15" : "border-border dark:border-border"
              }`}
            >
              <span className="font-mono text-[13px] flex-1 text-left truncate">{selectedProvider.displayId}</span>
              <ChevronDown size={13} className={`text-muted-foreground flex-shrink-0 transition-transform ${providerOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {providerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-xl overflow-hidden"
                >
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const nextTokens = API_TOKENS_BY_PROVIDER[p.id] ?? [];
                        setForm(f => ({
                          ...f,
                          provider: p.id,
                          model: p.models[0],
                          apiTokenId: nextTokens.some(t => t.id === f.apiTokenId) ? f.apiTokenId : "",
                        }));
                        setProviderOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted dark:hover:bg-muted transition-colors ${
                        form.provider === p.id ? "bg-primary/10 dark:bg-primary/20/20 text-primary" : "text-foreground dark:text-foreground"
                      }`}
                    >
                      <span className="font-mono text-[13px]">{p.displayId}</span>
                      <span className="text-[11px] text-muted-foreground ml-auto">{p.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LLM model */}
          <div ref={modRef} className="relative">
            <label className="text-sm font-medium text-muted-foreground dark:text-foreground block mb-1.5">LLM model</label>
            <button
              type="button"
              onClick={() => setModelOpen(o => !o)}
              className={`w-full flex items-center gap-2 h-9 px-3 rounded-lg border bg-background/50 text-sm text-foreground dark:text-foreground hover:border-info-ring transition-colors ${
                modelOpen ? "border-border ring-2 ring-primary/15" : "border-border dark:border-border"
              }`}
            >
              <Bot size={13} className="text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-left truncate font-mono text-[13px]">{form.model || selectedProvider.models[0]}</span>
              <ChevronDown size={13} className={`text-muted-foreground flex-shrink-0 transition-transform ${modelOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {modelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto"
                >
                  {selectedProvider.models.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, model: m })); setModelOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted dark:hover:bg-muted transition-colors ${
                        (form.model || selectedProvider.models[0]) === m ? "bg-primary/10 dark:bg-primary/20/20 text-primary font-medium" : "text-foreground dark:text-foreground"
                      }`}
                    >
                      {(form.model || selectedProvider.models[0]) === m && <Check size={12} className="text-primary flex-shrink-0" />}
                      <span className="font-mono text-[13px] text-left">{m}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* API token */}
          <div ref={tokenRef} className="relative">
            <label className="text-sm font-medium text-muted-foreground dark:text-foreground block mb-1.5">API token</label>
            <button
              type="button"
              onClick={() => setTokenOpen(o => !o)}
              className={`w-full flex flex-col items-stretch gap-0.5 min-h-9 px-3 py-1.5 rounded-lg border bg-background/50 text-sm text-left hover:border-info-ring transition-colors ${
                tokenOpen ? "border-border ring-2 ring-primary/15" : "border-border dark:border-border"
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <Key size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                {selectedToken ? (
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-foreground dark:text-foreground text-[13px] leading-tight truncate">{selectedToken.label}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground dark:text-muted-foreground truncate">{selectedToken.masked}</span>
                  </span>
                ) : (
                  <span className="flex-1 text-muted-foreground text-[13px]">Select API token</span>
                )}
                <ChevronDown size={13} className={`text-muted-foreground flex-shrink-0 transition-transform ${tokenOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
            <AnimatePresence>
              {tokenOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-xl overflow-hidden"
                >
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">API Tokens</p>
                  {apiTokens.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, apiTokenId: t.id })); setTokenOpen(false); }}
                      className={`w-full flex flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-muted dark:hover:bg-muted transition-colors border-t border-border dark:border-border first:border-t-0 ${
                        form.apiTokenId === t.id ? "bg-primary/10 dark:bg-primary/20/20" : ""
                      }`}
                    >
                      <span className={`text-sm font-semibold ${form.apiTokenId === t.id ? "text-primary" : "text-foreground dark:text-foreground"}`}>{t.label}</span>
                      <span className="font-mono text-[11px] text-muted-foreground dark:text-muted-foreground">{t.masked}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SectionCard>

      {/* Advanced Configuration */}
      <SectionCard title="Advanced Configuration" subtitle="Category, use case, and retrieval settings for this agent.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Category">
            <Input
              value={form.category ?? ""}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="bg-muted dark:bg-border/50 border-border dark:border-border text-muted-foreground dark:text-muted-foreground font-mono text-[13px]"
            />
          </Field>
          <Field label="Use Case">
            <Input
              value={form.useCase ?? ""}
              onChange={e => setForm(f => ({ ...f, useCase: e.target.value }))}
              className="bg-muted dark:bg-border/50 border-border dark:border-border text-muted-foreground dark:text-muted-foreground font-mono text-[13px]"
            />
          </Field>
        </div>
        <ToggleCard
          icon={Database}
          iconColor="var(--chart-chart-3)"
          title="Vector Search"
          description="Enable semantic similarity search over attached knowledge bases."
          checked={form.vectorSearch ?? false}
          onChange={v => setForm(f => ({ ...f, vectorSearch: v }))}
        />
        <ToggleCard
          icon={FileText}
          iconColor="var(--info)"
          title="RAG Mode"
          description="Retrieve and augment responses with context from a Knowledge Hub."
          checked={form.ragMode ?? false}
          onChange={v => setForm(f => ({ ...f, ragMode: v }))}
        />
      </SectionCard>

      {/* Quick Prompts */}
      <SectionCard title="Quick Prompts" optional subtitle="Add pre-built prompt buttons that users can click to get started.">
        {quickPrompts.map((qp, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={qp}
              onChange={e => {
                const next = [...quickPrompts];
                next[i] = e.target.value;
                setForm(f => ({ ...f, quickPrompts: next }));
              }}
              placeholder={`Quick prompt ${i + 1}`}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, quickPrompts: quickPrompts.filter((_, j) => j !== i) }))}
              aria-label={`Remove quick prompt ${i + 1}`}
              className="size-8 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, quickPrompts: [...(f.quickPrompts ?? []), ""] }))}
          className="flex items-center gap-2 px-4 h-9 rounded-lg border border-dashed border-info-ring text-primary text-sm font-medium hover:bg-primary/10 transition-colors self-start"
        >
          <Plus size={14} />
          Add Quick Prompt
        </button>
      </SectionCard>
    </div>
  );
}

// ─── Step 2 – Attach Knowledge Hub ───────────────────────────────────────────

function KnowledgeCard({ hub, selected, onToggle, form, setForm, canDeleteHub }) {
  const navigate = useNavigate();
  const { deleteHub } = useKnowledgeHubs();
  const { agents } = useAgents();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [linkedOpen, setLinkedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef(null);
  const linked = agentsUsingHub(hub.id, agents);
  const scopedIds = form.knowledgeHubFileIds?.[hub.id] ?? [];

  useEffect(() => {
    function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <>
    <div
      onClick={() => onToggle(hub.id)}
      className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border cursor-pointer transition-all p-4 ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      {/* Selected: top-left corner check */}
      {selected && (
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-br-lg bg-primary shadow-sm"
          aria-hidden
        >
          <Check size={14} className="text-primary-foreground" strokeWidth={2.75} />
        </div>
      )}

      {/* 3-dot menu */}
      <div ref={menuRef} className="absolute top-2.5 right-2.5 z-20" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="size-7 flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <MoreVertical size={14} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-8 z-50 min-w-[200px] bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-xl overflow-hidden"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted dark:text-foreground dark:hover:bg-muted transition-colors"
                onClick={() => {
                  setFilesModalOpen(true);
                  setMenuOpen(false);
                }}
              >
                <FolderOpen size={13} className="shrink-0 text-primary" />
                View files in hub
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted dark:text-foreground dark:hover:bg-muted transition-colors"
                onClick={() => {
                  navigate(`/knowledge/${hub.id}`);
                  setMenuOpen(false);
                }}
              >
                <Pencil size={13} className="text-muted-foreground" />Edit hub
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted dark:text-foreground dark:hover:bg-muted transition-colors"
                onClick={() => {
                  setLinkedOpen(true);
                  setMenuOpen(false);
                }}
              >
                <Link2 size={13} className="text-muted-foreground" />
                View linked agents{linked.length > 0 ? ` (${linked.length})` : ""}
              </button>
              {canDeleteHub && (
                <>
                  <div className="h-px bg-muted dark:bg-border mx-2" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      setDeleteOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 size={13} />Delete hub
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className={`flex items-start gap-3 pr-11 ${selected ? "min-h-[3.25rem]" : ""}`}>
        <div
          className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            selected
              ? "bg-muted dark:bg-muted-foreground"
              : "bg-primary/10 dark:bg-primary/20/40"
          }`}
        >
          <Database
            size={16}
            className={selected ? "text-foreground dark:text-neutral-200" : "text-primary"}
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-foreground dark:text-foreground">{hub.name}</p>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5 leading-4">{hub.description}</p>
        </div>
      </div>

      {/* Divider — full width inside padded card */}
      <div
        className={cn("-mx-4 h-px shrink-0", selected ? "bg-primary/20" : "bg-border")}
      />

      {/* Footer — usage meta + file count */}
      <div className="flex flex-col gap-2 text-xs text-muted-foreground dark:text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 min-w-0 leading-snug">
          <span>Updated {hub.updated}</span>
          <span>
            Used by{" "}
            <span className="font-semibold text-muted-foreground dark:text-muted-foreground">{linked.length}</span>{" "}
            {linked.length === 1 ? "Agent" : "Agents"}
          </span>
        </div>
        <div className="flex justify-end shrink-0 tabular-nums">
          <span>
            <span className="font-semibold text-muted-foreground dark:text-muted-foreground">{hub.files}</span>{" "}
            {hub.files === 1 ? "File" : "Files"}
          </span>
        </div>
      </div>

      <KnowledgeHubFilesModal
        hub={hub}
        open={filesModalOpen}
        onOpenChange={setFilesModalOpen}
        initialFileIds={scopedIds}
        onSaveFileScope={(ids) =>
          setForm((f) => ({
            ...f,
            knowledgeHubFileIds: { ...(f.knowledgeHubFileIds ?? {}), [hub.id]: ids },
          }))
        }
      />

      <Dialog open={linkedOpen} onOpenChange={setLinkedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agents using {hub.name}</DialogTitle>
            <DialogDescription>
              Agents that attach this knowledge hub for retrieval.
            </DialogDescription>
          </DialogHeader>
          {linked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents are linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {linked.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/agents/${a.id}/edit`}
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => setLinkedOpen(false)}
                  >
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {deleteOpen && (
        <ConfirmDialog
          title="Delete Knowledge Hub?"
          message={
            linked.length > 0
              ? `Delete “${hub.name}”? ${linked.length} agent(s) still reference it. Remove attachments first or proceed to delete the hub.`
              : `Delete “${hub.name}”? This cannot be undone.`
          }
          confirmLabel="Delete"
          onConfirm={() => {
            deleteHub(hub.id);
            setForm((f) => ({
              ...f,
              knowledgeHubs: (f.knowledgeHubs ?? []).filter((id) => id !== hub.id),
              knowledgeHubFileIds: Object.fromEntries(
                Object.entries(f.knowledgeHubFileIds ?? {}).filter(([k]) => Number(k) !== hub.id),
              ),
            }));
            setDeleteOpen(false);
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
    </>
  );
}

function Step2({ form, setForm }) {
  const { hubs, addHub } = useKnowledgeHubs();
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const ragRequired = form.ragMode;
  const selected = form.knowledgeHubs ?? [];
  const filtered = hubs.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-foreground dark:text-foreground">
          Attach Knowledge Hub
          <span className="ml-2 text-sm font-normal text-muted-foreground dark:text-muted-foreground">
            ({ragRequired ? "Required" : "Optional"})
          </span>
        </h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
          Connect knowledge bases to let your agent retrieve relevant context.
        </p>
      </div>

      {/* RAG required banner */}
      {ragRequired && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/10 dark:bg-primary/20/20 border border-primary/30 dark:border-border/40">
          <AlertCircle size={15} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary dark:text-primary">
            <span className="font-semibold">Retrieval mode is enabled.</span> Attach at least one knowledge base to enable retrieval-based responses.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge hubs…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border dark:border-border bg-card dark:bg-card text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-info-ring focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border dark:border-border bg-card dark:bg-card text-sm font-medium text-muted-foreground dark:text-foreground hover:border-info-ring hover:bg-muted transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          Add Knowledge Hub
        </button>
      </div>

      <KnowledgeHubCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async (payload) => {
          const hub = await addHub(payload);
          setForm(f => ({
            ...f,
            knowledgeHubs: [...(f.knowledgeHubs ?? []), hub.id],
          }));
        }}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(hub => (
          <KnowledgeCard
            key={hub.id}
            hub={hub}
            form={form}
            setForm={setForm}
            canDeleteHub={can("knowledge.delete")}
            selected={selected.includes(hub.id)}
            onToggle={id => {
              setForm(f => {
                const has = (f.knowledgeHubs ?? []).includes(id);
                const nextHubs = has
                  ? (f.knowledgeHubs ?? []).filter(x => x !== id)
                  : [...(f.knowledgeHubs ?? []), id];
                const nextFileIds = { ...(f.knowledgeHubFileIds ?? {}) };
                if (has) delete nextFileIds[id];
                return { ...f, knowledgeHubs: nextHubs, knowledgeHubFileIds: nextFileIds };
              });
            }}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-10 text-muted-foreground text-sm">
            No Knowledge Hubs match your search.
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-primary"
        >
          {selected.length} Knowledge Hub{selected.length !== 1 ? "s" : ""} selected
        </motion.p>
      )}
    </div>
  );
}

// ─── Step 3 – Tools Configuration ────────────────────────────────────────────

function Step3({ form, setForm }) {
  const [openCategory, setOpenCategory] = useState(null);
  const enabledTools = form.tools ?? [];

  const grouped = useMemo(
    () =>
      TOOLS.reduce((acc, t) => {
        (acc[t.category] = acc[t.category] ?? []).push(t);
        return acc;
      }, {}),
    []
  );

  const sortedCategories = useMemo(
    () => Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)),
    [grouped]
  );

  function clearCategory(categoryName) {
    const ids = new Set((grouped[categoryName] ?? []).map(t => t.id));
    setForm(f => ({
      ...f,
      tools: (f.tools ?? []).filter(id => !ids.has(id)),
      toolCategoryAccessTokens: { ...(f.toolCategoryAccessTokens ?? {}), [categoryName]: "" },
    }));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground dark:text-foreground">Tools Configuration</h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          Use + (or the pencil when attached) to configure tools and credentials. Enabled tools are indicated on each category card.
        </p>
        <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
          Catalog: {TOOLS.length} of {AGENT_TOOLS_METADATA.total_tools} integrations in library ·{" "}
          {AGENT_TOOLS_METADATA.categories.length} category lanes (data, filesystem, communication, …)
        </p>
      </div>

      {enabledTools.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 dark:border-border dark:bg-card/80"
        >
          <Wrench size={14} className="text-foreground dark:text-foreground" />
          <p className="text-sm text-foreground dark:text-foreground">
            <span className="font-semibold text-foreground dark:text-foreground">{enabledTools.length}</span>
            {" "}tool{enabledTools.length !== 1 ? "s" : ""} attached
          </p>
        </motion.div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground dark:text-foreground">Tool library</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map(([category, tools]) => {
            const count = tools.length;
            const enabledInCategory = tools.filter(t => enabledTools.includes(t.id)).length;
            const hasSome = enabledInCategory > 0;
            const letter = category.charAt(0).toUpperCase();

            return (
              <div
                key={category}
                className={`relative flex min-h-[72px] items-center gap-2 overflow-hidden rounded-xl border px-3 py-3.5 transition-colors ${
                  hasSome
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                {hasSome && (
                  <div
                    className="pointer-events-none absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-br-lg bg-primary shadow-sm"
                    aria-hidden
                  >
                    <Check size={14} className="text-primary-foreground" strokeWidth={2.75} />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 items-center gap-3 pl-1 text-left">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold tabular-nums ${
                      hasSome
                        ? "bg-muted text-foreground dark:bg-muted-foreground dark:text-neutral-200"
                        : "bg-muted text-foreground dark:bg-card dark:text-background"
                    }`}
                  >
                    {letter}
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="text-[15px] font-bold leading-tight text-foreground dark:text-background">{category}</p>
                    <p className="mt-0.5 text-sm text-foreground dark:text-foreground">
                      {count} tool{count === 1 ? "" : "s"}
                      {hasSome ? ` · ${enabledInCategory} attached` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  {hasSome ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenCategory(category)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                        aria-label={`Edit ${category} tools`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => clearCategory(category)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive dark:hover:bg-red-950/40"
                        aria-label={`Remove all ${category} tools`}
                      >
                        <X size={16} className="text-destructive" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenCategory(category)}
                      className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted dark:text-foreground dark:hover:bg-muted"
                      aria-label={`Add tools from ${category}`}
                    >
                      <Plus strokeWidth={1.75} size={20} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ToolCategoryModal
        category={openCategory}
        tools={openCategory ? grouped[openCategory] : []}
        open={!!openCategory}
        onOpenChange={v => {
          if (!v) setOpenCategory(null);
        }}
        form={form}
        setForm={setForm}
      />
    </div>
  );
}

// ─── Step 4 – Summary ─────────────────────────────────────────────────────────

function SummaryRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground sm:w-40">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm text-foreground dark:text-foreground">{children}</dd>
    </div>
  );
}

function StepSummary({ form }) {
  const { hubs } = useKnowledgeHubs();
  const selectedProvider = PROVIDERS.find(p => p.id === form.provider) ?? PROVIDERS[0];
  const tokList = API_TOKENS_BY_PROVIDER[selectedProvider.id] ?? [];
  const apiTokenLabel = tokList.find(t => t.id === form.apiTokenId)?.label ?? (
    form.apiTokenId ? "Selected" : "Not selected"
  );

  const hubNames = (form.knowledgeHubs ?? [])
    .map(id => hubs.find(h => h.id === id)?.name)
    .filter(Boolean);

  const enabledIds = form.tools ?? [];
  const toolsGrouped = useMemo(() => {
    const m = {};
    for (const id of enabledIds) {
      const t = TOOLS.find(x => x.id === id);
      if (!t) continue;
      (m[t.category] = m[t.category] ?? []).push(t.name);
    }
    return m;
  }, [enabledIds]);

  const tokensByCat = form.toolCategoryAccessTokens ?? {};
  const categoriesWithSecrets = Object.entries(tokensByCat).filter(([, v]) => v && String(v).trim());

  const prompts = (form.quickPrompts ?? []).filter(q => q && q.trim());

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-4">
      <div>
        <h2 className="text-xl font-bold text-foreground dark:text-foreground">Summary</h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          Review everything below. When you are ready, choose <span className="font-semibold text-foreground dark:text-foreground">Create Agent</span> to deploy.
        </p>
      </div>

      <SectionCard title="Basic Information" subtitle="Identity and purpose for this agent.">
        <dl className="flex flex-col gap-4">
          <SummaryRow label="Agent name">{form.name?.trim() || "—"}</SummaryRow>
          <SummaryRow label="Description">
            <span className="whitespace-pre-wrap">{form.description?.trim() || "—"}</span>
          </SummaryRow>
        </dl>
      </SectionCard>

      <SectionCard title="Core Behaviour" subtitle="System prompt used at runtime.">
        <div className="rounded-xl border border-border bg-muted p-4 dark:border-border dark:bg-background/50">
          <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-muted-foreground dark:text-foreground">
            {form.systemPrompt?.trim() || "—"}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Model Configuration" subtitle="Provider, model, and API access.">
        <dl className="flex flex-col gap-4">
          <SummaryRow label="LLM provider">{selectedProvider.displayId}</SummaryRow>
          <SummaryRow label="LLM model">{form.model || selectedProvider.models[0]}</SummaryRow>
          <SummaryRow label="API token">{apiTokenLabel}</SummaryRow>
        </dl>
      </SectionCard>

      <SectionCard title="Advanced Configuration" subtitle="Category, use case, and retrieval.">
        <dl className="flex flex-col gap-4">
          <SummaryRow label="Category">{form.category?.trim() || "—"}</SummaryRow>
          <SummaryRow label="Use case">{form.useCase?.trim() || "—"}</SummaryRow>
          <SummaryRow label="Vector Search">{form.vectorSearch ? "Enabled" : "Off"}</SummaryRow>
          <SummaryRow label="RAG mode">{form.ragMode ? "Enabled" : "Off"}</SummaryRow>
        </dl>
      </SectionCard>

      {prompts.length > 0 && (
        <SectionCard title="Quick Prompts" optional subtitle="Starter prompts shown to users.">
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground dark:text-foreground">
            {prompts.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Knowledge Hubs" subtitle="Knowledge bases attached to this agent.">
        {(form.knowledgeHubs ?? []).length > 0 ? (
          <ul className="space-y-2">
            {(form.knowledgeHubs ?? []).map((id) => {
              const hub = hubs.find((h) => h.id === id);
              const scope = form.knowledgeHubFileIds?.[id] ?? [];
              return (
                <li
                  key={id}
                  className="flex flex-col gap-0.5 text-sm text-foreground dark:text-foreground"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Database size={14} className="shrink-0 text-primary" />
                    {hub?.name ?? `Hub #${id}`}
                  </span>
                  <span className="pl-6 text-xs text-muted-foreground">
                    {scope.length > 0
                      ? `${scope.length} file${scope.length === 1 ? "" : "s"} scoped for retrieval`
                      : "Full hub (all stored files)"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">None attached.</p>
        )}
      </SectionCard>

      <SectionCard title="Tools" subtitle="Enabled integrations and saved credentials.">
        {enabledIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tools enabled.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(toolsGrouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cat, names]) => (
                <div key={cat}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{cat}</p>
                  <ul className="space-y-1 text-sm text-foreground dark:text-foreground">
                    {names.sort().map(n => (
                      <li key={n} className="flex items-center gap-2">
                        <Wrench size={13} className="text-muted-foreground" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {categoriesWithSecrets.length > 0 && (
              <div className="border-t border-border pt-4 dark:border-border">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Credentials saved</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {categoriesWithSecrets.map(([cat]) => (
                    <li key={cat}>
                      {cat}: <span className="font-mono text-muted-foreground">••••••••</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Step 5 – Loading + Success ────────────────────────────────────────────────

function RobotIllustration() {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
      {/* Body */}
      <rect x="25" y="55" width="70" height="60" rx="12" fill="var(--primary)/10" stroke="var(--chart-chart-2)" strokeWidth="2" />
      {/* Head */}
      <rect x="30" y="20" width="60" height="45" rx="10" fill="var(--primary)/10" stroke="var(--chart-chart-2)" strokeWidth="2" />
      {/* Antenna */}
      <line x1="60" y1="20" x2="60" y2="8" stroke="var(--chart-chart-2)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="6" r="4" fill="var(--primary)" />
      {/* Eyes */}
      <circle cx="46" cy="38" r="7" fill="var(--card)" stroke="var(--chart-chart-2)" strokeWidth="1.5" />
      <circle cx="74" cy="38" r="7" fill="var(--card)" stroke="var(--chart-chart-2)" strokeWidth="1.5" />
      <circle cx="46" cy="38" r="3.5" fill="var(--primary)" />
      <circle cx="74" cy="38" r="3.5" fill="var(--primary)" />
      <circle cx="47.5" cy="36.5" r="1.5" fill="var(--card-foreground)" />
      <circle cx="75.5" cy="36.5" r="1.5" fill="var(--card-foreground)" />
      {/* Mouth */}
      <rect x="44" y="50" width="32" height="5" rx="2.5" fill="var(--chart-chart-2)" />
      {/* Chest panel */}
      <rect x="37" y="68" width="46" height="28" rx="7" fill="var(--chart-chart-2)" />
      <circle cx="51" cy="82" r="5" fill="var(--primary)" />
      <circle cx="69" cy="82" r="5" fill="var(--primary)" />
      {/* Arms */}
      <rect x="5" y="58" width="18" height="38" rx="9" fill="var(--primary)/10" stroke="var(--chart-chart-2)" strokeWidth="2" />
      <rect x="97" y="58" width="18" height="38" rx="9" fill="var(--primary)/10" stroke="var(--chart-chart-2)" strokeWidth="2" />
      {/* Legs */}
      <rect x="34" y="112" width="20" height="22" rx="8" fill="var(--chart-chart-2)" stroke="var(--chart-chart-2)" strokeWidth="2" />
      <rect x="66" y="112" width="20" height="22" rx="8" fill="var(--chart-chart-2)" stroke="var(--chart-chart-2)" strokeWidth="2" />
    </svg>
  );
}

function Step4({ form, onSuccess, onGoToAgents, tasks = CREATION_TASKS, variant = "create" }) {
  const [progress, setProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const totalMs = 4000;
    const taskInterval = totalMs / tasks.length;
    let taskIdx = 0;

    const ticker = setInterval(() => {
      setProgress(p => Math.min(p + (100 / (totalMs / 80)), 100));
    }, 80);

    const taskTimer = setInterval(() => {
      setCompletedTasks(prev => [...prev, taskIdx]);
      taskIdx++;
      if (taskIdx >= tasks.length) {
        clearInterval(taskTimer);
        clearInterval(ticker);
        setProgress(100);
        setTimeout(() => {
          setDone(true);
          onSuccess?.();
        }, 300);
      }
    }, taskInterval);

    return () => { clearInterval(ticker); clearInterval(taskTimer); };
  }, [tasks.length]);

  const creatingTitle = variant === "edit" ? "Saving Your Changes…" : "Creating Your Agent…";
  const doneTitle = variant === "edit" ? "Agent Updated" : "Agent Successfully Created!";
  const subtitleBusy =
    variant === "edit"
      ? `Applying updates to "${form.name || "Your Agent"}"…`
      : `Setting up "${form.name || "Your Agent"}"…`;
  const subtitleDone =
    variant === "edit"
      ? `"${form.name || "Your Agent"}" has been updated.`
      : `"${form.name || "Your Agent"}" is ready to go.`;

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-10 px-4">
      <div className="w-full max-w-2xl bg-card dark:bg-card rounded-3xl border border-border dark:border-border shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Left – illustration */}
          <div className="flex flex-col items-center justify-center bg-muted dark:bg-background p-10 md:w-56 flex-shrink-0">
            <motion.div
              animate={!done ? { y: [0, -6, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <RobotIllustration />
            </motion.div>
          </div>

          {/* Right – status */}
          <div className="flex flex-col gap-5 p-8 flex-1">
            <div>
              <AnimatePresence mode="wait">
                {!done ? (
                  <motion.h2 key="creating" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="text-xl font-bold text-foreground dark:text-foreground">
                    {creatingTitle}
                  </motion.h2>
                ) : (
                  <motion.h2 key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-foreground dark:text-foreground">
                    {doneTitle}
                  </motion.h2>
                )}
              </AnimatePresence>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                {!done ? subtitleBusy : subtitleDone}
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 rounded-full bg-border dark:bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            {/* Task list */}
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {tasks.map((task, i) => {
                const isComplete = completedTasks.includes(i);
                const isRunning = !isComplete && completedTasks.length === i;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="size-5 flex-shrink-0 flex items-center justify-center">
                      {isComplete ? (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="size-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check size={11} className="text-white" />
                        </motion.div>
                      ) : isRunning ? (
                        <Loader2 size={16} className="text-primary animate-spin" />
                      ) : (
                        <div className="size-5 rounded-full border-2 border-border dark:border-border" />
                      )}
                    </div>
                    <span className={`text-sm transition-colors ${
                      isComplete ? "text-muted-foreground dark:text-foreground font-medium"
                      : isRunning  ? "text-primary font-semibold"
                      :              "text-muted-foreground"
                    }`}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>

            {!done && (
              <p className="text-xs text-muted-foreground">Estimated time remaining: ~{Math.max(1, Math.ceil((tasks.length - completedTasks.length) * 0.45))} seconds</p>
            )}

            {/* CTA buttons (success only) */}
            <AnimatePresence>
              {done && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-3 pt-1"
                >
                  <button
                    type="button"
                    onClick={onGoToAgents}
                    className="flex items-center gap-2 h-9 px-5 rounded-lg border border-border dark:border-border text-sm font-medium text-muted-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
                  >
                    {variant === "edit" ? "Done" : "Go to Agents"}
                  </button>
                  {variant === "create" && (
                    <button
                      type="button"
                      onClick={onGoToAgents}
                      className="flex items-center gap-2 h-9 px-5 rounded-lg bg-primary hover:bg-primary text-primary-foreground text-sm font-medium transition-colors"
                    >
                      <Bot size={15} />
                      Try Agent
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer nav ───────────────────────────────────────────────────────────────

function FooterNav({ step, onBack, onNext, onCancel, nextLabel, nextDisabled, showFooter, hideBack }) {
  if (!showFooter) return null;
  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-card/80 dark:bg-background/80 backdrop-blur border-t border-border dark:border-border">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: selection count or placeholder */}
        <div className="w-48 text-sm text-muted-foreground dark:text-muted-foreground" />

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border dark:border-border text-sm font-medium text-muted-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            <X size={14} />Cancel
          </button>
          {step > 1 && !hideBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border dark:border-border text-sm font-medium text-muted-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <ChevronLeft size={14} />Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-semibold transition-colors"
          >
            {nextLabel}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const NEXT_LABELS = [
  "Next: Attach Knowledge",
  "Next: Tools Configuration",
  "Next: Summary",
  "Create Agent",
];

const NEXT_LABELS_EDIT = [
  "Next: Attach Knowledge",
  "Next: Tools Configuration",
  "Next: Summary",
  "Save changes",
];

export default function CreateAgentPage({ onNavigate, agents = [], onPatchAgent, onAddAgent }) {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const isEdit = agentId !== undefined && agentId !== "";
  const editNumericId = isEdit ? Number(agentId) : NaN;

  const agentRecord = useMemo(
    () =>
      isEdit && !Number.isNaN(editNumericId)
        ? agents.find((a) => a.id === editNumericId)
        : null,
    [agents, isEdit, editNumericId],
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", description: "", systemPrompt: "",
    provider: "anthropic", model: "claude-sonnet-4-6", apiTokenId: "",
    category: "recruitment", useCase: "cv_processing",
    vectorSearch: false, ragMode: false,
    quickPrompts: [],
    knowledgeHubs: [],
    knowledgeHubFileIds: {},
    tools: [],
    toolCategoryAccessTokens: {},
  });
  const formRef = useRef(form);
  formRef.current = form;

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit || !agentRecord) return;
    setForm(listAgentToForm(agentRecord));
  }, [isEdit, agentRecord?.id]);

  const goBack = () => (navigate ? navigate("/agents") : onNavigate?.("agents"));
  const scrollRef = useRef(null);

  const footerLabels = isEdit ? NEXT_LABELS_EDIT : NEXT_LABELS;

  function validate(s) {
    const e = {};
    if (s === 1) {
      if (!form.name.trim())         e.name = "Agent name is required.";
      if (!form.description.trim())  e.description = "Description is required.";
      if (!form.systemPrompt.trim()) e.systemPrompt = "System prompt is required.";
    }
    return e;
  }

  function handleNext() {
    if (step >= 5) return;
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStep(s => s - 1);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isCreatingStep = step === 5;

  if (isEdit && (Number.isNaN(editNumericId) || !agentRecord)) {
    return <Navigate to="/agents" replace />;
  }

  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar onNavigate={onNavigate} />
      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} title={isEdit ? "Edit Agent" : "Create Agent"} />

        {/* Scrollable main area */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className={`flex flex-col min-h-full ${isCreatingStep ? "" : "pb-20"}`}>
            {/* Header section */}
            {!isCreatingStep && (
              <div className="sticky top-0 z-20 bg-muted/95 dark:bg-background/95 backdrop-blur border-b border-border dark:border-border">
                <div className="max-w-5xl mx-auto px-6 py-5">
                  <StepBar current={step} />
                </div>
              </div>
            )}

            {/* Body */}
            <div className={`flex-1 ${isCreatingStep ? "flex flex-col" : "max-w-5xl mx-auto w-full px-6 py-8"}`}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
                    <Step1 form={form} setForm={setForm} errors={errors} />
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
                    <Step2 form={form} setForm={setForm} />
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
                    <Step3 form={form} setForm={setForm} />
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
                    <StepSummary form={form} />
                  </motion.div>
                )}
                {step === 5 && (
                  <motion.div key="s5" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col">
                    <Step4
                      form={form}
                      variant={isEdit ? "edit" : "create"}
                      tasks={isEdit ? UPDATE_TASKS : CREATION_TASKS}
                      onSuccess={() => {
                        const payload = formToAgentPayload(formRef.current);
                        if (isEdit && agentRecord) {
                          onPatchAgent?.(agentRecord.id, payload);
                        } else {
                          onAddAgent?.(payload);
                        }
                      }}
                      onGoToAgents={goBack}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <FooterNav
          step={step}
          showFooter={!isCreatingStep}
          onCancel={goBack}
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={footerLabels[step - 1] ?? "Continue"}
          nextDisabled={step === 2 && form.ragMode && (form.knowledgeHubs ?? []).length === 0}
          hideBack={step === 5}
        />
      </div>
    </div>
  );
}
