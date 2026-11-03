import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minHeight: 48,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: 12,
  },
  label: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});
