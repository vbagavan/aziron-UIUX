/**
 * Eight platform — project create / edit document workflow.
 * Maps UX steps to routes, schema sections, and supported document types.
 */

export const PROJECT_WORKFLOW_STEPS = [
  {
    id: 1,
    key: "upload",
    label: "Upload",
    description: "Add NDA, PO, MSA, or SOW / SWO documents",
  },
  {
    id: 2,
    key: "extract",
    label: "Extract",
    description: "AI parses metadata from uploaded contracts",
  },
  {
    id: 3,
    key: "review",
    label: "Review",
    description: "Validate and edit all extracted fields",
  },
  {
    id: 4,
    key: "confirm",
    label: "Submit",
    description: "Confirm changes and save the project",
  },
];

/** Schema sections populated during extraction (for status UI). */
export const EXTRACTION_SCHEMA_GROUPS = [
  "Project & Track Information",
  "Customer & Organization Information",
  "Contract & Legal Information",
  "Financial & Commercial Information",
  "Timeline & Duration Information",
  "Delivery & Resource Information",
  "Customer Stakeholder Information",
  "Internal Reference Information",
  "AI Extraction Metadata",
];

/** Key fields surfaced on the final confirmation step. */
export const CONFIRMATION_SUMMARY_FIELDS = [
  { key: "track_name", label: "Track Name" },
  { key: "customer_name", label: "Customer" },
  { key: "engagement_type", label: "Engagement Type" },
  { key: "sow_start_date", label: "SOW Start" },
  { key: "sow_end_date", label: "SOW End" },
  { key: "total_contract_value", label: "Contract Value" },
  { key: "po_number", label: "PO Number" },
  { key: "doc_type", label: "Primary Document" },
  { key: "extraction_confidence", label: "Extraction Confidence" },
];

export const PROJECT_FLOW_ROUTES = {
  list: "/finance/projects",
  /** Manual form — sole path to create a new project */
  createManual: "/finance/projects/create/manual",
  /** @deprecated Document upload does not create projects; redirects to manual create */
  createDocument: "/finance/projects/create/manual",
  /** Upload documents on an existing project (preview + extracted form) */
  uploadDocument: (id) => `/finance/projects/${id}/upload`,
  detail: (id) => `/finance/projects/${id}`,
  edit: (id) => `/finance/projects/${id}/edit`,
  timeline: (id, opts) => {
    const params = new URLSearchParams({ tab: "timeline" });
    if (opts?.event) params.set("event", opts.event);
    if (opts?.doc) params.set("doc", opts.doc);
    return `/finance/projects/${id}?${params.toString()}`;
  },
  documents: (id) => `/finance/projects/${id}?tab=documents`,
};
