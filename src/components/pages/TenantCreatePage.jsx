import { useState, useEffect } from "react";
import {
  ChevronRight, ChevronLeft, Check, AlertCircle,
  Globe, Mail, UserCircle, ArrowRight, Package, Link2,
  Sparkles, Building2, Rocket, Crown,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { TENANTS } from "@/data/adminData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Stepper, StepperIndicator, StepperItem, StepperNav,
  StepperSeparator, StepperTitle, StepperTrigger,
} from "@/components/ui/stepper";

// ─── Constants ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Finance", "Healthcare", "Logistics", "Education", "Manufacturing",
  "Retail", "Insurance", "Pharma", "Media", "Consulting", "Technology", "Other",
];

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Review"  },
];

const PLAN_OPTIONS = [
  {
    value: "trial",
    icon: Sparkles,
    title: "Trial",
    color: "#f59e0b",
    desc: "30-day free trial. No billing until converted. Limited to 50 users.",
    features: ["30-day period", "No credit card", "Up to 50 users", "All core features"],
  },
  {
    value: "standard",
    icon: Building2,
    title: "Standard",
    color: "#0ea5e9",
    desc: "Ideal for small teams getting started with AI automation.",
    features: ["Up to 100 users", "5 agents / 2 workflows", "Email support", "99.9% uptime SLA"],
  },
  {
    value: "professional",
    icon: Rocket,
    title: "Professional",
    color: "#8b5cf6",
    desc: "For growing teams that need more capacity and priority support.",
    features: ["Up to 500 users", "10 agents / 10 workflows", "Priority support", "Audit logs"],
  },
  {
    value: "enterprise",
    icon: Crown,
    title: "Enterprise",
    color: "#2563eb",
    desc: "Unlimited scale with dedicated infrastructure and HIPAA compliance.",
    features: ["Unlimited users", "Unlimited agents", "Dedicated infra", "HIPAA + SSO"],
  },
];

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Step progress indicator ──────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <Stepper value={current} indicators={{ completed: <Check size={14} /> }} className="w-full">
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
              <StepperSeparator className="h-px w-20 mb-4 mx-1 transition-all data-[step-state=completed]:bg-[#16a34a] data-[step-state=inactive]:bg-[#e2e8f0] dark:data-[step-state=inactive]:bg-[#334155]" />
            )}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#374151] dark:text-[#d1d5db]">
        {label}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
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

