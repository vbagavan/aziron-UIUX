/** Display helpers for Knowledge Hub names and draft status. */

/** Strip legacy "(Draft)" suffix from hub names for display. */
export function getHubDisplayName(hubOrName) {
  const name = typeof hubOrName === "string" ? hubOrName : hubOrName?.name ?? "";
  return name.replace(/\s*\(Draft\)\s*$/i, "").trim();
}

/** Whether a hub is in draft — prefers structured `status`, falls back to legacy name suffix. */
export function isHubDraft(hub) {
  if (!hub) return false;
  if (hub.status === "draft") return true;
  if (hub.status === "published" || hub.status === "archived") return false;
  return /\(Draft\)\s*$/i.test(hub.name ?? "");
}
