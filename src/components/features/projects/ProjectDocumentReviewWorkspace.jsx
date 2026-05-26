import { useMemo } from "react";
import { validateMetadataForm } from "@/data/projectDocuments";
import { countMetadataDifferences } from "@/lib/projectFieldComparison";
import { ProjectDocumentPreviewPanel } from "@/components/features/projects/ProjectDocumentPreviewPanel";
import { ProjectMetadataPreviewForm } from "@/components/features/projects/ProjectMetadataPreviewForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { getProjectDocumentTypeLabel } from "@/data/projectDocuments";

/**
 * Two-column document review: preview (left) + extracted metadata form (right).
 *
 * @param {{
 *   uploads: Array,
 *   setUploads: (uploads: Array) => void,
 *   activeIndex: number,
 *   setActiveIndex: (index: number) => void,
 *   activeUpload: object | null,
 *   activeFormValues: Record<string, string>,
 *   activeStatus: string,
 *   activeError?: string,
 *   updateActiveFormValue: (key: string, value: string) => void,
 *   retryExtraction: (uploadId: string) => void,
 *   anyExtracting: boolean,
 *   footer?: React.ReactNode,
 *   rightHeaderExtra?: React.ReactNode,
 *   compareWithValues?: Record<string, string>,
 *   activeReviewFieldKeys?: string[],
 * }} props
 */
export function ProjectDocumentReviewWorkspace({
  uploads,
  setUploads,
  activeIndex,
  setActiveIndex,
  activeUpload,
  activeFormValues,
  activeReviewFieldKeys = [],
  activeStatus,
  activeError,
  updateActiveFormValue,
  retryExtraction,
  anyExtracting,
  footer,
  rightHeaderExtra,
  compareWithValues,
}) {
  const validation =
    activeStatus === "done"
      ? validateMetadataForm(activeFormValues, {
          fieldKeys: activeReviewFieldKeys.length ? activeReviewFieldKeys : undefined,
        })
      : { errors: [], warnings: [], valid: true };

  const changeCount = useMemo(() => {
    if (!compareWithValues || activeStatus !== "done") return 0;
    return countMetadataDifferences(
      compareWithValues,
      activeFormValues,
      activeReviewFieldKeys.length ? activeReviewFieldKeys : undefined,
    );
  }, [compareWithValues, activeFormValues, activeStatus, activeReviewFieldKeys]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <ProjectDocumentPreviewPanel
          uploads={uploads}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onUploadsChange={setUploads}
          className="min-h-[min(560px,70vh)] lg:min-h-0"
        />

        <Card className="flex min-h-[min(560px,70vh)] flex-col overflow-hidden lg:min-h-0">
          <CardHeader className="shrink-0 border-b border-border py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Extracted data</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {activeUpload ? (
                  <Badge variant="outline" className="max-w-[200px] truncate text-xs font-normal">
                    {getProjectDocumentTypeLabel(activeUpload.documentType)} · {activeUpload.fileName}
                  </Badge>
                ) : null}
                {rightHeaderExtra}
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {compareWithValues
                ? "Fields below match this document type and were extracted from the selected file. Compare and edit before saving."
                : "Fields below match this document type. Edit any value before saving."}
            </p>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto p-4">
            {changeCount > 0 ? (
              <Alert className="mb-4">
                <AlertTitle>
                  {changeCount} field{changeCount !== 1 ? "s" : ""} differ from this project
                </AlertTitle>
                <AlertDescription>
                  Highlighted fields show what is on the project today versus what was extracted from
                  the selected file.
                </AlertDescription>
              </Alert>
            ) : null}
            {!uploads.length ? (
              <p className="text-sm text-muted-foreground">
                Select a document type, choose a file, and click Upload on the left. Extracted fields
                will appear here for review and editing. Use Add more files to upload additional
                documents in this project.
              </p>
            ) : activeStatus === "loading" || (activeStatus === "idle" && anyExtracting) ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Spinner className="text-primary" />
                <p className="text-sm text-muted-foreground">Extracting fields from document…</p>
              </div>
            ) : activeStatus === "error" ? (
              <div className="flex flex-col gap-4">
                <Alert variant="destructive">
                  <AlertTitle>Extraction failed</AlertTitle>
                  <AlertDescription>{activeError}</AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => retryExtraction(activeUpload.id)}
                >
                  Retry extraction
                </Button>
              </div>
            ) : (
              <ProjectMetadataPreviewForm
                values={activeFormValues}
                onChange={updateActiveFormValue}
                errors={validation.errors}
                warnings={validation.warnings}
                compareWithValues={compareWithValues}
                documentType={activeUpload?.documentType}
                fieldKeys={activeReviewFieldKeys}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {footer ? <div className="shrink-0 border-t border-border pt-4">{footer}</div> : null}
    </div>
  );
}
