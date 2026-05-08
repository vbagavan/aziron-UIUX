import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
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
  const systemPrompt = desc
    ? `You are "${agent.name}". ${desc}\n\nStay concise and follow user instructions.`
    : `You are "${agent.name}", a helpful assistant.`;

  return {
    name: agent.name ?? "",
    description: desc || "No description added yet.",
    systemPrompt,
    provider: providerId,
    model,
    apiTokenId,
    category: "recruitment",
    useCase: "cv_processing",
    vectorSearch: false,
    ragMode: false,
    quickPrompts: [],
    knowledgeHubs: [],
    tools: [],
    toolCategoryAccessTokens: {},
  };
}

function formToAgentPatch(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    provider: PROVIDER_ID_TO_LABEL[form.provider] ?? "Anthropic",
    model: form.model,
  };
}

const KNOWLEDGE_HUBS = [
  { id: 1, name: "Product Documentation", description: "Full product manuals, release notes, and API references.", files: 142, updated: "2 days ago", usedBy: 8 },
  { id: 2, name: "Customer Support KB",    description: "Resolved tickets, FAQs, and troubleshooting guides.",     files: 87,  updated: "5 days ago", usedBy: 3 },
  { id: 3, name: "Sales Playbook",         description: "Pitch decks, competitor analysis, and pricing sheets.",    files: 34,  updated: "1 week ago", usedBy: 5 },
  { id: 4, name: "HR Policies",            description: "Employee handbook, compliance docs, and benefits guide.",  files: 21,  updated: "3 weeks ago", usedBy: 2 },
  { id: 5, name: "Engineering Wiki",       description: "Architecture diagrams, ADRs, and onboarding guides.",     files: 210, updated: "Yesterday",   usedBy: 12 },
  { id: 6, name: "Marketing Assets",       description: "Brand guidelines, copy templates, and campaign briefs.",  files: 56,  updated: "4 days ago",  usedBy: 4 },
];

/** Deterministic sample inventory for the hub files modal (prototype data). */
function buildHubFileInventory(hub) {
  const exts = [
    { ext: "pdf", type: "PDF" },
    { ext: "docx", type: "Word" },
    { ext: "md", type: "Markdown" },
    { ext: "html", type: "HTML" },
    { ext: "txt", type: "Text" },
    { ext: "csv", type: "CSV" },
  ];
  const slug = hub.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").slice(0, 28) || "hub";
  const cap = Math.min(hub.files, 80);
  const rows = [];
  for (let i = 0; i < cap; i++) {
    const spec = exts[i % exts.length];
    const sizeKb = 8 + ((hub.id * 91 + i * 47) % 8200);
    rows.push({
      id: `kh${hub.id}-f${i}`,
      name: `${slug}_${String(i + 1).padStart(3, "0")}.${spec.ext}`,
      type: spec.type,
      sizeKb,
      updated: hub.updated,
    });
  }
  return rows;
}

