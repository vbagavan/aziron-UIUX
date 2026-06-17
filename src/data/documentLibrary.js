import {
  cloudFileToHubRecord,
  fileToHubRecord,
  formatIsoDateToday,
  inferHubFileType,
  parseDisplaySizeToKb,
} from "@/data/knowledgeHubs";
import { createPendingHubFileMetadata } from "@/components/features/knowledge/hubFileMetadata";
import { createPendingSourceGuide } from "@/components/features/knowledge/hubSourceGuide";
import { isSingleHubSource } from "@/lib/sourceCategories";

export const DOCUMENT_LIBRARY_STORAGE_KEY = "aziron_document_library_v2";

const DEMO_NOW = "2026-06-10T09:30:00.000Z";
const DEMO_WEEK_AGO = "2026-06-03T14:00:00.000Z";

/** Fixed-id demo rows for DBs and APIs category tabs (merged once if missing). */
export const DEMO_CATEGORY_LIBRARY_SOURCES = [
  {
    id: "demo-db-postgres-customers",
    name: "customers",
    type: "Database",
    category: "dbs",
    kind: "sql",
    dbProvider: "postgresql",
    provider: "postgresql",
    connectionName: "production-db",
    schema: "public",
    tableName: "customers",
    rowCount: 12403,
    source: "database",
    liveConnection: true,
    sizeKb: null,
    uploadedAt: DEMO_NOW,
    created: DEMO_WEEK_AGO,
    updated: "2 days ago",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [{ hubId: 2, hubFileId: "demo-link-db-1", hubName: "Database Hub" }],
  },
  {
    id: "demo-db-postgres-orders",
    name: "orders",
    type: "Database",
    category: "dbs",
    kind: "sql",
    dbProvider: "postgresql",
    provider: "postgresql",
    connectionName: "production-db",
    schema: "public",
    tableName: "orders",
    rowCount: 188920,
    source: "database",
    liveConnection: true,
    uploadedAt: DEMO_NOW,
    created: DEMO_WEEK_AGO,
    updated: "2 days ago",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [{ hubId: 2, hubFileId: "demo-link-db-2", hubName: "Database Hub" }],
  },
  {
    id: "demo-db-mongo-pageviews",
    name: "pageviews",
    type: "Database",
    category: "dbs",
    kind: "nosql",
    dbProvider: "mongodb",
    provider: "mongodb",
    connectionName: "analytics",
    databaseName: "events",
    collectionName: "pageviews",
    docCount: 2100000,
    rowCount: 2100000,
    source: "database",
    snapshotMode: true,
    uploadedAt: "2026-06-08T11:00:00.000Z",
    created: DEMO_WEEK_AGO,
    updated: "Yesterday",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [{ hubId: 2, hubFileId: "demo-link-db-3", hubName: "Database Hub" }],
  },
  {
    id: "demo-db-mysql-inventory",
    name: "inventory_items",
    type: "Database",
    category: "dbs",
    kind: "sql",
    dbProvider: "mysql",
    provider: "mysql",
    connectionName: "warehouse-db",
    schema: "inventory",
    tableName: "inventory_items",
    rowCount: 45210,
    source: "database",
    schemaDrift: true,
    uploadedAt: "2026-06-01T08:00:00.000Z",
    created: "2026-05-15T10:00:00.000Z",
    updated: "1 week ago",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [],
  },
  {
    id: "demo-api-acme-tickets",
    name: "acme-tickets",
    type: "API",
    category: "apis",
    kind: "rest-graphql",
    apiProvider: "rest",
    provider: "rest",
    method: "GET",
    endpointUrl: "https://api.acme.com/v1/tickets",
    connectionName: "Acme CRM",
    itemCount: 240,
    responseSizeKb: 14,
    refreshCadence: "6h",
    lastFetchStatus: 200,
    lastFetchedAt: DEMO_NOW,
    source: "api",
    uploadedAt: DEMO_NOW,
    created: DEMO_WEEK_AGO,
    updated: "4h ago",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [{ hubId: 3, hubFileId: "demo-link-api-1", hubName: "API Hub" }],
  },
  {
    id: "demo-api-stripe-charges",
    name: "stripe-charges",
    type: "API",
    category: "apis",
    kind: "rest-graphql",
    apiProvider: "rest",
    provider: "rest",
    method: "GET",
    endpointUrl: "https://api.stripe.com/v1/charges",
    connectionName: "Stripe production",
    itemCount: 1842,
    responseSizeKb: 96,
    refreshCadence: "24h",
    stale: true,
    lastFetchStatus: 200,
    lastFetchedAt: "2026-06-08T06:00:00.000Z",
    source: "api",
    uploadedAt: "2026-06-05T12:00:00.000Z",
    created: "2026-05-20T09:00:00.000Z",
    updated: "2 days ago",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [{ hubId: 3, hubFileId: "demo-link-api-2", hubName: "API Hub" }],
  },
  {
    id: "demo-api-crm-webhook",
    name: "crm-events-webhook",
    type: "API",
    category: "apis",
    kind: "webhook",
    apiProvider: "webhook",
    provider: "webhook",
    method: "POST",
    endpointUrl: "https://hooks.aziron.dev/inbound/crm-events",
    connectionName: "Inbound CRM hook",
    itemCount: 58,
    responseSizeKb: 8,
    refreshCadence: "manual",
    lastFetchStatus: 200,
    lastFetchedAt: DEMO_NOW,
    source: "webhook",
    uploadedAt: DEMO_NOW,
    created: DEMO_WEEK_AGO,
    updated: "Just now",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [{ hubId: 3, hubFileId: "demo-link-api-3", hubName: "API Hub" }],
  },
  {
    id: "demo-api-github-issues",
    name: "github-open-issues",
    type: "API",
    category: "apis",
    kind: "rest-graphql",
    apiProvider: "rest",
    provider: "rest",
    method: "GET",
    endpointUrl: "https://api.github.com/repos/acme/platform/issues",
    connectionName: "GitHub",
    itemCount: 37,
    responseSizeKb: 22,
    refreshCadence: "1h",
    lastFetchStatus: 403,
    source: "api",
    uploadedAt: "2026-06-09T16:00:00.000Z",
    created: DEMO_WEEK_AGO,
    updated: "6h ago",
    indexStatus: "stored",
    fileStatus: "failed",
    hubLinks: [],
  },
];

