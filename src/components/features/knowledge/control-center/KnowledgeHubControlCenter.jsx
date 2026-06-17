import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bot,
  ChevronDown,
  Eye,
  FileText,
  GitBranch,
  History,
  Pencil,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import {
  HubAssistantPanel,
  HUB_ASSISTANT_PANEL_TABS,
} from "@/components/features/knowledge/HubAssistantPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { CAPTION, PAGE_SUBTITLE } from "@/lib/typography";
import { PAGINATION_CONTROL_CLASS } from "@/lib/listToolbar";
import { summarizeHubAssets } from "@/data/knowledgeHubs";
import {
  HUB_ROLE_META,
  hubRoleCan,
  hubRoleLabel,
  resolveHubRole,
} from "@/lib/hubRoles";
import { HubKnowledgeTab } from "@/components/features/knowledge/control-center/HubKnowledgeTab";
import { HubMembersTab } from "@/components/features/knowledge/control-center/HubMembersTab";
import { ShareHubDialog } from "@/components/features/knowledge/ShareHubDialog";

const HUB_FILES_PAGE_SIZE = 20;

const ALL_HUB_TABS = [
  { id: "documents", label: KNOWLEDGE_TERMS.hubSourcesTab, icon: FileText },
  { id: "knowledge", label: "Knowledge", icon: Sparkles },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "workflows", label: "Workflows", icon: GitBranch },
  { id: "members", label: "Members", icon: Users },
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

