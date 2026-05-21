/**
 * Pre-fork / pre-clone dependency validation for agents and flows.
 * Groups checks into workspace pillars: model, knowledge, tools, vault, access.
 * Session-persisted "resolved" overrides support demo remediation UX.
 */

export const DEP_STATUS = {
  SUCCESS: "success",
  WARNING: "warning",
  MISSING: "missing",
  ERROR: "error",
};

/** Primary pillars shown in fork readiness UI */
export const FORK_PILLARS = [
  {
    id: "model",
    label: "Model configuration",
    description: "LLM provider, model, and API credentials in your workspace",
  },
  {
    id: "knowledge",
    label: "Knowledge hubs",
    description: "Attached knowledge bases and retrieval access",
  },
  {
    id: "tools",
    label: "Tools configuration",
    description: "Required tools, credentials, and execution permissions",
  },
  {
    id: "vault",
    label: "Vault variables",
    description: "Secrets, API keys, and environment mappings",
  },
  {
    id: "access",
    label: "Access & permissions",
    description: "Fork entitlements and workspace role mapping",
  },
];

/** @deprecated Use FORK_PILLARS — kept for CloneDependencyCheckDialog imports */
export const DEP_CATEGORIES = FORK_PILLARS;

const RESOLVED_STORAGE_KEY = "aziron-clone-dep-resolved";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getResolvedKeys() {
  try {
    const raw = sessionStorage.getItem(RESOLVED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function makeScopePrefix(source, kind) {
  const srcId = source?.id ?? source?.name ?? "x";
  return `${kind}:${srcId}`;
}

export function markDependencyResolved(checkId, source, kind) {
  const keys = new Set(getResolvedKeys());
  keys.add(`${makeScopePrefix(source, kind)}:${checkId}`);
  sessionStorage.setItem(RESOLVED_STORAGE_KEY, JSON.stringify([...keys]));
}

export function clearResolvedDependencies() {
  sessionStorage.removeItem(RESOLVED_STORAGE_KEY);
}

function sourceSeed(source, kind) {
  const id = String(source?.id ?? source?.name ?? "x");
  let h = 0;
  const s = `${kind}:${id}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h;
}

function agentProfile(source) {
  const tags = source.tags ?? [];
  const desc = (source.description ?? "").toLowerCase();
  const name = (source.name ?? "").toLowerCase();
  const provider = (source.provider ?? "").toLowerCase();
  const model = source.model ?? "";
  const knowledgeHubs = Array.isArray(source.knowledgeHubs) ? source.knowledgeHubs : [];
  const tools = Array.isArray(source.tools) ? source.tools : [];
  const vaultKeys = Array.isArray(source.vaultKeys) ? source.vaultKeys : [];
  const usesRag =
    source.ragMode === true ||
    tags.some((t) => /rag|pdf|doc|kb|knowledge/i.test(String(t))) ||
    /document|knowledge|resume|cv|parse|screening/i.test(desc + name);
  const usesTools =
    tools.length > 0 ||
    tags.some((t) => /email|crm|erp|api|tool/i.test(String(t))) ||
    /email|crm|calendar|integration|automation/i.test(desc);
  const usesIntegrations = tags.some((t) => /email|crm|erp/i.test(String(t))) || /email|crm|slack/i.test(desc);

  return {
    tags,
    provider,
    model,
    knowledgeHubs,
    tools,
    vaultKeys,
    usesRag,
    usesTools,
    usesIntegrations,
    apiTokenId: source.apiTokenId ?? null,
    vectorSearch: source.vectorSearch === true,
    ragMode: source.ragMode === true,
  };
}

function flowProfile(source) {
  const tags = source.tags ?? [];
  const stepList = Array.isArray(source.steps) ? source.steps : [];
  const steps = stepList.length || Number(source.steps) || 0;
  const category = source.category ?? "General";
  const hasAiStep = stepList.some(
    (s) => s?.icon === "Bot" || /ai|score|extract|parse/i.test(String(s?.label ?? "")),
  );
  const hasWebhook = stepList.some((s) => s?.icon === "Webhook");
  const hasExternalTool = stepList.some((s) =>
    ["Globe", "Database", "Mail", "Webhook"].includes(s?.icon),
  );

  return { tags, steps, stepList, category, hasAiStep, hasWebhook, hasExternalTool };
}

function buildAgentChecks(source, permissions) {
  const p = agentProfile(source);

  return [
    {
      id: "model-provider",
      category: "model",
      label: "LLM provider configured",
      resolveHint: "Open model settings",
      resolveTarget: "settings",
      evaluate: () => (p.provider ? DEP_STATUS.SUCCESS : DEP_STATUS.MISSING),
    },
    {
      id: "model-access",
      category: "model",
      label: `Model access: ${p.model || "not set"}`,
      resolveHint: "Request model access",
      resolveTarget: "settings",
      evaluate: () => {
        if (!p.model) return DEP_STATUS.MISSING;
        if (p.provider.includes("anthropic") && /3-5|3\.5/i.test(p.model)) return DEP_STATUS.WARNING;
        return DEP_STATUS.SUCCESS;
      },
    },
    {
      id: "model-api-credential",
      category: "model",
      label: "Provider API credential bound to agent",
      resolveHint: "Link API token in vault",
      resolveTarget: "vault",
      evaluate: () =>
        p.apiTokenId ? DEP_STATUS.SUCCESS : p.provider ? DEP_STATUS.MISSING : DEP_STATUS.WARNING,
    },
    {
      id: "knowledge-hubs-attached",
      category: "knowledge",
      label: "Knowledge hub attachments",
      resolveHint: "Attach knowledge hub",
      resolveTarget: "knowledge",
      evaluate: () => {
        if (!p.usesRag) return DEP_STATUS.SUCCESS;
        if (p.knowledgeHubs.length > 0) return DEP_STATUS.SUCCESS;
        return DEP_STATUS.MISSING;
      },
    },
    {
      id: "knowledge-hub-access",
      category: "knowledge",
      label: "Workspace access to attached hubs",
      resolveHint: "Request hub access",
      resolveTarget: "knowledge",
      evaluate: () => {
        if (!p.usesRag || p.knowledgeHubs.length === 0) return DEP_STATUS.SUCCESS;
        return p.tags.includes("restricted-hub") ? DEP_STATUS.WARNING : DEP_STATUS.SUCCESS;
      },
    },
    {
      id: "knowledge-rag-mode",
      category: "knowledge",
      label: "Retrieval (RAG / vector search) enabled",
      resolveHint: "Enable RAG in agent settings",
      resolveTarget: "settings",
      evaluate: () => {
        if (!p.usesRag) return DEP_STATUS.SUCCESS;
        if (p.ragMode || p.vectorSearch) return DEP_STATUS.SUCCESS;
        return DEP_STATUS.WARNING;
      },
    },
    {
      id: "tools-required-available",
      category: "tools",
      label: "Required tools available in workspace",
      resolveHint: "Enable required tools",
      resolveTarget: "knowledge",
      evaluate: () => {
        if (!p.usesTools) return DEP_STATUS.SUCCESS;
        if (p.tools.length > 0) return DEP_STATUS.SUCCESS;
        return DEP_STATUS.WARNING;
      },
    },
    {
      id: "tools-category-credentials",
      category: "tools",
      label: "Tool integration credentials configured",
      resolveHint: "Configure tool credentials",
      resolveTarget: "settings",
      evaluate: () => {
        if (!p.usesTools && !p.usesIntegrations) return DEP_STATUS.SUCCESS;
        if (p.tools.length > 0) return DEP_STATUS.WARNING;
        return DEP_STATUS.MISSING;
      },
    },
    {
      id: "tools-execution-perms",
      category: "tools",
      label: "Tool execution permissions",
      resolveHint: "Update tool permissions",
      resolveTarget: "settings",
      evaluate: () => (p.usesTools || p.usesIntegrations ? DEP_STATUS.MISSING : DEP_STATUS.SUCCESS),
    },
    {
      id: "vault-provider-keys",
      category: "vault",
      label: "Provider API keys in vault",
      resolveHint: "Add provider secret",
      resolveTarget: "vault",
      evaluate: () => {
        if (p.vaultKeys.some((k) => /api|sk-|anthropic|openai/i.test(String(k)))) return DEP_STATUS.SUCCESS;
        if (p.tags.includes("PDF")) return DEP_STATUS.WARNING;
        return DEP_STATUS.MISSING;
      },
    },
    {
      id: "vault-env-mappings",
      category: "vault",
      label: "Environment variable mappings",
      resolveHint: "Import environment file",
      resolveTarget: "vault",
      evaluate: () =>
        p.vaultKeys.some((k) => /env|ENV/i.test(String(k))) ? DEP_STATUS.SUCCESS : DEP_STATUS.MISSING,
    },
    {
      id: "vault-integration-secrets",
      category: "vault",
      label: "Integration & webhook secrets",
      resolveHint: "Set up vault secrets",
      resolveTarget: "vault",
      evaluate: () => {
        if (!p.usesIntegrations && !p.usesTools) return DEP_STATUS.SUCCESS;
        return p.vaultKeys.length > 0 ? DEP_STATUS.WARNING : DEP_STATUS.MISSING;
      },
    },
    {
      id: "access-fork-permission",
      category: "access",
      label: "Agent fork permission",
      resolveHint: "Contact your admin",
      resolveTarget: "settings",
      evaluate: () => (permissions?.canFork ? DEP_STATUS.SUCCESS : DEP_STATUS.ERROR),
    },
    {
      id: "access-rbac",
      category: "access",
      label: "Workspace RBAC role mapping",
      resolveHint: "Review role assignments",
      resolveTarget: "settings",
      evaluate: () => DEP_STATUS.SUCCESS,
    },
  ];
}

function buildFlowChecks(source, permissions) {
  const p = flowProfile(source);

  return [
    {
      id: "model-ai-steps",
      category: "model",
      label: "AI step model configuration",
      resolveHint: "Configure AI models",
      resolveTarget: "settings",
      evaluate: () => {
        if (!p.hasAiStep) return DEP_STATUS.SUCCESS;
        return p.steps >= 6 ? DEP_STATUS.WARNING : DEP_STATUS.SUCCESS;
      },
    },
    {
      id: "model-provider-access",
      category: "model",
      label: "LLM provider access for flow runtime",
      resolveHint: "Open model settings",
      resolveTarget: "settings",
      evaluate: () => DEP_STATUS.SUCCESS,
    },
    {
      id: "knowledge-flow-context",
      category: "knowledge",
      label: "Knowledge context for document steps",
      resolveHint: "Attach knowledge hub",
      resolveTarget: "knowledge",
      evaluate: () => {
        const needsKb = p.stepList.some((s) => s?.icon === "FileText");
        if (!needsKb) return DEP_STATUS.SUCCESS;
        return source.knowledgeHubs?.length > 0 ? DEP_STATUS.SUCCESS : DEP_STATUS.WARNING;
      },
    },
    {
      id: "tools-flow-referenced",
      category: "tools",
      label: "Tools referenced by flow steps",
      resolveHint: "Install missing tools",
      resolveTarget: "knowledge",
      evaluate: () => (p.hasExternalTool ? DEP_STATUS.WARNING : DEP_STATUS.SUCCESS),
    },
    {
      id: "tools-http-perms",
      category: "tools",
      label: "HTTP / scripting tool permissions",
      resolveHint: "Enable HTTP tools",
      resolveTarget: "settings",
      evaluate: () => (p.hasWebhook || p.hasExternalTool ? DEP_STATUS.MISSING : DEP_STATUS.SUCCESS),
    },
    {
      id: "vault-flow-credentials",
      category: "vault",
      label: "Flow credential bindings in vault",
      resolveHint: "Set up vault secrets",
      resolveTarget: "vault",
      evaluate: () => (p.category === "Finance" ? DEP_STATUS.MISSING : DEP_STATUS.SUCCESS),
    },
    {
      id: "vault-webhooks",
      category: "vault",
      label: "Webhook signing secrets",
      resolveHint: "Add webhook signing secret",
      resolveTarget: "vault",
      evaluate: () => (p.hasWebhook ? DEP_STATUS.MISSING : DEP_STATUS.SUCCESS),
    },
    {
      id: "vault-env-target",
      category: "vault",
      label: "Target environment variables",
      resolveHint: "Import environment file",
      resolveTarget: "vault",
      evaluate: () => DEP_STATUS.MISSING,
    },
    {
      id: "access-flow-create",
      category: "access",
      label: "Flow fork / create permission",
      resolveHint: "Contact your admin",
      resolveTarget: "settings",
      evaluate: () => (permissions?.canCreateFlow ? DEP_STATUS.SUCCESS : DEP_STATUS.ERROR),
    },
    {
      id: "access-flow-run",
      category: "access",
      label: "Flow execution permission",
      resolveHint: "Review execution access",
      resolveTarget: "settings",
      evaluate: () => DEP_STATUS.SUCCESS,
    },
  ];
}

function evaluateCheck(def, resolvedKeys, scopePrefix) {
  if (resolvedKeys.has(`${scopePrefix}:${def.id}`)) {
    return { ...def, status: DEP_STATUS.SUCCESS, resolved: true, message: "Ready — configured in workspace" };
  }
  const status = def.evaluate();
  const messages = {
    [DEP_STATUS.SUCCESS]: "Available and ready in your workspace",
    [DEP_STATUS.WARNING]: "Available with limitations — review before forking",
    [DEP_STATUS.MISSING]: "Not configured — set up or fork and finish later",
    [DEP_STATUS.ERROR]: "Access denied — contact your administrator",
  };
  return { ...def, status, resolved: false, message: messages[status] };
}

export function groupResultsByCategory(results) {
  return groupResultsByPillar(results);
}

export function groupResultsByPillar(results) {
  return FORK_PILLARS.map((pillar) => ({
    ...pillar,
    items: results.filter((r) => r.category === pillar.id),
  })).filter((g) => g.items.length > 0);
}

export function canProceedWithClone(results) {
  return results.every((r) => r.status === DEP_STATUS.SUCCESS || r.status === DEP_STATUS.WARNING);
}

/** Strict: every check passed with no warnings */
export function isFullyReady(results) {
  return results.length > 0 && results.every((r) => r.status === DEP_STATUS.SUCCESS);
}

export function countByStatus(results) {
  return results.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    { success: 0, warning: 0, missing: 0, error: 0 },
  );
}

export function getForkReadinessSummary(report) {
  if (!report) return { state: "idle", label: "Not checked" };
  const { counts, blocking } = report;
  if (blocking.some((r) => r.status === DEP_STATUS.ERROR)) {
    return { state: "blocked", label: "Blocked", counts };
  }
  if (isFullyReady(report.results)) {
    return { state: "ready", label: "Ready to fork", counts };
  }
  if (canProceedWithClone(report.results)) {
    return { state: "review", label: "Ready with review", counts };
  }
  return { state: "gaps", label: "Setup required", counts };
}

/**
 * Run all dependency checks with optional progress callback.
 * @param {'agent'|'flow'} kind
 * @param {object} source - agent or flow catalog item
 * @param {{ canFork?: boolean, canCreateFlow?: boolean, onProgress?: (result) => void, onCheckStart?: (def, i, total) => void }} options
 */
export function getDependencyCheckDefinitions(source, kind, permissions = {}) {
  return kind === "agent" ? buildAgentChecks(source, permissions) : buildFlowChecks(source, permissions);
}

export async function runCloneDependencyCheck(source, kind, options = {}) {
  const { onProgress, onCheckStart, ...permissions } = options;
  const resolvedKeys = new Set(getResolvedKeys());
  const scopePrefix = makeScopePrefix(source, kind);
  const defs = getDependencyCheckDefinitions(source, kind, permissions);
  const results = [];

  for (let i = 0; i < defs.length; i++) {
    onCheckStart?.(defs[i], i, defs.length);
    await delay(80 + (sourceSeed(source, kind) % 40));
    const result = evaluateCheck(defs[i], resolvedKeys, scopePrefix);
    results.push(result);
    onProgress?.(result, i + 1, defs.length);
  }

  const passed = canProceedWithClone(results);
  const counts = countByStatus(results);
  const fullyReady = isFullyReady(results);

  return {
    passed,
    fullyReady,
    results,
    grouped: groupResultsByPillar(results),
    counts,
    blocking: results.filter((r) => r.status === DEP_STATUS.MISSING || r.status === DEP_STATUS.ERROR),
    summary: getForkReadinessSummary({
      results,
      counts,
      blocking: results.filter((r) => r.status === DEP_STATUS.MISSING || r.status === DEP_STATUS.ERROR),
    }),
  };
}
