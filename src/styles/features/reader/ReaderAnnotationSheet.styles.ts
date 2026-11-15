import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  content: {
    gap: spacing[3],
  },
  colourRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
