import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FileText, History, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  findTimelineEntriesForDocument,
  getDocumentMetadataVersion,
} from "@/lib/projectDocumentLinks";
import { formatMetadataTimestamp } from "@/data/projectsData";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   project: { id: string, documents?: object[] },
 *   timelineEntries: object[],
 *   uploadHref: string,
 *   onViewTimelineForDocument: (doc: object, entryId?: string) => void,
 *   highlightDocumentId?: string | null,
 * }} props
 */
export function ProjectDocumentsView({
  project,
  timelineEntries,
  uploadHref,
  onViewTimelineForDocument,
  highlightDocumentId = null,
}) {
  const documents = project.documents ?? [];
  const highlightRef = useRef(null);

  useEffect(() => {
    if (highlightDocumentId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightDocumentId]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">
          Contracts, amendments, and purchase orders on file. Use{" "}
          <span className="font-medium text-foreground">Upload document</span> in the header to add
          NDA, PO, MSA, SOW, and other supported types — AI extracts fields for comparison.
        </p>

        {documents.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {documents.map((doc) => {
              const relatedEntries = findTimelineEntriesForDocument(
                timelineEntries,
                project.id,
                doc,
              );
              const recordVersion = getDocumentMetadataVersion(
                doc,
                timelineEntries,
                project.id,
              );
              const primaryEntry = relatedEntries[0];

              return (
                <li
                  key={doc.id}
                  ref={highlightDocumentId === doc.id ? highlightRef : undefined}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center",
                    highlightDocumentId === doc.id &&
                      "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {doc.type}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {doc.fileName}
                    </span>
                    {recordVersion != null ? (
                      <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
                        Record v{recordVersion}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-xs text-muted-foreground">
                      {doc.uploadedBy} · {formatMetadataTimestamp(doc.uploadedAt)}
                    </span>
                    {relatedEntries.length > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onViewTimelineForDocument(doc, primaryEntry?.id)}
                      >
                        <History data-icon="inline-start" />
                        See changes
                        {relatedEntries.length > 1 ? ` (${relatedEntries.length})` : ""}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No linked timeline events</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty className="border border-dashed border-border bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No documents on file yet</EmptyTitle>
              <EmptyDescription>
                Upload a contract or amendment to start tracking versions and timeline events for
                this project.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" render={<Link to={uploadHref} />}>
                <Upload data-icon="inline-start" />
                Upload document
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
