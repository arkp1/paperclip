import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  sheetScroll: {
    maxHeight: 470,
  },
  content: {
    gap: spacing[4],
  },
  section: {
    gap: spacing[2],
  },
  optionRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  optionChip: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderRadius: 14,
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing[1],
  },
  sizeValue: {
    minWidth: 44,
    textAlign: "center",
  },
  colourSwatch: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    minHeight: 48,
    paddingVertical: spacing[2],
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 4,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
