import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bot,
  FileText,
  GitBranch,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { FileSourceBadge } from "@/components/features/knowledge/FileSourceBadge";
import { FileStatusSummaryBar } from "@/components/features/knowledge/FileStatusSummaryBar";
import { HubFileSyncIcon, hubSyncStatusForRow } from "@/components/features/knowledge/HubFileSyncIcon";
import { resolveFileLifecycleStatus } from "@/lib/fileSyncStatus";
import { HubMiniBarChart } from "@/components/features/knowledge/control-center/HubControlCenterCharts";
import { HubControlCenterRelationships } from "@/components/features/knowledge/control-center/HubControlCenterRelationships";
import { HubControlCenterTimeline } from "@/components/features/knowledge/control-center/HubControlCenterTimeline";
import {
  filterTimelineEvents,
  getHubTelemetry,
} from "@/lib/hubTelemetry";
import { useAgents } from "@/context/AgentsContext";
import { useFlowCatalog } from "@/context/FlowCatalogContext";
import { paginateSlice } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

const HUB_FILES_PAGE_SIZE = 20;

const ALL_HUB_TABS = [
  { id: "documents", label: KNOWLEDGE_TERMS.documents, icon: FileText },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "workflows", label: "Workflows", icon: GitBranch },
  { id: "telemetry", label: KNOWLEDGE_TERMS.insightsTab, icon: BarChart3, requiresInsights: true },
  { id: "timeline", label: "Timeline", icon: History },
];

const STATUS_STYLES = {
  draft: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
  published: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  archived: "bg-muted text-muted-foreground border-border",
};

function AgentStatusBadge({ status }) {
  const variant =
    status === "active" ? "default" : status === "error" ? "destructive" : "secondary";
  return (
    <Badge variant={variant} className="text-[10px] capitalize">
      {status}
    </Badge>
  );
}

