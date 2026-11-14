import { folderColors, type FolderColorKey } from "./colors";
import type { ThemeScheme } from "./themes";

export type FolderTone = {
  card: string;
  iconContainer: string;
  icon: string;
};

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

function parseHex(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized;
  return {
    r: Number.parseInt(full.slice(0, 2), 16) / 255,
    g: Number.parseInt(full.slice(2, 4), 16) / 255,
    b: Number.parseInt(full.slice(4, 6), 16) / 255,
  };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l: lightness };
  }
  const delta = max - min;
  const saturation =
    lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);
  let hue = 0;
  if (max === r) {
    hue = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  return { h: hue / 6, s: saturation, l: lightness };
}

function hslToHex({ h, s, l }: Hsl): string {
  const hue = ((h % 1) + 1) % 1;
  if (s === 0) {
    const value = Math.round(l * 255);
    return `#${[value, value, value]
      .map((part) => part.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };
  const toHex = (value: number) =>
    Math.round(value * 255).toString(16).padStart(2, "0");
  return `#${toHex(channel(hue + 1 / 3))}${toHex(channel(hue))}${toHex(
    channel(hue - 1 / 3)
  )}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generates a coordinated folder tone from the folder's persisted accent.
 * The card is the quietest layer, the icon tile is more saturated, and the
 * folder glyph carries the strongest contrast.
 */
export function folderTone(
  key: FolderColorKey,
  scheme: ThemeScheme,
  appBackground: string
): FolderTone {
  const seed = rgbToHsl(parseHex(folderColors[key].foreground));
  const isAmoled = parseHex(appBackground).r < 0.04 &&
    parseHex(appBackground).g < 0.04 &&
    parseHex(appBackground).b < 0.04;

  if (scheme === "dark") {
    const cardLightness = isAmoled ? 0.09 : 0.14;
    return {
      card: hslToHex({
        h: seed.h,
        s: clamp(seed.s * 0.58, 0.14, 0.42),
        l: cardLightness,
      }),
      iconContainer: hslToHex({
        h: seed.h,
        s: clamp(seed.s * 0.82, 0.24, 0.58),
        l: isAmoled ? 0.22 : 0.28,
      }),
      icon: hslToHex({
        h: seed.h,
        s: clamp(seed.s * 0.78, 0.22, 0.62),
        l: 0.8,
      }),
    };
  }

  return {
    card: hslToHex({
      h: seed.h,
      s: clamp(seed.s * 0.58, 0.2, 0.48),
      l: 0.94,
    }),
    iconContainer: hslToHex({
      h: seed.h,
      s: clamp(seed.s * 0.88, 0.3, 0.62),
      l: 0.8,
    }),
    icon: hslToHex({
      h: seed.h,
      s: clamp(seed.s, 0.3, 0.72),
      l: 0.29,
    }),
  };
}
