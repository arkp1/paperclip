import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  gridCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardsCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.86,
  },
  gridContent: {
    padding: spacing[3],
    gap: spacing[1],
  },
  cardsContent: {
    padding: spacing[4],
    gap: spacing[1],
  },
  listContent: {
    flex: 1,
    gap: spacing[1],
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 32,
  },
  titleBlock: {
    minHeight: 36,
  },
  favoriteBadge: {
    position: "absolute",
    right: spacing[2],
    bottom: spacing[2],
    zIndex: 2,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
