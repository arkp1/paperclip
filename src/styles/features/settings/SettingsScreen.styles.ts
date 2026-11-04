import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    gap: spacing[8],
  },
  subtitle: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[2],
  },
  section: {
    gap: spacing[3],
  },
  group: {
    backgroundColor: "transparent",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  themeGroup: {
    padding: spacing[4],
    gap: spacing[4],
  },
  themeCopy: {
    gap: 2,
  },
  segmented: {
    width: "100%",
  },
  accentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
});
