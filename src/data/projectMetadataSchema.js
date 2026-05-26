/**
 * Core Metadata Schema — Eight platform project / track contract metadata.
 * Field keys match the canonical schema (snake_case).
 */

import { formatMetadataTimestamp } from "@/data/projectsData";

export const ENGAGEMENT_TYPES = [
  "Fixed Cost",
  "T&M",
  "Time & Materials",
  "Managed Services",
  "Milestone",
  "Retainer",
];

export const CONTRACT_STATUSES = ["Draft", "Active", "Expired", "Renewed", "Terminated"];

export const MSA_TERM_TYPES = ["Fixed-term", "Auto-renewable", "Evergreen", "Per-SOW"];

export const BILLING_RATE_TYPES = ["Hourly", "Monthly", "Fixed", "Milestone-based"];

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "SGD"];

/** @typedef {'text' | 'textarea' | 'select' | 'boolean' | 'date' | 'readonly'} MetadataFieldType */

/**
 * @typedef {Object} MetadataFieldDef
 * @property {string} key
 * @property {string} label
 * @property {string} [description]
 * @property {boolean} [required]
 * @property {MetadataFieldType} [type]
 * @property {boolean} [multiline]
 * @property {boolean} [readonly]
 * @property {string[]} [options] select options (id = value)
 */

/**
 * @typedef {Object} MetadataSectionDef
 * @property {string} id
 * @property {string} title
 * @property {MetadataFieldDef[]} fields
 */

