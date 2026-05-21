/** Persists marketplace template id → workspace catalog id after fork */

const STORAGE_KEY = "aziron-marketplace-fork-registry";

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { agents: {}, flows: {} };
    const parsed = JSON.parse(raw);
    return {
      agents: parsed?.agents ?? {},
      flows: parsed?.flows ?? {},
    };
  } catch {
    return { agents: {}, flows: {} };
  }
}

function saveRaw(registry) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
}

export function loadForkRegistry() {
  return loadRaw();
}

export function recordAgentFork(marketplaceId, catalogId) {
  const registry = loadRaw();
  registry.agents[String(marketplaceId)] = String(catalogId);
  saveRaw(registry);
  return registry;
}

export function recordFlowFork(marketplaceId, catalogFlowId) {
  const registry = loadRaw();
  registry.flows[String(marketplaceId)] = String(catalogFlowId);
  saveRaw(registry);
  return registry;
}

export function getForkedAgentCatalogId(marketplaceId) {
  return loadRaw().agents[String(marketplaceId)] ?? null;
}

export function getForkedFlowCatalogId(marketplaceId) {
  return loadRaw().flows[String(marketplaceId)] ?? null;
}

export function getForkedAgentIdSet() {
  return new Set(Object.keys(loadRaw().agents));
}

export function getForkedFlowIdSet() {
  return new Set(Object.keys(loadRaw().flows));
}

/** Resolve flow id from registry or catalog `forkedFrom` marker */
export function resolveForkedFlowId(marketplaceId, flows = []) {
  const fromRegistry = getForkedFlowCatalogId(marketplaceId);
  if (fromRegistry) return fromRegistry;
  const marker = `mp-flow-${marketplaceId}`;
  const hit = flows.find((f) => String(f.forkedFrom) === marker);
  return hit ? String(hit.id) : null;
}
