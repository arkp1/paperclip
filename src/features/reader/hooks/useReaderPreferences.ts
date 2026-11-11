import { useEffect, useState } from "react";

import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";

export type ReaderFont = "sans" | "serif" | "mono";
export type ReaderBackground = "white" | "sepia" | "grey" | "black";

export type ReaderPreferences = {
  font: ReaderFont;
  fontSize: number;
  background: ReaderBackground;
  paginate: boolean;
};

const FONT_SETTING = "reader_font";
const SIZE_SETTING = "reader_font_size";
const BACKGROUND_SETTING = "reader_background";
const PAGINATE_SETTING = "reader_paginate";

const DEFAULTS: ReaderPreferences = {
  font: "sans",
  fontSize: 18,
  background: "white",
  paginate: false,
};

export function readerFontFamily(font: ReaderFont): string {
  if (font === "serif") {
    return "serif";
  }
  if (font === "mono") {
    return "monospace";
  }
  return "GoogleSansFlex-Regular";
}

export function readerPalette(background: ReaderBackground) {
  switch (background) {
    case "sepia":
      return { background: "#F4ECD8", text: "#3B3023", muted: "#756550" };
    case "grey":
      return { background: "#303234", text: "#ECE9E4", muted: "#B9B4AD" };
    case "black":
      return { background: "#000000", text: "#F1EFEA", muted: "#B9B4AD" };
    case "white":
    default:
      return { background: "#FFFFFF", text: "#1B1B1B", muted: "#5D5A57" };
  }
}

function isReaderFont(value: string | null): value is ReaderFont {
  return value === "sans" || value === "serif" || value === "mono";
}

function isReaderBackground(value: string | null): value is ReaderBackground {
  return (
    value === "white" ||
    value === "sepia" ||
    value === "grey" ||
    value === "black"
  );
}

/**
 * Reads and persists the reader's font, size, and paper colour preferences.
 */
export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getSetting(FONT_SETTING),
      getSetting(SIZE_SETTING),
      getSetting(BACKGROUND_SETTING),
      getSetting(PAGINATE_SETTING),
    ])
      .then(([font, size, background, paginate]) => {
        if (cancelled) {
          return;
        }
        const parsedSize = Number.parseInt(size ?? "", 10);
        setPreferences({
          font: isReaderFont(font) ? font : DEFAULTS.font,
          fontSize:
            Number.isFinite(parsedSize) && parsedSize >= 14 && parsedSize <= 28
              ? parsedSize
              : DEFAULTS.fontSize,
          background: isReaderBackground(background)
            ? background
            : DEFAULTS.background,
          paginate: paginate === "true",
        });
      })
      .catch(() => {
        // Keep readable defaults if preferences cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setFont = (font: ReaderFont) => {
    setPreferences((previous) => ({ ...previous, font }));
    void setSetting(FONT_SETTING, font).catch(() => undefined);
  };

  const setFontSize = (fontSize: number) => {
    const clamped = Math.max(14, Math.min(28, fontSize));
    setPreferences((previous) => ({ ...previous, fontSize: clamped }));
    void setSetting(SIZE_SETTING, String(clamped)).catch(() => undefined);
  };

  const setBackground = (background: ReaderBackground) => {
    setPreferences((previous) => ({ ...previous, background }));
    void setSetting(BACKGROUND_SETTING, background).catch(() => undefined);
  };

  const setPaginate = (paginate: boolean) => {
    setPreferences((previous) => ({ ...previous, paginate }));
    void setSetting(PAGINATE_SETTING, paginate ? "true" : "false").catch(
      () => undefined
    );
  };

  return {
    preferences,
    setFont,
    setFontSize,
    setBackground,
    setPaginate,
  };
}


