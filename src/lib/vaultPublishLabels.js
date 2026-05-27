/** @typedef {"agent" | "credential" | "project" | "workspace"} VaultScope */

/**
 * @typedef {{
 *   label: string,
 *   key: string,
 *   variableRef: string,
 *   marketplacePublished: boolean,
 *   secretType?: VaultScope,
 *   isShared?: boolean,
 * }} VaultLabelRef
 */

/** Scopes treated as shared (visible across agents / flows). Agent-only secrets are omitted from publish previews. */
export const SHARED_VAULT_SCOPES = new Set(["workspace", "project", "credential"]);

/** Display name for a vault variable reference (e.g. `{{OPENAI_API_KEY}}`). */
export function formatVaultVariableRef(labelOrKey) {
  const raw = String(labelOrKey ?? "").trim();
  if (!raw) return "{{}}";
  if (raw.startsWith("{{") && raw.endsWith("}}")) return raw;
  const key = /[\s-]/.test(raw)
    ? raw
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .toUpperCase()
    : raw.replace(/[^a-zA-Z0-9_]/g, "") || raw;
  return `{{${key}}}`;
}

export function isSharedVaultScope(secretType) {
  return SHARED_VAULT_SCOPES.has(secretType);
}

/**
 * @param {string | { label?: string, key?: string, marketplacePublished?: boolean, secretType?: VaultScope }} entry
 * @returns {VaultLabelRef | null}
 */
function parseVaultLabelEntry(entry) {
  if (typeof entry === "string") {
    const label = entry;
    const key = formatVaultVariableRef(label).slice(2, -2);
    return {
      label,
      key,
      variableRef: formatVaultVariableRef(label),
      marketplacePublished: false,
    };
  }
  const label = entry?.label ?? entry?.key ?? "";
  if (!label) return null;
  const key = entry?.key ?? formatVaultVariableRef(label).slice(2, -2);
  return {
    label: String(label),
    key: String(key),
    variableRef: formatVaultVariableRef(entry?.key ?? label),
    marketplacePublished: entry.marketplacePublished === true,
    secretType: entry.secretType,
  };
}

/**
 * @param {Array<string | object>} [labels]
 * @returns {VaultLabelRef[]}
 */
export function parseVaultLabelsArray(labels) {
  if (!Array.isArray(labels) || labels.length === 0) return [];
  return labels.map(parseVaultLabelEntry).filter(Boolean);
}

/**
 * @param {object} source
 * @returns {VaultLabelRef[]}
 */
export function getExplicitVaultLabels(source) {
  if (!source) return [];
  const fromLabels = parseVaultLabelsArray(source.vaultLabels);
  if (fromLabels.length > 0) return fromLabels;

  const keys = Array.isArray(source.vaultKeys) ? source.vaultKeys : [];
  return keys.map((key) => {
    const label = String(key);
    return {
      label,
      key: formatVaultVariableRef(label).slice(2, -2),
      variableRef: formatVaultVariableRef(label),
      marketplacePublished: false,
    };
  });
}

/**
 * @param {object} source
 * @param {import("@/lib/vaultVariableDetection").DetectedVaultVariable[]} detected
 * @returns {VaultLabelRef[]}
 */
export function mergeDetectedVaultLabels(source, detected) {
  const explicit = parseVaultLabelsArray(source?.vaultLabels);
  const publishedByKey = new Map(
    explicit.map((entry) => [entry.key, entry.marketplacePublished]),
  );
  const labelByKey = new Map(explicit.map((entry) => [entry.key, entry.label]));

  return detected.map((variable) => ({
    label: labelByKey.get(variable.keyName) ?? variable.label ?? variable.keyName,
    key: variable.keyName,
    variableRef: variable.variableRef,
    marketplacePublished: publishedByKey.get(variable.keyName) ?? false,
    secretType: variable.secretType,
  }));
}
