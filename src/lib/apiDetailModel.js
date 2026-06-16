import { getSourceProviderLabel } from "@/lib/sourceCategories";
import { formatLastSyncedRelative } from "@/lib/fileSyncStatus";

const SALESFORCE_ENDPOINTS = [
  {
    id: "get-accounts",
    method: "GET",
    path: "/accounts",
    summary: "Retrieve account records",
    headers: [{ name: "Authorization", required: true, example: "Bearer {access_token}" }],
    parameters: [{ name: "accountId", type: "string", required: false, example: "123" }],
    responseSchema: { type: "Account", fields: ["Name", "Industry", "ARR", "Status"] },
    mockResponse: {
      accountId: 123,
      name: "Acme Corp",
      industry: "SaaS",
      arr: 250000,
      status: "Active",
    },
  },
  {
    id: "get-contacts",
    method: "GET",
    path: "/contacts",
    summary: "List contacts for an account",
    headers: [{ name: "Authorization", required: true, example: "Bearer {access_token}" }],
    parameters: [
      { name: "accountId", type: "string", required: true, example: "123" },
      { name: "limit", type: "integer", required: false, example: "50" },
    ],
    responseSchema: { type: "Contact[]", fields: ["Name", "Email", "Role", "AccountId"] },
    mockResponse: {
      contacts: [
        { name: "Jane Doe", email: "jane@acme.com", role: "VP Sales", accountId: 123 },
        { name: "John Smith", email: "john@acme.com", role: "CTO", accountId: 123 },
      ],
    },
  },
  {
    id: "post-cases",
    method: "POST",
    path: "/cases",
    summary: "Create a support case",
    headers: [
      { name: "Authorization", required: true, example: "Bearer {access_token}" },
      { name: "Content-Type", required: true, example: "application/json" },
    ],
    parameters: [
      { name: "accountId", type: "string", required: true, example: "123" },
      { name: "subject", type: "string", required: true, example: "Login issue" },
      { name: "priority", type: "string", required: false, example: "High" },
    ],
    responseSchema: { type: "Case", fields: ["CaseId", "Subject", "Status", "Priority"] },
    mockResponse: { caseId: "5001x000001", subject: "Login issue", status: "New", priority: "High" },
  },
  {
    id: "patch-accounts",
    method: "PATCH",
    path: "/accounts",
    summary: "Update account fields",
    headers: [
      { name: "Authorization", required: true, example: "Bearer {access_token}" },
      { name: "Content-Type", required: true, example: "application/json" },
    ],
    parameters: [
      { name: "accountId", type: "string", required: true, example: "123" },
      { name: "industry", type: "string", required: false, example: "Technology" },
    ],
    responseSchema: { type: "Account", fields: ["AccountId", "Name", "Industry", "UpdatedAt"] },
    mockResponse: { accountId: 123, name: "Acme Corp", industry: "Technology", updatedAt: "2026-06-16T10:00:00Z" },
  },
  {
    id: "delete-lead",
    method: "DELETE",
    path: "/lead",
    summary: "Delete a lead record",
    headers: [{ name: "Authorization", required: true, example: "Bearer {access_token}" }],
    parameters: [{ name: "leadId", type: "string", required: true, example: "00Q1x000002" }],
    responseSchema: { type: "DeleteResult", fields: ["success", "leadId"] },
    mockResponse: { success: true, leadId: "00Q1x000002" },
  },
];

const STRIPE_ENDPOINTS = [
  {
    id: "get-charges",
    method: "GET",
    path: "/v1/charges",
    summary: "List charges",
    headers: [{ name: "Authorization", required: true, example: "Bearer sk_live_..." }],
    parameters: [{ name: "limit", type: "integer", required: false, example: "10" }],
    responseSchema: { type: "ChargeList", fields: ["id", "amount", "currency", "status"] },
    mockResponse: {
      data: [{ id: "ch_1abc", amount: 9900, currency: "usd", status: "succeeded" }],
    },
  },
  {
    id: "get-customers",
    method: "GET",
    path: "/v1/customers",
    summary: "List customers",
    headers: [{ name: "Authorization", required: true, example: "Bearer sk_live_..." }],
    parameters: [{ name: "email", type: "string", required: false, example: "billing@acme.com" }],
    responseSchema: { type: "CustomerList", fields: ["id", "email", "name", "balance"] },
    mockResponse: { data: [{ id: "cus_xyz", email: "billing@acme.com", name: "Acme Corp", balance: 0 }] },
  },
];

