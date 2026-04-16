import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Smartphone,
  Wand2,
  Send,
  Sparkles,
  LayoutDashboard,
  Activity,
  TrendingUp,
  Headset,
  RefreshCw,
  Palette,
  MousePointerClick,
  MousePointer2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RichMessage from "@/components/common/RichMessage";
import PulseAnalyticsPreview from "@/components/features/pulse/PulseAnalyticsPreview";
import PulseDevOpsPreview from "@/components/features/pulse/PulseDevOpsPreview";
import PulseGrowthPreview from "@/components/features/pulse/PulseGrowthPreview";
import PulseCustomerPulsePreview from "@/components/features/pulse/PulseCustomerPulsePreview";

/** Saved in artifact `html` so reopening the editor restores the Recharts dashboard preview. */
export const PULSE_RECHART_DASHBOARD = "__PULSE_RECHART_DASHBOARD__";
/** DevOps / SRE command center (second curated live preview). */
export const PULSE_DEVOPS_DASHBOARD = "__PULSE_DEVOPS_DASHBOARD__";
/** Business growth & revenue intelligence (third curated live preview). */
export const PULSE_GROWTH_DASHBOARD = "__PULSE_GROWTH_DASHBOARD__";
/** Customer experience & support intelligence — Customer Pulse (fourth curated live preview). */
export const PULSE_CUSTOMER_PULSE_DASHBOARD = "__PULSE_CUSTOMER_PULSE_DASHBOARD__";

