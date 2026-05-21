import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Agent detail / dashboard panel — shadcn Card + token elevation */
export function SectionCard({ children, className, ...props }) {
  return (
    <Card className={cn("p-4 shadow-elevation-sm", className)} {...props}>
      {children}
    </Card>
  );
}
