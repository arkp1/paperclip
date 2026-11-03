import { useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScalePressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: ReactNode;
};

/**
 * Press feedback based on scale rather than a ripple, so rounded pills and
 * cards never show a rectangular ripple outline.
 */
export function ScalePressable({
  style,
  scaleTo = 0.98,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
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

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          animateTo(scaleTo);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
