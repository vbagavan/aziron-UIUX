import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  SEED_KNOWLEDGE_HUBS,
  cloudFileToHubRecord,
  createHubPayload,
  fileToHubRecord,
  filesToHubStats,
  hubRecordsToStats,
  hubToPickerShape,
  loadHubsFromStorage,
  normalizeHubs,
  saveHubsToStorage,
} from "@/data/knowledgeHubs";
import { countAgentsUsingHub } from "@/lib/agentKnowledge";
import { downloadCloudFileBlob } from "@/lib/knowledgeHubCloudSync";
import { createPendingHubFileMetadata } from "@/components/features/knowledge/hubFileMetadata";
import { createPendingSourceGuide } from "@/components/features/knowledge/hubSourceGuide";
import { enrichStoredHubFile, enrichStoredHubFiles } from "@/components/features/knowledge/hubFileEnrichment";
import {
  deleteKnowledgeHubFile,
  documentLibraryBlobKey,
  getKnowledgeHubFile,
  knowledgeHubBlobKey,
  saveKnowledgeHubFile,
} from "@/lib/knowledgeHubFileStorage";
import { isSingleHubSource } from "@/lib/sourceCategories";
import { useAgentsOptional } from "@/context/AgentsContext";
import {
  fileToLibraryRecord,
  applyLibraryDocumentHubLink,
  getHubLinksForDocument,
  libraryRecordToHubFile,
  loadDocumentsFromStorage,
  resolveCloudImportToLibraryRecords,
  saveDocumentsToStorage,
  syncDemoCategoryHubLinks,
} from "@/data/documentLibrary";

const KnowledgeHubContext = createContext(null);

function attachUsedBy(hub, agents) {
  if (!agents?.length) return hub;
  return { ...hub, usedBy: countAgentsUsingHub(hub.id, agents) };
}

