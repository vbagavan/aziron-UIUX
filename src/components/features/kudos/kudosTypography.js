/**
 * Kudos flow typography — 400px conversation panel + card preview.
 * Re-exports shadcn-aligned tokens from @/lib/typography; no arbitrary px sizes.
 */
import {
  BODY,
  CAPTION,
  CONTENT_HEADING,
  SECTION_EYEBROW,
} from "@/lib/typography";

/** Rich-message headings inside chat (h1–h6) */
export { CONTENT_HEADING as KUDOS_CONTENT_HEADING };

/** Panel header — "Customer Appreciation" */
export const KUDOS_PANEL_TITLE = "text-sm font-semibold leading-5 text-foreground";

/** User messages, textarea, primary copy */
export const KUDOS_BODY = BODY;

/** Helpers, folder paths, secondary lines */
export const KUDOS_CAPTION = CAPTION;

/** Field labels, block subtitles */
export const KUDOS_LABEL = "text-xs font-medium text-foreground";

/** To / Cc / section labels in approval block */
export const KUDOS_FIELD_LABEL = SECTION_EYEBROW;

/** Preview-stage command chips */
export const KUDOS_CHIP = "text-xs font-medium leading-4";

/** Format badges (PNG), status pills */
export const KUDOS_BADGE = "text-xs font-semibold leading-none";

/** Drive list / grid file title */
export const KUDOS_FILE_NAME = "text-xs font-medium text-foreground";

/** Drive list folder column */
export const KUDOS_FILE_META = CAPTION;

/** Mention picker */
export const KUDOS_MENTION_NAME = "text-sm font-medium leading-5 text-foreground";
export const KUDOS_MENTION_EMAIL = "text-xs leading-4 text-muted-foreground";

/** Thinking / generating status row */
export const KUDOS_STATUS = "text-sm font-semibold text-foreground";

/** Timeline duration chip */
export const KUDOS_DURATION =
  "text-xs font-mono tabular-nums text-muted-foreground";

/** Template gallery card label */
export const KUDOS_TEMPLATE_LABEL = "text-xs font-medium text-foreground";

/** Idle guide title */
export const KUDOS_GUIDE_TITLE = "text-lg font-semibold text-foreground";
