import { hubSyncStatusForRow } from "@/components/features/knowledge/HubFileSyncIcon";
import { getHubFileStatus } from "@/data/knowledgeHubs";

/** Count sync states for attached-file rows (create flow) or hub inventory rows. */
export function countSyncStates(rows) {
  const counts = {
    total: rows?.length ?? 0,
    inKnowledgeBase: 0,
    cloudLink: 0,
    loading: 0,
    failed: 0,
    uploaded: 0,
  };
  for (const row of rows ?? []) {
    const status =
      row.source === "cloud"
        ? row.syncStatus != null
          ? hubSyncStatusForRow(row)
          : getHubFileStatus(row)
        : row.source === "user" || row.source === "upload"
          ? "success"
          : hubSyncStatusForRow(row);
    if (row.source === "user" || row.source === "upload") {
      counts.uploaded += 1;
      counts.inKnowledgeBase += 1;
    } else if (status === "success") counts.inKnowledgeBase += 1;
    else if (status === "loading") counts.loading += 1;
    else if (status === "failed") counts.failed += 1;
    else if (status === "linked") counts.cloudLink += 1;
  }
  return counts;
}

export function rowsNeedingDownload(rows) {
  return (rows ?? []).filter((row) => {
    if (row.source !== "cloud") return false;
    const status = row.syncStatus != null ? hubSyncStatusForRow(row) : getHubFileStatus(row);
    return status === "linked" || status === "failed";
  });
}

export const SYNC_COACH_STORAGE_KEY = "aziron_kh_sync_coach_dismissed";
