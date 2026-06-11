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
  getKnowledgeHubFile,
  knowledgeHubBlobKey,
  saveKnowledgeHubFile,
} from "@/lib/knowledgeHubFileStorage";
import { partitionUploadFiles } from "@/lib/hubUploadLimits";
import { useAgentsOptional } from "@/context/AgentsContext";

const KnowledgeHubContext = createContext(null);

function attachUsedBy(hub, agents) {
  if (!agents?.length) return hub;
  return { ...hub, usedBy: countAgentsUsingHub(hub.id, agents) };
}

export function KnowledgeHubProvider({ children }) {
  const agentsCtx = useAgentsOptional();
  const agents = agentsCtx?.agents ?? [];

  const [hubs, setHubs] = useState(
    () => loadHubsFromStorage() ?? normalizeHubs(SEED_KNOWLEDGE_HUBS),
  );

  useEffect(() => {
    saveHubsToStorage(hubs);
  }, [hubs]);

  const hubsWithUsage = useMemo(
    () => hubs.map((h) => attachUsedBy(h, agents)),
    [hubs, agents],
  );

  const updateHub = useCallback((id, patch) => {
    setHubs((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...patch, updated: "Just now" } : h)),
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
        const storageId = knowledgeHubBlobKey(hubId, fileId);
        await saveKnowledgeHubFile(storageId, blob, file.name);

        updateHubFile(hubId, fileId, {
          syncStatus: "stored",
          fileStatus: "success",
          indexStatus: "stored",
          localBlobId: storageId,
          syncedAt: new Date().toISOString(),
          syncError: null,
        });
        void enrichStoredHubFile(
          hubId,
          { ...file, localBlobId: storageId },
          updateHubFile,
        );
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
    [hubs, updateHubFile],
  );

  const addCloudFilesToHub = useCallback((hubId, pickerFiles, connection) => {
    const files = (pickerFiles ?? []).filter((f) => f && f.type !== "folder");
    if (files.length === 0) return [];

    let addedNames = [];
    setHubs((prev) =>
      prev.map((h) => {
        if (h.id !== hubId) return h;
        const existingNames = new Set((h.userFiles ?? []).map((f) => f.name.toLowerCase()));
        const existingExternal = new Set(
          (h.userFiles ?? [])
            .map((f) => f.externalFileId)
            .filter(Boolean),
        );
        const toAdd = files.filter(
          (f) => !existingExternal.has(f.id) && !existingNames.has(f.name.toLowerCase()),
        );
        if (toAdd.length === 0) return h;

        const provider = connection?.provider ?? "onedrive";
        const conn =
          connection ??
          h.cloudConnections?.find((c) => c.provider === provider) ??
          h.cloudConnections?.[0] ??
          null;
        const providerLabel =
          provider === "google-drive" ? "Google Drive" : "OneDrive";
        const records = toAdd.map((f) =>
          cloudFileToHubRecord(f, hubId, {
            provider: conn?.provider ?? provider,
            connectionId: conn?.id ?? null,
            connectionName: conn?.name ?? `${providerLabel} connection`,
          }),
        );
        const stats = hubRecordsToStats(records);
        const userFiles = [...(h.userFiles ?? []), ...records];
        addedNames = records.map((r) => r.name);

        const cloudConnections = (() => {
          const existing = h.cloudConnections ?? [];
          if (!conn) return existing;
          if (existing.some((c) => c.id === conn.id || c.provider === conn.provider)) {
            return existing;
          }
          return [...existing, conn];
        })();

        return {
          ...h,
          userFiles,
          cloudConnections,
          files: userFiles.length,
          collections: userFiles.length > 0 ? 1 : 0,
          storageMB: (h.storageMB ?? 0) + stats.storageMB,
          updated: "Just now",
          isUserCreated: h.isUserCreated ?? true,
        };
      }),
    );
    return addedNames;
  }, []);

  const addFilesToHub = useCallback(async (id, fileList) => {
    const hubId = Number(id);
    const incoming = Array.from(fileList ?? []);
    const { valid, rejected: rejectedFiles } = partitionUploadFiles(incoming);
    const rejected = rejectedFiles.length;
    if (valid.length === 0) {
      return { added: [], rejected };
    }

    const records = await Promise.all(
      valid.map(async (file) => {
        const record = fileToHubRecord(file, hubId);
        const blobKey = knowledgeHubBlobKey(hubId, record.id);
        try {
          await saveKnowledgeHubFile(blobKey, file, file.name);
          return {
            ...record,
            localBlobId: blobKey,
            syncStatus: "stored",
            fileStatus: "success",
            indexStatus: "stored",
          };
        } catch {
          return record;
        }
      }),
    );

    const recordsWithMeta = records.map((record) =>
      record.localBlobId
        ? {
            ...record,
            metadata: createPendingHubFileMetadata(record.name),
            sourceGuide: createPendingSourceGuide(),
          }
        : record,
    );

    const stats = filesToHubStats(valid);
    setHubs((prev) =>
      prev.map((h) => {
        if (Number(h.id) !== hubId) return h;
        const userFiles = [...(h.userFiles ?? []), ...recordsWithMeta];
        const fileStats = hubRecordsToStats(userFiles);
        return {
          ...h,
          userFiles,
          files: fileStats.added,
          collections: userFiles.length > 0 ? 1 : 0,
          storageMB: (h.storageMB ?? 0) + stats.storageMB,
          updated: "Just now",
          isUserCreated: true,
        };
      }),
    );

    queueMicrotask(() => {
      enrichStoredHubFiles(hubId, recordsWithMeta, updateHubFile);
    });

    return { added: valid.map((f) => f.name), rejected, records: recordsWithMeta };
  }, [updateHubFile]);

  const deleteHubFile = useCallback((hubId, fileId) => {
    setHubs((prev) =>
      prev.map((h) => {
        if (h.id !== hubId) return h;
        const prevUser = h.userFiles ?? [];
        const userFiles = prevUser.filter((f) => f.id !== fileId);
        const removedUser = prevUser.length - userFiles.length;

        if (removedUser > 0) {
          const removedRow = prevUser.find((f) => f.id === fileId);
          if (removedRow?.localBlobId) {
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
      pickerHubs,
      addHub,
      updateHub,
      addFilesToHub,
      addCloudFilesToHub,
      updateHubFile,
      downloadCloudFileToHub,
      deleteHubFile,
      deleteHub,
      deleteHubs,
      getHubById,
      setHubs,
    }),
    [
      hubsWithUsage,
      pickerHubs,
      addHub,
      updateHub,
      addFilesToHub,
      addCloudFilesToHub,
      updateHubFile,
      downloadCloudFileToHub,
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
