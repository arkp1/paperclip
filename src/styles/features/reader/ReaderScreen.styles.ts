import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: 148,
    gap: spacing[4],
  },
  title: {
    fontFamily: "serif",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing[2],
  },
  heading: {
    fontFamily: "serif",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
    marginTop: spacing[3],
  },
  paragraph: {
    fontFamily: "serif",
    fontSize: 18,
    lineHeight: 30,
  },
  quote: {
    fontFamily: "serif",
    fontSize: 18,
    lineHeight: 30,
    fontStyle: "italic",
    paddingLeft: spacing[4],
    borderLeftWidth: 2,
    borderLeftColor: "#A49DA7",
  },
});
