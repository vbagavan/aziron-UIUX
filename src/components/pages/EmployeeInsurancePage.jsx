import { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
import {
  Shield, ShieldCheck, ChevronRight, CheckCircle2, Clock, Calendar,
  Heart, Eye, Smile, Activity, Star, AlertTriangle,
  ArrowRight, ChevronDown, Info, Zap, Users, FileText,
  X, SkipForward, Lock, PanelRightOpen, Plus, Mail, RefreshCw,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EnrollmentLivePreview } from "@/components/features/insurance/EnrollmentLivePreview";
import { formatEnrollmentSavedRelative } from "@/components/features/insurance/enrollmentPreviewUtils";

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

/** Payroll / sum-insured bands for step 2 (selection persists in draft). */
const PREMIUM_TIER_OPTIONS = [
  {
    id: "essential",
    title: "Essential",
    sumInsured: "₹3,00,000",
    premium: "₹0 / yr",
    payrollNote: "Employer-paid base tier",
  },
  {
    id: "plus",
    title: "Plus",
    sumInsured: "₹5,00,000",
    premium: "₹1,200 / yr",
    payrollNote: "Small payroll deduction — matches default group policy",
  },
  {
    id: "premier",
    title: "Premier",
    sumInsured: "₹10,00,000",
    premium: "₹4,200 / yr",
    payrollNote: "Higher sum insured — max tier this cycle",
  },
];

/** Single source of truth for enrollment close (calendar day, local). */
const ENROLLMENT_DEADLINE_DATE = new Date(2026, 4, 15);

const DEADLINE = {
  get label() {
    return ENROLLMENT_DEADLINE_DATE.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  },
  cycle: "Cycle 1",
  cycleRange: "May 1 – May 15",
};

/** Calendar days from today through deadline day (0 = due today). */
function getEnrollmentUrgency(deadlineDate = ENROLLMENT_DEADLINE_DATE) {
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineDay = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
  const days = Math.round((deadlineDay - startToday) / 86400000);
  if (days < 0) return { text: "Closed", variant: "muted" };
  if (days === 0) return { text: "Last day", variant: "urgent" };
  if (days === 1) return { text: "1 day left", variant: "urgent" };
  return { text: `${days} days left`, variant: days <= 7 ? "soon" : "ok" };
}

// ─── Coverage intent options ──────────────────────────────────────────────────

const COVERAGE_OPTIONS = [
  {
    id: "self",
    label: "Just myself",
    tagline: "Self coverage only",
    desc: "Hospitalization, day-care, and OPD for you — no dependents.",
    icon: Shield,
    color: "#4f39f6",
    bg: "#eef2ff",
    includes: ["Hospitalization & day-care", "OPD visits", "Annual health check-up"],
    premium: "₹0",
    premiumNote: "Employer-paid",
    sections: [],
  },
  {
    id: "self_spouse",
    label: "Myself + Spouse",
    tagline: "Self and partner",
    desc: "You and your spouse under one family floater policy.",
    icon: Heart,
    color: "#ef4444",
    bg: "#fef2f2",
    includes: ["All self benefits", "Spouse hospitalization", "Maternity cover"],
    premium: "₹2,400",
    premiumNote: "per year",
    sections: ["spouse"],
  },
  {
    id: "self_parents",
    label: "Myself + Parents",
    tagline: "Self and parents",
    desc: "You and both parents covered under one family floater.",
    icon: Users,
    color: "#059669",
    bg: "#ecfdf5",
    includes: ["All self benefits", "Both parents covered", "Senior care network"],
    premium: "₹3,100",
    premiumNote: "per year",
    sections: ["parents"],
  },
  {
    id: "family",
    label: "Full Family",
    tagline: "Complete family protection",
    desc: "You, spouse, parents, and up to 2 children — maximum coverage.",
    icon: Star,
    color: "#f59e0b",
    bg: "#fffbeb",
    includes: ["All self benefits", "Spouse + up to 2 children", "Both parents", "₹50L life cover"],
    premium: "₹4,200",
    premiumNote: "per year",
    sections: ["spouse", "parents", "children"],
  },
];

/** Step 1 jump nav — built dynamically in EnrollView based on coverageScope. */
const ENROLL_STEP1_SECTION_NAV_BASE = [
  { id: 1, label: "Self Insurance", anchor: "self" },
  { id: 2, label: "Family members", anchor: "family" },
];

/** Step 2 jump nav */
const ENROLL_STEP2_SECTION_NAV = [
  { id: 1, label: "Premium", anchor: "premium" },
  { id: 2, label: "Review", anchor: "review" },
];

const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const DRAFT_KEY    = "aziron_enrollment_draft";
const ADD_MEMBER_HINT_KEY = "aziron_add_member_hint_dismissed";

function calcAge(dob) {
  if (!dob) return "";
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a >= 0 ? String(a) : "";
}

function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    /* localStorage unavailable or quota exceeded */
  }
}
function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return null;
  }
}

