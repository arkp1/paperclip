import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";
import { darkTheme, lightTheme, type Theme, type ThemeScheme } from "./themes";

export type ThemeMode = "system" | "light" | "dark";

const THEME_MODE_SETTING_KEY = "theme_mode";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function resolveScheme(mode: ThemeMode, systemScheme: ThemeScheme | null): ThemeScheme {
  if (mode === "system") {
    return systemScheme ?? "light";
  }
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    let cancelled = false;

    void getSetting(THEME_MODE_SETTING_KEY)
      .then((storedMode) => {
        if (!cancelled && isThemeMode(storedMode)) {
          setModeState(storedMode);
        }
      })
      .catch(() => {
        // The database gate reports storage failures; appearance falls back to
        // the system setting so the app can still render.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void setSetting(THEME_MODE_SETTING_KEY, nextMode).catch(() => {
      // The choice applies for this session even if persisting it fails.
      console.warn("Could not persist the appearance preference.");
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(mode, systemScheme === "dark" ? "dark" : systemScheme === "light" ? "light" : null);
    const theme = scheme === "dark" ? darkTheme : lightTheme;
    return { theme, isDark: scheme === "dark", mode, setMode };
  }, [mode, setMode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return value;
}