function formatFileSizeKb(kb) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function KnowledgeHubFilesModal({ hub, open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const selectAllRef = useRef(null);

  const inventory = hub ? buildHubFileInventory(hub) : [];
  const filtered = inventory.filter(row =>
    !query.trim() || row.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected(new Set());
    }
  }, [open, hub?.id]);

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    const allOn = filtered.length > 0 && filtered.every(r => selected.has(r.id));
    const someOn = filtered.some(r => selected.has(r.id));
    el.indeterminate = someOn && !allOn;
  }, [filtered, selected]);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const ids = filtered.map(r => r.id);
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
        <DialogHeader className="gap-1 border-b border-[#e2e8f0] px-5 py-4 dark:border-[#334155]">
          <div className="flex items-start gap-2 pr-8">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5] dark:bg-emerald-950/50">
              <FolderOpen size={18} className="text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-left text-base font-semibold leading-snug">
                Files in this Knowledge Hub
              </DialogTitle>
              <p className="truncate text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{hub.name}</p>
              <DialogDescription className="text-left text-xs leading-relaxed">
                <span className="flex items-start gap-1.5 text-[#64748b] dark:text-[#94a3b8]">
                  <Lock size={12} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  Access is limited to this hub. File names are not surfaced anywhere else in the app navigation.
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 pt-4">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search files…"
              className="h-9 pl-9 text-sm"
              aria-label="Filter files"
            />
          </div>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
            Showing {filtered.length} of {inventory.length} sample file{inventory.length === 1 ? "" : "s"}
            {hub.files > inventory.length ? ` (${hub.files} total in hub)` : ""}. Select rows to review inclusion for this agent.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-[1] bg-[#f8fafc] dark:bg-[#0f172a]">
              <tr className="border-b border-[#e2e8f0] text-left text-xs font-semibold uppercase tracking-wide text-[#64748b] dark:border-[#334155] dark:text-[#94a3b8]">
                <th className="w-10 px-2 py-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="size-3.5 rounded border-[#cbd5e1] accent-emerald-600"
                    checked={filtered.length > 0 && filtered.every(r => selected.has(r.id))}
                    onChange={toggleAllVisible}
                    aria-label="Select all visible files"
                  />
                </th>
                <th className="px-2 py-2 font-semibold">Name</th>
                <th className="hidden w-[72px] px-2 py-2 font-semibold sm:table-cell">Type</th>
                <th className="hidden w-[76px] px-2 py-2 font-semibold md:table-cell">Size</th>
                <th className="hidden w-[96px] px-2 py-2 font-semibold lg:table-cell">Indexed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] dark:border-[#1e293b] dark:hover:bg-[#1e293b]/80"
                >
                  <td className="px-2 py-2 align-middle">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-[#cbd5e1] accent-emerald-600"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className="max-w-[200px] truncate px-2 py-2 font-mono text-[12px] text-[#0f172a] dark:text-[#e2e8f0] sm:max-w-none">
                    {row.name}
                  </td>
                  <td className="hidden px-2 py-2 text-[#64748b] sm:table-cell">{row.type}</td>
                  <td className="hidden px-2 py-2 tabular-nums text-[#64748b] md:table-cell">{formatFileSizeKb(row.sizeKb)}</td>
                  <td className="hidden px-2 py-2 text-[#64748b] lg:table-cell">{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-[#94a3b8]">No files match your search.</p>
          )}
        </div>

        <DialogFooter className="mt-auto !mx-0 !mb-0 gap-2 border-t border-[#e2e8f0] bg-[#f8fafc]/90 px-5 py-3 dark:border-[#334155] dark:bg-[#0f172a]/90 sm:flex-row sm:justify-between">
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
            {selected.size > 0 ? (
              <>{selected.size} file{selected.size === 1 ? "" : "s"} selected for review</>
            ) : (
              <>No files selected</>
            )}
          </p>
          <Button type="button" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onOpenChange(false)}>
            Done
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
        <DialogHeader className="shrink-0 space-y-0 border-b border-[#e5e7eb] px-6 py-4 dark:border-[#334155]">
          <DialogTitle className="text-left text-xl font-bold text-[#0f172a] dark:text-[#fafafa]">
            {category}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select tools and save access credentials for this integration category.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left — tool checklist */}
          <div className="flex min-h-[280px] min-w-0 flex-1 flex-col border-b border-[#e5e7eb] p-6 dark:border-[#334155] md:border-b-0 md:border-r">
            <p className="mb-3 text-sm font-bold text-[#0f172a] dark:text-[#f1f5f9]">Selected tools</p>
            <div className="flex max-h-[min(52vh,420px)] flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white dark:border-[#475569] dark:bg-[#0f172a]">
              <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-2 dark:border-[#334155]">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="size-4 shrink-0 rounded border-[#2563eb] accent-[#2563eb]"
                  checked={allPendingOn}
                  onChange={toggleAllVisible}
                  aria-label="Select all tools in category"
                />
                <span className="text-xs font-medium text-[#64748b]">Select all</span>
              </div>
              <div className="overflow-y-auto">
                {list.map(tool => {
                  const checked = pendingIds.has(tool.id);
                  return (
                    <label
                      key={tool.id}
                      className={`flex cursor-pointer gap-3 border-b border-[#f3f4f6] px-3 py-3 last:border-b-0 dark:border-[#334155] ${
                        checked ? "bg-[#f8fafc] dark:bg-[#1e293b]" : "hover:bg-[#fafafa] dark:hover:bg-[#1e293b]/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border-[#2563eb] accent-[#2563eb]"
                        checked={checked}
                        onChange={() => togglePending(tool.id)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#0f172a] dark:text-[#f1f5f9]">{tool.name}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-[#64748b] dark:text-[#94a3b8]">
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
          <div className="flex w-full shrink-0 flex-col justify-start border-[#e5e7eb] p-6 dark:border-[#334155] md:w-[300px] md:border-l md:border-t-0">
            <label className="text-sm font-bold text-[#0f172a] dark:text-[#f1f5f9]">
              Access Token <span className="text-[#ef4444]">*</span>
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
              className={`mt-2 h-10 ${tokenError ? "border-[#ef4444] ring-1 ring-[#ef4444]/30" : ""}`}
            />
            <p className="mt-2 text-xs text-[#64748b] dark:text-[#94a3b8]">OAuth 2.0 access token</p>
            {tokenError && (
              <p className="mt-2 text-xs text-[#ef4444]">Access token is required when at least one tool is selected.</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[#e5e7eb] px-6 py-4 dark:border-[#334155]">
          <Button type="button" variant="ghost" className="text-[#52525b]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="bg-[#2563eb] px-5 hover:bg-[#1d4ed8]" onClick={handleSave}>
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
                state === "done"   ? "bg-[#2563eb] text-white" :
                state === "active" ? "bg-[#2563eb] text-white ring-4 ring-[#2563eb]/20" :
                                     "bg-[#e2e8f0] dark:bg-[#334155] text-[#94a3b8]"
              }`}>
                {state === "done" ? <Check size={13} /> : step.id}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap tracking-wide ${
                state === "done"   ? "text-[#2563eb]" :
                state === "active" ? "text-[#2563eb]" :
                                     "text-[#94a3b8] dark:text-[#64748b]"
              }`}>
                Step {step.id}
              </span>
              <span className={`text-[10px] whitespace-nowrap -mt-0.5 ${
                state === "active" ? "text-[#2563eb] font-medium" : "text-[#94a3b8] dark:text-[#64748b]"
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 transition-colors ${
                step.id < current ? "bg-[#2563eb]" : "bg-[#e2e8f0] dark:bg-[#334155]"
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
        <label className="text-sm font-medium text-[#374151] dark:text-[#d1d5db]">
          {label}
          {required && <span className="text-[#ef4444] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-[#94a3b8]">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-[#ef4444]">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, optional, children }) {
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] p-6 flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#0f172a] dark:text-[#f1f5f9]">{title}</h3>
          {optional && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8] border border-[#e2e8f0] dark:border-[#475569]">
              Optional
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0.5">{subtitle}</p>}
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
        ? "border-[#bfdbfe] bg-[#eff6ff] dark:bg-[#1e3a8a]/20 dark:border-[#3b82f6]/40"
        : "border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/40"
    }`}>
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}18` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{title}</p>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">{description}</p>
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
            <label className="text-sm font-medium text-[#374151] dark:text-[#d1d5db] block mb-1.5">LLM provider</label>
            <button
              type="button"
              onClick={() => setProviderOpen(o => !o)}
              className={`w-full flex items-center gap-2 h-9 px-3 rounded-lg border bg-[#f8fafc] dark:bg-[#0f172a]/50 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:border-[#93c5fd] transition-colors ${
                providerOpen ? "border-[#2563eb] ring-2 ring-[#2563eb]/15" : "border-[#e2e8f0] dark:border-[#334155]"
              }`}
            >
              <span className="font-mono text-[13px] flex-1 text-left truncate">{selectedProvider.displayId}</span>
              <ChevronDown size={13} className={`text-[#94a3b8] flex-shrink-0 transition-transform ${providerOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {providerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xl overflow-hidden"
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
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors ${
                        form.provider === p.id ? "bg-[#eff6ff] dark:bg-[#1e3a8a]/20 text-[#2563eb]" : "text-[#0f172a] dark:text-[#f1f5f9]"
                      }`}
                    >
                      <span className="font-mono text-[13px]">{p.displayId}</span>
                      <span className="text-[11px] text-[#94a3b8] ml-auto">{p.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LLM model */}
          <div ref={modRef} className="relative">
            <label className="text-sm font-medium text-[#374151] dark:text-[#d1d5db] block mb-1.5">LLM model</label>
            <button
              type="button"
              onClick={() => setModelOpen(o => !o)}
              className={`w-full flex items-center gap-2 h-9 px-3 rounded-lg border bg-[#f8fafc] dark:bg-[#0f172a]/50 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:border-[#93c5fd] transition-colors ${
                modelOpen ? "border-[#2563eb] ring-2 ring-[#2563eb]/15" : "border-[#e2e8f0] dark:border-[#334155]"
              }`}
            >
              <Bot size={13} className="text-[#94a3b8] flex-shrink-0" />
              <span className="flex-1 text-left truncate font-mono text-[13px]">{form.model || selectedProvider.models[0]}</span>
              <ChevronDown size={13} className={`text-[#94a3b8] flex-shrink-0 transition-transform ${modelOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {modelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto"
                >
                  {selectedProvider.models.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, model: m })); setModelOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors ${
                        (form.model || selectedProvider.models[0]) === m ? "bg-[#eff6ff] dark:bg-[#1e3a8a]/20 text-[#2563eb] font-medium" : "text-[#0f172a] dark:text-[#f1f5f9]"
                      }`}
                    >
                      {(form.model || selectedProvider.models[0]) === m && <Check size={12} className="text-[#2563eb] flex-shrink-0" />}
                      <span className="font-mono text-[13px] text-left">{m}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* API token */}
          <div ref={tokenRef} className="relative">
            <label className="text-sm font-medium text-[#374151] dark:text-[#d1d5db] block mb-1.5">API token</label>
            <button
              type="button"
              onClick={() => setTokenOpen(o => !o)}
              className={`w-full flex flex-col items-stretch gap-0.5 min-h-9 px-3 py-1.5 rounded-lg border bg-[#f8fafc] dark:bg-[#0f172a]/50 text-sm text-left hover:border-[#93c5fd] transition-colors ${
                tokenOpen ? "border-[#2563eb] ring-2 ring-[#2563eb]/15" : "border-[#e2e8f0] dark:border-[#334155]"
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <Key size={13} className="text-[#94a3b8] flex-shrink-0 mt-0.5" />
                {selectedToken ? (
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-[#0f172a] dark:text-[#f1f5f9] text-[13px] leading-tight truncate">{selectedToken.label}</span>
                    <span className="block font-mono text-[11px] text-[#64748b] dark:text-[#94a3b8] truncate">{selectedToken.masked}</span>
                  </span>
                ) : (
                  <span className="flex-1 text-[#94a3b8] text-[13px]">Select API token</span>
                )}
                <ChevronDown size={13} className={`text-[#94a3b8] flex-shrink-0 transition-transform ${tokenOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
            <AnimatePresence>
              {tokenOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xl overflow-hidden"
                >
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">API Tokens</p>
                  {apiTokens.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, apiTokenId: t.id })); setTokenOpen(false); }}
                      className={`w-full flex flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors border-t border-[#f1f5f9] dark:border-[#334155] first:border-t-0 ${
                        form.apiTokenId === t.id ? "bg-[#eff6ff] dark:bg-[#1e3a8a]/20" : ""
                      }`}
                    >
                      <span className={`text-sm font-semibold ${form.apiTokenId === t.id ? "text-[#2563eb]" : "text-[#0f172a] dark:text-[#f1f5f9]"}`}>{t.label}</span>
                      <span className="font-mono text-[11px] text-[#64748b] dark:text-[#94a3b8]">{t.masked}</span>
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
              className="bg-[#f1f5f9] dark:bg-[#334155]/50 border-[#e2e8f0] dark:border-[#475569] text-[#475569] dark:text-[#cbd5e1] font-mono text-[13px]"
            />
          </Field>
          <Field label="Use Case">
            <Input
              value={form.useCase ?? ""}
              onChange={e => setForm(f => ({ ...f, useCase: e.target.value }))}
              className="bg-[#f1f5f9] dark:bg-[#334155]/50 border-[#e2e8f0] dark:border-[#475569] text-[#475569] dark:text-[#cbd5e1] font-mono text-[13px]"
            />
          </Field>
        </div>
        <ToggleCard
          icon={Database}
          iconColor="#6366f1"
          title="Vector Search"
          description="Enable semantic similarity search over attached knowledge bases."
          checked={form.vectorSearch ?? false}
          onChange={v => setForm(f => ({ ...f, vectorSearch: v }))}
        />
        <ToggleCard
          icon={FileText}
          iconColor="#0ea5e9"
          title="RAG Mode"
          description="Retrieve and augment responses with context from the knowledge hub."
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
              className="size-8 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-[#fee2e2] text-[#94a3b8] hover:text-[#dc2626] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, quickPrompts: [...(f.quickPrompts ?? []), ""] }))}
          className="flex items-center gap-2 px-4 h-9 rounded-lg border border-dashed border-[#93c5fd] text-[#2563eb] text-sm font-medium hover:bg-[#eff6ff] transition-colors self-start"
        >
          <Plus size={14} />
          Add Quick Prompt
        </button>
      </SectionCard>
    </div>
  );
}

// ─── Step 2 – Attach Knowledge Hub ───────────────────────────────────────────

function KnowledgeCard({ hub, selected, onToggle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      onClick={() => onToggle(hub.id)}
      className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border cursor-pointer transition-all p-4 ${
        selected
          ? "border-[#6ee7b7] bg-[#f0fdf4] dark:border-emerald-700 dark:bg-emerald-950/35"
          : "border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] hover:border-[#a7f3d0] dark:hover:border-emerald-800 hover:shadow-sm"
      }`}
    >
      {/* Selected: top-left corner check */}
      {selected && (
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-br-lg bg-emerald-500 shadow-sm"
          aria-hidden
        >
          <Check size={14} className="text-white" strokeWidth={2.75} />
        </div>
      )}

      {/* 3-dot menu */}
      <div ref={menuRef} className="absolute top-2.5 right-2.5 z-20" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className={`size-7 flex items-center justify-center rounded-lg transition-colors ${
            selected
              ? "hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 text-[#64748b] dark:text-[#94a3b8]"
              : "hover:bg-[#f1f5f9] dark:hover:bg-[#334155] text-[#94a3b8]"
          }`}
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
              className="absolute right-0 top-8 z-50 min-w-[200px] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xl overflow-hidden"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[#374151] hover:bg-[#f8fafc] dark:text-[#d1d5db] dark:hover:bg-[#334155] transition-colors"
                onClick={() => {
                  setFilesModalOpen(true);
                  setMenuOpen(false);
                }}
              >
                <FolderOpen size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                View files in hub
              </button>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f8fafc] dark:text-[#d1d5db] dark:hover:bg-[#334155] transition-colors">
                <Pencil size={13} className="text-[#94a3b8]" />Edit hub
              </button>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f8fafc] dark:text-[#d1d5db] dark:hover:bg-[#334155] transition-colors">
                <Link2 size={13} className="text-[#94a3b8]" />View linked agents
              </button>
              <div className="h-px bg-[#f1f5f9] dark:bg-[#334155] mx-2" />
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
                <Trash2 size={13} />Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className={`flex items-start gap-3 pr-11 ${selected ? "min-h-[3.25rem]" : ""}`}>
        <div
          className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            selected
              ? "bg-[#e5e7eb] dark:bg-[#374151]"
              : "bg-[#dbeafe] dark:bg-[#1e3a8a]/40"
          }`}
        >
          <Database
            size={16}
            className={selected ? "text-[#171717] dark:text-neutral-200" : "text-[#2563eb]"}
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{hub.name}</p>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5 leading-4">{hub.description}</p>
        </div>
      </div>

      {/* Divider — full width inside padded card */}
      <div
        className={`-mx-4 h-px shrink-0 ${
          selected ? "bg-[#d1fae5]/90 dark:bg-emerald-800/50" : "bg-[#f1f5f9] dark:bg-[#334155]"
        }`}
      />

      {/* Footer — usage meta + file count */}
      <div className="flex flex-col gap-2 text-xs text-[#64748b] dark:text-[#94a3b8] sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 min-w-0 leading-snug">
          <span>Updated {hub.updated}</span>
          <span>
            Used by{" "}
            <span className="font-semibold text-[#475569] dark:text-[#cbd5e1]">{hub.usedBy}</span>{" "}
            {hub.usedBy === 1 ? "Agent" : "Agents"}
          </span>
        </div>
        <div className="flex justify-end shrink-0 tabular-nums">
          <span>
            <span className="font-semibold text-[#475569] dark:text-[#cbd5e1]">{hub.files}</span>{" "}
            {hub.files === 1 ? "File" : "Files"}
          </span>
        </div>
      </div>

      <KnowledgeHubFilesModal hub={hub} open={filesModalOpen} onOpenChange={setFilesModalOpen} />
    </div>
  );
}

function Step2({ form, setForm }) {
  const [search, setSearch] = useState("");
  const ragRequired = form.ragMode;
  const selected = form.knowledgeHubs ?? [];
  const filtered = KNOWLEDGE_HUBS.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">
          Attach Knowledge Hub
          <span className="ml-2 text-sm font-normal text-[#64748b] dark:text-[#94a3b8]">
            ({ragRequired ? "Required" : "Optional"})
          </span>
        </h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
          Connect knowledge bases to let your agent retrieve relevant context.
        </p>
      </div>

      {/* RAG required banner */}
      {ragRequired && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#eff6ff] dark:bg-[#1e3a8a]/20 border border-[#bfdbfe] dark:border-[#3b82f6]/40">
          <AlertCircle size={15} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#1e40af] dark:text-[#93c5fd]">
            <span className="font-semibold">Retrieval mode is enabled.</span> Attach at least one knowledge base to enable retrieval-based responses.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge hubs…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-sm text-[#0f172a] dark:text-[#f1f5f9] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#93c5fd] focus:ring-2 focus:ring-[#2563eb]/10 transition-colors"
          />
        </div>
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:border-[#93c5fd] hover:bg-[#f8fafc] transition-colors flex-shrink-0">
          <Plus size={14} />
          Add Knowledge Hub
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(hub => (
          <KnowledgeCard
            key={hub.id}
            hub={hub}
            selected={selected.includes(hub.id)}
            onToggle={id => {
              setForm(f => ({
                ...f,
                knowledgeHubs: (f.knowledgeHubs ?? []).includes(id)
                  ? (f.knowledgeHubs ?? []).filter(x => x !== id)
                  : [...(f.knowledgeHubs ?? []), id],
              }));
            }}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-10 text-[#94a3b8] text-sm">
            No knowledge hubs match your search.
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-[#2563eb]"
        >
          {selected.length} knowledge hub{selected.length !== 1 ? "s" : ""} selected
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
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Tools Configuration</h2>
        <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">
          Use + (or the pencil when attached) to configure tools and credentials. Enabled tools are indicated on each category card.
        </p>
        <p className="mt-2 text-xs text-[#94a3b8] dark:text-[#64748b]">
          Catalog: {TOOLS.length} of {AGENT_TOOLS_METADATA.total_tools} integrations in library ·{" "}
          {AGENT_TOOLS_METADATA.categories.length} category lanes (data, filesystem, communication, …)
        </p>
      </div>

      {enabledTools.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f4f4f5] px-4 py-2.5 dark:border-[#475569] dark:bg-[#1e293b]/80"
        >
          <Wrench size={14} className="text-[#52525b] dark:text-[#a1a1aa]" />
          <p className="text-sm text-[#52525b] dark:text-[#d4d4d8]">
            <span className="font-semibold text-[#18181b] dark:text-[#f4f4f5]">{enabledTools.length}</span>
            {" "}tool{enabledTools.length !== 1 ? "s" : ""} attached
          </p>
        </motion.div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-[#0f172a] dark:text-[#f1f5f9]">Tool library</h3>
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
                    ? "border-[#6ee7b7] bg-[#f0fdf4] dark:border-emerald-700 dark:bg-emerald-950/35"
                    : "border-[#e5e7eb] bg-white dark:border-[#334155] dark:bg-[#1e293b]"
                }`}
              >
                {hasSome && (
                  <div
                    className="pointer-events-none absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-br-lg bg-emerald-500 shadow-sm"
                    aria-hidden
                  >
                    <Check size={14} className="text-white" strokeWidth={2.75} />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 items-center gap-3 pl-1 text-left">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold tabular-nums ${
                      hasSome
                        ? "bg-[#e5e7eb] text-[#171717] dark:bg-[#374151] dark:text-neutral-200"
                        : "bg-[#f4f4f5] text-[#18181b] dark:bg-[#3f3f46] dark:text-[#fafafa]"
                    }`}
                  >
                    {letter}
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="text-[15px] font-bold leading-tight text-[#0f172a] dark:text-[#fafafa]">{category}</p>
                    <p className="mt-0.5 text-sm text-[#6b7280] dark:text-[#9ca3af]">
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
                        className="rounded-lg p-2 text-[#64748b] transition-colors hover:bg-emerald-100/80 dark:text-[#94a3b8] dark:hover:bg-emerald-900/30"
                        aria-label={`Edit ${category} tools`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => clearCategory(category)}
                        className="rounded-lg p-2 text-[#94a3b8] transition-colors hover:bg-[#fee2e2] hover:text-[#dc2626] dark:hover:bg-red-950/40"
                        aria-label={`Remove all ${category} tools`}
                      >
                        <X size={16} className="text-[#ef4444]" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenCategory(category)}
                      className="rounded-lg p-2 text-[#a1a1aa] transition-colors hover:bg-[#f4f4f5] dark:text-[#71717a] dark:hover:bg-[#334155]"
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
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[#94a3b8] dark:text-[#64748b] sm:w-40">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm text-[#0f172a] dark:text-[#f1f5f9]">{children}</dd>
    </div>
  );
}

function StepSummary({ form }) {
  const selectedProvider = PROVIDERS.find(p => p.id === form.provider) ?? PROVIDERS[0];
  const tokList = API_TOKENS_BY_PROVIDER[selectedProvider.id] ?? [];
  const apiTokenLabel = tokList.find(t => t.id === form.apiTokenId)?.label ?? (
    form.apiTokenId ? "Selected" : "Not selected"
  );

  const hubNames = (form.knowledgeHubs ?? [])
    .map(id => KNOWLEDGE_HUBS.find(h => h.id === id)?.name)
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
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Summary</h2>
        <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">
          Review everything below. When you are ready, choose <span className="font-semibold text-[#0f172a] dark:text-[#e2e8f0]">Create Agent</span> to deploy.
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
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 dark:border-[#334155] dark:bg-[#0f172a]/50">
          <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-[#374151] dark:text-[#d1d5db]">
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
          <ul className="list-inside list-disc space-y-1 text-sm text-[#374151] dark:text-[#d1d5db]">
            {prompts.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Knowledge Hubs" subtitle="Knowledge bases attached to this agent.">
        {hubNames.length > 0 ? (
          <ul className="space-y-2">
            {hubNames.map(name => (
              <li
                key={name}
                className="flex items-center gap-2 text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]"
              >
                <Database size={14} className="shrink-0 text-[#2563eb]" />
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#94a3b8]">None attached.</p>
        )}
      </SectionCard>

      <SectionCard title="Tools" subtitle="Enabled integrations and saved credentials.">
        {enabledIds.length === 0 ? (
          <p className="text-sm text-[#94a3b8]">No tools enabled.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(toolsGrouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cat, names]) => (
                <div key={cat}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">{cat}</p>
                  <ul className="space-y-1 text-sm text-[#0f172a] dark:text-[#f1f5f9]">
                    {names.sort().map(n => (
                      <li key={n} className="flex items-center gap-2">
                        <Wrench size={13} className="text-[#94a3b8]" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {categoriesWithSecrets.length > 0 && (
              <div className="border-t border-[#e2e8f0] pt-4 dark:border-[#334155]">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">Credentials saved</p>
                <ul className="space-y-1 text-xs text-[#64748b]">
                  {categoriesWithSecrets.map(([cat]) => (
                    <li key={cat}>
                      {cat}: <span className="font-mono text-[#94a3b8]">••••••••</span>
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
      <rect x="25" y="55" width="70" height="60" rx="12" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
      {/* Head */}
      <rect x="30" y="20" width="60" height="45" rx="10" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
      {/* Antenna */}
      <line x1="60" y1="20" x2="60" y2="8" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="6" r="4" fill="#2563eb" />
      {/* Eyes */}
      <circle cx="46" cy="38" r="7" fill="white" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="74" cy="38" r="7" fill="white" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="46" cy="38" r="3.5" fill="#2563eb" />
      <circle cx="74" cy="38" r="3.5" fill="#2563eb" />
      <circle cx="47.5" cy="36.5" r="1.5" fill="white" />
      <circle cx="75.5" cy="36.5" r="1.5" fill="white" />
      {/* Mouth */}
      <rect x="44" y="50" width="32" height="5" rx="2.5" fill="#93c5fd" />
      {/* Chest panel */}
      <rect x="37" y="68" width="46" height="28" rx="7" fill="#bfdbfe" />
      <circle cx="51" cy="82" r="5" fill="#2563eb" />
      <circle cx="69" cy="82" r="5" fill="#2563eb" />
      {/* Arms */}
      <rect x="5" y="58" width="18" height="38" rx="9" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
      <rect x="97" y="58" width="18" height="38" rx="9" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
      {/* Legs */}
      <rect x="34" y="112" width="20" height="22" rx="8" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="2" />
      <rect x="66" y="112" width="20" height="22" rx="8" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="2" />
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
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e293b] rounded-3xl border border-[#e2e8f0] dark:border-[#334155] shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Left – illustration */}
          <div className="flex flex-col items-center justify-center bg-[#f0f9ff] dark:bg-[#0f172a] p-10 md:w-56 flex-shrink-0">
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
                    className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">
                    {creatingTitle}
                  </motion.h2>
                ) : (
                  <motion.h2 key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">
                    {doneTitle}
                  </motion.h2>
                )}
              </AnimatePresence>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
                {!done ? subtitleBusy : subtitleDone}
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 rounded-full bg-[#e2e8f0] dark:bg-[#334155] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#2563eb]"
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
                          className="size-5 rounded-full bg-[#2563eb] flex items-center justify-center"
                        >
                          <Check size={11} className="text-white" />
                        </motion.div>
                      ) : isRunning ? (
                        <Loader2 size={16} className="text-[#2563eb] animate-spin" />
                      ) : (
                        <div className="size-5 rounded-full border-2 border-[#e2e8f0] dark:border-[#334155]" />
                      )}
                    </div>
                    <span className={`text-sm transition-colors ${
                      isComplete ? "text-[#374151] dark:text-[#d1d5db] font-medium"
                      : isRunning  ? "text-[#2563eb] font-semibold"
                      :              "text-[#94a3b8]"
                    }`}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>

            {!done && (
              <p className="text-xs text-[#94a3b8]">Estimated time remaining: ~{Math.max(1, Math.ceil((tasks.length - completedTasks.length) * 0.45))} seconds</p>
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
                    className="flex items-center gap-2 h-9 px-5 rounded-lg border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors"
                  >
                    {variant === "edit" ? "Done" : "Go to Agents"}
                  </button>
                  {variant === "create" && (
                    <button
                      type="button"
                      onClick={onGoToAgents}
                      className="flex items-center gap-2 h-9 px-5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium transition-colors"
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
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur border-t border-[#e2e8f0] dark:border-[#334155]">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: selection count or placeholder */}
        <div className="w-48 text-sm text-[#64748b] dark:text-[#94a3b8]" />

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors"
          >
            <X size={14} />Cancel
          </button>
          {step > 1 && !hideBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors"
            >
              <ChevronLeft size={14} />Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
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

export default function CreateAgentPage({ onNavigate, agents = [], onPatchAgent }) {
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
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar onNavigate={onNavigate} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate} title={isEdit ? "Edit Agent" : "Create Agent"} />

        {/* Scrollable main area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className={`flex flex-col min-h-full ${isCreatingStep ? "" : "pb-20"}`}>
            {/* Header section */}
            {!isCreatingStep && (
              <div className="sticky top-0 z-20 bg-[#f8fafc]/95 dark:bg-[#0f172a]/95 backdrop-blur border-b border-[#e2e8f0] dark:border-[#334155]">
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
                        if (isEdit && agentRecord) {
                          onPatchAgent?.(agentRecord.id, formToAgentPatch(formRef.current));
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
