import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getBarBottomOffset } from "@/shared/ui/FloatingBottomNavigation";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { haptics } from "@/shared/utils/haptics";
import { spacing, useTheme } from "@/theme";

type FloatingSaveButtonProps = {
  onPress: () => void;
};

/**
 * Standalone circular Save action. It intentionally sits outside the navigation
 * capsule and uses the same bottom inset as the nav bar.
 */
export function FloatingSaveButton({ onPress }: FloatingSaveButtonProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel="Save a link"
      onPress={() => {
        haptics.light();
        onPress();
      }}
      scaleTo={0.94}
      inkColor={theme.colors.onPrimary}
      style={[
        styles.button,
        {
          bottom: getBarBottomOffset(insets.bottom) + 4,
          backgroundColor: theme.colors.primary,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="plus"
        size={26}
        color={theme.colors.onPrimary}
      />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: spacing[4],
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#1A1625",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
});
