import { create } from "zustand";

// ─── Workflow schema ─────────────────────────────────────────────────────────
// { nodes: [], edges: [], execution: {}, metadata: {} }

const buildLogs = (nodes, flowName) => {
  const lines = [];
  let ms = 0;
  const fmt = (d) => {
    const s  = String(Math.floor(d / 1000)).padStart(2, "0");
    const ms = String(d % 1000).padStart(3, "0");
    return `15:49:${s}.${ms}`;
  };
  lines.push({ ts: fmt(ms), level: "INFO", nodeIdx: null, msg: `Flow "${flowName}" triggered` });
  nodes.forEach((node, i) => {
    ms += 80 + Math.round(Math.random() * 120);
    lines.push({ ts: fmt(ms), level: "INFO", nodeIdx: i, msg: `[${node.label}] started` });
    ms += 200 + Math.round(Math.random() * 400);
    lines.push({ ts: fmt(ms), level: "SUCCESS", nodeIdx: i, msg: `[${node.label}] completed in ${ms % 600}ms` });
  });
  lines.push({ ts: fmt(ms + 12), level: "INFO", nodeIdx: null, msg: `Run completed — total ${ms}ms` });
  return lines;
};

export const useFlowStore = create((set, get) => ({
  // ── Data ──────────────────────────────────────────────────────────────────
  nodes: [],
  edges: [],
  metadata: { name: "", status: "idle", runs: 0, success: null, lastRun: "—", createdAt: "—" },

  // ── Selection ─────────────────────────────────────────────────────────────
  selectedNodeIdx: null,

  // ── Global mode ───────────────────────────────────────────────────────────
  globalMode: "build", // "build" | "run"

  // ── Execution state ───────────────────────────────────────────────────────
  executionState: {
    status:    "idle",   // "idle" | "running" | "done" | "error"
    activeIdx: -1,
    doneIdxs:  new Set(),
  },
  logs: [],

  // ── Actions ───────────────────────────────────────────────────────────────
  initFlow: (flow) => set({
    nodes:    flow.steps ?? [],
    edges:    flow.steps ? flow.steps.slice(0, -1).map((_, i) => ({ from: i, to: i + 1 })) : [],
    metadata: {
      name:      flow.name,
      status:    flow.status,
      runs:      flow.runs,
      success:   flow.success,
      lastRun:   flow.lastRun,
      createdAt: flow.createdAt,
    },
    executionState: { status: "idle", activeIdx: -1, doneIdxs: new Set() },
    logs: [],
  }),

  setSelectedNode: (idx) => set({ selectedNodeIdx: idx }),

  setGlobalMode: (mode) => set({ globalMode: mode }),

  addNode: (afterIdx, node) => set((state) => {
    const next = [...state.nodes];
    next.splice(afterIdx + 1, 0, { ...node, status: "pending" });
    return { nodes: next, selectedNodeIdx: afterIdx + 1 };
  }),

  startRun: (timers) => {
    const { nodes, metadata } = get();
    const n = nodes.length;
    set({
      executionState: { status: "running", activeIdx: 0, doneIdxs: new Set() },
      logs: buildLogs(nodes, metadata.name),
      globalMode: "run",
    });
    nodes.forEach((_, i) => {
      const t = setTimeout(() => {
        set((state) => {
          const next = new Set(state.executionState.doneIdxs);
          next.add(i);
          const isLast = i === n - 1;
          return {
            executionState: {
              status:    isLast ? "done" : "running",
              activeIdx: isLast ? -1 : i + 1,
              doneIdxs:  next,
            },
          };
        });
      }, (i + 1) * 1500);
      timers.current.push(t);
    });
  },

  resetExecution: () => set({
    executionState: { status: "idle", activeIdx: -1, doneIdxs: new Set() },
    logs: [],
  }),
}));
