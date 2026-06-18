import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bot,
  ChevronDown,
  FileText,
  GitBranch,
  History,
  PanelLeftClose,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageUnderlineTabs } from "@/components/common/PageUnderlineTabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SourceBadge } from "@/components/features/knowledge/SourceBadge";
import { FileStatusSummaryBar } from "@/components/features/knowledge/FileStatusSummaryBar";
import { SourceCategoryTabBar } from "@/components/features/sources/shared/SourceCategoryTabBar";
import { SourceEmptyState } from "@/components/features/sources/shared/SourceEmptyState";
import { SourceStatusIndicator } from "@/components/features/sources/shared/SourceStatusIndicator";
import { resolveFileLifecycleStatus } from "@/lib/fileSyncStatus";
import { HubMiniBarChart } from "@/components/features/knowledge/control-center/HubControlCenterCharts";
import { HubControlCenterRelationships } from "@/components/features/knowledge/control-center/HubControlCenterRelationships";
import { HubControlCenterTimeline } from "@/components/features/knowledge/control-center/HubControlCenterTimeline";
import { SampleDataNote } from "@/components/features/knowledge/control-center/SampleDataNote";
import { KnowledgeHubBackNav } from "@/components/features/knowledge/KnowledgeHubBackNav";
import {
  filterTimelineEvents,
  getHubTelemetry,
} from "@/lib/hubTelemetry";
import { useAgents } from "@/context/AgentsContext";
import { useFlowCatalog } from "@/context/FlowCatalogContext";
import { getHubDisplayName } from "@/lib/hubDisplay";
import { paginateSlice } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getSourceMetricDisplay, getSourceMetricColumnLabel, resolveSourceCategory, resolveCategoryLifecycleStatus } from "@/lib/sourceCategories";
import { getSourceFormatLabel, SOURCE_LIST_COLUMNS, getHubSourcesSearchPlaceholder } from "@/lib/sourceListModel";
import { KNOWLEDGE_TERMS, sourcesCountLabel } from "@/lib/knowledgeTerminology";
import { CAPTION, PAGE_SUBTITLE } from "@/lib/typography";
import { PAGINATION_CONTROL_CLASS } from "@/lib/listToolbar";
import { summarizeHubAssets } from "@/data/knowledgeHubs";
import {
  hubRoleCan,
  resolveHubRole,
} from "@/lib/hubRoles";
import { HubStudioTab } from "@/components/features/knowledge/control-center/HubStudioTab";
import { HubMembersTab } from "@/components/features/knowledge/control-center/HubMembersTab";
import { ShareHubDialog } from "@/components/features/knowledge/ShareHubDialog";

const HUB_FILES_PAGE_SIZE = 20;

const ALL_HUB_TABS = [
  { id: "documents", label: KNOWLEDGE_TERMS.hubSourcesTab, icon: FileText },
  { id: "studio", label: KNOWLEDGE_TERMS.hubStudioTab, icon: Wand2 },
  { id: "members", label: "Members", icon: Users },
  { id: "usage", label: "Usage", icon: Activity },
  { id: "telemetry", label: KNOWLEDGE_TERMS.insightsTab, icon: BarChart3, requiresInsights: true },
  { id: "timeline", label: KNOWLEDGE_TERMS.hubTimelineTab, icon: History },
];

function AgentStatusBadge({ status }) {
  const variant =
    status === "active" ? "default" : status === "error" ? "destructive" : "secondary";
  return (
    <Badge variant={variant} className="text-[10px] capitalize">
      {status}
    </Badge>
  );
}

function FilesTablePagination({ page, totalPages, totalItems, category = "all", onPageChange }) {
  if (totalItems === 0) return null;
  const currentPage = Math.min(page, totalPages);
  const countLabel = sourcesCountLabel(totalItems, category);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
      <p className="text-xs text-muted-foreground">
        {totalPages > 1 ? (
          <>
            {countLabel} · page {currentPage} of {totalPages}
          </>
        ) : (
          <>{countLabel}</>
        )}
      </p>
      {totalPages > 1 ? (
        <Pagination className="mx-0 w-auto">
          <PaginationContent className="gap-0.5">
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.max(1, currentPage - 1));
                }}
                className={cn(
                  PAGINATION_CONTROL_CLASS,
                  currentPage === 1 && "pointer-events-none opacity-40",
                )}
                aria-disabled={currentPage === 1}
                text="Prev"
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <PaginationItem key={pg}>
                <PaginationLink
                  isActive={pg === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(pg);
                  }}
                  className={cn(PAGINATION_CONTROL_CLASS, "w-11")}
                >
                  {pg}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.min(totalPages, currentPage + 1));
                }}
                className={cn(
                  PAGINATION_CONTROL_CLASS,
                  currentPage === totalPages && "pointer-events-none opacity-40",
                )}
                aria-disabled={currentPage === totalPages}
                text="Next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}

