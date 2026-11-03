import type { TextStyle } from "react-native";

/**
 * Mobile-tuned Material 3 type roles. Android renders these with the system
 * Roboto family; sizes are intentionally compact for phone reading and still
 * scale with the system font-size setting.
 */
export const typography = {
  displayLarge: { fontSize: 48, lineHeight: 56, fontWeight: "400" },
  displayMedium: { fontSize: 40, lineHeight: 48, fontWeight: "400" },
  displaySmall: { fontSize: 32, lineHeight: 40, fontWeight: "400" },
  headlineLarge: { fontSize: 28, lineHeight: 36, fontWeight: "400" },
  headlineMedium: { fontSize: 24, lineHeight: 32, fontWeight: "400" },
  headlineSmall: { fontSize: 22, lineHeight: 28, fontWeight: "500" },
  titleLarge: { fontSize: 20, lineHeight: 26, fontWeight: "500" },
  titleMedium: { fontSize: 15, lineHeight: 22, fontWeight: "500" },
  titleSmall: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  bodyLarge: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  bodyMedium: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  labelLarge: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  labelMedium: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
  labelSmall: { fontSize: 10, lineHeight: 14, fontWeight: "500" },
  /** Small caption/body alias used for compact metadata. */
  textSmall: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  /** Uppercase micro-label used above section headings, per the design. */
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
