import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  readerFontFamily,
  readerPalette,
  type ReaderBackground,
  type ReaderFont,
  type ReaderPreferences,
  type ReaderAlign,
  type ReaderWidth,
} from "@/features/reader/hooks/useReaderPreferences";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/reader/ReaderSettingsSheet.styles";
import { useTheme } from "@/theme";

type ReaderSettingsSheetProps = {
  visible: boolean;
  preferences: ReaderPreferences;
  onClose: () => void;
  onFontChange: (font: ReaderFont) => void;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (lineHeight: number) => void;
  onParagraphSpacingChange: (spacing: number) => void;
  onWidthChange: (width: ReaderWidth) => void;
  onAlignChange: (align: ReaderAlign) => void;
  onBackgroundChange: (background: ReaderBackground) => void;
  onPaginateChange: (paginate: boolean) => void;
};

const FONTS: { key: ReaderFont; label: string }[] = [
  { key: "sans", label: "Sans" },
  { key: "serif", label: "Serif" },
  { key: "mono", label: "Mono" },
];

const BACKGROUNDS: { key: ReaderBackground; label: string }[] = [
  { key: "white", label: "White" },
  { key: "sepia", label: "Sepia" },
  { key: "grey", label: "Grey" },
  { key: "black", label: "Black" },
];

const WIDTHS: { key: ReaderWidth; label: string }[] = [
  { key: "narrow", label: "Narrow" },
  { key: "standard", label: "Standard" },
  { key: "wide", label: "Wide" },
];

const ALIGNS: { key: ReaderAlign; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "justify", label: "Justify" },
];

/**
 * Reader appearance controls for typeface, size, and paper colour.
 */
export function ReaderSettingsSheet({
  visible,
  preferences,
  onClose,
  onFontChange,
  onFontSizeChange,
  onLineHeightChange,
  onParagraphSpacingChange,
  onWidthChange,
  onAlignChange,
  onBackgroundChange,
  onPaginateChange,
}: ReaderSettingsSheetProps) {
  const { theme } = useTheme();

  return (
    <AppDialog
      visible={visible}
      onRequestClose={onClose}
      title="Reading settings"
      description="Tune the page for comfortable reading."
      actions={<Button label="Done" variant="filled" onPress={onClose} />}
    >
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Typeface
          </AppText>
          <View style={styles.optionRow}>
            {FONTS.map((option) => {
              const selected = preferences.font === option.key;
              return (
                <ScalePressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} typeface`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => onFontChange(option.key)}
                  scaleTo={0.96}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceContainer,
                    },
                  ]}
                >
                  <AppText
                    variant="labelLarge"
                    color={
                      selected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                    style={{ fontFamily: readerFontFamily(option.key) }}
                  >
                    {option.label}
                  </AppText>
                </ScalePressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Text size
          </AppText>
          <View style={styles.sizeRow}>
            <IconButton
              icon="minus"
              label="Decrease text size"
              onPress={() => onFontSizeChange(preferences.fontSize - 2)}
              disabled={preferences.fontSize <= 14}
            />
            <AppText variant="titleMedium" style={styles.sizeValue}>
              {preferences.fontSize}
            </AppText>
            <IconButton
              icon="plus"
              label="Increase text size"
              onPress={() => onFontSizeChange(preferences.fontSize + 2)}
              disabled={preferences.fontSize >= 28}
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Line height
          </AppText>
          <View style={styles.sizeRow}>
            <IconButton
              icon="minus"
              label="Decrease line height"
              onPress={() => onLineHeightChange(preferences.lineHeight - 0.1)}
              disabled={preferences.lineHeight <= 1.2}
            />
            <AppText variant="titleMedium" style={styles.sizeValue}>
              {preferences.lineHeight.toFixed(1)}×
            </AppText>
            <IconButton
              icon="plus"
              label="Increase line height"
              onPress={() => onLineHeightChange(preferences.lineHeight + 0.1)}
              disabled={preferences.lineHeight >= 2.2}
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Paragraph spacing
          </AppText>
          <View style={styles.sizeRow}>
            <IconButton
              icon="minus"
              label="Decrease paragraph spacing"
              onPress={() =>
                onParagraphSpacingChange(preferences.paragraphSpacing - 2)
              }
              disabled={preferences.paragraphSpacing <= 8}
            />
            <AppText variant="titleMedium" style={styles.sizeValue}>
              {preferences.paragraphSpacing}
            </AppText>
            <IconButton
              icon="plus"
              label="Increase paragraph spacing"
              onPress={() =>
                onParagraphSpacingChange(preferences.paragraphSpacing + 2)
              }
              disabled={preferences.paragraphSpacing >= 32}
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Reading width
          </AppText>
          <View style={styles.optionRow}>
            {WIDTHS.map((option) => {
              const selected = preferences.width === option.key;
              return (
                <ScalePressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} reading width`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => onWidthChange(option.key)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceContainer,
                    },
                  ]}
                >
                  <AppText
                    variant="labelLarge"
                    color={
                      selected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  >
                    {option.label}
                  </AppText>
                </ScalePressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Text alignment
          </AppText>
          <View style={styles.optionRow}>
            {ALIGNS.map((option) => {
              const selected = preferences.align === option.key;
              return (
                <ScalePressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} text alignment`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => onAlignChange(option.key)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceContainer,
                    },
                  ]}
                >
                  <AppText
                    variant="labelLarge"
                    color={
                      selected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  >
                    {option.label}
                  </AppText>
                </ScalePressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Page colour
          </AppText>
          <View style={styles.optionRow}>
            {BACKGROUNDS.map((option) => {
              const selected = preferences.background === option.key;
              const palette = readerPalette(option.key);
              return (
                <ScalePressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} page colour`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => onBackgroundChange(option.key)}
                  scaleTo={0.94}
                  style={[
                    styles.colourSwatch,
                    {
                      backgroundColor: palette.background,
                      borderColor: selected ? theme.colors.primary : theme.colors.outline,
                    },
                  ]}
                >
                  {selected ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={palette.text}
                    />
                  ) : null}
                </ScalePressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Pagination
          </AppText>
          <ScalePressable
            accessibilityRole="switch"
            accessibilityLabel="Pagination"
            accessibilityState={{ checked: preferences.paginate }}
            onPress={() => onPaginateChange(!preferences.paginate)}
            style={styles.toggleRow}
          >
            <AppText variant="bodyMedium">Horizontal pages</AppText>
            <ReaderToggle
              value={preferences.paginate}
              activeColor={theme.colors.primary}
              inactiveColor={theme.colors.surfaceContainerHigh}
              thumbColor={
                preferences.paginate
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
              }
            />
          </ScalePressable>
        </View>
      </ScrollView>
    </AppDialog>
  );
}

/**
 * Sliding Material switch with a Reanimated thumb so the state change is
 * visible instead of snapping between positions.
 */
function ReaderToggle({
  value,
  activeColor,
  inactiveColor,
  thumbColor,
}: {
  value: boolean;
  activeColor: string;
  inactiveColor: string;
  thumbColor: string;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = value ? 1 : 0;
      return;
    }
    progress.value = withTiming(value ? 1 : 0, {
      duration: 180,
      easing: Easing.bezier(0.2, 0, 0, 1),
    });
  }, [progress, reduceMotion, value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
  }));
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    ),
  }));

  return (
    <Animated.View style={[styles.toggle, trackStyle]}>
      <Animated.View
        style={[
          styles.toggleThumb,
          { backgroundColor: thumbColor },
          thumbStyle,
        ]}
      />
    </Animated.View>
  );
}
