import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    gap: spacing[1],
  },
  title: {
    flex: 1,
    paddingHorizontal: spacing[2],
  },
  titleIcon: {
    marginLeft: spacing[4],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
});
