import { useMemo, useState } from "react";
import {
  ChevronRight,
  Clock,
  LayoutDashboard,
  History,
  Play,
  Pencil,
  MoreVertical,
  Settings2,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import ProviderLogo from "@/components/common/ProviderLogo";
import Sidebar from "@/components/layout/Sidebar";
import InsightBanner from "@/components/features/agent-detail/InsightBanner";
import InsightCard from "@/components/features/agent-detail/InsightCard";
import RunTimeline from "@/components/features/agent-detail/RunTimeline";
import FailureInsightsPanel from "@/components/features/agent-detail/FailureInsightsPanel";
import RunDetailsDrawer from "@/components/features/agent-detail/RunDetailsDrawer";
import ConfigSectionCard from "@/components/features/agent-detail/ConfigSectionCard";
import TestPromptPanel from "@/components/features/agent-detail/TestPromptPanel";
import OperationsTimelineChart from "@/components/features/agent-detail/OperationsTimelineChart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const imgAvatarRobot = "/astronaut.svg";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "configuration", label: "Configuration", icon: Settings2 },
  { id: "run-history", label: "Run History", icon: History },
];

const FALLBACK_AGENT = {
  id: 0,
  name: "Customer Appreciation",
  description: "AI-powered recognition workflow that creates personalized appreciation cards and messages for clients.",
  date: "23 Mar 2025",
  provider: "OpenAI",
  model: "GPT-4.5",
  status: "active",
  lastRun: "2 min ago",
  success: 98,
  accessEnabled: true,
};

const STATUS_STYLE = {
  active: { dot: "#22c55e", bg: "#dcfce7", text: "#15803d", label: "Active" },
  idle: { dot: "#94a3b8", bg: "#f1f5f9", text: "#475569", label: "Idle" },
  error: { dot: "#ef4444", bg: "#fef2f2", text: "#dc2626", label: "Error" },
  disabled: { dot: "#cbd5e1", bg: "#f8fafc", text: "#94a3b8", label: "Disabled" },
};

