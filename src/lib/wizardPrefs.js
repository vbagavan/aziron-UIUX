/** Persisted preferences for Add Source wizard (localStorage). */

const LAST_SOURCE_TYPE_KEY = "aziron_add_source_last_type";

const VALID_SOURCE_TYPES = new Set(["files", "cloud", "databases", "apis", "enterprise"]);

export function loadLastSourceType() {
  try {
    const value = localStorage.getItem(LAST_SOURCE_TYPE_KEY);
    if (value && VALID_SOURCE_TYPES.has(value)) return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveLastSourceType(type) {
  if (!type || !VALID_SOURCE_TYPES.has(type)) return;
  try {
    localStorage.setItem(LAST_SOURCE_TYPE_KEY, type);
  } catch {
    /* ignore */
  }
}
