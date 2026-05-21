/** Agent ↔ Knowledge Hub relationship helpers. */

export function normalizeHubId(id) {
  const n = Number(id);
  return Number.isNaN(n) ? id : n;
}

export function agentUsesHub(agent, hubId) {
  if (!agent) return false;
  const target = normalizeHubId(hubId);
  const ids = agent.knowledgeHubs ?? [];
  return ids.some((id) => normalizeHubId(id) === target);
}

export function agentsUsingHub(hubId, agents = []) {
  return agents.filter((a) => agentUsesHub(a, hubId));
}

export function countAgentsUsingHub(hubId, agents = []) {
  return agentsUsingHub(hubId, agents).length;
}

/** File IDs the agent is scoped to for a hub (empty = entire hub). */
export function agentHubFileIds(agent, hubId) {
  const map = agent.knowledgeHubFileIds ?? {};
  const key = String(hubId);
  const alt = normalizeHubId(hubId);
  return map[key] ?? map[alt] ?? [];
}

export function agentHasFileScope(agent, hubId) {
  return agentHubFileIds(agent, hubId).length > 0;
}