/** HR / directory fields — enrollment shows them read-only from auth. */
function employeeFieldsFromAuth(user) {
  return {
    employeeId: user?.employeeId ?? "",
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    department: user?.department ?? "",
    joiningDate: user?.joiningDate ?? "",
  };
}

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function enrollmentFormDefaults(authUser, draftForm) {
  const fromAuth = employeeFieldsFromAuth(authUser);
  const editable = {
    dob: "",
    age: "",
    gender: "",
    bloodGroup: "",
    preExistingConditions: "",
    includeParents: false,
    mother: { firstName: "", lastName: "", dob: "", age: "" },
    father: { firstName: "", lastName: "", dob: "", age: "" },
    isMarried: null,
    spouse: { fullName: "", dob: "", age: "" },
    children: [],
    premiumTierId: "",
  };
  const base = { ...fromAuth, ...editable };
  if (!draftForm) return base;
  return { ...base, ...draftForm, ...fromAuth };
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

function formatSavedClock(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function DraftBadge({ state, savedAt }) {
  if (state === "not_started") return null;
  const cfg =
    state === "draft_saved"
      ? {
          label: "All changes saved",
          hint: savedAt
            ? `On this device · saved ${formatEnrollmentSavedRelative(savedAt)} (${formatSavedClock(savedAt)})`
            : "On this device",
          dot: "bg-emerald-500",
          text: "text-emerald-700",
          bg: "bg-emerald-50 border-emerald-200",
        }
      : {
          label: "In progress",
          hint: "Edits save to this device when you change a field",
          dot: "bg-blue-500",
          text: "text-blue-700",
          bg: "bg-blue-50 border-blue-200",
        };
  return (
    <div
      className={`inline-flex flex-col items-end gap-0.5 rounded-xl border px-3 py-2 ${cfg.bg}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title="Draft is stored in this browser only. Clearing site data will remove it."
    >
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${cfg.text}`}>
        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
      <span className={`text-[10px] font-medium leading-tight ${cfg.text} opacity-90 max-w-[200px] text-right`}>
        {cfg.hint}
      </span>
    </div>
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
    get value() {
      return DEADLINE.label;
    },
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
  const [policyOpen, setPolicyOpen] = useState(false);
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
              <span className="size-1.5 rounded-full bg-[#5ee9b5] animate-pulse" />
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
              {FEATURE_TAGS.map((entry) => {
                const IconComponent = entry.icon;
                return (
                  <div
                    key={entry.label}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white"
                    style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <IconComponent size={12} />
                    {entry.label}
                  </div>
                );
              })}
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
              {INFO_CARDS.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={card.label}
                    className="flex flex-col p-4 rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(226,232,240,0.8)",
                      boxShadow: "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div className="size-9 rounded-xl flex items-center justify-center mb-4" style={{ background: card.bg }}>
                      <IconComponent size={16} className="text-white" />
                    </div>
                    <p className="text-[11px] text-[#62748e] uppercase mb-1" style={{ letterSpacing: "0.6px" }}>{card.label}</p>
                    <p className="text-sm text-[#0f172b] leading-5" style={{ letterSpacing: "-0.15px" }}>{card.value}</p>
                  </div>
                );
              })}
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
                onClick={() => setPolicyOpen(true)}
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
              {TRUST_BADGES.map((row) => {
                const IconComponent = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-1.5">
                    <IconComponent size={14} className="text-[#45556c] flex-shrink-0" />
                    <span className="text-xs text-[#45556c]">{row.label}</span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* ── Policy Preview Sheet ─────────────────────────────────── */}
      <Sheet open={policyOpen} onOpenChange={setPolicyOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] overflow-y-auto p-0 gap-0">
          <SheetHeader className="shrink-0 border-b border-slate-200 px-6 py-4 text-left">
            <SheetTitle className="text-base font-semibold text-[#0f172a]">Policy Preview</SheetTitle>
            <p className="text-sm text-[#64748b] mt-0.5">{POLICY.name}</p>
          </SheetHeader>
          <div className="p-6 space-y-6">
            {/* Key numbers */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Sum Insured",  value: POLICY.sumInsured      },
                { label: "Premium",      value: POLICY.premiumRange    },
                { label: "Hospitals",    value: POLICY.networkHospitals },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">{label}</span>
                  <span className="text-sm font-bold text-[#0f172a]">{value}</span>
                </div>
              ))}
            </div>

            {/* What's covered */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-3">What's covered</p>
              <div className="grid grid-cols-2 gap-2.5">
                {POLICY.coverageTypes.map(({ icon: Icon, label, desc, color, bg }) => (
                  <div key={label} className="flex items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-3.5">
                    <div className="size-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0f172a]">{label}</p>
                      <p className="text-[11px] text-[#64748b] leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key highlights */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8] mb-3">Key highlights</p>
              <div className="space-y-2">
                {POLICY.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#475569] leading-relaxed">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => { setPolicyOpen(false); onProceed(); }}
              className="w-full h-12 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(173.46deg, #4f39f6 0%, #7f22fe 100%)" }}
            >
              Continue Enrollment <ArrowRight size={15} />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Coverage chip (used in EnrollView header) ───────────────────────────────

function CoverageChip({ coverage, onChangeCoverage }) {
  const Icon = coverage.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 shadow-sm">
      <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: coverage.bg }}>
        <Icon size={14} style={{ color: coverage.color }} />
      </div>
      <div className="min-w-0 flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-[#0f172a]">{coverage.label}</span>
        <span className="text-xs text-[#64748b]">·</span>
        <span className="text-xs text-[#64748b]">{coverage.premium} {coverage.premiumNote}</span>
      </div>
      {onChangeCoverage && (
        <button
          type="button"
          onClick={onChangeCoverage}
          className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded px-1"
        >
          Change
        </button>
      )}
    </div>
  );
}

// ─── Inline coverage selector (used inside EnrollView) ───────────────────────

function InlineCoverageSelector({ selected, onChange }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl px-5 py-4 space-y-3 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-0.5">Coverage plan</p>
        <h2 className="text-sm font-semibold text-[#0f172a]">Select who you'd like to cover</h2>
        <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">
          Your selection determines which dependent sections appear below.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COVERAGE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected?.id === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt)}
              className={`relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f39f6]/50 ${
                isSelected
                  ? "border-[#4f39f6] bg-[#eef2ff] shadow-sm"
                  : "border-[#e2e8f0] bg-white hover:border-[#c7d2fe] hover:bg-[#f8fafc]"
              }`}
            >
              {isSelected && (
                <div className="absolute right-2.5 top-2.5 size-4 rounded-full bg-[#4f39f6] flex items-center justify-center">
                  <CheckCircle2 size={9} className="text-white" />
                </div>
              )}
              <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: opt.bg }}>
                <Icon size={13} style={{ color: opt.color }} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0f172a] leading-tight pr-4">{opt.label}</p>
                <p className="text-[11px] mt-1">
                  <span className="font-semibold text-[#0f172a]">{opt.premium}</span>{" "}
                  <span className="text-[#64748b]">{opt.premiumNote}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-[#475569] leading-relaxed">{selected.desc}</p>
        </div>
      )}
    </div>
  );
}

// ─── View: Coverage intent selection ─────────────────────────────────────────

