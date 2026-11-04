export type ColorScheme = {
  background: string;
  onBackground: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  warning: string;
  scrim: string;
};

export const lightColors: ColorScheme = {
  background: "#F7F4EE",
  onBackground: "#282431",
  surface: "#FFFEFA",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F0ECE5",
  surfaceContainer: "#EAE5DD",
  surfaceContainerHigh: "#E3DDD5",
  onSurface: "#282431",
  onSurfaceVariant: "#6F6975",
  outline: "#A49DA7",
  outlineVariant: "#E6E0D8",
  primary: "#6853B8",
  onPrimary: "#FFFFFF",
  primaryContainer: "#E9E2FA",
  onPrimaryContainer: "#49378D",
  secondary: "#456B57",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#C9DFD0",
  onSecondaryContainer: "#244A36",
  tertiary: "#9B594A",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#F4C9B5",
  onTertiaryContainer: "#57352D",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
  success: "#356B4A",
  warning: "#805600",
  scrim: "rgba(24, 21, 31, 0.44)",
};

export const darkColors: ColorScheme = {  background: "#252331",
  onBackground: "#F4F0FA",
  surface: "#252331",
  surfaceContainerLowest: "#201F2A",
  surfaceContainerLow: "#302D3E",
  surfaceContainer: "#343043",
  surfaceContainerHigh: "#3A3548",
  onSurface: "#F4F0FA",
  onSurfaceVariant: "#B9B3C4",
  outline: "#938C9F",
  outlineVariant: "#4A4559",
  primary: "#B9A8E2",
  onPrimary: "#30234F",
  primaryContainer: "#51466D",
  onPrimaryContainer: "#F2ECFF",
  secondary: "#A9CDB8",
  onSecondary: "#20372A",
  secondaryContainer: "#395B58",
  onSecondaryContainer: "#D7F2E3",
  tertiary: "#F0B6A3",
  onTertiary: "#482B22",
  tertiaryContainer: "#68464B",
  onTertiaryContainer: "#FFDED4",
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  success: "#A9D5B5",
  warning: "#F1C66D",
  scrim: "rgba(0, 0, 0, 0.55)",
};

export const amoledColors: ColorScheme = {
  ...darkColors,
  background: "#000000",
  onBackground: "#F4F0FA",
  surface: "#000000",
  surfaceContainerLowest: "#050505",
  surfaceContainerLow: "#0B0B0B",
  surfaceContainer: "#111111",
  surfaceContainerHigh: "#181818",
  onSurface: "#F4F0FA",
  onSurfaceVariant: "#B9B3C4",
  outline: "#6F6975",
  outlineVariant: "#252525",
  scrim: "rgba(0, 0, 0, 0.7)",
};

export const brandColors = {
  primary: "#6853B8",
  primaryDeep: "#49378D",
  ink: "#282431",
} as const;

/**
 * Folder identity colours. These are decorative accents, never semantic status
 * colours, and each pair is chosen so the label stays readable on the tint.
 */
export const folderColors = {
  lavender: { background: "#D9CFF2", foreground: "#3B2F63" },
  mint: { background: "#C9DFD0", foreground: "#244A36" },
  sage: { background: "#8FAF9B", foreground: "#1E3629" },
  peach: { background: "#F4C9B5", foreground: "#57352D" },
  coral: { background: "#D98372", foreground: "#3F1912" },
  butter: { background: "#F1DDAE", foreground: "#57430F" },
  sky: { background: "#C7DDE9", foreground: "#23414F" },
  blue: { background: "#6A91A7", foreground: "#102B38" },
  lilac: { background: "#B9A8E2", foreground: "#2F2252" },
} as const;

export type FolderColorKey = keyof typeof folderColors;

export const defaultFolderColorKey: FolderColorKey = "lavender";

const folderColorKeys = Object.keys(folderColors) as FolderColorKey[];

export function isFolderColorKey(value: unknown): value is FolderColorKey {
  return typeof value === "string" && value in folderColors;
}

/** Stable accent for a folder that has no colour assigned yet. */
export function pickFolderColorKey(seed: string): FolderColorKey {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1_000_003;
  }
  return folderColorKeys[hash % folderColorKeys.length] ?? defaultFolderColorKey;
}
