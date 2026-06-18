/**
 * Step orchestration + record building for the Add Source wizard.
 *
 * `FLOW_STEPS` defines the ordered step keys per source type (the leading
 * "choose-type" step and the terminal success screen are handled by the
 * orchestrator). `buildSourceRecords` turns the collected wizard state into
 * library records using the same factories the rest of the app consumes.
 */

import {
  createDbLibraryRecord,
  createLibraryDocumentId,
  inferLibraryDisplayType,
} from "@/data/documentLibrary";
import {
  DB_DISCOVERY,
  DEFAULT_API_OBJECTS,
  getApiType,
  getDatabaseProvider,
} from "@/data/addSourceCatalog";

/** Ordered step keys per source type (after Step 1 "choose-type"). */
export const FLOW_STEPS = {
  files: ["files-intake"],
  databases: ["db-select", "db-connect", "db-data"],
  apis: ["api-type", "api-connect", "api-objects"],
};

/** Approximate wizard length shown on the source-type chooser. */
export const SOURCE_TYPE_STEP_HINTS = {
  files: "~1–3 steps",
  databases: "~3 steps",
  apis: "~3 steps",
};

export const STEP_META = {
  "choose-type": { title: "Add a source", subtitle: "Choose a category, then connect or configure your source." },

  // Files (local upload + cloud storage)
  "files-intake": {
    title: "Add files",
    subtitle: "Upload from your computer or connect cloud storage",
  },
  upload: { title: "Upload files", subtitle: "Drag & drop or browse from your computer" },
  processing: { title: "Processing", subtitle: "Indexing your files and extracting metadata" },

  // Cloud (sub-flow under Files)
  "cloud-provider": { title: "Choose cloud source", subtitle: "Pick a connected storage provider" },
  "cloud-connect": { title: "Connect account", subtitle: "Authorize Aziron to read your files" },
  "cloud-browse": { title: "Browse content", subtitle: "Select files or folders to import" },
  "cloud-sync": { title: "Sync configuration", subtitle: "Choose what to import and how often" },

  // Database
  "db-select": { title: "Select database", subtitle: "Pick the engine you want to connect" },
  "db-connect": { title: "Connection", subtitle: "Enter connection details and test" },
  "db-discover": { title: "Discovery", subtitle: "Schemas and tables we found" },
  "db-data": { title: "Select data", subtitle: "Choose tables, views, or collections" },
  "db-ai": { title: "AI configuration", subtitle: "How records should be embedded" },
  "db-sync": { title: "Sync", subtitle: "Refresh strategy and cadence" },

  // API
  "api-type": { title: "API type", subtitle: "What kind of API are you connecting?" },
  "api-connect": { title: "Connection", subtitle: "Base URL and authentication" },
  "api-discover": { title: "Discover endpoints", subtitle: "Objects exposed by this API" },
  "api-objects": { title: "Select objects", subtitle: "Choose what becomes a source" },
  "api-sync": { title: "Sync strategy", subtitle: "When Aziron should fetch data" },
  "api-ai": { title: "AI configuration", subtitle: "Knowledge enrichment for responses" },
};

export function getFlowSteps(type) {
  return FLOW_STEPS[type] ?? [];
}

function getCloudTailSteps(state = {}) {
  const steps = [];
  if (!state.cloud?.provider) steps.push("cloud-provider");
  if (!state.cloud?.connected) steps.push("cloud-connect");
  steps.push("cloud-browse");
  return steps;
}

function getFilesWizardSteps(state = {}, skipChooseType = false) {
  if (state.files?.intakeMode === "cloud") {
    const flow = ["files-intake", ...getCloudTailSteps(state)];
    return skipChooseType ? flow.slice(1) : ["choose-type", ...flow];
  }
  const flow = ["files-intake"];
  return skipChooseType ? flow : ["choose-type", ...flow];
}

/** Full ordered key list for a type, including the leading choose-type step. */
export function getWizardSteps(type, state = {}) {
  if (type === "files") return getFilesWizardSteps(state, false);
  return type ? ["choose-type", ...getFlowSteps(type)] : ["choose-type"];
}

/**
 * Step list with optional context-aware exclusions.
 * - skipChooseType: omit "choose-type" when the caller pre-selects the source type
 */
