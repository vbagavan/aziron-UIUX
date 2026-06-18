import { useCallback, useRef, useState } from "react";
import { createPendingUploadEntry } from "@/components/features/knowledge/hubUploadProgress";

const MIN_UPLOAD_MS = 700;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function applyBatchItemStatus(updateItem, batchItems, status, { errorMessage } = {}) {
  for (const item of batchItems) {
    if (status === "error") {
      updateItem(item.id, {
        status: "error",
        progress: 0,
        loaded: 0,
        ...(errorMessage ? { errorMessage } : {}),
      });
      continue;
    }

    if (status === "skipped") {
      updateItem(item.id, {
        status: "skipped",
        progress: 100,
        loaded: item.isCloudBatch ? item.total : item.total,
      });
      continue;
    }

    updateItem(item.id, {
      status: "done",
      progress: 100,
      loaded: item.total,
    });
  }
}

async function simulateBatchProgress(batchItems, updateItem, cancelledRef) {
  const start = Date.now();

  while (Date.now() - start < MIN_UPLOAD_MS) {
    if (batchItems.every((item) => cancelledRef.current.has(item.id))) return;

    const elapsed = Date.now() - start;
    const ratio = Math.min(1, elapsed / MIN_UPLOAD_MS);
    const progress = Math.min(92, Math.round(ratio * 92));

    for (const item of batchItems) {
      if (cancelledRef.current.has(item.id)) continue;
      updateItem(item.id, {
        status: "uploading",
        progress,
        loaded: item.isCloudBatch ? 0 : Math.round((item.total ?? 0) * (progress / 100)),
      });
    }

    await sleep(50);
  }
}

function buildFinalResult(uploadResult, skippedLocal = 0) {
  const added = uploadResult?.added ?? [];
  const records = uploadResult?.records ?? [];
  const rejected = (uploadResult?.rejected ?? 0) + (skippedLocal ?? 0);
  const skippedDuplicates = uploadResult?.skippedDuplicates ?? 0;
  const allSkipped = Boolean(uploadResult?.allSkipped);
  const hasError = Boolean(uploadResult?.error) || (added.length === 0 && !allSkipped);
  const partial =
    added.length > 0 && skippedDuplicates > 0 && !hasError && !allSkipped;

  return {
    added,
    records,
    rejected,
    skippedLocal,
    skippedDuplicates,
    allSkipped,
    partial,
    hasError,
    success: added.length > 0 || allSkipped,
    errorMessage: uploadResult?.error ?? null,
  };
}

export function useSourceUploadProgress({ onUpload }) {
  const [phase, setPhase] = useState("idle");
  const [items, setItems] = useState([]);
  const [result, setResult] = useState(null);
  const cancelledRef = useRef(new Set());
  const lastPayloadRef = useRef(null);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current.clear();
    lastPayloadRef.current = null;
    setPhase("idle");
    setItems([]);
    setResult(null);
  }, []);

  const runUpload = useCallback(
    async ({ files = [], cloudImports = [], skippedLocal = 0 } = {}) => {
      const payload = { files, cloudImports, skippedLocal };
      lastPayloadRef.current = payload;

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

      if (batchItems.length === 0) {
        const emptyResult = {
          added: [],
          records: [],
          rejected: skippedLocal ?? 0,
          skippedLocal,
          skippedDuplicates: 0,
          allSkipped: false,
          partial: false,
          hasError: false,
          success: false,
          errorMessage: null,
        };
        setItems([]);
        setResult(emptyResult);
        setPhase("done");
        return emptyResult;
      }

      setItems(batchItems);

      const progressTask = simulateBatchProgress(batchItems, updateItem, cancelledRef);

      try {
        const uploadResult = await onUpload?.(payload);
        await progressTask;

        if (uploadResult?.error) {
          applyBatchItemStatus(updateItem, batchItems, "error", {
            errorMessage: uploadResult.error,
          });
        } else if (uploadResult?.allSkipped) {
          applyBatchItemStatus(updateItem, batchItems, "skipped");
        } else if ((uploadResult?.added ?? []).length === 0) {
          applyBatchItemStatus(updateItem, batchItems, "error", {
            errorMessage: "No files were added.",
          });
        } else {
          applyBatchItemStatus(updateItem, batchItems, "done");
        }

        await sleep(120);

        const finalResult = buildFinalResult(uploadResult, skippedLocal);
        setResult(finalResult);
        setPhase(finalResult.hasError && finalResult.added.length === 0 ? "error" : "done");
        return finalResult;
      } catch (error) {
        await progressTask;
        applyBatchItemStatus(updateItem, batchItems, "error", {
          errorMessage: error instanceof Error ? error.message : "Upload failed",
        });

        const finalResult = {
          added: [],
          records: [],
          rejected: skippedLocal ?? 0,
          skippedLocal,
          skippedDuplicates: 0,
          allSkipped: false,
          partial: false,
          hasError: true,
          success: false,
          errorMessage: error instanceof Error ? error.message : "Upload failed",
        };
        setResult(finalResult);
        setPhase("error");
        return finalResult;
      }
    },
    [onUpload, updateItem],
  );

  const retryFailed = useCallback(async () => {
    if (!lastPayloadRef.current) return null;
    return runUpload(lastPayloadRef.current);
  }, [runUpload]);

  return {
    phase,
    items,
    result,
    runUpload,
    retryFailed,
    reset,
  };
}
