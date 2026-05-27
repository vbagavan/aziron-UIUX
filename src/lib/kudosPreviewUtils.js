const STYLE_KEYS = [
  "accentColor",
  "backgroundColor",
  "backgroundGradient",
  "fontColor",
  "themeColor",
  "brandColor",
  "buttonColor",
  "borderColor",
  "headerBackground",
  "footerBackground",
  "bodyBackground",
  "themeMode",
];

/** True when the user has applied style overrides beyond the loaded template baseline. */
export function hasCustomCardStyles(content, baseline) {
  if (!content || !baseline) return false;
  return STYLE_KEYS.some((key) => {
    const value = content[key];
    const base = baseline[key];
    if (value == null && base == null) return false;
    return value !== base;
  });
}
