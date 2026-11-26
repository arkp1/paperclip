import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const CAPSULE_HEIGHT = 56;

export const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "flex-end",
    paddingLeft: spacing[6],
    paddingRight: 76,
  },
  capsule: {
    flexDirection: "row",
    alignItems: "center",
    height: CAPSULE_HEIGHT,
    paddingHorizontal: spacing[1],
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
    shadowColor: "#1A1625",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  item: {
    width: "100%",
    height: 52,
    paddingHorizontal: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 1,
  },
  itemLabelText: {
    flexShrink: 1,
  },
  selectionPill: {
    position: "absolute",
    top: 2,
    height: 52,
    borderRadius: 26,
  },
});
