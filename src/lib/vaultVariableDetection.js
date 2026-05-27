import { getExplicitVaultLabels } from "@/lib/vaultPublishLabels";
import { DEFAULT_VAULT_SCOPE, normalizeVaultKeyName } from "@/data/vaultSecrets";

/**
 * @typedef {{ keyName: string, label: string, secretType: import("@/data/vaultSecrets").VaultScope, variableRef: string }} DetectedVaultVariable
 */

function dedupeVariables(list) {
  const seen = new Set();
  return list.filter((entry) => {
    const key = normalizeVaultKeyName(entry.keyName);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function makeVariable(keyName, label, secretType = DEFAULT_VAULT_SCOPE) {
  const normalized = normalizeVaultKeyName(keyName);
  return {
    keyName: normalized,
    label: label || normalized.replace(/_/g, " ").toLowerCase(),
    secretType,
    variableRef: `{{${normalized}}}`,
  };
}

function inferProviderKey(provider) {
  const p = String(provider ?? "").toLowerCase();
  if (p.includes("openai")) return makeVariable("OPENAI_API_KEY", "LLM provider API key", "workspace");
  if (p.includes("anthropic")) return makeVariable("ANTHROPIC_API_KEY", "LLM provider API key", "workspace");
  if (p.includes("google") || p.includes("gemini")) {
    return makeVariable("GOOGLE_API_KEY", "LLM provider API key", "workspace");
  }
  return null;
}

function detectAgentVariables(source) {
  /** @type {DetectedVaultVariable[]} */
  const variables = [];

  getExplicitVaultLabels(source).forEach(({ label, key, secretType }) => {
    if (key) variables.push(makeVariable(key, label, secretType ?? "workspace"));
  });

  if (variables.length === 0) {
    const providerKey = inferProviderKey(source.provider);
    if (providerKey) variables.push(providerKey);
  }

  const tags = source.tags ?? [];
  const tools = Array.isArray(source.tools) ? source.tools : [];
  const desc = `${source.description ?? ""} ${source.name ?? ""}`.toLowerCase();
  const usesIntegrations =
    tags.some((t) => /email|crm|erp|webhook|slack/i.test(String(t))) ||
    /email|crm|slack|webhook|integration/i.test(desc);

  if (usesIntegrations || tools.length > 0) {
    variables.push(makeVariable("INTEGRATION_SECRET", "Integration credential", "credential"));
  }

  if (source.ragMode || source.vectorSearch) {
    variables.push(makeVariable("VECTOR_DB_API_KEY", "Vector search API key", "project"));
  }

  return dedupeVariables(variables);
}

function detectFlowVariables(source) {
  /** @type {DetectedVaultVariable[]} */
  const variables = [];
  const stepList = Array.isArray(source.steps) ? source.steps : [];
  const hasAiStep = stepList.some(
    (s) => s?.icon === "Bot" || /ai|score|extract|parse/i.test(String(s?.label ?? "")),
  );
  const hasWebhook = stepList.some((s) => s?.icon === "Webhook");
  const hasDatabase = stepList.some((s) => s?.icon === "Database");
  const hasMail = stepList.some((s) => s?.icon === "Mail");
  const hasGlobe = stepList.some((s) => s?.icon === "Globe");
  const desc = `${source.description ?? ""} ${source.name ?? ""}`.toLowerCase();

  if (Array.isArray(source.vaultLabels)) {
    source.vaultLabels.forEach((entry) => {
      if (typeof entry === "string") {
        variables.push(makeVariable(entry, entry, "project"));
      } else if (entry?.key || entry?.label) {
        variables.push(makeVariable(entry.key ?? entry.label, entry.label ?? entry.key, "project"));
      }
    });
  }

  if (Array.isArray(source.vaultKeys)) {
    source.vaultKeys.forEach((key) => variables.push(makeVariable(key, String(key), "project")));
  }

  if (hasWebhook) {
    variables.push(makeVariable("WEBHOOK_SIGNING_SECRET", "Webhook signing secret", "credential"));
  }

  if (hasAiStep) {
    variables.push(makeVariable("OPENAI_API_KEY", "LLM provider API key", "workspace"));
  }

  if (hasDatabase || /crm|enrich|lookup/i.test(desc)) {
    variables.push(makeVariable("CRM_API_KEY", "CRM / database API key", "credential"));
  }

  if (hasMail || /email|sendgrid|mail/i.test(desc)) {
    variables.push(makeVariable("EMAIL_API_KEY", "Email service API key", "credential"));
  }

  if (hasGlobe || /slack|webhook|post/i.test(desc)) {
    variables.push(makeVariable("SLACK_WEBHOOK_URL", "Slack / outbound webhook URL", "project"));
  }

  if (source.category === "Finance") {
    variables.push(makeVariable("FINANCE_FLOW_CREDENTIAL", "Flow credential binding", "project"));
  }

  variables.push(makeVariable("TARGET_ENV_BASE_URL", "Target environment base URL", "project"));
  variables.push(makeVariable("TARGET_ENV_API_KEY", "Target environment API key", "project"));

  return dedupeVariables(variables);
}

/**
 * Detect vault variables referenced by an agent or flow.
 * @param {object} source
 * @param {"agent"|"flow"} kind
 * @returns {DetectedVaultVariable[]}
 */
export function detectRequiredVaultVariables(source, kind) {
  if (!source) return [];
  return kind === "agent" ? detectAgentVariables(source) : detectFlowVariables(source);
}
