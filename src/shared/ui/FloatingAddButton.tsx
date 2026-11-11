import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { AppText } from "@/shared/ui/AppText";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/shared/ui/FloatingAddButton.styles";
import { spacing, useTheme } from "@/theme";

type FloatingAddButtonProps = {
  onPress: () => void;
  collapsed?: boolean;
};

/**
 * Extended Material 3 FAB that collapses to a circular + while scrolling down
 * and expands back into the "Save link" pill when scrolling up.
 */
export function FloatingAddButton({
  onPress,
  collapsed = false,
}: FloatingAddButtonProps) {
  const { theme } = useTheme();
  const bottom = useFloatingNavigationInset();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(collapsed ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = collapsed ? 1 : 0;
      return;
    }

    progress.value = withTiming(collapsed ? 1 : 0, {
      duration: 180,
      easing: Easing.bezier(0.2, 0, 0, 1),
    });
  }, [collapsed, progress, reduceMotion]);

  const labelStyle = useAnimatedStyle(() => ({
    width: progress.value === 1 ? 0 : 64 - progress.value * 64,
    marginLeft: progress.value === 1 ? 0 : 8 - progress.value * 8,
  }));

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel="Save a link"
      onPress={onPress}
      scaleTo={1}
      inkColor={theme.colors.onPrimary}
      style={[
        styles.fab,
        {
          backgroundColor: theme.colors.primary,
          bottom,
          right: spacing[6],
        },
      ]}
    >
      <MaterialCommunityIcons
        name="plus"
        size={26}
        color={theme.colors.onPrimary}
      />
      <Animated.View style={[styles.label, labelStyle]}>
        <AppText variant="labelLarge" color={theme.colors.onPrimary} numberOfLines={1}>
          Save link
        </AppText>
      </Animated.View>
    </ScalePressable>
  );
}
