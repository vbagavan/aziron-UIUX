import { useMemo, useState } from "react";
import { quickFormValuesFromProject } from "@/lib/projectQuickFormValues";
import { invalidQuickFormFieldKeys } from "@/lib/metadataFormValidation";
import { ArrowLeft, Check } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ProjectFormFooter } from "@/components/features/projects/ProjectFormFooter";
import { ENGAGEMENT_TYPES } from "@/data/projectMetadataSchema";

const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

const QUICK_FIELDS = [
  { key: "track_name", label: "Project Name", required: true },
  { key: "customer_name", label: "Customer", required: true },
  { key: "engagement_type", label: "Billing Type", required: true, type: "select-engagement" },
  { key: "aziro_delivery_lead", label: "Project Manager", required: false },
  { key: "sow_start_date", label: "Start Date", required: true, type: "date" },
  { key: "sow_end_date", label: "End Date", required: true, type: "date" },
  { key: "priority", label: "Priority", required: false, type: "select-priority" },
];

/**
 * @param {{
 *   project?: object | null,
 *   onSubmit: (values: object) => void,
 *   onCancel: () => void,
 *   submitLabel?: string,
 * }} props
 */
export function ProjectQuickForm({
  project = null,
  onSubmit,
  onCancel,
  submitLabel = "Create Project",
}) {
  const [values, setValues] = useState(() => quickFormValuesFromProject(project));
  const [errors, setErrors] = useState([]);

  const invalidKeys = useMemo(
    () => (errors.length ? invalidQuickFormFieldKeys(errors, values) : new Set()),
    [errors, values],
  );

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors.length) setErrors([]);
  }

  function validate() {
    const errs = [];
    if (!values.track_name.trim()) errs.push("Project Name is required.");
    if (!values.customer_name.trim()) errs.push("Customer is required.");
    if (!values.engagement_type) errs.push("Billing Type is required.");
    if (!values.sow_start_date) errs.push("Start Date is required.");
    if (!values.sow_end_date) errs.push("End Date is required.");
    if (values.sow_start_date && values.sow_end_date) {
      const s = Date.parse(values.sow_start_date);
      const e = Date.parse(values.sow_end_date);
      if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
        errs.push("End Date must be after Start Date.");
      }
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    onSubmit(values);
  }

  function renderControl(field) {
    const invalid = invalidKeys.has(field.key);

    if (field.type === "select-engagement") {
      return (
        <Select value={values.engagement_type} onValueChange={(v) => set("engagement_type", v)}>
          <SelectTrigger aria-invalid={invalid || undefined}>
            <SelectValue placeholder="Select billing type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {ENGAGEMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    }

    if (field.type === "select-priority") {
      return (
        <Select
          value={values.priority || "__none"}
          onValueChange={(v) => set("priority", v === "__none" ? "" : v)}
        >
          <SelectTrigger aria-invalid={invalid || undefined}>
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="__none">Not set</SelectItem>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={field.type === "date" ? "date" : "text"}
        value={values[field.key]}
        onChange={(e) => set(field.key, e.target.value)}
        placeholder={
          field.key === "track_name"
            ? "e.g. Cloud Migration Phase 3"
            : field.key === "customer_name"
              ? "e.g. Nexus AI Corp"
              : field.key === "aziro_delivery_lead"
                ? "e.g. Wade Warren"
                : undefined
        }
        aria-invalid={invalid || undefined}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardContent className="p-6">
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {QUICK_FIELDS.map((field) => (
              <Field
                key={field.key}
                data-invalid={invalidKeys.has(field.key) || undefined}
                className={field.key === "priority" ? "sm:col-span-1" : undefined}
              >
                <FieldLabel>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </FieldLabel>
                {renderControl(field)}
              </Field>
            ))}
          </FieldGroup>

          {errors.length > 0 ? (
            <Alert variant="destructive" className="mt-5">
              <AlertTitle>Please fix the following</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 list-inside list-disc">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <ProjectFormFooter
        left={
          <Button type="button" variant="outline" onClick={onCancel}>
            <ArrowLeft data-icon="inline-start" />
            Cancel
          </Button>
        }
        right={
          <Button type="submit">
            <Check data-icon="inline-start" />
            {submitLabel}
          </Button>
        }
      />
    </form>
  );
}