export function KnowledgeHubControlCenter({
  hub,
  hubName,
  hubDescription,
  allFiles = [],
  canEdit: canEditProp = false,
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
  onBackToHubs,
  requestedTab = null,
  className,
}) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { auth } = useAuth();
  const { addHubMembers } = useKnowledgeHubs();
  const { agents } = useAgents();
  const { flows } = useFlowCatalog();
  const canViewInsights = can("knowledge.insights");

  // Effective per-hub role. `viewAsRole` lets Editors/Owner preview the hub as a
  // lower role to confirm the RBAC gates without leaving their account.
  const realHubRole = useMemo(() => resolveHubRole(hub, auth?.user), [hub, auth?.user]);
  // Keep the preview scoped to the current hub without a reset effect: a stored
  // hubId mismatch means we navigated away, so the preview falls back to null.
  const [viewAs, setViewAs] = useState({ hubId: null, role: null });
  const viewAsRole = viewAs.hubId === hub?.id ? viewAs.role : null;
  const setViewAsRole = (role) => setViewAs({ hubId: hub?.id, role });
  const hubRole = viewAsRole ?? realHubRole;
  const [shareOpen, setShareOpen] = useState(false);

  // File editing is the org-level permission AND the hub role allowing uploads.
  // Outside a preview these are equal, so live behaviour is unchanged.
  const canEdit = canEditProp && hubRoleCan(hubRole, "sources.upload");
  const canManageMembers = hubRoleCan(hubRole, "members.manage");
  const canShare = hubRoleCan(hubRole, "hub.share");

  const hubTabs = useMemo(
    () => ALL_HUB_TABS.filter((tab) => !tab.requiresInsights || canViewInsights),
    [canViewInsights],
  );
  const [activeTab, setActiveTab] = useState("documents");
  const [docSearch, setDocSearch] = useState("");
  const [docSourceFilter, setDocSourceFilter] = useState("all");
  const [docStatusFilter, setDocStatusFilter] = useState(null);
  const [docPage, setDocPage] = useState(1);
  const [selectedDocIds, setSelectedDocIds] = useState(() => new Set());
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [timelineSearch, setTimelineSearch] = useState("");
  const [panelTab, setPanelTab] = useState("ask");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

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
    setPanelTab("ask");
    setMobilePanelOpen(false);
  }, [hub?.id]);

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
  const previewing = viewAsRole && viewAsRole !== realHubRole;

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

  function openMobilePanel(tab) {
    setPanelTab(tab);
    setMobilePanelOpen(true);
  }

  const assistantPanelProps = {
    hubId: hub.id,
    hubName: getHubDisplayName(hubName),
    hubDescription,
    allFiles,
    metadata,
    summary,
    linkedAgents,
    linkedWorkflows,
    canEdit,
    tab: panelTab,
    onTabChange: setPanelTab,
    onOpenSource: onOpenLibraryFile,
    onEditHub,
  };

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
              <Badge
                variant="outline"
                className={cn("capitalize", STATUS_STYLES[metadata.status] ?? STATUS_STYLES.published)}
              >
                {metadata.status}
              </Badge>
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
              >
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="font-semibold tabular-nums text-foreground">{summary.documents}</span>
                <span className="text-muted-foreground">{summary.documents === 1 ? "document" : "documents"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("agents")}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
              >
                <Bot className="size-3.5 text-muted-foreground" />
                <span className="font-semibold tabular-nums text-foreground">{summary.agents}</span>
                <span className="text-muted-foreground">{summary.agents === 1 ? "agent" : "agents"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("workflows")}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
              >
                <GitBranch className="size-3.5 text-muted-foreground" />
                <span className="font-semibold tabular-nums text-foreground">{summary.workflows}</span>
                <span className="text-muted-foreground">{summary.workflows === 1 ? "workflow" : "workflows"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("knowledge")}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
              >
                <Sparkles className="size-3.5 text-muted-foreground" />
                <span className="font-semibold tabular-nums text-foreground">{assetSummary.active}</span>
                <span className="text-muted-foreground">{assetSummary.active === 1 ? "asset" : "assets"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("members")}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
              >
                <Users className="size-3.5 text-muted-foreground" />
                <span className="font-semibold tabular-nums text-foreground">{memberCount}</span>
                <span className="text-muted-foreground">{memberCount === 1 ? "member" : "members"}</span>
              </button>
              {summary.lastActivity ? (
                <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Active {summary.lastActivity}
                </span>
              ) : null}
            </div>

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
            {canManageMembers ? (
              <ViewAsMenu value={viewAsRole} realRole={realHubRole} onChange={setViewAsRole} />
            ) : null}
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
            {canEdit && onPublish && metadata.status === "draft" ? (
              <Button type="button" size="sm" className="gap-1.5" onClick={onPublish}>
                <Zap data-icon="inline-start" aria-hidden />
                Publish hub
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

      {previewing ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2 text-xs text-amber-800 dark:text-amber-300">
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            Previewing this hub as a <strong>{hubRoleLabel(hubRole)}</strong>. Actions are gated to that role.
          </span>
          <button
            type="button"
            onClick={() => setViewAsRole(null)}
            className="font-medium underline-offset-2 hover:underline"
          >
            Exit preview
          </button>
        </div>
      ) : null}

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
                  title={KNOWLEDGE_TERMS.hubSourcesTab}
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
                      onPageChange={setDocPage}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Knowledge (generated assets) */}
              <TabsContent value="knowledge" className="mt-0">
                <HubKnowledgeTab hub={hub} hubRole={hubRole} actor={auth?.user} />
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

          <div className="flex shrink-0 items-center gap-1 border-t border-border bg-background px-2 py-2 lg:hidden">
            {HUB_ASSISTANT_PANEL_TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => openMobilePanel(id)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                  panelTab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: hub assistant panel (desktop) */}
        <div className="hidden w-64 shrink-0 border-l border-border bg-muted/10 lg:flex lg:flex-col xl:w-72">
          <HubAssistantPanel key={hub.id} {...assistantPanelProps} />
        </div>
      </div>

      <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
        <SheetContent side="bottom" className="h-[min(88vh,720px)] gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-sm">Hub assistant</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <HubAssistantPanel key={`mobile-${hub.id}`} {...assistantPanelProps} />
          </div>
        </SheetContent>
      </Sheet>

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

const VIEW_AS_ROLES = ["owner", "editor", "contributor", "viewer"];

/** Editor/Owner-only control to preview the hub as a lower role (RBAC check). */
function ViewAsMenu({ value, realRole, onChange }) {
  const active = value ?? realRole;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}
      >
        <Eye className="size-3.5" />
        View as: {hubRoleLabel(active)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Preview permissions as</DropdownMenuLabel>
          {VIEW_AS_ROLES.map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => onChange(r === realRole ? null : r)}
            >
              {HUB_ROLE_META[r]?.label ?? r}
              {r === realRole ? (
                <span className="ml-auto text-[10px] text-muted-foreground">Your role</span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
