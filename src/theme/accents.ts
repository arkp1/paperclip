import type { ColorScheme } from "./colors";

export type AccentKey = "violet" | "coral" | "moss" | "ocean" | "amber";

type AccentPalette = {
  light: Partial<ColorScheme>;
  dark: Partial<ColorScheme>;
};

export const accentOptions: {
  key: AccentKey;
  label: string;
}[] = [
  { key: "violet", label: "Violet" },
  { key: "coral", label: "Coral" },
  { key: "moss", label: "Moss" },
  { key: "ocean", label: "Ocean" },
  { key: "amber", label: "Amber" },
];

const accentPalettes: Record<AccentKey, AccentPalette> = {
  violet: {
    light: {
      primary: "#6853B8",
      onPrimary: "#FFFFFF",
      primaryContainer: "#E9E2FA",
      onPrimaryContainer: "#49378D",
    },
    dark: {
      primary: "#B9A8E2",
      onPrimary: "#30234F",
      primaryContainer: "#51466D",
      onPrimaryContainer: "#F2ECFF",
    },
  },
  coral: {
    light: {
      primary: "#B23A2E",
      onPrimary: "#FFFFFF",
      primaryContainer: "#FFDAD2",
      onPrimaryContainer: "#410B00",
    },
    dark: {
      primary: "#FFB4A6",
      onPrimary: "#690005",
      primaryContainer: "#8A1F12",
      onPrimaryContainer: "#FFDAD2",
    },
  },
  moss: {
    light: {
      primary: "#3F6B4A",
      onPrimary: "#FFFFFF",
      primaryContainer: "#C9EBCF",
      onPrimaryContainer: "#0B2A14",
    },
    dark: {
      primary: "#A9D5B5",
      onPrimary: "#14351F",
      primaryContainer: "#2A5137",
      onPrimaryContainer: "#C9EBCF",
    },
  },
  ocean: {
    light: {
      primary: "#24617A",
      onPrimary: "#FFFFFF",
      primaryContainer: "#C7E8F5",
      onPrimaryContainer: "#003544",
    },
    dark: {
      primary: "#8DD0E8",
      onPrimary: "#003544",
      primaryContainer: "#0B4A60",
      onPrimaryContainer: "#C7E8F5",
    },
  },
  amber: {
    light: {
      primary: "#7A5900",
      onPrimary: "#FFFFFF",
      primaryContainer: "#FFE08A",
      onPrimaryContainer: "#261A00",
    },
    dark: {
      primary: "#F1C66D",
      onPrimary: "#402D00",
      primaryContainer: "#5C4300",
      onPrimaryContainer: "#FFE08A",
    },
  },
};

export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === "string" && value in accentPalettes;
}

export function applyAccent(
  colors: ColorScheme,
  accent: AccentKey,
  scheme: "light" | "dark"
): ColorScheme {
  return { ...colors, ...accentPalettes[accent][scheme] };
}

export function accentSwatch(accent: AccentKey): string {
  return accentPalettes[accent].light.primary ?? "#6853B8";
}
