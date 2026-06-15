import { canActivateFileSync, countFileStatusMetrics, isCloudFile } from "@/lib/fileSyncStatus";

/** Count sync states for attached-file rows (create flow) or hub inventory rows. */
export function countSyncStates(rows, options = {}) {
  const m = countFileStatusMetrics(rows, options);
  return {
    total: m.total,
    inKnowledgeBase: m.ready + m.synced,
    cloudLink: m.cloudReferences,
    loading: m.syncing,
    failed: m.failed,
    uploaded: m.local,
    ready: m.ready,
    synced: m.synced,
    processing: m.processing,
    warning: m.warning,
    outOfSync: m.outOfSync,
  };
}

export function rowsNeedingDownload(rows, options = {}) {
  return (rows ?? []).filter((row) => isCloudFile(row) && canActivateFileSync(row, options));
}

export const SYNC_COACH_STORAGE_KEY = "aziron_kh_sync_coach_dismissed";
