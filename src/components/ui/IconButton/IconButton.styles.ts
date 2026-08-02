import { StyleSheet } from "react-native";
import { colors, radii, sizes } from "@/theme";

export const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
});
