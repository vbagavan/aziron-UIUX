import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  Cloud,
  CloudDownload,
  FileText,
  GitBranch,
  History,
  Layers,
  Plus,
  Settings2,
  Trash2,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { cn } from "@/lib/utils";
import { getHubTelemetry } from "@/lib/hubTelemetry";
import { useAgents } from "@/context/AgentsContext";
import { useFlowCatalog } from "@/context/FlowCatalogContext";

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon ? <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function MetadataStat({ label, value, subValue }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      {subValue ? <p className="mt-0.5 text-xs text-muted-foreground">{subValue}</p> : null}
    </div>
  );
}

function AgentStatusBadge({ status }) {
  const variant =
    status === "active"
      ? "default"
      : status === "error"
        ? "destructive"
        : status === "disabled"
          ? "outline"
          : "secondary";
  return (
    <Badge variant={variant} className="text-[10px] capitalize">
      {status ?? "idle"}
    </Badge>
  );
}

function WorkflowStatusBadge({ status }) {
  const variant =
    status === "completed"
      ? "default"
      : status === "error"
        ? "destructive"
        : status === "inprogress"
          ? "secondary"
          : "outline";
  return (
    <Badge variant={variant} className="text-[10px] capitalize">
      {status ?? "idle"}
    </Badge>
  );
}

function TimelineIcon({ category }) {
  const iconClass = "size-3.5";
  if (category?.startsWith("cloud")) return <Cloud className={iconClass} />;
  if (category?.startsWith("agent")) return <Bot className={iconClass} />;
  if (category?.startsWith("workflow")) return <GitBranch className={iconClass} />;
  if (category === "metadata") return <Settings2 className={iconClass} />;
  if (category === "access") return <Activity className={iconClass} />;
  if (category?.startsWith("document")) return <FileText className={iconClass} />;
  return <Layers className={iconClass} />;
}

