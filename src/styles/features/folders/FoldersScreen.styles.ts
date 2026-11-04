import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  header: {
    gap: spacing[6],
    marginBottom: spacing[2],
  },
  smartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  smartGridItem: {
    width: "48%",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
});
