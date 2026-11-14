import { useEffect, useRef, useState } from "react";

import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";

export type ReaderFont = "sans" | "serif" | "mono";
export type ReaderBackground = "white" | "sepia" | "grey" | "black";
export type ReaderWidth = "narrow" | "standard" | "wide";
export type ReaderAlign = "left" | "justify";

export type ReaderPreferences = {
  font: ReaderFont;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  width: ReaderWidth;
  align: ReaderAlign;
  background: ReaderBackground;
  paginate: boolean;
};

const FONT_SETTING = "reader_font";
const SIZE_SETTING = "reader_font_size";
const LINE_HEIGHT_SETTING = "reader_line_height";
const PARAGRAPH_SPACING_SETTING = "reader_paragraph_spacing";
const WIDTH_SETTING = "reader_width";
const ALIGN_SETTING = "reader_align";
const BACKGROUND_SETTING = "reader_background";
const PAGINATE_SETTING = "reader_paginate";

const DEFAULTS: ReaderPreferences = {
  font: "sans",
  fontSize: 18,
  lineHeight: 1.72,
  paragraphSpacing: 16,
  width: "standard",
  align: "left",
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

function isReaderWidth(value: string | null): value is ReaderWidth {
  return value === "narrow" || value === "standard" || value === "wide";
}

function isReaderAlign(value: string | null): value is ReaderAlign {
  return value === "left" || value === "justify";
}

/**
 * Reads and persists the reader's font, size, and paper colour preferences.
 */
export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(DEFAULTS);
  const userChanged = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getSetting(FONT_SETTING),
      getSetting(SIZE_SETTING),
      getSetting(LINE_HEIGHT_SETTING),
      getSetting(PARAGRAPH_SPACING_SETTING),
      getSetting(WIDTH_SETTING),
      getSetting(ALIGN_SETTING),
      getSetting(BACKGROUND_SETTING),
      getSetting(PAGINATE_SETTING),
    ])
      .then(
        ([
          font,
          size,
          lineHeight,
          paragraphSpacing,
          width,
          align,
          background,
          paginate,
        ]) => {
          if (cancelled || userChanged.current) {
            return;
          }
          const parsedSize = Number.parseInt(size ?? "", 10);
          const parsedLineHeight = Number.parseFloat(lineHeight ?? "");
          const parsedSpacing = Number.parseInt(paragraphSpacing ?? "", 10);
          setPreferences({
            font: isReaderFont(font) ? font : DEFAULTS.font,
            fontSize:
              Number.isFinite(parsedSize) && parsedSize >= 14 && parsedSize <= 28
                ? parsedSize
                : DEFAULTS.fontSize,
            lineHeight:
              Number.isFinite(parsedLineHeight) &&
              parsedLineHeight >= 1.2 &&
              parsedLineHeight <= 2.2
                ? parsedLineHeight
                : DEFAULTS.lineHeight,
            paragraphSpacing:
              Number.isFinite(parsedSpacing) &&
              parsedSpacing >= 8 &&
              parsedSpacing <= 32
                ? parsedSpacing
                : DEFAULTS.paragraphSpacing,
            width: isReaderWidth(width) ? width : DEFAULTS.width,
            align: isReaderAlign(align) ? align : DEFAULTS.align,
            background: isReaderBackground(background)
              ? background
              : DEFAULTS.background,
            paginate: paginate === "true",
          });
        }
      )
      .catch(() => {
        // Keep readable defaults if preferences cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setFont = (font: ReaderFont) => {
    userChanged.current = true;
    setPreferences((previous) => ({ ...previous, font }));
    void setSetting(FONT_SETTING, font).catch(() => undefined);
  };

  const setFontSize = (fontSize: number) => {
    userChanged.current = true;
    const clamped = Math.max(14, Math.min(28, fontSize));
    setPreferences((previous) => ({ ...previous, fontSize: clamped }));
    void setSetting(SIZE_SETTING, String(clamped)).catch(() => undefined);
  };

  const setLineHeight = (lineHeight: number) => {
    userChanged.current = true;
    const clamped = Math.max(1.2, Math.min(2.2, lineHeight));
    setPreferences((previous) => ({ ...previous, lineHeight: clamped }));
    void setSetting(LINE_HEIGHT_SETTING, String(clamped)).catch(() => undefined);
  };

  const setParagraphSpacing = (paragraphSpacing: number) => {
    userChanged.current = true;
    const clamped = Math.max(8, Math.min(32, paragraphSpacing));
    setPreferences((previous) => ({ ...previous, paragraphSpacing: clamped }));
    void setSetting(PARAGRAPH_SPACING_SETTING, String(clamped)).catch(
      () => undefined
    );
  };

  const setWidth = (width: ReaderWidth) => {
    userChanged.current = true;
    setPreferences((previous) => ({ ...previous, width }));
    void setSetting(WIDTH_SETTING, width).catch(() => undefined);
  };

  const setAlign = (align: ReaderAlign) => {
    userChanged.current = true;
    setPreferences((previous) => ({ ...previous, align }));
    void setSetting(ALIGN_SETTING, align).catch(() => undefined);
  };

  const setBackground = (background: ReaderBackground) => {
    userChanged.current = true;
    setPreferences((previous) => ({ ...previous, background }));
    void setSetting(BACKGROUND_SETTING, background).catch(() => undefined);
  };

  const setPaginate = (paginate: boolean) => {
    userChanged.current = true;
    setPreferences((previous) => ({ ...previous, paginate }));
    void setSetting(PAGINATE_SETTING, paginate ? "true" : "false").catch(
      () => undefined
    );
  };

  return {
    preferences,
    setFont,
    setFontSize,
    setLineHeight,
    setParagraphSpacing,
    setWidth,
    setAlign,
    setBackground,
    setPaginate,
  };
}
