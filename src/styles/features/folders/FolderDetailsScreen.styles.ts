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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    paddingVertical: spacing[4],
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  folderMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
