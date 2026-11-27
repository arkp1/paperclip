import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[6],
  },
  header: {
    gap: spacing[6],
  },
  wordmark: {
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  hero: {
    gap: spacing[2],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[2],
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  gridItem: {
    width: "48%",
  },
  horizontalContent: {
    gap: spacing[3],
    paddingRight: spacing[6],
    paddingVertical: spacing[3],
  },
  folderSlide: {
    width: 220,
  },
  bookmarkSlide: {
    width: 250,
  },
  searchField: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 16,
    borderWidth: 1,
  },
  overviewSection: {
    gap: spacing[3],
  },
  overviewCard: {
    width: "100%",
    height: 240,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#1A1625",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  overviewImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 168,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  overviewShadeBand: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000000",
  },
  overviewTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  overviewTitleText: {
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  overviewDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 2,
  },
  overviewDot: {
    height: 6,
    borderRadius: 3,
  },
  overviewDotHit: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
});
