import {
  formatMetadataFieldValue,
  projectToMetadataValues,
} from "@/data/projectMetadataSchema";
import { ProjectMetadataSectionsAccordion } from "@/components/features/projects/ProjectMetadataSectionsAccordion";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";

/**
 * @param {{ project: object }} props
 */
export function ProjectMetadataDetailView({ project }) {
  const values = projectToMetadataValues(project);

  return (
    <ProjectMetadataSectionsAccordion>
      {(section) => (
        <FieldSet>
          <FieldLegend className="sr-only">{section.title}</FieldLegend>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const raw = values[field.key] ?? "";
              const display = formatMetadataFieldValue(field, raw);
              const spanFull = field.multiline || field.type === "textarea";

              return (
                <Field
                  key={field.key}
                  orientation="vertical"
                  className={spanFull ? "sm:col-span-2" : undefined}
                >
                  <FieldLabel className="text-muted-foreground">{field.label}</FieldLabel>
                  <p className="text-sm font-semibold text-foreground">{display || "—"}</p>
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>
      )}
    </ProjectMetadataSectionsAccordion>
  );
}
