/** Resolve template style overrides from conversation-driven content. */
export function resolveCardStyles(content = {}, defaults = {}) {
  const accent =
    content.accentColor ?? content.themeColor ?? content.brandColor ?? defaults.accent ?? "var(--primary)";

  return {
    accent,
    background:
      content.backgroundGradient ?? content.backgroundColor ?? defaults.background ?? "var(--background)",
    fontColor: content.fontColor ?? defaults.fontColor ?? accent,
    buttonColor: content.buttonColor ?? defaults.buttonColor ?? accent,
    borderColor: content.borderColor ?? defaults.borderColor ?? accent,
    headerBg: content.headerBackground ?? defaults.headerBg ?? null,
    footerBg: content.footerBackground ?? defaults.footerBg ?? null,
    bodyBg: content.bodyBackground ?? defaults.bodyBg ?? null,
    softAccent: content.softAccent ?? defaults.softAccent ?? accent,
    messageColor: content.messageColor ?? defaults.messageColor ?? null,
  };
}

export function accentWithAlpha(color, alpha = 0.15) {
  if (!color) return `rgba(0,0,0,${alpha})`;
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const hex = color.length === 4 ? expandShortHex(color) : color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("rgb")) return color;
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

function expandShortHex(hex) {
  const h = hex.slice(1);
  return h
    .split("")
    .map((c) => c + c)
    .join("");
}
