import { useCallback, useState } from "react";

export const READING_SETTINGS_STORAGE_KEY = "aziron-reader-prefs";

export const LINE_SPACING_OPTIONS = [
  { id: "tight", label: "Tight", value: "1.5" },
  { id: "normal", label: "Normal", value: "1.75" },
  { id: "loose", label: "Loose", value: "2.1" },
];

export const WIDTH_OPTIONS = [
  { id: "narrow", label: "Narrow", value: 560 },
  { id: "normal", label: "Normal", value: 680 },
  { id: "wide", label: "Wide", value: 860 },
];

export const THEME_OPTIONS = [
  { id: "light", label: "Light", swatch: "#ffffff" },
  { id: "sepia", label: "Sepia", swatch: "#f4ecd8" },
  { id: "dark-read", label: "Dark", swatch: "#1a1a1a" },
];

export const READING_SETTINGS_DEFAULTS = {
  fontSize: 18,
  lineHeight: "1.75",
  width: 680,
  theme: "light",
};

export function loadReadingSettings() {
  try {
    const raw = localStorage.getItem(READING_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...READING_SETTINGS_DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      fontSize: clampFontSize(parsed.fontSize ?? READING_SETTINGS_DEFAULTS.fontSize),
      lineHeight: normalizeLineHeight(parsed.lineHeight),
      width: normalizeWidth(parsed.width),
      theme: normalizeTheme(parsed.theme),
    };
  } catch {
    return { ...READING_SETTINGS_DEFAULTS };
  }
}

export function saveReadingSettings(settings) {
  try {
    localStorage.setItem(READING_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / private mode
  }
}

function clampFontSize(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return READING_SETTINGS_DEFAULTS.fontSize;
  return Math.min(26, Math.max(14, Math.round(n)));
}

function normalizeLineHeight(value) {
  const match = LINE_SPACING_OPTIONS.find((o) => o.value === String(value));
  return match?.value ?? READING_SETTINGS_DEFAULTS.lineHeight;
}

function normalizeWidth(value) {
  const n = Number(value);
  const match = WIDTH_OPTIONS.find((o) => o.value === n);
  return match?.value ?? READING_SETTINGS_DEFAULTS.width;
}

function normalizeTheme(value) {
  const match = THEME_OPTIONS.find((o) => o.id === value);
  return match?.id ?? READING_SETTINGS_DEFAULTS.theme;
}

export function useReadingSettings() {
  const [settings, setSettings] = useState(() => loadReadingSettings());

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        ...patch,
        fontSize: patch.fontSize != null ? clampFontSize(patch.fontSize) : prev.fontSize,
        lineHeight: patch.lineHeight != null ? normalizeLineHeight(patch.lineHeight) : prev.lineHeight,
        width: patch.width != null ? normalizeWidth(patch.width) : prev.width,
        theme: patch.theme != null ? normalizeTheme(patch.theme) : prev.theme,
      };
      saveReadingSettings(next);
      return next;
    });
  }, []);

  const setFontSize = useCallback(
    (fontSize) => updateSettings({ fontSize }),
    [updateSettings],
  );

  const bumpFontSize = useCallback(
    (delta) => setFontSize(settings.fontSize + delta),
    [setFontSize, settings.fontSize],
  );

  return { settings, updateSettings, setFontSize, bumpFontSize };
}