function FilesTablePagination({ page, totalPages, totalItems, onPageChange }) {
  if (totalItems === 0) return null;
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
      <p className="text-xs text-muted-foreground">
        {totalPages > 1 ? (
          <>
            {totalItems} documents · page {currentPage} of {totalPages}
          </>
        ) : (
          <>{totalItems} files</>
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
                  "h-7 cursor-pointer text-xs",
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
                  className="h-7 w-7 cursor-pointer text-xs"
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
                  "h-7 cursor-pointer text-xs",
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

export function KnowledgeHubControlCenter({
  hub,
  hubName,
  hubDescription,
  allFiles = [],
  canEdit = false,
  showDemoStatuses = false,
  onOpenSources,
  onOpenLibraryFile,
  onDeleteFile,
  onDownloadCloudFile,
  onEditHub,
  onPublish,
  pendingDownloadCount = 0,
  onDownloadAllPending,
  onBrowseDocumentsLibrary,
  className,
}) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { agents } = useAgents();
  const { flows } = useFlowCatalog();
  const hubTabs = useMemo(
    () => ALL_HUB_TABS.filter((tab) => !tab.requiresInsights || can("knowledge.insights")),
    [can],
  );
  const [activeTab, setActiveTab] = useState("documents");
  const [docSearch, setDocSearch] = useState("");
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
    if (docSourceFilter === "cloud") list = list.filter((d) => d.isCloud);
    if (docSourceFilter === "local") list = list.filter((d) => !d.isCloud);
    if (docSourceFilter === "library") list = list.filter((d) => d.libraryDocumentId);
    if (docStatusFilter) {
      list = list.filter((d) => {
        const status = resolveFileLifecycleStatus(d.raw, { includeDemoStatuses: showDemoStatuses });
        // "local" filter matches local files; "processing" matches both syncing + processing
        if (docStatusFilter === "local") return d.raw?.source === "user" || d.raw?.source === "upload";
        if (docStatusFilter === "processing") return status === "processing" || status === "syncing";
        return status === docStatusFilter;
      });
    }
    return list;
  }, [telemetry, docSearch, docSourceFilter, docStatusFilter, showDemoStatuses]);

  const docPagination = useMemo(
    () => paginateSlice(filteredDocs, docPage, HUB_FILES_PAGE_SIZE),
    [filteredDocs, docPage],
  );

  useEffect(() => {
    setDocPage(1);
  }, [docSearch, docSourceFilter, docStatusFilter, hub?.id]);

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
      <header className="shrink-0 border-b border-border bg-card/50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-foreground">
                {hubName.replace(/\s*\(Draft\)\s*$/i, "").trim()}
              </h1>
              {/\(Draft\)\s*$/i.test(hubName) && (
                <Badge variant="outline" className="shrink-0 border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300">
                  Draft
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn("capitalize", STATUS_STYLES[metadata.status] ?? STATUS_STYLES.published)}
              >
                {metadata.status}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {hubDescription || "No description — add one to help agents and workflows understand this hub."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Owner: {metadata.owner?.name}</span>
              <span>Created {metadata.createdAtLabel}</span>
              <span>Modified {metadata.updatedAtLabel}</span>
            </div>
            {metadata.tags?.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && onEditHub ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onEditHub}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            ) : null}
            {canEdit && onOpenSources ? (
              <Button type="button" size="sm" className="gap-1.5" onClick={onOpenSources}>
                <Plus data-icon="inline-start" aria-hidden />
                Add sources
              </Button>
            ) : null}
            {canEdit && onPublish ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Hub actions"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={onPublish}>
                      <Zap data-icon="inline-start" aria-hidden />
                      Publish hub
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: relationships (lg+) */}
        <div className="hidden w-56 shrink-0 overflow-y-auto border-r border-border bg-muted/10 p-4 xl:w-64">
          <HubControlCenterRelationships
            relationships={relationships}
            onNavigateDocuments={() => setActiveTab("documents")}
          />
        </div>

        {/* Center: tabs */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 overflow-x-auto border-b border-border px-4">
              <TabsList className="h-10 w-max min-w-full justify-start rounded-none bg-transparent p-0">
                {hubTabs.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
              {/* Documents */}
              <TabsContent value="documents" className="mt-0 space-y-4">
                <FileStatusSummaryBar
                  files={allFiles}
                  title={KNOWLEDGE_TERMS.documents}
                  includeDemoStatuses={showDemoStatuses}
                  activeFilter={docStatusFilter}
                  onFilter={setDocStatusFilter}
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
                      placeholder="Search documents…"
                      className="h-9 pl-8"
                    />
                  </div>
                  <Select value={docSourceFilter} onValueChange={setDocSourceFilter}>
                    <SelectTrigger className="h-9 w-[140px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="local">Local upload</SelectItem>
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
                  <div className="rounded-xl border border-dashed border-border py-12 text-center">
                    <FileText className="mx-auto size-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm font-medium">
                      {allFiles.length === 0 ? "No documents yet" : "No documents match"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {allFiles.length === 0
                        ? "Use Add sources above to upload or connect cloud storage."
                        : "Try adjusting search or filters."}
                    </p>
                    {allFiles.length === 0 && onBrowseDocumentsLibrary ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={onBrowseDocumentsLibrary}
                      >
                        Browse {KNOWLEDGE_TERMS.documents} library
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {canEdit ? <TableHead className="w-10" /> : null}
                          <TableHead className="w-10">
                            <span className="sr-only">Sync status</span>
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Modified</TableHead>
                          <TableHead className="text-right">Usage</TableHead>
                          <TableHead className="w-[80px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docPagination.items.map((doc) => (
                          <TableRow key={doc.id}>
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
                              <HubFileSyncIcon
                                status={hubSyncStatusForRow(doc.raw, { includeDemoStatuses: showDemoStatuses })}
                                fileName={doc.name}
                                canActivate={canEdit && doc.needsSync}
                                onActivate={onDownloadCloudFile ? () => onDownloadCloudFile(doc.raw) : undefined}
                              />
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                className="min-w-0 truncate text-left text-sm font-medium hover:underline"
                                onClick={() => onOpenLibraryFile?.(doc.id)}
                              >
                                {doc.name}
                              </button>
                            </TableCell>
                            <TableCell className="text-xs">{doc.type}</TableCell>
                            <TableCell>
                              <FileSourceBadge file={doc.raw} size="sm" />
                            </TableCell>
                            <TableCell className="text-xs">{doc.uploadedRelative}</TableCell>
                            <TableCell className="text-xs">{doc.modifiedRelative}</TableCell>
                            <TableCell className="text-right text-xs tabular-nums">{doc.usageCount}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                {canEdit && onDeleteFile ? (
                                  <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={() => onDeleteFile(doc.raw)}>
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
                      onPageChange={setDocPage}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Agents */}
              <TabsContent value="agents" className="mt-0">
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => navigate("/agents")}
                    >
                      <Bot className="size-3.5" />
                      Go to Agents
                    </Button>
                  </div>
                ) : (
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
                              <button type="button" className="font-medium hover:underline" onClick={() => navigate("/agents", { state: { highlightAgentId: agent.id } })}>
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
                )}
              </TabsContent>

              {/* Workflows */}
              <TabsContent value="workflows" className="mt-0">
                {linkedWorkflows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workflows reference this hub.</p>
                ) : (
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
                              <button type="button" className="font-medium hover:underline" onClick={() => navigate("/flows")}>
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
                )}
              </TabsContent>

              {/* Telemetry */}
              <TabsContent value="telemetry" className="mt-0 space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                    <h3 className="text-sm font-semibold">Query volume trend</h3>
                    <HubMiniBarChart data={usage.queryTrend} className="mt-4" height={100} />
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
                  <HubMiniBarChart data={usage.generationTrend} color="var(--chart-chart-4)" className="mt-4" />
                </div>
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

        {/* Right: insights rail — only shown on the Telemetry tab (2xl+) */}
        {activeTab === "telemetry" && (
          <div className="hidden w-64 shrink-0 overflow-y-auto border-l border-border bg-muted/10 p-4 2xl:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usage insights</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-border bg-card p-3 text-sm">
                <p className="text-[11px] text-muted-foreground">Hub accesses</p>
                <p className="text-xl font-semibold tabular-nums">{usage.accessCount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-sm">
                <p className="text-[11px] text-muted-foreground">Top document</p>
                <p className="truncate font-medium">{summary.mostUsedDocument}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-[11px] text-muted-foreground">Document access frequency</p>
                <ul className="space-y-1">
                  {analytics.documentAccessFrequency.slice(0, 4).map((d) => (
                    <li key={d.name} className="flex justify-between text-[11px]">
                      <span className="truncate">{d.name}</span>
                      <span className="tabular-nums">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
