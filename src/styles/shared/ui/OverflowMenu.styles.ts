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
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(24, 18, 35, 0.18)",
  },
  menu: {
    position: "absolute",
    padding: spacing[1],
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    transformOrigin: "top right",
    overflow: "hidden",
  },
  content: {
    gap: spacing[1],
  },
});
