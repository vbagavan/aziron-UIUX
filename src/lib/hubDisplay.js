/** Display helpers for Knowledge Hub names. */

/** Strip legacy "(Draft)" suffix from hub names for display. */
export function getHubDisplayName(hubOrName) {
  const name = typeof hubOrName === "string" ? hubOrName : hubOrName?.name ?? "";
  return name.replace(/\s*\(Draft\)\s*$/i, "").trim();
}
