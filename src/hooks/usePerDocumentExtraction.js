import { useCallback, useEffect, useRef, useState } from "react";
import { getReviewFieldKeys } from "@/data/projectDocumentTypeFields";
import {
  buildDocumentReviewFormValues,
  extractMetadataFromSingleDocument,
} from "@/lib/projectMetadataExtraction";

/**
 * @typedef {'idle' | 'loading' | 'done' | 'error'} ExtractionStatus
 */

/**
 * Manages per-upload extraction + form values for multi-document review.
 *
 * @param {Record<string, string>} baseMetadata - seed values (project metadata or empty)
 */
export function usePerDocumentExtraction(baseMetadata) {
  const [uploads, setUploads] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  /** @type {[Record<string, { formValues: Record<string, string>, reviewFieldKeys: string[], status: ExtractionStatus, error?: string }>, Function]} */
  const [perDoc, setPerDoc] = useState({});
  const extractingRef = useRef(new Set());
  const baseRef = useRef(baseMetadata);
  baseRef.current = baseMetadata;

  const activeUpload = uploads[activeIndex] ?? null;
  const activeDocState = activeUpload ? perDoc[activeUpload.id] : null;
  const activeReviewFieldKeys = activeUpload
    ? (activeDocState?.reviewFieldKeys ??
      getReviewFieldKeys(activeUpload.documentType))
    : [];

  const runExtraction = useCallback(async (upload) => {
    if (extractingRef.current.has(upload.id)) return;
    extractingRef.current.add(upload.id);
    setPerDoc((prev) => ({
      ...prev,
      [upload.id]: {
        formValues: prev[upload.id]?.formValues ?? { ...baseRef.current },
        status: "loading",
      },
    }));

    try {
      const extracted = await extractMetadataFromSingleDocument(
        { documentType: upload.documentType, fileName: upload.fileName },
        baseRef.current,
      );
      const { formValues, reviewKeys } = buildDocumentReviewFormValues(
        upload,
        extracted,
        baseRef.current,
      );
      setPerDoc((prev) => ({
        ...prev,
        [upload.id]: { formValues, reviewFieldKeys: reviewKeys, status: "done" },
      }));
    } catch {
      setPerDoc((prev) => ({
        ...prev,
        [upload.id]: {
          formValues: { ...baseRef.current },
          status: "error",
          error: "Extraction failed for this document.",
        },
      }));
    } finally {
      extractingRef.current.delete(upload.id);
    }
  }, []);

  const uploadIdsKey = uploads.map((u) => u.id).join(",");

  useEffect(() => {
    for (const upload of uploads) {
      if (!perDoc[upload.id]) {
        runExtraction(upload);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when upload set changes only
  }, [uploadIdsKey, runExtraction]);

  const setUploadsAndSync = useCallback((nextUploads) => {
    setUploads(nextUploads);
    if (nextUploads.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((i) => Math.min(i, nextUploads.length - 1));
  }, []);

  const updateActiveFormValue = useCallback(
    (key, value) => {
      if (!activeUpload) return;
      setPerDoc((prev) => {
        const current = prev[activeUpload.id];
        if (!current?.formValues) return prev;
        return {
          ...prev,
          [activeUpload.id]: {
            ...current,
            formValues: { ...current.formValues, [key]: value },
          },
        };
      });
    },
    [activeUpload],
  );

  const retryExtraction = useCallback(
    (uploadId) => {
      const upload = uploads.find((u) => u.id === uploadId);
      if (!upload) return;
      extractingRef.current.delete(uploadId);
      setPerDoc((prev) => {
        const next = { ...prev };
        delete next[uploadId];
        return next;
      });
      runExtraction(upload);
    },
    [uploads, runExtraction],
  );

  const anyExtracting = uploads.some((u) => perDoc[u.id]?.status === "loading");

  return {
    uploads,
    setUploads: setUploadsAndSync,
    activeIndex,
    setActiveIndex,
    activeUpload,
    activeFormValues: activeDocState?.formValues ?? baseMetadata,
    activeReviewFieldKeys,
    activeStatus: activeDocState?.status ?? "idle",
    activeError: activeDocState?.error,
    perDoc,
    updateActiveFormValue,
    retryExtraction,
    anyExtracting,
  };
}
