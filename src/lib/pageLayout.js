/**
 * App shell layout — fixed viewport height + scrollable main column.
 * Required on every flex ancestor above overflow-y-auto (Safari/Chrome).
 */

/** Root page wrapper (sibling to Sidebar inside sidebar-wrapper). */
export const APP_PAGE_MAIN =
  "flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background";

/** Column: header + scroll region. */
export const APP_PAGE_COLUMN =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

/** Primary page content scroll area. */
export const APP_SCROLL_REGION =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain";