export function getWizardStepsForContext(type, state = {}, { skipChooseType = false } = {}) {
  if (!type) return skipChooseType ? [] : ["choose-type"];
  if (type === "files") return getFilesWizardSteps(state, skipChooseType);
  const flowSteps = getFlowSteps(type);
  return skipChooseType ? [...flowSteps] : ["choose-type", ...flowSteps];
}

/** Apply recommended defaults when express connector steps are skipped. */
export function applyExpressDefaults(state) {
  const next = { ...state };

  if (state.type === "databases" && state.db?.tested) {
    const tables = flattenDbTables();
    const selected = state.db.selectedTableIds?.length
      ? state.db.selectedTableIds
      : tables.slice(0, 1).map((row) => row.key);
    next.db = {
      ...state.db,
      selectedTableIds: selected,
      embedStrategy: state.db.embedStrategy ?? "full",
      syncType: state.db.syncType ?? "incremental",
      syncFreq: state.db.syncFreq ?? "realtime",
    };
  }

  if (state.type === "apis" && state.api?.tested) {
    const objects = resolveDiscoverableObjects(state);
    const objectIds = state.api.objectIds?.length
      ? state.api.objectIds
      : objects.slice(0, 2).map((o) => o.id);
    next.api = {
      ...state.api,
      objectIds,
      fetchStrategy: state.api.fetchStrategy ?? "scheduled",
      schedule: state.api.schedule ?? "15m",
      ai: {
        knowledgeIndex: true,
        semanticSearch: true,
        entityGraph: true,
        ...state.api.ai,
      },
    };
  }

  return next;
}

// ─── Discovery helpers ───────────────────────────────────────────────────────

export function flattenDbTables() {
  const rows = [];
  for (const schema of DB_DISCOVERY.schemas) {
    for (const table of schema.tables) {
      rows.push({
        key: `${schema.id}/${table.id}`,
        schemaId: schema.id,
        schemaName: schema.name,
        tableId: table.id,
        tableName: table.name,
        rowCount: table.rowCount,
      });
    }
  }
  return rows;
}

export function getSelectedDbTables(selectedKeys = []) {
  const set = new Set(selectedKeys);
  return flattenDbTables().filter((row) => set.has(row.key));
}

/** Objects discoverable for the current API selection. */
export function resolveDiscoverableObjects(state) {
  return DEFAULT_API_OBJECTS;
}

function isFilesCloudIntake(state) {
  return state.type === "files" && state.files?.intakeMode === "cloud";
}

// ─── Record builders ─────────────────────────────────────────────────────────

function applyConfig(record, config) {
  if (!config) return record;
  const patch = {};
  if (config.description) patch.description = config.description;
  if (config.tags?.length) patch.tags = [...config.tags];
  if (config.visibility) patch.visibility = config.visibility;
  if (config.autoSync != null) patch.autoSync = config.autoSync;
  return { ...record, ...patch };
}

function buildCloudRecord({ provider, connectionName, name, sizeKb }, config) {
  const now = new Date().toISOString();
  return applyConfig(
    {
      id: createLibraryDocumentId(),
      name,
      type: inferLibraryDisplayType(name),
      category: "files",
      kind: "cloud-storage",
      source: "cloud",
      cloudProvider: provider,
      provider,
      connectionName,
      sizeKb: sizeKb ?? 0,
      syncStatus: "linked",
      uploadedAt: now,
      created: now,
      updated: "Just now",
      indexStatus: "stored",
      fileStatus: "success",
      hubLinks: [],
    },
    config,
  );
}

function buildApiRecord({ name, provider, kind, connectionName, endpointUrl, itemCount, method, auth, refreshCadence }, config) {
  const now = new Date().toISOString();
  const isWebhook = kind === "webhook";
  return applyConfig(
    {
      id: createLibraryDocumentId(),
      name,
      type: "API",
      category: "apis",
      kind: isWebhook ? "webhook" : "rest-graphql",
      apiProvider: provider,
      provider,
      method: method ?? "GET",
      endpointUrl,
      connectionName: connectionName ?? "REST API",
      itemCount: itemCount ?? 0,
      responseSizeKb: 0,
      refreshCadence: refreshCadence ?? "scheduled",
      authType: auth ?? "oauth2",
      lastFetchStatus: 200,
      lastFetchedAt: now,
      source: isWebhook ? "webhook" : "api",
      uploadedAt: now,
      created: now,
      updated: "Just now",
      indexStatus: "stored",
      fileStatus: "success",
      hubLinks: [],
    },
    config,
  );
}

