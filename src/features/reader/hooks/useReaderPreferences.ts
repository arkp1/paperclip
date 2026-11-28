import { useEffect, useRef, useState } from "react";
import { appAlert as Alert } from "@/shared/ui/appAlert";

import {
  getSetting,
  setSetting,
  type AppSettingKey,
} from "@/core/preferences/appSettingsRepository";

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
  width: "wide",
  align: "left",
  background: "white",
  paginate: false,
};

export function readerFontFamily(font: ReaderFont): string {
  if (font === "serif") {
    return "NotoSerif-Regular";
  }
  if (font === "mono") {
    return "JetBrainsMono-Regular";
  }
  return "GoogleSansFlex-Regular";
}

/**
 * Serif and mono faces have different vertical metrics than Google Sans Flex.
 * Keep the user's saved multiplier as the sans baseline and normalize it so a
 * line-height choice remains visually consistent across typefaces.
 */
export function readerLineHeightMultiplier(
  font: ReaderFont,
  lineHeight: number
): number {
  if (font === "serif") {
    return lineHeight * (1.55 / 1.72);
  }
  if (font === "mono") {
    return lineHeight * (1.6 / 1.72);
  }
  return lineHeight;
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
  const changedFields = useRef(new Set<keyof ReaderPreferences>());
  const latestValues = useRef(new Map<AppSettingKey, string>());

  const reportSaveError = (key: AppSettingKey, value: string) => {
    if (latestValues.current.get(key) !== value) {
      return;
    }
    Alert.alert(
      "Reader settings",
      "The setting changed for this session but could not be saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retry",
          onPress: () => {
            if (latestValues.current.get(key) !== value) {
              return;
            }
            void setSetting(key, value).catch(() =>
              reportSaveError(key, value)
            );
          },
        },
      ]
    );
  };

  const persist = (key: AppSettingKey, value: string) => {
    latestValues.current.set(key, value);
    void setSetting(key, value).catch(() => reportSaveError(key, value));
  };

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
          if (cancelled) {
            return;
          }
          const parsedSize = Number.parseInt(size ?? "", 10);
          const parsedLineHeight = Number.parseFloat(lineHeight ?? "");
          const parsedSpacing = Number.parseInt(paragraphSpacing ?? "", 10);
          const loaded: ReaderPreferences = {
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
          };
          setPreferences((current) => {
            const changed = changedFields.current;
            return {
              font: changed.has("font") ? current.font : loaded.font,
              fontSize: changed.has("fontSize")
                ? current.fontSize
                : loaded.fontSize,
              lineHeight: changed.has("lineHeight")
                ? current.lineHeight
                : loaded.lineHeight,
              paragraphSpacing: changed.has("paragraphSpacing")
                ? current.paragraphSpacing
                : loaded.paragraphSpacing,
              width: changed.has("width") ? current.width : loaded.width,
              align: changed.has("align") ? current.align : loaded.align,
              background: changed.has("background")
                ? current.background
                : loaded.background,
              paginate: changed.has("paginate")
                ? current.paginate
                : loaded.paginate,
            };
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
    changedFields.current.add("font");
    setPreferences((previous) => ({ ...previous, font }));
    persist(FONT_SETTING, font);
  };

  const setFontSize = (fontSize: number) => {
    changedFields.current.add("fontSize");
    const clamped = Math.max(14, Math.min(28, fontSize));
    setPreferences((previous) => ({ ...previous, fontSize: clamped }));
    persist(SIZE_SETTING, String(clamped));
  };

  const setLineHeight = (lineHeight: number) => {
    changedFields.current.add("lineHeight");
    const clamped = Math.max(1.2, Math.min(2.2, lineHeight));
    setPreferences((previous) => ({ ...previous, lineHeight: clamped }));
    persist(LINE_HEIGHT_SETTING, String(clamped));
  };

  const setParagraphSpacing = (paragraphSpacing: number) => {
    changedFields.current.add("paragraphSpacing");
    const clamped = Math.max(8, Math.min(32, paragraphSpacing));
    setPreferences((previous) => ({ ...previous, paragraphSpacing: clamped }));
    persist(PARAGRAPH_SPACING_SETTING, String(clamped));
  };

  const setWidth = (width: ReaderWidth) => {
    changedFields.current.add("width");
    setPreferences((previous) => ({ ...previous, width }));
    persist(WIDTH_SETTING, width);
  };

  const setAlign = (align: ReaderAlign) => {
    changedFields.current.add("align");
    setPreferences((previous) => ({ ...previous, align }));
    persist(ALIGN_SETTING, align);
  };

  const setBackground = (background: ReaderBackground) => {
    changedFields.current.add("background");
    setPreferences((previous) => ({ ...previous, background }));
    persist(BACKGROUND_SETTING, background);
  };

  const setPaginate = (paginate: boolean) => {
    changedFields.current.add("paginate");
    setPreferences((previous) => ({ ...previous, paginate }));
    persist(PAGINATE_SETTING, paginate ? "true" : "false");
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