function generateRuns(agent) {
  const base = [
    {
      suffix: "8f3a",
      duration: 1.9,
      tokens: 1240,
      status: "Success",
      timestamp: "Today, 12:04 PM",
      preview: "Processed customer appreciation workflow and generated personalized summary.",
      errorType: null,
      errorMessage: null,
      logs: ["12:04:01 INFO Starting workflow", "12:04:02 INFO Enrichment step completed", "12:04:03 INFO Response delivered to CRM"],
      tools: [
        { name: "fetch_customer_context", status: "completed", detail: "Resolved customer metadata from CRM." },
        { name: "compose_response", status: "completed", detail: "Generated appreciation response with recommended next step." },
      ],
    },
    {
      suffix: "7e2b",
      duration: 2.1,
      tokens: 1380,
      status: "Success",
      timestamp: "Today, 10:48 AM",
      preview: "Summarized outbound message draft and attached a follow-up recommendation.",
      errorType: null,
      errorMessage: null,
      logs: ["10:48:11 INFO Request accepted", "10:48:12 INFO Template expansion succeeded", "10:48:13 INFO Run completed"],
      tools: [
        { name: "load_template", status: "completed", detail: "Loaded active response template." },
        { name: "score_tone", status: "completed", detail: "Tone validation passed with warm confidence 0.94." },
      ],
    },
    {
      suffix: "6d1c",
      duration: 2.9,
      tokens: 1510,
      status: "Success",
      timestamp: "Today, 08:22 AM",
      preview: "Created a new appreciation sequence for a priority account owner.",
      errorType: null,
      errorMessage: null,
      logs: ["08:22:05 INFO Trigger received", "08:22:06 INFO Account priority = high", "08:22:08 INFO Delivery confirmed"],
      tools: [
        { name: "rank_customer_priority", status: "completed", detail: "Marked account as high priority." },
        { name: "send_email", status: "completed", detail: "Queued delivery to outbound channel." },
      ],
    },
    {
      suffix: "5c0a",
      duration: 3.6,
      tokens: 1980,
      status: "Failed",
      timestamp: "Yesterday, 05:41 PM",
      preview: "Failed while posting the final message to the webhook destination.",
      errorType: "Webhook timeout",
      errorMessage: "The destination webhook did not acknowledge within the configured timeout window.",
      logs: ["17:41:02 INFO Request accepted", "17:41:03 INFO Generated message payload", "17:41:06 ERROR Webhook request timed out after 3.0s"],
      tools: [
        { name: "compose_response", status: "completed", detail: "Response generated successfully." },
        { name: "post_webhook", status: "failed", detail: "Destination webhook did not return 200 before timeout." },
      ],
    },
    {
      suffix: "4b9f",
      duration: 1.8,
      tokens: 1220,
      status: "Success",
      timestamp: "Yesterday, 03:10 PM",
      preview: "Delivered an appreciative message and stored summary in CRM notes.",
      errorType: null,
      errorMessage: null,
      logs: ["15:10:44 INFO CRM lookup finished", "15:10:45 INFO Message approved", "15:10:46 INFO Summary written to CRM"],
      tools: [
        { name: "lookup_account", status: "completed", detail: "Account resolved by ID." },
        { name: "write_summary", status: "completed", detail: "Outcome appended to CRM timeline." },
      ],
    },
    {
      suffix: "3a8c",
      duration: 4.1,
      tokens: 2100,
      status: "Failed",
      timestamp: "2 days ago, 11:15 AM",
      preview: "Token budget exceeded while compiling a long-form response variant.",
      errorType: "Token limit",
      errorMessage: "Execution exceeded the configured generation limit before final response assembly.",
      logs: ["11:15:21 INFO Run initialized", "11:15:24 WARN Context size approaching limit", "11:15:25 ERROR Token ceiling hit during generation"],
      tools: [
        { name: "assemble_context", status: "completed", detail: "Large context window assembled." },
        { name: "generate_variant", status: "failed", detail: "Generation stopped after token ceiling was reached." },
      ],
    },
    {
      suffix: "2f1d",
      duration: 1.5,
      tokens: 980,
      status: "Success",
      timestamp: "2 days ago, 09:03 AM",
      preview: "Quick follow-up run with low token footprint and healthy latency.",
      errorType: null,
      errorMessage: null,
      logs: ["09:03:15 INFO Start", "09:03:16 INFO Action generated", "09:03:16 INFO Completed"],
      tools: [
        { name: "create_summary", status: "completed", detail: "Summary generated in one pass." },
      ],
    },
  ];

  return base.map((run, index) => ({
    ...run,
    id: `run_${run.suffix}`,
    isAnomaly: run.status === "Failed" || run.duration > 3 || run.tokens > 1800,
    tokens: run.tokens + agent.id * (index % 2 === 0 ? 4 : 7),
  }));
}

function buildInsights(agent, runs) {
  const failures = runs.filter((run) => run.status === "Failed");
  const successRate = Math.round(((runs.length - failures.length) / runs.length) * 100);
  const avgLatency = Number((runs.reduce((sum, run) => sum + run.duration, 0) / runs.length).toFixed(1));
  const tokensTotal = runs.reduce((sum, run) => sum + run.tokens, 0);

  const successSpark = runs.map((run, index) => Math.max(72, 100 - index * 2 - (run.status === "Failed" ? 12 : 0)));
  const latencySpark = runs.map((run) => Number((run.duration + 0.2).toFixed(1)));
  const tokenSpark = runs.map((run) => Math.round(run.tokens / 20));
  const throughputSpark = [28, 31, 33, 35, 37, 36, 39];

  const successTrend = failures.length >= 2 ? -4 : 3;
  const latencyTrend = avgLatency > 3 ? 18 : avgLatency > 2.2 ? 6 : -8;
  const tokenTrend = 9;
  const throughputTrend = 12;

  const insightState = failures.length >= 2 ? "critical" : avgLatency > 2.8 ? "warning" : "healthy";
  const insightTitle = insightState === "critical" ? "Operational drift detected" : insightState === "warning" ? "System needs attention" : "System healthy";
  const insightMessage = failures.length >= 2
    ? `${failures.length} failures appeared in the last ${runs.length} runs, mostly tied to ${failures[0]?.errorType?.toLowerCase() || "execution issues"}.`
    : avgLatency > 2.8
    ? `Latency is up by ${(avgLatency - 2.4).toFixed(1)}s compared with the previous 7-day baseline.`
    : `${agent.name} is meeting success and latency targets with only isolated issues.`;
  const insightMeta = failures.length >= 2 ? "Immediate review recommended" : avgLatency > 2.8 ? "Monitor next 24h" : "Stable vs last 7 days";

  return {
    banner: {
      state: insightState,
      title: insightTitle,
      message: insightMessage,
      meta: insightMeta,
    },
    metrics: [
      {
        label: "Success Rate",
        value: `${successRate}%`,
        comparison: "vs last 7 days",
        trendPercent: successTrend,
        points: successSpark,
        status: failures.length >= 2 ? "dropping" : failures.length === 1 ? "stable" : "improving",
        accent: "#22c55e",
        metric: failures.length > 0 ? `${failures.length} failed` : "All clear",
      },
      {
        label: "Latency",
        value: `${avgLatency}s`,
        comparison: "vs last 7 days",
        trendPercent: latencyTrend,
        points: latencySpark,
        status: avgLatency > 3 ? "critical" : avgLatency > 2.2 ? "warning" : "good",
        accent: "#60a5fa",
        metric: "p50 execution",
      },
      {
        label: "Token Usage",
        value: `${(tokensTotal / 1000).toFixed(1)}k`,
        comparison: "vs last 7 days",
        trendPercent: tokenTrend,
        points: tokenSpark,
        status: "stable",
        accent: "#8b5cf6",
        metric: "last 7 days",
      },
      {
        label: "Daily Throughput",
        value: `${28 + agent.id}`,
        comparison: "vs last 7 days",
        trendPercent: throughputTrend,
        points: throughputSpark,
        status: "improving",
        accent: "#f59e0b",
        metric: "runs per day",
      },
    ],
  };
}

