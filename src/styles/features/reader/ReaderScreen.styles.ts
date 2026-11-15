import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  floatingTop: {
    position: "absolute",
    zIndex: 30,
  },
  progressTrack: {
    height: 2,
    width: "100%",
    opacity: 0.25,
  },
  progressFill: {
    height: 2,
  },
  annotateBanner: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  annotateBannerText: {
    fontSize: 12,
    lineHeight: 17,
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
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  searchHit: {
    backgroundColor: "#FFE082",
    color: "#241B00",
  },
  link: {
    textDecorationLine: "underline",
  },
  annotationNote: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    borderLeftWidth: 2,
    paddingLeft: spacing[3],
    marginTop: spacing[2],
    marginBottom: spacing[2],
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
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
    marginTop: spacing[3],
  },
  paragraph: {
    fontSize: 18,
    lineHeight: 30,
  },
  quote: {
    fontSize: 18,
    lineHeight: 30,
    fontStyle: "italic",
    paddingLeft: spacing[4],
    borderLeftWidth: 2,
    borderLeftColor: "#A49DA7",
  },
});
