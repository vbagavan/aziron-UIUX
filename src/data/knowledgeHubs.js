/** Shared Knowledge Hub seed data and helpers (single source of truth). */

export const PROVIDER_LABEL = "Managed vector store";

export const ACCEPTED_FILE_TYPES_LABEL =
  "Documents up to 10 MB · Video, audio, and EPUB up to 100 MB";

/** Allow any file type in the picker; size is validated separately. */
export const ACCEPTED_FILE_EXTENSIONS = "*/*";

export { MAX_DOCUMENT_BYTES as MAX_FILE_BYTES } from "@/lib/hubUploadLimits";

const EXT_TO_TYPE = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  rtf: "Word",
  odt: "Word",
  xls: "Excel",
  xlsx: "Excel",
  csv: "CSV",
  txt: "Text",
  md: "Markdown",
  markdown: "Markdown",
  html: "HTML",
  htm: "HTML",
  json: "Text",
  xml: "Text",
  log: "Text",
  ppt: "PowerPoint",
  pptx: "PowerPoint",
  key: "PowerPoint",
  jpg: "Image",
  jpeg: "Image",
  png: "Image",
  gif: "Image",
  webp: "Image",
  bmp: "Image",
  svg: "Image",
  heic: "Image",
  tiff: "Image",
  tif: "Image",
  epub: "eBook",
  mobi: "eBook",
  azw: "eBook",
  azw3: "eBook",
  mp4: "Video",
  mov: "Video",
  webm: "Video",
  mkv: "Video",
  avi: "Video",
  m4v: "Video",
  mpg: "Video",
  mpeg: "Video",
  wmv: "Video",
  mp3: "Audio",
  wav: "Audio",
  m4a: "Audio",
  aac: "Audio",
  ogg: "Audio",
  flac: "Audio",
  wma: "Audio",
  aiff: "Audio",
  opus: "Audio",
};

const MIME_TO_TYPE = {
  "application/pdf": "PDF",
  "application/epub+zip": "eBook",
  "text/html": "HTML",
  "text/csv": "CSV",
  "text/markdown": "Markdown",
  "text/plain": "Text",
};

function getFileExtension(fileName) {
  if (!fileName || !fileName.includes(".")) return "";
  return fileName.split(".").pop().toLowerCase();
}

/** Resolve hub library type label from filename and optional MIME type. */
export function inferHubFileType(fileName, mimeType = "") {
  const ext = getFileExtension(fileName);
  if (ext && EXT_TO_TYPE[ext]) return EXT_TO_TYPE[ext];

  const mime = (mimeType ?? "").toLowerCase();
  if (MIME_TO_TYPE[mime]) return MIME_TO_TYPE[mime];
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.startsWith("image/")) return "Image";
  if (mime.includes("wordprocessingml") || mime.includes("msword")) return "Word";
  if (mime.includes("spreadsheetml") || mime.includes("ms-excel")) return "Excel";
  if (mime.includes("presentationml") || mime.includes("ms-powerpoint")) return "PowerPoint";

  if (ext) return ext.toUpperCase();
  return "File";
}

export const SEED_KNOWLEDGE_HUBS = [
  {
    id: 1,
    name: "Files Hub",
    description: "Documents, guides, and uploaded files for agents and workflows.",
    files: 28,
    collections: 3,
    storageMB: 410,
    provider: PROVIDER_LABEL,
    createdOn: "2026-04-01",
    updated: "Yesterday",
    usedBy: 5,
    visibility: "private",
    status: "published",
    tags: ["documents", "files"],
  },
  {
    id: 2,
    name: "Database Hub",
    description: "Connected databases and tables for structured retrieval.",
    files: 3,
    collections: 1,
    storageMB: 12,
    provider: PROVIDER_LABEL,
    createdOn: "2026-04-07",
    updated: "2 days ago",
    usedBy: 2,
    visibility: "private",
    tags: ["databases", "sql"],
  },
  {
    id: 3,
    name: "API Hub",
    description: "REST, GraphQL, and webhook endpoints for live API retrieval.",
    files: 3,
    collections: 1,
    storageMB: 8,
    provider: PROVIDER_LABEL,
    createdOn: "2026-03-20",
    updated: "4h ago",
    usedBy: 3,
    visibility: "private",
    tags: ["apis", "integrations"],
  },
  {
    id: 4,
    name: "Project Engagement Hub",
    description:
      "SOW, RFP, MSA, and related project documents — generate purchase orders, invoices, and deliverables in Studio.",
    files: 3,
    collections: 1,
    storageMB: 2,
    provider: PROVIDER_LABEL,
    createdOn: "2026-05-15",
    updated: "Yesterday",
    usedBy: 4,
    visibility: "private",
    tags: ["projects", "contracts", "sow", "rfp"],
  },
];

