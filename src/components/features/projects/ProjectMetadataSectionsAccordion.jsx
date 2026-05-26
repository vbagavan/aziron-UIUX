import { METADATA_SECTIONS } from "@/data/projectMetadataSchema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const DEFAULT_OPEN_SECTION_IDS = METADATA_SECTIONS.slice(0, 1).map((s) => s.id);

/**
 * Collapsible sections for metadata groups (shadcn Accordion).
 *
 * @param {{
 *   sections?: import("@/data/projectMetadataSchema").MetadataSectionDef[],
 *   defaultOpen?: string[],
 *   className?: string,
 *   children: (section: import("@/data/projectMetadataSchema").MetadataSectionDef) => React.ReactNode,
 * }} props
 */
export function ProjectMetadataSectionsAccordion({
  sections = METADATA_SECTIONS,
  defaultOpen,
  className,
  children,
}) {
  const openIds =
    defaultOpen ?? (sections.length <= 2 ? sections.map((s) => s.id) : [sections[0]?.id].filter(Boolean));

  return (
    <Accordion
      multiple
      defaultValue={openIds.length ? openIds : DEFAULT_OPEN_SECTION_IDS}
      className={cn("flex w-full flex-col gap-3", className)}
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm not-last:border-b-0"
        >
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            {section.title}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">{children(section)}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
