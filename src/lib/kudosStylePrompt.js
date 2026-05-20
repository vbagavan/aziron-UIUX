import { TEMPLATES } from "@/components/features/kudos/constants";

const COLOR_ALIASES = {
  blue: { token: "var(--primary)", hex: "#2563eb", templateId: "blue-morden" },
  navy: { token: "var(--primary)", hex: "#1e3a8a", templateId: "blue-morden" },
  green: { token: "var(--success)", hex: "#16a34a", templateId: "green" },
  emerald: { token: "var(--success)", hex: "#059669", templateId: "green" },
  lime: { token: "var(--success)", hex: "#65a30d", templateId: "green" },
  gold: { token: "var(--warning)", hex: "#ca8a04", templateId: "gold-classic" },
  yellow: { token: "var(--warning)", hex: "#eab308", templateId: "gold-classic" },
  orange: { token: "var(--warning)", hex: "#ea580c", templateId: "gold-classic" },
  amber: { token: "var(--warning)", hex: "#d97706", templateId: "gold-classic" },
  purple: { token: "var(--chart-chart-4)", hex: "#7c3aed", templateId: "purple-elegant" },
  violet: { token: "var(--chart-chart-4)", hex: "#8b5cf6", templateId: "purple-elegant" },
  indigo: { token: "var(--chart-chart-4)", hex: "#4f46e5", templateId: "purple-elegant" },
  pink: { token: "var(--destructive)", hex: "#db2777", templateId: "purple-elegant" },
  red: { token: "var(--destructive)", hex: "#dc2626", templateId: "gold-classic" },
  teal: { token: "var(--info)", hex: "#0d9488", templateId: "blue-morden" },
  cyan: { token: "var(--info)", hex: "#0891b2", templateId: "blue-morden" },
  black: { token: "#0f172a", hex: "#0f172a", templateId: "gold-classic" },
  white: { token: "#ffffff", hex: "#ffffff", templateId: "blue-morden" },
  gray: { token: "#6b7280", hex: "#6b7280", templateId: "blue-morden" },
  grey: { token: "#6b7280", hex: "#6b7280", templateId: "blue-morden" },
};

const THEME_PRESETS = {
  dark: {
    backgroundColor: "#0f172a",
    backgroundGradient: "radial-gradient(ellipse at 30% 20%, #1e293b 0%, #0f172a 70%)",
    fontColor: "#f8fafc",
    themeMode: "dark",
  },
  light: {
    backgroundColor: "#f8fafc",
    backgroundGradient: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
    fontColor: "#0f172a",
    themeMode: "light",
  },
};

const STYLE_INTENT =
  /\b(background|backdrop|font|text|theme|button|header|footer|gradient|brand|border|styling|style|color)\b/i;

function resolveColor(word) {
  if (!word) return null;
  const key = word.toLowerCase().replace(/[^a-z]/g, "");
  return COLOR_ALIASES[key] ?? null;
}

