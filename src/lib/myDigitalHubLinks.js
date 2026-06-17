/** Agents and workflows associated with the Files Hub knowledge hub. */

export const FILES_HUB_SEED_ID = 1;

/** @deprecated Use FILES_HUB_SEED_ID */
export const MYDIGITALHUB_SEED_HUB_ID = FILES_HUB_SEED_ID;

export const FILES_HUB_AGENT_IDS = [20, 21, 22, 23, 24];

/** @deprecated Use FILES_HUB_AGENT_IDS */
export const MYDIGITALHUB_AGENT_IDS = FILES_HUB_AGENT_IDS;

export const FILES_HUB_FLOW_IDS = [8, 9];

/** @deprecated Use FILES_HUB_FLOW_IDS */
export const MYDIGITALHUB_FLOW_IDS = FILES_HUB_FLOW_IDS;

export function hubNameSlug(name) {
  return String(name ?? "")
    .trim()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

export function isFilesHub(hub) {
  const slug = hubNameSlug(hub?.name);
  return slug === "fileshub" || slug.includes("files");
}

/** @deprecated Use isFilesHub */
export function isMyDigitalHub(hub) {
  return isFilesHub(hub);
}

export function findFilesHub(hubs = []) {
  return hubs.find(isFilesHub) ?? null;
}

/** @deprecated Use findFilesHub */
export function findMyDigitalHub(hubs = []) {
  return findFilesHub(hubs);
}

function hubIdInList(list, hubId) {
  const target = Number(hubId);
  return (list ?? []).some((id) => Number(id) === target || id === hubId);
}

export function withHubId(list, hubId) {
  if (hubIdInList(list, hubId)) return list ?? [];
  return [...(list ?? []), hubId];
}

export function filesHubAgents(agents = []) {
  return agents.filter((a) => FILES_HUB_AGENT_IDS.includes(a.id));
}

/** @deprecated Use filesHubAgents */
export function myDigitalHubAgents(agents = []) {
  return filesHubAgents(agents);
}

export function filesHubFlows(flows = []) {
  return flows.filter((f) => FILES_HUB_FLOW_IDS.includes(f.id));
}

/** @deprecated Use filesHubFlows */
export function myDigitalHubFlows(flows = []) {
  return filesHubFlows(flows);
}

export function mergeFilesHubAgents(linkedAgents, allAgents, hub) {
  if (!isFilesHub(hub)) return linkedAgents;
  const seen = new Set(linkedAgents.map((a) => a.id));
  const merged = [...linkedAgents];
  for (const agent of filesHubAgents(allAgents)) {
    if (!seen.has(agent.id)) {
      seen.add(agent.id);
      merged.push(agent);
    }
  }
  return merged;
}

/** @deprecated Use mergeFilesHubAgents */
export function mergeMyDigitalHubAgents(linkedAgents, allAgents, hub) {
  return mergeFilesHubAgents(linkedAgents, allAgents, hub);
}

export function mergeFilesHubFlows(linkedFlows, allFlows, hub) {
  if (!isFilesHub(hub)) return linkedFlows;
  const seen = new Set(linkedFlows.map((f) => f.id));
  const merged = [...linkedFlows];
  for (const flow of filesHubFlows(allFlows)) {
    if (!seen.has(flow.id)) {
      seen.add(flow.id);
      merged.push(flow);
    }
  }
  return merged;
}

/** @deprecated Use mergeFilesHubFlows */
export function mergeMyDigitalHubFlows(linkedFlows, allFlows, hub) {
  return mergeFilesHubFlows(linkedFlows, allFlows, hub);
}

export function filesHubAgentsLinked(hubId, agents = []) {
  const designated = filesHubAgents(agents);
  if (designated.length === 0) return false;
  return designated.every((a) => hubIdInList(a.knowledgeHubs, hubId));
}

/** @deprecated Use filesHubAgentsLinked */
export function myDigitalHubAgentsLinked(hubId, agents = []) {
  return filesHubAgentsLinked(hubId, agents);
}
