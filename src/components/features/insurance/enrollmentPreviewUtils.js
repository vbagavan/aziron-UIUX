/** Pure helpers for enrollment live preview (kept out of the component module for react-refresh). */

import {
  loadPremiumMatrixFromStorage,
  lookupPremiumFromMatrix,
} from "@/lib/premiumMatrix";

/** Floater sum-insured choices (₹N × 1,00,000) — step 1 of enrollment. */
export const ENROLLMENT_COVERAGE_LAKH_VALUES = [1, 2, 3, 4, 5, 7, 8, 10];

export const ENROLLMENT_COVERAGE_LAKH_OPTIONS = ENROLLMENT_COVERAGE_LAKH_VALUES.map((n) => ({
  value: n,
  label: `${n} ${n === 1 ? "Lakh" : "Lakhs"}`,
}));

const COVERAGE_BASE_PREMIUM_INR = {
  1: 520,
  2: 680,
  3: 860,
  4: 1040,
  5: 1280,
  7: 1760,
  8: 2020,
  10: 2480,
};

/** Human-readable sum insured for a lakh amount (floater). */
export function coverageSumInsuredDisplay(lakh) {
  const n = Number(lakh);
  if (!n || Number.isNaN(n)) return "";
  return `₹${(n * 100000).toLocaleString("en-IN")}`;
}

/** Corporate payroll band used for tier copy / HR alignment. */
export function premiumTierIdForCoverageLakh(lakh) {
  const n = Number(lakh);
  if (!n || Number.isNaN(n)) return "";
  if (n <= 3) return "essential";
  if (n <= 5) return "plus";
  return "premier";
}

/**
 * Annual premium (₹) for employee + saved dependents on one floater.
 * Uses the saved insurance premium matrix when employee age is known; otherwise legacy ladder.
 */
export function computeFloaterAnnualPremiumINR(coverageLakh, savedDependentCount, employeeAge) {
  const n = Number(coverageLakh);
  if (!n || Number.isNaN(n)) return null;

  let base = null;
  const ageN = Number(employeeAge);
  if (!Number.isNaN(ageN)) {
    const matrix = loadPremiumMatrixFromStorage();
    if (matrix) base = lookupPremiumFromMatrix(matrix, ageN, n);
  }
  if (base == null) {
    base = COVERAGE_BASE_PREMIUM_INR[n];
    if (base == null) return null;
  }

  const deps = Math.max(0, Number(savedDependentCount) || 0);
  const members = 1 + deps;
  const factor = 1 + (members - 1) * 0.16;
  return Math.round(base * factor);
}

export function formatEnrollmentPremiumInr(amount) {
  if (amount == null || Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FAMILY_DEPENDENT_RELATION_LABELS = {
  father: "Father",
  mother: "Mother",
  spouse: "Spouse",
  child1: "Child 1",
  child2: "Child 2",
};

export const FAMILY_DEPENDENT_RELATION_OPTIONS = Object.entries(FAMILY_DEPENDENT_RELATION_LABELS).map(([id, label]) => ({
  id,
  label,
}));

export function familyDependentRelationLabel(id) {
  return FAMILY_DEPENDENT_RELATION_LABELS[id] ?? id;
}

/**
 * Values align with enrollment gender selects ("Male", "Female", "Other").
 * Spouse: opposite of employee when self is Male or Female; otherwise no implied value (user selects).
 */
export function familyDependentImpliedGender(relation, employeeGender) {
  const eg = String(employeeGender ?? "").trim();
  if (relation === "father") return "Male";
  if (relation === "mother") return "Female";
  if (relation === "spouse") {
    if (eg === "Male") return "Female";
    if (eg === "Female") return "Male";
    return null;
  }
  return null;
}

/** For validation / display: implied from relationship + profile when applicable; else stored value. */
export function familyDependentEffectiveGender(relation, gender, employeeGender) {
  const implied = familyDependentImpliedGender(relation, employeeGender);
  if (implied) return implied;
  return String(gender ?? "").trim();
}

export function computeEnrollmentPercent(status, form) {
  let p = 0;
  if (status.employee === "done") p += 14;
  if (status.coverage === "done") p += 30;
  if (status.self === "done") p += 28;
  else if (status.self === "partial") p += 14;
  if (status.family === "done") p += 28;
  else if (status.family === "partial") p += 14;
  return Math.min(100, Math.round(p));
}

export function currentSectionTitle(previewFocusKey) {
  const map = {
    profile: "Work profile",
    employee: "Employee Information",
    coverage: "Coverage selection",
    self: "Self Insurance",
    family: "Family members",
    premium: "Coverage & premium",
    parents: "Parents",
    spouse: "Spouse",
    children: "Children",
    review: "Review",
  };
  return map[previewFocusKey] ?? "Enrollment";
}

export function remainingSectionsSummary(status) {
  const need = [];
  if (status.coverage !== "done") need.push("Coverage");
  if (status.self !== "done") need.push("Self insurance");
  if (status.family !== "done") need.push("Family members");
  if (need.length === 0) return "All required sections complete";
  return `${need.length} required: ${need.join(", ")}`;
}

/** Relative “saved … ago” for draft timestamps (enrollment UI). */
export function formatEnrollmentSavedRelative(ts) {
  if (!ts) return "";
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

/**
 * Readiness lines for the live preview. `anchor` is used for click-to-fix navigation (scroll + focus).
 * Anchors: profile | self | family | review
 */
export function buildReadinessLines(status, form, canSubmit, warnings) {
  const lines = [];
  if (canSubmit) lines.push({ tone: "ok", text: "Required fields completed", anchor: "review" });
  if (status.coverage !== "done") {
    lines.push({
      tone: "warn",
      text: "Select your floater coverage amount (applies to you and dependents on this enrollment)",
      anchor: "coverage",
    });
  }
  if (status.self !== "done") {
    lines.push({
      tone: "warn",
      text: "Self insurance incomplete (confirm gender & mobile — name & DOB come from records)",
      anchor: "self",
    });
  }
  if (status.family !== "done") {
    const deps = form.familyDependents ?? [];
    if (deps.some((d) => !d.saved)) {
      lines.push({
        tone: "warn",
        text: "Save or discard in-progress family member cards before submitting",
        anchor: "family",
      });
    } else if (
      deps.some(
        (d) =>
          d.saved &&
          (!d.name?.trim() || !d.dob || !familyDependentEffectiveGender(d.relation, d.gender, form.gender)),
      )
    ) {
      lines.push({ tone: "warn", text: "Complete each saved family member's details", anchor: "family" });
    }
  }
  warnings.slice(0, 2).forEach((w) => lines.push({ tone: "warn", text: w, anchor: "review" }));
  if (lines.length === 0) lines.push({ tone: "ok", text: "Ready for review", anchor: "review" });
  return lines.slice(0, 6);
}
