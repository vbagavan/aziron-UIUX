// ─── Connection type & status enums ───────────────────────────────────────────

export const CONNECTION_TYPES = {
  oauth:      'oauth',
  api_key:    'api_key',
  mcp_server: 'mcp_server',
  custom:     'custom',
}

export const CONNECTION_STATUS = {
  active:   'active',
  expiring: 'expiring',
  expired:  'expired',
  error:    'error',
  pending:  'pending',
}

// ─── Badge styling ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  active:   { label: 'Active',   dot: 'bg-success-foreground', text: 'text-success-foreground', bg: 'bg-success', border: 'border-success-ring' },
  expiring: { label: 'Expiring', dot: 'bg-warning-foreground', text: 'text-warning-foreground', bg: 'bg-warning', border: 'border-warning-ring' },
  expired:  { label: 'Expired',  dot: 'bg-destructive-foreground', text: 'text-destructive-foreground', bg: 'bg-destructive', border: 'border-destructive' },
  error:    { label: 'Error',    dot: 'bg-destructive-foreground', text: 'text-destructive-foreground', bg: 'bg-destructive', border: 'border-destructive' },
  pending:  { label: 'Pending',  dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
}

export const TYPE_CONFIG = {
  oauth:      { label: 'OAuth',      text: 'text-primary-foreground', bg: 'bg-primary', border: 'border-primary' },
  api_key:    { label: 'API Key',    text: 'text-warning-foreground', bg: 'bg-warning', border: 'border-warning-ring' },
  mcp_server: { label: 'MCP Server', text: 'text-secondary-foreground', bg: 'bg-secondary', border: 'border-border' },
  custom:     { label: 'Custom',     text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
}

// ─── Provider catalog ──────────────────────────────────────────────────────────

export const CATALOG_PROVIDERS = [
  // OAuth
  {
    id: 'google-drive', name: 'Google Drive', type: 'oauth', category: 'Storage',
    color: '#4285F4', initials: 'GD',
    description: 'Read and write files in Google Drive',
    scopes: ['drive.readonly', 'drive.file', 'drive'],
    defaultScope: 'drive.file',
  },
  {
    id: 'slack', name: 'Slack', type: 'oauth', category: 'Communication',
    color: '#4A154B', initials: 'SL',
    description: 'Send messages and read channels in Slack',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    defaultScope: 'channels:read',
  },
  {
    id: 'github', name: 'GitHub', type: 'oauth', category: 'Developer',
    color: '#24292F', initials: 'GH',
    description: 'Access repositories, issues, and pull requests',
    scopes: ['repo', 'read:org', 'read:user'],
    defaultScope: 'read:org',
  },
  {
    id: 'notion', name: 'Notion', type: 'oauth', category: 'Productivity',
    color: '#000000', initials: 'NO',
    description: 'Read and write Notion pages and databases',
    scopes: ['read_content', 'update_content', 'insert_content'],
    defaultScope: 'read_content',
  },
  {
    id: 'jira', name: 'Jira', type: 'oauth', category: 'Project Management',
    color: '#0052CC', initials: 'JR',
    description: 'Manage issues, sprints, and projects in Jira',
    scopes: ['read:jira-work', 'write:jira-work'],
    defaultScope: 'read:jira-work',
  },
  {
    id: 'hubspot', name: 'HubSpot', type: 'oauth', category: 'CRM',
    color: '#FF7A59', initials: 'HS',
    description: 'Access contacts, deals, and marketing data',
    scopes: ['contacts', 'crm.objects.deals.read'],
    defaultScope: 'contacts',
  },
  {
    id: 'salesforce', name: 'Salesforce', type: 'oauth', category: 'CRM',
    color: '#00A1E0', initials: 'SF',
    description: 'Connect to Salesforce CRM objects and workflows',
    scopes: ['api', 'refresh_token'],
    defaultScope: 'api',
  },
  // API Key
  {
    id: 'openai', name: 'OpenAI', type: 'api_key', category: 'AI',
    color: '#10A37F', initials: 'OA',
    description: 'GPT-4o, embeddings, and image generation APIs',
    fields: [{ key: 'api_key', label: 'API Key', placeholder: 'sk-...', secret: true }],
  },
  {
    id: 'anthropic', name: 'Anthropic', type: 'api_key', category: 'AI',
    color: '#D4A574', initials: 'AN',
    description: 'Claude models via the Anthropic API',
    fields: [{ key: 'api_key', label: 'API Key', placeholder: 'sk-ant-...', secret: true }],
  },
  {
    id: 'aws-s3', name: 'AWS S3', type: 'api_key', category: 'Storage',
    color: '#FF9900', initials: 'S3',
    description: 'Object storage with S3 buckets and policies',
    fields: [
      { key: 'access_key_id',     label: 'Access Key ID',     placeholder: 'AKIA...', secret: false },
      { key: 'secret_access_key', label: 'Secret Access Key', placeholder: 'Wjal...', secret: true  },
      { key: 'region',            label: 'Region',            placeholder: 'us-east-1', secret: false },
    ],
  },
  {
    id: 'pinecone', name: 'Pinecone', type: 'api_key', category: 'AI',
    color: '#1A1A2E', initials: 'PC',
    description: 'Vector database for semantic search and RAG',
    fields: [
      { key: 'api_key',     label: 'API Key',     placeholder: 'pcsk_...', secret: true  },
      { key: 'environment', label: 'Environment', placeholder: 'us-east-1-aws', secret: false },
    ],
  },
  {
    id: 'stripe', name: 'Stripe', type: 'api_key', category: 'Payments',
    color: '#635BFF', initials: 'ST',
    description: 'Process payments and manage subscriptions',
    fields: [{ key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', secret: true }],
  },
  {
    id: 'datadog', name: 'Datadog', type: 'api_key', category: 'Monitoring',
    color: '#632CA6', initials: 'DD',
    description: 'Infrastructure monitoring and log management',
    fields: [
      { key: 'api_key', label: 'API Key',         placeholder: 'Your Datadog API key', secret: true  },
      { key: 'app_key', label: 'Application Key', placeholder: 'Your app key',         secret: true  },
    ],
  },
  // MCP Server
  {
    id: 'databricks', name: 'Databricks', type: 'mcp_server', category: 'Data',
    color: '#FF3621', initials: 'DB',
    description: 'Unified analytics and AI platform via MCP',
    fields: [
      { key: 'server_url',   label: 'MCP Server URL', placeholder: 'https://...', secret: false },
      { key: 'access_token', label: 'Access Token',   placeholder: 'dapi...', secret: true       },
    ],
  },
  {
    id: 'custom-mcp', name: 'Custom MCP Server', type: 'mcp_server', category: 'Custom',
    color: '#6366F1', initials: 'MC',
    description: 'Connect any custom MCP-compatible server',
    fields: [
      { key: 'server_url',   label: 'Server URL', placeholder: 'https://your-mcp-server.com', secret: false },
      { key: 'auth_token',   label: 'Auth Token', placeholder: 'Bearer token or API key',    secret: true  },
    ],
  },
]

// ─── Catalog categories ────────────────────────────────────────────────────────

export const CATALOG_CATEGORIES = ['All', 'AI', 'Storage', 'Communication', 'Developer', 'Productivity', 'Project Management', 'CRM', 'Payments', 'Monitoring', 'Data', 'Custom']

export const CONN_TYPE_TABS = [
  { key: 'all',        label: 'All'        },
  { key: 'oauth',      label: 'OAuth'      },
  { key: 'api_key',    label: 'API Key'    },
  { key: 'mcp_server', label: 'MCP Server' },
]

// ─── Mock connections data ─────────────────────────────────────────────────────

export const MOCK_CONNECTIONS = [
  {
    id: 'conn-1', providerId: 'github', name: 'Aziron GitHub Org',
    type: 'oauth', status: 'active', scope: 'full',
    addedAt: '2025-11-14', addedBy: 'vbagavan',
    lastUsed: '2 hours ago', callsToday: 142,
    callsWeek: [28, 44, 36, 55, 48, 72, 142],
    health: [
      { check: 'Token valid',        ok: true  },
      { check: 'Scopes intact',      ok: true  },
      { check: 'Rate limit OK',      ok: true  },
      { check: 'Webhook reachable',  ok: true  },
    ],
    usedIn: ['Customer Support Agent', 'Code Review Flow'],
    isPrivate: false,
  },
  {
    id: 'conn-2', providerId: 'openai', name: 'OpenAI Production',
    type: 'api_key', status: 'active', scope: null,
    addedAt: '2025-10-02', addedBy: 'vbagavan',
    lastUsed: '5 min ago', callsToday: 1847,
    callsWeek: [640, 820, 710, 950, 1100, 1320, 1847],
    health: [
      { check: 'API key valid',    ok: true  },
      { check: 'Quota remaining',  ok: true  },
      { check: 'Model accessible', ok: true  },
    ],
    usedIn: ['Customer Support Agent', 'Invoice Reconciliation', 'Code Review Flow'],
    isPrivate: true,
  },
  {
    id: 'conn-3', providerId: 'slack', name: 'Aziron Workspace Slack',
    type: 'oauth', status: 'expiring', scope: 'read',
    addedAt: '2025-08-20', addedBy: 'jaysmith',
    lastUsed: '1 day ago', callsToday: 23,
    callsWeek: [15, 18, 22, 19, 25, 21, 23],
    health: [
      { check: 'Token valid',    ok: true  },
      { check: 'Scopes intact',  ok: true  },
      { check: 'Token expiry',   ok: false, detail: 'Expires in 3 days' },
    ],
    usedIn: ['Deployment Notifier'],
    isPrivate: false,
  },
  {
    id: 'conn-4', providerId: 'anthropic', name: 'Anthropic Claude API',
    type: 'api_key', status: 'active', scope: null,
    addedAt: '2025-12-01', addedBy: 'vbagavan',
    lastUsed: '1 hour ago', callsToday: 502,
    callsWeek: [180, 220, 195, 310, 410, 460, 502],
    health: [
      { check: 'API key valid',    ok: true },
      { check: 'Quota remaining',  ok: true },
    ],
    usedIn: ['Code Review Flow', 'Knowledge Synthesizer'],
    isPrivate: true,
  },
  {
    id: 'conn-5', providerId: 'databricks', name: 'Databricks Analytics MCP',
    type: 'mcp_server', status: 'error', scope: null,
    addedAt: '2025-11-28', addedBy: 'datateam',
    lastUsed: '3 days ago', callsToday: 0,
    callsWeek: [44, 38, 52, 41, 0, 0, 0],
    health: [
      { check: 'Server reachable',   ok: false, detail: 'Connection timeout' },
      { check: 'Auth token valid',   ok: true  },
      { check: 'Protocol version',   ok: true  },
    ],
    usedIn: ['Pipeline Monitor'],
    isPrivate: false,
  },
  {
    id: 'conn-6', providerId: 'google-drive', name: 'Marketing Drive',
    type: 'oauth', status: 'expired', scope: 'full',
    addedAt: '2025-06-10', addedBy: 'marketing',
    lastUsed: '45 days ago', callsToday: 0,
    callsWeek: [0, 0, 0, 0, 0, 0, 0],
    health: [
      { check: 'Token valid',  ok: false, detail: 'Token expired — re-auth required' },
      { check: 'Scopes intact', ok: false },
    ],
    usedIn: [],
    isPrivate: false,
  },
  {
    id: 'conn-7', providerId: 'stripe', name: 'Stripe Live',
    type: 'api_key', status: 'active', scope: null,
    addedAt: '2025-09-15', addedBy: 'finance',
    lastUsed: '30 min ago', callsToday: 88,
    callsWeek: [32, 45, 51, 60, 72, 79, 88],
    health: [
      { check: 'API key valid',  ok: true },
      { check: 'Webhooks live',  ok: true },
    ],
    usedIn: ['Billing Agent'],
    isPrivate: true,
  },
]
