import {
  createEmptyMetadataValues,
  normalizeMetadataFormValues,
  projectToMetadataValues,
} from "@/data/projectMetadataSchema";

export function isoToDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return String(iso).slice(0, 10);
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Core fields for ProjectQuickForm — create or manual edit. */
export function quickFormValuesFromProject(project) {
  if (!project) {
    return {
      track_name: "",
      customer_name: "",
      engagement_type: "",
      sow_start_date: "",
      sow_end_date: "",
      aziro_delivery_lead: "",
      priority: "",
    };
  }

  const meta = projectToMetadataValues(project);
  return {
    track_name: meta.track_name ?? "",
    customer_name: meta.customer_name ?? "",
    engagement_type: meta.engagement_type ?? "",
    sow_start_date: isoToDateInput(meta.sow_start_date),
    sow_end_date: isoToDateInput(meta.sow_end_date),
    aziro_delivery_lead: meta.aziro_delivery_lead ?? project.projectManager ?? "",
    priority: project.priority ?? "",
  };
}

/**
 * Expand quick-create fields into a full metadata record (all schema keys present).
 * @param {Record<string, string>} quickValues
 */
export function quickFormValuesToMetadata(quickValues) {
  return normalizeMetadataFormValues({
    ...createEmptyMetadataValues(),
    track_name: quickValues.track_name?.trim() ?? "",
    customer_name: quickValues.customer_name?.trim() ?? "",
    engagement_type: quickValues.engagement_type ?? "",
    sow_start_date: quickValues.sow_start_date ?? "",
    sow_end_date: quickValues.sow_end_date ?? "",
    aziro_delivery_lead: quickValues.aziro_delivery_lead?.trim() ?? "",
  });
}
