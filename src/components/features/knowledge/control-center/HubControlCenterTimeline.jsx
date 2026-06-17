import { useMemo } from "react";
import {
  Activity,
  Bot,
  Cloud,
  FileText,
  GitBranch,
  History,
  Layers,
  Search,
  Settings2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HUB_TIMELINE_FILTERS } from "@/lib/hubTelemetry";
import { cn } from "@/lib/utils";

const CATEGORY_META = {
  hub: {
    label: "Hub",
    badgeVariant: "secondary",
    iconClass: "text-muted-foreground",
    ringClass: "border-border bg-muted/30",
    Icon: Layers,
  },
  document: {
    label: "File",
    badgeVariant: "outline",
    iconClass: "text-primary",
    ringClass: "border-primary/20 bg-primary/5",
    Icon: FileText,
  },
  cloud: {
    label: "Cloud",
    badgeVariant: "outline",
    iconClass: "text-primary",
    ringClass: "border-primary/20 bg-primary/5",
    Icon: Cloud,
  },
  agent: {
    label: "Agent",
    badgeVariant: "secondary",
    iconClass: "text-muted-foreground",
    ringClass: "border-border bg-muted/30",
    Icon: Bot,
  },
  workflow: {
    label: "Workflow",
    badgeVariant: "secondary",
    iconClass: "text-muted-foreground",
    ringClass: "border-border bg-muted/30",
    Icon: GitBranch,
  },
  knowledge: {
    label: "Knowledge",
    badgeVariant: "outline",
    iconClass: "text-primary",
    ringClass: "border-primary/20 bg-primary/5",
    Icon: Sparkles,
  },
  members: {
    label: "Members",
    badgeVariant: "outline",
    iconClass: "text-primary",
    ringClass: "border-primary/20 bg-primary/5",
    Icon: Users,
  },
  metadata: {
    label: "Metadata",
    badgeVariant: "outline",
    iconClass: "text-muted-foreground",
    ringClass: "border-border bg-muted/30",
    Icon: Settings2,
  },
  access: {
    label: "Activity",
    badgeVariant: "default",
    iconClass: "text-primary",
    ringClass: "border-primary/30 bg-primary/5",
    Icon: Activity,
  },
  system: {
    label: "System",
    badgeVariant: "outline",
    iconClass: "text-muted-foreground",
    ringClass: "border-border bg-muted/30",
    Icon: Zap,
  },
};

function resolveCategoryMeta(category) {
  if (!category) return CATEGORY_META.hub;
  if (category.startsWith("document")) return CATEGORY_META.document;
  if (category.startsWith("cloud")) return CATEGORY_META.cloud;
  if (category.startsWith("agent")) return CATEGORY_META.agent;
  if (category.startsWith("workflow")) return CATEGORY_META.workflow;
  if (category.startsWith("asset")) return CATEGORY_META.knowledge;
  if (category.startsWith("member") || category === "share") return CATEGORY_META.members;
  if (category === "metadata") return CATEGORY_META.metadata;
  if (category === "access" || category === "interaction") return CATEGORY_META.access;
  if (category === "system") return CATEGORY_META.system;
  if (category === "hub") return CATEGORY_META.hub;
  return CATEGORY_META.hub;
}

function formatGroupLabel(date) {
  if (!date || Number.isNaN(date.getTime())) return "Unknown date";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function groupEventsByDate(events) {
  const groups = [];
  let currentKey = null;

  for (const event of events) {
    const date = event.at instanceof Date ? event.at : null;
    const key = date?.toDateString() ?? "unknown";

    if (key !== currentKey) {
      groups.push({
        key,
        label: formatGroupLabel(date),
        events: [],
      });
      currentKey = key;
    }

    groups[groups.length - 1].events.push(event);
  }

  return groups;
}

function TimelineEventRow({ event, isLast }) {
  const meta = resolveCategoryMeta(event.category);
  const { Icon } = meta;

  return (
    <li className="flex gap-3">
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full border",
            meta.ringClass,
          )}
        >
          <Icon className={cn("size-3.5", meta.iconClass)} aria-hidden />
        </div>
        {!isLast ? <div className="my-1 w-px flex-1 bg-border/80" /> : null}
      </div>

      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-5")}>
        <div className="rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant={meta.badgeVariant} className="text-[10px] font-medium">
                {meta.label}
              </Badge>
              <p className="text-sm font-medium text-foreground">{event.label}</p>
            </div>
            <time
              dateTime={event.at instanceof Date ? event.at.toISOString() : undefined}
              className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
              title={event.atLabel}
            >
              {event.relative}
            </time>
          </div>
          {event.detail ? (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
          ) : null}
          <p className="mt-1 text-[10px] text-muted-foreground/70">{event.atLabel}</p>
        </div>
      </div>
    </li>
  );
}

export function HubControlCenterTimeline({
  events = [],
  timelineFilter,
  onTimelineFilterChange,
  timelineSearch,
  onTimelineSearchChange,
  totalCount,
}) {
  const groups = useMemo(() => groupEventsByDate(events), [events]);
  const hasFilters = timelineFilter !== "all" || timelineSearch.trim().length > 0;

  function clearFilters() {
    onTimelineFilterChange("all");
    onTimelineSearchChange("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={timelineSearch}
            onChange={(e) => onTimelineSearchChange(e.target.value)}
            placeholder="Search timeline…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={timelineFilter} onValueChange={onTimelineFilterChange}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HUB_TIMELINE_FILTERS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{events.length}</span>
            {totalCount != null ? ` of ${totalCount}` : ""} events
          </p>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : null}

      {events.length === 0 ? (
        <Empty className="rounded-xl border border-dashed border-border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>No timeline events</EmptyTitle>
            <EmptyDescription>
              {hasFilters
                ? "Nothing matches your search or filter. Try broadening your criteria."
                : "Activity will appear here as you upload files, sync cloud sources, and use this hub."}
            </EmptyDescription>
          </EmptyHeader>
          {hasFilters ? (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ol className="flex flex-col">
                {group.events.map((event, index) => (
                  <TimelineEventRow
                    key={event.id}
                    event={event}
                    isLast={index === group.events.length - 1}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
