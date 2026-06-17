/** Demo row shapes for API / database Usage tab tables. */

const AGENT_TYPES = ["Support", "Sales", "Finance", "Marketing", "Operations"];
const FLOW_TYPES = ["Automation", "Scheduled", "Event-driven"];
const LAST_EXEC = ["12m ago", "1h ago", "3h ago", "Yesterday", "2d ago"];
const LAST_ACCESS = ["2h ago", "5h ago", "1d ago", "3d ago", "1w ago"];

function demoHub(name, index) {
  return {
    id: `hub-${index}-${name}`,
    name,
    status: index === 0 ? "active" : "active",
    linkedAssets: 8 + index * 4,
    lastAccessed: LAST_ACCESS[index % LAST_ACCESS.length],
  };
}

function demoAgent(name, index) {
  return {
    id: `agent-${index}-${name}`,
    name,
    type: AGENT_TYPES[index % AGENT_TYPES.length],
    status: index === 2 ? "paused" : "active",
    lastExecution: LAST_EXEC[index % LAST_EXEC.length],
    queryVolume: 120 + index * 85,
    successRate: 96 - index,
    utilization: 42 + index * 11,
  };
}

function demoFlow(name, index) {
  return {
    id: `flow-${index}-${name}`,
    name,
    type: FLOW_TYPES[index % FLOW_TYPES.length],
    status: index === 1 ? "error" : "active",
    lastExecution: LAST_EXEC[(index + 1) % LAST_EXEC.length],
    runs: 240 + index * 180,
    successRate: 94 - index * 2,
  };
}

function mapItems(items, mapper) {
  return (items ?? []).map((item, index) =>
    typeof item === "string" ? mapper(item, index) : { ...mapper(item.name ?? item.id, index), ...item },
  );
}

export function normalizeSourceUsage(usage = {}) {
  return {
    hubs: mapItems(usage.hubs, demoHub),
    agents: mapItems(usage.agents, demoAgent),
    flows: mapItems(usage.flows, demoFlow),
  };
}
