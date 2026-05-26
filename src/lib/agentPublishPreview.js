import { normalizeHubId } from "@/lib/agentKnowledge";

/** @typedef {{ label: string, key?: string, marketplacePublished?: boolean }} VaultLabelRef */

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

/**
 * Vault label refs for an agent (names only in publish UI; values never shown).
 * Falls back to legacy `vaultKeys` string list when `vaultLabels` is absent.
 * @returns {VaultLabelRef[]}
 */
export function getAgentVaultLabels(agent) {
  if (!agent) return [];
  if (Array.isArray(agent.vaultLabels) && agent.vaultLabels.length > 0) {
    return agent.vaultLabels
      .map((entry) => {
        if (typeof entry === "string") {
          const label = entry;
          return {
            label,
            key: formatVaultVariableRef(label).slice(2, -2),
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
        };
      })
      .filter(Boolean);
  }
  const keys = Array.isArray(agent.vaultKeys) ? agent.vaultKeys : [];
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
 * Knowledge hubs attached to an agent for the publish confirmation dialog.
 * All hub names are shown to the publisher; `marketplacePublished` reflects hub visibility.
 */
export function getPublishKnowledgeHubSummary(agent, hubs = []) {
  const ids = agent?.knowledgeHubs ?? [];
  /** @type {{ id: number|string, name: string, marketplacePublished: boolean }[]} */
  const attached = [];

  for (const rawId of ids) {
    const id = normalizeHubId(rawId);
    const hub = hubs.find((h) => normalizeHubId(h.id) === id);
    attached.push({
      id,
      name: hub?.name ?? `Hub #${id}`,
      marketplacePublished: hub?.visibility === "public",
    });
  }

  return {
    total: ids.length,
    attached,
  };
}
