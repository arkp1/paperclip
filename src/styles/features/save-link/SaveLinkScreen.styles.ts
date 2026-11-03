import { StyleSheet, type ImageStyle } from "react-native";

import { spacing } from "@/theme";

export const previewImageStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} satisfies ImageStyle;

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    gap: spacing[4],
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  previewCover: {
    height: 132,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCopy: {
    padding: spacing[4],
    gap: spacing[1],
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.85,
  },
  folderTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  folderName: {
    flex: 1,
  },
  saveAction: {
    marginTop: spacing[2],
  },
});
