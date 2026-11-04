import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[5],
  },
  hero: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[5],
    gap: spacing[2],
  },
  actions: {
    gap: spacing[3],
  },
});
