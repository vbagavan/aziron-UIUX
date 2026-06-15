import { CLOUD_PROVIDER_LABELS } from "@/data/knowledgeHubs";
import { getAllUploadConnections } from "@/lib/cloudUploadConnections";

/** Cloud providers that support the hub file-picker dialog. */
export const HUB_BROWSEABLE_CLOUD_PROVIDERS = new Set(["onedrive", "google-drive"]);

export function cloudProviderLabel(provider) {
  return CLOUD_PROVIDER_LABELS[provider] ?? provider;
}

function normalizeKeyPart(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/** Dedupe keys — same account may appear with different ids from hub files vs mock seeds. */
function connectionKeys(conn) {
  const provider = conn?.provider ?? "onedrive";
  const keys = new Set([`${provider}:id:${conn?.id ?? "unknown"}`]);

  const name = normalizeKeyPart(conn?.name);
  if (name) keys.add(`${provider}:name:${name}`);

  const email = normalizeKeyPart(conn?.accountEmail);
  if (email) keys.add(`${provider}:email:${email}`);

  return [...keys];
}

/**
 * Merge hub-stored connections, connections inferred from cloud files,
 * and session/mock upload connections for the Add sources menu.
 */
export function getMergedHubCloudConnections(hub) {
  const seen = new Set();
  const connections = [];

  function add(conn) {
    if (!conn) return;
    const provider = conn.provider ?? "onedrive";
    if (!HUB_BROWSEABLE_CLOUD_PROVIDERS.has(provider)) return;
    const keys = connectionKeys({ ...conn, provider });
    if (keys.some((key) => seen.has(key))) return;
    for (const key of keys) seen.add(key);
    connections.push({
      ...conn,
      provider,
      name: conn.name ?? `${cloudProviderLabel(provider)} connection`,
    });
  }

  for (const conn of hub?.cloudConnections ?? []) {
    add(conn);
  }

  for (const file of hub?.userFiles ?? []) {
    if (file.source !== "cloud") continue;
    add({
      id: file.connectionId ?? `${file.cloudProvider}-${file.connectionName ?? file.name}`,
      name: file.connectionName ?? `${cloudProviderLabel(file.cloudProvider)} connection`,
      provider: file.cloudProvider ?? "onedrive",
      connectedBy: file.connectedBy,
      connectedAt: file.connectedAt,
    });
  }

  for (const conn of getAllUploadConnections()) {
    add(conn);
  }

  return connections;
}
