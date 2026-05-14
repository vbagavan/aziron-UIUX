/** Pure helpers for enrollment live preview (kept out of the component module for react-refresh). */

export function computeEnrollmentPercent(status, form) {
  let p = 0;
  if (status.employee === "done") p += 18;
  if (status.self === "done") p += 34;
  else if (status.self === "partial") p += 17;
  if (status.spouse === "done") p += 34;
  else if (form.isMarried !== null) p += 12;
  if (!form.includeParents) p += 6;
  else if (form.mother.firstName && form.father.firstName) p += 6;
  else p += 3;
  p += Math.min(8, form.children.filter((c) => c.fullName?.trim()).length * 4);
  return Math.min(100, Math.round(p));
}

export function currentSectionTitle(previewFocusKey) {
  const map = {
    profile: "Work profile",
    employee: "Employee Information",
    self: "Self Insurance",
    family: "Family members",
    premium: "Premium selection",
    parents: "Parents",
    spouse: "Spouse",
    children: "Children",
    review: "Review",
  };
  return map[previewFocusKey] ?? "Enrollment";
}

export function remainingSectionsSummary(status) {
  const need = [];
  if (status.self !== "done") need.push("Self insurance");
  if (status.spouse !== "done") need.push("Spouse");
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
  if (status.self !== "done") {
    lines.push({ tone: "warn", text: "Self insurance incomplete (DOB & gender)", anchor: "self" });
  }
  if (form.isMarried === null) {
    lines.push({ tone: "warn", text: "Marital status not answered", anchor: "family" });
  }
  if (form.isMarried === true && (!form.spouse.fullName?.trim() || !form.spouse.dob)) {
    lines.push({ tone: "warn", text: "Spouse details incomplete", anchor: "family" });
  }
  if (form.includeParents && (!form.mother.dob || !form.father.dob)) {
    lines.push({ tone: "warn", text: "Parent DOB incomplete", anchor: "family" });
  }
  warnings.slice(0, 2).forEach((w) => lines.push({ tone: "warn", text: w, anchor: "review" }));
  if (lines.length === 0) lines.push({ tone: "ok", text: "Ready for review", anchor: "review" });
  return lines.slice(0, 6);
}
