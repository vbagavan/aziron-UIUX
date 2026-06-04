import { CheckCircle2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KNOWLEDGE_HUB_CLOUD_PROVIDERS } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import { cn } from "@/lib/utils";
import {
  CLOUD_PROVIDER_LABELS,
  getHubFileStatus,
} from "@/data/knowledgeHubs";

const PROVIDER_ACCENT = {
  onedrive: "bg-sky-500/10 border-sky-500/20",
  "google-drive": "bg-emerald-500/10 border-emerald-500/20",
  dropbox: "bg-blue-500/10 border-blue-500/20",
  box: "bg-indigo-500/10 border-indigo-500/20",
};

const PROVIDER_LOGO = Object.fromEntries(
  KNOWLEDGE_HUB_CLOUD_PROVIDERS.map((p) => [p.id, p.logo]),
);

function connectionLogo(provider) {
  return PROVIDER_LOGO[provider] ?? null;
}

function filesForConnection(allFiles, conn) {
  return allFiles.filter(
    (row) =>
      row.source === "cloud" &&
      (row.connectionId === conn.id ||
        (row.cloudProvider === conn.provider && !row.connectionId)),
  );
}

function connectionStats(allFiles, conn) {
  const rows = filesForConnection(allFiles, conn);
  const saved = rows.filter((r) => getHubFileStatus(r) === "success").length;
  const linked = rows.filter((r) => getHubFileStatus(r) === "linked").length;
  const total = rows.length;
  const syncPct = total > 0 ? Math.round((saved / total) * 100) : 0;
  return { total, saved, linked, syncPct };
}

function fileTypeTags(rows, max = 3) {
  const types = [...new Set(rows.map((r) => r.type).filter(Boolean))];
  return types.slice(0, max);
}

/**
 * Reference-style connected cloud sources for a Knowledge Hub detail page.
 */
export function HubCloudConnectionsSection({
  connections,
  allFiles,
  canEdit,
  onAddFiles,
}) {
  if (!connections?.length) return null;

  return (
    <section aria-labelledby="hub-cloud-sources-heading">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="hub-cloud-sources-heading" className="text-base font-semibold text-foreground">
            Connected sources
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Linked drives that feed this hub&apos;s file inventory.
          </p>
        </div>
        {canEdit && connections.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            Pick a source below to add more files.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {connections.map((conn) => {
          const logo = connectionLogo(conn.provider);
          const label = CLOUD_PROVIDER_LABELS[conn.provider] ?? conn.provider;
          const rows = filesForConnection(allFiles, conn);
          const { total, saved, linked, syncPct } = connectionStats(allFiles, conn);
          const tags = fileTypeTags(rows);
          const accent = PROVIDER_ACCENT[conn.provider] ?? "bg-muted/40 border-border";

          return (
            <article
              key={conn.id ?? `${conn.provider}-${conn.name}`}
              className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                    accent,
                  )}
                >
                  {logo ? (
                    <img src={logo} alt="" className="size-7 object-contain" draggable={false} />
                  ) : null}
                </div>
                <Badge
                  variant="outline"
                  className="h-6 shrink-0 gap-1 border-success/30 bg-success/10 text-success"
                >
                  <CheckCircle2 className="size-3" aria-hidden />
                  Connected
                </Badge>
              </div>

              <div className="mt-3 min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">{conn.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {label}
                  {conn.connectedBy ? ` · ${conn.connectedBy}` : ""}
                  {conn.connectedAt ? ` · ${conn.connectedAt}` : ""}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-semibold">
                  {label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {total} file{total === 1 ? "" : "s"}
                  {total > 0 ? ` · Updated recently` : ""}
                </span>
              </div>

              {total > 0 ? (
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground">Saved to hub</span>
                    <span className="tabular-nums text-muted-foreground">{syncPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${syncPct}%` }}
                      role="progressbar"
                      aria-valuenow={syncPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${saved} of ${total} files saved locally`}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {saved} saved · {linked} linked from cloud
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  No files linked yet from this source.
                </p>
              )}

              {tags.length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    File types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((type) => (
                      <span
                        key={type}
                        className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full gap-1.5"
                  onClick={() => onAddFiles?.(conn)}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add files from {label}
                </Button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
