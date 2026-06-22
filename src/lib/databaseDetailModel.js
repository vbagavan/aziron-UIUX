import { getSourceProviderLabel } from "@/lib/sourceCategories";
import { formatLastSyncedRelative } from "@/lib/fileSyncStatus";

const DEFAULT_SCHEMAS = [
  {
    id: "sales",
    label: "sales",
    tables: [
      {
        id: "customers",
        name: "customers",
        columns: [
          { name: "id", type: "uuid", pk: true },
          { name: "email", type: "varchar(255)" },
          { name: "company", type: "varchar(255)" },
          { name: "arr", type: "numeric(12,2)" },
          { name: "created_at", type: "timestamptz" },
        ],
        indexes: ["customers_pkey", "customers_email_idx"],
        relationships: [{ to: "orders", type: "1:N", label: "customer_id" }],
      },
      {
        id: "orders",
        name: "orders",
        columns: [
          { name: "id", type: "uuid", pk: true },
          { name: "customer_id", type: "uuid", fk: "customers.id" },
          { name: "amount", type: "numeric(12,2)" },
          { name: "status", type: "varchar(32)" },
        ],
        indexes: ["orders_pkey", "orders_customer_id_idx"],
        relationships: [{ to: "customers", type: "N:1", label: "customer_id" }],
      },
    ],
  },
  {
    id: "customer",
    label: "customer",
    tables: [
      {
        id: "subscriptions",
        name: "subscriptions",
        columns: [
          { name: "id", type: "uuid", pk: true },
          { name: "customer_id", type: "uuid" },
          { name: "plan", type: "varchar(64)" },
          { name: "mrr", type: "numeric(10,2)" },
        ],
        indexes: ["subscriptions_pkey"],
        relationships: [{ to: "customers", type: "N:1" }],
      },
    ],
  },
  {
    id: "billing",
    label: "billing",
    tables: [
      {
        id: "invoices",
        name: "invoices",
        columns: [
          { name: "id", type: "uuid", pk: true },
          { name: "customer_id", type: "uuid" },
          { name: "total", type: "numeric(12,2)" },
          { name: "due_date", type: "date" },
        ],
        indexes: ["invoices_pkey"],
        relationships: [],
      },
      {
        id: "payments",
        name: "payments",
        columns: [
          { name: "id", type: "uuid", pk: true },
          { name: "invoice_id", type: "uuid" },
          { name: "amount", type: "numeric(12,2)" },
        ],
        indexes: ["payments_pkey"],
        relationships: [{ to: "invoices", type: "N:1" }],
      },
    ],
  },
];