export const METADATA_SECTIONS = [
  {
    id: "project_track",
    title: "1. Project & Track Information",
    fields: [
      { key: "project_id", label: "Project ID", description: "Unique identifier for the project" },
      { key: "track_id", label: "Track ID", description: "Unique identifier for the delivery track/workstream" },
      { key: "track_name", label: "Track Name", description: "Name of the track or engagement stream", required: true },
      { key: "track_description", label: "Track Description", type: "textarea", multiline: true },
      {
        key: "engagement_type",
        label: "Engagement Type",
        type: "select",
        options: ENGAGEMENT_TYPES,
        required: true,
      },
      { key: "scope_summary", label: "Scope Summary", type: "textarea", multiline: true },
      { key: "tech_stack", label: "Tech Stack", type: "textarea", multiline: true },
      { key: "key_deliverables", label: "Key Deliverables", type: "textarea", multiline: true },
      { key: "out_of_scope_items", label: "Out of Scope Items", type: "textarea", multiline: true },
      { key: "acceptance_criteria", label: "Acceptance Criteria", type: "textarea", multiline: true },
      { key: "milestones", label: "Milestones", type: "textarea", multiline: true },
    ],
  },
  {
    id: "customer_org",
    title: "2. Customer & Organization Information",
    fields: [
      { key: "customer_name", label: "Customer Name", required: true },
      { key: "aziro_dept", label: "Aziro Department" },
      { key: "aziro_legal_entity", label: "Aziro Legal Entity" },
      {
        key: "contract_status",
        label: "Contract Status",
        type: "select",
        options: CONTRACT_STATUSES,
      },
    ],
  },
  {
    id: "contract_legal",
    title: "3. Contract & Legal Information",
    fields: [
      { key: "doc_type", label: "Document Type", type: "select", options: ["NDA", "PO", "MSA", "SOW"] },
      { key: "source_filename", label: "Source Filename", readonly: true },
      { key: "msa_ref", label: "MSA Reference" },
      { key: "sow_id", label: "SOW ID" },
      { key: "sow_version", label: "SOW Version" },
      { key: "msa_term_type", label: "MSA Term Type", type: "select", options: MSA_TERM_TYPES },
      { key: "msa_expiry_date", label: "MSA Expiry Date", type: "date" },
      { key: "governing_law", label: "Governing Law" },
      { key: "ip_ownership", label: "IP Ownership" },
      { key: "liability_cap", label: "Liability Cap" },
      { key: "termination_notice_period", label: "Termination Notice Period" },
      { key: "auto_renewal", label: "Auto Renewal", type: "boolean" },
      { key: "confidentiality_period", label: "Confidentiality Period" },
      { key: "sla_commitments", label: "SLA Commitments", type: "textarea", multiline: true },
    ],
  },
  {
    id: "financial",
    title: "4. Financial & Commercial Information",
    fields: [
      { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
      { key: "total_contract_value", label: "Total Contract Value" },
      { key: "track_budget_allocation", label: "Track Budget Allocation" },
      { key: "billing_rate_type", label: "Billing Rate Type", type: "select", options: BILLING_RATE_TYPES },
      { key: "billing_rate_value", label: "Billing Rate Value" },
      { key: "po_number", label: "PO Number" },
      { key: "payment_terms", label: "Payment Terms" },
    ],
  },
  {
    id: "timeline",
    title: "5. Timeline & Duration Information",
    fields: [
      { key: "sow_start_date", label: "SOW Start Date", type: "date", required: true },
      { key: "sow_end_date", label: "SOW End Date", type: "date", required: true },
      { key: "track_start_date", label: "Track Start Date", type: "date" },
      { key: "track_end_date", label: "Track End Date", type: "date" },
    ],
  },
  {
    id: "delivery",
    title: "6. Delivery & Resource Information",
    fields: [
      { key: "planned_headcount", label: "Planned Headcount" },
      { key: "current_headcount", label: "Current Headcount" },
      { key: "team_roles", label: "Team Roles", type: "textarea", multiline: true },
      { key: "aziro_delivery_lead", label: "Aziro Delivery Lead" },
      { key: "aziro_tech_lead", label: "Aziro Technical Lead" },
      { key: "aziro_account_manager", label: "Aziro Account Manager" },
    ],
  },
  {
    id: "customer_stakeholders",
    title: "7. Customer Stakeholder Information",
    fields: [
      { key: "cust_executive_sponsor_name", label: "Executive Sponsor Name" },
      { key: "cust_executive_sponsor_email", label: "Executive Sponsor Email" },
      { key: "cust_engagement_owner_name", label: "Engagement Owner Name" },
      { key: "cust_engagement_owner_email", label: "Engagement Owner Email" },
      { key: "cust_tech_lead_name", label: "Customer Technical Lead Name" },
      { key: "cust_tech_lead_email", label: "Customer Technical Lead Email" },
      { key: "cust_finance_contact_name", label: "Finance SPOC Name" },
      { key: "cust_finance_contact_email", label: "Finance SPOC Email" },
      { key: "cust_spoc_for_track_name", label: "Track SPOC Name" },
      { key: "cust_spoc_for_track_email", label: "Track SPOC Email" },
    ],
  },
  {
    id: "internal_ref",
    title: "8. Internal Reference Information",
    fields: [
      { key: "gsd_ref", label: "GSD Reference" },
      { key: "sbd_ref", label: "SBD Reference" },
      { key: "renewal_followup_notes", label: "Renewal Follow-up Notes", type: "textarea", multiline: true },
      { key: "aziro_pmo_contact", label: "Aziro PMO Contact" },
    ],
  },
  {
    id: "ai_extraction",
    title: "9. AI Extraction Metadata",
    fields: [
      { key: "extraction_date", label: "Extraction Date", readonly: true },
      { key: "extraction_confidence", label: "Extraction Confidence", readonly: true },
      { key: "raw_emails_found", label: "Raw Emails Found", type: "textarea", multiline: true, readonly: true },
      { key: "raw_names_found", label: "Raw Names Found", type: "textarea", multiline: true, readonly: true },
    ],
  },
];

export const ALL_METADATA_FIELDS = METADATA_SECTIONS.flatMap((s) => s.fields);

export const PROJECT_FIELD_LABELS = Object.fromEntries(
  ALL_METADATA_FIELDS.map((f) => [f.key, f.label]),
);

export function createEmptyMetadataValues() {
  /** @type {Record<string, string>} */
  const values = {};
  for (const field of ALL_METADATA_FIELDS) {
    if (field.type === "boolean") values[field.key] = "false";
    else values[field.key] = "";
  }
  return values;
}

/**
 * Freshness signals for the Project details tab summary bar.
 * @param {object | null} project
 * @param {Array<{ projectId: string, timestamp: string, userName?: string, summary?: string }>} [timelineEntries]
 */
export function getProjectMetadataFreshness(project, timelineEntries = []) {
  if (!project) {
    return {
      version: 1,
      lastUpdatedAt: null,
      lastUpdatedBy: null,
      extractionDate: null,
      extractionConfidence: null,
    };
  }

  const latest = timelineEntries
    .filter((e) => e.projectId === project.id)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];

  const meta = project.metadata ?? {};

  return {
    version: project.version ?? 1,
    lastUpdatedAt: latest?.timestamp ?? meta.extraction_date ?? null,
    lastUpdatedBy: latest?.userName ?? null,
    extractionDate: meta.extraction_date ?? null,
    extractionConfidence: meta.extraction_confidence ?? null,
  };
}

/** Format a metadata field for read-only display. */
export function formatMetadataFieldValue(field, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "boolean") return value === "true" ? "Yes" : "No";
  if (field.type === "date" || field.key === "extraction_date") {
    return formatMetadataTimestamp(value);
  }
  return String(value);
}

/** Map stored project → flat metadata form values. */
export function projectToMetadataValues(project) {
  if (!project) return createEmptyMetadataValues();
  const base = createEmptyMetadataValues();
  const meta = project.metadata ?? {};
  const merged = { ...base, ...meta };

  if (!merged.track_name && project.name) merged.track_name = project.name;
  if (!merged.customer_name && project.customer) merged.customer_name = project.customer;
  if (!merged.engagement_type && project.billingType) merged.engagement_type = project.billingType;
  if (!merged.sow_start_date && project.startDate) merged.sow_start_date = project.startDate;
  if (!merged.sow_end_date && project.endDate) merged.sow_end_date = project.endDate;
  if (!merged.po_number && project.poNumber) merged.po_number = project.poNumber;
  if (!merged.total_contract_value && project.contractValue) merged.total_contract_value = project.contractValue;
  if (!merged.sow_id && project.code) merged.sow_id = project.code;
  if (!merged.scope_summary && project.scopeDetails) merged.scope_summary = project.scopeDetails;
  if (!merged.planned_headcount && project.resourceCount != null) {
    merged.planned_headcount = String(project.resourceCount);
  }
  if (!merged.renewal_followup_notes && project.renewalTerms) {
    merged.renewal_followup_notes = project.renewalTerms;
  }
  if (!merged.aziro_delivery_lead && project.projectManager) {
    merged.aziro_delivery_lead = project.projectManager;
  }
  if (!merged.project_id && project.id) merged.project_id = project.id;

  return merged;
}

