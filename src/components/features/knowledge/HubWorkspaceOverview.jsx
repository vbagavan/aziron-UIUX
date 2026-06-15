import { Bot, CloudDownload, FileText, Layers, Pencil, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-muted/20 p-4 text-left transition-all",
        onClick && "cursor-pointer hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
        !onClick && "cursor-default",
      )}
    >
      <div className={cn("flex items-center gap-2 text-muted-foreground", accent)}>
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </button>
  );
}

function QuickActionCard({ icon: Icon, label, description, onClick, colorClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", colorClass)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function HubWorkspaceOverview({
  hubName,
  hubDescription,
  allFiles,
  linkedAgents,
  pendingDownloadCount,
  canEdit,
  onDownloadAllPending,
  isDownloadingAll,
  onOpenSources,
  notesCount = 0,
  studioCount = 0,
  onGoToNotes,
  onGoToStudio,
  className,
}) {
  const navigate = useNavigate();

  const uploadedFiles = allFiles.filter((f) => f.source !== "cloud" && !f.isSampleDemo);
  const cloudFiles = allFiles.filter((f) => f.source === "cloud");
  const cloudSaved = cloudFiles.filter(
    (f) => f.syncStatus === "stored" || f.localBlobId,
  ).length;

  return (
    <div className={cn("overflow-y-auto overscroll-y-contain h-full", className)}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">

        {/* Hub identity */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">{hubName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hubDescription || "No description yet. Add one in Hub settings to help agents understand this hub's purpose."}
          </p>
        </div>

        {/* Pending cloud files banner */}
        {pendingDownloadCount > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <CloudDownload className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {pendingDownloadCount} cloud file{pendingDownloadCount === 1 ? "" : "s"} not saved locally
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Save files to preview them and use them in chat with full fidelity.
                </p>
              </div>
            </div>
            {canEdit && onDownloadAllPending && (
              <Button type="button" size="sm" className="shrink-0 gap-1.5" disabled={isDownloadingAll} onClick={onDownloadAllPending}>
                <CloudDownload className={cn("size-3.5", isDownloadingAll && "animate-pulse")} />
                Save all
              </Button>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={FileText} label="Sources" value={allFiles.length} />
          <StatCard icon={Layers} label="Uploaded" value={uploadedFiles.length} />
          <StatCard
            icon={Bot}
            label="Linked agents"
            value={linkedAgents?.length ?? 0}
            className="col-span-2 sm:col-span-1"
          />
          <StatCard
            icon={Pencil}
            label="Notes"
            value={notesCount}
            onClick={onGoToNotes}
            accent="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            icon={Sparkles}
            label="Studio outputs"
            value={studioCount}
            onClick={onGoToStudio}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          {cloudFiles.length > 0 && (
            <StatCard icon={CloudDownload} label="Cloud saved" value={`${cloudSaved}/${cloudFiles.length}`} />
          )}
        </div>

        {/* Quick actions */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick actions
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <QuickActionCard
              icon={Pencil}
              label="Add a note"
              description="Capture ideas, observations, or questions about this hub."
              onClick={onGoToNotes}
              colorClass="bg-violet-500/10 text-violet-700 dark:text-violet-300"
            />
            <QuickActionCard
              icon={Sparkles}
              label="Generate in Studio"
              description="Create summaries, quizzes, flashcards, and reports."
              onClick={onGoToStudio}
              colorClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            />
            <QuickActionCard
              icon={Zap}
              label="Ask your hub"
              description="Chat with all sources in this hub."
              onClick={null}
              colorClass="bg-sky-500/10 text-sky-700 dark:text-sky-300"
            />
            {linkedAgents?.length > 0 && (
              <QuickActionCard
                icon={Bot}
                label="View linked agents"
                description={`${linkedAgents.length} agent${linkedAgents.length === 1 ? "" : "s"} use this hub for retrieval.`}
                onClick={() => navigate("/agents")}
                colorClass="bg-amber-500/10 text-amber-700 dark:text-amber-300"
              />
            )}
          </div>
        </div>

        {/* Linked agents list */}
        {linkedAgents?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Linked agents
            </p>
            <div className="flex flex-wrap gap-2">
              {linkedAgents.map((agent) => (
                <Button key={agent.id} type="button" variant="outline" size="sm"
                  className="h-8 gap-1.5 rounded-full text-xs"
                  onClick={() => navigate("/agents", { state: { highlightAgentId: agent.id } })}>
                  <Bot className="size-3" />
                  {agent.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!linkedAgents?.length && (
          <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            No agents linked yet. Attach this hub when creating or editing an agent.
          </p>
        )}

        {/* Mobile: browse sources */}
        <Button type="button" variant="secondary" className="lg:hidden" onClick={onOpenSources}>
          Browse sources
        </Button>
      </div>
    </div>
  );
}
