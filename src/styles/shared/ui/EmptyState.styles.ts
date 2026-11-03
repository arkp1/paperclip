import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[10],
    gap: spacing[5],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
