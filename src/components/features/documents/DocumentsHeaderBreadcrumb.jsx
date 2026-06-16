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
import { cn } from "@/lib/utils";

/**
 * AppHeader breadcrumb for Documents → [Hub] → file reader drill-down.
 *
 * @param {{
 *   fileName: string,
 *   hubLinks?: Array<{ hubId: number | string, hubName: string }>,
 *   onDocumentsClick?: () => void,
 *   onHubClick?: (hubId: number | string) => void,
 * }} props
 */
export function DocumentsHeaderBreadcrumb({
  fileName,
  hubLinks = [],
  onDocumentsClick,
  onHubClick,
}) {
  if (!fileName) return null;

  const segments = [
    { label: "Documents", onClick: onDocumentsClick },
  ];

  if (hubLinks.length === 1) {
    segments.push({
      label: hubLinks[0].hubName,
      onClick: () => onHubClick?.(hubLinks[0].hubId),
    });
  } else if (hubLinks.length > 1) {
    segments.push({
      label: `${hubLinks[0].hubName} (+${hubLinks.length - 1})`,
      onClick: () => onHubClick?.(hubLinks[0].hubId),
    });
  }

  segments.push({ label: fileName, current: true });

  return (
    <div className="ml-1 flex min-w-0 items-center gap-2">
      <Separator orientation="vertical" className="h-6 shrink-0" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
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
                          className="transition-colors hover:text-foreground"
                        />
                      }
                    >
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
