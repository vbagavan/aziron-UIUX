import { useProjectsStore, getAllProjects } from "@/store/projectsStore";

/** @deprecated Use useProjectsStore — kept for helpers used by list/detail views. */
export function getProjectById(id) {
  return useProjectsStore.getState().getProjectById(id);
}

export function formatProjectCode(code) {
  if (code === null || code === undefined || code === "" || code === "—") return "—";
  return code;
}

/** Human-readable timestamp for metadata headers and date fields. */
export function formatMetadataTimestamp(iso) {
  if (iso === null || iso === undefined || iso === "") return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export function formatDisplayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** Status on project summary — empty reads as intentional, not broken. */
export function formatProjectStatus(status) {
  if (status === null || status === undefined || status === "" || status === "—") {
    return "Not set";
  }
  return String(status);
}

export function formatGstApplies(gstApplies) {
  return gstApplies ? "Yes" : "No";
}

export function filterProjects(projects, query) {
  const q = query.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      formatProjectCode(p.code).toLowerCase().includes(q) ||
      p.customer.toLowerCase().includes(q) ||
      p.billingType.toLowerCase().includes(q),
  );
}

export function listAllProjects() {
  return getAllProjects();
}
