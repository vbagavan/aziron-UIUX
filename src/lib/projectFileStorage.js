/**
 * IndexedDB-backed file storage for project documents.
 * Files are stored as Blobs so they survive page refreshes.
 */

const DB_NAME = "aziron-project-files";
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

/**
 * Save a File to IndexedDB.
 * @param {string} id - The upload slot ID
 * @param {File} file
 * @returns {Promise<void>}
 */
export async function saveFileToStorage(id, file) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({
        id,
        blob: file,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        savedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Storage failure is non-fatal — file is still in-memory
  }
}

/**
 * Retrieve a stored file record from IndexedDB.
 * @param {string} id
 * @returns {Promise<{ id: string, blob: Blob, fileName: string, fileType: string, size: number } | null>}
 */
export async function getFileFromStorage(id) {
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

/**
 * Create a temporary object URL for a stored file.
 * Caller must call URL.revokeObjectURL(url) when done.
 * @param {string} id
 * @returns {Promise<string | null>}
 */
export async function getFileUrl(id) {
  const record = await getFileFromStorage(id);
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}

/**
 * Delete a file from IndexedDB.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteFileFromStorage(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Non-fatal
  }
}

/**
 * Infer document type from a filename using heuristics (hint only — user selects type at upload).
 * @param {string} fileName
 * @returns {import("@/data/projectDocuments").PROJECT_DOCUMENT_TYPES[number]["id"]}
 */
export function detectDocumentType(fileName) {
  const lower = (fileName ?? "").toLowerCase();
  if (
    lower.includes("nda") ||
    lower.includes("non-disclosure") ||
    lower.includes("nondisclosure")
  )
    return "NDA";
  if (lower.includes("sla") || lower.includes("service-level"))
    return "SLA";
  if (lower.includes("renewal") || lower.includes("extension"))
    return "Renewal";
  if (
    lower.includes("change-request") ||
    lower.includes("change_request") ||
    /\bcr[\s_-]/.test(lower) ||
    lower.includes("amendment") ||
    lower.includes("addendum")
  )
    return "CR";
  if (lower.includes("rate-card") || lower.includes("rate_card") || lower.includes("ratecard"))
    return "RateCard";
  if (lower.includes("quotation") || lower.includes("pricing-sheet") || lower.includes("pricing_sheet"))
    return "Quotation";
  if (lower.includes("proposal") || lower.includes("rfp"))
    return "Proposal";
  if (
    lower.includes(" po ") ||
    lower.startsWith("po-") ||
    lower.startsWith("po_") ||
    lower.includes("purchase-order") ||
    lower.includes("purchase_order") ||
    /\bpo\d/.test(lower)
  )
    return "PO";
  if (
    lower.includes("sow") ||
    lower.includes("swo") ||
    lower.includes("statement-of-work") ||
    lower.includes("statement_of_work")
  )
    return "SOW";
  if (
    lower.includes("contract") &&
    !lower.includes("subcontract")
  )
    return "Contract";
  if (
    lower.includes("msa") ||
    lower.includes("master-service") ||
    lower.includes("master_service")
  )
    return "MSA";
  return "MSA";
}
