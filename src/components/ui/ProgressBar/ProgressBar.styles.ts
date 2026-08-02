import { StyleSheet } from "react-native";
import { colors, radii, sizes } from "@/theme";

export const styles = StyleSheet.create({
  track: {
    height: sizes.progressBarHeight,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
});
