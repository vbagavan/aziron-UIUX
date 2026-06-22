/**
 * Shared list + detail field model for Documents library and Hub sources tables.
 * Keeps column labels, metrics, and hub-link copy consistent across surfaces.
 */

import { formatDisplayDate } from "@/data/knowledgeHubs";
import { getFileTypeConfig } from "@/components/features/knowledge/hubFileTypeConfig";
import {
  getSourceMetricDisplay,
  getSourceMetricColumnLabel,
  getSourceProviderLabel,
  getSourceLifecycleMeta,
  isSingleHubSource,
  resolveSourceCategory,
  SOURCE_CATEGORIES,
} from "@/lib/sourceCategories";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export const SOURCE_LIST_COLUMNS = {
  status: "Status",
  name: "Name",
  source: "Source",
  hubs: "Knowledge Hubs",
  format: "Format",
  metric: "Size",
  updated: "Updated",
};

export function getSourceFormatLabel(record) {
  const category = resolveSourceCategory(record);
  if (category === "files") {
    return getFileTypeConfig(record?.type).label ?? record?.type ?? "File";
  }
  if (category === "dbs") {
    return SOURCE_CATEGORIES.dbs.label;
  }
  if (category === "apis") {
    return SOURCE_CATEGORIES.apis.label;
  }
  return record?.type ?? "Source";
}

export function getSourceMetricColumnLabelForRecord(record, categoryFilter = "all") {
  const category = categoryFilter === "all" ? resolveSourceCategory(record) : categoryFilter;
  return getSourceMetricColumnLabel(category);
}

/** Detail panel title for side drawers / readers. */
export function getSourceDetailsTitle(record) {
  const category = resolveSourceCategory(record);
  if (category === "dbs") return "Database details";
  if (category === "apis") return "API details";
  return "File details";
}

/** Rows for `<dl>` detail sections in reader / drawer panels. */
export function getSourceDetailRows(record, { detail } = {}) {
  const category = resolveSourceCategory(record);
  const lifecycle = getSourceLifecycleMeta(record);

  if (category === "dbs" && detail) {
    const rows = [
      { label: "Connection", value: detail.connectionName },
      { label: "Provider", value: detail.provider },
      { label: "Environment", value: detail.environment },
      { label: "Focused table", value: detail.focusedTable },
      { label: "Status", value: lifecycle.label },
      { label: "Last sync", value: detail.lastSyncRelative },
      { label: "Health", value: detail.health },
      { label: "Source", value: getSourceProviderLabel(record), isBadge: true },
    ];
    return rows.filter((r) => r.value != null && r.value !== "");
  }

  if (category === "apis" && detail) {
    const rows = [
      { label: "Connection", value: detail.connectionName },
      { label: "Version", value: detail.version },
      { label: "Authentication", value: detail.authentication },
      { label: "Status", value: detail.status ?? lifecycle.label },
      { label: "Latency", value: detail.latencyMs != null ? `${detail.latencyMs}ms` : null },
      { label: "Availability", value: detail.availability },
      { label: "Last sync", value: detail.lastSyncRelative },
      { label: "Lifecycle", value: lifecycle.label },
      { label: "Source", value: getSourceProviderLabel(record), isBadge: true },
    ];
    return rows.filter((r) => r.value != null && r.value !== "");
  }

  const metric = getSourceMetricDisplay(record);
  const rows = [
    { label: "Format", value: getSourceFormatLabel(record) },
    { label: "Source", value: getSourceProviderLabel(record) },
    { label: getSourceMetricColumnLabel(category), value: metric.label },
    { label: "Status", value: lifecycle.label },
  ];

  if (record?.uploadedAt) {
    rows.push({
      label: "Added",
      value: formatDisplayDate(record.uploadedAt) ?? record.uploadedAt,
    });
  }

  if (category === "apis" && record?.endpointUrl) {
    rows.push({ label: "Endpoint", value: record.endpointUrl });
  }

  if (category === "dbs" && record?.connectionName) {
    rows.push({ label: "Connection", value: record.connectionName });
  }

  if (category === "dbs" && record?.tableName) {
    rows.push({ label: "Table", value: record.tableName });
  }

  return rows;
}

export function getSourceHubLinkEmptyMessage(record) {
  const category = resolveSourceCategory(record);
  if (category === "dbs") {
    return "This database isn't in a Knowledge Hub yet. Link it to one hub so agents can query it.";
  }
  if (category === "apis") {
    return "This API isn't in a Knowledge Hub yet. Link it to one hub so agents can use it.";
  }
  return "This file isn't in a Knowledge Hub yet. Files can belong to multiple hubs.";
}

export function getSourceHubLinkPickerHint(record, { allHubsLinked = false } = {}) {
  if (allHubsLinked) {
    return isSingleHubSource(record)
      ? "This source is already linked to a Knowledge Hub."
      : "This source is already linked to all your Knowledge Hubs.";
  }
  return undefined;
}

/** Live hub links → Usage tab rows (agents/flows remain demo until wired). */
export function hubLinksToUsageRows(hubLinks = []) {
  return (hubLinks ?? []).map((link) => ({
    id: String(link.hubId),
    name: link.hubName,
    status: "active",
    linkedAssets: null,
    lastAccessed: "—",
    hubId: link.hubId,
  }));
}

export function mergeSourceUsage({ usage = {}, hubLinks = [] } = {}) {
  const liveHubs = hubLinksToUsageRows(hubLinks);
  return {
    ...usage,
    hubs: liveHubs.length > 0 ? liveHubs : usage?.hubs ?? [],
  };
}

export function getHubSourcesSearchPlaceholder() {
  return `Search ${KNOWLEDGE_TERMS.hubSourcesTab.toLowerCase()}…`;
}

export function getDocumentsSearchPlaceholder() {
  return "Search sources…";
}
