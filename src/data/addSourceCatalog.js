/**
 * Catalog powering the Add Source onboarding wizard.
 *
 * Holds the source-type taxonomy (Step 1), connector providers per category,
 * and the mock discovery data the wizard surfaces while connecting/browsing.
 * Pure data + lucide icon refs — no React, no side effects.
 */

import {
  Database,
  FileText,
  MoreHorizontal,
} from "lucide-react";

/** Step 1 — three categories aligned with Documents / Knowledge Hub tabs. */
export const SOURCE_TYPES = [
  {
    id: "files",
    label: "Files",
    description: "Upload locally or connect OneDrive, Google Drive, SharePoint, and more",
    icon: FileText,
    accent: "#2563eb",
  },
  {
    id: "databases",
    label: "Database",
    description: "PostgreSQL, MySQL, Snowflake, MongoDB, and other engines",
    icon: Database,
    accent: "#7c3aed",
  },
  {
    id: "apis",
    label: "Others",
    description: "REST and GraphQL endpoints, webhooks, and custom integrations",
    icon: MoreHorizontal,
    accent: "#d97706",
  },
];

export function getSourceType(id) {
  return SOURCE_TYPES.find((t) => t.id === id) ?? null;
}

/** Accepted local upload formats (Flow A). */
export const FILE_FORMATS = [
  "PDF", "DOC", "DOCX", "PPT", "XLS", "CSV", "MD", "TXT", "JSON",
];

// ─── Cloud storage providers (Flow B) ───────────────────────────────────────

export const CLOUD_PROVIDERS = [
  { id: "google-drive", label: "Google Drive", short: "GD", color: "#1a73e8" },
  { id: "onedrive", label: "OneDrive", short: "OD", color: "#0364b8" },
  { id: "sharepoint", label: "SharePoint", short: "SP", color: "#038387" },
  { id: "aws-s3", label: "AWS S3", short: "S3", color: "#ff9900" },
  { id: "dropbox", label: "Dropbox", short: "DB", color: "#0061ff" },
  { id: "box", label: "Box", short: "BX", color: "#0061d5" },
];

export const CLOUD_IMPORT_MODES = [
  { id: "selected", label: "Selected files", description: "Only the files you pick now" },
  { id: "folder", label: "Entire folder", description: "Everything in the chosen folder" },
  { id: "drive", label: "Entire drive", description: "Sync the whole connected account" },
];

export const SYNC_FREQUENCIES = [
  { id: "manual", label: "Manual", description: "Refresh on demand" },
  { id: "daily", label: "Daily", description: "Once every 24 hours" },
  { id: "hourly", label: "Hourly", description: "Once every hour" },
  { id: "realtime", label: "Real time", description: "Stream changes as they happen" },
];

/** Folder/file tree shown after a cloud account connects. */
export const CLOUD_BROWSE_TREE = [
  {
    id: "marketing",
    name: "Marketing",
    files: [
      { id: "mk1", name: "Brand Guidelines.pdf", sizeKb: 4200 },
      { id: "mk2", name: "Campaign Brief Q3.docx", sizeKb: 320 },
    ],
  },
  {
    id: "engineering",
    name: "Engineering",
    files: [
      { id: "eng1", name: "Architecture.pptx", sizeKb: 8800 },
      { id: "eng2", name: "API Spec.json", sizeKb: 64 },
    ],
  },
  {
    id: "product",
    name: "Product",
    files: [
      { id: "pr1", name: "Roadmap.pdf", sizeKb: 2600 },
      { id: "pr2", name: "Requirements.docx", sizeKb: 540 },
      { id: "pr3", name: "Personas.pptx", sizeKb: 5100 },
    ],
  },
  {
    id: "hr",
    name: "HR",
    files: [
      { id: "hr1", name: "Handbook.pdf", sizeKb: 1900 },
    ],
  },
];

// ─── Databases (Flow C) ──────────────────────────────────────────────────────

