import { View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { styles } from "@/styles/shared/ui/ActionRow.styles";
import { useTheme } from "@/theme";

type ActionRowProps = {
  icon: IconName;
  label: string;
  supporting?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  selected?: boolean;
  trailing?: "check" | "chevron";
  role?: "button" | "menuitem";
};

/**
 * Shared popup row. A chevron is opt-in: only actions that open another screen
 * or sheet should display one.
 */
export function ActionRow({
  icon,
  label,
  supporting,
  onPress,
  destructive = false,
  disabled = false,
  selected = false,
  trailing,
  role = "button",
}: ActionRowProps) {
  const { theme } = useTheme();
  const contentColor = destructive
    ? theme.colors.error
    : theme.colors.onSurface;
  const iconColor = disabled
    ? theme.colors.popupMuted
    : destructive
      ? theme.colors.error
      : selected
        ? theme.colors.primary
        : theme.colors.popupMuted;
  const resolvedTrailing = selected ? "check" : trailing;

  return (
    <ScalePressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.97}
      style={[
        styles.row,
        selected
          ? { backgroundColor: theme.colors.primaryContainer }
          : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      <View style={styles.copy}>
        <AppText
          variant="bodyLarge"
          color={disabled ? theme.colors.popupMuted : contentColor}
        >
          {label}
        </AppText>
        {supporting ? (
          <AppText variant="bodySmall" color={theme.colors.popupMuted}>
            {supporting}
          </AppText>
        ) : null}
      </View>
      {resolvedTrailing === "check" ? (
        <MaterialCommunityIcons
          name="check"
          size={20}
          color={theme.colors.primary}
        />
      ) : resolvedTrailing === "chevron" ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.colors.popupMuted}
        />
      ) : null}
    </ScalePressable>
  );
}
