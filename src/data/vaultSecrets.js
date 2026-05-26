import { formatVaultVariableRef } from "@/lib/agentPublishPreview";

/** @typedef {"agent" | "credential" | "project" | "workspace"} VaultScope */

/** @typedef {{ id: string, keyName: string, value: string, secretType: VaultScope, createdOn: string, updatedOn?: string }} VaultSecret */

export const VAULT_STORAGE_KEY = "vault-secrets-v2";

export const VAULT_SCOPE_TYPES = ["agent", "credential", "project", "workspace"];

/** UI label: Scope (stored as `secretType` for storage compatibility). */
export const VAULT_SCOPE_LABELS = {
  agent: "Agent",
  credential: "Credential",
  project: "Project",
  workspace: "Workspace",
};

export const VAULT_SCOPE_DESCRIPTIONS = {
  workspace: "Available to all agents and workflows",
  project: "Shared within a project",
  agent: "Limited to one agent",
  credential: "External service authentication",
};

/** @deprecated Use VAULT_SCOPE_LABELS */
export const VAULT_SECRET_TYPE_LABELS = VAULT_SCOPE_LABELS;

export const VAULT_SECRET_TYPES = VAULT_SCOPE_TYPES;

export const DEFAULT_VAULT_SCOPE = "workspace";

/** @deprecated Use DEFAULT_VAULT_SCOPE */
export const DEFAULT_VAULT_SECRET_TYPE = DEFAULT_VAULT_SCOPE;

export const VAULT_SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "name", label: "Name (A–Z)" },
  { id: "scope", label: "Scope (A–Z)" },
];

/** Seed secrets for the vault list (values are demo-only). */
export const SEED_VAULT_SECRETS = [
  {
    id: "vault-openai-api-key",
    keyName: "OPENAI_API_KEY",
    value: "sk-openai-demo-7f3a9c2b1e4d8a6f0c1b2e3d",
    secretType: "workspace",
    createdOn: "2026-05-20",
    updatedOn: "2026-05-22",
  },
  {
    id: "vault-anthropic-api-key",
    keyName: "ANTHROPIC_API_KEY",
    value: "sk-ant-demo-4c8e1f9a2b7d3e6c5a4b3c2d",
    secretType: "workspace",
    createdOn: "2026-05-18",
    updatedOn: "2026-05-18",
  },
  {
    id: "vault-slack-bot-token",
    keyName: "SLACK_BOT_TOKEN",
    value: "xoxb-demo-1234567890-abcdefghijklmnop",
    secretType: "agent",
    createdOn: "2026-05-15",
    updatedOn: "2026-05-19",
  },
  {
    id: "vault-github-pat",
    keyName: "GITHUB_PAT",
    value: "ghp_demo9x2k4m8n1p5q7r3s6t8u0v2w4",
    secretType: "credential",
    createdOn: "2026-05-12",
    updatedOn: "2026-05-12",
  },
  {
    id: "vault-docker-images",
    keyName: "DOCKER_IMAGES",
    value: "dckr_pat_demo_9x2k4m8n1p5q7r3s",
    secretType: "project",
    createdOn: "2026-05-10",
    updatedOn: "2026-05-10",
  },
  {
    id: "vault-aws-access-key",
    keyName: "AWS_ACCESS_KEY_ID",
    value: "AKIADEMO1234567890AB",
    secretType: "credential",
    createdOn: "2026-05-08",
    updatedOn: "2026-05-14",
  },
  {
    id: "vault-aws-secret-key",
    keyName: "AWS_SECRET_ACCESS_KEY",
    value: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    secretType: "credential",
    createdOn: "2026-05-08",
    updatedOn: "2026-05-08",
  },
  {
    id: "vault-stripe-secret",
    keyName: "STRIPE_SECRET_KEY",
    value: "sk_live_demo_51NxYzAbCdEfGhIjKlMnOpQr",
    secretType: "project",
    createdOn: "2026-05-05",
    updatedOn: "2026-05-05",
  },
  {
    id: "vault-sendgrid-api-key",
    keyName: "SENDGRID_API_KEY",
    value: "SG.demo.abcdefghijklmnopqrstuvwxyz123456",
    secretType: "agent",
    createdOn: "2026-05-02",
    updatedOn: "2026-05-02",
  },
  {
    id: "vault-jira-api-token",
    keyName: "JIRA_API_TOKEN",
    value: "ATATT3xFfGF0demo-token-abcdefghijklmnop",
    secretType: "agent",
    createdOn: "2026-04-28",
    updatedOn: "2026-04-30",
  },
  {
    id: "vault-notion-integration",
    keyName: "NOTION_INTEGRATION_TOKEN",
    value: "secret_demo_notion_abc123def456ghi789",
    secretType: "project",
    createdOn: "2026-04-25",
    updatedOn: "2026-04-25",
  },
  {
    id: "vault-pagerduty-key",
    keyName: "PAGERDUTY_ROUTING_KEY",
    value: "pd-demo-routing-key-9876543210abcdef",
    secretType: "workspace",
    createdOn: "2026-04-20",
    updatedOn: "2026-04-22",
  },
  {
    id: "vault-datadog-api-key",
    keyName: "DATADOG_API_KEY",
    value: "dd-demo-api-key-0123456789abcdef0123",
    secretType: "credential",
    createdOn: "2026-04-15",
    updatedOn: "2026-04-15",
  },
  {
    id: "vault-adk",
    keyName: "ADK",
    value: "sk-adk-demo-7f3a9c2b1e4d8a6f",
    secretType: "credential",
    createdOn: "2026-03-02",
    updatedOn: "2026-03-02",
  },
  {
    id: "vault-adsds",
    keyName: "ADSDS",
    value: "sk-adsds-demo-4c8e1f9a2b7d3e6c",
    secretType: "workspace",
    createdOn: "2026-03-02",
    updatedOn: "2026-03-02",
  },
];

