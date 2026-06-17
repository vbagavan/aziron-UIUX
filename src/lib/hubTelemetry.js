import { agentsUsingHub } from "@/lib/agentKnowledge";
import { canActivateFileSync } from "@/lib/fileSyncStatus";
import {
  mergeMyDigitalHubAgents,
  mergeMyDigitalHubFlows,
} from "@/lib/myDigitalHubLinks";
import { workflowsUsingHub } from "@/lib/workflowKnowledge";
import { assetTypeLabel, formatDisplayDate, getHubFileSourceLabel } from "@/data/knowledgeHubs";
import { hubRoleLabel } from "@/lib/hubRoles";

const DEFAULT_OWNER = { name: "You", email: "you@workspace.local", role: "Owner" };

const TIMELINE_FILTER_GROUPS = {
  all: () => true,
  hub: (e) => e.category === "hub",
  document: (e) => e.category?.startsWith("document"),
  cloud: (e) => e.category?.startsWith("cloud"),
  agent: (e) => e.category?.startsWith("agent"),
  workflow: (e) => e.category?.startsWith("workflow"),
  knowledge: (e) => e.category?.startsWith("asset"),
  members: (e) => e.category?.startsWith("member") || e.category === "share",
  metadata: (e) => e.category === "metadata",
  access: (e) => e.category === "access" || e.category === "interaction",
  system: (e) => e.category === "system",
};

export const HUB_TIMELINE_FILTERS = [
  { id: "all", label: "All events" },
  { id: "hub", label: "Hub" },
  { id: "document", label: "Files" },
  { id: "cloud", label: "Cloud sync" },
  { id: "knowledge", label: "Generated assets" },
  { id: "members", label: "Members" },
  { id: "agent", label: "Agents" },
  { id: "workflow", label: "Workflows" },
  { id: "metadata", label: "Metadata" },
  { id: "access", label: "User activity" },
  { id: "system", label: "System" },
];

