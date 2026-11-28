import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  card: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: spacing[6],
    gap: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    gap: spacing[2],
  },
  body: {
    gap: spacing[3],
  },
  actions: {
    gap: spacing[2],
  },
});
