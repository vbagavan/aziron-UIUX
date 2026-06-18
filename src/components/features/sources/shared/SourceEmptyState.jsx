import { Database, FileText, LayoutGrid, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KNOWLEDGE_TERMS, getSourceEmptyStateCopy } from "@/lib/knowledgeTerminology";

const CATEGORY_ICONS = {
  all: LayoutGrid,
  files: FileText,
  dbs: Database,
  apis: Zap,
};

export function SourceEmptyState({
  category = "all",
  variant = "library",
  canEdit = false,
  onAddSources,
  onBrowseLibrary,
}) {
  const copy = getSourceEmptyStateCopy(category, { variant });
  const Icon = CATEGORY_ICONS[category] ?? LayoutGrid;

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40">
        <Icon className="size-5 text-muted-foreground/60" aria-hidden />
      </div>
      <div className="max-w-md space-y-1">
        <p className="text-sm font-medium text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">{copy.description}</p>
      </div>
      {canEdit ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onAddSources ? (
            <Button type="button" size="sm" className="gap-1.5" onClick={onAddSources}>
              <Plus data-icon="inline-start" aria-hidden />
              {KNOWLEDGE_TERMS.addSources}
            </Button>
          ) : null}
          {onBrowseLibrary ? (
            <Button type="button" size="sm" variant="outline" onClick={onBrowseLibrary}>
              Browse {KNOWLEDGE_TERMS.documents}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
