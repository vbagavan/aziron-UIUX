import { cn } from "@/lib/utils";

/** Semantic icon dot backgrounds for timeline entry types */
const ENTRY_ICON_BG = {
  created_manual: "bg-muted-foreground",
  created: "bg-success",
  delta_applied: "bg-primary",
  document_uploaded: "bg-secondary",
  field_updated: "bg-foreground/80",
};

/** Semantic badge classes for timeline change-type labels */
const CHANGE_BADGE_CLASS = {
  created_manual: "border-border bg-muted/50 text-muted-foreground",
  created: "border-success/40 bg-success/10 text-success-foreground",
  delta_applied: "border-primary/40 bg-primary/10 text-primary",
  document_uploaded: "border-border bg-secondary/50 text-secondary-foreground",
  field_updated: "border-border bg-muted text-foreground",
};

export function timelineEntryIconBg(changeType) {
  return ENTRY_ICON_BG[changeType] ?? "bg-primary";
}

export function timelineChangeBadgeClass(changeType) {
  return CHANGE_BADGE_CLASS[changeType] ?? "border-border bg-muted/50 text-muted-foreground";
}

export function timelineEntryIconWrapperClass(changeType) {
  return cn(
    "absolute top-1.5 left-0 flex size-6 items-center justify-center rounded-full ring-4 ring-background text-primary-foreground [&_svg]:pointer-events-none",
    timelineEntryIconBg(changeType),
  );
}

/** Lucide icons inside the timeline dot (24px wrapper → 12px icon). */
export const TIMELINE_ENTRY_ICON_CLASS = "size-3 shrink-0";
