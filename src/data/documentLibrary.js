import {
  cloudFileToHubRecord,
  fileToHubRecord,
  formatIsoDateToday,
  inferHubFileType,
  parseDisplaySizeToKb,
} from "@/data/knowledgeHubs";
import { createPendingHubFileMetadata } from "@/components/features/knowledge/hubFileMetadata";
import { createPendingSourceGuide } from "@/components/features/knowledge/hubSourceGuide";

export const DOCUMENT_LIBRARY_STORAGE_KEY = "aziron_document_library_v1";

const LIBRARY_HUB_ID = 0;

export function createLibraryDocumentId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Map a browser File to a library document row. */
export function fileToLibraryRecord(file) {
  const base = fileToHubRecord(file, LIBRARY_HUB_ID);
  return {
    ...base,
    id: createLibraryDocumentId(),
    uploadedAt: new Date().toISOString(),
    created: new Date().toISOString(),
    hubLinks: [],
  };
}

/** Map a cloud picker row to a library document record. */
export function cloudFileToLibraryRecord(
  pickerFile,
  { provider = "onedrive", connectionId = null, connectionName = null } = {},
) {
  const base = cloudFileToHubRecord(pickerFile, LIBRARY_HUB_ID, {
    provider,
    connectionId,
    connectionName,
  });
  return {
    ...base,
    id: createLibraryDocumentId(),
    hubLinks: [],
  };
}

export function resolveCloudImportToLibraryRecords(cloudImport) {
  if (!cloudImport?.selectedFiles?.length) return [];
  const provider = cloudImport.provider ?? cloudImport.connection?.provider ?? "onedrive";
  const connectionId = cloudImport.connection?.id ?? null;
  const connectionName =
    cloudImport.connectionName ??
    cloudImport.connection?.name ??
    (provider === "google-drive" ? "Google Drive connection" : "OneDrive connection");

  return cloudImport.selectedFiles
    .filter((f) => f && f.type !== "folder")
    .map((f) =>
      cloudFileToLibraryRecord(f, {
        provider,
        connectionId,
        connectionName,
      }),
    );
}

/** Hub associations for a library document (from stored links + live hub scan). */
export function getHubLinksForDocument(documentId, hubs = []) {
  const links = [];
  for (const hub of hubs) {
    for (const file of hub.userFiles ?? []) {
      if (file.libraryDocumentId === documentId) {
        links.push({
          hubId: hub.id,
          hubFileId: file.id,
          hubName: hub.name,
        });
      }
    }
  }
  return links;
}

export function loadDocumentsFromStorage() {
  try {
    const raw = localStorage.getItem(DOCUMENT_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDocumentsToStorage(documents) {
  try {
    localStorage.setItem(DOCUMENT_LIBRARY_STORAGE_KEY, JSON.stringify(documents));
  } catch {
    /* quota / private mode */
  }
}

export function libraryRecordToHubFile(libraryDoc, hubId) {
  const hubFileId = `kh${hubId}-link-${libraryDoc.id}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...libraryDoc,
    id: hubFileId,
    libraryDocumentId: libraryDoc.id,
    updated: "Just now",
    uploadedAt: libraryDoc.uploadedAt ?? formatIsoDateToday(),
    metadata: libraryDoc.metadata ?? createPendingHubFileMetadata(libraryDoc.name),
    sourceGuide: libraryDoc.sourceGuide ?? createPendingSourceGuide(),
  };
}

export function formatLibraryCloudImport(cloudImport) {
  if (!cloudImport?.selectedFiles?.length) return null;
  const provider = cloudImport.provider ?? "onedrive";
  return {
    provider,
    connection: cloudImport.connection ?? null,
    connectionName: cloudImport.connectionName ?? null,
    authMethod: cloudImport.authMethod,
    selectedFiles: cloudImport.selectedFiles,
  };
}

export function inferLibraryDisplayType(name, mimeType) {
  return inferHubFileType(name, mimeType);
}

export function pickerSizeToKb(sizeStr) {
  return parseDisplaySizeToKb(sizeStr);
}
