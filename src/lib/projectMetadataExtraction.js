import {
  getReviewFieldKeys,
  keysFromExtractionResult,
} from "@/data/projectDocumentTypeFields";
import {
  createEmptyMetadataValues,
  PROJECT_FIELD_LABELS,
} from "@/data/projectMetadataSchema";
import { detectDocumentType } from "@/lib/projectFileStorage";

/**
 * Simulates async document parsing. In production this would call an OCR / LLM service.
 * @param {Array<{ documentType: string, fileName: string }>} uploads
 * @param {Record<string, string>} [seed]
 */
/** Extract metadata from a single uploaded file. */
export async function extractMetadataFromSingleDocument(upload, seed = {}) {
  return extractMetadataFromDocuments(
    [{ documentType: upload.documentType, fileName: upload.fileName }],
    seed,
  );
}

export async function extractMetadataFromDocuments(uploads, seed = {}) {
  await delay(1400 + Math.random() * 600);

  const primary = uploads[0];
  const fileName = primary?.fileName ?? "contract.pdf";
  // Use declared type; fall back to filename-based auto-detection
  const type =
    primary?.documentType ||
    detectDocumentType(fileName) ||
    "MSA";
  const fileStem = fileName.replace(/\.[^.]+$/, "");

  const mockByType = {
    NDA: buildNdaExtraction(seed, fileStem),
    PO: buildPoExtraction(seed, fileStem),
    MSA: buildMsaExtraction(seed, fileStem),
    SOW: buildSowExtraction(seed, fileStem),
    CR: buildAmendmentExtraction(seed, fileStem),
    Amendment: buildAmendmentExtraction(seed, fileStem),
    Proposal: buildSowExtraction(seed, fileStem),
    Quotation: buildPoExtraction(seed, fileStem),
    Contract: buildMsaExtraction(seed, fileStem),
    RateCard: buildPoExtraction(seed, fileStem),
    SLA: buildMsaExtraction(seed, fileStem),
    Renewal: buildAmendmentExtraction(seed, fileStem),
  };

  const base = { ...(mockByType[type] ?? mockByType.MSA) };

  for (const upload of uploads.slice(1)) {
    const extra = mockByType[upload.documentType];
    if (!extra) continue;
    for (const [key, field] of Object.entries(extra)) {
      if (!base[key] || base[key].confidence === "low") {
        base[key] = { ...field, source: upload.documentType };
      }
    }
  }

  const overall = computeOverallConfidence(base);
  base.extraction_date = {
    value: new Date().toISOString(),
    confidence: "high",
    source: "AI",
  };
  base.extraction_confidence = {
    value: `${overall}%`,
    confidence: "high",
    source: "AI",
  };
  base.doc_type = { value: type, confidence: "high", source: type };
  base.source_filename = { value: fileName, confidence: "high", source: type };

  return base;
}

export function metadataToFormValues(extracted) {
  const form = createEmptyMetadataValues();
  for (const [key, field] of Object.entries(extracted)) {
    if (field?.value !== undefined && field?.value !== null) {
      form[key] = String(field.value);
    }
  }
  return form;
}

/**
 * Form state for upload review: project values plus extracted overrides for this document type only.
 * @param {{ documentType: string, fileName: string }} upload
 * @param {Record<string, { value?: string }>} extracted
 * @param {Record<string, string>} [projectBase]
 */
export function buildDocumentReviewFormValues(upload, extracted, projectBase = {}) {
  const extractedKeys = keysFromExtractionResult(extracted);
  const reviewKeys = getReviewFieldKeys(upload.documentType, extractedKeys);
  const extractedForm = metadataToFormValues(extracted);

  const formValues = { ...projectBase };
  for (const key of reviewKeys) {
    if (extractedForm[key] !== undefined && String(extractedForm[key]).trim() !== "") {
      formValues[key] = extractedForm[key];
    }
  }
  formValues.doc_type = upload.documentType;
  formValues.source_filename = upload.fileName;
  if (extractedForm.extraction_date) formValues.extraction_date = extractedForm.extraction_date;
  if (extractedForm.extraction_confidence) {
    formValues.extraction_confidence = extractedForm.extraction_confidence;
  }

  return { formValues, reviewKeys, extractedKeys };
}

