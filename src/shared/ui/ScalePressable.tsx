import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useRef, useState, type ReactNode } from "react";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useTheme } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const INK_SIZE = 180;

type ScalePressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Controls the animated press feedback. */
  pressFeedback?: "radial" | "scale" | "none";
  scaleTo?: number;
  inkColor?: string;
  children: ReactNode;
};

/**
 * Shared press feedback. Radial ink is clipped to the rounded bounds of the
 * control so it can never leak into adjacent UI. A few controls opt into the
 * older scale feedback instead.
 */
export function ScalePressable({
  style,
  pressFeedback = "radial",
  scaleTo = 0.98,
  inkColor,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: ScalePressableProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const inkX = useSharedValue(0);
  const inkY = useSharedValue(0);
  const inkScale = useSharedValue(0);
  const inkOpacity = useSharedValue(0);
  const [inkVisible, setInkVisible] = useState(false);
  const inkGeneration = useRef(0);
  const radialColor = inkColor ?? theme.colors.primary;
  const flattenedStyle = StyleSheet.flatten(style);
  const borderRadius = flattenedStyle?.borderRadius ?? 0;

  const finishInk = (generation: number) => {
    if (generation === inkGeneration.current) {
      setInkVisible(false);
    }
  };

  const startInk = (x: number, y: number) => {
    if (reduceMotion || pressFeedback !== "radial") {
      return;
    }

    const generation = inkGeneration.current + 1;
    inkGeneration.current = generation;
    inkX.value = x;
    inkY.value = y;
    inkScale.value = 0;
    inkOpacity.value = inkColor ? 0.18 : 0.14;
    setInkVisible(true);

    inkScale.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
    inkOpacity.value = withTiming(
      0,
      {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(finishInk)(generation);
        }
      }
    );
  };

  const animateScale = (value: number) => {
    if (reduceMotion || pressFeedback !== "scale") {
      return;
    }
    scale.value = withSpring(value, {
      damping: 18,
      stiffness: 340,
      mass: 0.45,
    });
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const inkStyle = useAnimatedStyle(() => ({
    opacity: inkOpacity.value,
    transform: [
      { translateX: inkX.value },
      { translateY: inkY.value },
      { scale: inkScale.value },
    ],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          animateScale(scaleTo);
          startInk(event.nativeEvent.locationX, event.nativeEvent.locationY);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateScale(1);
        onPressOut?.(event);
      }}
      style={[style, pressFeedback === "scale" ? scaleStyle : undefined]}
    >
      {inkVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.inkClip,
            { borderRadius },
          ]}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                left: -INK_SIZE / 2,
                top: -INK_SIZE / 2,
                width: INK_SIZE,
                height: INK_SIZE,
                borderRadius: INK_SIZE / 2,
                backgroundColor: radialColor,
              },
              inkStyle,
            ]}
          />
        </Animated.View>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  inkClip: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
});
