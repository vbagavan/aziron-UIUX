/** Recently accessed hubs for sidebar quick links. */
export function getRecentHubs(hubs, limit = 5) {
  return [...(hubs ?? [])]
    .sort((a, b) => {
      const aTime = Date.parse(a.lastAccessedAt ?? a.updatedAt ?? 0) || 0;
      const bTime = Date.parse(b.lastAccessedAt ?? b.updatedAt ?? 0) || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}
