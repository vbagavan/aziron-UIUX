import { useState } from "react";
import {
  ChevronRight, ChevronLeft, Cloud, Server, Check, AlertCircle,
  Building2, Globe, Mail, Briefcase, UserCircle, Calendar,
  Users, Zap, HardDrive, Workflow, DollarSign, BadgeCheck,
  X, Sparkles, ArrowRight,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { SAAS_TIERS, ONPREM_TIERS, TENANTS } from "@/data/adminData";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";

// ─── Constants ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Finance", "Healthcare", "Logistics", "Education", "Manufacturing",
  "Retail", "Insurance", "Pharma", "Media", "Consulting", "Technology", "Other",
];

const SA_OPTIONS = ["Alex Kim", "Maria Santos", "Ben Carter", "Unassigned"];

const TIER_GRADIENTS = {
  lite:   "from-[#475569] to-[#334155]",
  growth: "from-[#1d4ed8] to-[#2563eb]",
  scale:  "from-[#6d28d9] to-[#7c3aed]",
};

const TIER_ACCENT = {
  lite:   "#94a3b8",
  growth: "#60a5fa",
  scale:  "#c4b5fd",
};

const STEPS = [
  { id: 1, label: "Deployment"  },
  { id: 2, label: "Details"     },
  { id: 3, label: "Plan"        },
  { id: 4, label: "Overrides"   },
  { id: 5, label: "Review"      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtLimit(v, unit = "") {
  if (v === null || v === undefined) return "Unlimited";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M${unit}`;
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}k${unit}`;
  return `${v}${unit}`;
}

function computeEstimatedMRR(form) {
  if (!form.tier) return 0;
  if (form.deployment === "on-prem") {
    return ONPREM_TIERS[form.tier]?.monthlyFee ?? 0;
  }
  const tierDef = SAAS_TIERS[form.tier];
  if (!tierDef) return 0;
  return (parseInt(form.seats) || 0) * tierDef.pricePerSeat;
}

// ─── Step progress indicator ──────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <Stepper
      value={current}
      indicators={{
        completed: <Check size={14} />,
      }}
      className="w-full"
    >
      <StepperNav className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <StepperItem key={s.id} step={s.id} className="flex items-center">
            <StepperTrigger className="flex flex-col items-center gap-1.5">
              <StepperIndicator className="size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all data-[step-state=completed]:bg-[#16a34a] data-[step-state=completed]:text-white data-[step-state=active]:bg-[#2563eb] data-[step-state=active]:text-white data-[step-state=active]:ring-4 data-[step-state=active]:ring-[#2563eb]/20 data-[step-state=inactive]:bg-[#f1f5f9] dark:data-[step-state=inactive]:bg-[#334155] data-[step-state=inactive]:text-[#94a3b8]">
                {s.id}
              </StepperIndicator>
              <StepperTitle className="text-[10px] font-medium whitespace-nowrap data-[step-state=active]:text-[#2563eb] data-[step-state=completed]:text-[#16a34a] data-[step-state=inactive]:text-[#94a3b8]">
                {s.label}
              </StepperTitle>
            </StepperTrigger>
            {i < STEPS.length - 1 && (
              <StepperSeparator className="h-px w-12 mb-4 mx-1 transition-all data-[step-state=completed]:bg-[#16a34a] data-[step-state=inactive]:bg-[#e2e8f0] dark:data-[step-state=inactive]:bg-[#334155]" />
            )}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#374151] dark:text-[#d1d5db]">
        {label}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-[#ef4444]">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

// ─── STEP 1: Deployment type ──────────────────────────────────────────────────
function Step1({ form, setForm }) {
  const opts = [
    {
      value: "saas",
      icon: Cloud,
      title: "SaaS Cloud",
      desc: "Hosted on Aziron infrastructure. Per-seat monthly billing. Auto-tier upgrade at next billing cycle.",
      color: "#0ea5e9",
      features: ["99.9% uptime SLA", "Automatic updates", "Per-seat pricing", "Multi-tenant isolation"],
    },
    {
      value: "on-prem",
      icon: Server,
      title: "On-Premises",
      desc: "Deployed entirely within the customer's network boundary. Full data sovereignty. Unlimited users.",
      color: "#059669",
      features: ["Full data sovereignty", "Air-gap supported", "Fixed monthly license", "Unlimited users"],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">How will this tenant deploy?</h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
          This determines the pricing model, available tiers, and onboarding requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opts.map(opt => {
          const Icon = opt.icon;
          const selected = form.deployment === opt.value;
          return (
            <button key={opt.value} onClick={() => setForm(f => ({ ...f, deployment: opt.value, tier: "", seats: "" }))}
              className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                selected
                  ? "border-[#2563eb] bg-[#eff6ff] dark:bg-[#1e3a8a]/20 shadow-md shadow-blue-500/10"
                  : "border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] hover:border-[#93c5fd] dark:hover:border-[#334155]"
              }`}>
              {selected && (
                <div className="absolute top-4 right-4 size-6 rounded-full bg-[#2563eb] flex items-center justify-center">
                  <Check size={13} className="text-white" />
                </div>
              )}
              <div className="size-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${opt.color}18` }}>
                <Icon size={22} style={{ color: opt.color }} />
              </div>
              <h3 className="text-base font-bold text-[#0f172a] dark:text-[#f1f5f9] mb-1">{opt.title}</h3>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-5 mb-4">{opt.desc}</p>
              <div className="flex flex-col gap-1.5">
                {opt.features.map(f => (
                  <span key={f} className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94a3b8]">
                    <Check size={11} className="text-[#16a34a] flex-shrink-0" />{f}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP 2: Organisation details ─────────────────────────────────────────────
function Step2({ form, setForm, errors }) {
  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Organisation Details</h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">Basic information about the customer organisation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Organisation Name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Acme Corp" aria-invalid={!!errors.name} />
        </Field>
        <Field label="Domain" required error={errors.domain}>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              value={form.domain} onChange={(e) => set("domain")(e.target.value)}
              placeholder="acme.com"
              className="pl-8"
              aria-invalid={!!errors.domain}
            />
          </div>
        </Field>
        <Field label="Industry">
          <Select value={form.industry} onValueChange={(value) => set("industry")(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry…" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Contact Name" required error={errors.contactName}>
          <div className="relative">
            <UserCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              value={form.contactName} onChange={(e) => set("contactName")(e.target.value)}
              placeholder="Jane Smith"
              className="pl-8"
              aria-invalid={!!errors.contactName}
            />
          </div>
        </Field>
        <Field label="Contact Email" required error={errors.contactEmail}>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              type="email" value={form.contactEmail} onChange={(e) => set("contactEmail")(e.target.value)}
              placeholder="jane@acme.com"
              className="pl-8"
              aria-invalid={!!errors.contactEmail}
            />
          </div>
        </Field>

        {/* On-Prem-specific fields */}
        {form.deployment === "on-prem" && (
          <>
            <Field label="Solutions Architect">
              <Select value={form.solutionsArchitect} onValueChange={(value) => set("solutionsArchitect")(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SA_OPTIONS.map((sa) => (
                    <SelectItem key={sa} value={sa}>
                      {sa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="License Start Date" required error={errors.licenseStart}>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  type="date" value={form.licenseStart} onChange={(e) => set("licenseStart")(e.target.value)}
                  className="pl-8"
                  aria-invalid={!!errors.licenseStart}
                />
              </div>
              {errors.licenseStart && <p className="flex items-center gap-1 text-xs text-[#ef4444]"><AlertCircle size={11} />{errors.licenseStart}</p>}
            </Field>
          </>
        )}
      </div>

      {/* Trial toggle */}
      <div className="flex items-start gap-3 p-4 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl">
        <Switch
          checked={form.isTrial}
          onCheckedChange={(checked) => setForm((f) => ({ ...f, isTrial: checked }))}
          className="data-[checked]:bg-amber-500 mt-0.5"
        />
        <div>
          <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">Start as Trial</p>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5">
            Tenant starts in trial status. Billing deferred — no invoice until trial is converted.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 3: Plan selection ───────────────────────────────────────────────────
function Step3({ form, setForm, errors }) {
  const isSaaS = form.deployment === "saas";
  const tiers  = isSaaS ? SAAS_TIERS : ONPREM_TIERS;
  const mrr    = computeEstimatedMRR(form);

  // Warn if seat count doesn't fit tier range
  const tierMismatch = (() => {
    if (!isSaaS || !form.tier || !form.seats) return null;
    const count = parseInt(form.seats);
    if (form.tier === "lite"   && count > 100)  return "Lite supports up to 100 users. Consider Growth tier.";
    if (form.tier === "growth" && count > 500)  return "Growth supports up to 500 users. Consider Scale tier.";
    if (form.tier === "scale"  && count < 500)  return "Scale is intended for 500+ users.";
    return null;
  })();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Select Plan</h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
          {isSaaS
            ? "Monthly per-seat billing. Tier upgrades take effect at the next billing cycle."
            : "Fixed monthly license fee. Unlimited users on your own infrastructure."}
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(tiers).map(([tierKey, def]) => {
          const selected  = form.tier === tierKey;
          const isGrowth  = tierKey === "growth";
          const isScale   = tierKey === "scale";
          const highlight = isSaaS ? isGrowth : isScale;
          return (
            <button key={tierKey}
              onClick={() => setForm(f => ({ ...f, tier: tierKey }))}
              className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all ${
                selected
                  ? "border-[#2563eb] shadow-lg shadow-blue-500/15"
                  : highlight
                    ? "border-[#cbd5e1] dark:border-[#475569] shadow-md"
                    : "border-[#e2e8f0] dark:border-[#334155]"
              }`}>
              {highlight && !selected && (
                <div className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b]">
                  POPULAR
                </div>
              )}
              {selected && (
                <div className="absolute top-3 right-3 size-6 rounded-full bg-[#2563eb] flex items-center justify-center z-10">
                  <Check size={12} className="text-white" />
                </div>
              )}

              {/* Gradient header */}
              <div className={`bg-gradient-to-br ${TIER_GRADIENTS[tierKey]} px-4 pt-4 pb-4 text-white`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">
                  {isSaaS ? "SaaS" : "On-Prem"}
                </p>
                <h3 className="text-lg font-bold">{def.label}</h3>
                {isSaaS ? (
                  <p className="text-2xl font-bold mt-1">
                    ${def.pricePerSeat}<span className="text-xs font-normal opacity-70">/seat/mo</span>
                  </p>
                ) : (
                  <p className="text-2xl font-bold mt-1">
                    ${(def.monthlyFee ?? 0).toLocaleString()}<span className="text-xs font-normal opacity-70">/mo</span>
                  </p>
                )}
                {isSaaS && <p className="text-[10px] opacity-60 mt-0.5">{def.seatRange}</p>}
              </div>

              {/* Limits */}
              <div className="bg-white dark:bg-[#1e293b] px-4 py-3 flex flex-col gap-1.5 text-xs">
                {[
                  ["Agents",         fmtLimit(def.limits.agents)             ],
                  ["Concurrent Flows", fmtLimit(def.limits.concurrentFlows)  ],
                  ["Flow Exec / mo", fmtLimit(def.limits.flowExecPerMonth)   ],
                  ...(isSaaS ? [["Knowledge Hub", fmtLimit(def.limits.knowledgeHubGB, " GB")]] : []),
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex items-center justify-between">
                    <span className="text-[#94a3b8]">{lbl}</span>
                    <span className="font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{val}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Seat count (SaaS only) */}
      {isSaaS && (
        <div className="flex flex-col gap-3">
          <Field label="Seats to Provision" required error={errors.seats}>
            <div className="flex items-center gap-3">
              <div className="relative w-40">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  type="number"
                  min="1"
                  value={form.seats}
                  onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                  placeholder="e.g. 100"
                  className="pl-8"
                  aria-invalid={!!errors.seats}
                />
              </div>
              {form.tier && form.seats && (
                <div className="flex items-center gap-1.5 text-sm text-[#475569] dark:text-[#94a3b8]">
                  <span className="text-[#94a3b8]">×</span>
                  <span>${SAAS_TIERS[form.tier]?.pricePerSeat}/seat</span>
                  <span className="text-[#94a3b8]">=</span>
                  <span className="font-bold text-[#0f172a] dark:text-[#f1f5f9]">
                    ${((parseInt(form.seats) || 0) * (SAAS_TIERS[form.tier]?.pricePerSeat ?? 0)).toLocaleString()}/mo
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">(seats only)</span>
                </div>
              )}
            </div>
          </Field>
          {tierMismatch && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e]">
              <AlertCircle size={14} className="text-[#d97706] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#92400e] dark:text-[#fde68a]">{tierMismatch}</p>
            </div>
          )}
        </div>
      )}

      {/* MRR estimate */}
      {form.tier && (
        <div className="flex items-center gap-3 p-4 bg-[#f0fdf4] dark:bg-[#052e16] border border-[#bbf7d0] dark:border-[#166534] rounded-xl">
          <DollarSign size={18} className="text-[#16a34a] flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#14532d] dark:text-[#86efac]">
              Estimated MRR: ${mrr.toLocaleString()}/mo
              {isSaaS && <span className="font-normal text-[#16a34a] dark:text-[#4ade80] text-xs ml-1">(seats only — token costs billed separately)</span>}
            </p>
            <p className="text-xs text-[#16a34a] dark:text-[#4ade80] mt-0.5">
              Billing is manual. First invoice issued at the start of next month.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STEP 4: Limit overrides ──────────────────────────────────────────────────
function Step4({ form, setForm }) {
  const isSaaS = form.deployment === "saas";
  const tierDef = isSaaS ? SAAS_TIERS[form.tier] : ONPREM_TIERS[form.tier];
  const baseLimits = tierDef?.limits ?? {};

  const OVERRIDE_DEFS = isSaaS ? [
    { key: "agents",           label: "Agents",               icon: Sparkles, unit: ""     },
    { key: "workflows",        label: "Workflows",            icon: Workflow,  unit: ""     },
    { key: "concurrentFlows",  label: "Concurrent Flows",     icon: Zap,       unit: ""     },
    { key: "flowExecPerMonth", label: "Flow Executions / mo", icon: Zap,       unit: ""     },
    { key: "knowledgeHubGB",   label: "Knowledge Hub",        icon: HardDrive, unit: " GB"  },
  ] : [
    { key: "agents",           label: "Agents",               icon: Sparkles, unit: ""     },
    { key: "concurrentFlows",  label: "Concurrent Flows",     icon: Zap,       unit: ""     },
    { key: "flowExecPerMonth", label: "Flow Executions / mo", icon: Zap,       unit: ""     },
  ];

  const setOverride = (key, val) => {
    setForm(f => ({
      ...f,
      overrides: {
        ...f.overrides,
        [key]: val === "" ? undefined : Number(val),
      },
    }));
  };

  const clearOverride = (key) => {
    setForm(f => {
      const next = { ...f.overrides };
      delete next[key];
      return { ...f, overrides: next };
    });
  };

  const hasAnyOverride = Object.keys(form.overrides ?? {}).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Custom Limit Overrides</h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
          Optional. Leave blank to use tier defaults. Overrides apply to this tenant only.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3.5 bg-[#eff6ff] dark:bg-[#1e3a8a]/20 border border-[#bfdbfe] dark:border-[#1e3a8a] rounded-xl">
        <BadgeCheck size={15} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#1e40af] dark:text-[#93c5fd] leading-5">
          Override values take precedence over the <strong>{tierDef?.label}</strong> tier defaults.
          Tenant-level overrides are preserved even if the base tier pricing changes.
        </p>
      </div>

      {/* Override table */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_140px] border-b border-[#f1f5f9] dark:border-[#334155]">
          {["Limit", "Tier Default", "Custom Value"].map(h => (
            <div key={h} className="px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">{h}</div>
          ))}
        </div>
        {OVERRIDE_DEFS.map(({ key, label, icon: Icon, unit }) => {
          const base = baseLimits[key] ?? null;
          const ov   = form.overrides?.[key];
          return (
            <div key={key} className="grid grid-cols-[1fr_140px_140px] border-b border-[#f8fafc] dark:border-[#1e293b] last:border-0 items-center hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
              <div className="px-4 py-3 flex items-center gap-2 text-sm text-[#475569] dark:text-[#94a3b8]">
                <Icon size={13} /> {label}
              </div>
              <div className="px-4 py-3 text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9] tabular-nums">
                {base != null ? `${fmtLimit(base)}${unit}` : "Unlimited"}
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    value={ov ?? ""}
                    onChange={(e) => setOverride(key, e.target.value)}
                    placeholder="Default"
                    className="w-20 h-7 px-2 text-xs"
                  />
                  {ov != null && (
                    <button onClick={() => clearOverride(key)} className="text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasAnyOverride ? (
        <div className="flex items-center gap-2 text-xs text-[#2563eb]">
          <BadgeCheck size={13} />
          {Object.keys(form.overrides).length} override{Object.keys(form.overrides).length !== 1 ? "s" : ""} applied
        </div>
      ) : (
        <p className="text-xs text-[#94a3b8]">No overrides set — tier defaults will apply.</p>
      )}
    </div>
  );
}

// ─── STEP 5: Review & confirm ─────────────────────────────────────────────────
function Step5({ form }) {
  const isSaaS  = form.deployment === "saas";
  const tierDef = isSaaS ? SAAS_TIERS[form.tier] : ONPREM_TIERS[form.tier];
  const mrr     = computeEstimatedMRR(form);
  const overrideCount = Object.keys(form.overrides ?? {}).filter(k => form.overrides[k] != null).length;

  const rows = [
    { label: "Organisation",  value: form.name || "—"                  },
    { label: "Domain",        value: form.domain || "—"                },
    { label: "Industry",      value: form.industry || "Not specified"  },
    { label: "Contact",       value: `${form.contactName} · ${form.contactEmail}` },
    { label: "Deployment",    value: isSaaS ? "SaaS Cloud" : "On-Premises" },
    { label: "Tier",          value: tierDef?.label ?? "—"             },
    ...(isSaaS    ? [{ label: "Seats",    value: `${form.seats || 0} provisioned` }] : []),
    ...(isSaaS    ? [{ label: "Token rate", value: `$${tierDef?.tokenRatePerM?.toFixed(2)}/1M` }] : []),
    ...(!isSaaS && form.solutionsArchitect ? [{ label: "Solutions Architect", value: form.solutionsArchitect }] : []),
    ...(!isSaaS && form.licenseStart       ? [{ label: "License Start", value: form.licenseStart }] : []),
    { label: "Status",        value: form.isTrial ? "Trial" : "Active" },
    { label: "Overrides",     value: overrideCount > 0 ? `${overrideCount} custom limit${overrideCount !== 1 ? "s" : ""}` : "None (tier defaults)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Review & Confirm</h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
          Check everything below before creating the tenant.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
        {/* Coloured header */}
        <div className={`bg-gradient-to-br ${TIER_GRADIENTS[form.tier] ?? "from-[#475569] to-[#334155]"} px-5 py-4 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">{isSaaS ? "SaaS Cloud" : "On-Premises"}</p>
              <h3 className="text-xl font-bold mt-0.5">{form.name || "New Tenant"}</h3>
              <p className="text-sm opacity-70">{form.domain}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${mrr.toLocaleString()}<span className="text-xs font-normal opacity-70">/mo</span></p>
              <p className="text-[10px] opacity-60">{isSaaS ? "seats only" : "license fee"}</p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-xs text-[#94a3b8] font-medium">{label}</span>
              <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overrides detail */}
      {overrideCount > 0 && (
        <div className="bg-[#eff6ff] dark:bg-[#1e3a8a]/20 border border-[#bfdbfe] dark:border-[#1e3a8a] rounded-xl px-5 py-3.5">
          <p className="text-xs font-semibold text-[#2563eb] mb-2">Custom Limit Overrides</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(form.overrides).filter(([, v]) => v != null).map(([key, val]) => (
              <span key={key} className="text-xs bg-[#2563eb] text-white px-2 py-0.5 rounded-full font-medium">
                {key}: {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Billing notice */}
      <div className="flex items-start gap-3 p-4 bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] rounded-xl">
        <AlertCircle size={15} className="text-[#d97706] mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-[#92400e] dark:text-[#fde68a]">Manual Billing</p>
          <p className="text-xs text-[#92400e] dark:text-[#fde68a] mt-0.5 leading-4">
            {form.isTrial
              ? "Tenant starts in Trial. No invoice will be issued until the trial is converted to Active."
              : "First invoice will be issued at the start of next month. Payment terms: Net 30."}
          </p>
        </div>
      </div>

      {/* Post-creation actions note */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">What happens next</p>
        <div className="flex flex-col gap-2">
          {[
            "Tenant record created and visible in the Tenants list",
            `Welcome email sent to ${form.contactEmail || "the contact"}`,
            "You'll be redirected to the new Tenant Detail page",
            ...(form.deployment === "on-prem" ? ["Infrastructure readiness checklist triggered for Solutions Architect"] : []),
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#475569] dark:text-[#94a3b8]">
              <ArrowRight size={12} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  deployment: "", tier: "", seats: "",
  name: "", domain: "", industry: "", contactName: "", contactEmail: "",
  solutionsArchitect: "Unassigned", licenseStart: "",
  isTrial: false,
  overrides: {},
};

export default function TenantCreatePage({ onNavigate, onTenantCreated }) {
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [created,  setCreated]  = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (stepNum) => {
    const e = {};
    if (stepNum === 1) {
      if (!form.deployment) e.deployment = "Please select a deployment type.";
    }
    if (stepNum === 2) {
      if (!form.name.trim())         e.name         = "Organisation name is required.";
      if (!form.domain.trim())       e.domain       = "Domain is required.";
      if (!form.contactName.trim())  e.contactName  = "Contact name is required.";
      if (!form.contactEmail.trim()) e.contactEmail = "Contact email is required.";
      else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) e.contactEmail = "Enter a valid email.";
      if (form.deployment === "on-prem" && !form.licenseStart) e.licenseStart = "License start date is required.";
      // Domain uniqueness
      const existing = TENANTS.find(t => t.domain.toLowerCase() === form.domain.trim().toLowerCase());
      if (existing) e.domain = `Domain already exists (${existing.name}).`;
    }
    if (stepNum === 3) {
      if (!form.tier) e.tier = "Please select a tier.";
      if (form.deployment === "saas") {
        if (!form.seats || parseInt(form.seats) < 1) e.seats = "Enter the number of seats to provision.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setErrors({});
    setStep(s => Math.min(5, s + 1));
  };

  const back = () => { setErrors({}); setStep(s => Math.max(1, s - 1)); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setCreating(true);
    // Simulate async creation
    setTimeout(() => {
      const newTenant = {
        id: Date.now(),
        name: form.name.trim(),
        domain: form.domain.trim(),
        deployment: form.deployment,
        tier: form.tier,
        seats: form.deployment === "saas" ? parseInt(form.seats) : null,
        status: form.isTrial ? "trial" : "active",
        industry: form.industry || "Other",
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        createdAt: new Date().toISOString().split("T")[0],
        ...(form.deployment === "on-prem" ? {
          solutionsArchitect: form.solutionsArchitect !== "Unassigned" ? form.solutionsArchitect : undefined,
          licenseStart: form.licenseStart,
        } : {}),
        overrides: form.overrides ?? {},
        usage: { tokensConsumed: 0, seatsUsed: 0, flowExecutions: 0, storageGB: 0, trend: [0,0,0,0,0,0] },
      };
      setCreating(false);
      setCreated(true);
      setTimeout(() => onTenantCreated?.(newTenant), 1200);
    }, 800);
  };

  // ── Success overlay ─────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <Sidebar activePage="tenants" onNavigate={onNavigate} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppHeader onNavigate={onNavigate} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="size-16 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                <div className="size-11 rounded-full bg-[#dcfce7] flex items-center justify-center">
                  <Check size={22} className="text-[#16a34a]" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Tenant Created!</h2>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
                  {form.name} has been added. Redirecting to tenant details…
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canNext = step === 1 ? !!form.deployment : true;
  const isLastStep = step === 5;

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="tenants" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]" />
            <button onClick={() => onNavigate?.("tenants")}
              className="text-sm text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] transition-colors">
              Tenants
            </button>
            <ChevronRight size={14} className="text-[#94a3b8]" />
            <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] font-medium">New Tenant</span>
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">

            {/* Step indicator */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f1f5f9] tracking-tight">Create New Tenant</h1>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                Provision a new customer organisation on the Aziron platform.
              </p>
              <div className="mt-3">
                <StepIndicator current={step} />
              </div>
            </div>

            {/* Step content */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
              {step === 1 && <Step1 form={form} setForm={setForm} />}
              {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
              {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
              {step === 4 && <Step4 form={form} setForm={setForm} />}
              {step === 5 && <Step5 form={form} />}

              {/* Step 1 validation error */}
              {step === 1 && errors.deployment && (
                <p className="flex items-center gap-1.5 mt-4 text-sm text-[#ef4444]">
                  <AlertCircle size={14} />{errors.deployment}
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={step === 1 ? () => onNavigate?.("tenants") : back}>
                <ChevronLeft size={15} />
                {step === 1 ? "Cancel" : "Back"}
              </Button>

              <div className="flex items-center gap-2">
                {/* Step dots */}
                <div className="flex items-center gap-1 mr-2">
                  {STEPS.map(s => (
                    <div key={s.id} className={`transition-all rounded-full ${
                      s.id === step   ? "w-4 h-2 bg-[#2563eb]" :
                      s.id < step    ? "w-2 h-2 bg-[#16a34a]" :
                                       "w-2 h-2 bg-[#e2e8f0] dark:bg-[#334155]"
                    }`} />
                  ))}
                </div>

                {isLastStep ? (
                  <Button
                    onClick={handleCreate} disabled={creating}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60"
                  >
                    {creating ? (
                      <>
                        <div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <><Check size={15} /> Create Tenant</>
                    )}
                  </Button>
                ) : (
                  <Button onClick={next} disabled={!canNext}>
                    Continue <ChevronRight size={15} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
