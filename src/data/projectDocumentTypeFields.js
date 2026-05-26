import { METADATA_SECTIONS, PROJECT_FIELD_LABELS } from "@/data/projectMetadataSchema";

/** Always shown when reviewing an uploaded document. */
const REVIEW_SOURCE_KEYS = ["doc_type", "source_filename", "extraction_date", "extraction_confidence"];

/**
 * Field keys to show in the upload review form per document type.
 * @type {Record<string, string[]>}
 */
export const DOCUMENT_TYPE_FIELD_KEYS = {
  PO: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "po_number",
    "currency",
    "total_contract_value",
    "track_budget_allocation",
    "billing_rate_type",
    "billing_rate_value",
    "payment_terms",
    "sow_start_date",
    "sow_end_date",
    "cust_finance_contact_name",
    "cust_finance_contact_email",
  ],
  MSA: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "aziro_dept",
    "aziro_legal_entity",
    "contract_status",
    "msa_ref",
    "msa_term_type",
    "msa_expiry_date",
    "governing_law",
    "ip_ownership",
    "liability_cap",
    "termination_notice_period",
    "auto_renewal",
    "confidentiality_period",
    "renewal_followup_notes",
  ],
  SOW: [
    ...REVIEW_SOURCE_KEYS,
    "track_name",
    "track_description",
    "engagement_type",
    "scope_summary",
    "tech_stack",
    "key_deliverables",
    "out_of_scope_items",
    "acceptance_criteria",
    "milestones",
    "sow_id",
    "sow_version",
    "sow_start_date",
    "sow_end_date",
    "track_start_date",
    "track_end_date",
    "planned_headcount",
    "team_roles",
    "aziro_delivery_lead",
    "aziro_tech_lead",
    "total_contract_value",
    "currency",
    "sla_commitments",
  ],
  Proposal: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "track_name",
    "engagement_type",
    "scope_summary",
    "tech_stack",
    "key_deliverables",
    "milestones",
    "total_contract_value",
    "currency",
    "planned_headcount",
    "sow_start_date",
    "sow_end_date",
  ],
  Quotation: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "currency",
    "total_contract_value",
    "track_budget_allocation",
    "billing_rate_type",
    "billing_rate_value",
    "payment_terms",
    "engagement_type",
  ],
  Contract: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "aziro_legal_entity",
    "contract_status",
    "engagement_type",
    "scope_summary",
    "msa_ref",
    "sow_id",
    "sow_version",
    "sow_start_date",
    "sow_end_date",
    "total_contract_value",
    "currency",
    "payment_terms",
    "governing_law",
    "ip_ownership",
    "auto_renewal",
    "termination_notice_period",
  ],
  RateCard: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "currency",
    "billing_rate_type",
    "billing_rate_value",
    "planned_headcount",
    "team_roles",
    "aziro_delivery_lead",
  ],
  CR: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "track_name",
    "engagement_type",
    "scope_summary",
    "sow_version",
    "sow_end_date",
    "total_contract_value",
    "po_number",
    "track_budget_allocation",
    "key_deliverables",
    "milestones",
  ],
  NDA: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "contract_status",
    "scope_summary",
    "confidentiality_period",
    "governing_law",
    "termination_notice_period",
  ],
  SLA: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "msa_ref",
    "sow_id",
    "sla_commitments",
    "cust_engagement_owner_name",
    "cust_engagement_owner_email",
  ],
  Renewal: [
    ...REVIEW_SOURCE_KEYS,
    "customer_name",
    "contract_status",
    "msa_ref",
    "msa_expiry_date",
    "sow_end_date",
    "auto_renewal",
    "renewal_followup_notes",
    "termination_notice_period",
    "total_contract_value",
  ],
};

/** Keys returned from mock extraction for a document type (subset used to widen the form). */
export function keysFromExtractionResult(extracted) {
  if (!extracted || typeof extracted !== "object") return [];
  return Object.entries(extracted)
    .filter(([key, field]) => {
      if (!PROJECT_FIELD_LABELS[key]) return false;
      if (["extraction_date", "extraction_confidence", "source_filename", "doc_type"].includes(key)) {
        return false;
      }
      return String(field?.value ?? "").trim().length > 0;
    })
    .map(([key]) => key);
}

/**
 * Final field keys for the upload review form.
 * @param {string} documentType
 * @param {string[]} [extractedKeys]
 */
export function getReviewFieldKeys(documentType, extractedKeys = []) {
  const base = DOCUMENT_TYPE_FIELD_KEYS[documentType] ?? DOCUMENT_TYPE_FIELD_KEYS.MSA;
  const merged = new Set(base);
  for (const key of extractedKeys) {
    if (PROJECT_FIELD_LABELS[key]) merged.add(key);
  }
  return [...merged];
}

/**
 * Metadata sections filtered to review field keys only.
 * @param {string[]} fieldKeys
 */
export function getMetadataSectionsForFieldKeys(fieldKeys) {
  const allowed = new Set(fieldKeys);
  return METADATA_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.filter((field) => allowed.has(field.key)),
  })).filter((section) => section.fields.length > 0);
}