export function mergeDemoCategorySources(documents = []) {
  const ids = new Set(documents.map((d) => d.id));
  const missing = DEMO_CATEGORY_LIBRARY_SOURCES.filter((d) => !ids.has(d.id));
  if (missing.length === 0) return documents;
  return [...documents, ...missing];
}

/** Demo DB connections shown in Add sources → DBs. */
export const DEMO_DB_CONNECTIONS = [
  {
    id: "production-db",
    name: "production-db",
    providerLabel: "PostgreSQL",
    provider: "postgresql",
    tableCount: 124,
  },
  {
    id: "analytics",
    name: "analytics",
    providerLabel: "MongoDB",
    provider: "mongodb",
    tableCount: 18,
  },
  {
    id: "warehouse-db",
    name: "warehouse-db",
    providerLabel: "MySQL",
    provider: "mysql",
    tableCount: 42,
  },
];

/** Demo tables per connection for browse-and-add flow. */
export const DEMO_DB_TABLES_BY_CONNECTION = {
  "production-db": [
    { tableName: "customers", schema: "public", rowCount: 12403 },
    { tableName: "orders", schema: "public", rowCount: 188920 },
  ],
  analytics: [
    { tableName: "pageviews", databaseName: "events", collectionName: "pageviews", rowCount: 2100000 },
  ],
  "warehouse-db": [
    { tableName: "inventory_items", schema: "inventory", rowCount: 45210 },
  ],
};