function StatusPill({ status }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.idle;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: style.bg, color: style.text }}>
      <span className="size-1.5 rounded-full" style={{ background: style.dot }} />
      {style.label}
    </span>
  );
}

function OverviewTab({ insights, recentRuns, failures, onSelectRun, agent }) {
  return (
    <div className="flex flex-col gap-6">
      <InsightBanner insight={insights.banner} />

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {insights.metrics.map((metric) => <InsightCard key={metric.label} {...metric} />)}
      </div>

      <OperationsTimelineChart runs={recentRuns} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.95fr]">
        <RunTimeline runs={recentRuns.slice(0, 5)} onSelectRun={onSelectRun} />
        <FailureInsightsPanel failures={failures.slice(0, 2)} onSelectRun={onSelectRun} />
      </div>

      <TestPromptPanel agentName={agent.name} />
    </div>
  );
}

function ConfigurationTab({ config, setConfig, onOpenTestModal }) {
  const sections = [
    {
      title: "Model Config",
      description: "Tune the base model, prompt behavior, and safety defaults without leaving the page.",
      fields: [
        { key: "provider", label: "Provider", value: config.provider, tooltip: "Underlying model provider used for inference." },
        { key: "model", label: "Model", value: config.model, tooltip: "Primary model identifier for this agent." },
        { key: "temperature", label: "Temperature", value: config.temperature, tooltip: "Controls creativity and variance in responses." },
        { key: "maxTokens", label: "Max tokens", value: config.maxTokens, tooltip: "Upper bound for generated completion size." },
      ],
    },
    {
      title: "Access Control",
      description: "Define who can invoke, edit, or observe the agent.",
      fields: [
        { key: "owner", label: "Owner", value: config.owner, tooltip: "Primary owner responsible for this agent." },
        { key: "workspace", label: "Workspace", value: config.workspace, tooltip: "Workspace or team scope for access." },
        { key: "accessEnabled", label: "Access enabled", value: config.accessEnabled, tooltip: "Whether end users may invoke this agent." },
        { key: "approvalMode", label: "Approval mode", value: config.approvalMode, tooltip: "Execution approvals before external actions." },
      ],
    },
    {
      title: "Runtime Settings",
      description: "Keep runtime settings observable and editable inline for faster iteration.",
      fields: [
        { key: "timeout", label: "Timeout", value: config.timeout, tooltip: "Maximum end-to-end execution time before abort." },
        { key: "retryPolicy", label: "Retry policy", value: config.retryPolicy, tooltip: "Automatic retry policy for transient failures." },
        { key: "concurrency", label: "Concurrency", value: config.concurrency, tooltip: "Allowed parallel runs for this agent." },
        { key: "webhookTarget", label: "Webhook target", value: config.webhookTarget, tooltip: "Primary outbound integration endpoint." },
      ],
    },
  ];

  const handleFieldChange = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <ConfigSectionCard
          key={section.title}
          title={section.title}
          description={section.description}
          fields={section.fields}
          onFieldChange={handleFieldChange}
          onTestConfiguration={onOpenTestModal}
        />
      ))}
    </div>
  );
}