/**
 * Turn collected wizard state into library records for non-upload flows.
 * (Local file uploads persist through the KnowledgeHub context's upload path.)
 */
export function buildSourceRecords(state) {
  const config = state.config;

  if (isFilesCloudIntake(state)) {
    const provider = state.cloud?.provider;
    const connectionName = `${cloudProviderLabel(provider)} connection`;
    return (state.cloud?.selected ?? []).map((file) =>
      buildCloudRecord(
        { provider, connectionName, name: file.name, sizeKb: file.sizeKb },
        config,
      ),
    );
  }

  if (state.type === "databases") {
    const provider = getDatabaseProvider(state.db?.provider);
    const connectionName = state.db?.connection?.name?.trim() || `${provider.label} database`;
    return getSelectedDbTables(state.db?.selectedTableIds).map((row) =>
      applyConfig(
        createDbLibraryRecord({
          provider: provider.id,
          connectionName,
          tableName: row.tableName,
          schema: row.schemaName,
          databaseName: connectionName,
          collectionName: row.tableName,
          rowCount: row.rowCount,
        }),
        config,
      ),
    );
  }

  if (state.type === "apis") {
    const apiType = getApiType(state.api?.apiType);
    const connectionName = state.api?.connection?.name?.trim() || `${apiType.label} API`;
    const baseUrl = state.api?.connection?.baseUrl?.trim() || "https://api.example.com";
    const objects = resolveDiscoverableObjects(state);
    const selected = new Set(state.api?.objectIds ?? []);
    const picked = objects.filter((o) => selected.has(o.id));
    const list = picked.length ? picked : [{ id: "response", name: connectionName, itemCount: 0 }];
    return list.map((obj) =>
      buildApiRecord(
        {
          name: obj.name,
          provider: apiType.id,
          kind: apiType.kind,
          connectionName,
          endpointUrl: `${baseUrl.replace(/\/$/, "")}/${obj.id}`,
          itemCount: obj.itemCount,
          auth: state.api?.connection?.auth,
          refreshCadence: state.api?.schedule ?? state.api?.fetchStrategy,
        },
        config,
      ),
    );
  }

  return [];
}

/** Indexed-record count shown on the success screen. */
export function computeIndexedRecords(state, fileCount = 0) {
  if (state.type === "files" && state.files?.intakeMode !== "cloud") return fileCount;
  if (isFilesCloudIntake(state)) return (state.cloud?.selected ?? []).length;
  if (state.type === "databases") {
    return getSelectedDbTables(state.db?.selectedTableIds).reduce(
      (sum, row) => sum + (row.rowCount ?? 0),
      0,
    );
  }
  if (state.type === "apis") {
    const objects = resolveDiscoverableObjects(state);
    const selected = new Set(state.api?.objectIds ?? []);
    return objects
      .filter((o) => selected.has(o.id))
      .reduce((sum, o) => sum + (o.itemCount ?? 0), 0);
  }
  return fileCount;
}

function cloudProviderLabel(provider) {
  const map = {
    "google-drive": "Google Drive",
    onedrive: "OneDrive",
    sharepoint: "SharePoint",
    dropbox: "Dropbox",
    box: "Box",
    notion: "Notion",
  };
  return map[provider] ?? "Cloud";
}

/** A readable default source name when the user leaves the name blank. */
export function deriveSourceName(state) {
  const provided = state.config?.name?.trim();
  if (provided) return provided;

  if (state.type === "files" && state.files?.intakeMode !== "cloud") return "Uploaded documents";
  if (isFilesCloudIntake(state)) return `${cloudProviderLabel(state.cloud?.provider)} import`;
  if (state.type === "databases") {
    return state.db?.connection?.name?.trim() || `${getDatabaseProvider(state.db?.provider).label} database`;
  }
  if (state.type === "apis") {
    return state.api?.connection?.name?.trim() || `${getApiType(state.api?.apiType).label} API`;
  }
  return "New source";
}