/** Map a browser File to a hub file row (stored locally in this prototype). */
export function fileToHubRecord(file, hubId) {
  return {
    id: `kh${hubId}-u${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: inferHubFileType(file.name, file.type),
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    updated: "Just now",
    uploadedAt: new Date().toISOString(),
    source: "user",
    indexStatus: "stored",
    fileStatus: "success",
  };
}

/** Parse picker display sizes (e.g. "7.4 MB") into kilobytes for hub inventory. */
export function parseDisplaySizeToKb(sizeStr) {
  if (!sizeStr || sizeStr === "—") return 1;
  const normalized = String(sizeStr).trim().toUpperCase();
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return 1;
  if (normalized.includes("GB")) return Math.max(1, Math.round(num * 1024 * 1024));
  if (normalized.includes("MB")) return Math.max(1, Math.round(num * 1024));
  if (normalized.includes("KB")) return Math.max(1, Math.round(num));
  return Math.max(1, Math.round(num));
}

/** Map a cloud picker row (OneDrive, etc.) to a hub file record. */
export function cloudFileToHubRecord(
  file,
  hubId,
  { provider = "onedrive", connectionId = null, connectionName = null } = {},
) {
  const stored =
    file.syncStatus === "stored" || Boolean(file.localBlobId || file.draftBlobId);
  return {
    id: `kh${hubId}-c-${file.id}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    type: inferHubFileType(file.name, file.mimeType ?? file.type),
    sizeKb: parseDisplaySizeToKb(file.size),
    updated: "Just now",
    uploadedAt: formatIsoDateToday(),
    source: "cloud",
    cloudProvider: provider,
    connectionId,
    connectionName,
    externalFileId: file.id,
    indexStatus: stored ? "stored" : "linked",
    syncStatus: stored ? "stored" : "linked",
    fileStatus: stored ? "success" : "linked",
    localBlobId: file.localBlobId ?? null,
    draftBlobId: file.draftBlobId ?? null,
    syncedAt: file.syncedAt ?? null,
  };
}

/** Cloud rows that are not yet downloaded into the local KB. */
export function isCloudFileLinked(row) {
  return row?.source === "cloud" && getHubFileStatus(row) === "linked";
}

export function isCloudFileStoredLocally(row) {
  return row?.source === "cloud" && getHubFileStatus(row) === "success";
}

export function migrateCloudFileRecord(file) {
  if (file?.source !== "cloud") return file;
  if (file.localBlobId || file.syncStatus === "stored") {
    return {
      ...file,
      syncStatus: "stored",
      fileStatus: "success",
      indexStatus: "stored",
    };
  }
  if (file.syncStatus === "loading" || file.syncStatus === "failed") return file;
  return {
    ...file,
    syncStatus: "linked",
    fileStatus: "linked",
    indexStatus: "linked",
    localBlobId: null,
  };
}

export function hubRecordsToStats(records) {
  const list = records ?? [];
  const storageMB = list.reduce(
    (sum, row) => sum + Math.max(1, Math.round((row.sizeKb ?? 1) / 1024)),
    0,
  );
  return {
    added: list.length,
    storageMB,
    collectionDelta: list.length > 0 ? 1 : 0,
  };
}

export const CLOUD_PROVIDER_LABELS = {
  onedrive: "OneDrive",
  "google-drive": "Google Drive",
  sharepoint: "SharePoint",
  dropbox: "Dropbox",
  confluence: "Confluence",
  box: "Box",
};

export function getHubFileSourceLabel(row) {
  if (row?.source === "cloud" && row.cloudProvider) {
    return CLOUD_PROVIDER_LABELS[row.cloudProvider] ?? row.cloudProvider;
  }
  if (row?.source === "user" || row?.source === "upload") return "Local";
  return "—";
}

