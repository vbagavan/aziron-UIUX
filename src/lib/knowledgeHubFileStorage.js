/**
 * IndexedDB storage for Knowledge Hub file blobs (cloud sync + uploads).
 */

const DB_NAME = "aziron-knowledge-hub-files";
const DB_VERSION = 1;
const STORE_NAME = "files";

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

export function knowledgeHubBlobKey(hubId, fileId) {
  return `kh-${hubId}-${fileId}`;
}

export function documentLibraryBlobKey(documentId) {
  return `doclib-${documentId}`;
}

/** Resolve IndexedDB key for hub files or standalone library documents. */
export function resolveFileStorageId(hubId, file) {
  if (file?.localBlobId) return file.localBlobId;
  if (hubId === "library" || file?.isLibraryDocument) {
    return documentLibraryBlobKey(file.id);
  }
  return knowledgeHubBlobKey(hubId, file.id);
}

/**
 * @param {string} id
 * @param {Blob} blob
 * @param {string} fileName
 */
export async function saveKnowledgeHubFile(id, blob, fileName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      id,
      blob,
      fileName,
      fileType: blob.type,
      size: blob.size,
      savedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getKnowledgeHubFile(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteKnowledgeHubFile(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* non-fatal */
  }
}
