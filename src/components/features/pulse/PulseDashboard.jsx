import { useState } from "react";
import { Plus, Edit2, Copy, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function formatDate(date) {
  const d = new Date(date);
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "Just now";
  if (sec < 3600) return rtf.format(-Math.floor(sec / 60), "minute");
  if (sec < 86400) return rtf.format(-Math.floor(sec / 3600), "hour");
  if (sec < 86400 * 7) return rtf.format(-Math.floor(sec / 86400), "day");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PulseDashboard({ artifacts = [], onCreateNew, onEdit, onDuplicate, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(null);

  const artifactToDelete = pendingDelete != null ? artifacts.find((a) => a.id === pendingDelete) : null;

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] dark:bg-[#0f172a]">
      <div className="flex flex-col gap-4 px-6 py-4">
        {/* Page title + primary action — matches Flows / Usage list pages */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold leading-8 tracking-[-0.6px] text-[#0f172a] dark:text-[#f1f5f9]">
              Pulse
            </h1>
            <p className="text-sm leading-5 text-[#64748b] dark:text-[#94a3b8]">
              Generate, iterate, and manage UI designs with AI — sits alongside agents, flows, and chat in this workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-[6px] bg-[#2563eb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            Create New
          </button>
        </div>

        {/* Grid */}
        {artifacts.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="size-16 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 20H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2h-2" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#0f172a] dark:text-[#f1f5f9]">No UIs created yet</h3>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                Start with a description or a curated template. Previews are saved as prompts plus layout type so you can reopen them from this list.
              </p>
              <button
                type="button"
                onClick={onCreateNew}
                className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#2563eb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                Create your first UI
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artifacts.map((artifact) => {
              const titleId = `pulse-artifact-title-${artifact.id}`;
              return (
                <article
                  key={artifact.id}
                  aria-labelledby={titleId}
                  className="group relative flex flex-col overflow-hidden rounded-[8px] border border-[#e2e8f0] bg-white motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none hover:border-[#cbd5e1] hover:shadow-lg dark:border-[#334155] dark:bg-[#1e293b] dark:hover:border-[#475569]"
                >
                  {/* Thumbnail — opens editor */}
                  <button
                    type="button"
                    onClick={() => onEdit(artifact.id)}
                    className="relative block w-full text-left aspect-video bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden rounded-none border-0 p-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    aria-label={`Open ${artifact.title}`}
                  >
                    {artifact.thumbnail ? (
                      <img
                        src={artifact.thumbnail}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-stretch justify-between bg-slate-200/50 dark:bg-slate-800/50 p-4">
                        {artifact.prompt ? (
                          <p className="line-clamp-3 text-left text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {artifact.prompt}
                          </p>
                        ) : (
                          <div className="flex flex-1 items-center justify-center">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 id={titleId} className="mb-2 min-h-0">
                      <button
                        type="button"
                        onClick={() => onEdit(artifact.id)}
                        className="w-full text-left font-semibold text-foreground line-clamp-2 rounded-sm outline-none hover:text-blue-600 dark:hover:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                      >
                        {artifact.title}
                      </button>
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                      <Clock className="w-3 h-3 shrink-0" aria-hidden />
                      <time dateTime={new Date(artifact.lastEdited).toISOString()}>
                        {formatDate(artifact.lastEdited)}
                      </time>
                    </div>

                    {/* Actions — always visible for touch / keyboard / screen readers */}
                    <div className="mt-auto flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1.5"
                        onClick={() => onEdit(artifact.id)}
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1.5"
                        onClick={() => onDuplicate(artifact.id)}
                      >
                        <Copy className="w-3 h-3" />
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 shrink-0 px-2.5"
                        aria-label={`Delete ${artifact.title}`}
                        onClick={() => setPendingDelete(artifact.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {artifactToDelete && (
        <ConfirmDialog
          title="Delete this UI?"
          message={`“${artifactToDelete.title}” will be removed. This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(artifactToDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
