import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  colorSection: {
    gap: spacing[2],
    paddingTop: spacing[2],
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
