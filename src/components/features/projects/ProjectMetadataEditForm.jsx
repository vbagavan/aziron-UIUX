import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ProjectFormFooter } from "@/components/features/projects/ProjectFormFooter";
import { ProjectMetadataPreviewForm } from "@/components/features/projects/ProjectMetadataPreviewForm";
import {
  projectToMetadataValues,
  splitMetadataFormPayload,
  validateMetadataForm,
} from "@/data/projectMetadataSchema";

const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

/**
 * @param {{
 *   project: object,
 *   onSubmit: (values: Record<string, string> & { priority?: string }) => void,
 *   onCancel: () => void,
 *   submitLabel?: string,
 * }} props
 */
export function ProjectMetadataEditForm({
  project,
  onSubmit,
  onCancel,
  submitLabel = "Save changes",
}) {
  const [values, setValues] = useState(() => projectToMetadataValues(project));
  const [priority, setPriority] = useState(project.priority ?? "");
  const [validation, setValidation] = useState({ errors: [], warnings: [] });

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (validation.errors.length > 0 || validation.warnings.length > 0) {
      setValidation({ errors: [], warnings: [] });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const result = validateMetadataForm(values);
    setValidation(result);
    if (!result.valid) return;

    const { metadata, priority: priorityValue } = splitMetadataFormPayload({
      ...values,
      priority: priority || "",
    });
    onSubmit({
      ...metadata,
      priority: priorityValue || "",
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col">
      <Card className="min-h-0">
        <CardContent className="max-h-[min(70vh,720px)] overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            <FieldSet>
              <FieldLegend variant="label" className="border-b border-border pb-2 text-sm font-semibold">
                Project settings
              </FieldLegend>
              <FieldGroup className="max-w-xs">
                <Field>
                  <FieldLabel htmlFor="project-priority">Priority</FieldLabel>
                  <Select
                    value={priority || "__none"}
                    onValueChange={(v) => setPriority(v === "__none" ? "" : v)}
                  >
                    <SelectTrigger id="project-priority">
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
                </Field>
              </FieldGroup>
            </FieldSet>

            <ProjectMetadataPreviewForm
              values={values}
              onChange={handleChange}
              errors={validation.errors}
              warnings={validation.warnings}
            />
          </div>
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
