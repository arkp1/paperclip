import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  preview: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 24,
    overflow: "hidden",
  },
  previewFallback: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  title: {
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  section: {
    gap: spacing[2],
  },
  noteCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  metaGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  metaValue: {
    flexShrink: 1,
    textAlign: "right",
  },
});