function buildMsaExtraction(seed, fileStem) {
  return fieldMap({
    track_name: [seed.track_name || "AI - Blender Python Engineers", "high"],
    customer_name: [seed.customer_name || "Nexus AI Corp", "high"],
    engagement_type: [seed.engagement_type || "Fixed Cost", "high"],
    scope_summary: [
      seed.scope_summary ||
        "Dedicated Blender/Python engineering squad, monthly deliverables, IP assignment to client.",
      "medium",
    ],
    tech_stack: [seed.tech_stack || "Python, Blender API, Azure DevOps", "medium"],
    sow_start_date: [seed.sow_start_date || "2024-01-01T00:00:00Z", "high"],
    sow_end_date: [seed.sow_end_date || "2027-12-31T00:00:00Z", "high"],
    msa_ref: [seed.msa_ref || `MSA-NEXUS-2024`, "high"],
    msa_term_type: [seed.msa_term_type || "Auto-renewable", "high"],
    msa_expiry_date: [seed.msa_expiry_date || "2027-12-31T00:00:00Z", "medium"],
    governing_law: [seed.governing_law || "State of Delaware, USA", "medium"],
    ip_ownership: [seed.ip_ownership || "Work product assigned to customer upon payment", "low"],
    auto_renewal: [seed.auto_renewal ?? "true", "high"],
    termination_notice_period: [seed.termination_notice_period || "60 days", "medium"],
    renewal_followup_notes: [
      seed.renewal_followup_notes || "Auto-renewal annually unless terminated with 60 days notice.",
      "medium",
    ],
    currency: [seed.currency || "USD", "high"],
    total_contract_value: [seed.total_contract_value || "$950,000", "low"],
    planned_headcount: [seed.planned_headcount || "6", "medium"],
    aziro_dept: [seed.aziro_dept || "Engineering Services", "medium"],
    aziro_legal_entity: [seed.aziro_legal_entity || "Aziron Technologies Inc.", "high"],
    contract_status: [seed.contract_status || "Active", "high"],
    cust_executive_sponsor_name: [seed.cust_executive_sponsor_name || "Alex Morgan", "low"],
    cust_executive_sponsor_email: [seed.cust_executive_sponsor_email || "alex.morgan@nexusai.com", "medium"],
    raw_emails_found: [
      seed.raw_emails_found || "alex.morgan@nexusai.com, contracts@nexusai.com",
      "high",
    ],
    raw_names_found: [seed.raw_names_found || "Nexus AI Corp, Aziron Technologies Inc.", "high"],
  }, "MSA");
}

function buildPoExtraction(seed, fileStem) {
  return fieldMap({
    track_name: [seed.track_name || `PO — ${fileStem}`, "high"],
    customer_name: [seed.customer_name || "Axiom Pvt LTD", "high"],
    engagement_type: [seed.engagement_type || "Fixed Cost", "high"],
    po_number: [seed.po_number || `PO-${Math.floor(10000 + Math.random() * 90000)}`, "high"],
    total_contract_value: [seed.total_contract_value || "$485,000", "high"],
    track_budget_allocation: [seed.track_budget_allocation || "$485,000", "high"],
    sow_start_date: [seed.sow_start_date || "2026-02-01T00:00:00Z", "medium"],
    sow_end_date: [seed.sow_end_date || "2027-01-31T00:00:00Z", "medium"],
    payment_terms: [seed.payment_terms || "Net 30", "high"],
    billing_rate_type: [seed.billing_rate_type || "Fixed", "high"],
    currency: [seed.currency || "USD", "high"],
    cust_finance_contact_name: [seed.cust_finance_contact_name || "Priya Sharma", "medium"],
    cust_finance_contact_email: [seed.cust_finance_contact_email || "priya@axiom.com", "high"],
    raw_emails_found: [seed.raw_emails_found || "priya@axiom.com", "high"],
    raw_names_found: [seed.raw_names_found || "Axiom Pvt LTD", "medium"],
  }, "PO");
}

function buildSowExtraction(seed, fileStem) {
  return fieldMap({
    track_name: [seed.track_name || `SOW — ${fileStem}`, "high"],
    customer_name: [seed.customer_name || "Meridian Financial", "high"],
    engagement_type: [seed.engagement_type || "T&M", "medium"],
    sow_id: [seed.sow_id || `SOW-MER-${fileStem.slice(0, 8).toUpperCase()}`, "high"],
    sow_version: [seed.sow_version || "1.0", "high"],
    scope_summary: [
      seed.scope_summary || "Phase 1 discovery, Phase 2 implementation, hypercare support.",
      "high",
    ],
    key_deliverables: [
      seed.key_deliverables || "Architecture blueprint, MVP release, production cutover",
      "medium",
    ],
    acceptance_criteria: [seed.acceptance_criteria || "UAT sign-off per milestone", "medium"],
    milestones: [seed.milestones || "M1: Discovery, M2: Build, M3: Hypercare", "low"],
    sow_start_date: [seed.sow_start_date || "2025-06-01T00:00:00Z", "high"],
    sow_end_date: [seed.sow_end_date || "2026-05-31T00:00:00Z", "high"],
    track_start_date: [seed.track_start_date || "2025-06-15T00:00:00Z", "medium"],
    planned_headcount: [seed.planned_headcount || "4", "medium"],
    team_roles: [seed.team_roles || "2 Engineers, 1 Tech Lead, 1 PM", "low"],
    aziro_delivery_lead: [seed.aziro_delivery_lead || "Wade Warren", "medium"],
    total_contract_value: [seed.total_contract_value || "$220,000", "low"],
    sla_commitments: [seed.sla_commitments || "P1 response within 4 business hours", "medium"],
  }, "SOW");
}

