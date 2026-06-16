/**
 * Source taxonomy — category (Files | DBs | APIs) sits above legacy `source` values.
 * Every library/hub record should carry `category` + `kind`; resolvers infer them when absent.
 */

import { CLOUD_PROVIDER_LABELS, FILE_LIFECYCLE_META, resolveFileLifecycleStatus } from "@/lib/fileSyncStatus";

export const SOURCE_CATEGORIES = {
  files: { id: "files", label: "Files", icon: "file" },
  dbs: { id: "dbs", label: "DBs", icon: "database" },
  apis: { id: "apis", label: "APIs", icon: "api" },
};

export const SOURCE_KINDS = {
  // Files
  "local-upload": { id: "local-upload", label: "Local upload", category: "files" },
  "cloud-storage": { id: "cloud-storage", label: "Cloud storage", category: "files" },
  // DBs
  sql: { id: "sql", label: "SQL", category: "dbs" },
  nosql: { id: "nosql", label: "NoSQL", category: "dbs" },
  // APIs
  "rest-graphql": { id: "rest-graphql", label: "REST / GraphQL", category: "apis" },
  webhook: { id: "webhook", label: "Hook / Webhook", category: "apis" },
};

const DB_PROVIDERS = {
  postgresql: { id: "postgresql", label: "PostgreSQL", kind: "sql" },
  mysql: { id: "mysql", label: "MySQL", kind: "sql" },
  mongodb: { id: "mongodb", label: "MongoDB", kind: "nosql" },
};

const API_PROVIDERS = {
  rest: { id: "rest", label: "REST API", kind: "rest-graphql" },
  graphql: { id: "graphql", label: "GraphQL", kind: "rest-graphql" },
  webhook: { id: "webhook", label: "Webhook", kind: "webhook" },
};

const FILE_CLOUD_PROVIDERS = new Set([
  "onedrive",
  "google-drive",
  "sharepoint",
  "dropbox",
  "aws-s3",
  "box",
  "confluence",
]);

export const CATEGORY_FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "files", label: "Files" },
  { id: "dbs", label: "DBs" },
  { id: "apis", label: "APIs" },
];

/** Connectors shown in the Add sources → DBs tab */
export const DB_SOURCE_CONNECTORS = [
  { id: "postgresql", label: "PostgreSQL", kind: "sql", enabled: true },
  { id: "mysql", label: "MySQL", kind: "sql", enabled: true },
  { id: "mongodb", label: "MongoDB", kind: "nosql", enabled: true },
];

/** Connectors shown in the Add sources → APIs tab */
export const API_SOURCE_CONNECTORS = [
  { id: "rest", label: "REST API", kind: "rest-graphql", enabled: true },
  { id: "graphql", label: "GraphQL", kind: "rest-graphql", enabled: false },
  { id: "webhook", label: "Webhook", kind: "webhook", enabled: true },
];

export function resolveSourceCategory(record) {
  if (record?.category && SOURCE_CATEGORIES[record.category]) {
    return record.category;
  }
  const provider = record?.provider ?? record?.cloudProvider ?? record?.dbProvider ?? record?.apiProvider;
  if (provider && DB_PROVIDERS[provider]) return "dbs";
  if (record?.kind && SOURCE_KINDS[record.kind]?.category) {
    return SOURCE_KINDS[record.kind].category;
  }
  if (record?.source === "api" || record?.source === "webhook") return "apis";
  if (record?.source === "database" || record?.source === "db") return "dbs";
  return "files";
}

export function resolveSourceKind(record) {
  if (record?.kind && SOURCE_KINDS[record.kind]) return record.kind;

  const category = resolveSourceCategory(record);
  const provider = record?.provider ?? record?.cloudProvider ?? record?.dbProvider ?? record?.apiProvider;

  if (category === "dbs") {
    if (provider && DB_PROVIDERS[provider]) return DB_PROVIDERS[provider].kind;
    return record?.source === "nosql" ? "nosql" : "sql";
  }

  if (category === "apis") {
    if (provider === "webhook" || record?.source === "webhook") return "webhook";
    return "rest-graphql";
  }

  if (record?.source === "user" || record?.source === "upload") return "local-upload";
  if (record?.source === "cloud" || (provider && FILE_CLOUD_PROVIDERS.has(provider))) {
    return "cloud-storage";
  }
  return "local-upload";
}