const GITHUB_ENDPOINTS = [
  {
    id: "get-issues",
    method: "GET",
    path: "/repos/{owner}/{repo}/issues",
    summary: "List repository issues",
    headers: [
      { name: "Authorization", required: true, example: "Bearer ghp_..." },
      { name: "Accept", required: true, example: "application/vnd.github+json" },
    ],
    parameters: [
      { name: "state", type: "string", required: false, example: "open" },
      { name: "labels", type: "string", required: false, example: "bug" },
    ],
    responseSchema: { type: "Issue[]", fields: ["number", "title", "state", "labels"] },
    mockResponse: [{ number: 42, title: "Auth token expiry", state: "open", labels: ["bug"] }],
  },
];

const WEBHOOK_ENDPOINTS = [
  {
    id: "post-events",
    method: "POST",
    path: "/inbound/crm-events",
    summary: "Receive CRM event payloads",
    headers: [
      { name: "X-Signature", required: true, example: "sha256=..." },
      { name: "Content-Type", required: true, example: "application/json" },
    ],
    parameters: [{ name: "eventType", type: "string", required: true, example: "contact.updated" }],
    responseSchema: { type: "WebhookAck", fields: ["received", "eventId", "processedAt"] },
    mockResponse: { received: true, eventId: "evt_9f2a", processedAt: "2026-06-16T10:00:00Z" },
  },
];

