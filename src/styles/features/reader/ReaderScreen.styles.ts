import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  page: {
    height: "100%",
    overflow: "hidden",
  },
  pageList: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: 148,
    gap: spacing[4],
  },
  imageBlock: {
    gap: spacing[2],
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "rgba(120, 112, 130, 0.12)",
  },
  pageImage: {
    height: 150,
  },
  caption: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  pageFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 104,
    alignItems: "center",
  },
  pageIndicator: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  fixedPageFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  pageNumberPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  meta: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing[2],
  },
  heading: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
    marginTop: spacing[3],
  },
  paragraph: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 18,
    lineHeight: 30,
  },
  quote: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 18,
    lineHeight: 30,
    fontStyle: "italic",
    paddingLeft: spacing[4],
    borderLeftWidth: 2,
    borderLeftColor: "#A49DA7",
  },
});


