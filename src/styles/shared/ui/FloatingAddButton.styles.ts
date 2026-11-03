import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    zIndex: 10,
    height: 56,
    paddingHorizontal: 15,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#241B3A",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  label: {
    height: 24,
    justifyContent: "center",
    overflow: "hidden",
  },
});
