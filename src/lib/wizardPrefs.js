/** Persisted preferences for Add Source wizard (localStorage). */

const LAST_SOURCE_TYPE_KEY = "aziron_add_source_last_type";
const LAST_DEST_MODE_KEY = "aziron_add_source_last_dest";

const VALID_SOURCE_TYPES = new Set(["files", "cloud", "databases", "apis", "enterprise"]);
const VALID_DEST_MODES = new Set(["documents", "new-hub", "existing-hub"]);

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

export function loadLastDestinationMode() {
  try {
    const value = localStorage.getItem(LAST_DEST_MODE_KEY);
    if (value && VALID_DEST_MODES.has(value)) return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveLastDestinationMode(mode) {
  if (!mode || !VALID_DEST_MODES.has(mode)) return;
  try {
    localStorage.setItem(LAST_DEST_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
