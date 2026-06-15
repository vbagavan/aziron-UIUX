/** File source labels and lifecycle/sync status for Knowledge Hub + Documents. */

export const CLOUD_PROVIDER_LABELS = {
  onedrive: "OneDrive",
  "google-drive": "Google Drive",
  sharepoint: "SharePoint",
  dropbox: "Dropbox",
  confluence: "Confluence",
  box: "Box",
};

export const FILE_LIFECYCLE_META = {
  local: {
    label: "Local",
    message: "Uploaded from local device",
    badgeVariant: "secondary",
  },
  "cloud-reference": {
    label: "Cloud Reference",
    message: "Metadata indexed — content not downloaded locally",
    badgeVariant: "outline",
  },
  syncing: {
    label: "Syncing…",
    message: "Downloading and indexing file…",
    badgeVariant: "secondary",
  },
  synced: {
    label: "Synced",
    message: "File successfully downloaded and indexed.",
    badgeVariant: "default",
  },
  "sync-failed": {
    label: "Sync Failed",
    message: "Unable to download file. Please retry.",
    badgeVariant: "destructive",
  },
  processing: {
    label: "Indexing & Chunking",
    message: "AI indexing in progress…",
    badgeVariant: "secondary",
  },
  ready: {
    label: "Ready",
    message: "Available for agents and workflows",
    badgeVariant: "default",
  },
  warning: {
    label: "Requires attention",
    message: "Indexing or metadata needs attention",
    badgeVariant: "destructive",
  },
  "out-of-sync": {
    label: "Out of Sync",
    message: "Cloud version changed — re-sync required",
    badgeVariant: "outline",
  },
};

function parseValidDate(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLastSyncedRelative(syncedAt) {
  const d = parseValidDate(syncedAt);
  if (!d) return null;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isLocalFile(file) {
  return file?.source === "user" || file?.source === "upload";
}

export function isCloudFile(file) {
  return file?.source === "cloud";
}

export function getFileSourceLabel(file) {
  if (isCloudFile(file)) {
    const provider = file.cloudProvider ?? file.provider;
    return CLOUD_PROVIDER_LABELS[provider] ?? file.connectionName ?? "Cloud";
  }
  if (isLocalFile(file)) return "Local";
  return "Local";
}

export function resolveFileLifecycleStatus(file, { includeDemoStatuses = false } = {}) {
  if (!file) return "ready";

  if (file.outOfSync || file.syncStatus === "out-of-sync") return "out-of-sync";

  if (isCloudFile(file)) {
    const sync = file.syncStatus ?? file.fileStatus;
    if (sync === "loading") return "syncing";
    if (sync === "failed") return "sync-failed";
    if (sync !== "stored" && !file.localBlobId) return "cloud-reference";

    if (file.metadata?.status === "loading" || file.sourceGuide?.status === "loading") {
      return "processing";
    }
    if (file.metadata?.status === "failed") return "warning";
    if (
      file.metadata?.status === "ready" ||
      file.sourceGuide?.status === "ready" ||
      file.indexStatus === "stored"
    ) {
      return "ready";
    }
    return "synced";
  }

  if (isLocalFile(file)) {
    if (file.metadata?.status === "loading" || file.sourceGuide?.status === "loading") {
      return "processing";
    }
    if (file.metadata?.status === "failed") return "warning";
    return "ready";
  }

  if (includeDemoStatuses) {
    if (file.fileStatus === "processing") return "processing";
    if (file.fileStatus === "failed") return "sync-failed";
  }

  return "ready";
}

export function getFileLifecycleMeta(file, options) {
  const status = resolveFileLifecycleStatus(file, options);
  return { status, ...FILE_LIFECYCLE_META[status] };
}

export function canActivateFileSync(file, options) {
  const status = resolveFileLifecycleStatus(file, options);
  return status === "cloud-reference" || status === "sync-failed" || status === "out-of-sync";
}

export function countFileStatusMetrics(files, options = {}) {
  const metrics = {
    total: 0,
    local: 0,
    cloudReferences: 0,
    synced: 0,
    processing: 0,
    failed: 0,
    ready: 0,
    warning: 0,
    outOfSync: 0,
    syncing: 0,
  };

  for (const file of files ?? []) {
    metrics.total += 1;
    if (isLocalFile(file)) metrics.local += 1;

    const status = resolveFileLifecycleStatus(file, options);
    switch (status) {
      case "cloud-reference":
        metrics.cloudReferences += 1;
        break;
      case "syncing":
        metrics.syncing += 1;
        metrics.processing += 1;
        break;
      case "synced":
        metrics.synced += 1;
        break;
      case "sync-failed":
        metrics.failed += 1;
        break;
      case "processing":
        metrics.processing += 1;
        break;
      case "ready":
        metrics.ready += 1;
        break;
      case "warning":
        metrics.warning += 1;
        break;
      case "out-of-sync":
        metrics.outOfSync += 1;
        break;
      default:
        break;
    }
  }

  return metrics;
}

/** Map lifecycle status to legacy hubSyncStatusForRow values. */
export function lifecycleToHubSyncIcon(status) {
  switch (status) {
    case "cloud-reference":
    case "out-of-sync":
      return "linked";
    case "syncing":
    case "processing":
      return "loading";
    case "sync-failed":
    case "warning":
      return "failed";
    case "synced":
    case "ready":
    case "local":
    default:
      return "success";
  }
}

export function hubSyncStatusForFile(file, options) {
  return lifecycleToHubSyncIcon(resolveFileLifecycleStatus(file, options));
}
