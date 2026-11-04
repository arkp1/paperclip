import { useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const INK_SIZE = 180;

type ScalePressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  inkColor?: string;
  children: ReactNode;
};

/**
 * Press feedback based on scale, with an optional radial ink reaction. The ink
 * is drawn inside the component so rounded pills never show a rectangular
 * Android ripple outline.
 */
export function ScalePressable({
  style,
  scaleTo = 0.98,
  inkColor,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const inkScale = useRef(new Animated.Value(0)).current;
  const inkOpacity = useRef(new Animated.Value(0)).current;
  const [ink, setInk] = useState<{ x: number; y: number } | null>(null);
  const reduceMotion = useReducedMotion();

  const animateTo = (value: number) => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }

    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const startInk = (x: number, y: number) => {
    if (!inkColor || reduceMotion) {
      return;
    }

    setInk({ x, y });
    inkScale.setValue(0);
    inkOpacity.setValue(0.18);
    Animated.parallel([
      Animated.timing(inkScale, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(inkOpacity, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setInk(null);
      }
    });
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          animateTo(scaleTo);
          startInk(event.nativeEvent.locationX, event.nativeEvent.locationY);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {ink && inkColor ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: ink.x - INK_SIZE / 2,
            top: ink.y - INK_SIZE / 2,
            width: INK_SIZE,
            height: INK_SIZE,
            borderRadius: INK_SIZE / 2,
            backgroundColor: inkColor,
            opacity: inkOpacity,
            transform: [{ scale: inkScale }],
          }}
        />
      ) : null}
      {children}
    </AnimatedPressable>
  );
}
