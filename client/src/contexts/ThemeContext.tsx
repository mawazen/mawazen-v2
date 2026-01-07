import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemePalette = "gold" | "gold_burgundy" | "gold_navy" | "burgundy" | "navy" | "sky";

const THEME_PALETTES: ThemePalette[] = [
  "gold",
  "gold_navy",
  "gold_burgundy",
  "burgundy",
  "navy",
  "sky",
];

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark";

const isThemePalette = (value: string | null): value is ThemePalette =>
  value === "gold" ||
  value === "gold_navy" ||
  value === "gold_burgundy" ||
  value === "burgundy" ||
  value === "navy" ||
  value === "sky";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme?: () => void;
  setTheme?: (theme: ThemeMode) => void;
  switchable: boolean;
  palette: ThemePalette;
  setPalette?: (palette: ThemePalette) => void;
  palettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  defaultPalette?: ThemePalette;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  defaultPalette = "gold",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme-mode");
      if (isThemeMode(stored)) return stored;
      return defaultTheme;
    }
    return defaultTheme;
  });

  const [palette, setPaletteState] = useState<ThemePalette>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme-palette");
      if (isThemePalette(stored)) return stored;
      return defaultPalette;
    }
    return defaultPalette;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.setAttribute("data-theme", palette);

    if (switchable) {
      localStorage.setItem("theme-mode", theme);
      localStorage.setItem("theme-palette", palette);
    }
  }, [palette, theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const setThemeMode = switchable
    ? (nextTheme: ThemeMode) => {
        setTheme(nextTheme);
      }
    : undefined;

  const setPalette = switchable
    ? (nextPalette: ThemePalette) => {
        setPaletteState(nextPalette);
      }
    : undefined;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme: setThemeMode,
        switchable,
        palette,
        setPalette,
        palettes: THEME_PALETTES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
