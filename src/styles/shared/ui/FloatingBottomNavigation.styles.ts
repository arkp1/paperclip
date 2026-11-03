import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const CAPSULE_HEIGHT = 56;

export const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  capsule: {
    flexDirection: "row",
    alignItems: "center",
    height: CAPSULE_HEIGHT,
    paddingHorizontal: 0,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
    shadowColor: "#1A1625",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    height: 44,
    paddingHorizontal: spacing[3],
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    zIndex: 1,
  },
  selectionPill: {
    position: "absolute",
    top: 6,
    height: 44,
    borderRadius: 999,
  },
});
