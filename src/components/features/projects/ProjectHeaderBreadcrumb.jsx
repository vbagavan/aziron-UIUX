import { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PROJECT_FLOW_ROUTES } from "@/data/projectWorkflowFlow";

/**
 * AppHeader breadcrumb for Invoice → Projects drill-down routes.
 *
 * @param {{ segments: Array<{ label: string, href?: string }> }} props
 */
export function ProjectHeaderBreadcrumb({ segments }) {
  if (!segments?.length) return null;

  return (
    <div className="ml-1 flex min-w-0 items-center gap-2">
      <Separator orientation="vertical" className="h-6 shrink-0" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const isLink = Boolean(segment.href) && !isLast;

            return (
              <Fragment key={`${segment.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {isLink ? (
                    <BreadcrumbLink render={<Link to={segment.href} />}>
                      {segment.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage
                      className={cn(
                        isLast && "max-w-[min(280px,40vw)] truncate font-medium",
                      )}
                    >
                      {segment.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

const projectsCrumb = { label: "Projects", href: PROJECT_FLOW_ROUTES.list };

/** @param {string} projectName */
export function projectDetailBreadcrumbs(projectName) {
  return [projectsCrumb, { label: projectName }];
}

/** @param {string} projectName @param {string} projectId */
export function projectEditBreadcrumbs(projectName, projectId) {
  return [
    projectsCrumb,
    { label: projectName, href: PROJECT_FLOW_ROUTES.detail(projectId) },
    { label: "Edit" },
  ];
}

export function projectCreateManualBreadcrumbs() {
  return [projectsCrumb, { label: "Create manually" }];
}

export function projectCreateDocumentBreadcrumbs() {
  return [projectsCrumb, { label: "Upload & extract" }];
}

/** @param {string} projectName @param {string} projectId */
export function projectUploadDocumentBreadcrumbs(projectName, projectId) {
  return [
    projectsCrumb,
    { label: projectName, href: PROJECT_FLOW_ROUTES.detail(projectId) },
    { label: "Upload document" },
  ];
}
