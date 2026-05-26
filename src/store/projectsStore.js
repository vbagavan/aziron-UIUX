import { create } from "zustand";
import {
  metadataToLegacyProjectFields,
  PROJECT_FIELD_LABELS,
  projectToMetadataValues,
  splitMetadataFormPayload,
} from "@/data/projectMetadataSchema";
import { quickFormValuesToMetadata } from "@/lib/projectQuickFormValues";

const STORAGE_KEY = "aziron-projects-v2";

const DEFAULT_PROJECT_FIELDS = {
  metadata: {},
  poNumber: null,
  contractValue: null,
  scopeDetails: null,
  resourceCount: null,
  renewalTerms: null,
  documents: [],
  version: 1,
};

const SAMPLE_METADATA_PROJECT_1 = {
  project_id: "1",
  track_id: "TRK-BLENDER-001",
  track_name: "AI - Blender Python Engineers",
  track_description: "Dedicated offshore squad for Blender automation and Python tooling.",
  engagement_type: "Fixed Cost",
  scope_summary: "Dedicated Blender/Python engineering squad with monthly deliverables.",
  tech_stack: "Python, Blender 4.x, Azure DevOps, Jira",
  customer_name: "Nexus AI Corp",
  aziro_dept: "Engineering Services",
  aziro_legal_entity: "Aziron Technologies Inc.",
  contract_status: "Active",
  doc_type: "MSA",
  source_filename: "nexus-msa-2024.pdf",
  msa_ref: "MSA-NEXUS-2024",
  msa_term_type: "Auto-renewable",
  msa_expiry_date: "2027-12-31T00:00:00Z",
  auto_renewal: "true",
  currency: "USD",
  sow_start_date: "2024-01-01T00:00:00Z",
  sow_end_date: "2027-12-31T00:00:00Z",
  planned_headcount: "6",
  aziro_delivery_lead: "Robert Fox",
  extraction_confidence: "91%",
  extraction_date: "2026-05-12T10:30:00Z",
};

const INITIAL_PROJECTS = [
  {
    id: "1",
    name: "AI - Blender Python Engineers",
    code: null,
    customer: "Nexus AI Corp",
    customerId: "nexus-ai",
    billingType: "Fixed Price",
    gst: "18%",
    gstApplies: false,
    status: "active",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2027-12-31T00:00:00Z",
    creditPeriodDays: 30,
    projectManager: null,
    priority: null,
    poNumber: null,
    contractValue: null,
    scopeDetails: "Dedicated Blender/Python engineering squad with monthly deliverables.",
    resourceCount: 6,
    renewalTerms: "Auto-renewal annually unless terminated with 60 days notice.",
    metadata: SAMPLE_METADATA_PROJECT_1,
    documents: [
      {
        id: "doc-1-1",
        type: "MSA",
        fileName: "nexus-msa-2024.pdf",
        uploadedAt: "2026-05-12T10:30:00Z",
        uploadedBy: "John D",
        metadataVersion: 1,
        timelineEntryId: "tl-1",
      },
    ],
    version: 2,
  },
  {
    id: "3",
    name: "Cloud Migration Phase 2",
    code: "AX-AXIOM-2ABY",
    customer: "Axiom Pvt LTD",
    customerId: "axiom",
    billingType: "Fixed Price",
    gst: "18%",
    gstApplies: true,
    status: "active",
    startDate: "2023-11-01T00:00:00Z",
    endDate: "2025-10-31T00:00:00Z",
    creditPeriodDays: 30,
    projectManager: "Wade Warren",
    priority: "Medium",
    poNumber: "PO-88421",
    contractValue: "$1,200,000",
    scopeDetails: "Lift-and-shift plus modernization of core workloads.",
    resourceCount: 12,
    renewalTerms: null,
    documents: [
      {
        id: "doc-3-1",
        type: "PO",
        fileName: "axiom-po-88421.pdf",
        uploadedAt: "2026-05-18T15:16:00Z",
        uploadedBy: "Sarah K",
        metadataVersion: 4,
        timelineEntryId: "tl-3",
      },
    ],
    version: 4,
  },
  { id: "2", name: "APRU Project", code: null, customer: "Axiom Pvt LTD", customerId: "axiom", billingType: "Fixed Price", gst: "—", gstApplies: false, status: "active", startDate: "2024-03-15T00:00:00Z", endDate: "2026-06-30T00:00:00Z", creditPeriodDays: 45, projectManager: "Jane Cooper", priority: "High", ...DEFAULT_PROJECT_FIELDS },
  { id: "4", name: "Data Pipeline Modernization", code: null, customer: "Meridian Financial", customerId: "meridian", billingType: "Fixed Price", gst: "18%", gstApplies: true, status: "active", startDate: "2024-06-01T00:00:00Z", endDate: "2028-03-31T00:00:00Z", creditPeriodDays: 30, projectManager: null, priority: null, ...DEFAULT_PROJECT_FIELDS },
  { id: "5", name: "Enterprise SSO Rollout", code: null, customer: "Northwind Labs", customerId: "northwind", billingType: "Fixed Price", gst: "—", gstApplies: false, status: "active", startDate: "2025-01-10T00:00:00Z", endDate: "2025-12-20T00:00:00Z", creditPeriodDays: 15, projectManager: "Kristin Watson", priority: "Low", ...DEFAULT_PROJECT_FIELDS },
  { id: "6", name: "GenAI Support Assistant", code: null, customer: "Nexus AI Corp", customerId: "nexus-ai", billingType: "Fixed Price", gst: "18%", gstApplies: true, status: "active", startDate: "2024-09-01T00:00:00Z", endDate: "2027-08-31T00:00:00Z", creditPeriodDays: 30, projectManager: "Robert Fox", priority: null, ...DEFAULT_PROJECT_FIELDS },
  { id: "7", name: "Platform Observability", code: null, customer: "Orbit Systems", customerId: "orbit", billingType: "Fixed Price", gst: "—", gstApplies: false, status: "active", startDate: "2024-02-20T00:00:00Z", endDate: "2026-02-19T00:00:00Z", creditPeriodDays: 60, projectManager: null, priority: "Medium", ...DEFAULT_PROJECT_FIELDS },
  { id: "8", name: "Regulatory Reporting Q1", code: null, customer: "Meridian Financial", customerId: "meridian", billingType: "Fixed Price", gst: "18%", gstApplies: true, status: "active", startDate: "2025-01-01T00:00:00Z", endDate: "2025-03-31T00:00:00Z", creditPeriodDays: 30, projectManager: "Esther Howard", priority: "High", ...DEFAULT_PROJECT_FIELDS },
];

