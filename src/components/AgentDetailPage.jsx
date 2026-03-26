import { useState } from "react";
import {
  Play,
  Pencil,
  MoreVertical,
  ArrowLeft,
  Activity,
  CheckCircle2,
  Timer,
  Zap,
  ChevronRight,
  Tag,
  AlignLeft,
  Settings2,
  History,
  LayoutDashboard,
  CircleCheck,
  CircleX,
  Clock,
  Cpu,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";

const imgAvatarRobot = "https://www.figma.com/api/mcp/asset/30669545-e841-413b-80af-a7db03ab0d8c";
const imgOpenAI     = "https://www.figma.com/api/mcp/asset/8933db25-5a1e-4a78-ae17-f0251297e0e4";

// ─── Deterministic fake run history seeded from agent id ─────────────────────

function genRuns(agent) {
  const statuses = ["Success", "Success", "Success", "Failed", "Success"];
  const durations = [1.9, 2.1, 1.7, 3.2, 1.8];
  const tokens    = [1240, 1380, 1100, 1890, 1220];
  const suffixes  = ["8f3a", "7e2b", "6d1c", "5c0a", "4b9f"];
  return suffixes.map((s, i) => ({
    id:       `run_${s}`,
    duration: durations[i],
    tokens:   tokens[i],
    status:   statuses[i],
  }));
}

function genTotalRuns(agent) { return 2800 + (agent.id * 47) % 200; }
function genAvgLatency(agent) { return (1.5 + (agent.id * 0.13) % 1.2).toFixed(1); }
function genTokensUsed(agent) {
  const n = 3.8 + (agent.id * 0.4) % 2;
  return `${n.toFixed(1)}M`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className="flex-1 min-w-0 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] px-5 py-4 flex flex-col gap-1.5">
      <span className="text-sm font-semibold tracking-widest uppercase text-[#94a3b8] dark:text-[#64748b]">{label}</span>
      <span className={`text-2xl font-bold leading-8 ${highlight ? "text-[#16a34a]" : "text-[#0f172a] dark:text-[#f1f5f9]"}`}>
        {value}
      </span>
      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">{sub}</span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function RunBadge({ status }) {
  const ok = status === "Success";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
        ok ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fef2f2] text-[#dc2626]"
      }`}
    >
      {ok ? <CircleCheck size={11} /> : <CircleX size={11} />}
      {status}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",       label: "Overview",       icon: LayoutDashboard },
  { id: "configuration",  label: "Configuration",  icon: Settings2 },
  { id: "run-history",    label: "Run History",    icon: History },
];

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ agent }) {
  const runs       = genRuns(agent);
  const totalRuns  = genTotalRuns(agent);
  const todayRuns  = 10 + (agent.id * 4) % 8;
  const avgLatency = genAvgLatency(agent);
  const tokens     = genTokensUsed(agent);

  const tags = [agent.provider === "Anthropic" ? "claude-opus-4" : "gpt-4o", "DevOps", "Monitoring"];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="flex gap-3">
        <StatCard label="Total Runs"   value={totalRuns.toLocaleString()} sub={`${todayRuns} today`} />
        <StatCard label="Success Rate" value={`${agent.success}%`} sub="last 30 days" highlight />
        <StatCard label="Avg Latency"  value={`${avgLatency}s`}    sub="p50 execution" />
        <StatCard label="Tokens Used"  value={tokens}              sub="lifetime total" />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-widest uppercase text-[#94a3b8] dark:text-[#64748b]">Description</span>
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] px-4 py-3">
          <p className="text-sm text-[#0f172a] dark:text-[#f1f5f9] leading-6">{agent.description}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-widest uppercase text-[#94a3b8] dark:text-[#64748b]">Tags</span>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium text-[#475569] dark:text-[#94a3b8] bg-white dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155]"
            >
              <Tag size={10} className="text-[#94a3b8]" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Runs */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-widest uppercase text-[#94a3b8] dark:text-[#64748b]">Recent Runs</span>
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#0f172a] border-b border-[#e2e8f0] dark:border-[#334155]">
                <th className="text-left px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase w-full">Run ID</th>
                <th className="text-right px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase whitespace-nowrap">Duration</th>
                <th className="text-right px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase whitespace-nowrap">Tokens</th>
                <th className="text-right px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => (
                <tr
                  key={run.id}
                  className={`border-b border-[#f1f5f9] dark:border-[#1e293b] last:border-0 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors ${
                    i % 2 === 0 ? "" : "bg-[#fafafa] dark:bg-[#0f172a]"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-sm text-[#0f172a] dark:text-[#f1f5f9]">{run.id}</td>
                  <td className="px-4 py-3 text-right text-sm text-[#475569] dark:text-[#94a3b8] tabular-nums">{run.duration}s</td>
                  <td className="px-4 py-3 text-right text-sm text-[#475569] dark:text-[#94a3b8] tabular-nums">{run.tokens.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right"><RunBadge status={run.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Configuration tab ────────────────────────────────────────────────────────

function ConfigRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#f1f5f9] dark:border-[#1e293b] last:border-0">
      <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">{label}</span>
      <span className={`text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function ConfigurationTab({ agent }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] px-4 divide-y divide-[#f1f5f9] dark:divide-[#1e293b]">
        <ConfigRow label="Agent Name"       value={agent.name} />
        <ConfigRow label="Provider"         value={agent.provider} />
        <ConfigRow label="Model"            value={agent.model} mono />
        <ConfigRow label="Status"           value={agent.status.charAt(0).toUpperCase() + agent.status.slice(1)} />
        <ConfigRow label="Created"          value={agent.date} />
        <ConfigRow label="Last Run"         value={agent.lastRun} />
        <ConfigRow label="Access Enabled"   value={agent.accessEnabled ? "Yes" : "No"} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-widest uppercase text-[#94a3b8] dark:text-[#64748b]">System Prompt</span>
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] px-4 py-3 font-mono text-xs text-[#475569] dark:text-[#94a3b8] leading-5 whitespace-pre-wrap">
          {`You are an AI assistant specializing in "${agent.name}" tasks.\n\nAlways respond clearly and concisely. Prioritize accuracy and helpfulness.\n\nWhen uncertain, ask clarifying questions before proceeding.`}
        </div>
      </div>
    </div>
  );
}

// ─── Run History tab ──────────────────────────────────────────────────────────

function RunHistoryTab({ agent }) {
  const allRuns = [
    ...genRuns(agent),
    { id: "run_3a8c", duration: 2.4, tokens: 1560, status: "Success" },
    { id: "run_2f1d", duration: 1.5, tokens:  980, status: "Success" },
    { id: "run_1b7e", duration: 4.1, tokens: 2100, status: "Failed"  },
    { id: "run_0d9a", duration: 1.9, tokens: 1330, status: "Success" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">{allRuns.length} runs shown</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94a3b8] dark:text-[#64748b]">Filter:</span>
          {[
            { label: "All", title: "Show all runs" },
            { label: "Success", title: "Runs that completed successfully" },
            { label: "Failed", title: "Runs that encountered an error" },
          ].map(({ label, title }) => (
            <button
              key={label}
              title={title}
              aria-label={title}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                label === "All"
                  ? "bg-[#0f172a] text-white border-[#0f172a]"
                  : "bg-white dark:bg-[#1e293b] text-[#475569] dark:text-[#94a3b8] border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f8fafc] dark:bg-[#0f172a] border-b border-[#e2e8f0] dark:border-[#334155]">
              <th className="text-left px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase">Run ID</th>
              <th className="text-right px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase">Duration</th>
              <th className="text-right px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase">Tokens</th>
              <th className="text-right px-4 py-2.5 text-sm font-semibold text-[#94a3b8] dark:text-[#64748b] tracking-widest uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {allRuns.map((run, i) => (
              <tr
                key={run.id}
                className="border-b border-[#f1f5f9] dark:border-[#1e293b] last:border-0 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-sm text-[#0f172a] dark:text-[#f1f5f9]">{run.id}</td>
                <td className="px-4 py-3 text-right text-sm text-[#475569] dark:text-[#94a3b8] tabular-nums">{run.duration}s</td>
                <td className="px-4 py-3 text-right text-sm text-[#475569] dark:text-[#94a3b8] tabular-nums">{run.tokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-right"><RunBadge status={run.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  active:   { dot: "#22c55e", bg: "#dcfce7", text: "#15803d", label: "Active" },
  idle:     { dot: "#94a3b8", bg: "#f1f5f9", text: "#475569", label: "Idle" },
  error:    { dot: "#ef4444", bg: "#fef2f2", text: "#dc2626", label: "Error" },
  disabled: { dot: "#cbd5e1", bg: "#f8fafc", text: "#94a3b8", label: "Disabled" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.idle;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgentDetailPage({ agent, onNavigate, sidebarCollapsed, onToggleSidebar }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0f172a] overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} activePage="agents" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onToggleSidebar={onToggleSidebar} onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-6">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-[#94a3b8] dark:text-[#64748b]">
              <button
                onClick={() => onNavigate("agents")}
                className="hover:text-[#64748b] dark:hover:text-[#94a3b8] transition-colors"
              >
                Agents
              </button>
              <ChevronRight size={12} />
              <span className="text-[#475569] dark:text-[#94a3b8] font-medium">{agent.name}</span>
            </nav>

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Agent icon */}
                <div className="size-14 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm dark:shadow-none">
                  <img src={imgAvatarRobot} alt="" className="w-[55%] h-[55%] object-contain opacity-60" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-7">{agent.name}</h1>
                    <StatusPill status={agent.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#64748b] dark:text-[#94a3b8]">
                    <img src={imgOpenAI} alt="" className="size-3.5 object-contain" />
                    <span>{agent.model}</span>
                    <span className="text-[#e2e8f0] dark:text-[#334155]">·</span>
                    <Clock size={11} />
                    <span>Last run {agent.lastRun}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button aria-label="Run agent now" className="flex items-center gap-1.5 h-8 px-3.5 rounded-[8px] bg-[#0f172a] text-white text-xs font-medium hover:bg-[#1e293b] transition-colors">
                  <Play size={12} fill="white" />
                  Run Now
                </button>
                <button aria-label="Edit agent" className="flex items-center gap-1.5 h-8 px-3.5 rounded-[8px] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f1f5f9] text-xs font-medium hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors">
                  <Pencil size={12} />
                  Edit
                </button>
                <button aria-label="More options" aria-haspopup="true" className="flex items-center justify-center size-8 rounded-[8px] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors">
                  <MoreVertical size={15} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-[#e2e8f0] dark:border-[#334155]">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      active
                        ? "border-[#0f172a] dark:border-[#f1f5f9] text-[#0f172a] dark:text-[#f1f5f9]"
                        : "border-transparent text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] hover:border-[#e2e8f0] dark:hover:border-[#334155]"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "overview"      && <OverviewTab agent={agent} />}
            {activeTab === "configuration" && <ConfigurationTab agent={agent} />}
            {activeTab === "run-history"   && <RunHistoryTab agent={agent} />}
          </div>
        </div>
      </div>
    </div>
  );
}
