import { useState, useEffect, useCallback } from "react";
import {
  Shield, ChevronRight, CheckCircle2, Clock, Calendar,
  Heart, Eye, Smile, Activity, Star, AlertTriangle,
  ArrowRight, ChevronDown, Info, Zap, Users, FileText,
  X, SkipForward, Lock,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";

// ─── Config ───────────────────────────────────────────────────────────────────

const POLICY = {
  name:     "HealthFirst Plus Group Mediclaim Policy",
  year:     "2026",
  provider: "HealthFirst Plus",
  tagline:  "Comprehensive corporate coverage, powered by Aziron",
  sumInsured: "₹5,00,000",
  premiumRange: "₹0 – ₹4,200 / yr",
  networkHospitals: "5,000+",
  coverageTypes: [
    { icon: Heart,    label: "Medical",          desc: "Hospitalisation, surgeries, OPD visits", color: "#ef4444", bg: "#fef2f2" },
    { icon: Smile,    label: "Dental",           desc: "Cleanings, fillings, orthodontics",       color: "#f59e0b", bg: "#fffbeb" },
    { icon: Eye,      label: "Vision",           desc: "Eyeglasses, contacts, eye exams",         color: "#2563eb", bg: "#eff6ff" },
    { icon: Activity, label: "Life Insurance",   desc: "Coverage up to ₹50L for your family",     color: "#7c3aed", bg: "#f5f3ff" },
    { icon: Shield,   label: "Critical Illness", desc: "40+ critical conditions covered",         color: "#059669", bg: "#ecfdf5" },
    { icon: Star,     label: "Mental Health",    desc: "Therapy, counselling, wellness sessions", color: "#0891b2", bg: "#ecfeff" },
  ],
  highlights: [
    "Zero waiting period for existing conditions",
    "Cashless claims at 5,000+ network hospitals",
    "Family floater plans available",
    "24/7 teleconsultation included",
  ],
};

const DEADLINE = { label: "May 15, 2026", daysLeft: 1, cycle: "Cycle 1", cycleRange: "May 1 – May 15" };

// ─── Wizard constants & helpers ───────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 1, label: "Employee Info"  },
  { id: 2, label: "Self Insurance" },
  { id: 3, label: "Parents"        },
  { id: 4, label: "Spouse"         },
  { id: 5, label: "Children"       },
  { id: 6, label: "Review"         },
];

const DEPARTMENTS  = ["Engineering","Product","Design","Sales","Marketing","HR","Finance","Operations","Legal"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const DRAFT_KEY    = "aziron_enrollment_draft";

function calcAge(dob) {
  if (!dob) return "";
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a >= 0 ? String(a) : "";
}

function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
}
function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}

