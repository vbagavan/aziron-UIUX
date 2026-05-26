import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CONFIRMATION_SUMMARY_FIELDS } from "@/data/projectWorkflowFlow";
import { formatDisplayValue } from "@/data/projectsData";

/**
 * @param {{
 *   mode: 'create' | 'edit',
 *   formValues: Record<string, string>,
 *   uploads: Array<{ fileName: string, documentType: string }>,
 *   warnings?: string[],
 * }} props
 */
export function ProjectWorkflowConfirmStep({ mode, formValues, uploads, warnings = [] }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>Ready to {mode === "create" ? "create" : "update"} project</AlertTitle>
        <AlertDescription>
          Review the summary below. Saving will write metadata to the project record and append entries to
          the project timeline.
        </AlertDescription>
      </Alert>

      {warnings.length > 0 ? (
        <Alert>
          <AlertTitle>Outstanding warnings</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-semibold">Metadata summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-5">
            {CONFIRMATION_SUMMARY_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">
                  {key === "auto_renewal"
                    ? formValues[key] === "true"
                      ? "Yes"
                      : "No"
                    : formatDisplayValue(formValues[key])}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-semibold">Supporting documents</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            {uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {mode === "edit"
                  ? "No new documents in this session — existing metadata will be updated."
                  : "No documents attached."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {uploads.map((u) => (
                  <li
                    key={`${u.documentType}-${u.fileName}`}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.fileName}</p>
                      <Badge variant="secondary" className="mt-1">
                        {u.documentType}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
