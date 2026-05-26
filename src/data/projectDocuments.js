/** Contract document types supported during project upload and filtering. */
export const PROJECT_DOCUMENT_TYPES = [
  {
    id: "PO",
    label: "PO (Purchase Order)",
    shortLabel: "PO",
    description: "Official authorization from the client to initiate work and payments",
  },
  {
    id: "MSA",
    label: "MSA (Master Service Agreement)",
    shortLabel: "MSA",
    description: "Governs the overall legal and commercial relationship",
  },
  {
    id: "SOW",
    label: "SOW (Statement of Work)",
    shortLabel: "SOW",
    description: "Defines scope, deliverables, timelines, and ownership",
  },
  {
    id: "Proposal",
    label: "Proposal / Project Proposal",
    shortLabel: "Proposal",
    description: "Initial solution approach, estimation, and pricing",
  },
  {
    id: "Quotation",
    label: "Quotation / Pricing Sheet",
    shortLabel: "Quotation",
    description: "Commercial pricing details",
  },
  {
    id: "Contract",
    label: "Contract Agreement",
    shortLabel: "Contract",
    description: "Formal signed engagement contract",
  },
  {
    id: "RateCard",
    label: "Rate Card",
    shortLabel: "Rate Card",
    description: "Resource pricing structure",
  },
  {
    id: "CR",
    label: "Change Request (CR)",
    shortLabel: "CR",
    description: "Scope change approval document",
  },
  {
    id: "NDA",
    label: "NDA (Non-Disclosure Agreement)",
    shortLabel: "NDA",
    description: "Confidentiality agreement",
  },
  {
    id: "SLA",
    label: "Service Level Agreement (SLA)",
    shortLabel: "SLA",
    description: "Support and response commitments",
  },
  {
    id: "Renewal",
    label: "Renewal Agreement",
    shortLabel: "Renewal",
    description: "Agreement extension or renewal terms",
  },
];

const DOCUMENT_TYPE_BY_ID = Object.fromEntries(
  PROJECT_DOCUMENT_TYPES.map((t) => [t.id, t]),
);

/** @param {string} id */
export function getProjectDocumentTypeLabel(id) {
  return DOCUMENT_TYPE_BY_ID[id]?.shortLabel ?? id ?? "—";
}

/** @param {string} id */
export function getProjectDocumentTypeDescription(id) {
  return DOCUMENT_TYPE_BY_ID[id]?.description ?? "";
}

export {
  METADATA_SECTIONS,
  ALL_METADATA_FIELDS,
  PROJECT_FIELD_LABELS,
  ENGAGEMENT_TYPES,
  CONTRACT_STATUSES,
  createEmptyMetadataValues,
  projectToMetadataValues,
  metadataToLegacyProjectFields,
  validateMetadataForm,
} from "@/data/projectMetadataSchema";

export const TIMELINE_CHANGE_TYPES = [
  { id: "all", label: "All changes" },
  { id: "created", label: "Project created" },
  { id: "created_manual", label: "Project created (manual)" },
  { id: "field_updated", label: "Field updates" },
  { id: "document_uploaded", label: "Document uploads" },
  { id: "delta_applied", label: "AI updates applied" },
];
