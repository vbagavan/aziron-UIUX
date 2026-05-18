import { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
import {
  Shield, ShieldCheck, ChevronRight, CheckCircle2, Clock, Calendar,
  Heart, Eye, Smile, Activity, Star, AlertTriangle,
  ArrowRight, ChevronDown, Info, Zap, Users, FileText,
  X, SkipForward, Lock, PanelRightOpen, Plus, Mail, RefreshCw, Pencil, Trash2,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EnrollmentLivePreview } from "@/components/features/insurance/EnrollmentLivePreview";
import {
  formatEnrollmentSavedRelative,
  FAMILY_DEPENDENT_RELATION_OPTIONS,
  familyDependentRelationLabel,
  familyDependentImpliedGender,
  familyDependentEffectiveGender,
  ENROLLMENT_COVERAGE_LAKH_OPTIONS,
  coverageSumInsuredDisplay,
  computeFloaterAnnualPremiumINR,
  formatEnrollmentPremiumInr,
  premiumTierIdForCoverageLakh,
} from "@/components/features/insurance/enrollmentPreviewUtils";
import { cn } from "@/lib/utils";

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
    { icon: Heart,    label: "Medical",          desc: "Hospitalisation, surgeries, OPD visits", color: "var(--destructive)", bg: "var(--destructive)/10" },
    { icon: Smile,    label: "Dental",           desc: "Cleanings, fillings, orthodontics",       color: "var(--warning)", bg: "var(--warning)/10" },
    { icon: Eye,      label: "Vision",           desc: "Eyeglasses, contacts, eye exams",         color: "var(--primary)", bg: "var(--primary)/10" },
    { icon: Activity, label: "Life Insurance",   desc: "Coverage up to ₹50L for your family",     color: "var(--chart-chart-4)", bg: "var(--accent)" },
    { icon: Shield,   label: "Critical Illness", desc: "40+ critical conditions covered",         color: "var(--success)", bg: "var(--success)/10" },
    { icon: Star,     label: "Mental Health",    desc: "Therapy, counselling, wellness sessions", color: "var(--info)", bg: "var(--info)/10" },
  ],
  highlights: [
    "Zero waiting period for existing conditions",
    "Cashless claims at 5,000+ network hospitals",
    "Family floater plans available",
    "24/7 teleconsultation included",
  ],
};

/** Single source of truth for enrollment close (calendar day, local). */
const ENROLLMENT_DEADLINE_DATE = new Date(2026, 5, 15);

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

/** Inner content for automatic default enrollment (employee-only after deadline). */
function PostDeadlineAutoEnrollmentNoticeInner() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-info/15">
        <Mail size={16} className="text-info" aria-hidden />
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold text-foreground leading-snug">
          If you miss the deadline — employee-only plan applies automatically
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          After <strong className="font-medium text-foreground">{DEADLINE.label}</strong> ({DEADLINE.cycleRange}), if you have{" "}
          <strong className="font-medium text-foreground">not completed</strong> enrollment, the system will automatically assign the{" "}
          <strong className="font-medium text-foreground">employee-only</strong> corporate insurance option. You will be{" "}
          <strong className="font-medium text-foreground">notified by email</strong> when this runs.
        </p>
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground leading-relaxed marker:text-info">
          <li>Dependents are <strong className="font-medium text-foreground">not covered</strong> under this automatic default.</li>
          <li>Coverage is <strong className="font-medium text-foreground">employee-only</strong> (no spouse, parents, or children on the policy).</li>
          <li>Premium is <strong className="font-medium text-foreground">calculated automatically</strong> from your employer&apos;s corporate insurance configuration — not from any in-progress draft with dependents.</li>
          <li>Your <strong className="font-medium text-foreground">enrollment / HR status</strong> is updated after the enrollment window expires.</li>
        </ul>
      </div>
    </div>
  );
}

