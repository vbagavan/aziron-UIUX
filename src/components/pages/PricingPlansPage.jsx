import { useState } from "react";
import {
  ChevronRight, Check, X, Pencil, Save, RotateCcw, Tag,
  BadgeCheck, Users, Zap, Workflow, HardDrive, HeartHandshake,
  ShieldCheck, Server, Info,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { SAAS_TIERS, ONPREM_TIERS } from "@/data/adminData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtLimit(v, unit = "") {
  if (v === null || v === undefined) return "Unlimited";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M${unit}`;
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}k${unit}`;
  return `${v.toLocaleString()}${unit}`;
}

// ─── Tier highlight colours ───────────────────────────────────────────────────
const TIER_STYLES = {
  lite:   { gradient: "from-[#475569] to-[#334155]", accent: "#94a3b8", badge: "bg-[#475569]", featured: false  },
  growth: { gradient: "from-[#1d4ed8] to-[#2563eb]", accent: "#60a5fa", badge: "bg-[#2563eb]", featured: true   },
  scale:  { gradient: "from-[#6d28d9] to-[#7c3aed]", accent: "#c4b5fd", badge: "bg-[#7c3aed]", featured: false  },
};

// ─── Editable value cell ─────────────────────────────────────────────────────
function EditableValue({ value, editMode, onChange, unit = "" }) {
  if (!editMode) return <span className="tabular-nums">{fmtLimit(value, unit)}</span>;
  return (
    <input
      type="number" min="0"
      value={value ?? ""}
      onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
      placeholder="Unlimited"
      className="w-24 h-6 px-2 text-xs rounded-[5px] border border-[#60a5fa]/60 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 text-center tabular-nums"
    />
  );
}

