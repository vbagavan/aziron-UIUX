/** Agents and workflows associated with the MyDigitalHub knowledge hub. */

export const MYDIGITALHUB_SEED_HUB_ID = 9;

export const MYDIGITALHUB_AGENT_IDS = [20, 21, 22, 23, 24];

export const MYDIGITALHUB_FLOW_IDS = [8, 9];

export function myDigitalHubSlug(name) {
  return String(name ?? "")
    .trim()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

export function isMyDigitalHub(hub) {
  const slug = myDigitalHubSlug(hub?.name);
  return slug === "mydigitalhub" || slug.includes("mydigitalhub");
}

export function findMyDigitalHub(hubs = []) {
  return hubs.find(isMyDigitalHub) ?? null;
}

function hubIdInList(list, hubId) {
  const target = Number(hubId);
  return (list ?? []).some((id) => Number(id) === target || id === hubId);
}

export function withHubId(list, hubId) {
  if (hubIdInList(list, hubId)) return list ?? [];
  return [...(list ?? []), hubId];
}

/** Agents designated for MyDigitalHub (for telemetry when hub id differs from seed). */
export function myDigitalHubAgents(agents = []) {
  return agents.filter((a) => MYDIGITALHUB_AGENT_IDS.includes(a.id));
}

export function myDigitalHubFlows(flows = []) {
  return flows.filter((f) => MYDIGITALHUB_FLOW_IDS.includes(f.id));
}

export function mergeMyDigitalHubAgents(linkedAgents, allAgents, hub) {
  if (!isMyDigitalHub(hub)) return linkedAgents;
  const seen = new Set(linkedAgents.map((a) => a.id));
  const merged = [...linkedAgents];
  for (const agent of myDigitalHubAgents(allAgents)) {
    if (!seen.has(agent.id)) {
      seen.add(agent.id);
      merged.push(agent);
    }
  }
  return merged;
}

export function mergeMyDigitalHubFlows(linkedFlows, allFlows, hub) {
  if (!isMyDigitalHub(hub)) return linkedFlows;
  const seen = new Set(linkedFlows.map((f) => f.id));
  const merged = [...linkedFlows];
  for (const flow of myDigitalHubFlows(allFlows)) {
    if (!seen.has(flow.id)) {
      seen.add(flow.id);
      merged.push(flow);
    }
  }
  return merged;
}

export function myDigitalHubAgentsLinked(hubId, agents = []) {
  const designated = myDigitalHubAgents(agents);
  if (designated.length === 0) return false;
  return designated.every((a) => hubIdInList(a.knowledgeHubs, hubId));
}
