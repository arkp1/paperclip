import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/shared/ui/AppText";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { spacing, useTheme } from "@/theme";

type Listener = (message: string) => void;

let listener: Listener | null = null;

export const appSnackbar = {
  show(message: string): void {
    listener?.(message);
  },
};

export function AppSnackbarHost() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = (next) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      setMessage(next);
      timer.current = setTimeout(() => {
        setMessage(null);
        timer.current = null;
      }, 3200);
    };
    return () => {
      listener = null;
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(160)}
      exiting={reduceMotion ? undefined : FadeOutDown.duration(120)}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.snackbar,
        {
          bottom: insets.bottom + 72,
          backgroundColor: theme.colors.inverseSurface,
        },
      ]}
    >
      <AppText variant="bodyMedium" color={theme.colors.inverseOnSurface}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: "absolute",
    left: spacing[4],
    right: spacing[4],
    zIndex: 100,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 16,
    elevation: 8,
  },
});