function slugFromUrl(url) {
  try {
    const path = new URL(url).pathname.split("/").filter(Boolean);
    return path[path.length - 1] ?? "api-source";
  } catch {
    return url.replace(/^https?:\/\//, "").split("/").pop() ?? "api-source";
  }
}

export function createApiLibraryRecord({
  method = "GET",
  url,
  auth = "bearer",
  refreshCadence = "6h",
  itemCount = null,
  responseSizeKb = null,
  kind = "rest-graphql",
  provider = "rest",
}) {
  const name = slugFromUrl(url);
  const isWebhook = kind === "webhook" || provider === "webhook";
  return {
    id: createLibraryDocumentId(),
    name,
    type: "API",
    category: "apis",
    kind: isWebhook ? "webhook" : kind,
    apiProvider: isWebhook ? "webhook" : provider,
    provider: isWebhook ? "webhook" : provider,
    method,
    endpointUrl: url,
    connectionName: isWebhook ? "Inbound webhook" : "REST API",
    itemCount: itemCount ?? 0,
    responseSizeKb: responseSizeKb ?? 0,
    refreshCadence,
    authType: auth,
    lastFetchStatus: 200,
    lastFetchedAt: new Date().toISOString(),
    source: isWebhook ? "webhook" : "api",
    uploadedAt: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: "Just now",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [],
  };
}

export function createDbLibraryRecord({
  provider = "postgresql",
  connectionName,
  tableName,
  schema = "public",
  databaseName,
  collectionName,
  rowCount = 0,
}) {
  const isNoSql = provider === "mongodb";
  return {
    id: createLibraryDocumentId(),
    name: tableName,
    type: "Database",
    category: "dbs",
    kind: isNoSql ? "nosql" : "sql",
    dbProvider: provider,
    provider,
    connectionName: connectionName ?? "database",
    schema: isNoSql ? undefined : schema,
    tableName: isNoSql ? undefined : tableName,
    databaseName: isNoSql ? databaseName : undefined,
    collectionName: isNoSql ? collectionName ?? tableName : undefined,
    rowCount,
    source: "database",
    liveConnection: true,
    uploadedAt: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: "Just now",
    indexStatus: "stored",
    fileStatus: "success",
    hubLinks: [],
  };
}

const LIBRARY_HUB_ID = 0;

export function createLibraryDocumentId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Map a browser File to a library document row. */
export function fileToLibraryRecord(file) {
  const base = fileToHubRecord(file, LIBRARY_HUB_ID);
  return {
    ...base,
    id: createLibraryDocumentId(),
    uploadedAt: new Date().toISOString(),
    created: new Date().toISOString(),
    hubLinks: [],
  };
}

/** Map a cloud picker row to a library document record. */
export function cloudFileToLibraryRecord(
  pickerFile,
  { provider = "onedrive", connectionId = null, connectionName = null } = {},
) {
  const base = cloudFileToHubRecord(pickerFile, LIBRARY_HUB_ID, {
    provider,
    connectionId,
    connectionName,
  });
  return {
    ...base,
    id: createLibraryDocumentId(),
    hubLinks: [],
  };
}

export function resolveCloudImportToLibraryRecords(cloudImport) {
  if (!cloudImport?.selectedFiles?.length) return [];
  const provider = cloudImport.provider ?? cloudImport.connection?.provider ?? "onedrive";
  const connectionId = cloudImport.connection?.id ?? null;
  const connectionName =
    cloudImport.connectionName ??
    cloudImport.connection?.name ??
    (provider === "google-drive" ? "Google Drive connection" : "OneDrive connection");

  return cloudImport.selectedFiles
    .filter((f) => f && f.type !== "folder")
    .map((f) =>
      cloudFileToLibraryRecord(f, {
        provider,
        connectionId,
        connectionName,
      }),
    );
}

/** Hub associations for a library document (from stored links + live hub scan). */
export function getHubLinksForDocument(documentId, hubs = [], documents = []) {
  const links = [];
  let sampleRecord = documents.find((d) => d.id === documentId);

  for (const hub of hubs) {
    for (const file of hub.userFiles ?? []) {
      if (file.libraryDocumentId === documentId) {
        sampleRecord = sampleRecord ?? file;
        links.push({
          hubId: hub.id,
          hubFileId: file.id,
          hubName: hub.name,
        });
      }
    }
  }

  if (sampleRecord && isSingleHubSource(sampleRecord) && links.length > 1) {
    return links.slice(0, 1);
  }

  return links;
}

export function loadDocumentsFromStorage() {
  try {
    const raw = localStorage.getItem(DOCUMENT_LIBRARY_STORAGE_KEY);
    if (!raw) return mergeDemoCategorySources([]);
    const parsed = JSON.parse(raw);
    const stored = Array.isArray(parsed) ? parsed : [];
    return mergeDemoCategorySources(stored);
  } catch {
    return mergeDemoCategorySources([]);
  }
}

export function saveDocumentsToStorage(documents) {
  try {
    localStorage.setItem(DOCUMENT_LIBRARY_STORAGE_KEY, JSON.stringify(documents));
  } catch {
    /* quota / private mode */
  }
}

export function libraryRecordToHubFile(libraryDoc, hubId) {
  const hubFileId = `kh${hubId}-link-${libraryDoc.id}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...libraryDoc,
    id: hubFileId,
    libraryDocumentId: libraryDoc.id,
    updated: "Just now",
    uploadedAt: libraryDoc.uploadedAt ?? formatIsoDateToday(),
    metadata: libraryDoc.metadata ?? createPendingHubFileMetadata(libraryDoc.name),
    sourceGuide: libraryDoc.sourceGuide ?? createPendingSourceGuide(),
  };
}

/**
 * Link a library document to a hub. APIs/databases unlink from other hubs first.
 * @returns {{ hubs: object[], alreadyLinked: boolean, moved: boolean, hubFileId?: string }}
 */
export function applyLibraryDocumentHubLink(prevHubs, { libraryDoc, documentId, targetId }) {
  const exclusive = isSingleHubSource(libraryDoc);
  let alreadyLinked = false;
  let moved = false;
  let hubFileId;

  const hubs = prevHubs.map((h) => {
    const hid = Number(h.id);
    const prevUser = h.userFiles ?? [];
    const linkedHere = prevUser.some((f) => f.libraryDocumentId === documentId);

    if (hid === targetId) {
      if (linkedHere) {
        alreadyLinked = true;
        return h;
      }
      const hubFile = libraryRecordToHubFile(libraryDoc, targetId);
      hubFileId = hubFile.id;
      const userFiles = [...prevUser, hubFile];
      const addedKb = hubFile.sizeKb ?? 0;
      return {
        ...h,
        userFiles,
        files: userFiles.length,
        collections: userFiles.length > 0 ? 1 : 0,
        storageMB: (h.storageMB ?? 0) + Math.max(0, Math.round(addedKb / 1024)),
        updated: "Just now",
        isUserCreated: true,
      };
    }

    if (!exclusive || !linkedHere) return h;

    moved = true;
    const linked = prevUser.filter((f) => f.libraryDocumentId === documentId);
    const userFiles = prevUser.filter((f) => f.libraryDocumentId !== documentId);
    const storageDrop = linked.reduce(
      (sum, row) => sum + Math.max(0, Math.round((row.sizeKb ?? 0) / 1024)),
      0,
    );
    return {
      ...h,
      userFiles,
      files: Math.max(0, userFiles.length),
      storageMB: Math.max(0, (h.storageMB ?? 0) - storageDrop),
      updated: "Just now",
    };
  });

  return { hubs, alreadyLinked, moved, hubFileId };
}

/** Ensure demo library rows with hubLinks metadata appear as hub file links. */
export function syncDemoCategoryHubLinks(hubs, documents = []) {
  if (!documents.length) return hubs;

  return hubs.map((hub) => {
    let userFiles = [...(hub.userFiles ?? [])];
    let changed = false;

    for (const doc of documents) {
      const metaLinks =
        DEMO_CATEGORY_LIBRARY_SOURCES.find((d) => d.id === doc.id)?.hubLinks ??
        doc.hubLinks ??
        [];

      for (const link of metaLinks) {
        if (Number(link.hubId) !== Number(hub.id)) continue;
        if (userFiles.some((f) => f.libraryDocumentId === doc.id)) continue;

        const hubFile = libraryRecordToHubFile(doc, hub.id);
        hubFile.id = link.hubFileId ?? hubFile.id;
        userFiles.push(hubFile);
        changed = true;
      }
    }

    if (!changed) return hub;
    return {
      ...hub,
      userFiles,
      files: userFiles.length,
      updated: "Just now",
    };
  });
}

export function formatLibraryCloudImport(cloudImport) {
  if (!cloudImport?.selectedFiles?.length) return null;
  const provider = cloudImport.provider ?? "onedrive";
  return {
    provider,
    connection: cloudImport.connection ?? null,
    connectionName: cloudImport.connectionName ?? null,
    authMethod: cloudImport.authMethod,
    selectedFiles: cloudImport.selectedFiles,
  };
}

export function inferLibraryDisplayType(name, mimeType) {
  return inferHubFileType(name, mimeType);
}

export function pickerSizeToKb(sizeStr) {
  return parseDisplaySizeToKb(sizeStr);
}
