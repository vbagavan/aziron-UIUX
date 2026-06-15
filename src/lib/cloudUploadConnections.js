import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";

const SESSION_KEY = "aziron_cloud_upload_connections_v1";

function readSessionConnections() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessionConnections(connections) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(connections));
  } catch {
    /* private mode / quota */
  }
}

/** Persist a connection created via the upload wizard for the current browser session. */
export function saveUploadSessionConnection(connection, provider) {
  if (!connection?.id || !provider) return;
  const normalized = {
    ...connection,
    provider: connection.provider ?? provider,
  };
  const existing = readSessionConnections().filter(
    (c) => !(c.provider === normalized.provider && c.id === normalized.id),
  );
  writeSessionConnections([...existing, normalized]);
}

export function getUploadSessionConnections() {
  return readSessionConnections();
}

/** Mock seed connections plus any saved in the current session. */
export function getAllUploadConnections() {
  const seen = new Set();
  const connections = [];

  for (const provider of ["onedrive", "google-drive"]) {
    const config = getCloudProviderConfig(provider);
    for (const conn of config.mockConnections ?? []) {
      const key = `${provider}:${conn.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      connections.push({ ...conn, provider: conn.provider ?? provider });
    }
  }

  for (const conn of readSessionConnections()) {
    const provider = conn.provider ?? "onedrive";
    const key = `${provider}:${conn.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    connections.push({ ...conn, provider });
  }

  return connections;
}
