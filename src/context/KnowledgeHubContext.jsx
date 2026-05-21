import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  SEED_KNOWLEDGE_HUBS,
  createHubPayload,
  fileToHubRecord,
  filesToHubStats,
  hubToPickerShape,
  loadHubsFromStorage,
  saveHubsToStorage,
} from "@/data/knowledgeHubs";
import { countAgentsUsingHub } from "@/lib/agentKnowledge";
import { useAgentsOptional } from "@/context/AgentsContext";

const KnowledgeHubContext = createContext(null);

function attachUsedBy(hub, agents) {
  if (!agents?.length) return hub;
  return { ...hub, usedBy: countAgentsUsingHub(hub.id, agents) };
}

export function KnowledgeHubProvider({ children }) {
  const agentsCtx = useAgentsOptional();
  const agents = agentsCtx?.agents ?? [];

  const [hubs, setHubs] = useState(() => loadHubsFromStorage() ?? SEED_KNOWLEDGE_HUBS);

  useEffect(() => {
    saveHubsToStorage(hubs);
  }, [hubs]);

  const hubsWithUsage = useMemo(
    () => hubs.map((h) => attachUsedBy(h, agents)),
    [hubs, agents],
  );

  const addHub = useCallback((payload) => {
    const hub = createHubPayload(payload);
    const { pendingFileName: _drop, ...stored } = hub;
    setHubs((prev) => [...prev, stored]);
    return attachUsedBy(stored, agents);
  }, [agents]);

  const updateHub = useCallback((id, patch) => {
    setHubs((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...patch, updated: "Just now" } : h)),
    );
  }, []);

  const addFilesToHub = useCallback((id, fileList) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return [];
    setHubs((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const records = files.map((f) => fileToHubRecord(f, id));
        const stats = filesToHubStats(files);
        const userFiles = [...(h.userFiles ?? []), ...records];
        return {
          ...h,
          userFiles,
          files: userFiles.length,
          collections: userFiles.length > 0 ? 1 : 0,
          storageMB: (h.storageMB ?? 0) + stats.storageMB,
          updated: "Just now",
          isUserCreated: h.isUserCreated ?? true,
        };
      }),
    );
    return files.map((f) => f.name);
  }, []);

  const deleteHubFile = useCallback((hubId, fileId) => {
    setHubs((prev) =>
      prev.map((h) => {
        if (h.id !== hubId) return h;
        const prevUser = h.userFiles ?? [];
        const userFiles = prevUser.filter((f) => f.id !== fileId);
        const removedUser = prevUser.length - userFiles.length;

        if (removedUser > 0) {
          const removedRow = prevUser.find((f) => f.id === fileId);
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
