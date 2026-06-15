import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { cn } from "@/lib/utils";

/**
 * AppHeader breadcrumb for Knowledge Hub list → hub detail → optional library file.
 */
export function KnowledgeHubHeaderBreadcrumb({
  hubName,
  detailsDirty = false,
  libraryFileName = null,
  onKnowledgeHubClick,
  onHubClick,
}) {
  if (!hubName) return null;

  const segments = [
    { label: KNOWLEDGE_TERMS.hubs, onClick: onKnowledgeHubClick },
  ];

  if (libraryFileName) {
    segments.push({ label: hubName, onClick: onHubClick });
    segments.push({ label: libraryFileName, current: true });
  } else {
    segments.push({
      label: hubName,
      current: true,
      suffix: detailsDirty ? "(unsaved)" : null,
    });
  }

  return (
    <div className="relative z-10 ml-1 flex min-w-0 items-center gap-2">
      <Separator orientation="vertical" className="h-6 shrink-0" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLink = Boolean(segment.onClick) && !segment.current;

            return (
              <Fragment key={`${segment.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {isLink ? (
                    <BreadcrumbLink
                      render={
                        <button
                          type="button"
                          onClick={segment.onClick}
                          className="cursor-pointer transition-colors hover:text-foreground"
                        />
                      }
                    >
                      {segment.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage
                      className={cn(
                        "max-w-[min(280px,40vw)] truncate font-medium text-foreground",
                      )}
                    >
                      {segment.label}
                      {segment.suffix ? (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          {segment.suffix}
                        </span>
                      ) : null}
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
