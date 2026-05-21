/**
 * shadcn / CSS-variable helpers for inline styles and SVG.
 * Use when Tailwind arbitrary values cannot bind theme tokens.
 */

/** Tint a design token (or hex) for icon tiles and badges. */
export function tokenTint(color, percent = 15) {
  if (!color) return "var(--muted)";
  const s = String(color);
  if (s.startsWith("var(")) {
    return `color-mix(in oklch, ${s} ${percent}%, transparent)`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    const a = Math.round((percent / 100) * 255)
      .toString(16)
      .padStart(2, "0");
    return `${s}${a}`;
  }
  return s;
}

export const tokenBorderSubtle = "color-mix(in oklch, var(--foreground) 10%, transparent)";

export const tokenShadowSm =
  "0 1px 3px color-mix(in oklch, var(--foreground) 10%, transparent)";

export const tokenShadowMd =
  "0 8px 24px color-mix(in oklch, var(--foreground) 12%, transparent), 0 2px 8px color-mix(in oklch, var(--foreground) 6%, transparent)";

export const tokenShadowLg =
  "0 20px 60px color-mix(in oklch, var(--foreground) 14%, transparent), 0 4px 16px color-mix(in oklch, var(--foreground) 8%, transparent)";

export const tokenDropShadowMd =
  "drop-shadow(0 2px 6px color-mix(in oklch, var(--foreground) 12%, transparent))";
