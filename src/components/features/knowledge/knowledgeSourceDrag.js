export const KNOWLEDGE_SOURCE_DRAG_MIME = "application/x-aziron-knowledge-source";

/** Map a flat source row to a linkable ref (library doc or hub-only file). */
export function docToSourceRef(doc) {
  if (!doc) return null;
  const name = doc.metadata?.title ?? doc.name ?? "Untitled";
  if (doc.isLibraryDocument) {
    return { type: "library", documentId: doc.id, name };
  }
  return { type: "hub", hubId: doc.hubId, fileId: doc.id, name };
}

export function encodeSourceDragPayload(ref) {
  return JSON.stringify(ref);
}

export function parseSourceDragPayload(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type === "library" && parsed.documentId) return parsed;
    if (parsed?.type === "hub" && parsed.hubId != null && parsed.fileId) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function setSourceDragData(dataTransfer, ref) {
  if (!dataTransfer || !ref) return;
  const encoded = encodeSourceDragPayload(ref);
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(KNOWLEDGE_SOURCE_DRAG_MIME, encoded);
  dataTransfer.setData("text/plain", ref.name ?? "Source");
}

export function getSourceDragPayload(dataTransfer) {
  if (!dataTransfer) return null;
  const raw = dataTransfer.getData(KNOWLEDGE_SOURCE_DRAG_MIME);
  return parseSourceDragPayload(raw);
}

export function isSourceDragEvent(event) {
  const types = event?.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes(KNOWLEDGE_SOURCE_DRAG_MIME);
}
