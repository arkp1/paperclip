import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[6],
  },
  header: {
    gap: spacing[6],
  },
  wordmark: {
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  hero: {
    gap: spacing[2],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[2],
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  gridItem: {
    width: "48%",
  },
});
