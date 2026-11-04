import {
  amoledColors,
  darkColors,
  lightColors,
  type ColorScheme,
} from "./colors";
import { applyAccent, type AccentKey } from "./accents";
import { motion } from "./motion";
import { shapes } from "./shapes";
import { spacing } from "./spacing";
import { typography } from "./typography";

export type ThemeScheme = "light" | "dark";

export type Theme = {
  scheme: ThemeScheme;
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  shapes: typeof shapes;
  motion: typeof motion;
};

function createTheme(
  scheme: ThemeScheme,
  accent: AccentKey,
  amoled: boolean
): Theme {
  const base =
    scheme === "dark"
      ? amoled
        ? amoledColors
        : darkColors
      : lightColors;

  return {
    scheme,
    colors: applyAccent(base, accent, scheme),
    typography,
    spacing,
    shapes,
    motion,
  };
}

export const lightTheme = createTheme("light", "violet", false);
export const darkTheme = createTheme("dark", "violet", false);

export { createTheme };
