import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    alignItems: "flex-start",
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: 1,
  },
});
