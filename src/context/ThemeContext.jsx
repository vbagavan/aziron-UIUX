import { createContext, useContext, useState, useEffect, useMemo } from "react";

const ThemeContext = createContext(undefined);

// Apply theme directly to DOM
function applyTheme(mode, color) {
  if (typeof document === "undefined") return;

  try {
    const root = document.documentElement;

    // Determine if dark mode should be active
    const isDark =
      mode === "dark" ||
      (mode === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Apply dark mode class
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply color theme class
    ["blue", "green", "orange", "purple", "amethyst-haze", "blaze-orange", "graphite"].forEach((c) => {
      if (c === color) {
        root.classList.add(`theme-${c}`);
      } else {
        root.classList.remove(`theme-${c}`);
      }
    });

    // Save to localStorage
    try {
      localStorage.setItem("aziron-theme-mode", mode);
      localStorage.setItem("aziron-theme-color", color);
    } catch {
      // Silently fail if localStorage not available
    }
  } catch (e) {
    // Silently fail
  }
}

export function ThemeProvider({ children }) {
  // Initialize state from localStorage
  const [mode, setModeState] = useState(() => {
    try {
      return localStorage.getItem("aziron-theme-mode") || "dark";
    } catch {
      return "dark";
    }
  });

  const [color, setColorState] = useState(() => {
    try {
      return localStorage.getItem("aziron-theme-color") || "blue";
    } catch {
      return "blue";
    }
  });

  // Apply theme on mount and whenever theme values change
  useEffect(() => {
    applyTheme(mode, color);
  }, [mode, color]);

  // Apply initial theme on mount
  useEffect(() => {
    applyTheme(mode, color);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme(mode, color);
    };

    try {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } catch {
      // Silently fail
    }
  }, [mode, color]);

  const setThemeMode = (newMode) => {
    setModeState(newMode);
    applyTheme(newMode, color);
  };

  const setThemeColor = (newColor) => {
    setColorState(newColor);
    applyTheme(mode, newColor);
  };

  const value = useMemo(
    () => ({ mode, color, setThemeMode, setThemeColor }),
    [mode, color]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