// ─── SaaS tier card ───────────────────────────────────────────────────────────
function SaasTierCard({ tier, def, editMode, onChange, onReset }) {
  const style = TIER_STYLES[tier];
  const isGrowth = tier === "growth";

  const ROWS = [
    { key: "agents",           label: "Agents",               icon: BadgeCheck, unit: ""     },
    { key: "workflows",        label: "Workflows",            icon: Workflow,   unit: ""     },
    { key: "concurrentFlows",  label: "Concurrent Flows",     icon: Zap,        unit: ""     },
    { key: "flowExecPerMonth", label: "Flow Exec / mo",       icon: Zap,        unit: ""     },
    { key: "knowledgeHubGB",   label: "Knowledge Hub",        icon: HardDrive,  unit: " GB"  },
  ];

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border-2 ${
      isGrowth ? "border-[#2563eb] shadow-lg shadow-blue-500/20" : "border-[#e2e8f0] dark:border-[#334155]"
    }`}>
      {isGrowth && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2563eb] shadow-sm">
            MOST POPULAR
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`bg-gradient-to-br ${style.gradient} px-5 pt-5 pb-5 text-white`}>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">SaaS Tier</p>
        <h3 className="text-2xl font-bold mb-3">{def.label}</h3>
        <div className="flex items-end gap-1">
          {editMode ? (
            <div className="flex items-center gap-1">
              <span className="text-3xl font-bold">$</span>
              <input
                type="number" min="1"
                value={def.pricePerSeat}
                onChange={e => onChange("pricePerSeat", Number(e.target.value))}
                className="w-16 text-3xl font-bold bg-white/15 rounded-[6px] text-center border border-white/30 focus:outline-none focus:ring-1 focus:ring-white/50"
              />
            </div>
          ) : (
            <span className="text-4xl font-bold">${def.pricePerSeat}</span>
          )}
          <span className="text-sm opacity-70 mb-1">/ user / mo</span>
        </div>
        <p className="text-xs mt-1 opacity-60">{def.seatRange}</p>
        <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          {editMode ? (
            <span className="flex items-center gap-1">
              Tokens: $
              <input
                type="number" min="0" step="0.01"
                value={def.tokenRatePerM}
                onChange={e => onChange("tokenRatePerM", parseFloat(e.target.value))}
                className="w-12 bg-transparent border-b border-white/40 text-center focus:outline-none"
              />
              / 1M
            </span>
          ) : (
            `Platform tokens: $${def.tokenRatePerM?.toFixed(2)} / 1M`
          )}
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1e293b] px-5 py-4 gap-3">
        {/* Limits */}
        {ROWS.map(({ key, label, icon: Icon, unit }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[#64748b] dark:text-[#94a3b8]">
              <Icon size={13} />
              {label}
            </span>
            <span className="font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
              {editMode ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0"
                    value={def.limits[key] ?? ""}
                    onChange={e => onChange(`limits.${key}`, e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="∞"
                    className="w-20 h-6 px-2 text-xs text-right rounded-[5px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#2563eb]/40 tabular-nums"
                  />
                  <span className="text-xs text-[#94a3b8]">{unit}</span>
                </div>
              ) : (
                `${fmtLimit(def.limits[key])}${unit}`
              )}
            </span>
          </div>
        ))}

        <div className="border-t border-[#f1f5f9] dark:border-[#334155] pt-3 mt-1 flex flex-col gap-2">
          {[
            ["SSO (Google & Microsoft)", true],
            ["Audit Logs", def.auditLogs],
            ["HIPAA-Ready", def.hipaa],
            ["Dedicated Infra", def.dedicatedInfra],
            [`Support: ${def.support}`, true],
            ["99.9% Uptime SLA", true],
          ].map(([label, enabled], i) => (
            <span key={i} className={`flex items-center gap-2 text-xs ${
              enabled
                ? "text-[#475569] dark:text-[#94a3b8]"
                : "text-[#cbd5e1] dark:text-[#475569] line-through"
            }`}>
              {enabled
                ? <Check size={12} className="text-[#16a34a] flex-shrink-0" />
                : <X size={12} className="flex-shrink-0" />}
              {label}
            </span>
          ))}
        </div>

        {editMode && (
          <button onClick={() => onReset(tier)}
            className="mt-2 flex items-center gap-1 text-xs text-[#94a3b8] hover:text-[#ef4444] transition-colors">
            <RotateCcw size={11} /> Reset to original
          </button>
        )}
      </div>
    </div>
  );
}

// ─── On-Prem tier card ───────────────────────────────────────────────────────
function OnPremTierCard({ tier, def, editMode, onChange, onReset }) {
  const style = TIER_STYLES[tier];
  const isScale = tier === "scale";

  const ROWS = [
    { key: "agents",           label: "Agents",               unit: ""    },
    { key: "concurrentFlows",  label: "Concurrent Flows",     unit: ""    },
    { key: "flowExecPerMonth", label: "Flow Exec / mo",       unit: ""    },
  ];

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border-2 ${
      isScale ? "border-[#7c3aed] shadow-lg shadow-purple-500/20" : "border-[#e2e8f0] dark:border-[#334155]"
    }`}>
      {isScale && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#7c3aed] shadow-sm">
            MOST POPULAR
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`bg-gradient-to-br ${style.gradient} px-5 pt-5 pb-5 text-white`}>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">On-Premises</p>
        <h3 className="text-2xl font-bold mb-3">{def.label}</h3>
        <div className="flex items-end gap-1">
          {editMode ? (
            <div className="flex items-center gap-1">
              <span className="text-3xl font-bold">$</span>
              <input
                type="number" min="1000"
                value={def.monthlyFee}
                onChange={e => onChange("monthlyFee", Number(e.target.value))}
                className="w-24 text-3xl font-bold bg-white/15 rounded-[6px] text-center border border-white/30 focus:outline-none focus:ring-1 focus:ring-white/50"
              />
            </div>
          ) : (
            <span className="text-4xl font-bold">${(def.monthlyFee ?? 0).toLocaleString()}</span>
          )}
          <span className="text-sm opacity-70 mb-1">/ mo</span>
        </div>
        <p className="text-xs mt-1 opacity-60">Unlimited users · self-hosted</p>
      </div>

      {/* Features */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1e293b] px-5 py-4 gap-3">
        {ROWS.map(({ key, label, unit }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-[#64748b] dark:text-[#94a3b8]">{label}</span>
            <span className="font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
              {editMode ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0"
                    value={def.limits[key] ?? ""}
                    onChange={e => onChange(`limits.${key}`, e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="∞"
                    className="w-20 h-6 px-2 text-xs text-right rounded-[5px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#2563eb]/40 tabular-nums"
                  />
                  <span className="text-xs text-[#94a3b8]">{unit}</span>
                </div>
              ) : (
                `${fmtLimit(def.limits[key])}${unit}`
              )}
            </span>
          </div>
        ))}

        <div className="border-t border-[#f1f5f9] dark:border-[#334155] pt-3 mt-1 flex flex-col gap-2">
          {[
            ["Knowledge Hub: Unlimited", true],
            ["MCP Tool Catalog", true],
            ["FusionX Agent", true],
            ["SSO / RBAC / Audit", true],
            ["HIPAA-Ready", true],
            ["LTS Release Builds", true],
            [`Named Solution Architect`, def.namedSA],
            [`Support: ${def.support}`, true],
          ].map(([label, enabled], i) => (
            <span key={i} className={`flex items-center gap-2 text-xs ${
              enabled
                ? "text-[#475569] dark:text-[#94a3b8]"
                : "text-[#cbd5e1] dark:text-[#475569] line-through"
            }`}>
              {enabled
                ? <Check size={12} className="text-[#16a34a] flex-shrink-0" />
                : <X size={12} className="flex-shrink-0" />}
              {label}
            </span>
          ))}
        </div>

        {editMode && (
          <button onClick={() => onReset(tier)}
            className="mt-2 flex items-center gap-1 text-xs text-[#94a3b8] hover:text-[#ef4444] transition-colors">
            <RotateCcw size={11} /> Reset to original
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PricingPlansPage({ onNavigate }) {
  const [mode, setMode] = useState("saas"); // "saas" | "on-prem"
  const [editMode, setEditMode] = useState(false);

  // Deep-clone tier defs into local state so edits don't mutate the originals
  const [saasDraft, setSaasDraft]   = useState(JSON.parse(JSON.stringify(SAAS_TIERS)));
  const [onpremDraft, setOnpremDraft] = useState(JSON.parse(JSON.stringify(ONPREM_TIERS)));

  // Tracks which tiers have been modified
  const [dirty, setDirty] = useState(false);

  const saasOriginal   = JSON.parse(JSON.stringify(SAAS_TIERS));
  const onpremOriginal = JSON.parse(JSON.stringify(ONPREM_TIERS));

  const handleSaasChange = (tier, path, value) => {
    setSaasDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next[tier];
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setDirty(true);
  };

  const handleOnpremChange = (tier, path, value) => {
    setOnpremDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next[tier];
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setDirty(true);
  };

  const handleResetSaas   = (tier) => { setSaasDraft(prev => ({ ...prev, [tier]: JSON.parse(JSON.stringify(saasOriginal[tier])) })); };
  const handleResetOnprem = (tier) => { setOnpremDraft(prev => ({ ...prev, [tier]: JSON.parse(JSON.stringify(onpremOriginal[tier])) })); };

  const saveChanges = () => { setEditMode(false); setDirty(false); };
  const cancelEdit  = () => {
    setSaasDraft(JSON.parse(JSON.stringify(SAAS_TIERS)));
    setOnpremDraft(JSON.parse(JSON.stringify(ONPREM_TIERS)));
    setEditMode(false);
    setDirty(false);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="pricing-plans" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]" />
            <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">Admin</span>
            <ChevronRight size={14} className="text-[#94a3b8]" />
            <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] font-medium">Pricing & Plans</span>
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f1f5f9] tracking-tight">Pricing & Plans</h1>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                Default tier configurations. Changes apply to new tenants — existing tenants retain their current pricing.
              </p>
            </div>
            {!editMode ? (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-sm font-medium text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
                <Pencil size={14} /> Edit Defaults
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit}
                  className="h-9 px-4 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                  Cancel
                </button>
                <button onClick={saveChanges}
                  className="flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
                  <Save size={14} /> Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 bg-[#eff6ff] dark:bg-[#1e3a8a]/30 border border-[#bfdbfe] dark:border-[#1e3a8a] rounded-xl px-4 py-3">
            <Info size={15} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#1e40af] dark:text-[#93c5fd] leading-5">
              <strong>No feature-enablement fees.</strong> All platform capabilities are available within each tier's capacity limits.
              Custom development for bespoke integrations is scoped separately. Tenant-level overrides take precedence over these defaults.
            </p>
          </div>

          {/* SaaS / On-Prem toggle */}
          <div className="flex items-center gap-1 p-1 rounded-[10px] bg-[#f1f5f9] dark:bg-[#334155] w-fit">
            {[["saas", "SaaS Cloud"], ["on-prem", "On-Premises"]].map(([val, label]) => (
              <button key={val} onClick={() => setMode(val)}
                className={`px-4 py-1.5 rounded-[8px] text-sm font-medium transition-all ${
                  mode === val
                    ? "bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] shadow-sm"
                    : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]"
                }`}>{label}</button>
            ))}
          </div>

          {/* Tier cards grid */}
          {mode === "saas" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {Object.entries(saasDraft).map(([tier, def]) => (
                <SaasTierCard
                  key={tier} tier={tier} def={def} editMode={editMode}
                  onChange={(path, val) => handleSaasChange(tier, path, val)}
                  onReset={handleResetSaas}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {Object.entries(onpremDraft).map(([tier, def]) => (
                  <OnPremTierCard
                    key={tier} tier={tier} def={def} editMode={editMode}
                    onChange={(path, val) => handleOnpremChange(tier, path, val)}
                    onReset={handleResetOnprem}
                  />
                ))}
              </div>

              {/* Infra requirements */}
              <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-3 flex items-center gap-2">
                  <Server size={14} className="text-[#64748b]" /> Infrastructure Requirements
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "CPU Minimum",       value: "8 vCPU"     },
                    { label: "RAM Minimum",       value: "32 GB"      },
                    { label: "SSD Storage",       value: "500 GB"     },
                    { label: "Container Runtime", value: "Docker / K8s" },
                    { label: "Deployment",        value: "7–14 days"  },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg p-3 text-center">
                      <p className="text-base font-bold text-[#0f172a] dark:text-[#f1f5f9]">{value}</p>
                      <p className="text-xs text-[#94a3b8] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#94a3b8] mt-3">
                  Air-gapped and private-network-only configurations are supported. An infrastructure readiness review is conducted prior to go-live.
                </p>
              </div>
            </>
          )}

          {/* Custom development note */}
          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-3">Custom Development (scoped separately)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { type: "Standard MCP Tool",       desc: "Single-system integration",        price: "From $5,000/tool" },
                { type: "Complex MCP Integration", desc: "Multi-system, custom auth/logic",  price: "Scoped per SOW"   },
                { type: "On-Prem MCP Deployment",  desc: "Deploy on customer infrastructure", price: "Included / SOW"  },
                { type: "Ongoing Maintenance",     desc: "Post-delivery support, versioning", price: "Optional retainer" },
              ].map(({ type, desc, price }) => (
                <div key={type} className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg p-3 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{type}</p>
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">{desc}</p>
                  <p className="text-xs font-medium text-[#2563eb] mt-auto pt-1">{price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
