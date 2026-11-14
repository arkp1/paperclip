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
import { isAccentKey, type AccentKey } from "./accents";
import { createTheme, type Theme, type ThemeScheme } from "./themes";

export type ThemeMode = "system" | "light" | "dark";

const THEME_MODE_SETTING_KEY = "theme_mode";
const AMOLED_SETTING_KEY = "theme_amoled";
const DYNAMIC_SETTING_KEY = "theme_dynamic";
const FOLDER_TONAL_SETTING_KEY = "folder_tonal_cards";
const ACCENT_SETTING_KEY = "accent_color";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  mode: ThemeMode;
  accent: AccentKey;
  amoled: boolean;
  dynamic: boolean;
  folderTonal: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setAmoled: (enabled: boolean) => void;
  setDynamic: (enabled: boolean) => void;
  setFolderTonal: (enabled: boolean) => void;
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
  const [accent, setAccentState] = useState<AccentKey>("violet");
  const [amoled, setAmoledState] = useState(false);
  const [dynamic, setDynamicState] = useState(false);
  const [folderTonal, setFolderTonalState] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getSetting(THEME_MODE_SETTING_KEY),
      getSetting(AMOLED_SETTING_KEY),
      getSetting(DYNAMIC_SETTING_KEY),
      getSetting(FOLDER_TONAL_SETTING_KEY),
      getSetting(ACCENT_SETTING_KEY),
    ])
      .then(
        ([
          storedMode,
          storedAmoled,
          storedDynamic,
          storedFolderTonal,
          storedAccent,
        ]) => {
          if (cancelled) {
            return;
          }
          if (isThemeMode(storedMode)) {
            setModeState(storedMode);
          }
          if (storedAmoled === "true") {
            setAmoledState(true);
          }
          if (storedDynamic === "true") {
            setDynamicState(true);
          }
          if (storedFolderTonal === "true") {
            setFolderTonalState(true);
          }
          if (isAccentKey(storedAccent)) {
            setAccentState(storedAccent);
          }
        }
      )
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
      console.warn("Could not persist the appearance preference.");
    });
  }, []);

  const setAccent = useCallback((nextAccent: AccentKey) => {
    setAccentState(nextAccent);
    void setSetting(ACCENT_SETTING_KEY, nextAccent).catch(() => {
      console.warn("Could not persist the accent preference.");
    });
  }, []);

  const setAmoled = useCallback((enabled: boolean) => {
    setAmoledState(enabled);
    void setSetting(AMOLED_SETTING_KEY, enabled ? "true" : "false").catch(() => {
      console.warn("Could not persist the AMOLED preference.");
    });
  }, []);

  const setDynamic = useCallback((enabled: boolean) => {
    setDynamicState(enabled);
    void setSetting(DYNAMIC_SETTING_KEY, enabled ? "true" : "false").catch(() => {
      console.warn("Could not persist the dynamic colour preference.");
    });
  }, []);

  const setFolderTonal = useCallback((enabled: boolean) => {
    setFolderTonalState(enabled);
    void setSetting(FOLDER_TONAL_SETTING_KEY, enabled ? "true" : "false").catch(
      () => {
        console.warn("Could not persist the folder tint preference.");
      }
    );
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(
      mode,
      systemScheme === "dark" ? "dark" : systemScheme === "light" ? "light" : null
    );
    return {
      theme: createTheme(scheme, accent, amoled),
      isDark: scheme === "dark",
      mode,
      accent,
      amoled,
      dynamic,
      folderTonal,
      setMode,
      setAccent,
      setAmoled,
      setDynamic,
      setFolderTonal,
    };
  }, [
    accent,
    amoled,
    dynamic,
    folderTonal,
    mode,
    setAccent,
    setAmoled,
    setDynamic,
    setFolderTonal,
    setMode,
    systemScheme,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return value;
}
