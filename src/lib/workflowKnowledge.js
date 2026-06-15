/** Workflow ↔ Knowledge Hub relationship helpers (mock / prototype). */

export function normalizeHubId(id) {
  const n = Number(id);
  return Number.isNaN(n) ? id : n;
}

export function flowUsesHub(flow, hubId) {
  if (!flow) return false;
  const target = normalizeHubId(hubId);
  const ids = flow.knowledgeHubs ?? [];
  return ids.some((id) => normalizeHubId(id) === target);
}

export function workflowsUsingHub(hubId, flows = []) {
  return flows.filter((f) => flowUsesHub(f, hubId));
}

export function countWorkflowsUsingHub(hubId, flows = []) {
  return workflowsUsingHub(hubId, flows).length;
}
