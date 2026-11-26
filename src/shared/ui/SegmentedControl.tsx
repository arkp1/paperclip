import { useEffect, useState } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { typography, useTheme } from "@/theme";

const AnimatedText = Animated.createAnimatedComponent(Text);
const MOTION_MS = 240;

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared M3E segmented control with one animated selection surface. The surface
 * translates only; labels are rendered independently above it.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const [visualIndex, setVisualIndex] = useState(selectedIndex);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const position = useSharedValue(selectedIndex);

  useEffect(() => {
    setVisualIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    position.value = reduceMotion
      ? visualIndex
      : withTiming(visualIndex, {
          duration: MOTION_MS,
          easing: Easing.bezier(0.2, 0, 0, 1),
        });
  }, [position, reduceMotion, visualIndex]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * (segmentWidth + 2) }],
  }));

  return (
    <View
      style={[
        styles.segmented,
        {
          backgroundColor: theme.colors.surfaceContainer,
          borderColor: theme.colors.outlineVariant,
        },
        style,
      ]}
      onLayout={(event) => {
        const available = event.nativeEvent.layout.width - 6 - 2 * (options.length - 1);
        setSegmentWidth(Math.max(0, available / options.length));
      }}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selection,
            {
              width: segmentWidth,
              backgroundColor: theme.colors.primaryContainer,
            },
            pillStyle,
          ]}
        />
      ) : null}

      {options.map((option, index) => (
        <ScalePressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityLabel={option.accessibilityLabel ?? option.label}
          accessibilityState={{ checked: index === visualIndex }}
          onPress={() => {
            setVisualIndex(index);
            onChange(option.value);
          }}
          scaleTo={0.97}
          style={styles.segment}
        >
          <SegmentLabel
            label={option.label}
            selected={index === visualIndex}
          />
        </ScalePressable>
      ))}
    </View>
  );
}

function SegmentLabel({
  label,
  selected,
}: {
  label: string;
  selected: boolean;
}) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? selected
        ? 1
        : 0
      : withTiming(selected ? 1 : 0, {
          duration: MOTION_MS,
          easing: Easing.bezier(0.2, 0, 0, 1),
        });
  }, [progress, reduceMotion, selected]);

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.onSurfaceVariant, theme.colors.onPrimaryContainer]
    ),
  }));

  return (
    <AnimatedText
      numberOfLines={1}
      style={[
        typography.labelLarge,
        { fontFamily: "GoogleSansFlex-Regular" },
        textStyle,
      ]}
    >
      {label}
    </AnimatedText>
  );
}

const styles = {
  segmented: {
    width: "100%" as const,
    flexDirection: "row" as const,
    gap: 2,
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden" as const,
  },
  selection: {
    position: "absolute" as const,
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 999,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 999,
    paddingHorizontal: 8,
    zIndex: 1,
  },
};
