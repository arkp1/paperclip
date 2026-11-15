import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import { styles } from "@/styles/shared/ui/OverflowMenu.styles";
import { motion, useTheme } from "@/theme";

type OverflowMenuProps = {
  visible: boolean;
  anchor: MenuAnchor;
  onClose: () => void;
  children: ReactNode;
};

const MENU_WIDTH = 236;

/**
 * Anchored three-dot overflow menu. It opens from the measured trigger point
 * so the top-right transform origin follows the actual button position.
 */
export function OverflowMenu({
  visible,
  anchor,
  onClose,
  children,
}: OverflowMenuProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [rendered, setRendered] = useState(visible);
  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = visible ? 1 : 0;
      setRendered(visible);
      return;
    }

    if (visible) {
      setRendered(true);
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: motion.menuIn,
        easing: Easing.bezier(0.2, 0, 0, 1),
      });
      return;
    }

    progress.value = withTiming(
      0,
      {
        duration: motion.menuOut,
        easing: Easing.bezier(0.4, 0, 1, 1),
      },
      (finished) => {
        if (finished && !visibleRef.current) {
          runOnJS(setRendered)(false);
        }
      }
    );
  }, [progress, reduceMotion, visible]);

  useEffect(() => {
    if (!rendered) {
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, rendered]);

  const surfaceStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 4 },
      { scale: 0.9 + progress.value * 0.1 },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  if (!rendered) {
    return null;
  }

  const top = Math.max(
    80,
    Math.min(anchor.y - insets.top + 8, height - insets.bottom - 220)
  );
  const menuWidth = Math.min(MENU_WIDTH, width - 24);
  const anchorX = anchor.x > 0 ? anchor.x : width - 12;
  const right = Math.min(
    Math.max(12, width - anchorX),
    Math.max(12, width - menuWidth - 12)
  );
  const maxHeight = Math.max(160, height - top - insets.bottom - 16);

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.scrim,
          { backgroundColor: theme.colors.scrim },
          scrimStyle,
        ]}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="Dismiss menu"
      />
      <Animated.View
        accessibilityViewIsModal
        renderToHardwareTextureAndroid
        style={[
          styles.menu,
          {
            top,
            right,
            width: menuWidth,
            maxHeight,
            backgroundColor: theme.colors.surfaceContainerLowest,
            borderColor: theme.colors.outlineVariant,
          },
          surfaceStyle,
        ]}
      >
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
