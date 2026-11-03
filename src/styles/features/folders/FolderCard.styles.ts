import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 78,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
});