function buildAmendmentExtraction(seed, fileStem) {
  // Amendments typically change billing type, end date, contract value, or PO
  return fieldMap({
    track_name: [seed.track_name || `Amendment — ${fileStem}`, "high"],
    customer_name: [seed.customer_name || "Nexus AI Corp", "high"],
    // Flip engagement type to demonstrate a real delta
    engagement_type: [
      seed.engagement_type === "Fixed Cost" || seed.engagement_type === "Milestone"
        ? "T&M"
        : "Fixed Cost",
      "high",
    ],
    sow_end_date: [bumpDate(seed.sow_end_date, 6), "high"],
    total_contract_value: [bumpContractValue(seed.total_contract_value), "medium"],
    sow_version: [seed.sow_version ? bumpVersion(seed.sow_version) : "2.0", "high"],
    po_number: [seed.po_number || `PO-${Math.floor(10000 + Math.random() * 90000)}`, "high"],
  }, "Amendment");
}

function buildNdaExtraction(seed, fileStem) {
  return fieldMap({
    track_name: [seed.track_name || `${fileStem} Engagement`, "medium"],
    customer_name: [seed.customer_name || "Nexus AI Corp", "high"],
    confidentiality_period: [seed.confidentiality_period || "3 years from effective date", "high"],
    governing_law: [seed.governing_law || "California, USA", "medium"],
    contract_status: [seed.contract_status || "Draft", "medium"],
    scope_summary: [
      seed.scope_summary || "Confidential AI engineering services under mutual NDA.",
      "medium",
    ],
    raw_emails_found: [seed.raw_emails_found || "legal@nexusai.com", "medium"],
    raw_names_found: [seed.raw_names_found || "Nexus AI Corp", "high"],
  }, "NDA");
}

/** @param {Record<string, [string, string]>} entries value + confidence */
function fieldMap(entries, source) {
  /** @type {Record<string, { value: string, confidence: string, source: string }>} */
  const out = {};
  for (const [key, [value, confidence]] of Object.entries(entries)) {
    out[key] = { value: String(value), confidence, source };
  }
  return out;
}

function computeOverallConfidence(extracted) {
  const scores = Object.entries(extracted)
    .filter(([k]) => !["extraction_date", "extraction_confidence", "source_filename"].includes(k))
    .map(([, f]) => (f.confidence === "high" ? 95 : f.confidence === "medium" ? 78 : 55));
  if (!scores.length) return 80;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Amendment / delta helpers ────────────────────────────────────────────────

function bumpDate(isoDate, addMonths) {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) throw new Error();
    d.setMonth(d.getMonth() + addMonths);
    return d.toISOString();
  } catch {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  }
}

function bumpContractValue(existing) {
  if (!existing) return "$600,000";
  const num = parseFloat(String(existing).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return "$600,000";
  const bumped = Math.round(num * 1.15 / 1000) * 1000;
  const prefix = String(existing).includes("$") ? "$" : "";
  return `${prefix}${bumped.toLocaleString()}`;
}

function bumpVersion(version) {
  const parts = String(version).split(".");
  const minor = parseInt(parts[1] ?? "0", 10);
  return `${parts[0]}.${minor + 1}`;
}

/**
 * Compare existing project metadata against newly extracted values.
 * Returns only fields that differ and have a known label.
 *
 * @param {Record<string, string>} existingMeta - current project metadata (flat key→value)
 * @param {Record<string, { value: string, confidence: string }>} extracted - raw extraction result
 * @returns {Array<{ field: string, label: string, previousValue: string, newValue: string, confidence: string }>}
 */
/** Build apply payload from edited flat form values vs existing project metadata. */
export function acceptedChangesFromFormValues(existingMeta, formValues, options = {}) {
  const { fieldKeys } = options;
  const allowed = fieldKeys ? new Set(fieldKeys) : null;
  const pseudoExtracted = {};
  for (const [key, val] of Object.entries(formValues)) {
    if (!PROJECT_FIELD_LABELS[key]) continue;
    if (allowed && !allowed.has(key)) continue;
    pseudoExtracted[key] = { value: String(val ?? ""), confidence: "high" };
  }
  return computeMetadataDelta(existingMeta, pseudoExtracted).map((c) => ({
    field: c.field,
    label: c.label,
    previousValue: c.previousValue,
    newValue: c.newValue,
  }));
}

export function computeMetadataDelta(existingMeta, extracted) {
  const changes = [];
  for (const [key, field] of Object.entries(extracted)) {
    if (!PROJECT_FIELD_LABELS[key]) continue; // skip unknown / internal fields
    if (["extraction_date", "extraction_confidence", "source_filename", "doc_type"].includes(key)) continue;
    const newVal = String(field.value ?? "").trim();
    const oldVal = String(existingMeta[key] ?? "").trim();
    if (!newVal || newVal === oldVal) continue;
    changes.push({
      field: key,
      label: PROJECT_FIELD_LABELS[key],
      previousValue: oldVal || "—",
      newValue: newVal,
      confidence: field.confidence ?? "medium",
    });
  }
  return changes;
}
