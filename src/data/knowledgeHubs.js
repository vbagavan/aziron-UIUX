/** Shared Knowledge Hub seed data and helpers (single source of truth). */

export const PROVIDER_LABEL = "Managed vector store";

export const ACCEPTED_FILE_TYPES_LABEL =
  "PDF, Word, Excel, CSV, text, or images — max 10 MB each";

export const ACCEPTED_FILE_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const EXT_TO_TYPE = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  csv: "CSV",
  txt: "Text",
  md: "Markdown",
  html: "HTML",
  jpg: "Image",
  jpeg: "Image",
  png: "Image",
};

export const SEED_KNOWLEDGE_HUBS = [
  {
    id: 1,
    name: "Test Hub (Draft)",
    description: "Sandbox hub for uploads and embedding tests.",
    files: 0,
    collections: 0,
    storageMB: 0,
    provider: PROVIDER_LABEL,
    createdOn: "2026-04-21",
    updated: "21 Apr 2026",
    usedBy: 0,
    visibility: "private",
  },
  {
    id: 2,
    name: "Product Documentation",
    description: "Manuals, release notes, and API references.",
    files: 42,
    collections: 4,
    storageMB: 380,
    provider: PROVIDER_LABEL,
    createdOn: "2026-04-21",
    updated: "2 days ago",
    usedBy: 3,
    visibility: "public",
  },
  {
    id: 3,
    name: "Hub space",
    description: "Shared team documents and runbooks.",
    files: 18,
    collections: 2,
    storageMB: 142,
    provider: PROVIDER_LABEL,
    createdOn: "2026-04-07",
    updated: "1 week ago",
    usedBy: 2,
    visibility: "private",
  },
  {
    id: 4,
    name: "ERP",
    description: "ERP policies, procedures, and training material.",
    files: 31,
    collections: 3,
    storageMB: 290,
    provider: PROVIDER_LABEL,
    createdOn: "2026-03-20",
    updated: "3 weeks ago",
    usedBy: 4,
    visibility: "private",
  },
  {
    id: 5,
    name: "Kubernetes Runbooks",
    description: "Cluster operations, incident playbooks, and SRE guides.",
    files: 22,
    collections: 2,
    storageMB: 198,
    provider: PROVIDER_LABEL,
    createdOn: "2026-03-18",
    updated: "5 days ago",
    usedBy: 6,
    visibility: "private",
  },
  {
    id: 6,
    name: "My RAG",
    description: "Primary retrieval corpus for production agents.",
    files: 74,
    collections: 8,
    storageMB: 620,
    provider: PROVIDER_LABEL,
    createdOn: "2026-03-09",
    updated: "Yesterday",
    usedBy: 8,
    visibility: "private",
  },
  {
    id: 7,
    name: "Aziro-Policy",
    description: "Company policies, compliance, and HR guidance.",
    files: 91,
    collections: 9,
    storageMB: 740,
    provider: PROVIDER_LABEL,
    createdOn: "2026-03-03",
    updated: "4 days ago",
    usedBy: 5,
    visibility: "private",
  },
  {
    id: 8,
    name: "CV",
    description: "Résumés and candidate profiles for recruitment agents.",
    files: 147,
    collections: 15,
    storageMB: 1120,
    provider: PROVIDER_LABEL,
    createdOn: "2026-01-28",
    updated: "2 days ago",
    usedBy: 2,
    visibility: "public",
  },
];

