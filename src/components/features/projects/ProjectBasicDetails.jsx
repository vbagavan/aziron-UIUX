import { Link } from "react-router-dom";
import { projectToMetadataValues } from "@/data/projectMetadataSchema";
import {
  formatDisplayValue,
  formatGstApplies,
  formatProjectStatus,
  formatMetadataTimestamp,
  formatProjectCode,
} from "@/data/projectsData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

function BasicDetailItem({ label, children, className }) {
  return (
    <Field orientation="vertical" className={cn("gap-1", className)}>
      <FieldLabel className="text-xs font-normal text-muted-foreground">{label}</FieldLabel>
      <div className="text-sm font-semibold text-foreground">{children}</div>
    </Field>
  );
}

function displayDate(iso) {
  if (!iso) return "—";
  return formatMetadataTimestamp(iso);
}

/**
 * Core project summary on the Project details tab.
 *
 * @param {{ project: object, className?: string }} props
 */
export function ProjectBasicDetails({ project, className }) {
  const meta = projectToMetadataValues(project);
  const projectManager = project.projectManager || meta.aziro_delivery_lead;
  const startDate = project.startDate || meta.sow_start_date;
  const endDate = project.endDate || meta.sow_end_date;
  const billingType = project.billingType || meta.engagement_type;

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardContent className="p-4 sm:p-5">
        <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-12">
          <div className="flex flex-col gap-4">
            <BasicDetailItem label="Project Name">{formatDisplayValue(project.name)}</BasicDetailItem>
            <BasicDetailItem label="Customer">
              {project.customer ? (
                <Link
                  to="/finance/customers"
                  className="font-semibold text-primary hover:underline"
                >
                  {project.customer}
                </Link>
              ) : (
                "—"
              )}
            </BasicDetailItem>
            <BasicDetailItem label="Status">
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
                className="w-fit font-medium capitalize"
              >
                {formatProjectStatus(project.status)}
              </Badge>
            </BasicDetailItem>
            <BasicDetailItem label="GST">{formatGstApplies(project.gstApplies)}</BasicDetailItem>
            <BasicDetailItem label="Start Date">{displayDate(startDate)}</BasicDetailItem>
            <BasicDetailItem label="Project Manager">
              {formatDisplayValue(projectManager)}
            </BasicDetailItem>
          </div>

          <div className="flex flex-col gap-4">
            <BasicDetailItem label="Project Code">{formatProjectCode(project.code)}</BasicDetailItem>
            <BasicDetailItem label="Billing Type">{formatDisplayValue(billingType)}</BasicDetailItem>
            <BasicDetailItem label="Credit Period (Days)">
              {project.creditPeriodDays != null ? String(project.creditPeriodDays) : "—"}
            </BasicDetailItem>
            <BasicDetailItem label="Priority">{formatDisplayValue(project.priority)}</BasicDetailItem>
            <BasicDetailItem label="End Date">{displayDate(endDate)}</BasicDetailItem>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
