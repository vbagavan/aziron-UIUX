import {
  Cloud,
  Download,
  FileText,
  LayoutGrid,
  List,
  Search,
  Database,
  ChevronDown,
  X,
  SlidersHorizontal,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";
import { CATEGORY_FILTER_OPTIONS } from "@/lib/sourceCategories";

const CATEGORY_ICONS = {
  all: LayoutGrid,
  files: FileText,
  dbs: Database,
  apis: MoreHorizontal,
};

const CATEGORY_OPTIONS = CATEGORY_FILTER_OPTIONS.map((opt) => ({
  ...opt,
  icon: CATEGORY_ICONS[opt.id],
}));

const PROVIDER_OPTIONS = [
  { id: "all", label: "Any source" },
  { id: "local", label: "Local", icon: Download },
  { id: "cloud", label: "Cloud", icon: Cloud },
];

function ToolbarDivider() {
  return <div className="h-6 w-px shrink-0 bg-border/60" aria-hidden />;
}

const STATUS_OPTIONS = [
  { id: "processing", label: "Processing" },
  { id: "failed", label: "Failed" },
  { id: "warning", label: "Warning" },
  { id: "linked", label: "Cloud linked" },
];

function SegmentedGroup({ options, value, onChange, ariaLabel }) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-[9px] bg-muted/60 p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-[30px] items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors",
              active
                ? "bg-background font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function KnowledgeWorkspaceToolbar({
  filterCategory,
  onFilterCategoryChange,
  filterSource,
  onFilterSourceChange,
  searchQuery,
  onSearchQueryChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  filterStatus,
  onFilterStatusChange,
  filterUnlinked,
  onFilterUnlinkedChange,
  unlinkedCount = 0,
  resultCount,
  totalCount,
  onOpenLinkingHelp,
  className,
}) {
  const isFiltered =
    resultCount != null && totalCount != null && resultCount !== totalCount;
  const countLabel = isFiltered
    ? `${resultCount} of ${totalCount}`
    : totalCount != null
      ? `${totalCount} sources`
      : null;

  const activeFilterCount =
    (filterStatus ? 1 : 0) + (filterUnlinked ? 1 : 0);

  const hasFilterMenu =
    Boolean(onFilterStatusChange) ||
    (unlinkedCount > 0 && Boolean(onFilterUnlinkedChange));

  function clearAllFilters() {
    onFilterStatusChange?.(null);
    onFilterUnlinkedChange?.(false);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <SegmentedGroup
        options={CATEGORY_OPTIONS}
        value={filterCategory}
        onChange={onFilterCategoryChange}
        ariaLabel="Source category"
      />

      {onFilterSourceChange ? (
        <>
          <ToolbarDivider />
          <SegmentedGroup
            options={PROVIDER_OPTIONS}
            value={filterSource ?? "all"}
            onChange={onFilterSourceChange}
            ariaLabel="Source origin"
          />
        </>
      ) : null}

      {hasFilterMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium",
              TOOLBAR_CONTROL_CLASS,
              activeFilterCount > 0
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border/60",
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            Filters
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
            <ChevronDown className="size-3 opacity-60" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {onFilterStatusChange ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={filterStatus ?? "all"}
                    onValueChange={(v) =>
                      onFilterStatusChange(v === "all" ? null : v)
                    }
                  >
                    <DropdownMenuRadioItem
                      value="all"
                      closeOnClick={false}
                      className="pr-2 pl-7"
                    >
                      All statuses
                    </DropdownMenuRadioItem>
                    {STATUS_OPTIONS.map((o) => (
                      <DropdownMenuRadioItem
                        key={o.id}
                        value={o.id}
                        closeOnClick={false}
                        className="pr-2 pl-7"
                      >
                        {o.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </>
            ) : null}

            {unlinkedCount > 0 && onFilterUnlinkedChange ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Links</DropdownMenuLabel>
                  <DropdownMenuItem
                    closeOnClick={false}
                    onClick={() => onFilterUnlinkedChange(!filterUnlinked)}
                    className="gap-2 pr-2 pl-7"
                  >
                    <span className="absolute left-1.5 flex size-3.5 items-center justify-center">
                      {filterUnlinked ? (
                        <Check className="size-3.5 text-primary" aria-hidden />
                      ) : null}
                    </span>
                    Unlinked only ({unlinkedCount})
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}

            {activeFilterCount > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearAllFilters}
                  className="justify-center text-xs text-muted-foreground"
                >
                  Clear all filters
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <div className="flex-1" />

          {countLabel ? (
        <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
          {isFiltered ? `${countLabel} sources` : countLabel}
        </span>
      ) : null}

      <ToolbarDivider />

      <InputGroup className={cn("w-full sm:w-[220px]", TOOLBAR_CONTROL_CLASS)}>
        <InputGroupAddon>
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search by name or hub..."
          aria-label="Search sources"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
        {searchQuery ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear search"
              onClick={() => onSearchQueryChange("")}
            >
              <X aria-hidden />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <div className="flex items-center rounded-lg border border-border/60 bg-background p-0.5">
        {[
          { id: "list", icon: List, label: "List view" },
          { id: "grid", icon: LayoutGrid, label: "Grid view" },
        ].map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            type="button"
            variant={viewMode === id ? "secondary" : "ghost"}
            size="icon-sm"
            title={label}
            aria-label={label}
            aria-pressed={viewMode === id}
            onClick={() => onViewModeChange(id)}
          >
            <Icon aria-hidden />
          </Button>
        ))}
      </div>
    </div>
  );
}