/** Map a browser File to a hub file row (stored locally in this prototype). */
export function fileToHubRecord(file, hubId) {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop().toLowerCase()
    : "file";
  return {
    id: `kh${hubId}-u${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: EXT_TO_TYPE[ext] ?? ext.toUpperCase(),
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    updated: "Just now",
    uploadedAt: formatIsoDateToday(),
    source: "user",
    indexStatus: "stored",
    fileStatus: "success",
  };
}

function generatePlaceholderFiles(hub, count, startIndex = 0) {
  const exts = [
    { ext: "pdf", type: "PDF" },
    { ext: "docx", type: "Word" },
    { ext: "md", type: "Markdown" },
    { ext: "html", type: "HTML" },
    { ext: "txt", type: "Text" },
    { ext: "csv", type: "CSV" },
  ];
  const slug =
    hub.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").slice(0, 28) ||
    "hub";
  const rows = [];
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const spec = exts[idx % exts.length];
    const sizeKb = 8 + ((hub.id * 91 + idx * 47) % 8200);
    const fileStatus =
      idx % 10 === 0 ? "processing" : idx % 10 === 4 ? "failed" : "success";
    rows.push({
      id: `kh${hub.id}-f${idx}`,
      name: `${slug}_${String(idx + 1).padStart(3, "0")}.${spec.ext}`,
      type: spec.type,
      sizeKb,
      updated: hub.updated ?? formatDisplayDate(hub.createdOn),
      uploadedAt: hub.createdOn,
      source: "demo",
      indexStatus: "demo",
      fileStatus,
    });
  }
  return rows;
}

/**
 * Hub file inventory for tables and modals.
 * User-created hubs only list real uploads; seed hubs include labeled demo rows.
 */
export function buildHubFileInventory(hub) {
  const hidden = new Set(hub.hiddenFileIds ?? []);
  const userFiles = (hub.userFiles ?? [])
    .filter((f) => !hidden.has(f.id))
    .map((f) => ({
      ...f,
      source: f.source ?? "user",
      indexStatus: f.indexStatus ?? "stored",
    }));
  const total = hub.files ?? 0;
  const userCreated = hub.isUserCreated === true;

  if (total === 0 && userFiles.length === 0) {
    return {
      userFiles: [],
      demoFiles: [],
      allFiles: [],
      totalListed: 0,
      totalReported: 0,
      hasDemoRows: false,
    };
  }

  if (userCreated) {
    return {
      userFiles,
      demoFiles: [],
      allFiles: userFiles,
      totalListed: userFiles.length,
      totalReported: userFiles.length,
      hasDemoRows: false,
    };
  }

  const demoCount = Math.max(
    0,
    Math.min(total - userFiles.length, 50 - userFiles.length),
  );
  const demoFiles =
    demoCount > 0
      ? generatePlaceholderFiles(hub, demoCount, userFiles.length).filter(
          (f) => !hidden.has(f.id),
        )
      : [];
  const allFiles = [...userFiles, ...demoFiles];

  return {
    userFiles,
    demoFiles,
    allFiles,
    totalListed: allFiles.length,
    totalReported: total,
    hasDemoRows: demoFiles.length > 0,
  };
}

export function isUserHubFile(row) {
  return row?.source === "user";
}

export function filesToHubStats(files) {
  const list = Array.from(files);
  const storageMB = list.reduce(
    (sum, f) => sum + Math.max(1, Math.round(f.size / (1024 * 1024))),
    0,
  );
  return {
    added: list.length,
    storageMB,
    collectionDelta: list.length > 0 ? 1 : 0,
  };
}

export function formatFileSizeKb(kb) {
  if (kb == null || kb <= 0) return "—";
  if (kb >= 1024) {
    const mb = kb / 1024;
    return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  }
  return `${Math.round(kb)} KB`;
}

/** Total size string for hub file lists (matches edit modal summary). */
export function formatHubTotalSizeMb(files) {
  const kb = (files ?? []).reduce((sum, f) => sum + (f.sizeKb ?? 0), 0);
  return (kb / 1024).toFixed(2);
}

/** User uploads always show as ready; demo statuses only when hub has demo rows. */
export function getHubFileStatus(row, { includeDemoStatuses = false } = {}) {
  if (row.source === "user" || row.indexStatus === "stored") return "success";
  if (!includeDemoStatuses) return "success";
  return row.fileStatus || "success";
}

/** MM/DD/YYYY for file table date column. */
export function formatFileTableDate(row, hub) {
  const raw = row.uploadedAt ?? hub?.createdOn;
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/** ISO date → locale display; ISO string also used in `title` for exact date. */
export function formatDisplayDate(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatIsoDateToday() {
  return new Date().toISOString().slice(0, 10);
}

export function hubToPickerShape(hub) {
  return {
    id: hub.id,
    name: hub.name,
    fileCount: hub.files ?? 0,
  };
}

export function createHubPayload({
  name,
  description = "",
  pendingFile = null,
  pendingFiles = null,
}) {
  const today = formatIsoDateToday();
  const id = Date.now();
  const fileList = pendingFiles?.length
    ? Array.from(pendingFiles)
    : pendingFile
      ? [pendingFile]
      : [];
  const userFiles = fileList.map((f) => fileToHubRecord(f, id));
  const stats = filesToHubStats(fileList);
  return {
    id,
    name: name.trim(),
    description: description.trim(),
    files: userFiles.length,
    collections: userFiles.length > 0 ? 1 : 0,
    storageMB: stats.storageMB,
    provider: PROVIDER_LABEL,
    createdOn: today,
    updated: "Just now",
    usedBy: 0,
    visibility: "private",
    isUserCreated: true,
    userFiles,
    pendingFileName: fileList[0]?.name ?? null,
  };
}

export const KNOWLEDGE_HUBS_STORAGE_KEY = "aziron_knowledge_hubs_v1";

export function loadHubsFromStorage() {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_HUBS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveHubsToStorage(hubs) {
  try {
    localStorage.setItem(KNOWLEDGE_HUBS_STORAGE_KEY, JSON.stringify(hubs));
  } catch {
    /* quota / private mode */
  }
}