const HUB_USAGE_TABS = [
  { id: "agents", label: "Agents", icon: Bot },
  { id: "workflows", label: "Workflows", icon: GitBranch },
];

function HubUsageTab({ linkedAgents, linkedWorkflows, onNavigateAgents, onNavigateFlows, onSelectAgent }) {
  const [activeUsageTab, setActiveUsageTab] = useState("agents");

  const usageTabs = useMemo(
    () =>
      HUB_USAGE_TABS.map((tab) => ({
        ...tab,
        count: tab.id === "agents" ? linkedAgents.length : linkedWorkflows.length,
      })),
    [linkedAgents.length, linkedWorkflows.length],
  );

  return (
    <Tabs value={activeUsageTab} onValueChange={setActiveUsageTab} className="flex min-h-0 flex-1 flex-col gap-0">
      <PageUnderlineTabs
        value={activeUsageTab}
        onValueChange={setActiveUsageTab}
        tabs={usageTabs}
        ariaLabel="Usage sections"
        className="px-5"
      />

      <TabsContent value="agents" className="mt-0 min-h-0 flex-1 px-5 pt-5">
        {linkedAgents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40">
              <Bot className="size-5 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No agents connected</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Attach an agent to this hub so it can retrieve documents during execution.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onNavigateAgents}>
              <Bot className="size-3.5" />
              Go to Agents
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <SampleDataNote>Query, success, and utilization figures are simulated for preview.</SampleDataNote>
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last execution</TableHead>
                    <TableHead className="text-right">Queries</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <button type="button" className="font-medium hover:underline" onClick={() => onSelectAgent(agent.id)}>
                          {agent.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{agent.type}</TableCell>
                      <TableCell><AgentStatusBadge status={agent.status} /></TableCell>
                      <TableCell className="text-xs">{agent.lastExecution}</TableCell>
                      <TableCell className="text-right tabular-nums">{agent.queryVolume}</TableCell>
                      <TableCell className="text-right tabular-nums">{agent.successRate != null ? `${agent.successRate}%` : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{agent.utilization}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="workflows" className="mt-0 min-h-0 flex-1 px-5 pt-5">
        {linkedWorkflows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40">
              <GitBranch className="size-5 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No workflows connected</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Reference this hub from a workflow so its steps can retrieve knowledge during a run.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onNavigateFlows}>
              <GitBranch className="size-3.5" />
              Go to Workflows
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <SampleDataNote>Run and success figures are simulated for preview.</SampleDataNote>
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last execution</TableHead>
                    <TableHead className="text-right">Runs</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedWorkflows.map((flow) => (
                    <TableRow key={flow.id}>
                      <TableCell>
                        <button type="button" className="font-medium hover:underline" onClick={onNavigateFlows}>
                          {flow.name}
                          <span className="ml-1 text-xs text-muted-foreground">{flow.version}</span>
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{flow.type}</TableCell>
                      <TableCell><AgentStatusBadge status={flow.status} /></TableCell>
                      <TableCell className="text-xs">{flow.lastExecution}</TableCell>
                      <TableCell className="text-right tabular-nums">{flow.runs.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{flow.successRate != null ? `${flow.successRate}%` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function KnowledgeHubControlCenter({
  hub,
  hubName,
  hubDescription,
  allFiles = [],
  canEdit: canEditProp = false,
  showDemoStatuses = false,
  onOpenSources,
  onOpenSource,
  onDeleteFile,
  onDownloadCloudFile,
  onEditHub,
  pendingDownloadCount = 0,
  onDownloadAllPending,
  onBrowseDocumentsLibrary,
  onBackToHubs,
  requestedTab = null,
  requestedAssetId = null,
  className,
}) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { auth } = useAuth();
  const { addHubMembers } = useKnowledgeHubs();
  const { agents } = useAgents();
  const { flows } = useFlowCatalog();
  const canViewInsights = can("knowledge.insights");

  const hubRole = useMemo(() => resolveHubRole(hub, auth?.user), [hub, auth?.user]);
  const [shareOpen, setShareOpen] = useState(false);
  const [relationshipsCollapsed, setRelationshipsCollapsed] = useState(false);

  // File editing is the org-level permission AND the hub role allowing uploads.
  const canEdit = canEditProp && hubRoleCan(hubRole, "sources.upload");
  const canShare = hubRoleCan(hubRole, "hub.share");

  const hubTabs = useMemo(
    () => ALL_HUB_TABS.filter((tab) => !tab.requiresInsights || canViewInsights),
    [canViewInsights],
  );
  const [activeTab, setActiveTab] = useState("documents");
  const [docSearch, setDocSearch] = useState("");
  const [docCategoryFilter, setDocCategoryFilter] = useState("all");
  const [docSourceFilter, setDocSourceFilter] = useState("all");
  const [docStatusFilter, setDocStatusFilter] = useState(null);
  const [docPage, setDocPage] = useState(1);
  const [selectedDocIds, setSelectedDocIds] = useState(() => new Set());
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [timelineSearch, setTimelineSearch] = useState("");

  const telemetry = useMemo(
    () => getHubTelemetry(hub, { agents, flows, allFiles }),
    [hub, agents, flows, allFiles],
  );

  const filteredDocs = useMemo(() => {
    if (!telemetry) return [];
    let list = telemetry.files;
    const q = docSearch.trim().toLowerCase();
    if (q) list = list.filter((d) => d.name.toLowerCase().includes(q));
    if (docCategoryFilter !== "all") {
      list = list.filter((d) => resolveSourceCategory(d.raw) === docCategoryFilter);
    }
    if (docSourceFilter === "cloud") list = list.filter((d) => d.isCloud);
    if (docSourceFilter === "local") list = list.filter((d) => !d.isCloud);
    if (docSourceFilter === "library") list = list.filter((d) => d.libraryDocumentId);
    if (docStatusFilter) {
      list = list.filter((d) => {
        const category = resolveSourceCategory(d.raw);
        const status =
          category === "files"
            ? resolveFileLifecycleStatus(d.raw, { includeDemoStatuses: showDemoStatuses })
            : resolveCategoryLifecycleStatus(d.raw, { includeDemoStatuses: showDemoStatuses });
        if (docStatusFilter === "local") return d.raw?.source === "user" || d.raw?.source === "upload";
        if (docStatusFilter === "processing") return status === "processing" || status === "syncing" || status === "fetching";
        return status === docStatusFilter;
      });
    }
    return list;
  }, [telemetry, docSearch, docCategoryFilter, docSourceFilter, docStatusFilter, showDemoStatuses]);

  const hubMetricColumnLabel = getSourceMetricColumnLabel(docCategoryFilter);

  const docPagination = useMemo(
    () => paginateSlice(filteredDocs, docPage, HUB_FILES_PAGE_SIZE),
    [filteredDocs, docPage],
  );

  useEffect(() => {
    setDocPage(1);
  }, [docSearch, docCategoryFilter, docSourceFilter, docStatusFilter, hub?.id]);

  useEffect(() => {
    if (!requestedTab) return;
    if (hubTabs.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab, hubTabs]);

  useEffect(() => {
    if (!hubTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("documents");
    }
  }, [hubTabs, activeTab]);

  const filteredTimeline = useMemo(
    () => filterTimelineEvents(telemetry?.timeline, timelineFilter, timelineSearch),
    [telemetry, timelineFilter, timelineSearch],
  );

  if (!hub || !telemetry) return null;

  const { metadata, summary, linkedAgents, linkedWorkflows, usage, analytics, relationships } =
    telemetry;

  const assetSummary = summarizeHubAssets(hub);
  const memberCount = (hub.members ?? []).length;

  const tabCounts = {
    documents: telemetry.files.length,
    studio: assetSummary.active,
    usage: summary.agents + summary.workflows,
    members: memberCount,
  };

  const hubTabsWithCounts = hubTabs.map((tab) => ({
    ...tab,
    count: tabCounts[tab.id],
  }));

  function toggleDocSelection(id) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkRemove() {
    if (!onDeleteFile || selectedDocIds.size === 0) return;
    for (const id of selectedDocIds) {
      const file = allFiles.find((f) => f.id === id);
      if (file) onDeleteFile(file);
    }
    setSelectedDocIds(new Set());
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-border bg-muted/20 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {onBackToHubs ? (
                <KnowledgeHubBackNav
                  onBack={onBackToHubs}
                  hubTitle={getHubDisplayName(hubName)}
                  showSeparator={false}
                  className="min-w-0 shrink-0"
                />
              ) : (
                <h1 className="text-lg font-semibold leading-tight tracking-tight">
                  {getHubDisplayName(hubName)}
                </h1>
              )}
            </div>

            {hubDescription ? (
              <p className={cn(PAGE_SUBTITLE, "max-w-2xl")}>{hubDescription}</p>
            ) : canEdit && onEditHub ? (
              <p className={CAPTION}>
                No description yet.{" "}
                <button
                  type="button"
                  onClick={onEditHub}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  Add description
                </button>
              </p>
            ) : (
              <p className={CAPTION}>No description yet.</p>
            )}


            <p className={CAPTION}>
              {metadata.owner?.name ?? "Unknown"}
              <span aria-hidden className="mx-1.5 text-border">·</span>
              <span title={`Modified ${metadata.updatedAtLabel}`}>
                Updated {metadata.updatedAtRelative}
              </span>
              <span aria-hidden className="mx-1.5 text-border">·</span>
              <span title={`Created ${metadata.createdAtLabel}`}>
                Created {metadata.createdAtLabel}
              </span>
              {summary.lastActivity ? (
                <>
                  <span aria-hidden className="mx-1.5 text-border">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                    Active {summary.lastActivity}
                  </span>
                </>
              ) : null}
            </p>

            {metadata.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canShare ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setShareOpen(true)}>
                <Share2 className="size-3.5" />
                Share
              </Button>
            ) : null}
            {canEdit && onOpenSources ? (
              <Button type="button" size="sm" className="gap-1.5" onClick={onOpenSources}>
                <Plus data-icon="inline-start" aria-hidden />
                Add sources
              </Button>
            ) : null}
            {canEdit && onEditHub ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onEditHub}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile relationships — hidden on lg+ where left panel shows */}
      <Collapsible className="border-b border-border bg-muted/10 lg:hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-3 text-left">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Relationships
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-4">
          <HubControlCenterRelationships
            relationships={relationships}
            onNavigateDocuments={() => setActiveTab("documents")}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* ── Main layout ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: relationships (lg+) */}
        {relationshipsCollapsed ? (
          <aside className="hidden h-full min-h-0 w-11 shrink-0 flex-col items-center self-stretch border-r border-border bg-muted/10 py-3 lg:flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setRelationshipsCollapsed(false)}
              aria-label="Expand relationships"
            >
              <PanelLeftClose className="size-4 rotate-180" />
            </Button>
            <span className="mt-4 rotate-180 text-xs font-semibold text-muted-foreground [writing-mode:vertical-rl]">
              Relationships
            </span>
          </aside>
        ) : (
          <aside className="hidden h-full min-h-0 w-56 shrink-0 flex-col self-stretch overflow-hidden border-r border-border bg-muted/10 lg:flex xl:w-64">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Relationships
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  How this hub connects across the platform
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setRelationshipsCollapsed(true)}
                aria-label="Collapse relationships"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
              <HubControlCenterRelationships
                relationships={relationships}
                onNavigateDocuments={() => setActiveTab("documents")}
                hideHeading
              />
            </div>
          </aside>
        )}

        {/* Center: tabs */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col gap-0">
            <PageUnderlineTabs
              value={activeTab}
              onValueChange={setActiveTab}
              tabs={hubTabsWithCounts}
              ariaLabel="Hub sections"
              className="px-4"
            />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
              {/* Documents */}
              <TabsContent value="documents" className="mt-0 space-y-4">
                <SourceCategoryTabBar
                  value={docCategoryFilter}
                  onChange={setDocCategoryFilter}
                  className="px-0"
                />

                <FileStatusSummaryBar
                  files={allFiles}
                  title={KNOWLEDGE_TERMS.hubSourcesTab}
                  includeDemoStatuses={showDemoStatuses}
                  activeFilter={docStatusFilter}
                  onFilter={setDocStatusFilter}
                  hideWhenHealthy
                />

                {pendingDownloadCount > 0 && canEdit && onDownloadAllPending ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                    <p className="text-sm">
                      {pendingDownloadCount} cloud file{pendingDownloadCount === 1 ? "" : "s"} referenced but not synced locally
                    </p>
                    <Button type="button" size="sm" onClick={onDownloadAllPending}>
                      Sync all
                    </Button>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder={getHubSourcesSearchPlaceholder()}
                      aria-label="Search hub sources"
                      className="h-9 pl-8"
                    />
                  </div>
                  <Select value={docSourceFilter} onValueChange={setDocSourceFilter}>
                    <SelectTrigger className="h-9 w-[140px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="local">{KNOWLEDGE_TERMS.filterUploaded}</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="library">In library</SelectItem>
                    </SelectContent>
                  </Select>
                  {canEdit && selectedDocIds.size > 0 && onDeleteFile ? (
                    <Button type="button" size="sm" variant="destructive" onClick={handleBulkRemove}>
                      Remove ({selectedDocIds.size})
                    </Button>
                  ) : null}
                </div>

                {filteredDocs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-4">
                    {telemetry.files.length === 0 ? (
                      <SourceEmptyState
                        category={docCategoryFilter}
                        variant="hub"
                        canEdit={canEdit}
                        onAddSources={onOpenSources}
                        onBrowseLibrary={onBrowseDocumentsLibrary}
                      />
                    ) : (
                      <>
                        <FileText className="mx-auto mt-4 size-8 text-muted-foreground/40" />
                        <p className="mt-2 text-center text-sm font-medium">No sources match</p>
                        <p className="mt-1 text-center text-xs text-muted-foreground">
                          Try adjusting search or filters
                          {docStatusFilter || docSourceFilter !== "all" || docCategoryFilter !== "all" || docSearch.trim() ? (
                            <>
                              {" "}
                              or{" "}
                              <button
                                type="button"
                                className="font-medium text-primary underline-offset-2 hover:underline"
                                onClick={() => {
                                  setDocSearch("");
                                  setDocCategoryFilter("all");
                                  setDocSourceFilter("all");
                                  setDocStatusFilter(null);
                                }}
                              >
                                clear filters
                              </button>
                            </>
                          ) : null}
                          .
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {canEdit ? <TableHead className="w-10" /> : null}
                          <TableHead className="w-10">
                            <span className="sr-only">Status</span>
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>{SOURCE_LIST_COLUMNS.source}</TableHead>
                          <TableHead>{SOURCE_LIST_COLUMNS.format}</TableHead>
                          <TableHead className="text-right">{hubMetricColumnLabel}</TableHead>
                          <TableHead>{SOURCE_LIST_COLUMNS.updated}</TableHead>
                          <TableHead className="w-[80px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docPagination.items.map((doc) => (
                          <TableRow key={doc.id} className="group">
                            {canEdit ? (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedDocIds.has(doc.id)}
                                  onChange={() => toggleDocSelection(doc.id)}
                                  aria-label={`Select ${doc.name}`}
                                />
                              </TableCell>
                            ) : null}
                            <TableCell className="w-10 pr-0">
                              <SourceStatusIndicator
                                record={doc.raw}
                                fileName={doc.name}
                                canActivate={canEdit && doc.needsSync}
                                onActivate={onDownloadCloudFile ? () => onDownloadCloudFile(doc.raw) : undefined}
                                iconOnly
                                includeDemoStatuses={showDemoStatuses}
                              />
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                className="min-w-0 truncate text-left text-sm font-medium text-primary underline-offset-2 hover:underline"
                                onClick={() => onOpenSource?.(doc.raw)}
                              >
                                {doc.name}
                              </button>
                            </TableCell>
                            <TableCell>
                              <SourceBadge record={doc.raw} size="sm" />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {getSourceFormatLabel(doc.raw)}
                            </TableCell>
                            <TableCell className="text-right text-xs tabular-nums">
                              {getSourceMetricDisplay(doc.raw).label}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{doc.modifiedRelative}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                {canEdit && doc.isCloud && resolveFileLifecycleStatus(doc.raw) === "error" && onDownloadCloudFile ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    title="Retry sync"
                                    aria-label={`Retry sync for ${doc.name}`}
                                    className="text-warning opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                    onClick={() => onDownloadCloudFile(doc.raw)}
                                  >
                                    <RefreshCw className="size-3.5" />
                                  </Button>
                                ) : null}
                                {canEdit && onDeleteFile ? (
                                  <Button type="button" variant="ghost" size="icon-sm" className="text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onDeleteFile(doc.raw)}>
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <FilesTablePagination
                      page={docPagination.currentPage}
                      totalPages={docPagination.totalPages}
                      totalItems={docPagination.totalItems}
                      category={docCategoryFilter}
                      onPageChange={setDocPage}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Studio (create + assets) */}
              <TabsContent value="studio" className="mt-0">
                <HubStudioTab
                  hub={hub}
                  hubRole={hubRole}
                  actor={auth?.user}
                  allFiles={allFiles}
                  initialAssetId={requestedAssetId}
                />
              </TabsContent>

              {/* Members */}
              <TabsContent value="members" className="mt-0">
                <HubMembersTab
                  hub={hub}
                  hubRole={hubRole}
                  onShareClick={canShare ? () => setShareOpen(true) : undefined}
                />
              </TabsContent>

              {/* Agents */}
              {/* Usage — Agents + Workflows */}
              <TabsContent value="usage" className="mt-0 -mx-5 flex min-h-0 flex-1 flex-col">
                <HubUsageTab
                  linkedAgents={linkedAgents}
                  linkedWorkflows={linkedWorkflows}
                  onNavigateAgents={() => navigate("/agents")}
                  onNavigateFlows={() => navigate("/flows")}
                  onSelectAgent={(id) => navigate("/agents", { state: { highlightAgentId: id } })}
                />
              </TabsContent>

              {/* Telemetry */}
              <TabsContent value="telemetry" className="mt-0 space-y-6">
                {summary.documents === 0 && summary.agents === 0 && summary.workflows === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40">
                      <BarChart3 className="size-5 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No insights yet</p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        Usage insights appear once this hub has sources and is queried by agents or workflows.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <SampleDataNote />
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                    <h3 className="text-sm font-semibold">Query volume trend</h3>
                    <div role="img" aria-label="Bar chart showing query volume over time">
                      <HubMiniBarChart data={usage.queryTrend} className="mt-4" height={100} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold">Engagement</h3>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">{analytics.userEngagementScore}</p>
                    <p className="text-xs text-muted-foreground">Engagement score</p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-muted-foreground">Search success</dt><dd className="font-medium">{analytics.searchSuccessRate}%</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Response quality</dt><dd className="font-medium">{analytics.agentResponseQuality}/5</dd></div>
                    </dl>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold">Most referenced documents</h3>
                    <ul className="space-y-2">
                      {usage.mostReferencedDocuments.map((d) => (
                        <li key={d.id} className="flex justify-between gap-2 text-sm">
                          <span className="truncate">{d.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{d.usageCount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold">Knowledge consumption</h3>
                    <dl className="space-y-2 text-sm">
                      {Object.entries(analytics.knowledgeConsumption).map(([key, val]) => (
                        <div key={key} className="flex justify-between capitalize">
                          <dt className="text-muted-foreground">{key}</dt>
                          <dd className="font-medium tabular-nums">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold">Generation trend</h3>
                  <div role="img" aria-label="Bar chart showing generation trend over time">
                    <HubMiniBarChart data={usage.generationTrend} color="var(--chart-chart-4)" className="mt-4" />
                  </div>
                </div>
                  </>
                )}
              </TabsContent>

              {/* Timeline */}
              <TabsContent value="timeline" className="mt-0">
                <HubControlCenterTimeline
                  events={filteredTimeline}
                  totalCount={telemetry.timeline.length}
                  timelineFilter={timelineFilter}
                  onTimelineFilterChange={setTimelineFilter}
                  timelineSearch={timelineSearch}
                  onTimelineSearchChange={setTimelineSearch}
                />
              </TabsContent>
            </div>
          </Tabs>

        </div>
      </div>

      <ShareHubDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        hub={hub}
        members={hub.members ?? []}
        actor={auth?.user}
        onShare={(newMembers) => {
          const { added } = addHubMembers(hub.id, newMembers) ?? {};
          toast.success("Hub shared", {
            description: `${added ?? newMembers.length} ${(added ?? newMembers.length) === 1 ? "principal" : "principals"} now have access.`,
            action: { label: "View members", onClick: () => setActiveTab("members") },
          });
        }}
        onManageMembers={() => setActiveTab("members")}
      />
    </div>
  );
}