const API_PROFILES = {
  salesforce: {
    title: "Salesforce CRM API",
    version: "v4.0",
    authentication: "OAuth2",
    status: "Connected",
    latencyMs: 120,
    availability: "99.98%",
    objectsAvailable: 58,
    baseUrl: "https://api.salesforce.com/services/data/v58.0",
    knowledge: {
      purpose:
        "Provides CRM data for accounts, contacts, cases and opportunities.",
      businessFunctions: ["Customer Management", "Sales Forecasting", "Case Management"],
      suggestedUseCases: ["Support Agent", "Sales Analytics", "Forecasting Flow"],
      suggestedQuestions: [
        "How do I fetch account ARR?",
        "What scopes are required for cases?",
        "Which endpoints support bulk export?",
        "How is OAuth token refreshed?",
      ],
    },
    endpoints: SALESFORCE_ENDPOINTS,
    lineage: [
      { id: "sf", label: "Salesforce CRM", type: "source", highlight: true },
      { id: "etl", label: "Sync pipeline", type: "pipeline" },
      { id: "hub", label: "Customer Hub", type: "hub" },
      { id: "agent", label: "Support Agent", type: "agent" },
      { id: "flow", label: "Case routing Flow", type: "flow" },
    ],
    usage: {
      hubs: ["Customer Hub", "Support Hub", "Revenue Hub"],
      agents: ["Support Agent", "Sales Agent"],
      flows: ["Forecasting Flow", "Case Escalation Flow"],
    },
    operations: {
      rateLimit: "15,000 requests / 24h",
      rateLimitUsed: 62,
      refreshCadence: "6h",
      avgLatencyMs: 120,
      errorRate: "0.02%",
      recentRequests: [
        { method: "GET", path: "/accounts", status: 200, at: "2m ago" },
        { method: "GET", path: "/contacts", status: 200, at: "8m ago" },
        { method: "POST", path: "/cases", status: 201, at: "1h ago" },
      ],
    },
  },
  stripe: {
    title: "Stripe Billing API",
    version: "v1",
    authentication: "API Key",
    status: "Connected",
    latencyMs: 85,
    availability: "99.99%",
    objectsAvailable: 24,
    baseUrl: "https://api.stripe.com",
    knowledge: {
      purpose: "Payment and subscription data for revenue recognition and billing operations.",
      businessFunctions: ["Payment Processing", "Subscription Billing", "Revenue Reporting"],
      suggestedUseCases: ["Finance Agent", "Invoice Flow", "MRR Dashboard"],
      suggestedQuestions: [
        "How do I paginate charge lists?",
        "What fields indicate failed payments?",
        "How to filter by customer email?",
      ],
    },
    endpoints: STRIPE_ENDPOINTS,
    lineage: [
      { id: "stripe", label: "Stripe API", type: "source", highlight: true },
      { id: "hub", label: "ERP Hub", type: "hub" },
      { id: "flow", label: "Invoice Flow", type: "flow" },
    ],
    usage: {
      hubs: ["ERP", "Revenue Hub"],
      agents: ["Finance Agent"],
      flows: ["Invoice Flow", "Dunning Flow"],
    },
    operations: {
      rateLimit: "100 requests / sec",
      rateLimitUsed: 18,
      refreshCadence: "24h",
      avgLatencyMs: 85,
      errorRate: "0.01%",
      recentRequests: [
        { method: "GET", path: "/v1/charges", status: 200, at: "2 days ago" },
      ],
    },
  },
  github: {
    title: "GitHub REST API",
    version: "v3",
    authentication: "Personal Access Token",
    status: "Auth error",
    latencyMs: 210,
    availability: "99.9%",
    objectsAvailable: 12,
    baseUrl: "https://api.github.com",
    knowledge: {
      purpose: "Issue and project data for engineering workflows and support triage.",
      businessFunctions: ["Issue Tracking", "Release Management", "Engineering Metrics"],
      suggestedUseCases: ["Support Agent", "Release Flow"],
      suggestedQuestions: [
        "Why am I getting 403?",
        "How to filter open bugs?",
        "What pagination headers are returned?",
      ],
    },
    endpoints: GITHUB_ENDPOINTS,
    lineage: [
      { id: "gh", label: "GitHub API", type: "source", highlight: true },
      { id: "agent", label: "Support Agent", type: "agent" },
    ],
    usage: {
      hubs: [],
      agents: ["Support Agent"],
      flows: ["Bug Triage Flow"],
    },
    operations: {
      rateLimit: "5,000 requests / hour",
      rateLimitUsed: 94,
      refreshCadence: "1h",
      avgLatencyMs: 210,
      errorRate: "12%",
      recentRequests: [
        { method: "GET", path: "/repos/acme/platform/issues", status: 403, at: "6h ago" },
      ],
    },
  },
  webhook: {
    title: "CRM Events Webhook",
    version: "v1",
    authentication: "HMAC Signature",
    status: "Connected",
    latencyMs: 45,
    availability: "99.95%",
    objectsAvailable: 6,
    baseUrl: "https://hooks.aziron.dev",
    knowledge: {
      purpose: "Inbound CRM events for real-time contact and opportunity updates.",
      businessFunctions: ["Event Ingestion", "Real-time Sync", "Audit Trail"],
      suggestedUseCases: ["Forecasting Flow", "Customer Hub sync"],
      suggestedQuestions: [
        "How is the webhook signature verified?",
        "What event types are supported?",
        "How are retries handled?",
      ],
    },
    endpoints: WEBHOOK_ENDPOINTS,
    lineage: [
      { id: "crm", label: "CRM System", type: "source" },
      { id: "hook", label: "Inbound Webhook", type: "api", highlight: true },
      { id: "hub", label: "MyDigitalHub", type: "hub" },
    ],
    usage: {
      hubs: ["MyDigitalHub"],
      agents: [],
      flows: ["CRM Sync Flow"],
    },
    operations: {
      rateLimit: "1,000 events / hour",
      rateLimitUsed: 34,
      refreshCadence: "manual",
      avgLatencyMs: 45,
      errorRate: "0.1%",
      recentRequests: [
        { method: "POST", path: "/inbound/crm-events", status: 200, at: "Just now" },
      ],
    },
  },
};