function UsageTrendChart({ trend }) {
  const max = Math.max(...(trend ?? []).map((t) => t.queries), 1);
  return (
    <div className="flex items-end gap-2 pt-3">
      {(trend ?? []).map((point) => (
        <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-primary/70"
            style={{ height: `${Math.max(8, (point.queries / max) * 64)}px` }}
            title={`${point.queries} queries`}
          />
          <span className="truncate text-[9px] text-muted-foreground">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HubDetailsPanel({
  hub,
  allFiles = [],
  flows: flowsProp,
  canEdit = false,
  onAddFiles,
  onOpenSources,
  onDeleteFile,
  onDownloadCloudFile,
  className,
}) {
  const navigate = useNavigate();
  const { agents } = useAgents();
  const { flows: flowsFromCtx } = useFlowCatalog();
  const flows = flowsProp ?? flowsFromCtx;

  const telemetry = useMemo(
    () => getHubTelemetry(hub, { agents, flows, allFiles }),
    [hub, agents, flows, allFiles],
  );

  if (!hub || !telemetry) return null;

  const { metadata, counts, files, linkedAgents, linkedWorkflows, usage, timeline } = telemetry;

  return (
    <div className={cn("overflow-y-auto overscroll-y-contain h-full", className)}>
      <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Knowledge Hub details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Single source of truth for content, usage, and lifecycle history.
          </p>
        </div>

        {/* ── Metadata panel ── */}
        <section>
          <SectionHeader
            icon={User}
            title="Metadata"
            description="Owner, timestamps, and aggregate counts for this hub."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetadataStat
              label="Owner / author"
              value={metadata.owner?.name ?? "—"}
              subValue={metadata.owner?.email}
            />
            <MetadataStat label="Created" value={metadata.createdAtLabel} />
            <MetadataStat label="Last modified" value={metadata.updatedAtLabel} />
            <MetadataStat
              label="Last activity"
              value={metadata.lastActivityLabel}
              subValue={metadata.lastActivityRelative}
            />
            <MetadataStat label="Linked documents" value={counts.documents} subValue={`${counts.libraryLinked} in document library`} />
            <MetadataStat label="Attached agents" value={counts.agents} />
            <MetadataStat label="Attached workflows" value={counts.workflows} />
            <MetadataStat
              label="Last accessed"
              value={metadata.lastAccessLabel}
              subValue={metadata.lastAccessRelative}
            />
            <MetadataStat label="Visibility" value={metadata.visibility} subValue={metadata.provider} />
          </div>
        </section>

        {/* ── Linked documents ── */}
        <section>
          <SectionHeader
            icon={FileText}
            title={`Linked documents & files (${counts.documents})`}
            description="All sources associated with this Knowledge Hub."
            action={
              canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onOpenSources}>
                    <Layers className="size-3.5" />
                    Manage sources
                  </Button>
                  <Button type="button" size="sm" className="gap-1.5" onClick={onAddFiles}>
                    <Plus className="size-3.5" />
                    Add files
                  </Button>
                </div>
              ) : null
            }
          />

          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <Upload className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-foreground">{KNOWLEDGE_TERMS.hubSourcesEmptyTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {KNOWLEDGE_TERMS.hubSourcesEmptyDescription}
              </p>
              {canEdit && onAddFiles ? (
                <Button type="button" size="sm" className="mt-4 gap-1.5" onClick={onAddFiles}>
                  <Plus className="size-3.5" />
                  Add files
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[90px]">Type</TableHead>
                    <TableHead className="w-[110px]">Source</TableHead>
                    <TableHead className="w-[130px]">Uploaded</TableHead>
                    {canEdit ? <TableHead className="w-[100px] text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {file.libraryDocumentId ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Library
                            </Badge>
                          ) : null}
                          {file.needsSync ? (
                            <Badge variant="outline" className="text-[10px]">
                              Cloud ref
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{file.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{file.source}</TableCell>
                      <TableCell className="text-xs text-muted-foreground" title={file.uploadedAtLabel}>
                        {file.uploadedRelative}
                      </TableCell>
                      {canEdit ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {file.needsSync && onDownloadCloudFile ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="Sync cloud file"
                                onClick={() => onDownloadCloudFile(allFiles.find((f) => f.id === file.id))}
                              >
                                <CloudDownload className="size-3.5" />
                              </Button>
                            ) : null}
                            {onDeleteFile ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="Remove from hub"
                                className="text-destructive hover:text-destructive"
                                onClick={() => onDeleteFile(allFiles.find((f) => f.id === file.id))}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* ── Telemetry & usage ── */}
        <section>
          <SectionHeader
            icon={TrendingUp}
            title="Telemetry & usage"
            description="How this Knowledge Hub is consumed across the platform."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 lg:col-span-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Usage metrics
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{usage.accessCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total hub accesses</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Agent queries</span>
                  <span className="font-medium tabular-nums">{usage.totalAgentQueries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Workflow runs</span>
                  <span className="font-medium tabular-nums">{usage.totalWorkflowRuns.toLocaleString()}</span>
                </div>
              </div>
              <UsageTrendChart trend={usage.trend} />
              <p className="mt-4 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {usage.recentSummary}
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-2">
              {/* Attached agents */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bot className="size-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Attached agents</p>
                  </div>
                  <Badge variant="outline">{linkedAgents.length}</Badge>
                </div>
                {linkedAgents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No agents linked to this hub.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {linkedAgents.map((agent) => (
                      <li
                        key={agent.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="truncate text-sm font-medium text-foreground hover:underline"
                            onClick={() => navigate("/agents", { state: { highlightAgentId: agent.id } })}
                          >
                            {agent.name}
                          </button>
                          <p className="text-[11px] text-muted-foreground">
                            Last used {agent.lastUsedAt}
                          </p>
                        </div>
                        <AgentStatusBadge status={agent.status} />
                      </li>
                    ))}
                  </ul>
                )}
                {usage.mostActiveAgents.length > 0 ? (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Most active:{" "}
                    {usage.mostActiveAgents.map((a) => a.name).join(", ")}
                  </p>
                ) : null}
              </div>

              {/* Attached workflows */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="size-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Attached workflows</p>
                  </div>
                  <Badge variant="outline">{linkedWorkflows.length}</Badge>
                </div>
                {linkedWorkflows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workflows reference this hub.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {linkedWorkflows.map((flow) => (
                      <li
                        key={flow.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="truncate text-sm font-medium text-foreground hover:underline"
                            onClick={() => navigate("/flows")}
                          >
                            {flow.name}
                            <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                              {flow.version}
                            </span>
                          </button>
                          <p className="text-[11px] text-muted-foreground">
                            {flow.runs.toLocaleString()} runs · Last executed {flow.lastExecutedAt}
                          </p>
                        </div>
                        <WorkflowStatusBadge status={flow.status} />
                      </li>
                    ))}
                  </ul>
                )}
                {usage.mostActiveWorkflows.length > 0 ? (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Most active:{" "}
                    {usage.mostActiveWorkflows.map((f) => f.name).join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section>
          <SectionHeader
            icon={History}
            title="Knowledge Hub timeline"
            description="Complete audit trail of hub lifecycle events."
          />
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline events yet.</p>
          ) : (
            <ol className="relative border-l border-border pl-6">
              {timeline.map((event, index) => (
                <li key={event.id} className={cn("relative pb-6", index === timeline.length - 1 && "pb-0")}>
                  <span className="absolute -left-[1.35rem] flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                    <TimelineIcon category={event.category} />
                  </span>
                  <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{event.label}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{event.relative}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/80">{event.atLabel}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
