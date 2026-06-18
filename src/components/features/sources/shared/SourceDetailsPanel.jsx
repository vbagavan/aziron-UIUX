import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkedKnowledgeHubSection } from "@/components/features/knowledge/LinkedKnowledgeHubSection";
import { SourceBadge } from "@/components/features/knowledge/SourceBadge";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { resolveSourceCategory } from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";
import {
  getSourceDetailRows,
  getSourceDetailsTitle,
  getSourceHubLinkEmptyMessage,
} from "@/lib/sourceListModel";

export function SourceDetailsPanel({
  record,
  detail,
  hubLinks = [],
  hubs = [],
  hubIcon,
  canEdit = true,
  canCreate = true,
  onNavigateToHub,
  onLinkToHub,
  onLinkHubFileToHub,
  onUnlinkFromHub,
  onRemoveHubFile,
  onCreateHub,
  footerNote,
  removeLabel,
  onRemove,
}) {
  const rows = getSourceDetailRows(record ?? {}, { detail });
  const category = resolveSourceCategory(record);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {getSourceDetailsTitle(record ?? {})}
        </p>
        <dl className="space-y-2 text-xs">
          {rows.map(({ label, value, isBadge }) => (
            <div key={label} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd
                className={cn(
                  "max-w-[58%] text-right font-medium text-foreground",
                  !isBadge && "truncate",
                )}
                title={typeof value === "string" ? value : undefined}
              >
                {isBadge ? <SourceBadge record={record} size="sm" /> : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mx-4 h-px bg-border" />

      <div className="px-4 pt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {category === "files" ? "Linked Knowledge Hubs" : "Knowledge Hub"}
        </p>
        {category !== "files" ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {KNOWLEDGE_TERMS.singleHubSourceRule}
          </p>
        ) : null}
      </div>

      <LinkedKnowledgeHubSection
        record={record}
        hubLinks={hubLinks}
        hubs={hubs}
        canEdit={canEdit}
        canCreate={canCreate}
        hubIcon={hubIcon}
        emptyMessage={getSourceHubLinkEmptyMessage(record)}
        onNavigateToHub={onNavigateToHub}
        onLinkToHub={onLinkToHub}
        onLinkHubFileToHub={onLinkHubFileToHub}
        onUnlinkFromHub={onUnlinkFromHub}
        onRemoveHubFile={onRemoveHubFile}
        onCreateHub={onCreateHub}
      />

      {footerNote ? (
        <p className="mx-4 mb-4 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {footerNote}
        </p>
      ) : null}

      {canEdit && onRemove ? (
        <div className="mt-auto border-t border-border px-4 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" />
            {removeLabel ?? "Remove source"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
