/**
 * @param {string} fileName
 * @param {string} [mimeType]
 * @returns {'image' | 'pdf' | 'docx' | 'doc-legacy' | 'markdown' | 'text' | 'csv' | 'html' | 'video' | 'audio' | 'epub' | 'unsupported'}
 */
export function getDocumentPreviewKind(fileName, mimeType = "") {
  const lower = (fileName ?? "").toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  if (
    mime === "application/epub+zip" ||
    mime.includes("epub") ||
    lower.endsWith(".epub")
  ) {
    return "epub";
  }

  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg|heic|tiff?)$/i.test(lower)) {
    return "image";
  }
  if (
    mime.startsWith("video/") ||
    /\.(mp4|mov|webm|mkv|avi|m4v|mpg|mpeg|wmv)$/i.test(lower)
  ) {
    return "video";
  }
  if (
    mime.startsWith("audio/") ||
    /\.(mp3|wav|m4a|aac|ogg|flac|wma|aiff|opus)$/i.test(lower)
  ) {
    return "audio";
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
    lower.endsWith(".docx")
  ) {
    return "docx";
  }
  if (
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    mime === "text/markdown"
  ) {
    return "markdown";
  }
  if (lower.endsWith(".csv") || mime === "text/csv") {
    return "csv";
  }
  if (mime === "text/html" || lower.endsWith(".html") || lower.endsWith(".htm")) {
    return "html";
  }
  if (
    mime.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".log") ||
    lower.endsWith(".json")
  ) {
    return "text";
  }
  return "unsupported";
}

/** Whether we can create an immediate object URL for in-browser preview. */
export function supportsObjectUrlPreview(fileName, mimeType = "") {
  const kind = getDocumentPreviewKind(fileName, mimeType);
  return kind === "image" || kind === "pdf" || kind === "video" || kind === "audio";
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
