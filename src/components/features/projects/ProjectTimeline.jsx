import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  FileText,
  Pencil,
  Sparkles,
  UserRound,
  FilePlus,
  Database,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROJECT_DOCUMENT_TYPES, TIMELINE_CHANGE_TYPES } from "@/data/projectDocuments";
import {
  findDocumentForTimelineEntry,
  timelineEntryMatchesDocument,
} from "@/lib/projectDocumentLinks";
import {
  TIMELINE_ENTRY_ICON_CLASS,
  timelineChangeBadgeClass,
  timelineEntryIconWrapperClass,
} from "@/lib/projectTimelineStyles";
import { cn } from "@/lib/utils";

function formatTimelineDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function EntryIcon({ changeType }) {
  const wrapperClass = timelineEntryIconWrapperClass(changeType);
  const iconClass = TIMELINE_ENTRY_ICON_CLASS;

  const Icon =
    changeType === "created_manual"
      ? UserRound
      : changeType === "document_uploaded"
        ? FilePlus
        : changeType === "field_updated"
          ? Pencil
          : changeType === "created" || changeType === "delta_applied"
            ? Sparkles
            : FileText;

  return (
    <span className={wrapperClass}>
      <Icon className={iconClass} aria-hidden />
    </span>
  );
}

function changeTypeLabel(changeType) {
  const map = {
    created: "AI created",
    created_manual: "Manual create",
    delta_applied: "AI updates applied",
    document_uploaded: "Doc uploaded",
    field_updated: "Fields updated",
  };
  return map[changeType] ?? (changeType?.replace(/_/g, " ") ?? "");
}

