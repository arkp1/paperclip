import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
    alignItems: "flex-end",
  },
  group: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  option: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
