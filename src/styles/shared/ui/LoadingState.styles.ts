import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[6],
  },
  full: {
    flex: 1,
  },
  compact: {
    minHeight: 160,
  },
});