// ─── STEP 1: Organisation details ────────────────────────────────────────────
function Step2({ form, setForm, errors }) {
  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  // Auto-generate slug from name (only when slug hasn't been manually edited)
  const [slugTouched, setSlugTouched] = useState(false);
  useEffect(() => {
    if (!slugTouched && form.name) {
      setForm(f => ({ ...f, slug: toSlug(form.name) }));
    }
  }, [form.name, slugTouched]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Organisation Details</h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">Basic info and the plan for this tenant.</p>
      </div>

      {/* Plan picker */}
      <div>
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">Plan</p>
        <div className="grid grid-cols-2 gap-3">
          {PLAN_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const selected = form.plan === opt.value;
            return (
              <button key={opt.value}
                type="button"
                onClick={() => {
                  setForm(f => ({ ...f, plan: opt.value, isTrial: opt.value === "trial" }));
                }}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-[#2563eb] bg-[#eff6ff] dark:bg-[#1e3a8a]/20 shadow-sm shadow-blue-500/10"
                    : "border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] hover:border-[#93c5fd]"
                }`}>
                {selected && (
                  <div className="absolute top-3 right-3 size-5 rounded-full bg-[#2563eb] flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
                <div className="size-8 rounded-lg flex items-center justify-center mb-2.5"
                  style={{ background: `${opt.color}18` }}>
                  <Icon size={16} style={{ color: opt.color }} />
                </div>
                <p className="text-sm font-bold text-[#0f172a] dark:text-[#f1f5f9] mb-1">{opt.title}</p>
                <p className="text-xs text-[#64748b] dark:text-[#94a3b8] leading-4 mb-2">{opt.desc}</p>
                <div className="flex flex-col gap-1">
                  {opt.features.map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-[11px] text-[#475569] dark:text-[#94a3b8]">
                      <Check size={10} className="text-[#16a34a] flex-shrink-0" />{f}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        {errors.plan && (
          <p className="flex items-center gap-1 text-xs text-[#ef4444] mt-1.5">
            <AlertCircle size={11} />{errors.plan}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Organisation Name" required error={errors.name}>
          <Input value={form.name} onChange={e => set("name")(e.target.value)} placeholder="e.g. Acme Corp" />
        </Field>

        {/* Slug field */}
        <Field label="URL Slug" required error={errors.slug}
          hint="Unique identifier — lowercase letters, numbers, hyphens">
          <div className="relative">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              value={form.slug}
              onChange={e => {
                setSlugTouched(true);
                setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }));
              }}
              placeholder="acme-corp"
              className="pl-8 font-mono text-sm"
            />
          </div>
        </Field>

        <Field label="Domain" required error={errors.domain}>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input value={form.domain} onChange={e => set("domain")(e.target.value)} placeholder="acme.com" className="pl-8" />
          </div>
        </Field>
        <Field label="Industry">
          <Select value={form.industry} onValueChange={set("industry")}>
            <SelectTrigger><SelectValue placeholder="Select industry…" /></SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Contact Name" required error={errors.contactName}>
          <div className="relative">
            <UserCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input value={form.contactName} onChange={e => set("contactName")(e.target.value)} placeholder="Jane Smith" className="pl-8" />
          </div>
        </Field>
        <Field label="Contact Email" required error={errors.contactEmail}>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input type="email" value={form.contactEmail} onChange={e => set("contactEmail")(e.target.value)} placeholder="jane@acme.com" className="pl-8" />
          </div>
        </Field>

        <Field label="Max Users" hint="Leave blank for unlimited">
          <Input
            type="number" min="1" value={form.max_users}
            onChange={e => set("max_users")(e.target.value)}
            placeholder="e.g. 100"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── STEP 3: Review & Confirm ─────────────────────────────────────────────────
const PLAN_LABELS = { trial: "Trial", standard: "Standard", professional: "Professional", enterprise: "Enterprise" };

function Step3({ form, onEditDetails }) {
  const rows = [
    { label: "Organisation", value: form.name || "—" },
    { label: "Slug",         value: form.slug || "—", mono: true },
    { label: "Domain",       value: form.domain || "—" },
    { label: "Plan",         value: PLAN_LABELS[form.plan] || "—" },
    { label: "Industry",     value: form.industry || "Not specified" },
    { label: "Contact",      value: `${form.contactName} · ${form.contactEmail}` },
    ...(form.max_users ? [{ label: "Max Users", value: form.max_users.toString() }] : [{ label: "Max Users", value: "Unlimited" }]),
    { label: "Status",       value: form.isTrial ? "Trial" : "Active" },
    { label: "Packages",     value: "None — assign after creation" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Review & Confirm</h2>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">
            Check the organisation details. You'll assign packages in the next step.
          </p>
        </div>
        {onEditDetails && (
          <button
            type="button"
            onClick={onEditDetails}
            className="shrink-0 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] dark:text-[#60a5fa] dark:hover:text-[#93c5fd] underline-offset-2 hover:underline"
          >
            Edit details
          </button>
        )}
      </div>

      {/* Summary card */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
        <div className="px-5 py-4 text-white bg-gradient-to-br from-[#2563eb] to-[#1d4ed8]">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">
            SaaS Cloud
          </p>
          <h3 className="text-xl font-bold">{form.name || "New Tenant"}</h3>
          <p className="text-sm opacity-70">{form.domain}</p>
        </div>
        <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
          {rows.map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-xs text-[#94a3b8] font-medium">{label}</span>
              <span className={`text-sm font-medium ${mono ? "font-mono" : ""} ${
                label === "Packages" ? "text-[#94a3b8] italic" : "text-[#0f172a] dark:text-[#f1f5f9]"
              }`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Package assignment notice */}
      <div className="flex items-start gap-3 p-4 bg-[#eff6ff] dark:bg-[#1e3a8a]/20 border border-[#bfdbfe] dark:border-[#1e3a8a] rounded-xl">
        <Package size={16} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#1e40af] dark:text-[#93c5fd]">Packages assigned separately</p>
          <p className="text-xs text-[#1e40af] dark:text-[#93c5fd] mt-0.5 leading-4">
            After creating the tenant, go to the <strong>Packages tab</strong> in Tenant Detail to assign a base tier
            and any add-on packages. Billing starts only when the first package is assigned.
          </p>
        </div>
      </div>

      {/* What happens next */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">What happens next</p>
        {[
          "Tenant record created and visible in the Tenants list",
          `Welcome email sent to ${form.contactEmail || "the contact"}`,
          "You'll be redirected to the Tenant Detail page",
          "Assign a base tier + optional add-ons from the Packages tab",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-[#475569] dark:text-[#94a3b8]">
            <ArrowRight size={12} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  deployment: "saas", plan: "", name: "", slug: "", domain: "", industry: "",
  contactName: "", contactEmail: "", max_users: "",
  isTrial: false,
};

export default function TenantCreatePage({ onNavigate, onTenantCreated }) {
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState({});
  const [creating, setCreating] = useState(false);
  const [created, setCreated]   = useState(null); // created tenant

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = stepNum => {
    const e = {};
    if (stepNum === 1) {
      if (!form.plan)                e.plan         = "Please select a plan.";
      if (!form.name.trim())         e.name         = "Organisation name is required.";
      if (!form.slug.trim())         e.slug         = "Slug is required.";
      else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) e.slug = "Slug must be lowercase letters, numbers, and hyphens only.";
      else if (TENANTS.find(t => t.slug === form.slug.trim())) e.slug = "This slug is already taken.";
      if (!form.domain.trim())       e.domain       = "Domain is required.";
      if (!form.contactName.trim())  e.contactName  = "Contact name is required.";
      if (!form.contactEmail.trim()) e.contactEmail = "Contact email is required.";
      else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) e.contactEmail = "Enter a valid email.";
      if (form.max_users && parseInt(form.max_users) < 1) e.max_users = "Must be at least 1.";
      const existing = TENANTS.find(t => t.domain.toLowerCase() === form.domain.trim().toLowerCase());
      if (existing) e.domain = `Domain already exists (${existing.name}).`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) { setErrors({}); setStep(s => Math.min(2, s + 1)); } };
  const back = () => { setErrors({}); setStep(s => Math.max(1, s - 1)); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setCreating(true);
    setTimeout(() => {
      const newTenant = {
        id: Date.now(),
        name: form.name.trim(),
        slug: form.slug.trim(),
        domain: form.domain.trim(),
        plan: form.plan,
        deployment: "saas",
        tier: null, seats: null,
        max_users: form.max_users ? parseInt(form.max_users) : null,
        status: form.plan === "trial" ? "trial" : "active",
        industry: form.industry || "Other",
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        createdAt: new Date().toISOString().split("T")[0],
        overrides: {},
        settings: {},
        usage: { tokensConsumed: 0, seatsUsed: 0, flowExecutions: 0, storageGB: 0, trend: [0,0,0,0,0,0] },
      };
      setCreating(false);
      setCreated(newTenant);
    }, 800);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <Sidebar activePage="tenants" onNavigate={onNavigate} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppHeader onNavigate={onNavigate} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-5 text-center max-w-sm">
              <div className="size-16 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                <div className="size-11 rounded-full bg-[#dcfce7] flex items-center justify-center">
                  <Check size={22} className="text-[#16a34a]" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">Tenant Created!</h2>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">
                  <strong>{created.name}</strong> has been added. Now assign a package to activate billing.
                </p>
              </div>

              {/* Next-step callout */}
              <div className="w-full flex items-start gap-3 p-4 bg-[#eff6ff] dark:bg-[#1e3a8a]/20 border border-[#bfdbfe] dark:border-[#1e3a8a] rounded-xl text-left">
                <Package size={16} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#1e40af] dark:text-[#93c5fd]">Next: Assign a Package</p>
                  <p className="text-xs text-[#1e40af] dark:text-[#93c5fd] mt-0.5 leading-4">
                    Open the <strong>Packages tab</strong> in Tenant Detail to assign a base tier and any add-ons.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onNavigate?.("tenants")}>
                  Back to Tenants
                </Button>
                <Button
                  className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                  onClick={() => onTenantCreated?.(created)}
                >
                  Open Tenant <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLastStep = step === 2;

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
          <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-8">

            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f1f5f9] tracking-tight">Create New Tenant</h1>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                Provision a new customer organisation. Packages are assigned after creation.
              </p>
              <div className="mt-3">
                <StepIndicator current={step} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
              {step === 1 && <Step2 form={form} setForm={setForm} errors={errors} />}
              {step === 2 && <Step3 form={form} onEditDetails={() => setStep(1)} />}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={step === 1 ? () => onNavigate?.("tenants") : back}>
                <ChevronLeft size={15} />
                {step === 1 ? "Cancel" : "Back"}
              </Button>

              <div className="flex items-center gap-2">
                {isLastStep ? (
                  <Button onClick={handleCreate} disabled={creating} className="bg-green-600 hover:bg-green-700 disabled:opacity-60">
                    {creating ? (
                      <><div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
                    ) : (
                      <><Check size={15} /> Create Tenant</>
                    )}
                  </Button>
                ) : (
                  <Button onClick={next}>
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