export const DATABASE_PROVIDERS = [
  { id: "postgresql", label: "PostgreSQL", short: "PG", color: "#336791", kind: "sql", defaultPort: "5432" },
  { id: "mysql", label: "MySQL", short: "My", color: "#00758f", kind: "sql", defaultPort: "3306" },
  { id: "sqlserver", label: "SQL Server", short: "MS", color: "#a91d22", kind: "sql", defaultPort: "1433" },
  { id: "oracle", label: "Oracle", short: "Or", color: "#c74634", kind: "sql", defaultPort: "1521" },
  { id: "snowflake", label: "Snowflake", short: "Sf", color: "#29b5e8", kind: "sql", defaultPort: "443" },
  { id: "redshift", label: "Redshift", short: "Rs", color: "#c4262e", kind: "sql", defaultPort: "5439" },
  { id: "mongodb", label: "MongoDB", short: "Mo", color: "#00ed64", kind: "nosql", defaultPort: "27017" },
  { id: "databricks", label: "Databricks", short: "Dx", color: "#ff3621", kind: "sql", defaultPort: "443" },
  { id: "bigquery", label: "BigQuery", short: "BQ", color: "#669df6", kind: "sql", defaultPort: "443" },
];

export function getDatabaseProvider(id) {
  return DATABASE_PROVIDERS.find((p) => p.id === id) ?? DATABASE_PROVIDERS[0];
}

/** Mock schema/table discovery — 124 tables across four schemas. */
export const DB_DISCOVERY = {
  totalTables: 124,
  schemas: [
    {
      id: "sales",
      name: "sales",
      tables: [
        { id: "customers", name: "customers", rowCount: 482113 },
        { id: "orders", name: "orders", rowCount: 1894220 },
        { id: "subscriptions", name: "subscriptions", rowCount: 76540 },
      ],
    },
    {
      id: "billing",
      name: "billing",
      tables: [
        { id: "invoices", name: "invoices", rowCount: 612400 },
        { id: "payments", name: "payments", rowCount: 588110 },
      ],
    },
    {
      id: "customer",
      name: "customer",
      tables: [
        { id: "profiles", name: "profiles", rowCount: 482113 },
        { id: "segments", name: "segments", rowCount: 42 },
        { id: "audit_logs", name: "audit_logs", rowCount: 9120044 },
      ],
    },
    {
      id: "analytics",
      name: "analytics",
      tables: [
        { id: "events", name: "events", rowCount: 21044890 },
        { id: "sessions", name: "sessions", rowCount: 3401220 },
      ],
    },
  ],
};

/** Candidate columns offered for the embedding strategy step. */
export const DB_EMBED_COLUMNS = [
  { id: "customer_name", label: "customer_name", recommended: true },
  { id: "company", label: "company", recommended: true },
  { id: "industry", label: "industry", recommended: true },
  { id: "email", label: "email", recommended: false },
  { id: "created_at", label: "created_at", recommended: false },
  { id: "raw_json", label: "raw_json", recommended: false },
  { id: "metadata", label: "metadata", recommended: false },
];

export const DB_EMBED_STRATEGIES = [
  { id: "full", label: "Full record", description: "Embed every column of each row" },
  { id: "selected", label: "Selected columns", description: "Embed only the columns you choose" },
];

export const DB_SYNC_TYPES = [
  { id: "full", label: "Full refresh", description: "Re-read all rows on every sync" },
  { id: "incremental", label: "Incremental", description: "Only pull changed rows" },
];

// ─── APIs (Flow D) ───────────────────────────────────────────────────────────

export const API_TYPES = [
  { id: "rest", label: "REST", short: "RE", color: "#2563eb" },
  { id: "graphql", label: "GraphQL", short: "GQ", color: "#e10098" },
  { id: "openapi", label: "OpenAPI", short: "OA", color: "#6ba539" },
  { id: "webhook", label: "Webhook", short: "WH", color: "#7c3aed", kind: "webhook" },
  { id: "custom", label: "Custom", short: "Cu", color: "#64748b" },
];

export function getApiType(id) {
  return API_TYPES.find((t) => t.id === id) ?? API_TYPES[0];
}

export const API_AUTH_METHODS = [
  { id: "oauth2", label: "OAuth2" },
  { id: "api-key", label: "API Key" },
  { id: "bearer", label: "Bearer Token" },
  { id: "none", label: "None" },
];

export const API_FETCH_STRATEGIES = [
  { id: "on-demand", label: "On demand", description: "Fetch only when an agent asks" },
  { id: "scheduled", label: "Scheduled", description: "Fetch on a fixed cadence" },
  { id: "event-based", label: "Event based", description: "Fetch when an event fires" },
];

