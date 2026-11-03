import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  column: {
    gap: spacing[3],
  },
  gridItem: {
    flex: 1,
    maxWidth: "48.5%",
  },
});