/** Curated live previews — starter chips, template labels, and sentinels. */
const CURATED_TEMPLATES = [
  {
    id: "insights",
    badge: "Commerce Insights",
    label: "Insights",
    prompt: "Insights",
    icon: LayoutDashboard,
    sentinel: PULSE_RECHART_DASHBOARD,
    chipClass:
      "border-blue-200/80 bg-blue-50/90 text-blue-900 hover:bg-blue-100 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-100",
  },
  {
    id: "devops",
    badge: "SRE Command Center",
    label: "SRE",
    prompt: "DevOps SRE command center",
    icon: Activity,
    sentinel: PULSE_DEVOPS_DASHBOARD,
    chipClass:
      "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
  },
  {
    id: "growth",
    badge: "Growth & Revenue",
    label: "Growth",
    prompt: "Business growth revenue dashboard",
    icon: TrendingUp,
    sentinel: PULSE_GROWTH_DASHBOARD,
    chipClass:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  {
    id: "customer",
    badge: "Customer Pulse",
    label: "CX",
    prompt: "Customer experience support intelligence",
    icon: Headset,
    sentinel: PULSE_CUSTOMER_PULSE_DASHBOARD,
    chipClass:
      "border-sky-200/80 bg-sky-50/90 text-sky-950 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-100",
  },
];

const STARTER_EXAMPLES = [
  { label: "Commerce KPIs", hint: "Commerce analytics", prompt: "Insights" },
  { label: "On-call wall", hint: "SRE & incidents", prompt: "DevOps SRE command center" },
  { label: "MRR & funnel", hint: "Growth intelligence", prompt: "Business growth revenue dashboard" },
  { label: "Ticket health", hint: "CX & support", prompt: "Customer experience support intelligence" },
];

const REFINEMENT_PROMPTS = [
  "Make it dark mode",
  "Add more spacing",
  "Use a purple color scheme",
  "Make it more minimal",
  "Add animations",
  "Mobile responsive",
];

/** Word "insights" (any case) loads the e-commerce analytics dashboard. */
const INSIGHTS_TRIGGER = /\binsights\b/i;
/** Word "devops" (any case) loads the SRE / DevOps command center dashboard. */
const DEVOPS_TRIGGER = /\bdevops\b/i;
/** Word "growth" (any case) loads the business growth & revenue intelligence dashboard. */
const GROWTH_TRIGGER = /\bgrowth\b/i;
/** "Customer pulse" or "customer experience" loads the CX & support intelligence dashboard. */
const CUSTOMER_PULSE_TRIGGER = /\b(customer pulse|customer experience)\b/i;

const GENERIC_PLACEHOLDER_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
body{margin:0;font-family:system-ui,sans-serif;background:#f8fafc;color:#334155;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;}
.card{max-width:380px;text-align:center;padding:32px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(15,23,42,.06);}
p{margin:0;line-height:1.55;font-size:14px;}
code{background:#f1f5f9;padding:3px 10px;border-radius:8px;font-size:13px;font-weight:600;}
</style></head><body><div class="card"><p style="font-weight:600;margin-bottom:10px">Starter preview</p><p>Type <code>Insights</code>, <code>DevOps</code>, <code>Growth</code>, or <code>Customer experience</code> / <code>Customer pulse</code> in the chat to open a curated live dashboard.</p></div></body></html>`;

/** Same block pattern as New Chat home (`thinking` → `generating` → `timeline`). */
const PULSE_TIMELINE_STEPS = [
  { id: 1, kind: "comment", text: "Mapping your prompt to layout, charts, and design tokens for the preview." },
  {
    id: 2,
    kind: "action",
    action: "Read",
    target: "pulse/design-tokens.json",
    meta: "Spacing · radii · chart palette",
    code: null,
  },
  {
    id: 3,
    kind: "action",
    action: "Write",
    target: "preview/LiveInsights.tsx",
    meta: null,
    code: [
      { num: 1, text: 'import { AreaChart, BarChart, PieChart, ResponsiveContainer } from "recharts";' },
      { num: 2, text: "import { KPI_CARDS, PROFIT_SERIES, DAY_ACTIVITY } from \"./pulseData\";" },
      { num: 3, text: "export function LiveInsights() { /* KPI row + charts + table */ }" },
    ],
  },
  { id: 4, kind: "pondering" },
];

const PULSE_GENERATION_BLOCKS = [
  { type: "thinking", duration: "1.2s" },
  { type: "generating" },
  { type: "timeline", duration: "2.0s", steps: PULSE_TIMELINE_STEPS },
];

function newRefId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ref-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildModelPrompt(text, refs) {
  const t = (text || "").trim();
  if (!refs?.length) return t;
  const summary = refs
    .map((r) => (r.hint ? `${r.label} — ${r.hint}` : r.label))
    .join(" · ");
  const block = `[Preview elements: ${summary}]`;
  return t ? `${block}\n${t}` : block;
}

function hintFromPreviewElement(el, root) {
  if (!(el instanceof HTMLElement) || !root?.contains(el)) return "";
  let cur = el;
  for (let depth = 0; depth < 8 && cur && cur !== root; depth++) {
    const heading = cur.querySelector?.("h2, h3");
    const h = heading?.textContent?.trim();
    if (h) return h.slice(0, 52);
    cur = cur.parentElement;
  }
  const raw = (el.textContent || "").replace(/\s+/g, " ").trim();
  return raw.slice(0, 48);
}

function shouldUseInsightsPreview(prompt, sessionActive) {
  if (INSIGHTS_TRIGGER.test(prompt)) return true;
  if (!sessionActive) return false;
  const t = prompt.trim();
  if (REFINEMENT_PROMPTS.includes(t)) return true;
  if (t.startsWith("Regenerate")) return true;
  if (t.startsWith("Change the color")) return true;
  if (t.length <= 100) return true;
  return false;
}

function shouldUseDevOpsPreview(prompt, sessionActive) {
  if (DEVOPS_TRIGGER.test(prompt)) return true;
  if (!sessionActive) return false;
  const t = prompt.trim();
  if (REFINEMENT_PROMPTS.includes(t)) return true;
  if (t.startsWith("Regenerate")) return true;
  if (t.startsWith("Change the color")) return true;
  if (t.length <= 100) return true;
  return false;
}

function shouldUseGrowthPreview(prompt, sessionActive) {
  if (GROWTH_TRIGGER.test(prompt)) return true;
  if (!sessionActive) return false;
  const t = prompt.trim();
  if (REFINEMENT_PROMPTS.includes(t)) return true;
  if (t.startsWith("Regenerate")) return true;
  if (t.startsWith("Change the color")) return true;
  if (t.length <= 100) return true;
  return false;
}

function shouldUseCustomerPulsePreview(prompt, sessionActive) {
  if (CUSTOMER_PULSE_TRIGGER.test(prompt)) return true;
  if (!sessionActive) return false;
  const t = prompt.trim();
  if (REFINEMENT_PROMPTS.includes(t)) return true;
  if (t.startsWith("Regenerate")) return true;
  if (t.startsWith("Change the color")) return true;
  if (t.length <= 100) return true;
  return false;
}

function templateMetaFromHtml(html) {
  const t = CURATED_TEMPLATES.find((x) => x.sentinel === html);
  return t ? { id: t.id, badge: t.badge } : null;
}

function isCuratedDashboard(html) {
  return (
    html === PULSE_RECHART_DASHBOARD ||
    html === PULSE_DEVOPS_DASHBOARD ||
    html === PULSE_GROWTH_DASHBOARD ||
    html === PULSE_CUSTOMER_PULSE_DASHBOARD
  );
}

export default function PulseCreateFlow({ onBack, onSave, initialPrompt = "", initialHTML = "" }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generatedHTML, setGeneratedHTML] = useState(() => {
    if (initialHTML === PULSE_RECHART_DASHBOARD) return PULSE_RECHART_DASHBOARD;
    if (initialHTML === PULSE_DEVOPS_DASHBOARD) return PULSE_DEVOPS_DASHBOARD;
    if (initialHTML === PULSE_GROWTH_DASHBOARD) return PULSE_GROWTH_DASHBOARD;
    if (initialHTML === PULSE_CUSTOMER_PULSE_DASHBOARD) return PULSE_CUSTOMER_PULSE_DASHBOARD;
    return initialHTML;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileFirst, setIsMobileFirst] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [iterationCount, setIterationCount] = useState(0);
  const [pickElementMode, setPickElementMode] = useState(false);
  /** Cursor-style preview targets shown in the composer (max 5). */
  const [elementRefs, setElementRefs] = useState([]);
  const chatEndRef = useRef(null);
  const previewSurfaceRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, isGenerating]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!pickElementMode) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPickElementMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickElementMode]);

  useEffect(() => {
    if (
      generatedHTML !== PULSE_RECHART_DASHBOARD &&
      generatedHTML !== PULSE_DEVOPS_DASHBOARD &&
      generatedHTML !== PULSE_GROWTH_DASHBOARD &&
      generatedHTML !== PULSE_CUSTOMER_PULSE_DASHBOARD
    ) {
      setPickElementMode(false);
    }
  }, [generatedHTML]);

  const handlePreviewPick = (e) => {
    if (!pickElementMode) return;
    const root = previewSurfaceRef.current;
    const el = e.target;
    if (!(el instanceof HTMLElement) || !root?.contains(el)) return;
    e.preventDefault();
    e.stopPropagation();
    const tag = el.tagName.toLowerCase();
    const label = `<${tag}>`;
    const hint = hintFromPreviewElement(el, root);
    setElementRefs((prev) => [...prev, { id: newRefId(), tag, label, hint }].slice(-5));
    setPickElementMode(false);
  };

  const generateUI = async (overridePrompt) => {
    const textInput = overridePrompt !== undefined && overridePrompt !== null ? String(overridePrompt) : prompt;
    if (!textInput.trim() && elementRefs.length === 0) return;

    const refsSnapshot = elementRefs.map((r) => ({ ...r }));
    const activePrompt = buildModelPrompt(textInput, refsSnapshot);
    const userMsg = {
      id: newRefId(),
      type: "user",
      content: textInput.trim(),
      refs: refsSnapshot.length ? refsSnapshot : undefined,
    };
    setConversationHistory((prev) => [...prev, userMsg]);
    setPrompt("");
    setElementRefs([]);
    setIsGenerating(true);

    try {
      /* ~2s: enough for timeline stagger, snappier than a long mock wait. */
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newIteration = iterationCount + 1;
      setIterationCount(newIteration);

      const wantsInsights = INSIGHTS_TRIGGER.test(activePrompt);
      const wantsDevops = DEVOPS_TRIGGER.test(activePrompt);
      const wantsGrowth = GROWTH_TRIGGER.test(activePrompt);
      const wantsCustomerPulse = CUSTOMER_PULSE_TRIGGER.test(activePrompt);

      let useDevOps = false;
      let useInsights = false;
      let useGrowth = false;
      let useCustomerPulse = false;
      if (wantsInsights) {
        useInsights = true;
      } else if (wantsDevops) {
        useDevOps = true;
      } else if (wantsGrowth) {
        useGrowth = true;
      } else if (wantsCustomerPulse) {
        useCustomerPulse = true;
      } else {
        const customerPreviewActive = generatedHTML === PULSE_CUSTOMER_PULSE_DASHBOARD;
        useCustomerPulse = shouldUseCustomerPulsePreview(activePrompt, customerPreviewActive);
        const growthPreviewActive = generatedHTML === PULSE_GROWTH_DASHBOARD;
        useGrowth = !useCustomerPulse && shouldUseGrowthPreview(activePrompt, growthPreviewActive);
        const devopsPreviewActive = generatedHTML === PULSE_DEVOPS_DASHBOARD;
        useDevOps = !useCustomerPulse && !useGrowth && shouldUseDevOpsPreview(activePrompt, devopsPreviewActive);
        const insightsPreviewActive = generatedHTML === PULSE_RECHART_DASHBOARD;
        useInsights =
          !useCustomerPulse &&
          !useGrowth &&
          !useDevOps &&
          shouldUseInsightsPreview(activePrompt, insightsPreviewActive);
      }

      let nextHtml = GENERIC_PLACEHOLDER_HTML;
      if (useCustomerPulse) nextHtml = PULSE_CUSTOMER_PULSE_DASHBOARD;
      else if (useGrowth) nextHtml = PULSE_GROWTH_DASHBOARD;
      else if (useDevOps) nextHtml = PULSE_DEVOPS_DASHBOARD;
      else if (useInsights) nextHtml = PULSE_RECHART_DASHBOARD;
      setGeneratedHTML(nextHtml);

      let aiText;
      if (useCustomerPulse) {
        aiText =
          newIteration === 1
            ? "Customer Pulse is live — tickets, SLA, response trends, sentiment, top issues, and AI assist metrics in the preview."
            : `Customer Pulse preview refreshed — v${newIteration}.`;
      } else if (useGrowth) {
        aiText =
          newIteration === 1
            ? "Growth & Revenue intelligence is live — MRR/ARR, funnel, cohorts, channels, and AI recommendations in the preview."
            : `Growth preview refreshed — v${newIteration}.`;
      } else if (useDevOps) {
        aiText =
          newIteration === 1
            ? "SRE Command Center is live — health, incidents, AI feed, logs, and auto actions in the preview."
            : `SRE preview refreshed — v${newIteration}.`;
      } else if (useInsights) {
        aiText =
          newIteration === 1
            ? "Insights dashboard is live — KPIs, Recharts charts, and product table in the preview."
            : `Insights preview refreshed — v${newIteration}.`;
      } else {
        aiText =
          newIteration === 1
            ? "Starter preview loaded. Use starters or keywords for a curated live board; other messages show a simple HTML stub (demo — no codegen)."
            : `Updated to v${newIteration}. Curated boards: include Insights, DevOps, Growth, or Customer experience in your message.`;
      }

      let templateId = null;
      if (useCustomerPulse) templateId = "customer";
      else if (useGrowth) templateId = "growth";
      else if (useDevOps) templateId = "devops";
      else if (useInsights) templateId = "insights";

      setConversationHistory((prev) => [
        ...prev,
        { id: newRefId(), type: "ai", content: aiText, iteration: newIteration, template: templateId },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const firstUser = conversationHistory.find((msg) => msg.type === "user");
    const firstPrompt = firstUser
      ? [firstUser.refs?.map((r) => r.label).join(" "), firstUser.content].filter(Boolean).join(" — ") || "Generated UI"
      : "Generated UI";
    onSave({
      title: firstPrompt.substring(0, 50) + (firstPrompt.length > 50 ? "..." : ""),
      prompt: firstPrompt,
      html:
        generatedHTML === PULSE_RECHART_DASHBOARD
          ? PULSE_RECHART_DASHBOARD
          : generatedHTML === PULSE_DEVOPS_DASHBOARD
            ? PULSE_DEVOPS_DASHBOARD
            : generatedHTML === PULSE_GROWTH_DASHBOARD
              ? PULSE_GROWTH_DASHBOARD
              : generatedHTML === PULSE_CUSTOMER_PULSE_DASHBOARD
                ? PULSE_CUSTOMER_PULSE_DASHBOARD
                : generatedHTML,
      isMobileFirst,
    });
  };

  const isEmpty = conversationHistory.length === 0;
  const previewTemplateMeta = templateMetaFromHtml(generatedHTML);

  return (
    <div className="flex h-full max-h-svh min-h-0 flex-col overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {generatedHTML && (
            <span
              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-muted-foreground dark:bg-slate-800"
              aria-live="polite"
              aria-atomic="true"
            >
              v{iterationCount}
            </span>
          )}
          {generatedHTML && (
            <Button
              type="button"
              onClick={handleSave}
              size="sm"
              title="Saves title (from first message), prompt text, preview type (curated dashboard token or HTML stub), and mobile/desktop toggle. Reopen from Pulse list."
              className="h-8 bg-blue-600 text-xs text-white hover:bg-blue-700"
            >
              Save UI
            </Button>
          )}
        </div>
      </div>

      {/* Split body — h-0 + flex-1 keeps row within viewport (avoids cross-axis blowout on Windows) */}
      <div className="flex h-0 min-h-0 min-w-0 flex-1 overflow-hidden">

        {/* ── Left Panel: Conversation (25% of row) ── */}
        <div className="flex h-full max-h-full min-h-0 w-[25%] max-w-[25%] flex-none flex-col self-stretch overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

          {/* Chat messages — min-h-0 so flex child can shrink on Windows / short viewports */}
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 space-y-4">
            {isEmpty ? (
              /* ── Empty state ── */
              <div className="flex min-h-0 flex-col gap-5 py-1">
                <div className="flex flex-col items-center px-3 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
                    <Sparkles className="size-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Describe a screen — see it on the right</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    Curated dashboards load from keywords in your message, or tap a starter below. Other prompts open a lightweight HTML placeholder (demo — not a live code generator).
                  </p>
                </div>

                <div className="px-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Starter templates</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CURATED_TEMPLATES.map(({ id, label, prompt, icon: Icon, chipClass }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => generateUI(prompt)}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${chipClass}`}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/70 shadow-sm dark:bg-slate-900/50">
                          <Icon className="size-3.5 text-slate-600 dark:text-slate-300" aria-hidden />
                        </span>
                        <span className="min-w-0 leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Try an example</p>
                  <div className="flex flex-col gap-1.5">
                    {STARTER_EXAMPLES.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => generateUI(ex.prompt)}
                        disabled={isGenerating}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-[11px] text-foreground transition-colors hover:border-blue-300 hover:bg-blue-50/80 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-700 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="font-medium text-blue-700 dark:text-blue-300">{ex.label}</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">{ex.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Conversation messages ── */
              <>
                {conversationHistory.map((message, idx) => (
                  <div key={message.id ?? `msg-${idx}`} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] ${
                      message.type === "user"
                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-2xl rounded-tl-sm"
                    } px-3.5 py-2.5`}>
                      {message.type === "ai" && message.template && (
                        <p className="mb-2 inline-flex max-w-full items-center gap-1 rounded-md border border-blue-200/80 bg-blue-50/90 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:border-blue-800/80 dark:bg-blue-950/50 dark:text-blue-200">
                          <span className="text-blue-600/80 dark:text-blue-400/90">Using</span>
                          <span className="truncate">
                            {CURATED_TEMPLATES.find((t) => t.id === message.template)?.badge ?? message.template}
                          </span>
                        </p>
                      )}
                      {message.type === "user" && message.refs?.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {message.refs.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1 rounded-md bg-white/18 px-2 py-0.5 font-mono text-[11px] font-medium text-white ring-1 ring-white/25"
                            >
                              <MousePointer2 className="size-3 shrink-0 opacity-90" aria-hidden />
                              {r.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {message.content ? (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      ) : message.type === "user" && message.refs?.length ? null : (
                        <p className="text-xs leading-relaxed opacity-80">(selection only)</p>
                      )}
                      {message.type === "ai" && message.iteration && (
                        <p className="text-[10px] mt-1.5 opacity-60">Preview updated → v{message.iteration}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking + generating + timeline (same building blocks as New Chat home). */}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="min-w-0 w-full max-w-[min(100%,24rem)] rounded-2xl rounded-tl-sm border border-slate-200/80 bg-slate-100 px-2 py-2 dark:border-slate-700/80 dark:bg-slate-800">
                      <RichMessage blocks={PULSE_GENERATION_BLOCKS} />
                    </div>
                  </div>
                )}

                {/* Refinement chips — show after first generation */}
                {!isGenerating && generatedHTML && isCuratedDashboard(generatedHTML) && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      Quick refinements (demo)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {REFINEMENT_PROMPTS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => generateUI(chip)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-muted-foreground hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 hover:border-blue-400 transition-all"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* ── Prompt input ── */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {!isEmpty && (
              <div className="mb-2.5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Templates</p>
                <div className="flex flex-wrap gap-1.5">
                  {CURATED_TEMPLATES.map(({ id, label, prompt, chipClass }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => generateUI(prompt)}
                      disabled={isGenerating}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${chipClass}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 pb-2 pt-2.5 transition-colors focus-within:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-blue-500">
              {elementRefs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {elementRefs.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex max-w-full items-center gap-1 rounded-lg bg-blue-700 py-0.5 pl-1.5 pr-0.5 text-[11px] font-medium text-white shadow-sm dark:bg-blue-600"
                    >
                      <MousePointer2 className="size-3 shrink-0 opacity-90" aria-hidden />
                      <span className="truncate font-mono">{r.label}</span>
                      <button
                        type="button"
                        onClick={() => setElementRefs((prev) => prev.filter((x) => x.id !== r.id))}
                        className="ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-white/90 hover:bg-white/15"
                        aria-label={`Remove ${r.label}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                aria-label={isEmpty ? "Describe the UI to preview" : "Message to refine the preview"}
                placeholder={
                  isEmpty
                    ? "e.g. Dark executive dashboard with KPI row and trend chart…"
                    : "Refine layout, copy, or visuals…"
                }
                className="min-h-0 flex-1 text-sm bg-transparent text-foreground placeholder-muted-foreground focus:outline-none resize-none leading-relaxed"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generateUI();
                  }
                }}
              />
              <div className="flex items-center gap-1.5 pb-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileFirst(!isMobileFirst)}
                  title={isMobileFirst ? "Use desktop width in preview" : "Use mobile width in preview"}
                  aria-label={isMobileFirst ? "Preview at mobile width, on" : "Preview at mobile width, off"}
                  aria-pressed={isMobileFirst}
                  className={`rounded-lg p-1.5 transition-colors ${isMobileFirst ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                >
                  <Smartphone className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => generateUI()}
                  disabled={(!prompt.trim() && elementRefs.length === 0) || isGenerating}
                  aria-label={isGenerating ? "Sending" : "Send message"}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                >
                  {isGenerating ? (
                    <div
                      className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                      aria-hidden
                    />
                  ) : (
                    <Send className="size-3.5 text-white" aria-hidden />
                  )}
                </button>
              </div>
              </div>
            </div>
            <p className="mt-1.5 px-1 text-[10px] leading-snug text-muted-foreground">
              {isMobileFirst ? "Mobile preview · " : ""}
              {isCuratedDashboard(generatedHTML) ? "Select: preview toolbar → Select · " : ""}
              {!isEmpty ? <span className="mr-1">Templates row above · </span> : null}
              <span className="whitespace-nowrap">Enter send · Shift+Enter newline</span>
            </p>
          </div>
        </div>

        {/* ── Right Panel: Live Preview (remaining ~75%) ── */}
        <div className="flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden bg-slate-100 dark:bg-slate-950">
          {/* Preview toolbar */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex shrink-0 gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-1 flex min-w-0 flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
                {previewTemplateMeta ? (
                  <span
                    className="truncate text-[10px] font-semibold text-blue-700 dark:text-blue-300"
                    title={previewTemplateMeta.badge}
                  >
                    {previewTemplateMeta.badge}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(generatedHTML === PULSE_RECHART_DASHBOARD ||
                generatedHTML === PULSE_DEVOPS_DASHBOARD ||
                generatedHTML === PULSE_GROWTH_DASHBOARD ||
                generatedHTML === PULSE_CUSTOMER_PULSE_DASHBOARD) && (
                <button
                  type="button"
                  onClick={() => setPickElementMode((v) => !v)}
                  aria-pressed={pickElementMode}
                  aria-label={
                    pickElementMode
                      ? "Exit preview element selection"
                      : "Select a preview element to attach to your message"
                  }
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    pickElementMode
                      ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                      : "text-slate-500 hover:bg-slate-100 hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                  title="Click an element in the preview to add a reference chip to your prompt"
                >
                  <MousePointerClick className="size-3.5 shrink-0" aria-hidden />
                  Select
                </button>
              )}
              {generatedHTML && (
                <>
                  <button
                    type="button"
                    onClick={() => generateUI("Regenerate with the same requirements")}
                    aria-label="Re-run preview (demo — same rules, new pass)"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                    title="Re-run preview (demo)"
                  >
                    <RefreshCw className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => generateUI("Change the color scheme and visual style")}
                    aria-label="Shuffle style prompt (demo — may not visibly change layout)"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                    title="Shuffle style (demo)"
                  >
                    <Palette className="size-3.5" aria-hidden />
                  </button>
                </>
              )}
              {isMobileFirst ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium">
                  Mobile
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground font-medium">
                  Desktop
                </span>
              )}
            </div>
          </div>

          {/* Preview content — h-0 + flex-1 bounds scroll area to viewport, not dashboard intrinsic height */}
          <div
            className="flex h-0 min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
            role="region"
            aria-label="Live preview"
          >
            <div
              className={`flex min-h-full w-full flex-1 justify-center p-6 ${
                generatedHTML ? "items-start" : "items-center"
              }`}
            >
            {generatedHTML === PULSE_RECHART_DASHBOARD ? (
              <div
                ref={previewSurfaceRef}
                onClickCapture={handlePreviewPick}
                className={`relative w-full overflow-hidden rounded-xl shadow-xl transition-all motion-safe:duration-200 ${
                  isMobileFirst ? "max-w-[390px]" : "max-w-6xl"
                } ${pickElementMode ? "cursor-crosshair ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-950" : ""}`}
              >
                {pickElementMode && (
                  <div className="pointer-events-none absolute inset-0 z-[1] flex items-start justify-center p-2">
                    <span className="rounded-full bg-blue-600/95 px-3 py-1 text-[11px] font-medium text-white shadow-lg">
                      Click an element in the preview to attach it to your prompt
                    </span>
                  </div>
                )}
                <PulseAnalyticsPreview compact={isMobileFirst} />
              </div>
            ) : generatedHTML === PULSE_DEVOPS_DASHBOARD ? (
              <div
                ref={previewSurfaceRef}
                onClickCapture={handlePreviewPick}
                className={`relative w-full overflow-hidden rounded-xl shadow-xl transition-all motion-safe:duration-200 ${
                  isMobileFirst ? "max-w-[390px]" : "max-w-6xl"
                } ${pickElementMode ? "cursor-crosshair ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-950" : ""}`}
              >
                {pickElementMode && (
                  <div className="pointer-events-none absolute inset-0 z-[1] flex items-start justify-center p-2">
                    <span className="rounded-full bg-blue-600/95 px-3 py-1 text-[11px] font-medium text-white shadow-lg">
                      Click an element in the preview to attach it to your prompt
                    </span>
                  </div>
                )}
                <PulseDevOpsPreview compact={isMobileFirst} />
              </div>
            ) : generatedHTML === PULSE_GROWTH_DASHBOARD ? (
              <div
                ref={previewSurfaceRef}
                onClickCapture={handlePreviewPick}
                className={`relative w-full overflow-hidden rounded-xl shadow-xl transition-all motion-safe:duration-200 ${
                  isMobileFirst ? "max-w-[390px]" : "max-w-6xl"
                } ${pickElementMode ? "cursor-crosshair ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-950" : ""}`}
              >
                {pickElementMode && (
                  <div className="pointer-events-none absolute inset-0 z-[1] flex items-start justify-center p-2">
                    <span className="rounded-full bg-blue-600/95 px-3 py-1 text-[11px] font-medium text-white shadow-lg">
                      Click an element in the preview to attach it to your prompt
                    </span>
                  </div>
                )}
                <PulseGrowthPreview compact={isMobileFirst} />
              </div>
            ) : generatedHTML === PULSE_CUSTOMER_PULSE_DASHBOARD ? (
              <div
                ref={previewSurfaceRef}
                onClickCapture={handlePreviewPick}
                className={`relative w-full overflow-hidden rounded-xl shadow-xl transition-all motion-safe:duration-200 ${
                  isMobileFirst ? "max-w-[390px]" : "max-w-6xl"
                } ${pickElementMode ? "cursor-crosshair ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-950" : ""}`}
              >
                {pickElementMode && (
                  <div className="pointer-events-none absolute inset-0 z-[1] flex items-start justify-center p-2">
                    <span className="rounded-full bg-blue-600/95 px-3 py-1 text-[11px] font-medium text-white shadow-lg">
                      Click an element in the preview to attach it to your prompt
                    </span>
                  </div>
                )}
                <PulseCustomerPulsePreview compact={isMobileFirst} />
              </div>
            ) : generatedHTML ? (
              <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden transition-all ${isMobileFirst ? "w-[390px]" : "w-full max-w-5xl"}`}>
                <iframe
                  title="UI Preview"
                  srcDoc={generatedHTML}
                  className="w-full border-0"
                  style={{ minHeight: "600px" }}
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="flex max-w-sm flex-col items-center justify-center px-4 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800">
                  <Wand2 className="size-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-foreground">Preview will show here</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Send a message or pick a <span className="font-medium text-foreground">Starter template</span> in the left column. Curated boards render live here; other prompts use a simple HTML placeholder (demo).
                </p>
              </div>
            )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
