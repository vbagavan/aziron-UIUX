/** Persist flow version history across reloads (demo catalog is in-memory only). */
const STORAGE_KEY = "aziron-flow-version-histories-v1";

export function loadVersionHistory(flowId) {
  if (flowId == null) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    const key = String(flowId);
    const list = all[key];
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

export function persistVersionHistory(flowId, history) {
  if (flowId == null || !Array.isArray(history)) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[String(flowId)] = history;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota / private mode */
  }
}

export function clearVersionHistory(flowId) {
  if (flowId == null) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    delete all[String(flowId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
