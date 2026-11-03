import { darkColors, lightColors, type ColorScheme } from "./colors";
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

export const lightTheme: Theme = {
  scheme: "light",
  colors: lightColors,
  typography,
  spacing,
  shapes,
  motion,
};

export const darkTheme: Theme = {
  scheme: "dark",
  colors: darkColors,
  typography,
  spacing,
  shapes,
  motion,
};
