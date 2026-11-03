import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[4],
  },
  full: {
    flex: 1,
  },
  compact: {
    minHeight: 160,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: spacing[2],
  },
  centered: {
    textAlign: "center",
  },
});
