import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    elevation: 50,
  },
  menu: {
    position: "absolute",
    padding: spacing[1],
    borderWidth: StyleSheet.hairlineWidth,
    transformOrigin: "top right",
    overflow: "hidden",
  },
  content: {
    gap: spacing[1],
  },
});
