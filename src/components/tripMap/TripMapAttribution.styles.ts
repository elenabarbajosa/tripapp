import { StyleSheet } from "react-native";

import { colors, mapColors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: mapColors.attributionBg,
    maxWidth: "92%",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