/** ISO date → locale display; ISO string in `title` for exact date. */
export function formatVaultDate(isoDate) {
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

export function getVaultReferenceId(keyName) {
  return formatVaultVariableRef(keyName);
}

export function maskSecretValue(value, visible = false) {
  if (visible) return value;
  const len = Math.max(String(value ?? "").length, 12);
  return "•".repeat(Math.min(len, 32));
}

export function findVaultSecretByKeyName(secrets, keyName) {
  const normalized = normalizeVaultKeyName(keyName);
  return secrets.find((s) => s.keyName === normalized) ?? null;
}

export function normalizeVaultKeyName(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  return raw
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function createVaultSecretId() {
  return `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {{ keyName: string, value: string, secretType: VaultScope }} payload
 * @returns {VaultSecret}
 */
export function createVaultSecretPayload(payload) {
  const today = formatIsoDateToday();
  return {
    id: createVaultSecretId(),
    keyName: normalizeVaultKeyName(payload.keyName),
    value: String(payload.value ?? "").trim(),
    secretType: payload.secretType ?? DEFAULT_VAULT_SCOPE,
    createdOn: today,
    updatedOn: today,
  };
}

export function filterVaultSecrets(secrets, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return secrets;
  return secrets.filter((s) => {
    const ref = getVaultReferenceId(s.keyName).toLowerCase();
    const scope = (VAULT_SCOPE_LABELS[s.secretType] ?? s.secretType).toLowerCase();
    return (
      s.keyName.toLowerCase().includes(q) ||
      ref.includes(q) ||
      scope.includes(q)
    );
  });
}

export function sortVaultSecrets(secrets, sortBy) {
  const list = [...secrets];
  if (sortBy === "name") {
    return list.sort((a, b) => a.keyName.localeCompare(b.keyName));
  }
  if (sortBy === "scope") {
    return list.sort((a, b) =>
      (VAULT_SCOPE_LABELS[a.secretType] ?? a.secretType).localeCompare(
        VAULT_SCOPE_LABELS[b.secretType] ?? b.secretType,
      ),
    );
  }
  return list.sort((a, b) => {
    const aDate = a.updatedOn ?? a.createdOn;
    const bDate = b.updatedOn ?? b.createdOn;
    return String(bDate).localeCompare(String(aDate));
  });
}

/**
 * @param {VaultSecret[]} secrets
 * @param {{ mode: "create" | "edit", keyName: string, value: string, secretType: VaultScope, secretId?: string }} form
 */
export function validateVaultSecretForm(secrets, form) {
  /** @type {{ keyName?: string, secretType?: string, value?: string, form?: string }} */
  const errors = {};
  const keyName = normalizeVaultKeyName(form.keyName);

  if (!keyName) {
    errors.keyName = "Key name is required.";
  } else if (!/^[A-Z][A-Z0-9_]*$/.test(keyName)) {
    errors.keyName = "Use letters, numbers, and underscores only.";
  } else {
    const duplicate = secrets.some(
      (s) =>
        s.keyName === keyName &&
        (form.mode === "create" || s.id !== form.secretId),
    );
    if (duplicate) errors.keyName = "This key name is already in Vault.";
  }

  if (!form.secretType || !VAULT_SCOPE_TYPES.includes(form.secretType)) {
    errors.secretType = "Select a scope.";
  }

  const value = String(form.value ?? "").trim();
  if (form.mode === "create" && !value) {
    errors.value = "Enter a secret value.";
  }

  const fieldErrors = Object.keys(errors).filter((k) => k !== "form");
  if (fieldErrors.length > 0) {
    errors.form = "Fix the errors below, then try again.";
  }

  return { errors, keyName, value };
}

export function loadVaultSecretsFromStorage() {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveVaultSecretsToStorage(secrets) {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(secrets));
    return true;
  } catch {
    return false;
  }
}
