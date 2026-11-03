import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    gap: spacing[1],
  },
  title: {
    flex: 1,
    paddingRight: spacing[4],
  },
  searchArea: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  listContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    gap: spacing[2],
  },
});