function CoverageIntentView({ firstName, initialId, onContinue, onBack }) {
  const [selected, setSelected] = useState(initialId ?? "family");
  const chosen = COVERAGE_OPTIONS.find((o) => o.id === selected);

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-8"
      style={{ background: "linear-gradient(147.5deg, #f8fafc 0%, rgba(238,242,255,0.4) 50%, rgba(245,243,255,0.6) 100%)" }}
    >
      <div className="mx-auto max-w-2xl">

        {/* Step breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800">
            Step 0 · Coverage
          </span>
          <ChevronRight size={12} className="text-[#94a3b8]" aria-hidden />
          <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#94a3b8]">
            Step 1 · Members
          </span>
          <ChevronRight size={12} className="text-[#94a3b8]" aria-hidden />
          <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#94a3b8]">
            Step 2 · Premium
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
          Who would you like to cover, {firstName}?
        </h1>
        <p className="mt-1.5 mb-6 max-w-lg text-sm leading-relaxed text-[#64748b]">
          This determines which sections you'll fill in and your estimated annual premium.
          You can adjust dependent details in the next step.
        </p>

        {/* Coverage option cards — 2×2 grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
          {COVERAGE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`relative flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f39f6]/50 ${
                  isSelected
                    ? "border-[#4f39f6] bg-white shadow-md shadow-[#4f39f6]/10"
                    : "border-[#e2e8f0] bg-white hover:border-[#c7d2fe] hover:shadow-sm"
                }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute right-3.5 top-3.5 size-5 rounded-full bg-[#4f39f6] flex items-center justify-center">
                    <CheckCircle2 size={11} className="text-white" />
                  </div>
                )}

                {/* Icon + title */}
                <div className="flex items-center gap-3">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: opt.bg }}
                  >
                    <Icon size={17} style={{ color: opt.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{opt.label}</p>
                    <p className="text-xs text-[#64748b]">{opt.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#475569] leading-relaxed">{opt.desc}</p>

                {/* Includes list */}
                <ul className="space-y-1.5">
                  {opt.includes.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-[#475569]">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Premium badge */}
                <div
                  className={`mt-auto rounded-xl px-3 py-2 ${isSelected ? "bg-[#eef2ff]" : "bg-[#f8fafc]"}`}
                >
                  <span className="text-base font-bold text-[#0f172a]">{opt.premium}</span>
                  <span className="text-xs text-[#64748b] ml-1.5">{opt.premiumNote}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onContinue(chosen)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex-none sm:px-8"
            style={{ background: "linear-gradient(173.46deg, #4f39f6 0%, #7f22fe 100%)" }}
          >
            Continue with {chosen.label}
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-12 rounded-2xl border border-[#e2e8f0] bg-white px-6 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors"
          >
            ← Back to overview
          </button>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-[#94a3b8]">
          Premium estimates are indicative. Final amounts are confirmed by HR after enrollment closes.
        </p>
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
                style={{ background: "linear-gradient(173.46deg, #4f39f6 0%, #7f22fe 100%)" }}
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

// ─── Accordion section (module scope — avoids nested component lint) ─────────

function EnrollAccordionSection({ id, title, subtitle, statusKey, status, open, onToggle, focused, children }) {
  const s = status[statusKey];
  const isOpen = open.has(id);
  return (
    <section
      id={`enroll-section-${id}`}
      className={`scroll-mt-28 bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
        s === "done" ? "border-emerald-200" : s === "partial" ? "border-blue-200" : "border-[#e2e8f0]"
      } ${focused ? "ring-2 ring-blue-400/45 shadow-md shadow-blue-500/10" : ""}`}
      aria-labelledby={`enroll-heading-${id}`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50"
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              s === "done"
                ? "bg-emerald-500"
                : s === "partial"
                  ? "bg-blue-100 border-2 border-blue-400"
                  : "bg-[#f1f5f9] border-2 border-[#e2e8f0]"
            }`}
          >
            {s === "done" && <CheckCircle2 size={13} className="text-white" />}
          </div>
          <div>
            <h2 id={`enroll-heading-${id}`} className="text-sm font-semibold text-[#0f172a]">
              {title}
            </h2>
            <p className="text-xs text-[#64748b]">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {s === "done" && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Complete
            </span>
          )}
          {s === "partial" && (
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              In progress
            </span>
          )}
          <ChevronDown size={15} className={`text-[#94a3b8] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-[#f1f5f9]">
          <div className="pt-5">{children}</div>
        </div>
      )}
    </section>
  );
}

function EmployeeDirectoryReadOnly({ directory }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 sm:px-5">
      <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Employee ID</dt>
          <dd className="mt-1.5 text-sm font-medium text-[#0f172a]">{directory.employeeId || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Full name</dt>
          <dd className="mt-1.5 text-sm font-medium text-[#0f172a]">{directory.fullName.trim() || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Work email</dt>
          <dd className="mt-1.5 text-sm font-medium text-[#0f172a] break-all">{directory.email.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Department</dt>
          <dd className="mt-1.5 text-sm font-medium text-[#0f172a]">{directory.department?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Joining date</dt>
          <dd className="mt-1.5 text-sm font-medium text-[#0f172a]">{formatDisplayDate(directory.joiningDate)}</dd>
        </div>
      </dl>
      <p className="mt-4 border-t border-[#e2e8f0] pt-3 text-xs leading-relaxed text-[#64748b]">
        These details are supplied by your employer. If anything looks wrong, contact HR — they are not editable in this enrollment form.
      </p>
    </div>
  );
}

function EnrollSelfFields({ form, errors, patch, onDobChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <WField label="Date of Birth" required error={errors.dob}>
          <WInput value={form.dob} onChange={onDobChange} type="date" />
        </WField>
        <WField label="Age (auto-calculated)">
          <WInput value={form.age} onChange={() => {}} placeholder="Auto-calculated" disabled />
        </WField>
        <WField label="Gender" required error={errors.gender}>
          <WSelect value={form.gender} onChange={(v) => patch("gender", v)} options={["Male", "Female", "Other"]} placeholder="Select gender" />
        </WField>
        <WField label="Blood Group">
          <WSelect value={form.bloodGroup} onChange={(v) => patch("bloodGroup", v)} options={BLOOD_GROUPS} placeholder="Select blood group" />
        </WField>
      </div>
      <WField label="Pre-existing Conditions (if any)">
        <textarea
          value={form.preExistingConditions || ""}
          onChange={(e) => patch("preExistingConditions", e.target.value)}
          placeholder="e.g. Diabetes, Hypertension — leave blank if none"
          rows={2}
          className="px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0f172a] bg-white outline-none transition-colors w-full resize-none hover:border-[#cbd5e1] focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
        />
      </WField>
      <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-xs leading-relaxed text-[#64748b]">
        <strong className="font-semibold text-[#475569]">Who sees this?</strong> Health information is shared only with HR and the insurer for
        enrollment and claims, under your employer’s data handling and privacy policies.
      </p>
    </div>
  );
}

function EnrollParentsFields({ form, patch, patchNested, parentOpen, setParentOpen, integrated }) {
  return (
    <div className="space-y-4">
      {!integrated && (
        <label className="flex items-center gap-3 p-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] cursor-pointer hover:border-[#cbd5e1] transition-colors">
          <div
            className={`size-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              form.includeParents ? "bg-blue-600 border-blue-600" : "bg-white border-[#cbd5e1]"
            }`}
          >
            {form.includeParents && <CheckCircle2 size={12} className="text-white" />}
          </div>
          <input type="checkbox" className="sr-only" checked={form.includeParents} onChange={(e) => patch("includeParents", e.target.checked)} />
          <div>
            <p className="text-sm font-medium text-[#0f172a]">Include parents as dependents</p>
            <p className="text-xs text-[#64748b]">Covered under the family floater plan</p>
          </div>
        </label>
      )}

      {form.includeParents &&
        ["mother", "father"].map((parent) => (
          <div key={parent} className="border border-[#e2e8f0] rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors"
              onClick={() => setParentOpen((p) => ({ ...p, [parent]: !p[parent] }))}
            >
              <div className="flex items-center gap-2">
                {parent === "mother" ? <Heart size={13} className="text-pink-500" /> : <Users size={13} className="text-blue-500" />}
                <span className="text-sm font-medium text-[#0f172a] capitalize">{parent} Details</span>
                {form[parent].firstName && (
                  <span className="text-xs text-[#64748b]">
                    — {form[parent].firstName} {form[parent].lastName}
                  </span>
                )}
              </div>
              <ChevronDown size={13} className={`text-[#94a3b8] transition-transform ${parentOpen[parent] ? "rotate-180" : ""}`} />
            </button>
            {parentOpen[parent] && (
              <div className="px-5 py-4 grid grid-cols-2 gap-4 border-t border-[#f1f5f9]">
                <WField label="First Name">
                  <WInput value={form[parent].firstName} onChange={(v) => patchNested(parent, "firstName", v)} placeholder="First name" />
                </WField>
                <WField label="Last Name">
                  <WInput value={form[parent].lastName} onChange={(v) => patchNested(parent, "lastName", v)} placeholder="Last name" />
                </WField>
                <WField label="Date of Birth">
                  <WInput value={form[parent].dob} onChange={(v) => patchNested(parent, "dob", v)} type="date" />
                </WField>
                <WField label="Age">
                  <WInput value={form[parent].age} onChange={() => {}} placeholder="Auto-calculated" disabled />
                </WField>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function EnrollSpouseFields({ form, patch, patchNested }) {
  return (
    <div className="space-y-4">
      <WField label="Are you married?" required>
        <div className="flex gap-3 mt-0.5">
          {[
            { val: true, label: "Yes, I'm married" },
            { val: false, label: "No" },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => patch("isMarried", val)}
              className={`flex-1 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${
                form.isMarried === val ? "border-blue-600 bg-blue-50 text-blue-700" : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </WField>

      {form.isMarried === true && (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="col-span-2">
            <WField label="Spouse Full Name" required>
              <WInput value={form.spouse.fullName} onChange={(v) => patchNested("spouse", "fullName", v)} placeholder="Enter spouse full name" />
            </WField>
          </div>
          <WField label="Date of Birth" required>
            <WInput value={form.spouse.dob} onChange={(v) => patchNested("spouse", "dob", v)} type="date" />
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
  );
}

function EnrollChildrenFields({ form, patchChild, addChild, removeChild, hideInlineAdd }) {
  return (
    <div className="space-y-4">
      {form.children.map((child, idx) => (
        <div key={idx} className="border border-[#e2e8f0] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-amber-500" />
              <span className="text-sm font-semibold text-[#0f172a]">Child {idx + 1}</span>
              {child.fullName && <span className="text-xs text-[#64748b]">— {child.fullName}</span>}
            </div>
            <button type="button" onClick={() => removeChild(idx)} className="text-[#94a3b8] hover:text-red-500 transition-colors p-1" aria-label={`Remove child ${idx + 1}`}>
              <X size={13} />
            </button>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <WField label="Full Name">
                <WInput value={child.fullName} onChange={(v) => patchChild(idx, "fullName", v)} placeholder="Child's full name" />
              </WField>
            </div>
            <WField label="Date of Birth">
              <WInput value={child.dob} onChange={(v) => patchChild(idx, "dob", v)} type="date" />
            </WField>
            <WField label="Age">
              <WInput value={child.age} onChange={() => {}} placeholder="Auto-calculated" disabled />
            </WField>
            <WField label="Gender">
              <WSelect value={child.gender} onChange={(v) => patchChild(idx, "gender", v)} options={["Male", "Female", "Other"]} placeholder="Select" />
            </WField>
          </div>
        </div>
      ))}
      {!hideInlineAdd && form.children.length < 2 && (
        <button
          type="button"
          onClick={addChild}
          className="w-full h-11 rounded-2xl border-2 border-dashed border-[#e2e8f0] text-sm font-medium text-[#64748b] flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <span className="text-lg leading-none font-light">+</span> Add Child
        </button>
      )}
      {form.children.length === 2 && <p className="text-xs text-center text-[#94a3b8]">Maximum of 2 children reached</p>}
    </div>
  );
}

function EnrollPremiumTierPanel({ form, patch }) {
  return (
    <section
      id="enroll-section-premium"
      className="scroll-mt-28 bg-white border border-[#e2e8f0] rounded-2xl px-6 py-5 shadow-sm"
      aria-labelledby="enroll-heading-premium"
    >
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">Step 2</p>
        <h2 id="enroll-heading-premium" className="text-sm font-semibold text-[#0f172a]">
          Premium & coverage band
        </h2>
        <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
          Choose the sum insured and payroll contribution for <strong className="font-medium text-[#475569]">{POLICY.name}</strong> ({POLICY.year}
          ). You can change this before the batch closes if HR allows edits.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {PREMIUM_TIER_OPTIONS.map((tier) => {
          const selected = form.premiumTierId === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => patch("premiumTierId", tier.id)}
              className={`text-left rounded-2xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 ${
                selected
                  ? "border-blue-500 bg-blue-50/80 ring-1 ring-blue-500/30 shadow-sm"
                  : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#cbd5e1] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0f172a]">{tier.title}</span>
                {selected && <CheckCircle2 size={14} className="text-blue-600 shrink-0" aria-hidden />}
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums text-[#0f172a]">{tier.sumInsured}</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-800">{tier.premium}</p>
              <p className="mt-2 text-[11px] text-[#64748b] leading-snug">{tier.payrollNote}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EnrollReviewPanel({ warnings, canSubmit, submit, status, rootId, blockedHint }) {
  return (
    <div id={rootId ?? undefined} className={`bg-white border border-[#e2e8f0] rounded-2xl px-6 py-5 ${rootId ? "scroll-mt-24" : ""}`}>
      {warnings.length > 0 && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={13} className="text-amber-600" />
            <p className="text-xs font-semibold text-amber-800">Please review before submitting</p>
          </div>
          {warnings.map((w) => (
            <p key={w} className="text-xs text-amber-700 ml-5">
              • {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100 mb-4">
        <Info size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-800 leading-relaxed">
          By submitting, I confirm all information is accurate and consent to enrollment in the{" "}
          <strong>HealthFirst Plus Group Mediclaim Policy 2026</strong> under Aziron's corporate benefits program.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          {["employee", "self", "spouse"].map((k) => (
            <div key={k} className={`size-2 rounded-full ${status[k] === "done" ? "bg-emerald-500" : "bg-[#e2e8f0]"}`} />
          ))}
          <span className="text-xs text-[#64748b] ml-1">{Object.values(status).filter((s) => s === "done").length} of 5 sections complete</span>
        </div>
        <button
          type="button"
          onClick={canSubmit ? submit : undefined}
          className={`flex items-center justify-center gap-2 h-11 px-7 rounded-xl text-sm font-semibold transition-all ${
            canSubmit ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 cursor-pointer" : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
          }`}
        >
          <CheckCircle2 size={14} />
          Submit Enrollment
        </button>
      </div>
      {!canSubmit && (
        <p className="text-xs text-[#94a3b8] text-right mt-2 sm:col-span-2">
          {blockedHint || "Complete Self Insurance and Spouse to submit"}
        </p>
      )}
    </div>
  );
}

function AddMemberMenu({ form, patch, setParentOpen, coverageScope, onOpenFamilySection, scrollToId, addChild }) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const menuId = useId();

  const items = useMemo(
    () => [
      {
        key: "jump",
        label: "Jump to marital status & spouse",
        sub: !coverageScope.spouse ? "Not in your coverage plan" : "Required for everyone",
        enabled: !!coverageScope.spouse,
      },
      {
        key: "parent",
        label: "Add parent to plan",
        sub: !coverageScope.parents ? "Not in your coverage plan" : form.includeParents ? "Parents already included" : "Mother & father details",
        enabled: !!coverageScope.parents && !form.includeParents,
      },
      {
        key: "child",
        label: "Add child dependent",
        sub: !coverageScope.children ? "Not in your coverage plan" : form.children.length >= 2 ? "Maximum of 2 children" : "Up to two children",
        enabled: !!coverageScope.children && form.children.length < 2,
      },
    ],
    [form.includeParents, form.children.length, coverageScope],
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const cycleEnabled = (dir) => {
    setActiveIdx((start) => {
      let i = start;
      for (let c = 0; c < items.length; c++) {
        i = (i + dir + items.length) % items.length;
        if (items[i].enabled) return i;
      }
      return start;
    });
  };

  const runActive = (idxOverride) => {
    const idx = idxOverride ?? activeIdx;
    const it = items[idx];
    if (!it?.enabled) return;
    if (it.key === "jump") {
      onOpenFamilySection();
      scrollToId("family-part-spouse");
    } else if (it.key === "parent") {
      onOpenFamilySection();
      patch("includeParents", true);
      setParentOpen(() => ({ mother: true, father: true }));
      setTimeout(() => scrollToId("family-part-parents"), 0);
    } else if (it.key === "child") {
      onOpenFamilySection();
      if (form.children.length < 2) addChild();
      setTimeout(() => scrollToId("family-part-children"), 0);
    }
    setOpen(false);
    btnRef.current?.focus();
  };

  const onMenuKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      cycleEnabled(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      cycleEnabled(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      const i = items.findIndex((x) => x.enabled);
      if (i >= 0) setActiveIdx(i);
    } else if (e.key === "End") {
      e.preventDefault();
      for (let j = items.length - 1; j >= 0; j--) {
        if (items[j].enabled) {
          setActiveIdx(j);
          break;
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    }
  };

  return (
    <div className="relative shrink-0 sm:ml-auto">
      <button
        ref={btnRef}
        type="button"
        id={`${menuId}-btn`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${menuId}-panel` : undefined}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const first = items.findIndex((x) => x.enabled);
          setActiveIdx(first >= 0 ? first : 0);
          setOpen(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => panelRef.current?.focus());
          });
        }}
      >
        <Plus size={16} aria-hidden />
        Add member
        <ChevronDown size={14} className={`opacity-90 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={`${menuId}-panel`}
          role="menu"
          tabIndex={-1}
          aria-labelledby={`${menuId}-btn`}
          className="absolute right-0 z-30 mt-2 min-w-[260px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg outline-none"
          onKeyDown={onMenuKeyDown}
        >
          {items.map((it, idx) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={!it.enabled}
              className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm ${
                it.enabled ? "text-[#0f172a] hover:bg-[#f8fafc]" : "cursor-not-allowed bg-slate-50 text-[#94a3b8]"
              } ${idx === activeIdx && it.enabled ? "bg-blue-50/80" : ""}`}
              onMouseEnter={() => it.enabled && setActiveIdx(idx)}
              onClick={() => {
                if (it.enabled) runActive(idx);
              }}
            >
              <span className="font-semibold">{it.label}</span>
              <span className="text-[11px] font-normal text-[#64748b]">{it.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollFamilyMembersPanel({ form, patch, patchNested, errors, setErrors, parentOpen, setParentOpen, coverageScope, patchChild, addChild, removeChild, onOpenFamilySection }) {
  const [confirmRemoveParents, setConfirmRemoveParents] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return localStorage.getItem(ADD_MEMBER_HINT_KEY) === "1";
    } catch {
      return false;
    }
  });

  const dismissHint = () => {
    setHintDismissed(true);
    try {
      localStorage.setItem(ADD_MEMBER_HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const showAddHint = !hintDismissed && !form.includeParents && form.children.length === 0;

  const scrollToId = (id) => {
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="space-y-8">
      {showAddHint && (
        <div className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong className="font-semibold">Tip:</strong> Dependents are not covered until you add them — use <strong>Add member</strong> for
            parents or children.
          </p>
          <button
            type="button"
            className="self-start text-xs font-semibold text-blue-700 hover:text-blue-900 sm:self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-md px-1 py-0.5"
            onClick={dismissHint}
          >
            Don’t show again
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-1">
          <p className="text-sm text-[#64748b] leading-relaxed">
            Marital status (and spouse details when married) is <strong className="font-medium text-[#475569]">required</strong> for enrollment.
            Parents and children can only be added with <strong className="font-medium text-[#475569]">Add member</strong>.
          </p>
          {!form.includeParents && form.children.length === 0 && (
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Haven’t added dependents yet? Use Add member, or continue if no one else should be on this enrollment.
            </p>
          )}
        </div>
        <AddMemberMenu
          form={form}
          patch={patch}
          setParentOpen={setParentOpen}
          coverageScope={coverageScope}
          onOpenFamilySection={onOpenFamilySection}
          scrollToId={scrollToId}
          addChild={addChild}
        />
      </div>

      {coverageScope.spouse && (
        <div id="family-part-spouse" className="scroll-mt-32 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Spouse / marital status</p>
          <EnrollSpouseFields form={form} patch={patch} patchNested={patchNested} />
        </div>
      )}

      {form.includeParents && (
        <div id="family-part-parents" className="scroll-mt-32 space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Parents on plan</p>
            {!confirmRemoveParents && (
              <button
                type="button"
                onClick={() => setConfirmRemoveParents(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 rounded px-1"
              >
                Remove parents
              </button>
            )}
          </div>
          {confirmRemoveParents && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="text-xs text-amber-900 leading-relaxed">
                Remove parents from this enrollment? Details you entered stay in your draft on this device until you change them.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-8 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  onClick={() => setConfirmRemoveParents(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                  onClick={() => {
                    patch("includeParents", false);
                    setConfirmRemoveParents(false);
                  }}
                >
                  Yes, remove parents
                </button>
              </div>
            </div>
          )}
          <EnrollParentsFields form={form} patch={patch} patchNested={patchNested} parentOpen={parentOpen} setParentOpen={setParentOpen} integrated />
        </div>
      )}

      {coverageScope.children && (
        <div id="family-part-children" className="scroll-mt-32 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Children</p>
          <EnrollChildrenFields form={form} patchChild={patchChild} addChild={addChild} removeChild={removeChild} hideInlineAdd />
          {form.children.length === 0 && (
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              No children added yet — use <strong className="font-medium text-[#64748b]">Add member → Add child dependent</strong> when you need coverage.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Single-page enrollment ────────────────────────────────────────────

function EnrollView({ auth, onSuccess }) {
  const draft = loadDraft();

  const [form, setForm] = useState(() => enrollmentFormDefaults(auth.user, draft?.form));
  const [draftState, setDraftState] = useState(draft ? "in_progress" : "not_started");
  const [lastSavedAt, setLastSavedAt] = useState(draft?.savedAt ?? null);
  const [showBanner, setShowBanner] = useState(!!draft);
  const [open, setOpen] = useState(new Set(["self"]));
  const [errors, setErrors] = useState({});
  const [parentOpen, setParentOpen] = useState({ mother: false, father: false });
  const [previewFocusKey, setPreviewFocusKey] = useState("self");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [fabBottomPx, setFabBottomPx] = useState(16);
  // Whether the "Add Members" family section has been opened
  const [membersOpen, setMembersOpen] = useState(() => {
    // Auto-open if draft had family data
    if (!draft) return false;
    const f = draft.form;
    return !!(f?.isMarried !== null || f?.includeParents || (f?.children?.length ?? 0) > 0);
  });

  const directory = useMemo(() => employeeFieldsFromAuth(auth.user), [auth.user]);

  // Coverage is always Full Family — all dependent sections available
  const effectiveCoverage = COVERAGE_OPTIONS.find((o) => o.id === "family");
  const coverageScope = {
    spouse:   effectiveCoverage.sections.includes("spouse"),
    parents:  effectiveCoverage.sections.includes("parents"),
    children: effectiveCoverage.sections.includes("children"),
  };
  const hasDependents = effectiveCoverage.sections.length > 0;
  const spouseRequired = coverageScope.spouse;

  // Show preview only once user has started filling
  const hasStartedFilling = !!(
    form.dob || form.gender || form.bloodGroup || form.isMarried !== null ||
    form.includeParents || form.children.length > 0 || form.preExistingConditions
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setFabBottomPx(16 + overlap);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const withProfile = useCallback((row) => ({ ...row, ...directory }), [directory]);

  const persist = useCallback(
    (partial) => {
      const merged = withProfile(partial);
      saveDraft({ form: merged });
      setDraftState("draft_saved");
      setLastSavedAt(Date.now());
    },
    [withProfile],
  );

  // Auto-save every 30 s
  useEffect(() => {
    const t = setInterval(() => { persist(form); }, 30000);
    return () => clearInterval(t);
  }, [form, persist]);

  const patch = useCallback((key, val) => {
    setForm((prev) => {
      const n = { ...prev, [key]: val };
      persist(n);
      return withProfile(n);
    });
  }, [persist, withProfile]);

  const patchNested = useCallback((parent, key, val) => {
    setForm((prev) => {
      const updated = { ...prev[parent], [key]: val };
      if (key === "dob") updated.age = calcAge(val);
      const n = { ...prev, [parent]: updated };
      persist(n);
      return withProfile(n);
    });
  }, [persist, withProfile]);

  const patchChild = useCallback((idx, key, val) => {
    setForm((prev) => {
      const ch = [...prev.children];
      ch[idx] = { ...ch[idx], [key]: val };
      if (key === "dob") ch[idx].age = calcAge(val);
      const n = { ...prev, children: ch };
      persist(n);
      return withProfile(n);
    });
  }, [persist, withProfile]);

  const addChild = () =>
    setForm((p) => {
      const n = { ...p, children: [...p.children, { fullName: "", dob: "", age: "", gender: "" }] };
      persist(n);
      return withProfile(n);
    });

  const removeChild = (i) =>
    setForm((p) => {
      const n = { ...p, children: p.children.filter((_, j) => j !== i) };
      persist(n);
      return withProfile(n);
    });

  const onSelfDobChange = useCallback((v) => {
    setForm((p) => {
      const next = { ...p, dob: v, age: calcAge(v) };
      persist(next);
      return withProfile(next);
    });
  }, [persist, withProfile]);

  const toggle = useCallback((id) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); setPreviewFocusKey(id); }
      return next;
    });
  }, []);

  const openMembers = useCallback(() => {
    setMembersOpen(true);
    setOpen((prev) => { const next = new Set(prev); next.add("family"); return next; });
    setPreviewFocusKey("family");
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById("enroll-section-family")?.scrollIntoView({ behavior: "smooth", block: "start" })
      )
    );
  }, []);

  const openFamilySection = useCallback(() => {
    setMembersOpen(true);
    setOpen((prev) => { const next = new Set(prev); next.add("family"); return next; });
    setPreviewFocusKey("family");
  }, []);


  const saveAsDraft = useCallback(() => { persist(form); }, [form, persist]);
  const submit = () => { localStorage.removeItem(DRAFT_KEY); onSuccess(); };

  // Status
  const status = {
    employee: directory.fullName.trim() && directory.email.trim() ? "done" : "empty",
    self:     form.dob && form.gender ? "done" : (form.dob || form.gender ? "partial" : "empty"),
    parents: !form.includeParents
      ? "done"
      : (form.mother.firstName && form.mother.dob && form.father.firstName && form.father.dob)
        ? "done"
        : (form.mother.firstName || form.mother.dob || form.father.firstName || form.father.dob)
          ? "partial"
          : "empty",
    spouse: !spouseRequired ? "done" : (form.isMarried !== null ? "done" : "empty"),
    children: form.children.length === 0
      ? "done"
      : form.children.every((c) => c.fullName && c.dob) ? "done" : "partial",
  };

  const membersComplete = status.employee === "done" && status.self === "done" && status.spouse === "done";
  const canSubmit = membersComplete && !!form.premiumTierId;

  const warnings = [
    form.age && Number(form.age) > 65 && "Employee age exceeds typical coverage limit (65)",
    form.includeParents && form.mother.dob && Number(calcAge(form.mother.dob)) < 18 && "Mother's age seems too low",
    form.includeParents && form.father.dob && Number(calcAge(form.father.dob)) < 18 && "Father's age seems too low",
    ...form.children.map((c, i) => c.dob && Number(c.age) > 25 && `Child ${i + 1} age exceeds dependent limit (25)`),
  ].filter(Boolean);

  const urgency = getEnrollmentUrgency();

  const scrollToAnchor = useCallback((anchor) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (anchor === "self") next.add("self");
      if (anchor === "family") { next.add("family"); setMembersOpen(true); }
      return next;
    });
    if (anchor === "family") setPreviewFocusKey("family");
    else if (anchor === "self") setPreviewFocusKey("self");
    else if (anchor === "premium") setPreviewFocusKey("premium");
    const idMap = {
      self: "enroll-section-self",
      family: "enroll-section-family",
      premium: "enroll-section-premium",
      profile: "enroll-profile",
    };
    requestAnimationFrame(() =>
      document.getElementById(idMap[anchor] ?? `enroll-section-${anchor}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, []);

  const submitBlockedHint = !membersComplete
    ? "Complete Self Insurance and marital status to continue."
    : !form.premiumTierId
      ? "Select a premium tier to submit."
      : "";

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-4">

      {/* Header */}
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">Insurance Enrollment</h1>
            <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
              Fill in your details below — changes save automatically to{" "}
              <strong className="font-medium text-[#475569]">this browser on this device</strong>.
            </p>
          </div>
          <DraftBadge state={draftState} savedAt={lastSavedAt} />
        </div>

        {/* Work profile ribbon — shown once family members are added */}
        {membersOpen && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Work Profile</span>
            {[
              { label: directory.employeeId },
              { label: directory.fullName, bold: true },
              { label: directory.email },
              { label: directory.department },
              { label: directory.joiningDate },
            ].filter(item => item.label).map((item, i, arr) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-[#cbd5e1] text-xs" aria-hidden>·</span>
                <span className={`text-xs ${item.bold ? "font-semibold text-[#0f172a]" : "text-[#475569]"}`}>{item.label}</span>
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Resume banner */}
      {showBanner && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700 font-medium">Draft restored — pick up where you left off</p>
          </div>
          <button type="button" onClick={() => setShowBanner(false)} className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0 p-1" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Deadline banner */}
      <div
        className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
          urgency.variant === "urgent" ? "bg-amber-50 border-amber-200" :
          urgency.variant === "soon" ? "bg-amber-50/80 border-amber-100" :
          urgency.variant === "muted" ? "bg-slate-100 border-slate-200" : "bg-slate-50 border-slate-200"
        }`}
        role="region" aria-label="Enrollment deadline"
      >
        <div className="flex items-start gap-2 min-w-0">
          <Calendar size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-[#0f172a]">
              Enrollment closes <strong className="font-semibold">{DEADLINE.label}</strong>
              <span className="text-[#64748b] font-normal"> · {DEADLINE.cycle}</span>
            </p>
            <p className="text-[11px] text-[#64748b] mt-0.5">Window: {DEADLINE.cycleRange} (end of day, your local time)</p>
          </div>
        </div>
        <span className={`self-start text-[11px] font-bold px-2.5 py-1 rounded-full border sm:self-center tabular-nums ${
          urgency.variant === "urgent" ? "text-amber-800 bg-amber-100 border-amber-200" :
          urgency.variant === "muted" ? "text-slate-600 bg-slate-200/80 border-slate-300" :
          "text-slate-700 bg-white border-slate-200"
        }`}>{urgency.text}</span>
      </div>

      {/* Two-column layout */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(32%,380px)] xl:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 xl:gap-10 lg:items-start">
        <div className="min-w-0 space-y-4">

          {/* ① Self Insurance */}
          <EnrollAccordionSection
            id="self"
            title="Self Insurance Details"
            subtitle="Personal health information for your policy"
            statusKey="self"
            status={status}
            open={open}
            onToggle={toggle}
            focused={previewFocusKey === "self"}
          >
            <EnrollSelfFields form={form} errors={errors} patch={patch} onDobChange={onSelfDobChange} />
          </EnrollAccordionSection>

          {/* ④ Add Members button or Family accordion */}
          {!membersOpen && (
            <button
              type="button"
              onClick={openMembers}
              className="w-full flex items-center justify-center gap-2.5 h-13 py-3.5 rounded-2xl border-2 border-dashed border-[#c7d2fe] bg-white text-sm font-semibold text-[#4f39f6] hover:bg-[#eef2ff] hover:border-[#4f39f6] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f39f6]/50"
            >
              <Plus size={18} aria-hidden />
              Add Family Members
            </button>
          )}

          {membersOpen && (
            <EnrollAccordionSection
              id="family"
              title="Family Members"
              subtitle={
                coverageScope.spouse && coverageScope.parents ? "Marital status, parents & children" :
                coverageScope.spouse ? "Marital status and spouse details" :
                "Parent details for your plan"
              }
              statusKey="spouse"
              status={status}
              open={open}
              onToggle={toggle}
              focused={previewFocusKey === "family"}
            >
              <EnrollFamilyMembersPanel
                form={form}
                patch={patch}
                patchNested={patchNested}
                errors={errors}
                setErrors={setErrors}
                parentOpen={parentOpen}
                setParentOpen={setParentOpen}
                coverageScope={coverageScope}
                patchChild={patchChild}
                addChild={addChild}
                removeChild={removeChild}
                onOpenFamilySection={openFamilySection}
              />
            </EnrollAccordionSection>
          )}

          {/* ⑤ Premium Tier */}
          <EnrollPremiumTierPanel form={form} patch={patch} />

          {/* ⑥ Warnings */}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={13} className="text-amber-600" />
                <p className="text-xs font-semibold text-amber-800">Please review before submitting</p>
              </div>
              {warnings.map((w) => (
                <p key={w} className="text-xs text-amber-700 ml-5">• {w}</p>
              ))}
            </div>
          )}

          {/* ⑦ Consent notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
            <Info size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              By submitting, I confirm all information is accurate and consent to enrollment in the{" "}
              <strong>HealthFirst Plus Group Mediclaim Policy 2026</strong> under Aziron's corporate benefits program.
            </p>
          </div>

          {/* ⑧ Save as Draft + Submit */}
          <div className="space-y-2 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {["employee", "self", "spouse"].map((k) => (
                  <div key={k} className={`size-2 rounded-full ${status[k] === "done" ? "bg-emerald-500" : "bg-[#e2e8f0]"}`} />
                ))}
                <span className="text-xs text-[#64748b] ml-1">
                  {Object.values(status).filter((s) => s === "done").length} of 5 sections complete
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveAsDraft}
                  className="h-11 px-5 rounded-xl border border-[#e2e8f0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={canSubmit ? submit : undefined}
                  className={`h-11 px-7 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    canSubmit
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2"
                      : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 size={14} />
                  Submit Enrollment
                </button>
              </div>
            </div>
            {!canSubmit && (
              <p className="text-xs text-[#94a3b8] text-right">{submitBlockedHint}</p>
            )}
          </div>

        </div>

        {/* Right panel — only shown once user starts filling details */}
        {hasStartedFilling && (
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-1.25rem)] lg:min-h-0 lg:overflow-y-auto lg:pr-1 [scrollbar-gutter:stable]">
            <EnrollmentLivePreview
              policy={POLICY}
              deadline={{ label: DEADLINE.label, cycle: DEADLINE.cycle }}
              form={form}
              status={status}
              draftState={draftState}
              lastSavedAt={lastSavedAt}
              previewFocusKey={previewFocusKey}
              canSubmit={canSubmit}
              warnings={warnings}
              urgency={urgency}
              compact={false}
              onNavigateToSection={scrollToAnchor}
            />
          </aside>
        )}
      </div>

      {/* Mobile summary sheet */}
      <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] rounded-t-2xl border-slate-200 p-0 gap-0 sm:max-h-[85vh]" showCloseButton>
          <SheetHeader className="shrink-0 border-b border-slate-200 px-4 py-3 text-left">
            <SheetTitle>Live enrollment summary</SheetTitle>
          </SheetHeader>
          <div className="max-h-[calc(88vh-4.5rem)] overflow-y-auto overscroll-contain p-4">
            <EnrollmentLivePreview
              policy={POLICY}
              deadline={{ label: DEADLINE.label, cycle: DEADLINE.cycle }}
              form={form}
              status={status}
              draftState={draftState}
              lastSavedAt={lastSavedAt}
              previewFocusKey={previewFocusKey}
              canSubmit={canSubmit}
              warnings={warnings}
              urgency={urgency}
              compact
              onNavigateToSection={scrollToAnchor}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile FAB — only shown once user starts filling */}
      {hasStartedFilling && (
        <button
          type="button"
          style={{ bottom: fabBottomPx }}
          className="lg:hidden fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700/30 bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc]"
          onClick={() => setSummaryOpen(true)}
        >
          <PanelRightOpen size={16} aria-hidden />
          View live summary
        </button>
      )}

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
  const REF_ID = "INS-2026-00847";

  const steps = [
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
      iconBg: "bg-emerald-500", iconColor: "text-white",
      label: "Submission deadline",
      date: DEADLINE.label, dateColor: "text-[#94a3b8]",
      desc: "Your form is locked in for Cycle 1",
      done: true,
    },
    {
      icon: <RefreshCw size={13} />,
      iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      label: "HR batch processing",
      date: "May 15, 2026", dateColor: "text-[#94a3b8]",
      desc: "HR reviews all submissions together — no action needed from you",
      done: false,
    },
    {
      icon: <Mail size={13} />,
      iconBg: "bg-[#f1f5f9]", iconColor: "text-[#64748b]",
      label: "Confirmation email",
      date: "May 18–20", dateColor: "text-emerald-600 font-semibold",
      desc: "Approval notice sent to your work inbox — check your spam folder too",
      done: false,
    },
    {
      icon: <Heart size={13} />,
      iconBg: "bg-[#f1f5f9]", iconColor: "text-[#64748b]",
      label: "Coverage activates",
      date: "June 1, 2026", dateColor: "text-emerald-600 font-semibold",
      desc: "Policy goes live after Finance sign-off — you'll receive your policy card",
      done: false,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f1f5f9]">
      <div className="max-w-xl mx-auto px-4 py-10 space-y-3">

        {/* Card 1 — confirmation */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 pt-8 pb-7 text-center">

            {/* Icon */}
            <div className="size-14 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-md shadow-emerald-100">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              You're enrolled,{" "}
              <span className="text-emerald-600">{firstName}.</span>
            </h2>
            <p className="text-sm text-[#64748b] mt-2 leading-relaxed max-w-sm mx-auto">
              Your request is queued for batch processing.<br />
              Coverage kicks in on <strong className="text-[#0f172a]">June 1, 2026</strong> after Finance sign-off.
            </p>

            {/* Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {[
                { icon: <ShieldCheck size={11} />, label: "HealthFirst Plus Mediclaim", green: false },
                { icon: <Users size={11} />,       label: "Full Family Coverage",       green: false },
                { icon: <Calendar size={11} />,    label: "Cycle 1 · May 1–15",         green: false },
                { icon: <CheckCircle2 size={11} />,label: "Submitted",                  green: true  },
              ].map(({ icon, label, green }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                    green
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-[#f8fafc] border-[#e2e8f0] text-[#475569]"
                  }`}
                >
                  <span className={green ? "text-emerald-500" : "text-[#94a3b8]"}>{icon}</span>
                  {label}
                </span>
              ))}
            </div>

            {/* Reference ID */}
            <p className="mt-4 text-xs text-[#94a3b8]">
              Reference ID: <span className="font-semibold text-[#64748b] tracking-wide">{REF_ID}</span>
            </p>
          </div>
        </div>

        {/* Card 2 — what happens next */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">

          {/* Summary bar at top */}
          <div className="grid grid-cols-4 divide-x divide-[#f1f5f9] bg-[#f8fafc] border-b border-[#f1f5f9]">
            {[
              { label: "Plan",              value: "HealthFirst Plus" },
              { label: "Coverage",          value: "Family" },
              { label: "Coverage amount",   value: "₹3,00,000" },
              { label: "Start date",        value: "Jun 1, 2026" },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-xs font-semibold text-[#0f172a]">{value}</p>
              </div>
            ))}
          </div>

          {/* Timeline section */}
          <div className="px-5 pt-5 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">What happens next</p>

            {/* Timeline */}
            <div className="space-y-0">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4 pb-5">
                  {/* Icon column */}
                  <div className="flex flex-col items-center">
                    <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.iconBg} ${s.iconColor}`}>
                      {s.icon}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 mt-1.5 bg-[#e2e8f0]" style={{ minHeight: 16 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-sm font-semibold ${s.done ? "text-emerald-700" : "text-[#0f172a]"}`}>{s.label}</p>
                      <span className={`text-xs tabular-nums flex-shrink-0 ${s.dateColor}`}>{s.date}</span>
                    </div>
                    <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={() => onNavigate?.("new-chat")}
            className="inline-flex items-center gap-2 h-11 px-8 rounded-xl text-sm font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f172a]/50 focus-visible:ring-offset-2"
          >
            Back to Home <ArrowRight size={14} />
          </button>
        </div>

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
          {view === "landing" && (
            <ConfirmationView
              firstName={firstName}
              onProceed={() => setView("enroll")}
              onSkip={() => setView("skip-confirm")}
            />
          )}
          {view === "skip-confirm" && (
            <SkipView firstName={firstName} onBack={() => setView("landing")} onConfirmSkip={() => setView("skipped")} />
          )}
          {view === "enroll" && (
            <EnrollView
              auth={auth}
              onSuccess={() => setView("success")}
            />
          )}
          {view === "skipped"  && <SkippedState firstName={firstName} onReturn={() => setView("landing")} />}
          {view === "success"  && <SuccessState firstName={firstName} onNavigate={onNavigate} />}
        </div>
      </div>
    </div>
  );
}
