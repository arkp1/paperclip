import { StyleSheet } from "react-native";

import { shapes, spacing } from "@/theme";

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minHeight: 48,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: shapes.menuItem,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  disabled: {
    opacity: 0.6,
  },
});