export function KnowledgeHubProvider({ children }) {
  const agentsCtx = useAgentsOptional();
  const agents = agentsCtx?.agents ?? [];

  const initialDocuments = loadDocumentsFromStorage();

  const [hubs, setHubs] = useState(() => {
    const loaded = loadHubsFromStorage() ?? normalizeHubs(SEED_KNOWLEDGE_HUBS);
    return syncDemoCategoryHubLinks(loaded, initialDocuments);
  });

  const [documents, setDocuments] = useState(initialDocuments);

  useEffect(() => {
    saveHubsToStorage(hubs);
  }, [hubs]);

  useEffect(() => {
    saveDocumentsToStorage(documents);
  }, [documents]);

  const hubsWithUsage = useMemo(
    () => hubs.map((h) => attachUsedBy(h, agents)),
    [hubs, agents],
  );

  const updateHub = useCallback((id, patch) => {
    setHubs((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              ...patch,
              updated: "Just now",
              updatedAt: new Date().toISOString(),
            }
          : h,
      ),
    );
  }, []);

  const recordHubAccess = useCallback((id) => {
    const now = new Date().toISOString();
    setHubs((prev) =>
      prev.map((h) =>
        Number(h.id) === Number(id)
          ? {
              ...h,
              lastAccessedAt: now,
              accessCount: (h.accessCount ?? 0) + 1,
            }
          : h,
      ),
    );
  }, []);

  const updateHubFile = useCallback((hubId, fileId, patch) => {
    const numericHubId = Number(hubId);
    setHubs((prev) =>
      prev.map((h) => {
        if (Number(h.id) !== numericHubId) return h;
        const userFiles = (h.userFiles ?? []).map((f) =>
          f.id === fileId ? { ...f, ...patch, updated: "Just now" } : f,
        );
        return { ...h, userFiles, updated: "Just now" };
      }),
    );
  }, []);

  const addHub = useCallback(async (payload) => {
    const hub = createHubPayload(payload);
    const userFiles = [...(hub.userFiles ?? [])];
    const uploadList = payload.pendingFiles?.length
      ? Array.from(payload.pendingFiles)
      : payload.pendingFile
        ? [payload.pendingFile]
        : [];
    const pendingUploads = [...uploadList];

    for (let i = 0; i < userFiles.length; i += 1) {
      const row = userFiles[i];

      if (row.source === "user" && !row.localBlobId && !row.draftBlobId) {
        const fileIndex = pendingUploads.findIndex((f) => f.name === row.name);
        if (fileIndex >= 0) {
          const file = pendingUploads.splice(fileIndex, 1)[0];
          const blobKey = knowledgeHubBlobKey(hub.id, row.id);
          try {
            await saveKnowledgeHubFile(blobKey, file, file.name);
            userFiles[i] = {
              ...row,
              localBlobId: blobKey,
              syncStatus: "stored",
              fileStatus: "success",
              indexStatus: "stored",
              metadata: createPendingHubFileMetadata(row.name),
              sourceGuide: createPendingSourceGuide(),
            };
          } catch {
            /* metadata row kept; user can re-upload on hub page */
          }
        }
      }

      const draftId = userFiles[i].draftBlobId;
      if (!draftId) continue;
      try {
        const record = await getKnowledgeHubFile(draftId);
        if (record) {
          const finalId = knowledgeHubBlobKey(hub.id, userFiles[i].id);
          await saveKnowledgeHubFile(finalId, record.blob, record.fileName);
          await deleteKnowledgeHubFile(draftId);
          userFiles[i] = {
            ...userFiles[i],
            localBlobId: finalId,
            draftBlobId: undefined,
            syncStatus: "stored",
            fileStatus: "success",
            indexStatus: "stored",
            metadata: userFiles[i].metadata ?? createPendingHubFileMetadata(userFiles[i].name),
            sourceGuide: userFiles[i].sourceGuide ?? createPendingSourceGuide(),
          };
        }
      } catch {
        /* keep draft reference; user can retry on hub page */
      }
    }

    const { pendingFileName: _drop, ...stored } = { ...hub, userFiles };
    setHubs((prev) => [...prev, stored]);

    const enrichedRows = userFiles.filter((f) => f.localBlobId);
    if (enrichedRows.length > 0) {
      queueMicrotask(() => {
        enrichStoredHubFiles(hub.id, enrichedRows, updateHubFile);
      });
    }

    return attachUsedBy(stored, agents);
  }, [agents, updateHubFile]);

  const addDocumentsToHub = useCallback(async (hubId, { files = [], cloudImport, cloudImports } = {}) => {
    const targetId = Number(hubId);
    if (Number.isNaN(targetId)) {
      return { added: [], rejected: 0, records: [] };
    }

    const incoming = Array.from(files ?? []);
    const { valid, rejected } = partitionUploadFiles(incoming);
    const imports = cloudImports?.length
      ? cloudImports
      : cloudImport
        ? [cloudImport]
        : [];
    const cloudRecords = imports.flatMap((imp) => resolveCloudImportToLibraryRecords(imp));
    const newRecords = [];

    for (const file of valid) {
      const record = fileToLibraryRecord(file);
      const blobKey = documentLibraryBlobKey(record.id);
      try {
        await saveKnowledgeHubFile(blobKey, file, file.name);
        newRecords.push({
          ...record,
          localBlobId: blobKey,
          syncStatus: "stored",
          fileStatus: "success",
          indexStatus: "stored",
          metadata: createPendingHubFileMetadata(record.name),
          sourceGuide: createPendingSourceGuide(),
        });
      } catch {
        newRecords.push(record);
      }
    }

    for (const record of cloudRecords) {
      newRecords.push({
        ...record,
        metadata: createPendingHubFileMetadata(record.name),
        sourceGuide: createPendingSourceGuide(),
      });
    }

    if (newRecords.length === 0) {
      return { added: [], rejected: rejected.length, records: [] };
    }

    let hubFiles = [];
    setHubs((prev) => {
      const targetHub = prev.find((h) => Number(h.id) === targetId);
      if (!targetHub) return prev;

      const existingNames = new Set((targetHub.userFiles ?? []).map((f) => f.name.toLowerCase()));
      const existingExternal = new Set(
        (targetHub.userFiles ?? [])
          .map((f) => f.externalFileId)
          .filter(Boolean),
      );
      const existingLibraryIds = new Set(
        (targetHub.userFiles ?? [])
          .map((f) => f.libraryDocumentId)
          .filter(Boolean),
      );

      const toLink = newRecords.filter((doc) => {
        if (existingLibraryIds.has(doc.id)) return false;
        if (doc.externalFileId && existingExternal.has(doc.externalFileId)) return false;
        if (existingNames.has(doc.name.toLowerCase())) return false;
        return true;
      });

      hubFiles = toLink.map((doc) => libraryRecordToHubFile(doc, targetId));

      if (hubFiles.length === 0) return prev;

      const addedKb = hubFiles.reduce((sum, f) => sum + (f.sizeKb ?? 0), 0);
      const cloudConnections = (() => {
        const conn = imports[0]?.connection ?? cloudImport?.connection;
        if (!conn) return targetHub.cloudConnections ?? [];
        const existing = targetHub.cloudConnections ?? [];
        if (existing.some((c) => c.id === conn.id || c.provider === conn.provider)) {
          return existing;
        }
        return [...existing, conn];
      })();

      return prev.map((h) => {
        if (Number(h.id) !== targetId) return h;
        const userFiles = [...(h.userFiles ?? []), ...hubFiles];
        return {
          ...h,
          userFiles,
          cloudConnections,
          files: userFiles.length,
          collections: userFiles.length > 0 ? 1 : 0,
          storageMB: (h.storageMB ?? 0) + Math.max(0, Math.round(addedKb / 1024)),
          updated: "Just now",
          updatedAt: new Date().toISOString(),
          isUserCreated: true,
        };
      });
    });

    const linkedDocIds = new Set(hubFiles.map((f) => f.libraryDocumentId));
    const docsToAdd = newRecords.filter((d) => linkedDocIds.has(d.id));

    if (docsToAdd.length > 0) {
      setDocuments((prev) => [...prev, ...docsToAdd]);
    }

    const enriched = docsToAdd.filter((r) => r.localBlobId);
    if (enriched.length > 0) {
      queueMicrotask(() => {
        enrichStoredHubFiles(
          targetId,
          enriched.map((doc) => {
            const hubFile = hubFiles.find((f) => f.libraryDocumentId === doc.id);
            return hubFile ?? doc;
          }),
          updateHubFile,
        );
        enrichStoredHubFiles(
          "library",
          enriched,
          (_hubId, fileId, patch) => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === fileId ? { ...d, ...patch } : d)),
            );
          },
        );
      });
    }

    return {
      added: hubFiles.map((f) => f.name),
      rejected: rejected.length,
      records: hubFiles,
    };
  }, [updateHubFile]);

  const addCloudFilesToHub = useCallback(
    async (hubId, pickerFiles, connection) => {
      const files = (pickerFiles ?? []).filter((f) => f && f.type !== "folder");
      if (files.length === 0) return [];

      const provider = connection?.provider ?? "onedrive";
      const cloudImport = {
        provider,
        connection,
        connectionName: connection?.name,
        selectedFiles: files,
      };

      const result = await addDocumentsToHub(hubId, { cloudImport });
      return result.added ?? [];
    },
    [addDocumentsToHub],
  );

  const addFilesToHub = useCallback(
    async (id, fileList) => {
      return addDocumentsToHub(id, { files: fileList });
    },
    [addDocumentsToHub],
  );

  /**
   * Copy existing hub file records (and local blobs) into another hub.
   * @param {{ hubId: number | string, fileId: string }[]} refs
   * @param {number | string} targetHubId
   */
  const copyHubFilesToHub = useCallback(async (refs, targetHubId) => {
    const targetId = Number(targetHubId);
    const copied = [];
    const skipped = [];

    for (const ref of refs ?? []) {
      const sourceHubId = Number(ref.hubId);
      const fileId = ref.fileId;
      if (!fileId || Number.isNaN(sourceHubId) || Number.isNaN(targetId)) continue;

      if (sourceHubId === targetId) {
        skipped.push(fileId);
        continue;
      }

      const sourceHub = hubs.find((h) => Number(h.id) === sourceHubId);
      const file = sourceHub?.userFiles?.find((f) => f.id === fileId);
      if (!file) continue;

      if (isSingleHubSource(file)) {
        skipped.push(fileId);
        continue;
      }

      const newId = `kh${targetId}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newRecord = {
        ...file,
        id: newId,
        updated: "Just now",
        uploadedAt: file.uploadedAt ?? new Date().toISOString(),
      };

      const sourceStorageId = file.localBlobId ?? knowledgeHubBlobKey(sourceHubId, file.id);
      try {
        const stored = await getKnowledgeHubFile(sourceStorageId);
        if (stored?.blob) {
          const destStorageId = knowledgeHubBlobKey(targetId, newId);
          await saveKnowledgeHubFile(destStorageId, stored.blob, stored.fileName ?? file.name);
          newRecord.localBlobId = destStorageId;
          newRecord.syncStatus = "stored";
          newRecord.fileStatus = "success";
          newRecord.indexStatus = "stored";
        }
      } catch {
        /* keep metadata-only copy for linked cloud files */
      }

      copied.push(newRecord);
    }

    if (copied.length === 0) {
      return { copied: [], skipped };
    }

    setHubs((prev) =>
      prev.map((h) => {
        if (Number(h.id) !== targetId) return h;
        const userFiles = [...(h.userFiles ?? []), ...copied];
        const addedKb = copied.reduce((sum, row) => sum + (row.sizeKb ?? 0), 0);
        return {
          ...h,
          userFiles,
          files: userFiles.length,
          collections: userFiles.length > 0 ? 1 : 0,
          storageMB: (h.storageMB ?? 0) + Math.max(1, Math.round(addedKb / 1024)),
          updated: "Just now",
          isUserCreated: true,
        };
      }),
    );

    queueMicrotask(() => {
      enrichStoredHubFiles(
        targetId,
        copied.filter((row) => row.localBlobId),
        updateHubFile,
      );
    });

    return { copied, skipped };
  }, [hubs, updateHubFile]);

  const addDocumentsToLibrary = useCallback(async ({ files = [], cloudImport, cloudImports } = {}) => {
    const incoming = Array.from(files ?? []);
    const { valid, rejected } = partitionUploadFiles(incoming);
    const imports = cloudImports?.length
      ? cloudImports
      : cloudImport
        ? [cloudImport]
        : [];
    const cloudRecords = imports.flatMap((imp) => resolveCloudImportToLibraryRecords(imp));
    const newRecords = [];

    for (const file of valid) {
      const record = fileToLibraryRecord(file);
      const blobKey = documentLibraryBlobKey(record.id);
      try {
        await saveKnowledgeHubFile(blobKey, file, file.name);
        newRecords.push({
          ...record,
          localBlobId: blobKey,
          syncStatus: "stored",
          fileStatus: "success",
          indexStatus: "stored",
          metadata: createPendingHubFileMetadata(record.name),
          sourceGuide: createPendingSourceGuide(),
        });
      } catch {
        newRecords.push(record);
      }
    }

    for (const record of cloudRecords) {
      newRecords.push({
        ...record,
        metadata: createPendingHubFileMetadata(record.name),
        sourceGuide: createPendingSourceGuide(),
      });
    }

    if (newRecords.length === 0) {
      return { added: [], rejected: rejected.length };
    }

    setDocuments((prev) => [...prev, ...newRecords]);

    const enriched = newRecords.filter((r) => r.localBlobId);
    if (enriched.length > 0) {
      queueMicrotask(() => {
        enrichStoredHubFiles(
          "library",
          enriched,
          (_hubId, fileId, patch) => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === fileId ? { ...d, ...patch } : d)),
            );
          },
        );
      });
    }

    return {
      added: newRecords.map((r) => r.name),
      rejected: rejected.length,
      records: newRecords,
    };
  }, []);

  const addCategorySourcesToLibrary = useCallback((records, hubId = null) => {
    const stamped = (records ?? []).map((r) => ({
      ...r,
      uploadedAt: r.uploadedAt ?? new Date().toISOString(),
      created: r.created ?? new Date().toISOString(),
      updated: "Just now",
      indexStatus: r.indexStatus ?? "stored",
      fileStatus: r.fileStatus ?? "success",
      hubLinks: [],
    }));

    if (stamped.length === 0) return { added: [] };

    setDocuments((prev) => [...prev, ...stamped]);

    if (hubId != null) {
      const targetId = Number(hubId);
      setHubs((prev) =>
        prev.map((h) => {
          if (Number(h.id) !== targetId) return h;
          const userFiles = [...(h.userFiles ?? [])];
          let storageAdd = 0;
          for (const doc of stamped) {
            if (userFiles.some((f) => f.libraryDocumentId === doc.id)) continue;
            const hubFile = libraryRecordToHubFile(doc, targetId);
            userFiles.push(hubFile);
            storageAdd += Math.max(0, Math.round((hubFile.sizeKb ?? 0) / 1024));
          }
          return {
            ...h,
            userFiles,
            files: userFiles.length,
            collections: userFiles.length > 0 ? 1 : 0,
            storageMB: (h.storageMB ?? 0) + storageAdd,
            updated: "Just now",
            isUserCreated: true,
          };
        }),
      );
    }

    return { added: stamped };
  }, []);

  const updateLibraryDocument = useCallback((documentId, patch) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, ...patch, updated: "Just now" } : d)),
    );
  }, []);

  const downloadCloudFileToHub = useCallback(
    async (hubId, fileId) => {
      const hub = hubs.find((h) => h.id === hubId);
      const file = hub?.userFiles?.find((f) => f.id === fileId);
      if (!file || file.source !== "cloud") {
        return { ok: false, error: "Not a cloud file" };
      }
      if (file.syncStatus === "loading") {
        return { ok: false, error: "Already downloading" };
      }

      updateHubFile(hubId, fileId, {
        syncStatus: "loading",
        fileStatus: "loading",
        syncError: null,
      });

      try {
        const blob = await downloadCloudFileBlob(file);
        const storageId = file.libraryDocumentId
          ? documentLibraryBlobKey(file.libraryDocumentId)
          : knowledgeHubBlobKey(hubId, fileId);
        await saveKnowledgeHubFile(storageId, blob, file.name);

        const storedPatch = {
          syncStatus: "stored",
          fileStatus: "success",
          indexStatus: "stored",
          localBlobId: storageId,
          syncedAt: new Date().toISOString(),
          syncError: null,
        };

        updateHubFile(hubId, fileId, storedPatch);

        if (file.libraryDocumentId) {
          updateLibraryDocument(file.libraryDocumentId, storedPatch);
        }

        void enrichStoredHubFile(
          hubId,
          { ...file, localBlobId: storageId },
          updateHubFile,
        );
        if (file.libraryDocumentId) {
          void enrichStoredHubFile(
            "library",
            { ...file, id: file.libraryDocumentId, localBlobId: storageId },
            (_hubId, docId, patch) => updateLibraryDocument(docId, patch),
          );
        }
        return { ok: true, fileName: file.name };
      } catch (err) {
        const message = err?.message ?? "Download failed";
        updateHubFile(hubId, fileId, {
          syncStatus: "failed",
          fileStatus: "failed",
          syncError: message,
        });
        return { ok: false, error: message };
      }
    },
    [hubs, updateHubFile, updateLibraryDocument],
  );

  const downloadCloudFileToLibrary = useCallback(
    async (documentId) => {
      const doc = documents.find((d) => d.id === documentId);
      if (!doc || doc.source !== "cloud") {
        return { ok: false, error: "Not a cloud file" };
      }
      if (doc.syncStatus === "loading") {
        return { ok: false, error: "Already downloading" };
      }

      updateLibraryDocument(documentId, {
        syncStatus: "loading",
        fileStatus: "loading",
        syncError: null,
      });

      try {
        const blob = await downloadCloudFileBlob(doc);
        const storageId = documentLibraryBlobKey(documentId);
        await saveKnowledgeHubFile(storageId, blob, doc.name);

        updateLibraryDocument(documentId, {
          syncStatus: "stored",
          fileStatus: "success",
          indexStatus: "stored",
          localBlobId: storageId,
          syncedAt: new Date().toISOString(),
          syncError: null,
        });

        void enrichStoredHubFile(
          "library",
          { ...doc, localBlobId: storageId },
          (_hubId, fileId, patch) => {
            updateLibraryDocument(fileId, patch);
          },
        );

        return { ok: true, fileName: doc.name };
      } catch (err) {
        const message = err?.message ?? "Download failed";
        updateLibraryDocument(documentId, {
          syncStatus: "failed",
          fileStatus: "failed",
          syncError: message,
        });
        return { ok: false, error: message };
      }
    },
    [documents, updateLibraryDocument],
  );

  const linkDocumentToHub = useCallback(
    (documentId, hubId) => {
      const targetId = Number(hubId);
      const libraryDoc = documents.find((d) => d.id === documentId);
      if (!libraryDoc || Number.isNaN(targetId)) {
        return { linked: false, reason: "not_found" };
      }

      const targetHub = hubs.find((h) => Number(h.id) === targetId);
      if (!targetHub) return { linked: false, reason: "hub_not_found" };

      const { hubs: nextHubs, alreadyLinked, moved, hubFileId } = applyLibraryDocumentHubLink(
        hubs,
        { libraryDoc, documentId, targetId },
      );

      if (alreadyLinked) {
        return { linked: false, reason: "already_linked" };
      }

      setHubs(nextHubs);

      return {
        linked: true,
        moved,
        hubFileId,
        hubName: targetHub.name,
      };
    },
    [documents, hubs],
  );

  const linkDocumentsToHub = useCallback(
    async (documentIds, hubId) => {
      const linked = [];
      const skipped = [];
      for (const documentId of documentIds ?? []) {
        const result = linkDocumentToHub(documentId, hubId);
        if (result.linked) linked.push(documentId);
        else skipped.push(documentId);
      }
      return { linked, skipped };
    },
    [linkDocumentToHub],
  );

  const unlinkDocumentFromHub = useCallback((documentId, hubId) => {
    const targetId = Number(hubId);
    let removed = false;

    setHubs((prev) =>
      prev.map((h) => {
        if (Number(h.id) !== targetId) return h;
        const prevUser = h.userFiles ?? [];
        const hubFile = prevUser.find((f) => f.libraryDocumentId === documentId);
        if (!hubFile) return h;

        removed = true;
        const userFiles = prevUser.filter((f) => f.libraryDocumentId !== documentId);
        const storageDrop = Math.max(0, Math.round((hubFile.sizeKb ?? 0) / 1024));
        return {
          ...h,
          userFiles,
          files: Math.max(0, userFiles.length),
          storageMB: Math.max(0, (h.storageMB ?? 0) - storageDrop),
          updated: "Just now",
        };
      }),
    );

    return { removed };
  }, []);

  const getDocumentHubLinks = useCallback(
    (documentId) => getHubLinksForDocument(documentId, hubs, documents),
    [hubs, documents],
  );

  const removeDocumentFromLibrary = useCallback((documentId) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return { removed: false, reason: "not_found" };

    setDocuments((prev) => prev.filter((d) => d.id !== documentId));

    setHubs((prev) =>
      prev.map((h) => {
        const prevUser = h.userFiles ?? [];
        const linked = prevUser.filter((f) => f.libraryDocumentId === documentId);
        if (linked.length === 0) return h;

        const userFiles = prevUser.filter((f) => f.libraryDocumentId !== documentId);
        const storageDrop = linked.reduce(
          (sum, row) => sum + Math.max(0, Math.round((row.sizeKb ?? 0) / 1024)),
          0,
        );
        return {
          ...h,
          userFiles,
          files: Math.max(0, userFiles.length),
          storageMB: Math.max(0, (h.storageMB ?? 0) - storageDrop),
          updated: "Just now",
        };
      }),
    );

    const blobKey = doc.localBlobId ?? documentLibraryBlobKey(documentId);
    if (doc.localBlobId || doc.syncStatus === "stored") {
      void deleteKnowledgeHubFile(blobKey);
    }

    return { removed: true, name: doc.name };
  }, [documents]);

  const deleteHubFile = useCallback((hubId, fileId) => {
    setHubs((prev) =>
      prev.map((h) => {
        if (h.id !== hubId) return h;
        const prevUser = h.userFiles ?? [];
        const userFiles = prevUser.filter((f) => f.id !== fileId);
        const removedUser = prevUser.length - userFiles.length;

        if (removedUser > 0) {
          const removedRow = prevUser.find((f) => f.id === fileId);
          if (removedRow?.localBlobId && !removedRow?.libraryDocumentId) {
            void deleteKnowledgeHubFile(removedRow.localBlobId);
          }
          const storageDrop = removedRow
            ? Math.max(1, Math.round((removedRow.sizeKb ?? 1) / 1024))
            : 0;
          return {
            ...h,
            userFiles,
            files: Math.max(userFiles.length, (h.files ?? 0) - 1),
            storageMB: Math.max(0, (h.storageMB ?? 0) - storageDrop),
            updated: "Just now",
          };
        }

        const hiddenFileIds = [...new Set([...(h.hiddenFileIds ?? []), fileId])];
        return {
          ...h,
          hiddenFileIds,
          files: Math.max(0, (h.files ?? 0) - 1),
          updated: "Just now",
        };
      }),
    );
  }, []);

  const deleteHub = useCallback((id) => {
    setHubs((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const deleteHubs = useCallback((ids) => {
    const idSet = new Set(ids);
    setHubs((prev) => prev.filter((h) => !idSet.has(h.id)));
  }, []);

  const getHubById = useCallback(
    (id) => {
      const numeric = Number(id);
      const hub = hubs.find((h) => h.id === numeric) ?? null;
      return hub ? attachUsedBy(hub, agents) : null;
    },
    [hubs, agents],
  );

  const pickerHubs = useMemo(() => hubsWithUsage.map(hubToPickerShape), [hubsWithUsage]);

  const value = useMemo(
    () => ({
      hubs: hubsWithUsage,
      documents,
      pickerHubs,
      addHub,
      updateHub,
      addFilesToHub,
      addCloudFilesToHub,
      addDocumentsToHub,
      copyHubFilesToHub,
      addDocumentsToLibrary,
      addCategorySourcesToLibrary,
      updateLibraryDocument,
      linkDocumentToHub,
      linkDocumentsToHub,
      unlinkDocumentFromHub,
      removeDocumentFromLibrary,
      getDocumentHubLinks,
      recordHubAccess,
      updateHubFile,
      downloadCloudFileToHub,
      downloadCloudFileToLibrary,
      deleteHubFile,
      deleteHub,
      deleteHubs,
      getHubById,
      setHubs,
    }),
    [
      hubsWithUsage,
      documents,
      pickerHubs,
      addHub,
      updateHub,
      addFilesToHub,
      addCloudFilesToHub,
      addDocumentsToHub,
      copyHubFilesToHub,
      addDocumentsToLibrary,
      addCategorySourcesToLibrary,
      updateLibraryDocument,
      linkDocumentToHub,
      linkDocumentsToHub,
      unlinkDocumentFromHub,
      removeDocumentFromLibrary,
      getDocumentHubLinks,
      recordHubAccess,
      updateHubFile,
      downloadCloudFileToHub,
      downloadCloudFileToLibrary,
      deleteHubFile,
      deleteHub,
      deleteHubs,
      getHubById,
    ],
  );

  return (
    <KnowledgeHubContext.Provider value={value}>
      {children}
    </KnowledgeHubContext.Provider>
  );
}

export function useKnowledgeHubs() {
  const ctx = useContext(KnowledgeHubContext);
  if (!ctx) {
    throw new Error("useKnowledgeHubs must be used within KnowledgeHubProvider");
  }
  return ctx;
}

export function useKnowledgeHubsOptional() {
  return useContext(KnowledgeHubContext);
}