export const DEFAULT_ONEDRIVE_CONNECTION = {
  provider: "onedrive",
  id: "od-default",
  name: "Elsa's OneDrive connection",
  connectedBy: "Elsa",
  connectedAt: "10 Dec 2025 12:00",
};

export const DEFAULT_GOOGLE_DRIVE_CONNECTION = {
  provider: "google-drive",
  id: "gd-default",
  name: "Elsa's Google Drive connection",
  connectedBy: "Elsa",
  connectedAt: "18 Nov 2025 12:00",
};

/** Starter OneDrive files for empty hubs (prototype demo). */
export const DEFAULT_ONEDRIVE_PICKER_FILES = [
  { id: "def-f1", name: "QuantumLeap.pdf", size: "7.4 MB", type: "file" },
  { id: "def-f2", name: "Onboarding.pdf", size: "1.2 MB", type: "file" },
  { id: "def-f3", name: "ReleaseNotes.docx", size: "240 KB", type: "file" },
];

export function buildDefaultCloudContent(hubId) {
  const connection = { ...DEFAULT_ONEDRIVE_CONNECTION, id: `od-default-${hubId}` };
  const userFiles = DEFAULT_ONEDRIVE_PICKER_FILES.map((f) => ({
    ...cloudFileToHubRecord(f, hubId, {
      provider: "onedrive",
      connectionId: connection.id,
      connectionName: connection.name,
    }),
    isSampleDemo: true,
  }));
  const stats = hubRecordsToStats(userFiles);
  return {
    cloudConnections: [connection],
    userFiles,
    files: stats.added,
    collections: stats.collectionDelta,
    storageMB: stats.storageMB,
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
    .map((f) => migrateCloudFileRecord({
      ...f,
      source: f.source ?? "user",
      indexStatus: f.indexStatus ?? (f.source === "cloud" ? "linked" : "stored"),
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
    const visibleUserFiles = userFiles.filter((f) => !f.isSampleDemo);
    return {
      userFiles: visibleUserFiles,
      demoFiles: [],
      allFiles: visibleUserFiles,
      totalListed: visibleUserFiles.length,
      totalReported: visibleUserFiles.length,
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
  return row?.source === "user" || row?.source === "cloud";
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

/**
 * File sync status for the hub table icon column.
 * Cloud: linked → loading → success | failed. Uploads: success.
 */
export function getHubFileStatus(row, { includeDemoStatuses = false } = {}) {
  if (row?.source === "user") return "success";
  if (row?.source === "cloud") {
    const sync = row.syncStatus ?? row.fileStatus;
    if (sync === "loading") return "loading";
    if (sync === "failed") return "failed";
    if (sync === "stored" || row.localBlobId) return "success";
    return "linked";
  }
  if (!includeDemoStatuses) return "success";
  const demo = row.fileStatus || "success";
  if (demo === "processing") return "loading";
  return demo;
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

function resolveCloudImport(oneDriveImport, cloudImport) {
  if (cloudImport?.selectedFiles?.length) return cloudImport;
  if (oneDriveImport?.selectedFiles?.length) {
    return { ...oneDriveImport, provider: oneDriveImport.provider ?? "onedrive" };
  }
  return null;
}

export function createHubPayload({
  name,
  description = "",
  pendingFile = null,
  pendingFiles = null,
  oneDriveImport = null,
  cloudImport = null,
  /** When true, do not inject demo OneDrive rows (e.g. hub will link library docs). */
  skipDefaultContent = false,
}) {
  const today = formatIsoDateToday();
  const id = Date.now();
  const uploadList = pendingFiles?.length
    ? Array.from(pendingFiles)
    : pendingFile
      ? [pendingFile]
      : [];
  const uploadRecords = uploadList.map((f) => fileToHubRecord(f, id));

  const importData = resolveCloudImport(oneDriveImport, cloudImport);
  const provider = importData?.provider ?? importData?.connection?.provider ?? "onedrive";
  const providerLabel = CLOUD_PROVIDER_LABELS[provider] ?? provider;

  const cloudPickerFiles = (importData?.selectedFiles ?? []).filter(
    (f) => f.type !== "folder",
  );
  const cloudRecords = cloudPickerFiles.map((f) =>
    cloudFileToHubRecord(f, id, {
      provider,
      connectionId: importData?.connection?.id ?? null,
      connectionName:
        importData?.connectionName ?? importData?.connection?.name ?? `${providerLabel} connection`,
    }),
  );

  let userFiles = [...uploadRecords, ...cloudRecords];
  let cloudConnections = importData?.connection
    ? [
        {
          provider,
          id: importData.connection.id,
          name:
            importData.connectionName ??
            importData.connection.name ??
            `${providerLabel} connection`,
          connectedBy: importData.connection.connectedBy ?? null,
          connectedAt: importData.connection.connectedAt ?? today,
        },
      ]
    : [];

  let files = userFiles.length;
  let collections = userFiles.length > 0 ? 1 : 0;
  let storageMB =
    filesToHubStats(uploadList).storageMB + hubRecordsToStats(cloudRecords).storageMB;

  if (userFiles.length === 0 && !skipDefaultContent) {
    const defaults = buildDefaultCloudContent(id);
    userFiles = defaults.userFiles;
    cloudConnections = defaults.cloudConnections;
    files = defaults.files;
    collections = defaults.collections;
    storageMB = defaults.storageMB;
  }

  return {
    id,
    name: name.trim(),
    description: description.trim(),
    files,
    collections,
    storageMB,
    provider: PROVIDER_LABEL,
    createdOn: today,
    createdAt: new Date().toISOString(),
    updated: "Just now",
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    owner: { name: "You", email: "you@workspace.local", role: "Owner" },
    usedBy: 0,
    visibility: "private",
    status: "draft",
    tags: [],
    isUserCreated: true,
    userFiles,
    cloudConnections,
    members: [
      {
        id: `m-${id}-owner`,
        principalType: "user",
        name: "You",
        email: "you@workspace.local",
        role: "owner",
        memberCount: null,
        addedByName: "You",
        addedAt: new Date().toISOString(),
      },
    ],
    assets: [],
    pendingFileName: userFiles[0]?.name ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge assets (AI-generated outputs that belong to the hub)
// ─────────────────────────────────────────────────────────────────────────────

/** Generated-asset taxonomy. Sources are *inputs*; assets are *outputs*. */
export const ASSET_TYPES = {
  note: { label: "Note", plural: "Notes", accent: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  summary: { label: "Summary", plural: "Summaries", accent: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  report: { label: "Report", plural: "Reports", accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  insight: { label: "Insight", plural: "Insights", accent: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" },
  document: { label: "Document", plural: "Documents", accent: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  presentation: { label: "Presentation", plural: "Presentations", accent: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  mindmap: { label: "Mind Map", plural: "Mind Maps", accent: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  flashcards: { label: "Flashcards", plural: "Flashcards", accent: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  datatable: { label: "Data Table", plural: "Data Tables", accent: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
};

export const ASSET_TYPE_ORDER = [
  "note",
  "summary",
  "report",
  "insight",
  "document",
  "presentation",
  "mindmap",
  "flashcards",
  "datatable",
];

export function assetTypeLabel(type) {
  return ASSET_TYPES[type]?.label ?? "Asset";
}

const DEFAULT_HUB_OWNER = { name: "You", email: "you@workspace.local", role: "Owner" };

function shortId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function firstLine(text, max = 120) {
  const line = String(text ?? "").trim().split("\n").find((l) => l.trim()) ?? "";
  const clean = line.replace(/^#+\s*/, "").replace(/[*_>`]/g, "").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * Build a hub-owned Knowledge Asset. Generated outputs auto-save through this —
 * there is no manual "save" step. `actor` is the signed-in user.
 */
export function createHubAsset({
  type = "note",
  title = "",
  body = "",
  excerpt = "",
  sources = [],
  sourceFileIds = [],
  origin = "ai",
  actor = null,
} = {}) {
  const now = new Date().toISOString();
  const resolvedTitle = title.trim() || firstLine(body) || `${assetTypeLabel(type)} ${now.slice(0, 10)}`;
  return {
    id: shortId("asset"),
    type: ASSET_TYPES[type] ? type : "note",
    title: resolvedTitle,
    excerpt: excerpt.trim() || firstLine(body, 160),
    body,
    status: "active",
    pinned: false,
    origin,
    sources,
    sourceFileIds,
    createdByName: actor?.name ?? DEFAULT_HUB_OWNER.name,
    createdByEmail: actor?.email ?? DEFAULT_HUB_OWNER.email,
    createdAt: now,
    updatedAt: now,
  };
}

/** Active / pinned / archived rollups for header chips and filters. */
export function summarizeHubAssets(hub) {
  const assets = hub?.assets ?? [];
  let active = 0;
  let pinned = 0;
  let archived = 0;
  for (const a of assets) {
    if (a.status === "archived") archived += 1;
    else {
      active += 1;
      if (a.pinned) pinned += 1;
    }
  }
  return { total: assets.length, active, pinned, archived };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hub membership (sharing happens only at the hub level)
// ─────────────────────────────────────────────────────────────────────────────

/** Build a member record for a user, team, or department. */
export function createHubMember({
  principalType = "user",
  name,
  email = null,
  role = "viewer",
  memberCount = null,
  actor = null,
} = {}) {
  return {
    id: shortId(principalType === "user" ? "u" : principalType === "team" ? "t" : "d"),
    principalType,
    name: name?.trim() ?? "",
    email: email?.trim() ?? null,
    role,
    memberCount,
    addedByName: actor?.name ?? DEFAULT_HUB_OWNER.name,
    addedAt: new Date().toISOString(),
  };
}

function hashSeed(value) {
  let h = 0;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const DEMO_PEOPLE = [
  { name: "Sarah Chen", email: "sarah.chen@aziro.com" },
  { name: "Marcus Reid", email: "marcus.reid@aziro.com" },
  { name: "Priya Nair", email: "priya.nair@aziro.com" },
  { name: "Tom Alvarez", email: "tom.alvarez@aziro.com" },
  { name: "Lena Brooks", email: "lena.brooks@aziro.com" },
];
const DEMO_TEAMS = ["Platform Engineering", "Data Science", "Customer Success", "Marketing Ops"];
const DEMO_DEPTS = ["Engineering", "Operations", "Revenue"];
const DEMO_ROLES = ["editor", "contributor", "contributor", "viewer", "viewer"];

/** Deterministic demo members so seed hubs show a populated Members tab. */
function buildDemoMembers(hub) {
  const seed = hashSeed(`m-${hub.id}`);
  const owner = hub.owner ?? DEFAULT_HUB_OWNER;
  const members = [
    {
      id: `m-${hub.id}-owner`,
      principalType: "user",
      name: owner.name,
      email: owner.email,
      role: "owner",
      memberCount: null,
      addedByName: owner.name,
      addedAt: hub.createdAt ?? `${hub.createdOn}T09:00:00.000Z`,
    },
  ];
  const userCount = 2 + (seed % 3);
  for (let i = 0; i < userCount; i += 1) {
    const p = DEMO_PEOPLE[(seed + i) % DEMO_PEOPLE.length];
    members.push({
      id: `m-${hub.id}-u${i}`,
      principalType: "user",
      name: p.name,
      email: p.email,
      role: DEMO_ROLES[(seed + i) % DEMO_ROLES.length],
      memberCount: null,
      addedByName: owner.name,
      addedAt: hub.createdOn ? `${hub.createdOn}T10:00:00.000Z` : hub.createdAt,
    });
  }
  members.push({
    id: `m-${hub.id}-team`,
    principalType: "team",
    name: DEMO_TEAMS[seed % DEMO_TEAMS.length],
    email: null,
    role: "contributor",
    memberCount: 4 + (seed % 9),
    addedByName: owner.name,
    addedAt: hub.createdOn ? `${hub.createdOn}T11:00:00.000Z` : hub.createdAt,
  });
  if (seed % 2 === 0) {
    members.push({
      id: `m-${hub.id}-dept`,
      principalType: "department",
      name: DEMO_DEPTS[seed % DEMO_DEPTS.length],
      email: null,
      role: "viewer",
      memberCount: 12 + (seed % 40),
      addedByName: owner.name,
      addedAt: hub.createdOn ? `${hub.createdOn}T11:30:00.000Z` : hub.createdAt,
    });
  }
  return members;
}

const DEMO_ASSET_TEMPLATES = [
  { type: "summary", title: (h) => `Executive summary — ${h.name}` },
  { type: "report", title: (h) => `Coverage report: ${h.name} sources` },
  { type: "insight", title: () => `Insight: recurring themes & gaps` },
  { type: "note", title: () => `Onboarding walkthrough notes` },
  { type: "document", title: () => `Draft FAQ from connected sources` },
  { type: "presentation", title: (h) => `${h.name} overview deck` },
  { type: "summary", title: () => `Weekly digest of new sources` },
  { type: "note", title: () => `Key decisions & open questions` },
];

/** Deterministic demo assets so seed hubs show a populated Knowledge tab at scale. */
function buildDemoAssets(hub) {
  const seed = hashSeed(`a-${hub.id}`);
  const count = Math.min(36, Math.max(5, Math.round((hub.files ?? 8) / 3) + 4));
  const owner = hub.owner ?? DEFAULT_HUB_OWNER;
  const rawDate = hub.createdAt ?? (hub.createdOn ? `${hub.createdOn}T12:00:00.000Z` : null);
  const parsedTime = rawDate ? new Date(rawDate).getTime() : NaN;
  const baseTime = Number.isNaN(parsedTime) ? Date.now() - 30 * 24 * 3600 * 1000 : parsedTime;
  const assets = [];
  for (let i = 0; i < count; i += 1) {
    const tpl = DEMO_ASSET_TEMPLATES[(seed + i) % DEMO_ASSET_TEMPLATES.length];
    const author = i % 3 === 0 ? owner : DEMO_PEOPLE[(seed + i) % DEMO_PEOPLE.length];
    const at = new Date(baseTime + i * 5400000 + (seed % 7) * 3600000).toISOString();
    const archived = i % 7 === 6;
    const pinned = !archived && i % 9 === 1;
    assets.push({
      id: `a-${hub.id}-${i}`,
      type: tpl.type,
      title: tpl.title(hub),
      excerpt:
        "Auto-generated from this hub's connected sources by Ask AI. All members with access can read and build on it.",
      body: "",
      status: archived ? "archived" : "active",
      pinned,
      origin: i % 4 === 0 ? "ask-ai" : "studio",
      sources: [],
      sourceFileIds: [],
      createdByName: author.name,
      createdByEmail: author.email,
      createdAt: at,
      updatedAt: at,
    });
  }
  return assets;
}

export const KNOWLEDGE_HUBS_STORAGE_KEY = "aziron_knowledge_hubs_v2";

/** Ensure user-created hubs without files show default OneDrive content. */
export function normalizeHubs(hubs) {
  if (!Array.isArray(hubs)) return hubs;
  return hubs.map((hub) => {
    let next = hub;
    if (hub.isUserCreated === true && (hub.userFiles ?? []).length === 0) {
      const defaults = buildDefaultCloudContent(hub.id);
      next = {
        ...hub,
        userFiles: defaults.userFiles,
        cloudConnections: defaults.cloudConnections,
        files: defaults.files,
        collections: defaults.collections,
        storageMB: defaults.storageMB,
      };
    }
    // Backfill membership + generated-asset demo data onto seed hubs only.
    // `undefined` (never set) is the trigger; an empty [] is respected so a
    // user can archive/remove everything without it reappearing.
    if (!next.isUserCreated) {
      if (next.members === undefined) next = { ...next, members: buildDemoMembers(next) };
      if (next.assets === undefined) next = { ...next, assets: buildDemoAssets(next) };
    } else {
      if (next.members === undefined) {
        next = { ...next, members: [{ ...(next.owner ?? DEFAULT_HUB_OWNER), id: `m-${next.id}-owner`, principalType: "user", role: "owner", memberCount: null }] };
      }
      if (next.assets === undefined) next = { ...next, assets: [] };
    }
    const userFiles = (next.userFiles ?? []).map(migrateCloudFileRecord);
    return userFiles.length > 0 ? { ...next, userFiles } : next;
  });
}

export function loadHubsFromStorage() {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_HUBS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeHubs(parsed) : null;
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
