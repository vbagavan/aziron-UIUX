/**
 * @param {string} fileName
 * @param {string} [mimeType]
 * @returns {'image' | 'pdf' | 'docx' | 'doc-legacy' | 'unsupported'}
 */
export function getDocumentPreviewKind(fileName, mimeType = "") {
  const lower = (fileName ?? "").toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower)) {
    return "image";
  }
  if (mime === "application/pdf" || mime.includes("pdf") || lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (lower.endsWith(".doc") && !lower.endsWith(".docx")) {
    return "doc-legacy";
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime.includes("wordprocessingml") ||
    mime.includes("officedocument") ||
    lower.endsWith(".docx")
  ) {
    return "docx";
  }
  return "unsupported";
}

/** Whether we can create an immediate object URL for in-browser preview. */
export function supportsObjectUrlPreview(fileName, mimeType = "") {
  const kind = getDocumentPreviewKind(fileName, mimeType);
  return kind === "image" || kind === "pdf";
}

/** Normalize blob MIME for viewers when the browser reports octet-stream. */
export function normalizePreviewBlob(blob, fileName) {
  const kind = getDocumentPreviewKind(fileName, blob.type ?? "");
  if (blob.type && blob.type !== "application/octet-stream") return blob;
  const types = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    image: "image/png",
  };
  if (kind === "pdf") return new Blob([blob], { type: types.pdf });
  if (kind === "docx") return new Blob([blob], { type: types.docx });
  return blob;
}
