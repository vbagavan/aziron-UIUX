import { extractDocumentMarkdown } from "@/components/features/knowledge/hubDocumentExtraction";
import { getDocumentPreviewKind } from "@/lib/projectDocumentPreview";
import {
  createPendingHubFileMetadata,
  enrichHubFileMetadata,
  parseTitleFromFileName,
} from "@/components/features/knowledge/hubFileMetadata";
import {
  createPendingSourceGuide,
  generateSourceGuide,
} from "@/components/features/knowledge/hubSourceGuide";
import { getKnowledgeHubFile } from "@/lib/knowledgeHubFileStorage";

/**
 * Runs metadata enrichment for a stored hub file and persists via updateHubFile.
 * @param {number | string} hubId
 * @param {{ id: string, name: string, localBlobId?: string | null }} fileRecord
 * @param {(hubId: number | string, fileId: string, patch: object) => void} updateHubFile
 */
export async function enrichStoredHubFile(hubId, fileRecord, updateHubFile) {
  if (!fileRecord?.id || !fileRecord?.localBlobId) return;

  const pendingPatch = {
    metadata:
      fileRecord.metadata?.status === "loading"
        ? fileRecord.metadata
        : createPendingHubFileMetadata(fileRecord.name),
    sourceGuide:
      fileRecord.sourceGuide?.status === "loading"
        ? fileRecord.sourceGuide
        : createPendingSourceGuide(),
  };
  updateHubFile(hubId, fileRecord.id, pendingPatch);

  try {
    const stored = await getKnowledgeHubFile(fileRecord.localBlobId);
    if (!stored?.blob) {
      updateHubFile(hubId, fileRecord.id, {
        metadata: {
          status: "failed",
          title: parseTitleFromFileName(fileRecord.name),
          fetchedAt: new Date().toISOString(),
        },
        sourceGuide: { status: "failed", generatedAt: new Date().toISOString() },
      });
      return;
    }

    const mime = stored.fileType ?? stored.blob.type ?? "";
    const metadata = await enrichHubFileMetadata({
      blob: stored.blob,
      fileName: fileRecord.name,
      mimeType: mime,
      file: fileRecord,
    });

    const previewKind = getDocumentPreviewKind(fileRecord.name, mime);
    const isBinary =
      previewKind === "video" ||
      previewKind === "audio" ||
      previewKind === "image" ||
      previewKind === "epub";

    let text = "";
    if (!isBinary) {
      try {
        text = (await extractDocumentMarkdown(stored.blob, fileRecord.name, mime)) ?? "";
      } catch {
        text = await stored.blob.text().catch(() => "");
      }
    }

    const sourceGuide = await generateSourceGuide({
      text,
      fileName: fileRecord.name,
      metadata,
      allFiles: [],
    });

    updateHubFile(hubId, fileRecord.id, { metadata, sourceGuide });
  } catch {
    updateHubFile(hubId, fileRecord.id, {
      metadata: {
        status: "failed",
        title: parseTitleFromFileName(fileRecord.name),
        fetchedAt: new Date().toISOString(),
      },
      sourceGuide: { status: "failed", generatedAt: new Date().toISOString() },
    });
  }
}

/**
 * @param {number | string} hubId
 * @param {Array<{ id: string, name: string, localBlobId?: string | null }>} records
 * @param {(hubId: number | string, fileId: string, patch: object) => void} updateHubFile
 */
export function enrichStoredHubFiles(hubId, records, updateHubFile) {
  for (const record of records ?? []) {
    if (record?.localBlobId) {
      void enrichStoredHubFile(hubId, record, updateHubFile);
    }
  }
}
