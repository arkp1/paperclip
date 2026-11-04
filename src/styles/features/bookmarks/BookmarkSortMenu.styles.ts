import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 30,
    elevation: 30,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  menu: {
    position: "absolute",
    top: 68,
    right: spacing[6],
    width: 232,
    padding: spacing[1],
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 12,
    shadowColor: "#241B3A",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