/** collapsible: landing only — starts collapsed behind “What if I miss the deadline?” */
function PostDeadlineAutoEnrollmentNotice({ className, collapsible = false, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <div className={className}>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-muted/70 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors"
          aria-expanded={open}
          aria-controls="enrollment-post-deadline-panel"
          id="enrollment-post-deadline-toggle"
          onClick={() => setOpen((v) => !v)}
        >
          <span>What if I miss the deadline?</span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {open ? (
          <div
            id="enrollment-post-deadline-panel"
            role="region"
            aria-label="Automatic enrollment after the deadline"
            className="mt-2 rounded-2xl border border-info/25 bg-info/5 px-4 py-3.5 sm:px-5 sm:py-4"
          >
            <PostDeadlineAutoEnrollmentNoticeInner />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Automatic enrollment after the deadline"
      className={cn(
        "rounded-2xl border border-info/25 bg-info/5 px-4 py-3.5 sm:px-5 sm:py-4",
        className,
      )}
    >
      <PostDeadlineAutoEnrollmentNoticeInner />
    </div>
  );
}

// ─── Coverage intent options ──────────────────────────────────────────────────

const COVERAGE_OPTIONS = [
  {
    id: "self",
    label: "Just myself",
    tagline: "Self coverage only",
    desc: "Hospitalization, day-care, and OPD for you — no dependents.",
    icon: Shield,
    color: "var(--primary)",
    bg: "var(--primary)/10",
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
    color: "var(--destructive)",
    bg: "var(--destructive)/10",
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
    color: "var(--success)",
    bg: "var(--success)/10",
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
    color: "var(--warning)",
    bg: "var(--warning)/10",
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

/** Step 2 jump nav (submit block lives at end of column; no separate premium step). */
const ENROLL_STEP2_SECTION_NAV = [
  { id: 1, label: "Review & submit", anchor: "coverage" },
];

const DRAFT_KEY    = "aziron_enrollment_draft";
const ADD_MEMBER_HINT_KEY = "aziron_add_member_hint_dismissed";

function calcAge(dob) {
  if (!dob) return "";
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a >= 0 ? String(a) : "";
}

/** Normalize to YYYY-MM-DD for `<input type="date" />` when possible. */
function normalizeEnrollmentDob(raw) {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const fullName = user?.name ?? "";
  return {
    employeeId: user?.employeeId ?? "",
    fullName,
    /** Government-ID name; falls back to display name when HR has not set a separate legal name. */
    legalNameAsPerId: (user?.legalName ?? fullName ?? "").trim(),
    dateOfBirth: (user?.dateOfBirth ?? user?.dob ?? "").trim(),
    /** Mobile on file from HR / verified records — enrollment `form.mobile` defaults here and stays editable. */
    mobileOnRecord: (user?.mobile ?? user?.phone ?? "").trim(),
    email: user?.email ?? "",
    department: user?.department ?? "",
    joiningDate: user?.joiningDate ?? "",
    /** From HR / verified employee records (read-only in enrollment). */
    genderOnRecord: (user?.gender ?? "").trim(),
  };
}

/** Identity slice always sourced from `auth.user` (not from draft), except `mobile` keeps the user-edited enrollment value. */
function buildEnrollmentIdentityFromAuth(user, enrollmentMobile) {
  const d = employeeFieldsFromAuth(user);
  const dob = normalizeEnrollmentDob(d.dateOfBirth);
  const mobile =
    enrollmentMobile !== undefined && enrollmentMobile !== null
      ? String(enrollmentMobile)
      : (d.mobileOnRecord || "");
  return {
    employeeId: d.employeeId,
    fullName: d.fullName,
    email: d.email,
    department: d.department,
    joiningDate: d.joiningDate,
    legalNameAsPerId: d.legalNameAsPerId || d.fullName || "",
    dateOfBirth: d.dateOfBirth,
    dob,
    age: calcAge(dob),
    mobile,
    gender: d.genderOnRecord || "",
  };
}

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function newFamilyDependentRowId() {
  return `fd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function enrollmentFormDefaults(authUser, draftForm) {
  const identity = buildEnrollmentIdentityFromAuth(authUser, draftForm?.mobile);
  const editable = {
    coverageLakh: "",
    familyDependents: [],
    includeParents: false,
    mother: { firstName: "", lastName: "", dob: "", age: "" },
    father: { firstName: "", lastName: "", dob: "", age: "" },
    isMarried: null,
    spouse: { fullName: "", dob: "", age: "" },
    children: [],
    premiumTierId: "",
  };
  const base = { ...identity, ...editable };
  if (!draftForm) return base;
  const merged = { ...base, ...draftForm };
  const locked = buildEnrollmentIdentityFromAuth(authUser, merged.mobile);
  const fd = merged.familyDependents;
  const allowedCov = new Set([1, 2, 3, 4, 5, 7, 8, 10]);
  let coverageLakh =
    merged.coverageLakh !== undefined && merged.coverageLakh !== null && String(merged.coverageLakh).trim() !== ""
      ? String(Number(merged.coverageLakh))
      : "";
  const covNum = Number(coverageLakh);
  if (!coverageLakh || Number.isNaN(covNum) || !allowedCov.has(covNum)) {
    coverageLakh =
      merged.premiumTierId === "essential" ? "3" : merged.premiumTierId === "plus" ? "5" : merged.premiumTierId === "premier" ? "10" : "";
  }
  const covFinal = coverageLakh && allowedCov.has(Number(coverageLakh)) ? String(Number(coverageLakh)) : "";
  const premiumTierId = covFinal ? premiumTierIdForCoverageLakh(Number(covFinal)) : "";

  const familyDependents = Array.isArray(fd)
    ? fd.map((row) => {
        const implied = familyDependentImpliedGender(row.relation, merged.gender);
        if (!implied) return row;
        return { ...row, gender: implied };
      })
    : [];
  return {
    ...merged,
    ...locked,
    mobile: merged.mobile !== undefined && merged.mobile !== null ? String(merged.mobile) : locked.mobile,
    coverageLakh: covFinal,
    premiumTierId,
    familyDependents,
  };
}

function WField({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
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
      className={`h-10 px-3 rounded-xl border text-sm text-foreground outline-none transition-colors w-full ${
        disabled
          ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
          : "bg-card border-border hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/10"
      }`}
    />
  );
}

function WSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-10 px-3 rounded-xl border border-border text-sm text-foreground bg-card outline-none hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors w-full"
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
          dot: "bg-success/100",
          text: "text-success",
          bg: "bg-success/10 border-success/30",
        }
      : {
          label: "In progress",
          hint: "Edits save to this device when you change a field",
          dot: "bg-primary",
          text: "text-primary",
          bg: "bg-primary/10 border-primary/25",
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
    bg: "linear-gradient(135deg, var(--destructive) 0%, var(--warning) 100%)",
    label: "Enrollment Deadline",
    get value() {
      return DEADLINE.label;
    },
  },
  {
    icon: Clock,
    bg: "linear-gradient(135deg, var(--primary) 0%, var(--chart-chart-4) 100%)",
    label: "Estimated Time",
    value: "~ 5 minutes",
  },
  {
    icon: Users,
    bg: "linear-gradient(135deg, var(--success) 0%, var(--success) 100%)",
    label: "Coverage Includes",
    value: "Self + Family Dependents",
  },
];

const TRUST_BADGES = [
  { icon: Lock,         label: "Information is securely encrypted" },
  { icon: CheckCircle2, label: "HR & Insurance compliant"           },
  { icon: Info,         label: "Used only for enrollment purposes"  },
];

function ConfirmationView({ firstName, onProceed }) {
  const [policyOpen, setPolicyOpen] = useState(false);
  const landingUrgency = getEnrollmentUrgency();
  return (
    <div
      className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
      style={{
        background: "linear-gradient(147.5deg, var(--background) 0%, color-mix(in srgb, var(--primary) 15%, transparent) 50%, color-mix(in srgb, var(--chart-chart-4) 20%, transparent) 100%)",
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

      <div className="relative z-10 flex w-full max-w-[1100px] flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">

        {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
        <div
          className="relative order-2 flex min-h-[280px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/20 p-5 shadow-lg sm:min-h-[320px] sm:rounded-3xl sm:p-6 lg:order-1 lg:min-h-[580px] lg:flex-[0_0_38%] lg:max-w-none lg:p-8"
          style={{
            background: "linear-gradient(127.24deg, var(--primary) 0%, var(--destructive) 100%)",
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
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-white">Enrollment open</span>
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-xl font-medium leading-snug text-white sm:text-2xl sm:leading-9" style={{ letterSpacing: "-0.53px" }}>
                HealthFirst Plus<br />Group Mediclaim Policy
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/85 sm:mt-4 sm:text-base sm:leading-6" style={{ letterSpacing: "-0.31px" }}>
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
          <div className="relative z-10 mt-6 flex gap-2 sm:mt-8 sm:gap-3">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-1 flex-col rounded-xl px-2.5 py-2.5 sm:rounded-2xl sm:px-3 sm:py-3"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <span className="text-sm font-medium leading-tight text-white sm:text-base sm:leading-6" style={{ letterSpacing: "-0.71px" }}>{value}</span>
                <span className="text-xs text-white/75 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div
          className="order-1 flex min-h-0 w-full flex-col rounded-2xl sm:rounded-3xl lg:order-2 lg:min-h-[580px] lg:flex-1"
          style={{
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(226,232,240,0.7)",
            boxShadow: "0px 20px 25px 0px rgba(226,232,240,0.5), 0px 8px 10px 0px rgba(226,232,240,0.5)",
          }}
        >
          <div className="flex flex-1 flex-col px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-7 lg:px-8 lg:pb-6 lg:pt-8">

            {/* Enrollment context eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-[1.2px]">
                <span className="size-1.5 rounded-full bg-success animate-pulse inline-block" />
                Open Enrollment · Closes May 15
              </span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--primary) 30%, transparent), transparent)" }} />
            </div>

            {/* Draft banner — only shown when draft exists */}
            {typeof window !== "undefined" && !!localStorage.getItem("aziron_enrollment_draft") && (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 mb-3">
                <div className="size-2 rounded-full bg-primary animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">You have a saved draft</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Your progress is saved — continue where you left off.</p>
                </div>
              </div>
            )}

            {/* Heading */}
            <h3 className="mb-3 text-lg font-medium text-foreground sm:text-xl" style={{ letterSpacing: "-0.95px" }}>
              Welcome, {firstName}
            </h3>

            {/* Deadline — same facts as enrollment form */}
            <div
              className={cn(
                "flex flex-col gap-2 rounded-2xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between mb-4",
                landingUrgency.variant === "urgent" ? "bg-warning/10 border-warning/30" :
                landingUrgency.variant === "soon" ? "bg-warning/5 border-warning/20" :
                landingUrgency.variant === "muted" ? "bg-muted border-border" : "bg-muted/50 border-border",
              )}
              role="region"
              aria-label="Enrollment deadline"
            >
              <div className="flex items-start gap-2 min-w-0">
                <Calendar size={13} className="text-warning shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Enrollment closes <strong className="font-semibold">{DEADLINE.label}</strong>
                    <span className="text-muted-foreground font-normal"> · {DEADLINE.cycle}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Window: {DEADLINE.cycleRange} (end of day, your local time)</p>
                </div>
              </div>
              <span
                className={cn(
                  "self-start text-[11px] font-bold px-2.5 py-1 rounded-full border sm:self-center tabular-nums",
                  landingUrgency.variant === "urgent" ? "text-warning-foreground bg-warning/15 border-warning/30" :
                  landingUrgency.variant === "muted" ? "text-muted-foreground bg-muted border-border" :
                  "text-foreground bg-card border-border",
                )}
              >
                {landingUrgency.text}
              </span>
            </div>

            {/* Description */}
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-6" style={{ letterSpacing: "-0.31px" }}>
              Aziro has partnered with{" "}
              <strong className="font-bold text-foreground">HealthFirst Plus</strong>
              {" "}to provide comprehensive corporate health insurance coverage for you and your eligible dependents. Review the policy and complete enrollment in about 5 minutes.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              To add <strong className="font-semibold text-foreground">family members</strong> (spouse, parents, children) to your policy, submit before the window closes.
              If you miss the deadline, the company automatically assigns you{" "}
              <strong className="font-semibold text-foreground">individual-only coverage</strong> at no extra cost — see details below.
            </p>

            <PostDeadlineAutoEnrollmentNotice collapsible className="mb-6" />

            {/* Info cards */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <p className="text-[11px] text-muted-foreground uppercase mb-1" style={{ letterSpacing: "0.6px" }}>{card.label}</p>
                    <p className="text-sm text-foreground leading-5" style={{ letterSpacing: "-0.15px" }}>{card.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Policy Preview row */}
            <div
              className="mb-5 flex cursor-pointer flex-col gap-3 rounded-2xl px-4 py-4 transition-colors hover:bg-card/90 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(226,232,240,0.8)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileText size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-foreground" style={{ letterSpacing: "-0.15px" }}>Policy Preview</p>
                  <p className="text-xs font-medium text-muted-foreground">Coverage, network &amp; eligibility details</p>
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 self-end text-muted-foreground sm:self-auto" />
            </div>

            {/* CTA buttons */}
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <button
                onClick={onProceed}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl text-base font-medium text-white transition-opacity hover:opacity-90 sm:flex-1"
                style={{
                  background: "linear-gradient(173.46deg, var(--primary) 0%, var(--chart-chart-4) 100%)",
                  filter: "drop-shadow(0px 10px 7.5px rgba(97,95,255,0.3)) drop-shadow(0px 4px 3px rgba(97,95,255,0.3))",
                  letterSpacing: "-0.31px",
                }}
              >
                Continue Enrollment
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setPolicyOpen(true)}
                className="flex h-[50px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 text-base font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
                style={{ letterSpacing: "-0.31px" }}
                aria-label="Open policy details panel"
              >
                View Policy Details
                <Eye size={14} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(226,232,240,0.7)] pt-5 sm:gap-5">
              {TRUST_BADGES.map((row) => {
                const IconComponent = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-1.5">
                    <IconComponent size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{row.label}</span>
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
          <SheetHeader className="shrink-0 border-b border-border px-6 py-4 text-left">
            <SheetTitle className="text-base font-semibold text-foreground">Policy Preview</SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{POLICY.name}</p>
          </SheetHeader>
          <div className="p-6 space-y-6">
            {/* Key numbers */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Sum Insured",  value: POLICY.sumInsured      },
                { label: "Premium",      value: POLICY.premiumRange    },
                { label: "Hospitals",    value: POLICY.networkHospitals },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 rounded-2xl border border-border bg-muted px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {/* What's covered */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">What's covered</p>
              <div className="grid grid-cols-2 gap-2.5">
                {POLICY.coverageTypes.map(({ icon: Icon, label, desc, color, bg }) => (
                  <div key={label} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
                    <div className="size-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key highlights */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Key highlights</p>
              <div className="space-y-2">
                {POLICY.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground leading-relaxed">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => { setPolicyOpen(false); onProceed(); }}
              className="w-full h-12 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(173.46deg, var(--primary) 0%, var(--chart-chart-4) 100%)" }}
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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-sm">
      <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: coverage.bg }}>
        <Icon size={14} style={{ color: coverage.color }} />
      </div>
      <div className="min-w-0 flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-foreground">{coverage.label}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">{coverage.premium} {coverage.premiumNote}</span>
      </div>
      {onChangeCoverage && (
        <button
          type="button"
          onClick={onChangeCoverage}
          className="ml-auto text-xs font-semibold text-primary hover:text-primary whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded px-1"
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
    <div className="bg-card border border-border rounded-2xl px-5 py-4 space-y-3 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Coverage plan</p>
        <h2 className="text-sm font-semibold text-foreground">Select who you'd like to cover</h2>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
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
              className={`relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-border hover:bg-muted"
              }`}
            >
              {isSelected && (
                <div className="absolute right-2.5 top-2.5 size-4 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 size={9} className="text-white" />
                </div>
              )}
              <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: opt.bg }}>
                <Icon size={13} style={{ color: opt.color }} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight pr-4">{opt.label}</p>
                <p className="text-[11px] mt-1">
                  <span className="font-semibold text-foreground">{opt.premium}</span>{" "}
                  <span className="text-muted-foreground">{opt.premiumNote}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2.5">
          <CheckCircle2 size={13} className="text-success flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{selected.desc}</p>
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
      style={{ background: "linear-gradient(147.5deg, var(--background) 0%, color-mix(in srgb, var(--primary) 15%, transparent) 50%, color-mix(in srgb, var(--chart-chart-4) 20%, transparent) 100%)" }}
    >
      <div className="mx-auto max-w-2xl">

        {/* Step breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            Step 0 · Coverage
          </span>
          <ChevronRight size={12} className="text-muted-foreground" aria-hidden />
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            Step 1 · Members
          </span>
          <ChevronRight size={12} className="text-muted-foreground" aria-hidden />
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            Step 2 · Premium
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Who would you like to cover, {firstName}?
        </h1>
        <p className="mt-1.5 mb-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
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
                className={`relative flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  isSelected
                    ? "border-primary bg-card shadow-md shadow-primary/10"
                    : "border-border bg-card hover:border-border hover:shadow-sm"
                }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute right-3.5 top-3.5 size-5 rounded-full bg-primary flex items-center justify-center">
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
                    <p className="text-sm font-bold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>

                {/* Includes list */}
                <ul className="space-y-1.5">
                  {opt.includes.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-success flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Premium badge */}
                <div
                  className={`mt-auto rounded-xl px-3 py-2 ${isSelected ? "bg-primary/10" : "bg-muted"}`}
                >
                  <span className="text-base font-bold text-foreground">{opt.premium}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{opt.premiumNote}</span>
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
            style={{ background: "linear-gradient(173.46deg, var(--primary) 0%, var(--chart-chart-4) 100%)" }}
          >
            Continue with {chosen.label}
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-12 rounded-2xl border border-border bg-card px-6 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            ← Back to overview
          </button>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
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
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-warning" />
          <div className="px-8 pt-8 pb-7 flex flex-col items-center text-center">
            <div className="size-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-5">
              <AlertTriangle size={28} className="text-warning" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Are you sure, {firstName}?</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Skipping now means you may miss the <strong className="text-foreground">{DEADLINE.label}</strong> enrollment deadline.
              The next enrollment window opens with Cycle 2 (May 15–31).
            </p>
            <div className="mt-4 p-3.5 rounded-2xl bg-warning/10 border border-warning/20 text-left w-full">
              <p className="text-xs text-warning-foreground leading-relaxed">
                If you skip, your enrollment will not be processed in the current batch.
                You can return to this page at any time before the deadline to complete your enrollment.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full mt-6">
              <button
                onClick={onBack}
                className="w-full h-12 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md shadow-primary/20"
                style={{ background: "linear-gradient(173.46deg, var(--primary) 0%, var(--chart-chart-4) 100%)" }}
              >
                <ArrowRight size={14} className="rotate-180" />
                Go back and Enroll
              </button>
              <button
                onClick={onConfirmSkip}
                className="w-full h-11 rounded-2xl text-sm font-medium text-muted-foreground border border-border bg-card hover:bg-muted transition-colors"
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
      className={`scroll-mt-28 bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
        s === "done" ? "border-success/30" : s === "partial" ? "border-primary/25" : "border-border"
      } ${focused ? "ring-2 ring-ring/45 shadow-md shadow-primary/10" : ""}`}
      aria-labelledby={`enroll-heading-${id}`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-background transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              s === "done"
                ? "bg-success/100"
                : s === "partial"
                  ? "bg-primary/15 border-2 border-primary"
                  : "bg-muted border-2 border-border"
            }`}
          >
            {s === "done" && <CheckCircle2 size={13} className="text-white" />}
          </div>
          <div>
            <h2 id={`enroll-heading-${id}`} className="text-sm font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {s === "done" && (
            <span className="text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/30">
              Complete
            </span>
          )}
          {s === "partial" && (
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/25">
              In progress
            </span>
          )}
          <ChevronDown size={15} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-border">
          <div className="pt-5">{children}</div>
        </div>
      )}
    </section>
  );
}

function EmployeeDirectoryReadOnly({ directory }) {
  return (
    <div className="rounded-xl border border-border bg-muted px-4 py-4 sm:px-5">
      <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee ID</dt>
          <dd className="mt-1.5 text-sm font-medium text-foreground">{directory.employeeId || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full name</dt>
          <dd className="mt-1.5 text-sm font-medium text-foreground">{directory.fullName.trim() || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work email</dt>
          <dd className="mt-1.5 text-sm font-medium text-foreground break-all">{directory.email.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department</dt>
          <dd className="mt-1.5 text-sm font-medium text-foreground">{directory.department?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joining date</dt>
          <dd className="mt-1.5 text-sm font-medium text-foreground">{formatDisplayDate(directory.joiningDate)}</dd>
        </div>
      </dl>
      <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        These details are supplied by your employer. If anything looks wrong, contact HR — they are not editable in this enrollment form.
      </p>
    </div>
  );
}

function ProfileInfoRow({ label, value }) {
  const shown = value !== undefined && value !== null && String(value).trim() !== "";
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">{shown ? String(value).trim() : "—"}</dd>
    </div>
  );
}

function EnrollSelfFields({ form, errors, patch }) {
  const [mobileEditing, setMobileEditing] = useState(false);
  const [mobileDraft, setMobileDraft] = useState(form.mobile);
  const mobileInputRef = useRef(null);

  useEffect(() => {
    if (!mobileEditing) setMobileDraft(form.mobile);
  }, [form.mobile, mobileEditing]);

  useEffect(() => {
    if (mobileEditing) mobileInputRef.current?.focus();
  }, [mobileEditing]);

  const displayName = form.legalNameAsPerId?.trim() || "";
  const displayDob = form.dob ? formatDisplayDate(form.dob) : "";
  const displayAge = form.age ? `${form.age} years` : "";
  const displayGender = form.gender?.trim() || "";

  return (
    <dl className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <ProfileInfoRow label="Name (as per Government ID)" value={displayName} />
        </div>
        <div className="w-full shrink-0 sm:w-auto sm:max-w-[min(100%,20rem)] sm:text-right">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-right">Mobile number</dt>
          <dd className="mt-2 sm:flex sm:flex-col sm:items-end">
            {!mobileEditing ? (
              <button
                type="button"
                onClick={() => {
                  setMobileDraft(form.mobile || "");
                  setMobileEditing(true);
                }}
                aria-label="Edit mobile number"
                title="Click to edit"
                className="max-w-full min-w-0 rounded-md px-1 py-0.5 text-right text-sm font-medium text-foreground underline-offset-2 transition-colors hover:bg-muted/60 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-right"
              >
                {form.mobile?.trim() ? form.mobile.trim() : "—"}
              </button>
            ) : (
              <div className="w-full space-y-2 sm:max-w-xs">
                <input
                  ref={mobileInputRef}
                  type="tel"
                  value={mobileDraft}
                  onChange={(e) => setMobileDraft(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Enter mobile number"
                  aria-invalid={!!errors.mobile}
                />
                {errors.mobile && <p className="text-left text-xs text-destructive sm:text-right">{errors.mobile}</p>}
                <div className="flex flex-wrap gap-2 pt-1 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      patch("mobile", mobileDraft.trim());
                      setMobileEditing(false);
                    }}
                    className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDraft(form.mobile || "");
                      setMobileEditing(false);
                    }}
                    className="h-9 rounded-lg border border-border bg-muted/50 px-4 text-xs font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </dd>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-4">
        <ProfileInfoRow label="Date of Birth" value={displayDob} />
        <ProfileInfoRow label="Age" value={displayAge} />
        <ProfileInfoRow label="Gender" value={displayGender} />
      </div>
    </dl>
  );
}

function AddFamilyMemberMenuButton({ form, onSelectRelation }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const taken = new Set((form.familyDependents ?? []).map((d) => d.relation));
  const available = FAMILY_DEPENDENT_RELATION_OPTIONS.filter((o) => !taken.has(o.id));

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

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={available.length === 0}
        title={available.length === 0 ? "All listed dependent types are already on this enrollment" : undefined}
        onClick={() => available.length > 0 && setOpen((v) => !v)}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card py-3.5 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={18} aria-hidden />
        Add Family Member
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && available.length > 0 && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {available.map((o) => (
            <button
              key={o.id}
              type="button"
              role="menuitem"
              className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => {
                onSelectRelation(o.id);
                setOpen(false);
                btnRef.current?.focus();
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FamilyDependentCard({ member, employeeGender, onUpdate, onSave, onDiscard, onEdit, onDelete }) {
  const title = familyDependentRelationLabel(member.relation);
  const impliedGender = familyDependentImpliedGender(member.relation, employeeGender);
  const displayGender = familyDependentEffectiveGender(member.relation, member.gender, employeeGender);
  const impliedGenderHint = member.relation === "spouse" ? "(from your profile)" : "(from relationship)";
  const [savedExpanded, setSavedExpanded] = useState(true);

  if (member.saved) {
    const displayDob = member.dob ? formatDisplayDate(member.dob) : "";
    const displayAge = member.age ? `${member.age} years` : "";
    const rowComplete = !!(
      member.name?.trim() &&
      member.dob &&
      familyDependentEffectiveGender(member.relation, member.gender, employeeGender)
    );
    const s = rowComplete ? "done" : "partial";
    const headingId = `enroll-family-heading-${member.id}`;
    return (
      <section
        id={`enroll-family-${member.id}`}
        className={`scroll-mt-28 overflow-hidden rounded-2xl border bg-card transition-all duration-200 ${
          s === "done" ? "border-success/30" : "border-primary/25"
        }`}
        aria-labelledby={headingId}
      >
        <div className="flex min-w-0 items-stretch">
          <button
            type="button"
            aria-expanded={savedExpanded}
            aria-controls={`enroll-family-panel-${member.id}`}
            onClick={() => setSavedExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 px-4 py-4 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-6"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                  s === "done"
                    ? "bg-success/100"
                    : "border-2 border-primary/40 bg-primary/15"
                }`}
              >
                {s === "done" && <CheckCircle2 size={13} className="text-white" aria-hidden />}
              </div>
              <div className="min-w-0">
                <h2 id={headingId} className="truncate text-sm font-semibold text-foreground">
                  {title}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {member.name?.trim()
                    ? `${member.name.trim()} · Dependent on your policy`
                    : "Dependent on your policy"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {s === "done" && (
                <span className="hidden text-[11px] font-semibold text-success sm:inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5">
                  Complete
                </span>
              )}
              {s === "partial" && (
                <span className="hidden text-[11px] font-semibold text-primary sm:inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5">
                  In progress
                </span>
              )}
              <ChevronDown
                size={15}
                className={`shrink-0 text-muted-foreground transition-transform ${savedExpanded ? "rotate-180" : ""}`}
                aria-hidden
              />
            </div>
          </button>
          <div
            className="flex shrink-0 items-center gap-0.5 border-l border-border bg-muted/30 px-1 py-2 sm:gap-1 sm:px-2"
            role="group"
            aria-label={`Actions for ${title}`}
          >
            <button
              type="button"
              onClick={() => {
                setSavedExpanded(true);
                onEdit?.();
              }}
              className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={`Edit ${title}`}
            >
              <Pencil size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.()}
              className="flex size-9 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
              aria-label={`Remove ${title}`}
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </div>
        </div>
        {savedExpanded && (
          <div
            id={`enroll-family-panel-${member.id}`}
            role="region"
            aria-labelledby={headingId}
            className="border-t border-border px-4 pb-6 sm:px-6"
          >
            <div className="pt-5">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-x-5 lg:gap-x-8">
                <ProfileInfoRow label="Name" value={member.name} />
                <ProfileInfoRow label="Date of Birth" value={displayDob} />
                <ProfileInfoRow label="Age" value={displayAge} />
                <ProfileInfoRow label="Gender" value={displayGender} />
              </dl>
            </div>
          </div>
        )}
      </section>
    );
  }
  return (
    <section
      className="rounded-2xl border-2 border-dashed border-primary/35 bg-muted/20 px-4 py-4 sm:px-5"
      aria-label={`Draft dependent ${title}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Add {title}</p>
        <button
          type="button"
          onClick={onDiscard}
          className="text-xs font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
        >
          Discard
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WField label="Name" required>
          <WInput value={member.name} onChange={(v) => onUpdate({ name: v })} placeholder="Full name" />
        </WField>
        {impliedGender ? (
          <WField label="Gender">
            <div className="flex min-h-10 items-center rounded-xl border border-border bg-muted/50 px-3 text-sm font-medium text-foreground">
              {impliedGender}
              <span className="ml-2 text-xs font-normal text-muted-foreground">{impliedGenderHint}</span>
            </div>
          </WField>
        ) : (
          <WField label="Gender" required>
            <WSelect value={member.gender} onChange={(v) => onUpdate({ gender: v })} options={["Male", "Female", "Other"]} placeholder="Select gender" />
          </WField>
        )}
        <WField label="Date of Birth" required>
          <WInput value={member.dob} onChange={(v) => onUpdate({ dob: v })} type="date" />
        </WField>
        <WField label="Age (auto-calculated)">
          <WInput value={member.age} onChange={() => {}} placeholder="—" disabled />
        </WField>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={
          !member.name?.trim() ||
          !member.dob ||
          !familyDependentEffectiveGender(member.relation, member.gender, employeeGender)
        }
        className="mt-4 h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-45 sm:w-auto sm:px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Save family member
      </button>
    </section>
  );
}

function EnrollParentsFields({ form, patch, patchNested, parentOpen, setParentOpen, integrated }) {
  return (
    <div className="space-y-4">
      {!integrated && (
        <label className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted cursor-pointer hover:border-border transition-colors">
          <div
            className={`size-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              form.includeParents ? "bg-primary border-primary" : "bg-card border-border"
            }`}
          >
            {form.includeParents && <CheckCircle2 size={12} className="text-white" />}
          </div>
          <input type="checkbox" className="sr-only" checked={form.includeParents} onChange={(e) => patch("includeParents", e.target.checked)} />
          <div>
            <p className="text-sm font-medium text-foreground">Include parents as dependents</p>
            <p className="text-xs text-muted-foreground">Covered under the family floater plan</p>
          </div>
        </label>
      )}

      {form.includeParents &&
        ["mother", "father"].map((parent) => (
          <div key={parent} className="border border-border rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-3.5 bg-muted hover:bg-muted transition-colors"
              onClick={() => setParentOpen((p) => ({ ...p, [parent]: !p[parent] }))}
            >
              <div className="flex items-center gap-2">
                {parent === "mother" ? <Heart size={13} className="text-primary" /> : <Users size={13} className="text-primary" />}
                <span className="text-sm font-medium text-foreground capitalize">{parent} Details</span>
                {form[parent].firstName && (
                  <span className="text-xs text-muted-foreground">
                    — {form[parent].firstName} {form[parent].lastName}
                  </span>
                )}
              </div>
              <ChevronDown size={13} className={`text-muted-foreground transition-transform ${parentOpen[parent] ? "rotate-180" : ""}`} />
            </button>
            {parentOpen[parent] && (
              <div className="px-5 py-4 grid grid-cols-2 gap-4 border-t border-border">
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
                form.isMarried === val ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-border"
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
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
          <CheckCircle2 size={13} className="text-success flex-shrink-0" />
          <p className="text-xs text-muted-foreground">Noted — spouse section will not be included in your enrollment.</p>
        </div>
      )}
    </div>
  );
}

function EnrollChildrenFields({ form, patchChild, addChild, removeChild, hideInlineAdd }) {
  return (
    <div className="space-y-4">
      {form.children.map((child, idx) => (
        <div key={idx} className="border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-muted border-b border-border">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-warning" />
              <span className="text-sm font-semibold text-foreground">Child {idx + 1}</span>
              {child.fullName && <span className="text-xs text-muted-foreground">— {child.fullName}</span>}
            </div>
            <button type="button" onClick={() => removeChild(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-1" aria-label={`Remove child ${idx + 1}`}>
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
          className="w-full h-11 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-all"
        >
          <span className="text-lg leading-none font-light">+</span> Add Child
        </button>
      )}
      {form.children.length === 2 && <p className="text-xs text-center text-muted-foreground">Maximum of 2 children reached</p>}
    </div>
  );
}

function EnrollCoverageSelectionPanel({ form, onCoverageLakhChange, savedDependentCount }) {
  const premium = computeFloaterAnnualPremiumINR(form.coverageLakh, savedDependentCount);
  return (
    <section
      id="enroll-section-coverage"
      className="scroll-mt-28 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm"
      aria-labelledby="enroll-heading-coverage"
    >
      <div className="mb-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1</p>
        <h2 id="enroll-heading-coverage" className="text-sm font-semibold text-foreground">
          Insurance coverage selection
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Choose the floater sum insured for <strong className="font-medium text-muted-foreground">{POLICY.name}</strong> ({POLICY.year}). The
          same limit covers <strong className="font-medium text-muted-foreground">you and every dependent</strong> you save in this enrollment.
        </p>
      </div>
      <WField label="Coverage amount" required>
        <select
          value={form.coverageLakh ? String(form.coverageLakh) : ""}
          onChange={(e) => onCoverageLakhChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Select amount</option>
          {ENROLLMENT_COVERAGE_LAKH_OPTIONS.map((o) => (
            <option key={o.value} value={String(o.value)}>
              {o.label} ({coverageSumInsuredDisplay(o.value)})
            </option>
          ))}
        </select>
      </WField>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            💡 <strong className="font-semibold text-foreground">Floater policy</strong> — one shared sum insured that covers you and all enrolled family members together.
          </p>
      <div className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Applicable annual premium (estimate)</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
          {premium != null ? formatEnrollmentPremiumInr(premium) : "—"}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Based on <strong className="text-foreground">{savedDependentCount}</strong> saved dependent
          {savedDependentCount === 1 ? "" : "s"} on this enrollment
          {savedDependentCount === 0 ? " (employee only under this floater until you add family)" : ""}. Final payroll deduction follows HR
          rules. Corporate band (Essential / Plus / Premier) is derived from this amount for payroll — no extra step.
        </p>
      </div>
    </section>
  );
}

function EnrollReviewPanel({ warnings, canSubmit, submit, status, rootId, blockedHint }) {
  return (
    <div id={rootId ?? undefined} className={`bg-card border border-border rounded-2xl px-6 py-5 ${rootId ? "scroll-mt-24" : ""}`}>
      {warnings.length > 0 && (
        <div className="mb-4 p-3.5 rounded-xl bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={13} className="text-warning" />
            <p className="text-xs font-semibold text-warning-foreground">Please review before submitting</p>
          </div>
          {warnings.map((w) => (
            <p key={w} className="text-xs text-warning ml-5">
              • {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 mb-4">
        <Info size={13} className="text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground leading-relaxed">
          By submitting, I confirm all information is accurate and consent to enrollment in the{" "}
          <strong>HealthFirst Plus Group Mediclaim Policy 2026</strong> under Aziron's corporate benefits program.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          {["employee", "self", "spouse"].map((k) => (
            <div key={k} className={`size-2 rounded-full ${status[k] === "done" ? "bg-success/100" : "bg-border"}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{Object.values(status).filter((s) => s === "done").length} of 5 sections complete</span>
        </div>
        <button
          type="button"
          onClick={canSubmit ? submit : undefined}
          className={`flex items-center justify-center gap-2 h-11 px-7 rounded-xl text-sm font-semibold transition-all ${
            canSubmit ? "bg-success hover:bg-success/90 text-white shadow-sm shadow-success/20 cursor-pointer" : "bg-border text-muted-foreground cursor-not-allowed"
          }`}
        >
          <CheckCircle2 size={14} />
          Submit Enrollment
        </button>
      </div>
      {!canSubmit && (
        <p className="text-xs text-muted-foreground text-right mt-2 sm:col-span-2">
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
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          className="absolute right-0 z-30 mt-2 min-w-[260px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg outline-none"
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
                it.enabled ? "text-foreground hover:bg-muted" : "cursor-not-allowed bg-muted text-muted-foreground"
              } ${idx === activeIdx && it.enabled ? "bg-primary/10/80" : ""}`}
              onMouseEnter={() => it.enabled && setActiveIdx(idx)}
              onClick={() => {
                if (it.enabled) runActive(idx);
              }}
            >
              <span className="font-semibold">{it.label}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{it.sub}</span>
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
        <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/10/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="font-semibold">Tip:</strong> Dependents are not covered until you add them — use <strong>Add member</strong> for
            parents or children.
          </p>
          <button
            type="button"
            className="self-start text-xs font-semibold text-primary hover:text-primary/80 sm:self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-md px-1 py-0.5"
            onClick={dismissHint}
          >
            Don’t show again
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Marital status (and spouse details when married) is <strong className="font-medium text-muted-foreground">required</strong> for enrollment.
            Parents and children can only be added with <strong className="font-medium text-muted-foreground">Add member</strong>.
          </p>
          {!form.includeParents && form.children.length === 0 && (
            <p className="text-xs text-muted-foreground leading-relaxed">
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Spouse / marital status</p>
          <EnrollSpouseFields form={form} patch={patch} patchNested={patchNested} />
        </div>
      )}

      {form.includeParents && (
        <div id="family-part-parents" className="scroll-mt-32 space-y-3 rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Parents on plan</p>
            {!confirmRemoveParents && (
              <button
                type="button"
                onClick={() => setConfirmRemoveParents(true)}
                className="text-xs font-semibold text-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 rounded px-1"
              >
                Remove parents
              </button>
            )}
          </div>
          {confirmRemoveParents && (
            <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-3">
              <p className="text-xs text-warning-foreground leading-relaxed">
                Remove parents from this enrollment? Details you entered stay in your draft on this device until you change them.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-8 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  onClick={() => setConfirmRemoveParents(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8 rounded-lg bg-destructive px-3 text-xs font-semibold text-white hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Children</p>
          <EnrollChildrenFields form={form} patchChild={patchChild} addChild={addChild} removeChild={removeChild} hideInlineAdd />
          {form.children.length === 0 && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              No children added yet — use <strong className="font-medium text-muted-foreground">Add member → Add child dependent</strong> when you need coverage.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Submission Confirmation Modal ───────────────────────────────────────────

function SubmitConfirmModal({ open, onClose, onConfirm, form }) {
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);

  useEffect(() => {
    if (open) setConsentAcknowledged(false);
  }, [open]);

  const deps        = (form?.familyDependents ?? []).filter((d) => d.saved);
  const coverageLakh = Number(form?.coverageLakh) || 0;
  const annualPremium = computeFloaterAnnualPremiumINR(coverageLakh, deps.length);
  const basePremium   = computeFloaterAnnualPremiumINR(coverageLakh, 0);
  const sumInsured    = coverageSumInsuredDisplay(coverageLakh);
  const employeeName  = form?.legalNameAsPerId || form?.fullName || "You";
  const employeeGender = form?.gender || "";

  const members = [
    { id: "self", name: employeeName, relation: "Employee (Self)", dob: form?.dob || "", gender: employeeGender, isSelf: true },
    ...deps.map((d) => ({
      id: d.id,
      name: d.name || "—",
      relation: familyDependentRelationLabel(d.relation),
      dob: d.dob || "",
      gender: familyDependentEffectiveGender(d.relation, d.gender, employeeGender),
      isSelf: false,
    })),
  ];

  const memberPremiums = members.map((_, i) =>
    !basePremium ? null : i === 0 ? basePremium : Math.round(basePremium * 0.16),
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-success/10 flex items-center justify-center">
              <ShieldCheck size={15} className="text-success" />
            </div>
            <div>
              <p id="confirm-modal-title" className="text-sm font-bold text-foreground">Review & Confirm Enrollment</p>
              <p className="text-[11px] text-muted-foreground">Please review your policy details before submitting</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Policy header */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-foreground">HealthFirst Plus Group Mediclaim Policy 2026</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Sum insured: <span className="font-medium text-foreground">{sumInsured || "—"}</span> · Floater · Cycle 1
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/30 shrink-0">
              <CheckCircle2 size={10} />
              Active Jun 1
            </span>
          </div>

          {/* Premium breakdown */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Premium Breakdown</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Member</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Relation</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Annual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m, i) => (
                    <tr key={m.id} className="bg-card">
                      <td className="px-3 py-2 leading-tight">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-foreground">{m.name}</span>
                          {m.isSelf && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">You</span>}
                        </div>
                        {(m.dob || m.gender) && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {m.dob && formatDisplayDate(m.dob)}{m.dob && m.gender && " · "}{m.gender}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground align-top pt-2.5">{m.relation}</td>
                      <td className="px-3 py-2 text-right font-medium text-foreground align-top pt-2.5">
                        {memberPremiums[i] != null ? (i === 0 ? formatEnrollmentPremiumInr(memberPremiums[i]) : `+${formatEnrollmentPremiumInr(memberPremiums[i])}`) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted border-t-2 border-border">
                    <td colSpan={2} className="px-3 py-2.5 font-bold text-foreground text-xs">
                      Total Annual Premium
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">({members.length} {members.length === 1 ? "member" : "members"})</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-foreground">
                      {annualPremium != null ? formatEnrollmentPremiumInr(annualPremium) : "—"}
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">/yr</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Final deduction follows HR band — no extra step needed.</p>
          </div>

          {/* Consent — checkbox row (not a callout banner) */}
          <div className="border-t border-border pt-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg py-1 pr-1 transition-colors hover:bg-muted/40">
              <input
                type="checkbox"
                checked={consentAcknowledged}
                onChange={(e) => setConsentAcknowledged(e.target.checked)}
                className="mt-1 size-4 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-primary/25 focus:ring-offset-0"
              />
              <span className="text-sm leading-relaxed text-muted-foreground">
                I confirm that all information above is accurate and I consent to enrollment in the{" "}
                <strong className="font-medium text-foreground">HealthFirst Plus Group Mediclaim Policy 2026</strong> under
                Aziron&apos;s corporate benefits program.
              </span>
            </label>
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-border bg-muted/30">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Review Again
          </button>
          <button
            type="button"
            disabled={!consentAcknowledged}
            onClick={onConfirm}
            className="h-10 px-7 rounded-xl bg-success text-white text-sm font-semibold flex items-center gap-2 shadow-sm shadow-success/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/60 focus-visible:ring-offset-2 enabled:hover:bg-success/90 disabled:pointer-events-none disabled:opacity-40"
          >
            <CheckCircle2 size={14} />
            Confirm & Submit
          </button>
        </div>
      </div>
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
  const [open, setOpen] = useState(new Set(["coverage", "self"]));
  const [errors, setErrors] = useState({});
  const [previewFocusKey, setPreviewFocusKey] = useState("coverage");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [fabBottomPx, setFabBottomPx] = useState(16);

  const directory = useMemo(() => employeeFieldsFromAuth(auth.user), [auth.user]);

  const withProfile = useCallback(
    (row) => ({ ...row, ...buildEnrollmentIdentityFromAuth(auth.user, row.mobile) }),
    [auth.user],
  );

  useEffect(() => {
    setForm((prev) => ({ ...prev, ...buildEnrollmentIdentityFromAuth(auth.user, prev.mobile) }));
  }, [auth.user]);

  // Show preview only once user has started filling
  const hasStartedFilling = !!(
    form.coverageLakh ||
    form.dob ||
    form.mobile?.trim() ||
    form.gender ||
    (form.familyDependents ?? []).length > 0
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

  const persist = useCallback(
    (partial) => {
      const merged = withProfile(partial);
      saveDraft({ form: merged });
      setDraftState("draft_saved");
      setLastSavedAt(Date.now());
    },
    [withProfile],
  );

  // Keep spouse rows aligned when self gender is Male/Female (complementary spouse gender).
  useEffect(() => {
    setForm((prev) => {
      const impliedSpouse = familyDependentImpliedGender("spouse", prev.gender);
      const list = prev.familyDependents ?? [];
      if (!impliedSpouse) return prev;
      let changed = false;
      const nextList = list.map((row) => {
        if (row.relation !== "spouse") return row;
        if (row.gender === impliedSpouse) return row;
        changed = true;
        return { ...row, gender: impliedSpouse };
      });
      if (!changed) return prev;
      const n = { ...prev, familyDependents: nextList };
      persist(n);
      return withProfile(n);
    });
  }, [form.gender, persist, withProfile]);

  // Auto-save every 30 s
  useEffect(() => {
    const t = setInterval(() => { persist(form); }, 30000);
    return () => clearInterval(t);
  }, [form, persist]);

  const setCoverageLakh = useCallback(
    (raw) => {
      const v = String(raw ?? "").trim();
      const n = Number(v);
      const allowed = new Set([1, 2, 3, 4, 5, 7, 8, 10]);
      setForm((prev) => {
        const covFinal = v && allowed.has(n) ? String(n) : "";
        const tier = covFinal ? premiumTierIdForCoverageLakh(Number(covFinal)) : "";
        const next = { ...prev, coverageLakh: covFinal, premiumTierId: tier };
        persist(next);
        return withProfile(next);
      });
      setPreviewFocusKey("coverage");
    },
    [persist, withProfile],
  );

  const patch = useCallback((key, val) => {
    if (
      [
        "dob",
        "age",
        "gender",
        "legalNameAsPerId",
        "employeeId",
        "fullName",
        "email",
        "department",
        "joiningDate",
        "dateOfBirth",
      ].includes(key)
    ) {
      return;
    }
    setForm((prev) => {
      const n = { ...prev, [key]: val };
      persist(n);
      return withProfile(n);
    });
  }, [persist, withProfile]);

  const addFamilyDependent = useCallback(
    (relation) => {
      setForm((prev) => {
        const n = {
          ...prev,
          familyDependents: [
            ...(prev.familyDependents ?? []),
            {
              id: newFamilyDependentRowId(),
              relation,
              name: "",
              dob: "",
              gender: familyDependentImpliedGender(relation, prev.gender) ?? "",
              age: "",
              saved: false,
            },
          ],
        };
        persist(n);
        return withProfile(n);
      });
      setOpen((prev) => {
        const next = new Set(prev);
        next.add("family");
        return next;
      });
      setPreviewFocusKey("family");
      requestAnimationFrame(() =>
        document.getElementById("enroll-section-family")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    },
    [persist, withProfile],
  );

  const updateFamilyDependent = useCallback(
    (id, partial) => {
      setForm((prev) => {
        const list = (prev.familyDependents ?? []).map((row) => {
          if (row.id !== id) return row;
          const next = { ...row, ...partial };
          if (partial.dob !== undefined) next.age = calcAge(partial.dob);
          const implied = familyDependentImpliedGender(next.relation, prev.gender);
          if (implied) next.gender = implied;
          return next;
        });
        const n = { ...prev, familyDependents: list };
        persist(n);
        return withProfile(n);
      });
    },
    [persist, withProfile],
  );

  const removeFamilyDependent = useCallback(
    (id) => {
      setForm((prev) => {
        const n = { ...prev, familyDependents: (prev.familyDependents ?? []).filter((r) => r.id !== id) };
        persist(n);
        return withProfile(n);
      });
    },
    [persist, withProfile],
  );

  const editFamilyDependent = useCallback(
    (id) => {
      setForm((prev) => {
        const list = (prev.familyDependents ?? []).map((r) => (r.id === id ? { ...r, saved: false } : r));
        const n = { ...prev, familyDependents: list };
        persist(n);
        return withProfile(n);
      });
      setPreviewFocusKey("family");
    },
    [persist, withProfile],
  );

  const deleteFamilyDependent = useCallback(
    (id) => {
      const row = (form.familyDependents ?? []).find((r) => r.id === id);
      const label = row ? familyDependentRelationLabel(row.relation) : "Dependent";
      if (!window.confirm(`Remove ${label} from this enrollment?`)) return;
      removeFamilyDependent(id);
    },
    [form.familyDependents, removeFamilyDependent],
  );

  const saveFamilyDependent = useCallback(
    (id) => {
      setForm((prev) => {
        const row = (prev.familyDependents ?? []).find((r) => r.id === id);
        if (!row || row.saved) return prev;
        const genderOk = familyDependentEffectiveGender(row.relation, row.gender, prev.gender);
        if (!row.name?.trim() || !row.dob || !genderOk) return prev;
        const implied = familyDependentImpliedGender(row.relation, prev.gender);
        const list = (prev.familyDependents ?? []).map((r) =>
          r.id === id ? { ...r, saved: true, gender: implied ?? r.gender } : r,
        );
        const n = { ...prev, familyDependents: list };
        persist(n);
        return withProfile(n);
      });
    },
    [persist, withProfile],
  );

  const toggle = useCallback((id) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); setPreviewFocusKey(id); }
      return next;
    });
  }, []);

  const saveAsDraft = useCallback(() => { persist(form); }, [form, persist]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const openConfirmModal = () => { if (canSubmit) setShowConfirmModal(true); };
  const submit = () => { setShowConfirmModal(false); localStorage.removeItem(DRAFT_KEY); onSuccess(form); };

  const deps = form.familyDependents ?? [];
  const hasUnsavedFamily = deps.some((d) => !d.saved);
  const savedFamilyComplete = deps
    .filter((d) => d.saved)
    .every((d) => d.name?.trim() && d.dob && familyDependentEffectiveGender(d.relation, d.gender, form.gender));
  const familyStatus =
    deps.length === 0 ? "done" : hasUnsavedFamily ? "partial" : !savedFamilyComplete ? "partial" : "done";

  // Status (legacy keys parents/spouse/children kept as done for compatibility)
  const status = {
    employee: directory.fullName.trim() && directory.email.trim() ? "done" : "empty",
    self:
      form.legalNameAsPerId?.trim() && form.dob?.trim() && form.gender?.trim() && form.mobile?.trim()
        ? "done"
        : form.gender || form.mobile?.trim()
          ? "partial"
          : "empty",
    family: familyStatus,
    coverage: form.coverageLakh ? "done" : "empty",
    parents: "done",
    spouse: "done",
    children: "done",
  };

  const membersComplete =
    status.employee === "done" && status.coverage === "done" && status.self === "done" && status.family === "done";
  const canSubmit = membersComplete && !!form.coverageLakh;

  const warnings = [
    form.age && Number(form.age) > 65 && "Employee age exceeds typical coverage limit (65)",
    ...(deps.flatMap((d) => {
      if (!d.saved || !d.dob) return [];
      const a = Number(d.age);
      if ((d.relation === "child1" || d.relation === "child2") && a > 25) {
        return [`${familyDependentRelationLabel(d.relation)} age exceeds typical dependent limit (25)`];
      }
      return [];
    })),
  ].filter(Boolean);

  const urgency = getEnrollmentUrgency();

  const scrollToAnchor = useCallback((anchor) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (anchor === "coverage") next.add("coverage");
      if (anchor === "self") next.add("self");
      if (anchor === "family") next.add("family");
      return next;
    });
    if (anchor === "coverage") setPreviewFocusKey("coverage");
    else if (anchor === "family") setPreviewFocusKey("family");
    else if (anchor === "self") setPreviewFocusKey("self");
    else if (anchor === "premium") setPreviewFocusKey("coverage");
    const idMap = {
      coverage: "enroll-section-coverage",
      self: "enroll-section-self",
      family: "enroll-section-family",
      premium: "enroll-section-coverage",
      profile: "enroll-profile",
    };
    requestAnimationFrame(() =>
      document.getElementById(idMap[anchor] ?? `enroll-section-${anchor}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, []);

  const submitBlockedHint = !membersComplete
    ? "Complete coverage selection, Self Insurance, and family dependents (save or discard drafts) to continue."
    : !form.coverageLakh
      ? "Select a coverage amount in Step 1 to continue."
      : "";

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 px-3 pb-24 pt-4 sm:px-4 sm:pb-20 sm:pt-6 md:px-6">

      {/* Header */}
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Insurance Enrollment</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Fill in your details below — changes save automatically to{" "}
              <strong className="font-medium text-muted-foreground">this browser on this device</strong>.
            </p>
          </div>
          <DraftBadge state={draftState} savedAt={lastSavedAt} />
        </div>

        {/* Work profile ribbon — shown once family members are added */}
        {(form.familyDependents ?? []).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Work Profile</span>
            {[
              { label: directory.employeeId },
              { label: directory.fullName, bold: true },
              { label: directory.email },
              { label: directory.department },
              { label: directory.joiningDate },
            ].filter(item => item.label).map((item, i, arr) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-border text-xs" aria-hidden>·</span>
                <span className={`text-xs ${item.bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Resume banner */}
      {showBanner && (
        <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 size={14} className="flex-shrink-0 text-primary" />
            <p className="text-sm font-medium text-primary">Draft restored — pick up where you left off</p>
          </div>
          <button type="button" onClick={() => setShowBanner(false)} className="flex-shrink-0 self-end p-1 text-primary transition-colors hover:text-primary/80 sm:self-auto" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Deadline banner */}
      <div
        className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
          urgency.variant === "urgent" ? "bg-warning/10 border-warning/30" :
          urgency.variant === "soon" ? "bg-warning/5 border-warning/20" :
          urgency.variant === "muted" ? "bg-muted border-border" : "bg-muted/50 border-border"
        }`}
        role="region" aria-label="Enrollment deadline"
      >
        <div className="flex items-start gap-2 min-w-0">
          <Calendar size={13} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground">
              Enrollment closes <strong className="font-semibold">{DEADLINE.label}</strong>
              <span className="text-muted-foreground font-normal"> · {DEADLINE.cycle}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Window: {DEADLINE.cycleRange} (end of day, your local time)</p>
          </div>
        </div>
        <span className={`self-start text-[11px] font-bold px-2.5 py-1 rounded-full border sm:self-center tabular-nums ${
          urgency.variant === "urgent" ? "text-warning-foreground bg-warning/15 border-warning/30" :
          urgency.variant === "muted" ? "text-muted-foreground bg-muted border-border" :
          "text-foreground bg-card border-border"
        }`}>{urgency.text}</span>
      </div>

      {/* Compact deadline reminder — replaces the full warning block */}
        <details className="group rounded-2xl border border-warning/30 bg-warning/5">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 select-none">
            <AlertTriangle size={13} className="text-warning shrink-0" aria-hidden />
            <span className="flex-1 text-xs font-medium text-foreground">If you miss the deadline — individual-only coverage applies automatically</span>
            <ChevronDown size={13} className="text-muted-foreground transition-transform group-open:rotate-180 shrink-0" aria-hidden />
          </summary>
          <div className="px-4 pb-3 pt-0 text-xs text-muted-foreground leading-relaxed space-y-1 border-t border-warning/30">
            <p className="mt-2">After <strong className="text-foreground">May 15, 2026</strong>, if you haven't submitted, the company assigns you individual-only coverage and notifies you by email.</p>
            <ul className="space-y-0.5 ml-3 mt-1.5 list-disc list-outside">
              <li>Family members are <strong className="text-foreground">not included</strong> in the automatic plan</li>
              <li>Your cost is <strong className="text-foreground">₹0</strong> — the company pays for individual coverage</li>
              <li>You can update your coverage during the next enrollment cycle</li>
            </ul>
          </div>
        </details>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_min(32%,380px)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
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
            <EnrollSelfFields form={form} errors={errors} patch={patch} />
          </EnrollAccordionSection>

          {/* ② Family members */}
          <div id="enroll-section-family" className="scroll-mt-28 space-y-4">
            {(form.familyDependents ?? []).map((m) => (
              <FamilyDependentCard
                key={m.id}
                member={m}
                employeeGender={form.gender}
                onUpdate={(partial) => updateFamilyDependent(m.id, partial)}
                onSave={() => saveFamilyDependent(m.id)}
                onDiscard={() => removeFamilyDependent(m.id)}
                onEdit={() => editFamilyDependent(m.id)}
                onDelete={() => deleteFamilyDependent(m.id)}
              />
            ))}
            <AddFamilyMemberMenuButton form={form} onSelectRelation={addFamilyDependent} />
          </div>

          {/* ③ Coverage — floater sum insured + dynamic premium */}
          <EnrollCoverageSelectionPanel
            form={form}
            onCoverageLakhChange={setCoverageLakh}
            savedDependentCount={deps.filter((d) => d.saved).length}
          />

          {/* ④ Submit area (self + family + coverage above) */}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={13} className="text-warning" />
                <p className="text-xs font-semibold text-warning-foreground">Please review before submitting</p>
              </div>
              {warnings.map((w) => (
                <p key={w} className="text-xs text-warning ml-5">• {w}</p>
              ))}
            </div>
          )}

          {/* ⑤ Consent notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20">
            <Info size={13} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground leading-relaxed">
              By submitting, I confirm all information is accurate and consent to enrollment in the{" "}
              <strong>HealthFirst Plus Group Mediclaim Policy 2026</strong> under Aziron's corporate benefits program.
            </p>
          </div>

          {/* ⑥ Save as Draft + Submit */}
          <div className="space-y-2 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {["coverage", "self", "family"].map((k) => (
                    <div key={k} className={`h-1.5 w-6 rounded-full transition-colors ${status[k] === "done" ? "bg-success/80" : status[k] === "partial" ? "bg-warning/60" : "bg-border"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {["coverage", "self", "family"].filter((k) => status[k] === "done").length} of 3 sections complete
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveAsDraft}
                  className="h-11 px-5 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={openConfirmModal}
                  disabled={!canSubmit}
                  className={`h-11 px-8 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm ${
                    canSubmit
                      ? "bg-success hover:bg-success/90 text-white shadow-success/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/60 focus-visible:ring-offset-2"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                  }`}
                  aria-label={canSubmit ? "Review and confirm your enrollment" : "Complete all required sections to submit"}
                >
                  <CheckCircle2 size={15} />
                  {canSubmit ? "Review & Submit →" : "Submit Enrollment"}
                </button>
              </div>
            </div>
            {!canSubmit && (
              <p className="text-xs text-muted-foreground text-right">{submitBlockedHint}</p>
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
              previewFocusKey={previewFocusKey}
              canSubmit={canSubmit}
              warnings={warnings}
              compact={false}
              onNavigateToSection={scrollToAnchor}
            />
          </aside>
        )}
      </div>

      {/* Mobile summary sheet */}
      <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] rounded-t-2xl border-border p-0 gap-0 sm:max-h-[85vh]" showCloseButton>
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle>Live enrollment summary</SheetTitle>
          </SheetHeader>
          <div className="max-h-[calc(88vh-4.5rem)] overflow-y-auto overscroll-contain p-4">
            <EnrollmentLivePreview
              policy={POLICY}
              deadline={{ label: DEADLINE.label, cycle: DEADLINE.cycle }}
              form={form}
              status={status}
              previewFocusKey={previewFocusKey}
              canSubmit={canSubmit}
              warnings={warnings}
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
          className="lg:hidden fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/30 bg-foreground px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-foreground/25 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => setSummaryOpen(true)}
        >
          <PanelRightOpen size={16} aria-hidden />
          View live summary
        </button>
      )}

      {/* Submission confirmation modal */}
      <SubmitConfirmModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={submit}
        form={form}
      />

    </div>
  );
}

// ─── View: Skip confirmed ─────────────────────────────────────────────────────

function SkippedState({ firstName, onReturn }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <SkipForward size={28} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Enrollment skipped for now</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            No problem, {firstName}. You can return to this page anytime before <strong className="text-foreground">{DEADLINE.label}</strong> to complete your enrollment.
          </p>
        </div>
        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 text-left">
          <p className="text-xs text-warning-foreground font-semibold mb-1">Reminder</p>
          <p className="text-xs text-warning leading-relaxed">
            The enrollment window closes at the end of {DEADLINE.cycle} ({DEADLINE.cycleRange}). Missing this window means waiting until Cycle 2 (May 15–31).
          </p>
        </div>
        <button onClick={onReturn}
          className="flex items-center gap-2 h-10 px-6 rounded-2xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors mx-auto">
          Return to Enrollment <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── View: Success ────────────────────────────────────────────────────────────

function SuccessState({ firstName, enrollmentSummary, onNavigate }) {
  const REF_ID = "INS-2026-00847";
  const [copied, setCopied] = useState(false);

  // Derived summary data from submitted form
  const coverageLakh   = Number(enrollmentSummary?.coverageLakh) || 3;
  const deps           = (enrollmentSummary?.familyDependents ?? []).filter((d) => d.saved);
  const annualPremium  = computeFloaterAnnualPremiumINR(coverageLakh, deps.length);
  const sumInsured     = coverageSumInsuredDisplay(coverageLakh);
  const employeeName   = enrollmentSummary?.legalNameAsPerId || firstName || "You";
  const employeeDob    = enrollmentSummary?.dob   || enrollmentSummary?.dateOfBirth || "";
  const employeeGender = enrollmentSummary?.gender || "";

  /** All insured members: employee first, then saved dependents */
  const insuredMembers = [
    {
      id:       "self",
      name:     employeeName,
      relation: "Employee (Self)",
      dob:      employeeDob,
      gender:   employeeGender,
      isSelf:   true,
    },
    ...deps.map((d) => ({
      id:       d.id,
      name:     d.name || "—",
      relation: familyDependentRelationLabel(d.relation),
      dob:      d.dob || "",
      gender:   familyDependentEffectiveGender(d.relation, d.gender, employeeGender),
      isSelf:   false,
    })),
  ];

  /** Per-member premium breakdown using the 16% loading per extra member */
  const basePremium = annualPremium && insuredMembers.length
    ? computeFloaterAnnualPremiumINR(coverageLakh, 0)
    : null;
  const memberPremiums = insuredMembers.map((m, i) => {
    if (!basePremium) return null;
    if (i === 0) return basePremium;
    return Math.round(basePremium * 0.16);
  });

  const steps = [
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
      iconBg: "bg-success/100", iconColor: "text-white",
      label: "Submission deadline",
      date: DEADLINE.label, dateColor: "text-muted-foreground",
      desc: "Your form is locked in for Cycle 1",
      done: true,
    },
    {
      icon: <RefreshCw size={13} />,
      iconBg: "bg-success/10", iconColor: "text-success",
      label: "HR review",
      date: "May 15, 2026", dateColor: "text-muted-foreground",
      desc: "HR reviews all submissions after the window closes — nothing more needed from you",
      done: false,
    },
    {
      icon: <Mail size={13} />,
      iconBg: "bg-muted", iconColor: "text-muted-foreground",
      label: "Confirmation email",
      date: "You'll receive an email once the policy provider approves your enrollment.",
      dateColor: "text-muted-foreground font-medium",
      desc: "Work inbox — check spam.",
      done: false,
    },
    {
      icon: <Heart size={13} />,
      iconBg: "bg-muted", iconColor: "text-muted-foreground",
      label: "Coverage activates",
      date: "June 1, 2026", dateColor: "text-success font-semibold",
      desc: "Policy goes live after Finance sign-off — you'll receive your policy card",
      done: false,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-muted">
      <div className="max-w-xl mx-auto px-4 py-10 space-y-3">

        {/* Card 1 — confirmation */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 pt-8 pb-7 text-center">

            {/* Icon */}
            <div className="size-14 rounded-full bg-success/100 flex items-center justify-center mx-auto mb-5 shadow-md shadow-success/20" role="img" aria-label="Enrollment confirmed">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              You're enrolled,{" "}
              <span className="text-success">{firstName}.</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Coverage starts <strong className="text-foreground">June 1, 2026</strong>
            </p>

            {/* Key facts grid */}
            <div className="mt-5 w-full rounded-xl border border-border overflow-hidden text-left">
              {[
                { label: "Plan",     value: "HealthFirst Plus Mediclaim" },
                { label: "Coverage", value: `${deps.length > 0 ? "Family" : "Individual"} · ${sumInsured}` },
                { label: "Your cost", value: annualPremium != null ? `${formatEnrollmentPremiumInr(annualPremium)}/yr` : "—" },
              ].map(({ label, value }, i) => (
                <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
                <span className="text-xs text-muted-foreground">Ref ID</span>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(REF_ID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                  title="Click to copy"
                >
                  {REF_ID}
                  {copied
                    ? <CheckCircle2 size={11} className="text-success" />
                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* What's next — timeline with descriptions */}
          <div className="border-t border-border px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-5">What's next</p>
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[11px] top-6 bottom-6 w-px bg-border" aria-hidden />
              <div className="space-y-5">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-3.5">
                    <div className={`relative z-10 size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.iconBg} ${s.iconColor}`}>
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-semibold leading-tight ${s.done ? "text-success" : "text-foreground"}`}>{s.label}</span>
                        <span className={`text-xs shrink-0 mt-0.5 max-w-[58%] text-right leading-snug ${s.dateColor}`}>{s.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={() => onNavigate?.("new-chat")}
            className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-xl text-sm font-semibold text-white bg-foreground hover:opacity-90 transition-opacity shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2"
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
  const [enrollmentSummary, setEnrollmentSummary] = useState(null);

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-muted">
      <Sidebar activePage="employee-insurance" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border" />
            <span className="text-sm text-muted-foreground">Platform</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">Employee Insurance</span>
            {view === "enroll" && (
              <>
                <ChevronRight size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">Enrollment Form</span>
              </>
            )}
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {view === "landing" && (
            <ConfirmationView
              firstName={firstName}
              onProceed={() => setView("enroll")}
            />
          )}
          {view === "skip-confirm" && (
            <SkipView firstName={firstName} onBack={() => setView("landing")} onConfirmSkip={() => setView("skipped")} />
          )}
          {view === "enroll" && (
            <EnrollView
              auth={auth}
              onSuccess={(formData) => { setEnrollmentSummary(formData); setView("success"); }}
            />
          )}
          {view === "skipped"  && <SkippedState firstName={firstName} onReturn={() => setView("landing")} />}
          {view === "success"  && <SuccessState firstName={firstName} enrollmentSummary={enrollmentSummary} onNavigate={onNavigate} />}
        </div>
      </div>
    </div>
  );
}