function TimelineEntry({
  entry,
  documents,
  highlighted,
  onViewMetadata,
  onViewDocument,
}) {
  const [expanded, setExpanded] = useState(
    highlighted || (entry.changes?.length > 0 && entry.changes.length <= 6),
  );
  const rowRef = useRef(null);
  const hasChanges = entry.changes?.length > 0;
  const isDelta = entry.changeType === "delta_applied";
  const linkedDoc = findDocumentForTimelineEntry(documents, entry);

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlighted]);

  return (
    <li
      ref={rowRef}
      className={cn(
        "relative flex gap-4 pb-8 last:pb-0",
        highlighted && "rounded-lg ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
      )}
    >
      <EntryIcon changeType={entry.changeType} />
      <div className="ml-8 min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{entry.summary}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatTimelineDate(entry.timestamp)} · {entry.userName}
              {entry.version ? ` · v${entry.version}` : ""}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-xs", timelineChangeBadgeClass(entry.changeType))}
          >
            {changeTypeLabel(entry.changeType)}
          </Badge>
        </div>

        {entry.documentRef ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3.5 shrink-0" aria-hidden />
              <span className="font-medium text-foreground">{entry.documentRef.type}</span>
              <span className="truncate">— {entry.documentRef.fileName}</span>
            </p>
            {linkedDoc && onViewDocument ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onViewDocument(linkedDoc)}
              >
                <ExternalLink data-icon="inline-start" />
                View document
              </Button>
            ) : null}
          </div>
        ) : null}

        {isDelta && hasChanges && !expanded ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.changes.slice(0, 4).map((c) => (
              <Badge key={c.field} variant="outline" className="text-[11px] font-normal">
                {c.label}: {c.previousValue} → {c.newValue}
              </Badge>
            ))}
            {entry.changes.length > 4 ? (
              <span className="text-[11px] text-muted-foreground">
                +{entry.changes.length - 4} more
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {hasChanges ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronDown data-icon="inline-start" /> : <ChevronRight data-icon="inline-start" />}
              {isDelta ? "View accepted changes" : "View changes"} ({entry.changes.length})
            </Button>
          ) : null}
          {hasChanges && onViewMetadata ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => onViewMetadata(entry)}
            >
              <Database data-icon="inline-start" />
              View project details
            </Button>
          ) : null}
        </div>

        {hasChanges && expanded ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 text-xs">Field</TableHead>
                  <TableHead className="h-8 text-xs">Previous</TableHead>
                  <TableHead className="h-8 text-xs">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.changes.map((c) => (
                  <TableRow key={c.field}>
                    <TableCell className="py-2 text-xs font-medium">{c.label}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {c.previousValue}
                    </TableCell>
                    <TableCell className="py-2 text-xs">{c.newValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * @param {{
 *   projectId: string,
 *   documents?: object[],
 *   entries: import('@/store/projectsStore').TimelineEntry[],
 *   highlightEntryId?: string | null,
 *   filterDocumentId?: string | null,
 *   onViewMetadata?: (entry: object) => void,
 *   onViewDocument?: (doc: object) => void,
 *   onClearDocumentFilter?: () => void,
 * }} props
 */
export function ProjectTimeline({
  projectId,
  documents = [],
  entries,
  highlightEntryId = null,
  filterDocumentId = null,
  onViewMetadata,
  onViewDocument,
  onClearDocumentFilter,
}) {
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [docType, setDocType] = useState("all");
  const [changeType, setChangeType] = useState("all");

  const filterDoc = useMemo(
    () => (filterDocumentId ? documents.find((d) => d.id === filterDocumentId) : null),
    [filterDocumentId, documents],
  );

  useEffect(() => {
    if (filterDoc) {
      setDocType(filterDoc.type);
    }
  }, [filterDoc]);

  const users = useMemo(
    () => [...new Set(entries.map((e) => e.userName))].sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (e.projectId !== projectId) return false;
      if (filterDocumentId && filterDoc && !timelineEntryMatchesDocument(e, filterDoc)) {
        return false;
      }
      if (userFilter && e.userName !== userFilter) return false;
      if (changeType !== "all" && e.changeType !== changeType) return false;
      if (docType !== "all" && e.documentRef?.type !== docType) return false;
      if (dateFrom) {
        const from = Date.parse(dateFrom);
        if (!Number.isNaN(from) && Date.parse(e.timestamp) < from) return false;
      }
      return true;
    });
  }, [entries, projectId, userFilter, changeType, docType, dateFrom, filterDocumentId, filterDoc]);

  const showDocFilterBanner = Boolean(filterDocumentId && filterDoc);

  return (
    <div className="flex flex-col gap-4">
      {showDocFilterBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <span className="text-foreground">
            Showing changes linked to{" "}
            <span className="font-medium">{filterDoc.type}</span> — {filterDoc.fileName}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onViewDocument?.(filterDoc)}
            >
              View in Documents
            </Button>
            {onClearDocumentFilter ? (
              <Button type="button" variant="outline" size="sm" onClick={onClearDocumentFilter}>
                Show all events
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
          <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="size-4 shrink-0" aria-hidden />
            Filters
          </div>
          <FieldGroup className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-x-4 gap-y-3">
            <Field orientation="horizontal" className="w-auto shrink-0 gap-2">
              <FieldLabel className="shrink-0 text-xs text-muted-foreground">User</FieldLabel>
              <Select
                value={userFilter || "all"}
                onValueChange={(v) => setUserFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[min(11rem,28vw)]">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All users</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal" className="w-auto shrink-0 gap-2">
              <FieldLabel className="shrink-0 text-xs text-muted-foreground">From</FieldLabel>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[min(10.5rem,26vw)]"
              />
            </Field>
            <Field orientation="horizontal" className="w-auto shrink-0 gap-2">
              <FieldLabel className="shrink-0 text-xs text-muted-foreground">Document</FieldLabel>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-[min(11rem,28vw)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    {PROJECT_DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal" className="w-auto shrink-0 gap-2">
              <FieldLabel className="shrink-0 text-xs text-muted-foreground">Change</FieldLabel>
              <Select value={changeType} onValueChange={setChangeType}>
                <SelectTrigger className="w-[min(12rem,30vw)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TIMELINE_CHANGE_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {(userFilter || dateFrom || docType !== "all" || changeType !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2 text-xs"
                onClick={() => {
                  setUserFilter("");
                  setDateFrom("");
                  setDocType("all");
                  setChangeType("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </FieldGroup>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline entries match your filters.</p>
          ) : (
            <ol className="relative border-l border-border pl-0">
              {filtered.map((entry) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  documents={documents}
                  highlighted={highlightEntryId === entry.id}
                  onViewMetadata={onViewMetadata}
                  onViewDocument={onViewDocument}
                />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
