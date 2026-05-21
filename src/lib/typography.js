/**
 * Typography scale — shadcn semantic colors + Tailwind type scale.
 * Use these constants or matching @layer utilities in index.css.
 */

/** App shell — list/settings page title (Flows, Knowledge Hub, Agents, …) */
export const PAGE_TITLE =
  "text-2xl font-semibold leading-8 tracking-tight text-foreground";

/** Under page title */
export const PAGE_SUBTITLE = "text-sm leading-5 text-muted-foreground";

/** Detail / secondary page heading (hub name, profile name in hero) */
export const DETAIL_TITLE = "text-xl font-semibold tracking-tight text-foreground";

/** Dashboard / card section label (replaces mixed 10–11px eyebrows) */
export const SECTION_EYEBROW =
  "text-xs font-semibold uppercase tracking-widest text-muted-foreground";

/** Dialog titles — extend shadcn DialogTitle (text-base font-medium) */
export const DIALOG_TITLE = "text-lg font-semibold leading-snug text-foreground";

/** Metric KPI values */
export const METRIC_VALUE =
  "font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground";

/** Body default */
export const BODY = "text-sm leading-6 text-foreground";

/** Caption / helper */
export const CAPTION = "text-xs text-muted-foreground";

/** Rich message / markdown content hierarchy (one step below page chrome) */
export const CONTENT_HEADING = {
  1: "text-xl font-semibold tracking-tight text-foreground mt-4 mb-2",
  2: "text-lg font-semibold text-foreground mt-3 mb-1.5",
  3: "text-base font-semibold text-foreground mt-2 mb-1",
  4: "text-sm font-semibold text-foreground mt-2 mb-1",
  5: "text-sm font-medium text-muted-foreground mt-1 mb-0.5",
  6: "text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1 mb-0.5",
};