export function getSourceProviderLabel(record) {
  const category = resolveSourceCategory(record);
  const provider = record?.provider ?? record?.cloudProvider ?? record?.dbProvider ?? record?.apiProvider;

  if (category === "dbs" && provider && DB_PROVIDERS[provider]) {
    return DB_PROVIDERS[provider].label;
  }
  if (category === "apis") {
    if (provider && API_PROVIDERS[provider]) return API_PROVIDERS[provider].label;
    return record?.method ? `${record.method} API` : "REST API";
  }

  // Files — cloud or local
  if (record?.source === "cloud" || provider) {
    return CLOUD_PROVIDER_LABELS[provider] ?? record?.connectionName ?? "Cloud";
  }
  return "Local";
}

export function getSourceBadgeLabel(record) {
  return getSourceProviderLabel(record);
}

export function getSourceMetricDisplay(record) {
  const category = resolveSourceCategory(record);

  if (category === "dbs") {
    const rows = record?.rowCount ?? record?.docCount;
    if (rows != null) {
      const n = Number(rows);
      const formatted = Number.isFinite(n) ? n.toLocaleString() : String(rows);
      const unit = record?.kind === "nosql" || resolveSourceKind(record) === "nosql" ? "docs" : "rows";
      return { value: formatted, unit, label: `${formatted} ${unit}` };
    }
    return { value: "—", unit: null, label: "—" };
  }

  if (category === "apis") {
    const items = record?.itemCount ?? record?.responseItemCount;
    if (items != null) {
      const formatted = Number(items).toLocaleString();
      return { value: formatted, unit: "items", label: `${formatted} items` };
    }
    const sizeKb = record?.responseSizeKb ?? record?.sizeKb;
    if (sizeKb != null) return { value: sizeKb, unit: "kb", label: `${Math.round(sizeKb)} KB` };
    return { value: "—", unit: null, label: "—" };
  }

  const sizeKb = record?.sizeKb;
  if (sizeKb == null) return { value: "—", unit: null, label: "—" };
  if (sizeKb < 1024) return { value: sizeKb, unit: "kb", label: `${Math.round(sizeKb)} KB` };
  return { value: sizeKb, unit: "mb", label: `${(sizeKb / 1024).toFixed(1)} MB` };
}

export function getSourceMetricColumnLabel(categoryFilter = "all") {
  if (categoryFilter === "dbs") return "Rows";
  if (categoryFilter === "apis") return "Items";
  return "Size";
}

/** Lifecycle status key per category (maps to category-specific meta). */
export function resolveCategoryLifecycleStatus(record, { includeDemoStatuses = false } = {}) {
  const category = resolveSourceCategory(record);

  if (category === "dbs") {
    if (record?.schemaDrift) return "schema-drift";
    if (record?.snapshotMode) return "snapshot";
    if (record?.status === "error" || record?.connectionStatus === "error") return "error";
    return record?.liveConnection ? "live" : "snapshot";
  }

  if (category === "apis") {
    if (record?.lastFetchStatus >= 400) return "fetch-error";
    if (record?.stale) return "stale";
    if (record?.status === "fetching") return "fetching";
    return "fetched";
  }

  return resolveFileLifecycleStatus(record, { includeDemoStatuses });
}

export const CATEGORY_LIFECYCLE_META = {
  dbs: {
    live: { label: "Live", message: "Connected — querying live data", badgeVariant: "default" },
    snapshot: { label: "Snapshot", message: "Point-in-time snapshot", badgeVariant: "secondary" },
    "schema-drift": { label: "Schema drift", message: "Schema changed since last sync", badgeVariant: "outline" },
    error: { label: "Connection error", message: "Cannot reach database", badgeVariant: "destructive" },
  },
  apis: {
    fetched: { label: "Fetched", message: "Last fetch succeeded", badgeVariant: "default" },
    stale: { label: "Stale", message: "Data older than refresh cadence", badgeVariant: "outline" },
    fetching: { label: "Fetching…", message: "Refreshing from endpoint", badgeVariant: "secondary" },
    "fetch-error": { label: "Fetch error", message: "Last request failed", badgeVariant: "destructive" },
  },
};

export function getSourceLifecycleMeta(file, options = {}) {
  const category = resolveSourceCategory(file);
  if (category !== "files") {
    const status = resolveCategoryLifecycleStatus(file, options);
    const meta = CATEGORY_LIFECYCLE_META[category]?.[status];
    return {
      status,
      label: meta?.label ?? status,
      message: meta?.message ?? "",
      badgeVariant: meta?.badgeVariant ?? "secondary",
    };
  }
  const status = resolveFileLifecycleStatus(file, options);
  return { status, ...FILE_LIFECYCLE_META[status] };
}