function getProfileKey(record) {
  const name = (record?.name ?? "").toLowerCase();
  const conn = (record?.connectionName ?? "").toLowerCase();
  if (record?.apiProvider === "webhook" || record?.kind === "webhook") return "webhook";
  if (name.includes("stripe") || conn.includes("stripe")) return "stripe";
  if (name.includes("github") || conn.includes("github")) return "github";
  if (name.includes("crm") || conn.includes("acme") || conn.includes("salesforce")) return "salesforce";
  return "salesforce";
}

export function getApiDetail(record) {
  const profileKey = getProfileKey(record);
  const profile = API_PROFILES[profileKey];
  const providerLabel = getSourceProviderLabel(record);
  const lastSync =
    formatLastSyncedRelative(record?.lastFetchedAt ?? record?.syncedAt ?? record?.uploadedAt) ??
    "Recently";

  const status =
    record?.lastFetchStatus === 403 || record?.fileStatus === "failed"
      ? "Auth error"
      : record?.stale
        ? "Stale"
        : profile.status;

  return {
    id: record?.id,
    profileKey,
    title: profile.title,
    provider: providerLabel,
    connectionName: record?.connectionName ?? profile.title,
    version: profile.version,
    authentication: profile.authentication,
    status,
    latencyMs: profile.latencyMs,
    availability: profile.availability,
    objectsAvailable: record?.itemCount ?? profile.objectsAvailable,
    baseUrl: record?.endpointUrl?.replace(/\/[^/]*$/, "") ?? profile.baseUrl,
    endpointUrl: record?.endpointUrl,
    lastSyncRelative: lastSync,
    refreshCadence: record?.refreshCadence ?? profile.operations.refreshCadence,
    knowledge: profile.knowledge,
    endpoints: profile.endpoints,
    lineage: profile.lineage,
    usage: profile.usage,
    operations: {
      ...profile.operations,
      refreshCadence: record?.refreshCadence ?? profile.operations.refreshCadence,
      lastFetchStatus: record?.lastFetchStatus ?? 200,
    },
  };
}

export function mockApiReply(question, detail) {
  const q = question.trim().toLowerCase();
  if (q.includes("oauth") || q.includes("auth") || q.includes("token")) {
    return `**Authentication — ${detail.title}**\n\nUses **${detail.authentication}**. Include \`Authorization: Bearer {access_token}\` on every request. Tokens expire after 2 hours; refresh via the connected OAuth app in Settings.`;
  }
  if (q.includes("arr") || q.includes("account")) {
    return `**Account data**\n\nUse \`GET /accounts\` with optional \`accountId\`. Response includes Name, Industry, ARR, and Status.\n\nExample: \`GET /accounts?accountId=123\``;
  }
  if (q.includes("case") || q.includes("support")) {
    return `**Cases endpoint**\n\n\`POST /cases\` creates a support case. Required: \`accountId\`, \`subject\`. Optional: \`priority\` (Low, Medium, High).`;
  }
  if (q.includes("rate") || q.includes("limit")) {
    return `**Rate limits**\n\n${detail.operations.rateLimit}. Current usage: ${detail.operations.rateLimitUsed}% of quota.`;
  }
  if (q.includes("endpoint") || q.includes("scope")) {
    const list = detail.endpoints.map((e) => `\`${e.method} ${e.path}\``).join(", ");
    return `**Available endpoints**\n\n${list}\n\nOpen the **Endpoints** tab to inspect headers, parameters, and response schemas.`;
  }
  return `From **${detail.title}** (${detail.version}):\n\n${detail.knowledge.purpose}\n\nTry asking about authentication, endpoints, rate limits, or specific objects like accounts and cases.`;
}

export function buildPlaygroundRequest(endpoint, paramValues = {}) {
  const params = endpoint.parameters
    .filter((p) => paramValues[p.name] != null && String(paramValues[p.name]).trim() !== "")
    .map((p) => `${p.name}=${encodeURIComponent(paramValues[p.name])}`)
    .join("&");
  const query = params ? `?${params}` : "";
  return `${endpoint.method} ${endpoint.path}${query}`;
}
