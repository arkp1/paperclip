import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

export const styles = StyleSheet.create({
  mini: {
    position: "absolute",
    left: spacing[4],
    right: spacing[4],
    minHeight: 64,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    overflow: "hidden",
    elevation: 30,
    shadowColor: "#1A1625",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    zIndex: 30,
  },
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(120, 112, 130, 0.16)",
  },
  progressFill: {
    height: 2,
  },
  miniInfo: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing[2],
  },
  miniCopy: {
    gap: 1,
  },
  miniTitle: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  miniMeta: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 11,
    lineHeight: 15,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    elevation: 40,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    gap: spacing[5],
    elevation: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  sheetCopy: {
    flex: 1,
    gap: spacing[2],
  },
  eyebrow: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  sheetTitle: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  bigProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(120, 112, 130, 0.18)",
    overflow: "hidden",
  },
  bigProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  seekArea: {
    height: 36,
    justifyContent: "center",
  },
  seekTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "visible",
  },
  seekFill: {
    height: 6,
    borderRadius: 3,
  },
  seekThumb: {
    position: "absolute",
    top: -5,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    borderWidth: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  speeds: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[2],
  },
  speedChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
  },
  speedText: {
    fontFamily: "GoogleSansFlex-Regular",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
});



