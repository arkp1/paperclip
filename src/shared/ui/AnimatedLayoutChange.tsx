import { useEffect, useRef, type ReactNode } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";

type AnimatedLayoutChangeProps = {
  transitionKey: string;
  direction?: 1 | -1;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Directional slide for content that swaps layout (for example, grid → list →
 * cards). No opacity/fade is used.
 */
export function AnimatedLayoutChange({
  transitionKey,
  direction = 1,
  children,
  style,
}: AnimatedLayoutChangeProps) {
  const progress = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [progress, reduceMotion, transitionKey]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [direction * 28, 0],
  });

  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        { transform: [{ translateX }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
