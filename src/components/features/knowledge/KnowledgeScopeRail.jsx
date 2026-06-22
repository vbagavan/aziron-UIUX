import { useMemo, useState } from "react";
import {
  BookOpen,
  LayoutGrid,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getHubDisplayName } from "@/lib/hubDisplay";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { getHubLinksForDocument } from "@/data/documentLibrary";
import {
  getSourceDragPayload,
  isSourceDragEvent,
} from "@/components/features/knowledge/knowledgeSourceDrag";

function useSourceCounts() {
  const { hubs, documents } = useKnowledgeHubs();

  return useMemo(() => {
    const byHub = {};
    let all = 0;

    for (const hub of hubs) {
      byHub[hub.id] = 0;
    }

    for (const doc of documents) {
      all += 1;
      const links = getHubLinksForDocument(doc.id, hubs, documents);
      const hubLinks = links.length > 0 ? links : doc.hubLinks ?? [];
      for (const link of hubLinks) {
        byHub[link.hubId] = (byHub[link.hubId] ?? 0) + 1;
      }
    }

    for (const hub of hubs) {
      const visible = (hub.userFiles ?? []).filter(
        (f) => !(hub.hiddenFileIds ?? []).includes(f.id),
      );
      for (const file of visible) {
        if (file.libraryDocumentId) continue;
        all += 1;
        byHub[hub.id] = (byHub[hub.id] ?? 0) + 1;
      }
    }

    return { all, byHub };
  }, [hubs, documents]);
}

export function KnowledgeScopeRail({
  scope = "all",
  onScopeChange,
  collapsed = false,
  onNewHub,
  dropEnabled = false,
  onLinkSourcesToHub,
  isSourceDragging = false,
  pulseHubId = null,
  className,
}) {
  const { hubs } = useKnowledgeHubs();
  const { all, byHub } = useSourceCounts();
  const [dragOverHubId, setDragOverHubId] = useState(null);

  function handleRailDragOver(e) {
    if (!dropEnabled || !isSourceDragEvent(e)) return;
    e.preventDefault();
  }

  function handleHubDragOver(e, hubId) {
    if (!dropEnabled || !isSourceDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragOverHubId(String(hubId));
  }

  function handleHubDragLeave(e, hubId) {
    if (String(dragOverHubId) !== String(hubId)) return;
    const related = e.relatedTarget;
    if (related && e.currentTarget.contains(related)) return;
    setDragOverHubId(null);
  }

  function handleHubDrop(e, hubId) {
    if (!dropEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverHubId(null);
    const ref = getSourceDragPayload(e.dataTransfer);
    if (ref && onLinkSourcesToHub) onLinkSourcesToHub(String(hubId), [ref]);
  }

  const showDropHint = dropEnabled && (isSourceDragging || dragOverHubId);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/20 transition-all duration-200",
        collapsed ? "w-[52px] px-1.5 py-3" : "w-[236px] px-3 py-4",
        className,
      )}
      aria-label="Knowledge scope"
      onDragOver={handleRailDragOver}
    >
      {showDropHint && !collapsed && (
        <div className="mb-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-2.5 py-2 text-[11.5px] font-medium text-primary">
          Drop on a hub to link
        </div>
      )}

      {!collapsed && (
        <div className="px-1.5 pb-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Library
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => onScopeChange("all")}
        title="All Sources"
        className={cn(
          "flex min-h-[36px] items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          scope === "all" && "bg-primary/10 font-semibold text-primary",
          collapsed && "justify-center px-2",
        )}
      >
        <LayoutGrid className="size-4 shrink-0" aria-hidden />
        {!collapsed && (
          <>
            <span className="min-w-0 truncate">All Sources</span>
            <span
              className={cn(
                "ml-auto text-[11.5px] font-medium tabular-nums",
                scope === "all" ? "text-primary" : "text-muted-foreground",
              )}
            >
              {all}
            </span>
          </>
        )}
      </button>

      {!collapsed && (
        <div className="px-1.5 pt-3.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Knowledge Hubs
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {hubs.map((hub) => {
          const active = String(scope) === String(hub.id);
          const count = byHub[hub.id] ?? 0;
          const displayName = getHubDisplayName(hub);
          const isDragTarget = dragOverHubId === String(hub.id);
          const isPulsing = pulseHubId != null && String(pulseHubId) === String(hub.id);

          return (
            <button
              key={hub.id}
              type="button"
              onClick={() => onScopeChange(String(hub.id))}
              title={
                collapsed
                  ? `${displayName} — drop to link`
                  : count === 0 && showDropHint
                    ? `${displayName} — drop sources here`
                    : displayName
              }
              onDragOver={(e) => handleHubDragOver(e, hub.id)}
              onDragLeave={(e) => handleHubDragLeave(e, hub.id)}
              onDrop={(e) => handleHubDrop(e, hub.id)}
              className={cn(
                "flex min-h-[36px] items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                active && "bg-primary/10 font-semibold text-primary",
                collapsed && "justify-center px-2",
                dropEnabled && isDragTarget && "border-primary border-dashed bg-primary/10 ring-2 ring-primary/30",
                isPulsing && "motion-safe:animate-pulse",
              )}
            >
              <BookOpen className="size-4 shrink-0" aria-hidden />
              {!collapsed && (
                <>
                  <span className="min-w-0 truncate">{displayName}</span>
                  <span
                    className={cn(
                      "ml-auto text-[11.5px] font-medium tabular-nums transition-all",
                      active ? "text-primary" : "text-muted-foreground",
                      isPulsing && "scale-110 font-bold text-primary",
                    )}
                  >
                    {count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {onNewHub && (
        <button
          type="button"
          onClick={onNewHub}
          title="New Hub"
          className={cn(
            "mt-1 flex min-h-[36px] items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
            collapsed && "justify-center px-2",
          )}
        >
          <Plus className="size-3.5 shrink-0" aria-hidden />
          {!collapsed && <span>New Hub</span>}
        </button>
      )}
    </aside>
  );
}
