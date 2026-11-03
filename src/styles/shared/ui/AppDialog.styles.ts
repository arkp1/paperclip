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
    padding: spacing[6],
    gap: spacing[5],
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
