import { formatIsoDateToday, parseDisplaySizeToKb } from "@/data/knowledgeHubs";

function formatFileSizeFromBytes(bytes) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatTableDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export function uploadToAttachedRow(file, index) {
  const id = `upload-${file.name}-${index}-${file.lastModified}`;
  return {
    id,
    name: file.name,
    sizeLabel: formatFileSizeFromBytes(file.size),
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    date: formatTableDate(formatIsoDateToday()),
    source: "upload",
    syncStatus: "stored",
    file,
  };
}

export function cloudPickerToAttachedRow(pickerFile, cloudProvider = "onedrive") {
  return {
    id: `cloud-${cloudProvider}-${pickerFile.id}`,
    name: pickerFile.name,
    sizeLabel: pickerFile.size ?? "—",
    sizeKb: parseDisplaySizeToKb(pickerFile.size),
    date: formatTableDate(formatIsoDateToday()),
    source: "cloud",
    syncStatus: "linked",
    pickerFile,
    cloudProvider,
  };
}

export function mergeAttachedFiles(uploads, cloudRows) {
  const byKey = new Map();
  for (const row of uploads) {
    byKey.set(row.id, row);
  }
  for (const row of cloudRows) {
    byKey.set(row.id, row);
  }
  return Array.from(byKey.values());
}

export function totalAttachedSizeMb(rows) {
  const kb = (rows ?? []).reduce((sum, r) => sum + (r.sizeKb ?? 0), 0);
  return (kb / 1024).toFixed(2);
}

export function attachedRowsToCloudImport(rows, connectionMeta) {
  const firstCloud = (rows ?? []).find((r) => r.source === "cloud");
  const provider =
    connectionMeta?.provider ??
    connectionMeta?.connection?.provider ??
    firstCloud?.cloudProvider ??
    "onedrive";
  const cloudRows = rows.filter(
    (r) => r.source === "cloud" && (r.cloudProvider ?? "onedrive") === provider,
  );
  if (cloudRows.length === 0) return null;
  const label = provider === "google-drive" ? "Google Drive" : "OneDrive";
  return {
    provider,
    connection: connectionMeta?.connection ?? null,
    connectionName: connectionMeta?.connectionName ?? `${label} connection`,
    authMethod: connectionMeta?.authMethod,
    selectedFiles: cloudRows.map((r) => ({
      ...r.pickerFile,
      syncStatus: r.syncStatus,
      localBlobId: r.localBlobId ?? null,
      draftBlobId: r.draftBlobId ?? null,
      syncedAt: r.syncedAt ?? null,
    })),
  };
}

/** @deprecated Use attachedRowsToCloudImport */
export function attachedRowsToOneDriveImport(rows, connectionMeta) {
  return attachedRowsToCloudImport(rows, {
    ...connectionMeta,
    provider: connectionMeta?.provider ?? "onedrive",
  });
}