const INITIAL_TIMELINE = [
  {
    id: "tl-1",
    projectId: "1",
    timestamp: "2026-05-12T10:30:00Z",
    userName: "John D",
    action: "created",
    changeType: "created",
    summary: "Project created via MSA upload",
    documentRef: { type: "MSA", fileName: "nexus-msa-2024.pdf", documentId: "doc-1-1" },
    changes: null,
    version: 1,
  },
  {
    id: "tl-2",
    projectId: "3",
    timestamp: "2026-05-18T15:15:00Z",
    userName: "Sarah K",
    action: "field_updated",
    changeType: "field_updated",
    summary: "Billing Type changed from T&M → Fixed Cost",
    documentRef: null,
    changes: [{ field: "engagement_type", label: "Engagement Type", previousValue: "T&M", newValue: "Fixed Cost" }],
    version: 3,
  },
  {
    id: "tl-3",
    projectId: "3",
    timestamp: "2026-05-18T15:16:00Z",
    userName: "Sarah K",
    action: "document_uploaded",
    changeType: "document_uploaded",
    summary: "Updated PO Number via PO upload",
    documentRef: { type: "PO", fileName: "axiom-po-88421.pdf", documentId: "doc-3-1" },
    changes: [{ field: "poNumber", label: "PO Number", previousValue: "—", newValue: "PO-88421" }],
    version: 4,
  },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.projects?.length) return parsed;
    }
  } catch {
    /* use defaults */
  }
  return { projects: INITIAL_PROJECTS, timeline: INITIAL_TIMELINE };
}

function persist(projects, timeline) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, timeline }));
  } catch {
    /* quota */
  }
}

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formValuesToProject(metadata, existing = null, { isNew = false } = {}) {
  const legacy = metadataToLegacyProjectFields(metadata, existing);
  return {
    id: existing?.id ?? nextId("proj"),
    ...legacy,
    metadata: { ...metadata },
    documents: existing?.documents ?? [],
    version: isNew ? 1 : (existing?.version ?? 0) + 1,
  };
}

