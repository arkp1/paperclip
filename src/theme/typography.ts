import type { TextStyle } from "react-native";

/**
 * Material 3 Expressive-inspired type roles for mobile: large, confident
 * display/headline weights with tight tracking, compact body copy, and small
 * uppercase labels. Android renders these with the system Roboto family and
 * still scales with the system font-size setting.
 */
export const typography = {
  displayLarge: {
    fontSize: 52,
    lineHeight: 60,
    fontWeight: "700",
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  headlineLarge: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headlineMedium: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  headlineSmall: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  titleLarge: { fontSize: 20, lineHeight: 26, fontWeight: "600" },
  titleMedium: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  bodyLarge: { fontSize: 15, lineHeight: 23, fontWeight: "400" },
  bodyMedium: { fontSize: 13, lineHeight: 19, fontWeight: "400" },
  bodySmall: { fontSize: 12, lineHeight: 17, fontWeight: "400" },
  labelLarge: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  labelMedium: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  labelSmall: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  /** Small caption/body alias used for compact metadata. */
  textSmall: { fontSize: 12, lineHeight: 17, fontWeight: "400" },
  /** Uppercase micro-label used above section headings. */
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
