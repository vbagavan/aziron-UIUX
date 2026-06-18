/** Right-panel tabs with optional hub count badge on Details. */
export function panelTabsWithHubCount(baseTabs, hubLinks = []) {
  const hubCount = hubLinks?.length ?? 0;
  return baseTabs.map((tab) =>
    tab.id === "details" && hubCount > 0 ? { ...tab, count: hubCount } : tab,
  );
}