function diffProjectFields(prev, next) {
  const prevMeta = prev.metadata ?? projectToMetadataValues(prev);
  const nextMeta = next.metadata ?? {};
  const changes = [];

  for (const [key, label] of Object.entries(PROJECT_FIELD_LABELS)) {
    const a = formatMetaValue(key, prevMeta[key]);
    const b = formatMetaValue(key, nextMeta[key]);
    if (a !== b) {
      changes.push({ field: key, label, previousValue: a, newValue: b });
    }
  }
  return changes;
}

function formatMetaValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "auto_renewal") return value === "true" || value === true ? "Yes" : "No";
  return String(value);
}

const boot = loadState();

export const useProjectsStore = create((set, get) => ({
  projects: boot.projects,
  timeline: boot.timeline,

  getProjectById: (id) => get().projects.find((p) => p.id === id) ?? null,

  getProjectTimeline: (projectId) =>
    get()
      .timeline.filter((e) => e.projectId === projectId)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),

  createProjectManual: ({ formValues, userName }) => {
    const { priority } = formValues ?? {};
    const metadata = quickFormValuesToMetadata(formValues ?? {});
    let project = formValuesToProject(metadata, null, { isNew: true });
    project.metadata = {
      ...project.metadata,
      project_id: project.id,
      track_id: project.metadata.track_id || `TRK-${project.id}`,
    };
    project = { ...project, ...metadataToLegacyProjectFields(project.metadata, project) };
    if (priority) project.priority = priority;
    project.documents = [];
    project.version = 1;

    const entry = {
      id: nextId("tl"),
      projectId: project.id,
      timestamp: new Date().toISOString(),
      userName,
      action: "created_manual",
      changeType: "created_manual",
      summary: "Project created manually",
      documentRef: null,
      changes: null,
      version: 1,
    };

    set((state) => {
      const projects = [...state.projects, project];
      const timeline = [entry, ...state.timeline];
      persist(projects, timeline);
      return { projects, timeline };
    });

    return project;
  },

  applyDocumentDelta: ({ projectId, acceptedChanges, documentRef, userName }) => {
    const state = get();
    const existing = state.projects.find((p) => p.id === projectId);
    if (!existing) return null;

    const updatedMeta = { ...(existing.metadata ?? {}) };
    for (const change of acceptedChanges) {
      updatedMeta[change.field] = change.newValue;
    }

    const nextVersion = (existing.version ?? 1) + 1;
    const entryId = nextId("tl");
    const docRecord = {
      id: nextId("doc"),
      type: documentRef.type,
      fileName: documentRef.fileName,
      fileId: documentRef.fileId ?? null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userName,
      metadataVersion: nextVersion,
      timelineEntryId: entryId,
    };

    const updated = {
      ...existing,
      ...metadataToLegacyProjectFields(updatedMeta, existing),
      metadata: updatedMeta,
      documents: [...(existing.documents ?? []), docRecord],
      version: nextVersion,
    };

    const hasFieldChanges = acceptedChanges.length > 0;
    const entry = {
      id: entryId,
      projectId,
      timestamp: new Date().toISOString(),
      userName,
      action: hasFieldChanges ? "delta_applied" : "document_uploaded",
      changeType: hasFieldChanges ? "delta_applied" : "document_uploaded",
      summary: hasFieldChanges
        ? `${documentRef.type} uploaded — ${acceptedChanges.length} field${acceptedChanges.length !== 1 ? "s" : ""} updated`
        : `${documentRef.type} uploaded — no metadata changes`,
      documentRef: {
        type: documentRef.type,
        fileName: documentRef.fileName,
        documentId: docRecord.id,
      },
      changes: acceptedChanges,
      version: nextVersion,
    };

    set((s) => {
      const projects = s.projects.map((p) => (p.id === projectId ? updated : p));
      const timeline = [entry, ...s.timeline];
      persist(projects, timeline);
      return { projects, timeline };
    });

    return updated;
  },

  createProject: ({ formValues, uploads, userName }) => {
    const { metadata, priority } = splitMetadataFormPayload(formValues);
    let project = formValuesToProject(metadata, null, { isNew: true });
    project.metadata = {
      ...project.metadata,
      project_id: project.id,
      track_id: project.metadata.track_id || `TRK-${project.id}`,
    };
    project = { ...project, ...metadataToLegacyProjectFields(project.metadata, project) };
    if (priority) project.priority = priority;
    const entryId = nextId("tl");
    const docRecords = (uploads ?? []).map((u) => ({
      id: u.fileId || nextId("doc"),
      type: u.documentType,
      fileName: u.fileName,
      fileId: u.fileId ?? null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userName,
      metadataVersion: 1,
      timelineEntryId: entryId,
    }));
    project.documents = docRecords;
    project.version = 1;

    const primaryType = uploads[0]?.documentType ?? "MSA";
    const primaryDoc = docRecords[0];
    const entry = {
      id: entryId,
      projectId: project.id,
      timestamp: new Date().toISOString(),
      userName,
      action: "created",
      changeType: "created",
      summary: `Project created via ${primaryType} upload`,
      documentRef: primaryDoc
        ? {
            type: primaryDoc.type,
            fileName: primaryDoc.fileName,
            documentId: primaryDoc.id,
          }
        : null,
      changes: null,
      version: 1,
    };

    set((state) => {
      const projects = [...state.projects, project];
      const timeline = [entry, ...state.timeline];
      persist(projects, timeline);
      return { projects, timeline };
    });

    return project;
  },

  updateProjectManual: ({ projectId, formValues, userName }) => {
    const state = get();
    const existing = state.projects.find((p) => p.id === projectId);
    if (!existing) return null;

    const { metadata, priority } = splitMetadataFormPayload({
      ...projectToMetadataValues(existing),
      ...formValues,
    });

    const updated = get().updateProject({
      projectId,
      formValues: metadata,
      uploads: [],
      userName,
    });

    if (updated && priority !== undefined) {
      set((s) => {
        const projects = s.projects.map((p) =>
          p.id === projectId ? { ...p, priority: priority || null } : p,
        );
        persist(projects, s.timeline);
        return { projects };
      });
    }

    return updated;
  },

  updateProject: ({ projectId, formValues, uploads, userName }) => {
    const state = get();
    const existing = state.projects.find((p) => p.id === projectId);
    if (!existing) return null;

    const { metadata } = splitMetadataFormPayload(formValues);
    const updated = formValuesToProject(metadata, existing);
    const newDocs = uploads.map((u) => ({
      id: nextId("doc"),
      type: u.documentType,
      fileName: u.fileName,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userName,
    }));
    updated.documents = [...existing.documents, ...newDocs];

    const fieldChanges = diffProjectFields(existing, updated);
    const timelineEntries = [];

    if (newDocs.length > 0) {
      for (const doc of newDocs) {
        const entryId = nextId("tl");
        doc.timelineEntryId = entryId;
        doc.metadataVersion = updated.version;
        const relatedChanges = fieldChanges.filter((c) =>
          c.field === "po_number" ? doc.type === "PO" : false,
        );
        timelineEntries.push({
          id: entryId,
          projectId,
          timestamp: new Date().toISOString(),
          userName,
          action: "document_uploaded",
          changeType: "document_uploaded",
          summary:
            doc.type === "PO"
              ? "Updated PO Number via PO upload"
              : `Supporting document uploaded (${doc.type})`,
          documentRef: { type: doc.type, fileName: doc.fileName, documentId: doc.id },
          changes: relatedChanges.length ? relatedChanges : null,
          version: updated.version,
        });
      }
    }

    const remainingChanges = fieldChanges.filter(
      (c) => !timelineEntries.some((e) => e.changes?.some((ch) => ch.field === c.field)),
    );

    if (remainingChanges.length > 0) {
      const billingChange = remainingChanges.find((c) => c.field === "engagement_type");
      timelineEntries.push({
        id: nextId("tl"),
        projectId,
        timestamp: new Date().toISOString(),
        userName,
        action: "field_updated",
        changeType: "field_updated",
        summary: billingChange
          ? `Engagement Type changed from ${billingChange.previousValue} → ${billingChange.newValue}`
          : `${remainingChanges.length} field(s) updated`,
        documentRef: null,
        changes: remainingChanges,
        version: updated.version,
      });
    }

    if (timelineEntries.length === 0 && fieldChanges.length === 0 && newDocs.length === 0) {
      set((s) => {
        const projects = s.projects.map((p) => (p.id === projectId ? updated : p));
        persist(projects, s.timeline);
        return { projects };
      });
      return updated;
    }

    set((s) => {
      const projects = s.projects.map((p) => (p.id === projectId ? updated : p));
      const timeline = [...timelineEntries, ...s.timeline];
      persist(projects, timeline);
      return { projects, timeline };
    });

    return updated;
  },
}));

/** Non-hook accessors for list pages */
export function getAllProjects() {
  return useProjectsStore.getState().projects;
}

export function getProjectByIdFromStore(id) {
  return useProjectsStore.getState().getProjectById(id);
}
