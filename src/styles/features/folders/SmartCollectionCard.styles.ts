import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    alignItems: "flex-start",
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#1A1625",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
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