function hashSeed(value) {
  let h = 0;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function parseHubTimestamp(hub, field) {
  const raw = hub?.[field];
  return parseValidDate(raw);
}

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function parseValidDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolveCreatedAt(hub) {
  return (
    parseHubTimestamp(hub, "createdAt") ??
    parseValidDate(hub?.createdOn) ??
    new Date(Date.now() - 30 * 86400000)
  );
}

function resolveUpdatedAt(hub) {
  const fromUpdatedAt = parseHubTimestamp(hub, "updatedAt");
  if (fromUpdatedAt) return fromUpdatedAt;
  if (hub?.updated === "Just now") return new Date();
  const created = resolveCreatedAt(hub);
  const offsetDays = (hashSeed(hub?.id) % 14) + 1;
  return new Date(created.getTime() + offsetDays * 86400000);
}

function resolveLastAccessedAt(hub) {
  const fromAccess = parseHubTimestamp(hub, "lastAccessedAt");
  if (fromAccess) return fromAccess;
  const updated = resolveUpdatedAt(hub);
  const hoursAgo = (hashSeed(`${hub?.id}-access`) % 72) + 1;
  return new Date(Math.max(updated.getTime(), Date.now() - hoursAgo * 3600000));
}

function resolveHubStatus(hub) {
  return hub?.status ?? "published";
}

export function formatDisplayDateTime(isoOrDate) {
  if (isoOrDate == null || isoOrDate === "") return "—";
  const d =
    isoOrDate instanceof Date ? (isValidDate(isoOrDate) ? isoOrDate : null) : parseValidDate(isoOrDate);
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTimeFrom(date) {
  if (!date) return "Never";
  const d =
    date instanceof Date ? (isValidDate(date) ? date : null) : parseValidDate(date);
  if (!d) return "—";
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(diffMs)) return "—";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDisplayDate(d);
}

function parseFileDate(file) {
  const raw = file?.uploadedAt ?? file?.created;
  const parsed = parseValidDate(raw);
  if (parsed) return parsed;
  // `updated` is often a relative UI string ("Just now") — don't parse as Date
  return null;
}

function resolveSyncStatusLabel(file) {
  if (file.source !== "cloud") return "Local";
  if (file.syncStatus === "stored" || file.localBlobId) return "Synced";
  if (file.syncStatus === "loading") return "Syncing";
  if (file.syncStatus === "failed") return "Failed";
  return "Cloud reference";
}

function buildUsageTrend(hubId, documentCount, agentCount, workflowCount, key = "queries") {
  const seed = hashSeed(`${hubId}-${key}`);
  const base = Math.max(4, documentCount * 3 + agentCount * 12 + workflowCount * 8);
  const weeks = ["4 wk ago", "3 wk ago", "2 wk ago", "Last wk", "This wk"];
  return weeks.map((label, i) => ({
    label,
    value: Math.round(base * (0.55 + ((seed + i * 17) % 40) / 100)),
  }));
}

function buildHubTimeline(hub, linkedAgents, linkedWorkflows, allFiles) {
  const events = [];
  const created = resolveCreatedAt(hub);
  const updated = resolveUpdatedAt(hub);
  const lastAccess = resolveLastAccessedAt(hub);

  events.push({
    id: "hub-created",
    category: "hub",
    label: "Knowledge Hub created",
    detail: hub?.name ?? "Hub",
    at: created,
  });

  for (const file of allFiles.filter((f) => !f.isSampleDemo)) {
    const at = parseFileDate(file) ?? updated;
    const source = getHubFileSourceLabel(file);
    if (file.source === "cloud") {
      const synced = file.syncStatus === "stored" || file.localBlobId;
      events.push({
        id: `cloud-${file.id}`,
        category: synced ? "cloud-sync" : "cloud-link",
        label: synced ? "Cloud file synced locally" : "Cloud file linked",
        detail: `${file.name} · ${source}`,
        at,
      });
      if (synced && file.syncedAt) {
        const syncAt = parseValidDate(file.syncedAt);
        if (syncAt) {
          events.push({
            id: `cloud-sync-${file.id}`,
            category: "cloud-sync",
            label: "Cloud sync completed",
            detail: file.name,
            at: syncAt,
          });
        }
      }
    } else {
      events.push({
        id: `doc-add-${file.id}`,
        category: "document-add",
        label: "File uploaded",
        detail: `${file.name} · ${file.type ?? "File"}`,
        at,
      });
    }
  }

  for (const agent of linkedAgents) {
    events.push({
      id: `agent-attach-${agent.id}`,
      category: "agent-attach",
      label: "Agent attached",
      detail: agent.name,
      at: new Date(updated.getTime() - hashSeed(agent.id) * 3600000),
    });
  }

  for (const flow of linkedWorkflows) {
    events.push({
      id: `flow-attach-${flow.id}`,
      category: "workflow-attach",
      label: "Workflow attached",
      detail: `${flow.name} ${flow.version ?? ""}`.trim(),
      at: new Date(updated.getTime() - hashSeed(flow.id) * 7200000),
    });
  }

  for (const asset of hub?.assets ?? []) {
    const at = parseValidDate(asset.createdAt) ?? updated;
    const archived = asset.status === "archived";
    events.push({
      id: `asset-${asset.id}`,
      category: archived ? "asset-archive" : "asset-add",
      label: archived
        ? `${assetTypeLabel(asset.type)} archived`
        : `${assetTypeLabel(asset.type)} generated`,
      detail: `${asset.title} · ${asset.createdByName ?? "Member"}`,
      at,
    });
  }

  for (const member of hub?.members ?? []) {
    if (member.role === "owner") continue;
    const at = parseValidDate(member.addedAt) ?? created;
    const isGroup = member.principalType !== "user";
    events.push({
      id: `member-${member.id}`,
      category: "member-add",
      label: isGroup
        ? `${member.principalType === "team" ? "Team" : "Department"} given access`
        : "Member added",
      detail: `${member.name} · ${hubRoleLabel(member.role)}`,
      at,
    });
  }

  if (updated.getTime() > created.getTime() + 60000) {
    events.push({
      id: "metadata-updated",
      category: "metadata",
      label: "Metadata updated",
      detail: "Name, description, or tags changed",
      at: updated,
    });
  }

  events.push({
    id: "last-access",
    category: "interaction",
    label: "Hub accessed",
    detail: "Control center opened",
    at: lastAccess,
  });

  events.push({
    id: "system-index",
    category: "system",
    label: "Vector index refreshed",
    detail: "Managed vector store re-indexed hub sources",
    at: new Date(lastAccess.getTime() - 3600000 * 6),
  });

  return events
    .filter((e) => e.at && !Number.isNaN(e.at.getTime()))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map((e) => ({
      ...e,
      atLabel: formatDisplayDateTime(e.at),
      relative: relativeTimeFrom(e.at),
    }));
}

export function filterTimelineEvents(timeline, filterId = "all", search = "") {
  const predicate = TIMELINE_FILTER_GROUPS[filterId] ?? TIMELINE_FILTER_GROUPS.all;
  const q = search.trim().toLowerCase();
  return (timeline ?? []).filter((e) => {
    if (!predicate(e)) return false;
    if (!q) return true;
    return (
      e.label.toLowerCase().includes(q) ||
      e.detail.toLowerCase().includes(q) ||
      e.category?.includes(q)
    );
  });
}

function enrichFileRecord(file, hubId, linkedAgents, linkedWorkflows) {
  const uploadedAt = parseFileDate(file);
  const modifiedAt = parseValidDate(file.updated) ?? uploadedAt ?? new Date();
  const usageCount = Math.max(1, hashSeed(`${hubId}-${file.id}`) % 80);
  const refAgents = linkedAgents.filter(
    (_, i) => hashSeed(`${file.id}-agent-${i}`) % 3 !== 0,
  );
  const refWorkflows = linkedWorkflows.filter(
    (_, i) => hashSeed(`${file.id}-flow-${i}`) % 4 === 0,
  );

  return {
    id: file.id,
    raw: file,
    name: file.name,
    type: file.type ?? "File",
    source: getHubFileSourceLabel(file),
    sourceKind: file.source ?? "user",
    cloudProvider: file.cloudProvider,
    connectionName: file.connectionName,
    syncStatus: resolveSyncStatusLabel(file),
    syncStatusRaw: file.syncStatus,
    lastSyncLabel: file.syncedAt ? formatDisplayDateTime(file.syncedAt) : "—",
    libraryDocumentId: file.libraryDocumentId,
    uploadedAt,
    uploadedAtLabel: formatDisplayDateTime(uploadedAt),
    uploadedRelative: relativeTimeFrom(uploadedAt),
    modifiedAtLabel: formatDisplayDateTime(modifiedAt),
    modifiedRelative: relativeTimeFrom(modifiedAt),
    usageCount,
    referencedAgents: refAgents.map((a) => ({ id: a.id, name: a.name })),
    referencedWorkflows: refWorkflows.map((f) => ({ id: f.id, name: f.name })),
    isCloud: file.source === "cloud",
    needsSync: canActivateFileSync(file),
  };
}

/** Aggregate metadata + telemetry for Knowledge Hub control center. */
export function getHubTelemetry(hub, { agents = [], flows = [], allFiles = [] } = {}) {
  if (!hub) return null;

  const linkedAgentsRaw = mergeMyDigitalHubAgents(
    agentsUsingHub(hub.id, agents),
    agents,
    hub,
  );
  const linkedWorkflowsRaw = mergeMyDigitalHubFlows(
    workflowsUsingHub(hub.id, flows),
    flows,
    hub,
  );
  const realFiles = allFiles.filter((f) => !f.isSampleDemo);
  const documentCount = realFiles.length;

  const createdAt = resolveCreatedAt(hub);
  const updatedAt = resolveUpdatedAt(hub);
  const lastAccessedAt = resolveLastAccessedAt(hub);
  const lastActivityMs = Math.max(lastAccessedAt.getTime(), updatedAt.getTime());
  const lastActivityAt = Number.isNaN(lastActivityMs) ? new Date() : new Date(lastActivityMs);

  const owner = hub.owner ?? DEFAULT_OWNER;
  const status = resolveHubStatus(hub);
  const tags = hub.tags ?? [];
  const accessCount = hub.accessCount ?? Math.max(12, hashSeed(hub.id) % 200 + documentCount * 4);

  const linkedAgents = linkedAgentsRaw.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.ragMode ? "RAG Agent" : "Assistant",
    status: a.status ?? "idle",
    lastRun: a.lastRun ?? "—",
    lastExecution: a.lastRun ?? "—",
    successRate: a.success ?? null,
    queryVolume: Math.max(1, hashSeed(`${hub.id}-${a.id}`) % 120),
    utilization: Math.min(100, 40 + (hashSeed(`${hub.id}-${a.id}-u`) % 55)),
    provider: a.provider,
    model: a.model,
  }));

  const linkedWorkflows = linkedWorkflowsRaw.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.steps?.[0]?.label ? `${f.steps[0].label} pipeline` : "Automation",
    version: f.version,
    lastRun: f.lastRun ?? "—",
    lastExecution: f.lastRun ?? "—",
    runs: f.runs ?? 0,
    successRate: f.success ?? null,
    status: f.status,
  }));

  const files = realFiles
    .map((f) => enrichFileRecord(f, hub.id, linkedAgentsRaw, linkedWorkflowsRaw))
    .sort((a, b) => (b.uploadedAt?.getTime() ?? 0) - (a.uploadedAt?.getTime() ?? 0));

  const mostUsedDocument = [...files].sort((a, b) => b.usageCount - a.usageCount)[0] ?? null;
  const mostActiveAgent = [...linkedAgents].sort((a, b) => b.queryVolume - a.queryVolume)[0] ?? null;
  const totalGenerations = Math.max(0, hashSeed(`${hub.id}-gen`) % 40 + documentCount * 2);
  const totalQueries = linkedAgents.reduce((s, a) => s + a.queryVolume, 0);

  const timeline = buildHubTimeline(hub, linkedAgentsRaw, linkedWorkflowsRaw, allFiles);
  const queryTrend = buildUsageTrend(hub.id, documentCount, linkedAgents.length, linkedWorkflows.length, "queries");
  const generationTrend = buildUsageTrend(hub.id, documentCount, linkedAgents.length, linkedWorkflows.length, "gen");

  const seed = hashSeed(hub.id);

  return {
    metadata: {
      createdAt,
      updatedAt,
      lastAccessedAt,
      lastActivityAt,
      createdAtLabel: formatDisplayDateTime(createdAt),
      updatedAtLabel: formatDisplayDateTime(updatedAt),
      updatedAtRelative: relativeTimeFrom(updatedAt),
      lastAccessLabel: formatDisplayDateTime(lastAccessedAt),
      lastActivityLabel: formatDisplayDateTime(lastActivityAt),
      lastAccessRelative: relativeTimeFrom(lastAccessedAt),
      lastActivityRelative: relativeTimeFrom(lastActivityAt),
      owner,
      status,
      tags,
      provider: hub.provider ?? "Managed vector store",
      visibility: hub.visibility ?? "private",
    },
    summary: {
      documents: documentCount,
      agents: linkedAgents.length,
      workflows: linkedWorkflows.length,
      queries: totalQueries,
      generations: totalGenerations,
      lastActivity: relativeTimeFrom(lastActivityAt),
      mostUsedDocument: mostUsedDocument?.name ?? "—",
      mostActiveAgent: mostActiveAgent?.name ?? "—",
    },
    counts: {
      documents: documentCount,
      libraryLinked: files.filter((f) => f.libraryDocumentId).length,
      cloudReferences: files.filter((f) => f.needsSync).length,
      cloudSynced: files.filter((f) => f.isCloud && !f.needsSync).length,
      agents: linkedAgents.length,
      workflows: linkedWorkflows.length,
    },
    files,
    linkedAgents,
    linkedWorkflows,
    relationships: {
      documents: files.map((f) => ({ id: f.id, name: f.name, type: f.type })),
      agents: linkedAgents.map((a) => ({ id: a.id, name: a.name })),
      workflows: linkedWorkflows.map((w) => ({ id: w.id, name: w.name })),
    },
    usage: {
      accessCount,
      totalQueries,
      totalGenerations,
      totalWorkflowRuns: linkedWorkflows.reduce((s, f) => s + f.runs, 0),
      queryTrend,
      generationTrend,
      mostActiveAgents: [...linkedAgents].sort((a, b) => b.queryVolume - a.queryVolume).slice(0, 5),
      mostActiveWorkflows: [...linkedWorkflows].sort((a, b) => b.runs - a.runs).slice(0, 5),
      mostReferencedDocuments: [...files].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5),
    },
    analytics: {
      searchSuccessRate: 82 + (seed % 15),
      agentResponseQuality: (3.8 + (seed % 12) / 10).toFixed(1),
      userEngagementScore: 60 + (seed % 35),
      documentAccessFrequency: files.slice(0, 6).map((f) => ({
        name: f.name,
        count: f.usageCount,
      })),
      knowledgeConsumption: {
        agents: linkedAgents.reduce((s, a) => s + a.utilization, 0),
        workflows: linkedWorkflows.length * 24,
        reports: (seed % 5) * 8,
        chat: documentCount * 6,
      },
    },
    timeline,
  };
}