/** Sync list-view / legacy top-level fields from canonical metadata. */
export function metadataToLegacyProjectFields(metadata, existing = null) {
  const autoRenewal = metadata.auto_renewal === "true";
  return {
    name: metadata.track_name?.trim() || "Untitled Project",
    customer: metadata.customer_name?.trim() || "—",
    customerId: existing?.customerId ?? slugify(metadata.customer_name),
    billingType: metadata.engagement_type || "Fixed Cost",
    code: metadata.sow_id?.trim() || metadata.track_id?.trim() || null,
    startDate: metadata.sow_start_date || metadata.track_start_date || null,
    endDate: metadata.sow_end_date || metadata.track_end_date || null,
    poNumber: metadata.po_number?.trim() || null,
    contractValue: metadata.total_contract_value?.trim() || null,
    scopeDetails: metadata.scope_summary?.trim() || null,
    resourceCount: metadata.planned_headcount ? parseInt(metadata.planned_headcount, 10) : null,
    renewalTerms: metadata.renewal_followup_notes?.trim() || null,
    projectManager: metadata.aziro_delivery_lead?.trim() || null,
    priority: existing?.priority ?? null,
    gstApplies: existing?.gstApplies ?? false,
    gst: existing?.gstApplies ? "18%" : "—",
    status: existing?.status ?? metadata.contract_status?.toLowerCase() ?? "active",
    creditPeriodDays: parsePaymentTermsDays(metadata.payment_terms) || existing?.creditPeriodDays || 30,
    autoRenewal,
  };
}

function slugify(name) {
  return (name || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePaymentTermsDays(terms) {
  if (!terms) return null;
  const m = terms.match(/net\s*(\d+)/i) || terms.match(/(\d+)\s*days/i);
  return m ? parseInt(m[1], 10) : null;
}

/** Split form payload into canonical metadata + optional priority (not in schema). */
export function splitMetadataFormPayload(formValues) {
  const { priority, ...fields } = formValues ?? {};
  const metadata = normalizeMetadataFormValues({
    ...createEmptyMetadataValues(),
    ...fields,
  });
  return { metadata, priority };
}

/** Normalize date fields to ISO strings for storage. */
export function normalizeMetadataFormValues(values) {
  const out = { ...values };
  for (const field of ALL_METADATA_FIELDS) {
    if (field.type !== "date" || field.readonly) continue;
    const raw = out[field.key];
    if (!raw || typeof raw !== "string") continue;
    if (raw.includes("T")) continue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      out[field.key] = `${raw}T00:00:00Z`;
    }
  }
  return out;
}

/**
 * @param {Record<string, string>} values
 * @param {{ fieldKeys?: string[] }} [options] — limit validation to fields shown in document review
 */
export function validateMetadataForm(values, options = {}) {
  const { fieldKeys } = options;
  const inScope = (key) => !fieldKeys?.length || fieldKeys.includes(key);

  const errors = [];
  const warnings = [];

  if (inScope("track_name") && !values.track_name?.trim()) errors.push("Track Name is required.");
  if (inScope("customer_name") && !values.customer_name?.trim()) {
    errors.push("Customer Name is required.");
  }
  if (inScope("engagement_type") && !values.engagement_type?.trim()) {
    errors.push("Engagement Type is required.");
  }
  if (inScope("sow_start_date") && !values.sow_start_date?.trim()) {
    errors.push("SOW Start Date is required.");
  }
  if (inScope("sow_end_date") && !values.sow_end_date?.trim()) {
    errors.push("SOW End Date is required.");
  }

  if (inScope("sow_start_date") && inScope("sow_end_date")) {
    const start = Date.parse(values.sow_start_date);
    const end = Date.parse(values.sow_end_date);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      warnings.push("SOW end date is before the start date.");
    }
  }

  if (
    inScope("po_number") &&
    inScope("engagement_type") &&
    !values.po_number?.trim() &&
    values.engagement_type === "Fixed Cost"
  ) {
    warnings.push("PO Number was not extracted — verify before submitting a fixed-cost engagement.");
  }

  if (inScope("total_contract_value") && !values.total_contract_value?.trim()) {
    warnings.push("Total Contract Value is missing — add manually if applicable.");
  }

  if (inScope("extraction_confidence") && values.extraction_confidence) {
    const pct = parseInt(String(values.extraction_confidence).replace(/\D/g, ""), 10);
    if (!Number.isNaN(pct) && pct < 70) {
      warnings.push(`Overall extraction confidence is ${values.extraction_confidence} — review low-confidence fields.`);
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
}
