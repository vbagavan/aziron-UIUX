import { normalizeHubId } from "@/lib/agentKnowledge";
import { findVaultSecretByKeyName } from "@/data/vaultSecrets";
import { detectRequiredVaultVariables } from "@/lib/vaultVariableDetection";
import {
  getExplicitVaultLabels,
  isSharedVaultScope,
  mergeDetectedVaultLabels,
} from "@/lib/vaultPublishLabels";

export {
  formatVaultVariableRef,
  isSharedVaultScope,
  mergeDetectedVaultLabels,
  parseVaultLabelsArray,
  SHARED_VAULT_SCOPES,
} from "@/lib/vaultPublishLabels";

/** @typedef {import("@/lib/vaultPublishLabels").VaultLabelRef} VaultLabelRef */

/**
 * Vault label refs for an agent (names only in publish UI; values never shown).
 * Falls back to legacy `vaultKeys` string list when `vaultLabels` is absent.
 * @returns {VaultLabelRef[]}
 */
export function getAgentVaultLabels(agent) {
  if (!agent) return [];
  const explicit = getExplicitVaultLabels(agent);
  if (explicit.length > 0) return explicit;
  return mergeDetectedVaultLabels(agent, detectRequiredVaultVariables(agent, "agent"));
}

/**
 * Vault label refs for a flow (explicit labels, legacy keys, or step-based detection).
 * @returns {VaultLabelRef[]}
 */
export function getFlowVaultLabels(flow) {
  if (!flow) return [];
  const explicit = getExplicitVaultLabels(flow);
  if (explicit.length > 0) return explicit;
  return mergeDetectedVaultLabels(flow, detectRequiredVaultVariables(flow, "flow"));
}

/**
 * Shared vault variables referenced by an agent or flow, enriched with scope from Vault storage.
 * @param {object} source
 * @param {"agent"|"flow"} kind
 * @param {import("@/data/vaultSecrets").VaultSecret[]} [vaultSecrets]
 * @returns {VaultLabelRef[]}
 */
export function getSharedVaultLabelsForPublish(source, kind, vaultSecrets = []) {
  const all = kind === "agent" ? getAgentVaultLabels(source) : getFlowVaultLabels(source);

  return all
    .map((entry) => {
      const stored = findVaultSecretByKeyName(vaultSecrets, entry.key);
      const secretType = entry.secretType ?? stored?.secretType ?? "workspace";
      return {
        ...entry,
        secretType,
        isShared: isSharedVaultScope(secretType),
      };
    })
    .filter((entry) => entry.isShared);
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