const CONNECTION_PROFILES = {
  "production-db": {
    title: "Customer Analytics",
    environment: "Production",
    health: "Healthy",
    tableCount: 124,
    rowCountLabel: "82 Million",
    lastSyncRelative: "5 mins ago",
    businessSummary:
      "This database stores customer, subscription and billing data used for revenue operations, retention analysis, and finance reporting.",
    domains: ["Customers", "Orders", "Subscriptions", "Invoices", "Payments"],
    concepts: ["MRR", "ARR", "Churn", "Retention", "Customer Lifetime Value"],
    suggestedQuestions: [
      "Which customers are at risk?",
      "What products have highest churn?",
      "What is current ARR?",
      "Which accounts expanded MRR this quarter?",
    ],
    lineage: [
      { id: "sf", label: "Salesforce API", type: "source" },
      { id: "db", label: "Customer DB", type: "database", highlight: true },
      { id: "hub", label: "Database Hub", type: "hub" },
      { id: "agent", label: "Support Agent", type: "agent" },
      { id: "flow", label: "Escalation Flow", type: "flow" },
    ],
    usage: {
      hubs: ["Database Hub"],
      agents: ["Support Agent", "Finance Agent", "Sales Agent"],
      flows: ["Renewal Flow", "Invoice Flow", "Churn Prediction Flow"],
    },
  },
  analytics: {
    title: "Product Analytics",
    environment: "Production",
    health: "Healthy",
    tableCount: 18,
    rowCountLabel: "2.1 Million",
    lastSyncRelative: "Yesterday",
    businessSummary:
      "Event and session data for product analytics, funnel tracking, and engagement scoring across web and mobile surfaces.",
    domains: ["Sessions", "Pageviews", "Events", "Users"],
    concepts: ["DAU", "Conversion", "Funnel drop-off", "Engagement score"],
    suggestedQuestions: [
      "What are top landing pages this week?",
      "Where do users drop off in onboarding?",
      "Which cohorts have the highest retention?",
    ],
    lineage: [
      { id: "sdk", label: "Web SDK", type: "source" },
      { id: "db", label: "Analytics DB", type: "database", highlight: true },
      { id: "hub", label: "Database Hub", type: "hub" },
      { id: "agent", label: "Marketing Agent", type: "agent" },
    ],
    usage: {
      hubs: ["Database Hub"],
      agents: ["Marketing Agent"],
      flows: ["Campaign Attribution Flow"],
    },
  },
  "warehouse-db": {
    title: "Warehouse Inventory",
    environment: "Staging",
    health: "Attention",
    tableCount: 42,
    rowCountLabel: "45 Thousand",
    lastSyncRelative: "1 week ago",
    businessSummary:
      "Inventory and fulfillment data for warehouse operations, stock levels, and supply chain visibility.",
    domains: ["Inventory", "SKUs", "Warehouses", "Shipments"],
    concepts: ["Stock on hand", "Reorder point", "Lead time", "Fill rate"],
    suggestedQuestions: [
      "Which SKUs are below reorder threshold?",
      "What is average fulfillment time by region?",
    ],
    lineage: [
      { id: "erp", label: "ERP Export", type: "source" },
      { id: "db", label: "Warehouse DB", type: "database", highlight: true },
      { id: "hub", label: "Database Hub", type: "hub" },
    ],
    usage: {
      hubs: ["Database Hub"],
      agents: ["Operations Agent"],
      flows: ["Reorder Alert Flow"],
    },
  },
};

