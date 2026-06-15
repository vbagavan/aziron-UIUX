import { rowsNeedingDownload } from "@/components/features/knowledge/hubFileSyncUtils";

/** Count cloud sync issues across all hubs (for sidebar warning badge). */
export function countHubSyncWarnings(hubs) {
  let count = 0;
  for (const hub of hubs ?? []) {
    const files = (hub.userFiles ?? []).filter(
      (f) => !(hub.hiddenFileIds ?? []).includes(f.id),
    );
    count += rowsNeedingDownload(files).length;
    count += files.filter(
      (f) => f.syncStatus === "failed" || f.syncStatus === "sync-failed",
    ).length;
  }
  return count;
}
