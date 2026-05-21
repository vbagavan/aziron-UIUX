import { cn } from "@/lib/utils";
import { SECTION_EYEBROW } from "@/lib/typography";

/**
 * Section label above dashboard blocks — use with aria-labelledby on parent <section>.
 */
export function SectionEyebrow({ id, children, className, as: Tag = "h2" }) {
  return (
    <Tag id={id} className={cn(SECTION_EYEBROW, className)}>
      {children}
    </Tag>
  );
}