function formatRows(record) {
  const n = record?.rowCount ?? record?.docCount;
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Million`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

function getProfileForRecord(record) {
  const conn = (record?.connectionName ?? "").toLowerCase();
  if (conn.includes("production")) return CONNECTION_PROFILES["production-db"];
  if (conn.includes("analytics")) return CONNECTION_PROFILES.analytics;
  if (conn.includes("warehouse")) return CONNECTION_PROFILES["warehouse-db"];
  return CONNECTION_PROFILES["production-db"];
}

export function getDatabaseDetail(record) {
  const providerLabel = getSourceProviderLabel(record);
  const profile = getProfileForRecord(record);

  const tableName = record?.tableName ?? record?.name;
  const lastSync =
    formatLastSyncedRelative(record?.syncedAt ?? record?.uploadedAt) ?? profile.lastSyncRelative;

  return {
    id: record?.id,
    tableName,
    title: profile.title,
    provider: providerLabel,
    environment: profile.environment,
    connectionName: record?.connectionName ?? "production-db",
    health: record?.schemaDrift ? "Schema drift" : profile.health,
    lastSyncRelative: lastSync,
    tableCount: profile.tableCount,
    rowCountLabel: record?.rowCount || record?.docCount ? formatRows(record) : profile.rowCountLabel,
    focusedTable: tableName,
    schemas: DEFAULT_SCHEMAS,
    knowledge: {
      businessSummary: profile.businessSummary,
      domains: profile.domains,
      concepts: profile.concepts,
      suggestedQuestions: profile.suggestedQuestions,
    },
    lineage: profile.lineage,
    usage: profile.usage,
    savedQueries: [
      { id: "q1", name: "Top customers by ARR", sql: "SELECT company, arr FROM sales.customers ORDER BY arr DESC LIMIT 10;" },
      { id: "q2", name: "At-risk subscriptions", sql: "SELECT c.company, s.plan, s.mrr FROM customer.subscriptions s JOIN sales.customers c ON c.id = s.customer_id WHERE s.mrr < 500;" },
    ],
    queryHistory: [
      { id: "h1", prompt: "Show top 10 customers by ARR", ranAt: "2h ago" },
      { id: "h2", prompt: "Monthly revenue by plan", ranAt: "Yesterday" },
    ],
  };
}

export function generateSqlFromNaturalLanguage(prompt, detail) {
  const q = prompt.trim().toLowerCase();
  if (q.includes("arr") && q.includes("top")) {
    return `SELECT company, arr\nFROM sales.customers\nORDER BY arr DESC\nLIMIT 10;`;
  }
  if (q.includes("churn") || q.includes("risk")) {
    return `SELECT c.company, c.arr, s.plan, s.mrr\nFROM sales.customers c\nJOIN customer.subscriptions s ON s.customer_id = c.id\nWHERE s.mrr < 500\nORDER BY c.arr DESC;`;
  }
  if (q.includes("mrr") || q.includes("revenue")) {
    return `SELECT plan, SUM(mrr) AS total_mrr\nFROM customer.subscriptions\nGROUP BY plan\nORDER BY total_mrr DESC;`;
  }
  return `-- Generated for: ${detail.title}\nSELECT *\nFROM ${detail.focusedTable ?? "customers"}\nLIMIT 100;`;
}

const MOCK_RESULT_SETS = {
  arr: {
    columns: ["company", "arr"],
    rows: [
      ["Northwind Trading", "$1,240,000"],
      ["Globex Corp", "$985,000"],
      ["Initech", "$742,500"],
      ["Soylent Systems", "$610,000"],
      ["Hooli", "$534,200"],
    ],
  },
  churn: {
    columns: ["company", "plan", "mrr"],
    rows: [
      ["Vandelay Industries", "Starter", "$420"],
      ["Wernham Hogg", "Starter", "$390"],
      ["Pied Piper", "Growth", "$480"],
    ],
  },
  revenue: {
    columns: ["plan", "total_mrr"],
    rows: [
      ["Enterprise", "$182,400"],
      ["Growth", "$96,250"],
      ["Starter", "$41,800"],
    ],
  },
};

/** Mock query executor — returns a small result set inferred from the SQL. */
export function runMockQuery(sql, detail) {
  const q = (sql ?? "").toLowerCase();
  let set = MOCK_RESULT_SETS.arr;
  if (q.includes("mrr") && q.includes("group by")) set = MOCK_RESULT_SETS.revenue;
  else if (q.includes("mrr") || q.includes("churn") || q.includes("risk")) set = MOCK_RESULT_SETS.churn;
  else if (q.includes("arr")) set = MOCK_RESULT_SETS.arr;
  return {
    columns: set.columns,
    rows: set.rows,
    rowCount: set.rows.length,
    durationMs: 40 + Math.floor(Math.random() * 120),
    source: detail?.connectionName ?? "production-db",
  };
}

export function mockDatabaseReply(question, detail) {
  const q = question.trim().toLowerCase();
  if (q.includes("arr") || q.includes("revenue")) {
    return `**ARR snapshot for ${detail.title}**\n\nCurrent ARR is concentrated in enterprise accounts on annual plans. The top decile of customers contributes roughly 62% of total ARR.\n\nRun this in Query Studio:\n\`${generateSqlFromNaturalLanguage("top customers by arr", detail).replace(/\n/g, " ")}\``;
  }
  if (q.includes("churn") || q.includes("risk")) {
    return `**At-risk customers**\n\nAccounts with declining MRR, overdue invoices, or support escalations in the last 30 days are flagged as at-risk. Finance and Support hubs both consume this signal.\n\nSuggested filter: subscriptions with MRR under $500 and no payment in 45+ days.`;
  }
  if (q.includes("schema") || q.includes("table") || q.includes("column")) {
    return `**Schema overview**\n\nFocused table: \`${detail.focusedTable}\` on connection **${detail.connectionName}**.\n\nKey schemas: ${detail.schemas.map((s) => s.label).join(", ")}. Open the **Schema** tab for columns, relationships, and ER preview.`;
  }
  if (q.includes("lineage") || q.includes("upstream") || q.includes("downstream")) {
    const chain = detail.lineage.map((n) => n.label).join(" → ");
    return `**Lineage**\n\n${chain}\n\nThis database feeds downstream hubs and agents for operational and analytics workflows.`;
  }
  return `From **${detail.title}** (\`${detail.focusedTable}\`):\n\n${detail.knowledge.businessSummary}\n\nTry asking about ARR, churn risk, schema, or lineage for more specific answers.`;
}