function RunHistoryTab({ runs, filters, setFilters, onSelectRun }) {
  const filteredRuns = runs.filter((run) => {
    if (filters.search && !run.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status !== "all" && run.status.toLowerCase() !== filters.status) return false;
    if (filters.anomaliesOnly && !run.isAnomaly) return false;
    if (filters.duration !== "all") {
      if (filters.duration === "lt2" && run.duration >= 2) return false;
      if (filters.duration === "2to3" && (run.duration < 2 || run.duration > 3)) return false;
      if (filters.duration === "gt3" && run.duration <= 3) return false;
    }
    if (filters.tokens !== "all") {
      if (filters.tokens === "lt1200" && run.tokens >= 1200) return false;
      if (filters.tokens === "1200to1800" && (run.tokens < 1200 || run.tokens > 1800)) return false;
      if (filters.tokens === "gt1800" && run.tokens <= 1800) return false;
    }
    if (filters.range === "1h" && !run.timestamp.startsWith("Today")) return false;
    if (filters.range === "24h" && run.timestamp.startsWith("2 days")) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-[#334155] dark:bg-[#111827]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <SearchField value={filters.search} onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))} />
          <SelectChip label="Status" value={filters.status} options={[["all", "All"], ["success", "Success"], ["failed", "Failed"]]} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} />
          <SelectChip label="Duration" value={filters.duration} options={[["all", "All"], ["lt2", "< 2s"], ["2to3", "2–3s"], ["gt3", "> 3s"]]} onChange={(value) => setFilters((prev) => ({ ...prev, duration: value }))} />
          <SelectChip label="Tokens" value={filters.tokens} options={[["all", "All"], ["lt1200", "< 1200"], ["1200to1800", "1200–1800"], ["gt1800", "> 1800"]]} onChange={(value) => setFilters((prev) => ({ ...prev, tokens: value }))} />
          <SelectChip label="Time Range" value={filters.range} options={[["1h", "1h"], ["24h", "24h"], ["7d", "7d"]]} onChange={(value) => setFilters((prev) => ({ ...prev, range: value }))} />
          <label className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm dark:border-[#334155]">
            <span className="text-[#475569] dark:text-[#cbd5e1]">Show anomalies</span>
            <input type="checkbox" checked={filters.anomaliesOnly} onChange={(e) => setFilters((prev) => ({ ...prev, anomaliesOnly: e.target.checked }))} className="size-4 rounded accent-[#2563eb]" />
          </label>
        </div>
      </div>

      <OperationsTimelineChart runs={filteredRuns} />

      <RunTimeline runs={filteredRuns} onSelectRun={onSelectRun} />
    </div>
  );
}

function SearchField({ value, onChange }) {
  return (
    <label className="rounded-xl border border-[#e2e8f0] px-3 py-2 dark:border-[#334155]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] dark:text-[#64748b]">Search</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search run ID"
        className="mt-2 w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8] dark:text-[#f8fafc]"
      />
    </label>
  );
}

function SelectChip({ label, value, options, onChange }) {
  return (
    <label className="rounded-xl border border-[#e2e8f0] px-3 py-2 dark:border-[#334155]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] dark:text-[#64748b]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full bg-transparent text-sm text-[#0f172a] outline-none dark:text-[#f8fafc]">
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

export default function AgentDetailPage({ agent, onNavigate }) {
  const currentAgent = agent || FALLBACK_AGENT;
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRun, setSelectedRun] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [testConfigOpen, setTestConfigOpen] = useState(false);
  const [runFilters, setRunFilters] = useState({
    search: "",
    status: "all",
    duration: "all",
    tokens: "all",
    range: "7d",
    anomaliesOnly: false,
  });
  const [config, setConfig] = useState({
    provider: currentAgent.provider,
    model: currentAgent.model,
    temperature: "0.3",
    maxTokens: "2048",
    owner: "Jane Cooper",
    workspace: "Customer Experience",
    accessEnabled: currentAgent.accessEnabled ? "Enabled" : "Disabled",
    approvalMode: "Ask on external actions",
    timeout: "6s",
    retryPolicy: "2 retries / exponential backoff",
    concurrency: "3 parallel runs",
    webhookTarget: "https://hooks.aziron.ai/agents/customer-appreciation",
  });

  const runs = useMemo(() => generateRuns(currentAgent), [currentAgent]);
  const failures = useMemo(() => runs.filter((run) => run.status === "Failed"), [runs]);
  const insights = useMemo(() => buildInsights(currentAgent, runs), [currentAgent, runs]);

  const openRun = (run) => {
    setSelectedRun(run);
    setDrawerOpen(true);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="agents" onNavigate={onNavigate} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-[#94a3b8] dark:text-[#64748b]">
              <button onClick={() => onNavigate("agents")} className="transition-colors hover:text-[#64748b] dark:hover:text-[#94a3b8]">Agents</button>
              <ChevronRight size={12} />
              <span className="font-medium text-[#475569] dark:text-[#94a3b8]">{currentAgent.name}</span>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white shadow-sm dark:border-[#334155] dark:bg-[#111827]">
                  <img src={imgAvatarRobot} alt="" className="h-[58%] w-[58%] object-contain opacity-90" />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#0f172a] dark:text-[#f8fafc]">{currentAgent.name}</h1>
                    <StatusPill status={currentAgent.status} />
                    <div className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8] dark:bg-[#0f172a] dark:text-[#93c5fd]">
                      {insights.metrics[0].value} success
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b] dark:text-[#94a3b8]">
                    <ProviderLogo provider={currentAgent.provider} className="size-3.5 text-[#475569] dark:text-[#cbd5e1]" fallbackClassName="size-3.5" />
                    <span>{currentAgent.model}</span>
                    <span className="text-[#e2e8f0] dark:text-[#334155]">·</span>
                    <Clock size={11} />
                    <span>Last run {currentAgent.lastRun}</span>
                    <span className="text-[#e2e8f0] dark:text-[#334155]">·</span>
                    <span>{failures.length} recent failures</span>
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-[#64748b] dark:text-[#94a3b8]">{currentAgent.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="gap-1.5 bg-[#0f172a] text-white hover:bg-[#1e293b] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-[#e2e8f0]">
                  <Play size={14} />
                  Run now
                </Button>
                <Button variant="outline" className="gap-1.5">
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="More options">
                  <MoreVertical size={15} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1 border-b border-[#e2e8f0] dark:border-[#334155]">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${active ? "border-[#0f172a] text-[#0f172a] dark:border-[#f8fafc] dark:text-[#f8fafc]" : "border-transparent text-[#64748b] hover:text-[#0f172a] dark:text-[#94a3b8] dark:hover:text-[#f8fafc]"}`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "overview" && (
              <OverviewTab
                insights={insights}
                recentRuns={runs}
                failures={failures}
                onSelectRun={openRun}
                agent={currentAgent}
              />
            )}

            {activeTab === "configuration" && (
              <ConfigurationTab
                config={config}
                setConfig={setConfig}
                onOpenTestModal={() => setTestConfigOpen(true)}
              />
            )}

            {activeTab === "run-history" && (
              <RunHistoryTab
                runs={runs}
                filters={runFilters}
                setFilters={setRunFilters}
                onSelectRun={openRun}
              />
            )}
          </div>
        </div>
      </div>

      <RunDetailsDrawer run={selectedRun} open={drawerOpen} onOpenChange={setDrawerOpen} />

      <Dialog open={testConfigOpen} onOpenChange={setTestConfigOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#111827]">
          <DialogHeader>
            <DialogTitle>Test Configuration</DialogTitle>
            <DialogDescription>Validate the current configuration with a dry-run before saving changes.</DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 text-sm leading-6 text-[#475569] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#cbd5e1]">
            Dry-run succeeded. Expected latency is 1.8s with current timeout, and the webhook target responded normally.
          </div>

          <DialogFooter className="bg-transparent p-0 pt-2 sm:justify-end">
            <Button variant="outline" onClick={() => setTestConfigOpen(false)}>Close</Button>
            <Button className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]" onClick={() => setTestConfigOpen(false)}>Looks good</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
