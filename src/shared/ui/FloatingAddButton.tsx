import { useEffect, useRef } from "react";
import { Animated } from "react-native";

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
  const progress = useRef(new Animated.Value(collapsed ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(collapsed ? 1 : 0);
      return;
    }

    Animated.timing(progress, {
      toValue: collapsed ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [collapsed, progress, reduceMotion]);

  const labelWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [64, 0],
  });
  const labelMargin = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel="Save a link"
      onPress={onPress}
      scaleTo={0.94}
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
      <Animated.View
        style={[styles.label, { width: labelWidth, marginLeft: labelMargin }]}
      >
        <AppText variant="labelLarge" color={theme.colors.onPrimary} numberOfLines={1}>
          Save link
        </AppText>
      </Animated.View>
    </ScalePressable>
  );
}
