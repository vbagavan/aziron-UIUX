/**
 * Join project documents ↔ timeline entries for cross-tab navigation.
 */

/** @param {object} entry */
/** @param {object} doc */
export function timelineEntryMatchesDocument(entry, doc) {
  if (!entry?.documentRef || !doc) return false;
  const ref = entry.documentRef;
  if (ref.documentId && doc.id) return ref.documentId === doc.id;
  return ref.type === doc.type && ref.fileName === doc.fileName;
}

/**
 * @param {object[]} timelineEntries
 * @param {string} projectId
 * @param {object} doc
 */
export function findTimelineEntriesForDocument(timelineEntries, projectId, doc) {
  return timelineEntries
    .filter((e) => e.projectId === projectId && timelineEntryMatchesDocument(e, doc))
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

/**
 * @param {object[]} documents
 * @param {object} entry
 */
export function findDocumentForTimelineEntry(documents, entry) {
  if (!entry?.documentRef || !documents?.length) return null;
  const ref = entry.documentRef;
  if (ref.documentId) {
    return documents.find((d) => d.id === ref.documentId) ?? null;
  }
  return (
    documents.find((d) => d.type === ref.type && d.fileName === ref.fileName) ?? null
  );
}

/**
 * Metadata version produced by a document upload (from doc record or linked timeline entry).
 * @param {object} doc
 * @param {object[]} timelineEntries
 * @param {string} projectId
 */
export function getDocumentMetadataVersion(doc, timelineEntries, projectId) {
  if (doc.metadataVersion != null) return doc.metadataVersion;
  const linked = findTimelineEntriesForDocument(timelineEntries, projectId, doc);
  const withVersion = linked.find((e) => e.version != null);
  return withVersion?.version ?? null;
}