export const API_SCHEDULE_OPTIONS = [
  { id: "5m", label: "Every 5 minutes" },
  { id: "15m", label: "Every 15 minutes" },
  { id: "1h", label: "Every hour" },
  { id: "24h", label: "Every 24 hours" },
];

/** AI enrichment toggles shared by the API flow. */
export const API_AI_OPTIONS = [
  { id: "knowledgeIndex", label: "Generate knowledge index", description: "Chunk + embed responses for retrieval" },
  { id: "semanticSearch", label: "Generate semantic search", description: "Build a vector index over fields" },
  { id: "entityGraph", label: "Generate entity graph", description: "Extract entities and relationships" },
];

/** Default discoverable objects for a generic REST endpoint. */
export const DEFAULT_API_OBJECTS = [
  { id: "tickets", name: "Tickets", itemCount: 18420 },
  { id: "users", name: "Users", itemCount: 9233 },
  { id: "orders", name: "Orders", itemCount: 44120 },
  { id: "events", name: "Events", itemCount: 210880 },
];

// ─── Enterprise applications (Flow E) ────────────────────────────────────────

export const ENTERPRISE_APPS = [
  { id: "salesforce", label: "Salesforce", short: "SF", color: "#00a1e0" },
  { id: "jira", label: "Jira", short: "Ji", color: "#2684ff" },
  { id: "confluence", label: "Confluence", short: "Cf", color: "#172b4d" },
  { id: "sap", label: "SAP", short: "SA", color: "#0faaff" },
  { id: "servicenow", label: "ServiceNow", short: "SN", color: "#62d84e" },
  { id: "zendesk", label: "Zendesk", short: "Ze", color: "#03363d" },
];

export function getEnterpriseApp(id) {
  return ENTERPRISE_APPS.find((a) => a.id === id) ?? null;
}

/** Discoverable objects per enterprise app (falls back to generic CRM objects). */
export const ENTERPRISE_OBJECTS = {
  salesforce: [
    { id: "accounts", name: "Accounts", itemCount: 12840 },
    { id: "contacts", name: "Contacts", itemCount: 48211 },
    { id: "cases", name: "Cases", itemCount: 22190 },
    { id: "opportunities", name: "Opportunities", itemCount: 8420 },
    { id: "products", name: "Products", itemCount: 1320 },
  ],
  jira: [
    { id: "projects", name: "Projects", itemCount: 86 },
    { id: "issues", name: "Issues", itemCount: 142880 },
    { id: "sprints", name: "Sprints", itemCount: 940 },
    { id: "boards", name: "Boards", itemCount: 120 },
  ],
  confluence: [
    { id: "spaces", name: "Spaces", itemCount: 64 },
    { id: "pages", name: "Pages", itemCount: 38420 },
    { id: "blogposts", name: "Blog posts", itemCount: 2110 },
  ],
  sap: [
    { id: "materials", name: "Materials", itemCount: 88200 },
    { id: "vendors", name: "Vendors", itemCount: 4210 },
    { id: "purchase_orders", name: "Purchase Orders", itemCount: 192440 },
  ],
  servicenow: [
    { id: "incidents", name: "Incidents", itemCount: 88410 },
    { id: "changes", name: "Change Requests", itemCount: 12044 },
    { id: "kb_articles", name: "Knowledge Articles", itemCount: 5320 },
  ],
  zendesk: [
    { id: "tickets", name: "Tickets", itemCount: 220180 },
    { id: "users", name: "Users", itemCount: 91240 },
    { id: "articles", name: "Help Center Articles", itemCount: 3210 },
  ],
};

export function getEnterpriseObjects(appId) {
  return ENTERPRISE_OBJECTS[appId] ?? DEFAULT_API_OBJECTS;
}

// ─── Source configuration (shared Configure step) ────────────────────────────

export const VISIBILITY_OPTIONS = [
  { id: "private", label: "Private", description: "Only you can access this source" },
  { id: "team", label: "Team", description: "Members of your team can access" },
  { id: "organization", label: "Organization", description: "Everyone in your org can access" },
];

export const SUGGESTED_TAGS = [
  "Product", "Engineering", "Release", "Sales", "Support",
  "Finance", "Marketing", "Legal", "HR", "Analytics",
];
