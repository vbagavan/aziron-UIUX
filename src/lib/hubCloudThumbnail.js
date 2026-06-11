/**
 * Thumbnail helpers for cloud-linked files (no local blob yet).
 */

import { generateContentThumbnail, generateHubFileThumbnail } from "@/lib/hubThumbnail";
import { getDocumentPreviewKind } from "@/lib/projectDocumentPreview";
import { downloadCloudFileBlob } from "@/lib/knowledgeHubCloudSync";

function titleFromName(fileName) {
  return (fileName ?? "Document").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

/** Rich placeholder text that renders well as a document-style thumbnail. */
export function mockCloudDocumentText(file) {
  const name = file?.name ?? "Document";
  const title = titleFromName(name);
  const provider = file?.cloudProvider ?? "cloud";
  const kind = getDocumentPreviewKind(name, "");

  const intros = {
    pdf: `${title}\n\nOverview\n\nThis PDF is synced from ${provider}. It contains structured sections, headings, and body text suitable for agent retrieval once saved to your knowledge base.`,
    docx: `${title}\n\nRelease summary\n\nPrepared for distribution via ${provider}. Includes version notes, feature highlights, and migration guidance for teams adopting the latest release.`,
    text: `${title}\n\nNotes\n\nSource file linked from ${provider}. Plain text content is available after you save this file to your knowledge base.`,
    markdown: `# ${title}\n\nLinked from ${provider}.\n\n## Summary\n\nMarkdown documentation with headings and lists for hub search and citations.`,
    csv: `id,name,status\n1,${title},active\n2,backup,ready\n3,sync,linked`,
    html: `<html><head><title>${title}</title></head><body><h1>${title}</h1><p>Cloud document from ${provider}.</p></body></html>`,
    image: title,
  };

  if (kind === "pdf") return intros.pdf;
  if (kind === "docx") return intros.docx;
  if (kind === "markdown") return intros.markdown;
  if (kind === "csv") return intros.csv;
  if (kind === "html") return intros.html;
  if (kind === "text") return intros.text;
  return `${title}\n\nCloud file from ${provider}. Save to your knowledge base for full preview and metadata enrichment.`;
}

/**
 * Immediate canvas thumbnail for a linked cloud file (no download).
 * @returns {Promise<string | null>} data URL
 */
export async function generateCloudFilePlaceholderThumbnail(file) {
  const name = file?.name ?? "file";
  const kind = getDocumentPreviewKind(name, "");
  const text = mockCloudDocumentText(file);
  const blob = new Blob([text], { type: "text/plain" });
  const previewKind =
    kind === "docx" ? "docx" : kind === "pdf" ? "text" : kind === "unsupported" ? "text" : kind;
  return generateContentThumbnail(blob, name, previewKind === "docx" ? "text" : previewKind);
}

/**
 * Download cloud content (prototype) and build a real thumbnail; cache in metadata.
 */
export async function prefetchCloudFileThumbnail(hubId, file, updateHubFile) {
  if (!file?.id || file.source !== "cloud") return;
  if (file.localBlobId) return;
  if (file.metadata?.thumbnailDataUrl) return;

  try {
    const blob = await downloadCloudFileBlob(file, { previewOnly: true });
    const mime = blob.type ?? "";
    const thumb = await generateHubFileThumbnail(blob, file.name, mime, file);
    let dataUrl = thumb?.dataUrl ?? null;

    if (!dataUrl) {
      dataUrl = await generateCloudFilePlaceholderThumbnail(file);
    }

    if (!dataUrl) return;

    updateHubFile(hubId, file.id, {
      metadata: {
        ...(file.metadata ?? {}),
        status: file.metadata?.status === "loading" ? "loading" : "ready",
        title: file.metadata?.title ?? titleFromName(file.name),
        thumbnailDataUrl: dataUrl,
        coverUrl: thumb?.coverUrl ?? file.metadata?.coverUrl ?? dataUrl,
        durationSeconds: thumb?.duration ?? file.metadata?.durationSeconds,
        durationLabel: file.metadata?.durationLabel,
        fetchedAt: new Date().toISOString(),
        source: file.metadata?.source ?? "cloud",
      },
    });
  } catch (err) {
    console.warn("[prefetchCloudFileThumbnail] failed:", err);
  }
}
