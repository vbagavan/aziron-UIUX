import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ProjectMetadataSectionsAccordion } from "@/components/features/projects/ProjectMetadataSectionsAccordion";
import { getMetadataSectionsForFieldKeys } from "@/data/projectDocumentTypeFields";
import { getProjectDocumentTypeLabel } from "@/data/projectDocuments";
import { invalidMetadataFieldKeys } from "@/lib/metadataFormValidation";
import {
  fieldDiffersFromBase,
  formatBaseValueForField,
} from "@/lib/projectFieldComparison";
import { cn } from "@/lib/utils";

function MetadataFieldControl({ field, value, onChange, invalid }) {
  const id = `meta-${field.key}`;

  if (field.readonly) {
    return (
      <Input id={id} value={value} readOnly className="bg-muted/50" aria-readonly />
    );
  }

  if (field.type === "boolean") {
    return (
      <Select value={value || "false"} onValueChange={(v) => onChange(field.key, v)}>
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="false">No</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <Select value={value} onValueChange={(v) => onChange(field.key, v)}>
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined}>
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "textarea" || field.multiline) {
    return (
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        rows={3}
        className="resize-y"
        aria-invalid={invalid || undefined}
      />
    );
  }

  return (
    <Input
      id={id}
      type={field.type === "date" ? "datetime-local" : "text"}
      value={field.type === "date" ? isoToLocalInput(value) : value}
      onChange={(e) =>
        onChange(
          field.key,
          field.type === "date" ? localInputToIso(e.target.value) : e.target.value,
        )
      }
      aria-invalid={invalid || undefined}
    />
  );
}

function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local) {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return local;
  return d.toISOString();
}

/**
 * @param {{
 *   values: Record<string, string>,
 *   onChange: (key: string, value: string) => void,
 *   errors?: string[],
 *   warnings?: string[],
 *   compareWithValues?: Record<string, string>,
 *   documentType?: string,
 *   fieldKeys?: string[],
 * }} props
 */
export function ProjectMetadataPreviewForm({
  values,
  onChange,
  errors = [],
  warnings = [],
  compareWithValues,
  documentType,
  fieldKeys,
}) {
  const invalidKeys = useMemo(() => invalidMetadataFieldKeys(errors), [errors]);

  const sections = useMemo(() => {
    if (!fieldKeys?.length) return null;
    return getMetadataSectionsForFieldKeys(fieldKeys);
  }, [fieldKeys]);

  return (
    <div className="flex flex-col gap-6">
      {errors.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Validation errors</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {warnings.length > 0 ? (
        <Alert>
          <AlertTriangle aria-hidden />
          <AlertTitle>Review recommended</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {documentType && fieldKeys?.length ? (
        <p className="text-xs text-muted-foreground">
          Showing fields relevant to{" "}
          <span className="font-medium text-foreground">
            {getProjectDocumentTypeLabel(documentType)}
          </span>
          . Switch documents on the left to review another file.
        </p>
      ) : null}

      <ProjectMetadataSectionsAccordion sections={sections ?? undefined}>
        {(section) => (
        <FieldSet>
          <FieldLegend className="sr-only">{section.title}</FieldLegend>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const value = values[field.key] ?? "";
              const spanFull = field.multiline || field.type === "textarea";
              const invalid =
                invalidKeys.has(field.key) ||
                (field.required && !value.trim() && errors.length > 0);
              const differs =
                compareWithValues &&
                fieldDiffersFromBase(field.key, compareWithValues, values);

              return (
                <Field
                  key={field.key}
                  data-invalid={invalid || undefined}
                  className={cn(
                    spanFull && "sm:col-span-2",
                    differs && "rounded-lg border border-primary/20 bg-primary/5 p-2",
                  )}
                >
                  <FieldLabel htmlFor={`meta-${field.key}`} className="flex flex-wrap items-center gap-2">
                    <span>
                      {field.label}
                      {field.required ? <span className="text-destructive"> *</span> : null}
                    </span>
                    {differs ? (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        Changed
                      </Badge>
                    ) : null}
                  </FieldLabel>
                  {differs ? (
                    <FieldDescription>
                      On project: {formatBaseValueForField(field, compareWithValues)}
                    </FieldDescription>
                  ) : field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                  <MetadataFieldControl
                    field={field}
                    value={value}
                    onChange={onChange}
                    invalid={invalid}
                  />
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>
        )}
      </ProjectMetadataSectionsAccordion>
    </div>
  );
}
