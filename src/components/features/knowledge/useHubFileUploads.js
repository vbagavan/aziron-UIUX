import { useCallback, useRef, useState } from "react";
import { partitionUploadFiles } from "@/lib/hubUploadLimits";
import { createPendingUploadEntry } from "@/components/features/knowledge/hubUploadProgress";

const MIN_UPLOAD_MS = 700;

export function useHubFileUploads({ hubId, addFilesToHub, onFilesAdded, onUploadComplete }) {
  const [pendingUploads, setPendingUploads] = useState([]);
  const cancelledRef = useRef(new Set());

  const updateUpload = useCallback((id, patch) => {
    setPendingUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const cancelUpload = useCallback((id) => {
    cancelledRef.current.add(id);
    setPendingUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const uploadSingleFile = useCallback(
    async (entry) => {
      const start = Date.now();
      let progressTimer;

      const tickProgress = () => {
        if (cancelledRef.current.has(entry.id)) return;
        const elapsed = Date.now() - start;
        const simulated = Math.min(92, (elapsed / MIN_UPLOAD_MS) * 92);
        updateUpload(entry.id, {
          loaded: Math.round(entry.total * (simulated / 100)),
          progress: simulated,
        });
        if (simulated < 92) {
          progressTimer = window.setTimeout(tickProgress, 50);
        }
      };

      tickProgress();

      try {
        if (cancelledRef.current.has(entry.id)) return null;
        const result = await addFilesToHub(hubId, [entry.file]);

        const remaining = Math.max(0, MIN_UPLOAD_MS - (Date.now() - start));
        if (remaining > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remaining));
        }

        if (progressTimer) window.clearTimeout(progressTimer);
        if (cancelledRef.current.has(entry.id)) return null;

        updateUpload(entry.id, { loaded: entry.total, progress: 100 });
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        setPendingUploads((prev) => prev.filter((u) => u.id !== entry.id));
        return result;
      } catch {
        if (progressTimer) window.clearTimeout(progressTimer);
        updateUpload(entry.id, { status: "error", progress: 0, loaded: 0 });
        return null;
      }
    },
    [hubId, addFilesToHub, updateUpload],
  );

  const uploadFiles = useCallback(
    async (fileList) => {
      const incoming = Array.from(fileList ?? []).filter(Boolean);
      const { valid, rejected: rejectedFiles } = partitionUploadFiles(incoming);
      if (valid.length === 0 || !hubId) {
        return { added: [], rejected: rejectedFiles.length || incoming.length };
      }

      const entries = valid.map((file, index) => createPendingUploadEntry(file, index));
      setPendingUploads((prev) => [...entries, ...prev]);

      const results = await Promise.all(entries.map((entry) => uploadSingleFile(entry)));
      const added = results.flatMap((r) => r?.added ?? []);
      const uploadedRecords = results.flatMap((r) => r?.records ?? []);
      const rejected = rejectedFiles.length;

      if (added.length > 0) {
        onFilesAdded?.(added);
      }
      if (uploadedRecords.length > 0) {
        onUploadComplete?.(uploadedRecords);
      }

      return { added, rejected, records: uploadedRecords };
    },
    [hubId, uploadSingleFile, onFilesAdded],
  );

  return {
    pendingUploads,
    cancelUpload,
    uploadFiles,
  };
}
