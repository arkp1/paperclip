import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  gridCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#1A1625",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardsCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#1A1625",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#1A1625",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
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
    minHeight: 40,
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
