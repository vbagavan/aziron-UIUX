/** Shared dialog sizing for Knowledge Hub modals (wide + tall to reduce inner scroll). */

export const HUB_DIALOG_CONTENT_BASE =
  "flex w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0";

export const HUB_DIALOG_CONTENT_MD = `${HUB_DIALOG_CONTENT_BASE} max-h-[min(92vh,calc(100dvh-2rem))] sm:max-w-2xl`;

export const HUB_DIALOG_CONTENT_LG = `${HUB_DIALOG_CONTENT_BASE} h-[min(92vh,calc(100dvh-2rem))] max-h-[min(92vh,calc(100dvh-2rem))] sm:max-w-3xl`;

export const HUB_DIALOG_CONTENT_XL = `${HUB_DIALOG_CONTENT_BASE} h-[min(92vh,calc(100dvh-2rem))] max-h-[min(92vh,calc(100dvh-2rem))] sm:max-w-4xl`;

export const HUB_DIALOG_BODY_SCROLL = "min-h-0 flex-1 overflow-y-auto overscroll-y-contain";

export const HUB_DIALOG_BODY_STATIC = "shrink-0";
