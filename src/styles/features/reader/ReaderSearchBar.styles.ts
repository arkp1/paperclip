import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  bar: {
    minHeight: 48,
    marginHorizontal: spacing[3],
    marginVertical: spacing[2],
    paddingLeft: spacing[4],
    paddingRight: spacing[1],
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  input: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: spacing[2],
  },
});
