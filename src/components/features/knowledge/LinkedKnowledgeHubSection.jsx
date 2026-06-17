import { ChevronDown, ExternalLink, Plus, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeHubSearchPicker } from "@/components/common/KnowledgeHubSearchPicker";
import { isSingleHubSource } from "@/lib/sourceCategories";
import {
  getSourceHubLinkEmptyMessage,
  getSourceHubLinkPickerHint,
} from "@/lib/sourceListModel";

/**
 * Hub link list + picker for detail side panels (files, APIs, databases).
 */
export function LinkedKnowledgeHubSection({
  record,
  hubLinks = [],
  hubs = [],
  canEdit = true,
  canCreate = true,
  hubIcon: HubIcon,
  emptyMessage,
  onNavigateToHub,
  onLinkToHub,
  onLinkHubFileToHub,
  onUnlinkFromHub,
  onRemoveHubFile,
  onCreateHub,
}) {
  const singleHub = isSingleHubSource(record);
  const hubLinked = hubLinks.length > 0;
  const linkedHubIds = new Set(hubLinks.map((l) => Number(l.hubId)));
  const availableHubs = hubs.filter((h) => !linkedHubIds.has(Number(h.id)));
  const allHubsLinked = !singleHub && hubs.length > 0 && availableHubs.length === 0;
  const canLink =
    onLinkToHub ||
    (onLinkHubFileToHub && record?.hubId != null && record?.id != null);
  const showPicker = canLink && availableHubs.length > 0;
  const pickerLabel = singleHub && hubLinked ? "Change hub" : "Add to hub";
  const resolvedEmptyMessage = emptyMessage ?? getSourceHubLinkEmptyMessage(record);

  function handleSelectHub(hub) {
    if (record?.isLibraryDocument === true && record?.id && onLinkToHub) {
      onLinkToHub(record.id, hub.id);
      return;
    }
    if (onLinkHubFileToHub && record?.hubId != null && record?.id != null) {
      onLinkHubFileToHub(record.hubId, record.id, hub.id);
    }
  }

  function handleUnlink(link) {
    if (record?.isLibraryDocument === true && onUnlinkFromHub) {
      onUnlinkFromHub(record?.id, link.hubId);
      return;
    }
    if (onRemoveHubFile && record?.hubId != null && record?.id != null) {
      onRemoveHubFile(record.hubId, record.id);
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {singleHub ? "Knowledge Hub" : "Linked Knowledge Hubs"}
        </p>
        {showPicker ? (
          <KnowledgeHubSearchPicker
            hubs={availableHubs}
            align="end"
            emptyHint={getSourceHubLinkPickerHint(record, { allHubsLinked })}
            onSelect={handleSelectHub}
            onRequestCreate={canCreate ? onCreateHub : undefined}
            renderTrigger={({ toggle }) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-[11px]"
                onClick={toggle}
                disabled={!canEdit || allHubsLinked}
              >
                <Plus className="size-3" />
                {pickerLabel}
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            )}
          />
        ) : null}
      </div>

      {hubLinks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          {resolvedEmptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {hubLinks.map((link) => (
            <li
              key={`${link.hubId}-${link.hubFileId}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
            >
              <HubIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{link.hubName}</p>
                <p className="text-[10px] text-muted-foreground">Knowledge Hub</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {onNavigateToHub ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Open ${link.hubName}`}
                    title="Open hub"
                    onClick={() => onNavigateToHub(link.hubId)}
                  >
                    <ExternalLink className="size-3.5" />
                  </Button>
                ) : null}
                {(onUnlinkFromHub || onRemoveHubFile) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove from ${link.hubName}`}
                    title="Remove from hub"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnlink(link)}
                  >
                    <Unlink className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {singleHub && hubLinked ? (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          Each {record?.category === "apis" ? "API" : "database"} belongs to one Knowledge Hub.
          Use Change hub to move it.
        </p>
      ) : null}
    </div>
  );
}