function WField({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function WInput({ value, onChange, placeholder, type = "text", disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`h-10 px-3 rounded-xl border text-sm text-[#0f172a] outline-none transition-colors w-full ${
        disabled
          ? "bg-[#f1f5f9] text-[#64748b] cursor-not-allowed border-[#e2e8f0]"
          : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1] focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
      }`}
    />
  );
}

function WSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-10 px-3 rounded-xl border border-[#e2e8f0] text-sm text-[#0f172a] bg-white outline-none hover:border-[#cbd5e1] focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-colors w-full"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function DraftBadge({ state }) {
  if (state === "not_started") return null;
  const cfg = state === "draft_saved"
    ? { label: "Draft Saved",  dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" }
    : { label: "In Progress",  dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50 border-blue-200"       };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── View: Confirmation landing ───────────────────────────────────────────────

const FEATURE_TAGS = [
  { icon: Shield,   label: "Cashless Hospitalization" },
  { icon: Users,    label: "Family Coverage"          },
  { icon: Heart,    label: "Parents Included"         },
  { icon: Clock,    label: "24/7 Support"             },
  { icon: Activity, label: "Annual Health Checkup"    },
];

const STATS = [
  { value: "10K+", label: "Hospitals"   },
  { value: "24/7", label: "Support"     },
];

const INFO_CARDS = [
  {
    icon: Calendar,
    bg: "linear-gradient(135deg, #ff2056 0%, #ff6900 100%)",
    label: "Enrollment Deadline",
    value: "May 30, 2026",
  },
  {
    icon: Clock,
    bg: "linear-gradient(135deg, #615fff 0%, #8e51ff 100%)",
    label: "Estimated Time",
    value: "~ 5 minutes",
  },
  {
    icon: Users,
    bg: "linear-gradient(135deg, #00bc7d 0%, #00bba7 100%)",
    label: "Coverage Includes",
    value: "Self + Family Dependents",
  },
];

const TRUST_BADGES = [
  { icon: Lock,         label: "Information is securely encrypted" },
  { icon: CheckCircle2, label: "HR & Insurance compliant"           },
  { icon: Info,         label: "Used only for enrollment purposes"  },
];

function ConfirmationView({ firstName, onProceed, onSkip }) {
  return (
    <div
      className="flex-1 flex items-center justify-center px-8 py-10 relative overflow-hidden"
      style={{
        background: "linear-gradient(147.5deg, #f8fafc 0%, rgba(238,242,255,0.4) 50%, rgba(245,243,255,0.6) 100%)",
      }}
    >
      {/* Decorative blur blobs */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 384, height: 384,
          top: -160, right: 0,
          background: "rgba(198,210,255,0.4)",
          filter: "blur(64px)",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 384, height: 384,
          left: -128, top: 358,
          background: "rgba(221,214,255,0.4)",
          filter: "blur(64px)",
        }}
      />

      <div className="w-full max-w-[1100px] flex gap-8 items-stretch relative z-10">

        {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col justify-between overflow-hidden rounded-3xl p-8"
          style={{
            flex: "0 0 38%",
            minHeight: 580,
            background: "linear-gradient(127.24deg, #2610ca 0%, #b33434 100%)",
            border: "1px solid rgba(226,232,240,0.6)",
            boxShadow: "0px 20px 25px -5px rgba(97,95,255,0.2), 0px 8px 10px -6px rgba(97,95,255,0.2)",
          }}
        >
          {/* Glow blobs inside card */}
          <div className="absolute pointer-events-none rounded-full opacity-30"
            style={{ width: 288, height: 288, right: -80, top: -80, background: "rgba(255,255,255,0.3)", filter: "blur(64px)" }} />
          <div className="absolute pointer-events-none rounded-full opacity-40"
            style={{ width: 256, height: 256, left: -40, bottom: 0, background: "rgba(244,168,255,0.4)", filter: "blur(64px)" }} />

          {/* Top content */}
          <div className="relative z-10 flex flex-col gap-6">
            {/* Enrollment open badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <span className="size-1.5 rounded-full bg-[#5ee9b5] opacity-50" />
              <span className="text-xs text-white">Enrollment open</span>
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-2xl font-medium text-white leading-9" style={{ letterSpacing: "-0.53px" }}>
                HealthFirst Plus<br />Group Mediclaim Policy
              </h2>
              <p className="text-base text-white/85 mt-4 leading-6" style={{ letterSpacing: "-0.31px" }}>
                Comprehensive healthcare coverage designed for you and your family — with cashless access at 10,000+ hospitals.
              </p>
            </div>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2">
              {FEATURE_TAGS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <Icon size={12} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="relative z-10 flex gap-3 mt-8">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="flex-1 flex flex-col px-3 py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <span className="text-base text-white leading-6" style={{ letterSpacing: "-0.71px" }}>{value}</span>
                <span className="text-xs text-white/75 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col rounded-3xl"
          style={{
            flex: 1,
            minHeight: 580,
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(226,232,240,0.7)",
            boxShadow: "0px 20px 25px 0px rgba(226,232,240,0.5), 0px 8px 10px 0px rgba(226,232,240,0.5)",
          }}
        >
          <div className="flex-1 flex flex-col px-8 pt-8 pb-6">

            {/* WELCOME label + gradient rule */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-[#4f39f6] uppercase tracking-[1.2px]">Welcome</span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #c6d2ff, transparent)" }} />
            </div>

            {/* Heading */}
            <h3 className="text-xl font-medium text-[#0f172b] mb-3" style={{ letterSpacing: "-0.95px" }}>
              Welcome, {firstName}
            </h3>

            {/* Description */}
            <p className="text-base text-[#45556c] leading-6 mb-6" style={{ letterSpacing: "-0.31px" }}>
              Aziro has partnered with{" "}
              <strong className="font-bold text-[#0f172b]">HealthFirst Plus</strong>
              {" "}to provide comprehensive corporate health insurance coverage for you and your eligible dependents. Review the policy and complete enrollment in about 5 minutes.
            </p>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {INFO_CARDS.map(({ icon: Icon, bg, label, value }) => (
                <div
                  key={label}
                  className="flex flex-col p-4 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(226,232,240,0.8)",
                    boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="size-9 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <p className="text-[11px] text-[#62748e] uppercase mb-1" style={{ letterSpacing: "0.6px" }}>{label}</p>
                  <p className="text-sm text-[#0f172b] leading-5" style={{ letterSpacing: "-0.15px" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Policy Preview row */}
            <div
              className="flex items-center justify-between px-5 py-4 rounded-2xl mb-5 cursor-pointer hover:bg-white/90 transition-colors"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(226,232,240,0.8)" }}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-[#eef2ff] flex items-center justify-center">
                  <FileText size={16} className="text-[#4f39f6]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0f172b] leading-5" style={{ letterSpacing: "-0.15px" }}>Policy Preview</p>
                  <p className="text-xs font-medium text-[#62748e]">Coverage, network &amp; eligibility details</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#62748e]" />
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-3">
              <button
                onClick={onProceed}
                className="flex-1 h-[50px] rounded-2xl text-base font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(173.46deg, #4f39f6 0%, #7f22fe 100%)",
                  filter: "drop-shadow(0px 10px 7.5px rgba(97,95,255,0.3)) drop-shadow(0px 4px 3px rgba(97,95,255,0.3))",
                  letterSpacing: "-0.31px",
                }}
              >
                Continue Enrollment
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onProceed}
                className="h-[50px] px-6 rounded-2xl text-base font-medium text-[#1d293d] bg-white border border-[#cad5e2] flex items-center justify-center gap-2 hover:bg-[#f8fafc] transition-colors"
                style={{ letterSpacing: "-0.31px" }}
              >
                Review Policy First
                <Eye size={14} />
              </button>
            </div>

            {/* Decide later */}
            <div className="flex justify-start mb-5">
              <button
                onClick={onSkip}
                className="text-sm font-medium text-[#62748e] hover:text-[#0f172b] transition-colors"
                style={{ letterSpacing: "-0.15px" }}
              >
                I'll decide later
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-5 pt-5 border-t border-[rgba(226,232,240,0.7)] flex-wrap">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={14} className="text-[#45556c] flex-shrink-0" />
                  <span className="text-xs text-[#45556c]">{label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// ─── View: Skip confirmation ──────────────────────────────────────────────────

function SkipView({ firstName, onBack, onConfirmSkip }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[460px]">
        <div className="bg-white border border-[#e2e8f0] rounded-3xl overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-amber-400" />
          <div className="px-8 pt-8 pb-7 flex flex-col items-center text-center">
            <div className="size-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
              <AlertTriangle size={28} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a]">Are you sure, {firstName}?</h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Skipping now means you may miss the <strong className="text-[#0f172a]">{DEADLINE.label}</strong> enrollment deadline.
              The next enrollment window opens with Cycle 2 (May 15–31).
            </p>
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-left w-full">
              <p className="text-xs text-amber-800 leading-relaxed">
                If you skip, your enrollment will not be processed in the current batch.
                You can return to this page at any time before the deadline to complete your enrollment.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full mt-6">
              <button
                onClick={onBack}
                className="w-full h-12 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md shadow-blue-200"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
              >
                <ArrowRight size={14} className="rotate-180" />
                Go back and Enroll
              </button>
              <button
                onClick={onConfirmSkip}
                className="w-full h-11 rounded-2xl text-sm font-medium text-[#94a3b8] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] transition-colors"
              >
                Yes, skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: Accordion enrollment form ─────────────────────────────────────────

function EnrollView({ firstName, auth, onSuccess }) {
  const draft = loadDraft();

  const INIT = {
    employeeId: "EMP-2024-001",
    fullName:   auth.user?.name  || "",
    email:      auth.user?.email || "",
    department: "", joiningDate: "",
    dob: "", age: "", gender: "", bloodGroup: "", preExisting: "",
    includeParents: false,
    mother: { firstName: "", lastName: "", dob: "", age: "" },
    father: { firstName: "", lastName: "", dob: "", age: "" },
    isMarried: null,
    spouse:  { fullName: "", dob: "", age: "" },
    children: [],
  };

  const [form,       setForm]       = useState(draft?.form || INIT);
  const [draftState, setDraftState] = useState(draft ? "in_progress" : "not_started");
  const [showBanner, setShowBanner] = useState(!!draft);
  const [open,       setOpen]       = useState(new Set(["self"]));
  const [errors,     setErrors]     = useState({});

  // Auto-save every 30 s
  useEffect(() => {
    const t = setInterval(() => { saveDraft({ form }); setDraftState("draft_saved"); }, 30000);
    return () => clearInterval(t);
  }, [form]);

  const persist = useCallback((nextForm) => {
    saveDraft({ form: nextForm });
    setDraftState("draft_saved");
  }, []);

  const patch = useCallback((key, val) => {
    setForm(prev => { const n = { ...prev, [key]: val }; persist(n); return n; });
  }, [persist]);

  const patchNested = useCallback((parent, key, val) => {
    setForm(prev => {
      const updated = { ...prev[parent], [key]: val };
      if (key === "dob") updated.age = calcAge(val);
      const n = { ...prev, [parent]: updated };
      persist(n);
      return n;
    });
  }, [persist]);

  const patchChild = useCallback((idx, key, val) => {
    setForm(prev => {
      const ch = [...prev.children];
      ch[idx] = { ...ch[idx], [key]: val };
      if (key === "dob") ch[idx].age = calcAge(val);
      const n = { ...prev, children: ch };
      persist(n);
      return n;
    });
  }, [persist]);

  const addChild    = () => setForm(p => ({ ...p, children: [...p.children, { fullName: "", dob: "", age: "", gender: "" }] }));
  const removeChild = (i) => setForm(p => ({ ...p, children: p.children.filter((_, j) => j !== i) }));

  const toggle = (id) => setOpen(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const submit = () => { localStorage.removeItem(DRAFT_KEY); onSuccess(); };

  // Section completion status
  const status = {
    employee: form.fullName.trim() && form.email.trim() && form.department ? "done" : (form.fullName || form.email ? "partial" : "empty"),
    self:     form.dob && form.gender ? "done" : (form.dob || form.gender ? "partial" : "empty"),
    parents:  "done", // always optional
    spouse:   form.isMarried !== null ? "done" : "empty",
    children: "done", // always optional
  };

  const canSubmit = status.employee === "done" && status.self === "done" && status.spouse === "done";

  // Validation warnings
  const warnings = [
    form.age && Number(form.age) > 65 && "Employee age exceeds typical coverage limit (65)",
    form.includeParents && form.mother.dob && Number(calcAge(form.mother.dob)) < 18 && "Mother's age seems too low",
    form.includeParents && form.father.dob && Number(calcAge(form.father.dob)) < 18 && "Father's age seems too low",
    ...form.children.map((c, i) => c.dob && Number(c.age) > 25 && `Child ${i + 1} age exceeds dependent limit (25)`),
  ].filter(Boolean);

  // Reusable accordion section wrapper
  function Section({ id, title, subtitle, statusKey, children }) {
    const s = status[statusKey];
    const isOpen = open.has(id);
    return (
      <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${
        s === "done" ? "border-emerald-200" : s === "partial" ? "border-blue-200" : "border-[#e2e8f0]"
      }`}>
        <button
          onClick={() => toggle(id)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            {/* Status dot */}
            <div className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              s === "done"    ? "bg-emerald-500" :
              s === "partial" ? "bg-blue-100 border-2 border-blue-400" :
                                "bg-[#f1f5f9] border-2 border-[#e2e8f0]"
            }`}>
              {s === "done" && <CheckCircle2 size={13} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
              <p className="text-xs text-[#64748b]">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {s === "done" && <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Complete</span>}
            {s === "partial" && <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">In progress</span>}
            <ChevronDown size={15} className={`text-[#94a3b8] transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>
        {isOpen && (
          <div className="px-6 pb-6 border-t border-[#f1f5f9]">
            <div className="pt-5">{children}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[780px] mx-auto px-6 pt-6 pb-12 space-y-3">

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-base font-bold text-[#0f172a]">Insurance Enrollment</p>
          <p className="text-xs text-[#64748b] mt-0.5">Fill in each section below · auto-saved as you go</p>
        </div>
        <DraftBadge state={draftState} />
      </div>

      {/* Resume banner */}
      {showBanner && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">Draft restored — pick up where you left off</p>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-blue-400 hover:text-blue-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Deadline banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-amber-600" />
          <p className="text-xs text-amber-800 font-medium">Enrollment deadline: <strong>{DEADLINE.label}</strong> · {DEADLINE.cycle}</p>
        </div>
        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
          {DEADLINE.daysLeft} day left
        </span>
      </div>

      {/* ── Section 1: Employee Info ──────────────────────────────────────── */}
      <Section id="employee" title="Employee Information" subtitle="Your basic details — most are prefilled" statusKey="employee">
        <div className="grid grid-cols-2 gap-4">
          <WField label="Employee ID">
            <WInput value={form.employeeId} onChange={v => patch("employeeId", v)} disabled />
          </WField>
          <WField label="Full Name" required error={errors.fullName}>
            <WInput value={form.fullName} onChange={v => patch("fullName", v)} placeholder="Enter full name" />
          </WField>
          <WField label="Email Address" required error={errors.email}>
            <WInput value={form.email} onChange={v => patch("email", v)} placeholder="name@company.com" type="email" />
          </WField>
          <WField label="Department" required error={errors.department}>
            <WSelect value={form.department} onChange={v => patch("department", v)} options={DEPARTMENTS} placeholder="Select department" />
          </WField>
          <WField label="Joining Date">
            <WInput value={form.joiningDate} onChange={v => patch("joiningDate", v)} type="date" />
          </WField>
        </div>
      </Section>

      {/* ── Section 2: Self Insurance ─────────────────────────────────────── */}
      <Section id="self" title="Self Insurance Details" subtitle="Personal health information for your policy" statusKey="self">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <WField label="Date of Birth" required error={errors.dob}>
              <WInput value={form.dob} onChange={v => {
                setForm(p => { const n = { ...p, dob: v, age: calcAge(v) }; persist(n); return n; });
              }} type="date" />
            </WField>
            <WField label="Age (auto-calculated)">
              <WInput value={form.age} onChange={() => {}} placeholder="Auto-calculated" disabled />
            </WField>
            <WField label="Gender" required error={errors.gender}>
              <WSelect value={form.gender} onChange={v => patch("gender", v)} options={["Male","Female","Other"]} placeholder="Select gender" />
            </WField>
            <WField label="Blood Group">
              <WSelect value={form.bloodGroup} onChange={v => patch("bloodGroup", v)} options={BLOOD_GROUPS} placeholder="Select blood group" />
            </WField>
          </div>
          <WField label="Pre-existing Conditions (if any)">
            <textarea
              value={form.preExisting}
              onChange={e => patch("preExisting", e.target.value)}
              placeholder="e.g. Diabetes, Hypertension — leave blank if none"
              rows={3}
              className="px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0f172a] bg-white outline-none hover:border-[#cbd5e1] focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-colors resize-none w-full"
            />
          </WField>
        </div>
      </Section>

      {/* ── Section 3: Parents ────────────────────────────────────────────── */}
      <Section id="parents" title="Parent Information" subtitle="Optional — include if adding parents as dependents" statusKey="parents">
        <div className="space-y-4">
          <label className="flex items-center gap-3 p-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] cursor-pointer hover:border-[#cbd5e1] transition-colors">
            <div className={`size-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${form.includeParents ? "bg-blue-600 border-blue-600" : "bg-white border-[#cbd5e1]"}`}>
              {form.includeParents && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <input type="checkbox" className="sr-only" checked={form.includeParents} onChange={e => patch("includeParents", e.target.checked)} />
            <div>
              <p className="text-sm font-medium text-[#0f172a]">Include parents as dependents</p>
              <p className="text-xs text-[#64748b]">Covered under the family floater plan</p>
            </div>
          </label>

          {form.includeParents && ["mother","father"].map(parent => (
            <div key={parent} className="border border-[#e2e8f0] rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors"
                onClick={() => setErrors(e => ({ ...e, [`${parent}Open`]: !e[`${parent}Open`] }))}
              >
                <div className="flex items-center gap-2">
                  {parent === "mother" ? <Heart size={13} className="text-pink-500" /> : <Users size={13} className="text-blue-500" />}
                  <span className="text-sm font-medium text-[#0f172a] capitalize">{parent} Details</span>
                  {form[parent].firstName && <span className="text-xs text-[#64748b]">— {form[parent].firstName} {form[parent].lastName}</span>}
                </div>
                <ChevronDown size={13} className={`text-[#94a3b8] transition-transform ${errors[`${parent}Open`] ? "rotate-180" : ""}`} />
              </button>
              {errors[`${parent}Open`] && (
                <div className="px-5 py-4 grid grid-cols-2 gap-4 border-t border-[#f1f5f9]">
                  <WField label="First Name"><WInput value={form[parent].firstName} onChange={v => patchNested(parent, "firstName", v)} placeholder="First name" /></WField>
                  <WField label="Last Name"><WInput value={form[parent].lastName} onChange={v => patchNested(parent, "lastName", v)} placeholder="Last name" /></WField>
                  <WField label="Date of Birth"><WInput value={form[parent].dob} onChange={v => patchNested(parent, "dob", v)} type="date" /></WField>
                  <WField label="Age"><WInput value={form[parent].age} onChange={() => {}} placeholder="Auto-calculated" disabled /></WField>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 4: Spouse ─────────────────────────────────────────────── */}
      <Section id="spouse" title="Spouse Information" subtitle="Required — answer even if not married" statusKey="spouse">
        <div className="space-y-4">
          <WField label="Are you married?" required>
            <div className="flex gap-3 mt-0.5">
              {[{ val: true, label: "Yes, I'm married" }, { val: false, label: "No" }].map(({ val, label }) => (
                <button key={String(val)} onClick={() => patch("isMarried", val)}
                  className={`flex-1 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.isMarried === val ? "border-blue-600 bg-blue-50 text-blue-700" : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </WField>

          {form.isMarried === true && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2">
                <WField label="Spouse Full Name" required>
                  <WInput value={form.spouse.fullName} onChange={v => patchNested("spouse", "fullName", v)} placeholder="Enter spouse full name" />
                </WField>
              </div>
              <WField label="Date of Birth" required>
                <WInput value={form.spouse.dob} onChange={v => patchNested("spouse", "dob", v)} type="date" />
              </WField>
              <WField label="Age">
                <WInput value={form.spouse.age} onChange={() => {}} placeholder="Auto-calculated" disabled />
              </WField>
            </div>
          )}
          {form.isMarried === false && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-[#64748b]">Noted — spouse section will not be included in your enrollment.</p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Section 5: Children ───────────────────────────────────────────── */}
      <Section id="children" title="Children" subtitle="Optional — add up to 2 children as dependents" statusKey="children">
        <div className="space-y-4">
          {form.children.map((child, idx) => (
            <div key={idx} className="border border-[#e2e8f0] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-amber-500" />
                  <span className="text-sm font-semibold text-[#0f172a]">Child {idx + 1}</span>
                  {child.fullName && <span className="text-xs text-[#64748b]">— {child.fullName}</span>}
                </div>
                <button onClick={() => removeChild(idx)} className="text-[#94a3b8] hover:text-red-500 transition-colors p-1">
                  <X size={13} />
                </button>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <WField label="Full Name"><WInput value={child.fullName} onChange={v => patchChild(idx, "fullName", v)} placeholder="Child's full name" /></WField>
                </div>
                <WField label="Date of Birth"><WInput value={child.dob} onChange={v => patchChild(idx, "dob", v)} type="date" /></WField>
                <WField label="Age"><WInput value={child.age} onChange={() => {}} placeholder="Auto-calculated" disabled /></WField>
                <WField label="Gender"><WSelect value={child.gender} onChange={v => patchChild(idx, "gender", v)} options={["Male","Female","Other"]} placeholder="Select" /></WField>
              </div>
            </div>
          ))}
          {form.children.length < 2 && (
            <button onClick={addChild}
              className="w-full h-11 rounded-2xl border-2 border-dashed border-[#e2e8f0] text-sm font-medium text-[#64748b] flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <span className="text-lg leading-none font-light">+</span> Add Child
            </button>
          )}
          {form.children.length === 2 && <p className="text-xs text-center text-[#94a3b8]">Maximum of 2 children reached</p>}
        </div>
      </Section>

      {/* ── Submit block ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl px-6 py-5">

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle size={13} className="text-amber-600" />
              <p className="text-xs font-semibold text-amber-800">Please review before submitting</p>
            </div>
            {warnings.map(w => <p key={w} className="text-xs text-amber-700 ml-5">• {w}</p>)}
          </div>
        )}

        {/* Consent note */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100 mb-4">
          <Info size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            By submitting, I confirm all information is accurate and consent to enrollment in the{" "}
            <strong>HealthFirst Plus Group Mediclaim Policy 2026</strong> under Aziron's corporate benefits program.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {["employee","self","spouse"].map(k => (
              <div key={k} className={`size-2 rounded-full ${status[k] === "done" ? "bg-emerald-500" : "bg-[#e2e8f0]"}`} />
            ))}
            <span className="text-xs text-[#64748b] ml-1">
              {Object.values(status).filter(s => s === "done").length} of 5 sections complete
            </span>
          </div>
          <button
            onClick={canSubmit ? submit : undefined}
            className={`flex items-center gap-2 h-11 px-7 rounded-xl text-sm font-semibold transition-all ${
              canSubmit
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 cursor-pointer"
                : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={14} />
            Submit Enrollment
          </button>
        </div>
        {!canSubmit && (
          <p className="text-xs text-[#94a3b8] text-right mt-2">
            Complete Employee Info, Self Insurance, and Spouse sections to submit
          </p>
        )}
      </div>

    </div>
  );
}

// ─── View: Skip confirmed ─────────────────────────────────────────────────────

function SkippedState({ firstName, onReturn }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="size-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mx-auto">
          <SkipForward size={28} className="text-[#64748b]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0f172a]">Enrollment skipped for now</h2>
          <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
            No problem, {firstName}. You can return to this page anytime before <strong className="text-[#0f172a]">{DEADLINE.label}</strong> to complete your enrollment.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left">
          <p className="text-xs text-amber-800 font-semibold mb-1">Reminder</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            The enrollment window closes at the end of {DEADLINE.cycle} ({DEADLINE.cycleRange}). Missing this window means waiting until Cycle 2 (May 15–31).
          </p>
        </div>
        <button onClick={onReturn}
          className="flex items-center gap-2 h-10 px-6 rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors mx-auto">
          Return to Enrollment <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── View: Success ────────────────────────────────────────────────────────────

function SuccessState({ firstName, onNavigate }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
          <CheckCircle2 size={36} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">You're enrolled, {firstName}! 🎉</h2>
          <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
            Your enrollment request is queued for batch processing on <strong className="text-[#0f172a]">{DEADLINE.label}</strong>.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-left space-y-2">
          {["Enrollment submitted for Cycle 1 (May 1–15)", "HR will process requests on May 15", "Confirmation email will follow approval", "Coverage activates after Finance sign-off"].map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-blue-600 flex-shrink-0" />
              <span className="text-xs text-[#475569]">{item}</span>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate?.("new-chat")}
          className="flex items-center gap-2 h-10 px-6 rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors mx-auto">
          Back to Home <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EmployeeInsurancePage({ onNavigate }) {
  const { auth } = useAuth();
  const firstName = auth.user?.name?.split(" ")[0] ?? "there";
  // "landing" | "skip-confirm" | "enroll" | "skipped" | "success"
  const [view, setView] = useState("landing");

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc]">
      <Sidebar activePage="employee-insurance" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0]" />
            <span className="text-sm text-[#64748b]">Platform</span>
            <ChevronRight size={14} className="text-[#94a3b8]" />
            <span className="text-sm text-[#0f172a] font-medium">Employee Insurance</span>
            {view === "enroll" && (
              <>
                <ChevronRight size={14} className="text-[#94a3b8]" />
                <span className="text-sm text-[#0f172a] font-medium">Enrollment Form</span>
              </>
            )}
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {view === "landing"      && <ConfirmationView firstName={firstName} onProceed={() => setView("enroll")} onSkip={() => setView("skip-confirm")} />}
          {view === "skip-confirm" && <SkipView firstName={firstName} onBack={() => setView("landing")} onConfirmSkip={() => setView("skipped")} />}
          {view === "enroll"       && <EnrollView firstName={firstName} auth={auth} onSuccess={() => setView("success")} />}
          {view === "skipped"      && <SkippedState firstName={firstName} onReturn={() => setView("landing")} />}
          {view === "success"      && <SuccessState firstName={firstName} onNavigate={onNavigate} />}
        </div>
      </div>
    </div>
  );
}
