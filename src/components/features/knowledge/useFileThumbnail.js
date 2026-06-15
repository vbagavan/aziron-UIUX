import { useEffect, useState } from "react";
import {
  getKnowledgeHubFile,
  resolveFileStorageId,
} from "@/lib/knowledgeHubFileStorage";
import { generateCloudFilePlaceholderThumbnail } from "@/lib/hubCloudThumbnail";
import {
  createImageThumbnailUrl,
  formatMediaDuration,
  generateContentThumbnail,
  generateHubFileThumbnail,
  generatePdfThumbnail,
  getHubFilePreviewKind,
} from "@/lib/hubThumbnail";
import { getDocumentPreviewKind } from "@/lib/projectDocumentPreview";
import { isCloudFileLinked } from "@/data/knowledgeHubs";

const CONTENT_KINDS = new Set(["text", "markdown", "html", "csv", "docx"]);

/**
 * Loads a thumbnail URL for a hub file — real preview when possible.
 * Returns { thumbnail, loading, isObjectUrl, overlay, previewKind, fit }
 */
export function useFileThumbnail(hubId, file) {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isObjectUrl, setIsObjectUrl] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [previewKind, setPreviewKind] = useState("unsupported");

  useEffect(() => {
    if (!hubId || !file) return;

    const cachedThumb = file.metadata?.thumbnailDataUrl ?? null;
    const coverUrl = file.metadata?.coverUrl ?? null;
    const durationLabel =
      file.metadata?.durationLabel ??
      (file.metadata?.durationSeconds != null
        ? formatMediaDuration(file.metadata.durationSeconds)
        : null);

    const storageId = resolveFileStorageId(hubId, file);
    const isLinkedCloud = file.source === "cloud" && isCloudFileLinked(file);

    let cancelled = false;
    let objectUrl = null;

    setLoading(true);
    setThumbnail(null);
    setIsObjectUrl(false);
    setOverlay(null);
    setPreviewKind(getHubFilePreviewKind(file));

    (async () => {
      try {
        if (cachedThumb) {
          if (!cancelled) {
            setThumbnail(cachedThumb);
            setPreviewKind(getHubFilePreviewKind(file));
            if (durationLabel && (file.type === "Video" || file.type === "Audio")) {
              setOverlay(durationLabel);
            }
          }
          return;
        }

        const record = await getKnowledgeHubFile(storageId);
        const mime = record?.fileType ?? record?.blob?.type ?? "";
        const kind = getHubFilePreviewKind(file, mime);
        if (!cancelled) setPreviewKind(kind);

        if (!cancelled && record?.blob) {
          if (kind === "image") {
            objectUrl = createImageThumbnailUrl(record.blob);
            setThumbnail(objectUrl);
            setIsObjectUrl(true);
            return;
          }

          if (kind === "pdf") {
            const dataUrl = await generatePdfThumbnail(record.blob);
            if (dataUrl) {
              setThumbnail(dataUrl);
              return;
            }
            const fallback = await generateContentThumbnail(record.blob, file.name, "text");
            if (fallback) {
              setThumbnail(fallback);
              return;
            }
          }

          if (kind === "video" || kind === "audio" || kind === "epub") {
            const result = await generateHubFileThumbnail(
              record.blob,
              file.name,
              mime,
              file,
            );
            if (result?.dataUrl) {
              setThumbnail(result.dataUrl);
              if (result.duration != null) {
                setOverlay(formatMediaDuration(result.duration));
              }
              return;
            }
          }

          if (CONTENT_KINDS.has(kind)) {
            const dataUrl = await generateContentThumbnail(record.blob, file.name, kind);
            if (dataUrl) {
              setThumbnail(dataUrl);
              return;
            }
          }
        }

        if (!cancelled && isLinkedCloud) {
          const placeholder = await generateCloudFilePlaceholderThumbnail(file);
          if (placeholder) {
            setThumbnail(placeholder);
            return;
          }
        }

        if (!cancelled && coverUrl) {
          setThumbnail(coverUrl);
          if (durationLabel) setOverlay(durationLabel);
        }
      } catch (err) {
        console.warn("[useFileThumbnail] failed:", err);
        if (!cancelled && isLinkedCloud) {
          const placeholder = await generateCloudFilePlaceholderThumbnail(file);
          if (placeholder) setThumbnail(placeholder);
          else if (coverUrl) setThumbnail(coverUrl);
        } else if (!cancelled && coverUrl) {
          setThumbnail(coverUrl);
          if (durationLabel) setOverlay(durationLabel);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    hubId,
    file?.id,
    file?.localBlobId,
    file?.name,
    file?.type,
    file?.source,
    file?.syncStatus,
    file?.metadata?.coverUrl,
    file?.metadata?.thumbnailDataUrl,
    file?.metadata?.durationLabel,
    file?.metadata?.durationSeconds,
  ]);

  const kind = previewKind || getDocumentPreviewKind(file?.name ?? "", "");
  const fit = kind === "image" || kind === "video" ? "cover" : "contain";

  return { thumbnail, loading, isObjectUrl, overlay, previewKind, fit };
}
