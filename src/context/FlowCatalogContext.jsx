import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { INITIAL_FLOWS } from "@/data/initialFlows";
import { clearVersionHistory, persistVersionHistory } from "@/lib/flowVersionStorage";

const FlowCatalogContext = createContext(null);

export function FlowCatalogProvider({ children }) {
  const [flows, setFlows] = useState(INITIAL_FLOWS);

  const patchFlow = useCallback((flowId, patch) => {
    setFlows((list) => list.map((fl) => (fl.id === flowId ? { ...fl, ...patch } : fl)));
  }, []);

  const removeFlow = useCallback((flowId) => {
    clearVersionHistory(flowId);
    setFlows((list) => list.filter((fl) => fl.id !== flowId));
  }, []);

  const createDraftFlow = useCallback((entry = "template") => {
    const newFlow = {
      id: Date.now(),
      name: "Untitled Flow",
      description: "",
      version: "v0.1",
      status: "draft",
      steps: [],
      runs: 0,
      success: null,
      lastRun: "—",
      createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      creationEntry: entry === "scratch" ? "scratch" : "template",
      visibility: "private",
      versionHistory: [],
    };
    setFlows((c) => [...c, newFlow]);
    return newFlow;
  }, []);

  /** Clone an existing flow into the catalog (new id, fresh version history). */
  const duplicateFlow = useCallback((flowId) => {
    let created = null;
    setFlows((list) => {
      const src = list.find((f) => String(f.id) === String(flowId));
      if (!src) return list;
      created = {
        ...src,
        id: Date.now(),
        name: `Copy of ${src.name}`,
        steps: JSON.parse(JSON.stringify(src.steps ?? [])),
        description: typeof src.description === "string" ? src.description : "",
        versionHistory: [],
        version: src.version ?? "v0.1",
        runs: 0,
        success: null,
        lastRun: "—",
        createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        status: src.status === "error" ? "idle" : src.status ?? "idle",
      };
      return [...list, created];
    });
    return created;
  }, []);

  /** Add a validated flow from JSON import (new id; optional version history persisted locally). */
  const importFlow = useCallback((normalizedList) => {
    const list = Array.isArray(normalizedList) ? normalizedList : [normalizedList];
    const created = [];
    setFlows((c) => {
      const next = [...c];
      for (const normalized of list) {
        const id = Date.now() + next.length;
        const flow = {
          id,
          name: normalized.name,
          description: normalized.description ?? "",
          version: normalized.version ?? "v0.1",
          status: "draft",
          steps: JSON.parse(JSON.stringify(normalized.steps ?? [])),
          visibility: normalized.visibility === "public" ? "public" : "private",
          versionHistory: Array.isArray(normalized.versionHistory)
            ? JSON.parse(JSON.stringify(normalized.versionHistory))
            : [],
          runs: typeof normalized.runs === "number" ? normalized.runs : 0,
          success: normalized.success ?? null,
          lastRun: typeof normalized.lastRun === "string" ? normalized.lastRun : "—",
          createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          creationEntry: "import",
        };
        if (flow.versionHistory.length > 0) {
          persistVersionHistory(id, flow.versionHistory);
        }
        next.push(flow);
        created.push(flow);
      }
      return next;
    });
    return created;
  }, []);

  /**
   * Fork an existing flow — independent copy with custom name/description/visibility.
   * The fork carries a `forkedFrom` provenance marker pointing to the source id.
   */
  const forkFlow = useCallback((flowId, { name, description, visibility } = {}) => {
    let created = null;
    setFlows((list) => {
      const src = list.find((f) => String(f.id) === String(flowId));
      if (!src) return list;
      created = {
        ...src,
        id: Date.now(),
        name: name ?? `Fork of ${src.name}`,
        description: description ?? (typeof src.description === "string" ? src.description : ""),
        visibility: visibility ?? "private",
        steps: JSON.parse(JSON.stringify(src.steps ?? [])),
        forkedFrom: src.id,
        version: "v0.1",
        versionHistory: [],
        runs: 0,
        success: null,
        lastRun: "—",
        status: "draft",
        createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      };
      return [...list, created];
    });
    return created;
  }, []);

  const value = useMemo(
    () => ({
      flows,
      setFlows,
      patchFlow,
      removeFlow,
      createDraftFlow,
      duplicateFlow,
      forkFlow,
      importFlow,
    }),
    [flows, patchFlow, removeFlow, createDraftFlow, duplicateFlow, forkFlow, importFlow],
  );

  return <FlowCatalogContext.Provider value={value}>{children}</FlowCatalogContext.Provider>;
}

export function useFlowCatalog() {
  const ctx = useContext(FlowCatalogContext);
  if (!ctx) {
    throw new Error("useFlowCatalog must be used within FlowCatalogProvider");
  }
  return ctx;
}
