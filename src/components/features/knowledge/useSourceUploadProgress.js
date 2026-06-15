import { useCallback, useRef, useState } from "react";
import { createPendingUploadEntry } from "@/components/features/knowledge/hubUploadProgress";

const MIN_UPLOAD_MS = 700;

function tickProgress(entry, start, updateItem, cancelledRef) {
  return new Promise((resolve) => {
    const step = () => {
      if (cancelledRef.current.has(entry.id)) {
        resolve();
        return;
      }
      const elapsed = Date.now() - start;
      const simulated = Math.min(92, (elapsed / MIN_UPLOAD_MS) * 92);
      updateItem(entry.id, {
        loaded: Math.round(entry.total * (simulated / 100)),
        progress: simulated,
      });
      if (simulated < 92) {
        window.setTimeout(step, 50);
      } else {
        resolve();
      }
    };
    step();
  });
}

export function useSourceUploadProgress({ onUpload }) {
  const [phase, setPhase] = useState("idle");
  const [items, setItems] = useState([]);
  const [result, setResult] = useState(null);
  const cancelledRef = useRef(new Set());

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current.clear();
    setPhase("idle");
    setItems([]);
    setResult(null);
  }, []);

  const uploadLocalFile = useCallback(
    async (entry) => {
      const start = Date.now();
      await tickProgress(entry, start, updateItem, cancelledRef);

      try {
        if (cancelledRef.current.has(entry.id)) return null;
        const uploadResult = await onUpload?.({
          files: [entry.file],
          cloudImports: [],
          skippedLocal: 0,
        });

        const remaining = Math.max(0, MIN_UPLOAD_MS - (Date.now() - start));
        if (remaining > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remaining));
        }

        if (cancelledRef.current.has(entry.id)) return null;

        updateItem(entry.id, { loaded: entry.total, progress: 100, status: "done" });
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        return uploadResult;
      } catch {
        updateItem(entry.id, { status: "error", progress: 0, loaded: 0 });
        return null;
      }
    },
    [onUpload, updateItem],
  );

  const uploadCloudBatch = useCallback(
    async (entry, cloudImports) => {
      const start = Date.now();
      updateItem(entry.id, { status: "uploading", progress: 8, loaded: 0 });

      try {
        if (cancelledRef.current.has(entry.id)) return null;

        const interval = window.setInterval(() => {
          if (cancelledRef.current.has(entry.id)) return;
          const elapsed = Date.now() - start;
          const simulated = Math.min(90, 8 + (elapsed / MIN_UPLOAD_MS) * 82);
          updateItem(entry.id, { progress: simulated });
        }, 50);

        const uploadResult = await onUpload?.({
          files: [],
          cloudImports,
          skippedLocal: 0,
        });

        window.clearInterval(interval);

        if (cancelledRef.current.has(entry.id)) return null;

        updateItem(entry.id, { progress: 100, status: "done" });
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        return uploadResult;
      } catch {
        updateItem(entry.id, { status: "error", progress: 0 });
        return null;
      }
    },
    [onUpload, updateItem],
  );

  const runUpload = useCallback(
    async ({ files = [], cloudImports = [], skippedLocal = 0 } = {}) => {
      cancelledRef.current.clear();
      setPhase("uploading");
      setResult(null);

      const localEntries = files.map((file, index) => createPendingUploadEntry(file, index));
      const cloudCount = cloudImports.reduce(
        (sum, imp) => sum + (imp.selectedFiles?.length ?? 0),
        0,
      );

      const batchItems = [...localEntries];
      if (cloudCount > 0) {
        batchItems.push({
          id: `cloud-batch-${Date.now()}`,
          name: `${cloudCount} cloud file${cloudCount === 1 ? "" : "s"}`,
          total: cloudCount,
          loaded: 0,
          progress: 0,
          status: "uploading",
          isCloudBatch: true,
          cloudImports,
        });
      }

      setItems(batchItems);

      const uploadResults = [];
      for (const entry of localEntries) {
        const uploadResult = await uploadLocalFile(entry);
        if (uploadResult) uploadResults.push(uploadResult);
      }

      const cloudEntry = batchItems.find((item) => item.isCloudBatch);
      if (cloudEntry) {
        const cloudResult = await uploadCloudBatch(cloudEntry, cloudImports);
        if (cloudResult) uploadResults.push(cloudResult);
      }

      const added = uploadResults.flatMap((r) => r?.added ?? []);
      const records = uploadResults.flatMap((r) => r?.records ?? []);
      const rejected =
        uploadResults.reduce((sum, r) => sum + (r?.rejected ?? 0), 0) + (skippedLocal ?? 0);
      const hasError = batchItems.some((item) => item.status === "error");

      const finalResult = {
        added,
        records,
        rejected,
        skippedLocal,
        hasError,
        success: added.length > 0,
      };

      setResult(finalResult);
      setPhase(hasError && added.length === 0 ? "error" : "done");
      return finalResult;
    },
    [uploadCloudBatch, uploadLocalFile],
  );

  const retryFailed = useCallback(async () => {
    const failedLocals = items.filter((item) => item.status === "error" && item.file);
    const failedCloud = items.find((item) => item.status === "error" && item.isCloudBatch);

    if (failedLocals.length === 0 && !failedCloud) return null;

    setPhase("uploading");

    const uploadResults = [];
    for (const entry of failedLocals) {
      updateItem(entry.id, { status: "uploading", progress: 0, loaded: 0 });
      const uploadResult = await uploadLocalFile(entry);
      if (uploadResult) uploadResults.push(uploadResult);
    }

    if (failedCloud) {
      updateItem(failedCloud.id, { status: "uploading", progress: 0, loaded: 0 });
      const cloudResult = await uploadCloudBatch(failedCloud, failedCloud.cloudImports);
      if (cloudResult) uploadResults.push(cloudResult);
    }

    const added = [...(result?.added ?? []), ...uploadResults.flatMap((r) => r?.added ?? [])];
    const records = [...(result?.records ?? []), ...uploadResults.flatMap((r) => r?.records ?? [])];
    const stillFailed = items.some((item) => item.status === "error");

    const finalResult = {
      added,
      records,
      rejected: result?.rejected ?? 0,
      skippedLocal: result?.skippedLocal ?? 0,
      hasError: stillFailed,
      success: added.length > 0,
    };

    setResult(finalResult);
    setPhase(stillFailed && added.length === 0 ? "error" : "done");
    return finalResult;
  }, [items, result, updateItem, uploadCloudBatch, uploadLocalFile]);

  return {
    phase,
    items,
    result,
    runUpload,
    retryFailed,
    reset,
  };
}