function captureColor(text) {
  const named = text.match(
    /\b(blue|navy|green|emerald|lime|gold|yellow|orange|amber|purple|violet|indigo|pink|red|teal|cyan|black|white|gray|grey)\b/i,
  );
  if (named) return resolveColor(named[1]);
  const hex = text.match(/#([0-9a-f]{3,8})\b/i);
  if (hex) return { token: `#${hex[1]}`, hex: `#${hex[1]}`, templateId: null };
  return null;
}

function softBackground(hexOrToken) {
  const c = hexOrToken?.hex ?? hexOrToken?.token;
  if (!c) return null;
  if (c.startsWith("#")) {
    return `${c}18`;
  }
  return `color-mix(in srgb, ${c} 12%, transparent)`;
}

function gradientFromColor(colorDef, direction = "135deg") {
  const c = colorDef.hex ?? colorDef.token;
  return `linear-gradient(${direction}, ${c}22 0%, ${c}55 50%, ${c}22 100%)`;
}

/**
 * Parse natural-language style commands from the kudos conversation prompt.
 * @returns {{ content: object, templateId?: string, summary: string } | null}
 */
export function parseTemplateStylePrompt(text) {
  const input = text.trim();
  if (!input) return null;

  const hasIntent =
    STYLE_INTENT.test(input) ||
    /\b(dark|light)\s+theme\b/i.test(input) ||
    /\b(change|update|set|make|switch)\s+(?:the\s+)?(?:color|template|background)\b/i.test(input);

  if (!hasIntent) return null;

  const content = {};
  const summaryParts = [];
  let templateId;

  const applyColor = (colorDef, label) => {
    if (!colorDef) return;
    const token = colorDef.token ?? colorDef.hex;
    content.accentColor = token;
    content.themeColor = token;
    content.brandColor = token;
    if (colorDef.templateId) templateId = colorDef.templateId;
    summaryParts.push(label);
  };

  if (/\b(dark)\s+theme\b/i.test(input) || /\btheme\s+(?:to\s+)?dark\b/i.test(input)) {
    Object.assign(content, THEME_PRESETS.dark);
    summaryParts.push("applied dark theme");
  }
  if (/\b(light)\s+theme\b/i.test(input) || /\btheme\s+(?:to\s+)?light\b/i.test(input)) {
    Object.assign(content, THEME_PRESETS.light);
    summaryParts.push("applied light theme");
  }

  const templateSwitch = input.match(
    /\b(?:switch(?:\s+to)?|use|change(?:\s+to)?)\s+(?:the\s+)?(gold(?:\s+classic)?|blue(?:\s+modern)?|green(?:\s+nature)?|purple(?:\s+elegant)?)\b/i,
  );
  if (templateSwitch) {
    const map = {
      gold: "gold-classic",
      blue: "blue-morden",
      green: "green",
      purple: "purple-elegant",
    };
    const key = Object.keys(map).find((k) => templateSwitch[1].toLowerCase().includes(k));
    if (key) {
      templateId = map[key];
      summaryParts.push(`switched to ${TEMPLATES.find((t) => t.id === templateId)?.label ?? key} template`);
    }
  }

  const bgPatterns = [
    /\b(?:background|backdrop)(?:\s+color)?\s+(?:to\s+)?([#a-z0-9]+)/i,
    /\bmake\s+(?:the\s+)?(?:template\s+)?background\s+([#a-z0-9]+)/i,
    /\b(?:template\s+)?background\s+(?:to\s+)?([#a-z0-9]+)/i,
  ];
  for (const re of bgPatterns) {
    const m = input.match(re);
    if (m) {
      const colorDef = resolveColor(m[1]) ?? captureColor(m[1]);
      if (colorDef) {
        content.backgroundColor = softBackground(colorDef) ?? colorDef.hex;
        content.backgroundGradient = gradientFromColor(colorDef);
        applyColor(colorDef, `background set to ${m[1]}`);
      }
      break;
    }
  }

  const fontMatch = input.match(/\b(?:font|text)\s+color\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (fontMatch) {
    const colorDef = resolveColor(fontMatch[1]) ?? captureColor(fontMatch[1]);
    if (colorDef) {
      content.fontColor = colorDef.token ?? colorDef.hex;
      summaryParts.push(`font color set to ${fontMatch[1]}`);
    }
  }

  const themeColorMatch = input.match(/\btheme\s+color\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (themeColorMatch) {
    const colorDef = resolveColor(themeColorMatch[1]) ?? captureColor(themeColorMatch[1]);
    applyColor(colorDef, `theme color set to ${themeColorMatch[1]}`);
  }

  const brandMatch = input.match(/\bbrand\s+color\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (brandMatch) {
    const colorDef = resolveColor(brandMatch[1]) ?? captureColor(brandMatch[1]);
    applyColor(colorDef, `brand color set to ${brandMatch[1]}`);
  }

  const buttonMatch = input.match(/\bbutton\s+color\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (buttonMatch) {
    const colorDef = resolveColor(buttonMatch[1]) ?? captureColor(buttonMatch[1]);
    if (colorDef) {
      content.buttonColor = colorDef.token ?? colorDef.hex;
      summaryParts.push(`button color set to ${buttonMatch[1]}`);
    }
  }

  const headerMatch = input.match(/\bheader(?:\s+styling|\s+color|\s+background)?\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (headerMatch) {
    const colorDef = resolveColor(headerMatch[1]) ?? captureColor(headerMatch[1]);
    if (colorDef) {
      content.headerBackground = `linear-gradient(135deg, ${colorDef.hex ?? colorDef.token} 0%, ${colorDef.hex ?? colorDef.token}cc 100%)`;
      summaryParts.push(`header styling updated to ${headerMatch[1]}`);
    }
  }

  const footerMatch = input.match(/\bfooter(?:\s+styling|\s+color|\s+background)?\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (footerMatch) {
    const colorDef = resolveColor(footerMatch[1]) ?? captureColor(footerMatch[1]);
    if (colorDef) {
      content.footerBackground = colorDef.token ?? colorDef.hex;
      summaryParts.push(`footer styling updated to ${footerMatch[1]}`);
    }
  }

  const gradientMatch = input.match(/\b(?:gradient|pattern)\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (gradientMatch) {
    const colorDef = resolveColor(gradientMatch[1]) ?? captureColor(gradientMatch[1]);
    if (colorDef) {
      content.backgroundGradient = gradientFromColor(colorDef);
      summaryParts.push(`gradient updated to ${gradientMatch[1]}`);
    }
  }

  const genericColor =
    input.match(/\b(?:change|set|update|make)\s+(?:the\s+)?color\s+(?:to\s+)?([#a-z0-9]+)/i) ||
    input.match(/\bcolor\s+(?:to\s+)?([#a-z0-9]+)/i);
  if (genericColor && !content.accentColor) {
    const colorDef = resolveColor(genericColor[1]) ?? captureColor(genericColor[1]);
    applyColor(colorDef, `accent color set to ${genericColor[1]}`);
    if (colorDef && !content.backgroundColor) {
      content.backgroundColor = softBackground(colorDef);
      content.backgroundGradient = gradientFromColor(colorDef);
    }
  }

  if (summaryParts.length === 0) {
    const fallbackColor = captureColor(input);
    if (fallbackColor && /\b(color|background|theme|style)\b/i.test(input)) {
      applyColor(fallbackColor, `updated styling to ${fallbackColor.hex ? fallbackColor.hex : "new colors"}`);
      content.backgroundColor = content.backgroundColor ?? softBackground(fallbackColor);
      content.backgroundGradient = content.backgroundGradient ?? gradientFromColor(fallbackColor);
    }
  }

  if (summaryParts.length === 0) return null;

  return {
    content,
    templateId,
    summary: summaryParts.join("; "),
  };
}

export function isStylePrompt(text) {
  return parseTemplateStylePrompt(text) !== null;
}
